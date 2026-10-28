import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStatement, lessonOutcome, monthRange, type PayLesson } from '../server/payroll/payroll';

const now = new Date('2026-10-20T12:00:00Z');
const lesson = (over: Partial<PayLesson>): PayLesson => ({
  id: Math.random().toString(36).slice(2),
  referenceCode: 'R',
  scheduledStart: '2026-10-10T10:00:00Z',
  durationMinutes: 60,
  status: 'completed',
  bookingType: 'regular',
  notHeldReason: null,
  learnerName: 'A',
  ...over
});

test('outcome table (owner D5, S1-S4)', () => {
  assert.equal(lessonOutcome(lesson({}), now), 'completed');
  assert.equal(lessonOutcome(lesson({ bookingType: 'trial' }), now), 'trial');
  assert.equal(lessonOutcome(lesson({ status: 'no_show' }), now), 'student_no_show');
  assert.equal(lessonOutcome(lesson({ status: 'cancelled' }), now), 'cancelled');
  assert.equal(lessonOutcome(lesson({ status: 'cancelled', notHeldReason: 'teacher_absent' }), now), 'teacher_absent');
  assert.equal(lessonOutcome(lesson({ status: 'cancelled', notHeldReason: 'technical' }), now), 'technical');
  assert.equal(lessonOutcome(lesson({ status: 'confirmed' }), now), 'awaiting');
  assert.equal(lessonOutcome(lesson({ status: 'confirmed', scheduledStart: '2026-10-25T10:00:00Z' }), now), 'upcoming');
});

test('a lesson counts by its length at the hourly rate; only held lessons and student no-shows are paid', () => {
  const s = buildStatement('2026-10', { hourlyRate: 200, currency: 'EGP' }, [
    lesson({ durationMinutes: 45 }),                                   // 150
    lesson({ durationMinutes: 30, status: 'no_show' }),                // 100
    lesson({ durationMinutes: 60, bookingType: 'trial' }),             // 0
    lesson({ status: 'cancelled', notHeldReason: 'teacher_absent' }),  // 0
    lesson({ status: 'cancelled', notHeldReason: 'technical' }),       // 0
    lesson({ status: 'cancelled' }),                                   // 0
    lesson({ status: 'confirmed' }),                                   // awaiting, 0
    lesson({ status: 'pending' })                                      // unpaid hold: not a line
  ], [{ id: 'a', amount: 50, reason: 'Bonus' }, { id: 'b', amount: -20, reason: 'Late summary' }], now);
  assert.equal(s.currency, 'EGP');
  assert.equal(s.lines.length, 7);
  assert.equal(s.paidLessons, 2);
  assert.equal(s.paidMinutes, 75);
  assert.equal(s.lessonsTotal, 250);
  assert.equal(s.adjustmentsTotal, 30);
  assert.equal(s.total, 280);
  assert.equal(s.awaitingCount, 1);
});

test('no rate yet: lessons listed at 0, total never below zero', () => {
  const s = buildStatement('2026-10', null, [lesson({})], [{ id: 'x', amount: -10, reason: 'Deduction' }], now);
  assert.equal(s.hourlyRate, null);
  assert.equal(s.lessonsTotal, 0);
  assert.equal(s.total, 0);
});

test('month range is a UTC calendar month', () => {
  assert.deepEqual(monthRange('2026-12'), { start: '2026-12-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z', firstDay: '2026-12-01' });
  assert.equal(monthRange('2026-13'), null);
  assert.equal(monthRange('bad'), null);
});
