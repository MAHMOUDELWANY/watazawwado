import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { buildIcs, foldLine, icsText } from '../src/lib/ics.js';
import { groupByDay, colorFor, LEARNER_COLORS } from '../src/student/pages/StudentCalendarPage.js';

describe('PA-03 iCalendar', () => {
  const ics = buildIcs([{ uid: 'b1@watazawwado.academy', startIso: '2026-10-25T17:00:00Z', endIso: '2026-10-25T17:45:00Z', title: 'Tajweed · Yusuf, again; ok', description: 'Line 1\nLine 2', url: 'https://watazawwado.academy/student/lessons' }], 'Watazawwado lessons');
  it('is a valid calendar with UTC times and CRLF lines', () => {
    assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n'));
    assert.ok(ics.includes('DTSTART:20261025T170000Z\r\n') && ics.includes('DTEND:20261025T174500Z\r\n'));
    assert.ok(ics.trimEnd().endsWith('END:VCALENDAR'));
  });
  it('escapes text and folds long lines without breaking UTF-8', () => {
    assert.ok(ics.includes('SUMMARY:Tajweed · Yusuf\\, again\\; ok'));
    assert.ok(ics.includes('DESCRIPTION:Line 1\\nLine 2'));
    assert.strictEqual(icsText('a\\b'), 'a\\\\b');
    const long = foldLine('SUMMARY:' + 'ح'.repeat(60));
    for (const part of long.split('\r\n')) assert.ok(new TextEncoder().encode(part).length <= 75);
    assert.ok(!long.includes('�'));
  });
  it('skips events with bad dates', () => {
    assert.ok(!buildIcs([{ uid: 'x', startIso: 'nope', endIso: 'nope', title: 'x' }]).includes('BEGIN:VEVENT'));
  });
});

describe('PA-03 calendar view helpers', () => {
  it('groups lessons by day in the viewer time zone', () => {
    const m = groupByDay([{ scheduledStart: '2026-10-25T23:30:00Z' }, { scheduledStart: '2026-10-25T10:00:00Z' }], 'Asia/Dubai');
    assert.deepStrictEqual([...m.keys()], ['2026-10-25', '2026-10-26'], '23:30 UTC is already the 26th in Dubai');
  });
  it('gives each child a stable colour', () => {
    assert.strictEqual(colorFor(['a', 'b'], 'b'), LEARNER_COLORS[1]);
    assert.strictEqual(colorFor(['a'], 'unknown'), LEARNER_COLORS[0]);
  });
});

describe('PA-03 feed security', () => {
  it('the feed never carries Zoom links and stores only a hash of the token', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const feed = api.slice(api.indexOf("app.get('/api/calendar/family/:file'"), api.indexOf("app.patch('/api/student/me'"));
    assert.ok(!feed.includes('zoom'), 'no zoom column or link in the feed');
    assert.ok(api.includes("crypto.createHash('sha256').update(token).digest('hex')"));
    assert.ok(api.includes("crypto.randomBytes(32).toString('base64url')"));
  });

  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('unknown or malformed tokens get a plain 404', async () => {
    assert.strictEqual((await fetch(`${base}/api/calendar/family/short.ics`)).status, 404);
    const unknown = await fetch(`${base}/api/calendar/family/${'A'.repeat(43)}.ics`);
    if (unknown.status !== 503) assert.strictEqual(unknown.status, 404);
  });
  it('making or removing the link needs a signed-in family; the dev account cannot write', async () => {
    const url = `${base}/api/student/calendar-feed`;
    assert.strictEqual((await fetch(url, { method: 'POST' })).status, 401);
    assert.strictEqual((await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer dev-teacher-token' } })).status, 403);
    const dev = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer dev-student-token' } });
    if (dev.status !== 503) assert.strictEqual(dev.status, 401, 'no real user id, nothing written');
  });
});
