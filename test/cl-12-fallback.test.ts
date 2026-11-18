import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { recordIncident } from '../server/classroom/incidents.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { signTicket } from '../server/classroom/access.js';
import { studentJoinPath } from '../server/routes/attendance.js';
import { CloudflareRealtimeError } from '../server/integrations/cloudflareRealtime.js';
import { createFallbackDetector, CONNECT_TIMEOUT_MS, ICE_WINDOW_MS } from '../src/classroom/engine/fallbackDetector.js';

const START = Date.parse('2026-11-20T10:00:00Z');
const min = (m: number) => START + m * 60_000;
const BOOKING = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const HOST = 'https://us02web.zoom.us/s/123?zak=host';
const JOIN = 'https://us02web.zoom.us/j/123?pwd=x';
const lesson = (over: Record<string, unknown> = {}) => ({
  id: BOOKING, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed', scheduled_start: '2026-11-20T10:00:00Z',
  scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf', zoom_host_url: HOST, zoom_meeting_link: JOIN, ...over,
});

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let sortBy: { c: string; asc: boolean } | null = null;
      let max = Infinity;
      const run = () => {
        let m = rows(t).filter((r) => filters.every((f) => f(r)));
        if (sortBy) { const { c, asc } = sortBy; m = [...m].reverse().sort((x, y) => (x[c] < y[c] ? -1 : x[c] > y[c] ? 1 : 0) * (asc ? 1 : -1)); }
        return m.slice(0, max).map((r) => ({ ...r }));
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
        then: (res: any, rej: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(res, rej),
      };
      return b;
    },
  };
}
const admins = () => ({ teacher_accounts: [{ email: 'admin@x.test', role: 'super_admin', is_active: true }], profiles: [{ id: 'admin-profile', email: 'admin@x.test' }] });
const notices = (db: any) => (db.tables.user_notifications || []).filter((n: any) => n.kind === 'classroom_incident');

describe('CL-12 recordIncident', () => {
  it('inserts the row, tells the admins, and gives the teacher the host link and the learner the join path', async () => {
    const db = fakeDb({ bookings: [lesson()], ...admins() });
    const teacher = await recordIncident(db, { bookingId: BOOKING, kind: 'connect_timeout', side: 'teacher', detail: { ms: 20000 } }, min(1));
    assert.deepStrictEqual(teacher, { fallback: { url: HOST } });
    const learner = await recordIncident(db, { bookingId: BOOKING, kind: 'ice_failed', side: 'student', detail: {} }, min(1));
    assert.deepStrictEqual(learner, { fallback: { url: studentJoinPath(BOOKING, JOIN)! } });
    assert.strictEqual(db.tables.classroom_incidents.length, 2);
    assert.deepStrictEqual(db.tables.classroom_incidents.map((r: any) => [r.kind, r.side]), [['connect_timeout', 'teacher'], ['ice_failed', 'student']]);
    assert.strictEqual(db.tables.classroom_incidents[0].created_at, new Date(min(1)).toISOString());
    assert.strictEqual(notices(db).length, 2);
    assert.match(notices(db)[0].body_en, /connect_timeout/);
  });

  it('the same side failing again in the lesson is stored but not told twice', async () => {
    const db = fakeDb({ bookings: [lesson()], ...admins() });
    await recordIncident(db, { bookingId: BOOKING, kind: 'connect_timeout', side: 'teacher', detail: {} }, min(1));
    await recordIncident(db, { bookingId: BOOKING, kind: 'provider_error', side: 'teacher', detail: {} }, min(2));
    assert.strictEqual(db.tables.classroom_incidents.length, 2);
    assert.strictEqual(notices(db).length, 1);
  });

  it('no link outside the Zoom window (the room stays open 15 minutes longer than Zoom; learners get in 5 early, not 10)', async () => {
    const db = fakeDb({ bookings: [lesson()], ...admins() });
    assert.deepStrictEqual(await recordIncident(db, { bookingId: BOOKING, kind: 'engine_error', side: 'teacher', detail: {} }, min(35)), { fallback: null });
    assert.deepStrictEqual(await recordIncident(db, { bookingId: BOOKING, kind: 'engine_error', side: 'student', detail: {} }, min(-7)), { fallback: null });
    assert.deepStrictEqual(await recordIncident(db, { bookingId: BOOKING, kind: 'engine_error', side: 'teacher', detail: {} }, min(-7)), { fallback: { url: HOST } });
    assert.strictEqual(db.tables.classroom_incidents.length, 3);
  });

  it('the teacher falls back to the meeting link when there is no host link', async () => {
    const db = fakeDb({ bookings: [lesson({ zoom_host_url: null })], ...admins() });
    assert.deepStrictEqual(await recordIncident(db, { bookingId: BOOKING, kind: 'engine_error', side: 'teacher', detail: {} }, min(1)), { fallback: { url: JOIN } });
  });

  it('no Zoom meeting: no link, and the admins are told it is urgent', async () => {
    const db = fakeDb({ bookings: [lesson({ zoom_host_url: null, zoom_meeting_link: null })], ...admins() });
    assert.deepStrictEqual(await recordIncident(db, { bookingId: BOOKING, kind: 'connect_timeout', side: 'student', detail: {} }, min(1)), { fallback: null });
    assert.match(notices(db)[0].title_en, /urgent/i);
  });
});

function fakeCloudflare() {
  const state = { failIce: false, failTracks: false };
  return {
    state,
    configured: true,
    newSession: async () => ({ sessionId: 'sess-1' }),
    tracksNew: async () => { if (state.failTracks) throw new CloudflareRealtimeError(503, 'service_unavailable', 'down'); return { tracks: [] }; },
    renegotiate: async () => ({}), tracksUpdate: async () => ({}), tracksClose: async () => ({}),
    iceServers: async () => { if (state.failIce) throw new CloudflareRealtimeError(503, 'service_unavailable', 'down'); return [{ urls: 'turn:t' }]; },
  };
}

describe('CL-12 incident routes and lateness', () => {
  const SECRET = 'room-secret';
  let clock = min(1);
  const db = fakeDb({ bookings: [lesson()], ...admins() });
  const cf = fakeCloudflare();
  let server: http.Server;
  let base: string;
  const teacherAuth = (req: any, res: any, next: any) => { req.teacherUser = { id: req.headers['x-teacher'], role: 'teacher' }; next(); };
  const studentAuth = (req: any, res: any, next: any) => { req.studentUser = { auth_id: req.headers['x-student'] }; next(); };
  const ticket = (role: string, userId: string) => signTicket({ bookingId: BOOKING, role: role as any, userId, exp: min(45), joinId: 'j1', studentId: 'child-1' }, SECRET);
  const incident = (tk: string, body: unknown) => fetch(`${base}/api/classroom/${BOOKING}/incident`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': tk }, body: JSON.stringify(body) });
  const lateRows = () => db.tables.teacher_late_reasons || [];

  before(async () => {
    const app = express();
    app.use(express.json());
    const pass = (_q: any, _s: any, next: any) => next();
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true, cloudflare: () => cf as any, verifyTeacherAuth: teacherAuth, verifyStudentAuth: studentAuth,
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }], rateLimit: pass, roomRateLimit: pass,
      secret: () => SECRET, now: () => clock,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('needs a ticket; only the three client kinds are accepted', async () => {
    assert.strictEqual((await incident('nope', { kind: 'connect_timeout' })).status, 401);
    assert.strictEqual((await incident(ticket('teacher', 'teacher-1'), { kind: 'provider_error' })).status, 400);
    assert.strictEqual((await incident(ticket('teacher', 'teacher-1'), { kind: 'boom' })).status, 400);
  });

  it("an observer's incident never returns a link and stores nothing", async () => {
    for (const role of ['admin_observer', 'guardian_observer']) {
      const res = await incident(ticket(role, 'someone'), { kind: 'connect_timeout' });
      assert.strictEqual(res.status, 200);
      assert.deepStrictEqual(await res.json(), { fallback: null });
    }
    assert.strictEqual((db.tables.classroom_incidents || []).length, 0);
  });

  it('a pass for someone no longer on the lesson is refused', async () => {
    assert.strictEqual((await incident(ticket('teacher', 'teacher-2'), { kind: 'connect_timeout' })).status, 403);
  });

  it('Review Focus 5: the room fails before the teacher gets in, the teacher is late, and no reason is asked', async () => {
    // +3: the media service is down when the teacher presses enter: no join is stored, the incident is, Zoom is offered.
    clock = min(3);
    cf.state.failIce = true;
    const failed = await fetch(`${base}/api/dashboard/classroom/${BOOKING}/enter`, { headers: { 'x-teacher': 'teacher-1' } });
    assert.strictEqual(failed.status, 502);
    assert.deepStrictEqual((await failed.json()).fallback, { url: HOST });
    const inc = db.tables.classroom_incidents.find((r: any) => r.kind === 'provider_error');
    assert.strictEqual(inc.side, 'teacher');
    assert.strictEqual((db.tables.lesson_attendance_events || []).length, 0);
    // +6: the room works again and the teacher gets in, 6 minutes late.
    clock = min(6);
    cf.state.failIce = false;
    assert.strictEqual((await fetch(`${base}/api/dashboard/classroom/${BOOKING}/enter`, { headers: { 'x-teacher': 'teacher-1' } })).status, 200);
    assert.strictEqual(db.tables.lesson_attendance_events.length, 1);
    assert.strictEqual(lateRows().length, 0);
  });

  it('a learner incident through the route before the teacher joins also excuses lateness; without one the reason is asked', async () => {
    const other = '5049fa58-7428-44e4-926b-5e3eb315c5cc';
    const third = '6049fa58-7428-44e4-926b-5e3eb315c5cd';
    db.tables.bookings.push(lesson({ id: other }), lesson({ id: third }));
    clock = min(1);
    const entry: any = await (await fetch(`${base}/api/student/classroom/${other}/enter`, { headers: { 'x-student': 'parent-1' } })).json();
    const res = await fetch(`${base}/api/classroom/${other}/incident`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': entry.ticket }, body: JSON.stringify({ kind: 'ice_failed', detail: { failures: 2 } }) });
    assert.deepStrictEqual(await res.json(), { fallback: { url: studentJoinPath(other, JOIN)! } });
    clock = min(5);
    await fetch(`${base}/api/dashboard/classroom/${other}/enter`, { headers: { 'x-teacher': 'teacher-1' } });
    await fetch(`${base}/api/dashboard/classroom/${third}/enter`, { headers: { 'x-teacher': 'teacher-1' } });
    assert.deepStrictEqual(lateRows().map((r: any) => [r.booking_id, r.late_minutes]), [[third, 5]]);
  });

  it('a provider error on a media call records provider_error for the ticket side', async () => {
    clock = min(7);
    const entry: any = await (await fetch(`${base}/api/student/classroom/${BOOKING}/enter`, { headers: { 'x-student': 'parent-1' } })).json();
    const call = (path: string, body: unknown) => fetch(`${base}/api/classroom/${BOOKING}/rtc/${path}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': entry.ticket }, body: JSON.stringify(body) });
    const { sessionId } = await (await call('session', {})).json();
    cf.state.failTracks = true;
    assert.strictEqual((await call('tracks', { sessionId, tracks: [{ location: 'local', mid: '0', trackName: 'student-audio' }] })).status, 502);
    cf.state.failTracks = false;
    const rows = db.tables.classroom_incidents.filter((r: any) => r.booking_id === BOOKING && r.kind === 'provider_error');
    assert.deepStrictEqual(rows.map((r: any) => r.side), ['teacher', 'student']);
    assert.strictEqual(rows[1].detail.code, 'service_unavailable');
  });
});

describe('CL-12 client detector', () => {
  const setup = (side: 'teacher' | 'student' | null = 'teacher') => {
    let t = 0;
    const timers: Array<{ at: number; fn: () => void; id: number }> = [];
    const reports: Array<{ kind: string; detail: any }> = [];
    const history: number[] = [];
    const d = createFallbackDetector({
      side, report: (kind, detail) => reports.push({ kind, detail }), history, now: () => t,
      setTimer: (fn, ms) => { const id = timers.length + 1; timers.push({ at: t + ms, fn, id }); return id; },
      clearTimer: (id) => { const i = timers.findIndex((x) => x.id === id); if (i >= 0) timers.splice(i, 1); },
    });
    const advance = (ms: number) => { t += ms; for (const x of [...timers]) if (x.at <= t) { timers.splice(timers.indexOf(x), 1); x.fn(); } };
    return { d, reports, history, advance };
  };

  it(`no 'connected' within ${CONNECT_TIMEOUT_MS / 1000} s of join reports connect_timeout once`, () => {
    const { d, reports, advance } = setup();
    d.start();
    advance(CONNECT_TIMEOUT_MS - 1);
    assert.strictEqual(reports.length, 0);
    advance(1);
    assert.deepStrictEqual(reports.map((r) => r.kind), ['connect_timeout']);
    d.onError({ code: 'http_500', message: 'x' });
    assert.strictEqual(reports.length, 1);
  });

  it('connected in time reports nothing; superseded or a closed room stops the clock', () => {
    const a = setup(); a.d.start(); a.d.onState('connected'); a.advance(60_000);
    const b = setup(); b.d.start(); b.d.onState('superseded'); b.advance(60_000);
    assert.strictEqual(a.reports.length + b.reports.length, 0);
  });

  it(`ICE failing twice within ${ICE_WINDOW_MS / 60_000} minutes (across rejoins) reports ice_failed; once does not`, () => {
    const first = setup();
    first.d.start(); first.d.onState('connected'); first.d.onState('failed');
    first.d.onError({ code: 'connection_failed', message: 'lost' });
    assert.strictEqual(first.reports.length, 0);
    // A rejoin shares the history.
    const again = createFallbackDetector({ side: 'teacher', report: (k) => first.reports.push({ kind: k, detail: {} }), history: first.history, now: () => 90_000, setTimer: () => 0, clearTimer: () => {} });
    again.start(); again.onState('connected'); again.onState('failed');
    assert.deepStrictEqual(first.reports.map((r) => r.kind), ['ice_failed']);
    const late = setup(); late.history.push(-ICE_WINDOW_MS - 1); late.d.start(); late.d.onState('connected'); late.d.onState('failed');
    assert.strictEqual(late.reports.length, 0);
  });

  it("an engine error reports engine_error, but not superseded/ended/closed or the other side's missing track", () => {
    const { d, reports } = setup();
    d.start(); d.onState('connected');
    for (const code of ['superseded', 'ended', 'closed']) d.onError({ code, message: '' });
    d.onError({ code: 'not_found', message: '', trackName: 'student-video' });
    assert.strictEqual(reports.length, 0);
    d.onError({ code: 'service_unavailable', message: '' });
    assert.deepStrictEqual(reports, [{ kind: 'engine_error', detail: { code: 'service_unavailable' } }]);
  });

  it('observers never report', () => {
    const { d, reports, advance } = setup(null);
    d.start(); advance(CONNECT_TIMEOUT_MS); d.onError({ code: 'http_500', message: '' });
    assert.strictEqual(reports.length, 0);
  });
});
