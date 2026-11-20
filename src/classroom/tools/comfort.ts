/**
 * Learner comfort (BUILD-LIST 2.10): larger text and a warm or dark page, on the learner's own screen only. Kept in
 * this browser (a per-viewer convenience); the teacher never sees or sets it.
 */
export type Comfort = { size: 0 | 1 | 2; tone: 'default' | 'warm' | 'dark' };
export const DEFAULT_COMFORT: Comfort = { size: 0, tone: 'default' };
export const COMFORT_KEY = 'wtz-room-comfort';
const ZOOM = [1, 1.18, 1.36] as const;

export function readComfort(raw: string | null | undefined): Comfort {
  try {
    const v = raw ? JSON.parse(raw) : null;
    return {
      size: v?.size === 1 || v?.size === 2 ? v.size : 0,
      tone: v?.tone === 'warm' || v?.tone === 'dark' ? v.tone : 'default',
    };
  } catch {
    return DEFAULT_COMFORT;
  }
}

/** Styles for the lesson paper: zoom for size, a sepia wash for warm; dark switches the paper to the dark theme. */
export function comfortStyle(c: Comfort): { zoom?: number; filter?: string } {
  return {
    ...(c.size ? { zoom: ZOOM[c.size] } : {}),
    ...(c.tone === 'warm' ? { filter: 'sepia(0.28) saturate(1.05) brightness(0.98)' } : {}),
  };
}
