import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import app from '../api/index.js';
import crypto from 'crypto';

describe('Task 0.60: OAuth HMAC dev-secret Fail-Closed Security Hardening', () => {
  let server: http.Server;
  let baseUrl: string;
  const originalEnv = { ...process.env };

  before(async () => {
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

  // Preserve and restore environments manually inside each test
  const setEnv = (nodeEnv: string, roleKey: string | undefined) => {
    process.env.NODE_ENV = nodeEnv;
    if (roleKey !== undefined) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = roleKey;
    } else {
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    }
    // Set minimal google creds so getGoogleOAuthCredentials doesn't throw 500 locally
    process.env.GOOGLE_CLIENT_ID = 'test_id';
    process.env.GOOGLE_CLIENT_SECRET = 'test_secret';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost/cb';
  };

  it('Test A: Production + secret present -> OAuth state signing/verification continues to work', async () => {
    setEnv('production', 'strong_production_secret');

    const payload = `teacher-mahmoud-001:nonce:redirect`;
    const realHmac = crypto.createHmac('sha256', 'strong_production_secret');
    realHmac.update(payload);
    const realState = `${Buffer.from(payload).toString('base64')}.${realHmac.digest('hex')}`;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=123&state=${realState}`, {
      headers: { 'Cookie': `oauth_state=${realState}` }
    });

    // It should not fail with 500 missing secret, nor 403 invalid signature.
    const htmlA = await res.text();
    assert.ok(!htmlA.includes('Server configuration error: missing required cryptographic secrets.'), 'Must not fail closed when secret is present');
    assert.notStrictEqual(res.status, 403, 'Must successfully verify valid signature');
  });

  it('Test B: Production + secret missing -> OAuth state signing fails closed', async () => {
    setEnv('production', undefined);

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=123&state=dummy.state`, {
      headers: { 'Cookie': 'oauth_state=dummy.state' }
    });

    // Must fail before checking state
    assert.strictEqual(res.status, 500, 'Must FAIL CLOSED with 500 when secret is missing in production');
    const html = await res.text();
    assert.ok(html.includes('Server configuration error: missing required cryptographic secrets.'));
  });

  it('Test C: Known fallback attack -> Knowing "dev-secret" cannot produce an accepted state', async () => {
    setEnv('production', undefined); // Secret missing

    const payload = `teacher-mahmoud-001:nonce:redirect`;
    const fallbackHmac = crypto.createHmac('sha256', 'dev-secret');
    fallbackHmac.update(payload);
    const fakeState = `${Buffer.from(payload).toString('base64')}.${fallbackHmac.digest('hex')}`;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=123&state=${fakeState}`, {
      headers: {
        'Cookie': `oauth_state=${fakeState}`
      }
    });

    // In production with missing secret, the callback must fail closed entirely, not try to parse the state with dev-secret
    assert.strictEqual(res.status, 500, 'Must FAIL CLOSED safely instead of verifying against dev-secret');
    const html = await res.text();
    assert.ok(html.includes('Server configuration error: missing required cryptographic secrets.'));
  });

  it('Test D: Existing OAuth validation -> Teacher binding/state validation remains intact with real secret', async () => {
    setEnv('production', 'strong_production_secret');

    const payload = `teacher-mahmoud-001:nonce:redirect`;
    const realHmac = crypto.createHmac('sha256', 'strong_production_secret');
    realHmac.update(payload);
    const realState = `${Buffer.from(payload).toString('base64')}.${realHmac.digest('hex')}`;

    const res = await fetch(`${baseUrl}/api/integrations/google-calendar/callback?code=123&state=${realState}`, {
      headers: {
        'Cookie': `oauth_state=${realState}`
      }
    });

    // The validation passes, and it hits the next layer (which is Supabase DB integration complaining about no URL, returning 500 via the DB client)
    // The key is that it didn't return 403 CSRF or 500 Secret error.
    assert.notStrictEqual(res.status, 403, 'Should pass CSRF signature check');
    const html = await res.text();
    assert.ok(!html.includes('Server configuration error: missing required cryptographic secrets.'), 'Should not fail on secret check');
    assert.ok(html.includes('Google Calendar connection failed') || html.includes('Database'), 'Should safely error on the DB/Google exchange layer');
  });
});
