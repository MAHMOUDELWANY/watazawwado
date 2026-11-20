import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { milestonesOf, nextMilestone, npsOf, parseSurvey, registerPlatformRatingRoutes } from '../server/routes/platformRatings.js';
import { fakeDb } from './helpers/fakeDb.js';

const L1 = '11111111-1111-4111-8111-111111111111';
const U1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOW = Date.parse('2026-11-20T12:00:00Z');
const day = (d: number) => new Date(NOW - d * 86_400_000).toISOString();
const report = (subject: string, lesson: number, from: number, to: number, at: string) =>
  ({ student_id: L1, subject, lesson_number: lesson, from_page: from, to_page: to, strengths: [], to_reinforce: [], note: null, game_result: null, created_at: at });

// literacy-a-kids: part 1 is lesson 1 (14 pages). egyptian-kids-3: one part, ending at lesson 3 (11 pages) = the track.
describe('CL-52 when a part or a track is complete', () => {
  it('a part is complete when the reports cover every page of its last lesson', () => {
    assert.deepStrictEqual(milestonesOf([report('literacy-a-kids', 1, 1, 9, day(3))]), []);
    const done = milestonesOf([report('literacy-a-kids', 1, 1, 9, day(3)), report('literacy-a-kids', 1, 10, 14, day(2))]);
    assert.deepStrictEqual(done.map((m) => [m.key, m.kind, m.at]), [['part:literacy-a-kids:1', 'part', day(2)]]);
  });

  it('the last part shows as the whole track', () => {
    const m = milestonesOf([report('egyptian-kids-3', 3, 1, 11, day(1))]);
    assert.deepStrictEqual(m.map((x) => [x.key, x.kind]), [['track:egyptian-kids-3', 'track']]);
  });

  it('only recent milestones, newest first, never one already answered or dismissed', () => {
    const reports = [report('literacy-a-kids', 1, 1, 14, day(5)), report('egyptian-kids-3', 3, 1, 11, day(1))];
    assert.strictEqual(nextMilestone(reports, new Set(), NOW)?.key, 'track:egyptian-kids-3');
    assert.strictEqual(nextMilestone(reports, new Set(['track:egyptian-kids-3']), NOW)?.key, 'part:literacy-a-kids:1');
    assert.strictEqual(nextMilestone([report('literacy-a-kids', 1, 1, 14, day(40))], new Set(), NOW), null, 'older than 30 days');
  });

  it('0-10 is required unless dismissed; NPS is promoters minus detractors', () => {
    assert.deepStrictEqual(parseSurvey({ recommend: 9, liked: ' the teacher ', improve: '' }), { recommend: 9, liked: 'the teacher', improve: null, dismissed: false });
    assert.ok('error' in parseSurvey({}));
    assert.ok('error' in parseSurvey({ recommend: 11 }));
    assert.deepStrictEqual(parseSurvey({ dismissed: true, recommend: 3 }), { recommend: null, liked: null, improve: null, dismissed: true });
    assert.strictEqual(npsOf([10, 9, 8, 6]), 25);
    assert.strictEqual(npsOf([]), null);
  });
});

describe('CL-52 platform survey routes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ curriculum_lesson_reports: [report('egyptian-kids-3', 3, 1, 11, day(1))], platform_ratings: [], students: [{ id: L1, name: 'Maryam' }] });
  const auth = (req: any, res: any, next: any) => {
    const who = req.headers['x-who'];
    if (who === 'family' || who === 'kid') { req.studentUser = { auth_id: U1 }; if (who === 'kid') req.childDevice = { learnerId: L1 }; return next(); }
    if (who === 'teacher' || who === 'admin') { req.teacherUser = { id: 't', role: who === 'admin' ? 'super_admin' : 'teacher' }; return next(); }
    res.status(401).json({ error: 'auth' });
  };
  before(async () => {
    const app = express();
    app.use(express.json());
    registerPlatformRatingRoutes(app, {
      getClient: () => db, verifyStudentAuth: auth, verifyTeacherAuth: auth, rateLimit: (_q: any, _s: any, n: any) => n(),
      requireSuperAdmin: (req: any, res: any, next: any) => (req.teacherUser?.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' })),
      getLearners: async () => [{ id: L1, name: 'Maryam' }], now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  const call = (method: string, path: string, who: string, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', 'x-who': who }, body: body ? JSON.stringify(body) : undefined });

  it('the family sees the survey once the track is finished; a child phone does not', async () => {
    const body: any = await (await call('GET', '/api/student/platform-survey/pending', 'family')).json();
    assert.deepStrictEqual([body.pending.milestone, body.pending.kind, body.pending.learnerName], ['track:egyptian-kids-3', 'track', 'Maryam']);
    assert.deepStrictEqual(await (await call('GET', '/api/student/platform-survey/pending', 'kid')).json(), { pending: null });
    assert.strictEqual((await call('POST', '/api/student/platform-survey', 'kid', { learnerId: L1, milestone: 'track:egyptian-kids-3', recommend: 9 })).status, 403);
  });

  it('only the pending milestone can be answered, and once', async () => {
    assert.strictEqual((await call('POST', '/api/student/platform-survey', 'family', { learnerId: L1, milestone: 'part:literacy-a-kids:1', recommend: 9 })).status, 409);
    assert.strictEqual((await call('POST', '/api/student/platform-survey', 'family', { learnerId: L1, milestone: 'track:egyptian-kids-3', recommend: 9, liked: 'Kind teacher', improve: 'More games' })).status, 201);
    assert.deepStrictEqual(await (await call('GET', '/api/student/platform-survey/pending', 'family')).json(), { pending: null });
    assert.strictEqual((await call('POST', '/api/student/platform-survey', 'family', { learnerId: L1, milestone: 'track:egyptian-kids-3', recommend: 2 })).status, 409);
  });

  it('the super admin sees the average, NPS and comments', async () => {
    assert.strictEqual((await call('GET', '/api/dashboard/admin/platform-ratings', 'teacher')).status, 403);
    const all: any = await (await call('GET', '/api/dashboard/admin/platform-ratings', 'admin')).json();
    assert.deepStrictEqual([all.count, all.average, all.nps], [1, 9, 100]);
    assert.deepStrictEqual([all.items[0].learnerName, all.items[0].kind, all.items[0].liked, all.items[0].improve], ['Maryam', 'track', 'Kind teacher', 'More games']);
  });
});
