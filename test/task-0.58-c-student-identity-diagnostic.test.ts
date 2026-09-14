import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';

describe('Task 0.58-C: Student Runtime Identity Diagnostic & Resolution Tests', () => {
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

  it('1. GET /api/student-auth-diagnostic requires valid Bearer authentication', async () => {
    const resNoAuth = await fetch(`${baseUrl}/api/student-auth-diagnostic`);
    assert.strictEqual(resNoAuth.status, 401);

    const resInvalidToken = await fetch(`${baseUrl}/api/student-auth-diagnostic`, {
      headers: { Authorization: 'Bearer invalid-token-xyz' }
    });
    assert.strictEqual(resInvalidToken.status, 401);
  });

  it('2. Evaluates project consistency between client header and backend URL', async () => {
    const mockAuthUser = {
      id: 'usr-student-001',
      email: 'student@example.com',
      user_metadata: { full_name: 'Student One' }
    };

    const mockStudent = {
      id: 'stu-001',
      name: 'Student One',
      email: 'student@example.com',
      timezone: 'UTC',
      learner_type: 'adult',
      current_level: 'beginner',
      status: 'active',
      auth_user_id: 'usr-student-001'
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
        return pgrstMockResponse([mockStudent], init);
      }

      return originalFetch(input, init);
    };

    // Correct production ref matches backend
    const resMatch = await fetch(`${baseUrl}/api/student-auth-diagnostic`, {
      headers: {
        Authorization: 'Bearer valid-jwt-token-123',
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    assert.strictEqual(resMatch.status, 200);
    assert.strictEqual(resMatch.headers.get('x-project-consistency'), 'MATCH');
    assert.strictEqual(resMatch.headers.get('x-student-auth-verified'), 'true');
    assert.strictEqual(resMatch.headers.get('x-student-backend-project-ref'), 'fmwxqyroyxgigvpahpri');
    assert.strictEqual(resMatch.headers.get('x-student-record-found'), 'true');
    assert.strictEqual(resMatch.headers.get('x-student-user-attached'), 'true');
    assert.strictEqual(resMatch.headers.get('x-student-has-student-id'), 'true');

    const dataMatch = await resMatch.json();
    assert.strictEqual(dataMatch.authenticated, true);
    assert.strictEqual(dataMatch.studentAuthorization, 'authorized');
    assert.strictEqual(dataMatch.projectConsistency, 'MATCH');
    assert.strictEqual(dataMatch.backendProjectRef, 'fmwxqyroyxgigvpahpri');
    assert.strictEqual(dataMatch.hasStudentId, true);

    // Legacy project ref produces MISMATCH
    const resMismatch = await fetch(`${baseUrl}/api/student-auth-diagnostic`, {
      headers: {
        Authorization: 'Bearer valid-jwt-token-123',
        'x-client-project-ref': 'kpftfmwnwcnkbvfgjfdy'
      }
    });

    assert.strictEqual(resMismatch.status, 200);
    assert.strictEqual(resMismatch.headers.get('x-project-consistency'), 'MISMATCH');
    const dataMismatch = await resMismatch.json();
    assert.strictEqual(dataMismatch.projectConsistency, 'MISMATCH');
  });

  it('3. GET /api/student/me: Branch A diagnostic when student has no linked student profile', async () => {
    const mockAuthUser = {
      id: 'usr-student-unlinked',
      email: 'unlinked@example.com',
      user_metadata: { full_name: 'Unlinked Student' }
    };

    let studentsInsertAttempted = false;

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
          studentsInsertAttempted = true;
        }
        return pgrstMockResponse([], init);
      }

      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: {
        Authorization: 'Bearer valid-token-unlinked',
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.headers.get('x-student-me-branch'), 'BRANCH_A_NO_STUDENT_ID');
    assert.strictEqual(res.headers.get('x-student-record-found'), 'false');
    assert.strictEqual(res.headers.get('x-student-has-student-id'), 'false');

    const body = await res.json();
    assert.strictEqual(body.error, 'Student profile not found.');
    assert.strictEqual(body.diagnosticBranch, 'BRANCH_A_NO_STUDENT_ID');
    assert.strictEqual(body.hasAuthUser, true);

    // Section 9: Must not silently insert a student row from profile lookup
    assert.strictEqual(studentsInsertAttempted, false, 'Profile lookup must not perform silent student insertion');
  });

  it('4. GET /api/student/me: successfully returns student profile and marks SUCCESS branch', async () => {
    const mockAuthUser = {
      id: 'usr-student-002',
      email: 'student2@example.com',
      user_metadata: { full_name: 'Fatima Zahra' }
    };

    const mockStudent = {
      id: 'stu-002',
      name: 'Fatima Zahra',
      email: 'student2@example.com',
      whatsapp: '+1234567890',
      country: 'Canada',
      timezone: 'America/Toronto',
      learner_type: 'adult',
      current_level: 'intermediate',
      status: 'active',
      created_at: '2026-09-08T10:00:00Z',
      onboarding_completed: true,
      learning_interest: 'Tajweed',
      learning_goal: 'Memorize Juz Amma',
      learning_needs: null
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

    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: {
        Authorization: 'Bearer valid-jwt-token-stu2',
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-student-me-branch'), 'SUCCESS');
    assert.strictEqual(res.headers.get('x-student-auth-verified'), 'true');
    assert.strictEqual(res.headers.get('x-student-record-found'), 'true');
    assert.strictEqual(res.headers.get('x-student-has-student-id'), 'true');

    const profile = await res.json();
    assert.strictEqual(profile.id, 'stu-002');
    assert.strictEqual(profile.name, 'Fatima Zahra');
    assert.strictEqual(profile.email, 'student2@example.com');
    assert.strictEqual(profile.country, 'Canada');
    assert.strictEqual(profile.timezone, 'America/Toronto');
  });

  it('5. GET /api/student/me: resiliently resolves from verified profile if secondary student query fails', async () => {
    const mockAuthUser = {
      id: 'usr-student-003',
      email: 'student3@example.com',
      user_metadata: { full_name: 'Tariq Ali' }
    };

    const mockInitialStudent = {
      id: 'stu-003',
      name: 'Tariq Ali',
      email: 'student3@example.com',
      timezone: 'Europe/London',
      learner_type: 'adult',
      current_level: 'beginner',
      status: 'active'
    };

    let verifyStudentAuthLookupCount = 0;

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
        verifyStudentAuthLookupCount++;
        if (verifyStudentAuthLookupCount === 1) {
          // verifyStudentAuth succeeds
          return pgrstMockResponse([mockInitialStudent], init);
        }
        // Secondary query in /api/student/me fails (e.g. database error)
        return new Response(JSON.stringify({ message: 'Column error', code: '42703' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (url.includes('/rest/v1/guardians') || url.includes('/rest/v1/student_goals')) {
        return pgrstMockResponse([], init);
      }

      return originalFetch(input, init);
    };

    const res = await fetch(`${baseUrl}/api/student/me`, {
      headers: {
        Authorization: 'Bearer valid-jwt-token-stu3',
        'x-client-project-ref': 'fmwxqyroyxgigvpahpri'
      }
    });

    // Instead of failing with 404, resilient recovery resolves profile from verified studentRecord
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-student-me-branch'), 'BRANCH_B_STUDENT_FETCH_FAILED');

    const profile = await res.json();
    assert.strictEqual(profile.id, 'stu-003');
    assert.strictEqual(profile.name, 'Tariq Ali');
    assert.strictEqual(profile.email, 'student3@example.com');
  });
});
