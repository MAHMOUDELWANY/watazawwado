import { describe, it, before, after, beforeEach } from 'node:test';
import * as assert from 'node:assert';
import http from 'node:http';
import crypto from 'node:crypto';
import app from '../api/index.js';
import {
  sanitizeGoogleAuthCode,
  getGoogleOAuthCredentials,
  generateGoogleAuthUrl,
  exchangeGoogleCodeForTokens
} from '../server/integrations/googleCalendar.js';

describe('Task 0.57: Google OAuth Code Sanitization, Redirect URI Alignment & Token Exchange Hardening', () => {
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

  // =========================================================================
  // 1. sanitizeGoogleAuthCode unit tests
  // =========================================================================
  describe('1. sanitizeGoogleAuthCode', () => {
    it('returns empty string for null, undefined, or empty values', () => {
      assert.strictEqual(sanitizeGoogleAuthCode(null), '');
      assert.strictEqual(sanitizeGoogleAuthCode(undefined), '');
      assert.strictEqual(sanitizeGoogleAuthCode(''), '');
      assert.strictEqual(sanitizeGoogleAuthCode([]), '');
    });

    it('trims whitespace and removes wrapping quotes', () => {
      assert.strictEqual(sanitizeGoogleAuthCode('  4/0AbCdEf123  '), '4/0AbCdEf123');
      assert.strictEqual(sanitizeGoogleAuthCode('"4/0AbCdEf123"'), '4/0AbCdEf123');
      assert.strictEqual(sanitizeGoogleAuthCode("'4/0AbCdEf123'"), '4/0AbCdEf123');
    });

    it('strips hash fragments and trailing unexpected URL parameters', () => {
      assert.strictEqual(sanitizeGoogleAuthCode('4/0AbCdEf123#state=abc'), '4/0AbCdEf123');
      assert.strictEqual(sanitizeGoogleAuthCode('4/0AbCdEf123&scope=email'), '4/0AbCdEf123');
    });

    it('decodes single and double URL-encoded slashes (%2F) so URLSearchParams does not double-encode', () => {
      // 4%2F0A... -> 4/0A...
      assert.strictEqual(sanitizeGoogleAuthCode('4%2F0AbCdEf123'), '4/0AbCdEf123');
      // Double-encoded: 4%252F0A... -> 4/0A...
      assert.strictEqual(sanitizeGoogleAuthCode('4%252F0AbCdEf123'), '4/0AbCdEf123');
    });

    it('extracts first element if code is an array', () => {
      assert.strictEqual(sanitizeGoogleAuthCode(['4/0AbCdEf123', 'extra']), '4/0AbCdEf123');
    });
  });

  // =========================================================================
  // 2. getGoogleOAuthCredentials & redirectUri resolution
  // =========================================================================
  describe('2. getGoogleOAuthCredentials & Redirect URI Resolution', () => {
    it('prioritizes explicit customRedirectUri when passed', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';
      process.env.APP_URL = 'https://ais-dev.run.app';

      const creds = getGoogleOAuthCredentials('https://custom.example.com/api/integrations/google-calendar/callback');
      assert.strictEqual(creds.redirectUri, 'https://custom.example.com/api/integrations/google-calendar/callback');
    });

    it('prioritizes GOOGLE_REDIRECT_URI when explicitly set in environment', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.APP_URL = 'https://ais-dev-xmqvhdm2h3yooa6cr7hk7u.run.app';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';

      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback');
    });

    it('derives callback from APP_URL when GOOGLE_REDIRECT_URI is absent', () => {
      delete process.env.GOOGLE_REDIRECT_URI;
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.APP_URL = 'https://ais-dev-xmqvhdm2h3yooa6cr7hk7u.run.app';

      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'https://ais-dev-xmqvhdm2h3yooa6cr7hk7u.run.app/api/integrations/google-calendar/callback');
    });

    it('falls back to GOOGLE_REDIRECT_URI when APP_URL is absent', () => {
      delete process.env.APP_URL;
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';

      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback');
    });

    it('falls back to localhost:3000 in non-production when neither APP_URL nor GOOGLE_REDIRECT_URI is set', () => {
      delete process.env.APP_URL;
      delete process.env.GOOGLE_REDIRECT_URI;
      process.env.NODE_ENV = 'development';
      process.env.GOOGLE_CLIENT_ID = 'test-id';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';

      const creds = getGoogleOAuthCredentials();
      assert.strictEqual(creds.redirectUri, 'http://localhost:3000/api/integrations/google-calendar/callback');
    });
  });

  // =========================================================================
  // 3. generateGoogleAuthUrl & state tracking
  // =========================================================================
  describe('3. generateGoogleAuthUrl', () => {
    it('generates valid Google auth URL with scopes, offline access, and consent prompt', () => {
      process.env.GOOGLE_CLIENT_ID = 'test-id-123';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret-456';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';

      const url = generateGoogleAuthUrl('test_state_payload');
      assert.ok(url.startsWith('https://accounts.google.com/o/oauth2/v2/auth'));
      assert.ok(url.includes('client_id=test-id-123'));
      assert.ok(url.includes('access_type=offline'));
      assert.ok(url.includes('prompt=consent'));
      assert.ok(url.includes('state=test_state_payload'));
    });
  });

  // =========================================================================
  // 4. exchangeGoogleCodeForTokens sanitization, deduplication, and candidate retries
  // =========================================================================
  describe('4. exchangeGoogleCodeForTokens', () => {
    it('throws immediately on empty or invalid auth code', async () => {
      await assert.rejects(
        async () => {
          await exchangeGoogleCodeForTokens('');
        },
        /Authorization code is empty or malformed/
      );
    });

    it('sanitizes URL-encoded code before posting to Google token endpoint', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';

      let receivedBody = '';
      globalThis.fetch = async (url: any, options: any) => {
        const urlStr = getUrlString(url);
        if (urlStr.includes('oauth2.googleapis.com/token')) {
          receivedBody = options.body.toString();
          return new Response(JSON.stringify({
            access_token: 'mock-access',
            refresh_token: 'mock-refresh',
            expires_in: 3600
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (urlStr.includes('googleapis.com/oauth2/v2/userinfo')) {
          return new Response(JSON.stringify({ email: 'teacher@example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch(url, options);
      };

      try {
        // Pass encoded code "4%2F0AbCdEf"
        const tokens = await exchangeGoogleCodeForTokens('4%2F0AbCdEf');
        assert.strictEqual(tokens.accessToken, 'mock-access');
        // URLSearchParams encodes '/' back to '%2F' exactly once, not double-encoded '%252F'
        assert.ok(receivedBody.includes('code=4%2F0AbCdEf'));
        assert.ok(!receivedBody.includes('4%252F0AbCdEf'), 'Must not be double-encoded');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('deduplicates concurrent exchanges and caches successful result', async () => {
      process.env.GOOGLE_CLIENT_ID = 'test-client';
      process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
      process.env.GOOGLE_REDIRECT_URI = 'https://watazawwado-with-mahmoud.vercel.app/api/integrations/google-calendar/callback';

      let callCount = 0;
      globalThis.fetch = async (url: any, options: any) => {
        const urlStr = getUrlString(url);
        if (urlStr.includes('oauth2.googleapis.com/token')) {
          callCount++;
          await new Promise(r => setTimeout(r, 20));
          return new Response(JSON.stringify({
            access_token: 'mock-dedup-access',
            refresh_token: 'mock-dedup-refresh',
            expires_in: 3600
          }), { status: 200, headers: { 'Content-Type': 'application/json' } });
        }
        if (urlStr.includes('googleapis.com/oauth2/v2/userinfo')) {
          return new Response(JSON.stringify({ email: 'teacher@example.com' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }
        return originalFetch(url, options);
      };

      try {
        const [res1, res2] = await Promise.all([
          exchangeGoogleCodeForTokens('unique-test-code-xyz'),
          exchangeGoogleCodeForTokens('unique-test-code-xyz')
        ]);

        assert.strictEqual(res1.accessToken, 'mock-dedup-access');
        assert.strictEqual(res2.accessToken, 'mock-dedup-access');
        assert.strictEqual(callCount, 1, 'Concurrent calls with identical code must be deduplicated into 1 request');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });

  // =========================================================================
  // 5. Callback Route End-to-End & Error Rendering
  // =========================================================================
  describe('5. OAuth Callback Route Error Rendering & Window Communication', () => {
    it('renders clean error HTML with GOOGLE_CALENDAR_ERROR postMessage on missing code', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback`);
      assert.strictEqual(res.status, 400);
      const text = await res.text();
      assert.ok(text.includes('GOOGLE_CALENDAR_ERROR'), 'Must include postMessage type');
      assert.ok(text.includes('Missing authorization code'), 'Must explain error to user');
    });

    it('renders error HTML with 403 on invalid CSRF state', async () => {
      const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=testcode&state=bad.state`, {
        headers: { 'Cookie': 'oauth_state=cookie.state' }
      });
      assert.strictEqual(res.status, 403);
      const text = await res.text();
      assert.ok(text.includes('GOOGLE_CALENDAR_ERROR'));
      assert.ok(text.includes('Invalid or expired OAuth state parameter (CSRF)'));
    });
  });
});
