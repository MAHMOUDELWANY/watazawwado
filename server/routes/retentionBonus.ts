import express from 'express';
import { summarizeQuarter, quarterRange, currentQuarter, bonusReasonPrefix, DEFAULT_MIN_LEARNERS, type RetentionLesson } from '../payroll/retention.js';
import type { StaffAccount } from './payroll.js';

/**
 * Quarterly retention bonus (RULES.md §2c, BACKLOG MK-02). Super admin only. Kept apart from the pay routes on
 * purpose: a teacher's pay never reads what students paid, but the bonus pool is built from full-price lessons.
 * Paying the bonus goes through the monthly pay adjustment (POST /api/dashboard/payroll/adjustments).
 */

type Middleware = (req: any, res: any, next: any) => any;

export function registerRetentionBonusRoutes(app: express.Express, deps: {
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

  const loadMinLearners = async (client: any) => {
    const { data } = await client.from('settings').select('value').eq('key', 'retention_bonus').maybeSingle();
    const n = Number((data?.value as any)?.min_learners);
    return Number.isInteger(n) && n >= 1 && n <= 100 ? n : DEFAULT_MIN_LEARNERS;
  };

  app.get('/api/dashboard/payroll/retention', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const quarter = typeof req.query.quarter === 'string' && quarterRange(req.query.quarter) ? req.query.quarter : currentQuarter();
    const range = quarterRange(quarter)!;
    try {
      const [staff, minLearners] = await Promise.all([deps.listStaff(), loadMinLearners(client)]);
      const rows = await Promise.all(staff.map(async (t) => {
        const results = await Promise.all([
          client.from('bookings')
            .select('id, student_id, contact_name, scheduled_start, duration_minutes, status, booking_type, package_entitlement_id, fee_amount_usd')
            .eq('teacher_id', t.id).gte('scheduled_start', range.start).lt('scheduled_start', range.end).limit(5000),
          client.from('bookings').select('student_id').eq('teacher_id', t.id).gte('scheduled_start', range.end)
            .in('status', ['pending', 'confirmed', 'rescheduled', 'completed']).not('student_id', 'is', null).limit(5000),
          client.from('teacher_change_requests').select('student_id, reason_type, initiator, decided_at, students:student_id(name)')
            .eq('from_teacher_id', t.id).eq('status', 'approved').gte('decided_at', range.start).lt('decided_at', range.end),
          client.from('teacher_pay_rates').select('currency').eq('teacher_user_id', t.id).maybeSingle(),
          client.from('teacher_pay_adjustments').select('month, amount, reason').eq('teacher_user_id', t.id).like('reason', `${bonusReasonPrefix(quarter)}%`),
        ]);
        // A failed read must not look like "no lessons" or "no discount": that would skew the pool.
        const failed = results.find((r: any) => r.error);
        if (failed) throw failed.error;
        const [{ data: bookings }, { data: later }, { data: moves }, { data: rate }, { data: paid }] = results as any[];
        const ids: string[] = (bookings || []).map((b: any) => b.id);
        const reds: any[] = [];
        for (let i = 0; i < ids.length; i += 150) { // keeps each request URL short
          const { data, error } = await client.from('discount_redemptions').select('target_id, list_amount, discount_amount')
            .eq('target_type', 'booking').in('target_id', ids.slice(i, i + 150)).in('status', ['reserved', 'redeemed']);
          if (error) throw error;
          reds.push(...(data || []));
        }
        const redByBooking = new Map(reds.map((r: any) => [r.target_id, { listAmount: Number(r.list_amount), discountAmount: Number(r.discount_amount) }]));
        const lessons: RetentionLesson[] = (bookings || []).map((b: any) => ({
          studentId: b.student_id, learnerName: b.contact_name, scheduledStart: b.scheduled_start, durationMinutes: b.duration_minutes,
          status: b.status, bookingType: b.booking_type, packageEntitlementId: b.package_entitlement_id,
          feeUsd: b.fee_amount_usd === null ? null : Number(b.fee_amount_usd), redemption: redByBooking.get(b.id) || null,
        }));
        const summary = summarizeQuarter({
          quarter, lessons, minLearners,
          laterStudentIds: new Set((later || []).map((l: any) => l.student_id)),
          moves: (moves || []).map((m: any) => ({
            studentId: m.student_id, reasonType: m.reason_type, initiator: m.initiator, decidedAt: m.decided_at,
            learnerName: (Array.isArray(m.students) ? m.students[0]?.name : m.students?.name) || null,
          })),
        });
        return { teacherId: t.id, name: t.name, currency: rate?.currency || 'USD', summary, paid: (paid || []).map((p: any) => ({ ...p, amount: Number(p.amount) })) };
      }));
      res.json({ quarter, minLearners, isOver: range.end <= new Date().toISOString(), teachers: rows });
    } catch (err) {
      console.error('[GET /api/dashboard/payroll/retention]', err);
      res.status(500).json({ error: 'Could not load the retention bonus.' });
    }
  });

  app.put('/api/dashboard/payroll/retention/settings', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const n = Number(req.body?.minLearners);
    if (!Number.isInteger(n) || n < 1 || n > 100) return res.status(400).json({ error: 'Minimum learners is a whole number from 1 to 100.' });
    const { error } = await client.from('settings').upsert({
      key: 'retention_bonus', value: { min_learners: n }, category: 'Teachers',
      description: 'Quarterly retention bonus: minimum learners a teacher taught in the quarter', updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) return res.status(500).json({ error: 'Could not save the setting.' });
    res.json({ minLearners: n });
  });

}
