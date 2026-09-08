import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Task 0.55.4-B: Vercel Runtime Supabase Configuration Diagnostic Test Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalEnv: NodeJS.ProcessEnv;
  let originalFetch: typeof globalThis.fetch;

  before(async () => {
    originalEnv = { ...process.env };
    originalFetch = globalThis.fetch;

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as any;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  after(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
    server.close();
  });

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('1. Both variables present: reports PRESENT, PRESENT, and adminClient AVAILABLE without authentication', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-synthetic';

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.deepStrictEqual(body, {
      diagnostic: true,
      runtime: 'vercel',
      supabaseUrl: 'PRESENT',
      supabaseServiceRoleKey: 'PRESENT',
      adminClient: 'AVAILABLE'
    });
  });

  it('2. URL missing: reports MISSING, PRESENT, and adminClient UNAVAILABLE', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-synthetic';

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.diagnostic, true);
    assert.strictEqual(body.supabaseUrl, 'MISSING');
    assert.strictEqual(body.supabaseServiceRoleKey, 'PRESENT');
    assert.strictEqual(body.adminClient, 'UNAVAILABLE');
  });

  it('3. Service key missing: reports PRESENT, MISSING, and adminClient UNAVAILABLE', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.diagnostic, true);
    assert.strictEqual(body.supabaseUrl, 'PRESENT');
    assert.strictEqual(body.supabaseServiceRoleKey, 'MISSING');
    assert.strictEqual(body.adminClient, 'UNAVAILABLE');
  });

  it('4. Both missing: reports MISSING, MISSING, and adminClient UNAVAILABLE', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.deepStrictEqual(body, {
      diagnostic: true,
      runtime: 'vercel',
      supabaseUrl: 'MISSING',
      supabaseServiceRoleKey: 'MISSING',
      adminClient: 'UNAVAILABLE'
    });
  });

  it('5. Fallback URL support: respects VITE_SUPABASE_URL when SUPABASE_URL is absent', async () => {
    delete process.env.SUPABASE_URL;
    process.env.VITE_SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key-synthetic';

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.supabaseUrl, 'PRESENT');
    assert.strictEqual(body.supabaseServiceRoleKey, 'PRESENT');
    assert.strictEqual(body.adminClient, 'AVAILABLE');
  });

  it('6. Whitespace handling: handles empty or whitespace-only variables as MISSING', async () => {
    process.env.SUPABASE_URL = '   ';
    delete process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = '   ';

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(res.status, 200);

    const body = await res.json();
    assert.strictEqual(body.supabaseUrl, 'MISSING');
    assert.strictEqual(body.supabaseServiceRoleKey, 'MISSING');
    assert.strictEqual(body.adminClient, 'UNAVAILABLE');
  });

  it('7. Security: strictly ensures zero secret exposure, tokens, cookies, or user identifiers', async () => {
    const sensitiveServiceKey = 'sb_secret_service_role_key_very_confidential_value_xyz';
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = sensitiveServiceKey;

    const res = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    const rawBody = await res.text();
    const headersObj: Record<string, string> = {};
    res.headers.forEach((v, k) => { headersObj[k] = v; });

    // Assert sensitive strings are completely absent
    assert.ok(!rawBody.includes(sensitiveServiceKey), 'Must not contain service-role key');
    assert.ok(!rawBody.includes('fmwxqyroyxgigvpahpri'), 'Must not leak project URL or ref');
    assert.ok(!JSON.stringify(headersObj).includes(sensitiveServiceKey), 'Headers must not contain service key');
    assert.ok(!res.headers.get('set-cookie'), 'Must not set cookies');

    // Assert allowed categorical values only
    const parsed = JSON.parse(rawBody);
    const allowedKeys = ['diagnostic', 'runtime', 'supabaseUrl', 'supabaseServiceRoleKey', 'adminClient'];
    assert.deepStrictEqual(Object.keys(parsed).sort(), allowedKeys.sort());
    assert.ok(['PRESENT', 'MISSING'].includes(parsed.supabaseUrl));
    assert.ok(['PRESENT', 'MISSING'].includes(parsed.supabaseServiceRoleKey));
    assert.ok(['AVAILABLE', 'UNAVAILABLE'].includes(parsed.adminClient));
  });

  it('8. Auth isolation: diagnostic endpoint does NOT bypass auth for protected endpoints', async () => {
    // Calling diagnostic works without auth
    const diagRes = await fetch(`${baseUrl}/api/runtime-supabase-diagnostic`);
    assert.strictEqual(diagRes.status, 200);

    // Calling protected teacher route still requires authentication
    const protectedRes = await fetch(`${baseUrl}/api/dashboard/today`);
    assert.strictEqual(protectedRes.status, 401);
  });
});
