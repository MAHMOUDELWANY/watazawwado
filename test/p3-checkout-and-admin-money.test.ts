import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { qa, skipReason, type Qa } from './helpers/qa.js';

/**
 * P3, PKG-04/08, BOOK-05/09/12: discount codes, gift codes and account balance at a real checkout, the admin's money
 * actions under hostile input, and the open endpoints under junk. Real rows, QA accounts, no card.
 */

describe('P3 checkout: codes, gifts and balance with real rows', () => {
  let q: Qa, ids: Awaited<ReturnType<Qa['qaIds']>>, student: string, parent: string, admin: string;
  let slots: Awaited<ReturnType<Qa['freeSlots']>> = [], n = 0;
  const CODE = `QAP3${Date.now().toString(36).toUpperCase()}`;
  const held = async () => {
    const r = await q.call(student, 'POST', '/api/bookings/create', q.bookingBody(slots[n++ * 3], { mode: 'regular' }));
    assert.strictEqual(r.status, 201, JSON.stringify(r.json));
    return r.json.bookingId as string;
  };
  const target = (id: string) => ({ targetType: 'booking', targetId: id });
  const balance = async () => (await q.call(student, 'GET', '/api/student/referral')).json.balance as number;
  const ledgerSum = async () => ((await q.db.from('account_credit_ledger').select('amount_usd').eq('account_user_id', ids.student.authId)).data || []).reduce((s, r: any) => s + Number(r.amount_usd), 0);
  const makeCode = (suffix: string, body: Record<string, unknown>) => q.call(admin, 'POST', '/api/dashboard/admin/discount-codes', { code: CODE + suffix, discount_type: 'percent', applies_to: 'all', ...body });

  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    ids = await q.qaIds();
    await q.resetLearnerData();
    [student, parent, admin] = await Promise.all([q.tokenFor('student'), q.tokenFor('parent'), q.tokenFor('admin')]);
    slots = await q.freeSlots(ids.teacher1, { fromDay: 10 });
  });
  after(async () => {
    if (!q) return;
    await q.resetLearnerData();
    await q.db.from('discount_codes').delete().like('code', `${CODE}%`);
  });

  it('a code with one use per family: the second lesson is refused, and letting the first go frees it', async (t) => {
    if (!q) return t.skip(skipReason);
    assert.strictEqual((await makeCode('ONE', { value: 10, max_per_account: 1 })).status, 201);
    const [a, b] = [await held(), await held()];
    const first = await q.call(student, 'POST', '/api/checkout/apply', { ...target(a), code: CODE + 'ONE', useCredit: false });
    assert.strictEqual(first.status, 200, JSON.stringify(first.json));
    assert.deepStrictEqual([first.json.codeDiscount, first.json.finalAmount, first.json.confirmed], [0.5, 4.5, false]);
    assert.strictEqual(Number((await q.booking(a)).fee_amount_usd), 4.5, 'the stored price is what Stripe will charge');
    const quote = await q.call(student, 'POST', '/api/checkout/quote', { ...target(b), code: CODE + 'ONE' });
    assert.strictEqual(quote.json.rejection, 'ALREADY_USED');
    assert.strictEqual(quote.json.finalAmount, 5);
    const second = await q.call(student, 'POST', '/api/checkout/apply', { ...target(b), code: CODE + 'ONE', useCredit: false });
    assert.strictEqual(second.status, 400);
    assert.strictEqual(Number((await q.booking(b)).fee_amount_usd), 5);
    // Applying the same code again to the same lesson replaces the use, it does not add one.
    assert.strictEqual((await q.call(student, 'POST', '/api/checkout/apply', { ...target(a), code: CODE + 'ONE', useCredit: false })).status, 200);
    const { count } = await q.db.from('discount_redemptions').select('id', { count: 'exact', head: true }).eq('account_user_id', ids.student.authId).in('status', ['reserved', 'redeemed']);
    assert.strictEqual(count, 1);
    // Letting the held time go gives the use back.
    assert.strictEqual((await q.call(student, 'POST', `/api/student/bookings/${a}/release-hold`, {})).status, 200);
    const after = await q.call(student, 'POST', '/api/checkout/quote', { ...target(b), code: CODE + 'ONE' });
    assert.strictEqual(after.json.rejection, null, JSON.stringify(after.json));
    assert.strictEqual(after.json.finalAmount, 4.5);
  });

  it('savings stay inside the cap, and nothing the browser sends changes the numbers', async (t) => {
    if (!q) return t.skip(skipReason);
    assert.strictEqual((await makeCode('HALF', { value: 50 })).status, 201);
    const id = await held();
    const r = await q.call(student, 'POST', '/api/checkout/apply', { ...target(id), code: CODE + 'HALF', useCredit: false, finalAmount: 0, codeDiscount: 4.5, p_final: 0, capPercent: 100, baseAmount: 0.01, is_gift: true });
    assert.strictEqual(r.status, 200, JSON.stringify(r.json));
    assert.deepStrictEqual([r.json.codeCapped, r.json.finalAmount, r.json.confirmed], [true, 3.75, false], '25% of 5.00 is 1.25, not 50%');
    assert.deepStrictEqual([(await q.booking(id)).status, Number((await q.booking(id)).fee_amount_usd)], ['pending', 3.75]);
    for (const [who, token] of [['another family', parent], ['a visitor', null]] as const) {
      const other = await q.call(token, 'POST', '/api/checkout/apply', { ...target(id), code: CODE + 'HALF' });
      assert.ok([401, 404].includes(other.status), `${who}: ${other.status}`);
    }
    for (const bad of [{ targetType: 'booking', targetId: randomUUID() }, { targetType: 'teacher', targetId: id }, { targetType: 'booking', targetId: { $ne: null } }, {}]) {
      assert.ok([400, 404].includes((await q.call(student, 'POST', '/api/checkout/apply', bad)).status), JSON.stringify(bad));
    }
  });

  it('a gift code covers the whole price: the lesson is confirmed with no payment, and cancelling gives the use back, not a credit', async (t) => {
    if (!q) return t.skip(skipReason);
    assert.strictEqual((await makeCode('GIFT', { value: 100, is_gift: true, max_per_account: 1 })).status, 201);
    const id = await held();
    const r = await q.call(student, 'POST', '/api/checkout/apply', { ...target(id), code: CODE + 'GIFT' });
    assert.strictEqual(r.status, 200, JSON.stringify(r.json));
    assert.deepStrictEqual([r.json.finalAmount, r.json.confirmed], [0, true]);
    const b = await q.booking(id);
    assert.deepStrictEqual([b.status, Number(b.fee_amount_usd), b.hold_expires_at], ['confirmed', 0, null]);
    assert.strictEqual((await q.db.from('payments').select('id', { count: 'exact', head: true }).eq('booking_id', id)).count, 0, 'no payment row is invented');
    const { count: reminders } = await q.db.from('integration_jobs').select('id', { count: 'exact', head: true }).eq('booking_id', id);
    assert.ok((reminders || 0) > 0, 'the confirmed lesson is queued for its meeting like a paid one');
    const cancel = await q.call(student, 'POST', `/api/student/bookings/${id}/cancel`, {});
    assert.strictEqual(cancel.status, 200, JSON.stringify(cancel.json));
    assert.ok(!cancel.json.creditId, 'a free lesson does not turn into a paid lesson credit');
    const { count: credits } = await q.db.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('purchaser_account_id', ids.student.authId);
    assert.strictEqual(credits, 0);
    const { data: red } = await q.db.from('discount_redemptions').select('status').eq('target_id', id);
    assert.deepStrictEqual((red || []).map(x => x.status), ['reversed'], 'the gift use came back');
  });

  it('account balance: used once across two checkouts sent together, and returned when the hold is let go', async (t) => {
    if (!q) return t.skip(skipReason);
    const email = (await q.db.from('students').select('email').eq('id', ids.student.id).single()).data!.email;
    const give = await q.call(admin, 'POST', '/api/dashboard/admin/account-credit', { email, amount: 3, note: 'QA P3 balance test' });
    assert.strictEqual(give.status, 200, JSON.stringify(give.json));
    for (const bad of [{ email, amount: 0, note: 'x y z' }, { email, amount: 501, note: 'x y z' }, { email, amount: 'lots', note: 'x y z' }, { email, amount: 5 }, { email: 'nobody@example.com', amount: 5, note: 'x y z' }, { email, amount: -100, note: 'below zero' }]) {
      assert.ok([400, 404].includes((await q.call(admin, 'POST', '/api/dashboard/admin/account-credit', bad)).status), JSON.stringify(bad));
    }
    assert.strictEqual(await balance(), 3);
    const [a, b] = [await held(), await held()];
    const both = await Promise.all([a, b].map(id => q.call(student, 'POST', '/api/checkout/apply', { ...target(id), useCredit: true })));
    const sum = await ledgerSum();
    assert.ok(sum >= -0.001, `the balance went below zero: ${sum} (${both.map(r => r.status).join('/')})`);
    const used = both.filter(r => r.ok).reduce((s, r) => s + Number(r.json.creditUsed || 0), 0);
    assert.ok(used <= 3.001, `3.00 of balance paid ${used}`);
    const fees = await Promise.all([a, b].map(async id => Number((await q.booking(id)).fee_amount_usd)));
    assert.strictEqual(Math.round((fees[0] + fees[1] + used) * 100), 1000, 'every cent is either still owed or paid from the balance');
    // Letting both go: the balance is whole again the next time it is read.
    for (const id of [a, b]) await q.call(student, 'POST', `/api/student/bookings/${id}/release-hold`, {});
    assert.strictEqual(await balance(), 3, 'P3-013: a released hold gives its balance back at once');
  });

  it('a pay-later lesson that was then paid comes back as a lesson credit when cancelled in time', async (t) => {
    if (!q) return t.skip(skipReason);
    const id = await held();
    // The account is not yet trusted (12 paid lessons), so the plan is set here the way the pay-later route would.
    await q.db.from('bookings').update({ payment_plan: 'pay_later', hold_expires_at: null }).eq('id', id);
    assert.strictEqual((await q.call(student, 'POST', `/api/dashboard/bookings/${id}/pay-later/approve`, {})).status, 403, 'only the super admin approves');
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/bookings/${id}/pay-later/maybe`, {})).status, 400);
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/bookings/${id}/pay-later/approve`, {})).status, 200);
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/bookings/${id}/pay-later/reject`, {})).status, 409, 'a decision is made once');
    assert.strictEqual((await q.booking(id)).status, 'confirmed');
    const paid = await q.call(admin, 'POST', '/api/dashboard/payments', { booking_id: id, amount: 5, currency: 'USD', payment_method: 'wise', payment_reference: `QA-P3-PL-${Date.now()}`, status: 'confirmed' });
    assert.strictEqual(paid.status, 201, JSON.stringify(paid.json));
    const cancel = await q.call(student, 'POST', `/api/student/bookings/${id}/cancel`, {});
    assert.strictEqual(cancel.status, 200, JSON.stringify(cancel.json));
    assert.ok(cancel.json.creditId, 'P3-014: the family paid for this lesson, so cancelling in time gives a lesson credit');
  });
});

describe('P3 admin money actions and open endpoints under hostile input', () => {
  let q: Qa, admin: string, student: string, ids: Awaited<ReturnType<Qa['qaIds']>>;
  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    ids = await q.qaIds();
    [admin, student] = await Promise.all([q.tokenFor('admin'), q.tokenFor('student')]);
  });
  after(async () => { if (q) await q.resetLearnerData(); });

  it('recording, confirming, rejecting, deleting and refunding a payment: every wrong input is refused', async (t) => {
    if (!q) return t.skip(skipReason);
    const slots = await q.freeSlots(ids.teacher1, { fromDay: 14 });
    const lesson = await q.call(student, 'POST', '/api/bookings/create', q.bookingBody(slots[0], { mode: 'regular' }));
    assert.strictEqual(lesson.status, 201, JSON.stringify(lesson.json));
    const base = { booking_id: lesson.json.bookingId, amount: 5, currency: 'USD', payment_method: 'wise', status: 'pending' };
    const bad: Record<string, unknown>[] = [
      { amount: 0 }, { amount: -4.5 }, { amount: 'abc' }, { amount: 1e9 }, { amount: null }, { amount: Infinity }, { currency: 'US' }, { currency: 'usd!' },
      { payment_method: 'cash' }, { payment_method: undefined }, { status: 'paid' }, { status: { $ne: 'x' } }, { booking_id: randomUUID(), status: 'confirmed' },
      { booking_id: null }, { booking_id: { $ne: null } },
    ];
    for (const patch of bad) {
      const r = await q.call(admin, 'POST', '/api/dashboard/payments', { ...base, ...patch });
      assert.ok(r.status === 400 || r.status === 404, `${JSON.stringify(patch)} -> ${r.status} ${r.text.slice(0, 100)}`);
    }
    assert.strictEqual((await q.db.from('payments').select('id', { count: 'exact', head: true }).eq('booking_id', lesson.json.bookingId)).count, 0, 'nothing was recorded');

    const rec = await q.call(admin, 'POST', '/api/dashboard/payments', base);
    assert.strictEqual(rec.status, 201);
    const pid = rec.json.payment.id as string;
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/payments/${pid}/refund`, { reason: 'not yet paid' })).status, 400, 'only a confirmed payment is refunded');
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/payments/${pid}/confirm`, {})).status, 200);
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/payments/${pid}/reject`, { reason: 'changed my mind' })).status, 409, 'a confirmed payment is not rejected');
    assert.strictEqual((await q.call(admin, 'DELETE', `/api/dashboard/payments/${pid}`)).status, 409, 'a confirmed payment is never deleted (RULES.md §5)');
    assert.strictEqual((await q.call(admin, 'POST', `/api/dashboard/payments/${randomUUID()}/refund`, {})).status, 400);
    assert.ok((await q.call(admin, 'POST', '/api/dashboard/payments/not-an-id/refund', {})).status >= 400);
    const refund = await q.call(admin, 'POST', `/api/dashboard/payments/${pid}/refund`, { reason: 'QA refund' });
    assert.strictEqual(refund.status, 200, JSON.stringify(refund.json));
    const again = await q.call(admin, 'POST', `/api/dashboard/payments/${pid}/refund`, { reason: 'QA refund again' });
    assert.strictEqual(again.status, 200);
    assert.strictEqual(again.json.idempotent, true, 'refunding twice refunds once');
    const { data: payment } = await q.db.from('payments').select('status, amount').eq('id', pid).single();
    assert.deepStrictEqual([payment!.status, Number(payment!.amount)], ['refunded', 5], 'the record stays, marked refunded');
    assert.strictEqual((await q.booking(lesson.json.bookingId)).status, 'cancelled', 'the refunded lesson is cancelled');
  });

  it('P3-018: a package paid outside the site is recorded against that package, and activates it once', async (t) => {
    if (!q) return t.skip(skipReason);
    const all: any[] = (await q.call(null, 'GET', '/api/packages')).json.data;
    const pack = all.filter(p => Number(p.eligibility_rules?.hourly_rate) === 10 && Number(p.eligibility_rules?.duration_minutes) === 30).sort((a, b) => a.lesson_count - b.lesson_count)[0];
    const chosen = await q.call(student, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true });
    assert.strictEqual(chosen.status, 201, JSON.stringify(chosen.json));
    const entitlementId = chosen.json.entitlement.id as string;
    const price = Number(pack.price_amount);

    const list = await q.call(admin, 'GET', '/api/dashboard/payments/unpaid-packages');
    assert.strictEqual(list.status, 200);
    const row = list.json.packages.find((p: any) => p.id === entitlementId);
    assert.ok(row, 'the form lists the package the family chose');
    assert.deepStrictEqual([row.amount, row.currency, row.learnerName, row.lessons], [price, 'USD', `QA Student ${q.TAG}`, pack.lesson_count]);
    assert.strictEqual((await q.call(student, 'GET', '/api/dashboard/payments/unpaid-packages')).status, 403);

    const pay = (over: Record<string, unknown>) => q.call(admin, 'POST', '/api/dashboard/payments', { amount: price, currency: 'USD', payment_method: 'wise', status: 'confirmed', ...over });
    const neither = await pay({});
    assert.deepStrictEqual([neither.status, neither.json.code], [400, 'PAYMENT_TARGET_REQUIRED'], 'no lesson and no package: a clear answer, not a server error');
    assert.strictEqual((await pay({ entitlement_id: entitlementId, booking_id: randomUUID() })).status, 400, 'a lesson and a package at once');
    assert.strictEqual((await pay({ entitlement_id: 'not-an-id' })).status, 400);
    assert.strictEqual((await pay({ entitlement_id: randomUUID() })).status, 404);
    assert.strictEqual((await q.call(student, 'POST', '/api/dashboard/payments', { entitlement_id: entitlementId, amount: price, currency: 'USD', payment_method: 'wise' })).status, 403);

    const ok = await pay({ entitlement_id: entitlementId, payment_reference: `QA-P3-PKG-${Date.now()}` });
    assert.strictEqual(ok.status, 201, JSON.stringify(ok.json));
    const { data: ent } = await q.db.from('package_entitlements').select('status, remaining_credits').eq('id', entitlementId).single();
    assert.deepStrictEqual([ent!.status, ent!.remaining_credits], ['active', pack.lesson_count], 'the package is active with all its lessons');
    assert.strictEqual((await pay({ entitlement_id: entitlementId })).status, 409, 'paid packages take no second "received" payment');
    const { data: pays } = await q.db.from('payments').select('status').eq('entitlement_id', entitlementId);
    assert.deepStrictEqual((pays || []).map(p => p.status), ['confirmed']);
    assert.ok(!(await q.call(admin, 'GET', '/api/dashboard/payments/unpaid-packages')).json.packages.some((p: any) => p.id === entitlementId), 'it leaves the unpaid list');
  });

  it('a subject\'s price cannot be set to nothing, a negative or an absurd number', async (t) => {
    if (!q) return t.skip(skipReason);
    // A subject id that does not exist: even a missed check here can never change a live price.
    for (const body of [{ hourly_rate_usd: 0 }, { hourly_rate_usd: -9 }, { hourly_rate_usd: 'nine' }, { hourly_rate_usd: 1e7 }, { hourly_rate_usd: null }, { is_active: 'yes' }, { trial_allowed: 1 }]) {
      const r = await q.call(admin, 'PATCH', '/api/dashboard/services/p3-no-such-subject', body);
      assert.strictEqual(r.status, 400, `${JSON.stringify(body)} -> ${r.status}`);
    }
    assert.strictEqual((await q.call(admin, 'PATCH', '/api/dashboard/services/p3-no-such-subject', { hourly_rate_usd: 9 })).status, 404, 'an unknown subject is "not found", not a server error');
  });

  it('the open endpoints refuse junk and never crash', async (t) => {
    if (!q) return t.skip(skipReason);
    const long = 'x'.repeat(200_000);
    const cases: [string, string, unknown][] = [
      ['POST', '/api/contact', {}], ['POST', '/api/contact', { name: long, email: 'not-an-email', message: long }], ['POST', '/api/contact', { name: '<script>alert(1)</script>', email: 'not-an-email', message: 'hi' }],
      ['POST', '/api/contact', { name: ['a'], email: { $ne: '' }, message: 5 }],
      ['POST', '/api/waitlist', {}], ['POST', '/api/waitlist', { email: 'not-an-email' }], ['POST', '/api/waitlist/google', {}], ['POST', '/api/waitlist/google', { credential: 'eyJhbGciOiJub25lIn0.e30.' }],
      ['POST', `/api/waitlist/${randomUUID()}/voice`, {}], ['POST', '/api/learning-guide', {}], ['POST', '/api/learning-guide', { messages: long }],
      ['POST', '/api/kid/pair', {}], ['POST', '/api/kid/pair', { code: '000000' }], ['POST', '/api/kid/pair', { code: { $gt: '' } }],
      ['POST', '/api/zoom/webhook', {}], ['POST', '/api/zoom/webhook', { event: 'meeting.participant_joined', payload: { object: { id: '1', participant: { user_name: 'x' } } } }],
      ['POST', '/api/integrations/sync-booking', { booking: { referenceCode: 'MHM-000000', managementToken: 'x' } }], ['POST', '/api/integrations/reschedule', { referenceCode: "MHM-' OR 1=1", managementToken: 'x' }],
      ['POST', '/api/integrations/cancel', { referenceCode: 'MHM-000000', managementToken: 'x' }], ['POST', '/api/integrations/validate-slot', { scheduledStartUtc: 'x', scheduledEndUtc: 'y' }],
      ['GET', `/api/join/${randomUUID()}`, undefined], ['GET', '/api/join/not-an-id', undefined], ['GET', `/api/certificates/${randomUUID()}`, undefined], ['GET', '/api/calendar/family/x.ics', undefined],
      ['GET', '/api/reviews/invite/nope', undefined], ['POST', '/api/reviews/invite/nope', { stars: 5, text: 'great' }], ['GET', '/api/public/referral/' + encodeURIComponent("X' OR '1"), undefined],
      ['GET', '/api/integrations/availability?timezone=Mars/Olympus&days=9999&duration=7', undefined], ['GET', '/api/integrations/availability', undefined],
      ['POST', '/api/client-errors', { message: long, stack: long }], ['PUT', '/api/me/language', { language: 'fr' }],
      ['POST', '/api/cron/process-reminders', {}], ['GET', '/api/cron/process-reminders?secret=x&token=x', undefined],
    ];
    const wrong: string[] = [];
    for (const [method, route, body] of cases) {
      const r = await q.call(null, method, route, body);
      if (r.status >= 500 && r.status !== 503) wrong.push(`crash: ${method} ${route.slice(0, 60)} -> ${r.status}`);
      else if (r.ok && !['/api/client-errors', '/api/integrations/availability?timezone=Mars'].some(p => route.startsWith(p)) && !/valid":false/.test(r.text)) wrong.push(`accepted junk: ${method} ${route.slice(0, 60)} -> ${r.status} ${r.text.slice(0, 80)}`);
    }
    assert.deepStrictEqual(wrong, []);
    // P3-016: a real-looking message with oversized fields is stored cut to size, never whole.
    const leadEmail = `mahmoudelwany98+qa-${q.QA_PROJECT}-lead-1@gmail.com`;
    t.after(() => q.db.from('leads').delete().eq('email', leadEmail));
    const lead = await q.call(null, 'POST', '/api/contact', { name: long, email: leadEmail, whatsapp: long, message: long, serviceInterest: { $ne: null }, source: long });
    assert.strictEqual(lead.status, 200, lead.text.slice(0, 120));
    const { data: stored } = await q.db.from('leads').select('name, whatsapp, goal, notes, source, service_interest_id').eq('email', leadEmail).single();
    assert.ok(stored && stored.name.length <= 120 && stored.whatsapp.length <= 40 && stored.goal.length <= 2000 && stored.notes.length <= 2100, JSON.stringify(Object.fromEntries(Object.entries(stored || {}).map(([k, v]) => [k, String(v).length]))));
    assert.deepStrictEqual([stored!.source, stored!.service_interest_id], ['website_contact', null]);

    const malformed = await fetch(`${q.base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': '10.8.8.8' }, body: '{"name": ' });
    assert.strictEqual(malformed.status, 400, 'broken JSON is a 400, not a crash');
    const huge = await fetch(`${q.base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': '10.8.8.7' }, body: JSON.stringify({ message: 'x'.repeat(2_000_000) }) });
    assert.strictEqual(huge.status, 413, 'a 2 MB body is refused');
  });

  it('the limiter stops the eleventh call a minute from one address to one route', async (t) => {
    if (!q) return t.skip(skipReason);
    const ip = '10.77.77.77';
    const codes: number[] = [];
    for (let i = 0; i < 12; i++) codes.push((await q.call(null, 'POST', '/api/contact', {}, ip)).status);
    assert.ok(codes.slice(0, 10).every(c => c !== 429), codes.join(','));
    assert.deepStrictEqual(codes.slice(10), [429, 429]);
    // Another route and another address are not held back by it; a forged forwarding header does not reset the count.
    assert.notStrictEqual((await q.call(null, 'POST', '/api/waitlist', {}, ip)).status, 429);
    const forged = await fetch(`${q.base}/api/contact`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-real-ip': ip, 'x-forwarded-for': '1.2.3.4' }, body: '{}' });
    assert.strictEqual(forged.status, 429);
  });
});
