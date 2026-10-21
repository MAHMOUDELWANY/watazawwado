import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import { CELLS_PER_DAY, cellsToIntervals, copyDay, dayCells, previewInZone, setDay, type Interval } from '../src/dashboard/lib/weeklyHours.js';

const mon: Interval = { weekday: 1, start_time: '16:00', end_time: '18:00' };

describe('TE-03 weekly hours grid', () => {
  it('round-trips aligned hours exactly, including up to midnight', () => {
    const late: Interval = { weekday: 2, start_time: '22:00', end_time: '23:59' };
    for (const iv of [mon, late]) {
      assert.deepStrictEqual(cellsToIntervals(iv.weekday, dayCells([iv], iv.weekday)), [iv]);
    }
    assert.strictEqual(dayCells([mon], 1).filter(Boolean).length, 4);
    assert.strictEqual(dayCells([mon], 1).length, CELLS_PER_DAY);
  });

  it('painting one day leaves the others untouched (even odd minutes)', () => {
    const odd: Interval = { weekday: 3, start_time: '09:10', end_time: '10:50' };
    const cells = dayCells([mon], 1);
    cells[40] = true; // 20:00-20:30
    const next = setDay([mon, odd], 1, cells);
    assert.ok(next.some((iv) => iv.weekday === 3 && iv.start_time === '09:10' && iv.end_time === '10:50'));
    assert.deepStrictEqual(next.filter((iv) => iv.weekday === 1), [mon, { weekday: 1, start_time: '20:00', end_time: '20:30' }]);
  });

  it('joins neighbouring cells into one interval', () => {
    const cells = Array(CELLS_PER_DAY).fill(false);
    cells[32] = cells[33] = cells[34] = true;
    assert.deepStrictEqual(cellsToIntervals(0, cells), [{ weekday: 0, start_time: '16:00', end_time: '17:30' }]);
  });

  it('copies a day onto other days and replaces their hours', () => {
    const tue: Interval = { weekday: 2, start_time: '08:00', end_time: '09:00' };
    const out = copyDay([mon, tue], 1, [2, 4, 1]);
    assert.deepStrictEqual(out.filter((iv) => iv.weekday === 2), [{ ...mon, weekday: 2 }]);
    assert.deepStrictEqual(out.filter((iv) => iv.weekday === 4), [{ ...mon, weekday: 4 }]);
    assert.deepStrictEqual(out.filter((iv) => iv.weekday === 1), [mon], 'the source day is not doubled');
  });

  it('previews in the student zone with daylight saving for the coming week', () => {
    // Monday 16:00 Cairo, next occurrence 2026-10-26: the same instant, shown in London.
    const now = DateTime.fromISO('2026-10-21T09:00:00Z');
    const p = previewInZone(mon, 'Africa/Cairo', 'Europe/London', now);
    assert.strictEqual(p.weekday, 1);
    assert.strictEqual(p.start.zoneName, 'Europe/London');
    assert.strictEqual(p.start.toISODate(), '2026-10-26', 'the next Monday');
    const utcHour = DateTime.fromISO('2026-10-26T16:00', { zone: 'Africa/Cairo' }).toUTC().hour;
    assert.strictEqual(p.start.toUTC().hour, utcHour);
    // A late teacher hour falls on the previous day for Los Angeles.
    const early = previewInZone({ weekday: 1, start_time: '02:00', end_time: '03:00' }, 'Africa/Cairo', 'America/Los_Angeles', now);
    assert.strictEqual(early.weekday, 0, 'Sunday in Los Angeles');
  });

  it('the page still saves the same shape through the same endpoint', () => {
    const page = fs.readFileSync('src/dashboard/pages/AvailabilityPage.tsx', 'utf8');
    assert.ok(page.includes("schedule: intervals.map(iv => ({ ...iv, is_active: true }))"));
    assert.ok(page.includes('<WeekHoursGrid intervals={intervals} setIntervals={setIntervals}'));
  });
});
