import { teacherLateMinutes, type LessonTimes } from '../../src/lib/roomWindow.js';

/**
 * Classroom Task 10: teacher punctuality. More than TEACHER_LATE_GRACE_MIN late to the room needs a written reason,
 * unless an incident on our side was recorded for that lesson before the teacher got in. Ours for the teacher means
 * the teacher's own side failed, or the media service failed on either side; a learner's own network does not count.
 */
export function evaluateLateness(input: { booking: LessonTimes; firstTeacherRoomJoin: string | null; incidentBeforeJoin: boolean }): { late: false } | { late: true; minutes: number } {
  if (input.incidentBeforeJoin) return { late: false };
  const minutes = teacherLateMinutes(input.booking, input.firstTeacherRoomJoin);
  return minutes > 0 ? { late: true, minutes } : { late: false };
}

/**
 * Runs on every teacher enter, but always judges the stored first room_joined (one per side per lesson), so a rejoin
 * gives the same answer, and the row is insert-once: a rejoin never creates or reopens one.
 */
export async function recordTeacherLateness(client: any, booking: LessonTimes & { id: string; teacher_id: string }): Promise<void> {
  // The earliest teacher room_joined, whatever its dedupe key (a first join could carry a joinId suffix).
  const { data: first, error } = await client.from('lesson_attendance_events').select('occurred_at')
    .eq('booking_id', booking.id).eq('source', 'room').eq('event', 'room_joined').eq('role', 'teacher')
    .order('occurred_at', { ascending: true }).limit(1).maybeSingle();
  if (error) throw new Error(`first join: ${error.message}`);
  const joinedAt: string | null = first?.occurred_at ?? null;
  if (!joinedAt || teacherLateMinutes(booking, joinedAt) === 0) return;

  const { data: incidents, error: incErr } = await client.from('classroom_incidents').select('side, kind')
    .eq('booking_id', booking.id).lt('created_at', joinedAt);
  if (incErr) throw new Error(`incidents: ${incErr.message}`);
  const ours = (incidents || []).some((i: { side: string; kind: string }) => i.side === 'teacher' || i.kind === 'provider_error');

  const verdict = evaluateLateness({ booking, firstTeacherRoomJoin: joinedAt, incidentBeforeJoin: ours });
  if (!verdict.late) return;
  const { error: insErr } = await client.from('teacher_late_reasons').upsert(
    { booking_id: booking.id, teacher_user_id: booking.teacher_id, late_minutes: verdict.minutes, status: 'pending' },
    { onConflict: 'booking_id', ignoreDuplicates: true },
  );
  if (insErr) throw new Error(`teacher_late_reasons: ${insErr.message}`);
}
