import { teacherLateMinutes, type LessonTimes } from '../../src/lib/roomWindow.js';

/**
 * Classroom Task 10: teacher punctuality. More than TEACHER_LATE_GRACE_MIN late to the room needs a written reason,
 * unless an incident on our side was recorded for that lesson before the teacher got in.
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
  const { data: first, error } = await client.from('lesson_attendance_events').select('occurred_at')
    .eq('dedupe_key', `room:${booking.id}:teacher:joined`).maybeSingle();
  if (error) throw new Error(`first join: ${error.message}`);
  const joinedAt: string | null = first?.occurred_at ?? null;
  if (!joinedAt || teacherLateMinutes(booking, joinedAt) === 0) return;

  const { data: incidents, error: incErr } = await client.from('classroom_incidents').select('id')
    .eq('booking_id', booking.id).lt('created_at', joinedAt).limit(1);
  if (incErr) throw new Error(`incidents: ${incErr.message}`);

  const verdict = evaluateLateness({ booking, firstTeacherRoomJoin: joinedAt, incidentBeforeJoin: (incidents || []).length > 0 });
  if (!verdict.late) return;
  const { error: insErr } = await client.from('teacher_late_reasons').upsert(
    { booking_id: booking.id, teacher_user_id: booking.teacher_id, late_minutes: verdict.minutes, status: 'pending' },
    { onConflict: 'booking_id', ignoreDuplicates: true },
  );
  if (insErr) throw new Error(`teacher_late_reasons: ${insErr.message}`);
}
