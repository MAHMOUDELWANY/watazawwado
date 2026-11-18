/**
 * Classroom rollout switch (Task 13). CLASSROOM_MODE = off | pilot | on (anything else, or missing, is off);
 * pilot opens our room only for the teacher user ids in CLASSROOM_PILOT_TEACHERS (comma-separated).
 * When it is false for a lesson, everything stays on Zoom and the NX-12 slides page, as before.
 */
export function classroomEnabledFor(teacherId: string | null | undefined, env: Record<string, string | undefined> = process.env): boolean {
  const mode = String(env.CLASSROOM_MODE || '').trim().toLowerCase();
  if (mode === 'on') return true;
  if (mode !== 'pilot' || !teacherId) return false;
  return String(env.CLASSROOM_PILOT_TEACHERS || '').split(',').map((s) => s.trim()).includes(teacherId);
}
