/** Classroom 2.8: speaking time per side, from the mic levels. Pure, so node tests cover it. */

/** RMS level (0..1) above which a voice counts as speaking. */
export const VAD_THRESHOLD = 0.06;
/** Speaking holds this long after the level drops, so pauses between words still count. */
export const HANGOVER_MS = 400;
/** A gap longer than this (a frozen or hidden tab) is not counted as one long talk. */
const MAX_STEP_MS = 2000;

/** One step of the voice detector: loud now, or loud less than `hangMs` ago. */
export function vadStep(s: { on: boolean; quietSince: number }, rms: number, now: number, threshold = VAD_THRESHOLD, hangMs = HANGOVER_MS) {
  const loud = rms > threshold;
  const quietSince = loud ? 0 : s.quietSince || now;
  return { on: loud || (s.on && now - quietSince < hangMs), quietSince };
}

/** RMS of an analyser's byte time-domain samples (128 is silence). */
export function rmsOf(buf: ArrayLike<number>) {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += ((buf[i] - 128) / 128) ** 2;
  return buf.length ? Math.sqrt(sum / buf.length) : 0;
}

/** Adds the time since the last tick to whoever was speaking. Muted is not speaking (the caller passes false). */
export function createTalkClock() {
  let last: number | null = null;
  let teacherMs = 0;
  let learnerMs = 0;
  return {
    tick(now: number, teacher: boolean, learner: boolean) {
      if (last !== null) {
        const dt = Math.max(0, Math.min(now - last, MAX_STEP_MS));
        if (teacher) teacherMs += dt;
        if (learner) learnerMs += dt;
      }
      last = now;
    },
    /** Stop counting until the next tick (left the room, reconnecting). */
    pause() { last = null; },
    totals: () => ({ teacherMs: Math.round(teacherMs), learnerMs: Math.round(learnerMs) }),
  };
}

/** Teacher and learner shares of the talking, in whole percent; null before there is a second of talk. */
export function talkShare(teacherMs: number, learnerMs: number) {
  const total = teacherMs + learnerMs;
  if (total < 1000) return null;
  const teacher = Math.round((teacherMs / total) * 100);
  return { teacher, learner: 100 - teacher };
}
