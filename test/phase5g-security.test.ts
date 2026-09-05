import { test } from 'node:test';
import * as assert from 'node:assert';
import { DateTime } from 'luxon';

test('Phase 5G - Final Security Micro-Fix Verification', async (t) => {
  const isProd = true; // We want to test production behavior endpoints
  const BASE_URL = 'http://localhost:3000';
  
  await t.test('Integration Availability - validates timezone', async () => {
    const res = await fetch(`${BASE_URL}/api/integrations/availability?timezone=Invalid/Zone`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, 'INVALID_AVAILABILITY_REQUEST');
  });

  await t.test('Integration Availability - validates days maximum', async () => {
    const res = await fetch(`${BASE_URL}/api/integrations/availability?days=999`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, 'INVALID_AVAILABILITY_REQUEST');
  });

  await t.test('Integration Availability - validates duration', async () => {
    const res = await fetch(`${BASE_URL}/api/integrations/availability?duration=90`);
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.code, 'INVALID_AVAILABILITY_REQUEST');
  });

  await t.test('Integration Validate Slot - validates invalid dates', async () => {
    const res = await fetch(`${BASE_URL}/api/integrations/validate-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledStartUtc: 'invalid', scheduledEndUtc: 'invalid' })
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.conflictReason, 'Invalid slot timestamps.');
  });
});
