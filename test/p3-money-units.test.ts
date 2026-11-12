import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { createHmac } from 'node:crypto';
import { lessonFeeUsd, round2, baselinePrice, APPROVED_HOURLY_RATES, evaluateAssessment } from '../server/pricing/pricingEngine.js';
import { computeCheckout, checkCodeEligibility, parseGrowthSettings, normalizeCode, generateReferralCode, CODE_PATTERN, MIN_CHARGE_USD, type DiscountCode } from '../server/pricing/discounts.js';
import { isValidStripeWebhookSignature, createStripeCheckoutSession, retrieveStripeCheckoutSession } from '../server/payment/stripeService.js';

/**
 * P3 (docs/testing/projects/P3-unit-and-code.md): the pure money units under boundary and hostile input.
 * The happy paths live in phase05-pricing-engine, discounts-engine and stripe-webhook-signature.
 */

const cents = (n: number) => Math.round(n * 100);
const code = (over: Partial<DiscountCode> = {}): DiscountCode => ({
  id: 'c1', code: 'TEST10', discount_type: 'percent', value: 10, applies_to: 'all', first_purchase_only: false,
  min_amount_usd: 0, max_redemptions: null, max_per_account: 1, starts_at: null, ends_at: null, is_gift: false, is_active: true, ...over,
});

describe('P3 lesson fee (RULES.md §3)', () => {
  it('is strictly proportional for every approved rate and length, in whole cents', () => {
    const expected: Record<string, number> = { '10/30': 5, '10/45': 7.5, '10/60': 10, '13/30': 6.5, '13/45': 9.75, '13/60': 13 };
    for (const rate of Object.values(APPROVED_HOURLY_RATES)) for (const d of [30, 45, 60]) {
      const fee = lessonFeeUsd(rate, d);
      assert.strictEqual(fee, expected[`${rate}/${d}`]);
      assert.strictEqual(cents(fee) / 100, fee, 'no fraction of a cent');
    }
    assert.strictEqual(baselinePrice('religious', 45), 7.5);
  });

  it('rounds half a cent up and never returns a float artefact', () => {
    assert.strictEqual(round2(1.005), 1.01);
    assert.strictEqual(round2(0.1 + 0.2), 0.3);
    assert.strictEqual(round2(4.345), 4.35);
    assert.strictEqual(lessonFeeUsd(10, 20), 3.33); // 3.3333…
    assert.strictEqual(lessonFeeUsd(11, 45), 8.25);
  });

  it('gives 0 for zero input and never a price for a made-up category or length', () => {
    assert.strictEqual(lessonFeeUsd(0, 60), 0);
    assert.strictEqual(lessonFeeUsd(9, 0), 0);
    for (const bad of [{ service_category: 'cooking' }, { service_category: 'quran', preferred_duration: 20 }, { service_category: 'quran', preferred_duration: '60' }, null, undefined, {}]) {
      const r = evaluateAssessment({ complexity: 'low', preparation_required: 'low', customization: 'low', specialization: false, ...(bad as any) });
      assert.strictEqual(r.recommended_price_usd, null);
      assert.strictEqual(r.teacher_review_required, true);
    }
  });
});

describe('P3 checkout arithmetic (RULES.md §4)', () => {
  it('holds its invariants for 5,000 random orders', () => {
    let seed = 20261111;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;
    for (let i = 0; i < 5000; i++) {
      const base = round2(rnd() * 400);
      const list = round2(base + (rnd() < 0.5 ? 0 : rnd() * 80));
      const cap = Math.floor(rnd() * 101);
      const balance = rnd() < 0.5 ? 0 : round2(rnd() * 60);
      const c = rnd() < 0.2 ? null : code({ discount_type: rnd() < 0.5 ? 'percent' : 'fixed', value: round2(rnd() * (rnd() < 0.5 ? 100 : 500)) || 1, is_gift: rnd() < 0.15 });
      if (c?.discount_type === 'percent') c.value = Math.min(100, c.value);
      const b = computeCheckout({ listAmount: list, baseAmount: base, code: c, walletBalance: balance, capPercent: cap, useCredit: rnd() < 0.9 });
      const ctx = JSON.stringify({ base, list, cap, balance, c, b });
      for (const v of [b.codeDiscount, b.creditUsed, b.finalAmount, b.waived, b.priorSavings]) assert.ok(Number.isFinite(v) && v >= 0, ctx);
      assert.strictEqual(cents(b.baseAmount) - cents(b.codeDiscount) - cents(b.creditUsed), cents(b.finalAmount), `sums add up ${ctx}`);
      assert.ok(b.finalAmount === 0 || b.finalAmount >= MIN_CHARGE_USD, `chargeable or free ${ctx}`);
      assert.ok(b.creditUsed <= balance + 1e-9, `never more balance than the family has ${ctx}`);
      assert.ok(b.codeDiscount <= b.baseAmount + 1e-9, ctx);
      if (c && !c.is_gift) {
        const allowed = cents(b.listAmount) * cap / 100 + 0.5;
        assert.ok(cents(b.priorSavings) + cents(b.codeDiscount) - cents(b.waived) <= Math.max(allowed, cents(b.priorSavings)), `cap ${ctx}`);
      }
      if (!c) assert.strictEqual(b.codeDiscount, b.waived, 'no code, no discount beyond the waived cents');
    }
  });

  it('a broken code value gives no discount instead of a broken total', () => {
    for (const value of [NaN, undefined, null, 'abc', -5, {}] as any[]) for (const discount_type of ['percent', 'fixed'] as const) {
      const b = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ value, discount_type }) });
      assert.strictEqual(b.codeDiscount, 0, `${discount_type} ${String(value)}`);
      assert.strictEqual(b.finalAmount, 9);
    }
    // A percentage above 100 or an endless fixed amount is still held by the cap.
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ value: 1000 }) }).finalAmount, 6.75);
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ discount_type: 'fixed', value: Infinity }) }).finalAmount, 6.75);
  });

  it('hostile amounts never produce a negative or non-numeric charge', () => {
    for (const input of [
      { listAmount: -50, baseAmount: -9 }, { listAmount: NaN, baseAmount: NaN }, { listAmount: 'x', baseAmount: '9' },
      { listAmount: 9, baseAmount: 9, walletBalance: -100 }, { listAmount: 9, baseAmount: 9, walletBalance: NaN },
      { listAmount: 9, baseAmount: 9, walletBalance: Infinity }, { listAmount: 9, baseAmount: 9, capPercent: -40, code: code() },
      { listAmount: 9, baseAmount: 9, capPercent: 9999, code: code({ value: 100 }) }, { listAmount: 1, baseAmount: 9 },
    ] as any[]) {
      const b = computeCheckout(input);
      for (const v of Object.values(b)) if (typeof v === 'number') assert.ok(Number.isFinite(v) && v >= 0, JSON.stringify({ input, b }));
      assert.ok(b.finalAmount <= Math.max(0, Number(input.baseAmount) || 0), JSON.stringify({ input, b }));
    }
    // Balance never pays more than the price, and a negative balance pays nothing.
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, walletBalance: Infinity }).creditUsed, 9);
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, walletBalance: -100 }).finalAmount, 9);
    // A negative cap means no room; a cap above 100 is 100.
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, capPercent: -40, code: code() }).codeDiscount, 0);
    assert.strictEqual(computeCheckout({ listAmount: 9, baseAmount: 9, capPercent: 9999, code: code({ value: 100 }) }).finalAmount, 0);
  });

  it('the Stripe minimum: leaves 0.50 to charge or waives the cents, to the cent', () => {
    // 4.50 lesson, 4.20 balance: 0.30 would be left; 0.20 less balance is used so 0.50 can be charged.
    const a = computeCheckout({ listAmount: 4.5, baseAmount: 4.5, walletBalance: 4.2 });
    assert.deepStrictEqual([a.creditUsed, a.finalAmount, a.waived], [4, 0.5, 0]);
    // Exactly 0.50 left is charged; 0.49 left with no balance is waived.
    assert.strictEqual(computeCheckout({ listAmount: 4.5, baseAmount: 4.5, walletBalance: 4 }).finalAmount, 0.5);
    const w = computeCheckout({ listAmount: 4.5, baseAmount: 4.5, code: code({ discount_type: 'fixed', value: 4.01, is_gift: true }) });
    assert.deepStrictEqual([w.finalAmount, w.waived, w.codeDiscount], [0, 0.49, 4.5]);
  });

  it('code windows are exact to the millisecond and limits count this use', () => {
    const now = new Date('2026-12-01T00:00:00.000Z');
    const ctx = { targetType: 'booking' as const, baseAmount: 9, hasPaidBefore: false, now };
    assert.strictEqual(checkCodeEligibility(code({ starts_at: '2026-12-01T00:00:00.000Z' }), ctx), null, 'starts exactly now');
    assert.strictEqual(checkCodeEligibility(code({ starts_at: '2026-12-01T00:00:00.001Z' }), ctx), 'NOT_STARTED');
    assert.strictEqual(checkCodeEligibility(code({ ends_at: '2026-12-01T00:00:00.000Z' }), ctx), 'EXPIRED', 'the end instant is already out');
    assert.strictEqual(checkCodeEligibility(code({ ends_at: '2026-12-01T00:00:00.001Z' }), ctx), null);
    assert.strictEqual(checkCodeEligibility(code({ min_amount_usd: 9 }), ctx), null, 'minimum is inclusive');
    assert.strictEqual(checkCodeEligibility(code({ min_amount_usd: 9.01 }), ctx), 'MIN_AMOUNT');
    assert.strictEqual(checkCodeEligibility(code({ max_per_account: 2 }), { ...ctx, usedByAccount: 1 }), null);
    assert.strictEqual(checkCodeEligibility(code({ max_per_account: 2 }), { ...ctx, usedByAccount: 2 }), 'ALREADY_USED');
    assert.strictEqual(checkCodeEligibility(code({ max_redemptions: 1 }), { ...ctx, usedTotal: 1 }), 'USED_UP');
    assert.strictEqual(checkCodeEligibility(code({ max_per_account: 0 as any }), ctx), null, 'a 0 limit is read as 1, never as blocked for ever');
  });

  it('settings, codes and invite codes survive junk', () => {
    const s = parseGrowthSettings({ friend_credit_usd: -5, referrer_credit_usd: 1e9, savings_cap_percent: 'abc', max_rewards_per_year: 2.7, referral_enabled: 'yes' });
    assert.deepStrictEqual(s, { referral_enabled: true, friend_credit_usd: 0, referrer_credit_usd: 100, savings_cap_percent: 25, max_rewards_per_year: 3 });
    for (const junk of [null, undefined, 5, {}, [], '   ']) assert.strictEqual(normalizeCode(junk), '');
    for (const bad of ['AB', 'A'.repeat(33), "A' OR 1=1", 'كود', 'A,B.eq.1', 'A%B']) assert.ok(!CODE_PATTERN.test(normalizeCode(bad)), bad);
    for (const name of ['', null, 'ز', "Robert'); DROP", 'a'.repeat(200), '😀😀']) {
      assert.match(generateReferralCode(name as any), /^[A-Z]{2,6}[A-HJ-NP-Z2-9]{4}$/);
    }
  });
});

describe('P3 Stripe webhook signature (real event body)', () => {
  const secret = 'whsec_p3_test_secret';
  // The shape Stripe posts for a finished Checkout Session (ids shortened).
  const body = Buffer.from(JSON.stringify({
    id: 'evt_1P3', object: 'event', api_version: '2025-03-31.basil', created: 1794300000, livemode: false, type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_p3', object: 'checkout.session', amount_total: 450, currency: 'usd', payment_status: 'paid', payment_intent: 'pi_p3', metadata: { targetType: 'booking', targetId: 'MHM-ABC123' }, customer_details: { email: 'család+ünï@example.com', name: 'أحمد' } } },
  }), 'utf8');
  const now = 1794300030;
  const sign = (payload: Buffer | string, t = now, s = secret) => createHmac('sha256', s).update(`${t}.`).update(payload).digest('hex');

  it('accepts the exact bytes, as a Buffer or the same string', () => {
    assert.ok(isValidStripeWebhookSignature(body, `t=${now},v1=${sign(body)}`, secret, now));
    assert.ok(isValidStripeWebhookSignature(body.toString('utf8'), `t=${now},v1=${sign(body)}`, secret, now));
  });

  it('accepts a second v1 during a secret rotation and ignores v0', () => {
    assert.ok(isValidStripeWebhookSignature(body, `t=${now},v1=${sign(body, now, 'whsec_old')},v1=${sign(body)},v0=deadbeef`, secret, now));
    assert.ok(!isValidStripeWebhookSignature(body, `t=${now},v0=${sign(body)}`, secret, now), 'v0 alone is not a signature');
  });

  it('rejects any change to the bytes, the time or the secret', () => {
    const sig = sign(body);
    const reparsed = Buffer.from(JSON.stringify(JSON.parse(body.toString('utf8')), null, 1));
    assert.ok(!isValidStripeWebhookSignature(reparsed, `t=${now},v1=${sig}`, secret, now), 're-serialised JSON is a different body');
    assert.ok(!isValidStripeWebhookSignature(Buffer.concat([body, Buffer.from(' ')]), `t=${now},v1=${sig}`, secret, now));
    assert.ok(!isValidStripeWebhookSignature(body, `t=${now + 1},v1=${sig}`, secret, now), 'the time is part of what is signed');
    assert.ok(!isValidStripeWebhookSignature(body, `t=${now},v1=${sig}`, 'whsec_other', now));
    assert.ok(!isValidStripeWebhookSignature(body, `t=${now},v1=${sig.slice(0, -2)}`, secret, now), 'shortened');
    assert.ok(!isValidStripeWebhookSignature(body, `t=${now},v1=${sig}00`, secret, now), 'lengthened');
  });

  it('rejects replays outside five minutes, either side', () => {
    const header = `t=${now},v1=${sign(body)}`;
    assert.ok(isValidStripeWebhookSignature(body, header, secret, now + 300));
    assert.ok(!isValidStripeWebhookSignature(body, header, secret, now + 301));
    assert.ok(isValidStripeWebhookSignature(body, header, secret, now - 300));
    assert.ok(!isValidStripeWebhookSignature(body, header, secret, now - 301), 'an event dated in the future');
  });

  it('never throws on a malformed header', () => {
    for (const header of [undefined, '', 'garbage', 't=', 'v1=', `v1=${sign(body)}`, `t=abc,v1=${sign(body)}`, `t=${now}`, `t=${now},v1=`, `t=${now},v1=zzzz`, ',,,', '=', `t=${now},v1`, 't=1e400,v1=00']) {
      assert.strictEqual(isValidStripeWebhookSignature(body, header as any, secret, now), false, String(header));
    }
    assert.strictEqual(isValidStripeWebhookSignature(body, `t=${now},v1=${sign(body, now, '')}`, '', now), false, 'an empty secret verifies nothing');
  });
});

describe('P3 Stripe calls (provider stubbed)', () => {
  const realFetch = globalThis.fetch;
  const saved = { sk: process.env.STRIPE_SECRET_KEY };
  afterEach(() => { globalThis.fetch = realFetch; process.env.STRIPE_SECRET_KEY = saved.sk; });

  const stub = (reply: (url: string, init: any) => { status?: number; json: any }) => {
    const calls: { url: string; body: URLSearchParams | null; headers: any }[] = [];
    globalThis.fetch = (async (url: any, init: any) => {
      calls.push({ url: String(url), body: init?.body ? new URLSearchParams(init.body) : null, headers: init?.headers });
      const r = reply(String(url), init);
      return new Response(JSON.stringify(r.json), { status: r.status || 200 });
    }) as any;
    return calls;
  };
  const params = { currency: 'USD', title: 'Lesson', metadata: { targetType: 'booking', targetId: 'MHM-1' }, successUrl: 'https://watazawwado.academy/ok', cancelUrl: 'https://watazawwado.academy/no' };

  it('charges whole cents for every price the site can produce', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_p3';
    for (const [amount, expected] of [[4.5, '450'], [6.75, '675'], [9.75, '975'], [4.35, '435'], [0.5, '50'], [19.99, '1999'], [1.15, '115'], [8.7, '870']] as const) {
      const calls = stub(() => ({ json: { id: 'cs_1', url: 'https://checkout.stripe.com/c/1', status: 'open' } }));
      await createStripeCheckoutSession({ ...params, amount });
      assert.strictEqual(calls[0].body!.get('line_items[0][price_data][unit_amount]'), expected, String(amount));
      assert.strictEqual(calls[0].body!.get('line_items[0][price_data][currency]'), 'usd');
      assert.strictEqual(calls[0].body!.get('metadata[targetId]'), 'MHM-1');
      const expires = Number(calls[0].body!.get('expires_at')) - Math.floor(Date.now() / 1000);
      assert.ok(expires >= 30 * 60 && expires < 35 * 60, 'the session ends before the 35-minute hold does');
    }
  });

  it('refuses to call Stripe without a key and does not leak the key in an error', async () => {
    process.env.STRIPE_SECRET_KEY = '';
    await assert.rejects(createStripeCheckoutSession({ ...params, amount: 9 }), /not configured/);
    await assert.rejects(retrieveStripeCheckoutSession('cs_1'), /not configured/);
    process.env.STRIPE_SECRET_KEY = 'sk_test_p3_very_secret';
    stub(() => ({ status: 401, json: { error: { message: 'Expired API Key provided: sk_test_***cret' } } }));
    await assert.rejects(createStripeCheckoutSession({ ...params, amount: 9 }), (err: Error) => !err.message.includes('sk_test_p3_very_secret'));
    await assert.rejects(retrieveStripeCheckoutSession(''), /sessionId is required/);
    await assert.rejects(retrieveStripeCheckoutSession({ $ne: 1 } as any), /sessionId is required/);
  });

  it('reads the paid amount, currency and payment intent from Stripe, not from the caller', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_p3';
    const calls = stub(() => ({ json: { id: 'cs_1', payment_status: 'paid', status: 'complete', amount_total: 975, currency: 'gbp', payment_intent: { id: 'pi_9' }, metadata: { targetType: 'package', targetId: 'e1' }, customer_details: { email: 'a@b.c' } } }));
    const s = await retrieveStripeCheckoutSession('cs_1/../../v1/refunds');
    assert.ok(calls[0].url.endsWith('/checkout/sessions/cs_1%2F..%2F..%2Fv1%2Frefunds'), 'the id cannot change the path');
    assert.deepStrictEqual([s.amountTotal, s.currency, s.paymentIntent, s.paymentStatus], [9.75, 'GBP', 'pi_9', 'paid']);
  });
});
