import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../api/index.js';
import { scrubErrorText, pathOnly, cronStatus, countStatus, clientErrorRateLimited } from '../server/routes/ops.js';

describe('OPS: error capture and system health', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        baseUrl = `http://127.0.0.1:${(server.address() as any).port}`;
        resolve();
      });
    });
  });

  after(async () => {
    // Tests run against the real database: remove the rows this file created.
    for (const message of ['OPS test error', 'OPS flood']) {
      const fp = crypto.createHash('md5').update(`client|${message}`).digest('hex');
      await fetch(`${baseUrl}/api/dashboard/app-errors/${fp}`, { method: 'DELETE', headers: { Authorization: 'Bearer dev-super-admin-token' } });
    }
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('scrubs query strings, emails and tokens from error text', () => {
    const out = scrubErrorText('Failed https://x.academy/book?email=a@b.com&t=1#h for parent@mail.co token eyJabc.def.ghi at /api/x?learnerId=9');
    assert.ok(!out.includes('?'), out);
    assert.ok(!out.includes('a@b.com') && !out.includes('parent@mail.co'), out);
    assert.ok(out.includes('[email]') && out.includes('[token]'), out);
    assert.ok(out.includes('https://x.academy/book') && out.includes('/api/x'), out);
    assert.strictEqual(scrubErrorText("Cannot read properties of undefined (reading 'id')"), "Cannot read properties of undefined (reading 'id')");
  });

  it('keeps only the path of a URL', () => {
    assert.strictEqual(pathOnly('/student/progress?learnerId=1#x'), '/student/progress');
    assert.strictEqual(pathOnly(42), null);
  });

  it('rates the cron by its last run', () => {
    const now = Date.parse('2026-10-20T12:00:00Z');
    assert.strictEqual(cronStatus(null, now), 'red');
    assert.strictEqual(cronStatus('2026-10-20T11:50:00Z', now), 'green');
    assert.strictEqual(cronStatus('2026-10-20T11:00:00Z', now), 'amber');
    assert.strictEqual(cronStatus('2026-10-20T09:59:00Z', now), 'red');
    assert.strictEqual(countStatus(0, 1, 5), 'green');
    assert.strictEqual(countStatus(2, 1, 5), 'amber');
    assert.strictEqual(countStatus(5, 1, 5), 'red');
  });

  it('limits error reports per IP', () => {
    const now = Date.now();
    for (let i = 0; i < 10; i++) assert.strictEqual(clientErrorRateLimited('203.0.113.7', now), false);
    assert.strictEqual(clientErrorRateLimited('203.0.113.7', now), true);
    assert.strictEqual(clientErrorRateLimited('203.0.113.8', now), false);
    assert.strictEqual(clientErrorRateLimited('203.0.113.7', now + 61_000), false);
  });

  it('accepts a client error, rejects an empty one and refuses a flood', async () => {
    const post = (body: object) => fetch(`${baseUrl}/api/client-errors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Real-IP': '198.51.100.23' },
      body: JSON.stringify(body)
    });
    assert.strictEqual((await post({ message: '' })).status, 400);
    assert.strictEqual((await post({ message: 'OPS test error', path: '/x?y=1' })).status, 204);
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) statuses.push((await post({ message: 'OPS flood' })).status);
    assert.ok(statuses.includes(429), `expected a 429, got ${statuses.join(',')}`);
  });

  it('keeps the health page and error list for the super admin only', async () => {
    assert.strictEqual((await fetch(`${baseUrl}/api/dashboard/health`)).status, 401);
    const asTeacher = await fetch(`${baseUrl}/api/dashboard/app-errors`, { headers: { Authorization: 'Bearer dev-teacher-token' } });
    assert.strictEqual(asTeacher.status, 403);

    const res = await fetch(`${baseUrl}/api/dashboard/health`, { headers: { Authorization: 'Bearer dev-super-admin-token' } });
    assert.strictEqual(res.status, 200);
    const body: any = await res.json();
    assert.strictEqual(typeof body.placementBeforeBooking, 'boolean');
    const keys = body.checks.map((c: any) => c.key);
    for (const k of ['cron', 'email_last_sent', 'email_failed_24h', 'integration_jobs_pending', 'zoom_calendar_failures_24h', 'calendar_tokens', 'stripe_webhook', 'app_errors_24h']) {
      assert.ok(keys.includes(k), `missing check ${k}`);
    }
    for (const c of body.checks) assert.ok(['green', 'amber', 'red'].includes(c.status), `${c.key}: ${c.status}`);
  });
});
