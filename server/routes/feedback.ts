import express from 'express';
import { DateTime } from 'luxon';
import { normalizeSubjectSlug, resolveSubjectMeta } from './progress.js';

/**
 * ST-02: after a lesson ends, the family gives a one-tap rating (1-5) and an optional comment. Ratings are read by the
 * super admin; a teacher sees only their own average, and only once there are TEACHER_MIN_RATINGS of them, so a
 * single family's rating can never be singled out.
 */
export const TEACHER_MIN_RATINGS = 5;
export const FEEDBACK_WINDOW_DAYS = 7;
const RATEABLE_STATUSES = ['completed', 'confirmed', 'rescheduled'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function lessonEnd(b: { scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }): DateTime {
  if (b.scheduled_end) return DateTime.fromISO(b.scheduled_end, { zone: 'utc' });
  return DateTime.fromISO(b.scheduled_start, { zone: 'utc' }).plus({ minutes: Number(b.duration_minutes) || 30 });
}

/** A lesson can be rated once it has ended, for FEEDBACK_WINDOW_DAYS, unless it was cancelled or missed. */
export function canRate(b: { status: string; scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }, now: DateTime): boolean {
  if (!RATEABLE_STATUSES.includes(b.status)) return false;
  const end = lessonEnd(b);
  return end.isValid && end <= now && end >= now.minus({ days: FEEDBACK_WINDOW_DAYS });
}

export function parseFeedback(body: any): { rating: number; comment: string | null } | { error: string } {
  const rating = Number(body?.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { error: 'Choose a rating from 1 to 5.' };
  if (body?.comment != null && typeof body.comment !== 'string') return { error: 'The comment must be text.' };
  const comment = typeof body?.comment === 'string' ? body.comment.trim() : '';
  if (comment.length > 1000) return { error: 'Please keep the comment under 1000 characters.' };
  return { rating, comment: comment || null };
}

/** Average to one decimal, hidden below the minimum count. */
export function teacherAverage(ratings: number[]): { count: number; average: number | null; minimum: number } {
  const count = ratings.length;
  const average = count >= TEACHER_MIN_RATINGS ? Math.round((ratings.reduce((a, r) => a + r, 0) / count) * 10) / 10 : null;
  return { count, average, minimum: TEACHER_MIN_RATINGS };
}

/**
 * What a teacher may see: only finished calendar months (UTC) that each hold TEACHER_MIN_RATINGS or more ratings.
 * The figure then changes at most once a month and always by a batch of 5+, so comparing it before and after one
 * lesson can never reveal that family's rating (security review 2026-10-21).
 */
export function teacherVisibleRatings(rows: Array<{ rating: number; created_at: string }>, now: DateTime): number[] {
  const monthStart = now.toUTC().startOf('month');
  const byMonth = new Map<string, number[]>();
  for (const r of rows) {
    const at = DateTime.fromISO(r.created_at, { zone: 'utc' });
    if (!at.isValid || at >= monthStart) continue;
    const key = at.toFormat('yyyy-LL');
    byMonth.set(key, [...(byMonth.get(key) || []), Number(r.rating)]);
  }
  return [...byMonth.values()].filter((m) => m.length >= TEACHER_MIN_RATINGS).flat();
}

const subjectOf = (serviceId: string | null) => {
  const slug = normalizeSubjectSlug(serviceId);
  if (!slug) return { en: 'Lesson', ar: 'درس' };
  const meta = resolveSubjectMeta(slug);
  return { en: meta.en, ar: meta.ar };
};

async function familySummaryFor(client: any, bookingId: string): Promise<string | null> {
  const { data: sessions } = await client.from('lesson_sessions').select('id').eq('booking_id', bookingId);
  const ids = (sessions || []).map((s: any) => s.id);
  if (!ids.length) return null;
  const { data: notes } = await client.from('lesson_notes').select('family_summary, created_at').in('session_id', ids)
    .not('family_summary', 'is', null).order('created_at', { ascending: false }).limit(1);
  return notes?.[0]?.family_summary || null;
}

/** A rating is frozen once its month has ended, so a closed month the teacher sees can never change. */
export function ratingStillEditable(createdAt: string, now: DateTime): boolean {
  const at = DateTime.fromISO(createdAt, { zone: 'utc' });
  return at.isValid && at >= now.toUTC().startOf('month');
}

type Middleware = (req: any, res: any, next: any) => any;

export function registerFeedbackRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  teacherName: (teacherId: string, client: any) => Promise<{ display_name?: string | null } | null>;
}) {
  // The most recent finished lesson of this family that has no rating yet.
  app.get('/api/student/lesson-feedback/pending', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
      if (requested && !learners.some((l) => l.id === requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const learnerIds = requested ? [requested] : learners.map((l) => l.id);
      if (!learnerIds.length) return res.json({ pending: null });

      const now = DateTime.utc();
      const { data: rows, error } = await client
        .from('bookings')
        .select('id, student_id, service_id, status, scheduled_start, scheduled_end, duration_minutes')
        .in('student_id', learnerIds)
        .in('status', RATEABLE_STATUSES)
        .gte('scheduled_start', now.minus({ days: FEEDBACK_WINDOW_DAYS + 1 }).toISO())
        .lte('scheduled_start', now.toISO())
        .order('scheduled_start', { ascending: false })
        .limit(20);
      if (error) return res.status(500).json({ error: 'Could not check your lessons.' });
      const ended = (rows || []).filter((b: any) => canRate(b, now));
      if (!ended.length) return res.json({ pending: null });
      const { data: rated } = await client.from('lesson_feedback').select('booking_id').in('booking_id', ended.map((b: any) => b.id));
      const ratedIds = new Set((rated || []).map((r: any) => r.booking_id));
      const next = ended.find((b: any) => !ratedIds.has(b.id));
      if (!next) return res.json({ pending: null });
      return res.json({
        pending: {
          bookingId: next.id,
          learnerId: next.student_id,
          learnerName: learners.find((l) => l.id === next.student_id)?.name || null,
          subject: subjectOf(next.service_id),
          scheduledStart: next.scheduled_start
        }
      });
    } catch (err) {
      console.error('[GET /api/student/lesson-feedback/pending]', err);
      return res.status(500).json({ error: 'Could not check your lessons.' });
    }
  });

  // Save (or, for the same account, change) the rating of one finished lesson.
  app.post('/api/student/bookings/:id/feedback', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const userId = req.studentUser?.auth_id;
    if (!userId || !UUID_RE.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    const bookingId = String(req.params.id || '');
    if (!UUID_RE.test(bookingId)) return res.status(404).json({ error: 'Lesson not found.' });
    const parsed = parseFeedback(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    try {
      const { data: booking } = await client
        .from('bookings')
        .select('id, student_id, teacher_id, status, scheduled_start, scheduled_end, duration_minutes')
        .eq('id', bookingId)
        .maybeSingle();
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      const learners = await deps.getLearners(client, req);
      if (!learners.some((l) => l.id === booking.student_id)) return res.status(403).json({ error: 'This lesson does not belong to your account.' });
      if (!canRate(booking, DateTime.utc())) return res.status(409).json({ error: 'This lesson can no longer be rated.' });

      const { data: existing } = await client.from('lesson_feedback').select('submitted_by, created_at').eq('booking_id', bookingId).maybeSingle();
      if (existing && existing.submitted_by !== userId) return res.status(409).json({ error: 'This lesson was already rated.' });
      if (existing && !ratingStillEditable(existing.created_at, DateTime.utc())) return res.status(409).json({ error: 'This rating can no longer be changed.' });
      const row = {
        booking_id: bookingId,
        student_id: booking.student_id,
        teacher_id: booking.teacher_id || null,
        submitted_by: userId,
        rating: parsed.rating,
        comment: parsed.comment,
        updated_at: new Date().toISOString()
      };
      const { error } = existing
        ? await client.from('lesson_feedback').update(row).eq('booking_id', bookingId).eq('submitted_by', userId)
        : await client.from('lesson_feedback').insert(row);
      if (error) {
        console.error('[POST feedback]', error.message);
        return res.status(500).json({ error: 'Could not save your rating.' });
      }
      return res.status(existing ? 200 : 201).json({ saved: true, familySummary: await familySummaryFor(client, bookingId) });
    } catch (err) {
      console.error('[POST /api/student/bookings/:id/feedback]', err);
      return res.status(500).json({ error: 'Could not save your rating.' });
    }
  });

  // A teacher's own average over finished months with TEACHER_MIN_RATINGS+ ratings each (see teacherVisibleRatings).
  app.get('/api/dashboard/me/lesson-feedback', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const teacherId = req.teacherUser?.id;
    if (!teacherId || !UUID_RE.test(teacherId)) return res.json(teacherAverage([]));
    const { data, error } = await client.from('lesson_feedback').select('rating, created_at').eq('teacher_id', teacherId);
    if (error) return res.status(500).json({ error: 'Could not load ratings.' });
    return res.json(teacherAverage(teacherVisibleRatings(data || [], DateTime.utc())));
  });

  // Super admin: recent ratings with comments, and every teacher's average.
  app.get('/api/dashboard/admin/lesson-feedback', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const { data, error } = await client
        .from('lesson_feedback')
        .select('booking_id, student_id, teacher_id, rating, comment, created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) return res.status(500).json({ error: 'Could not load ratings.' });
      const rows = data || [];
      const studentIds = [...new Set(rows.map((r: any) => r.student_id).filter(Boolean))];
      const { data: students } = studentIds.length
        ? await client.from('students').select('id, name').in('id', studentIds.slice(0, 200))
        : { data: [] as any[] };
      const studentName = new Map((students || []).map((s: any) => [s.id, s.name]));
      const teacherIds = [...new Set(rows.map((r: any) => r.teacher_id).filter(Boolean))] as string[];
      const names = new Map<string, string | null>();
      await Promise.all(teacherIds.map(async (id) => names.set(id, (await deps.teacherName(id, client))?.display_name || null)));
      const byTeacher = teacherIds.map((id) => {
        const ratings = rows.filter((r: any) => r.teacher_id === id).map((r: any) => Number(r.rating));
        return { teacherId: id, teacherName: names.get(id) || null, count: ratings.length, average: Math.round((ratings.reduce((a, r) => a + r, 0) / ratings.length) * 10) / 10 };
      }).sort((a, b) => b.count - a.count);
      return res.json({
        byTeacher,
        items: rows.slice(0, 100).map((r: any) => ({
          bookingId: r.booking_id,
          learnerName: studentName.get(r.student_id) || null,
          teacherName: r.teacher_id ? names.get(r.teacher_id) || null : null,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.created_at
        }))
      });
    } catch (err) {
      console.error('[GET /api/dashboard/admin/lesson-feedback]', err);
      return res.status(500).json({ error: 'Could not load ratings.' });
    }
  });
}
