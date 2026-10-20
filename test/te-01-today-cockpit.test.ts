import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';

describe('TE-01 Today page as a cockpit', () => {
  const page = fs.readFileSync('src/dashboard/pages/TodayPage.tsx', 'utf8');

  it('the next lesson leads, before the numbers and the timeline', () => {
    const spotlight = page.indexOf('<NextLessonSpotlight');
    assert.ok(spotlight > 0 && spotlight < page.indexOf('{/* Summary Row */}'));
    assert.ok(page.includes('context={summary.next_lesson_context || null}'));
    assert.ok(page.includes('openZoomAsHost(e, lesson.id, startLink)'), 'Start as host stays');
  });

  it('shows age, level, last family summary and next steps, and lists summaries still to write', () => {
    for (const s of ['context?.age', 'context?.level', 'context.lastFamilySummary', 'context.lastNextSteps', 'missingNotes.map(']) assert.ok(page.includes(s), s);
  });

  it('never sends teacher-private notes into the cockpit', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const startAt = api.indexOf("app.get('/api/dashboard/today'");
    const route = api.slice(startAt, api.indexOf('\napp.', startAt + 10));
    assert.ok(!route.includes('private_notes'));
    assert.ok(route.includes('missing_notes: missingNotes') && route.includes('next_lesson_context: nextLessonContext'));
  });

  describe('endpoint', () => {
    let server: http.Server;
    let base: string;
    before(async () => {
      await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
    });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('answers a teacher with the new fields', async () => {
      const r = await fetch(`${base}/api/dashboard/today`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
      if (r.status === 503) return; // no database in this environment
      assert.strictEqual(r.status, 200);
      const body: any = await r.json();
      assert.ok(Array.isArray(body.missing_notes));
      assert.ok('next_lesson_context' in body.summary);
    });
  });
});
