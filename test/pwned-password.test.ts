import test from 'node:test';
import assert from 'node:assert';
import { isPasswordLeaked } from '../src/lib/pwnedPassword';

// SHA-1("password") = 5BAA6 1E4C9B93F3F0682250B6CF8331B7EE68FD8
test('leaked-password check uses k-anonymity and matches the hash suffix', async () => {
  const realFetch = globalThis.fetch;
  let requested = '';
  globalThis.fetch = (async (url: string) => {
    requested = url;
    return new Response('0018A45C4D1DEF81644B54AB7F969B88D65:0\r\n1E4C9B93F3F0682250B6CF8331B7EE68FD8:9545824\r\n');
  }) as any;
  try {
    assert.strictEqual(await isPasswordLeaked('password'), true);
    assert.ok(requested.endsWith('/range/5BAA6'), 'only the 5-character prefix is sent');
    assert.strictEqual(await isPasswordLeaked('a-very-unusual-passphrase-91827'), false);
    globalThis.fetch = (async () => { throw new Error('offline'); }) as any;
    assert.strictEqual(await isPasswordLeaked('password'), false, 'fails open when offline');
  } finally {
    globalThis.fetch = realFetch;
  }
});
