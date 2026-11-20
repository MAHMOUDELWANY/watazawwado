import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { dueMilestone, endOfToday, nextDue, parseAnswers, registerTeacherRatingRoutes } from '../server/routes/teacherRatings.js';
import { fakeDb } from './helpers/fakeDb.js';

const L1 = '11111111-1111-4111-8111-111111111111';
const L2 = '22222222-2222-4222-8222-222222222222';
const T1 = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const U1 = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const NOW = Date.parse('2026-11-20T12:00:00Z');

describe('CL-51 when the teacher rating is due', () => {
  it('after the 4th completed lesson, then every 8', () => {
    assert.deepStrictEqual([0, 3, 4, 5, 11, 12, 19, 20, 28].map(dueMilestone), [null, null, 4, 4, 4, 12, 12, 20, 28]);
  });

  it('asks once per milestone; snooze hides it until the end of the day, once', () => {
    const pair = { studentId: L1, teacherId: T1, completed: 5 };
    assert.deepStrictEqual(nextDue([pair], [], NOW), { ...pair, lessonCount: 4, canSnooze: true });
    const snoozed = { student_id: L1, teacher_id: T1, lesson_count: 4, snoozed_until: new Date(NOW + 3600_000).toISOString(), submitted_at: null };
    assert.strictEqual(nextDue([pair], [snoozed], NOW), null, 'snoozed now');
    assert.deepStrictEqual(nextDue([pair], [snoozed], NOW + 2 * 3600_000), { ...pair, lessonCount: 4, canSnooze: false }, 'back, and no second snooze');
    const answered = { ...snoozed, submitted_at: new Date(NOW).toISOString() };
    assert.strictEqual(nextDue([pair], [answered], NOW + 2 * 3600_000), null);
    assert.strictEqual(nextDue([{ ...pair, completed: 12 }], [answered], NOW)?.lessonCount, 12, 'next stretch');
    assert.strictEqual(nextDue([{ ...pair, completed: 30 }], [], NOW)?.lessonCount, 28, 'a long-time learner is asked once, for the latest stretch');
  });

  it('later today ends at the end of the family\'s day, never more than 24 h away', () => {
    assert.strictEqual(endOfToday(NOW, 'Europe/London'), '2026-11-20T23:59:59.999Z');
    assert.strictEqual(endOfToday(NOW, 'nowhere/zone'), new Date(NOW + 12 * 3600_000).toISOString());
    assert.ok(Date.parse(endOfToday(NOW, 'Pacific/Kiritimati')) - NOW <= 24 * 3600_000);
  });

  it('every question needs 1-5; the note is optional', () => {
    assert.deepStrictEqual(parseAnswers({ explains: 5, patient: 4, onTime: 3, enjoys: 5, note: '  great  ' }), { scores: { explains: 5, patient: 4, on_time: 3, enjoys: 5 }, note: 'great' });
    assert.ok('error' in parseAnswers({ explains: 5, patient: 4, onTime: 3 }));
    assert.ok('error' in parseAnswers({ explains: 6, patient: 4, onTime: 3, enjoys: 5 }));
  });
});

describe('CL-51 teacher rating routes', () => {
  let server: http.Server;
  let base: string;
  const completed = (student: string, n: number) => Array.from({ length: n }, (_, i) => ({ id: `${student}-${i}`, student_id: student, teacher_id: T1, status: 'completed' }));
  const db = fakeDb({
    bookings: [...completed(L1, 4), ...completed(L2, 2), { id: 'x', student_id: L1, teacher_id: T1, status: 'cancelled' }],
    teacher_ratings: [],
    students: [{ id: L1, name: 'Maryam' }],
  });
  const auth = (req: any, res: any, next: any) => {
    const who = req.headers['x-who'];
    if (who === 'family' || who === 'kid') { req.studentUser = { auth_id: U1 }; if (who === 'kid') req.childDevice = { learnerId: L1 }; return next(); }
    if (who === 'teacher' || who === 'admin') { req.teacherUser = { id: T1, role: who === 'admin' ? 'super_admin' : 'teacher' }; return next(); }
    res.status(401).json({ error: 'auth' });
  };
  const superOnly = (req: any, res: any, next: any) => (req.teacherUser?.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' }));

  before(async () => {
    const app = express();
    app.use(express.json());
    registerTeacherRatingRoutes(app, {
      getClient: () => db, verifyStudentAuth: auth, verifyTeacherAuth: auth, requireSuperAdmin: superOnly, rateLimit: (_q: any, _s: any, n: any) => n(),
      getLearners: async () => [{ id: L1, name: 'Maryam', learnerType: 'child' }, { id: L2, name: 'Omar' }],
      teacherName: async () => ({ display_name: 'Ustadha Afnan' }), now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const call = (method: string, path: string, who: string, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', 'x-who': who }, body: body ? JSON.stringify(body) : undefined });
  const answers = { learnerId: L1, teacherId: T1, lessonCount: 4, explains: 5, patient: 5, onTime: 4, enjoys: 5, note: 'She loves it' };

  it('the family is asked about the teacher after the 4th lesson; a child phone never is', async () => {
    const body: any = await (await call('GET', '/api/student/teacher-rating/pending', 'family')).json();
    assert.deepStrictEqual(body.pending, { learnerId: L1, learnerName: 'Maryam', isChild: true, teacherId: T1, teacherName: 'Ustadha Afnan', lessonCount: 4, canSnooze: true });
    assert.deepStrictEqual(await (await call('GET', '/api/student/teacher-rating/pending', 'kid')).json(), { pending: null });
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'kid', answers)).status, 403);
  });

  it('only the milestone the server says is due can be answered', async () => {
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'family', { ...answers, lessonCount: 12 })).status, 409);
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'family', { ...answers, learnerId: L2 })).status, 409, 'only 2 lessons');
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'family', { ...answers, enjoys: 0 })).status, 400);
  });

  it('later today once, then it must be answered; answered once only', async () => {
    const snooze = await call('POST', '/api/student/teacher-rating/snooze', 'family', { ...answers, tz: 'Europe/London' });
    assert.strictEqual(snooze.status, 200);
    assert.deepStrictEqual(await (await call('GET', '/api/student/teacher-rating/pending', 'family')).json(), { pending: null });
    assert.strictEqual((await call('POST', '/api/student/teacher-rating/snooze', 'family', answers)).status, 409, 'no second snooze');
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'family', answers)).status, 201, 'answering a snoozed one is allowed');
    const row = db.tables.teacher_ratings[0];
    assert.deepStrictEqual([row.explains, row.on_time, row.note, Boolean(row.submitted_at)], [5, 4, 'She loves it', true]);
    assert.strictEqual(db.tables.teacher_ratings.length, 1);
    assert.strictEqual((await call('POST', '/api/student/teacher-rating', 'family', answers)).status, 409, 'once only');
  });

  it('the teacher sees no averages until a finished month has 5+ answers, and never notes or names', async () => {
    const mine: any = await (await call('GET', '/api/dashboard/me/teacher-ratings', 'teacher')).json();
    assert.deepStrictEqual(mine, { count: 0, minimum: 5, averages: null });
    for (let i = 0; i < 5; i++) db.tables.teacher_ratings.push({ student_id: `s${i}`, teacher_id: T1, lesson_count: 4, explains: 4, patient: 5, on_time: 3, enjoys: 4, note: 'secret', submitted_at: `2026-10-0${i + 1}T10:00:00Z` });
    const later: any = await (await call('GET', '/api/dashboard/me/teacher-ratings', 'teacher')).json();
    assert.deepStrictEqual(later, { count: 5, minimum: 5, averages: { explains: 4, patient: 5, onTime: 3, enjoys: 4 } });
    assert.ok(!JSON.stringify(later).includes('secret'));
  });

  it('the super admin sees every answer with notes, per teacher', async () => {
    assert.strictEqual((await call('GET', '/api/dashboard/admin/teacher-ratings', 'teacher')).status, 403);
    const all: any = await (await call('GET', '/api/dashboard/admin/teacher-ratings', 'admin')).json();
    assert.strictEqual(all.byTeacher[0].count, 6);
    assert.ok(all.items.some((i: any) => i.note === 'She loves it' && i.learnerName === 'Maryam'));
  });
});
