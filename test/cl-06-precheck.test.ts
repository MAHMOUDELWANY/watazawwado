import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';

const NOW = Date.parse('2026-11-20T09:55:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const SECRET = 'room-secret';

// In-memory database, as in cl-04, with composite onConflict keys.
function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      return {
        upsert: async (row: any, opts: { onConflict: string }) => {
          const keys = opts.onConflict.split(',').map((k) => k.trim());
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else Object.assign(rows(t)[i], row);
          return { error: null };
        },
      };
    },
  };
}

describe('CL-06 precheck route', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({});
  const pass = (n: any) => n();

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true,
      cloudflare: () => null,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      verifyStudentAuth: (_q: any, _s: any, next: any) => next(),
      getLearners: async () => [],
      rateLimit: (_q: any, _s: any, next: any) => pass(next),
      roomRateLimit: (_q: any, _s: any, next: any) => pass(next),
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const ticket = (role: string, userId = 'u-1') => signTicket({ bookingId: BOOKING_ID, role: role as any, userId, exp: NOW + 60_000, joinId: 'j' }, SECRET);
  const precheck = (t: string, body: unknown) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/precheck`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t }, body: JSON.stringify(body) });
  const quality = () => db.tables.lesson_quality || [];

  it('needs a ticket', async () => {
    assert.strictEqual((await precheck('', { precheck720: true, startHeight: 720 })).status, 401);
  });

  it('an observer precheck is accepted and nothing is stored', async () => {
    for (const role of ['guardian_observer', 'admin_observer']) {
      const res = await precheck(ticket(role), { precheck720: true, startHeight: 720 });
      assert.ok(res.status === 200 || res.status === 204, role);
    }
    assert.strictEqual(quality().length, 0);
  });

  it('a teacher precheck upserts the teacher side', async () => {
    assert.ok((await precheck(ticket('teacher'), { precheck720: false, startHeight: 480 })).ok);
    assert.ok((await precheck(ticket('teacher'), { precheck720: true, startHeight: 720 })).ok);
    const rows = quality().filter((r) => r.side === 'teacher');
    assert.strictEqual(rows.length, 1);
    assert.strictEqual(rows[0].booking_id, BOOKING_ID);
    assert.strictEqual(rows[0].precheck_720, true);
    assert.strictEqual(rows[0].start_height, 720);
  });

  it('a learner precheck is stored as the student side', async () => {
    assert.ok((await precheck(ticket('learner'), { precheck720: false, startHeight: null })).ok);
    const row = quality().find((r) => r.side === 'student');
    assert.ok(row);
    assert.strictEqual(row.precheck_720, false);
    assert.strictEqual(row.start_height, null);
  });

  it('an invalid body is 400', async () => {
    for (const body of [{}, { precheck720: 'yes', startHeight: 720 }, { precheck720: true, startHeight: -1 }, { precheck720: true, startHeight: 1.5 }, { precheck720: true, startHeight: 99999 }]) {
      assert.strictEqual((await precheck(ticket('teacher'), body)).status, 400, JSON.stringify(body));
    }
  });
});
