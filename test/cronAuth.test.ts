import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Task 0.33 — Cron Authentication & Endpoint Security Tests', () => {
  let server: http.Server;
  let baseUrl: string;
  const TEST_CRON_SECRET = 'test_cron_secret_secure_token_12345';
  let originalCronSecret: string | undefined;

  before(async () => {
    originalCronSecret = process.env.CRON_SECRET;
    process.env.CRON_SECRET = TEST_CRON_SECRET;

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    process.env.CRON_SECRET = originalCronSecret;
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('1. accepts valid Authorization: Bearer <CRON_SECRET> header', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_CRON_SECRET}`
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.timestamp);
    assert.ok(body.summary);
  });

  it('2. rejects request with missing Authorization header (401)', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST'
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized cron request.');
  });

  it('3. rejects request with incorrect Bearer token (401)', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer wrong_secret_token_value'
      }
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized cron request.');
  });

  it('4. rejects request with malformed or non-Bearer authorization scheme (401)', async () => {
    const nonBearerHeaders = [
      'Basic test_cron_secret_secure_token_12345',
      'Token test_cron_secret_secure_token_12345',
      'Bearer',
      'Bearer    ',
      'Bearer'
    ];

    for (const authVal of nonBearerHeaders) {
      const res = await fetch(`${baseUrl}/api/cron/process-reminders`, {
        method: 'POST',
        headers: {
          'Authorization': authVal
        }
      });
      assert.strictEqual(res.status, 401, `Failed for Authorization: ${authVal}`);
      const body = await res.json();
      assert.strictEqual(body.error, 'Unauthorized cron request.');
    }
  });

  it('5. strictly rejects query-string secret without valid Bearer header (401)', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders?secret=${TEST_CRON_SECRET}`, {
      method: 'GET'
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Unauthorized cron request.');
  });

  it('6. ensures secret value is never returned in response body or error payloads', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders?secret=${TEST_CRON_SECRET}`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer invalid_value'
      }
    });
    const text = await res.text();
    assert.strictEqual(text.includes(TEST_CRON_SECRET), false);
    assert.strictEqual(text.includes('invalid_value'), false);
  });

  it('7. external scheduler invocation executes safely and returns valid summary DTO', async () => {
    const res = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_CRON_SECRET}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitHub-Actions-Scheduler/1.0'
      }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(typeof body.timestamp, 'string');
    assert.strictEqual(typeof body.summary, 'object');
    assert.strictEqual(typeof body.summary.processed, 'number');
    assert.strictEqual(typeof body.summary.sent24h, 'number');
    assert.strictEqual(typeof body.summary.sent1h, 'number');
    assert.strictEqual(typeof body.summary.skipped, 'number');
  });

  it('8. repeated sequential scheduler invocations remain idempotent without duplicating runs', async () => {
    const res1 = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_CRON_SECRET}`
      }
    });
    assert.strictEqual(res1.status, 200);

    const res2 = await fetch(`${baseUrl}/api/cron/process-reminders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TEST_CRON_SECRET}`
      }
    });
    assert.strictEqual(res2.status, 200);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, true);
  });
});
