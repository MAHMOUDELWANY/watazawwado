/**
 * NX-13: a teacher who has not written the family summary 3 hours after a lesson ended gets one on-site reminder
 * (the dashboard bell), so the family's progress pages never stay empty. One reminder per lesson
 * (notification_events key `summary_reminder:<bookingId>`); lessons older than 48 hours are left alone.
 */
import { DateTime } from 'luxon';
import { notifyUser } from './inbox.js';

export const REMIND_AFTER_HOURS = 3;
export const REMIND_WINDOW_HOURS = 48;
const HELD = ['completed', 'confirmed', 'rescheduled'];

export function lessonEndOf(b: { scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }): DateTime {
  if (b.scheduled_end) return DateTime.fromISO(b.scheduled_end, { zone: 'utc' });
  return DateTime.fromISO(b.scheduled_start, { zone: 'utc' }).plus({ minutes: Number(b.duration_minutes) || 30 });
}

/** Ended between 3 and 48 hours ago. */
export function dueForReminder(b: { status: string; scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }, now: DateTime): boolean {
  if (!HELD.includes(b.status)) return false;
  const end = lessonEndOf(b);
  return end.isValid && end <= now.minus({ hours: REMIND_AFTER_HOURS }) && end >= now.minus({ hours: REMIND_WINDOW_HOURS });
}

export const summaryReminderNotice = (learner: string | null) => ({
  kind: 'summary_due',
  title: { en: 'A family is waiting for your summary', ar: 'أسرة مستنية ملخص الحصة' },
  body: {
    en: `Write two lines about ${learner || 'the lesson'} and the homework for next time. The family reads it on their progress page.`,
    ar: `اكتب سطرين عن حصة ${learner || 'الطالب'} وواجب الحصة الجاية. الأسرة بتقراه في صفحة التقدّم.`,
  },
  link: '/dashboard/today',
});

export async function processSummaryReminders(client: any, now: DateTime = DateTime.utc(), notify = notifyUser): Promise<{ sent: number; skipped: number }> {
  const out = { sent: 0, skipped: 0 };
  if (!client) return out;
  const { data: rows } = await client.from('bookings')
    .select('id, student_id, teacher_id, status, scheduled_start, scheduled_end, duration_minutes, contact_name')
    .in('status', HELD).not('teacher_id', 'is', null)
    .gte('scheduled_start', now.minus({ hours: REMIND_WINDOW_HOURS + 6 }).toISO())
    .lte('scheduled_start', now.toISO()).limit(500);
  const due = (rows || []).filter((b: any) => dueForReminder(b, now));
  if (!due.length) return out;

  const { data: sessions } = await client.from('lesson_sessions').select('id, booking_id').in('booking_id', due.map((b: any) => b.id));
  const bookingOfSession = new Map((sessions || []).map((s: any) => [s.id, s.booking_id]));
  const { data: notes } = bookingOfSession.size
    ? await client.from('lesson_notes').select('session_id').in('session_id', [...bookingOfSession.keys()]).not('family_summary', 'is', null)
    : { data: [] as any[] };
  const written = new Set((notes || []).map((n: any) => bookingOfSession.get(n.session_id)));

  for (const b of due) {
    if (written.has(b.id)) { out.skipped++; continue; }
    const key = `summary_reminder:${b.id}`;
    const { data: claim } = await client.rpc('claim_notification_event', { p_key: key, p_type: 'summary_reminder' });
    if (!claim?.claimed || !claim.claim_token) { out.skipped++; continue; }
    let ok = true;
    try {
      await notify(client, { userId: b.teacher_id, staff: true }, summaryReminderNotice(b.contact_name || null));
    } catch {
      ok = false;
    }
    await client.rpc('finalize_notification_event', { p_key: key, p_token: claim.claim_token, p_status: ok ? 'sent' : 'failed', p_message_id: null, p_error: null });
    if (ok) out.sent++;
  }
  return out;
}
