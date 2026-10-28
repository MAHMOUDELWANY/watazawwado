import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { buildMyMonth } from '../server/routes/myMonth';

const L = (id: string, over: any = {}) => ({ id, studentId: 's1', status: 'completed', bookingType: 'regular', durationMinutes: 60, scheduledEnd: '2026-10-10T11:00:00Z', ...over });

test('My month counts held lessons, hours, trials, no-shows, students, summaries on time and the rating', () => {
  const m = buildMyMonth(
    [L('a'), L('b', { durationMinutes: 30, studentId: 's2' }), L('c', { bookingType: 'trial', studentId: 's3' }), L('d', { status: 'no_show' }), L('e', { status: 'cancelled' })],
    [{ bookingId: 'a', createdAt: '2026-10-10T20:00:00Z' }, { bookingId: 'b', createdAt: '2026-10-12T20:00:00Z' }],
    [5, 4, 9]
  );
  assert.equal(m.lessonsHeld, 2);
  assert.equal(m.hours, 1.5);
  assert.equal(m.trialsHeld, 1);
  assert.equal(m.studentNoShows, 1);
  assert.equal(m.activeStudents, 3);
  assert.equal(m.summariesWritten, 2);
  assert.equal(m.summariesOnTime, 1);
  assert.equal(m.summariesMissing, 1);
  assert.equal(m.rating, 4.5);
  assert.equal(m.ratingCount, 2);
});

test('My month never reads student money', () => {
  const src = fs.readFileSync('server/routes/myMonth.ts', 'utf8');
  assert.doesNotMatch(src, /fee_amount|payments|price/);
});
