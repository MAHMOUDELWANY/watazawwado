import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { PERSISTED } from '../src/classroom/timeline.js';
import type { RoomEvent } from '../src/lib/roomEvents.js';

// 4.2 rejoin: the mushaf page and the open tab are saved like slides, pdf and layout, and /state hands them back.
const NOW = Date.parse('2026-11-20T10:05:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const SECRET = 'room-secret';
const booking = { id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed', scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf' };

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        maybeSingle: async () => ({ data: rows(t).filter((r) => filters.every((f) => f(r)))[0] ?? null, error: null }),
        insert: async (row: any) => { for (const r of [row].flat()) rows(t).push({ ...r }); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string }) => {
          const keys = opts.onConflict.split(',');
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else rows(t)[i] = { ...rows(t)[i], ...row };
          return { error: null };
        },
      };
      return b;
    },
  };
}

describe('CL-44 mushaf state for rejoin', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({
    bookings: [{ ...booking }],
    lesson_room_seats: [
      { booking_id: BOOKING_ID, seat: 'teacher', join_id: 'jt', user_id: 'teacher-1', session_id: 'sess-t' },
      { booking_id: BOOKING_ID, seat: 'learner', join_id: 'jl', user_id: 'parent-1', session_id: null },
    ],
    lesson_room_state: [{ booking_id: BOOKING_ID, snapshot: {} }],
  });
  before(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    const pass = (_q: any, _s: any, next: any) => next();
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true, cloudflare: () => null,
      verifyTeacherAuth: pass, verifyStudentAuth: pass, getLearners: async () => [], rateLimit: pass, roomRateLimit: pass, requireSuperAdmin: pass,
      secret: () => SECRET, now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const ticket = (role: string, userId: string, joinId: string) =>
    signTicket({ bookingId: BOOKING_ID, role: role as any, userId, exp: NOW + 60_000, joinId, studentId: 'child-1' }, SECRET);
  const T = ticket('teacher', 'teacher-1', 'jt');
  const L = ticket('learner', 'parent-1', 'jl');
  const post = (t: string, events: RoomEvent[]) => fetch(`${base}/api/classroom/${BOOKING_ID}/events`, {
    method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t },
    body: JSON.stringify({ events: events.map((event) => ({ at: NOW - 1000, event })) }),
  });
  const state = async (t: string) => (await (await fetch(`${base}/api/classroom/${BOOKING_ID}/state`, { headers: { 'x-room-ticket': t } })).json() as any).snapshot;
  const timeline = () => (db.tables.lesson_timeline_events || []) as any[];

  it('the client batches quran events for the server', () => {
    assert.ok(PERSISTED.has('quran'));
  });

  it('a learner cannot move the saved mushaf page or tab', async () => {
    assert.strictEqual((await post(L, [{ t: 'quran', page: 99 }, { t: 'layout', mode: 'content', pane: 'quran' }])).status, 200);
    assert.strictEqual(timeline().length, 0);
    assert.deepStrictEqual(await state(L), {});
  });

  it('the teacher\'s latest page and the open tab are saved; a late learner reads them from /state', async () => {
    const res = await post(T, [{ t: 'layout', mode: 'content', pane: 'quran' }, { t: 'quran', page: 561 }, { t: 'quran', page: 562 }]);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(timeline().map((r) => [r.type, r.payload]), [['layout', { mode: 'content', pane: 'quran' }], ['quran', { page: 561 }], ['quran', { page: 562 }]]);
    const s = await state(L);
    assert.deepStrictEqual([s.layout, s.pane, s.quran], ['content', 'quran', { page: 562 }]);
    assert.deepStrictEqual((await state(T)).quran, { page: 562 });
  });

  it('other saved content is kept when the page changes, and a layout without a pane keeps the last tab', async () => {
    await post(T, [{ t: 'pdf', fileId: 'file-1', page: 2 }]);
    await post(T, [{ t: 'quran', page: 600 }, { t: 'layout', mode: 'conversation' }]);
    const s = await state(L);
    assert.deepStrictEqual([s.pdf, s.quran, s.layout, s.pane], [{ fileId: 'file-1', page: 2 }, { page: 600 }, 'conversation', 'quran']);
  });
});
