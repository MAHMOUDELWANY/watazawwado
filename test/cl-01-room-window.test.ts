import { describe, it } from 'node:test';
import assert from 'node:assert';
import { roomJoinState, roomHardCloseMs, remainingMs, teacherLateMinutes, ROOM_OPENS_MIN, ROOM_CLOSE_GRACE_MIN, TEACHER_LATE_GRACE_MIN } from '../src/lib/roomWindow.js';

const t = (iso: string) => new Date(iso).getTime();
const l30 = { scheduled_start: '2026-11-20T10:00:00Z', duration_minutes: 30 };
const l60 = { scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: '2026-11-20T11:00:00Z' };

describe('CL-01 room window and lateness', () => {
  it('constants', () => {
    assert.deepStrictEqual([ROOM_OPENS_MIN, ROOM_CLOSE_GRACE_MIN, TEACHER_LATE_GRACE_MIN], [10, 15, 2]);
  });

  it('30-minute lesson opens 10 min early and hard-closes 15 min after the end', () => {
    assert.strictEqual(roomJoinState(l30, t('2026-11-20T09:49:59Z')), 'early');
    assert.strictEqual(roomJoinState(l30, t('2026-11-20T09:50:00Z')), 'open');
    assert.strictEqual(roomJoinState(l30, t('2026-11-20T10:44:59Z')), 'open');
    assert.strictEqual(roomJoinState(l30, t('2026-11-20T10:45:00Z')), 'ended');
    assert.strictEqual(roomHardCloseMs(l30), t('2026-11-20T10:45:00Z'));
  });

  it('60-minute lesson closes at 11:15', () => {
    assert.strictEqual(roomJoinState(l60, t('2026-11-20T11:14:59Z')), 'open');
    assert.strictEqual(roomJoinState(l60, t('2026-11-20T11:15:00Z')), 'ended');
    assert.strictEqual(remainingMs(l60, t('2026-11-20T11:14:00Z')), 60_000);
    assert.strictEqual(remainingMs(l60, t('2026-11-20T12:00:00Z')), 0);
  });

  it('a cancelled lesson is always ended', () => {
    assert.strictEqual(roomJoinState({ ...l30, status: 'cancelled' }, t('2026-11-20T10:05:00Z')), 'ended');
  });

  it('teacher lateness: 2-minute grace, whole minutes', () => {
    assert.strictEqual(teacherLateMinutes(l30, '2026-11-20T10:02:00Z'), 0);
    assert.strictEqual(teacherLateMinutes(l30, '2026-11-20T10:03:00Z'), 3);
    assert.strictEqual(teacherLateMinutes(l30, '2026-11-20T10:03:59Z'), 3);
    assert.strictEqual(teacherLateMinutes(l30, '2026-11-20T09:55:00Z'), 0);
    assert.strictEqual(teacherLateMinutes(l30, null), 0);
  });
});
