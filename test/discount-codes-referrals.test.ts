import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

/**
 * Discount codes and referrals over HTTP (server/routes/growth.ts, RULES.md §4).
 * The money logic is covered in discounts-engine.test.ts and was checked against the database functions
 * (apply/limits/balance/free checkout/refund/referral) in a rolled-back transaction. Here: access rules,
 * validation, and an admin code's life (create, switch off, delete), cleaned up after.
 */
describe('discount codes and referrals API', () => {
  let server: http.Server;
  let base: string;
  const created: string[] = [];
  before(async () => {
    await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => { base = `http://127.0.0.1:${(server.address() as any).port}`; r(); }); });
  });
  after(async () => {
    for (const id of created) {
      await fetch(`${base}/api/dashboard/admin/discount-codes/${id}`, { method: 'DELETE', headers: { Authorization: 'Bearer dev-super-admin-token' } });
    }
    await new Promise<void>((r) => server.close(() => r()));
  });

  const call = (method: string, path: string, token?: string, body?: object) =>
    fetch(`${base}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });

  it('keeps admin routes for the super admin only', async () => {
    for (const [m, p] of [['GET', '/api/dashboard/admin/discount-codes'], ['GET', '/api/dashboard/admin/referrals'], ['GET', '/api/dashboard/admin/growth-settings']] as const) {
      assert.strictEqual((await call(m, p)).status, 401, p);
      assert.strictEqual((await call(m, p, 'dev-teacher-token')).status, 403, p);
    }
    assert.strictEqual((await call('POST', '/api/dashboard/admin/discount-codes', 'dev-teacher-token', { code: 'X' })).status, 403);
  });

  it('needs a signed-in family for quote and apply', async () => {
    assert.strictEqual((await call('POST', '/api/checkout/quote', undefined, { targetType: 'booking', targetId: 'x' })).status, 401);
    assert.strictEqual((await call('POST', '/api/checkout/apply', undefined, { targetType: 'booking', targetId: 'x' })).status, 401);
    assert.strictEqual((await call('POST', '/api/checkout/quote', 'dev-teacher-token', { targetType: 'booking', targetId: 'x' })).status, 403);
  });

  it('refuses a checkout that is not yours or not real', async () => {
    const bad = await call('POST', '/api/checkout/quote', 'dev-student-token', { targetType: 'nope', targetId: 'x' });
    if (bad.status === 503) return;
    assert.strictEqual(bad.status, 400);
    const missing = await call('POST', '/api/checkout/quote', 'dev-student-token', { targetType: 'booking', targetId: 'WZ-NOT-A-REAL-REF' });
    assert.strictEqual(missing.status, 404);
    const pkg = await call('POST', '/api/checkout/quote', 'dev-student-token', { targetType: 'package', targetId: '00000000-0000-4000-8000-000000000000' });
    assert.strictEqual(pkg.status, 404);
  });

  it('validates new codes', async () => {
    const r = await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', { code: 'a', discount_type: 'percent', value: 10 });
    if (r.status === 503) return;
    assert.strictEqual(r.status, 400);
    assert.strictEqual((await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', { code: 'ZZOK1', discount_type: 'percent', value: 150 })).status, 400);
    assert.strictEqual((await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', { code: 'ZZOK1', discount_type: 'bogus', value: 5 })).status, 400);
    assert.strictEqual((await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', { code: 'ZZOK1', discount_type: 'fixed', value: 5, starts_at: '2026-12-02', ends_at: '2026-12-01' })).status, 400);
  });

  it('creates, lists, switches off and deletes an unused code', async () => {
    const code = `ZZT${Date.now().toString(36).toUpperCase()}`;
    const res = await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', {
      code: code.toLowerCase(), discount_type: 'fixed', value: 3, applies_to: 'lessons', first_purchase_only: true, max_redemptions: 5, note: 'automated test',
    });
    if (res.status === 503) return;
    assert.strictEqual(res.status, 201);
    const { code: row } = await res.json();
    created.push(row.id);
    assert.strictEqual(row.code, code);
    assert.strictEqual(Number(row.value), 3);

    assert.strictEqual((await call('POST', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token', { code, discount_type: 'fixed', value: 3 })).status, 409);

    const list = await (await call('GET', '/api/dashboard/admin/discount-codes', 'dev-super-admin-token')).json();
    const listed = list.codes.find((c: any) => c.id === row.id);
    assert.ok(listed);
    assert.strictEqual(listed.used, 0);

    const off = await call('PATCH', `/api/dashboard/admin/discount-codes/${row.id}`, 'dev-super-admin-token', { is_active: false });
    assert.strictEqual(off.status, 200);
    assert.strictEqual((await off.json()).code.is_active, false);

    assert.strictEqual((await call('DELETE', `/api/dashboard/admin/discount-codes/${row.id}`, 'dev-super-admin-token')).status, 200);
    created.splice(created.indexOf(row.id), 1);
  });

  it('validates program settings', async () => {
    const get = await call('GET', '/api/dashboard/admin/growth-settings', 'dev-super-admin-token');
    if (get.status === 503) return;
    const { settings } = await get.json();
    assert.strictEqual(typeof settings.savings_cap_percent, 'number');
    assert.strictEqual((await call('PUT', '/api/dashboard/admin/growth-settings', 'dev-super-admin-token', { settings: { ...settings, savings_cap_percent: 200 } })).status, 400);
    assert.strictEqual((await call('POST', '/api/dashboard/admin/account-credit', 'dev-super-admin-token', { email: 'x@example.com', amount: 0, note: 'no' })).status, 400);
  });

  it('answers an unknown invite code without leaking anything', async () => {
    const r = await call('GET', '/api/public/referral/NOPE1234');
    if (r.status === 503) return;
    assert.strictEqual(r.status, 200);
    assert.deepStrictEqual(await r.json(), { valid: false });
  });
});
