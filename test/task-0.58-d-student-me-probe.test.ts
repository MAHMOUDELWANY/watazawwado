import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from '../api/index.js';

describe('Task 0.58-D: Authenticated /api/student/me Endpoint Probe Suite', () => {
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
        return new Response(JSON.stringify({ message: 'JSON object requested, multiple (or no) rows returned', code: 'PGRST116' }), {
          status: 406,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return new Response(JSON.stringify(data[0]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  };

  it('1. Source inspection: StudentProfilePage implements probeStudentMe using session.access_token', () => {
    const profilePageSource = fs.readFileSync(path.join(process.cwd(), 'src/student/pages/StudentProfilePage.tsx'), 'utf-8');

    // Asserts session.access_token is extracted from effectiveSession
    assert.ok(profilePageSource.includes('effectiveSession?.access_token'), 'Must use effectiveSession.access_token');
    assert.ok(profilePageSource.includes("fetch('/api/student/me'"), 'Must call /api/student/me');
    assert.ok(profilePageSource.includes("method: 'GET'"), 'Must call GET method');
    assert.ok(profilePageSource.includes('Authorization: `Bearer ${token}`'), 'Must attach Authorization Bearer header');

    // Asserts no localStorage / sessionStorage token lookup
    assert.ok(!profilePageSource.includes("localStorage.getItem('token')"), 'No localStorage token extraction');
    assert.ok(!profilePageSource.includes("localStorage.getItem('access_token')"), 'No localStorage access_token extraction');
    assert.ok(!profilePageSource.includes("sessionStorage.getItem('token')"), 'No sessionStorage token extraction');
    assert.ok(!profilePageSource.includes("sessionStorage.getItem('access_token')"), 'No sessionStorage access_token extraction');

    // Asserts token is not stored in state or rendered in JSON
    assert.ok(!profilePageSource.includes('token: data.token'), 'Must not store raw tokens in probe result');
    assert.ok(!profilePageSource.includes('token: token'), 'Must not store raw tokens in probe state');
  });

  it('2. Direct probe request without Bearer token fails closed (401)', async () => {
    const res = await fetch(`${baseUrl}/api/student/me`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Authentication required. Authorization header missing.');
  });

  it('3. Authenticated probe with valid session token calls GET /api/student/me and receives 200 with safe body', async () => {
    const mockAuthUser = {
      id: 'auth-student-me-probe-123',
      email: 'probestudentme@example.com',
      user_metadata: { full_name: 'Probe Student Me' }
    };

    const mockStudent = {
      id: 'stu-probe-me-456',
      name: 'Probe Student Me',
      email: 'probestudentme@example.com',
      whatsapp: '+1234567890',
      country: 'Canada',
      timezone: 'America/Toronto',
      learner_type: 'adult',
      current_level: 'intermediate',
      status: 'active',
      auth_user_id: 'auth-student-me-probe-123',
      booking_preference: 'self'
    };

    let mutationMethodCalled = false;
    let endpointRequested = '';
    let methodRequested = '';
    let authHeaderSent = '';

    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      const method = init?.method || 'GET';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase()) && !url.includes('/auth/v1/user')) {
        mutationMethodCalled = true;
      }

      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify(mockAuthUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], init);
      }

      if (url.includes('/rest/v1/students')) {
        return pgrstMockResponse([mockStudent], init);
      }

      if (url.includes('/rest/v1/guardians')) {
        return pgrstMockResponse([], init);
      }

      if (url.includes('/rest/v1/student_goals')) {
        return pgrstMockResponse([], init);
      }

      return originalFetch(input, init);
    };

    const rawSecretToken = 'secret-supabase-jwt-token-probe-abc123';
    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${rawSecretToken}`
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();

    // Verify response structure expected by probe
    assert.strictEqual(typeof data, 'object');
    assert.ok(data.id, 'Expected id in profile response');
    assert.strictEqual(data.id, 'stu-probe-me-456');
    assert.strictEqual(data.name, 'Probe Student Me');
    assert.strictEqual(data.email, 'probestudentme@example.com');
    assert.strictEqual(data.guardian, null);
    assert.ok(Array.isArray(data.goals), 'Expected goals array in response');

    // Diagnostic headers
    assert.strictEqual(res.headers.get('x-student-auth-verified'), 'true');
    assert.strictEqual(res.headers.get('x-student-record-found'), 'true');
    assert.strictEqual(res.headers.get('x-student-has-student-id'), 'true');

    // Token safety: ensure the returned payload does NOT contain the raw JWT token or any sensitive secret
    const serialized = JSON.stringify(data);
    assert.ok(!serialized.includes(rawSecretToken), 'Raw access token must never appear in response');
    assert.ok(!serialized.includes('test-service-role-key-dummy'), 'Service role key must never appear in response');

    // Diagnostic read-only safety: ensure no DB mutations were triggered
    assert.strictEqual(mutationMethodCalled, false, 'Probe GET /api/student/me must be strictly read-only');
  });

  it('4. If student record is unlinked, returns 404 with exact JSON body and branch header', async () => {
    const mockAuthUser = {
      id: 'auth-unlinked-student-me-777',
      email: 'unlinked@example.com',
      user_metadata: { full_name: 'Unlinked Student' }
    };

    globalThis.fetch = async (input: any, init?: any) => {
      const url = getUrlString(input);
      if (url.includes('/auth/v1/user')) {
        return new Response(JSON.stringify(mockAuthUser), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], init);
      }

      if (url.includes('/rest/v1/students')) {
        return pgrstMockResponse([], init);
      }

      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/student/me`, {
      method: 'GET',
      headers: {
        Authorization: 'Bearer valid-jwt-for-unlinked-user'
      }
    });

    assert.strictEqual(res.status, 404);
    const body = await res.json();
    assert.strictEqual(body.error, 'Student profile not found.');
    assert.strictEqual(res.headers.get('x-student-me-branch'), 'BRANCH_A_NO_STUDENT_ID');
  });
});
