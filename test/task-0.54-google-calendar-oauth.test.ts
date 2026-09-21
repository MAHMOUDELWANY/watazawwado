import assert from 'node:assert';
import { describe, it, before, after, beforeEach } from 'node:test';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../api/index.js';

describe('Task 0.54: Google Calendar Teacher Identity Binding & OAuth Security', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalEnv: NodeJS.ProcessEnv;

  before(async () => {
    originalEnv = { ...process.env };

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
    server.close();
  });

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      GOOGLE_CLIENT_ID: 'test-google-client-id',
      GOOGLE_CLIENT_SECRET: 'test-google-client-secret',
      APP_URL: baseUrl,
      SUPABASE_SERVICE_ROLE_KEY: 'test-secret-key-123'
    };
  });

  it('Should generate signed state with teacherId embedded on auth-url when configured', async () => {
    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/auth-url`, {
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });

    if (!res.ok) {
      const text = await res.text();
      console.log('auth-url response:', text);
      assert.fail(`auth-url returned ${res.status}`);
    }

    const data = await res.json() as any;
    assert.ok(data.authUrl, 'Missing authUrl');

    const cookies = res.headers.get('set-cookie');
    assert.ok(cookies && cookies.includes('oauth_state='), 'Missing oauth_state cookie');

    const match = cookies.match(/oauth_state=([^;]+)/);
    const state = match ? match[1] : '';
    assert.ok(state.includes('.'), 'State should be signed and contain a dot delimiter');

    const [b64Payload, signature] = state.split('.');
    const payload = Buffer.from(b64Payload, 'base64').toString('utf8');
    assert.ok(payload.includes(':'), 'Payload should contain teacherId and nonce');
    
    assert.ok(payload.startsWith('teacher-mahmoud-001:'), 'State should bind strictly to the authorized teacher ID');
  });

  it('Should return 503 when Google OAuth credentials are not configured on auth-url', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/auth-url`, {
      headers: {
        'Authorization': 'Bearer dev-teacher-token'
      }
    });

    assert.strictEqual(res.status, 503, 'Should return 503 Service Unavailable when OAuth is not configured');
    const data = await res.json() as any;
    assert.strictEqual(data.isConfigured, false);
    assert.ok(data.error.includes('Google OAuth is not configured'));
  });

  it('Callback should return 503 error page when Google OAuth is not configured', async () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;

    const teacherId = 'teacher-mahmoud-001';
    const nonce = 'randomnonce123';
    const b64Redirect = Buffer.from(`${baseUrl}/api/integrations/google-calendar/callback`).toString('base64');
    const payload = `${teacherId}:${nonce}:${b64Redirect}`;
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'test-secret-key-123');
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const state = `${Buffer.from(payload).toString('base64')}.${signature}`;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${state}`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });

    assert.strictEqual(res.status, 503, 'Callback should return 503 when credentials are not configured');
    const html = await res.text();
    assert.ok(html.includes('Google OAuth is not configured'), 'HTML should indicate unconfigured OAuth');
  });

  it('Callback should reject missing state', async () => {
    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode`);
    assert.strictEqual(res.status, 403, 'Should reject missing state');
  });

  it('Callback should reject mismatched state (CSRF)', async () => {
    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=fake.state`, {
      headers: {
        'Cookie': 'oauth_state=other.state'
      }
    });
    assert.strictEqual(res.status, 403, 'Should reject mismatched state');
  });

  it('Callback should reject invalid signature', async () => {
    const teacherId = 'teacher-mahmoud-001';
    const nonce = 'randomnonce';
    const payload = `${teacherId}:${nonce}`;
    const state = `${Buffer.from(payload).toString('base64')}.invalidsignature`;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=${state}`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });
    assert.strictEqual(res.status, 403, 'Should reject invalid signature');
  });
});
