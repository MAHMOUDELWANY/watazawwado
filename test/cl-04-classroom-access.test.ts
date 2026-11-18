import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { decideRoomAccess, signTicket, verifyTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { CloudflareRealtimeError } from '../server/integrations/cloudflareRealtime.js';
import { roomHardCloseMs } from '../src/lib/roomWindow.js';

const NOW = Date.parse('2026-11-20T09:55:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const booking = {
  id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed',
  scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf',
};
const child = [{ id: 'child-1', isChild: true }];
const adult = [{ id: 'child-1', isChild: false }];
const teacher = { userId: 'teacher-1', role: 'teacher' as const };
const parent = { userId: 'parent-1', role: 'parent' as const };

describe('CL-04 decideRoomAccess', () => {
  const base = { booking, learners: [] as { id: string; isChild: boolean }[], wantObserver: false, now: NOW };

  it('the teacher of the booking inside the window is the teacher', () => {
    assert.deepStrictEqual(decideRoomAccess({ ...base, requester: teacher }), { ok: true, role: 'teacher' });
  });
  it('another teacher is refused', () => {
    const r = decideRoomAccess({ ...base, requester: { userId: 'teacher-2', role: 'teacher' } });
    assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 403);
  });
  it('a parent cannot observe an adult learner', () => {
    const r = decideRoomAccess({ ...base, requester: parent, learners: adult, wantObserver: true });
    assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 403);
  });
  it('a parent observing a child learner is a guardian observer', () => {
    assert.deepStrictEqual(decideRoomAccess({ ...base, requester: parent, learners: child, wantObserver: true }), { ok: true, role: 'guardian_observer' });
  });
  it('a child-device session can never observe', () => {
    const r = decideRoomAccess({ ...base, requester: { userId: 'parent-1', role: 'student' }, learners: child, wantObserver: true });
    assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 403);
  });
  it('a parent without observe is the learner (child on the parent device)', () => {
    assert.deepStrictEqual(decideRoomAccess({ ...base, requester: parent, learners: child }), { ok: true, role: 'learner' });
  });
  it('a family that does not own the learner gets 404', () => {
    const r = decideRoomAccess({ ...base, requester: parent, learners: [{ id: 'other', isChild: true }] });
    assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 404);
  });
  it('a super admin with observe is an admin observer', () => {
    assert.deepStrictEqual(decideRoomAccess({ ...base, requester: { userId: 'admin-1', role: 'super_admin' }, wantObserver: true }), { ok: true, role: 'admin_observer' });
  });
  it('before the window is 423, also for the admin observer', () => {
    const early = Date.parse('2026-11-20T09:49:59Z');
    for (const input of [{ ...base, requester: teacher, now: early }, { ...base, requester: { userId: 'admin-1', role: 'super_admin' as const }, wantObserver: true, now: early }]) {
      const r = decideRoomAccess(input);
      assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 423);
    }
  });
  it('a cancelled or pending booking is 409', () => {
    for (const status of ['cancelled', 'pending', 'completed']) {
      const r = decideRoomAccess({ ...base, booking: { ...booking, status }, requester: teacher });
      assert.strictEqual(r.ok, false); assert.strictEqual((r as any).status, 409, status);
    }
  });
  it('a rescheduled booking is open', () => {
    assert.strictEqual(decideRoomAccess({ ...base, booking: { ...booking, status: 'rescheduled' }, requester: teacher }).ok, true);
  });
});

describe('CL-04 tickets', () => {
  const p = { bookingId: BOOKING_ID, role: 'teacher' as const, userId: 'teacher-1', exp: NOW + 60_000, joinId: 'j1' };
  it('a signed ticket verifies and carries its claims', () => {
    assert.deepStrictEqual(verifyTicket(signTicket(p, 's3cret'), 's3cret', NOW), p);
  });
  it('a tampered ticket, a wrong secret or an expired ticket fails', () => {
    const t = signTicket(p, 's3cret');
    const forged = Buffer.from(JSON.stringify({ ...p, role: 'admin_observer' })).toString('base64url') + '.' + t.split('.')[1];
    assert.strictEqual(verifyTicket(forged, 's3cret', NOW), null);
    assert.strictEqual(verifyTicket(t.slice(0, -2) + 'xx', 's3cret', NOW), null);
    assert.strictEqual(verifyTicket(t, 'other', NOW), null);
    assert.strictEqual(verifyTicket(t, 's3cret', p.exp), null);
    assert.strictEqual(verifyTicket('garbage', 's3cret', NOW), null);
  });
});

// ---- Route tests with an in-memory database and a fake Cloudflare client ----

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      let sortBy: { c: string; asc: boolean } | null = null;
      const match = () => {
        const m = rows(t).filter((r) => filters.every((f) => f(r)));
        // Equal timestamps (the clock is frozen): the row written later counts as the newer one.
        if (sortBy) { const { c, asc } = sortBy; m.reverse().sort((x, y) => (x[c] < y[c] ? -1 : x[c] > y[c] ? 1 : 0) * (asc ? 1 : -1)); }
        return m;
      };
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        order: (c: string, o?: { ascending?: boolean }) => { sortBy = { c, asc: o?.ascending !== false }; return b; },
        limit: () => b,
        maybeSingle: async () => ({ data: match()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push({ ...row }); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string; ignoreDuplicates?: boolean }) => {
          const i = rows(t).findIndex((r) => r[opts.onConflict] === row[opts.onConflict]);
          if (i < 0) rows(t).push({ ...row }); else if (!opts.ignoreDuplicates) rows(t)[i] = { ...row };
          return { error: null };
        },
        update: (p: any) => { patch = p; return b; },
        then: (ok: any, ko: any) => Promise.resolve().then(() => { for (const r of match()) Object.assign(r, patch); return { error: null }; }).then(ok, ko),
      };
      return b;
    },
  };
}

function fakeCloudflare() {
  let n = 0;
  const calls: Array<{ fn: string; args: any[] }> = [];
  const rec = (fn: string, result: (...a: any[]) => any) => async (...args: any[]) => { calls.push({ fn, args }); return result(...args); };
  return {
    calls,
    configured: true,
    newSession: rec('newSession', () => ({ sessionId: `sess-${++n}` })),
    tracksNew: rec('tracksNew', (_s: string, body: any) => {
      if (body.tracks?.[0]?.trackName === 'boom') throw new CloudflareRealtimeError(400, 'invalid_sdp', 'secret-bearing message /apps/APPID');
      return { tracks: (body.tracks || []).map((t: any) => ({ ...t, errorCode: t.trackName === 'gone' ? 'not_found' : undefined })) };
    }),
    renegotiate: rec('renegotiate', () => ({})),
    tracksUpdate: rec('tracksUpdate', () => ({})),
    tracksClose: rec('tracksClose', () => ({})),
    iceServers: rec('iceServers', () => [{ urls: 'turn:turn.example' }]),
  };
}

describe('CL-04 classroom routes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ bookings: [{ ...booking }] });
  const cf = fakeCloudflare();
  const SECRET = 'room-secret';

  // Fake auth: the test picks the signed-in user with headers.
  const teacherAuth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher' };
    next();
  };
  const studentAuth = (req: any, res: any, next: any) => {
    if (!req.headers['x-student']) return res.status(401).json({ error: 'auth' });
    req.studentUser = { auth_id: req.headers['x-student'], student_id: 'parent-profile' };
    next();
  };

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db,
      cloudflare: () => cf as any,
      verifyTeacherAuth: teacherAuth,
      verifyStudentAuth: studentAuth,
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child', isPrimary: false }],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const enter = (who: Record<string, string>, portal: 'dashboard' | 'student', observe = false) =>
    fetch(`${base}/api/${portal}/classroom/${BOOKING_ID}/enter${observe ? '?observe=1' : ''}`, { headers: who });
  const rtc = (ticket: string, path: string, body: unknown) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': ticket }, body: JSON.stringify(body) });
  const joins = () => db.tables.lesson_attendance_events?.filter((e) => e.event === 'room_joined') || [];

  it('enter needs sign-in', async () => {
    assert.strictEqual((await enter({}, 'dashboard')).status, 401);
    assert.strictEqual((await enter({}, 'student')).status, 401);
  });

  it('the teacher enters with a ticket bound to the lesson, role and user, that ends at the hard close', async () => {
    const res = await enter({ 'x-teacher': 'teacher-1' }, 'dashboard');
    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.role, 'teacher');
    assert.strictEqual(body.learnerName, 'Yusuf');
    assert.strictEqual(body.durationMinutes, 30);
    assert.deepStrictEqual(body.iceServers, [{ urls: 'turn:turn.example' }]);
    assert.match(body.roomKey, /^[0-9a-f]{40}$/);
    const t = verifyTicket(body.ticket, SECRET, NOW)!;
    assert.strictEqual(t.bookingId, BOOKING_ID); assert.strictEqual(t.role, 'teacher'); assert.strictEqual(t.userId, 'teacher-1');
    assert.ok(t.exp <= roomHardCloseMs(booking));
    assert.strictEqual(body.hardCloseAt, new Date(roomHardCloseMs(booking)).toISOString());
    assert.strictEqual(joins().filter((e) => e.role === 'teacher').length, 1);
  });

  it('another teacher is refused at the door', async () => {
    assert.strictEqual((await enter({ 'x-teacher': 'teacher-2' }, 'dashboard')).status, 403);
  });

  it('a ticket for another lesson or with no ticket cannot use the proxy', async () => {
    assert.strictEqual((await rtc('', 'rtc/session', {})).status, 401);
    const other = signTicket({ bookingId: '5049fa58-7428-44e4-926b-5e3eb315c5cb', role: 'teacher', userId: 'teacher-1', exp: NOW + 60_000, joinId: 'x' }, SECRET);
    assert.strictEqual((await rtc(other, 'rtc/session', {})).status, 403);
  });

  it('two devices: the newest learner join wins, and only the first counts as the join', async () => {
    const first: any = await (await enter({ 'x-student': 'parent-1' }, 'student')).json();
    assert.strictEqual(first.role, 'learner');
    const s1: any = await (await rtc(first.ticket, 'rtc/session', {})).json();
    const second: any = await (await enter({ 'x-student': 'parent-1' }, 'student')).json();
    const state = db.tables.lesson_room_state.find((r) => r.booking_id === BOOKING_ID).snapshot;
    assert.strictEqual(state.sessions.learner.joinId, verifyTicket(second.ticket, SECRET, NOW)!.joinId);
    assert.strictEqual(joins().filter((e) => e.role === 'student').length, 1);
    // The older device is superseded: its proxy calls are refused.
    assert.strictEqual((await rtc(first.ticket, 'rtc/tracks', { sessionId: s1.sessionId, tracks: [{ location: 'local', mid: '0', trackName: 'cam' }] })).status, 409);
    const s2: any = await (await rtc(second.ticket, 'rtc/session', {})).json();
    assert.notStrictEqual(s2.sessionId, s1.sessionId);
    assert.strictEqual(db.tables.lesson_room_state.find((r) => r.booking_id === BOOKING_ID).snapshot.sessions.learner.sessionId, s2.sessionId);
  });

  it('per-track Cloudflare errors reach the client, and provider errors never leak details', async () => {
    const t: any = await (await enter({ 'x-teacher': 'teacher-1' }, 'dashboard')).json();
    const s: any = await (await rtc(t.ticket, 'rtc/session', {})).json();
    const ok: any = await (await rtc(t.ticket, 'rtc/tracks', { sessionId: s.sessionId, tracks: [{ location: 'local', mid: '0', trackName: 'gone' }] })).json();
    assert.strictEqual(ok.tracks[0].errorCode, 'not_found');
    const bad = await rtc(t.ticket, 'rtc/tracks', { sessionId: s.sessionId, tracks: [{ location: 'local', mid: '0', trackName: 'boom' }] });
    assert.strictEqual(bad.status, 502);
    const text = await bad.text();
    assert.match(text, /invalid_sdp/);
    assert.doesNotMatch(text, /secret-bearing|APPID/);
    // A session id that is not this ticket's own session is refused.
    assert.strictEqual((await rtc(t.ticket, 'rtc/renegotiate', { sessionId: 'sess-999', sdp: 'v=0' })).status, 403);
  });

  it('a guardian observer may only pull: any local track is 403, a remote pull from this room is allowed', async () => {
    const o: any = await (await enter({ 'x-student': 'parent-1' }, 'student', true)).json();
    assert.strictEqual(o.role, 'guardian_observer');
    const s: any = await (await rtc(o.ticket, 'rtc/session', {})).json();
    const teacherSession = db.tables.lesson_room_state.find((r) => r.booking_id === BOOKING_ID).snapshot.sessions.teacher.sessionId;
    const push = await rtc(o.ticket, 'rtc/tracks', { sessionId: s.sessionId, tracks: [{ location: 'remote', sessionId: teacherSession, trackName: 'cam' }, { location: 'local', mid: '1', trackName: 'mic' }] });
    assert.strictEqual(push.status, 403);
    const pull = await rtc(o.ticket, 'rtc/tracks', { sessionId: s.sessionId, tracks: [{ location: 'remote', sessionId: teacherSession, trackName: 'cam' }] });
    assert.strictEqual(pull.status, 200);
    // A pull from a session outside this room is refused.
    assert.strictEqual((await rtc(o.ticket, 'rtc/tracks', { sessionId: s.sessionId, tracks: [{ location: 'remote', sessionId: 'sess-other-room', trackName: 'cam' }] })).status, 403);
    assert.strictEqual(joins().filter((e) => e.role === 'observer').length, 0);
  });

  it('the admin observer visit is logged, and leave closes it', async () => {
    const a: any = await (await enter({ 'x-teacher': 'admin-1' }, 'dashboard', true)).json();
    assert.strictEqual(a.role, 'admin_observer');
    const visits = db.tables.admin_observations;
    assert.strictEqual(visits.length, 1);
    assert.strictEqual(visits[0].admin_user_id, 'admin-1');
    assert.strictEqual((await rtc(a.ticket, 'leave', {})).status, 200);
    assert.ok(visits[0].ended_at);
  });

  it('leave writes room_left for a participant', async () => {
    const t: any = await (await enter({ 'x-teacher': 'teacher-1' }, 'dashboard')).json();
    assert.strictEqual((await rtc(t.ticket, 'leave', {})).status, 200);
    assert.ok(db.tables.lesson_attendance_events.some((e) => e.event === 'room_left' && e.role === 'teacher' && e.source === 'room'));
  });

  it('a booking cancelled while the room is open refuses new tickets and stops the proxy', async () => {
    const t: any = await (await enter({ 'x-teacher': 'teacher-1' }, 'dashboard')).json();
    db.tables.bookings[0].status = 'cancelled';
    try {
      assert.strictEqual((await enter({ 'x-teacher': 'teacher-1' }, 'dashboard')).status, 409);
      assert.strictEqual((await rtc(t.ticket, 'rtc/session', {})).status, 409);
    } finally { db.tables.bookings[0].status = 'confirmed'; }
  });
});

describe('CL-04 rejoin after leaving', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ bookings: [{ ...booking }] });

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db,
      cloudflare: () => fakeCloudflare() as any,
      verifyTeacherAuth: (req: any, _res: any, next: any) => { req.teacherUser = { id: 'teacher-1', role: 'teacher' }; next(); },
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'parent-1' }; next(); },
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      secret: () => 'room-secret',
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const enterAs = async (portal: 'dashboard' | 'student') => (await fetch(`${base}/api/${portal}/classroom/${BOOKING_ID}/enter`)).json() as Promise<any>;
  const events = (role: string, event: string) => (db.tables.lesson_attendance_events || []).filter((e) => e.role === role && e.event === event);

  it('the teacher enters, leaves and enters again: two room_joined and one room_left', async () => {
    const t = await enterAs('dashboard');
    const left = await fetch(`${base}/api/classroom/${BOOKING_ID}/leave`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t.ticket }, body: '{}' });
    assert.strictEqual(left.status, 200);
    await enterAs('dashboard');
    assert.strictEqual(events('teacher', 'room_joined').length, 2);
    assert.strictEqual(events('teacher', 'room_left').length, 1);
    // The first join keeps the fixed key lateness reads.
    assert.ok(events('teacher', 'room_joined').some((e) => e.dedupe_key === `room:${BOOKING_ID}:teacher:joined`));
  });

  it('the learner on two devices without leaving is still one room_joined', async () => {
    await enterAs('student');
    await enterAs('student');
    assert.strictEqual(events('student', 'room_joined').length, 1);
  });
});

describe('CL-04 review fixes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ bookings: [{ ...booking }] });
  const SECRET = 'room-secret';
  const roomKeys: string[] = [];

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db,
      cloudflare: () => fakeCloudflare() as any,
      verifyTeacherAuth: (req: any, _res: any, next: any) => { req.teacherUser = { id: 'teacher-1', role: 'teacher' }; next(); },
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'parent-1' }; next(); },
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
      // The shared per-IP limiter is spent; media calls must use the per-ticket limiter instead.
      rateLimit: (req: any, res: any, next: any) => (req.path.endsWith('/enter') ? next() : res.status(429).json({ error: 'slow' })),
      roomRateLimit: (req: any, _res: any, next: any) => { roomKeys.push(req.roomTicket?.joinId); next(); },
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const enterAs = async (portal: 'dashboard' | 'student') => (await fetch(`${base}/api/${portal}/classroom/${BOOKING_ID}/enter`)).json() as Promise<any>;
  const post = (ticket: string, path: string, body: unknown = {}) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': ticket }, body: JSON.stringify(body) });

  it('media calls are limited per room pass, not by the shared per-IP limiter', async () => {
    const t = await enterAs('dashboard');
    const res = await post(t.ticket, 'rtc/session');
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(roomKeys, [verifyTicket(t.ticket, SECRET, NOW)!.joinId]);
  });

  it('a learner pass stops working when the lesson moves to another learner', async () => {
    const t = await enterAs('student');
    db.tables.bookings[0].student_id = 'someone-else';
    try {
      const res = await post(t.ticket, 'rtc/session');
      assert.strictEqual(res.status, 403);
    } finally { db.tables.bookings[0].student_id = 'child-1'; }
  });
});
