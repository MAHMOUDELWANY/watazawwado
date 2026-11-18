import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { QUALITY_ALERT, lessonFailedForSide, shouldAlert, alertTeacherIfNeeded } from '../server/classroom/qualityAlerts.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { signTicket } from '../server/classroom/access.js';

const DAY = 86_400_000;
const NOW = Date.parse('2026-11-20T10:05:00Z');
const iso = (ms: number) => new Date(ms).toISOString();
const ok = { side: 'teacher' as const, min_height: 720, degraded_seconds: 0, audio_only_seconds: 0, reconnects: 0 };
const bad = (daysAgo: number) => ({ ...ok, reconnects: 3, updated_at: iso(NOW - daysAgo * DAY) });

// In-memory query builder for the calls quality code makes. Inserts get created_at from the test clock.
function fakeDb(tables: Record<string, any[]>, clock: () => number) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let max = Infinity;
      const run = () => rows(t).filter((r) => filters.every((f) => f(r))).slice(0, max).map((r) => ({ ...r }));
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        in: (c: string, v: any[]) => { filters.push((r) => v.includes(r[c])); return b; },
        gte: (c: string, v: any) => { filters.push((r) => r[c] >= v); return b; },
        lt: (c: string, v: any) => { filters.push((r) => r[c] < v); return b; },
        order: () => b,
        limit: (n: number) => { max = n; return b; },
        maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row]).map((r) => ({ created_at: iso(clock()), ...r }))); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string }) => {
          const keys = opts.onConflict.split(',');
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else rows(t)[i] = { ...rows(t)[i], ...row };
          return { error: null };
        },
        then: (res: any, rej: any) => Promise.resolve().then(() => ({ data: run(), error: null })).then(res, rej),
      };
      return b;
    },
  };
}

describe('CL-11 lessonFailedForSide', () => {
  it('audio-only 60 s, low video 180 s, or 3 reconnects fail a lesson; less does not', () => {
    assert.strictEqual(lessonFailedForSide({ ...ok, audio_only_seconds: 60 } as any), true);
    assert.strictEqual(lessonFailedForSide({ ...ok, audio_only_seconds: 59 } as any), false);
    assert.strictEqual(lessonFailedForSide({ ...ok, min_height: 180, degraded_seconds: 180 } as any), true);
    assert.strictEqual(lessonFailedForSide({ ...ok, min_height: 360, degraded_seconds: 600 } as any), false);
    assert.strictEqual(lessonFailedForSide({ ...ok, min_height: 180, degraded_seconds: 179 } as any), false);
    assert.strictEqual(lessonFailedForSide({ ...ok, reconnects: 3 } as any), true);
    assert.strictEqual(lessonFailedForSide({ ...ok, reconnects: 2 } as any), false);
  });
});

describe('CL-11 shouldAlert', () => {
  it(`the threshold is ${QUALITY_ALERT.lessons} lessons in ${QUALITY_ALERT.days} days`, () => {
    assert.deepStrictEqual(QUALITY_ALERT, { lessons: 3, days: 14 });
  });
  it('2 failed lessons in 14 days: no alert', () => {
    assert.strictEqual(shouldAlert([bad(1), bad(5), { ...ok, updated_at: iso(NOW) }] as any, NOW), false);
  });
  it('3 failed lessons in 14 days: alert', () => {
    assert.strictEqual(shouldAlert([bad(1), bad(5), bad(13)] as any, NOW), true);
  });
  it('3 spread over 20 days: no alert', () => {
    assert.strictEqual(shouldAlert([bad(1), bad(10), bad(20)] as any, NOW), false);
  });
  it('student-side rows never count', () => {
    assert.strictEqual(shouldAlert([bad(1), bad(2), { ...bad(3), side: 'student' }] as any, NOW), false);
  });
});

const TEACHER = '11111111-1111-4111-8111-111111111111';
const lessonsDb = (clock: () => number, failedDaysAgo: number[]) => {
  const bookings = failedDaysAgo.map((d, i) => ({ id: `b${i}`, teacher_id: TEACHER, student_id: 's1', status: 'completed', scheduled_start: iso(NOW - d * DAY), scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf' }));
  return fakeDb({
    bookings,
    lesson_quality: bookings.map((b, i) => ({ ...bad(failedDaysAgo[i]), booking_id: b.id })),
    teacher_accounts: [{ email: 'admin@x.test', role: 'super_admin', is_active: true }],
    profiles: [{ id: 'admin-profile', email: 'admin@x.test' }],
  }, clock);
};
const alerts = (db: any) => (db.tables.user_notifications || []).filter((n: any) => n.kind === 'classroom_quality_alert');

describe('CL-11 alertTeacherIfNeeded (dedupe)', () => {
  it('3 failed lessons notify the super admins once; a second call in the same window does not repeat it', async () => {
    let clock = NOW;
    const db = lessonsDb(() => clock, [1, 4, 8]);
    assert.strictEqual(await alertTeacherIfNeeded(db, TEACHER, clock), true);
    assert.strictEqual(alerts(db).length, 1);
    assert.strictEqual(alerts(db)[0].recipient_user_id, 'admin-profile');
    clock = NOW + 2 * DAY;
    assert.strictEqual(await alertTeacherIfNeeded(db, TEACHER, clock), false);
    assert.strictEqual(alerts(db).length, 1);
  });
  it('2 failed lessons notify nobody', async () => {
    const db = lessonsDb(() => NOW, [1, 4]);
    assert.strictEqual(await alertTeacherIfNeeded(db, TEACHER, NOW), false);
    assert.strictEqual(alerts(db).length, 0);
  });
  it('after the window passes, a new run of failures alerts again', async () => {
    let clock = NOW;
    const db = lessonsDb(() => clock, [1, 4, 8]);
    await alertTeacherIfNeeded(db, TEACHER, clock);
    clock = NOW + 15 * DAY;
    for (const d of [0.5, 1, 2]) {
      const id = `late-${d}`;
      db.tables.bookings.push({ id, teacher_id: TEACHER, scheduled_start: iso(clock - d * DAY) });
      db.tables.lesson_quality.push({ ...bad(0), booking_id: id, updated_at: iso(clock - d * DAY) });
    }
    assert.strictEqual(await alertTeacherIfNeeded(db, TEACHER, clock), true);
    assert.strictEqual(alerts(db).length, 2);
  });
});

describe('CL-11 quality routes', () => {
  const SECRET = 'room-secret';
  const BOOKING = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
  const db = fakeDb({
    bookings: [
      { id: BOOKING, student_id: 'child-1', teacher_id: TEACHER, status: 'confirmed', scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf' },
      { id: 'b-old', teacher_id: TEACHER, status: 'completed', scheduled_start: '2026-11-12T10:00:00Z', contact_name: 'Amina' },
      { id: 'b-oct', teacher_id: TEACHER, status: 'completed', scheduled_start: '2026-10-12T10:00:00Z', contact_name: 'Omar' },
    ],
    lesson_quality: [
      { booking_id: 'b-old', side: 'teacher', reconnects: 3, degraded_seconds: 0, audio_only_seconds: 0, min_height: 720, updated_at: '2026-11-12T10:30:00Z' },
      { booking_id: 'b-old', side: 'student', reconnects: 0, degraded_seconds: 0, audio_only_seconds: 0, min_height: 720, updated_at: '2026-11-12T10:30:00Z' },
      { booking_id: 'b-oct', side: 'teacher', reconnects: 0, degraded_seconds: 0, audio_only_seconds: 0, min_height: 720, updated_at: '2026-10-12T10:30:00Z' },
    ],
    teacher_accounts: [{ email: 'admin@x.test', role: 'super_admin', is_active: true }],
    profiles: [{ id: 'admin-profile', email: 'admin@x.test' }],
  }, () => NOW);
  let server: http.Server;
  let base: string;
  const teacherAuth = (req: any, res: any, next: any) => {
    const id = req.headers['x-teacher'];
    if (!id) return res.status(401).json({ error: 'auth' });
    req.teacherUser = { id, role: id === 'admin-1' ? 'super_admin' : 'teacher' };
    next();
  };
  const ticket = (role: string, userId: string) => signTicket({ bookingId: BOOKING, role: role as any, userId, exp: NOW + 3_600_000, joinId: 'j1', studentId: 'child-1' }, SECRET);
  const post = (tk: string, body: unknown) => fetch(`${base}/api/classroom/${BOOKING}/quality`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': tk }, body: JSON.stringify(body) });
  const row = (side: string) => db.tables.lesson_quality.find((r) => r.booking_id === BOOKING && r.side === side);

  before(async () => {
    const app = express();
    app.use(express.json());
    const pass = (_q: any, _s: any, next: any) => next();
    registerClassroomRoutes(app, {
      getClient: () => db, cloudflare: () => null, verifyTeacherAuth: teacherAuth, verifyStudentAuth: pass,
      getLearners: async () => [], rateLimit: pass, roomRateLimit: pass, secret: () => SECRET, now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('needs a ticket, and bad numbers are 400', async () => {
    assert.strictEqual((await post('nope', {})).status, 401);
    assert.strictEqual((await post(ticket('teacher', TEACHER), { degradedSeconds: 'x', audioOnlySeconds: 0, reconnects: 0 })).status, 400);
    assert.strictEqual((await post(ticket('teacher', TEACHER), { degradedSeconds: -1, audioOnlySeconds: 0, reconnects: 0 })).status, 400);
  });

  it('observers are accepted and nothing is stored', async () => {
    const res = await post(ticket('admin_observer', 'admin-1'), { degradedSeconds: 500, audioOnlySeconds: 500, reconnects: 9 });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(row('teacher'), undefined);
  });

  it('running totals are stored per side, clamped, and never go down', async () => {
    assert.strictEqual((await post(ticket('learner', 'parent-1'), { degradedSeconds: 30, audioOnlySeconds: 0, reconnects: 1, minHeight: 360 })).status, 200);
    await post(ticket('learner', 'parent-1'), { degradedSeconds: 10, audioOnlySeconds: 999_999, reconnects: 0, minHeight: 720 });
    const s = row('student');
    assert.strictEqual(s.degraded_seconds, 30);
    assert.strictEqual(s.reconnects, 1);
    assert.strictEqual(s.min_height, 360);
    assert.ok(s.audio_only_seconds <= 6 * 3600 && s.audio_only_seconds > 0);
  });

  it("a teacher's third failed lesson alerts the super admins once", async () => {
    // b-old already failed on the teacher side; this lesson makes two.
    await post(ticket('teacher', TEACHER), { degradedSeconds: 0, audioOnlySeconds: 90, reconnects: 0, minHeight: 720 });
    assert.strictEqual(alerts(db).length, 0);
    db.tables.bookings.push({ id: 'b-3', teacher_id: TEACHER, status: 'completed', scheduled_start: '2026-11-18T10:00:00Z', contact_name: 'Sara' });
    db.tables.lesson_quality.push({ booking_id: 'b-3', side: 'teacher', reconnects: 4, degraded_seconds: 0, audio_only_seconds: 0, min_height: 720, updated_at: '2026-11-18T10:30:00Z' });
    await post(ticket('teacher', TEACHER), { degradedSeconds: 0, audioOnlySeconds: 120, reconnects: 0 });
    await post(ticket('teacher', TEACHER), { degradedSeconds: 0, audioOnlySeconds: 180, reconnects: 0 });
    assert.strictEqual(alerts(db).length, 1);
  });

  it('the monthly connection view is super admin only and lists every lesson with numbers that month', async () => {
    const url = `${base}/api/admin/teachers/${TEACHER}/connection?month=2026-11`;
    assert.strictEqual((await fetch(url, { headers: { 'x-teacher': TEACHER } })).status, 403);
    assert.strictEqual((await fetch(`${base}/api/admin/teachers/${TEACHER}/connection?month=nov`, { headers: { 'x-teacher': 'admin-1' } })).status, 400);
    const res = await fetch(url, { headers: { 'x-teacher': 'admin-1' } });
    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    const ids = body.lessons.map((l: any) => l.bookingId).sort();
    assert.deepStrictEqual(ids, [BOOKING, 'b-3', 'b-old'].sort());
    const old = body.lessons.find((l: any) => l.bookingId === 'b-old');
    assert.strictEqual(old.teacher.reconnects, 3);
    assert.strictEqual(old.teacherFailed, true);
    assert.strictEqual(old.learner, 'Amina');
    assert.strictEqual(body.lessons.find((l: any) => l.bookingId === BOOKING).student.min_height, 360);
  });
});
