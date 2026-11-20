import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import express from 'express';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { signParentProof } from '../server/routes/parentPin.js';
import { verifyTicket } from '../server/classroom/access.js';
import { summarizeAttendance } from '../server/routes/attendance.js';

// Classroom deep review 2026-11-18, server findings: H1 (seats table), H3 + L4 (enforced end), M1 (heartbeat only from
// the seat's join), M2 (join counted when media connects), M6 (state reports why the room is over), enter's names.
const BOOKING = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const START = '2026-11-20T10:00:00.000Z';
const min = (m: number) => Date.parse(START) + m * 60_000;
const SECRET = 'room-secret';
const lesson = () => ({
  id: BOOKING, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed', scheduled_start: START,
  scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf', service_id: 'quran-kids',
});

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      const run = () => {
        const m = rows(t).filter((r) => filters.every((f) => f(r)));
        if (patch) for (const r of m) Object.assign(r, patch);
        return m.map((r) => ({ ...r }));
      };
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return b; },
        order: () => b,
        limit: () => b,
        maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...[row].flat().map((r) => ({ ...r }))); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string; ignoreDuplicates?: boolean }) => {
          const keys = opts.onConflict.split(',');
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else if (!opts.ignoreDuplicates) rows(t)[i] = { ...rows(t)[i], ...row };
          return { error: null };
        },
        update: (p: any) => { patch = p; return b; },
        then: (ok: any, ko: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(ok, ko),
      };
      return b;
    },
    storage: { from: () => ({ createSignedUrl: async (p: string) => ({ data: { signedUrl: `https://files.test/${p}` }, error: null }) }) },
  };
}

function server(db: any, clock: () => number, onNewSession: () => void = () => {}) {
  let n = 0;
  const cf = {
    configured: true,
    iceServers: async () => [],
    newSession: async () => { onNewSession(); return { sessionId: `sess-${++n}` }; },
    tracksNew: async (_s: string, body: any) => ({ tracks: body.tracks }),
  };
  const app = express();
  app.use(express.json());
  const pass = (_q: any, _s: any, next: any) => next();
  registerClassroomRoutes(app, {
    getClient: () => db, classroomEnabled: () => true, cloudflare: () => cf as any,
    verifyTeacherAuth: (req: any, _res: any, next: any) => { req.teacherUser = { id: req.headers['x-teacher'] || 'teacher-1', role: req.headers['x-teacher'] === 'admin-1' ? 'super_admin' : 'teacher' }; next(); },
    verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'parent-1' }; next(); },
    getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
    rateLimit: pass, roomRateLimit: pass, requireSuperAdmin: pass, secret: () => SECRET, now: clock,
  });
  return app;
}

async function listen(app: express.Express): Promise<{ srv: http.Server; base: string }> {
  return new Promise((r) => { const srv = app.listen(0, '127.0.0.1', () => r({ srv, base: `http://127.0.0.1:${(srv.address() as any).port}` })); });
}

describe('CL-16 migration', () => {
  const sql = fs.readFileSync('supabase/migrations/20261118000002_classroom_room_seats.sql', 'utf8');
  it('lesson_room_seats is one row per (booking, seat), service-role only; lesson_room_state gets ended_at', () => {
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.lesson_room_seats/);
    assert.match(sql, /PRIMARY KEY \(booking_id, seat\)/);
    assert.match(sql, /ALTER TABLE public\.lesson_room_seats ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.lesson_room_seats FROM anon, authenticated/);
    assert.doesNotMatch(sql, /CREATE POLICY/);
    assert.match(sql, /ALTER TABLE public\.lesson_room_state ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ/);
  });
});

describe('CL-16 server review fixes', () => {
  let clock = min(-2);
  let race: null | (() => void) = null;
  const db = fakeDb({
    bookings: [lesson()],
    profiles: [{ id: 'teacher-1', display_name: 'Ustadha Afnan' }],
    services: [{ id: 'quran-kids', title: 'Quran for Kids', arabic_title: 'القرآن للأطفال' }],
    students: [{ id: 'child-1', learner_type: 'child' }],
  });
  let srv: http.Server;
  let base: string;
  before(async () => { ({ srv, base } = await listen(server(db, () => clock, () => { const f = race; race = null; f?.(); }))); });
  after(async () => { await new Promise<void>((r) => srv.close(() => r())); });

  const enter = async (portal: 'dashboard' | 'student', observe = false) => {
    const proof = portal === 'student' && observe ? { 'x-parent-proof': signParentProof('parent-1', SECRET, clock) } : undefined;
    const res = await fetch(`${base}/api/${portal}/classroom/${BOOKING}/enter${observe ? '?observe=1' : ''}`, { headers: proof });
    return { status: res.status, body: await res.json() as any };
  };
  const post = (tk: string, path: string, body: unknown = {}) =>
    fetch(`${base}/api/classroom/${BOOKING}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': tk }, body: JSON.stringify(body) });
  const state = (tk: string) => fetch(`${base}/api/classroom/${BOOKING}/state`, { headers: { 'x-room-ticket': tk } });
  const events = (event: string, role?: string) => (db.tables.lesson_attendance_events || []).filter((e) => e.event === event && (!role || e.role === role));
  const seat = (name: string) => db.tables.lesson_room_seats.find((r) => r.seat === name);
  const beat = (tk: string) => post(tk, 'quality', { degradedSeconds: 0, audioOnlySeconds: 0, reconnects: 0 });
  let teacher: any;
  let learner: any;

  it('enter gives the teacher name, the localized subject and the learner type, and writes the seat but no join', async () => {
    const t = await enter('dashboard');
    assert.strictEqual(t.status, 200);
    teacher = t.body;
    assert.strictEqual(teacher.teacherName, 'Ustadha Afnan');
    assert.deepStrictEqual(teacher.subjectLabel, { en: 'Quran for Kids', ar: 'القرآن للأطفال' });
    assert.strictEqual(teacher.learnerType, 'child');
    const l = await enter('student');
    learner = l.body;
    assert.strictEqual(learner.learnerType, 'child');
    assert.strictEqual(seat('teacher').join_id, verifyTicket(teacher.ticket, SECRET, clock)!.joinId);
    assert.strictEqual(seat('learner').session_id, null);
    assert.strictEqual(events('room_joined').length, 0, 'opening the page is not joining');
    assert.deepStrictEqual(summarizeAttendance(db.tables.lesson_attendance_events || []), { teacher: false, student: false });
  });

  it('M2: connected counts the join once per join; observers get 204 and write nothing', async () => {
    assert.strictEqual((await post(learner.ticket, 'connected')).status, 200);
    assert.strictEqual((await post(learner.ticket, 'connected')).status, 200);
    assert.strictEqual(events('room_joined', 'student').length, 1);
    assert.strictEqual(events('room_joined', 'student')[0].dedupe_key, `room:${BOOKING}:student:joined`);
    assert.deepStrictEqual(summarizeAttendance(db.tables.lesson_attendance_events), { teacher: false, student: true });
    const g = await enter('student', true);
    assert.strictEqual(g.body.role, 'guardian_observer');
    assert.strictEqual((await post(g.body.ticket, 'connected')).status, 204);
    assert.strictEqual(events('room_joined').length, 1);
  });

  it('M2: lateness is judged on when the teacher media connected, not when the page opened', async () => {
    // The page opened at -2; media connects at +6.
    clock = min(6);
    assert.strictEqual((await post(teacher.ticket, 'connected')).status, 200);
    assert.strictEqual(events('room_joined', 'teacher')[0].occurred_at, new Date(min(6)).toISOString());
    assert.deepStrictEqual((db.tables.teacher_late_reasons || []).map((r) => r.late_minutes), [6]);
  });

  it('H1: a session made while a newer device took the seat never overwrites it (409 superseded)', async () => {
    let newer: any;
    race = () => { /* another enter lands between the seat check and the write */ newer = { ...seat('learner') }; seat('learner').join_id = 'newer-join'; };
    const res = await post(learner.ticket, 'rtc/session');
    assert.strictEqual(res.status, 409);
    assert.strictEqual((await res.json()).superseded, true);
    assert.strictEqual(seat('learner').session_id, null);
    seat('learner').join_id = newer.join_id;
    // Without the race the session lands in this join's row, and pulls are checked against the seats table.
    const { sessionId: ts } = await (await post(teacher.ticket, 'rtc/session')).json() as any;
    assert.strictEqual(seat('teacher').session_id, ts);
    const { sessionId: ls } = await (await post(learner.ticket, 'rtc/session')).json() as any;
    assert.strictEqual((await post(learner.ticket, 'rtc/tracks', { sessionId: ls, tracks: [{ location: 'remote', sessionId: ts, trackName: 'cam' }] })).status, 200);
    assert.strictEqual((await post(learner.ticket, 'rtc/tracks', { sessionId: ls, tracks: [{ location: 'remote', sessionId: 'sess-elsewhere', trackName: 'cam' }] })).status, 403);
  });

  it('M1: a heartbeat writes only from the join holding the seat', async () => {
    assert.strictEqual((await beat(learner.ticket)).status, 200);
    assert.strictEqual(events('room_heartbeat', 'student').length, 1);
    const second = (await enter('student')).body;
    const old = await beat(learner.ticket);
    assert.strictEqual(old.status, 409);
    assert.strictEqual((await old.json()).superseded, true);
    assert.strictEqual(events('room_heartbeat', 'student').length, 1);
    learner = second;
    assert.strictEqual((await state(learner.ticket)).status, 200);
  });

  it('M6: /state carries serverNow for the clock offset', async () => {
    const body: any = await (await state(teacher.ticket)).json();
    assert.strictEqual(body.serverNow, min(6));
  });

  it('H3/L4: only the teacher ends; then room_ended once, and enter, state, events, media, files and heartbeats answer 423 ended', async () => {
    assert.strictEqual((await post(learner.ticket, 'end')).status, 403);
    clock = min(20);
    // Owner 2026-11-20: 10 minutes early needs a written reason, kept on the timeline.
    const noReason = await post(teacher.ticket, 'end', { reason: 'short' });
    assert.strictEqual(noReason.status, 400);
    assert.strictEqual(((await noReason.json()) as any).needsReason, true);
    assert.strictEqual(db.tables.lesson_room_state?.[0]?.ended_at ?? null, null);
    const res = await post(teacher.ticket, 'end', { reason: 'The learner had to leave for school.' });
    assert.strictEqual(res.status, 200);
    const early = (db.tables.lesson_timeline_events || []).find((r: any) => r.type === 'end' && r.payload?.early);
    assert.deepStrictEqual(early?.payload, { early: true, minutesEarly: 10, reason: 'The learner had to leave for school.' });
    assert.strictEqual(db.tables.lesson_room_state[0].ended_at, new Date(min(20)).toISOString());
    assert.strictEqual(events('room_ended').length, 1);
    const ended = async (r: Response) => {
      assert.strictEqual(r.status, 423);
      const b: any = await r.json();
      assert.strictEqual(b.ended, true);
      assert.strictEqual(b.reason, 'ended');
    };
    await ended(await post(teacher.ticket, 'end'));
    await ended(await state(learner.ticket));
    await ended(await post(learner.ticket, 'events', { events: [{ at: clock, event: { t: 'reaction', kind: 'hand' } }] }));
    await ended(await post(learner.ticket, 'rtc/session'));
    await ended(await beat(learner.ticket));
    await ended(await fetch(`${base}/api/classroom/${BOOKING}/files/${'0'.repeat(8)}-0000-0000-0000-${'0'.repeat(12)}.pdf`, { headers: { 'x-room-ticket': learner.ticket } }));
    const again = await fetch(`${base}/api/student/classroom/${BOOKING}/enter`);
    await ended(again);
    assert.strictEqual(events('room_ended').length, 1);
    // Leaving still closes presence.
    assert.strictEqual((await post(learner.ticket, 'leave')).status, 200);
    assert.strictEqual(events('room_left', 'student').length, 1);
  });
});

describe('CL-16 /state says why the room is over (M6)', () => {
  const db = fakeDb({ bookings: [lesson()] });
  const clock = min(5);
  let srv: http.Server;
  let base: string;
  before(async () => { ({ srv, base } = await listen(server(db, () => clock))); });
  after(async () => { await new Promise<void>((r) => srv.close(() => r())); });

  const ticketFor = async (portal: 'dashboard' | 'student') => (await (await fetch(`${base}/api/${portal}/classroom/${BOOKING}/enter`)).json() as any).ticket;
  const reason = async (tk: string) => { const r = await fetch(`${base}/api/classroom/${BOOKING}/state`, { headers: { 'x-room-ticket': tk } }); return [r.status, (await r.json() as any).reason]; };
  const withBooking = async (patch: object, fn: () => Promise<void>) => {
    const saved = { ...db.tables.bookings[0] };
    Object.assign(db.tables.bookings[0], patch);
    try { await fn(); } finally { db.tables.bookings[0] = saved; }
  };

  it('cancelled, moved, reassigned, closed', async () => {
    const t = await ticketFor('dashboard');
    const l = await ticketFor('student');
    await withBooking({ status: 'cancelled' }, async () => assert.deepStrictEqual(await reason(t), [409, 'cancelled']));
    await withBooking({ status: 'completed' }, async () => assert.deepStrictEqual(await reason(t), [409, 'closed']));
    await withBooking({ scheduled_start: '2026-11-21T10:00:00.000Z' }, async () => assert.deepStrictEqual(await reason(t), [423, 'moved']));
    await withBooking({ scheduled_start: '2026-11-20T09:00:00.000Z' }, async () => assert.deepStrictEqual(await reason(l), [423, 'moved']));
    await withBooking({ teacher_id: 'teacher-2' }, async () => assert.deepStrictEqual(await reason(t), [403, 'reassigned']));
    await withBooking({ student_id: 'child-2' }, async () => assert.deepStrictEqual(await reason(l), [403, 'reassigned']));
    // Unchanged lesson: still open. (Past the hard close the pass itself has expired: 401.)
    assert.deepStrictEqual(await reason(t), [200, undefined]);
  });
});
