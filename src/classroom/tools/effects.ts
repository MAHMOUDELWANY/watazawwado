/**
 * Picture-in-picture and background blur (BUILD-LIST 2.12), the browser parts. Decisions are in effectsModel.ts.
 */
import { BLUR_SAMPLE, pickBlurMode, pickPipMode, tooSlow, type BlurMode, type PipMode } from './effectsModel';

// ---- picture-in-picture ---------------------------------------------------------------------------------------------
type DocPip = { requestWindow(o?: { width?: number; height?: number }): Promise<Window>; window: Window | null };
const docPip = () => (typeof window !== 'undefined' ? (window as unknown as { documentPictureInPicture?: DocPip }).documentPictureInPicture : undefined);

export function pipMode(): PipMode {
  return pickPipMode({ documentPip: !!docPip(), videoPip: typeof document !== 'undefined' && !!document.pictureInPictureEnabled });
}

/**
 * Floats one video (the learner, for the teacher). Document PiP opens a small always-on-top page with the video and
 * the name; the fallback floats a plain video. Must run from a click, or from the browser's automatic
 * "enterpictureinpicture" moment (switching tab during a call, Chrome and Edge). Returns a close function, or null.
 */
export async function openPip(stream: MediaStream, name: string): Promise<(() => void) | null> {
  const mode = pipMode();
  if (mode === 'none') return null;
  if (mode === 'document') {
    const win = await docPip()!.requestWindow({ width: 320, height: 240 });
    const doc = win.document;
    doc.title = name;
    doc.body.style.cssText = 'margin:0;background:#1C1714;color:#F5EDE3;font:600 13px system-ui,sans-serif;overflow:hidden';
    const video = doc.createElement('video');
    video.autoplay = true;
    video.muted = true; // the room plays the sound; this is the picture only
    video.playsInline = true;
    video.srcObject = stream;
    video.style.cssText = 'width:100vw;height:100vh;object-fit:cover;display:block';
    const label = doc.createElement('div');
    label.textContent = name;
    label.style.cssText = 'position:fixed;inset-inline-start:8px;bottom:8px;padding:4px 10px;border-radius:999px;background:rgba(0,0,0,.55)';
    doc.body.append(video, label);
    void video.play().catch(() => {});
    return () => win.close();
  }
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = stream;
  await video.play().catch(() => {});
  await video.requestPictureInPicture();
  return () => { if (document.pictureInPictureElement === video) void document.exitPictureInPicture().catch(() => {}); video.srcObject = null; };
}

/**
 * Chrome and Edge fire "enterpictureinpicture" when the user leaves a tab that uses the camera: the learner's video
 * then floats without a click. Returns the cleanup.
 */
export function autoPip(get: () => { stream: MediaStream | null; name: string }, onOpen: (close: () => void) => void): () => void {
  const session = typeof navigator !== 'undefined' ? navigator.mediaSession : undefined;
  if (!session?.setActionHandler || pipMode() === 'none') return () => {};
  try {
    session.setActionHandler('enterpictureinpicture' as MediaSessionAction, () => {
      const { stream, name } = get();
      if (stream) void openPip(stream, name).then((close) => { if (close) onOpen(close); }, () => {});
    });
  } catch {
    return () => {}; // this browser does not know the action
  }
  return () => { try { session.setActionHandler('enterpictureinpicture' as MediaSessionAction, null); } catch { /* ignore */ } };
}

// ---- background blur --------------------------------------------------------------------------------------------------
const MEDIAPIPE_VERSION = '0.10.17';
const WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite';
/** The segmenter reads a small copy of the frame: fast, and the mask is smoothed when scaled up. */
const SEG_WIDTH = 256;
const OUT_FPS = 24;

const nativeBlur = (track: MediaStreamTrack) => {
  const caps = (track.getCapabilities?.() ?? {}) as { backgroundBlur?: boolean[] };
  return Array.isArray(caps.backgroundBlur) && caps.backgroundBlur.includes(true);
};
const hasWebgl = () => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } };

export function blurModeFor(track: MediaStreamTrack | undefined): BlurMode {
  if (!track) return 'none';
  const nav = navigator as Navigator & { deviceMemory?: number };
  return pickBlurMode({ nativeBlur: nativeBlur(track), cores: nav.hardwareConcurrency || 2, webgl: hasWebgl(), memoryGb: nav.deviceMemory });
}

/** Turns the camera's own blur on or off in place (no new track). */
export async function setNativeBlur(track: MediaStreamTrack, on: boolean): Promise<boolean> {
  try {
    await track.applyConstraints({ advanced: [{ backgroundBlur: on } as MediaTrackConstraintSet] });
    return true;
  } catch {
    return false;
  }
}

export type BlurPipeline = { track: MediaStreamTrack; source: MediaStreamTrack; stop: () => void };

/**
 * In-browser blur: MediaPipe's selfie segmenter (loaded only now) finds the person, the rest of the frame is blurred
 * on a canvas, and the canvas becomes the new camera track. `source` is a copy of the camera the pipeline reads; the
 * caller gets the plain camera back from it when blur is turned off. Too slow on this device: `onSlow`, once.
 */
export async function startSegmentBlur(camera: MediaStreamTrack, onSlow: () => void): Promise<BlurPipeline> {
  const { FilesetResolver, ImageSegmenter } = await import('@mediapipe/tasks-vision');
  const fileset = await FilesetResolver.forVisionTasks(WASM_URL);
  const segmenter = await ImageSegmenter.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
    runningMode: 'VIDEO',
    outputCategoryMask: false,
    outputConfidenceMasks: true,
  });

  const source = camera.clone();
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.srcObject = new MediaStream([source]);
  await video.play();
  const w = video.videoWidth || 640;
  const h = video.videoHeight || 360;
  const sw = SEG_WIDTH;
  const sh = Math.max(1, Math.round((h / w) * SEG_WIDTH));

  const out = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const small = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
  const maskCanvas = Object.assign(document.createElement('canvas'), { width: sw, height: sh });
  const person = Object.assign(document.createElement('canvas'), { width: w, height: h });
  const ctx = out.getContext('2d')!;
  const sctx = small.getContext('2d', { willReadFrequently: true })!;
  const mctx = maskCanvas.getContext('2d')!;
  const pctx = person.getContext('2d')!;
  const mask = mctx.createImageData(sw, sh);

  let running = true;
  let slowTold = false;
  // A worker's timer drives the frames: requestAnimationFrame stops when the tab is hidden, and a teacher who switches
  // tab must not freeze their own picture for the learner.
  const ticker = new Worker(URL.createObjectURL(new Blob([`setInterval(() => postMessage(0), ${Math.round(1000 / OUT_FPS)})`], { type: 'text/javascript' })));
  const samples: number[] = [];
  const frame = () => {
    if (!running) return;
    const t0 = performance.now();
    sctx.drawImage(video, 0, 0, sw, sh);
    const result = segmenter.segmentForVideo(small, t0);
    const conf = result.confidenceMasks?.[0]?.getAsFloat32Array();
    if (conf) {
      for (let i = 0; i < conf.length; i++) mask.data[i * 4 + 3] = Math.round(conf[i] * 255);
      mctx.putImageData(mask, 0, 0);
    }
    result.close();
    // The person, cut out with the (smoothly scaled) mask.
    pctx.globalCompositeOperation = 'copy';
    pctx.drawImage(maskCanvas, 0, 0, w, h);
    pctx.globalCompositeOperation = 'source-in';
    pctx.drawImage(video, 0, 0, w, h);
    // The blurred room behind, then the person on top.
    ctx.filter = 'blur(14px)';
    ctx.drawImage(video, 0, 0, w, h);
    ctx.filter = 'none';
    ctx.drawImage(person, 0, 0);
    samples.push(performance.now() - t0);
    if (samples.length > BLUR_SAMPLE) samples.shift();
    // Too slow: tell the caller once; it puts the plain camera back (from `source`) and then calls stop().
    if (!slowTold && tooSlow(samples)) { slowTold = true; onSlow(); }
  };
  const stream = out.captureStream(OUT_FPS);
  const track = stream.getVideoTracks()[0];
  ticker.onmessage = frame;

  function stop() {
    if (!running) return;
    running = false;
    ticker.terminate();
    track.stop();
    source.stop();
    video.srcObject = null;
    segmenter.close();
  }
  return { track, source, stop };
}
