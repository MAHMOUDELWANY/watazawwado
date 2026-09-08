import assert from 'node:assert';
import { describe, it } from 'node:test';
import crypto from 'crypto';
import fetch from 'node-fetch';

describe('Task 0.54: Google Calendar Teacher Identity Binding & OAuth Security', () => {
  it('Should generate signed state with teacherId embedded on auth-url', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/auth-url', {
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

  it('Callback should reject missing state', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/callback?code=testcode');
    assert.strictEqual(res.status, 403, 'Should reject missing state'); // wait, missing state actually returns 403 CSRF now, or wait, it falls to 403. 
    // Wait, the logic is: if (!expectedState || state !== expectedState) -> 403
  });

  it('Callback should reject mismatched state (CSRF)', async () => {
    const res = await fetch('http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=fake.state', {
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

    const res = await fetch(`http://localhost:3000/api/integrations/google-calendar/callback?code=testcode&state=${state}`, {
      headers: {
        'Cookie': `oauth_state=${state}`
      }
    });
    if (res.status !== 403) {
      console.log('callback signature fail response:', await res.text());
    }
    assert.strictEqual(res.status, 403, 'Should reject invalid signature');
  });
});
