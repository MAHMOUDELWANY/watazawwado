import express from 'express';
import { canTeacherAccessStudent } from './progress.js';

/**
 * TE-05: "Draft with Jalila". Turns the teacher's private notes (as typed, not yet saved) into a short, warm family
 * summary in the family's language. Gemini gets the learner's first name only. Nothing is saved or sent: the draft goes
 * back into the editor, where the teacher edits it and saves as usual.
 */
export const MAX_NOTES = 2000;
export const MAX_DRAFT = 600;

export function firstName(name: string | null | undefined): string {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

export function buildSummaryPrompt(p: { firstName: string; notes: string; nextSteps?: string; subject?: string; lang: 'ar' | 'en' }): string {
  const language = p.lang === 'ar'
    ? 'Arabic: simple standard Arabic with a warm Egyptian touch, the way a kind Egyptian teacher writes to a family'
    : 'English: plain, warm and natural';
  return `You are Jalila, the teaching assistant of Watazawwado Academy. A teacher wrote these private notes after a one-on-one lesson.
Write the short summary the FAMILY will read.

Rules:
- ${language}.
- 1 or 2 sentences, at most 60 words. Plain text: no markdown, no lists, no greeting, no signature.
- Say what was covered and one honest, encouraging point. If a next step is given, end with it.
- Use only facts from the notes. Do not invent progress, scores or praise.
- Leave out anything not meant for the family: criticism of the learner, health, behaviour, family or money matters, and anything about other people.
- Refer to the learner as "${p.firstName || 'the learner'}" only.

Subject: ${p.subject || 'not given'}
Teacher's private notes:
"""${p.notes}"""
${p.nextSteps ? `Next step the teacher set: """${p.nextSteps}"""` : ''}`;
}

/** Strip markdown and quotes the model may add, and keep it short. */
export function cleanDraft(text: string, max = MAX_DRAFT): string {
  const out = String(text || '')
    .replace(/[*_#>`]/g, '')
    .replace(/^\s*["“«]|["”»]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out.length > max ? `${out.slice(0, max - 1).trimEnd()}…` : out;
}

type Middleware = (req: any, res: any, next: any) => any;

export function registerSummaryDraftRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
  familyLanguage: (client: any, studentId: string) => Promise<'ar' | 'en'>;
  generate: (prompt: string) => Promise<string>;
}) {
  app.post('/api/dashboard/students/:id/family-summary-draft', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const studentId = String(req.params.id || '');
    const notes = typeof req.body?.privateNotes === 'string' ? req.body.privateNotes.trim() : '';
    if (!notes) return res.status(400).json({ error: 'Write your private notes first.' });
    if (notes.length > MAX_NOTES) return res.status(400).json({ error: 'The notes are too long for a draft.' });
    const nextSteps = typeof req.body?.nextSteps === 'string' ? req.body.nextSteps.trim().slice(0, 300) : '';
    const subject = typeof req.body?.subject === 'string' ? req.body.subject.trim().slice(0, 60) : '';
    try {
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'You can only draft summaries for your own students.' });
      const { data: student } = await client.from('students').select('name').eq('id', studentId).maybeSingle();
      const lang = await deps.familyLanguage(client, studentId);
      const draft = cleanDraft(await deps.generate(buildSummaryPrompt({ firstName: firstName(student?.name), notes, nextSteps, subject, lang })));
      if (!draft) return res.status(502).json({ error: 'Jalila could not write a draft. Please try again.' });
      return res.json({ draft, lang });
    } catch (err: any) {
      console.error('[POST family-summary-draft]', err?.message || err);
      return res.status(503).json({ error: 'Jalila is not available right now. Please try again later.' });
    }
  });
}

/**
 * Monthly note (phase 4, owner 2026-10-28): Jalila drafts a short letter to the family about the last 30 days, from
 * what the family already saw (shared summaries and next steps), the milestones and the lesson count. Private notes are
 * never sent. The teacher edits it and saves it as a family note, so it shows on the progress page and monthly report.
 */
export const MAX_MONTHLY = 900;

export function buildMonthlyPrompt(p: {
  firstName: string; lang: 'ar' | 'en'; lessons: number;
  summaries: Array<{ date: string; text: string; next?: string | null }>; milestones: string[];
}): string {
  const language = p.lang === 'ar'
    ? 'Arabic: simple standard Arabic with a warm Egyptian touch, the way a kind Egyptian teacher writes to a family'
    : 'English: plain, warm and natural';
  return `You are Jalila, the teaching assistant of Watazawwado Academy. Draft the teacher's short monthly note to the family.

Rules:
- ${language}.
- 3 to 5 sentences, at most 110 words. Plain text: no markdown, no lists, no greeting line, no signature.
- Say what the month covered, one honest strength, and the focus for next month (from the latest next step).
- Use only the facts below. Do not invent scores, progress or praise. If there is little to go on, keep it short and say so kindly.
- Refer to the learner as "${p.firstName || 'the learner'}" only.

Lessons attended in the last 30 days: ${p.lessons}
Milestones: ${p.milestones.join('; ') || 'none'}
What the family was told after each lesson (oldest first):
${p.summaries.map((s) => `- ${s.date}: ${s.text}${s.next ? ` (next: ${s.next})` : ''}`).join('\n') || '- none'}`;
}

export function registerMonthlyDraftRoute(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
  familyLanguage: (client: any, studentId: string) => Promise<'ar' | 'en'>;
  generate: (prompt: string) => Promise<string>;
}) {
  app.post('/api/dashboard/students/:id/monthly-draft', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const studentId = String(req.params.id || '');
    try {
      const access = await canTeacherAccessStudent(client, req.teacherUser, studentId);
      if (!access.exists) return res.status(404).json({ error: 'Student record not found.' });
      if (!access.allowed) return res.status(403).json({ error: 'You can only write notes for your own students.' });
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const [{ data: student }, { data: notes }, { data: milestones }, { count }] = await Promise.all([
        client.from('students').select('name').eq('id', studentId).maybeSingle(),
        client.from('lesson_notes').select('family_summary, next_steps, created_at').eq('student_id', studentId).gte('created_at', since).order('created_at', { ascending: true }).limit(12),
        client.from('learner_milestones').select('title_en, title_ar, reached_at').eq('student_id', studentId).gte('reached_at', since),
        client.from('bookings').select('id', { count: 'exact', head: true }).eq('student_id', studentId).eq('status', 'completed').gte('scheduled_start', since),
      ]);
      const lang = await deps.familyLanguage(client, studentId);
      const summaries = (notes || [])
        .filter((n: any) => n.family_summary && String(n.family_summary).trim())
        .map((n: any) => ({ date: String(n.created_at).slice(0, 10), text: String(n.family_summary).trim().slice(0, 400), next: n.next_steps ? String(n.next_steps).slice(0, 200) : null }));
      const prompt = buildMonthlyPrompt({
        firstName: firstName(student?.name),
        lang,
        lessons: count || 0,
        summaries,
        milestones: (milestones || []).map((m: any) => (lang === 'ar' ? m.title_ar : m.title_en)).filter(Boolean),
      });
      const draft = cleanDraft(await deps.generate(prompt), MAX_MONTHLY);
      if (!draft) return res.status(502).json({ error: 'Jalila could not write a draft. Please try again.' });
      return res.json({ draft, lang });
    } catch (err: any) {
      console.error('[POST monthly-draft]', err?.message || err);
      return res.status(503).json({ error: 'Jalila is not available right now. Please try again later.' });
    }
  });
}
