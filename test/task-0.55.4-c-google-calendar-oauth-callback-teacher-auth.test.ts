import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../api/index.js';
import { isTeacherCurrentlyAuthorized } from '../server/integrations/syncEngine.js';

describe('Task 0.55.4-C: Google Calendar OAuth Callback Teacher Authorization Correction', () => {
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

  function getUrlString(input: any): string {
    if (typeof input === 'string') return input;
    if (input && typeof input.url === 'string') return input.url;
    if (input && typeof input.href === 'string') return input.href;
    if (input && typeof input.toString === 'function') return input.toString();
    return String(input);
  }

  function pgrstMockResponse(data: any, options?: any) {
    const status = 200;
    const prefer = options?.headers?.Prefer || options?.headers?.prefer || '';
    const isSingle = prefer.includes('count=none') || options?.headers?.Accept?.includes('application/vnd.pgrst.object+json');

    let bodyData = data;
    if (isSingle && Array.isArray(data)) {
      bodyData = data.length > 0 ? data[0] : null;
    }

    return new Response(JSON.stringify(bodyData), {
      status: isSingle && !bodyData ? 406 : status,
      headers: {
        'Content-Type': 'application/json',
        'Content-Range': `0-${Array.isArray(data) ? data.length : 1}/*`
      }
    });
  }

  // --------------------------------------------------------------------------
  // Test A: Authorized teacher without profile (The Exact Production Failure)
  // --------------------------------------------------------------------------
  it('Test A: Authorizes teacher whose Auth UUID exists in Supabase Auth and active in teacher_accounts, even with ZERO profile rows', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const teacherAuthUuid = '7c849760-b8f9-4673-8a03-999999999999';
    const teacherEmail = 'mhmwdlwany4222@gmail.com';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      // Mock Supabase Auth admin getUserById endpoint
      if (urlStr.includes(`/auth/v1/admin/users/${teacherAuthUuid}`)) {
        return new Response(JSON.stringify({
          id: teacherAuthUuid,
          email: teacherEmail,
          role: 'authenticated'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Explicitly return EMPTY / NULL for profiles table (no profile row exists in production)
      if (urlStr.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([], options);
      }

      // Mock teacher_accounts table matching active email
      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{
          email: teacherEmail,
          role: 'super_admin',
          is_active: true
        }], options);
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(teacherAuthUuid);
      assert.strictEqual(isAuth, true, 'Must authorize active teacher even when public.profiles has no row');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test B: Authorized teacher with profile
  // --------------------------------------------------------------------------
  it('Test B: Authorizes teacher when profile row is also present', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const teacherAuthUuid = '88888888-8888-8888-8888-888888888888';
    const teacherEmail = 'mahmoudelwany98@gmail.com';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${teacherAuthUuid}`)) {
        return new Response(JSON.stringify({
          id: teacherAuthUuid,
          email: teacherEmail
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([{ id: teacherAuthUuid, email: teacherEmail, role: 'super_admin' }], options);
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{
          email: teacherEmail,
          role: 'super_admin',
          is_active: true
        }], options);
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(teacherAuthUuid);
      assert.strictEqual(isAuth, true, 'Must authorize teacher with profile present');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test C: Auth user exists but not in teacher_accounts allowlist
  // --------------------------------------------------------------------------
  it('Test C: Rejects authenticated non-teacher student UUID', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const studentUuid = '11111111-1111-1111-1111-111111111111';
    const studentEmail = 'student.learner@gmail.com';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${studentUuid}`)) {
        return new Response(JSON.stringify({
          id: studentUuid,
          email: studentEmail
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], options); // Not in teacher_accounts allowlist
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(studentUuid);
      assert.strictEqual(isAuth, false, 'Non-teacher user must be rejected');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test D: teacher_accounts row exists but is_active is false
  // --------------------------------------------------------------------------
  it('Test D: Rejects deactivated teacher account (is_active = false)', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const inactiveTeacherUuid = '22222222-2222-2222-2222-222222222222';
    const inactiveEmail = 'inactive.teacher@gmail.com';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${inactiveTeacherUuid}`)) {
        return new Response(JSON.stringify({
          id: inactiveTeacherUuid,
          email: inactiveEmail
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        // Query filters for is_active.eq.true, so empty response returned
        return pgrstMockResponse([], options);
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(inactiveTeacherUuid);
      assert.strictEqual(isAuth, false, 'Inactive teacher must be rejected');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test E: Auth user has no email
  // --------------------------------------------------------------------------
  it('Test E: Rejects user whose auth record has no email address', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const anonymousUuid = '33333333-3333-3333-3333-333333333333';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${anonymousUuid}`)) {
        return new Response(JSON.stringify({
          id: anonymousUuid,
          email: null
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(anonymousUuid);
      assert.strictEqual(isAuth, false, 'User without email must be rejected');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test F: Auth user lookup fails (error or missing user)
  // --------------------------------------------------------------------------
  it('Test F: Rejects when Supabase Auth getUserById fails or user does not exist', async () => {
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-valid';

    const nonExistentUuid = '99999999-9999-9999-9999-999999999999';

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${nonExistentUuid}`)) {
        return new Response(JSON.stringify({
          error: 'User not found'
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('/rest/v1/profiles')) {
        return pgrstMockResponse([], options);
      }

      return originalFetch(url, options);
    };

    try {
      const isAuth = await isTeacherCurrentlyAuthorized(nonExistentUuid);
      assert.strictEqual(isAuth, false, 'Non-existent auth user must be rejected');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test G: Invalid / malformed OAuth state rejected at callback
  // --------------------------------------------------------------------------
  it('Test G: Callback rejects missing state, mismatched state, and invalid HMAC signature with 403', async () => {
    // 1. Missing state
    const resMissing = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode`);
    assert.strictEqual(resMissing.status, 403, 'Missing state must return 403');

    // 2. Mismatched state (CSRF)
    const resMismatch = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=other.state`, {
      headers: { 'Cookie': 'oauth_state=cookie.state' }
    });
    assert.strictEqual(resMismatch.status, 403, 'Mismatched cookie state must return 403');

    // 3. Invalid signature
    const payload = 'teacher-mahmoud-001:randomnonce';
    const badState = `${Buffer.from(payload).toString('base64')}.invalidsignaturexyz`;
    const resBadSig = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${badState}`, {
      headers: { 'Cookie': `oauth_state=${badState}` }
    });
    assert.strictEqual(resBadSig.status, 403, 'Forged signature must return 403');
  });

  // --------------------------------------------------------------------------
  // Test H: State contains a non-teacher Auth UUID
  // --------------------------------------------------------------------------
  it('Test H: Callback rejects valid state signature if the embedded Auth UUID is not an active teacher', async () => {
    const serviceKey = 'test-service-key-valid';
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;

    const studentUuid = '55555555-5555-5555-5555-555555555555';
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${studentUuid}:${nonce}`;
    const hmac = crypto.createHmac('sha256', serviceKey);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const validState = `${Buffer.from(payload).toString('base64')}.${signature}`;

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${studentUuid}`)) {
        return new Response(JSON.stringify({
          id: studentUuid,
          email: 'student@example.com'
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([], options);
      }

      return originalFetch(url, options);
    };

    try {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${validState}`, {
        headers: { 'Cookie': `oauth_state=${validState}` }
      });
      assert.strictEqual(res.status, 403, 'Must return 403 for non-teacher UUID in valid signed state');
      const text = await res.text();
      assert.ok(text.includes('Unauthorized'), 'Must contain unauthorized message');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  // --------------------------------------------------------------------------
  // Test I: Connection storage scoping
  // --------------------------------------------------------------------------
  it('Test I: Callback securely scopes calendar connection insertion to the authenticated teacher UUID without affecting other teachers', async () => {
    const serviceKey = 'test-service-key-valid';
    process.env.SUPABASE_URL = 'https://fmwxqyroyxgigvpahpri.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceKey;
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';

    const teacherUuid = '7c849760-b8f9-4673-8a03-999999999999';
    const teacherEmail = 'mhmwdlwany4222@gmail.com';
    const nonce = crypto.randomBytes(16).toString('hex');
    const payload = `${teacherUuid}:${nonce}`;
    const hmac = crypto.createHmac('sha256', serviceKey);
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const validState = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const insertedRows: any[] = [];
    const updatedRows: any[] = [];

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      // Mock Supabase Auth admin user lookup
      if (urlStr.includes(`/auth/v1/admin/users/${teacherUuid}`)) {
        return new Response(JSON.stringify({
          id: teacherUuid,
          email: teacherEmail
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mock teacher_accounts allowlist
      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{
          email: teacherEmail,
          role: 'super_admin',
          is_active: true
        }], options);
      }

      // Mock Google OAuth token exchange
      if (urlStr.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({
          access_token: 'google-access-token-mock-xyz',
          refresh_token: 'google-refresh-token-mock-xyz',
          expires_in: 3600
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mock Google Userinfo
      if (urlStr.includes('googleapis.com/oauth2/v2/userinfo')) {
        return new Response(JSON.stringify({
          email: teacherEmail
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Mock calendar_connections update (deactivating previous connection for this teacher only)
      if (urlStr.includes('/rest/v1/calendar_connections') && options?.method === 'PATCH') {
        assert.ok(urlStr.includes(`teacher_id=eq.${teacherUuid}`), 'Update must be strictly scoped to current teacher_id');
        updatedRows.push({ url: urlStr, body: options.body });
        return pgrstMockResponse([], options);
      }

      // Mock calendar_connections insert
      if (urlStr.includes('/rest/v1/calendar_connections') && options?.method === 'POST') {
        const bodyObj = JSON.parse(options.body);
        assert.strictEqual(bodyObj.teacher_id, teacherUuid, 'Inserted connection must be scoped to teacherUuid');
        assert.strictEqual(bodyObj.provider, 'google_calendar');
        assert.strictEqual(bodyObj.is_active, true);
        insertedRows.push(bodyObj);
        return pgrstMockResponse([bodyObj], options);
      }

      return originalFetch(url, options);
    };

    try {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=test-auth-code&state=${validState}`, {
        headers: { 'Cookie': `oauth_state=${validState}` }
      });

      assert.strictEqual(res.status, 200, 'Callback must return 200 HTML on successful OAuth exchange');
      const html = await res.text();
      assert.ok(html.includes('Integration Successful!') && html.includes('GOOGLE_CALENDAR_CONNECTED'), 'Popup must report success message');

      assert.strictEqual(insertedRows.length, 1, 'Exactly one connection must be inserted');
      assert.strictEqual(insertedRows[0].teacher_id, teacherUuid, 'Connection row must record teacher Auth UUID');
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
