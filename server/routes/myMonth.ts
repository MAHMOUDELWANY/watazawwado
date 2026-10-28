import express from 'express';
import { monthRange, currentMonth } from '../payroll/payroll.js';

/**
 * Teacher "My month" (launch plan E): their own teaching month, no student money.
 * Lessons held and hours, free trials, student no-shows, active students, family summaries written (and within
 * 24 hours of the lesson end), and the families' average rating. The same month a year back is not compared.
 */

type Middleware = (req: any, res: any, next: any) => any;

export interface MonthLesson { id: string; studentId: string | null; status: string; bookingType: string | null; durationMinutes: number; scheduledEnd: string }
export interface MonthSummary { bookingId: string; createdAt: string }

export const SUMMARY_ON_TIME_HOURS = 24;

export function buildMyMonth(lessons: MonthLesson[], summaries: MonthSummary[], ratings: number[]) {
  const held = lessons.filter((l) => l.status === 'completed');
  const regular = held.filter((l) => l.bookingType !== 'trial');
  const summaryByBooking = new Map(summaries.map((s) => [s.bookingId, s.createdAt]));
  const withSummary = held.filter((l) => summaryByBooking.has(l.id));
  const onTime = withSummary.filter((l) =>
    new Date(summaryByBooking.get(l.id)!).getTime() - new Date(l.scheduledEnd).getTime() <= SUMMARY_ON_TIME_HOURS * 3_600_000);
  const valid = ratings.filter((r) => Number.isFinite(r) && r >= 1 && r <= 5);
  return {
    lessonsHeld: regular.length,
    hours: Math.round((regular.reduce((s, l) => s + (Number(l.durationMinutes) || 0), 0) / 60) * 10) / 10,
    trialsHeld: held.length - regular.length,
    studentNoShows: lessons.filter((l) => l.status === 'no_show').length,
    activeStudents: new Set(held.map((l) => l.studentId).filter(Boolean)).size,
    summariesWritten: withSummary.length,
    summariesOnTime: onTime.length,
    summariesMissing: held.length - withSummary.length,
    rating: valid.length ? Math.round((valid.reduce((s, r) => s + r, 0) / valid.length) * 10) / 10 : null,
    ratingCount: valid.length
  };
}

export function registerMyMonthRoute(app: express.Express, deps: { getClient: () => any; verifyTeacherAuth: Middleware }) {
  app.get('/api/dashboard/my-month', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const month = typeof req.query.month === 'string' && monthRange(req.query.month) ? req.query.month : currentMonth();
    const range = monthRange(month)!;
    const teacherId = req.teacherUser.id;
    try {
      const { data: rows } = await client.from('bookings')
        .select('id, student_id, status, booking_type, duration_minutes, scheduled_end')
        .eq('teacher_id', teacherId).gte('scheduled_start', range.start).lt('scheduled_start', range.end);
      const lessons: MonthLesson[] = (rows || []).map((b: any) => ({
        id: b.id, studentId: b.student_id, status: b.status, bookingType: b.booking_type, durationMinutes: b.duration_minutes, scheduledEnd: b.scheduled_end
      }));
      const heldIds = lessons.filter((l) => l.status === 'completed').map((l) => l.id);
      let summaries: MonthSummary[] = [];
      if (heldIds.length) {
        const { data: sessions } = await client.from('lesson_sessions').select('id, booking_id').in('booking_id', heldIds);
        const bookingBySession = new Map((sessions || []).map((s: any) => [s.id, s.booking_id]));
        if (bookingBySession.size) {
          const { data: notes } = await client.from('lesson_notes').select('session_id, created_at, family_summary')
            .in('session_id', [...bookingBySession.keys()]).not('family_summary', 'is', null);
          summaries = (notes || [])
            .filter((n: any) => String(n.family_summary || '').trim())
            .map((n: any) => ({ bookingId: bookingBySession.get(n.session_id) as string, createdAt: n.created_at }));
        }
      }
      const { data: feedback } = await client.from('lesson_feedback').select('rating')
        .eq('teacher_id', teacherId).gte('created_at', range.start).lt('created_at', range.end);
      res.json({ month, ...buildMyMonth(lessons, summaries, (feedback || []).map((f: any) => Number(f.rating))) });
    } catch (err) {
      console.error('[GET /api/dashboard/my-month]', err);
      res.status(500).json({ error: 'Could not load your month.' });
    }
  });
}
