import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import type { RoomEvent } from '../src/lib/roomEvents.js';
import { fakeDb } from './helpers/fakeDb.js';

const NOW = Date.parse('2026-11-20T10:05:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const SECRET = 'room-secret';
const AUDIO = '11111111-2222-4333-8444-555555555555.webm';

describe('CL-33 tool events on the server', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({
    bookings: [{ id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed', scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf' }],
    lesson_room_seats: [
      { booking_id: BOOKING_ID, seat: 'teacher', join_id: 'jt', user_id: 'teacher-1', session_id: 'sess-t' },
      { booking_id: BOOKING_ID, seat: 'learner', join_id: 'jl', user_id: 'parent-1', session_id: null },
    ],
    lesson_room_state: [{ booking_id: BOOKING_ID, snapshot: {} }],
    learner_mistakes: [],
    students: [{ id: 'child-1', current_level: 'elementary' }],
    curriculum_lesson_reports: [{ student_id: 'child-1', subject: 'nope', lesson_number: 1, to_page: 4, strengths: ['listens well'], to_reinforce: ['baa'], note: null, created_at: '2026-11-13' }],
  });

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true, cloudflare: () => null,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      verifyStudentAuth: (_q: any, _s: any, next: any) => next(),
      getLearners: async () => [],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      requireSuperAdmin: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const ticket = (role: string, userId: string, joinId: string) =>
    signTicket({ bookingId: BOOKING_ID, role: role as any, userId, exp: NOW + 60_000, joinId, studentId: 'child-1' }, SECRET);
  const T = ticket('teacher', 'teacher-1', 'jt');
  const L = ticket('learner', 'parent-1', 'jl');
  const post = (t: string, events: RoomEvent[]) => fetch(`${base}/api/classroom/${BOOKING_ID}/events`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t },
    body: JSON.stringify({ events: events.map((event) => ({ at: NOW - 1000, event })) }),
  });
  const timeline = () => (db.tables.lesson_timeline_events || []) as any[];
  const snapshot = () => db.tables.lesson_room_state[0].snapshot;

  it('the teacher\'s tools land in the timeline, the snapshot and the mistake bank', async () => {
    const res = await post(T, [
      { t: 'stage', stage: 'review' },
      { t: 'correction', id: 'c1', said: 'ana ruht', correct: 'ana rohtu' },
      { t: 'check', id: 'k1', part: 'review', open: true },
      { t: 'practice', practice: { kind: 'blanks', text: 'one two three', seed: 4 } },
      { t: 'media', kind: 'youtube', src: 'dQw4w9WgXcQ', playing: true, pos: 30 },
      { t: 'shadow', fileId: AUDIO },
      { t: 'practice_answer', kind: 'blanks', answer: ['x'] },
      { t: 'check_answer', id: 'k1', part: 'review', level: 'red' },
    ]);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(timeline().map((r) => r.type), ['stage', 'correction', 'check', 'practice', 'media', 'shadow'], 'no live-only or learner-only types from the teacher');
    const s = snapshot();
    assert.deepStrictEqual(s.tools, {
      stage: 'review',
      check: { id: 'k1', part: 'review', open: true },
      practice: { kind: 'blanks', text: 'one two three', seed: 4 },
      media: { kind: 'youtube', src: 'dQw4w9WgXcQ', playing: true, pos: 30, savedAt: NOW },
      shadow: AUDIO,
    });
    assert.deepStrictEqual(db.tables.learner_mistakes.map((m: any) => [m.student_id, m.booking_id, m.teacher_id, m.client_id, m.said, m.correct]),
      [['child-1', BOOKING_ID, 'teacher-1', 'c1', 'ana ruht', 'ana rohtu']]);
  });

  it('a retried batch does not add the correction twice', async () => {
    await post(T, [{ t: 'correction', id: 'c1', said: 'ana ruht', correct: 'ana rohtu' }]);
    assert.strictEqual(db.tables.learner_mistakes.length, 1);
  });

  it('the learner answers the check (it closes) but cannot drive the tools', async () => {
    const before = timeline().length;
    assert.strictEqual((await post(L, [
      { t: 'stage', stage: 'close' },
      { t: 'correction', id: 'c9', said: 'a', correct: 'b' },
      { t: 'check_answer', id: 'k1', part: 'review', level: 'amber' },
    ])).status, 200);
    assert.deepStrictEqual(timeline().slice(before).map((r) => [r.type, r.actor_role]), [['check_answer', 'student']]);
    assert.strictEqual(snapshot().tools.stage, 'review');
    assert.deepStrictEqual(snapshot().tools.check, { id: 'k1', part: 'review', open: false, answer: 'amber' });
    assert.strictEqual(db.tables.learner_mistakes.length, 1);
  });

  it('rejoin gets the tools back from /state', async () => {
    const body = await (await fetch(`${base}/api/classroom/${BOOKING_ID}/state`, { headers: { 'x-room-ticket': L } })).json();
    assert.strictEqual(body.snapshot.tools.stage, 'review');
    assert.strictEqual(body.snapshot.tools.media.src, 'dQw4w9WgXcQ');
  });

  it('the warm-up is the teacher\'s only', async () => {
    assert.strictEqual((await fetch(`${base}/api/classroom/${BOOKING_ID}/warmup`, { headers: { 'x-room-ticket': L } })).status, 403);
    const res = await fetch(`${base}/api/classroom/${BOOKING_ID}/warmup`, { headers: { 'x-room-ticket': T } });
    assert.strictEqual(res.status, 200);
    const { prompts } = await res.json();
    assert.ok(prompts.length >= 3);
    assert.ok(prompts.some((p: any) => p.en.includes('listens well')));
    assert.ok(prompts.some((p: any) => p.en.includes('"ana ruht" → "ana rohtu"')));
    assert.ok(prompts.some((p: any) => p.en.startsWith('Elementary')));
  });

  it('audio may be added to the room; other types are still refused', async () => {
    const ask = (contentType: string) => fetch(`${base}/api/classroom/${BOOKING_ID}/files/upload-url`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': T }, body: JSON.stringify({ contentType, size: 1000 }),
    });
    assert.strictEqual((await ask('text/html')).status, 415);
    // The fake storage has no signed uploads: getting past the type check is what is tested here.
    assert.notStrictEqual((await ask('audio/webm')).status, 415);
    assert.notStrictEqual((await ask('audio/mpeg')).status, 415);
  });
});
