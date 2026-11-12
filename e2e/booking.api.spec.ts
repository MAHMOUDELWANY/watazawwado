/**
 * BOOK-01/02/03/06/07/08 through the real server as the QA accounts, then the database is checked.
 * Covers the basics and the ways a real family breaks them: double submit, two accounts on one slot, a parent
 * booking for someone else's learner, tampered prices, an abandoned checkout. Nothing is paid (RULES.md).
 */
import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';
import { booking, bookingBody, call, db, freeSlots, qaIds, resetLearnerData, tokenFor, TAG, type QaIds, type Slot } from './helpers.js';
import { qaEmail } from '../scripts/qa/lib.js';
import { QA_PROJECT } from './helpers.js';

test.describe.configure({ mode: 'serial' });

let q: QaIds, student: string, parent: string;
let t1: Slot[], t2: Slot[];
let n = 0;
const next1 = () => t1[n++ * 3]; // spaced out so 30-minute lessons never touch
const forTeen = (slot: Slot, over: Record<string, unknown> = {}) => bookingBody(slot, {
  studentId: q.teen, serviceId: 'zad-essentials', audience: 'child', contactName: `QA Teen ${TAG}`, parentName: `QA Parent ${TAG}`,
  contactEmail: qaEmail(QA_PROJECT, 'parent'), timezone: 'America/New_York', ...over });
const forKid = (slot: Slot, over: Record<string, unknown> = {}) => bookingBody(slot, {
  studentId: q.kid, audience: 'child', contactName: `QA Kid ${TAG}`, parentName: `QA Parent ${TAG}`,
  contactEmail: qaEmail(QA_PROJECT, 'parent'), timezone: 'America/New_York', ...over });

test.beforeAll(async () => {
  q = await qaIds();
  await resetLearnerData();
  [student, parent] = [await tokenFor('student'), await tokenFor('parent')];
  t1 = await freeSlots(q.teacher1, { fromDay: 3 });
  t2 = await freeSlots(q.teacher2, { fromDay: 3 });
  expect(t1.length, 'QA teacher-1 has free slots').toBeGreaterThan(60);
});
test.afterAll(resetLearnerData);

test('a visitor cannot book (no guests)', async () => {
  const r = await call(null, 'POST', '/api/bookings/create', bookingBody(t1[0]));
  expect(r.status).toBe(401);
  expect(r.json.code).toBe('AUTH_REQUIRED');
});

test('the server refuses bad requests before it books anything', async () => {
  const slot = t1[0];
  const cases: [string, Record<string, unknown>, number, string?][] = [
    ['no terms', { acceptedTerms: false }, 400, 'TERMS_REQUIRED'],
    ['paid without early-start consent', { mode: 'regular', acceptedEarlyStart: false }, 400, 'EARLY_START_REQUIRED'],
    ['60-minute trial', { duration: 60 }, 400],
    ['20-minute lesson', { duration: 20 }, 400],
    ['retired subject', { serviceId: 'fiqh' }, 400],
    ['unknown time zone', { timezone: 'Mars/Olympus' }, 400],
    ['a time in the past', { timeSlot: { utcStartIso: DateTime.utc().minus({ days: 1 }).toISO() } }, 400],
    ['outside the teacher\'s hours (02:00 Cairo)', { timeSlot: { utcStartIso: DateTime.fromISO(slot.utcStartIso).setZone('Africa/Cairo').set({ hour: 2, minute: 0 }).toUTC().toISO() } }, 409],
    ['another account\'s learner', { studentId: q.kid }, 403],
  ];
  const lateToday = DateTime.now().setZone('Europe/London').endOf('day').minus({ minutes: 45 }).startOf('minute');
  if (lateToday > DateTime.now().plus({ minutes: 5 })) cases.push(['same day', { timeSlot: { utcStartIso: lateToday.toUTC().toISO() } }, 400, 'SAME_DAY']);
  for (const [name, over, status, code] of cases) {
    const r = await call(student, 'POST', '/api/bookings/create', bookingBody(slot, over));
    expect(r.status, `${name}: ${JSON.stringify(r.json)}`).toBe(status);
    if (code) expect(r.json.code, name).toBe(code);
  }
  const { count } = await db.from('bookings').select('id', { count: 'exact', head: true }).eq('student_id', q.student.id);
  expect(count).toBe(0);
});

let trialId = '', trialSlot: Slot;
test('free trial: confirmed at once, for the account, with its own teacher', async () => {
  trialSlot = next1();
  const r = await call(student, 'POST', '/api/bookings/create', bookingBody(trialSlot, { contactEmail: 'someone-else@example.com', feeAmountUsd: 99, status: 'pending' }));
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  expect(r.json).toMatchObject({ status: 'confirmed', feeAmountUsd: 0, isTrial: true });
  trialId = r.json.bookingId;
  const b = await booking(trialId);
  expect(b).toMatchObject({
    status: 'confirmed', booking_type: 'trial', duration_minutes: 30, student_id: q.student.id, teacher_id: q.teacher1,
    contact_email: qaEmail(QA_PROJECT, 'student'), hold_expires_at: null, package_entitlement_id: null,
  });
  expect(Number(b.fee_amount_usd)).toBe(0);
  expect(b.terms_version).toBeTruthy();
  expect(new Date(b.scheduled_start).toISOString()).toBe(new Date(trialSlot.utcStartIso).toISOString());
  const { data: reminders } = await db.from('reminders').select('reminder_type, status').eq('booking_id', trialId);
  expect(reminders?.length, 'reminders are scheduled for a confirmed lesson').toBeGreaterThan(0);
});

test('one free trial per learner, also on a double click', async () => {
  const again = await call(student, 'POST', '/api/bookings/create', bookingBody(next1()));
  expect(again.status).toBe(400);
  // The teen has no trial yet: two requests at the same instant for two different times must give one trial.
  const [a, b] = [next1(), next1()];
  const both = await Promise.all([a, b].map(s => call(parent, 'POST', '/api/bookings/create', forTeen(s))));
  const { data: trials } = await db.from('bookings').select('id, status').eq('student_id', q.teen).eq('booking_type', 'trial').in('status', ['pending', 'confirmed', 'rescheduled']);
  expect(trials?.length, `two trials at once gave ${both.map(r => r.status)}`).toBe(1);
  expect(both.map(r => r.status).sort()).toEqual([201, 400]);
});

test('a parent cannot book for a learner outside the family', async () => {
  // P2-020: a parent who only follows their children must pick a child; the lesson is never booked for the parent.
  const noChild = await call(parent, 'POST', '/api/bookings/create', forTeen(next1(), { studentId: undefined, mode: 'regular', teacherId: q.teacher1 }));
  expect(noChild.status, JSON.stringify(noChild.json)).toBe(400);
  expect(noChild.json.code).toBe('LEARNER_REQUIRED');
  const r = await call(parent, 'POST', '/api/bookings/create', forTeen(next1(), { studentId: q.student.id, mode: 'regular' }));
  expect(r.status).toBe(403);
});

test('a booked time leaves the calendar and nobody else can take it', async () => {
  const still = (await freeSlots(q.teacher1, { fromDay: 3 })).some(s => s.utcStartIso === trialSlot.utcStartIso);
  expect(still, 'the trial time is gone from availability').toBe(false);
  const r = await call(parent, 'POST', '/api/bookings/create', forTeen(trialSlot, { mode: 'regular' }));
  expect(r.status).toBe(409);
});

test('the last free time asked for by two accounts at once goes to one of them', async () => {
  const slot = next1();
  const rs = await Promise.all([
    call(student, 'POST', '/api/bookings/create', bookingBody(slot, { mode: 'regular' })),
    call(parent, 'POST', '/api/bookings/create', forTeen(slot, { mode: 'regular' })),
  ]);
  expect(rs.map(r => r.status).sort(), JSON.stringify(rs.map(r => r.json))).toEqual([201, 409]);
  const { count } = await db.from('bookings').select('id', { count: 'exact', head: true }).eq('teacher_id', q.teacher1)
    .eq('scheduled_start', slot.utcStartIso).in('status', ['pending', 'confirmed', 'rescheduled']);
  expect(count).toBe(1);
  await resetPaidHolds();
});

async function resetPaidHolds() {
  await db.from('bookings').update({ status: 'cancelled', cancellation_reason: 'QA reset' }).in('student_id', [q.student.id, q.teen, q.kid]).eq('status', 'pending');
}

let paidId = '', paidRef = '', paidSlot: Slot;
test('a paid lesson waits for payment: pending, server price, a short hold, no reminders', async () => {
  paidSlot = next1();
  const r = await call(student, 'POST', '/api/bookings/create', bookingBody(paidSlot, { mode: 'regular', feeAmountUsd: 0, fee_amount_usd: 0, price: 0, status: 'confirmed', paymentStatus: 'paid' }));
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  expect(r.json).toMatchObject({ status: 'pending', feeAmountUsd: 5 }); // $10 an hour, 30 minutes (RULES.md §3)
  [paidId, paidRef] = [r.json.bookingId, r.json.referenceCode];
  const b = await booking(paidId);
  expect(b.status).toBe('pending');
  expect(Number(b.fee_amount_usd)).toBe(5);
  const holdMin = (new Date(b.hold_expires_at).getTime() - Date.now()) / 60_000;
  expect(holdMin).toBeGreaterThan(30);
  expect(holdMin).toBeLessThan(36);
  const { count } = await db.from('reminders').select('id', { count: 'exact', head: true }).eq('booking_id', paidId);
  expect(count, 'no reminders before payment').toBe(0);
});

test('checkout opens at Stripe for the server price and confirms nothing by itself', async () => {
  const intent = await call(student, 'POST', '/api/payments/create-intent', { gateway: 'stripe', targetType: 'booking', targetId: paidRef, amount: 0.01, successUrl: 'https://evil.example/thanks' });
  // P2-001: with no working Stripe key on this machine the gateway answers 500; the rest still has to hold.
  const gatewayUp = intent.status !== 500;
  test.info().annotations.push({ type: 'stripe', description: gatewayUp ? 'reached' : 'not reachable with the local key: the Stripe page itself was not checked' });
  if (gatewayUp) {
    expect(intent.status, JSON.stringify(intent.json)).toBe(200);
    expect(intent.json.amount).toBe(5);
    expect(intent.json.sessionUrl).toMatch(/^https:\/\/checkout\.stripe\.com\//);
    // Coming back without paying leaves the lesson unpaid.
    const unpaid = await call(student, 'POST', '/api/payments/stripe/verify', { sessionId: intent.json.sessionId });
    expect(unpaid.ok).toBe(false);
  } else {
    expect(JSON.stringify(intent.json), 'no provider detail reaches the client').not.toMatch(/sk_|Expired|API Key/i);
  }
  const fake = await call(student, 'POST', '/api/payments/stripe/verify', { sessionId: 'cs_test_made_up' });
  expect(fake.ok).toBe(false);
  expect((await booking(paidId)).status).toBe('pending');
  const { count } = await db.from('payments').select('id', { count: 'exact', head: true }).eq('booking_id', paidId).eq('status', 'confirmed');
  expect(count).toBe(0);
  const mine = await call(student, 'GET', '/api/student/bookings');
  expect(JSON.stringify(mine.json)).toContain(paidRef);
});

test('an unpaid lesson cannot be cancelled into a credit, moved, or joined', async () => {
  expect((await call(student, 'POST', `/api/student/bookings/${paidId}/cancel`, {})).status).toBe(400);
  expect((await call(student, 'POST', `/api/student/bookings/${paidId}/reschedule`, { utcStartIso: next1().utcStartIso })).status).toBe(400);
  const { count } = await db.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('purchaser_account_id', q.student.authId);
  expect(count, 'no lesson credit from an unpaid lesson').toBe(0);
});

test('letting go of the held time frees it; another account cannot do it for you', async () => {
  expect((await call(parent, 'POST', `/api/student/bookings/${paidId}/release-hold`, {})).status).toBe(403);
  const r = await call(student, 'POST', `/api/student/bookings/${paidId}/release-hold`, {});
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  expect((await booking(paidId)).status).toBe('cancelled');
  expect((await freeSlots(q.teacher1, { fromDay: 3 })).some(s => s.utcStartIso === paidSlot.utcStartIso)).toBe(true);
  expect((await call(student, 'POST', '/api/payments/create-intent', { gateway: 'stripe', targetType: 'booking', targetId: paidRef })).status).toBe(400);
});

test('an abandoned checkout: the hold ends, the time comes back, paying is refused', async () => {
  const slot = next1();
  const r = await call(student, 'POST', '/api/bookings/create', bookingBody(slot, { mode: 'regular' }));
  expect(r.status).toBe(201);
  await db.from('bookings').update({ hold_expires_at: DateTime.utc().minus({ minutes: 1 }).toISO() }).eq('id', r.json.bookingId);
  const late = await call(student, 'POST', '/api/payments/create-intent', { gateway: 'stripe', targetType: 'booking', targetId: r.json.referenceCode });
  expect([400, 410]).toContain(late.status);
  expect((await freeSlots(q.teacher1, { fromDay: 3 })).some(s => s.utcStartIso === slot.utcStartIso), 'the time is free again').toBe(true);
  expect((await booking(r.json.bookingId)).status).toBe('cancelled');
});

test('a learner cannot be in two lessons at the same time', async () => {
  // The teen already has a trial with teacher-1; the same minute with teacher-2 is a clash for the child.
  const { data: trial } = await db.from('bookings').select('scheduled_start').eq('student_id', q.teen).eq('booking_type', 'trial').eq('status', 'confirmed').single();
  const start = new Date(trial!.scheduled_start).toISOString();
  const r = await call(parent, 'POST', '/api/bookings/create', forTeen({ ...t2[0], utcStartIso: start }, { mode: 'regular', teacherId: q.teacher2 }));
  expect(r.status, `a second lesson at the same time for the same child was accepted: ${JSON.stringify(r.json)}`).toBe(409);
});

test('moving a trial: once, to another day, only by its own account', async () => {
  const target = next1();
  expect((await call(parent, 'POST', `/api/student/bookings/${trialId}/reschedule`, { utcStartIso: target.utcStartIso })).status).toBe(403);
  const r = await call(student, 'POST', `/api/student/bookings/${trialId}/reschedule`, { utcStartIso: target.utcStartIso });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  const b = await booking(trialId);
  expect(b).toMatchObject({ status: 'rescheduled', reschedule_count: 1 });
  expect(new Date(b.scheduled_start).toISOString()).toBe(new Date(target.utcStartIso).toISOString());
  expect(new Date(b.scheduled_end).getTime() - new Date(b.scheduled_start).getTime()).toBe(30 * 60_000);
  const { data: rem } = await db.from('reminders').select('scheduled_for, status').eq('booking_id', trialId).eq('status', 'pending');
  for (const x of rem || []) expect(new Date(x.scheduled_for).getTime(), 'pending reminders follow the new time').toBeGreaterThan(new Date(target.utcStartIso).getTime() - 25 * 3600_000);
  expect((await freeSlots(q.teacher1, { fromDay: 3 })).some(s => s.utcStartIso === trialSlot.utcStartIso), 'the old time is free again').toBe(true);
  const second = await call(student, 'POST', `/api/student/bookings/${trialId}/reschedule`, { utcStartIso: next1().utcStartIso });
  expect(second.status).toBe(400);
  expect(second.json.code).toBe('TRIAL_RESCHEDULE_USED');
});

test('cancelling a trial: only its own account, then a 48-hour wait for a new one', async () => {
  expect((await call(parent, 'POST', `/api/student/bookings/${trialId}/cancel`, {})).status).toBe(403);
  const r = await call(student, 'POST', `/api/student/bookings/${trialId}/cancel`, { reason: 'QA: plans changed' });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
  expect((await booking(trialId)).status).toBe('cancelled');
  const { count } = await db.from('reminders').select('id', { count: 'exact', head: true }).eq('booking_id', trialId).eq('status', 'pending');
  expect(count, 'a cancelled lesson gets no more reminders').toBe(0);
  const again = await call(student, 'POST', '/api/bookings/create', bookingBody(next1()));
  expect(again.status).toBe(400);
  expect(again.json.code).toBe('TRIAL_COOLDOWN');
  expect((await call(student, 'POST', `/api/student/bookings/${trialId}/cancel`, {})).status).toBe(400); // twice
});

// Last on purpose: it fails until migration 20261110000210 is applied (finding P2-003), and must not stop the rest.
test('each child gets their own trial with their own teacher; a taken trial is not given twice', async () => {
  const r = await call(parent, 'POST', '/api/bookings/create', forKid(t2[0]));
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  const b = await booking(r.json.bookingId);
  expect(b).toMatchObject({ status: 'confirmed', student_id: q.kid, teacher_id: q.teacher2, contact_email: qaEmail(QA_PROJECT, 'parent') });
  expect((await call(parent, 'POST', '/api/bookings/create', forKid(t2[6]))).status).toBe(400);
});
