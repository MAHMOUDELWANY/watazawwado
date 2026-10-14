import test from 'node:test';
import assert from 'node:assert';
import { createHmac } from 'crypto';
import { isValidStripeWebhookSignature } from '../server/payment/stripeService';

test('Stripe webhook signature: accepts a valid signature, rejects tampered, wrong-secret and stale events', () => {
  const secret = 'whsec_test';
  const body = '{"id":"evt_1","type":"checkout.session.completed"}';
  const t = 1_800_000_000;
  const sign = (b: string, s = secret) => createHmac('sha256', s).update(`${t}.${b}`).digest('hex');

  assert.strictEqual(isValidStripeWebhookSignature(Buffer.from(body), `t=${t},v1=${sign(body)}`, secret, t), true);
  assert.strictEqual(isValidStripeWebhookSignature(body, `t=${t},v1=deadbeef,v1=${sign(body)}`, secret, t + 10), true, 'any v1 may match');
  assert.strictEqual(isValidStripeWebhookSignature(body.replace('evt_1', 'evt_2'), `t=${t},v1=${sign(body)}`, secret, t), false);
  assert.strictEqual(isValidStripeWebhookSignature(body, `t=${t},v1=${sign(body, 'whsec_other')}`, secret, t), false);
  assert.strictEqual(isValidStripeWebhookSignature(body, `t=${t},v1=${sign(body)}`, secret, t + 301), false, 'replay window');
  assert.strictEqual(isValidStripeWebhookSignature(body, undefined, secret, t), false);
});
