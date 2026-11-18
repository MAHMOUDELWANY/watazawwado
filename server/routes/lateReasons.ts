import express from 'express';
import { monthRange, round2 } from '../payroll/payroll.js';
import { notifySuperAdmins, type InboxNotice } from '../notifications/inbox.js';
import type { StaffAccount } from './payroll.js';

/**
 * Classroom Task 10: written reasons for teacher lateness and their review.
 * - Teacher: GET /api/dashboard/late-reasons/pending, POST /api/dashboard/late-reasons/:bookingId (pending -> sent).
 * - Super admin: GET /api/admin/late-reasons, POST /api/admin/late-reasons/:bookingId { action: 'excuse' | 'deduct' }.
 *   A deduction is a teacher_pay_adjustments row like the payroll page makes, in the lesson's month.
 */
type Middleware = (req: any, res: any, next: any) => any;

const REASON_MIN = 10;
const REASON_MAX = 2000;
const NOTE_MAX = 400; // leaves room in the 500-char adjustment reason for the lesson prefix
const OPEN = ['pending', 'sent'];
const LESSON_COLS = 'id, reference_code, scheduled_start, duration_minutes, contact_name';

const lessonOf = (b: any) => (b ? { referenceCode: b.reference_code ?? null, scheduledStart: b.scheduled_start, durationMinutes: b.duration_minutes ?? null, learnerName: b.contact_name ?? null } : null);

export function registerLateReasonRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  listStaff: () => Promise<StaffAccount[]>;
  notifyAdmins?: (client: any, notice: InboxNotice) => Promise<void>;
}) {
  const notifyAdmins = deps.notifyAdmins ?? notifySuperAdmins;
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

  // Teacher: drives the gate over the dashboard. Shows again after sign-in until every row is answered.
  app.get('/api/dashboard/late-reasons/pending', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('teacher_late_reasons').select('booking_id, late_minutes, created_at')
        .eq('teacher_user_id', req.teacherUser.id).eq('status', 'pending').order('created_at', { ascending: true }).limit(20);
      if (error) throw new Error(error.message);
      const byId = await lessons(client, (data || []).map((r: any) => r.booking_id));
      res.json({ pending: (data || []).map((r: any) => ({ bookingId: r.booking_id, lateMinutes: r.late_minutes, lesson: lessonOf(byId.get(r.booking_id)) })) });
    } catch (err) {
      console.error('[GET late-reasons/pending]', err);
      res.status(500).json({ error: 'Could not load this.' });
    }
  });

  app.post('/api/dashboard/late-reasons/:bookingId', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (reason.length < REASON_MIN || reason.length > REASON_MAX) return res.status(400).json({ error: `Write the reason (${REASON_MIN} to ${REASON_MAX} characters).` });
    try {
      const { data: row, error } = await client.from('teacher_late_reasons').select('booking_id, teacher_user_id, late_minutes, status')
        .eq('booking_id', String(req.params.bookingId)).maybeSingle();
      if (error) throw new Error(error.message);
      // Someone else's lesson looks the same as no row.
      if (!row || row.teacher_user_id !== req.teacherUser.id) return res.status(404).json({ error: 'Not found.' });
      if (row.status !== 'pending') return res.status(409).json({ error: 'This reason was already sent.' });
      const { data: done, error: upErr } = await client.from('teacher_late_reasons').update({ reason, status: 'sent' })
        .eq('booking_id', row.booking_id).eq('status', 'pending').select('booking_id');
      if (upErr) throw new Error(upErr.message);
      if (!done?.length) return res.status(409).json({ error: 'This reason was already sent.' });
      await notifyAdmins(client, {
        kind: 'late_reason',
        title: { en: 'A teacher sent a late reason', ar: 'معلم أرسل سبب التأخير' },
        body: { en: `${req.teacherUser.display_name || 'A teacher'} was ${row.late_minutes} minutes late and wrote why.`, ar: `${req.teacherUser.display_name || 'معلم'} تأخر ${row.late_minutes} دقيقة وكتب السبب.` },
        link: '/dashboard/late-reasons',
      });
      res.json({ success: true });
    } catch (err) {
      console.error('[POST late-reasons]', err);
      res.status(500).json({ error: 'Could not send it. Please try again.' });
    }
  });

  app.get('/api/admin/late-reasons', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const { data, error } = await client.from('teacher_late_reasons')
        .select('booking_id, teacher_user_id, late_minutes, reason, status, admin_note, reviewed_at, created_at')
        .order('created_at', { ascending: false }).limit(200);
      if (error) throw new Error(error.message);
      const [byId, staff] = await Promise.all([lessons(client, (data || []).map((r: any) => r.booking_id)), deps.listStaff()]);
      const names = new Map(staff.map((s) => [s.id, s.name]));
      res.json({
        items: (data || []).map((r: any) => ({
          bookingId: r.booking_id, teacherId: r.teacher_user_id, teacherName: names.get(r.teacher_user_id) || null,
          lateMinutes: r.late_minutes, reason: r.reason, status: r.status, adminNote: r.admin_note, reviewedAt: r.reviewed_at,
          createdAt: r.created_at, lesson: lessonOf(byId.get(r.booking_id)),
        })),
      });
    } catch (err) {
      console.error('[GET admin/late-reasons]', err);
      res.status(500).json({ error: 'Could not load late reasons.' });
    }
  });

  app.post('/api/admin/late-reasons/:bookingId', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const action = req.body?.action;
    const note = typeof req.body?.note === 'string' ? req.body.note.trim() : '';
    const cents = Number(req.body?.amountCents);
    if (action !== 'excuse' && action !== 'deduct') return res.status(400).json({ error: 'Choose excuse or deduct.' });
    if (note.length < 3 || note.length > NOTE_MAX) return res.status(400).json({ error: `Write a note (3 to ${NOTE_MAX} characters).` });
    if (action === 'deduct' && (!Number.isInteger(cents) || cents < 1 || cents > 100_000_000)) return res.status(400).json({ error: 'Enter the amount to deduct.' });
    try {
      const { data: row, error } = await client.from('teacher_late_reasons').select('booking_id, teacher_user_id, late_minutes, status')
        .eq('booking_id', String(req.params.bookingId)).maybeSingle();
      if (error) throw new Error(error.message);
      if (!row) return res.status(404).json({ error: 'Not found.' });
      if (!OPEN.includes(row.status)) return res.status(409).json({ error: 'This was already reviewed.' });

      let adjustment: any = null;
      if (action === 'deduct') {
        const { data: b, error: bErr } = await client.from('bookings').select(LESSON_COLS).eq('id', row.booking_id).maybeSingle();
        if (bErr) throw new Error(bErr.message);
        const range = b ? monthRange(String(b.scheduled_start).slice(0, 7)) : null;
        if (!range) return res.status(404).json({ error: 'Lesson not found.' });
        const { data: paid } = await client.from('teacher_payouts').select('id').eq('teacher_user_id', row.teacher_user_id).eq('month', range.firstDay).maybeSingle();
        if (paid) return res.status(409).json({ error: 'This month is already paid.' });
        adjustment = {
          teacher_user_id: row.teacher_user_id, month: range.firstDay, amount: -round2(cents / 100),
          reason: `Late ${row.late_minutes} min to lesson ${b.reference_code || row.booking_id}: ${note}`, created_by: req.teacherUser.id,
        };
      }

      // Claim the review first, so two clicks can never deduct twice.
      const { data: claimed, error: upErr } = await client.from('teacher_late_reasons')
        .update({ status: action === 'deduct' ? 'deducted' : 'excused', admin_note: note, reviewed_by: req.teacherUser.id, reviewed_at: new Date().toISOString() })
        .eq('booking_id', row.booking_id).in('status', OPEN).select('booking_id');
      if (upErr) throw new Error(upErr.message);
      if (!claimed?.length) return res.status(409).json({ error: 'This was already reviewed.' });

      if (adjustment) {
        const { error: insErr } = await client.from('teacher_pay_adjustments').insert(adjustment);
        if (insErr) {
          // Put the row back so the review can be done again.
          await client.from('teacher_late_reasons').update({ status: row.status, admin_note: null, reviewed_by: null, reviewed_at: null }).eq('booking_id', row.booking_id);
          return res.status(400).json({ error: 'Could not add the deduction. Check the teacher and try again.' });
        }
      }
      res.json({ success: true });
    } catch (err) {
      console.error('[POST admin/late-reasons]', err);
      res.status(500).json({ error: 'Could not save the review.' });
    }
  });
}
