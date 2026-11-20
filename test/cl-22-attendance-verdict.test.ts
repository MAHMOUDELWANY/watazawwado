import { describe, it } from 'node:test';
import assert from 'node:assert';
import { decideVerdict, runRoomVerdict, sweepRoomVerdicts } from '../server/classroom/verdict.js';
import { fakeDb } from './helpers/fakeDb.js';

const START = '2026-11-10T10:00:00.000Z';
const END = '2026-11-10T10:30:00.000Z';
const at = (min: number) => new Date(Date.parse(START) + min * 60_000).toISOString();
const ms = (min: number) => Date.parse(START) + min * 60_000;
const ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const lesson = { scheduled_start: START, scheduled_end: END, duration_minutes: 30 };
const ev = (event: string, role: string, min: number, source = 'room') => ({ booking_id: ID, source, event, role, occurred_at: at(min) });

describe('CL-22 decideVerdict (RULES.md what is paid, 15-minute rule)', () => {
  const decide = (events: any[], decidedMin = 45, fallback = false) => decideVerdict({ events, lesson, decidedAtMs: ms(decidedMin), fallback });

  it('together long enough: completed', () => {
    assert.strictEqual(decide([ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 2)]).verdict, 'completed');
  });
  it('teacher waited, learner never came: learner no-show', () => {
    const r = decide([ev('room_joined', 'teacher', -2)]);
    assert.deepStrictEqual([r.verdict, r.reason], ['learner_no_show', 'learner_never_joined']);
  });
  it('learner first in after 15 minutes and not held: learner no-show', () => {
    assert.strictEqual(decide([ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 18)]).verdict, 'learner_no_show');
  });
  it('learner came, teacher never joined: teacher no-show', () => {
    assert.strictEqual(decide([ev('room_joined', 'student', 0)]).verdict, 'teacher_no_show');
  });
  it('nobody came: teacher no-show (provisional, see cl-50); a short lesson, an early end, a late teacher: review', () => {
    assert.deepStrictEqual([decide([]).verdict, decide([]).reason], ['teacher_no_show', 'nobody_came']);
    assert.strictEqual(decide([ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 1), ev('room_left', 'student', 6)]).reason, 'short_together');
    assert.strictEqual(decide([ev('room_joined', 'teacher', 0)], 10).reason, 'ended_before_15');
    assert.strictEqual(decide([ev('room_joined', 'teacher', 20)]).reason, 'teacher_late_past_15');
  });
  it('a Zoom fallback is decided only when held', () => {
    assert.strictEqual(decide([ev('room_joined', 'teacher', 0)], 45, true).verdict, 'review');
    assert.strictEqual(decide([ev('joined', 'teacher', 0, 'zoom'), ev('joined', 'student', 1, 'zoom')], 45, true).verdict, 'completed');
  });
  it('a join before the window does not count', () => {
    assert.strictEqual(decide([ev('room_joined', 'student', -30)]).reason, 'nobody_came');
  });
});

const booking = (extra: any = {}) => ({ id: ID, student_id: 's1', teacher_id: 't1', status: 'confirmed', booking_type: 'single', package_entitlement_id: null, scheduled_start: START, scheduled_end: END, duration_minutes: 30, reference_code: 'WZ-1', contact_name: 'Yusuf', ...extra });
const outcomes = () => ({
  teacher_record_lesson_outcome: (a: any) => ({ success: true, outcome: a.p_outcome }),
  record_lesson_not_held: () => ({ success: true, creditId: 'c1' }),
});
const quiet = { notifyAdmins: async () => {}, notifyFamily: async () => {} };

describe('CL-22 runRoomVerdict', () => {
  it('applies a held lesson through the teacher outcome function, once', async () => {
    const after: any[] = [];
    const db = fakeDb({ bookings: [booking()], lesson_attendance_events: [ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 1)] }, { rpc: outcomes() });
    const deps = { ...quiet, now: () => ms(46), afterOutcome: (_c: any, _b: any, s: string, d: string) => { after.push([s, d]); } };
    const r = await runRoomVerdict(db, ID, 'sweep', deps);
    assert.deepStrictEqual(r, { decided: true, verdict: 'completed', reason: 'held', applied: true });
    assert.deepStrictEqual(db.calls.map((c) => [c.fn, c.args.p_outcome, c.args.p_teacher_id]), [['teacher_record_lesson_outcome', 'completed', 't1']]);
    assert.deepStrictEqual(after, [['completed', 'returned']]);
    assert.strictEqual(db.tables.lesson_attendance_verdicts[0].applied, true);
    const again = await runRoomVerdict(db, ID, 'end', deps);
    assert.deepStrictEqual(again, { decided: false, why: 'already' });
    assert.strictEqual(db.calls.length, 1);
  });

  it('a learner no-show uses the package credit (it is paid)', async () => {
    const db = fakeDb({ bookings: [booking()], lesson_attendance_events: [ev('room_joined', 'teacher', 0)] }, { rpc: outcomes() });
    await runRoomVerdict(db, ID, 'sweep', { ...quiet, now: () => ms(46) });
    assert.deepStrictEqual([db.calls[0].args.p_outcome, db.calls[0].args.p_no_show_credit_decision], ['no_show', 'used']);
  });

  it('a teacher no-show records "not held: teacher absent" and tells the family about the credit', async () => {
    const told: any[] = [];
    const db = fakeDb({ bookings: [booking()], lesson_attendance_events: [ev('room_joined', 'student', 0)], package_entitlements: [{ id: 'c1', purchaser_account_id: 'u1' }] }, { rpc: outcomes() });
    await runRoomVerdict(db, ID, 'sweep', { notifyAdmins: async () => {}, notifyFamily: (async (_c: any, who: any) => { told.push(who.userId); }) as any, now: () => ms(46) });
    assert.deepStrictEqual(db.calls.map((c) => [c.fn, c.args.p_reason]), [['record_lesson_not_held', 'teacher_absent']]);
    assert.deepStrictEqual(told, ['u1']);
  });

  it('review changes nothing on the booking and tells the admin', async () => {
    const admins: any[] = [];
    const db = fakeDb({ bookings: [booking()], lesson_attendance_events: [ev('room_joined', 'teacher', 0)], lesson_room_state: [{ booking_id: ID, ended_at: at(8) }] }, { rpc: outcomes() });
    const r = await runRoomVerdict(db, ID, 'end', { notifyFamily: async () => {}, notifyAdmins: async (_c, n) => { admins.push(n.kind); }, now: () => ms(8) });
    assert.deepStrictEqual(r, { decided: true, verdict: 'review', reason: 'ended_before_15', applied: false });
    assert.strictEqual(db.calls.length, 0);
    assert.deepStrictEqual(admins, ['attendance_review']);
  });

  it('skips: not over yet, already recorded, never a room lesson; a failed apply drops the claim', async () => {
    const evs = [ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 1)];
    const early = fakeDb({ bookings: [booking()], lesson_attendance_events: evs }, { rpc: outcomes() });
    assert.deepStrictEqual(await runRoomVerdict(early, ID, 'sweep', { ...quiet, now: () => ms(40) }), { decided: false, why: 'not_over' });
    const done = fakeDb({ bookings: [booking({ status: 'completed' })], lesson_attendance_events: evs }, { rpc: outcomes() });
    assert.deepStrictEqual(await runRoomVerdict(done, ID, 'sweep', { ...quiet, now: () => ms(46) }), { decided: false, why: 'status' });
    const zoomOnly = fakeDb({ bookings: [booking()], lesson_attendance_events: [ev('joined', 'teacher', 0, 'zoom')] }, { rpc: outcomes() });
    assert.deepStrictEqual(await runRoomVerdict(zoomOnly, ID, 'sweep', { ...quiet, now: () => ms(46), classroomEnabled: () => false }), { decided: false, why: 'not_room' });
    const broken = fakeDb({ bookings: [booking()], lesson_attendance_events: evs }, { rpc: { teacher_record_lesson_outcome: () => { throw new Error('locked'); } } });
    await assert.rejects(runRoomVerdict(broken, ID, 'sweep', { ...quiet, now: () => ms(46) }), /locked/);
    assert.strictEqual((broken.tables.lesson_attendance_verdicts || []).length, 0);
  });

  it('the sweep decides lessons past the hard close and leaves the open ones', async () => {
    const OTHER = '5049fa58-7428-44e4-926b-5e3eb315c5cb';
    const db = fakeDb({
      bookings: [booking(), booking({ id: OTHER, scheduled_start: at(30), scheduled_end: at(60) })],
      lesson_attendance_events: [ev('room_joined', 'teacher', 0), ev('room_joined', 'student', 1)],
    }, { rpc: outcomes() });
    const r = await sweepRoomVerdicts(db, { ...quiet, now: () => ms(50), classroomEnabled: () => true });
    assert.deepStrictEqual(r, { decided: 1, failed: 0 });
    assert.deepStrictEqual(db.tables.lesson_attendance_verdicts.map((v: any) => [v.booking_id, v.verdict, v.trigger]), [[ID, 'completed', 'sweep']]);
  });
});
