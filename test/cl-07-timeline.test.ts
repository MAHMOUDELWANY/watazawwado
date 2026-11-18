import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { signTicket } from '../server/classroom/access.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';
import { isRoomEvent, type RoomEvent } from '../src/lib/lessonRoom.js';
import { createTimelineBatcher, restoreState } from '../src/classroom/timeline.js';
import { roomHardCloseMs } from '../src/lib/roomWindow.js';

const NOW = Date.parse('2026-11-20T10:05:00Z');
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
const SECRET = 'room-secret';
const booking = {
  id: BOOKING_ID, student_id: 'child-1', teacher_id: 'teacher-1', status: 'confirmed',
  scheduled_start: '2026-11-20T10:00:00Z', scheduled_end: null, duration_minutes: 30, contact_name: 'Yusuf',
};

const every: RoomEvent[] = [
  { t: 'session', side: 'teacher', sessionId: 'sess-1' },
  { t: 'slide', state: { track: 'zad-kids', number: 1, page: 2, step: 0 } },
  { t: 'ink', ink: { track: 'zad-kids', number: 1, page: 2, strokes: [], laser: [] } },
  { t: 'board', sceneVersion: 3, elements: [{ id: 'a', type: 'rectangle' }] },
  { t: 'pdf', fileId: 'file-1', page: 4 },
  { t: 'pointer', x: 0.5, y: 0.25 },
  { t: 'reaction', kind: 'hand' },
  { t: 'focus', away: true, at: NOW },
  { t: 'focus_warning_off', off: true },
  { t: 'quality', side: 'student', layer: 'h', link: 'weak' },
  { t: 'observer', kind: 'guardian', present: true },
  { t: 'layout', mode: 'content' },
  { t: 'end' },
];

describe('CL-07 isRoomEvent', () => {
  it('accepts every event shape', () => {
    for (const e of every) assert.strictEqual(isRoomEvent(e), true, JSON.stringify(e));
  });
  it('rejects unknown types, bad values, extra keys and oversize payloads', () => {
    const bad = [
      null, 'end', {}, { t: 'nope' }, { t: 'end', extra: 1 },
      { t: 'slide', state: { track: 'x', number: -1, page: 0, step: 0 } },
      { t: 'pointer', x: NaN, y: 0 }, { t: 'pointer', x: 1e9, y: 0 }, { t: 'pointer', x: '1', y: 0 },
      { t: 'pdf', fileId: '', page: 1 }, { t: 'pdf', fileId: 'f', page: 1.5 },
      { t: 'reaction', kind: 'angry' }, { t: 'focus', away: 'yes', at: 1 }, { t: 'focus', away: true, at: Infinity },
      { t: 'quality', side: 'parent', layer: 'h', link: 'good' }, { t: 'quality', side: 'student', layer: 'x', link: 'good' },
      { t: 'layout', mode: 'grid' }, { t: 'observer', kind: 'admin', present: true },
      { t: 'board', sceneVersion: -1, elements: [] }, { t: 'board', sceneVersion: 1, elements: 'x' },
      { t: 'board', sceneVersion: 1, elements: [{ text: 'x'.repeat(250_000) }] },
      { t: 'session', side: 'teacher', sessionId: 'x'.repeat(500) },
    ];
    for (const b of bad) assert.strictEqual(isRoomEvent(b), false, JSON.stringify(b)?.slice(0, 80));
  });
});

// In-memory database: select/eq/maybeSingle, insert (rows or arrays), upsert by key.
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
          const i = rows(t).findIndex((r) => r[opts.onConflict] === row[opts.onConflict]);
          if (i < 0) rows(t).push({ ...row }); else rows(t)[i] = { ...row };
          return { error: null };
        },
      };
      return b;
    },
  };
}

describe('CL-07 events and state routes', () => {
  let server: http.Server;
  let base: string;
  const sessions = {
    teacher: { joinId: 'jt', userId: 'teacher-1', at: 'x', sessionId: 'sess-t' },
    learner: { joinId: 'jl', userId: 'parent-1', at: 'x' },
    'guardian_observer:parent-2': { joinId: 'jg', userId: 'parent-2', at: 'x' },
  };
  const db = fakeDb({ bookings: [{ ...booking }], lesson_room_state: [{ booking_id: BOOKING_ID, snapshot: { sessions } }] });
  let limited = 0;

  before(async () => {
    const app = express();
    app.use(express.json({ limit: '1mb' }));
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true,
      cloudflare: () => null,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      verifyStudentAuth: (_q: any, _s: any, next: any) => next(),
      getLearners: async () => [],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (q: any, _s: any, next: any) => { if (q.roomTicket) limited++; next(); },
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const ticket = (role: string, userId: string, joinId: string) =>
    signTicket({ bookingId: BOOKING_ID, role: role as any, userId, exp: NOW + 60_000, joinId, studentId: 'child-1' }, SECRET);
  const T = ticket('teacher', 'teacher-1', 'jt');
  const L = ticket('learner', 'parent-1', 'jl');
  const G = ticket('guardian_observer', 'parent-2', 'jg');
  const post = (t: string, events: RoomEvent[], raw?: unknown) =>
    fetch(`${base}/api/classroom/${BOOKING_ID}/events`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-room-ticket': t },
      body: JSON.stringify(raw ?? { events: events.map((event) => ({ at: NOW - 1000, event })) }),
    });
  const timeline = () => db.tables.lesson_timeline_events || [];
  const snapshot = () => db.tables.lesson_room_state[0].snapshot;
  const state = (t: string) => fetch(`${base}/api/classroom/${BOOKING_ID}/state`, { headers: { 'x-room-ticket': t } });

  it('needs a ticket', async () => {
    assert.strictEqual((await post('', [{ t: 'end' }])).status, 401);
    assert.strictEqual((await state('')).status, 401);
  });

  it('observers persist nothing', async () => {
    const res = await post(G, [{ t: 'reaction', kind: 'hand' }, { t: 'slide', state: { track: 'a', number: 1, page: 1, step: 1 } }]);
    assert.ok(res.status === 204 || res.status === 200);
    assert.strictEqual(timeline().length, 0);
  });

  it('a learner cannot persist teacher-only types or the other side’s quality', async () => {
    const res = await post(L, [
      { t: 'end' }, { t: 'layout', mode: 'screen' }, { t: 'slide', state: { track: 'a', number: 1, page: 1, step: 1 } },
      { t: 'pdf', fileId: 'f', page: 1 }, { t: 'quality', side: 'teacher', layer: 'l', link: 'poor' },
      { t: 'board', sceneVersion: 9, elements: [] },
    ]);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(timeline().length, 0);
    assert.strictEqual(snapshot().board, undefined);
    assert.strictEqual(snapshot().layout, undefined);
  });

  it('a learner persists reactions, focus and its own quality; non-persisted types are skipped', async () => {
    const res = await post(L, [
      { t: 'reaction', kind: 'slower' }, { t: 'focus', away: true, at: NOW }, { t: 'quality', side: 'student', layer: 'q', link: 'weak' },
      { t: 'pointer', x: 1, y: 1 }, { t: 'ink', ink: { track: 'a', number: 1, page: 1, strokes: [], laser: [] } },
    ]);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.stored, 3);
    assert.deepStrictEqual(timeline().map((r) => [r.type, r.actor_role]), [['reaction', 'student'], ['focus', 'student'], ['quality', 'student']]);
    assert.deepStrictEqual(timeline()[0].payload, { kind: 'slower' });
    assert.strictEqual(timeline()[0].occurred_at, new Date(NOW - 1000).toISOString());
  });

  it('a teacher cannot persist learner-only types', async () => {
    const before = timeline().length;
    await post(T, [{ t: 'reaction', kind: 'hand' }, { t: 'focus', away: false, at: NOW }]);
    assert.strictEqual(timeline().length, before);
  });

  it('teacher events land in the timeline and the latest slide/board/pdf/layout merge into the snapshot, sessions kept', async () => {
    const before = timeline().length;
    const res = await post(T, [
      { t: 'slide', state: { track: 'zad-kids', number: 1, page: 1, step: 0 } },
      { t: 'slide', state: { track: 'zad-kids', number: 1, page: 3, step: 2 } },
      { t: 'board', sceneVersion: 5, elements: [{ id: 'a' }] },
      { t: 'pdf', fileId: 'file-1', page: 7 },
      { t: 'layout', mode: 'content' },
      { t: 'quality', side: 'teacher', layer: 'f', link: 'good' },
    ]);
    assert.strictEqual(res.status, 200);
    // board is snapshot-only (latest wins), not a timeline row
    assert.deepStrictEqual(timeline().slice(before).map((r) => r.type), ['slide', 'slide', 'pdf', 'layout', 'quality']);
    const s = snapshot();
    assert.deepStrictEqual(s.slide, { track: 'zad-kids', number: 1, page: 3, step: 2 });
    assert.deepStrictEqual(s.board, { sceneVersion: 5, elements: [{ id: 'a' }], learnerDraw: false });
    assert.deepStrictEqual(s.pdf, { fileId: 'file-1', page: 7 });
    assert.strictEqual(s.layout, 'content');
    assert.deepStrictEqual(s.sessions, sessions);
  });

  it('an older board version does not replace a newer one', async () => {
    await post(T, [{ t: 'board', sceneVersion: 2, elements: [] }]);
    assert.strictEqual(snapshot().board.sceneVersion, 5);
  });

  it('a learner may draw on the board only after the teacher allowed it', async () => {
    await post(L, [{ t: 'board', sceneVersion: 6, elements: [{ id: 'kid' }] }]);
    assert.strictEqual(snapshot().board.sceneVersion, 5);
    await post(T, [{ t: 'board', sceneVersion: 7, elements: [], learnerDraw: true }]);
    await post(L, [{ t: 'board', sceneVersion: 8, elements: [{ id: 'kid' }], learnerDraw: true }]);
    assert.deepStrictEqual(snapshot().board, { sceneVersion: 8, elements: [{ id: 'kid' }], learnerDraw: true });
    // the learner can never switch the permission off or on for itself
    await post(L, [{ t: 'board', sceneVersion: 9, elements: [], learnerDraw: false }]);
    assert.strictEqual(snapshot().board.learnerDraw, true);
  });

  it('the teacher ends the lesson; end is stored', async () => {
    await post(T, [{ t: 'end' }]);
    assert.strictEqual(timeline().filter((r) => r.type === 'end').length, 1);
  });

  it('rejects invalid events, too many events and an oversize body', async () => {
    assert.strictEqual((await post(T, [], { events: [{ at: NOW, event: { t: 'nope' } }] })).status, 400);
    assert.strictEqual((await post(T, [], { events: 'x' })).status, 400);
    assert.strictEqual((await post(T, Array(51).fill({ t: 'layout', mode: 'content' }))).status, 400);
    const big = Array(2).fill({ t: 'board', sceneVersion: 10, elements: [{ text: 'x'.repeat(150_000) }] });
    assert.strictEqual((await post(T, big)).status, 413);
  });

  it('a superseded device is refused', async () => {
    const old = ticket('learner', 'parent-1', 'old-join');
    assert.strictEqual((await post(old, [{ t: 'reaction', kind: 'hand' }])).status, 409);
  });

  it('GET /state returns the snapshot without sessions, plus remainingMs, to any valid ticket', async () => {
    for (const t of [T, L, G]) {
      const res = await state(t);
      assert.strictEqual(res.status, 200);
      const body = await res.json();
      assert.strictEqual(body.snapshot.sessions, undefined);
      assert.strictEqual(body.snapshot.board.sceneVersion, 9);
      assert.deepStrictEqual(body.snapshot.slide, { track: 'zad-kids', number: 1, page: 3, step: 2 });
      assert.strictEqual(body.remainingMs, roomHardCloseMs(booking) - NOW);
    }
  });

  it('events and state go through the per-ticket rate limit', () => {
    assert.ok(limited > 5);
  });
});

describe('CL-07 client timeline', () => {
  const okFetch = () => {
    const calls: Array<{ url: string; init: any }> = [];
    const f = async (url: any, init: any) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify({ stored: 1 }), { status: 200 }); };
    return { calls, f: f as typeof fetch };
  };

  it('batches only persisted types, keeps the latest board, and sends the ticket header', async () => {
    const { calls, f } = okFetch();
    const b = createTimelineBatcher(BOOKING_ID, () => 'TICKET', { fetch: f, everyMs: 1e9, listen: false });
    b.push({ t: 'pointer', x: 1, y: 1 });
    b.push({ t: 'reaction', kind: 'hand' });
    b.push({ t: 'board', sceneVersion: 1, elements: [] });
    b.push({ t: 'board', sceneVersion: 2, elements: [] });
    await b.flush();
    assert.strictEqual(calls.length, 1);
    assert.strictEqual(calls[0].url, `/api/classroom/${BOOKING_ID}/events`);
    assert.strictEqual(calls[0].init.headers['x-room-ticket'], 'TICKET');
    const sent = JSON.parse(calls[0].init.body).events.map((x: any) => x.event);
    assert.deepStrictEqual(sent, [{ t: 'reaction', kind: 'hand' }, { t: 'board', sceneVersion: 2, elements: [] }]);
    await b.flush();
    assert.strictEqual(calls.length, 1, 'nothing queued, nothing sent');
    b.stop();
  });

  it('the pagehide flush uses keepalive', async () => {
    const { calls, f } = okFetch();
    const b = createTimelineBatcher(BOOKING_ID, () => 'TICKET', { fetch: f, everyMs: 1e9, listen: false });
    b.push({ t: 'end' });
    await b.flush(true);
    assert.strictEqual(calls[0].init.keepalive, true);
    b.stop();
  });

  it('restoreState reads /state with the ticket and returns null on failure', async () => {
    const body = { snapshot: { slide: { track: 'a', number: 1, page: 1, step: 0 } }, remainingMs: 1000 };
    const got = await restoreState(BOOKING_ID, 'TICKET', (async (url: any, init: any) => {
      assert.strictEqual(String(url), `/api/classroom/${BOOKING_ID}/state`);
      assert.strictEqual(init.headers['x-room-ticket'], 'TICKET');
      return new Response(JSON.stringify(body), { status: 200 });
    }) as typeof fetch);
    assert.deepStrictEqual(got, body);
    assert.strictEqual(await restoreState(BOOKING_ID, 'T', (async () => new Response('{}', { status: 401 })) as typeof fetch), null);
  });
});
