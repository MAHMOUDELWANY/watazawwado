import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../api/index.js';

describe('Task 0.55.4-D: Google Calendar Connection Persistence & False-Success Correction', () => {
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

  it('Test B: Valid OAuth exchange and successful DB persistence emits success HTML', async () => {
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

    let insertedRow: any = null;

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${teacherUuid}`)) {
        return new Response(JSON.stringify({ id: teacherUuid, email: teacherEmail }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ email: teacherEmail, role: 'super_admin', is_active: true }], options);
      }

      if (urlStr.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'valid', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('googleapis.com/oauth2/v2/userinfo')) {
        return new Response(JSON.stringify({ email: teacherEmail }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/rest/v1/calendar_connections')) {
        if (options?.method === 'PATCH') return pgrstMockResponse([], options);
        if (options?.method === 'POST') {
          insertedRow = JSON.parse(options.body);
          // Return the inserted row with an ID to satisfy .select().single()
          return pgrstMockResponse([{ ...insertedRow, id: 'conn-123' }], options);
        }
      }

      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${validState}`, {
      headers: { 'Cookie': `oauth_state=${validState}` }
    });
    
    assert.strictEqual(res.status, 200);
    const html = await res.text();
    assert.ok(html.includes('Integration Successful!'), 'Must include success message');
    assert.ok(html.includes('GOOGLE_CALENDAR_CONNECTED'), 'Must post GOOGLE_CALENDAR_CONNECTED message');
    
    assert.ok(insertedRow, 'DB insert must have been executed');
    assert.strictEqual(insertedRow.teacher_id, teacherUuid, 'DB row must be scoped to teacher UUID');
  });

  it('Test C: Failed DB insertion prevents false success and returns 500', async () => {
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

    globalThis.fetch = async (url: any, options: any) => {
      const urlStr = getUrlString(url);

      if (urlStr.includes(`/auth/v1/admin/users/${teacherUuid}`)) {
        return new Response(JSON.stringify({ id: teacherUuid, email: teacherEmail }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/rest/v1/teacher_accounts')) {
        return pgrstMockResponse([{ email: teacherEmail, role: 'super_admin', is_active: true }], options);
      }

      if (urlStr.includes('oauth2.googleapis.com/token')) {
        return new Response(JSON.stringify({ access_token: 'valid', expires_in: 3600 }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('googleapis.com/oauth2/v2/userinfo')) {
        return new Response(JSON.stringify({ email: teacherEmail }), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }

      if (urlStr.includes('/rest/v1/calendar_connections')) {
        if (options?.method === 'PATCH') return pgrstMockResponse([], options);
        if (options?.method === 'POST') {
          // Force Supabase insert to fail
          return new Response(JSON.stringify({ message: 'Foreign key violation: profiles.id' }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      return originalFetch(url, options);
    };

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${validState}`, {
      headers: { 'Cookie': `oauth_state=${validState}` }
    });
    
    assert.strictEqual(res.status, 500, 'Must return 500 if DB insert fails');
    const html = await res.text();
    assert.ok(!html.includes('Integration Successful!'), 'Must not display success message if DB fails');
    assert.ok(!html.includes('GOOGLE_CALENDAR_CONNECTED'), 'Must not post GOOGLE_CALENDAR_CONNECTED if DB fails');
    assert.ok(html.includes('Database Error: Google Calendar was authorized, but the connection could not be saved to your account'), 'Must explain error');
  });

});
