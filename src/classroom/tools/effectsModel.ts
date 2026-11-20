/**
 * Picture-in-picture and background blur (BUILD-LIST 2.12), the pure decisions. The browser parts live in effects.ts.
 */

export type PipMode = 'document' | 'video' | 'none';
/** Document Picture-in-Picture (Chrome, Edge) floats a small page; the video fallback floats one video; else nothing. */
export function pickPipMode(env: { documentPip: boolean; videoPip: boolean }): PipMode {
  return env.documentPip ? 'document' : env.videoPip ? 'video' : 'none';
}

export type BlurMode = 'native' | 'segment' | 'none';
/**
 * The camera's own blur (a platform effect) costs nothing, so it comes first. In-browser segmentation needs a few
 * cores and WebGL; weaker devices get no blur rather than a stuttering picture.
 */
export function pickBlurMode(env: { nativeBlur: boolean; cores: number; webgl: boolean; memoryGb?: number }): BlurMode {
  if (env.nativeBlur) return 'native';
  if (env.cores >= 4 && env.webgl && (env.memoryGb == null || env.memoryGb >= 4)) return 'segment';
  return 'none';
}

/** Frames slower than this on average (ms, over the last BLUR_SAMPLE frames) turn the blur off. */
export const BLUR_SLOW_MS = 45;
export const BLUR_SAMPLE = 30;
export function tooSlow(samplesMs: readonly number[]): boolean {
  if (samplesMs.length < BLUR_SAMPLE) return false;
  const last = samplesMs.slice(-BLUR_SAMPLE);
  return last.reduce((a, b) => a + b, 0) / last.length > BLUR_SLOW_MS;
}
