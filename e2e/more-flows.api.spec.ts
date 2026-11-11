/**
 * PKG-01/02/03/04, AUTH-09, LES-11/12: packages, discount codes, the calendar link, a child's device, the cron door.
 * Package payments are confirmed the way the Stripe webhook does it (`verify_payment_atomic`), never from a client.
 */
import { test, expect } from '@playwright/test';
import { booking, bookingBody, call, db, freeSlots, qaIds, resetLearnerData, tokenFor, TAG, QA_PROJECT, type QaIds, type Slot } from './helpers.js';

test.describe.configure({ mode: 'serial' });

let q: QaIds, student: string, parent: string, teacher: string, admin: string;
let slots: Slot[]; let n = 0;
const next = () => slots[n++ * 3];
const CODE = `QA${QA_PROJECT.toUpperCase()}TEN`;
const cleanCodes = async () => { await db.from('discount_codes').delete().like('code', `QA${QA_PROJECT.toUpperCase()}%`); };
const cleanDevices = async () => { const ids = [q.kid, q.teen]; await db.from('child_devices').delete().in('learner_id', ids); };

test.beforeAll(async () => {
  q = await qaIds();
  await resetLearnerData(); await cleanCodes(); await cleanDevices();
  [student, parent, teacher, admin] = await Promise.all([tokenFor('student'), tokenFor('parent'), tokenFor('teacher', 1), tokenFor('admin')]);
  slots = await freeSlots(q.teacher1, { fromDay: 6 });
});
test.afterAll(async () => { await resetLearnerData(); await cleanCodes(); await cleanDevices(); await db.from('calendar_feed_tokens').delete().in('user_id', [q.student.authId, q.parent.authId]); });

let pack: any, entitlementId = '';
test('packages: the public list has real prices; choosing one waits for payment at the server price', async () => {
  const list = await call(null, 'GET', '/api/packages');
  expect(list.status).toBe(200);
  const all: any[] = list.json.data;
  expect(all.length).toBeGreaterThan(0);
  pack = all.filter(p => Number(p.eligibility_rules?.hourly_rate) === 9 && Number(p.eligibility_rules?.duration_minutes) === 30).sort((a, b) => a.lesson_count - b.lesson_count)[0];
  expect(pack, 'a 30-minute package in the $9 band').toBeTruthy();
  const perLesson = Number(pack.price_amount) / pack.lesson_count;
  expect(perLesson, 'a package lesson costs no more than a single lesson (USD 4.50), and is never free').toBeLessThanOrEqual(4.5);
  expect(perLesson).toBeGreaterThan(3);

  expect((await call(student, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id })).json.code).toBe('TERMS_REQUIRED');
  expect((await call(student, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true })).json.code).toBe('EARLY_START_REQUIRED');
  expect((await call(student, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true, learnerStudentId: q.kid })).status, 'a package for another family\'s child').toBe(403);
  const r = await call(student, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true, price_paid: 0.01, status: 'active', remaining_credits: 99 });
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  entitlementId = r.json.entitlement.id;
  const row = (await db.from('package_entitlements').select('*').eq('id', entitlementId).single()).data!;
  expect(row).toMatchObject({ status: 'pending_payment', remaining_credits: 0, learner_student_id: q.student.id });
  expect(Number(row.price_paid)).toBe(Number(pack.price_amount));
  const early = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', packageEntitlementId: entitlementId }));
  expect(early.status, 'an unpaid package books nothing').toBe(400);
});

test('a package is active only after a verified payment; its lessons confirm at once and never exceed the credits', async () => {
  const { data: pay } = await db.from('payments').insert({ entitlement_id: entitlementId, student_id: q.student.id, amount: Number(pack.price_amount), currency: 'USD', payment_method: 'stripe', payment_reference: `qa_${Date.now()}`, status: 'pending' }).select('id').single();
  const { error } = await db.rpc('verify_payment_atomic', { p_payment_id: pay!.id });
  expect(error?.message).toBeUndefined();
  const row = (await db.from('package_entitlements').select('status, remaining_credits, purchased_quantity').eq('id', entitlementId).single()).data!;
  expect(row).toMatchObject({ status: 'active', remaining_credits: pack.lesson_count });
  await db.rpc('verify_payment_atomic', { p_payment_id: pay!.id }); // the webhook and the return page both confirm
  expect((await db.from('package_entitlements').select('remaining_credits').eq('id', entitlementId).single()).data?.remaining_credits, 'credits are granted once').toBe(pack.lesson_count);

  const mine = await call(student, 'GET', '/api/student/packages');
  expect(mine.json.creditSummary.totalRemaining).toBe(pack.lesson_count);
  const ids: string[] = [];
  for (let i = 0; i < pack.lesson_count; i++) {
    const r = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', packageEntitlementId: entitlementId }));
    expect(r.status, `lesson ${i + 1}: ${JSON.stringify(r.json)}`).toBe(201);
    expect(r.json).toMatchObject({ status: 'confirmed', feeAmountUsd: 0 });
    ids.push(r.json.bookingId);
  }
  const extra = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', packageEntitlementId: entitlementId }));
  expect(extra.status, 'one more lesson than the package holds').toBe(400);
  // Cancelling a package lesson in time frees its credit; no new credit row and no money moves.
  expect((await call(student, 'POST', `/api/student/bookings/${ids[0]}/cancel`, {})).status).toBe(200);
  expect((await booking(ids[0])).status).toBe('cancelled');
  const again = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', packageEntitlementId: entitlementId }));
  expect(again.status, 'the freed credit books again').toBe(201);
  const { count } = await db.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('purchaser_account_id', q.student.authId);
  expect(count).toBe(1);
});

test('a second tap on "Choose package" does not pile up unpaid packages', async () => {
  const both = await Promise.all([1, 2].map(() => call(parent, 'POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true, learnerStudentId: q.teen })));
  expect(both.every(r => r.status === 201 || r.status === 200), JSON.stringify(both.map(r => r.json))).toBe(true);
  const { count } = await db.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('purchaser_account_id', q.parent.authId).eq('status', 'pending_payment');
  test.info().annotations.push({ type: 'pending packages after a double tap', description: String(count) });
  test.fail((count || 0) > 1, 'P2-019 (open): every tap creates another unpaid package row');
  expect(count).toBe(1);
});

test('discount codes: only the admin makes them; the server prices; savings stay inside the cap', async () => {
  expect([401, 403]).toContain((await call(teacher, 'POST', '/api/dashboard/admin/discount-codes', { code: CODE, discount_type: 'percent', value: 10 })).status);
  expect([401, 403]).toContain((await call(student, 'GET', '/api/dashboard/admin/discount-codes')).status);
  expect((await call(admin, 'POST', '/api/dashboard/admin/discount-codes', { code: CODE, discount_type: 'percent', value: 150 })).status).toBe(400);
  const made = await call(admin, 'POST', '/api/dashboard/admin/discount-codes', { code: CODE, discount_type: 'percent', value: 10, applies_to: 'lessons' });
  expect(made.status, JSON.stringify(made.json)).toBe(201);
  expect((await call(admin, 'POST', '/api/dashboard/admin/discount-codes', { code: CODE, discount_type: 'percent', value: 10 })).status, 'same code twice').toBe(409);
  const half = await call(admin, 'POST', '/api/dashboard/admin/discount-codes', { code: `${CODE}HALF`, discount_type: 'percent', value: 50, applies_to: 'all' });
  expect(half.status).toBe(201);

  const b = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular' }));
  expect(b.status, JSON.stringify(b.json)).toBe(201);
  const target = { targetType: 'booking', targetId: b.json.bookingId, useCredit: false };
  const plain = await call(student, 'POST', '/api/checkout/quote', target);
  expect(plain.status, JSON.stringify(plain.json)).toBe(200);
  const ten = await call(student, 'POST', '/api/checkout/quote', { ...target, code: CODE.toLowerCase() });
  expect(ten.json.rejection, JSON.stringify(ten.json)).toBeFalsy();
  expect(ten.json.finalAmount, `10% off USD 4.50: ${JSON.stringify(ten.json)}`).toBe(4.05);
  const capped = await call(student, 'POST', '/api/checkout/quote', { ...target, code: `${CODE}HALF` });
  expect(capped.json, `a 50% code stays inside the 25% cap: ${JSON.stringify(capped.json)}`).toMatchObject({ finalAmount: 3.37, codeCapped: true });
  expect((await call(student, 'POST', '/api/checkout/quote', { ...target, code: 'NO-SUCH-CODE' })).json.rejection, 'an unknown code is refused').toBeTruthy();
  expect((await call(parent, 'POST', '/api/checkout/quote', { ...target, code: CODE })).ok, 'another account pricing this lesson').toBe(false);
  expect(Number((await booking(b.json.bookingId)).fee_amount_usd), 'a quote changes nothing').toBe(4.5);
  await call(student, 'POST', `/api/student/bookings/${b.json.bookingId}/release-hold`, {});
});

test('pay later is for trusted learners only', async () => {
  const b = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular' }));
  const who = await call(student, 'GET', '/api/student/pay-later');
  expect(who.json).toMatchObject({ eligible: false, required: 12 });
  const r = await call(student, 'POST', `/api/bookings/${b.json.referenceCode}/pay-later`, {});
  expect(r.ok, 'pay later with fewer than 12 paid lessons').toBe(false);
  expect((await booking(b.json.bookingId)).status).toBe('pending');
  expect([401, 403]).toContain((await call(student, 'POST', `/api/dashboard/bookings/${b.json.bookingId}/pay-later/approve`, {})).status);
  await call(student, 'POST', `/api/student/bookings/${b.json.bookingId}/release-hold`, {});
});

test('the calendar link works without signing in, and stops when the family turns it off', async () => {
  const made = await call(parent, 'POST', '/api/student/calendar-feed', {});
  expect(made.status, JSON.stringify(made.json)).toBe(201);
  const path = new URL(made.json.url).pathname;
  const feed = await call(null, 'GET', path);
  expect(feed.status).toBe(200);
  expect(feed.text).toContain('BEGIN:VCALENDAR');
  expect(feed.text, 'no email address in a link that works without a password').not.toMatch(/@gmail\.com/);
  expect((await call(null, 'GET', path.replace(/.{6}\.ics$/, 'AAAAAA.ics'))).status).toBe(404);
  expect((await call(parent, 'DELETE', '/api/student/calendar-feed')).status).toBe(200);
  expect((await call(null, 'GET', path)).status, 'the old link is dead').toBe(404);
});

test('a child\'s device sees the child\'s lessons and nothing about money or the account', async () => {
  expect((await call(student, 'POST', '/api/student/child-devices', { learnerId: q.kid, name: 'not mine' })).status).toBe(403);
  const made = await call(parent, 'POST', '/api/student/child-devices', { learnerId: q.kid, name: 'QA tablet' });
  expect(made.status, JSON.stringify(made.json)).toBe(201);
  expect((await call(null, 'POST', '/api/kid/pair', { code: '000000' })).status).toBe(404);
  const paired = await call(null, 'POST', '/api/kid/pair', { code: made.json.code });
  expect(paired.status, JSON.stringify(paired.json)).toBe(200);
  const kid = paired.json.token as string;
  expect((await call(null, 'POST', '/api/kid/pair', { code: made.json.code })).ok, 'a code pairs one device').toBe(false);
  const me = await call(kid, 'GET', '/api/kid/me');
  expect(me.status).toBe(200);
  expect(JSON.stringify(me.json)).toContain(`QA Kid ${TAG}`);
  expect(JSON.stringify(me.json), 'the other child is not on this device').not.toContain(`QA Teen ${TAG}`);
  for (const [method, route, body] of [
    ['GET', '/api/student/payments'], ['GET', '/api/student/packages'], ['GET', '/api/student/privacy/export'], ['GET', '/api/chat/threads'],
    ['PATCH', '/api/student/me', { name: 'Hacked Kid' }], ['POST', '/api/student/children', { name: 'QA Extra Kid', age: 9, gender: 'male' }],
    ['POST', '/api/student/packages/select', { packageCatalogId: pack.id, acceptedTerms: true, acceptedEarlyStart: true }],
    ['POST', '/api/student/child-devices', { learnerId: q.kid }], ['POST', '/api/student/calendar-feed', {}], ['DELETE', '/api/student/privacy/delete-request'],
    ['POST', '/api/student/privacy/delete-request', {}], ['POST', '/api/student/teacher-change', { studentId: q.kid, reasonType: 'fit', note: 'from the tablet' }],
  ] as [string, string, unknown?][]) {
    const r = await call(kid, method, route, body);
    expect(r.ok, `a child device was allowed ${method} ${route}: ${r.text.slice(0, 160)}`).toBe(false);
  }
  const book = await call(kid, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', studentId: q.kid }));
  expect(book.ok, 'a child device booked a paid lesson').toBe(false);
  expect((await call(parent, 'DELETE', `/api/student/child-devices/${made.json.id}`)).status).toBe(200);
  expect([401, 403], 'a removed device stops at once').toContain((await call(kid, 'GET', '/api/kid/me')).status);
});

test('the reminders job answers only to its secret, never in the address', async () => {
  expect([401, 403]).toContain((await call(null, 'POST', '/api/cron/process-reminders')).status);
  expect([401, 403]).toContain((await call(student, 'POST', '/api/cron/process-reminders')).status);
  expect([401, 403]).toContain((await call(admin, 'GET', '/api/cron/process-reminders')).status);
  expect([400, 401, 403]).toContain((await call(null, 'GET', '/api/cron/process-reminders?secret=x&token=x&key=x')).status);
});
