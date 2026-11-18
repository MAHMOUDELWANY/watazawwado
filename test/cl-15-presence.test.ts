import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { analyzeAttendance, inRoomNow, attachAttendance, ROOM_BEAT_GRACE_MS } from '../server/routes/attendance.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { signTicket } from '../server/classroom/access.js';

// Classroom gap (code review finding 5): a tab that dies sends no room_left. The quality call (every 60 s) keeps a
// heartbeat, and room presence ends 90 s after the last one.
const START = '2026-11-10T10:00:00.000Z';
const at = (min: number) => new Date(Date.parse(START) + min * 60_000).toISOString();
const lesson = { scheduled_start: START, duration_minutes: 30 };
const ev = (event: string, role: string, min: number) => ({ event, role, occurred_at: at(min) });

describe('CL-15 room presence ends at the last heartbeat', () => {
  it('the grace is 90 s', () => assert.strictEqual(ROOM_BEAT_GRACE_MS, 90_000));

  it('a teacher tab that crashes at minute 5 is present until 6.5, not the lesson end', () => {
    const a = analyzeAttendance([
      ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 0),
      ev('room_heartbeat', 'teacher', 5), ev('room_heartbeat', 'student', 30),
    ], lesson);
    assert.strictEqual(a.togetherMinutes, 6);
    assert.strictEqual(a.held, false);
    assert.strictEqual(a.teacherFirstJoin, at(0));
  });

  it('a crash before the first heartbeat ends at join + 90 s once the lesson has heartbeats', () => {
    const a = analyzeAttendance([ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 0), ev('room_heartbeat', 'teacher', 30)], lesson);
    assert.strictEqual(a.togetherMinutes, 1);
  });

  it('a normal leave is unchanged', () => {
    const a = analyzeAttendance([
      ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 0),
      ev('room_heartbeat', 'teacher', 25), ev('room_heartbeat', 'student', 25),
      ev('room_left', 'teacher', 25.2), ev('room_left', 'student', 25.2),
      ev('room_heartbeat', 'student', 25.3), // the pagehide send after leaving changes nothing
    ], lesson);
    assert.strictEqual(a.togetherMinutes, 25);
    assert.strictEqual(a.held, true);
  });

  it('a rejoin after a crash counts the new time', () => {
    const a = analyzeAttendance([
      ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 0), ev('room_heartbeat', 'teacher', 5),
      ev('room_joined', 'teacher', 10), ev('room_heartbeat', 'teacher', 30), ev('room_heartbeat', 'student', 30),
    ], lesson);
    assert.strictEqual(a.togetherMinutes, 26); // 0–6.5 and 10–30
    assert.strictEqual(a.held, true);
    assert.deepStrictEqual(a.joins, { teacher: 2, student: 1 });
  });

  it('Zoom presence is never cut by heartbeats, and Zoom-only lessons are as before', () => {
    const zoomOnly = [ev('joined', 'teacher', 0), ev('joined', 'student', 1), ev('left', 'student', 25)];
    assert.strictEqual(analyzeAttendance(zoomOnly, lesson).togetherMinutes, 24);
    // Fell back to Zoom: the teacher's room tab stopped at 3, but the teacher is still on Zoom from minute 4.
    const mixed = [ev('room_joined', 'teacher', 0), ev('room_heartbeat', 'teacher', 3), ev('joined', 'teacher', 4), ev('room_joined', 'student', 0), ev('room_heartbeat', 'student', 30)];
    assert.strictEqual(analyzeAttendance(mixed, lesson).togetherMinutes, 30);
  });

  it('inRoomNow: a side whose last heartbeat is over 90 s old is out; Zoom is as before', () => {
    const now = Date.parse(at(10));
    assert.deepStrictEqual(inRoomNow([ev('room_joined', 'teacher', 0), ev('room_heartbeat', 'teacher', 9.5), ev('room_joined', 'student', 0), ev('room_heartbeat', 'student', 8)], now), { teacherIn: true, studentIn: false });
    assert.deepStrictEqual(inRoomNow([ev('joined', 'teacher', 0), ev('joined', 'student', 0), ev('left', 'student', 2)], now), { teacherIn: true, studentIn: false });
    assert.deepStrictEqual(inRoomNow([ev('room_joined', 'teacher', 0), ev('room_heartbeat', 'teacher', 9.5), ev('room_left', 'teacher', 9.6)], now), { teacherIn: false, studentIn: false });
  });

  it('attachAttendance keeps a heartbeat stored after the lesson end (it is the one row of that join)', async () => {
    const rows = [
      { booking_id: 'b1', ...ev('room_joined', 'teacher', 0) }, { booking_id: 'b1', ...ev('room_joined', 'student', 0) },
      { booking_id: 'b1', ...ev('room_heartbeat', 'teacher', 32) }, { booking_id: 'b1', ...ev('room_heartbeat', 'student', 32) },
    ];
    const q: any = { select: () => q, in: () => q, limit: async () => ({ data: rows, error: null }) };
    const [l] = await attachAttendance({ from: () => q }, [{ id: 'b1', scheduled_start: START, scheduled_end: at(30), duration_minutes: 30 }]);
    assert.strictEqual(l.attendance?.togetherMinutes, 30);
  });
});

// In-memory query builder for the enter and quality routes.
function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let sortBy: { c: string; asc: boolean } | null = null;
      let max = Infinity;
      const run = () => {
        let out = rows(t).filter((r) => filters.every((f) => f(r)));
        if (sortBy) { const { c, asc } = sortBy; out = [...out].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
        return out.slice(0, max).map((r) => ({ ...r }));
      };
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        in: (c: string, v: any[]) => { filters.push((r) => v.includes(r[c])); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return b; },
        gte: (c: string, v: any) => { filters.push((r) => r[c] >= v); return b; },
        order: (c: string, o?: { ascending?: boolean }) => { sortBy = { c, asc: o?.ascending !== false }; return b; },
        limit: (n: number) => { max = n; return b; },
        maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row]).map((r) => ({ ...r }))); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string; ignoreDuplicates?: boolean }) => {
          const keys = opts.onConflict.split(',');
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else if (!opts.ignoreDuplicates) rows(t)[i] = { ...rows(t)[i], ...row };
          return { error: null };
        },
        update: () => b,
        then: (ok: any, ko: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(ok, ko),
      };
      return b;
    },
  };
}

describe('CL-15 enter and quality routes', () => {
  const SECRET = 'room-secret';
  const BOOKING = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
  let clock = Date.parse(at(0));
  const db = fakeDb({
    bookings: [{ id: BOOKING, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed', scheduled_start: START, scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf' }],
  });
  let server: http.Server;
  let base: string;
  const events = () => db.tables.lesson_attendance_events || [];
  const teacherAuth = (req: any, _res: any, next: any) => { req.teacherUser = { id: 'teacher-1', role: 'teacher' }; next(); };
  const pass = (_q: any, _s: any, next: any) => next();
  // M2: the join is counted when media connects, so entering here means enter + connected.
  const enter = async () => {
    const e: any = await (await fetch(`${base}/api/dashboard/classroom/${BOOKING}/enter`)).json();
    if (e.ticket) await fetch(`${base}/api/classroom/${BOOKING}/connected`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': e.ticket }, body: '{}' });
    return e;
  };
  const beat = (ticket: string) => fetch(`${base}/api/classroom/${BOOKING}/quality`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': ticket }, body: JSON.stringify({ degradedSeconds: 0, audioOnlySeconds: 0, reconnects: 0 }),
  });

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true, verifyTeacherAuth: teacherAuth, verifyStudentAuth: pass,
      cloudflare: () => ({ configured: true, iceServers: async () => [], newSession: async () => ({ sessionId: 's' }) }) as any,
      getLearners: async () => [], rateLimit: pass, roomRateLimit: pass, secret: () => SECRET, now: () => clock,
      requireSuperAdmin: pass,
    } as any);
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('heartbeats keep one row per join, moved forward; a second device while in writes no join', async () => {
    const first = await enter();
    assert.ok(first.ticket, JSON.stringify(first));
    clock = Date.parse(at(1)); assert.strictEqual((await beat(first.ticket)).status, 200);
    clock = Date.parse(at(1.5)); await beat(first.ticket);
    clock = Date.parse(at(2)); await beat(first.ticket);
    const beats = events().filter((e) => e.event === 'room_heartbeat');
    assert.strictEqual(beats.length, 1);
    assert.strictEqual(beats[0].occurred_at, at(2));
    assert.strictEqual(beats[0].role, 'teacher');
    assert.strictEqual(beats[0].source, 'room');
    await enter(); // a second device while the first still beats
    assert.strictEqual(events().filter((e) => e.event === 'room_joined').length, 1);
    // M1: the replaced device's heartbeat no longer counts.
    clock = Date.parse(at(3));
    assert.strictEqual((await beat(first.ticket)).status, 409);
    assert.strictEqual(events().filter((e) => e.event === 'room_heartbeat').length, 1);
    assert.strictEqual(events().find((e) => e.event === 'room_joined').dedupe_key, `room:${BOOKING}:teacher:joined`);
  });

  it('a rejoin after a crash (no room_left, heartbeat over 90 s old) writes a new join that counts', async () => {
    clock = Date.parse(at(10));
    const again = await enter();
    const joins = events().filter((e) => e.event === 'room_joined');
    assert.strictEqual(joins.length, 2);
    assert.match(joins[1].dedupe_key, /:teacher:joined:.+/);
    clock = Date.parse(at(11)); await beat(again.ticket);
    assert.strictEqual(events().filter((e) => e.event === 'room_heartbeat').length, 2);
    const a = analyzeAttendance(events(), { scheduled_start: START, duration_minutes: 30 });
    assert.strictEqual(a.joins.teacher, 2);
  });
});
