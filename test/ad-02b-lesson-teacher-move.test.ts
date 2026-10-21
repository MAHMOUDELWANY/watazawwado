import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import app, { requireSuperAdmin } from '../api/index.js';
import { registerLessonTeacherMoveRoutes, moveRefusal, parseMoveBody, moveErrorResponse } from '../server/routes/lessonTeacherMove.js';

const BOOKING_ID = '11111111-1111-4111-8111-111111111111';
const OLD_TEACHER = '22222222-2222-4222-8222-222222222222';
const NEW_TEACHER = '33333333-3333-4333-8333-333333333333';
const ADMIN = '44444444-4444-4444-8444-444444444444';
const future = () => new Date(Date.now() + 3 * 86_400_000).toISOString();
const past = () => new Date(Date.now() - 86_400_000).toISOString();

const listen = (a: express.Express) => new Promise<{ server: http.Server; base: string }>((r) => {
  const server = a.listen(0, '127.0.0.1', () => r({ server, base: `http://127.0.0.1:${(server.address() as any).port}` }));
});

/** A test app with the real route and requireSuperAdmin, and a fake database, availability check and follow-up. */
function harness(booking: any, opts: { free?: boolean } = {}) {
  const calls = { rpc: [] as any[], free: [] as any[], after: 0 };
  const client = {
    from: (_table: string) => {
      const q: any = { select: () => q, eq: () => q, update: () => q, maybeSingle: async () => ({ data: booking, error: null }) };
      return q;
    },
    rpc: async (name: string, args: any) => {
      calls.rpc.push({ name, args });
      return { data: { success: true, move_id: 'm1', from_teacher_id: OLD_TEACHER, old_google_event_id: null, sync_queued: true }, error: null };
    }
  };
  const a = express();
  a.use(express.json());
  registerLessonTeacherMoveRoutes(a, {
    getClient: () => client,
    verifyTeacherAuth: (req: any, _res, next) => {
      req.teacherUser = { id: ADMIN, role: req.headers['x-role'] || 'teacher' };
      next();
    },
    requireSuperAdmin,
    resolveTeacher: async (id) => (id === NEW_TEACHER || id === OLD_TEACHER
      ? { id, email: 't@example.test', display_name: 'New Teacher', role: 'teacher', is_active: true }
      : null),
    isTeacherFree: async (s, e, t) => { calls.free.push({ s, e, t }); return opts.free === false ? { isAvailable: false, conflictReason: 'Busy.' } : { isAvailable: true }; },
    afterMove: async () => { calls.after++; },
    runInBackground: () => {}
  });
  return { a, calls };
}

const post = (base: string, role: string, body: any) => fetch(`${base}/api/dashboard/admin/bookings/${BOOKING_ID}/move-teacher`, {
  method: 'POST', headers: { 'content-type': 'application/json', 'x-role': role }, body: JSON.stringify(body)
});

const upcoming = (over: any = {}) => ({ id: BOOKING_ID, reference_code: 'WT-1', status: 'confirmed', scheduled_start: future(), scheduled_end: null, duration_minutes: 30, teacher_id: OLD_TEACHER, student_id: null, ...over });

describe('AD-02b move booked lessons to another teacher', () => {
  it('only upcoming pending/confirmed/rescheduled lessons can be moved', () => {
    for (const s of ['pending', 'confirmed', 'rescheduled']) assert.strictEqual(moveRefusal({ status: s, scheduled_start: future() }), null, s);
    assert.ok(moveRefusal({ status: 'confirmed', scheduled_start: past() }), 'past');
    for (const s of ['cancelled', 'completed', 'no_show']) assert.ok(moveRefusal({ status: s, scheduled_start: future() }), s);
  });

  it('needs a teacher and a reason, and maps database refusals to plain messages', () => {
    assert.ok('error' in parseMoveBody({ reason: 'Teacher is travelling' }));
    assert.ok('error' in parseMoveBody({ teacherId: NEW_TEACHER, reason: 'no' }));
    assert.deepStrictEqual(parseMoveBody({ teacherId: ` ${NEW_TEACHER} `, reason: ' Teacher is travelling ' }), { teacherId: NEW_TEACHER, reason: 'Teacher is travelling' });
    assert.strictEqual(moveErrorResponse({ code: '23P01' }).status, 409, 'per-teacher overlap constraint');
    assert.strictEqual(moveErrorResponse({ code: 'P0003', message: 'Only upcoming lessons…' }).status, 409);
    assert.strictEqual(moveErrorResponse({ code: 'XX000', message: 'secret detail' }).error.includes('secret'), false);
  });

  describe('route (fake database)', () => {
    it('refuses anyone but the super admin', async () => {
      const { a, calls } = harness(upcoming());
      const { server, base } = await listen(a);
      try {
        assert.strictEqual((await post(base, 'teacher', { teacherId: NEW_TEACHER, reason: 'Teacher is travelling' })).status, 403);
        assert.strictEqual(calls.rpc.length, 0);
      } finally { server.close(); }
    });

    it('refuses past, cancelled and completed lessons before touching anything', async () => {
      for (const b of [upcoming({ scheduled_start: past() }), upcoming({ status: 'cancelled' }), upcoming({ status: 'completed' })]) {
        const { a, calls } = harness(b);
        const { server, base } = await listen(a);
        try {
          assert.strictEqual((await post(base, 'super_admin', { teacherId: NEW_TEACHER, reason: 'Teacher is travelling' })).status, 409, b.status);
          assert.strictEqual(calls.rpc.length + calls.free.length, 0);
        } finally { server.close(); }
      }
    });

    it('refuses a new teacher who is busy at that time', async () => {
      const { a, calls } = harness(upcoming(), { free: false });
      const { server, base } = await listen(a);
      try {
        const r = await post(base, 'super_admin', { teacherId: NEW_TEACHER, reason: 'Teacher is travelling' });
        assert.strictEqual(r.status, 409);
        assert.strictEqual(calls.free[0].t, NEW_TEACHER, 'availability is checked for the NEW teacher');
        assert.strictEqual(calls.rpc.length, 0);
      } finally { server.close(); }
    });

    it('refuses the same teacher and an unknown teacher', async () => {
      const { a, calls } = harness(upcoming());
      const { server, base } = await listen(a);
      try {
        assert.strictEqual((await post(base, 'super_admin', { teacherId: OLD_TEACHER, reason: 'Teacher is travelling' })).status, 409);
        assert.strictEqual((await post(base, 'super_admin', { teacherId: 'nobody@example.test', reason: 'Teacher is travelling' })).status, 400);
        assert.strictEqual(calls.rpc.length, 0);
      } finally { server.close(); }
    });

    it('moves with the same time and nothing about money in the request', async () => {
      const { a, calls } = harness(upcoming());
      const { server, base } = await listen(a);
      try {
        const r = await post(base, 'super_admin', { teacherId: NEW_TEACHER, reason: 'Teacher is travelling', fee_amount_usd: 0, price: 1 });
        assert.strictEqual(r.status, 200);
        assert.strictEqual(calls.rpc.length, 1);
        assert.strictEqual(calls.rpc[0].name, 'admin_move_booking_teacher');
        assert.deepStrictEqual(Object.keys(calls.rpc[0].args).sort(), ['p_booking_id', 'p_moved_by', 'p_new_teacher_id', 'p_reason']);
        assert.strictEqual(calls.rpc[0].args.p_new_teacher_id, NEW_TEACHER);
        assert.strictEqual(calls.after, 1, 'calendar clean-up and notices run');
      } finally { server.close(); }
    });
  });

  it('the database function changes only the teacher (and the old calendar event id), never money', () => {
    const sql = fs.readFileSync('supabase/migrations/20261021000010_admin_move_booking_teacher.sql', 'utf8');
    const update = sql.slice(sql.indexOf('UPDATE public.bookings'), sql.indexOf('WHERE id = p_booking_id;', sql.indexOf('UPDATE public.bookings')));
    assert.ok(update.includes('teacher_id = p_new_teacher_id'));
    assert.doesNotMatch(update, /fee|amount|price|payment|scheduled_|\bstatus\s*=/i, 'no money, time or booking status');
    assert.doesNotMatch(sql, /UPDATE public\.(payments|package)/i);
    assert.ok(sql.includes('FOR UPDATE'), 'locks the lesson');
    assert.ok(sql.includes("VALUES (p_booking_id, 'booking_sync', 'pending')"), 'reuses the existing calendar sync job');
    for (const role of ['PUBLIC', 'anon', 'authenticated']) assert.ok(sql.includes(`admin_move_booking_teacher(UUID, UUID, TEXT, UUID) FROM ${role};`), role);
    assert.ok(sql.includes('GRANT EXECUTE ON FUNCTION public.admin_move_booking_teacher(UUID, UUID, TEXT, UUID) TO service_role;'));
    const route = fs.readFileSync('server/routes/lessonTeacherMove.ts', 'utf8');
    assert.doesNotMatch(route, /fee_amount|expected_amount|hourly_rate|from\('payments'\)/);
  });

  it('the UI is for the super admin only and moves one lesson per request', () => {
    const modal = fs.readFileSync('src/dashboard/components/BookingDetailModal.tsx', 'utf8');
    assert.match(modal, /\{isSuperAdmin && isUpcoming && \(\s*<MoveTeacherControl/);
    const bar = fs.readFileSync('src/dashboard/components/BulkCancelBar.tsx', 'utf8');
    assert.ok(bar.includes('await moveLessonToTeacher(id, teacherId, reason);'));
    const page = fs.readFileSync('src/dashboard/pages/BookingsPage.tsx', 'utf8');
    assert.match(page, /\{isSuperAdmin && \(\s*<BulkCancelBar/);
    const control = fs.readFileSync('src/dashboard/components/MoveTeacherControl.tsx', 'utf8');
    assert.ok(control.includes('`/api/dashboard/admin/bookings/${bookingId}/move-teacher`'));
  });

  describe('real app', () => {
    let server: http.Server;
    let base: string;
    before(async () => { ({ server, base } = await listen(app as any)); });
    after(async () => { await new Promise<void>((r) => server.close(() => r())); });

    it('is for the super admin only', async () => {
      const path = `${base}/api/dashboard/admin/bookings/${BOOKING_ID}/move-teacher`;
      const body = JSON.stringify({ teacherId: NEW_TEACHER, reason: 'Teacher is travelling' });
      const headers = { 'content-type': 'application/json' };
      assert.strictEqual((await fetch(path, { method: 'POST', headers, body })).status, 401);
      assert.strictEqual((await fetch(path, { method: 'POST', headers: { ...headers, Authorization: 'Bearer dev-teacher-token' }, body })).status, 403);
    });
  });
});
