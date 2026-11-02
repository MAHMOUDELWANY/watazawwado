import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import app from '../api/index.js';
import { authenticateChildDevice, hashSecret, isChildRoute, newDeviceToken, newLinkCode, KID_TOKEN_PREFIX } from '../server/routes/childDevices.js';

const OWNER = '11111111-2222-3333-4444-555555555555';
const CHILD = '22222222-2222-3333-4444-555555555555';

/** A fake Supabase client: child_devices finds a device only for `token`; students returns the parent. */
function fakeClient(token: string) {
  const q = (table: string) => {
    const filters: Record<string, any> = {};
    const b: any = {
      select: () => b, is: () => b, update: () => b,
      eq: (c: string, v: any) => { filters[c] = v; return b; },
      maybeSingle: async () => {
        if (table === 'child_devices') return { data: filters.token_hash === hashSecret(token) ? { id: 'd1', owner_user_id: OWNER, learner_id: CHILD, last_seen_at: new Date().toISOString() } : null };
        return { data: { id: OWNER, name: 'Parent', email: 'Parent@Example.com', learner_type: 'adult' } };
      },
    };
    return b;
  };
  return { from: q };
}

function run(token: string, method: string, url: string, linked = token) {
  const req: any = { method, originalUrl: url };
  let status = 200; let nextCalled = false;
  const res: any = { status: (s: number) => { status = s; return res; }, json: () => res };
  return authenticateChildDevice(fakeClient(linked), req, res, () => { nextCalled = true; }, token).then(() => ({ req, status, nextCalled }));
}

describe('NX-16 child phone', () => {
  it('codes are 10 digits and tokens are long and prefixed', () => {
    for (let i = 0; i < 50; i++) assert.match(newLinkCode(), /^\d{10}$/);
    const t = newDeviceToken();
    assert.ok(t.startsWith(KID_TOKEN_PREFIX) && t.length > 40);
    assert.notStrictEqual(newDeviceToken(), t);
  });

  it('a child phone may call only its own few routes', () => {
    assert.strictEqual(isChildRoute('GET', '/api/kid/me'), true);
    assert.strictEqual(isChildRoute('GET', '/api/student/homework'), true);
    assert.strictEqual(isChildRoute('POST', '/api/student/review/abc'), true);
    assert.strictEqual(isChildRoute('GET', '/api/student/lesson-room/abc'), true);
    for (const [m, p] of [['GET', '/api/student/packages'], ['GET', '/api/student/bookings'], ['POST', '/api/checkout'], ['GET', '/api/student/profile'],
      ['POST', '/api/student/child-devices'], ['DELETE', '/api/student/child-devices/x'], ['GET', '/api/student/homework/../packages'], ['DELETE', '/api/student/homework']]) {
      assert.strictEqual(isChildRoute(m, p), false, `${m} ${p}`);
    }
  });

  it('a linked phone acts as the parent, narrowed to one child', async () => {
    const token = newDeviceToken();
    const ok = await run(token, 'GET', '/api/student/homework?learnerId=x');
    assert.strictEqual(ok.nextCalled, true);
    assert.strictEqual(ok.req.studentUser.auth_id, OWNER);
    assert.strictEqual(ok.req.studentUser.email, 'parent@example.com');
    assert.deepStrictEqual(ok.req.childDevice, { id: 'd1', learnerId: CHILD });
  });

  it('a removed phone or a grown-up route is refused before anything runs', async () => {
    const token = newDeviceToken();
    const gone = await run(newDeviceToken(), 'GET', '/api/kid/me', token);
    assert.strictEqual(gone.status, 401); assert.strictEqual(gone.nextCalled, false);
    const blocked = await run(token, 'GET', '/api/student/packages');
    assert.strictEqual(blocked.status, 403); assert.strictEqual(blocked.nextCalled, false);
  });

  it('the table is server-only and stores hashes, not codes or tokens', () => {
    const sql = fs.readFileSync('supabase/migrations/20261102000001_child_devices.sql', 'utf8');
    assert.match(sql, /REVOKE ALL ON public\.child_devices FROM anon, authenticated/);
    assert.match(sql, /code_hash TEXT/); assert.match(sql, /token_hash TEXT UNIQUE/);
    assert.doesNotMatch(sql, /\bcode TEXT|\btoken TEXT/);
  });
});

describe('NX-16 endpoints', () => {
  let server: http.Server;
  let base: string;
  before(async () => { await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); }); });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('guests cannot manage phones', async () => {
    assert.strictEqual((await fetch(`${base}/api/student/child-devices`)).status, 401);
    assert.strictEqual((await fetch(`${base}/api/student/child-devices`, { method: 'POST' })).status, 401);
  });

  it('a child token never opens grown-up pages', async () => {
    const r = await fetch(`${base}/api/student/packages`, { headers: { Authorization: `Bearer ${newDeviceToken()}` } });
    assert.strictEqual(r.status, 403);
  });

  it('pairing needs a 10-digit code', async () => {
    const r = await fetch(`${base}/api/kid/pair`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: '12' }) });
    assert.strictEqual(r.status, 400);
  });
});
