import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import app from '../api/index.js';
import { canRate, parseFeedback, teacherAverage, TEACHER_MIN_RATINGS } from '../server/routes/feedback.js';

const now = DateTime.fromISO('2026-10-21T12:00:00Z', { zone: 'utc' });
const lesson = (status: string, startIso: string, minutes = 45) => ({ status, scheduled_start: startIso, duration_minutes: minutes });

describe('ST-02 who can rate what', () => {
  it('only lessons that ended, within 7 days, and were not cancelled or missed', () => {
    assert.strictEqual(canRate(lesson('completed', '2026-10-21T10:00:00Z'), now), true);
    assert.strictEqual(canRate(lesson('confirmed', '2026-10-21T11:30:00Z'), now), false, 'still running until 12:15');
    assert.strictEqual(canRate(lesson('confirmed', '2026-10-21T11:00:00Z'), now), true);
    assert.strictEqual(canRate(lesson('cancelled', '2026-10-21T10:00:00Z'), now), false);
    assert.strictEqual(canRate(lesson('no_show', '2026-10-21T10:00:00Z'), now), false);
    assert.strictEqual(canRate(lesson('completed', '2026-10-13T10:00:00Z'), now), false, 'older than 7 days');
    assert.strictEqual(canRate(lesson('completed', 'not a date'), now), false);
  });

  it('accepts a whole rating 1-5 and a short optional comment', () => {
    assert.deepStrictEqual(parseFeedback({ rating: 5 }), { rating: 5, comment: null });
    assert.deepStrictEqual(parseFeedback({ rating: '4', comment: '  great  ' }), { rating: 4, comment: 'great' });
    for (const bad of [{}, { rating: 0 }, { rating: 6 }, { rating: 3.5 }, { rating: 3, comment: 5 }, { rating: 3, comment: 'x'.repeat(1001) }]) {
      assert.ok('error' in parseFeedback(bad), JSON.stringify(bad).slice(0, 40));
    }
  });

  it('a teacher sees no average below 5 ratings', () => {
    assert.strictEqual(TEACHER_MIN_RATINGS, 5);
    assert.deepStrictEqual(teacherAverage([5, 4, 1, 5]), { count: 4, average: null, minimum: 5 });
    assert.deepStrictEqual(teacherAverage([5, 4, 4, 5, 3]), { count: 5, average: 4.2, minimum: 5 });
  });

  it('the table is server-only and the admin list needs the super admin', () => {
    const sql = fs.readFileSync('supabase/migrations/20261021000004_lesson_feedback.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.lesson_feedback FROM anon, authenticated/);
    assert.match(sql, /CHECK \(rating BETWEEN 1 AND 5\)/);
    const routes = fs.readFileSync('server/routes/feedback.ts', 'utf8');
    assert.ok(routes.includes("app.get('/api/dashboard/admin/lesson-feedback', deps.verifyTeacherAuth, deps.requireSuperAdmin"));
    assert.ok(!/me\/lesson-feedback[\s\S]{0,600}comment/.test(routes), 'the teacher endpoint never returns comments');
  });
});

describe('ST-02 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('rating needs a signed-in family and a real account; nothing is written by the dev account', async () => {
    const url = `${base}/api/student/bookings/00000000-0000-4000-8000-000000000000/feedback`;
    const body = JSON.stringify({ rating: 5 });
    const headers = { 'Content-Type': 'application/json' };
    assert.strictEqual((await fetch(url, { method: 'POST', headers, body })).status, 401);
    const dev = await fetch(url, { method: 'POST', headers: { ...headers, Authorization: 'Bearer dev-student-token' }, body });
    if (dev.status !== 503) assert.strictEqual(dev.status, 401);
  });

  it('the admin list refuses a teacher and the pending check refuses guests', async () => {
    const r = await fetch(`${base}/api/dashboard/admin/lesson-feedback`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    assert.strictEqual(r.status, 403);
    assert.strictEqual((await fetch(`${base}/api/student/lesson-feedback/pending`)).status, 401);
    const mine = await fetch(`${base}/api/dashboard/me/lesson-feedback`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    if (mine.status !== 503) assert.deepStrictEqual(await mine.json(), { count: 0, average: null, minimum: 5 });
  });
});
