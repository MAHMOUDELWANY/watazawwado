import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateTime } from 'luxon';
import { weeklyAttendance } from '../src/dashboard/components/JourneyLog';

describe('Journey log: weekly attendance', () => {
  it('counts completed lessons per week for the last 12 weeks, oldest first', () => {
    const now = DateTime.fromISO('2026-10-28T12:00:00Z');
    const b = (iso: string, status = 'completed') => ({ id: iso, booking_type: 'regular' as const, service_id: 's', duration_minutes: 45, scheduled_start: iso, scheduled_end: iso, status });
    const weeks = weeklyAttendance([
      b('2026-10-27T10:00:00Z'), b('2026-10-28T09:00:00Z'),   // this week: 2
      b('2026-10-20T10:00:00Z', 'cancelled'),                  // not counted
      b('2026-08-10T10:00:00Z'),                               // 12th week back: oldest slot
      b('2026-06-01T10:00:00Z'),                               // too old
    ], now, 'UTC');
    assert.equal(weeks.length, 12);
    assert.equal(weeks[11], 2);
    assert.equal(weeks[10], 0);
    assert.equal(weeks[0], 1);
    assert.equal(weeks.reduce((a, n) => a + n, 0), 3);
  });
});
