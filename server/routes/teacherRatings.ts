import express from 'express';
import { DateTime } from 'luxon';
import { finishedFullMonths, TEACHER_MIN_RATINGS } from './feedback.js';

/**
 * Teacher rating (owner, 2026-11-20): a questionnaire about the teacher, separate from the after-lesson rating.
 * Four questions 1-5 (explains clearly, patient and kind, on time, the learner enjoys the lessons) + an optional note.
 * Due after the learner's 4th completed lesson with that teacher, then every 8 lessons (12, 20, ...). Blocking in the
 * family portal; "later today" once per milestone. The family account answers (a parent for a child), never a child
 * phone. Private to the academy: the teacher sees only per-question averages under the ST-02 rule (finished months
 * with 5+ answers each, so one family's answers can never be singled out); the super admin sees everything.
 */
export const FIRST_AT = 4;
export const EVERY = 8;
export const QUESTIONS = ['explains', 'patient', 'on_time', 'enjoys'] as const;
type Question = typeof QUESTIONS[number];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const RATING_COLS = 'student_id, teacher_id, lesson_count, snoozed_until, submitted_at';

/** The milestone (4, 12, 20, ...) a learner has reached with a teacher after `completed` lessons, or null before 4. */
export function dueMilestone(completed: number): number | null {
  return completed < FIRST_AT ? null : FIRST_AT + EVERY * Math.floor((completed - FIRST_AT) / EVERY);
}

type Pair = { studentId: string; teacherId: string; completed: number };
type RatingRow = { student_id: string; teacher_id: string; lesson_count: number; snoozed_until: string | null; submitted_at: string | null };

/** The first learner-teacher pair whose current milestone is not answered and (for the prompt) not snoozed now. */
export function nextDue(pairs: Pair[], rows: RatingRow[], nowMs: number, ignoreSnooze = false): (Pair & { lessonCount: number; canSnooze: boolean }) | null {
  for (const p of pairs) {
    const m = dueMilestone(p.completed);
    if (m === null) continue;
    const mine = rows.filter((r) => r.student_id === p.studentId && r.teacher_id === p.teacherId);
    // A later milestone already answered covers this one too (never ask twice for the same stretch).
    if (mine.some((r) => r.submitted_at && r.lesson_count >= m)) continue;
    const snooze = mine.find((r) => r.lesson_count === m);
    if (!ignoreSnooze && snooze?.snoozed_until && Date.parse(snooze.snoozed_until) > nowMs) continue;
    return { ...p, lessonCount: m, canSnooze: !snooze };
  }
  return null;
}

/** End of the family's day (their time zone), at most 24 hours away; 12 hours when the zone is unknown. */
export function endOfToday(nowMs: number, tz: unknown): string {
  const now = DateTime.fromMillis(nowMs);
  const local = typeof tz === 'string' && tz ? now.setZone(tz) : null;
  const end = local?.isValid ? local.endOf('day') : now.plus({ hours: 12 });
  return DateTime.fromMillis(Math.min(end.toMillis(), nowMs + 24 * 3_600_000)).toUTC().toISO()!;
}

export function parseAnswers(body: any): { scores: Record<Question, number>; note: string | null } | { error: string } {
  const scores = {} as Record<Question, number>;
  const keys: Record<Question, string> = { explains: 'explains', patient: 'patient', on_time: 'onTime', enjoys: 'enjoys' };
  for (const q of QUESTIONS) {
    const v = Number(body?.[keys[q]]);
    if (!Number.isInteger(v) || v < 1 || v > 5) return { error: 'Answer every question from 1 to 5.' };
    scores[q] = v;
  }
  if (body?.note != null && typeof body.note !== 'string') return { error: 'The note must be text.' };
  const note = typeof body?.note === 'string' ? body.note.trim() : '';
  if (note.length > 1000) return { error: 'Please keep the note under 1000 characters.' };
  return { scores, note: note || null };
}

const average = (rows: any[], q: Question) => (rows.length ? Math.round((rows.reduce((a, r) => a + Number(r[q]), 0) / rows.length) * 10) / 10 : null);
const averages = (rows: any[]) => ({ explains: average(rows, 'explains'), patient: average(rows, 'patient'), onTime: average(rows, 'on_time'), enjoys: average(rows, 'enjoys') });

type Middleware = (req: any, res: any, next: any) => any;

export function registerTeacherRatingRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; learnerType?: string }>>;
  teacherName: (teacherId: string, client: any) => Promise<{ display_name?: string | null } | null>;
  now?: () => number;
}) {
  const now = deps.now ?? Date.now;
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };

  /** Completed-lesson counts per learner and teacher, and the rating rows of those learners. */
  const load = async (client: any, learnerIds: string[]) => {
    const [{ data: lessons, error }, { data: rows, error: rErr }] = await Promise.all([
      client.from('bookings').select('student_id, teacher_id').in('student_id', learnerIds).eq('status', 'completed').limit(5000),
      client.from('teacher_ratings').select(RATING_COLS).in('student_id', learnerIds),
    ]);
    if (error || rErr) throw new Error((error || rErr).message);
    const counts = new Map<string, Pair>();
    for (const b of lessons || []) {
      if (!b.teacher_id) continue;
      const key = `${b.student_id}|${b.teacher_id}`;
      const p = counts.get(key) || { studentId: b.student_id, teacherId: b.teacher_id, completed: 0 };
      p.completed++;
      counts.set(key, p);
    }
    return { pairs: [...counts.values()], rows: (rows || []) as RatingRow[] };
  };

  /** The family's own learner and the milestone the server says is due now; anything else is refused. */
  const dueFor = async (client: any, req: any) => {
    const learnerId = String(req.body?.learnerId || '');
    const teacherId = String(req.body?.teacherId || '');
    const learners = await deps.getLearners(client, req);
    if (!learners.some((l) => l.id === learnerId) || !UUID_RE.test(teacherId)) return null;
    const { pairs, rows } = await load(client, [learnerId]);
    // A snoozed milestone can still be answered before the snooze ends.
    const due = nextDue(pairs.filter((p) => p.teacherId === teacherId), rows, now(), true);
    return due && due.lessonCount === Number(req.body?.lessonCount) ? due : null;
  };

  app.get('/api/student/teacher-rating/pending', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    if (req.childDevice) return res.json({ pending: null });
    try {
      const learners = await deps.getLearners(client, req);
      if (!learners.length) return res.json({ pending: null });
      const { pairs, rows } = await load(client, learners.map((l) => l.id));
      const due = nextDue(pairs, rows, now());
      if (!due) return res.json({ pending: null });
      const learner = learners.find((l) => l.id === due.studentId);
      res.json({
        pending: {
          learnerId: due.studentId, learnerName: learner?.name || null, isChild: learner?.learnerType === 'child',
          teacherId: due.teacherId, teacherName: (await deps.teacherName(due.teacherId, client))?.display_name || null,
          lessonCount: due.lessonCount, canSnooze: due.canSnooze,
        },
      });
    } catch (err) {
      console.error('[GET teacher-rating/pending]', err);
      res.status(500).json({ error: 'Could not check this.' });
    }
  });

  app.post('/api/student/teacher-rating', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    if (!userId || !UUID_RE.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    if (req.childDevice) return res.status(403).json({ error: 'A parent answers this from the family account.' });
    const parsed = parseAnswers(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    try {
      const due = await dueFor(client, req);
      if (!due) return res.status(409).json({ error: 'There is nothing to answer here now.' });
      const answer = { ...parsed.scores, note: parsed.note, submitted_by: userId, submitted_at: new Date(now()).toISOString() };
      const key = { student_id: due.studentId, teacher_id: due.teacherId, lesson_count: due.lessonCount };
      // A snoozed milestone already has its row; otherwise this is the first and only write.
      const { error } = due.canSnooze
        ? await client.from('teacher_ratings').insert({ ...key, ...answer })
        : await client.from('teacher_ratings').update(answer).eq('student_id', key.student_id).eq('teacher_id', key.teacher_id).eq('lesson_count', key.lesson_count).is('submitted_at', null);
      if (error?.code === '23505') return res.status(409).json({ error: 'This was already answered.' });
      if (error) throw new Error(error.message);
      res.status(201).json({ saved: true });
    } catch (err) {
      console.error('[POST teacher-rating]', err);
      res.status(500).json({ error: 'Could not save your answers.' });
    }
  });

  app.post('/api/student/teacher-rating/snooze', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    if (!userId || !UUID_RE.test(userId)) return res.status(401).json({ error: 'Please sign in again.' });
    if (req.childDevice) return res.status(403).json({ error: 'A parent answers this from the family account.' });
    try {
      const due = await dueFor(client, req);
      if (!due || !due.canSnooze) return res.status(409).json({ error: 'This can be put off only once.' });
      const until = endOfToday(now(), req.body?.tz);
      const { error } = await client.from('teacher_ratings').insert({ student_id: due.studentId, teacher_id: due.teacherId, lesson_count: due.lessonCount, submitted_by: userId, snoozed_until: until });
      if (error?.code === '23505') return res.status(409).json({ error: 'This can be put off only once.' });
      if (error) throw new Error(error.message);
      res.json({ snoozedUntil: until });
    } catch (err) {
      console.error('[POST teacher-rating/snooze]', err);
      res.status(500).json({ error: 'Could not save this.' });
    }
  });

  // The teacher's own averages per question: no notes, no names, no single answers (finished months with 5+).
  app.get('/api/dashboard/me/teacher-ratings', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const { data, error } = await client.from('teacher_ratings').select('explains, patient, on_time, enjoys, submitted_at')
      .eq('teacher_id', req.teacherUser?.id).not('submitted_at', 'is', null);
    if (error) return res.status(500).json({ error: 'Could not load ratings.' });
    const visible = finishedFullMonths((data || []).map((r: any) => ({ ...r, created_at: r.submitted_at })), DateTime.fromMillis(now()));
    res.json({ count: visible.length, minimum: TEACHER_MIN_RATINGS, averages: visible.length ? averages(visible) : null });
  });

  app.get('/api/dashboard/admin/teacher-ratings', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('teacher_ratings')
        .select('student_id, teacher_id, lesson_count, explains, patient, on_time, enjoys, note, submitted_at')
        .not('submitted_at', 'is', null).order('submitted_at', { ascending: false }).limit(1000);
      if (error) throw new Error(error.message);
      const rows = data || [];
      const studentIds = [...new Set(rows.map((r: any) => r.student_id))].slice(0, 300);
      const { data: students } = studentIds.length ? await client.from('students').select('id, name').in('id', studentIds) : { data: [] as any[] };
      const studentName = new Map((students || []).map((s: any) => [s.id, s.name]));
      const teacherIds = [...new Set(rows.map((r: any) => r.teacher_id))] as string[];
      const names = new Map<string, string | null>();
      await Promise.all(teacherIds.map(async (id) => names.set(id, (await deps.teacherName(id, client))?.display_name || null)));
      res.json({
        byTeacher: teacherIds.map((id) => {
          const mine = rows.filter((r: any) => r.teacher_id === id);
          return { teacherId: id, teacherName: names.get(id) || null, count: mine.length, ...averages(mine) };
        }).sort((a, b) => b.count - a.count),
        items: rows.slice(0, 200).map((r: any) => ({
          learnerName: studentName.get(r.student_id) || null, teacherName: names.get(r.teacher_id) || null, lessonCount: r.lesson_count,
          explains: r.explains, patient: r.patient, onTime: r.on_time, enjoys: r.enjoys, note: r.note, submittedAt: r.submitted_at,
        })),
      });
    } catch (err) {
      console.error('[GET admin/teacher-ratings]', err);
      res.status(500).json({ error: 'Could not load ratings.' });
    }
  });
}
