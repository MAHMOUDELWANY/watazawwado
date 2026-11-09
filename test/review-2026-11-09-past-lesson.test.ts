import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { attachAttendance } from '../server/routes/attendance.js';
import { getLessonDisplayStatus } from '../src/student/lessonsPresentation.js';

// Owner review 2026-11-09: a lesson nobody joined in time; the teacher opened Zoom half an hour after it ended.
describe('Owner review 2026-11-09: past lesson', () => {
  const lesson = { id: 'b1', scheduled_start: '2026-11-09T09:30:00Z', scheduled_end: '2026-11-09T10:00:00Z' };
  const fakeDb = (rows: any[]) => ({ from: () => ({ select: () => ({ in: () => ({ limit: async () => ({ data: rows, error: null }) }) }) }) });

  it('joining after the lesson time does not count as attending', async () => {
    const [out] = await attachAttendance(fakeDb([
      { booking_id: 'b1', event: 'link_opened', role: 'teacher', occurred_at: '2026-11-09T10:32:18Z' },
      { booking_id: 'b1', event: 'joined', role: 'teacher', occurred_at: '2026-11-09T10:32:34Z' },
    ]), [lesson]);
    assert.deepStrictEqual({ teacher: out.attendance?.teacher, student: out.attendance?.student }, { teacher: false, student: false });
  });

  it('joining during the lesson counts', async () => {
    const [out] = await attachAttendance(fakeDb([
      { booking_id: 'b1', event: 'joined', role: 'teacher', occurred_at: '2026-11-09T09:31:00Z' },
    ]), [lesson]);
    assert.deepStrictEqual({ teacher: out.attendance?.teacher, student: out.attendance?.student }, { teacher: true, student: false });
  });

  it('the student sees a finished lesson as waiting for the teacher, not "Rescheduled"', () => {
    const paid: any = { isPendingPayment: false };
    assert.strictEqual(getLessonDisplayStatus({ status: 'rescheduled', scheduled_end: '2020-01-01T00:00:00Z' }, paid, true).label, 'بانتظار تسجيل المعلم');
    assert.strictEqual(getLessonDisplayStatus({ status: 'rescheduled', scheduled_end: '2999-01-01T00:00:00Z' }, paid, true).label, 'تمت إعادة الجدولة');
  });

  it('the teacher card shows who joined and has no Start button after the lesson', () => {
    const src = fs.readFileSync('src/dashboard/pages/TodayPage.tsx', 'utf8');
    assert.ok(src.includes('!isPast && !isNeedsOutcome && !isCancelled && hasStartLink'));
    assert.ok(!src.includes("{t('Needs outcome', 'محتاجة تسجيل نتيجة')}\n            </span>"));
  });
});
