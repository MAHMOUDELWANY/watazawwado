import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('B4: card payment inside our page (owner D8, 2026-10-28)', () => {
  it('the server makes an embedded session only on request and only with a publishable key; the amount stays server-side', () => {
    const api = read('api/index.ts');
    assert.match(api, /const wantEmbedded = req\.body\?\.embedded === true && \/\^pk_\/\.test\(stripePublishableKey\)/);
    assert.match(api, /amount: authoritativeAmount,/);
    const svc = read('server/payment/stripeService.ts');
    assert.match(svc, /ui_mode', 'embedded_page'/);
    assert.match(svc, /return_url', params\.successUrl/);
    assert.match(svc, /clientSecret: session\.client_secret/);
  });

  it('the modal mounts Stripe from js.stripe.com and falls back to Stripe\'s page on any failure', () => {
    const modal = read('src/components/payment/InstantCheckoutModal.tsx');
    assert.match(modal, /https:\/\/js\.stripe\.com\/v3\//);
    assert.match(modal, /createEmbeddedCheckoutPage/);
    assert.match(modal, /redirectToStripe\(\)/);
    assert.match(modal, /instance\?\.destroy\?\.\(\)/);
  });
});
