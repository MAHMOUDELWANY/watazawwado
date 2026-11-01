import express from 'express';
import { canFamilyReadLearner, isUuid } from './progress.js';
import { firstName } from './summaryDraft.js';

/**
 * NX-04: a printable certificate for every milestone a teacher recorded (learner_milestones), with a public check page.
 * The public check shows only the learner's first name, the milestone and its date (children's privacy, RULES.md).
 */
type Middleware = (req: any, res: any, next: any) => any;

export function publicCertificate(m: { id: string; title_en: string; title_ar: string; reached_at: string }, learnerName: string | null) {
  return { id: m.id, firstName: firstName(learnerName) || null, title_en: m.title_en, title_ar: m.title_ar, reached_at: m.reached_at };
}

export function registerCertificateRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  const load = async (client: any, id: string) => {
    const { data: m } = await client.from('learner_milestones')
      .select('id, student_id, subject, kind, title_ar, title_en, reached_at, created_by').eq('id', id).maybeSingle();
    if (!m) return null;
    const { data: s } = await client.from('students').select('name').eq('id', m.student_id).maybeSingle();
    return { m, learnerName: s?.name || null };
  };

  // Family: the full certificate of one of their learners.
  app.get('/api/student/certificates/:id', deps.verifyStudentAuth, async (req: any, res: any) => {
    const id = String(req.params.id || '');
    if (!isUuid(id)) return res.status(404).json({ error: 'Certificate not found.' });
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const found = await load(client, id);
      const learners = await deps.getLearners(client, req);
      if (!found || !canFamilyReadLearner(learners, found.m.student_id)) return res.status(404).json({ error: 'Certificate not found.' });
      let teacherName: string | null = null;
      if (isUuid(found.m.created_by)) {
        const { data: p } = await client.from('profiles').select('display_name').eq('id', found.m.created_by).maybeSingle();
        teacherName = p?.display_name || null;
      }
      return res.json({ ...publicCertificate(found.m, found.learnerName), learnerName: found.learnerName, subject: found.m.subject, kind: found.m.kind, teacherName });
    } catch (err: any) {
      console.error('[GET student certificate]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the certificate.' });
    }
  });

  // Public: anyone with the link can check that the certificate is real.
  app.get('/api/certificates/:id', deps.rateLimit, async (req: any, res: any) => {
    const id = String(req.params.id || '');
    if (!isUuid(id)) return res.status(404).json({ error: 'Certificate not found.' });
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const found = await load(client, id);
      if (!found) return res.status(404).json({ error: 'Certificate not found.' });
      res.setHeader('Cache-Control', 'no-store');
      return res.json(publicCertificate(found.m, found.learnerName));
    } catch (err: any) {
      console.error('[GET public certificate]', err?.message || err);
      return res.status(500).json({ error: 'Could not check the certificate.' });
    }
  });
}
