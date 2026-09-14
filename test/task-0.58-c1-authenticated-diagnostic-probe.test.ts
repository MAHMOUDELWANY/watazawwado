import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import app from '../api/index.js';

describe('Task 0.58-C1: Authenticated Production Diagnostic Probe Suite', () => {
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

  it('1. Source inspection: StudentProfilePage uses session.access_token without storage fallback', () => {
    const profilePageSource = fs.readFileSync(path.join(process.cwd(), 'src/student/pages/StudentProfilePage.tsx'), 'utf-8');

    // Asserts session.access_token is extracted from effectiveSession
    assert.ok(profilePageSource.includes('effectiveSession?.access_token'), 'Must use effectiveSession.access_token');
    assert.ok(profilePageSource.includes('/api/student-auth-diagnostic'), 'Must call /api/student-auth-diagnostic endpoint');
    assert.ok(profilePageSource.includes('Authorization: `Bearer ${token}`'), 'Must attach Authorization Bearer header');

    // Asserts no localStorage / sessionStorage token lookup
    assert.ok(!profilePageSource.includes("localStorage.getItem('token')"), 'No localStorage token extraction');
    assert.ok(!profilePageSource.includes("localStorage.getItem('access_token')"), 'No localStorage access_token extraction');
    assert.ok(!profilePageSource.includes("sessionStorage.getItem('token')"), 'No sessionStorage token extraction');
    assert.ok(!profilePageSource.includes("sessionStorage.getItem('access_token')"), 'No sessionStorage access_token extraction');

    // Asserts token is not stored in state or rendered in JSON
    assert.ok(!profilePageSource.includes('token: data.token'), 'Must not store raw tokens');
    assert.ok(!profilePageSource.includes('token: token'), 'Must not store raw tokens in result state');
  });

  it('2. Direct probe request without Bearer token fails closed (401)', async () => {
    const res = await fetch(`${baseUrl}/api/student-auth-diagnostic`);
    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error, 'Authentication required. Authorization header missing.');
  });

  it('3. Authenticated probe with valid session token returns safe diagnostic payload', async () => {
    const mockAuthUser = {
      id: 'auth-student-probe-123',
      email: 'probestudent@example.com',
      user_metadata: { full_name: 'Probe Student' }
    };

    const mockStudent = {
      id: 'stu-probe-456',
      name: 'Probe Student',
      email: 'probestudent@example.com',
      timezone: 'America/New_York',
      learner_type: 'adult',
      current_level: 'intermediate',
      status: 'active',
      auth_user_id: 'auth-student-probe-123'
    };

    let mutationMethodCalled = false;

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

      return originalFetch(input, init);
    };

    const rawSecretToken = 'secret-supabase-jwt-token-xyz789';
    const res = await fetch(`${baseUrl}/api/student-auth-diagnostic`, {
      headers: {
        Authorization: `Bearer ${rawSecretToken}`,
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();

    // Verify response structure
    assert.strictEqual(data.diagnostic, true);
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.tokenVerification, 'success');
    assert.strictEqual(data.studentAuthorization, 'authorized');
    assert.strictEqual(data.backendProjectRef, 'fmwxqyroyxgigvpahpri');
    assert.strictEqual(data.projectConsistency, 'MATCH');
    assert.strictEqual(data.hasStudentUser, true);
    assert.strictEqual(data.hasStudentId, true);
    assert.strictEqual(data.hasStudentProfile, true);
    assert.strictEqual(data.stage, 'STUDENT_AUTHORIZED');

    // Token safety: ensure the returned diagnostic payload does NOT contain the raw JWT token or any sensitive secret
    const serialized = JSON.stringify(data);
    assert.ok(!serialized.includes(rawSecretToken), 'Raw access token must never appear in diagnostic response');
    assert.ok(!serialized.includes('test-service-role-key-dummy'), 'Service role key must never appear in response');

    // Diagnostic read-only safety: ensure no DB mutations were triggered
    assert.strictEqual(mutationMethodCalled, false, 'Diagnostic probe must be strictly read-only');
  });

  it('4. Diagnostic safely reports unlinked student without modifying DB', async () => {
    const mockAuthUser = {
      id: 'auth-unlinked-999',
      email: 'newuser@example.com',
      user_metadata: { full_name: 'New User' }
    };

    let studentInsertAttempted = false;

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
        if (init?.method === 'POST') {
          studentInsertAttempted = true;
        }
        return pgrstMockResponse([], init);
      }

      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/student-auth-diagnostic`, {
      headers: {
        Authorization: 'Bearer valid-jwt-for-unlinked',
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authenticated, true);
    assert.strictEqual(data.studentAuthorization, 'unlinked');
    assert.strictEqual(data.hasStudentId, false);
    assert.strictEqual(data.studentIdHash, null);
    assert.strictEqual(studentInsertAttempted, false, 'Probe must not silently create student record');
  });
});
