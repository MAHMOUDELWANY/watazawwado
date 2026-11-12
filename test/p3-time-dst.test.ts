import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { DateTime, Settings } from 'luxon';
import { atDayMinute, computeAvailableSlots, isOnLaterDay, validateSlotAvailability } from '../server/integrations/availabilityEngine.js';
import { nextWeekSlot, studentCancelBlock, studentRescheduleBlock } from '../server/booking/studentWindows.js';

/**
 * P3: time rules on fixed clocks around the 2027 daylight-saving changes (London 28 Mar / 31 Oct, New York
 * 14 Mar / 7 Nov, Cairo 30 Apr / 28 Oct). No change falls inside today's 60-day booking window, so nothing else
 * would catch these before spring.
 */

const freeze = (iso: string) => { const ms = Date.parse(iso); Settings.now = () => ms; };
afterEach(() => { Settings.now = () => Date.now(); delete (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER; });

describe('P3 teacher hours are wall-clock hours, also on a clock-change day (P3-002)', () => {
  const changes: [string, string][] = [
    ['Europe/London', '2027-03-28'], ['Europe/London', '2027-10-31'], ['America/New_York', '2027-03-14'],
    ['America/New_York', '2027-11-07'], ['Africa/Cairo', '2027-04-30'], ['Africa/Cairo', '2027-10-28'],
  ];

  it('06:00 and 23:00 stay 06:00 and 23:00 on every change day of 2027', () => {
    for (const [zone, date] of changes) {
      const day = DateTime.fromISO(`${date}T12:00`, { zone });
      assert.strictEqual(atDayMinute(day, 6 * 60).toFormat('yyyy-MM-dd HH:mm'), `${date} 06:00`, `${zone} ${date}`);
      assert.strictEqual(atDayMinute(day, 23 * 60).toFormat('yyyy-MM-dd HH:mm'), `${date} 23:00`, `${zone} ${date}`);
      assert.strictEqual(atDayMinute(day, 24 * 60).toFormat('yyyy-MM-dd HH:mm'), `${day.plus({ days: 1 }).toISODate()} 00:00`, 'midnight is the next day');
    }
    // Known instants, so the check does not depend on the helper agreeing with itself.
    assert.strictEqual(atDayMinute(DateTime.fromISO('2027-03-28T12:00', { zone: 'Europe/London' }), 360).toUTC().toISO(), '2027-03-28T05:00:00.000Z');
    assert.strictEqual(atDayMinute(DateTime.fromISO('2027-10-31T12:00', { zone: 'Europe/London' }), 360).toUTC().toISO(), '2027-10-31T06:00:00.000Z');
    assert.strictEqual(atDayMinute(DateTime.fromISO('2027-11-07T12:00', { zone: 'America/New_York' }), 540).toUTC().toISO(), '2027-11-07T14:00:00.000Z');
  });

  it('the slots a family sees on Cairo\'s change day start at the teacher\'s 09:00, and the server accepts exactly those', async () => {
    freeze('2027-04-28T10:00:00Z');
    const teacher = randomUUID();
    (globalThis as any).__TEST_RESOLVE_AUTHORITATIVE_TEACHER = () => teacher;
    const days = await computeAvailableSlots('Europe/London', 3, 30, teacher);
    const changeDay = days.find(d => d.dateString === '2027-04-30');
    assert.ok(changeDay && changeDay.slots.length > 0, 'the change day has slots');
    assert.strictEqual(changeDay!.slots[0].cairoTimeEquiv, '09:00 AM Cairo');
    const before = days.find(d => d.dateString === '2027-04-29')!;
    assert.strictEqual(before.slots[0].cairoTimeEquiv, '09:00 AM Cairo');

    const nine = DateTime.fromISO('2027-04-30T09:00', { zone: 'Africa/Cairo' }).toUTC();
    const ok = await validateSlotAvailability(nine.toISO()!, nine.plus({ minutes: 30 }).toISO()!, teacher);
    assert.strictEqual(ok.isAvailable, true, ok.conflictReason);
    // P3-019: on the 5-minute grid from the start of the teacher's block, and nowhere between.
    const at = async (minutes: number) => (await validateSlotAvailability(nine.plus({ minutes }).toISO()!, nine.plus({ minutes: minutes + 30 }).toISO()!, teacher)).isAvailable;
    assert.deepStrictEqual([await at(5), await at(30), await at(13), await at(0.5)], [true, true, false, false]);
    const eight = nine.minus({ hours: 1 });
    const early = await validateSlotAvailability(eight.toISO()!, eight.plus({ minutes: 30 }).toISO()!, teacher);
    assert.strictEqual(early.isAvailable, false, '08:00 is before the teacher starts');
  });
});

describe('P3 "tomorrow at the earliest" follows the learner\'s calendar day', () => {
  it('London, the night the clocks go forward', () => {
    freeze('2027-03-28T00:30:00Z'); // 00:30 GMT, summer time starts at 01:00
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-03-28T22:30:00Z'), 'Europe/London'), false, '23:30 the same day');
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-03-28T23:00:00Z'), 'Europe/London'), true, '00:00 the next day');
  });

  it('New York, the night the clocks go back', () => {
    freeze('2027-11-07T05:30:00Z'); // 01:30 EDT, an hour that happens twice
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-11-08T04:59:00Z'), 'America/New_York'), false, '23:59 the same day');
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-11-08T05:00:00Z'), 'America/New_York'), true);
  });

  it('the far ends of the map, a missing zone and a made-up zone', () => {
    freeze('2026-12-31T10:30:00Z'); // already 1 Jan in Kiritimati (+14), still 30 Dec in Pago Pago (-11)
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2026-12-31T23:00:00Z'), 'Pacific/Kiritimati'), false, 'still 1 Jan there');
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-01-01T10:00:00Z'), 'Pacific/Kiritimati'), true);
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2026-12-31T10:59:00Z'), 'Pacific/Pago_Pago'), false, 'still 30 Dec there');
    assert.strictEqual(isOnLaterDay(DateTime.fromISO('2026-12-31T11:00:00Z'), 'Pacific/Pago_Pago'), true);
    for (const zone of [null, undefined, '', 'Mars/Olympus', "'; DROP TABLE"]) {
      assert.strictEqual(isOnLaterDay(DateTime.fromISO('2026-12-31T23:59:00Z'), zone as any), false, `UTC fallback ${String(zone)}`);
      assert.strictEqual(isOnLaterDay(DateTime.fromISO('2027-01-01T00:00:00Z'), zone as any), true);
    }
    assert.strictEqual(isOnLaterDay(DateTime.invalid('x'), 'Europe/London'), false, 'an invalid time is never bookable');
  });
});

describe('P3 next week\'s suggestion and the change windows across a clock change', () => {
  it('keeps the learner\'s clock time when summer time starts in between', () => {
    const now = DateTime.fromISO('2027-03-25T09:00:00Z');
    const s = nextWeekSlot('2027-03-24T17:00:00Z', 30, now, 'Europe/London'); // Wed 17:00 GMT
    assert.deepStrictEqual(s, { startIso: '2027-03-31T16:00:00.000Z', endIso: '2027-03-31T16:30:00.000Z' }, '17:00 BST');
    assert.strictEqual(nextWeekSlot('2027-03-24T17:00:00Z', 30, now)!.startIso, '2027-03-31T17:00:00.000Z', 'no zone: same UTC time');
    assert.strictEqual(nextWeekSlot('2027-10-27T17:00:00Z', 60, DateTime.fromISO('2027-10-28T00:00:00Z'), 'Europe/London')!.startIso, '2027-11-03T18:00:00.000Z', '18:00 BST stays 18:00 GMT');
  });

  it('gives nothing for junk, and for a week that is less than a day away', () => {
    const now = DateTime.fromISO('2027-03-31T00:00:00Z');
    assert.strictEqual(nextWeekSlot('not a date', 30, now), null);
    assert.strictEqual(nextWeekSlot('2027-03-24T17:00:00Z', 30, now, 'Europe/London'), null, 'only 16 hours away');
    assert.strictEqual(nextWeekSlot('2027-03-24T17:00:00Z', 999, DateTime.fromISO('2027-03-25T00:00:00Z'))!.endIso, '2027-03-31T17:45:00.000Z', 'an odd length falls back to 45');
  });

  it('the 1-hour and 3-hour windows are measured in real time, not clock time', () => {
    // London 28 Mar 2027: 00:30 GMT to 02:30 BST is one real hour.
    const now = DateTime.fromISO('2027-03-28T00:30:00Z');
    const lesson = (iso: string, booking_type = 'regular') => ({ status: 'confirmed', booking_type, scheduled_start: iso });
    assert.strictEqual(studentRescheduleBlock(lesson('2027-03-28T01:30:00Z'), now), null, 'exactly 1 hour');
    assert.strictEqual(studentRescheduleBlock(lesson('2027-03-28T01:29:59Z'), now)?.code, 'TOO_LATE');
    assert.strictEqual(studentCancelBlock(lesson('2027-03-28T03:30:00Z'), now), null, 'exactly 3 hours');
    assert.strictEqual(studentCancelBlock(lesson('2027-03-28T03:29:59Z'), now)?.code, 'TOO_LATE');
    assert.strictEqual(studentCancelBlock(lesson('2027-03-28T01:30:00Z', 'trial'), now), null, 'a trial: 1 hour');
    assert.ok(studentCancelBlock(lesson('garbage'), now), 'an unreadable time is never cancellable');
    assert.ok(studentRescheduleBlock(lesson('garbage'), now));
  });
});
