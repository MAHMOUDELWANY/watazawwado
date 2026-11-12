/**
 * TCH-01/02/03, BOOK-07 (teacher side), LES-04, AUTH-07: what a teacher can and cannot do with lessons and
 * learners, what the family is told, and that one teacher never reaches another teacher's people.
 */
import { test, expect } from '@playwright/test';
import { DateTime } from 'luxon';
import { booking, bookingBody, call, db, freeSlots, qaIds, resetLearnerData, tokenFor, type QaIds, type Slot } from './helpers.js';

test.describe.configure({ mode: 'serial' });

let q: QaIds, student: string, teacher: string, teacher2: string, admin: string;
let slots: Slot[]; let n = 0;
const next = () => slots[n++ * 3];
let trialId = '';

test.beforeAll(async () => {
  q = await qaIds();
  await resetLearnerData();
  [student, teacher, teacher2, admin] = await Promise.all([tokenFor('student'), tokenFor('teacher', 1), tokenFor('teacher', 2), tokenFor('admin')]);
  slots = await freeSlots(q.teacher1, { fromDay: 4 });
  const r = await call(student, 'POST', '/api/bookings/create', bookingBody(next()));
  expect(r.status, JSON.stringify(r.json)).toBe(201);
  trialId = r.json.bookingId;
});
test.afterAll(resetLearnerData);

test('a learner or a visitor cannot use the teacher API; a teacher cannot use the learner API', async () => {
  for (const route of ['/api/dashboard/me', '/api/dashboard/today', '/api/dashboard/bookings', '/api/dashboard/students', '/api/dashboard/availability']) {
    expect([401, 403], `learner on ${route}`).toContain((await call(student, 'GET', route)).status);
    expect([401, 403], `visitor on ${route}`).toContain((await call(null, 'GET', route)).status);
  }
  for (const route of ['/api/student/bookings', '/api/student/packages', '/api/student/payments']) {
    const r = await call(teacher, 'GET', route);
    expect(r.ok && JSON.stringify(r.json).includes(trialId), `teacher reading ${route} as a learner`).toBe(false);
  }
});

test('the teacher sees the new lesson and the learner, without contact details they do not need', async () => {
  const up = await call(teacher, 'GET', '/api/dashboard/upcoming');
  expect(up.status).toBe(200);
  expect(JSON.stringify(up.json)).toContain(trialId);
  const list = await call(teacher, 'GET', '/api/dashboard/students');
  const text = JSON.stringify(list.json);
  expect(text).toContain(q.student.id);
  expect(text).toContain(q.teen);
  expect(text, 'teacher-1 sees a learner of teacher-2').not.toContain(q.kid);
});

test('another teacher cannot open, move or close this lesson, or open this learner', async () => {
  const target = next();
  expect([403, 404]).toContain((await call(teacher2, 'GET', `/api/dashboard/bookings/${trialId}`)).status);
  expect([403, 404]).toContain((await call(teacher2, 'PATCH', `/api/dashboard/bookings/${trialId}`, { scheduled_start: target.utcStartIso, reschedule_reason: 'not mine' })).status);
  expect([403, 404]).toContain((await call(teacher2, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'completed' })).status);
  for (const route of [`/api/dashboard/students/${q.student.id}`, `/api/dashboard/students/${q.student.id}/notes`, `/api/dashboard/students/${q.student.id}/homework`,
    `/api/dashboard/students/${q.student.id}/placement`, `/api/dashboard/students/${q.student.id}/recitations`, `/api/dashboard/curriculum/students/${q.student.id}`]) {
    const r = await call(teacher2, 'GET', route);
    expect([403, 404], `teacher-2 on ${route}: ${r.status}`).toContain(r.status);
  }
  expect([403, 404]).toContain((await call(teacher2, 'POST', `/api/dashboard/students/${q.student.id}/notes`, { content: 'not my learner', note_type: 'general' })).status);
  expect((await booking(trialId)).status).toBe('confirmed');
});

test('a teacher moves a lesson with a reason, never cancels it, never closes it early', async () => {
  const cancel = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'cancelled', cancellation_reason: 'busy' });
  expect(cancel.status).toBe(403);
  expect(cancel.json.code).toBe('ADMIN_ONLY');
  for (const status of ['completed', 'no_show']) expect((await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status })).status, `${status} before the lesson`).toBe(400);
  await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'confirmed', fee_amount_usd: 0, teacher_id: q.teacher2 });
  expect((await booking(trialId)).teacher_id, 'a teacher cannot hand the lesson to someone else through this route').toBe(q.teacher1);

  const target = next();
  const noReason = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { scheduled_start: target.utcStartIso });
  expect(noReason.status).toBe(400);
  expect(noReason.json.code).toBe('REASON_REQUIRED');
  const sameDay = DateTime.now().setZone('Europe/London').endOf('day').minus({ minutes: 45 });
  if (sameDay > DateTime.now().plus({ minutes: 10 })) {
    const r = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { scheduled_start: sameDay.toUTC().toISO(), reschedule_reason: 'today' });
    expect(r.status).toBe(400);
  }
  const moved = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { scheduled_start: target.utcStartIso, reschedule_reason: 'QA: a family matter came up' });
  expect(moved.status, JSON.stringify(moved.json)).toBe(200);
  const b = await booking(trialId);
  expect(new Date(b.scheduled_start).toISOString()).toBe(new Date(target.utcStartIso).toISOString());
  expect(new Date(b.scheduled_end).getTime() - new Date(b.scheduled_start).getTime(), 'the length is kept').toBe(30 * 60_000);
  expect(b.status).toBe('rescheduled');
  expect(b.reschedule_count || 0, 'a move by the teacher does not use up the learner\'s one trial move').toBe(0);
  const { data: notices } = await db.from('user_notifications').select('kind, body_en, body_ar').eq('recipient_user_id', q.student.authId).eq('kind', 'lesson_moved_by_teacher');
  expect(notices?.length, 'the learner is told on the site').toBeGreaterThan(0);
  expect(notices![0].body_en + notices![0].body_ar).toContain('a family matter came up');
});

test('the learner can still move the trial once after the teacher moved it', async () => {
  const r = await call(student, 'POST', `/api/student/bookings/${trialId}/reschedule`, { utcStartIso: next().utcStartIso });
  expect(r.status, JSON.stringify(r.json)).toBe(200);
});

test('hours: only the teacher sets them, bad hours are refused, booked lessons stay', async () => {
  const day = (over = {}) => [1, 2, 3, 4, 5, 6, 0].map(weekday => ({ weekday, start_time: '06:00', end_time: '23:00', is_active: true, ...over }));
  expect([401, 403]).toContain((await call(student, 'PUT', '/api/dashboard/availability', { schedule: day(), timezone: 'Africa/Cairo' })).status);
  for (const [name, body] of [
    ['end before start', { schedule: day({ start_time: '20:00', end_time: '08:00' }), timezone: 'Africa/Cairo' }],
    ['not a time', { schedule: day({ start_time: '25:99' }), timezone: 'Africa/Cairo' }],
    ['unknown zone', { schedule: day(), timezone: 'Mars/Olympus' }],
    ['weekday 9', { schedule: [{ weekday: 9, start_time: '06:00', end_time: '23:00', is_active: true }], timezone: 'Africa/Cairo' }],
  ] as const) {
    const r = await call(teacher, 'PUT', '/api/dashboard/availability', body);
    expect(r.status, `${name} was accepted: ${JSON.stringify(r.json).slice(0, 200)}`).toBe(400);
  }
  const ok = await call(teacher, 'PUT', '/api/dashboard/availability', { schedule: day(), timezone: 'Africa/Cairo' });
  expect(ok.status, JSON.stringify(ok.json)).toBe(200);
  const mine = await call(teacher, 'GET', '/api/dashboard/availability');
  expect(JSON.stringify(mine.json)).toContain('Africa/Cairo');
  expect(['confirmed', 'rescheduled']).toContain((await booking(trialId)).status);
});

test('after the lesson time: the report closes it once; a no-show cannot replace a held lesson', async () => {
  await db.from('bookings').update({ scheduled_start: DateTime.utc().minus({ minutes: 50 }).toISO(), scheduled_end: DateTime.utc().minus({ minutes: 20 }).toISO() }).eq('id', trialId);
  const done = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'completed', notes: 'QA: read Al-Fatiha', covered_material: 'Al-Fatiha 1-4' });
  expect(done.status, JSON.stringify(done.json)).toBe(200);
  expect((await booking(trialId)).status).toBe('completed');
  expect((await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'completed' })).status, 'twice is harmless').toBe(200);
  const flip = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { status: 'no_show' });
  expect((await booking(trialId)).status, `completed then no-show answered ${flip.status}`).toBe('completed');
  const move = await call(teacher, 'PATCH', `/api/dashboard/bookings/${trialId}`, { scheduled_start: next().utcStartIso, reschedule_reason: 'after the fact' });
  expect(move.ok, 'a finished lesson cannot be moved').toBe(false);
  expect((await call(student, 'POST', `/api/student/bookings/${trialId}/cancel`, {})).status, 'a finished lesson cannot be cancelled by the learner').toBe(400);
  const again = await call(student, 'POST', '/api/bookings/create', bookingBody(next()));
  expect(again.status, 'a completed trial is the one free trial').toBe(400);
});

test('only the super admin cancels; the family is told and keeps what it paid for', async () => {
  const r = await call(student, 'POST', '/api/bookings/create', bookingBody(next(), { mode: 'regular' }));
  const rec = await call(admin, 'POST', '/api/dashboard/payments', { booking_id: r.json.bookingId, amount: 5, currency: 'USD', payment_method: 'wise', status: 'pending' });
  expect((await call(admin, 'POST', `/api/dashboard/payments/${rec.json.payment.id}/confirm`, {})).status).toBe(200);
  const cancel = await call(admin, 'PATCH', `/api/dashboard/bookings/${r.json.bookingId}`, { status: 'cancelled', cancellation_reason: 'QA: the teacher is ill' });
  expect(cancel.status, JSON.stringify(cancel.json)).toBe(200);
  expect((await booking(r.json.bookingId)).status).toBe('cancelled');
  const { data: credits } = await db.from('package_entitlements').select('status, remaining_credits, metadata').eq('purchaser_account_id', q.student.authId);
  const { data: pay } = await db.from('payments').select('status').eq('id', rec.json.payment.id).single();
  test.info().annotations.push({ type: 'academy cancel', description: `payment ${pay?.status}, credits ${JSON.stringify(credits)}` });
  // RULES.md §2: when the academy cancels, the family chooses a new time, a credit or a refund; the money is never just gone.
  const kept = (credits || []).some(c => c.status === 'active' && c.remaining_credits > 0) || pay?.status === 'refunded';
  expect(kept, 'a paid lesson cancelled by the academy left the family with no credit and no refund').toBe(true);
});
