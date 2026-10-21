import type express from 'express';
import { DateTime } from 'luxon';

/**
 * CRM-07: the account funnel, by sign-up week, with the people behind every number (no estimates, no ratios that
 * cannot be traced). An account is a students row with a login; its family is itself plus the children whose guardian
 * email is the account's email.
 *   signed_up → onboarded → trial_booked → trial_attended → first_paid → second_month
 * first_paid: a payment that was received (confirmed, or refunded later). second_month: a paid lesson attended at least
 * 28 days after the family's first attended paid lesson.
 */

export const FUNNEL_STEPS = ['signed_up', 'onboarded', 'trial_booked', 'trial_attended', 'first_paid', 'second_month'] as const;
export type FunnelStep = (typeof FUNNEL_STEPS)[number];

interface Person { id: string; name: string }
export interface FunnelCohort { weekStart: string; counts: Record<FunnelStep, number>; people: Record<FunnelStep, Person[]> }

export function buildAccountFunnel(input: {
  accounts: Array<{ id: string; name?: string | null; email?: string | null; onboarding_completed?: boolean | null; created_at: string }>;
  guardians: Array<{ student_id: string; parent_email?: string | null }>;
  bookings: Array<{ student_id: string | null; booking_type?: string | null; status?: string | null; scheduled_start?: string | null }>;
  payments: Array<{ student_id: string | null; status?: string | null }>;
  weeks?: number;
  now?: DateTime;
}): { steps: readonly FunnelStep[]; cohorts: FunnelCohort[] } {
  const zone = 'Africa/Cairo';
  const now = (input.now || DateTime.now()).setZone(zone);
  const weeks = Math.min(26, Math.max(1, input.weeks || 8));
  const firstWeek = now.startOf('week').minus({ weeks: weeks - 1 });

  const childrenByEmail = new Map<string, string[]>();
  for (const g of input.guardians) {
    const e = String(g.parent_email || '').toLowerCase().trim();
    if (!e || !g.student_id) continue;
    childrenByEmail.set(e, [...(childrenByEmail.get(e) || []), g.student_id]);
  }
  const bookingsBy = new Map<string, typeof input.bookings>();
  for (const b of input.bookings) if (b.student_id) bookingsBy.set(b.student_id, [...(bookingsBy.get(b.student_id) || []), b]);
  const paidStudents = new Set(input.payments.filter((p) => p.student_id && (p.status === 'confirmed' || p.status === 'refunded')).map((p) => p.student_id!));

  const cohorts = new Map<string, FunnelCohort>();
  for (let i = 0; i < weeks; i++) {
    const key = firstWeek.plus({ weeks: i }).toISODate()!;
    cohorts.set(key, {
      weekStart: key,
      counts: Object.fromEntries(FUNNEL_STEPS.map((s) => [s, 0])) as Record<FunnelStep, number>,
      people: Object.fromEntries(FUNNEL_STEPS.map((s) => [s, []])) as unknown as Record<FunnelStep, Person[]>
    });
  }

  for (const a of input.accounts) {
    const created = DateTime.fromISO(a.created_at).setZone(zone);
    if (!created.isValid || created < firstWeek) continue;
    const cohort = cohorts.get(created.startOf('week').toISODate()!);
    if (!cohort) continue;
    const family = [a.id, ...(childrenByEmail.get(String(a.email || '').toLowerCase().trim()) || [])];
    const fam = family.flatMap((id) => bookingsBy.get(id) || []);
    const trials = fam.filter((b) => b.booking_type === 'trial');
    const paidLessons = fam
      .filter((b) => b.booking_type !== 'trial' && b.status === 'completed' && b.scheduled_start)
      .map((b) => DateTime.fromISO(b.scheduled_start!).toMillis())
      .sort((x, y) => x - y);
    const reached: Record<FunnelStep, boolean> = {
      signed_up: true,
      onboarded: Boolean(a.onboarding_completed),
      trial_booked: trials.some((b) => b.status !== 'cancelled'),
      trial_attended: trials.some((b) => b.status === 'completed'),
      first_paid: family.some((id) => paidStudents.has(id)),
      second_month: paidLessons.length > 1 && paidLessons[paidLessons.length - 1] - paidLessons[0] >= 28 * 86_400_000
    };
    const person = { id: a.id, name: a.name || a.email || 'Account' };
    for (const s of FUNNEL_STEPS) {
      if (!reached[s]) continue;
      cohort.counts[s]++;
      cohort.people[s].push(person);
    }
  }
  return { steps: FUNNEL_STEPS, cohorts: [...cohorts.values()].reverse() };
}

type Middleware = (req: any, res: any, next: any) => any;

export function registerFunnelRoutes(app: express.Express, deps: { getClient: () => any; verifyTeacherAuth: Middleware; requireSuperAdmin: Middleware }) {
  app.get('/api/dashboard/admin/funnel', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = deps.getClient();
    if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    try {
      const weeks = Math.min(26, Math.max(1, Number(req.query?.weeks) || 8));
      const since = DateTime.now().setZone('Africa/Cairo').startOf('week').minus({ weeks: weeks - 1 }).toUTC().toISO()!;
      const { data: accounts, error } = await client
        .from('students')
        .select('id, name, email, onboarding_completed, created_at')
        .not('auth_user_id', 'is', null)
        .gte('created_at', since)
        .limit(5000);
      if (error) return res.status(500).json({ error: 'Could not build the funnel.' });
      const emails = [...new Set((accounts || []).map((a: any) => String(a.email || '').toLowerCase()).filter(Boolean))];
      const { data: guardians } = emails.length
        ? await client.from('guardians').select('student_id, parent_email').in('parent_email', emails)
        : { data: [] as any[] };
      const ids = [...new Set([...(accounts || []).map((a: any) => a.id), ...(guardians || []).map((g: any) => g.student_id)])];
      const [{ data: bookings }, { data: payments }] = ids.length
        ? await Promise.all([
            client.from('bookings').select('student_id, booking_type, status, scheduled_start').in('student_id', ids).limit(20000),
            client.from('payments').select('student_id, status').in('student_id', ids).limit(20000)
          ])
        : [{ data: [] }, { data: [] }];
      return res.json(buildAccountFunnel({ accounts: accounts || [], guardians: guardians || [], bookings: bookings || [], payments: payments || [], weeks }));
    } catch (err) {
      console.error('[GET /api/dashboard/admin/funnel]', err);
      return res.status(500).json({ error: 'Could not build the funnel.' });
    }
  });
}
