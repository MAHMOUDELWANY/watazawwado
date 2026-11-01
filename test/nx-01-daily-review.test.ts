import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { schedule, INTERVAL_DAYS, DAILY_CARDS } from '../server/routes/review.js';

describe('NX-01 daily review scheduling', () => {
  it('smooth moves to a longer gap, slips keep it, needing the mushaf starts again tomorrow', () => {
    assert.deepStrictEqual(schedule(0, 'smooth', '2026-11-01'), { box: 1, due_on: '2026-11-04' });
    assert.deepStrictEqual(schedule(2, 'slips', '2026-11-01'), { box: 2, due_on: '2026-11-08' });
    assert.deepStrictEqual(schedule(4, 'mushaf', '2026-11-01'), { box: 0, due_on: '2026-11-02' });
    assert.deepStrictEqual(schedule(5, 'smooth', '2026-12-31'), { box: 5, due_on: '2027-03-01' });
    assert.deepStrictEqual(INTERVAL_DAYS, [1, 3, 7, 14, 30, 60]);
    assert.ok(DAILY_CARDS <= 5, 'about five minutes a day');
  });

  it('has no streaks (BACKLOG NX-01)', () => {
    // What the learner reads, without code comments.
    const ui = fs.readFileSync('src/student/components/ReviewCard.tsx', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');
    assert.doesNotMatch(ui, /streak|in a row|متتالي/i);
  });
});

describe('NX-01 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('needs sign-in', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/review`)).status, 401);
    const post = await fetch(`${base}/api/student/review/00000000-0000-4000-8000-000000000000`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"grade":"smooth"}' });
    assert.strictEqual(post.status, 401);
  });
});
