import express from 'express';
import { SURAHS } from '../../src/lib/surahs.js';
import { canTeacherAccessStudent, canFamilyReadLearner, isUuid, normalizeSubjectSlug } from './progress.js';
import { firstName } from './summaryDraft.js';

/**
 * NX-02: homework between lessons (design: docs/superpowers/specs/2026-11-01-homework-design.md).
 * The teacher sets 1-3 tasks with the post-lesson summary; the family ticks them done; at the next lesson the teacher
 * marks each one mastered or needs_review (needs_review sets the same task again). Server-only table.
 */
export const MAX_HOMEWORK = 3;
export const MAX_HOMEWORK_BODY = 500;
export const HOMEWORK_COLUMNS =
  'id, student_id, booking_id, teacher_id, subject, kind, surah, ayah_from, ayah_to, body, done_at, review, reviewed_at, carried_from, created_at';

export interface HomeworkInput {
  kind: 'recite' | 'review' | 'task';
  surah: number | null;
  ayah_from: number | null;
  ayah_to: number | null;
  body: string | null;
}

const int = (v: unknown) => (v === null || v === undefined || v === '' ? null : Number(v));

/** Validates the tasks sent with a lesson summary. Empty rows are dropped; anything malformed is an error. */
export function parseHomework(raw: unknown): { ok: true; value: HomeworkInput[] } | { ok: false; error: string } {
  if (raw === undefined || raw === null) return { ok: true, value: [] };
  if (!Array.isArray(raw)) return { ok: false, error: 'Homework must be a list.' };
  const out: HomeworkInput[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') return { ok: false, error: 'Each homework task must be an object.' };
    const kind = (item as any).kind;
    if (!['recite', 'review', 'task'].includes(kind)) return { ok: false, error: 'Unknown homework type.' };
    const bodyRaw = (item as any).body;
    if (bodyRaw != null && typeof bodyRaw !== 'string') return { ok: false, error: 'Homework text must be text.' };
    const body = typeof bodyRaw === 'string' && bodyRaw.trim() ? bodyRaw.trim() : null;
    if (body && body.length > MAX_HOMEWORK_BODY) return { ok: false, error: `Keep each task under ${MAX_HOMEWORK_BODY} characters.` };
    if (kind === 'recite') {
      const surah = int((item as any).surah);
      const from = int((item as any).ayah_from);
      const to = int((item as any).ayah_to);
      const s = SURAHS.find((x) => x.n === surah);
      if (!s) return { ok: false, error: 'Choose a surah.' };
      if (!Number.isInteger(from) || !Number.isInteger(to) || from! < 1 || to! < from! || to! > s.ayat) {
        return { ok: false, error: `Ayah range must be within 1-${s.ayat} for ${s.en}.` };
      }
      out.push({ kind, surah, ayah_from: from, ayah_to: to, body });
    } else {
      if (!body) continue;
      out.push({ kind, surah: null, ayah_from: null, ayah_to: null, body });
    }
  }
  if (out.length > MAX_HOMEWORK) return { ok: false, error: `At most ${MAX_HOMEWORK} tasks per lesson.` };
  return { ok: true, value: out };
}

/** Saves the tasks of one lesson. Called by the post-lesson summary route after its own access check. */
export async function insertHomework(client: any, p: {
  studentId: string; teacherId: string | null; bookingId: string | null; noteId: string | null; subject: string | null; items: HomeworkInput[];
}): Promise<any[]> {
  if (!p.items.length) return [];
  const rows = p.items.map((i) => ({
    student_id: p.studentId, teacher_id: p.teacherId, booking_id: p.bookingId, lesson_note_id: p.noteId,
    subject: normalizeSubjectSlug(p.subject) || p.subject, ...i,
  }));
  const { data, error } = await client.from('lesson_homework').insert(rows).select(HOMEWORK_COLUMNS);
  if (error) throw new Error(error.message);
  return data || [];
}

/** Open tasks of a learner (not yet reviewed by the teacher), newest first. */
export async function openHomework(client: any, studentIds: string[]): Promise<any[]> {
  if (!studentIds.length) return [];
  const { data, error } = await client.from('lesson_homework').select(HOMEWORK_COLUMNS)
    .in('student_id', studentIds).is('review', null).order('created_at', { ascending: false }).limit(30);
  if (error) throw new Error(error.message);
  return data || [];
}

export function buildHomeworkPrompt(p: { firstName: string; notes: string; subject?: string; lang: 'ar' | 'en' }): string {
  const language = p.lang === 'ar' ? 'Arabic, simple and warm' : 'English, plain and warm';
  return `You are Jalila, the teaching assistant of Watazawwado Academy. From the teacher's private notes after a one-on-one lesson,
suggest homework for ${p.firstName || 'the learner'} until the next lesson.

Rules:
- ${language}.
- 1 to 3 tasks, one per line, each under 120 characters. Plain text: no numbering, no markdown.
- Small, concrete and doable in a few minutes a day. Use only what the notes say was covered.

Subject: ${p.subject || 'not given'}
Teacher's private notes:
"""${p.notes}"""`;
}

export function cleanHomeworkSuggestions(text: string): string[] {
  return String(text || '').split('\n')
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, '').replace(/[*_#`]/g, '').trim())
    .filter(Boolean).slice(0, MAX_HOMEWORK).map((l) => l.slice(0, MAX_HOMEWORK_BODY));
}

type Middleware = (req: any, res: any, next: any) => any;

export function registerHomeworkRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  familyLanguage: (client: any, studentId: string) => Promise<'ar' | 'en'>;
  generate: (prompt: string) => Promise<string>;
}) {
  // Teacher: open tasks and the last reviewed ones, for the lesson window.
  app.get('/api/dashboard/students/:id/homework', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const studentId = String(req.params.id || '');
    try {
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'You can only see homework of your own students.' });
      const [open, { data: recent }] = await Promise.all([
        openHomework(client, [studentId]),
        client.from('lesson_homework').select(HOMEWORK_COLUMNS).eq('student_id', studentId).not('review', 'is', null)
          .order('reviewed_at', { ascending: false }).limit(5),
      ]);
      return res.json({ open, recent: recent || [] });
    } catch (err: any) {
      console.error('[GET dashboard homework]', err?.message || err);
      return res.status(500).json({ error: 'Could not load homework.' });
    }
  });

  // Teacher: mastered, or needs review (the same task is set again for next time).
  app.post('/api/dashboard/homework/:id/review', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const id = String(req.params.id || '');
    const review = req.body?.review;
    if (!isUuid(id)) return res.status(400).json({ error: 'Valid homework id is required.' });
    if (review !== 'mastered' && review !== 'needs_review') return res.status(400).json({ error: 'Choose mastered or needs review.' });
    try {
      const { data: hw } = await client.from('lesson_homework').select('*').eq('id', id).maybeSingle();
      if (!hw) return res.status(404).json({ error: 'Homework not found.' });
      const access = await canTeacherAccessStudent(client, req.teacherUser, hw.student_id);
      if (!access.allowed && hw.teacher_id !== req.teacherUser?.id) return res.status(403).json({ error: 'This is not your student.' });
      if (hw.review) return res.status(409).json({ error: 'This task was already reviewed.' });
      const { data: updated, error } = await client.from('lesson_homework')
        .update({ review, reviewed_at: new Date().toISOString(), reviewed_by: req.teacherUser?.id || null })
        .eq('id', id).is('review', null).select(HOMEWORK_COLUMNS).maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) return res.status(409).json({ error: 'This task was already reviewed.' });
      let again = null;
      if (review === 'needs_review') {
        const { data } = await client.from('lesson_homework').insert({
          student_id: hw.student_id, teacher_id: req.teacherUser?.id || hw.teacher_id, booking_id: hw.booking_id, subject: hw.subject,
          kind: hw.kind, surah: hw.surah, ayah_from: hw.ayah_from, ayah_to: hw.ayah_to, body: hw.body, carried_from: hw.id,
        }).select(HOMEWORK_COLUMNS).single();
        again = data || null;
      }
      return res.json({ homework: updated, again });
    } catch (err: any) {
      console.error('[POST homework review]', err?.message || err);
      return res.status(500).json({ error: 'Could not save the review.' });
    }
  });

  // Teacher: Jalila suggests tasks from the private notes; nothing is saved.
  app.post('/api/dashboard/students/:id/homework-draft', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const studentId = String(req.params.id || '');
    const notes = typeof req.body?.privateNotes === 'string' ? req.body.privateNotes.trim() : '';
    if (!notes) return res.status(400).json({ error: 'Write your private notes first.' });
    if (notes.length > 2000) return res.status(400).json({ error: 'The notes are too long for a draft.' });
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim().slice(0, 60) : '';
    try {
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'You can only draft homework for your own students.' });
      const { data: student } = await client.from('students').select('name').eq('id', studentId).maybeSingle();
      const lang = await deps.familyLanguage(client, studentId);
      const tasks = cleanHomeworkSuggestions(await deps.generate(buildHomeworkPrompt({ firstName: firstName(student?.name), notes, subject, lang })));
      if (!tasks.length) return res.status(502).json({ error: 'Jalila could not suggest homework. Please try again.' });
      return res.json({ tasks });
    } catch (err: any) {
      console.error('[POST homework-draft]', err?.message || err);
      return res.status(503).json({ error: 'Jalila is not available right now. Please try again later.' });
    }
  });

  // Family: open tasks (and the ones reviewed in the last 14 days) of the account's learners.
  app.get('/api/student/homework', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
      if (requested && !canFamilyReadLearner(learners, requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
      const ids = requested ? [requested] : learners.map((l) => l.id).filter(Boolean);
      if (!ids.length) return res.json({ open: [], recent: [], hasNextLesson: false });
      const since = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString();
      const [open, { data: recent }, { count: upcoming }] = await Promise.all([
        openHomework(client, ids),
        client.from('lesson_homework').select(HOMEWORK_COLUMNS).in('student_id', ids).not('review', 'is', null)
          .gte('reviewed_at', since).order('reviewed_at', { ascending: false }).limit(10),
        // After a trial, the card offers "Book your next lesson" when nothing is booked yet.
        client.from('bookings').select('id', { count: 'exact', head: true }).in('student_id', ids)
          .in('status', ['confirmed', 'pending', 'rescheduled']).gte('scheduled_start', new Date().toISOString()),
      ]);
      return res.json({ open, recent: recent || [], hasNextLesson: Boolean(upcoming) });
    } catch (err: any) {
      console.error('[GET student homework]', err?.message || err);
      return res.status(500).json({ error: 'Could not load homework.' });
    }
  });

  // Family: tick a task done (or undo), until the teacher has reviewed it.
  app.post('/api/student/homework/:id/done', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const id = String(req.params.id || '');
    if (!isUuid(id)) return res.status(400).json({ error: 'Valid homework id is required.' });
    const done = req.body?.done !== false;
    try {
      const { data: hw } = await client.from('lesson_homework').select('id, student_id, review').eq('id', id).maybeSingle();
      const learners = await deps.getLearners(client, req);
      if (!hw || !canFamilyReadLearner(learners, hw.student_id)) return res.status(404).json({ error: 'Homework not found.' });
      if (hw.review) return res.status(409).json({ error: 'Your teacher already reviewed this task.' });
      const { data: updated, error } = await client.from('lesson_homework')
        .update(done ? { done_at: new Date().toISOString(), done_by: req.studentUser?.auth_id || null } : { done_at: null, done_by: null })
        .eq('id', id).is('review', null).select(HOMEWORK_COLUMNS).maybeSingle();
      if (error) throw new Error(error.message);
      if (!updated) return res.status(409).json({ error: 'Your teacher already reviewed this task.' });
      return res.json({ homework: updated });
    } catch (err: any) {
      console.error('[POST homework done]', err?.message || err);
      return res.status(500).json({ error: 'Could not save.' });
    }
  });
}
