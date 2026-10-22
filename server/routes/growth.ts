import type express from 'express';
import {
  computeCheckout,
  checkCodeEligibility,
  parseGrowthSettings,
  validateGrowthSettings,
  normalizeCode,
  generateReferralCode,
  rejectionFromRpcMessage,
  CODE_PATTERN,
  CODE_REJECTION_TEXT,
  type CheckoutBreakdown,
  type CheckoutTarget,
  type CodeRejection,
  type DiscountCode,
  type GrowthSettings,
} from '../pricing/discounts.js';
import { round2 } from '../pricing/pricingEngine.js';
import { notifyUser, resolveLearnerAccount } from '../notifications/inbox.js';

/**
 * Discount codes, account balance and referrals (owner decisions 2026-10-22, RULES.md §4).
 *
 * Checkout flow (src/components/payment/InstantCheckoutModal.tsx):
 *   1. POST /api/checkout/quote  -> the breakdown the family sees (no writes).
 *   2. POST /api/checkout/apply  -> writes the code/balance and the new stored price (apply_checkout_discount_atomic).
 *      A total of 0 confirms the booking / activates the package right there.
 *   3. POST /api/payments/create-intent (unchanged) charges the stored price, so verification still matches to the cent.
 * Referral: the friend's welcome credit is added when they join (onboarding or the code box);
 * the inviter's credit when the friend's first paid lesson is completed (qualifyReferralForBooking).
 */

type Middleware = (req: any, res: any, next: any) => any;
type Learner = { id: string; name: string };

export interface GrowthDeps {
  getClient: () => any | null;
  rateLimit: Middleware;
  verifyStudentAuth: Middleware;
  verifyTeacherAuth: Middleware;
  requireSuperAdmin: Middleware;
  getLearners: (client: any, req: any) => Promise<Learner[]>;
  /** Runs after a code/balance covered the whole price (the target is already confirmed / active). */
  afterFreeConfirm?: (client: any, targetType: CheckoutTarget, targetId: string) => Promise<void>;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isUuid = (v: unknown): v is string => typeof v === 'string' && UUID_RE.test(v);

export async function loadGrowthSettings(client: any): Promise<GrowthSettings> {
  const { data } = await client.from('settings').select('value').eq('key', 'growth_program').maybeSingle();
  return parseGrowthSettings(data?.value);
}

export async function accountBalance(client: any, accountUserId: string): Promise<number> {
  if (!isUuid(accountUserId)) return 0;
  const { data } = await client.from('account_credit_ledger').select('amount_usd').eq('account_user_id', accountUserId);
  return round2((data || []).reduce((s: number, r: any) => s + Number(r.amount_usd || 0), 0));
}

/** Has this account paid for anything before (a confirmed payment or a paid package)? */
async function hasPaidBefore(client: any, accountUserId: string, learnerIds: string[]): Promise<boolean> {
  if (learnerIds.length) {
    const { count } = await client.from('payments').select('id', { count: 'exact', head: true })
      .in('student_id', learnerIds).eq('status', 'confirmed').gt('amount', 0);
    if ((count || 0) > 0) return true;
  }
  if (isUuid(accountUserId)) {
    const { count } = await client.from('package_entitlements').select('id', { count: 'exact', head: true })
      .eq('purchaser_account_id', accountUserId).eq('status', 'active').gt('price_paid', 0);
    if ((count || 0) > 0) return true;
    const { count: redeemed } = await client.from('discount_redemptions').select('id', { count: 'exact', head: true })
      .eq('account_user_id', accountUserId).eq('status', 'redeemed');
    if ((redeemed || 0) > 0) return true;
  }
  return false;
}

interface ResolvedTarget {
  targetType: CheckoutTarget;
  id: string;
  listAmount: number;
  baseAmount: number;
  liveCodeId: string | null;
  liveUseCredit: boolean;
}

/** Loads a payable booking/package the signed-in account owns, with its price before any code/balance. */
async function resolveTarget(client: any, req: any, deps: GrowthDeps, targetType: unknown, targetId: unknown): Promise<{ target?: ResolvedTarget; status?: number; error?: string }> {
  if ((targetType !== 'booking' && targetType !== 'package') || typeof targetId !== 'string' || !targetId.trim()) {
    return { status: 400, error: 'Valid targetType and targetId are required.' };
  }
  const learners = await deps.getLearners(client, req);
  const learnerIds = new Set(learners.map((l) => l.id));
  const id = targetId.trim();
  let row: any;
  let listAmount = 0;
  let stored = 0;

  if (targetType === 'booking') {
    let q = client.from('bookings').select('id, student_id, status, fee_amount_usd, payment_plan, hold_expires_at');
    q = isUuid(id) ? q.or(`id.eq.${id},reference_code.eq.${id}`) : q.eq('reference_code', id);
    const { data } = await q.maybeSingle();
    if (!data || !learnerIds.has(data.student_id)) return { status: 404, error: 'Booking not found.' };
    if (data.status !== 'pending') return { status: 400, error: 'This booking is not awaiting payment.' };
    if (data.payment_plan === 'pay_now' && data.hold_expires_at && new Date(data.hold_expires_at).getTime() <= Date.now()) {
      return { status: 410, error: 'Your reserved time has expired. Please choose a time again.' };
    }
    row = data;
    stored = Number(data.fee_amount_usd || 0);
    listAmount = stored;
  } else {
    if (!isUuid(id)) return { status: 404, error: 'Package not found.' };
    const { data } = await client.from('package_entitlements')
      .select('id, learner_student_id, purchaser_account_id, status, price_paid, purchased_quantity, package_catalog:package_catalog_id(price_amount, eligibility_rules)')
      .eq('id', id).maybeSingle();
    const ownsIt = data && (data.purchaser_account_id === req.studentUser?.auth_id || learnerIds.has(data.learner_student_id));
    if (!data || !ownsIt) return { status: 404, error: 'Package not found.' };
    if (data.status !== 'pending_payment') return { status: 400, error: 'This package is not awaiting payment.' };
    row = data;
    const cat: any = Array.isArray(data.package_catalog) ? data.package_catalog[0] : data.package_catalog;
    stored = Number(data.price_paid ?? cat?.price_amount ?? 0);
    const single = Number(cat?.eligibility_rules?.single_lesson_price_usd || 0);
    listAmount = single > 0 ? round2(single * Number(data.purchased_quantity || 0)) : Number(cat?.price_amount || stored);
  }

  // A code/balance already on this checkout: quote from the price before it.
  const { data: live } = await client.from('discount_redemptions')
    .select('code_id, list_amount, base_amount, credit_used')
    .eq('target_type', targetType).eq('target_id', row.id).eq('status', 'reserved').maybeSingle();
  const baseAmount = live ? Number(live.base_amount) : stored;
  return {
    target: {
      targetType,
      id: row.id,
      listAmount: Math.max(live ? Number(live.list_amount) : listAmount, baseAmount),
      baseAmount,
      liveCodeId: live?.code_id || null,
      liveUseCredit: live ? Number(live.credit_used) > 0 : true,
    },
  };
}

async function findReferralOwner(client: any, code: string): Promise<{ ownerUserId: string; firstName: string } | null> {
  if (!/^[A-Z0-9]{4,20}$/.test(code)) return null;
  const { data } = await client.from('referral_codes').select('owner_user_id').eq('code', code).maybeSingle();
  if (!data) return null;
  const { data: st } = await client.from('students').select('name').eq('auth_user_id', data.owner_user_id).limit(1);
  const firstName = String(st?.[0]?.name || '').trim().split(/\s+/)[0] || '';
  return { ownerUserId: data.owner_user_id, firstName };
}

interface QuoteResult {
  breakdown: CheckoutBreakdown;
  code: (DiscountCode & { description?: string }) | null;
  rejection: CodeRejection | null;
  /** A friend's invite code typed in the code box: welcome credit that will be added on apply. */
  referral: { firstName: string; welcomeCredit: number } | null;
  balance: number;
}

async function buildQuote(client: any, req: any, deps: GrowthDeps, target: ResolvedTarget, rawCode: unknown, useCredit: boolean): Promise<QuoteResult> {
  const settings = await loadGrowthSettings(client);
  const accountUserId: string = req.studentUser?.auth_id || '';
  const learners = await deps.getLearners(client, req);
  const learnerIds = learners.map((l) => l.id);
  const balance = await accountBalance(client, accountUserId);

  let codeRow: DiscountCode | null = null;
  let rejection: CodeRejection | null = null;
  let referral: QuoteResult['referral'] = null;
  const codeText = normalizeCode(rawCode);

  if (codeText) {
    const { data } = CODE_PATTERN.test(codeText)
      ? await client.from('discount_codes').select('*').eq('code', codeText).maybeSingle()
      : { data: null };
    if (data) {
      const paidBefore = data.first_purchase_only ? await hasPaidBefore(client, accountUserId, learnerIds) : false;
      const [{ count: usedTotal }, { count: usedByAccount }] = await Promise.all([
        client.from('discount_redemptions').select('id', { count: 'exact', head: true }).eq('code_id', data.id).in('status', ['reserved', 'redeemed']).neq('target_id', target.id),
        isUuid(accountUserId)
          ? client.from('discount_redemptions').select('id', { count: 'exact', head: true }).eq('code_id', data.id).eq('account_user_id', accountUserId).in('status', ['reserved', 'redeemed']).neq('target_id', target.id)
          : Promise.resolve({ count: 0 }),
      ]);
      rejection = checkCodeEligibility(data, {
        targetType: target.targetType,
        baseAmount: target.baseAmount,
        hasPaidBefore: paidBefore,
        usedTotal: usedTotal || 0,
        usedByAccount: usedByAccount || 0,
      });
      if (!rejection) codeRow = data;
    } else {
      // Not an academy code: maybe a friend's invite code (only for a new account that wasn't invited yet).
      const owner = settings.referral_enabled ? await findReferralOwner(client, codeText) : null;
      if (owner && owner.ownerUserId !== accountUserId && isUuid(accountUserId)) {
        const { data: already } = await client.from('referrals').select('id').eq('referred_user_id', accountUserId).maybeSingle();
        if (!already && !(await hasPaidBefore(client, accountUserId, learnerIds))) {
          referral = { firstName: owner.firstName, welcomeCredit: settings.friend_credit_usd };
        } else {
          rejection = 'FIRST_PURCHASE_ONLY';
        }
      } else {
        rejection = 'NOT_FOUND';
      }
    }
  }

  const breakdown = computeCheckout({
    listAmount: target.listAmount,
    baseAmount: target.baseAmount,
    code: codeRow,
    walletBalance: balance + (referral?.welcomeCredit || 0),
    useCredit,
    capPercent: settings.savings_cap_percent,
  });
  return { breakdown, code: codeRow, rejection, referral, balance };
}

function quoteResponse(q: QuoteResult) {
  return {
    ...q.breakdown,
    balance: q.balance,
    code: q.code ? { code: q.code.code, discount_type: q.code.discount_type, value: Number(q.code.value), is_gift: q.code.is_gift } : null,
    rejection: q.rejection,
    rejectionText: q.rejection ? CODE_REJECTION_TEXT[q.rejection] : null,
    referral: q.referral,
  };
}

/** Every learner an account pays for: its own students row(s) and the children linked to its email. */
async function accountLearnerIds(client: any, userId: string): Promise<string[]> {
  const { data: own } = await client.from('students').select('id, email').eq('auth_user_id', userId);
  const ids = new Set<string>((own || []).map((s: any) => s.id));
  const emails: string[] = [...new Set<string>((own || []).map((s: any) => String(s.email || '').toLowerCase()).filter(Boolean))];
  for (const email of emails) {
    const safe = email.replace(/[\\%_]/g, (c) => '\\' + c);
    const { data: kids } = await client.from('guardians').select('student_id').ilike('parent_email', safe);
    for (const k of kids || []) if (k.student_id) ids.add(k.student_id);
  }
  return [...ids];
}

/** Attaches a referral for a new account (onboarding or code box): never one that already paid. Never throws. */
export async function attachReferralForAccount(client: any, params: { userId: string; name?: string | null; code: unknown }): Promise<{ attached: boolean; reason?: string }> {
  try {
    const code = normalizeCode(params.code);
    if (!code || !isUuid(params.userId)) return { attached: false, reason: 'INVALID' };
    const settings = await loadGrowthSettings(client);
    if (!settings.referral_enabled) return { attached: false, reason: 'DISABLED' };
    if (await hasPaidBefore(client, params.userId, await accountLearnerIds(client, params.userId))) {
      return { attached: false, reason: 'NOT_NEW' };
    }
    const firstName = String(params.name || '').trim().split(/\s+/)[0] || null;
    const { data, error } = await client.rpc('attach_referral', {
      p_referred_user_id: params.userId,
      p_code: code,
      p_referred_name: firstName,
      p_welcome: settings.friend_credit_usd,
    });
    if (error) {
      console.warn('[growth] attach_referral failed:', error.message);
      return { attached: false, reason: 'ERROR' };
    }
    return { attached: Boolean(data?.attached), reason: data?.reason };
  } catch (err) {
    console.warn('[growth] attach referral failed:', err);
    return { attached: false, reason: 'ERROR' };
  }
}

/** Called when a lesson is marked completed: the friend's first paid lesson rewards the inviter. Never throws. */
export async function qualifyReferralForBooking(client: any, booking: { id: string; student_id: string | null; booking_type?: string | null; fee_amount_usd?: number | null; package_entitlement_id?: string | null }): Promise<void> {
  try {
    if (!booking.student_id || booking.booking_type === 'trial') return;
    // Paid means money actually received: a confirmed payment for this lesson, or a package bought with one
    // (a lesson credit from a cancelled paid lesson counts). A lesson fully covered by a code or balance does not.
    let paid = false;
    if (booking.package_entitlement_id) {
      const { data: ent } = await client.from('package_entitlements').select('id, metadata').eq('id', booking.package_entitlement_id).maybeSingle();
      if (ent?.metadata?.source === 'cancellation_credit') paid = true;
      else if (ent) {
        const { count } = await client.from('payments').select('id', { count: 'exact', head: true })
          .eq('entitlement_id', ent.id).eq('status', 'confirmed').gt('amount', 0);
        paid = (count || 0) > 0;
      }
    } else {
      const { count } = await client.from('payments').select('id', { count: 'exact', head: true })
        .eq('booking_id', booking.id).eq('status', 'confirmed').gt('amount', 0);
      paid = (count || 0) > 0;
    }
    if (!paid) return;
    const account = await resolveLearnerAccount(client, booking.student_id);
    if (!isUuid(account.userId)) return;
    const { data: ref } = await client.from('referrals').select('id').eq('referred_user_id', account.userId).eq('status', 'signed_up').maybeSingle();
    if (!ref) return;

    const settings = await loadGrowthSettings(client);
    const { data, error } = await client.rpc('qualify_referral', {
      p_referred_user_id: account.userId,
      p_booking_id: booking.id,
      p_reward: settings.referral_enabled ? settings.referrer_credit_usd : 0,
      p_max_per_year: settings.max_rewards_per_year,
    });
    if (error) {
      console.warn('[growth] qualify_referral failed:', error.message);
      return;
    }
    if (data?.rewarded && data.referrer_user_id) {
      const { data: inviter } = await client.from('students').select('email, name').eq('auth_user_id', data.referrer_user_id).limit(1);
      const friend = data.referred_name || '';
      const amount = `$${Number(data.reward).toFixed(2).replace(/\.00$/, '')}`;
      await notifyUser(client, { userId: data.referrer_user_id, email: inviter?.[0]?.email || null, name: inviter?.[0]?.name || null }, {
        kind: 'referral_reward',
        title: { en: `${amount} added to your balance`, ar: `اتضاف ${amount} لرصيدك` },
        body: {
          en: `${friend ? friend : 'Your friend'} finished their first lesson with us. Thank you for inviting them. The ${amount} comes off your next booking on its own.`,
          ar: `${friend ? friend : 'صاحبك'} خلّص أول حصة معانا. شكرًا إنك دعيته. الـ${amount} هتتخصم من حجزك الجاي لوحدها.`,
        },
        link: '/student/invite',
      }, { email: true });
    }
  } catch (err) {
    console.warn('[growth] qualify referral failed:', err);
  }
}

/** A refund gives back the code use and any balance used. Never throws. */
export async function reverseCheckoutDiscount(client: any, targetType: CheckoutTarget, targetId: string | null | undefined): Promise<void> {
  if (!isUuid(targetId)) return;
  const { error } = await client.rpc('reverse_checkout_discount', { p_target_type: targetType, p_target_id: targetId });
  if (error) console.warn('[growth] reverse_checkout_discount failed:', error.message);
}

/** After a payment is confirmed, mark its code/balance as used. Never throws. */
export async function settleCheckoutRedemptions(client: any): Promise<void> {
  const { error } = await client.rpc('settle_checkout_redemptions');
  if (error) console.warn('[growth] settle_checkout_redemptions failed:', error.message);
}

async function ensureReferralCode(client: any, userId: string, name: string | null): Promise<string | null> {
  const { data: existing } = await client.from('referral_codes').select('code').eq('owner_user_id', userId).maybeSingle();
  if (existing?.code) return existing.code;
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateReferralCode(name);
    const { data, error } = await client.from('referral_codes').insert({ owner_user_id: userId, code }).select('code').maybeSingle();
    if (!error && data?.code) return data.code;
    // Another request created ours meanwhile.
    const { data: again } = await client.from('referral_codes').select('code').eq('owner_user_id', userId).maybeSingle();
    if (again?.code) return again.code;
  }
  return null;
}

const ADMIN_CODE_FIELDS = 'id, code, discount_type, value, applies_to, first_purchase_only, min_amount_usd, max_redemptions, max_per_account, starts_at, ends_at, is_gift, is_active, note, created_by, created_at';

function parseCodeInput(body: any, partial: boolean): { values?: Record<string, any>; error?: string } {
  const v: Record<string, any> = {};
  const has = (k: string) => body && Object.prototype.hasOwnProperty.call(body, k);
  if (!partial || has('code')) {
    const code = normalizeCode(body?.code);
    if (!CODE_PATTERN.test(code)) return { error: 'Code must be 3 to 32 letters, numbers, - or _.' };
    v.code = code;
  }
  if (!partial || has('discount_type')) {
    if (body?.discount_type !== 'percent' && body?.discount_type !== 'fixed') return { error: 'Choose percent or fixed amount.' };
    v.discount_type = body.discount_type;
  }
  if (!partial || has('value')) {
    const n = Number(body?.value);
    if (!Number.isFinite(n) || n <= 0) return { error: 'The discount must be more than 0.' };
    if ((v.discount_type || body?.discount_type) === 'percent' && n > 100) return { error: 'A percentage cannot be more than 100.' };
    if (n > 10000) return { error: 'The amount is too large.' };
    v.value = round2(n);
  }
  if (!partial || has('applies_to')) {
    const s = body?.applies_to ?? 'all';
    if (!['all', 'lessons', 'packages'].includes(s)) return { error: 'Invalid scope.' };
    v.applies_to = s;
  }
  for (const k of ['first_purchase_only', 'is_gift', 'is_active'] as const) {
    if (!partial || has(k)) {
      const d = k === 'is_active';
      v[k] = has(k) ? body[k] === true : d;
    }
  }
  if (!partial || has('min_amount_usd')) {
    const n = Number(body?.min_amount_usd ?? 0);
    if (!Number.isFinite(n) || n < 0) return { error: 'Minimum amount must be 0 or more.' };
    v.min_amount_usd = round2(n);
  }
  if (!partial || has('max_redemptions')) {
    const raw = body?.max_redemptions;
    if (raw === null || raw === undefined || raw === '') v.max_redemptions = null;
    else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 1) return { error: 'Total uses must be a whole number of 1 or more, or empty for no limit.' };
      v.max_redemptions = n;
    }
  }
  if (!partial || has('max_per_account')) {
    const n = Number(body?.max_per_account ?? 1);
    if (!Number.isInteger(n) || n < 1 || n > 100) return { error: 'Uses per family must be between 1 and 100.' };
    v.max_per_account = n;
  }
  for (const k of ['starts_at', 'ends_at'] as const) {
    if (!partial || has(k)) {
      const raw = body?.[k];
      if (!raw) v[k] = null;
      else {
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return { error: 'Invalid date.' };
        v[k] = d.toISOString();
      }
    }
  }
  if (v.starts_at && v.ends_at && new Date(v.ends_at) <= new Date(v.starts_at)) return { error: 'The end date must be after the start date.' };
  if (!partial || has('note')) {
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : '';
    v.note = note || null;
  }
  return { values: v };
}

export function registerGrowthRoutes(app: express.Express, deps: GrowthDeps) {
  const { getClient, rateLimit, verifyStudentAuth, verifyTeacherAuth, requireSuperAdmin } = deps;

  // ---------------- Checkout ----------------
  app.post('/api/checkout/quote', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      await settleCheckoutRedemptions(client);
      const { target, status, error } = await resolveTarget(client, req, deps, req.body?.targetType, req.body?.targetId);
      if (!target) return res.status(status || 400).json({ error });
      const q = await buildQuote(client, req, deps, target, req.body?.code, req.body?.useCredit !== false);
      res.json(quoteResponse(q));
    } catch (err) {
      console.error('[POST /api/checkout/quote]', err);
      res.status(500).json({ error: 'Could not work out the price. Please try again.' });
    }
  });

  app.post('/api/checkout/apply', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const accountUserId: string = req.studentUser?.auth_id || '';
      if (!isUuid(accountUserId)) return res.status(403).json({ error: 'Please sign in to continue.' });

      const { target, status, error } = await resolveTarget(client, req, deps, req.body?.targetType, req.body?.targetId);
      if (!target) return res.status(status || 400).json({ error });
      const useCredit = req.body?.useCredit !== false;

      let q = await buildQuote(client, req, deps, target, req.body?.code, useCredit);
      if (q.rejection) return res.status(400).json({ error: CODE_REJECTION_TEXT[q.rejection].en, rejection: q.rejection, rejectionText: CODE_REJECTION_TEXT[q.rejection] });

      // A friend's invite code: join the referral first (adds the welcome credit), then price again with the real balance.
      if (q.referral) {
        await attachReferralForAccount(client, { userId: accountUserId, name: req.studentUser?.name, code: req.body?.code });
        q = await buildQuote(client, req, deps, target, null, useCredit);
      }

      const b = q.breakdown;
      const { data, error: rpcErr } = await client.rpc('apply_checkout_discount_atomic', {
        p_target_type: target.targetType,
        p_target_id: target.id,
        p_account_user_id: accountUserId,
        p_code_id: q.code?.id || null,
        p_list_amount: b.listAmount,
        p_base_amount: b.baseAmount,
        p_discount: b.codeDiscount,
        p_credit: b.creditUsed,
        p_final: b.finalAmount,
      });
      if (rpcErr) {
        const rejection = rejectionFromRpcMessage(rpcErr.message);
        if (rejection) return res.status(400).json({ error: CODE_REJECTION_TEXT[rejection].en, rejection, rejectionText: CODE_REJECTION_TEXT[rejection] });
        console.error('[checkout apply] rpc', rpcErr.message);
        const changed = /BALANCE_CHANGED|price changed/i.test(rpcErr.message);
        return res.status(409).json({ error: changed ? 'Something changed while you were paying. Please try again.' : 'Could not apply this. Please try again.' });
      }
      const confirmed = Boolean(data?.confirmed);
      if (confirmed && deps.afterFreeConfirm) {
        try {
          await deps.afterFreeConfirm(client, target.targetType, target.id);
        } catch (err) {
          console.warn('[checkout apply] after free confirm left for the cron worker', err);
        }
      }
      res.json({ ...quoteResponse(q), confirmed, targetId: target.id, targetType: target.targetType });
    } catch (err) {
      console.error('[POST /api/checkout/apply]', err);
      res.status(500).json({ error: 'Could not apply this. Please try again.' });
    }
  });

  // ---------------- Referral (student side) ----------------
  app.get('/api/student/referral', verifyStudentAuth, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const userId: string = req.studentUser?.auth_id || '';
      const settings = await loadGrowthSettings(client);
      const program = {
        enabled: settings.referral_enabled,
        friendCredit: settings.friend_credit_usd,
        referrerCredit: settings.referrer_credit_usd,
      };
      if (!isUuid(userId)) return res.json({ program, code: null, balance: 0, invites: [], ledger: [] });

      const code = settings.referral_enabled ? await ensureReferralCode(client, userId, req.studentUser?.name || null) : null;
      const [balance, { data: invites }, { data: ledger }] = await Promise.all([
        accountBalance(client, userId),
        client.from('referrals').select('id, referred_name, status, reward_credit_usd, created_at, qualified_at').eq('referrer_user_id', userId).order('created_at', { ascending: false }).limit(50),
        client.from('account_credit_ledger').select('id, amount_usd, reason, created_at').eq('account_user_id', userId).order('created_at', { ascending: false }).limit(30),
      ]);
      res.json({
        program,
        code,
        balance,
        invites: (invites || []).map((r: any) => ({
          id: r.id,
          name: r.referred_name || null,
          status: r.status,
          reward: Number(r.reward_credit_usd || 0),
          joinedAt: r.created_at,
          qualifiedAt: r.qualified_at,
        })),
        ledger: (ledger || []).map((r: any) => ({ id: r.id, amount: Number(r.amount_usd), reason: r.reason, at: r.created_at })),
      });
    } catch (err) {
      console.error('[GET /api/student/referral]', err);
      res.status(500).json({ error: 'Could not load your invite page.' });
    }
  });

  // Public: the banner a friend sees when they open an invite link (first name only).
  app.get('/api/public/referral/:code', rateLimit, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const settings = await loadGrowthSettings(client);
      const owner = settings.referral_enabled ? await findReferralOwner(client, normalizeCode(req.params.code)) : null;
      if (!owner) return res.json({ valid: false });
      res.json({ valid: true, firstName: owner.firstName || null, friendCredit: settings.friend_credit_usd });
    } catch (err) {
      console.error('[GET /api/public/referral]', err);
      res.json({ valid: false });
    }
  });

  // ---------------- Super admin ----------------
  app.get('/api/dashboard/admin/discount-codes', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      await settleCheckoutRedemptions(client);
      const [{ data: codes, error }, { data: uses }] = await Promise.all([
        client.from('discount_codes').select(ADMIN_CODE_FIELDS).order('created_at', { ascending: false }),
        client.from('discount_redemptions').select('code_id, status, discount_amount').not('code_id', 'is', null).in('status', ['reserved', 'redeemed']),
      ]);
      if (error) throw error;
      const stats = new Map<string, { used: number; pending: number; discounted: number }>();
      for (const u of uses || []) {
        const s = stats.get(u.code_id) || { used: 0, pending: 0, discounted: 0 };
        if (u.status === 'redeemed') {
          s.used += 1;
          s.discounted = round2(s.discounted + Number(u.discount_amount || 0));
        } else s.pending += 1;
        stats.set(u.code_id, s);
      }
      res.json({ codes: (codes || []).map((c: any) => ({ ...c, value: Number(c.value), min_amount_usd: Number(c.min_amount_usd), ...(stats.get(c.id) || { used: 0, pending: 0, discounted: 0 }) })) });
    } catch (err) {
      console.error('[GET discount-codes]', err);
      res.status(500).json({ error: 'Could not load discount codes.' });
    }
  });

  app.post('/api/dashboard/admin/discount-codes', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { values, error } = parseCodeInput(req.body, false);
      if (!values) return res.status(400).json({ error });
      const { data: clash } = await client.from('referral_codes').select('code').eq('code', values.code).maybeSingle();
      if (clash) return res.status(409).json({ error: 'This code is already used as an invite code. Pick another.' });
      const { data, error: insErr } = await client.from('discount_codes')
        .insert({ ...values, created_by: req.teacherUser?.email || null })
        .select(ADMIN_CODE_FIELDS).single();
      if (insErr) {
        if (insErr.code === '23505') return res.status(409).json({ error: 'A code with this name already exists.' });
        throw insErr;
      }
      res.status(201).json({ code: data });
    } catch (err) {
      console.error('[POST discount-codes]', err);
      res.status(500).json({ error: 'Could not create the code.' });
    }
  });

  // After a code is used its terms stay fixed (what families saw); only availability can change.
  app.patch('/api/dashboard/admin/discount-codes/:id', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Code not found.' });
      const { values, error } = parseCodeInput(req.body, true);
      if (!values) return res.status(400).json({ error });
      const { count } = await client.from('discount_redemptions').select('id', { count: 'exact', head: true }).eq('code_id', req.params.id);
      const editableAfterUse = ['is_active', 'ends_at', 'max_redemptions', 'note'];
      if ((count || 0) > 0 && Object.keys(values).some((k) => !editableAfterUse.includes(k))) {
        return res.status(400).json({ error: 'This code has been used, so only its end date, total uses, note and on/off can change.' });
      }
      const { data, error: upErr } = await client.from('discount_codes')
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq('id', req.params.id).select(ADMIN_CODE_FIELDS).maybeSingle();
      if (upErr) {
        if (upErr.code === '23505') return res.status(409).json({ error: 'A code with this name already exists.' });
        throw upErr;
      }
      if (!data) return res.status(404).json({ error: 'Code not found.' });
      res.json({ code: data });
    } catch (err) {
      console.error('[PATCH discount-codes]', err);
      res.status(500).json({ error: 'Could not update the code.' });
    }
  });

  // A code nobody used can be deleted; a used one is switched off instead (keeps the record).
  app.delete('/api/dashboard/admin/discount-codes/:id', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      if (!isUuid(req.params.id)) return res.status(404).json({ error: 'Code not found.' });
      const { count } = await client.from('discount_redemptions').select('id', { count: 'exact', head: true }).eq('code_id', req.params.id);
      if ((count || 0) > 0) return res.status(400).json({ error: 'This code has been used. Switch it off instead.' });
      const { error } = await client.from('discount_codes').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err) {
      console.error('[DELETE discount-codes]', err);
      res.status(500).json({ error: 'Could not delete the code.' });
    }
  });

  app.get('/api/dashboard/admin/referrals', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const { data: rows, error } = await client.from('referrals').select('*').order('created_at', { ascending: false }).limit(300);
      if (error) throw error;
      const ids = [...new Set((rows || []).flatMap((r: any) => [r.referrer_user_id, r.referred_user_id]))];
      const { data: people } = ids.length ? await client.from('students').select('auth_user_id, name, email').in('auth_user_id', ids) : { data: [] };
      const byId = new Map<string, any>((people || []).map((p: any) => [p.auth_user_id, p]));
      const { data: credit } = await client.from('account_credit_ledger').select('reason, amount_usd');
      const totals = { welcome: 0, rewards: 0, used: 0 };
      for (const c of credit || []) {
        const n = Number(c.amount_usd || 0);
        if (c.reason === 'referral_welcome') totals.welcome = round2(totals.welcome + n);
        else if (c.reason === 'referral_reward') totals.rewards = round2(totals.rewards + n);
        else if (c.reason === 'checkout_use') totals.used = round2(totals.used - n);
        else if (c.reason === 'checkout_release' || c.reason === 'refund_return') totals.used = round2(totals.used - n);
      }
      res.json({
        totals,
        referrals: (rows || []).map((r: any) => ({
          id: r.id,
          status: r.status,
          createdAt: r.created_at,
          qualifiedAt: r.qualified_at,
          welcomeCredit: Number(r.welcome_credit_usd || 0),
          rewardCredit: Number(r.reward_credit_usd || 0),
          referrer: { name: byId.get(r.referrer_user_id)?.name || null, email: byId.get(r.referrer_user_id)?.email || null },
          referred: { name: byId.get(r.referred_user_id)?.name || r.referred_name || null, email: byId.get(r.referred_user_id)?.email || null },
        })),
      });
    } catch (err) {
      console.error('[GET admin referrals]', err);
      res.status(500).json({ error: 'Could not load referrals.' });
    }
  });

  app.get('/api/dashboard/admin/growth-settings', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      res.json({ settings: await loadGrowthSettings(client) });
    } catch (err) {
      console.error('[GET growth-settings]', err);
      res.status(500).json({ error: 'Could not load settings.' });
    }
  });

  app.put('/api/dashboard/admin/growth-settings', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const problem = validateGrowthSettings(req.body?.settings);
      if (problem) return res.status(400).json({ error: problem });
      const settings = parseGrowthSettings(req.body.settings);
      const { error } = await client.from('settings').upsert({
        key: 'growth_program',
        value: settings,
        category: 'Growth',
        description: 'Referral rewards and the total-savings cap for discount codes',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });
      if (error) throw error;
      res.json({ settings });
    } catch (err) {
      console.error('[PUT growth-settings]', err);
      res.status(500).json({ error: 'Could not save settings.' });
    }
  });

  // Manual balance change for one account (goodwill credit or a correction), always with a note.
  app.post('/api/dashboard/admin/account-credit', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
    try {
      const client = getClient();
      if (!client) return res.status(503).json({ error: 'Database service unavailable.' });
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
      const amount = round2(Number(req.body?.amount));
      const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 300) : '';
      if (!email || !Number.isFinite(amount) || amount === 0 || Math.abs(amount) > 500 || note.length < 3) {
        return res.status(400).json({ error: 'Email, an amount between -500 and 500 (not 0) and a short note are required.' });
      }
      const safe = email.replace(/[\\%_]/g, (c: string) => '\\' + c);
      const { data: st } = await client.from('students').select('auth_user_id').ilike('email', safe).not('auth_user_id', 'is', null).limit(1);
      const userId = st?.[0]?.auth_user_id;
      if (!isUuid(userId)) return res.status(404).json({ error: 'No family account with this email.' });
      const balance = await accountBalance(client, userId);
      if (balance + amount < 0) return res.status(400).json({ error: `The balance is $${balance.toFixed(2)}; it cannot go below zero.` });
      const { error } = await client.from('account_credit_ledger').insert({
        account_user_id: userId, amount_usd: amount, reason: 'admin_adjust', note, created_by: req.teacherUser?.email || null,
      });
      if (error) throw error;
      res.json({ success: true, balance: round2(balance + amount) });
    } catch (err) {
      console.error('[POST account-credit]', err);
      res.status(500).json({ error: 'Could not change the balance.' });
    }
  });
}
