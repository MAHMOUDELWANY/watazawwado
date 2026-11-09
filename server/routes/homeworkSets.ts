/**
 * Curriculum homework sets (owner review 2026-11-09): made from the pages the teacher marked after a lesson,
 * answered on the student's Homework tab, checked here, and decided by the teacher when below the pass mark.
 * Logic: server/homework/sets.ts. Table: homework_sets (server-only; answers never leave the server before submit).
 */
import type express from 'express';
import { findLesson } from '../../src/curriculum/catalog.js';
import {
  HOMEWORK_SCHEMA, VARIANTS_PER_SET, buildHomeworkPrompt, earnedBadges, gradeVariant, historyOf, passed,
  publicQuestions, questionCount, validateVariants, type Kind, type Variant,
} from '../homework/sets.js';
import { notifyUser, resolveLearnerAccount } from '../notifications/inbox.js';
import { canTeacherAccessStudent } from './progress.js';

type Mw = (req: any, res: any, next: any) => any;
export type GenerateJson = (prompt: string, schema: object) => Promise<any>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LIST_COLUMNS = 'id, student_id, booking_id, track, lesson_number, from_page, to_page, kind, version, title_en, title_ar, variant_index, status, score, total, teacher_decision, created_at, submitted_at, decided_at, attempts, variants';

/** Writes the questions of one set (all variants in one call) and opens it for the learner. */
export async function prepareHomeworkSet(client: any, generateJson: GenerateJson, row: any): Promise<boolean> {
  const lesson = findLesson(row.track, row.lesson_number);
  if (!lesson) return false;
  const pages = row.to_page - row.from_page + 1;
  const count = questionCount(row.kind as Kind, pages);
  let variants: Variant[] = [];
  for (let attempt = 0; attempt < 2 && variants.length === 0; attempt++) {
    try {
      const raw = await generateJson(buildHomeworkPrompt({ lesson, from: row.from_page, to: row.to_page, kind: row.kind, count, variants: VARIANTS_PER_SET }), HOMEWORK_SCHEMA);
      variants = validateVariants(raw, row.from_page, row.to_page, Math.max(3, count - 2));
    } catch (err) {
      console.warn('[homework] generation failed:', (err as Error).message);
    }
  }
  if (!variants.length) return false;
  const { error } = await client.from('homework_sets').update({ variants, status: 'new' }).eq('id', row.id).eq('status', 'preparing');
  if (error) { console.warn('[homework] save failed:', error.message); return false; }
  const account = await resolveLearnerAccount(client, row.student_id);
  if (account.userId) {
    const isLesson = row.kind === 'lesson';
    await notifyUser(client, { userId: account.userId, email: account.email, name: account.name }, {
      kind: 'homework_new',
      title: isLesson ? { en: 'Homework on the whole lesson is ready', ar: 'واجب الدرس كامل جاهز' } : { en: 'New homework is ready', ar: 'واجب جديد جاهز' },
      body: { en: `${lesson.title}: a few short questions on what you took today.`, ar: `${lesson.titleAr}: أسئلة قصيرة على اللي خدته النهارده.` },
      push: { body: { en: 'Zad has a few questions for you on today’s lesson. Ready?', ar: 'زاد عنده كام سؤال على درس النهارده. جاهز؟' } },
      link: `/student/homework?set=${row.id}`,
    });
  }
  return true;
}

/** Called after a curriculum report is saved. A finished lesson gets the whole-lesson set; otherwise the pages taught. */
export async function createHomeworkFromReport(client: any, generateJson: GenerateJson, r: {
  studentId: string; teacherId: string | null; bookingId: string | null; track: string; lessonNumber: number; fromPage: number; toPage: number;
}): Promise<{ id: string; status: string; kind: Kind } | null> {
  const lesson = findLesson(r.track, r.lessonNumber);
  if (!lesson) return null;
  const { data: reports } = await client.from('curriculum_lesson_reports').select('from_page, to_page').eq('student_id', r.studentId).eq('subject', r.track).eq('lesson_number', r.lessonNumber).limit(200);
  const covered = new Set<number>();
  for (const x of reports || []) for (let p = x.from_page; p <= Math.min(x.to_page, lesson.pages.length); p++) covered.add(p);
  const complete = covered.size >= lesson.pages.length;
  const kind: Kind = complete ? 'lesson' : 'part';
  const from = complete ? 1 : r.fromPage;
  const to = complete ? lesson.pages.length : Math.min(r.toPage, lesson.pages.length);
  const { data: row, error } = await client.from('homework_sets').insert({
    student_id: r.studentId, teacher_id: r.teacherId, booking_id: r.bookingId, track: r.track, lesson_number: r.lessonNumber,
    from_page: from, to_page: to, kind, version: lesson.version,
    title_en: `${lesson.title}${kind === 'part' ? ` · pages ${from}–${to}` : ''}`.slice(0, 200),
    title_ar: `${lesson.titleAr}${kind === 'part' ? ` · صفحات ${from}–${to}` : ''}`.slice(0, 200),
  }).select('*').single();
  if (error || !row) { console.warn('[homework] insert failed:', error?.message); return null; }
  const ok = await prepareHomeworkSet(client, generateJson, row);
  return { id: row.id, status: ok ? 'new' : 'preparing', kind };
}

/**
 * Cron: finish sets whose questions could not be written yet, and add spaced reviews: 7 and 21 days after a
 * whole-lesson set was passed, a short review made from that set's other variants (no new AI call).
 */
export async function processHomeworkCron(client: any, generateJson: GenerateJson, now = new Date()): Promise<{ prepared: number; reviews: number }> {
  let prepared = 0;
  let reviews = 0;
  const { data: waiting } = await client.from('homework_sets').select('*').eq('status', 'preparing').lt('created_at', new Date(now.getTime() - 2 * 60_000).toISOString()).limit(5);
  for (const row of waiting || []) if (await prepareHomeworkSet(client, generateJson, row)) prepared++;

  for (const days of [7, 21]) {
    const from = new Date(now.getTime() - (days + 1) * 86_400_000).toISOString();
    const to = new Date(now.getTime() - days * 86_400_000).toISOString();
    const { data: done } = await client.from('homework_sets').select('*').eq('kind', 'lesson').in('status', ['passed', 'done']).gte('submitted_at', from).lt('submitted_at', to).limit(50);
    for (const base of done || []) {
      const { data: have } = await client.from('homework_sets').select('id').eq('review_of', base.id).limit(2);
      if ((have || []).length >= (days === 7 ? 1 : 2)) continue;
      const pool = (base.variants as Variant[]).flatMap((v, i) => (i === base.variant_index ? [] : v.questions));
      const pick = (pool.length >= 4 ? pool : (base.variants as Variant[]).flatMap((v) => v.questions)).filter((_, i) => i % 2 === (days === 7 ? 0 : 1)).slice(0, 6);
      if (pick.length < 3) continue;
      const { data: row } = await client.from('homework_sets').insert({
        student_id: base.student_id, teacher_id: base.teacher_id, track: base.track, lesson_number: base.lesson_number,
        from_page: base.from_page, to_page: base.to_page, kind: 'review', version: base.version, review_of: base.id,
        title_en: `Remember: ${base.title_en}`.slice(0, 200), title_ar: `فاكر؟ ${base.title_ar}`.slice(0, 200),
        variants: [{ questions: pick }], status: 'new',
      }).select('id, student_id').single();
      if (!row) continue;
      reviews++;
      const account = await resolveLearnerAccount(client, row.student_id);
      if (account.userId) await notifyUser(client, { userId: account.userId, email: account.email, name: account.name }, {
        kind: 'homework_new',
        title: { en: 'Quick review: do you still remember?', ar: 'مراجعة سريعة: لسه فاكر؟' },
        body: { en: 'A few questions on a lesson from a while ago, so it stays with you.', ar: 'كام سؤال على درس من فترة، عشان يفضل معاك.' },
        link: `/student/homework?set=${row.id}`,
      });
    }
  }
  return { prepared, reviews };
}

/** What a learner or parent may see of a set. Answers only for questions already answered in a past attempt. */
function forStudent(row: any) {
  const variant: Variant | undefined = row.variants?.[row.variant_index];
  const open = row.status === 'new' || row.status === 'retry';
  const lastAttempt = (row.attempts || []).slice(-1)[0] || null;
  return {
    id: row.id, studentId: row.student_id, track: row.track, lessonNumber: row.lesson_number, fromPage: row.from_page, toPage: row.to_page,
    kind: row.kind, version: row.version, title: { en: row.title_en, ar: row.title_ar }, status: row.status, score: row.score, total: row.total,
    createdAt: row.created_at, submittedAt: row.submitted_at,
    questions: open ? publicQuestions(variant, row.id + row.variant_index) : [],
    lastResult: lastAttempt ? { score: lastAttempt.score, total: lastAttempt.total, results: lastAttempt.results } : null,
  };
}

export function registerHomeworkSetRoutes(app: express.Express, deps: {
  getClient: () => any;
  rateLimit: Mw;
  verifyStudentAuth: Mw;
  verifyTeacherAuth: Mw;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
  generateJson: GenerateJson;
}) {
  app.get('/api/student/homework-sets', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const ids = learners.map((l) => l.id);
      if (!ids.length) return res.json({ learners: [], sets: [], badges: [] });
      const { data, error } = await client.from('homework_sets').select(LIST_COLUMNS).in('student_id', ids).neq('status', 'preparing').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      const rows = data || [];
      res.json({
        learners: learners.map((l) => ({ id: l.id, name: l.name, badges: earnedBadges(historyOf(rows.filter((r: any) => r.student_id === l.id))) })),
        sets: rows.map(forStudent),
      });
    } catch (err) {
      console.error('[GET /api/student/homework-sets]', err);
      res.status(500).json({ error: 'Could not load your homework.' });
    }
  });

  app.post('/api/student/homework-sets/:id/submit', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(404).json({ error: 'Homework not found.' });
    try {
      const learners = await deps.getLearners(client, req);
      const { data: row } = await client.from('homework_sets').select('*').eq('id', req.params.id).maybeSingle();
      if (!row || !learners.some((l) => l.id === row.student_id)) return res.status(404).json({ error: 'Homework not found.' });
      if (row.status !== 'new' && row.status !== 'retry') return res.status(409).json({ error: 'This homework is already handed in.' });
      const answers = req.body?.answers && typeof req.body.answers === 'object' ? req.body.answers : {};
      const variant: Variant = row.variants[row.variant_index];
      const graded = gradeVariant(variant, answers);
      const ok = passed(graded.score, graded.total);
      const { data: before } = await client.from('homework_sets').select('status, kind, score, total').eq('student_id', row.student_id).limit(500);
      const badgesBefore = new Set(earnedBadges(historyOf(before || [])).map((b) => b.id));
      const attempt = { variant: row.variant_index, score: graded.score, total: graded.total, results: graded.results, answers, at: new Date().toISOString() };
      const { error } = await client.from('homework_sets').update({
        status: ok ? 'passed' : 'submitted', score: graded.score, total: graded.total,
        attempts: [...(row.attempts || []), attempt], submitted_at: attempt.at, teacher_decision: null,
      }).eq('id', row.id).in('status', ['new', 'retry']);
      if (error) throw error;
      const after = (before || []).map((b: any) => b);
      after.push({ status: ok ? 'passed' : 'submitted', kind: row.kind, score: graded.score, total: graded.total });
      const newBadges = earnedBadges(historyOf(after)).filter((b) => !badgesBefore.has(b.id));
      // Below the pass mark, the teacher decides: try again with new questions, or accept it.
      if (!ok && row.teacher_id) {
        const learner = learners.find((l) => l.id === row.student_id);
        await notifyUser(client, { userId: row.teacher_id, staff: true }, {
          kind: 'homework_review',
          title: { en: `${learner?.name || 'A student'} needs your decision on homework`, ar: `${learner?.name || 'طالب'} محتاج قرارك في الواجب` },
          body: { en: `${graded.score}/${graded.total} on ${row.title_en}. Retry with new questions, or accept it?`, ar: `${graded.score}/${graded.total} في ${row.title_ar}. يعيد بأسئلة جديدة ولا تعتمده؟` },
          link: `/dashboard/students/${row.student_id}?homework=${row.id}`,
        });
      }
      res.json({ passed: ok, score: graded.score, total: graded.total, results: graded.results, newBadges });
    } catch (err) {
      console.error('[POST /api/student/homework-sets/:id/submit]', err);
      res.status(500).json({ error: 'Could not hand in the homework.' });
    }
  });

  app.get('/api/dashboard/students/:id/homework-sets', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const studentId = String(req.params.id || '');
    if (!UUID_RE.test(studentId) || !(await canTeacherAccessStudent(client, req.teacherUser, studentId))) return res.status(403).json({ error: 'Forbidden.' });
    const { data, error } = await client.from('homework_sets').select(LIST_COLUMNS).eq('student_id', studentId).order('created_at', { ascending: false }).limit(60);
    if (error) return res.status(500).json({ error: 'Could not load homework.' });
    // The teacher sees each attempt with the questions missed, so they know what to go over next lesson.
    res.json({
      sets: (data || []).map((row: any) => {
        const attempts = (row.attempts || []).map((a: any) => {
          const qs: any[] = row.variants?.[a.variant]?.questions || [];
          return { score: a.score, total: a.total, at: a.at, missed: (a.results || []).filter((r: any) => !r.correct).map((r: any) => {
            const q = qs.find((x) => x.id === r.id);
            return { page: q?.page, prompt: q?.prompt, explain: q?.explain };
          }) };
        });
        return {
          id: row.id, track: row.track, lessonNumber: row.lesson_number, fromPage: row.from_page, toPage: row.to_page, kind: row.kind,
          title: { en: row.title_en, ar: row.title_ar }, status: row.status, score: row.score, total: row.total,
          variantsLeft: Math.max(0, (row.variants || []).length - row.variant_index - 1), createdAt: row.created_at, submittedAt: row.submitted_at, attempts,
        };
      }),
    });
  });

  app.post('/api/dashboard/homework-sets/:id/decision', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const decision = req.body?.decision;
    if (decision !== 'retry' && decision !== 'accept') return res.status(400).json({ error: 'Choose retry or accept.' });
    if (!UUID_RE.test(String(req.params.id))) return res.status(404).json({ error: 'Homework not found.' });
    const { data: row } = await client.from('homework_sets').select('*').eq('id', req.params.id).maybeSingle();
    if (!row || !(await canTeacherAccessStudent(client, req.teacherUser, row.student_id))) return res.status(404).json({ error: 'Homework not found.' });
    if (row.status !== 'submitted' && row.status !== 'passed') return res.status(409).json({ error: 'There is nothing to decide on this homework yet.' });
    const now = new Date().toISOString();
    if (decision === 'accept') {
      await client.from('homework_sets').update({ status: 'done', teacher_decision: 'accept', decided_at: now }).eq('id', row.id);
      return res.json({ status: 'done' });
    }
    // Retry: the next variant (different questions on the same pages); write more when they run out.
    let variants: Variant[] = row.variants;
    if (row.variant_index + 1 >= variants.length) {
      const lesson = findLesson(row.track, row.lesson_number);
      if (lesson) {
        try {
          const count = questionCount(row.kind, row.to_page - row.from_page + 1);
          const raw = await deps.generateJson(buildHomeworkPrompt({ lesson, from: row.from_page, to: row.to_page, kind: row.kind, count, variants: 2 }), HOMEWORK_SCHEMA);
          variants = [...variants, ...validateVariants(raw, row.from_page, row.to_page, Math.max(3, count - 2))];
        } catch (err) { console.warn('[homework] more variants failed:', (err as Error).message); }
      }
    }
    const nextIndex = row.variant_index + 1 < variants.length ? row.variant_index + 1 : 0;
    await client.from('homework_sets').update({ variants, variant_index: nextIndex, status: 'retry', teacher_decision: 'retry', decided_at: now }).eq('id', row.id);
    const account = await resolveLearnerAccount(client, row.student_id);
    if (account.userId) await notifyUser(client, { userId: account.userId, email: account.email, name: account.name }, {
      kind: 'homework_new',
      title: { en: 'One more go at your homework', ar: 'محاولة كمان في الواجب' },
      body: { en: 'Your teacher set new questions on the same pages. You’ve got this.', ar: 'معلمك جهّزلك أسئلة جديدة على نفس الصفحات. تقدر عليها.' },
      link: `/student/homework?set=${row.id}`,
    });
    res.json({ status: 'retry' });
  });
}
