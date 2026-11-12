import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { DateTime } from 'luxon';
import { anonClient } from '../scripts/qa/lib.js';
import { qa, skipReason, type Qa } from './helpers/qa.js';

/**
 * P3, BOOK-01/02/07/08, PKG-03: the booking rules against real rows, as the QA accounts. Each test states a rule from
 * RULES.md §2 and tries to get round it: junk and hostile input, two requests in the same instant, the database
 * functions a browser can call directly, and a credit spent twice.
 */

describe('P3 booking rules with real rows', () => {
  let q: Qa, ids: Awaited<ReturnType<Qa['qaIds']>>, student: string, parent: string, teacher: string, admin: string;
  let slots: Awaited<ReturnType<Qa['freeSlots']>> = [], n = 0;
  const next = () => slots[n++ * 3];
  const book = (token: string | null, slot: any, over: Record<string, unknown> = {}) => q.call(token, 'POST', '/api/bookings/create', q.bookingBody(slot, over));
  const rowsOf = async (studentId: string) => (await q.db.from('bookings').select('*').eq('student_id', studentId)).data || [];

  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    ids = await q.qaIds();
    await q.resetLearnerData();
    [student, parent, teacher, admin] = await Promise.all([q.tokenFor('student'), q.tokenFor('parent'), q.tokenFor('teacher', 1), q.tokenFor('admin')]);
    slots = await q.freeSlots(ids.teacher1, { fromDay: 6 });
  });
  after(async () => { if (q) await q.resetLearnerData(); });

  it('junk and hostile input is refused before anything is written', async (t) => {
    if (!q) return t.skip(skipReason);
    const slot = next();
    const tomorrowNight = DateTime.utc().plus({ days: 3 }).set({ hour: 1, minute: 0, second: 0, millisecond: 0 }); // 03:00 Cairo, outside the QA teacher's hours
    const cases: [string, Record<string, unknown>, number[]][] = [
      ['a time in the past', { timeSlot: { utcStartIso: '2020-01-01T10:00:00Z' } }, [400]],
      ['today', { timeSlot: { utcStartIso: DateTime.utc().plus({ minutes: 30 }).toISO() } }, [400, 409]],
      ['a time outside the teacher\'s hours', { timeSlot: { utcStartIso: tomorrowNight.toISO() } }, [409]],
      ['a time between two calendar times (P3-019)', { timeSlot: { utcStartIso: DateTime.fromISO(slot.utcStartIso).plus({ minutes: 13 }).toISO() } }, [409]],
      ['a time with stray seconds', { timeSlot: { utcStartIso: DateTime.fromISO(slot.utcStartIso).plus({ seconds: 7 }).toISO() } }, [409]],
      ['years ahead', { timeSlot: { utcStartIso: DateTime.fromISO(slot.utcStartIso).plus({ years: 3 }).toISO() } }, [400, 409]],
      ['an unreadable time', { timeSlot: { utcStartIso: 'tomorrow-ish' } }, [400]],
      ['a time object instead of text', { timeSlot: { utcStartIso: { $gt: '' } } }, [400]],
      ['no time', { timeSlot: null }, [400]],
      ['90 minutes', { duration: 90 }, [400]],
      ['minus 30 minutes', { duration: -30 }, [400]],
      ['a length that is not a number', { duration: 'thirty', mode: 'regular' }, [400]],
      ['a 60-minute trial', { duration: 60 }, [400]],
      ['a made-up time zone', { timezone: "Europe/London'; --" }, [400]],
      ['a subject that does not exist', { serviceId: 'free-lessons-forever' }, [400, 409]],
      ['a subject with filter syntax', { serviceId: 'quran-reading,is_active.eq.false' }, [400, 409]],
      ['a teacher that does not exist', { teacherId: randomUUID() }, [400, 409]],
      ['a learner of another family', { studentId: ids.kid }, [403]],
      ['a learner id that is not an id', { studentId: "x' or '1'='1" }, [403]],
      ['a package of nobody', { mode: 'regular', packageEntitlementId: randomUUID() }, [400, 403]],
      ['no terms', { acceptedTerms: 'yes' }, [400]],
      ['a paid lesson without the early-start request', { mode: 'regular', acceptedEarlyStart: undefined }, [400]],
    ];
    const wrong: string[] = [];
    for (const [name, over, expected] of cases) {
      const r = await book(student, slot, over);
      if (!expected.includes(r.status)) wrong.push(`${name}: ${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
    }
    const written = (await rowsOf(ids.student.id)).length;
    if (written) await q.resetLearnerData(); // so one hole does not fail the tests after it
    assert.deepStrictEqual(wrong, []);
    assert.strictEqual(written, 0, 'nothing was written');
  });

  it('who may book: a signed-in family only, never a visitor, a broken token or a staff account', async (t) => {
    if (!q) return t.skip(skipReason);
    const slot = next();
    for (const [who, token] of [['a visitor', null], ['a made-up token', 'eyJhbGciOiJIUzI1NiJ9.e30.x'], ['a dev token', 'dev-student-token']] as const) {
      const r = await book(token, slot);
      assert.strictEqual(r.status, 401, `${who}: ${r.status}`);
    }
    // P3-006: a teacher is refused as staff; the super admin has no learner row, so there is nobody to book for.
    for (const [who, token, expected] of [['a teacher', teacher, 403], ['the super admin', admin, 409]] as const) {
      const r = await book(token, slot, { contactName: 'QA Staff Booking' });
      assert.strictEqual(r.status, expected, `${who} booking a learner lesson for their own email: ${r.status} ${JSON.stringify(r.json).slice(0, 120)}`);
    }
    const { count } = await q.db.from('bookings').select('id', { count: 'exact', head: true }).eq('contact_name', 'QA Staff Booking');
    assert.strictEqual(count, 0);
  });

  it('P3-009: a learner with no teacher cannot be booked at an hour no teacher offers', async (t) => {
    if (!q) return t.skip(skipReason);
    // 03:00 Cairo, a paid lesson (it would wait for payment, so even a miss here sends nothing to a calendar).
    const night = DateTime.utc().plus({ days: 5 }).set({ hour: 1, minute: 0, second: 0, millisecond: 0 });
    await q.db.from('students').update({ assigned_teacher_id: null }).eq('id', ids.student.id);
    try {
      const r = await q.call(student, 'POST', '/api/bookings/create', { ...q.bookingBody({ utcStartIso: night.toISO()!, date: night.toISODate()!, time24: '01:00' }, { mode: 'regular' }), teacherId: undefined });
      assert.strictEqual(r.status, 409, JSON.stringify(r.json));
      assert.strictEqual((await rowsOf(ids.student.id)).length, 0);
    } finally {
      await q.db.from('students').update({ assigned_teacher_id: ids.teacher1 }).eq('id', ids.student.id);
      await q.db.from('bookings').delete().eq('student_id', ids.student.id).eq('scheduled_start', night.toISO());
    }
  });

  it('the price, the status and the contact email come from the server, whatever the browser sends', async (t) => {
    if (!q) return t.skip(skipReason);
    const r = await book(student, next(), {
      mode: 'regular', contactEmail: 'someone.else@example.com', feeAmountUsd: 0, fee_amount_usd: 0, status: 'confirmed', booking_type: 'trial',
      payment_plan: 'pay_later', hold_expires_at: null, scheduledEnd: '2099-01-01T00:00:00Z', teacher_id: randomUUID(), student_id: ids.kid,
    });
    assert.strictEqual(r.status, 201, JSON.stringify(r.json));
    const b = await q.booking(r.json.bookingId);
    assert.deepStrictEqual([b.status, Number(b.fee_amount_usd), b.booking_type, b.payment_plan, b.student_id, b.teacher_id],
      ['pending', 4.5, 'regular', 'pay_now', ids.student.id, ids.teacher1]);
    assert.match(b.contact_email, /\+qa-p\d-student-1@/);
    assert.strictEqual(DateTime.fromISO(b.scheduled_end).diff(DateTime.fromISO(b.scheduled_start), 'minutes').minutes, 30);
    const holdMinutes = DateTime.fromISO(b.hold_expires_at).diffNow('minutes').minutes;
    assert.ok(holdMinutes > 30 && holdMinutes <= 35, `hold ${holdMinutes}`);
    assert.ok(!('management_token_hash' in r.json) && !JSON.stringify(r.json).includes(b.management_token_hash), 'the stored hash never leaves');
  });

  it('two families asking for the same time at once: one gets it', async (t) => {
    if (!q) return t.skip(skipReason);
    const slot = next();
    const both = await Promise.all([
      book(student, slot, { mode: 'regular' }),
      book(parent, slot, { mode: 'regular', studentId: ids.teen, teacherId: ids.teacher1, contactName: 'QA Teen', audience: 'child', parentName: 'QA Parent' }),
    ]);
    const codes = both.map(r => r.status).sort();
    assert.deepStrictEqual(codes, [201, 409], JSON.stringify(both.map(r => [r.status, r.json?.error])));
    const { count } = await q.db.from('bookings').select('id', { count: 'exact', head: true })
      .eq('teacher_id', ids.teacher1).eq('scheduled_start', slot.utcStartIso).in('status', ['pending', 'confirmed', 'rescheduled']);
    assert.strictEqual(count, 1);
  });

  it('one free trial per learner, also when two requests race', async (t) => {
    if (!q) return t.skip(skipReason);
    const [a, b] = [next(), next()];
    const both = await Promise.all([book(student, a), book(student, b)]);
    assert.deepStrictEqual(both.map(r => r.status).sort(), [201, 400], JSON.stringify(both.map(r => [r.status, r.json?.error])));
    assert.strictEqual((await book(student, next())).status, 400, 'a third try');
    const trials = (await rowsOf(ids.student.id)).filter(r => r.booking_type === 'trial' && r.status !== 'cancelled');
    assert.strictEqual(trials.length, 1);
    assert.deepStrictEqual([trials[0].status, Number(trials[0].fee_amount_usd)], ['confirmed', 0]);
  });

  // Migration 20261111000000 (applied 2026-11-11) took these two functions away from the browser roles.
  it('P3-004: the browser cannot move or cancel a lesson through the database, round the rules', async (t) => {
    if (!q) return t.skip(skipReason);
    await q.resetLearnerData();
    t.after(() => q.resetLearnerData());
    const slot = next();
    const r = await book(student, slot);
    assert.strictEqual(r.status, 201, JSON.stringify(r.json));
    const anon = anonClient();
    // 03:00 Cairo: outside the teacher's hours. The server's own route refuses it; the database function did not check.
    const night = DateTime.fromISO(slot.utcStartIso).plus({ days: 1 }).set({ hour: 1, minute: 0 });
    const move = await anon.rpc('reschedule_booking_by_management', {
      p_reference_code: r.json.referenceCode, p_management_token: r.json.managementToken,
      p_new_start: night.toISO(), p_new_end: night.plus({ minutes: 30 }).toISO(), p_cairo_time_display: 'x',
    });
    const cancel = await anon.rpc('cancel_booking_by_management', { p_reference_code: r.json.referenceCode, p_management_token: r.json.managementToken, p_reason: 'round the rules' });
    const b = await q.booking(r.json.bookingId);
    assert.ok(move.error, 'the move is refused');
    assert.ok(cancel.error, 'the cancel is refused');
    assert.deepStrictEqual([b.status, b.scheduled_start && DateTime.fromISO(b.scheduled_start).toMillis()], ['confirmed', DateTime.fromISO(slot.utcStartIso).toMillis()], 'the lesson is untouched');
  });

  it('the student\'s own move keeps every rule: once for a trial, never today, never outside hours, never onto another lesson', async (t) => {
    if (!q) return t.skip(skipReason);
    await q.resetLearnerData();
    const made = await book(student, next());
    assert.strictEqual(made.status, 201, JSON.stringify(made.json));
    const mine = { id: made.json.bookingId as string };
    const move = (utcStartIso: unknown, token = student) => q.call(token, 'POST', `/api/student/bookings/${mine.id}/reschedule`, { utcStartIso });
    assert.strictEqual((await move(next().utcStartIso, parent)).status, 403, 'another family');
    assert.strictEqual((await move(DateTime.utc().plus({ minutes: 30 }).toISO())).status, 400, 'today');
    assert.strictEqual((await move('2020-01-01T00:00:00Z')).status, 400, 'the past');
    assert.strictEqual((await move({ $gt: '' })).status, 400, 'not a time');
    const night = DateTime.utc().plus({ days: 4 }).set({ hour: 1, minute: 0, second: 0, millisecond: 0 });
    assert.strictEqual((await move(night.toISO())).status, 409, 'outside the teacher\'s hours');
    const target = next();
    const [first, second] = await Promise.all([move(target.utcStartIso), move(next().utcStartIso)]);
    assert.deepStrictEqual([first.status, second.status].sort(), [200, 409].sort(), `two moves at once: ${first.status}/${second.status} ${JSON.stringify([first.json, second.json]).slice(0, 200)}`);
    const again = await move(next().utcStartIso);
    assert.strictEqual(again.status, 400, 'a trial moves only once');
    assert.strictEqual(again.json.code, 'TRIAL_RESCHEDULE_USED');
    assert.strictEqual((await q.booking(mine.id)).reschedule_count, 1);
  });

  it('a lesson credit books one lesson, also when two bookings race for it', async (t) => {
    if (!q) return t.skip(skipReason);
    await q.resetLearnerData();
    // A paid lesson, paid (the admin records the transfer), cancelled in time: one lesson credit.
    const paid = await book(student, next(), { mode: 'regular' });
    assert.strictEqual(paid.status, 201, JSON.stringify(paid.json));
    const rec = await q.call(admin, 'POST', '/api/dashboard/payments', { booking_id: paid.json.bookingId, amount: 4.5, currency: 'USD', payment_method: 'wise', payment_reference: `QA-P3-${Date.now()}`, status: 'confirmed' });
    assert.strictEqual(rec.status, 201, JSON.stringify(rec.json));
    const cancelled = await q.call(student, 'POST', `/api/student/bookings/${paid.json.bookingId}/cancel`, {});
    assert.strictEqual(cancelled.status, 200, JSON.stringify(cancelled.json));
    const creditId = cancelled.json.creditId as string;
    assert.ok(creditId, 'a lesson credit came back');
    assert.strictEqual((await q.call(student, 'POST', `/api/student/bookings/${paid.json.bookingId}/cancel`, {})).status, 400, 'cancelling twice gives no second credit');
    const { count: credits } = await q.db.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('purchaser_account_id', ids.student.authId).eq('status', 'active');
    assert.strictEqual(credits, 1);

    assert.strictEqual((await book(parent, next(), { mode: 'regular', packageEntitlementId: creditId, studentId: ids.teen, teacherId: ids.teacher1 })).status, 403, 'another family spending it');
    assert.strictEqual((await book(student, next(), { mode: 'regular', packageEntitlementId: creditId, duration: 60 })).status, 400, 'a longer lesson than it was bought for');
    const both = await Promise.all([
      book(student, next(), { mode: 'regular', packageEntitlementId: creditId }),
      book(student, next(), { mode: 'regular', packageEntitlementId: creditId }),
    ]);
    const live = (await rowsOf(ids.student.id)).filter(r => r.package_entitlement_id === creditId && ['pending', 'confirmed', 'rescheduled'].includes(r.status));
    assert.strictEqual(live.length, 1, `one credit, ${live.length} lessons booked (${both.map(r => r.status).join('/')})`);
    assert.strictEqual((await book(student, next(), { mode: 'regular', packageEntitlementId: creditId })).status, 400, 'the credit is spoken for');
  });
});
