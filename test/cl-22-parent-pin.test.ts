import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import http from 'node:http';
import express from 'express';
import { hashPin, pinMatches, signParentProof, verifyParentProof, registerParentPinRoutes, PIN_LOCK_MS, PIN_PROOF_MS } from '../server/routes/parentPin.js';
import { registerClassroomRoutes } from '../server/routes/classroom.js';

const SECRET = 'room-secret';
const PARENT = '11111111-1111-4111-8111-111111111111';
const BOOKING_ID = '4049fa58-7428-44e4-926b-5e3eb315c5cb';
let NOW = Date.parse('2026-11-20T10:00:00Z');

function fakeDb(tables: Record<string, any[]>) {
  const rows = (t: string) => (tables[t] ||= []);
  return {
    tables,
    from(t: string) {
      const filters: Array<(r: any) => boolean> = [];
      let patch: any = null;
      const b: any = {
        select: () => b,
        eq: (c: string, v: any) => { filters.push((r) => r[c] === v); return b; },
        is: (c: string, v: any) => { filters.push((r) => (r[c] ?? null) === v); return b; },
        order: () => b, limit: () => b,
        maybeSingle: async () => ({ data: rows(t).find((r) => filters.every((f) => f(r))) ?? null, error: null }),
        update: (p: any) => { patch = p; return b; },
        insert: async (row: any) => { rows(t).push(...(Array.isArray(row) ? row : [row])); return { error: null }; },
        upsert: async (row: any, opts: { onConflict: string }) => {
          const keys = opts.onConflict.split(',').map((k) => k.trim());
          const i = rows(t).findIndex((r) => keys.every((k) => r[k] === row[k]));
          if (i < 0) rows(t).push({ ...row }); else Object.assign(rows(t)[i], row);
          return { error: null };
        },
        then: (ok: any, bad: any) => {
          if (patch) rows(t).filter((r) => filters.every((f) => f(r))).forEach((r) => Object.assign(r, patch));
          return Promise.resolve({ data: null, error: null }).then(ok, bad);
        },
      };
      return b;
    },
  };
}

describe('CL-22 parent PIN: hashing and proof', () => {
  it('stores a salted scrypt hash, never the PIN, and checks it', () => {
    const h = hashPin('4821');
    assert.match(h, /^scrypt\$[0-9a-f]{32}\$[0-9a-f]{64}$/);
    assert.ok(!h.includes('4821'));
    assert.notStrictEqual(hashPin('4821'), h, 'a new salt each time');
    assert.strictEqual(pinMatches('4821', h), true);
    assert.strictEqual(pinMatches('4822', h), false);
    assert.strictEqual(pinMatches('4821', 'sha256$x$y'), false);
  });

  it('a proof is bound to the user, the secret and a short time', () => {
    const p = signParentProof(PARENT, SECRET, NOW);
    assert.strictEqual(verifyParentProof(p, PARENT, SECRET, NOW + 1000), true);
    assert.strictEqual(verifyParentProof(p, 'someone-else', SECRET, NOW), false);
    assert.strictEqual(verifyParentProof(p, PARENT, 'other-secret', NOW), false);
    assert.strictEqual(verifyParentProof(p, PARENT, SECRET, NOW + PIN_PROOF_MS + 1), false);
    assert.strictEqual(verifyParentProof(p.replace(/.$/, 'A'), PARENT, SECRET, NOW), false);
    assert.strictEqual(verifyParentProof(undefined, PARENT, SECRET, NOW), false);
  });
});

describe('CL-22 parent PIN routes', () => {
  let server: http.Server;
  let base: string;
  const db = fakeDb({ parent_pins: [] });

  before(async () => {
    const app = express();
    app.use(express.json());
    registerParentPinRoutes(app, {
      getClient: () => db,
      verifyStudentAuth: (req: any, _res: any, next: any) => {
        req.studentUser = { auth_id: PARENT };
        if (req.headers['x-kid']) req.childDevice = { learnerId: 'child-1' };
        next();
      },
      rateLimit: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => NOW,
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const call = (method: string, path: string, body?: unknown, headers: Record<string, string> = {}) =>
    fetch(`${base}/api/student/parent-pin${path}`, { method, headers: { 'content-type': 'application/json', ...headers }, body: body === undefined ? undefined : JSON.stringify(body) });

  it('starts with no PIN; verify asks to set one first', async () => {
    assert.deepStrictEqual(await (await call('GET', '')).json(), { hasPin: false, lockedUntil: null });
    const v = await call('POST', '/verify', { pin: '1234' });
    assert.strictEqual(v.status, 404);
    assert.strictEqual((await v.json()).needsSetup, true);
  });

  it('a child device can never set or verify', async () => {
    assert.strictEqual((await call('PUT', '', { pin: '1234' }, { 'x-kid': '1' })).status, 403);
    assert.strictEqual((await call('POST', '/verify', { pin: '1234' }, { 'x-kid': '1' })).status, 403);
  });

  it('sets a 4-digit PIN (hashed) and returns a proof', async () => {
    for (const bad of ['123', '12345', 'abcd', 1234]) assert.strictEqual((await call('PUT', '', { pin: bad })).status, 400, String(bad));
    const res = await call('PUT', '', { pin: '4821' });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(verifyParentProof((await res.json()).proof, PARENT, SECRET, NOW), true);
    const row = db.tables.parent_pins[0];
    assert.strictEqual(row.user_id, PARENT);
    assert.ok(pinMatches('4821', row.pin_hash));
    assert.strictEqual((await (await call('GET', '')).json()).hasPin, true);
  });

  it('changing the PIN needs the current one', async () => {
    assert.strictEqual((await call('PUT', '', { pin: '9999' })).status, 401);
    assert.strictEqual((await call('PUT', '', { pin: '9999', currentPin: '4821' })).status, 200);
    assert.ok(pinMatches('9999', db.tables.parent_pins[0].pin_hash));
  });

  it('verify gives a proof for the right PIN; wrong tries count down and lock it for 15 minutes', async () => {
    const ok = await call('POST', '/verify', { pin: '9999' });
    assert.strictEqual(ok.status, 200);
    assert.ok(verifyParentProof((await ok.json()).proof, PARENT, SECRET, NOW));
    // The earlier wrong change attempt was cleared by the right PIN.
    for (let i = 1; i <= 4; i++) {
      const r = await call('POST', '/verify', { pin: '0000' });
      assert.strictEqual(r.status, 401);
      assert.strictEqual((await r.json()).attemptsLeft, 5 - i);
    }
    const locked = await call('POST', '/verify', { pin: '0000' });
    assert.strictEqual(locked.status, 423);
    // While locked even the right PIN is refused.
    assert.strictEqual((await call('POST', '/verify', { pin: '9999' })).status, 423);
    assert.ok((await (await call('GET', '')).json()).lockedUntil);
    NOW += PIN_LOCK_MS + 1;
    assert.strictEqual((await call('POST', '/verify', { pin: '9999' })).status, 200);
    assert.strictEqual(db.tables.parent_pins[0].failed_count, 0);
  });
});

describe('CL-22 watching needs the PIN proof', () => {
  let server: http.Server;
  let base: string;
  const start = '2026-11-20T10:00:00Z';
  const db = fakeDb({ bookings: [{ id: BOOKING_ID, teacher_id: 'teacher-1', student_id: 'child-1', status: 'confirmed', scheduled_start: start, scheduled_end: '2026-11-20T10:30:00Z', duration_minutes: 30 }] });

  before(async () => {
    const app = express();
    app.use(express.json());
    registerClassroomRoutes(app, {
      getClient: () => db, classroomEnabled: () => true,
      cloudflare: () => ({ configured: true, iceServers: async () => [] }) as any,
      verifyTeacherAuth: (_q: any, _s: any, next: any) => next(),
      verifyStudentAuth: (req: any, _res: any, next: any) => {
        req.studentUser = { auth_id: PARENT };
        if (req.headers['x-kid']) req.childDevice = { learnerId: 'child-1' };
        next();
      },
      getLearners: async () => [{ id: 'child-1', name: 'Yusuf', learnerType: 'child' }],
      rateLimit: (_q: any, _s: any, next: any) => next(),
      roomRateLimit: (_q: any, _s: any, next: any) => next(),
      requireSuperAdmin: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => Date.parse(start),
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const enter = (headers: Record<string, string>) => fetch(`${base}/api/student/classroom/${BOOKING_ID}/enter?observe=1`, { headers });

  it('no proof, a forged one, an expired one or another user\'s: 403 needsPin, no seat', async () => {
    const at = Date.parse(start);
    for (const proof of ['', 'forged.sig', signParentProof(PARENT, SECRET, at - PIN_PROOF_MS - 1), signParentProof('someone-else', SECRET, at)]) {
      const res = await enter(proof ? { 'x-parent-proof': proof } : {});
      assert.strictEqual(res.status, 403);
      assert.strictEqual((await res.json()).needsPin, true);
    }
    assert.strictEqual((db.tables.lesson_room_seats || []).length, 0);
  });

  it('with a fresh proof the guardian watches', async () => {
    const res = await enter({ 'x-parent-proof': signParentProof(PARENT, SECRET, Date.parse(start)) });
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).role, 'guardian_observer');
  });

  it('a child phone never observes, proof or not', async () => {
    const res = await enter({ 'x-kid': '1', 'x-parent-proof': signParentProof(PARENT, SECRET, Date.parse(start)) });
    assert.notStrictEqual((await res.json()).role, 'guardian_observer');
  });
});

describe('CL-22 wiring', () => {
  const read = (p: string) => fs.readFileSync(p, 'utf8');
  it('the routes are registered, the migration is service-role only, and the Watch button asks for the PIN', () => {
    assert.match(read('api/index.ts'), /registerParentPinRoutes\(app, /);
    const sql = read('supabase/migrations/20261120100000_classroom_before_lesson.sql');
    assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.parent_pins/);
    assert.match(sql, /ALTER TABLE public\.parent_pins ENABLE ROW LEVEL SECURITY/);
    assert.match(sql, /REVOKE ALL ON TABLE public\.parent_pins FROM anon, authenticated/);
    assert.doesNotMatch(sql, /CREATE POLICY/);
    assert.match(read('src/student/components/WatchLessonButton.tsx'), /ParentPinDialog/);
    assert.match(read('src/classroom/ClassroomGate.tsx'), /x-parent-proof/);
    assert.match(read('src/student/pages/StudentProfilePage.tsx'), /<ParentPinSetting /);
  });
});

describe('CL-22 forgotten PIN: emailed one-time code', () => {
  let server: http.Server;
  let base: string;
  let clock = Date.parse('2026-11-20T12:00:00Z');
  const sent: Array<{ to: string; text: string }> = [];
  let mailOk = true;
  const db = fakeDb({ parent_pins: [{ user_id: PARENT, pin_hash: hashPin('1111'), failed_count: 0, locked_until: new Date(clock + 600_000).toISOString() }] });

  before(async () => {
    const app = express();
    app.use(express.json());
    registerParentPinRoutes(app, {
      getClient: () => db,
      verifyStudentAuth: (req: any, _res: any, next: any) => { req.studentUser = { auth_id: PARENT, email: 'ahmed@example.com' }; next(); },
      rateLimit: (_q: any, _s: any, next: any) => next(),
      secret: () => SECRET,
      now: () => clock,
      sendEmail: async (o) => { sent.push({ to: o.to, text: o.text }); return { success: mailOk }; },
    });
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  const post = (path: string, body: unknown = {}) => fetch(`${base}/api/student/parent-pin/reset/${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const lastCode = () => /(\d{6})/.exec(sent[sent.length - 1].text)![1];
  const row = () => db.tables.parent_pins[0];

  it('emails a 6-digit code to the account email only, stores only its hash, once a minute', async () => {
    const r = await post('request', { email: 'attacker@evil.test' });
    assert.strictEqual(r.status, 200);
    assert.strictEqual((await r.json()).to, 'ah***@example.com');
    assert.strictEqual(sent[0].to, 'ahmed@example.com');
    assert.ok(!JSON.stringify(row()).includes(lastCode()), 'the code is never stored plainly');
    assert.strictEqual((await post('request')).status, 429);
  });

  it('a wrong code counts down; the 5th wrong try ends the code', async () => {
    for (let i = 1; i <= 4; i++) {
      const r = await post('confirm', { code: '000000', pin: '2222' });
      assert.strictEqual(r.status, 401);
      assert.strictEqual((await r.json()).attemptsLeft, 5 - i);
    }
    assert.strictEqual((await post('confirm', { code: '000000', pin: '2222' })).status, 410);
    assert.strictEqual(row().reset_code_hash, null);
  });

  it('a right code sets the new PIN, clears the lockout, gives a proof, and works only once', async () => {
    clock += 61_000;
    assert.strictEqual((await post('request')).status, 200);
    const code = lastCode();
    assert.strictEqual((await post('confirm', { code, pin: '12' })).status, 400);
    const ok = await post('confirm', { code, pin: '2222' });
    assert.strictEqual(ok.status, 200);
    assert.ok(verifyParentProof((await ok.json()).proof, PARENT, SECRET, clock));
    assert.ok(pinMatches('2222', row().pin_hash));
    assert.strictEqual(row().locked_until, null);
    assert.strictEqual((await post('confirm', { code, pin: '3333' })).status, 410, 'single use');
  });

  it('a code ends after 15 minutes; a failed email can be asked again at once', async () => {
    clock += 61_000;
    await post('request');
    const code = lastCode();
    clock += 15 * 60_000 + 1;
    assert.strictEqual((await post('confirm', { code, pin: '4444' })).status, 410);
    mailOk = false;
    assert.strictEqual((await post('request')).status, 502);
    mailOk = true;
    assert.strictEqual((await post('request')).status, 200);
  });
});
