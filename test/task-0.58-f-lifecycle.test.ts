import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';
import { validateTeacherLifecycleTransition } from '../api/index.js'; // Ensure correct import

describe('Task 0.58-F — Teacher Lesson Lifecycle Controls', () => {

  const teacherA = 'teacher-1';
  const teacherB = 'teacher-2';
  const now = DateTime.now().toUTC();
  const pastTime = now.minus({ hours: 1 }).toISO();
  const futureTime = now.plus({ hours: 1 }).toISO();

  describe('1. Transition Validation Logic', () => {
    it('allows Authorized Teacher to mark owned confirmed booking completed (past time)', () => {
      const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'completed', teacherA, now.toISO());
      assert.strictEqual(res.valid, true);
    });

    it('allows Authorized Teacher to mark owned confirmed booking no-show (past time) with explicit credit decision', () => {
      const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'no_show', teacherA, now.toISO(), 'credit_used');
      assert.strictEqual(res.valid, true);
    });

    it('rejects Unauthorized Teacher from modifying another Teacher\'s booking', () => {
      const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'completed', teacherB, now.toISO());
      assert.strictEqual(res.valid, false);
      assert.strictEqual(res.statusCode, 403);
    });

    it('rejects marking a future booking as completed', () => {
      const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: futureTime };
      const res = validateTeacherLifecycleTransition(booking, 'completed', teacherA, now.toISO());
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Cannot mark a future lesson as completed'));
    });

    it('is idempotent when marking an already completed booking as completed', () => {
      const booking = { status: 'completed', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'completed', teacherA, now.toISO());
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.isIdempotent, true);
    });

    it('is idempotent when marking an already no_show booking as no_show', () => {
      const booking = { status: 'no_show', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'no_show', teacherA, now.toISO());
      assert.strictEqual(res.valid, true);
      assert.strictEqual(res.isIdempotent, true);
    });

    it('rejects marking a cancelled booking as completed', () => {
      const booking = { status: 'cancelled', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'completed', teacherA, now.toISO());
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Cannot change status of a cancelled booking'));
    });

    it('rejects invalid statuses', () => {
      const booking = { status: 'confirmed', teacher_id: teacherA, scheduled_start: pastTime };
      const res = validateTeacherLifecycleTransition(booking, 'invalid_status', teacherA, now.toISO());
      assert.strictEqual(res.valid, false);
      assert.ok(res.error?.includes('Invalid status'));
    });
  });
});
