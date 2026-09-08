import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app, { getSupabaseAdminClient } from '../api/index.js';
import { isTeacherCurrentlyAuthorized } from '../server/integrations/syncEngine.js';

describe('Task 0.56: Teacher Authentication & Integrations Failure Audit and Remediation', () => {
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
          text: async () => JSON.stringify({
            code: 'PGRST116',
            details: 'The result contains 0 rows',
            hint: null,
            message: 'JSON object requested, multiple (or no) rows returned'
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      } else {
        return {
          ok: true,
          status: 200,
          json: async () => data[0],
          text: async () => JSON.stringify(data[0]),
          headers: new Headers({ 'content-type': 'application/vnd.pgrst.object+json' })
        } as any;
      }
    }

    return {
      ok: true,
      status: 200,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({ 'content-type': 'application/json' })
    } as any;
  };

  // --------------------------------------------------------------------------
  // 1. SUPABASE_URL / VITE_SUPABASE_URL configuration resilience
  // --------------------------------------------------------------------------
  it('1. getSupabaseAdminClient: reads SUPABASE_URL fallback when VITE_SUPABASE_URL is not set', () => {
    delete process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const client = getSupabaseAdminClient();
    assert.ok(client, 'Supabase client must be instantiated when SUPABASE_URL is provided');
  });

  it('2. getSupabaseAdminClient: reads VITE_SUPABASE_URL when SUPABASE_URL is not set', () => {
    delete process.env.SUPABASE_URL;
    process.env.VITE_SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const client = getSupabaseAdminClient();
    assert.ok(client, 'Supabase client must be instantiated when VITE_SUPABASE_URL is provided');
  });

  it('3. getSupabaseAdminClient: returns null when service role key or URL is missing', () => {
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key';
    assert.strictEqual(getSupabaseAdminClient(), null, 'Must return null when URL is missing');

    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    assert.strictEqual(getSupabaseAdminClient(), null, 'Must return null when service key is missing');
  });

  // --------------------------------------------------------------------------
  // 2. HTTP Endpoint Auth Checks for /api/dashboard/today and /api/integrations/status
  // --------------------------------------------------------------------------
  it('4. Case 1: Missing Authorization header returns 401', async () => {
    const resToday = await originalFetch(`${baseUrl}/api/dashboard/today`);
    assert.strictEqual(resToday.status, 401);
    const bodyToday = await resToday.json();
    assert.ok(bodyToday.error.includes('Authentication required'));

    const resStatus = await originalFetch(`${baseUrl}/api/integrations/status`);
    assert.strictEqual(resStatus.status, 401);
    const bodyStatus = await resStatus.json();
    assert.ok(bodyStatus.error.includes('Authentication required'));
  });

  it('5. Case 2: Dev tokens in production environment are strictly rejected with 401', async () => {
    const savedNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const resDevTeacher = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer dev-teacher-token' }
      });
      assert.strictEqual(resDevTeacher.status, 401);
      const bodyTeacher = await resDevTeacher.json();
      assert.ok(bodyTeacher.error.includes('Development tokens are strictly forbidden in production'));

      const resDevStudent = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer dev-student-token' }
      });
      assert.strictEqual(resDevStudent.status, 401);

      const resDevHeader = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { 'x-dev-teacher-auth': 'true' }
      });
      assert.strictEqual(resDevHeader.status, 401);
    } finally {
      process.env.NODE_ENV = savedNodeEnv;
    }
  });

  it('6. Case 3: Dev token in non-production environment is accepted for development', async () => {
    process.env.NODE_ENV = 'development';

    const res = await originalFetch(`${baseUrl}/api/integrations/status`, {
      headers: { Authorization: 'Bearer dev-teacher-token' }
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.googleCalendar.isConnected, false);
    assert.strictEqual(body.email.provider, 'Brevo');
  });

  it('7. Case 4: Real token when server database configuration is missing returns 503, NOT 401', async () => {
    const savedUrl = process.env.SUPABASE_URL;
    const savedViteUrl = process.env.VITE_SUPABASE_URL;
    const savedKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Simulate missing server-side Supabase credentials
    delete process.env.SUPABASE_URL;
    delete process.env.VITE_SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      const res = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real.token' }
      });
      assert.strictEqual(res.status, 503, 'Must return 503 Service Unavailable when DB config is missing');
      const body = await res.json();
      assert.strictEqual(body.error, 'Database integration is not properly configured.');
    } finally {
      process.env.SUPABASE_URL = savedUrl;
      process.env.VITE_SUPABASE_URL = savedViteUrl;
      process.env.SUPABASE_SERVICE_ROLE_KEY = savedKey;
    }
  });

  it('8. Case 5: Real token with invalid/expired session returns 401', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    // Mock Supabase getUser to return auth error
    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);
      if (urlStr.includes('/auth/v1/user')) {
        return {
          ok: false,
          status: 401,
          json: async () => ({ message: 'Invalid token: token is expired' }),
          text: async () => JSON.stringify({ message: 'Invalid token: token is expired' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    try {
      const res = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer expired-jwt-token' }
      });
      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error, 'Invalid or expired session token.');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('9. Case 6: Real token with valid user, but email NOT in teacher_accounts allowlist returns 403', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    // Mock Supabase getUser returning a student or unauthorized user
    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);
      if (urlStr.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: 'unauthorized-user-uuid',
            email: 'unauthorized.student@gmail.com',
            user_metadata: { full_name: 'Unauthorized Student' }
          }),
          text: async () => JSON.stringify({
            id: 'unauthorized-user-uuid',
            email: 'unauthorized.student@gmail.com'
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }

      // Mock teacher_accounts query returning empty (not in allowlist)
      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], options);
      }

      return originalFetch(url, options);
    };

    try {
      const res = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer valid-jwt-unauthorized-user' }
      });
      assert.strictEqual(res.status, 403, 'Must return 403 Forbidden for unauthorized accounts');
      const body = await res.json();
      assert.strictEqual(body.error, 'Access denied. Account is not authorized for the teacher workspace.');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('10. Case 7: Real token with authorized teacher email returns 200 OK and syncs profile', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    let profileUpsertCalled = false;

    // Mock Supabase getUser returning Ustadh Mahmoud
    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes('/auth/v1/user')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            id: '33333333-3333-3333-3333-333333333333',
            email: 'mhmwdlwany4222@gmail.com',
            user_metadata: { full_name: 'Ustadh Mahmoud' }
          }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }

      // Mock teacher_accounts query returning super_admin role
      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ email: 'mhmwdlwany4222@gmail.com', role: 'super_admin', is_active: true }], options);
      }

      // Mock profiles lookup & upsert
      if (urlStr.includes('/rest/v1/profiles')) {
        if (options?.method === 'POST') {
          profileUpsertCalled = true;
          return {
            ok: true,
            status: 201,
            json: async () => ({ id: '33333333-3333-3333-3333-333333333333' }),
            headers: new Headers({ 'content-type': 'application/json' })
          } as any;
        }
        return pgrstMockResponse([], options);
      }

      // Mock bookings query for today's dashboard
      if (urlStr.includes('/rest/v1/bookings')) {
        return pgrstMockResponse([], options);
      }

      return originalFetch(url, options);
    };

    try {
      const res = await originalFetch(`${baseUrl}/api/dashboard/today`, {
        headers: { Authorization: 'Bearer valid-jwt-mahmoud' }
      });
      assert.strictEqual(res.status, 200, 'Must return 200 OK for authorized Ustadh Mahmoud');
      const body = await res.json();
      assert.ok(Array.isArray(body.lessons), 'Lessons must be returned as array');
      assert.strictEqual(body.summary.total_today, 0);
      assert.strictEqual(profileUpsertCalled, true, 'Profile record must be synchronized into public.profiles');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // 3. isTeacherCurrentlyAuthorized: column verification & allowlist checks
  // --------------------------------------------------------------------------
  it('11. isTeacherCurrentlyAuthorized: validates canonical test teacher mock', async () => {
    const isAuth = await isTeacherCurrentlyAuthorized('teacher-mahmoud-001');
    assert.strictEqual(isAuth, true);
  });

  it('12. isTeacherCurrentlyAuthorized: does NOT query non-existent teacher_accounts.id column', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const queriedUrls: string[] = [];

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);
      queriedUrls.push(urlStr);

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        // Verify URL does NOT query id column (e.g. id.eq. or select=id)
        assert.ok(!urlStr.includes('select=id'), 'Must not select non-existent id column on teacher_accounts');
        assert.ok(!urlStr.includes('id.eq'), 'Must not filter by non-existent id column on teacher_accounts');

        return pgrstMockResponse([{ email: 'mhmwdlwany4222@gmail.com', role: 'super_admin', is_active: true }], options);
      }

      return originalFetch(url, options);
    };

    try {
      // Test direct email check
      const isAuthEmail = await isTeacherCurrentlyAuthorized('mhmwdlwany4222@gmail.com');
      assert.strictEqual(isAuthEmail, true, 'Must authorize active email in teacher_accounts');

      // Verify queries avoided teacher_accounts.id
      const teacherAccountQueries = queriedUrls.filter(u => u.includes('teacher_accounts'));
      assert.ok(teacherAccountQueries.length > 0, 'Must query teacher_accounts');
      for (const query of teacherAccountQueries) {
        assert.ok(!query.includes('id.eq'), `Forbidden query on teacher_accounts.id detected: ${query}`);
      }
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('13. isTeacherCurrentlyAuthorized: maps profile UUID to email and verifies teacher allowlist', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const teacherUuid = '44444444-4444-4444-4444-444444444444';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([{ id: teacherUuid, email: 'mahmoudelwany98@gmail.com', role: 'super_admin' }], options);
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ email: 'mahmoudelwany98@gmail.com', role: 'super_admin', is_active: true }], options);
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(teacherUuid);
      assert.strictEqual(isAuth, true, 'Must authorize teacher UUID through profile email mapping');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('14. isTeacherCurrentlyAuthorized: returns false for inactive teacher in allowlist', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);
      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], options);
      }
      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized('inactive.teacher@gmail.com');
      assert.strictEqual(isAuth, false, 'Must reject inactive teacher');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
