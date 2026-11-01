import express from 'express';
import { DateTime } from 'luxon';
import { canFamilyReadLearner, isUuid } from './progress.js';

/**
 * NX-08: seasonal programs. The super admin creates and publishes dated programs; families see the open ones on the
 * student home and sign a learner up until the program ends; the admin sees who joined.
 */
type Middleware = (req: any, res: any, next: any) => any;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const COLUMNS = 'id, title_en, title_ar, description_en, description_ar, starts_on, ends_on, is_published, created_at';

export function parseProgram(body: any): { ok: true; value: Record<string, any> } | { ok: false; error: string } {
  const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
  const title_en = text(body?.title_en, 120);
  const title_ar = text(body?.title_ar, 120);
  if (title_en.length < 3 || title_ar.length < 3) return { ok: false, error: 'Write the title in English and Arabic.' };
  const starts_on = String(body?.starts_on || '');
  const ends_on = String(body?.ends_on || '');
  if (!DATE_RE.test(starts_on) || !DATE_RE.test(ends_on) || !DateTime.fromISO(starts_on).isValid || !DateTime.fromISO(ends_on).isValid) {
    return { ok: false, error: 'Choose a start and an end date.' };
  }
  if (ends_on < starts_on) return { ok: false, error: 'The end date must be on or after the start.' };
  return {
    ok: true,
    value: {
      title_en, title_ar, starts_on, ends_on,
      description_en: text(body?.description_en, 1500) || null,
      description_ar: text(body?.description_ar, 1500) || null,
      is_published: body?.is_published === true,
    },
  };
}

/** Families can join a published program until its last day (UTC date). */
export const isJoinable = (p: { is_published: boolean; ends_on: string }, today: string) => p.is_published && p.ends_on >= today;

export function registerProgramRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string }>>;
}) {
  const admin = [deps.verifyTeacherAuth, deps.requireSuperAdmin];
  const today = () => DateTime.utc().toISODate()!;

  app.get('/api/dashboard/programs', ...admin, async (_req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const { data: programs, error } = await client.from('seasonal_programs').select(COLUMNS).order('starts_on', { ascending: false }).limit(100);
      if (error) throw new Error(error.message);
      const ids = (programs || []).map((p: any) => p.id);
      const { data: signups } = ids.length
        ? await client.from('program_signups').select('program_id, created_at, students:student_id(id, name, email)').in('program_id', ids).order('created_at')
        : { data: [] as any[] };
      return res.json({
        programs: (programs || []).map((p: any) => ({
          ...p,
          signups: (signups || []).filter((s: any) => s.program_id === p.id)
            .map((s: any) => ({ studentId: s.students?.id, name: s.students?.name || null, email: s.students?.email || null, at: s.created_at })),
        })),
      });
    } catch (err: any) {
      console.error('[GET programs]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the programs.' });
    }
  });

  app.post('/api/dashboard/programs', deps.rateLimit, ...admin, async (req: any, res: any) => {
    const parsed = parseProgram(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await client.from('seasonal_programs')
      .insert({ ...parsed.value, created_by: isUuid(req.teacherUser?.id) ? req.teacherUser.id : null }).select(COLUMNS).single();
    if (error) { console.error('[POST programs]', error.message); return res.status(500).json({ error: 'Could not save the program.' }); }
    return res.status(201).json({ program: data });
  });

  app.patch('/api/dashboard/programs/:id', deps.rateLimit, ...admin, async (req: any, res: any) => {
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Program not found.' });
    const parsed = parseProgram(req.body);
    if (parsed.ok === false) return res.status(400).json({ error: parsed.error });
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await client.from('seasonal_programs')
      .update({ ...parsed.value, updated_at: new Date().toISOString() }).eq('id', req.params.id).select(COLUMNS).maybeSingle();
    if (error) { console.error('[PATCH programs]', error.message); return res.status(500).json({ error: 'Could not save the program.' }); }
    if (!data) return res.status(404).json({ error: 'Program not found.' });
    return res.json({ program: data });
  });

  // Family: published programs that are still open, and which of the account's learners joined each.
  app.get('/api/student/programs', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      const { data: programs, error } = await client.from('seasonal_programs').select(COLUMNS)
        .eq('is_published', true).gte('ends_on', today()).order('starts_on').limit(10);
      if (error) throw new Error(error.message);
      const ids = (programs || []).map((p: any) => p.id);
      const learnerIds = learners.map((l) => l.id).filter(Boolean);
      const { data: joined } = ids.length && learnerIds.length
        ? await client.from('program_signups').select('program_id, student_id').in('program_id', ids).in('student_id', learnerIds)
        : { data: [] as any[] };
      return res.json({
        learners: learners.map((l) => ({ id: l.id, name: l.name })),
        programs: (programs || []).map((p: any) => ({
          ...p,
          joined: (joined || []).filter((j: any) => j.program_id === p.id).map((j: any) => j.student_id),
        })),
      });
    } catch (err: any) {
      console.error('[GET student programs]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the programs.' });
    }
  });

  // Family: sign a learner up (or leave) while the program is open.
  app.post('/api/student/programs/:id/join', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Program not found.' });
    const learnerId = String(req.body?.learnerStudentId || '');
    const leave = req.body?.leave === true;
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const learners = await deps.getLearners(client, req);
      if (!canFamilyReadLearner(learners, learnerId)) return res.status(403).json({ error: 'Choose a learner on your account.' });
      const { data: program } = await client.from('seasonal_programs').select('id, is_published, ends_on').eq('id', req.params.id).maybeSingle();
      if (!program || !isJoinable(program, today())) return res.status(404).json({ error: 'This program is not open.' });
      if (leave) {
        await client.from('program_signups').delete().eq('program_id', program.id).eq('student_id', learnerId);
        return res.json({ joined: false });
      }
      const { error } = await client.from('program_signups').upsert({
        program_id: program.id, student_id: learnerId, account_user_id: isUuid(req.studentUser?.auth_id) ? req.studentUser.auth_id : null,
      }, { onConflict: 'program_id,student_id', ignoreDuplicates: true });
      if (error) throw new Error(error.message);
      return res.json({ joined: true });
    } catch (err: any) {
      console.error('[POST program join]', err?.message || err);
      return res.status(500).json({ error: 'Could not save. Please try again.' });
    }
  });
}
