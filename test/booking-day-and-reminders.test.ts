import test from 'node:test';
import assert from 'node:assert';
import { DateTime } from 'luxon';

// RULES.md §2 (2026-10-15): no same-day bookings or moves; reminders email 3h, site 12h and 2h.
test('isOnLaterDay: today is closed, tomorrow opens, in the student time zone', async () => {
  const { isOnLaterDay } = await import('../server/integrations/availabilityEngine');
  const zone = 'Pacific/Auckland';
  const todayLate = DateTime.now().setZone(zone).endOf('day').minus({ minutes: 1 });
  const tomorrowEarly = DateTime.now().setZone(zone).plus({ days: 1 }).startOf('day').plus({ minutes: 30 });
  assert.strictEqual(isOnLaterDay(todayLate.toUTC(), zone), false);
  assert.strictEqual(isOnLaterDay(tomorrowEarly.toUTC(), zone), true);
  assert.strictEqual(isOnLaterDay(DateTime.utc().minus({ days: 1 }), 'Not/AZone'), false, 'bad zone falls back to UTC');
});

test('scheduleBookingReminders keeps only the reminders still ahead', async () => {
  const env = { ...process.env };
  for (const k of ['SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']) delete process.env[k];
  process.env.NODE_ENV = 'test';
  try {
    const { scheduleBookingReminders } = await import('../server/notifications/reminderEngine');
    const in5h = await scheduleBookingReminders({ id: 'b1', referenceCode: 'R1', scheduledStartUtc: DateTime.utc().plus({ hours: 5 }).toISO()! });
    assert.deepStrictEqual([...in5h.scheduled].sort(), ['email_3h', 'site_2h']);
    const in1d = await scheduleBookingReminders({ id: 'b2', referenceCode: 'R2', scheduledStartUtc: DateTime.utc().plus({ hours: 24 }).toISO()! });
    assert.deepStrictEqual([...in1d.scheduled].sort(), ['email_3h', 'site_12h', 'site_2h']);
    const in1h = await scheduleBookingReminders({ id: 'b3', referenceCode: 'R3', scheduledStartUtc: DateTime.utc().plus({ hours: 1 }).toISO()! });
    assert.deepStrictEqual(in1h.scheduled, []);
  } finally {
    process.env = env;
  }
});
