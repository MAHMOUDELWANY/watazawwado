import express from 'express';
import { createStripeCheckoutSession, type StripeSessionVerification } from '../payment/stripeService.js';
import { notifySuperAdmins, notifyUser, resolveLearnerAccount } from '../notifications/inbox.js';
import { isUuid } from './progress.js';

/**
 * NX-07 "Sponsor a learner" (owner decisions 2026-11-02): one general sadaqah fund (never zakat).
 * Anyone with an account gives by a number of lessons or any amount (Stripe); families ask for lessons for a learner
 * with a short reason only the super admin reads; the academy decides, and may also give without a request. A grant
 * is one catalog package (4/8/12 lessons) placed in the learner's wallet; the fund pays the package's normal price
 * (grant_sponsorship_atomic). No names are shown to anyone but the super admin.
 */
type Middleware = (req: any, res: any, next: any) => any;

/** One sponsored lesson = a 30-minute Quran lesson at its normal price (RULES.md §3: $9/hour). */
export const LESSON_UNIT_USD = 4.5;
export const LESSON_CHOICES = [4, 8, 12] as const;
export const MIN_AMOUNT_USD = 5;
export const MAX_AMOUNT_USD = 5000;

/** The amount a donation charges: lessons × the lesson price, or a free amount (cents kept, bounds enforced). */
export function donationAmount(body: any): { amount: number; lessons: number | null } | { error: string } {
  const lessons = Number(body?.lessons);
  if (body?.lessons != null) {
    if (!(LESSON_CHOICES as readonly number[]).includes(lessons)) return { error: 'Choose 4, 8 or 12 lessons.' };
    return { amount: Math.round(lessons * LESSON_UNIT_USD * 100) / 100, lessons };
  }
  const amount = Math.round(Number(body?.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount < MIN_AMOUNT_USD || amount > MAX_AMOUNT_USD) {
    return { error: `Give between $${MIN_AMOUNT_USD} and $${MAX_AMOUNT_USD}.` };
  }
  return { amount, lessons: null };
}

/**
 * Confirms a paid donation from the Stripe session the server created (webhook or return page). Idempotent: only a
 * pending row whose session and amount match becomes confirmed.
 */
export async function confirmDonationSession(client: any, session: StripeSessionVerification): Promise<{ paymentId: string; isIdempotent: boolean }> {
  const id = session.metadata?.targetId || '';
  if (!isUuid(id)) throw new Error('Unknown donation.');
  const { data: row } = await client.from('sponsorship_donations').select('id, amount_usd, status, stripe_session_id').eq('id', id).maybeSingle();
  if (!row || row.stripe_session_id !== session.id) throw new Error('Unknown donation.');
  if (row.status === 'confirmed') return { paymentId: row.id, isIdempotent: true };
  const paid = Math.round(Number(session.amountTotal || 0) * 100) / 100;
  if (Math.abs(paid - Number(row.amount_usd)) > 0.01 || String(session.currency || 'USD').toUpperCase() !== 'USD') {
    console.error('[sponsorship] amount mismatch', { id, paid, expected: row.amount_usd });
    throw new Error('The paid amount does not match this donation.');
  }
  const { data: updated, error } = await client.from('sponsorship_donations')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString(), payment_reference: session.paymentIntent || session.id })
    .eq('id', id).eq('status', 'pending').select('id').maybeSingle();
  if (error) throw new Error(error.message);
  if (updated) {
    await notifySuperAdmins(client, {
      kind: 'sponsorship_donation',
      title: { en: 'New sadaqah for the fund', ar: 'صدقة جديدة للصندوق' },
      body: { en: `$${Number(row.amount_usd).toFixed(2)} was given to the sponsorship fund.`, ar: `اتبرع حد بـ ${Number(row.amount_usd).toFixed(2)} دولار لصندوق الكفالة.` },
      link: '/dashboard/sponsorship',
    });
  }
  return { paymentId: id, isIdempotent: !updated };
}

const GRANT_ERRORS: Record<string, string> = {
  FUND_TOO_LOW: 'The fund does not hold enough for this package yet.',
  REQUEST_NOT_OPEN: 'This request was already decided.',
  PACKAGE_NOT_AVAILABLE: 'That package is not available.',
};

export function registerSponsorshipRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  rateLimit: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; isPrimary?: boolean }>>;
  appOrigin: (req: any) => string;
}) {
  const db = (res: any) => {
    const client = deps.getClient();
    if (!client) res.status(503).json({ error: 'Database service unavailable.' });
    return client;
  };
  const balanceOf = async (client: any) => {
    const { data, error } = await client.rpc('sponsorship_fund_balance');
    if (error) throw new Error(error.message);
    return Math.max(0, Number(data) || 0);
  };

  // Family: the fund, my sadaqah and my requests.
  app.get('/api/student/sponsorship', deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    try {
      const learners = await deps.getLearners(client, req);
      const names = new Map(learners.map((l) => [l.id, l.name]));
      const [balance, { data: mine }, { data: requests }, { count: helped }] = await Promise.all([
        balanceOf(client),
        isUuid(userId) ? client.from('sponsorship_donations').select('amount_usd, lessons, status, created_at').eq('donor_user_id', userId).eq('status', 'confirmed').order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
        learners.length ? client.from('sponsorship_requests').select('id, learner_student_id, lessons_requested, status, admin_note, created_at').in('learner_student_id', learners.map((l) => l.id)).order('created_at', { ascending: false }).limit(20) : Promise.resolve({ data: [] }),
        client.from('sponsorship_grants').select('id', { count: 'exact', head: true }),
      ]);
      return res.json({
        fund: { balanceUsd: Math.round(balance * 100) / 100, lessonsApprox: Math.floor(balance / LESSON_UNIT_USD), grants: helped || 0 },
        lessonUnitUsd: LESSON_UNIT_USD, lessonChoices: LESSON_CHOICES, minAmountUsd: MIN_AMOUNT_USD, maxAmountUsd: MAX_AMOUNT_USD,
        myDonations: (mine || []).map((d: any) => ({ amountUsd: Number(d.amount_usd), lessons: d.lessons, createdAt: d.created_at })),
        requests: (requests || []).map((r: any) => ({
          id: r.id, learnerId: r.learner_student_id, learnerName: names.get(r.learner_student_id) || null, lessons: r.lessons_requested,
          status: r.status, note: r.status === 'declined' ? r.admin_note : null, createdAt: r.created_at,
        })),
        learners: learners.map((l) => ({ id: l.id, name: l.name })),
      });
    } catch (err: any) {
      console.error('[sponsorship family]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the sponsorship page.' });
    }
  });

  // Family: give sadaqah (Stripe checkout; confirmed by the webhook or the return page).
  app.post('/api/student/sponsorship/donate', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    if (!isUuid(userId)) return res.status(403).json({ error: 'Please sign in with your own account.' });
    const parsed = donationAmount(req.body);
    if ('error' in parsed) return res.status(400).json({ error: parsed.error });
    try {
      const { data: row, error } = await client.from('sponsorship_donations')
        .insert({ donor_user_id: userId, donor_email: req.studentUser?.email || null, amount_usd: parsed.amount, lessons: parsed.lessons })
        .select('id').single();
      if (error) throw new Error(error.message);
      const origin = deps.appOrigin(req);
      const session = await createStripeCheckoutSession({
        amount: parsed.amount,
        currency: 'USD',
        title: parsed.lessons ? `Sadaqah: ${parsed.lessons} lessons for a learner` : 'Sadaqah for the sponsorship fund',
        description: 'Watazawwado Academy sponsorship fund (sadaqah)',
        customerEmail: req.studentUser?.email,
        metadata: { targetType: 'donation', targetId: row.id },
        successUrl: `${origin}/student/sponsor?session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${origin}/student/sponsor?cancelled=1`,
      });
      await client.from('sponsorship_donations').update({ stripe_session_id: session.id }).eq('id', row.id);
      return res.json({ sessionUrl: session.url, amountUsd: parsed.amount });
    } catch (err: any) {
      console.error('[sponsorship donate]', err?.message || err);
      return res.status(500).json({ error: 'Could not start the payment. Please try again.' });
    }
  });

  // Family: ask for lessons for one learner (one open request per learner).
  app.post('/api/student/sponsorship/request', deps.rateLimit, deps.verifyStudentAuth, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const userId = req.studentUser?.auth_id;
    if (!isUuid(userId)) return res.status(403).json({ error: 'Please sign in with your own account.' });
    const learnerId = typeof req.body?.learnerId === 'string' ? req.body.learnerId : '';
    const lessons = Number(req.body?.lessons);
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim() : '';
    if (!(LESSON_CHOICES as readonly number[]).includes(lessons)) return res.status(400).json({ error: 'Choose 4, 8 or 12 lessons.' });
    if (reason.length < 10 || reason.length > 1000) return res.status(400).json({ error: 'Tell us in a line or two (10 to 1000 characters).' });
    const learners = await deps.getLearners(client, req);
    const learner = learners.find((l) => l.id === learnerId);
    if (!learner) return res.status(403).json({ error: 'Choose a learner on your account.' });
    const { error } = await client.from('sponsorship_requests').insert({ account_user_id: userId, learner_student_id: learnerId, lessons_requested: lessons, reason });
    if (error) {
      if (error.code === '23505') return res.status(409).json({ error: 'There is already an open request for this learner.' });
      console.error('[sponsorship request]', error.message);
      return res.status(500).json({ error: 'Could not send the request.' });
    }
    await notifySuperAdmins(client, {
      kind: 'sponsorship_request',
      title: { en: 'A family asked for sponsored lessons', ar: 'أسرة طلبت حصص من الكفالة' },
      body: { en: `${lessons} lessons for ${learner.name}.`, ar: `${lessons} حصص لـ ${learner.name}.` },
      link: '/dashboard/sponsorship',
    });
    return res.status(201).json({ sent: true });
  });

  // Super admin: the fund, donations, requests, grants and the packages a grant can be.
  app.get('/api/dashboard/admin/sponsorship', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (_req: any, res: any) => {
    const client = db(res); if (!client) return;
    try {
      const [balance, { data: donations }, { data: requests }, { data: grants }, { data: catalog }] = await Promise.all([
        balanceOf(client),
        client.from('sponsorship_donations').select('id, donor_email, amount_usd, lessons, status, created_at, confirmed_at').eq('status', 'confirmed').order('created_at', { ascending: false }).limit(100),
        client.from('sponsorship_requests').select('id, account_user_id, learner_student_id, lessons_requested, reason, status, admin_note, decided_at, created_at').order('created_at', { ascending: false }).limit(100),
        client.from('sponsorship_grants').select('id, learner_student_id, lessons, fund_cost_usd, granted_by, request_id, created_at').order('created_at', { ascending: false }).limit(100),
        client.from('package_catalog').select('id, name, lesson_count, price_amount, eligibility_rules').eq('is_active', true).order('lesson_count', { ascending: true }),
      ]);
      const learnerIds = [...new Set([...(requests || []).map((r: any) => r.learner_student_id), ...(grants || []).map((g: any) => g.learner_student_id)].filter(Boolean))];
      const { data: students } = learnerIds.length ? await client.from('students').select('id, name').in('id', learnerIds) : { data: [] };
      const nameOf = new Map((students || []).map((s: any) => [s.id, s.name]));
      return res.json({
        balanceUsd: Math.round(balance * 100) / 100,
        donations: (donations || []).map((d: any) => ({ ...d, amount_usd: Number(d.amount_usd) })),
        requests: (requests || []).map((r: any) => ({ ...r, learner_name: nameOf.get(r.learner_student_id) || null })),
        grants: (grants || []).map((g: any) => ({ ...g, fund_cost_usd: Number(g.fund_cost_usd), learner_name: nameOf.get(g.learner_student_id) || null })),
        packages: (catalog || []).map((c: any) => ({ id: c.id, name: c.name, nameAr: c.eligibility_rules?.name_ar || c.name, lessons: c.lesson_count, priceUsd: Number(c.price_amount) })),
      });
    } catch (err: any) {
      console.error('[sponsorship admin]', err?.message || err);
      return res.status(500).json({ error: 'Could not load the fund.' });
    }
  });

  // Super admin: find a learner to give a grant to without a request.
  app.get('/api/dashboard/admin/sponsorship/learners', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const q = String(req.query?.q || '').trim().replace(/[\\%_,()]/g, '').slice(0, 60);
    if (q.length < 2) return res.json({ learners: [] });
    const { data } = await client.from('students').select('id, name, email').ilike('name', `%${q}%`).limit(20);
    return res.json({ learners: data || [] });
  });

  // Super admin: give one package from the fund (to a request, or directly to a learner).
  app.post('/api/dashboard/admin/sponsorship/grant', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    const packageId = String(req.body?.packageCatalogId || '');
    const requestId = req.body?.requestId ? String(req.body.requestId) : null;
    let learnerId = String(req.body?.learnerId || '');
    if (!isUuid(packageId) || (requestId && !isUuid(requestId))) return res.status(400).json({ error: 'Choose a package.' });
    let accountId: string | null = null;
    if (requestId) {
      const { data: r } = await client.from('sponsorship_requests').select('account_user_id, learner_student_id').eq('id', requestId).maybeSingle();
      if (!r) return res.status(404).json({ error: 'Request not found.' });
      accountId = r.account_user_id; learnerId = r.learner_student_id;
    } else {
      if (!isUuid(learnerId)) return res.status(400).json({ error: 'Choose a learner.' });
      accountId = (await resolveLearnerAccount(client, learnerId)).userId;
    }
    if (!isUuid(accountId)) return res.status(409).json({ error: 'This learner has no family account to receive the lessons.' });
    const { data, error } = await client.rpc('grant_sponsorship_atomic', {
      p_account_user_id: accountId, p_learner_student_id: learnerId, p_package_catalog_id: packageId,
      p_request_id: requestId, p_granted_by: String(req.teacherUser?.email || 'admin'),
    });
    if (error) {
      const key = Object.keys(GRANT_ERRORS).find((k) => String(error.message || '').includes(k));
      if (key) return res.status(409).json({ error: GRANT_ERRORS[key], code: key });
      console.error('[sponsorship grant]', error.message);
      return res.status(500).json({ error: 'Could not give the grant.' });
    }
    await notifyUser(client, { userId: accountId }, {
      kind: 'sponsorship_granted',
      title: { en: 'Lessons are waiting for you', ar: 'فيه حصص مستنياك' },
      body: { en: `${data?.lessons} lessons were added to your wallet from the academy's sponsorship fund. Book them as usual.`, ar: `اتضافت ${data?.lessons} حصص لمحفظتك من صندوق الكفالة في الأكاديمية. احجزها عادي.` },
      link: '/student/wallet',
    });
    return res.json({ grant: data });
  });

  // Super admin: decline a request, with an optional kind note the family sees.
  app.post('/api/dashboard/admin/sponsorship/requests/:id/decline', deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    const client = db(res); if (!client) return;
    if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Request not found.' });
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 1000) || null : null;
    const { data, error } = await client.from('sponsorship_requests')
      .update({ status: 'declined', admin_note: note, decided_by: String(req.teacherUser?.email || 'admin'), decided_at: new Date().toISOString() })
      .eq('id', req.params.id).eq('status', 'pending').select('account_user_id').maybeSingle();
    if (error) { console.error('[sponsorship decline]', error.message); return res.status(500).json({ error: 'Could not save.' }); }
    if (!data) return res.status(409).json({ error: 'This request was already decided.' });
    await notifyUser(client, { userId: data.account_user_id }, {
      kind: 'sponsorship_declined',
      title: { en: 'About your sponsorship request', ar: 'بخصوص طلب الكفالة' },
      body: { en: note || 'We could not give lessons from the fund this time.', ar: note || 'معرفناش ندّي حصص من الصندوق المرة دي.' },
      link: '/student/sponsor',
    });
    return res.json({ declined: true });
  });
}
