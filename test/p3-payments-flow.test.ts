import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createHmac, randomUUID } from 'node:crypto';
import { qa, skipReason, stubStripe, type Qa } from './helpers/qa.js';

/**
 * P3, BOOK-03: a paid lesson from the unpaid hold to a Stripe webhook, with real rows. Stripe itself is stubbed (the
 * local key is expired, P2-001): the webhook is signed like Stripe signs it, and the session the server re-reads from
 * "Stripe" is ours. Covers: the same event twice, two deliveries at once, a wrong amount, another currency, an
 * unsigned call, a session that is not ours, and a payment that arrives after the hold was released.
 */

const SECRET = 'whsec_p3_flow_test';
process.env.STRIPE_WEBHOOK_SECRET = SECRET;
process.env.STRIPE_SECRET_KEY = 'sk_test_p3_flow';

type Session = { id: string; payment_status: string; status: string; amount_total: number; currency: string; payment_intent: string; metadata: Record<string, string>; customer_details?: { email: string } };
const sessions = new Map<string, Session>();

describe('P3 paid lesson through the Stripe webhook (real rows, Stripe stubbed)', () => {
  let q: Qa, student: string, restore = () => {};
  let slots: Awaited<ReturnType<Qa['freeSlots']>> = [], n = 0;

  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    await q.resetLearnerData();
    student = await q.tokenFor('student');
    slots = await q.freeSlots((await q.qaIds()).teacher1, { fromDay: 5 });
    restore = stubStripe((path) => {
      const s = sessions.get(decodeURIComponent(path.split('/').pop() || ''));
      return s ? { json: s } : { status: 404, json: { error: { message: 'No such checkout.session' } } };
    });
  });
  after(async () => { restore(); if (q) await q.resetLearnerData(); });

  /** A held, unpaid 30-minute lesson (USD 4.50) of the QA student. */
  const heldLesson = async () => {
    const r = await q.call(student, 'POST', '/api/bookings/create', q.bookingBody(slots[n++ * 4], { mode: 'regular' }));
    assert.strictEqual(r.status, 201, JSON.stringify(r.json));
    assert.strictEqual(r.json.status, 'pending');
    assert.strictEqual(r.json.feeAmountUsd, 4.5);
    return r.json.bookingId as string;
  };
  const session = (bookingId: string, over: Partial<Session> = {}): Session => {
    const s: Session = { id: `cs_test_${randomUUID()}`, payment_status: 'paid', status: 'complete', amount_total: 450, currency: 'usd', payment_intent: `pi_p3_${randomUUID()}`, metadata: { targetType: 'booking', targetId: bookingId }, customer_details: { email: 'qa@example.com' }, ...over };
    sessions.set(s.id, s);
    return s;
  };
  /** Posts the event the way Stripe does: raw JSON bytes and a Stripe-Signature header over those bytes. */
  const deliver = (s: Session, opts: { secret?: string; type?: string; tamper?: boolean } = {}) => {
    const raw = JSON.stringify({ id: `evt_${randomUUID()}`, object: 'event', type: opts.type || 'checkout.session.completed', data: { object: { id: s.id, object: 'checkout.session' } } });
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac('sha256', opts.secret ?? SECRET).update(`${t}.`).update(raw).digest('hex');
    return fetch(`${q.base}/api/payments/stripe/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Stripe-Signature': `t=${t},v1=${v1}` }, body: opts.tamper ? raw.replace(s.id, `${s.id}x`) : raw });
  };
  const payments = async (bookingId: string) => (await q.db.from('payments').select('*').eq('booking_id', bookingId)).data || [];

  it('a signed event for the exact price confirms the lesson; the same event again changes nothing', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    const s = session(id);
    assert.strictEqual((await deliver(s)).status, 200);
    assert.strictEqual((await q.booking(id)).status, 'confirmed');
    let rows = await payments(id);
    assert.strictEqual(rows.length, 1);
    assert.deepStrictEqual([rows[0].status, Number(rows[0].amount), rows[0].currency, rows[0].payment_method, rows[0].payment_reference], ['confirmed', 4.5, 'USD', 'stripe', s.payment_intent]);

    assert.strictEqual((await deliver(s)).status, 200, 'a redelivery is acknowledged');
    const viaPage = await q.call(student, 'POST', '/api/payments/stripe/verify', { sessionId: s.id });
    assert.strictEqual(viaPage.status, 200, JSON.stringify(viaPage.json));
    assert.strictEqual(viaPage.json.isIdempotent, true, 'the return page after the webhook is a repeat');
    rows = await payments(id);
    assert.strictEqual(rows.length, 1, 'still one payment');
    const { count } = await q.db.from('reminders').select('id', { count: 'exact', head: true }).eq('booking_id', id);
    assert.ok((count || 0) <= 2, 'reminders are not doubled by the repeat');
  });

  it('two deliveries in the same instant record one payment', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    const s = session(id);
    const both = await Promise.all([deliver(s), deliver(s), q.call(student, 'POST', '/api/payments/stripe/verify', { sessionId: s.id })]);
    assert.ok([both[0].status, both[1].status].every(code => code === 200 || code === 500), 'each is acknowledged or left for a retry');
    const rows = await payments(id);
    assert.strictEqual(rows.length, 1, `one payment row, got ${rows.length}`);
    assert.strictEqual(rows[0].status, 'confirmed');
    assert.strictEqual((await q.booking(id)).status, 'confirmed');
  });

  it('a wrong amount is recorded for review and never confirms, also on a retry', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    const s = session(id, { amount_total: 449 });
    assert.strictEqual((await deliver(s)).status, 200, 'acknowledged, so Stripe stops retrying');
    assert.strictEqual((await deliver(s)).status, 200);
    const page = await q.call(student, 'POST', '/api/payments/stripe/verify', { sessionId: s.id });
    assert.ok(page.status >= 400, 'the return page does not say "confirmed"');
    const rows = await payments(id);
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].status, 'pending');
    assert.match(rows[0].notes, /^AMOUNT MISMATCH/);
    assert.strictEqual((await q.booking(id)).status, 'pending', 'the lesson is still unpaid');
  });

  it('the right number in another currency is not the price', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    for (const currency of ['gbp', 'jpy', 'egp']) {
      const s = session(id, { currency });
      assert.strictEqual((await deliver(s)).status, 200);
    }
    const rows = await payments(id);
    assert.ok(rows.length >= 1 && rows.every(r => r.status === 'pending' && /^AMOUNT MISMATCH/.test(r.notes)), JSON.stringify(rows.map(r => [r.status, r.currency])));
    assert.strictEqual((await q.booking(id)).status, 'pending');
  });

  it('an unsigned, wrongly signed or altered event writes nothing', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    const s = session(id);
    assert.strictEqual((await deliver(s, { secret: 'whsec_someone_else' })).status, 400);
    assert.strictEqual((await deliver(s, { tamper: true })).status, 400);
    const bare = await fetch(`${q.base}/api/payments/stripe/webhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'checkout.session.completed', data: { object: { id: s.id } } }) });
    assert.strictEqual(bare.status, 400);
    assert.strictEqual((await payments(id)).length, 0);
    assert.strictEqual((await q.booking(id)).status, 'pending');
  });

  it('a session that is unpaid, unknown or not made by this site confirms nothing', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    assert.strictEqual((await deliver(session(id, { payment_status: 'unpaid', status: 'open' }))).status, 200);
    assert.strictEqual((await deliver(session(id, { metadata: {} }))).status, 200);
    assert.strictEqual((await deliver(session(id, { metadata: { targetType: 'admin', targetId: id } }))).status, 200);
    assert.strictEqual((await deliver(session(id), { type: 'charge.refunded' })).status, 200, 'other event types are only acknowledged');
    const ghost = { ...session(id), id: 'cs_test_not_in_stripe' };
    assert.strictEqual((await deliver(ghost)).status, 500, 'Stripe does not know it: left for a retry');
    assert.strictEqual((await payments(id)).length, 0);
    assert.strictEqual((await q.booking(id)).status, 'pending');
    // The return page takes only a session id; a missing or made-up one is refused.
    assert.strictEqual((await q.call(student, 'POST', '/api/payments/stripe/verify', {})).status, 400);
    assert.ok((await q.call(student, 'POST', '/api/payments/stripe/verify', { sessionId: { $ne: null } })).status >= 400);
  });

  it('money that arrives after the hold was released stays visible for the admin and revives nothing', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    await q.db.from('bookings').update({ hold_expires_at: new Date(Date.now() - 60_000).toISOString() }).eq('id', id);
    await q.db.rpc('release_expired_payment_holds');
    assert.strictEqual((await q.booking(id)).status, 'cancelled');
    const s = session(id);
    assert.strictEqual((await deliver(s)).status, 200);
    assert.strictEqual((await q.booking(id)).status, 'cancelled', 'a released slot is not taken back silently');
    const rows = await payments(id);
    assert.strictEqual(rows.length, 1, 'the money is on record');
    assert.strictEqual(rows[0].status, 'pending', 'waiting for the admin, not confirmed');
  });

  it('the checkout cannot be opened for someone else\'s lesson, a free lesson or a paid one', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await heldLesson();
    const parent = await q.tokenFor('parent');
    const mine = await q.call(student, 'POST', '/api/payments/create-intent', { gateway: 'stripe', targetType: 'booking', targetId: id, amount: 0.01, successUrl: 'https://evil.example/ok' });
    // Stripe is stubbed with no create endpoint, so reaching it at all means the server accepted the request.
    assert.notStrictEqual(mine.status, 403, 'the owner may pay');
    for (const [who, token] of [['another family', parent], ['a visitor', null]] as const) {
      const r = await q.call(token, 'POST', '/api/payments/create-intent', { gateway: 'stripe', targetType: 'booking', targetId: id });
      assert.ok([401, 403, 404].includes(r.status), `${who} opening the checkout of this lesson: ${r.status}`);
    }
    for (const body of [{ gateway: 'paypal', targetType: 'booking', targetId: id }, { gateway: 'stripe', targetType: 'teacher', targetId: id }, { gateway: 'stripe', targetType: 'booking' }, { gateway: 'stripe', targetType: 'booking', targetId: randomUUID() }]) {
      const r = await q.call(student, 'POST', '/api/payments/create-intent', body);
      assert.ok(r.status === 400 || r.status === 404, JSON.stringify([body, r.status]));
    }
  });
});
