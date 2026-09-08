import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Task 0.55.4-A: Teacher Auth Failure Observability & Categorization Test Suite', () => {
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
    // Standard baseline environment for tests
    process.env = {
      ...originalEnv,
      NODE_ENV: 'production',
      SUPABASE_URL: 'https://fmwxqyroyxgigvpahpri.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'test-service-role-key-dummy'
    };
  });

  const getUrlString = (url: any): string => {
    if (typeof url === 'string') return url;
    if (url && typeof url.url === 'string') return url.url;
    if (url && typeof url.href === 'string') return url.href;
    return String(url);
  };

  const pgrstMockResponse = (data: any[], options?: any) => {
    let accept = '';
    if (options?.headers) {
      if (typeof options.headers.get === 'function') {
        accept = options.headers.get('Accept') || options.headers.get('accept') || '';
      } else {
        accept = options.headers['Accept'] || options.headers['accept'] || '';
      }
    }

    const isSingleObject = accept.includes('vnd.pgrst.object');
    if (isSingleObject) {
      if (data.length === 0) {
        return {
          ok: false,
          status: 406,
          json: async () => ({
            code: 'PGRST116',
            details: 'The result contains 0 rows',
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned'
          }),
          text: async () => 'JSON object requested, multiple (or no) rows returned',
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      return {
        ok: true,
        status: 200,
        json: async () => data[0],
        text: async () => JSON.stringify(data[0]),
        headers: new Headers({ 'Content-Type': 'application/json' })
      } as any;
    }

    return {
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({
        'Content-Type': 'application/json',
        'Content-Range': `0-${Math.max(0, data.length - 1)}/${data.length}`
      })
    } as any;
  };

  it('Stage 1 [NO_AUTH_HEADER]: returns 401 with x-auth-diagnostic-stage: NO_AUTH_HEADER when header missing', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/today`);
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'NO_AUTH_HEADER');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'NO_AUTH_HEADER');
    assert.ok(body.error.includes('Authorization header missing'));
  });

  it('Stage 2 [INVALID_BEARER_FORMAT]: returns 401 when Authorization header does not use Bearer scheme', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Basic dXNlcm5hbWU6cGFzc3dvcmQ='
      }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'INVALID_BEARER_FORMAT');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'INVALID_BEARER_FORMAT');
    assert.ok(body.error.includes('Expected Bearer token format'));
  });

  it('Stage 3 [DEV_TOKEN_REJECTED_PROD]: strictly rejects dev tokens in production with 401 and DEV_TOKEN_REJECTED_PROD', async () => {
    process.env.NODE_ENV = 'production';

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'DEV_TOKEN_REJECTED_PROD');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'DEV_TOKEN_REJECTED_PROD');
    assert.ok(body.error.includes('strictly forbidden in production'));
  });

  it('Stage 4 [SUPABASE_TOKEN_REJECTED]: returns 401 when Supabase Auth rejects session token', async () => {
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ error: 'invalid_token', message: 'Token is invalid or expired' }),
          text: async () => 'Invalid token',
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer expired-or-invalid-user-token'
      }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'SUPABASE_TOKEN_REJECTED');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'SUPABASE_TOKEN_REJECTED');
    assert.ok(body.error.includes('Invalid or expired session token'));
  });

  it('Stage 5 [TEACHER_NOT_FOUND]: returns 403 when authenticated user is not in teacher_accounts allowlist', async () => {
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'student-uuid-456',
            email: 'unauthorized-student@example.com',
            user_metadata: { full_name: 'Student User' }
          }),
          text: async () => JSON.stringify({ id: 'student-uuid-456', email: 'unauthorized-student@example.com' }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      if (url.includes('/rest/v1/teacher_accounts')) {
        // Not found in teacher_accounts
        return pgrstMockResponse([], init);
      }
      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer valid-user-token'
      }
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'TEACHER_NOT_FOUND');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'TEACHER_NOT_FOUND');
    assert.ok(body.error.includes('Access denied. Account is not authorized'));
  });

  it('Stage 6 [TEACHER_INACTIVE]: returns 403 when teacher account exists but is marked is_active: false', async () => {
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'teacher-uuid-inactive',
            email: 'inactive-teacher@example.com',
            user_metadata: { full_name: 'Inactive Teacher' }
          }),
          text: async () => JSON.stringify({ id: 'teacher-uuid-inactive', email: 'inactive-teacher@example.com' }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ role: 'teacher', is_active: false }], init);
      }
      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer valid-token-for-inactive-teacher'
      }
    });
    assert.strictEqual(res.status, 403);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'TEACHER_INACTIVE');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'TEACHER_INACTIVE');
    assert.ok(body.error.includes('Teacher account is inactive'));
  });

  it('Stage 7 [SUPABASE_CONFIG_MISSING]: returns 503 when backend Supabase configuration is missing', async () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer some-valid-looking-token'
      }
    });
    assert.strictEqual(res.status, 503);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'SUPABASE_CONFIG_MISSING');

    const body = await res.json();
    assert.strictEqual(body.diagnosticStage, 'SUPABASE_CONFIG_MISSING');
    assert.ok(body.error.includes('Database integration is not properly configured'));
  });

  it('Stage 8 [AUTHORIZED]: returns 200 with x-auth-diagnostic-stage: AUTHORIZED for active teacher', async () => {
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'teacher-mahmoud-uuid',
            email: 'mhmwdlwany4222@gmail.com',
            user_metadata: { full_name: 'Ustadh Mahmoud' }
          }),
          text: async () => JSON.stringify({ id: 'teacher-mahmoud-uuid', email: 'mhmwdlwany4222@gmail.com' }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ role: 'super_admin', is_active: true }], init);
      }
      if (url.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([{ id: 'teacher-mahmoud-uuid' }], init);
      }
      if (url.includes('/rest/v1/bookings')) {
        return pgrstMockResponse([], init);
      }
      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer valid-live-token'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'AUTHORIZED');

    const body = await res.json();
    assert.ok(Array.isArray(body.lessons));
  });

  it('Stage 9: /api/integrations/status carries identical diagnostic instrumentation', async () => {
    // Test missing auth on /api/integrations/status
    const resNoAuth = await fetch(`${baseUrl}/api/integrations/status`);
    assert.strictEqual(resNoAuth.status, 401);
    assert.strictEqual(resNoAuth.headers.get('x-auth-diagnostic-stage'), 'NO_AUTH_HEADER');

    // Test authorized on /api/integrations/status
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'teacher-mahmoud-uuid',
            email: 'mhmwdlwany4222@gmail.com',
            user_metadata: { full_name: 'Ustadh Mahmoud' }
          }),
          text: async () => JSON.stringify({ id: 'teacher-mahmoud-uuid', email: 'mhmwdlwany4222@gmail.com' }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ role: 'super_admin', is_active: true }], init);
      }
      if (url.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([{ id: 'teacher-mahmoud-uuid' }], init);
      }
      if (url.includes('/rest/v1/calendar_connections')) {
        return pgrstMockResponse([], init);
      }
      if (url.includes('/rest/v1/zoom_connections')) {
        return pgrstMockResponse([], init);
      }
      if (url.includes('/rest/v1/integration_sync_logs')) {
        return pgrstMockResponse([], init);
      }
      return originalFetch(input, init);
    };

    const resAuth = await fetch(`${baseUrl}/api/integrations/status`, {
      headers: {
        'Authorization': 'Bearer valid-live-token'
      }
    });
    assert.strictEqual(resAuth.status, 200);
    assert.strictEqual(resAuth.headers.get('x-auth-diagnostic-stage'), 'AUTHORIZED');
  });

  it('Stage 10: /api/teacher-auth-diagnostic returns safe diagnostic data with zero secret exposure', async () => {
    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'teacher-mahmoud-uuid',
            email: 'mhmwdlwany4222@gmail.com',
            user_metadata: { full_name: 'Ustadh Mahmoud' }
          }),
          text: async () => JSON.stringify({ id: 'teacher-mahmoud-uuid', email: 'mhmwdlwany4222@gmail.com' }),
          headers: new Headers({ 'Content-Type': 'application/json' })
        } as any;
      }
      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ role: 'super_admin', is_active: true }], init);
      }
      if (url.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([{ id: 'teacher-mahmoud-uuid' }], init);
      }
      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/teacher-auth-diagnostic`, {
      headers: {
        'Authorization': 'Bearer valid-live-token'
      }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-auth-diagnostic-stage'), 'AUTHORIZED');

    const body = await res.json();
    assert.strictEqual(body.diagnostic, true);
    assert.strictEqual(body.authenticated, true);
    assert.strictEqual(body.tokenVerification, 'success');
    assert.strictEqual(body.teacherAuthorization, 'authorized');
    assert.strictEqual(body.supabaseConfig, 'present');

    // Strict safety check: ensure NO tokens, emails, keys, or passwords in diagnostic response
    const jsonStr = JSON.stringify(body);
    assert.ok(!jsonStr.includes('test-service-role-key-dummy'), 'Must not leak service role key');
    assert.ok(!jsonStr.includes('valid-live-token'), 'Must not leak bearer token');
    assert.ok(!jsonStr.includes('password'), 'Must not contain password');
  });

  it('Stage 11: Project consistency header reports MATCH, MISMATCH, or UNKNOWN safely', async () => {
    // 1. MATCH: client project ref matches fmwxqyroyxgigvpahpri
    const resMatch = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });
    assert.strictEqual(resMatch.headers.get('x-project-consistency'), 'MATCH');

    // 2. MISMATCH: client project ref is different (e.g. legacy kpftfmwnwcnkbvfgjfdy)
    const resMismatch = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'x-client-project-ref': 'kpftfmwnwcnkbvfgjfdy'
      }
    });
    assert.strictEqual(resMismatch.headers.get('x-project-consistency'), 'MISMATCH');

    // 3. UNKNOWN: no client ref header sent
    const resUnknown = await fetch(`${baseUrl}/api/dashboard/today`);
    assert.strictEqual(resUnknown.headers.get('x-project-consistency'), 'UNKNOWN');
  });

  it('Stage 12: Zero secret leakage across all headers and error payloads', async () => {
    const res = await fetch(`${baseUrl}/api/dashboard/today`, {
      headers: {
        'Authorization': 'Bearer secret-bearer-token-12345'
      }
    });
    const headersObj: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headersObj[k] = v;
    });

    const bodyText = await res.text();

    // The response headers and body must NEVER contain the secret bearer token
    assert.ok(!JSON.stringify(headersObj).includes('secret-bearer-token-12345'));
    assert.ok(!bodyText.includes('secret-bearer-token-12345'));
  });
});
