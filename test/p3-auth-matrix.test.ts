import { describe, it, before } from 'node:test';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import { qa, skipReason, type Qa } from './helpers/qa.js';
import { listRoutes, fill, type Route } from './helpers/routes.js';

/**
 * P3, AUTH-07: who may call what, for every route the server has (read from the source, so a new route is covered the
 * day it is added). Each guarded route is called with no session and with a real session of the wrong role; the
 * guard answers before the handler runs, so nothing is written. Ids are random and match no row.
 */

const routes = listRoutes();
const id = randomUUID();

describe('P3 permission matrix over every route', () => {
  let q: Qa, tokens: Record<'student' | 'teacher' | 'admin', string>;
  before(async () => {
    const ready = await qa();
    if (!ready) return;
    q = ready;
    const [student, teacher, admin] = await Promise.all([q.tokenFor('student'), q.tokenFor('teacher', 1), q.tokenFor('admin')]);
    tokens = { student, teacher, admin };
  });

  const hit = (r: Route, token: string | null) => q.call(token, r.method === 'ALL' ? 'POST' : r.method, fill(r.path, id), r.method === 'GET' || r.method === 'DELETE' ? undefined : {});
  /** Runs `probe` over the routes ten at a time and returns the lines that broke the rule. */
  const sweep = async (list: Route[], probe: (r: Route) => Promise<string | null>) => {
    const wrong: string[] = [];
    for (let i = 0; i < list.length; i += 10) {
      wrong.push(...(await Promise.all(list.slice(i, i + 10).map(probe))).filter((x): x is string => !!x));
    }
    return wrong;
  };
  const label = (r: Route, status: number) => `${r.method} ${r.path} -> ${status} (${r.file}:${r.line})`;
  const sample = (path: string, method = 'GET') => routes.find(r => r.path === path && r.method === method)!;

  it('the route list is complete enough to trust', () => {
    assert.ok(routes.length >= 280, `only ${routes.length} routes parsed`);
    for (const guard of ['admin', 'teacher', 'student', 'signed', 'open'] as const) assert.ok(routes.some(r => r.guard === guard), guard);
  });

  it('every guarded route answers 401 to a caller with no session', async (t) => {
    if (!q) return t.skip(skipReason);
    const wrong = await sweep(routes.filter(r => r.guard !== 'open'), async (r) => {
      const res = await hit(r, null);
      return res.status === 401 ? null : label(r, res.status);
    });
    assert.deepStrictEqual(wrong, []);
  });

  it('every super-admin route refuses a teacher and a family', async (t) => {
    if (!q) return t.skip(skipReason);
    const admin = routes.filter(r => r.guard === 'admin');
    for (const role of ['teacher', 'student'] as const) {
      const wrong = await sweep(admin, async (r) => {
        const res = await hit(r, tokens[role]);
        return res.status === 403 ? null : `${role}: ${label(r, res.status)}`;
      });
      assert.deepStrictEqual(wrong, []);
    }
  });

  it('every teacher route refuses a family, and every family route refuses a teacher', async (t) => {
    if (!q) return t.skip(skipReason);
    const asFamily = await sweep(routes.filter(r => r.guard === 'teacher'), async (r) => {
      const res = await hit(r, tokens.student);
      return res.status === 403 ? null : `family: ${label(r, res.status)}`;
    });
    const asTeacher = await sweep(routes.filter(r => r.guard === 'student'), async (r) => {
      const res = await hit(r, tokens.teacher);
      return res.status === 403 ? null : `teacher: ${label(r, res.status)}`;
    });
    assert.deepStrictEqual([...asFamily, ...asTeacher], []);
  });

  it('a route with no guard on its line gives a stranger nothing private and never crashes on an empty call', async (t) => {
    if (!q) return t.skip(skipReason);
    // Public by design: catalogue, availability, launch state, public reviews and keys. Everything else must refuse.
    const publicRead = new Set(['/api/health', '/api/packages', '/api/integrations/availability', '/api/teacher-photos', '/api/geo', '/api/intake/opening', '/api/push/public-key', '/api/reviews', '/api/public/launch', '/api/public/referral/:code']);
    const wrong = await sweep(routes.filter(r => r.guard === 'open'), async (r) => {
      const res = await hit(r, null);
      if (res.status >= 500 && res.status !== 503) return `crash: ${label(r, res.status)}`;
      if (res.ok && !publicRead.has(r.path)) return `answered a stranger: ${label(r, res.status)} ${res.text.slice(0, 80)}`;
      return null;
    });
    assert.deepStrictEqual(wrong, []);
  });

  it('a broken, empty or foreign token is a caller with no session', async (t) => {
    if (!q) return t.skip(skipReason);
    const samples = [sample('/api/dashboard/payments'), sample('/api/dashboard/today'), sample('/api/student/bookings'), sample('/api/chat/threads')];
    const forged = `${Buffer.from('{"alg":"none"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: id, role: 'service_role', email: 'x@y.z', exp: 4102444800 })).toString('base64url')}.`;
    for (const token of ['', 'null', 'undefined', forged, tokens.admin.slice(0, -4) + 'AAAA', 'kid_' + 'A'.repeat(43), `${tokens.admin} extra`]) {
      for (const r of samples) {
        const res = await hit(r, token);
        assert.ok(res.status === 401 || res.status === 403, `${JSON.stringify(token.slice(0, 16))} on ${label(r, res.status)}`);
      }
    }
    // A session sent in the wrong place (query string, cookie) is not a session.
    const inQuery = await fetch(`${q.base}/api/dashboard/payments?access_token=${tokens.admin}&token=${tokens.admin}`, { headers: { Cookie: `sb-access-token=${tokens.admin}`, 'x-real-ip': '10.9.9.9' } });
    assert.strictEqual(inQuery.status, 401);
  });

  it('on a production deployment no development token or header opens anything', async (t) => {
    if (!q) return t.skip(skipReason);
    const samples = [sample('/api/dashboard/payments'), sample('/api/dashboard/today'), sample('/api/student/bookings')];
    const saved = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = 'production';
    try {
      for (const token of ['dev-super-admin-token', 'dev-teacher-token', 'dev-student-token', 'dev-student-b-token', 'dev-guardian-student-token', 'dev-inactive-teacher-token']) {
        for (const r of samples) {
          const res = await hit(r, token);
          assert.ok(res.status === 401 || res.status === 403, `${token} on ${label(r, res.status)}`);
        }
      }
      for (const r of samples) {
        const res = await fetch(`${q.base}${r.path}`, { headers: { 'x-dev-teacher-auth': 'true', 'x-real-ip': '10.9.9.8' } });
        assert.strictEqual(res.status, 401, `x-dev-teacher-auth on ${r.path}`);
      }
    } finally {
      process.env.VERCEL_ENV = saved;
    }
  });
});
