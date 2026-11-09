import { describe, it } from 'node:test';
import assert from 'node:assert';
import { lessonJoinState } from '../src/lib/lessonWindow.js';
import { analyzeAttendance, inRoomNow, requiredTogetherMinutes } from '../server/routes/attendance.js';

// Owner review 2026-11-09: a lesson at 11:30 the teacher only opened at 12:30.
describe('Owner review 2026-11-09: lesson link window', () => {
  const lesson = { scheduled_start: '2026-11-09T09:30:00Z', scheduled_end: '2026-11-09T10:00:00Z' };
  const at = (iso: string) => new Date(iso).getTime();

  it('teacher can start 10 minutes early, student 5', () => {
    assert.strictEqual(lessonJoinState(lesson, 'teacher', at('2026-11-09T09:21:00Z')), 'open');
    assert.strictEqual(lessonJoinState(lesson, 'student', at('2026-11-09T09:21:00Z')), 'early');
    assert.strictEqual(lessonJoinState(lesson, 'student', at('2026-11-09T09:26:00Z')), 'open');
  });

  it('closes for both at the end of the lesson', () => {
    assert.strictEqual(lessonJoinState(lesson, 'teacher', at('2026-11-09T10:30:00Z')), 'ended');
    assert.strictEqual(lessonJoinState(lesson, 'student', at('2026-11-09T10:00:00Z')), 'ended');
  });

  it('uses the duration when there is no end time', () => {
    const l = { scheduled_start: '2026-11-09T09:30:00Z', duration_minutes: 45 };
    assert.strictEqual(lessonJoinState(l, 'teacher', at('2026-11-09T10:14:00Z')), 'open');
    assert.strictEqual(lessonJoinState(l, 'teacher', at('2026-11-09T10:15:00Z')), 'ended');
  });
});

describe('Owner review 2026-11-09: when a lesson counts as held', () => {
  const ev = (event: string, role: string, hhmm: string) => ({ event, role, occurred_at: `2026-11-09T${hhmm}:00Z` });

  it('needs 20 minutes together for 30-minute lessons, 30 for longer ones', () => {
    assert.strictEqual(requiredTogetherMinutes(30), 20);
    assert.strictEqual(requiredTogetherMinutes(45), 30);
    assert.strictEqual(requiredTogetherMinutes(60), 30);
  });

  it('counts only the time both were in the room', () => {
    const lesson = { scheduled_start: '2026-11-09T09:30:00Z', scheduled_end: '2026-11-09T10:00:00Z', duration_minutes: 30 };
    const a = analyzeAttendance([
      ev('joined', 'teacher', '09:29'), ev('joined', 'student', '09:35'), ev('left', 'student', '09:50'),
      ev('joined', 'student', '09:52'), ev('left', 'student', '09:59'), ev('left', 'teacher', '10:00'),
    ], lesson);
    assert.strictEqual(a.togetherMinutes, 22);
    assert.strictEqual(a.held, true);
    assert.strictEqual(a.unstable, null);
  });

  it('a short meeting is not held; four joins mean the connection is unstable', () => {
    const lesson = { scheduled_start: '2026-11-09T09:30:00Z', scheduled_end: '2026-11-09T10:30:00Z', duration_minutes: 60 };
    const evs = [ev('joined', 'teacher', '09:30')];
    for (const m of ['31', '35', '40', '45']) evs.push(ev('joined', 'student', `09:${m}`), ev('left', 'student', `09:${String(Number(m) + 2)}`));
    const a = analyzeAttendance(evs, lesson);
    assert.strictEqual(a.held, false);
    assert.strictEqual(a.joins.student, 4);
    assert.strictEqual(a.unstable, 'student');
  });

  it('knows who is in the room now', () => {
    assert.deepStrictEqual(inRoomNow([ev('joined', 'teacher', '09:30'), ev('joined', 'student', '09:31'), ev('left', 'student', '09:40')]), { teacherIn: true, studentIn: false });
  });
});
