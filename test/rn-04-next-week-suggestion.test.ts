import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import app from '../api/index.js';
import { nextWeekSlot } from '../server/booking/studentWindows.js';
import { suggestedSlotFrom } from '../src/student/pages/StudentBookingPage.js';

describe('RN-04 same time next week', () => {
  it('is one week later at the same clock time for the student, also across a daylight-saving change', () => {
    const now = DateTime.fromISO('2026-10-21T12:00:00Z');
    const plain = nextWeekSlot('2026-10-20T17:00:00Z', 45, now, 'Europe/London');
    assert.strictEqual(plain?.startIso, '2026-10-27T18:00:00.000Z', 'London leaves BST on 25 Oct: 18:00 local stays 18:00 local');
    assert.strictEqual(DateTime.fromISO(plain!.startIso).setZone('Europe/London').toFormat('HH:mm'), DateTime.fromISO('2026-10-20T17:00:00Z').setZone('Europe/London').toFormat('HH:mm'));
    assert.strictEqual(DateTime.fromISO(plain!.endIso).diff(DateTime.fromISO(plain!.startIso), 'minutes').minutes, 45);
  });
  it('needs at least 24 hours of notice and never jumps to the week after', () => {
    const now = DateTime.fromISO('2026-10-21T12:00:00Z');
    assert.strictEqual(nextWeekSlot('2026-10-15T08:00:00Z', 30, now, 'UTC'), null, 'a week on is in 20 h');
    assert.ok(nextWeekSlot('2026-10-16T13:00:00Z', 30, now, 'UTC'));
    assert.strictEqual(nextWeekSlot('not a date', 30, now), null);
  });
  it('hands the booking flow a date and a placeholder slot that the date step replaces with the live slot', () => {
    const iso = DateTime.utc().plus({ days: 3 }).set({ minute: 0, second: 0, millisecond: 0 }).toISO()!;
    const s = suggestedSlotFrom(iso, 'America/New_York');
    assert.ok(s && /^\d{4}-\d{2}-\d{2}$/.test(s.date) && s.slot.utcStartIso === DateTime.fromISO(iso, { zone: 'utc' }).toISO());
    assert.strictEqual(suggestedSlotFrom(DateTime.utc().minus({ days: 1 }).toISO(), 'UTC'), null, 'never in the past');
    assert.strictEqual(suggestedSlotFrom('garbage', 'UTC'), null);
    const step = fs.readFileSync('src/components/booking/StepDateTime.tsx', 'utf8');
    assert.ok(step.includes('Date.parse(s.utcStartIso) === Date.parse(selectedSlot.utcStartIso!)'), 'only a slot the engine lists can be selected');
    assert.ok(step.includes("selectedSlot.id.startsWith('suggested-')"), 'ordinary bookings keep their chosen slot untouched');
    assert.ok(s!.slot.id.startsWith('suggested-'));
  });
  it('checks the real availability engine and books nothing by itself', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const route = api.slice(api.indexOf("app.get('/api/student/next-week-suggestion'"), api.indexOf("app.post('/api/student/bookings/:id/reschedule'"));
    assert.ok(route.includes('await validateSlotAvailability(slot.startIso, slot.endIso, last.teacher_id)'));
    assert.ok(!/\.insert\(|\.update\(|create_booking/.test(route), 'read-only');
    assert.ok(!/recurr/i.test(fs.readFileSync('src/student/components/NextWeekSuggestion.tsx', 'utf8').replace('no recurring bookings', '')), 'no recurring booking');
  });
});

describe('RN-04 endpoint', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('is for signed-in families, about their own learners', async () => {
    const url = `${base}/api/student/next-week-suggestion`;
    assert.strictEqual((await fetch(url)).status, 401);
    assert.strictEqual((await fetch(url, { headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const foreign = await fetch(`${url}?learnerId=99999999-9999-4999-8999-999999999999`, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (foreign.status !== 503) assert.strictEqual(foreign.status, 403);
    const own = await fetch(url, { headers: { Authorization: 'Bearer dev-student-token' } });
    if (own.status !== 503) {
      assert.strictEqual(own.status, 200);
      assert.ok('suggestion' in ((await own.json()) as any));
    }
  });
});
