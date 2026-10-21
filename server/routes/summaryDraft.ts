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
export function cleanDraft(text: string): string {
  const out = String(text || '')
    .replace(/[*_#>`]/g, '')
    .replace(/^\s*["“«]|["”»]\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return out.length > MAX_DRAFT ? `${out.slice(0, MAX_DRAFT - 1).trimEnd()}…` : out;
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
