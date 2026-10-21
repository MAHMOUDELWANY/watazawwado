import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import { DateTime } from 'luxon';
import app from '../api/index.js';
import { studentCancelBlock, studentRescheduleBlock } from '../server/booking/studentWindows.js';
import { isOnLaterDay } from '../server/integrations/availabilityEngine.js';

/**
 * QA-01: smoke tests for the money paths. The local server shares the production database, and a real booking would
 * make the production cron create a Zoom meeting, a teacher calendar event and emails. So every request here stops
 * before the first write: auth gates, validation, the payment gate and the window rules. Booking ids are random
 * UUIDs that match no row. The full write path (booking → Stripe test checkout → webhook) needs a separate test
 * database; see docs/backlog/LOG.md QA-01.
 */

const NOW = DateTime.fromISO('2026-11-02T12:00:00Z');
const at = (hours: number) => NOW.plus({ hours }).toISO()!;
const NO_SUCH_BOOKING = '00000000-0000-4000-8000-000000000000';

describe('QA-01 window rules (RULES.md §2/§5)', () => {
  it('a free trial can be cancelled up to 1 hour before, other lessons up to 3 hours before', () => {
    assert.strictEqual(studentCancelBlock({ status: 'confirmed', booking_type: 'trial', scheduled_start: at(1.5) }, NOW), null);
    assert.strictEqual(studentCancelBlock({ status: 'confirmed', booking_type: 'trial', scheduled_start: at(0.5) }, NOW)?.code, 'TOO_LATE');
    assert.strictEqual(studentCancelBlock({ status: 'confirmed', booking_type: 'regular', scheduled_start: at(3) }, NOW), null);
    assert.strictEqual(studentCancelBlock({ status: 'confirmed', booking_type: 'regular', scheduled_start: at(2.9) }, NOW)?.code, 'TOO_LATE');
  });

  it('any confirmed lesson can be moved up to 1 hour before; a trial only once', () => {
    assert.strictEqual(studentRescheduleBlock({ status: 'confirmed', booking_type: 'regular', scheduled_start: at(1) }, NOW), null);
    assert.strictEqual(studentRescheduleBlock({ status: 'rescheduled', booking_type: 'regular', scheduled_start: at(0.9) }, NOW)?.code, 'TOO_LATE');
    assert.strictEqual(studentRescheduleBlock({ status: 'confirmed', booking_type: 'trial', scheduled_start: at(48), reschedule_count: 1 }, NOW)?.code, 'TRIAL_RESCHEDULE_USED');
    assert.strictEqual(studentRescheduleBlock({ status: 'confirmed', booking_type: 'trial', scheduled_start: at(48), reschedule_count: 0 }, NOW), null);
  });

  it('an unpaid (pending) or finished lesson can be neither moved nor cancelled by the student', () => {
    for (const status of ['pending', 'cancelled', 'completed', 'no_show']) {
      assert.ok(studentCancelBlock({ status, booking_type: 'regular', scheduled_start: at(72) }, NOW), status);
      assert.ok(studentRescheduleBlock({ status, booking_type: 'regular', scheduled_start: at(72) }, NOW), status);
    }
  });

  it('a moved lesson lands on a later day in the student time zone, never the same day', () => {
    const tz = 'America/New_York';
    const endOfTodayThere = DateTime.now().setZone(tz).endOf('day').minus({ minutes: 1 }).toUTC();
    const tomorrowThere = DateTime.now().setZone(tz).plus({ days: 1 }).startOf('day').plus({ hours: 10 }).toUTC();
    assert.strictEqual(isOnLaterDay(endOfTodayThere, tz), false);
    assert.strictEqual(isOnLaterDay(tomorrowThere, tz), true);
  });

  it('the student routes use these rules, and a teacher must give a reason before any move is written', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(api.includes('studentRescheduleBlock(booking)') && api.includes('studentCancelBlock(booking)'));
    const move = api.slice(api.indexOf('// 2. Transactional Reschedule Path'));
    assert.ok(move.indexOf("code: 'REASON_REQUIRED'") > 0 && move.indexOf("code: 'REASON_REQUIRED'") < move.indexOf('.rpc('), 'reason check comes before the RPC');
    assert.ok(api.includes("if (!isAdminActor && status === 'cancelled')"), 'only the super admin cancels');
  });
});

describe('QA-01 money paths over HTTP (no writes)', () => {
  let server: http.Server;
  let base: string;
  let ip = 0;
  // Each request comes from its own test address so the 10-per-minute limiter never interferes.
  const call = (path: string, init: { method?: string; token?: string; body?: unknown } = {}) =>
    fetch(`${base}${path}`, {
      method: init.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-real-ip': `198.51.100.${++ip}`,
        ...(init.token ? { Authorization: `Bearer ${init.token}` } : {})
      },
      body: init.body === undefined ? undefined : JSON.stringify(init.body)
    });

  before(async () => {
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => { await new Promise<void>((r) => server.close(() => r())); });

  it('booking creation rejects bad input before touching the database', async () => {
    const valid = {
      serviceId: 'quran-reading', duration: 30, mode: 'trial', timezone: 'Europe/London', contactName: 'QA Test',
      contactEmail: 'qa@example.com', date: '2030-01-01', timeSlot: { utcStartIso: '2030-01-01T10:00:00Z' }
    };
    const cases: Array<[Record<string, unknown>, RegExp]> = [
      [{ duration: 90 }, /30, 45 or 60/],
      [{ duration: 60 }, /free trial can be at most 45/],
      [{ timezone: 'Mars/Olympus' }, /Invalid timezone/],
      [{ contactEmail: 'not-an-email' }, /valid email/],
      [{ contactName: 'Q' }, /name is required/],
      [{ audience: 'child', parentName: '' }, /Parent or guardian name/],
      [{ timeSlot: {} }, /time slot/]
    ];
    for (const [patch, message] of cases) {
      const r = await call('/api/bookings/create', { method: 'POST', body: { ...valid, ...patch } });
      if (r.status === 503) return; // no database configured
      assert.strictEqual(r.status, 400, JSON.stringify(patch));
      assert.match(((await r.json()) as any).error, message);
    }
  });

  it('checkout: only Stripe, only a known booking, and the amount never comes from the browser', async () => {
    let r = await call('/api/payments/create-intent', { method: 'POST', body: { gateway: 'paypal', targetType: 'booking', targetId: NO_SUCH_BOOKING } });
    assert.strictEqual(r.status, 400);
    r = await call('/api/payments/create-intent', { method: 'POST', body: { gateway: 'stripe' } });
    assert.strictEqual(r.status, 400);
    r = await call('/api/payments/create-intent', { method: 'POST', body: { gateway: 'stripe', targetType: 'booking', targetId: NO_SUCH_BOOKING, amount: 0.01 } });
    if (r.status !== 503) assert.strictEqual(r.status, 404);
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const route = api.slice(api.indexOf("app.post('/api/payments/create-intent'"), api.indexOf("app.post('/api/payments/stripe/verify'"));
    assert.ok(!/req\.body\.(amount|price|fee)/.test(route) && !/\b(amount|price|fee)\b[^\n]*=\s*req\.body/.test(route), 'no amount read from the request');
  });

  it('a payment is confirmed only by a verified Stripe session or a signed webhook', async () => {
    let r = await call('/api/payments/stripe/verify', { method: 'POST', body: { sessionId: 'cs_test_not_real', referenceCode: 'NOPE' } });
    assert.ok(r.status >= 400 && r.status < 600, `verify must not succeed (${r.status})`);
    r = await call('/api/payments/stripe/webhook', { method: 'POST', body: { type: 'checkout.session.completed', data: { object: {} } } });
    assert.ok([400, 503].includes(r.status), `unsigned webhook must be refused (${r.status})`);
  });

  it('student money routes need a signed-in student; teachers are refused', async () => {
    const routes: Array<[string, string]> = [
      ['GET', '/api/student/packages'],
      ['POST', `/api/student/bookings/${NO_SUCH_BOOKING}/cancel`],
      ['POST', `/api/student/bookings/${NO_SUCH_BOOKING}/reschedule`],
      ['POST', '/api/bookings/NOPE-0000/pay-later'],
      ['POST', '/api/student/packages/select'],
      ['POST', `/api/student/credits/${NO_SUCH_BOOKING}/refund-request`]
    ];
    for (const [method, path] of routes) {
      assert.strictEqual((await call(path, { method, body: method === 'POST' ? {} : undefined })).status, 401, `${method} ${path} without a token`);
      assert.strictEqual((await call(path, { method, token: 'dev-teacher-token', body: method === 'POST' ? {} : undefined })).status, 403, `${method} ${path} as a teacher`);
    }
  });

  it("a student cannot cancel or move a lesson that is not theirs (unknown id → 404, nothing written)", async () => {
    for (const action of ['cancel', 'reschedule']) {
      const r = await call(`/api/student/bookings/${NO_SUCH_BOOKING}/${action}`, { method: 'POST', token: 'dev-student-token', body: {} });
      if (r.status === 503) return;
      assert.strictEqual(r.status, 404, action);
    }
  });

  it('the packages page data comes from the server catalogue', async () => {
    const r = await call('/api/student/packages', { token: 'dev-student-token' });
    if (r.status === 503) return;
    assert.strictEqual(r.status, 200);
    const body: any = await r.json();
    assert.ok(Array.isArray(body.catalog) && Array.isArray(body.entitlements));
  });

  it('refunds and pay-later are admin only; the refund action is hidden from teachers', async () => {
    for (const [method, path] of [['GET', '/api/dashboard/refund-requests'], ['GET', '/api/dashboard/pay-later'], ['POST', `/api/dashboard/payments/${NO_SUCH_BOOKING}/refund`]] as const) {
      assert.strictEqual((await call(path, { method, token: 'dev-teacher-token', body: method === 'POST' ? {} : undefined })).status, 403, `${method} ${path}`);
    }
    const r = await call('/api/dashboard/refund-requests', { token: 'dev-super-admin-token' });
    if (r.status !== 503) assert.strictEqual(r.status, 200);
  });

  it('teacher dashboard responses carry no money', async () => {
    const moneyKey = /^(fee|fee_amount_usd|price|price_paid|amount|amount_usd|payment|payments|refund\w*|currency)$/i;
    const found: string[] = [];
    const walk = (v: unknown, path: string) => {
      if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
      else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (moneyKey.test(k)) found.push(`${path}.${k}`); walk(x, `${path}.${k}`); }
    };
    for (const path of ['/api/dashboard/today', '/api/dashboard/upcoming']) {
      const r = await call(path, { token: 'dev-teacher-token' });
      if (r.status === 503) continue;
      assert.strictEqual(r.status, 200, path);
      walk(await r.json(), path);
    }
    assert.deepStrictEqual(found, []);
  });
});
