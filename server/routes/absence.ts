import express from 'express';
import { APPEAL_MAX, APPEAL_MIN, APPEAL_OUTCOMES, finalizeAbsence, notifyAppeal, type AbsenceDeps, type AbsenceOutcome } from '../classroom/absence.js';
import type { StaffAccount } from './payroll.js';

/**
 * Missed-lesson cases (server/classroom/absence.ts).
 * - Teacher: GET /api/dashboard/absence-cases/pending (drives the dashboard card), POST .../:bookingId/confirm,
 *   POST .../:bookingId/appeal { reason } (10+ characters, before the 48 hours end).
 * - Super admin: GET /api/admin/absence-cases, POST /api/admin/absence-cases/:bookingId { action: 'accept', outcome,
 *   note? } | { action: 'reject', note? }.
 */
type Middleware = (req: any, res: any, next: any) => any;
const NOTE_MAX = 400;
const LESSON_COLS = 'id, reference_code, scheduled_start, duration_minutes, contact_name';
const lessonOf = (b: any) => (b ? { referenceCode: b.reference_code ?? null, scheduledStart: b.scheduled_start, durationMinutes: b.duration_minutes ?? null, learnerName: b.contact_name ?? null } : null);

export function registerAbsenceRoutes(app: express.Express, deps: AbsenceDeps & {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  listStaff: () => Promise<StaffAccount[]>;
}) {
  const now = deps.now ?? Date.now;
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };
  const lessons = async (client: any, ids: string[]) => {
    if (!ids.length) return new Map<string, any>();
    const { data, error } = await client.from('bookings').select(LESSON_COLS).in('id', ids);
    if (error) throw new Error(`bookings: ${error.message}`);
    return new Map<string, any>((data || []).map((b: any) => [b.id, b]));
  };
  /** The teacher's own case that still waits for them; someone else's looks like no case. */
  const ownOpen = async (client: any, req: any) => {
    const { data, error } = await client.from('lesson_absence_cases').select('booking_id, teacher_user_id, status, deadline_at')
      .eq('booking_id', String(req.params.bookingId)).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data || data.teacher_user_id !== req.teacherUser.id) return { code: 404, error: 'Not found.' };
    if (data.status !== 'open' || Date.parse(data.deadline_at) <= now()) return { code: 409, error: 'This lesson was already decided.' };
    return { row: data };
  };

  app.get('/api/dashboard/absence-cases/pending', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('lesson_absence_cases').select('booking_id, deadline_at')
        .eq('teacher_user_id', req.teacherUser.id).eq('status', 'open').gte('deadline_at', new Date(now()).toISOString())
        .order('deadline_at', { ascending: true }).limit(20);
      if (error) throw new Error(error.message);
      const byId = await lessons(client, (data || []).map((r: any) => r.booking_id));
      res.json({ pending: (data || []).map((r: any) => ({ bookingId: r.booking_id, deadlineAt: r.deadline_at, lesson: lessonOf(byId.get(r.booking_id)) })) });
    } catch (err) {
      console.error('[GET absence-cases/pending]', err);
      res.status(500).json({ error: 'Could not load this.' });
    }
  });

  app.post('/api/dashboard/absence-cases/:bookingId/confirm', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const own = await ownOpen(client, req);
      if (!own.row) return res.status(own.code).json({ error: own.error });
      if (!(await finalizeAbsence(client, own.row.booking_id, 'open', 'teacher_absent', 'confirmed', {}, deps))) return res.status(409).json({ error: 'This lesson was already decided.' });
      res.json({ success: true });
    } catch (err) {
      console.error('[POST absence-cases/confirm]', err);
      res.status(500).json({ error: 'Could not save it. Please try again.' });
    }
  });

  app.post('/api/dashboard/absence-cases/:bookingId/appeal', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < APPEAL_MIN || reason.length > APPEAL_MAX) return res.status(400).json({ error: `Write the reason (${APPEAL_MIN} to ${APPEAL_MAX} characters).` });
    try {
      const own = await ownOpen(client, req);
      if (!own.row) return res.status(own.code).json({ error: own.error });
      const { data: done, error } = await client.from('lesson_absence_cases')
        .update({ status: 'appealed', appeal_reason: reason, appealed_at: new Date(now()).toISOString() })
        .eq('booking_id', own.row.booking_id).eq('status', 'open').select('booking_id');
      if (error) throw new Error(error.message);
      if (!done?.length) return res.status(409).json({ error: 'This lesson was already decided.' });
      await notifyAppeal(client, req.teacherUser.display_name || 'A teacher', deps);
      res.json({ success: true });
    } catch (err) {
      console.error('[POST absence-cases/appeal]', err);
      res.status(500).json({ error: 'Could not send it. Please try again.' });
    }
  });

  app.get('/api/admin/absence-cases', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('lesson_absence_cases')
        .select('booking_id, teacher_user_id, status, resolution, outcome, appeal_reason, admin_note, deadline_at, appealed_at, decided_at, created_at')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      const [byId, staff] = await Promise.all([lessons(client, (data || []).map((r: any) => r.booking_id)), deps.listStaff()]);
      const names = new Map(staff.map((s) => [s.id, s.name]));
      res.json({
        items: (data || []).map((r: any) => ({
          bookingId: r.booking_id, teacherId: r.teacher_user_id, teacherName: names.get(r.teacher_user_id) || null,
          status: r.status, resolution: r.resolution, outcome: r.outcome, appealReason: r.appeal_reason, adminNote: r.admin_note,
          deadlineAt: r.deadline_at, appealedAt: r.appealed_at, decidedAt: r.decided_at, createdAt: r.created_at, lesson: lessonOf(byId.get(r.booking_id)),
        })),
      });
    } catch (err) {
      console.error('[GET admin/absence-cases]', err);
      res.status(500).json({ error: 'Could not load the appeals.' });
    }
  });

  app.post('/api/admin/absence-cases/:bookingId', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const action = req.body?.action;
    const outcome = req.body?.outcome as AbsenceOutcome;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    if (action !== 'accept' && action !== 'reject') return res.status(400).json({ error: 'Choose accept or reject.' });
    if (action === 'accept' && !APPEAL_OUTCOMES.includes(outcome)) return res.status(400).json({ error: 'Pick what really happened.' });
    if (note.length > NOTE_MAX) return res.status(400).json({ error: `Keep the note under ${NOTE_MAX} characters.` });
    try {
      const ok = await finalizeAbsence(client, String(req.params.bookingId), 'appealed', action === 'accept' ? outcome : 'teacher_absent',
        action === 'accept' ? 'appeal_accepted' : 'appeal_rejected', { decidedBy: req.teacherUser.id, adminNote: note || null }, deps);
      if (!ok) return res.status(409).json({ error: 'This appeal is not waiting for a decision.' });
      res.json({ success: true });
    } catch (err: any) {
      console.error('[POST admin/absence-cases]', err);
      res.status(500).json({ error: 'Could not save the decision.' });
    }
  });
}
