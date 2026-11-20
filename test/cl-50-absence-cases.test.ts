import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import express from 'express';
import { runRoomVerdict } from '../server/classroom/verdict.js';
import { absenceCaseOpen, finalizeAbsence, sweepAbsenceCases, APPEAL_HOURS } from '../server/classroom/absence.js';
import { registerAbsenceRoutes } from '../server/routes/absence.js';
import { fakeDb } from './helpers/fakeDb.js';

const START = '2026-11-10T10:00:00.000Z';
const END = '2026-11-10T10:30:00.000Z';
const ms = (min: number) => Date.parse(START) + min * 60_000;
const ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const booking = (extra: any = {}) => ({ id: ID, student_id: 's1', teacher_id: 't1', status: 'confirmed', booking_type: 'single', package_entitlement_id: null, scheduled_start: START, scheduled_end: END, duration_minutes: 30, reference_code: 'WZ-1', contact_name: 'Yusuf', ...extra });
const rpcs = () => ({
  teacher_record_lesson_outcome: (a: any) => ({ success: true, outcome: a.p_outcome }),
  record_lesson_not_held: () => ({ success: true, creditId: null }),
});
const openCase = (extra: any = {}) => ({ booking_id: ID, teacher_user_id: 't1', status: 'open', deadline_at: new Date(ms(45) + APPEAL_HOURS * 3_600_000).toISOString(), created_at: new Date(ms(45)).toISOString(), ...extra });

describe('CL-50 nobody came: a provisional teacher absence', () => {
  it('opens a case, changes nothing on the booking yet, and tells the teacher', async () => {
    const told: any[] = [];
    const db = fakeDb({ bookings: [booking()], lesson_attendance_events: [] }, { rpc: rpcs() });
    const r = await runRoomVerdict(db, ID, 'sweep', { classroomEnabled: () => true, now: () => ms(46), notifyAdmins: async () => {}, notifyFamily: (async (_c: any, who: any, n: any) => { told.push([who.userId, n.kind]); }) as any });
    assert.deepStrictEqual(r, { decided: true, verdict: 'teacher_no_show', reason: 'nobody_came', applied: false });
    assert.strictEqual(db.calls.length, 0, 'no status function runs while the case is open');
    assert.strictEqual(db.tables.lesson_absence_cases[0].status, 'open');
    assert.strictEqual(Date.parse(db.tables.lesson_absence_cases[0].deadline_at), ms(46) + 48 * 3_600_000);
    assert.deepStrictEqual(told, [['t1', 'lesson_absence']]);
    assert.strictEqual(db.tables.lesson_attendance_verdicts[0].applied, false);
    assert.strictEqual(await absenceCaseOpen(db, ID), true);
  });

  it('the sweep makes an unanswered case final as teacher absent, through record_lesson_not_held', async () => {
    const db = fakeDb({ bookings: [booking()], lesson_absence_cases: [openCase()], lesson_attendance_verdicts: [{ booking_id: ID, applied: false }] }, { rpc: rpcs() });
    assert.deepStrictEqual(await sweepAbsenceCases(db, { now: () => ms(45) + 47 * 3_600_000 }), { finalized: 0, failed: 0 }, 'not before 48 h');
    assert.deepStrictEqual(await sweepAbsenceCases(db, { now: () => ms(45) + 49 * 3_600_000 }), { finalized: 1, failed: 0 });
    assert.deepStrictEqual(db.calls.map((c) => [c.fn, c.args.p_reason]), [['record_lesson_not_held', 'teacher_absent']]);
    const c = db.tables.lesson_absence_cases[0];
    assert.deepStrictEqual([c.status, c.resolution, c.outcome, Boolean(c.applied_at)], ['final', 'expired', 'teacher_absent', true]);
    assert.strictEqual(db.tables.lesson_attendance_verdicts[0].applied, true);
    assert.strictEqual(await absenceCaseOpen(db, ID), false);
  });

  it('an appealed case is left to the admin by the sweep', async () => {
    const db = fakeDb({ bookings: [booking()], lesson_absence_cases: [openCase({ status: 'appealed' })] }, { rpc: rpcs() });
    assert.deepStrictEqual(await sweepAbsenceCases(db, { now: () => ms(45) + 72 * 3_600_000 }), { finalized: 0, failed: 0 });
    assert.strictEqual(db.calls.length, 0);
  });

  it('a failed status function puts the case back so it can be tried again', async () => {
    const db = fakeDb({ bookings: [booking()], lesson_absence_cases: [openCase()] }, { rpc: { record_lesson_not_held: () => { throw new Error('boom'); } } });
    await assert.rejects(finalizeAbsence(db, ID, 'open', 'teacher_absent', 'confirmed'));
    assert.deepStrictEqual([db.tables.lesson_absence_cases[0].status, db.tables.lesson_absence_cases[0].resolution], ['open', null]);
  });

  it('a lesson recorded another way meanwhile is closed without applying anything', async () => {
    const db = fakeDb({ bookings: [booking({ status: 'cancelled' })], lesson_absence_cases: [openCase()] }, { rpc: rpcs() });
    assert.strictEqual(await finalizeAbsence(db, ID, 'open', 'teacher_absent', 'confirmed'), true);
    assert.strictEqual(db.calls.length, 0);
    assert.strictEqual(db.tables.lesson_absence_cases[0].status, 'final');
  });

  it('the teacher outcome buttons and "not held" refuse while a case is open', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.match(api, /if \(status === 'completed' \|\| status === 'no_show'\) \{\s*\/\/[^\n]*\n\s*if \(await absenceCaseOpen\(supabase, id\)\)/);
    assert.match(fs.readFileSync('server/routes/payroll.ts', 'utf8'), /absenceCaseOpen\(client, booking\.id\)[\s\S]{0,300}record_lesson_not_held/);
    assert.match(api, /sweepAbsenceCases\(cronClient/);
  });

  it('the migration is service-role only and never drops a column or policy', () => {
    const sql = fs.readFileSync('supabase/migrations/20261122000000_classroom_absence_and_ratings.sql', 'utf8');
    for (const t of ['lesson_absence_cases', 'teacher_ratings', 'platform_ratings']) {
      assert.match(sql, new RegExp(`ALTER TABLE public\\.${t} ENABLE ROW LEVEL SECURITY`));
      assert.match(sql, new RegExp(`REVOKE ALL ON TABLE public\\.${t} FROM anon, authenticated`));
      assert.match(sql, new RegExp(`GRANT ALL ON TABLE public\\.${t} TO service_role`));
    }
    assert.doesNotMatch(sql, /DROP\s+(COLUMN|POLICY)/i);
  });
});

describe('CL-50 missed-lesson routes', () => {
  let server: http.Server;
  let base: string;
  let clock = ms(60);
  const notices: any[] = [];
  const after_: any[] = [];
  const told: any[] = [];
  const db = fakeDb({
    bookings: [booking(), booking({ id: 'b-2', teacher_id: 't2', reference_code: 'WZ-2' }), booking({ id: 'b-3', reference_code: 'WZ-3' })],
    lesson_absence_cases: [openCase(), openCase({ booking_id: 'b-2', teacher_user_id: 't2' }), openCase({ booking_id: 'b-3' })],
  }, { rpc: rpcs() });
  const auth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher', display_name: id };
    next();
  };
  const superOnly = (req: any, res: any, next: any) => (req.teacherUser.role === 'super_admin' ? next() : res.status(403).json({ error: 'no' }));

  before(async () => {
    const app = express();
    app.use(express.json());
    registerAbsenceRoutes(app, {
      getClient: () => db, verifyTeacherAuth: auth, requireSuperAdmin: superOnly, rateLimit: (_q: any, _s: any, n: any) => n(),
      listStaff: async () => [{ id: 't1', name: 'T One', email: 't1@x', role: 'teacher' }] as any,
      notifyAdmins: async (_c: any, n: any) => { notices.push(n); }, notifyFamily: (async (_c: any, who: any, n: any, o: any) => { told.push({ who, n, o }); }) as any, now: () => clock,
      afterOutcome: (_c: any, _b: any, s: string, d: string) => { after_.push([s, d]); },
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const call = (method: string, path: string, who: string, body?: unknown) =>
    fetch(`${base}${path}`, { method, headers: { 'content-type': 'application/json', 'x-teacher': who }, body: body ? JSON.stringify(body) : undefined });

  it('the teacher sees only their own open cases', async () => {
    const body: any = await (await call('GET', '/api/dashboard/absence-cases/pending', 't1')).json();
    assert.deepStrictEqual(body.pending.map((p: any) => p.bookingId).sort(), [ID, 'b-3'].sort());
    assert.strictEqual(body.pending[0].lesson.referenceCode.startsWith('WZ-'), true);
  });

  it('an appeal needs 10+ characters, and only on the teacher\'s own lesson', async () => {
    assert.strictEqual((await call('POST', `/api/dashboard/absence-cases/${ID}/appeal`, 't1', { reason: 'short' })).status, 400);
    assert.strictEqual((await call('POST', `/api/dashboard/absence-cases/b-2/appeal`, 't1', { reason: 'I was there the whole time' })).status, 404);
  });

  it('an appeal goes to the admin and closes the card; a second answer is refused', async () => {
    const res = await call('POST', `/api/dashboard/absence-cases/${ID}/appeal`, 't1', { reason: '  I was in the room, the learner had no link  ' });
    assert.strictEqual(res.status, 200);
    const c = db.tables.lesson_absence_cases.find((x: any) => x.booking_id === ID);
    assert.deepStrictEqual([c.status, c.appeal_reason], ['appealed', 'I was in the room, the learner had no link']);
    assert.deepStrictEqual(notices.map((n) => n.kind), ['absence_appeal']);
    assert.strictEqual((await call('POST', `/api/dashboard/absence-cases/${ID}/confirm`, 't1')).status, 409);
    assert.strictEqual(db.calls.length, 0);
  });

  it('confirm records teacher absent at once', async () => {
    assert.strictEqual((await call('POST', `/api/dashboard/absence-cases/b-3/confirm`, 't1')).status, 200);
    assert.deepStrictEqual(db.calls.map((x) => [x.fn, x.args.p_booking_id, x.args.p_reason]), [['record_lesson_not_held', 'b-3', 'teacher_absent']]);
    assert.strictEqual(db.tables.lesson_absence_cases.find((x: any) => x.booking_id === 'b-3').resolution, 'confirmed');
  });

  it('after 48 hours the teacher can no longer answer', async () => {
    clock = ms(45) + 49 * 3_600_000;
    assert.strictEqual((await call('POST', `/api/dashboard/absence-cases/b-2/confirm`, 't2')).status, 409);
    clock = ms(60);
  });

  it('only the super admin decides; accepting needs a real outcome', async () => {
    assert.strictEqual((await call('GET', '/api/admin/absence-cases', 't1')).status, 403);
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/${ID}`, 't1', { action: 'reject' })).status, 403);
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/${ID}`, 'admin-1', { action: 'accept', outcome: 'teacher_absent' })).status, 400);
    const list: any = await (await call('GET', '/api/admin/absence-cases', 'admin-1')).json();
    const it = list.items.find((i: any) => i.bookingId === ID);
    assert.deepStrictEqual([it.status, it.teacherName, it.appealReason], ['appealed', 'T One', 'I was in the room, the learner had no link']);
  });

  it('accept as learner no-show: the teacher outcome function, package lesson used', async () => {
    const before = db.calls.length;
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/${ID}`, 'admin-1', { action: 'accept', outcome: 'learner_no_show', note: 'Room log shows the teacher' })).status, 200);
    const c = db.calls[before];
    assert.deepStrictEqual([c.fn, c.args.p_outcome, c.args.p_no_show_credit_decision, c.args.p_teacher_id], ['teacher_record_lesson_outcome', 'no_show', 'used', 't1']);
    assert.deepStrictEqual(after_, [['no_show', 'used']]);
    const row = db.tables.lesson_absence_cases.find((x: any) => x.booking_id === ID);
    assert.deepStrictEqual([row.status, row.resolution, row.outcome, row.decided_by], ['final', 'appeal_accepted', 'learner_no_show', 'admin-1']);
    const last = told[told.length - 1];
    assert.deepStrictEqual([last.who.userId, last.who.email, last.who.staff, last.o.email, last.n.kind], ['t1', 't1@x', true, true, 'absence_appeal_decided']);
    assert.strictEqual(last.n.title.en, 'Your appeal was accepted');
    assert.match(last.n.body.en, /learner no-show: the lesson is paid\. Note: Room log shows the teacher/);
    assert.match(last.n.body.ar, /اعتراضك على حصة Yusuf \(WZ-1\) اتقبل\. اتسجلت غياب طالب/);
    const count = told.length;
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/${ID}`, 'admin-1', { action: 'reject' })).status, 409, 'decided once');
    assert.strictEqual(told.length, count, 'no notice for a refused decision');
  });

  it('reject keeps teacher absent; no fault is "not held: technical"', async () => {
    db.tables.lesson_absence_cases.push(openCase({ booking_id: 'b-4', status: 'appealed' }), openCase({ booking_id: 'b-5', status: 'appealed' }));
    db.tables.bookings.push(booking({ id: 'b-4' }), booking({ id: 'b-5' }));
    const before = db.calls.length;
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/b-4`, 'admin-1', { action: 'reject' })).status, 200);
    assert.strictEqual((await call('POST', `/api/admin/absence-cases/b-5`, 'admin-1', { action: 'accept', outcome: 'no_fault' })).status, 200);
    assert.deepStrictEqual(db.calls.slice(before).map((x) => [x.fn, x.args.p_booking_id, x.args.p_reason]), [['record_lesson_not_held', 'b-4', 'teacher_absent'], ['record_lesson_not_held', 'b-5', 'technical']]);
    const [rejected, noFault] = told.slice(-2).map((t) => t.n);
    assert.deepStrictEqual([rejected.title.en, rejected.title.ar], ['Your appeal was not accepted', 'اعتراضك ما اتقبلش']);
    assert.match(rejected.body.en, /stays recorded as teacher absent/);
    assert.match(noFault.body.en, /nobody's fault/);
  });
});
