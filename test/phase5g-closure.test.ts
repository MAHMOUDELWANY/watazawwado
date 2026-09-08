import { describe, it, before, after } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import app from '../api/index.js';
import { getGoogleOAuthCredentials, generateGoogleAuthUrl } from '../server/integrations/googleCalendar.js';

describe('Phase 5G - Final Last-Mile Closure', () => {
  let server: http.Server;
  let baseUrl: string;
  let originalFetch: typeof globalThis.fetch;

  before(async () => {
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
    globalThis.fetch = originalFetch;
    server.close();
  });

  const setupPaymentMock = () => {
    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/payments')) {
        if (options?.method === 'PATCH' || options?.method === 'POST' || options?.method === 'DELETE') {
          return {
            ok: false,
            status: 400,
            json: async () => ({ message: 'SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
            text: async () => JSON.stringify({ message: 'SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
            headers: new Headers({ 'content-type': 'application/json' })
          } as any;
        } else {
          return {
            ok: true,
            status: 200,
            json: async () => ([{ id: '123', status: 'pending' }]),
            text: async () => JSON.stringify([{ id: '123', status: 'pending' }]),
            headers: new Headers({ 'content-type': 'application/json' })
          } as any;
        }
      }
      return originalFetch(url, options);
    };
  };

  it('Record Payment - forces DB error and checks generic response', async () => {
    setupPaymentMock();
    const res = await originalFetch(`${baseUrl}/api/dashboard/payments`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dev-teacher-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 10, currency: 'USD', payment_method: 'paypal', status: 'pending' })
    });
    const body = await res.json();
    assert.strictEqual(res.status, 500);
    assert.ok(!JSON.stringify(body).includes('SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT'));
    assert.ok(body.error?.includes('Failed to record payment'));
    globalThis.fetch = originalFetch;
  });

  it('Reject Payment - forces DB error and checks generic response', async () => {
    setupPaymentMock();
    const res = await originalFetch(`${baseUrl}/api/dashboard/payments/123/reject`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer dev-teacher-token', 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'test' })
    });
    const body = await res.json();
    assert.strictEqual(res.status, 500);
    assert.ok(!JSON.stringify(body).includes('SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT'));
    assert.ok(body.error?.includes('Failed to reject payment'));
    globalThis.fetch = originalFetch;
  });

  it('Delete Payment - forces DB error and checks generic response', async () => {
    setupPaymentMock();
    const res = await originalFetch(`${baseUrl}/api/dashboard/payments/123`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer dev-teacher-token' }
    });
    const body = await res.json();
    assert.strictEqual(res.status, 500);
    assert.ok(!JSON.stringify(body).includes('SECRET_DB_ERROR_SHOULD_NEVER_REACH_CLIENT'));
    assert.ok(body.error?.includes('Failed to delete payment'));
    globalThis.fetch = originalFetch;
  });
  
  it('Availability - strict parsing rejects malformed days', async () => {
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?timezone=UTC&days=30abc&duration=30`);
    assert.strictEqual(res.status, 400);
  });
  
  it('Availability - strict parsing rejects zero days', async () => {
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?timezone=UTC&days=0&duration=30`);
    assert.strictEqual(res.status, 400);
  });
  
  it('Availability - strict parsing rejects decimal days', async () => {
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?timezone=UTC&days=1.5&duration=30`);
    assert.strictEqual(res.status, 400);
  });
  
  it('Availability - strict parsing rejects empty days', async () => {
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?timezone=UTC&days=&duration=30`);
    assert.strictEqual(res.status, 400);
  });

  it('Availability - rejects missing timezone', async () => {
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?days=14&duration=30`);
    assert.strictEqual(res.status, 400);
  });
  
  it('Availability - accepts valid parameters', async () => {
    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/bookings')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([]),
          text: async () => '[]',
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };
    const res = await originalFetch(`${baseUrl}/api/integrations/availability?timezone=America/New_York&days=14&duration=45`);
    globalThis.fetch = originalFetch;
    assert.strictEqual(res.status, 200);
  });

  it('OAuth Callback - Sanitized generic error', async () => {
    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: 'invalid_grant', error_description: 'SECRET_OAUTH_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
          text: async () => JSON.stringify({ error: 'invalid_grant', error_description: 'SECRET_OAUTH_ERROR_SHOULD_NEVER_REACH_CLIENT' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    const res = await originalFetch(`${baseUrl}/api/integrations/google-calendar/callback?code=mock_code&state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15`, {
      headers: { 'Cookie': 'oauth_state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15' }
    });
    const text = await res.text();
    globalThis.fetch = originalFetch;
    
    assert.ok(text.includes('Google Calendar connection failed. Please try again.'));
    assert.ok(!text.includes('SECRET_OAUTH_ERROR_SHOULD_NEVER_REACH_CLIENT')); 
  });
  
  it('OAuth Callback Test A - Valid APP_URL derives exact trusted origin', async () => {
    const originalAppUrl = process.env.APP_URL;
    process.env.APP_URL = 'https://example.com';

    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake', refresh_token: 'fake' }),
          text: async () => JSON.stringify({ access_token: 'fake', refresh_token: 'fake' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('googleapis.com/oauth2/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ email: 'teacher@example.com' }),
          text: async () => JSON.stringify({ email: 'teacher@example.com' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/calendar_connections')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([]),
          text: async () => '[]',
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    const res = await originalFetch(`${baseUrl}/api/integrations/google-calendar/callback?code=mock_code&state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15`, {
      headers: { 'Cookie': 'oauth_state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15' }
    });
    const text = await res.text();
    globalThis.fetch = originalFetch;
    process.env.APP_URL = originalAppUrl;

    assert.strictEqual(res.status, 200);
    assert.ok(text.includes("window.opener.postMessage("));
    assert.ok(text.includes("'https://example.com'"));
    assert.ok(!text.includes("'*'"));
    assert.ok(!text.includes("'http://localhost:3000'"));
  });

  it('OAuth Callback Test B - Missing APP_URL in production fails closed safely', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAppUrl = process.env.APP_URL;
    process.env.NODE_ENV = 'production';
    delete process.env.APP_URL;

    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake', refresh_token: 'fake' }),
          text: async () => JSON.stringify({ access_token: 'fake', refresh_token: 'fake' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('googleapis.com/oauth2/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ email: 'teacher@example.com' }),
          text: async () => JSON.stringify({ email: 'teacher@example.com' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/calendar_connections')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([]),
          text: async () => '[]',
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    const res = await originalFetch(`${baseUrl}/api/integrations/google-calendar/callback?code=mock_code&state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15`, {
      headers: { 'Cookie': 'oauth_state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15' }
    });
    const text = await res.text();
    globalThis.fetch = originalFetch;
    process.env.NODE_ENV = originalEnv;
    process.env.APP_URL = originalAppUrl;

    assert.strictEqual(res.status, 500);
    assert.ok(text.includes('Google Calendar connection failed. Please try again.'));
    assert.ok(!text.includes('window.opener.postMessage'));
    assert.ok(!text.includes("'http://localhost:3000'"));
    assert.ok(!text.includes("'*'"));
  });

  it('OAuth Callback Test C - Malformed APP_URL in production fails closed safely', async () => {
    const originalEnv = process.env.NODE_ENV;
    const originalAppUrl = process.env.APP_URL;
    process.env.NODE_ENV = 'production';
    process.env.APP_URL = 'invalid-not-a-url';

    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake', refresh_token: 'fake' }),
          text: async () => JSON.stringify({ access_token: 'fake', refresh_token: 'fake' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('googleapis.com/oauth2/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ email: 'teacher@example.com' }),
          text: async () => JSON.stringify({ email: 'teacher@example.com' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/calendar_connections')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([]),
          text: async () => '[]',
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    const res = await originalFetch(`${baseUrl}/api/integrations/google-calendar/callback?code=mock_code&state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15`, {
      headers: { 'Cookie': 'oauth_state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15' }
    });
    const text = await res.text();
    globalThis.fetch = originalFetch;
    process.env.NODE_ENV = originalEnv;
    process.env.APP_URL = originalAppUrl;

    assert.strictEqual(res.status, 500);
    assert.ok(text.includes('Google Calendar connection failed. Please try again.'));
    assert.ok(!text.includes('window.opener.postMessage'));
    assert.ok(!text.includes("'http://localhost:3000'"));
    assert.ok(!text.includes("'*'"));
  });

  it('OAuth Callback Test D - Script injection safe payload for all script tags', async () => {
    globalThis.fetch = async (url: any, options: any) => {
      if (typeof url === 'string' && url.includes('oauth2.googleapis.com/token')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ access_token: 'fake', refresh_token: 'fake' }),
          text: async () => JSON.stringify({ access_token: 'fake', refresh_token: 'fake' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('googleapis.com/oauth2/v2/userinfo')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({ email: '<script>alert(1)</script></script><script>alert(2)</script>' }),
          text: async () => JSON.stringify({ email: '<script>alert(1)</script></script><script>alert(2)</script>' }),
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      if (typeof url === 'string' && url.includes('supabase.co/rest/v1/calendar_connections')) {
        return {
          ok: true,
          status: 200,
          json: async () => ([]),
          text: async () => '[]',
          headers: new Headers({ 'content-type': 'application/json' })
        } as any;
      }
      return originalFetch(url, options);
    };

    const res = await originalFetch(`${baseUrl}/api/integrations/google-calendar/callback?code=mock_code&state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15`, {
      headers: { 'Cookie': 'oauth_state=dGVhY2hlci1tYWhtb3VkLTAwMTpkODNlZDg0YzBhNWI1NWRiZTE5ZmEyOTYzMDA4NWVjYg==.70a7846618e964561a98937125f9ff326162b2bbb4ca18de9920e0d3dd276a15' }
    });
    const text = await res.text();
    globalThis.fetch = originalFetch;

    assert.ok(!text.includes('<script>alert(1)</script>'));
    assert.ok(!text.includes('</script><script>alert(2)</script>'));
    assert.ok(text.includes('\\u003cscript\\u003ealert(1)\\u003c/script\\u003e'));
  });

  it('Redirect URI Test A - Explicit production redirect URI is strictly honored', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalAppUrl = process.env.APP_URL;

    process.env.NODE_ENV = 'production';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_REDIRECT_URI = 'https://example.com/api/integrations/google-calendar/callback';
    delete process.env.APP_URL;

    try {
      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'https://example.com/api/integrations/google-calendar/callback');
      assert.strictEqual(creds.isConfigured, true);

      const authUrl = generateGoogleAuthUrl('test_state');
      assert.ok(authUrl.includes('redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fintegrations%2Fgoogle-calendar%2Fcallback'));
      assert.ok(!authUrl.includes('localhost'));
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
      process.env.APP_URL = originalAppUrl;
    }
  });

  it('Redirect URI Test B - Production APP_URL fallback derives callback URL without localhost', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalAppUrl = process.env.APP_URL;

    process.env.NODE_ENV = 'production';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.APP_URL = 'https://example.com';

    try {
      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'https://example.com/api/integrations/google-calendar/callback');
      assert.strictEqual(creds.isConfigured, true);

      const authUrl = generateGoogleAuthUrl('test_state');
      assert.ok(authUrl.includes('redirect_uri=https%3A%2F%2Fexample.com%2Fapi%2Fintegrations%2Fgoogle-calendar%2Fcallback'));
      assert.ok(!authUrl.includes('localhost'));
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
      process.env.APP_URL = originalAppUrl;
    }
  });

  it('Redirect URI Test C - Production missing both fails closed safely', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalAppUrl = process.env.APP_URL;

    process.env.NODE_ENV = 'production';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.APP_URL;

    try {
      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, '');
      assert.strictEqual(creds.isConfigured, false);
      assert.throws(() => generateGoogleAuthUrl('test_state'), /Google OAuth is not configured/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
      process.env.APP_URL = originalAppUrl;
    }
  });

  it('Redirect URI Test D - Production malformed APP_URL fails closed safely', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalAppUrl = process.env.APP_URL;

    process.env.NODE_ENV = 'production';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    delete process.env.GOOGLE_REDIRECT_URI;
    process.env.APP_URL = 'invalid-not-a-url';

    try {
      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, '');
      assert.strictEqual(creds.isConfigured, false);
      assert.throws(() => generateGoogleAuthUrl('test_state'), /Google OAuth is not configured/);

      process.env.APP_URL = '*';
      const wildcardCreds = getGoogleOAuthCredentials();
      assert.strictEqual(wildcardCreds.redirectUri, '');
      assert.strictEqual(wildcardCreds.isConfigured, false);
      assert.throws(() => generateGoogleAuthUrl('test_state'), /Google OAuth is not configured/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
      process.env.APP_URL = originalAppUrl;
    }
  });

  it('Redirect URI Test E - Development environment preserves localhost fallback', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalRedirectUri = process.env.GOOGLE_REDIRECT_URI;
    const originalAppUrl = process.env.APP_URL;

    process.env.NODE_ENV = 'development';
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    delete process.env.GOOGLE_REDIRECT_URI;
    delete process.env.APP_URL;

    try {
      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'http://localhost:3000/api/integrations/google-calendar/callback');
      assert.strictEqual(creds.isConfigured, true);

      const authUrl = generateGoogleAuthUrl('test_state');
      assert.ok(authUrl.includes('redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fintegrations%2Fgoogle-calendar%2Fcallback'));
    } finally {
      process.env.NODE_ENV = originalEnv;
      process.env.GOOGLE_CLIENT_ID = originalClientId;
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
      process.env.GOOGLE_REDIRECT_URI = originalRedirectUri;
      process.env.APP_URL = originalAppUrl;
    }
  });
});
