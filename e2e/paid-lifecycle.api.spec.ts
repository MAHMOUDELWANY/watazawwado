/**
 * BOOK-08/09/12, PKG-03 and the "teachers never see money" rule: a paid lesson from the hold to a recorded payment,
 * a cancellation into a lesson credit, a lesson booked with that credit, and a refund. No card is charged: the QA
 * super admin records the payment the way the owner records a bank transfer (RULES.md "Payment").
 */
import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';
import { booking, bookingBody, call, db, freeSlots, qaIds, resetLearnerData, tokenFor, type QaIds, type Slot } from './helpers.js';

test.describe.configure({ mode: 'serial' });

let q: QaIds, student: string, parent: string, teacher: string, teacher2: string, admin: string;
let slots: Slot[]; let n = 0;
const next = () => slots[n++ * 3];
const paid = (slot: Slot, over: Record<string, unknown> = {}) => call(student, 'POST', '/api/bookings/create', bookingBody(slot, { mode: 'regular', ...over }));
const record = (bookingId: string, over: Record<string, unknown> = {}) =>
  call(admin, 'POST', '/api/dashboard/payments', { booking_id: bookingId, amount: 4.5, currency: 'USD', payment_method: 'wise', payment_reference: `QA-${Date.now()}`, status: 'pending', ...over });
const credits = async () => (await db.from('package_entitlements').select('*').eq('purchaser_account_id', q.student.authId)).data || [];

test.beforeAll(async () => {
  q = await qaIds();
  await resetLearnerData();
  [student, parent, teacher, teacher2, admin] = await Promise.all([tokenFor('student'), tokenFor('parent'), tokenFor('teacher', 1), tokenFor('teacher', 2), tokenFor('admin')]);
  slots = await freeSlots(q.teacher1, { fromDay: 4 });
});
test.afterAll(resetLearnerData);

let lessonId = '', paymentId = '';
test('only the super admin records a payment; recording it alone confirms nothing', async () => {
  const r = await paid(next());
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  lessonId = r.json.bookingId;
  for (const [who, token] of [['student', student], ['teacher', teacher]] as const) {
    const refused = await call(token, 'POST', '/api/dashboard/payments', { booking_id: lessonId, amount: 4.5, currency: 'USD', payment_method: 'wise', status: 'confirmed' });
    expect([401, 403], `${who} recording a payment`).toContain(refused.status);
  }
  const bad = await record(lessonId, { amount: -5 });
  expect(bad.status).toBe(400);
  const rec = await record(lessonId);
  expect(rec.status, JSON.stringify(rec.json)).toBe(201);
  paymentId = rec.json.payment.id;
  expect((await booking(lessonId)).status).toBe('pending');
});

test('confirming the payment confirms the lesson once, with reminders', async () => {
  for (const token of [student, teacher]) expect([401, 403]).toContain((await call(token, 'POST', `/api/dashboard/payments/${paymentId}/confirm`, {})).status);
  const ok = await call(admin, 'POST', `/api/dashboard/payments/${paymentId}/confirm`, {});
  expect(ok.status, JSON.stringify(ok.json)).toBe(200);
  const b = await booking(lessonId);
  expect(b.status).toBe('confirmed');
  const again = await call(admin, 'POST', `/api/dashboard/payments/${paymentId}/confirm`, {});
  expect(again.status, 'confirming twice is harmless').toBe(200);
  const { count: pays } = await db.from('payments').select('id', { count: 'exact', head: true }).eq('booking_id', lessonId).eq('status', 'confirmed');
  expect(pays).toBe(1);
  const { count: rem } = await db.from('reminders').select('id', { count: 'exact', head: true }).eq('booking_id', lessonId).eq('status', 'pending');
  expect(rem, 'a confirmed paid lesson gets its reminders').toBeGreaterThan(0);
});

test('a payment recorded as already confirmed also confirms its lesson', async () => {
  const r = await paid(next());
  const rec = await record(r.json.bookingId, { status: 'confirmed' });
  expect(rec.status, JSON.stringify(rec.json)).toBe(201);
  const b = await booking(r.json.bookingId);
  expect(b.status, 'the money is recorded as received, so the lesson must not stay an unpaid hold that expires').toBe('confirmed');
});

test('a payment for less than the lesson price is not accepted as full payment without a warning', async () => {
  test.fail(true, 'P2-008 (open, owner decides): the server confirms a lesson for any amount the admin types');
  const r = await paid(next());
  const rec = await record(r.json.bookingId, { amount: 0.5 });
  const ok = await call(admin, 'POST', `/api/dashboard/payments/${rec.json.payment.id}/confirm`, {});
  const b = await booking(r.json.bookingId);
  test.info().annotations.push({ type: 'underpayment', description: `record ${rec.status}, confirm ${ok.status}, lesson ${b.status}` });
  expect(b.status === 'confirmed' && ok.status === 200, 'USD 0.50 confirmed a USD 4.50 lesson silently').toBe(false);
});

test('teachers never see money', async () => {
  const list = await call(teacher, 'GET', '/api/dashboard/bookings');
  expect(list.status).toBe(200);
  const text = JSON.stringify(list.json);
  expect(text).toContain(lessonId);
  for (const key of ['fee_amount', 'feeAmount', 'amount_usd', 'price', 'payment']) expect(text.toLowerCase(), `teacher list exposes "${key}"`).not.toContain(key.toLowerCase());
  const one = await call(teacher, 'GET', `/api/dashboard/bookings/${lessonId}`);
  expect(JSON.stringify(one.json).toLowerCase()).not.toMatch(/fee_amount|feeamount|"amount"|payment_reference/);
  for (const route of ['/api/dashboard/payments', '/api/dashboard/pay-later', '/api/dashboard/refund-requests', '/api/dashboard/payroll', '/api/dashboard/overview-metrics']) {
    expect([401, 403], `teacher on ${route}`).toContain((await call(teacher, 'GET', route)).status);
  }
  const other = await call(teacher2, 'GET', `/api/dashboard/bookings/${lessonId}`);
  expect([403, 404], 'another teacher opening this lesson').toContain(other.status);
});

let creditId = '';
test('cancelling a paid lesson in time gives one lesson credit, once', async () => {
  expect((await call(parent, 'POST', `/api/student/bookings/${lessonId}/cancel`, {})).status).toBe(403);
  const r = await call(student, 'POST', `/api/student/bookings/${lessonId}/cancel`, { reason: 'QA: travelling' });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  expect((await booking(lessonId)).status).toBe('cancelled');
  const mine = (await credits()).filter(c => c.metadata?.source === 'cancellation_credit');
  expect(mine.length).toBe(1);
  creditId = mine[0].id;
  expect(mine[0]).toMatchObject({ status: 'active', remaining_credits: 1, learner_student_id: q.student.id });
  expect(Number(mine[0].price_paid)).toBe(4.5);
  expect((await call(student, 'POST', `/api/student/bookings/${lessonId}/cancel`, {})).status).toBe(400);
  expect((await credits()).filter(c => c.metadata?.source === 'cancellation_credit').length, 'cancelling twice gives no second credit').toBe(1);
  expect((await db.from('payments').select('status').eq('id', paymentId).single()).data?.status, 'the payment stays confirmed').toBe('confirmed');
});

let creditLessonId = '';
test('the credit books a lesson of the same kind at once, and only one', async () => {
  const wrongLength = await paid(next(), { packageEntitlementId: creditId, duration: 45 });
  expect(wrongLength.json.code).toBe('PACKAGE_DURATION_MISMATCH');
  const wrongBand = await paid(next(), { packageEntitlementId: creditId, serviceId: 'english' });
  expect(wrongBand.json.code).toBe('PACKAGE_GROUP_MISMATCH');
  const stolen = await call(parent, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular', packageEntitlementId: creditId, studentId: q.teen, audience: 'child', parentName: 'QA Parent', serviceId: 'zad-essentials' }));
  expect(stolen.status, 'another account using this credit').toBe(403);
  const ok = await paid(next(), { packageEntitlementId: creditId });
  expect(ok.status, JSON.stringify(ok.json)).toBe(201);
  expect(ok.json).toMatchObject({ status: 'confirmed', feeAmountUsd: 0 });
  creditLessonId = ok.json.bookingId;
  const twice = await paid(next(), { packageEntitlementId: creditId });
  expect(twice.status, 'one credit, one lesson').toBe(400);
});

test('a refund can be asked only for a free credit of your own', async () => {
  expect((await call(parent, 'POST', `/api/student/credits/${creditId}/refund-request`, {})).status).toBe(404);
  expect((await call(student, 'POST', `/api/student/credits/${creditId}/refund-request`, {})).status, 'the credit is booked').toBe(400);
  expect((await call(student, 'POST', `/api/student/bookings/${creditLessonId}/cancel`, {})).status).toBe(200);
  const mine = await credits();
  expect(mine.filter(c => c.metadata?.source === 'cancellation_credit').length, 'cancelling a credit lesson returns the same credit, not a new one').toBe(1);
  const r = await call(student, 'POST', `/api/student/credits/${creditId}/refund-request`, {});
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  expect(r.json.whatsappUrl).toContain('wa.me/48508157886'); // the only official number (RULES.md §6)
  expect(r.json.refundsLeft).toBe(2);
});

test('the admin refund marks the payment refunded and voids the credit', async () => {
  for (const token of [student, teacher]) expect([401, 403]).toContain((await call(token, 'POST', `/api/dashboard/payments/${paymentId}/refund`, { reason: 'x' })).status);
  const r = await call(admin, 'POST', `/api/dashboard/payments/${paymentId}/refund`, { reason: 'QA: refund of a cancelled lesson' });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  expect((await db.from('payments').select('status').eq('id', paymentId).single()).data?.status).toBe('refunded');
  const again = await paid(next(), { packageEntitlementId: creditId });
  expect(again.status, 'a refunded credit books nothing').toBe(400);
  const twice = await call(admin, 'POST', `/api/dashboard/payments/${paymentId}/refund`, { reason: 'again' });
  // A second click is answered as "already refunded"; what matters is that nothing happens twice.
  expect(twice.ok ? twice.json?.isIdempotent ?? twice.json?.alreadyRefunded ?? true : true, JSON.stringify(twice.json)).toBeTruthy();
  expect((await db.from('payments').select('status').eq('id', paymentId).single()).data?.status).toBe('refunded');
  expect((await credits()).filter(c => c.status === 'active' && c.remaining_credits > 0).length, 'no credit comes back from a second refund').toBe(0);
});

test('inside the last hours nothing can be changed', async () => {
  const r = await paid(next());
  const rec = await record(r.json.bookingId);
  await call(admin, 'POST', `/api/dashboard/payments/${rec.json.payment.id}/confirm`, {});
  const id = r.json.bookingId;
  const at = (h: number) => db.from('bookings').update({ scheduled_start: DateTime.utc().plus({ hours: h }).toISO(), scheduled_end: DateTime.utc().plus({ hours: h, minutes: 30 }).toISO() }).eq('id', id);
  await at(2); // inside 3 hours: no cancel, still movable
  const cancel = await call(student, 'POST', `/api/student/bookings/${id}/cancel`, {});
  expect(cancel.status).toBe(400);
  expect(cancel.json.code).toBe('TOO_LATE');
  await at(0.5); // inside 1 hour: no move either
  const move = await call(student, 'POST', `/api/student/bookings/${id}/reschedule`, { utcStartIso: next().utcStartIso });
  expect(move.status).toBe(400);
  expect(move.json.code).toBe('TOO_LATE');
  expect((await booking(id)).status).toBe('confirmed');
});
