import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { mergeDayBlocks } from '../server/integrations/availabilityEngine.js';
import { bookingErrorText } from '../src/components/booking/bookingErrors.js';

// Owner review 2026-11-08: free times next to a lesson stay open; a shown slot is always accepted.
describe('Owner review 2026-11-08: slots', () => {
  it('joins touching windows, treats 23:59 as midnight, keeps gaps', () => {
    const rows = [
      { weekday: 3, start_time: '13:00:00', end_time: '13:30:00' },
      { weekday: 3, start_time: '12:30:00', end_time: '13:00:00' },
      { weekday: 3, start_time: '15:30:00', end_time: '16:00:00' },
      { weekday: 5, start_time: '00:00:00', end_time: '23:59:00' },
    ];
    assert.deepStrictEqual(mergeDayBlocks(rows, 3), [{ start: 750, end: 810 }, { start: 930, end: 960 }]);
    assert.deepStrictEqual(mergeDayBlocks(rows, 5), [{ start: 0, end: 1440 }]);
    assert.deepStrictEqual(mergeDayBlocks(rows, 1), []);
  });

  it('no buffer around booked lessons; slot list and booking check share the windows', () => {
    const src = fs.readFileSync('server/integrations/availabilityEngine.ts', 'utf8');
    assert.ok(!src.includes('minus({ minutes: 5 })'));
    assert.strictEqual(src.split('mergeDayBlocks(dbAvailability, currentDayIndex)').length - 1, 2);
  });

  it('the working-hours error reads as "pick another time" in Arabic', () => {
    assert.match(bookingErrorText("This time slot is no longer in the teacher's working hours. Please choose another time.", false), /لم يعد متاحًا/);
  });
});
