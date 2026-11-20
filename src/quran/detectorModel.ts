/**
 * Classroom 4.4: the word-mistake detector, run in the learner's browser (no server, no cost, the audio stays on the
 * device). Model and licence: docs/classroom/QURAN-DETECTOR.md. Both the runtime (transformers.js) and the model are
 * loaded only when a learner asks for a check, and the browser caches them for next time.
 */
export const DETECTOR_MODEL: string = (import.meta as any).env?.VITE_QURAN_DETECTOR_MODEL || 'eventhorizon0/tarteel-ai-onnx-whisper-base-ar-quran';
/**
 * Our own copy of the same files (public bucket quran-models, scripts/quran/upload-model.ts). Used when its
 * manifest.json loads; until the copy exists the browser falls back to DETECTOR_MODEL on Hugging Face.
 */
const SUPABASE_URL: string = (import.meta as any).env?.VITE_SUPABASE_URL || '';
export const OWN_MODEL_BASE: string = (import.meta as any).env?.VITE_QURAN_MODEL_BASE_URL
  || (SUPABASE_URL ? `${SUPABASE_URL.replace(/\/$/, '')}/storage/v1/object/public/quran-models/whisper-base-ar-quran` : '');
/** manifest.json of our copy: every file with its size, and how many parts a file over the upload limit was cut into. */
export type ModelManifest = { files: Record<string, { size: number; parts?: number }> };
const RUNTIME = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
/** Below this much device memory (GB, where the browser says) the model is not tried. */
export const MIN_MEMORY_GB = 4;

export type Support = { ok: true; device: 'webgpu' | 'wasm' } | { ok: false; reason: 'no-wasm' | 'memory' | 'no-audio' };

/** Pure part of the device check, so it can be tested: what the browser reports in, what we decide out. */
export function decideSupport(env: { wasm: boolean; audio: boolean; memoryGb?: number; webgpu: boolean }): Support {
  if (!env.wasm) return { ok: false, reason: 'no-wasm' };
  if (!env.audio) return { ok: false, reason: 'no-audio' };
  if (typeof env.memoryGb === 'number' && env.memoryGb < MIN_MEMORY_GB) return { ok: false, reason: 'memory' };
  return { ok: true, device: env.webgpu ? 'webgpu' : 'wasm' };
}

export async function detectorSupport(): Promise<Support> {
  const nav: any = typeof navigator !== 'undefined' ? navigator : {};
  let webgpu = false;
  try { webgpu = Boolean(nav.gpu && await nav.gpu.requestAdapter()); } catch { webgpu = false; }
  return decideSupport({
    wasm: typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function',
    audio: typeof window !== 'undefined' && Boolean((window as any).AudioContext || (window as any).webkitAudioContext),
    memoryGb: typeof nav.deviceMemory === 'number' ? nav.deviceMemory : undefined,
    webgpu,
  });
}

/** 16 kHz mono samples, what Whisper models expect. */
async function toSamples(blob: Blob): Promise<Float32Array> {
  const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
  const ctx = new Ctx({ sampleRate: 16000 });
  try {
    const buf: AudioBuffer = await ctx.decodeAudioData(await blob.arrayBuffer());
    if (buf.sampleRate === 16000 && buf.numberOfChannels === 1) return buf.getChannelData(0);
    const off = new OfflineAudioContext(1, Math.ceil(buf.duration * 16000), 16000);
    const src = off.createBufferSource();
    src.buffer = buf; src.connect(off.destination); src.start();
    return (await off.startRendering()).getChannelData(0);
  } finally { void ctx.close?.(); }
}

/** The file path inside our copy for a URL transformers.js asks for, or null for any other URL. */
export function ownPath(url: string, base: string): string | null {
  return base && url.startsWith(`${base}/`) ? decodeURIComponent(url.slice(base.length + 1).split('?')[0]) : null;
}

/** A fetch that joins a file stored in parts (`<file>.part0`, `.part1`, ...) back into one response. */
export function partsFetch(base: string, manifest: ModelManifest, inner: typeof fetch): typeof fetch {
  return (async (input: any, init?: any) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    const path = ownPath(url, base);
    const entry = path ? manifest.files[path] : undefined;
    if (!entry?.parts || entry.parts < 2) return inner(input, init);
    const parts = await Promise.all(Array.from({ length: entry.parts }, (_, i) => inner(`${base}/${path}.part${i}`, init).then((r) => {
      if (!r.ok) throw new Error(`model part ${i}: ${r.status}`);
      return r.blob();
    })));
    return new Response(new Blob(parts), { status: 200, headers: { 'content-type': 'application/octet-stream', 'content-length': String(entry.size) } });
  }) as typeof fetch;
}

/** Points transformers.js at our copy when its manifest loads; returns the model id to ask for. */
async function useOwnCopy(mod: any): Promise<string> {
  if (!OWN_MODEL_BASE) return DETECTOR_MODEL;
  try {
    const res = await fetch(`${OWN_MODEL_BASE}/manifest.json`, { cache: 'no-cache' });
    if (!res.ok) return DETECTOR_MODEL;
    const manifest = await res.json() as ModelManifest;
    const cut = OWN_MODEL_BASE.lastIndexOf('/');
    mod.env.remoteHost = OWN_MODEL_BASE.slice(0, cut + 1);
    mod.env.remotePathTemplate = '{model}/';
    mod.env.fetch = partsFetch(OWN_MODEL_BASE, manifest, (mod.env.fetch ?? fetch).bind(globalThis));
    return OWN_MODEL_BASE.slice(cut + 1);
  } catch {
    return DETECTOR_MODEL;
  }
}

let asr: Promise<any> | null = null;

/** Transcribes a recording. `onProgress` gets 0-1 while the model downloads the first time. */
export async function transcribe(blob: Blob, device: 'webgpu' | 'wasm', onProgress?: (p: number) => void): Promise<string> {
  asr ??= (async () => {
    const mod = await import(/* @vite-ignore */ RUNTIME);
    const model = await useOwnCopy(mod);
    const files = new Map<string, number>();
    return mod.pipeline('automatic-speech-recognition', model, {
      device,
      dtype: device === 'webgpu' ? 'fp32' : 'q8',
      progress_callback: (e: any) => {
        if (e?.status !== 'progress' || !e.file) return;
        files.set(e.file, Number(e.progress) || 0);
        onProgress?.([...files.values()].reduce((a, b) => a + b, 0) / (files.size * 100));
      },
    });
  })().catch((e) => { asr = null; throw e; });
  const run = await asr;
  const out = await run(await toSamples(blob), { chunk_length_s: 30, stride_length_s: 5 });
  return String(Array.isArray(out) ? out.map((o: any) => o.text).join(' ') : out?.text || '');
}
