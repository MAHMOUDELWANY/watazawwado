import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { analyzeAttendance, summarizeAttendance } from '../server/routes/attendance.js';
import { evaluateLateness, recordTeacherLateness } from '../server/classroom/lateness.js';
import { registerLateReasonRoutes } from '../server/routes/lateReasons.js';

const START = '2026-11-10T10:00:00.000Z';
const at = (min: number) => new Date(Date.parse(START) + min * 60_000).toISOString();
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const booking = { id: BOOKING_ID, teacher_id: 'teacher-1', scheduled_start: START, duration_minutes: 30, reference_code: 'WZ-1', contact_name: 'Yusuf' };

// In-memory query builder covering the calls the lateness code and routes make.
function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let op: 'select' | 'update' = 'select';
      let patch: any = null;
      let sortBy: { c: string; asc: boolean } | null = null;
      let max = Infinity;
      const run = () => {
        let out = rows(t).filter((r) => filters.every((f) => f(r)));
        if (op === 'update') { for (const r of out) Object.assign(r, patch); }
        if (sortBy) { const { c, asc } = sortBy; out = [...out].sort((a, b) => (a[c] < b[c] ? -1 : a[c] > b[c] ? 1 : 0) * (asc ? 1 : -1)); }
        return out.slice(0, max).map((r) => ({ ...r }));
      };
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        in: (c: string, v: any[]) => { filters.push((r) => v.includes(r[c])); return b; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return b; },
        lte: (c: string, v: any) => { filters.push((r) => r[c] <= v); return b; },
        order: (c: string, o?: { ascending?: boolean }) => { sortBy = { c, asc: o?.ascending !== false }; return b; },
        limit: (n: number) => { max = n; return b; },
        maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row]).map((r) => ({ ...r }))); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string; ignoreDuplicates?: boolean }) => {
          const i = rows(t).findIndex((r) => r[opts.onConflict] === row[opts.onConflict]);
          if (i < 0) rows(t).push({ ...row }); else if (!opts.ignoreDuplicates) rows(t)[i] = { ...row };
          return { error: null };
        },
        update: (p: any) => { op = 'update'; patch = p; return b; },
        then: (ok: any, ko: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(ok, ko),
      };
      return b;
    },
  };
}

describe('CL-10 attendance from the room', () => {
  const lesson = { scheduled_start: START, duration_minutes: 30 };
  const zoom = [
    { event: 'joined', role: 'teacher', occurred_at: at(0) },
    { event: 'joined', role: 'student', occurred_at: at(1) },
    { event: 'left', role: 'student', occurred_at: at(25) },
  ];
  const room = zoom.map((e) => ({ ...e, event: e.event === 'joined' ? 'room_joined' : 'room_left' }));

  it('room events produce held the same way Zoom events do', () => {
    const z = analyzeAttendance(zoom, lesson);
    const r = analyzeAttendance(room, lesson);
    assert.strictEqual(z.held, true);
    assert.deepStrictEqual({ ...r }, { ...z });
    assert.strictEqual(r.teacherFirstJoin, at(0));
  });

  it('a room join shows who came', () => {
    assert.deepStrictEqual(summarizeAttendance(room), { teacher: true, student: true });
  });

  it('Zoom events still count for a lesson that fell back to Zoom', () => {
    const mixed = [room[0], room[1], { event: 'room_left', role: 'student', occurred_at: at(5) }, { event: 'joined', role: 'student', occurred_at: at(6) }];
    assert.strictEqual(analyzeAttendance(mixed, lesson).togetherMinutes, 28);
  });
});

describe('CL-10 evaluateLateness', () => {
  it('3 minutes late with no incident is late; 1 minute is not; an incident before the join excuses it', () => {
    assert.deepStrictEqual(evaluateLateness({ booking, firstTeacherRoomJoin: at(3), incidentBeforeJoin: false }), { late: true, minutes: 3 });
    assert.deepStrictEqual(evaluateLateness({ booking, firstTeacherRoomJoin: at(1), incidentBeforeJoin: false }), { late: false });
    assert.deepStrictEqual(evaluateLateness({ booking, firstTeacherRoomJoin: at(5), incidentBeforeJoin: true }), { late: false });
    assert.deepStrictEqual(evaluateLateness({ booking, firstTeacherRoomJoin: null, incidentBeforeJoin: false }), { late: false });
  });
});

describe('CL-10 recordTeacherLateness (first room_joined)', () => {
  const join = (min: number) => ({ booking_id: BOOKING_ID, source: 'room', event: 'room_joined', role: 'teacher', occurred_at: at(min), dedupe_key: `room:${BOOKING_ID}:teacher:joined` });

  it('a teacher joining at +3 min with no incident gets a pending row with late_minutes = 3', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(3)] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual(db.tables.teacher_late_reasons.length, 1);
    const row = db.tables.teacher_late_reasons[0];
    assert.strictEqual(row.status, 'pending');
    assert.strictEqual(row.late_minutes, 3);
    assert.strictEqual(row.teacher_user_id, 'teacher-1');
    assert.strictEqual(row.reason ?? null, null);
  });

  it('at +1 min there is no row', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(1)] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual((db.tables.teacher_late_reasons || []).length, 0);
  });

  it('+5 min after an incident on our side: no row', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(5)], classroom_incidents: [{ booking_id: BOOKING_ID, kind: 'connect_timeout', side: 'teacher', created_at: at(1) }] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual((db.tables.teacher_late_reasons || []).length, 0);
  });

  it('an incident after the join does not excuse it', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(5)], classroom_incidents: [{ booking_id: BOOKING_ID, kind: 'ice_failed', side: 'teacher', created_at: at(6) }] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual(db.tables.teacher_late_reasons.length, 1);
  });

  it('a student-side ice_failed before the late join is not ours: the reason is still asked', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(5)], classroom_incidents: [{ booking_id: BOOKING_ID, kind: 'ice_failed', side: 'student', created_at: at(1) }] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual(db.tables.teacher_late_reasons.length, 1);
    assert.strictEqual(db.tables.teacher_late_reasons[0].status, 'pending');
  });

  it('a student-side provider_error before the late join is ours: no row', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(5)], classroom_incidents: [{ booking_id: BOOKING_ID, kind: 'provider_error', side: 'student', created_at: at(1) }] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual((db.tables.teacher_late_reasons || []).length, 0);
  });

  it('a rejoin at +20 min after an on-time join: no row (the first join is what counts)', async () => {
    // The rejoin at +20 finds the first (deduped) room_joined from +0.
    const db = fakeDb({ lesson_attendance_events: [join(0)] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual((db.tables.teacher_late_reasons || []).length, 0);
  });

  it('a rejoin never replaces a reviewed row', async () => {
    const db = fakeDb({ lesson_attendance_events: [join(4)], teacher_late_reasons: [{ booking_id: BOOKING_ID, teacher_user_id: 'teacher-1', late_minutes: 4, status: 'excused' }] });
    await recordTeacherLateness(db, booking);
    assert.strictEqual(db.tables.teacher_late_reasons.length, 1);
    assert.strictEqual(db.tables.teacher_late_reasons[0].status, 'excused');
  });
});

describe('CL-10 late reason routes', () => {
  let server: http.Server;
  let base: string;
  const notices: any[] = [];
  const db = fakeDb({
    bookings: [{ ...booking }, { ...booking, id: 'b-2', teacher_id: 'teacher-2', reference_code: 'WZ-2' }],
    teacher_late_reasons: [
      { booking_id: BOOKING_ID, teacher_user_id: 'teacher-1', late_minutes: 3, status: 'pending', reason: null, created_at: at(3) },
      { booking_id: 'b-2', teacher_user_id: 'teacher-2', late_minutes: 7, status: 'pending', reason: null, created_at: at(7) },
    ],
  });
  const auth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher' };
    next();
  };
  const superOnly = (req: any, res: any, next: any) => (req.teacherUser.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' }));

  before(async () => {
    const app = express();
    app.use(express.json());
    registerLateReasonRoutes(app, {
      getClient: () => db, classroomEnabled: () => true,
      verifyTeacherAuth: auth,
      requireSuperAdmin: superOnly,
      rateLimit: (_q: any, _s: any, n: any) => n(),
      listStaff: async () => [{ id: 'teacher-1', name: 'T One', email: 't1@x', role: 'teacher' }],
      notifyAdmins: async (_c: any, n: any) => { notices.push(n); },
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const call = (method: string, path: string, who: string, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', 'x-teacher': who }, body: body ? JSON.stringify(body) : undefined });

  it('the teacher sees only their own pending rows', async () => {
    const res = await call('GET', '/api/dashboard/late-reasons/pending', 'teacher-1');
    const body: any = await res.json();
    assert.strictEqual(body.pending.length, 1);
    assert.strictEqual(body.pending[0].bookingId, BOOKING_ID);
    assert.strictEqual(body.pending[0].lateMinutes, 3);
  });

  it('a reason under 10 characters is 400', async () => {
    assert.strictEqual((await call('POST', `/api/dashboard/late-reasons/${BOOKING_ID}`, 'teacher-1', { reason: 'traffic  ' })).status, 400);
    assert.strictEqual((await call('POST', `/api/dashboard/late-reasons/${BOOKING_ID}`, 'teacher-1', { reason: 'x'.repeat(2001) })).status, 400);
  });

  it('another teacher cannot answer for this lesson', async () => {
    assert.strictEqual((await call('POST', `/api/dashboard/late-reasons/${BOOKING_ID}`, 'teacher-2', { reason: 'Power cut at home today' })).status, 404);
  });

  it('the teacher sends a reason: status sent, admins told, no longer pending', async () => {
    const res = await call('POST', `/api/dashboard/late-reasons/${BOOKING_ID}`, 'teacher-1', { reason: '  Power cut at home today  ' });
    assert.strictEqual(res.status, 200);
    const row = db.tables.teacher_late_reasons.find((r) => r.booking_id === BOOKING_ID);
    assert.strictEqual(row.status, 'sent');
    assert.strictEqual(row.reason, 'Power cut at home today');
    assert.strictEqual(notices.length, 1);
    assert.strictEqual(notices[0].kind, 'late_reason');
    assert.strictEqual((await call('POST', `/api/dashboard/late-reasons/${BOOKING_ID}`, 'teacher-1', { reason: 'Power cut at home today' })).status, 409);
    const pending: any = await (await call('GET', '/api/dashboard/late-reasons/pending', 'teacher-1')).json();
    assert.strictEqual(pending.pending.length, 0);
  });

  it('admin routes are super admin only', async () => {
    assert.strictEqual((await call('GET', '/api/admin/late-reasons', 'teacher-1')).status, 403);
    assert.strictEqual((await call('POST', `/api/admin/late-reasons/${BOOKING_ID}`, 'teacher-1', { action: 'excuse', note: 'ok' })).status, 403);
  });

  it('the admin list shows the lesson, minutes late and the reason', async () => {
    const body: any = await (await call('GET', '/api/admin/late-reasons', 'admin-1')).json();
    const item = body.items.find((i: any) => i.bookingId === BOOKING_ID);
    assert.strictEqual(item.lateMinutes, 3);
    assert.strictEqual(item.reason, 'Power cut at home today');
    assert.strictEqual(item.teacherName, 'T One');
    assert.strictEqual(item.lesson.referenceCode, 'WZ-1');
  });

  it('Deduct needs an amount and writes a teacher_pay_adjustments row with the note, in the lesson month', async () => {
    assert.strictEqual((await call('POST', `/api/admin/late-reasons/${BOOKING_ID}`, 'admin-1', { action: 'deduct', note: 'Second time this month' })).status, 400);
    assert.strictEqual((await call('POST', `/api/admin/late-reasons/${BOOKING_ID}`, 'admin-1', { action: 'nope', note: 'x' })).status, 400);
    const res = await call('POST', `/api/admin/late-reasons/${BOOKING_ID}`, 'admin-1', { action: 'deduct', amountCents: 250, note: 'Second time this month' });
    assert.strictEqual(res.status, 200);
    const adj = db.tables.teacher_pay_adjustments;
    assert.strictEqual(adj.length, 1);
    assert.strictEqual(adj[0].teacher_user_id, 'teacher-1');
    assert.strictEqual(adj[0].amount, -2.5);
    assert.strictEqual(adj[0].month, '2026-11-01');
    assert.strictEqual(adj[0].created_by, 'admin-1');
    assert.match(adj[0].reason, /Second time this month/);
    const row = db.tables.teacher_late_reasons.find((r) => r.booking_id === BOOKING_ID);
    assert.strictEqual(row.status, 'deducted');
    assert.strictEqual(row.admin_note, 'Second time this month');
    assert.strictEqual(row.reviewed_by, 'admin-1');
    // Reviewed once only: no second deduction.
    assert.strictEqual((await call('POST', `/api/admin/late-reasons/${BOOKING_ID}`, 'admin-1', { action: 'deduct', amountCents: 250, note: 'again' })).status, 409);
    assert.strictEqual(db.tables.teacher_pay_adjustments.length, 1);
  });

  it('Deduct into a month already paid is refused', async () => {
    db.tables.teacher_payouts = [{ teacher_user_id: 'teacher-2', month: '2026-11-01' }];
    assert.strictEqual((await call('POST', '/api/admin/late-reasons/b-2', 'admin-1', { action: 'deduct', amountCents: 100, note: 'late again' })).status, 409);
    assert.strictEqual(db.tables.teacher_late_reasons.find((r) => r.booking_id === 'b-2').status, 'pending');
  });

  it('Excuse marks the row excused with the note and no money', async () => {
    const res = await call('POST', '/api/admin/late-reasons/b-2', 'admin-1', { action: 'excuse', note: 'Known road closure' });
    assert.strictEqual(res.status, 200);
    const row = db.tables.teacher_late_reasons.find((r) => r.booking_id === 'b-2');
    assert.strictEqual(row.status, 'excused');
    assert.strictEqual(row.admin_note, 'Known road closure');
    assert.strictEqual(db.tables.teacher_pay_adjustments.length, 1);
  });
});
