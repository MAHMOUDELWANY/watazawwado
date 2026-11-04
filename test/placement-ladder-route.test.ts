import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { registerCommunityRoutes } from '../server/routes/community.js';
import { buildPlacementTest } from '../server/placement/index.js';

// The submit route of a ladder test, end to end against an in-memory placement_tests row: it adds the next level while
// the climb goes on, keeps earlier answers locked, and finishes with a level and a start lesson.

function fakeDb(row: any) {
  const builder = (table: string) => {
    let patch: any = null;
    const result = () => {
      if (table !== 'placement_tests') return { data: [], error: null };
      if (patch) Object.assign(row, patch);
      return { data: row, error: null };
    };
    const b: any = new Proxy({}, {
      get: (_t, prop) => {
        if (prop === 'then') return (res: any) => res(result());
        if (prop === 'update') return (p: any) => { patch = p; return b; };
        if (prop === 'single' || prop === 'maybeSingle') return () => Promise.resolve(result());
        return () => b;
      }
    });
    return b;
  };
  return { from: builder };
}

async function withServer(row: any, run: (post: (answers: number[]) => Promise<any>) => Promise<void>) {
  const app = express();
  app.use(express.json());
  const pass = (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'u1' }; next(); };
  registerCommunityRoutes(app, { getClient: () => fakeDb(row), rateLimit: pass, verifyStudentAuth: pass, verifyTeacherAuth: pass, requireSuperAdmin: pass, getLearners: async () => [] });
  const server = app.listen(0);
  const port = (server.address() as any).port;
  try {
    await run((answers) => fetch(`http://localhost:${port}/api/placement/t1/submit`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers }) }).then((r) => r.json()));
  } finally {
    server.close();
  }
}

test('ladder submit: climbs a level at a time, locks sent answers, ends with a level and a start lesson', async () => {
  const row: any = { id: 't1', auth_user_id: 'u1', service_id: 'tajweed', stated_level: 'beginner', status: 'in_progress', questions: buildPlacementTest('tajweed', 'beginner'), answers: null };
  await withServer(row, async (post) => {
    // Level 1 all right: Level 2's three questions are added, Level 1's answers are kept.
    const l1 = row.questions.map((q: any) => q.answer);
    let r = await post(l1);
    assert.equal(r.next, true);
    assert.equal(r.test.questions.length, 6);
    assert.deepEqual(r.test.answered, l1);
    assert.equal(r.test.questions[0].answer, undefined, 'answers never reach the browser');
    // Level 2 with Lessons 2 and 3 missed; the page also tries to change a locked Level 1 answer, which is ignored.
    const wrong = (q: any) => (q.answer + 1) % q.options.en.length;
    const l2 = row.questions.slice(3).map((q: any, i: number) => (i === 0 ? q.answer : wrong(q)));
    r = await post([wrong(row.questions[0]), ...l1.slice(1), ...l2]);
    assert.equal(r.success, true);
    assert.equal(row.status, 'submitted');
    assert.equal(row.suggested_level, 'intermediate');
    assert.equal(row.score, 4);
    assert.match(row.ai_summary, /from Lesson 2/);
  });
});
