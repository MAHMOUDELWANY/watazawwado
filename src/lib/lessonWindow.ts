/**
 * When a lesson's Zoom link works (owner review 2026-11-09): only during the lesson. The teacher can open it
 * 10 minutes early to get ready, the student 5 minutes early, and for both it closes at the lesson's end.
 * Shared by the server (which refuses the link outside the window) and every Start / Join button.
 */
export const JOIN_OPENS_MIN = { teacher: 10, student: 5 } as const;

export type JoinState = 'early' | 'open' | 'ended';

const ms = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : NaN);

export function lessonEndMs(startIso: string, endIso?: string | null, durationMin?: number | null): number {
  const end = ms(endIso);
  if (Number.isFinite(end)) return end;
  return ms(startIso) + (Number(durationMin) > 0 ? Number(durationMin) : 60) * 60_000;
}

export function lessonJoinState(
  lesson: { scheduled_start?: string | null; scheduledStart?: string | null; scheduled_end?: string | null; scheduledEnd?: string | null; duration_minutes?: number | null },
  role: 'teacher' | 'student' = 'student',
  now: number = Date.now(),
): JoinState {
  const startIso = lesson.scheduled_start || lesson.scheduledStart || '';
  const start = ms(startIso);
  if (!Number.isFinite(start)) return 'early';
  if (now >= lessonEndMs(startIso, lesson.scheduled_end || lesson.scheduledEnd, lesson.duration_minutes)) return 'ended';
  return now >= start - JOIN_OPENS_MIN[role] * 60_000 ? 'open' : 'early';
}
