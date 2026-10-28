import express from 'express';
import { buildStatement, currentMonth, monthRange, round2, OUTCOME_LABELS, type PayAdjustment, type PayLesson } from '../payroll/payroll.js';
import { sendEmail } from '../notifications/emailService.js';
import { renderTeacherNotification } from '../notifications/emailTemplates.js';
import { resolveEmailLanguage } from '../notifications/dispatcher.js';
import { notifyUser, notifySuperAdmins } from '../notifications/inbox.js';

/**
 * Teacher pay routes (launch plan D, owner decisions 2026-10-28).
 * - Teacher: GET /api/teacher-pay/me — their own month and payslips. Kept outside /api/dashboard on purpose: that
 *   prefix strips every money field for teachers (students' money), and this is the teacher's own pay.
 * - Super admin: /api/dashboard/payroll — rates, bonuses/deductions, record the transfer (sends the payslip).
 * - Lesson not held: teacher absent (admin) or technical problem (the lesson's teacher or admin); the student gets the lesson back.
 * Amounts are always computed here from the rate and the lessons; nothing about what students paid is read.
 */

type Middleware = (req: any, res: any, next: any) => any;
export interface StaffAccount { id: string; name: string; email: string; role: string }

const CURRENCY = /^[A-Z]{3}$/;

async function loadMonth(client: any, teacherId: string, month: string) {
  const range = monthRange(month)!;
  const [{ data: rate }, { data: bookings }, { data: adj }, { data: payout }] = await Promise.all([
    client.from('teacher_pay_rates').select('hourly_rate, currency').eq('teacher_user_id', teacherId).maybeSingle(),
    client.from('bookings')
      .select('id, reference_code, scheduled_start, duration_minutes, status, booking_type, not_held_reason, contact_name')
      .eq('teacher_id', teacherId).gte('scheduled_start', range.start).lt('scheduled_start', range.end),
    client.from('teacher_pay_adjustments').select('id, amount, reason, created_at').eq('teacher_user_id', teacherId).eq('month', range.firstDay).order('created_at'),
    client.from('teacher_payouts').select('id, amount, currency, method, reference, paid_at, statement').eq('teacher_user_id', teacherId).eq('month', range.firstDay).maybeSingle()
  ]);
  const lessons: PayLesson[] = (bookings || []).map((b: any) => ({
    id: b.id, referenceCode: b.reference_code, scheduledStart: b.scheduled_start, durationMinutes: b.duration_minutes,
    status: b.status, bookingType: b.booking_type, notHeldReason: b.not_held_reason, learnerName: b.contact_name
  }));
  const adjustments: PayAdjustment[] = (adj || []).map((a: any) => ({ id: a.id, amount: Number(a.amount), reason: a.reason, createdAt: a.created_at }));
  const statement = buildStatement(month, rate ? { hourlyRate: Number(rate.hourly_rate), currency: rate.currency } : null, lessons, adjustments);
  return { statement, payout: payout ? { ...payout, amount: Number(payout.amount) } : null };
}

const validMonth = (m: any) => (typeof m === 'string' && monthRange(m) ? m : null);

export function registerPayrollRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  listStaff: () => Promise<StaffAccount[]>;
}) {
  const db = (res: any) => {
    const c = deps.getClient();
    if (!c) res.status(503).json({ error: 'Database service unavailable.' });
    return c;
  };

  // Teacher: their own month (grows with each recorded lesson) and the payslips so far.
  app.get('/api/teacher-pay/me', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const month = validMonth(req.query.month) || currentMonth();
    try {
      const { statement, payout } = await loadMonth(client, req.teacherUser.id, month);
      const { data: history } = await client.from('teacher_payouts')
        .select('month, amount, currency, method, reference, paid_at').eq('teacher_user_id', req.teacherUser.id)
        .order('month', { ascending: false }).limit(24);
      res.json({ statement, payout, history: (history || []).map((h: any) => ({ ...h, amount: Number(h.amount) })) });
    } catch (err) {
      console.error('[GET /api/teacher-pay/me]', err);
      res.status(500).json({ error: 'Could not load your pay.' });
    }
  });

  // Admin: every teacher's month at a glance.
  app.get('/api/dashboard/payroll', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const month = validMonth(req.query.month) || currentMonth();
    try {
      const staff = await deps.listStaff();
      const rows = await Promise.all(staff.map(async (t) => {
        const { statement, payout } = await loadMonth(client, t.id, month);
        return { teacherId: t.id, name: t.name, role: t.role, statement, payout };
      }));
      // Teachers with nothing this month and no rate stay listed so a rate can be set.
      res.json({ month, isPast: month < currentMonth(), teachers: rows });
    } catch (err) {
      console.error('[GET /api/dashboard/payroll]', err);
      res.status(500).json({ error: 'Could not load payroll.' });
    }
  });

  app.put('/api/dashboard/payroll/rates/:teacherId', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const hourlyRate = Number(req.body?.hourlyRate);
    const currency = String(req.body?.currency || '').trim().toUpperCase();
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 100000) return res.status(400).json({ error: 'Enter an hourly rate of 0 or more.' });
    if (!CURRENCY.test(currency)) return res.status(400).json({ error: 'Currency is a 3-letter code, like EGP or USD.' });
    const staff = await deps.listStaff();
    if (!staff.some((s) => s.id === req.params.teacherId)) return res.status(404).json({ error: 'Teacher not found.' });
    const { error } = await client.from('teacher_pay_rates').upsert({
      teacher_user_id: req.params.teacherId, hourly_rate: round2(hourlyRate), currency, updated_by: req.teacherUser.id, updated_at: new Date().toISOString()
    });
    if (error) return res.status(500).json({ error: 'Could not save the rate.' });
    res.json({ success: true });
  });

  const monthIsPaid = async (client: any, teacherId: string, firstDay: string) => {
    const { data } = await client.from('teacher_payouts').select('id').eq('teacher_user_id', teacherId).eq('month', firstDay).maybeSingle();
    return Boolean(data);
  };

  app.post('/api/dashboard/payroll/adjustments', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const month = validMonth(req.body?.month);
    const amount = round2(Number(req.body?.amount));
    const reason = String(req.body?.reason || '').trim();
    const teacherId = String(req.body?.teacherId || '');
    if (!month) return res.status(400).json({ error: 'Pick a month.' });
    if (!Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 1000000) return res.status(400).json({ error: 'Enter an amount (negative for a deduction).' });
    if (reason.length < 3 || reason.length > 500) return res.status(400).json({ error: 'Write the reason (3 to 500 characters).' });
    const firstDay = monthRange(month)!.firstDay;
    if (await monthIsPaid(client, teacherId, firstDay)) return res.status(409).json({ error: 'This month is already paid.' });
    const { error } = await client.from('teacher_pay_adjustments').insert({ teacher_user_id: teacherId, month: firstDay, amount, reason, created_by: req.teacherUser.id });
    if (error) return res.status(400).json({ error: 'Could not add it. Check the teacher and try again.' });
    res.json({ success: true });
  });

  app.delete('/api/dashboard/payroll/adjustments/:id', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const { data: adj } = await client.from('teacher_pay_adjustments').select('id, teacher_user_id, month').eq('id', req.params.id).maybeSingle();
    if (!adj) return res.status(404).json({ error: 'Not found.' });
    if (await monthIsPaid(client, adj.teacher_user_id, adj.month)) return res.status(409).json({ error: 'This month is already paid.' });
    await client.from('teacher_pay_adjustments').delete().eq('id', adj.id);
    res.json({ success: true });
  });

  // Record the transfer for a closed month: the amount is the statement's, frozen with its lines; the teacher gets a payslip.
  app.post('/api/dashboard/payroll/payouts', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const month = validMonth(req.body?.month);
    const teacherId = String(req.body?.teacherId || '');
    const method = String(req.body?.method || '').trim();
    const reference = String(req.body?.reference || '').trim() || null;
    if (!month) return res.status(400).json({ error: 'Pick a month.' });
    if (month >= currentMonth()) return res.status(400).json({ error: 'A month is paid after it ends.' });
    if (method.length < 2 || method.length > 60) return res.status(400).json({ error: 'Write how it was sent (bank, Instapay, Wise...).' });
    if (reference && reference.length > 200) return res.status(400).json({ error: 'The reference is too long.' });
    const teacher = (await deps.listStaff()).find((s) => s.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found.' });
    try {
      const { statement, payout } = await loadMonth(client, teacherId, month);
      if (payout) return res.status(409).json({ error: 'This month is already paid.' });
      if (statement.hourlyRate === null) return res.status(400).json({ error: 'Set this teacher\'s hourly rate first.' });
      if (statement.awaitingCount > 0 && req.body?.confirmAwaiting !== true) {
        return res.status(409).json({ error: `${statement.awaitingCount} lesson(s) have no outcome yet and are not counted.`, code: 'AWAITING_OUTCOMES', awaitingCount: statement.awaitingCount });
      }
      const { error } = await client.from('teacher_payouts').insert({
        teacher_user_id: teacherId, month: monthRange(month)!.firstDay, amount: statement.total, currency: statement.currency,
        method, reference, statement, recorded_by: req.teacherUser.id
      });
      if (error) return res.status(409).json({ error: 'Could not record it (already paid?).' });

      const hours = round2(statement.paidMinutes / 60);
      const money = (n: number) => `${n.toFixed(2)} ${statement.currency}`;
      const title = { en: `Your pay for ${month} was sent`, ar: `مرتب شهر ${month} اتبعت` };
      const body = { en: `${money(statement.total)} by ${method}.`, ar: `${money(statement.total)} عن طريق ${method}.` };
      await notifyUser(client, { userId: teacherId, staff: true }, { kind: 'payslip', title, body, link: '/dashboard/pay' });
      try {
        const lang = await resolveEmailLanguage(teacher.email);
        const rows: Array<[string, string, unknown]> = [
          ['Month', 'الشهر', month],
          ['Lessons counted', 'الحصص المحسوبة', statement.paidLessons],
          ['Hours', 'الساعات', hours],
          ['Hourly rate', 'سعر الساعة', money(statement.hourlyRate)],
          ['Lessons', 'الحصص', money(statement.lessonsTotal)],
          ...statement.adjustments.map((a) => [a.amount > 0 ? 'Bonus' : 'Deduction', a.amount > 0 ? 'مكافأة' : 'خصم', `${money(a.amount)} · ${a.reason}`] as [string, string, unknown]),
          ['Total', 'الإجمالي', money(statement.total)],
          ['Sent by', 'طريقة التحويل', method],
          ['Reference', 'المرجع', reference]
        ];
        const mail = renderTeacherNotification({ eventType: 'payslip', title: title.en, summary: body.en, summaryAr: body.ar, details: rows, lang, actionUrl: undefined });
        await sendEmail({ to: teacher.email, toName: teacher.name, ...mail });
      } catch (err) {
        console.warn('[Payroll] payslip email failed', err);
      }
      res.json({ success: true, amount: statement.total, currency: statement.currency });
    } catch (err) {
      console.error('[POST /api/dashboard/payroll/payouts]', err);
      res.status(500).json({ error: 'Could not record the payment.' });
    }
  });

  // A lesson that did not happen: teacher absent (admin only) or a technical problem (its teacher or admin).
  app.post('/api/dashboard/bookings/:id/not-held', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const reason = req.body?.reason;
    if (reason !== 'teacher_absent' && reason !== 'technical') return res.status(400).json({ error: 'Pick what happened.' });
    const isAdmin = req.teacherUser?.role === 'super_admin';
    const { data: booking } = await client.from('bookings').select('id, teacher_id, reference_code, contact_name').eq('id', req.params.id).maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
    if (!isAdmin && (reason === 'teacher_absent' || booking.teacher_id !== req.teacherUser.id)) {
      return res.status(403).json({ error: 'Only the admin can record this.' });
    }
    const { data, error } = await client.rpc('record_lesson_not_held', { p_booking_id: booking.id, p_reason: reason });
    if (error) return res.status(400).json({ error: error.message || 'Could not record it.' });
    // The student gets told their lesson is back; the admin is alerted when a teacher reports a technical problem.
    if (data?.creditId) {
      const { data: credit } = await client.from('package_entitlements').select('purchaser_account_id').eq('id', data.creditId).maybeSingle();
      if (credit?.purchaser_account_id) {
        await notifyUser(client, { userId: credit.purchaser_account_id }, {
          kind: 'lesson_not_held',
          title: { en: 'Your lesson is back in your wallet', ar: 'حصتك رجعت لمحفظتك' },
          body: { en: 'A lesson could not take place, so you have a lesson credit to book again. We are sorry.', ar: 'حصة ما اتعملتش، فرجعتلك كرصيد تحجز بيه تاني. نعتذر لك.' },
          link: '/student/wallet'
        });
      }
    }
    if (!isAdmin) {
      await notifySuperAdmins(client, {
        kind: 'lesson_not_held',
        title: { en: 'Lesson not held: technical problem', ar: 'حصة ما اتعملتش: مشكلة تقنية' },
        body: { en: `${booking.contact_name || 'A lesson'} (${booking.reference_code}) was marked as a technical problem by the teacher.`, ar: `${booking.contact_name || 'حصة'} (${booking.reference_code}) المعلم سجّلها مشكلة تقنية.` },
        link: '/dashboard/bookings'
      });
    }
    res.json({ success: true, creditGiven: Boolean(data?.creditId), label: OUTCOME_LABELS[reason as 'technical'] });
  });
}
