import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';
import { validateTeacherLifecycleTransition } from '../api/index.js';

describe('Task 0.58-J — Package credit foundation contract', () => {
  const teacherA = 'teacher-1';
  const teacherB = 'teacher-2';
  const now = DateTime.now().toUTC();
  const pastTime = now.minus({ hours: 1 }).toISO();

  it('requires an explicit no-show credit decision for no_show outcomes', () => {
    const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
    const res = validateTeacherLifecycleTransition(booking, 'no_show', teacherA, now.toISO());
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.error ?? '', /explicit no-show credit/i);
  });

  it('accepts an explicit credit-used decision for no_show', () => {
    const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
    const res = validateTeacherLifecycleTransition(
      booking,
      'no_show',
      teacherA,
      now.toISO(),
      'credit_used'
    );
    assert.strictEqual(res.valid, true);
  });

  it('accepts an explicit credit-returned decision for no_show', () => {
    const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
    const res = validateTeacherLifecycleTransition(
      booking,
      'no_show',
      teacherA,
      now.toISO(),
      'credit_returned'
    );
    assert.strictEqual(res.valid, true);
  });

  it('rejects unauthorized no-show credit decisions from another teacher', () => {
    const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
    const res = validateTeacherLifecycleTransition(
      booking,
      'no_show',
      teacherB,
      now.toISO(),
      'credit_used'
    );
    assert.strictEqual(res.valid, false);
    assert.strictEqual(res.statusCode, 403);
  });
});
