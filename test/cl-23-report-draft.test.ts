import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { buildReportDraft, TAUGHT_SECONDS } from '../server/classroom/reportDraft.js';
import { registerAfterLessonRoutes, reportDueIds } from '../server/routes/afterLesson.js';
import { isChildRoute } from '../server/routes/childDevices.js';
import { isRoomEvent } from '../src/lib/roomEvents.js';
import { SUBJECTS } from '../src/curriculum/catalog.js';
import { fakeDb } from './helpers/fakeDb.js';

const START = '2026-11-10T10:00:00.000Z';
const at = (sec: number) => new Date(Date.parse(START) + sec * 1000).toISOString();
const ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const OTHER = '5049fa58-7428-44e4-926b-5e3eb315c5cb';
const FILE_A = '11111111-2222-4333-8444-555555555555.pdf';
const FILE_B = '21111111-2222-4333-8444-555555555555.png';
const subject = SUBJECTS.find((s) => Object.values(s.lessons).some((l: any) => l.pages.length >= 6))!;
const number = Number(Object.keys(subject.lessons).find((n) => (subject.lessons as any)[n].pages.length >= 6));
const slide = (sec: number, page: number, extra: any = {}) => ({ type: 'slide', actor_role: 'teacher', occurred_at: at(sec), payload: { state: { track: subject.id, number, page, step: 0, ...extra } } });

describe('CL-23 buildReportDraft', () => {
  it('pages with 20 s or more, or with pen, are taught; the range is suggested 1-based', () => {
    const rows = [
      slide(0, 0), slide(5, 1), slide(60, 2), slide(65, 3), slide(66, 3, { inked: true }), slide(70, 4),
      { type: 'reaction', occurred_at: at(30), payload: { kind: 'hand' } },
      { type: 'reaction', occurred_at: at(31), payload: { kind: 'hand' } },
      { type: 'reaction', occurred_at: at(40), payload: { kind: 'confused' } },
      { type: 'end', occurred_at: at(400), payload: { early: true, minutesEarly: 5, reason: 'Learner felt unwell today' } },
    ];
    const d = buildReportDraft({ rows, stopMs: Date.parse(at(120)), fileIds: [FILE_A, FILE_B, 'notes.txt'], sharedIds: [FILE_B] });
    const pages = d.lessons[0].pages;
    assert.deepStrictEqual(pages.map((p) => [p.page, p.taught]), [[1, false], [2, true], [3, false], [4, true], [5, true]]);
    assert.ok(pages[1].seconds >= TAUGHT_SECONDS);
    assert.deepStrictEqual(d.curriculum, { track: subject.id, number, fromPage: 2, toPage: 5 });
    assert.deepStrictEqual(d.reactions, { hand: 2, confused: 1 });
    assert.deepStrictEqual(d.files, [{ fileId: FILE_A, kind: 'pdf', shared: false }, { fileId: FILE_B, kind: 'image', shared: true }]);
    assert.deepStrictEqual(d.earlyEnd, { minutesEarly: 5, reason: 'Learner felt unwell today' });
    assert.strictEqual(d.talk, null);
  });

  it('adds up talk rows from each teacher join (a rejoin writes a second row)', () => {
    const d = buildReportDraft({ rows: [slide(0, 0), { type: 'talk', occurred_at: at(10), payload: { teacherMs: 60000, learnerMs: 30000 } }, { type: 'talk', occurred_at: at(20), payload: { teacherMs: 1000, learnerMs: 2000 } }], stopMs: Date.parse(at(5)), fileIds: [], sharedIds: [] });
    assert.deepStrictEqual(d.talk, { teacherMs: 61000, learnerMs: 32000 });
  });

  it('reads the talk summary when it exists (numbers only), and suggests nothing without taught pages', () => {
    const d = buildReportDraft({ rows: [slide(0, 0), { type: 'talk', occurred_at: at(10), payload: { teacherSeconds: 600, learnerSeconds: 420, note: 'x' } }], stopMs: Date.parse(at(5)), fileIds: [], sharedIds: [] });
    assert.deepStrictEqual(d.talk, { teacherSeconds: 600, learnerSeconds: 420 });
    assert.strictEqual(d.curriculum, null);
  });

  it('the inked flag travels as a valid slide event; anything else is refused', () => {
    assert.ok(isRoomEvent({ t: 'slide', state: { track: 'x', number: 1, page: 0, step: 0, inked: true } }));
    assert.ok(!isRoomEvent({ t: 'slide', state: { track: 'x', number: 1, page: 0, step: 0, inked: 'yes' } }));
  });

  it('a child phone may read its lesson files', () => {
    assert.ok(isChildRoute('GET', '/api/student/lesson-files'));
  });
});

describe('CL-23 report due on Today', () => {
  it('only room-completed lessons without a family summary', async () => {
    const db = fakeDb({
      lesson_attendance_verdicts: [{ booking_id: ID, verdict: 'completed' }, { booking_id: OTHER, verdict: 'completed' }],
      lesson_sessions: [{ id: 'ses-1', booking_id: ID }, { id: 'ses-2', booking_id: OTHER }],
      lesson_notes: [{ session_id: 'ses-2', family_summary: 'Lovely lesson' }],
    });
    const due = await reportDueIds(db, [{ id: ID, status: 'completed' }, { id: OTHER, status: 'completed' }, { id: 'x', status: 'confirmed' }]);
    assert.deepStrictEqual([...due], [ID]);
  });
});

describe('CL-23 after-lesson routes', () => {
  let server: http.Server;
  let base: string;
  const booking = { id: ID, teacher_id: 't1', student_id: 's1', status: 'completed', scheduled_start: START, scheduled_end: at(1800), duration_minutes: 30, reference_code: 'WZ-1', contact_name: 'Yusuf' };
  const db = fakeDb({
    bookings: [booking, { ...booking, id: OTHER, student_id: 's2', teacher_id: 't2' }],
    lesson_timeline_events: [{ booking_id: ID, ...slide(0, 0) }, { booking_id: ID, ...slide(30, 1) }],
    lesson_attendance_events: [{ booking_id: ID, source: 'room', event: 'room_joined', role: 'teacher', occurred_at: at(0) }],
    lesson_room_seats: [{ booking_id: ID, seat: 'guardian_observer:p1', user_id: 'p1', updated_at: at(60) }, { booking_id: ID, seat: 'teacher', user_id: 't1', updated_at: at(0) }],
    lesson_feedback: [{ booking_id: ID, rating: 5, comment: 'Great', created_at: at(4000) }],
    lesson_attendance_verdicts: [{ booking_id: ID, verdict: 'completed', reason: 'held', trigger: 'end', applied: true, detail: {}, decided_at: at(1800) }],
  }, { files: { [ID]: [FILE_A, FILE_B] } });
  const teacherAuth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin' ? 'super_admin' : 'teacher' };
    next();
  };
  const studentAuth = (req: any, res: any, next: any) => { req.studentUser = { auth_id: req.headers['x-family'] }; next(); };
  const superOnly = (req: any, res: any, next: any) => (req.teacherUser.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' }));

  before(async () => {
    const app = express();
    app.use(express.json());
    registerAfterLessonRoutes(app, {
      getClient: () => db, verifyTeacherAuth: teacherAuth, verifyStudentAuth: studentAuth, requireSuperAdmin: superOnly, rateLimit: (_q: any, _s: any, n: any) => n(),
      getLearners: async (_c: any, req: any) => (req.studentUser.auth_id === 'fam1' ? [{ id: 's1', name: 'Yusuf' }] : [{ id: 's2', name: 'Other' }]),
      now: () => Date.parse(at(5000)),
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });
  const call = (method: string, path: string, headers: Record<string, string>, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body ? JSON.stringify(body) : undefined });

  it('the teacher gets the draft of their own lesson; another teacher is refused', async () => {
    const ok: any = await (await call('GET', `/api/dashboard/bookings/${ID}/report-draft`, { 'x-teacher': 't1' })).json();
    assert.strictEqual(ok.draft.files.length, 2);
    assert.strictEqual(ok.draft.lessons[0].track, subject.id);
    assert.strictEqual((await call('GET', `/api/dashboard/bookings/${ID}/report-draft`, { 'x-teacher': 't2' })).status, 403);
  });

  it('report files: only this lesson\'s stored files, then the family sees them with signed links', async () => {
    assert.strictEqual((await call('POST', `/api/dashboard/bookings/${ID}/report-files`, { 'x-teacher': 't1' }, { fileIds: ['../x.pdf'] })).status, 400);
    assert.strictEqual((await call('POST', `/api/dashboard/bookings/${ID}/report-files`, { 'x-teacher': 't1' }, { fileIds: ['31111111-2222-4333-8444-555555555555.pdf'] })).status, 404);
    assert.strictEqual((await call('POST', `/api/dashboard/bookings/${ID}/report-files`, { 'x-teacher': 't2' }, { fileIds: [FILE_A] })).status, 403);
    assert.strictEqual((await call('POST', `/api/dashboard/bookings/${ID}/report-files`, { 'x-teacher': 't1' }, { fileIds: [FILE_A] })).status, 200);
    const fam: any = await (await call('GET', '/api/student/lesson-files', { 'x-family': 'fam1' })).json();
    assert.deepStrictEqual(fam.files[ID].map((f: any) => [f.fileId, f.kind]), [[FILE_A, 'pdf']]);
    assert.match(fam.files[ID][0].url, /^https:\/\/signed\//);
    const stranger: any = await (await call('GET', '/api/student/lesson-files', { 'x-family': 'fam2' })).json();
    assert.deepStrictEqual(stranger.files, {});
    assert.strictEqual((await call('GET', '/api/student/lesson-files?learnerId=s1', { 'x-family': 'fam2' })).status, 403);
  });

  it('the admin lesson view is super admin only and carries every part', async () => {
    assert.strictEqual((await call('GET', `/api/admin/lessons/${ID}`, { 'x-teacher': 't1' })).status, 403);
    const body: any = await (await call('GET', `/api/admin/lessons/${ID}`, { 'x-teacher': 'admin' })).json();
    assert.strictEqual(body.verdict.verdict, 'completed');
    assert.strictEqual(body.rating.rating, 5);
    assert.deepStrictEqual(body.guardianObservations, [{ userId: 'p1', lastEnteredAt: at(60) }]);
    assert.deepStrictEqual(body.attendance.teacher, [{ at: at(0), event: 'joined', source: 'room' }]);
    assert.strictEqual(body.timeline.length, 2);
    assert.deepStrictEqual(body.sharedFiles, [FILE_A]);
  });
});

describe('CL-23 rating: never from a child phone (3.4)', () => {
  let server: http.Server;
  let base: string;
  before(async () => {
    const { registerFeedbackRoutes } = await import('../server/routes/feedback.js');
    const app = express();
    app.use(express.json());
    const db = fakeDb({ bookings: [] });
    registerFeedbackRoutes(app, {
      getClient: () => db,
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: '6049fa58-7428-44e4-926b-5e3eb315c5cb' }; if (req.headers['x-kid']) req.childDevice = { id: 'd1', learnerId: 's1' }; next(); },
      verifyTeacherAuth: (_q: any, _s: any, n: any) => n(), requireSuperAdmin: (_q: any, _s: any, n: any) => n(), rateLimit: (_q: any, _s: any, n: any) => n(),
      getLearners: async () => [{ id: 's1', name: 'Yusuf' }], teacherName: async () => null,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('a child phone gets no prompt and cannot rate', async () => {
    const pending: any = await (await fetch(`${base}/api/student/lesson-feedback/pending`, { headers: { 'x-kid': '1' } })).json();
    assert.strictEqual(pending.pending, null);
    const res = await fetch(`${base}/api/student/bookings/${ID}/feedback`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-kid': '1' }, body: JSON.stringify({ rating: 5 }) });
    assert.strictEqual(res.status, 403);
  });
});
