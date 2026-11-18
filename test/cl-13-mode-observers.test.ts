import { describe, it, before, after, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { classroomEnabledFor } from '../server/classroom/mode.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { canWatchLesson } from '../src/student/components/WatchLessonButton.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');
const NOW = Date.parse('2026-11-20T09:55:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const booking = {
  id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed',
  scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf',
};

describe('CL-13 classroomEnabledFor', () => {
  it('a missing or unknown mode is off', () => {
    assert.strictEqual(classroomEnabledFor('teacher-1', {}), false);
    assert.strictEqual(classroomEnabledFor('teacher-1', { CLASSROOM_MODE: 'off' }), false);
    assert.strictEqual(classroomEnabledFor('teacher-1', { CLASSROOM_MODE: 'yes' }), false);
  });
  it('on is every teacher', () => {
    assert.strictEqual(classroomEnabledFor('teacher-1', { CLASSROOM_MODE: 'on' }), true);
    assert.strictEqual(classroomEnabledFor('anyone', { CLASSROOM_MODE: ' ON ' }), true);
  });
  it('pilot is only the listed teachers', () => {
    const env = { CLASSROOM_MODE: 'pilot', CLASSROOM_PILOT_TEACHERS: 'teacher-9, teacher-1 ,' };
    assert.strictEqual(classroomEnabledFor('teacher-1', env), true);
    assert.strictEqual(classroomEnabledFor('teacher-2', env), false);
    assert.strictEqual(classroomEnabledFor(null, env), false);
    assert.strictEqual(classroomEnabledFor('', { CLASSROOM_MODE: 'pilot', CLASSROOM_PILOT_TEACHERS: '' }), false);
    assert.strictEqual(classroomEnabledFor('teacher-1', { CLASSROOM_MODE: 'pilot' }), false);
  });
});

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      const match = () => rows(t).filter((r) => filters.every((f) => f(r)));
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        order: () => b,
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

describe('CL-13 enter follows the rollout switch, and the admin keeps private notes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ bookings: [{ ...booking }] });
  const saved = { mode: process.env.CLASSROOM_MODE, pilot: process.env.CLASSROOM_PILOT_TEACHERS };

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db,
      cloudflare: () => ({ configured: true, iceServers: async () => [], newSession: async () => ({ sessionId: 's' }) }) as any,
      verifyTeacherAuth: (req: any, res: any, next: any) => {
        const id = req.headers['x-teacher'];
        if (!id) return res.status(401).json({ error: 'auth' });
        req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher' };
        next();
      },
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: 'parent-1' }; next(); },
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      requireSuperAdmin: (_q: any, _s: any, next: any) => next(),
      secret: () => 'room-secret',
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => {
    process.env.CLASSROOM_MODE = saved.mode; process.env.CLASSROOM_PILOT_TEACHERS = saved.pilot;
    if (saved.mode === undefined) delete process.env.CLASSROOM_MODE;
    if (saved.pilot === undefined) delete process.env.CLASSROOM_PILOT_TEACHERS;
    await new Promise<void>((r) => server.close(() => r()));
  });
  beforeEach(() => { delete process.env.CLASSROOM_MODE; delete process.env.CLASSROOM_PILOT_TEACHERS; });

  const enter = (portal: 'dashboard' | 'student', who: string, observe = false) =>
    fetch(`${base}/api/${portal}/classroom/${BOOKING_ID}/enter${observe ? '?observe=1' : ''}`, { headers: { 'x-teacher': who } });
  const observation = (ticket: string, body: unknown) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/observation`, { method: 'PATCH', headers: { 'content-type': 'application/json', 'x-room-ticket': ticket }, body: JSON.stringify(body) });

  it('off: teacher, learner and both observers get 409 classroom:false, and nothing is written', async () => {
    for (const [portal, who, observe] of [['dashboard', 'teacher-1', false], ['student', '', false], ['student', '', true], ['dashboard', 'admin-1', true]] as const) {
      const res = await enter(portal, who, observe);
      assert.strictEqual(res.status, 409, `${portal} ${who} ${observe}`);
      assert.deepStrictEqual(await res.json(), { classroom: false });
    }
    assert.strictEqual((db.tables.admin_observations || []).length, 0);
    assert.strictEqual((db.tables.lesson_attendance_events || []).length, 0);
  });

  it('off: a stranger gets the same refusal as when it is on, never classroom:false', async () => {
    const res = await enter('dashboard', 'teacher-2');
    assert.ok(res.status === 403 || res.status === 404, String(res.status));
    assert.strictEqual((await res.json()).classroom, undefined);
  });

  it('pilot without this teacher is off; with this teacher the room opens and says classroom: true', async () => {
    process.env.CLASSROOM_MODE = 'pilot';
    process.env.CLASSROOM_PILOT_TEACHERS = 'teacher-7';
    assert.strictEqual((await enter('dashboard', 'teacher-1')).status, 409);
    process.env.CLASSROOM_PILOT_TEACHERS = 'teacher-7,teacher-1';
    const res = await enter('dashboard', 'teacher-1');
    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(body.classroom, true);
    assert.strictEqual(body.role, 'teacher');
  });

  it('the admin observer saves private notes on the open visit only; other passes and long notes are refused', async () => {
    process.env.CLASSROOM_MODE = 'on';
    const admin: any = await (await enter('dashboard', 'admin-1', true)).json();
    assert.strictEqual(admin.role, 'admin_observer');
    // An older, closed visit by the same admin keeps its own notes.
    db.tables.admin_observations.unshift({ booking_id: BOOKING_ID, admin_user_id: 'admin-1', started_at: 'x', ended_at: 'y', notes: 'old' });
    const res = await observation(admin.ticket, { notes: 'Good tajweed correction at 10:12' });
    assert.strictEqual(res.status, 200);
    const visits = db.tables.admin_observations;
    assert.strictEqual(visits.find((v) => !v.ended_at)!.notes, 'Good tajweed correction at 10:12');
    assert.strictEqual(visits.find((v) => v.ended_at)!.notes, 'old');

    assert.strictEqual((await observation(admin.ticket, { notes: 'x'.repeat(4001) })).status, 400);
    assert.strictEqual((await observation(admin.ticket, { notes: 42 })).status, 400);
    assert.strictEqual((await observation('forged', { notes: 'hi' })).status, 401);

    const guardian: any = await (await enter('student', '', true)).json();
    assert.strictEqual(guardian.role, 'guardian_observer');
    assert.strictEqual((await observation(guardian.ticket, { notes: 'hi' })).status, 403);
    const teacher: any = await (await enter('dashboard', 'teacher-1')).json();
    assert.strictEqual((await observation(teacher.ticket, { notes: 'hi' })).status, 403);
  });
});

describe('CL-13 guardian "Watch the lesson"', () => {
  const lesson = { id: BOOKING_ID, scheduledStart: booking.scheduled_start, scheduledEnd: '2026-11-20T10:30:00Z', durationMinutes: 30, status: 'confirmed', classroom: true, learnerType: 'child' };
  it('shows for a child learner while the room is open', () => {
    assert.strictEqual(canWatchLesson(lesson, NOW), true);
    // The room stays open 15 minutes after the end.
    assert.strictEqual(canWatchLesson(lesson, Date.parse('2026-11-20T10:44:00Z')), true);
  });
  it('never for an adult learner, before the room opens, after it closes, when cancelled or when the classroom is off', () => {
    assert.strictEqual(canWatchLesson({ ...lesson, learnerType: 'adult' }, NOW), false);
    assert.strictEqual(canWatchLesson(lesson, Date.parse('2026-11-20T09:49:00Z')), false);
    assert.strictEqual(canWatchLesson(lesson, Date.parse('2026-11-20T10:45:00Z')), false);
    assert.strictEqual(canWatchLesson({ ...lesson, status: 'cancelled' }, NOW), false);
    assert.strictEqual(canWatchLesson({ ...lesson, classroom: false }, NOW), false);
  });
  it('links to the parent-mode room with observe=1; the parent card shows it; the kid app never does', () => {
    const btn = read('src/student/components/WatchLessonButton.tsx');
    assert.match(btn, /\/student\/room\/\$\{encodeURIComponent\(booking\.id\)\}\?observe=1/);
    assert.match(read('src/student/components/LessonDayCard.tsx'), /<WatchLessonButton /);
    const kid = read('src/kid/KidApp.tsx');
    assert.doesNotMatch(kid, /WatchLessonButton|LessonDayCard|observe/i);
  });
  it('the student bookings list carries the server-computed flag and the learner type', () => {
    const api = read('api/index.ts');
    assert.match(api, /classroom: classroomEnabledFor\(b\.teacher_id\)/);
    assert.match(api, /learnerType: learnerTypeById\.get\(b\.student_id\) \|\| null/);
  });
});

describe('CL-13 gate and super admin', () => {
  it('the gate falls back to the old page on classroom:false, not on 503, and passes observe outside the kid app only', () => {
    const gate = read('src/classroom/ClassroomGate.tsx');
    assert.match(gate, /e\?\.status === 409 && \(e\?\.data \?\? e\)\?\.classroom === false/);
    assert.doesNotMatch(gate, /status === 503/);
    assert.match(gate, /portal !== 'kid' && search\.get\('observe'\) === '1'/);
  });
  it('BookingsPage offers Watch on live room lessons for the super admin', () => {
    const page = read('src/dashboard/pages/BookingsPage.tsx');
    assert.match(page, /\/dashboard\/room\/\$\{encodeURIComponent\(b\.id\)\}\?observe=1/);
    assert.match(page, /roomJoinState\(/);
  });
  it('the admin observer view has the private notes box', () => {
    assert.match(read('src/classroom/ClassroomPage.tsx'), /role === 'admin_observer' && <ObserverNotes /);
    assert.match(read('src/classroom/parts/ObserverNotes.tsx'), /method: 'PATCH'/);
  });
});
