/**
 * ====================================================================
 * WATAZAWWADO ACADEMY — STRIPE AUTOMATED PAYMENT SERVICE
 * File: server/payment/stripeService.ts
 * Role: Official Stripe REST API (Checkout Sessions, Verification)
 * ====================================================================
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface StripeConfig {
  publishableKey: string;
  secretKey: string;
  baseUrl: string;
}

export function getStripeConfig(): StripeConfig {
  const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
  const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
  const baseUrl = 'https://api.stripe.com/v1';

  return { publishableKey, secretKey, baseUrl };
}

export interface CreateStripeSessionParams {
  amount: number;
  currency: string;
  title: string;
  description?: string;
  customerEmail?: string;
  metadata: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

export interface StripeSessionResult {
  id: string;
  url: string;
  status: string;
}

/**
 * Creates a Stripe Checkout Session with authoritative server-side pricing.
 */
export async function createStripeCheckoutSession(
  params: CreateStripeSessionParams
): Promise<StripeSessionResult> {
  const { secretKey, baseUrl } = getStripeConfig();

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  const unitAmountInCents = Math.round(Number(params.amount) * 100);
  const currencyCode = (params.currency || 'USD').toLowerCase();

  const formParams = new URLSearchParams();
  formParams.append('mode', 'payment');
  // Expire before the booking's 35-minute payment hold ends (Stripe's minimum is 30 minutes).
  formParams.append('expires_at', String(Math.floor(Date.now() / 1000) + 31 * 60));
  formParams.append('success_url', params.successUrl);
  formParams.append('cancel_url', params.cancelUrl);
  
  if (params.customerEmail && params.customerEmail.includes('@')) {
    formParams.append('customer_email', params.customerEmail.trim());
  }

  // Line item
  formParams.append('line_items[0][price_data][currency]', currencyCode);
  formParams.append('line_items[0][price_data][unit_amount]', String(unitAmountInCents));
  formParams.append('line_items[0][price_data][product_data][name]', params.title || 'Watazawwado Academy Lesson');
  if (params.description) {
    formParams.append('line_items[0][price_data][product_data][description]', params.description);
  }
  formParams.append('line_items[0][quantity]', '1');

  // Metadata
  if (params.metadata) {
    for (const [key, val] of Object.entries(params.metadata)) {
      if (val !== undefined && val !== null) {
        formParams.append(`metadata[${key}]`, String(val));
      }
    }
  }

  const response = await fetch(`${baseUrl}/checkout/sessions`, {
    signal: AbortSignal.timeout(15000),
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: formParams.toString()
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Stripe Create Session Error]', response.status, errorData);
    throw new Error(`Failed to create Stripe session: ${errorData.error?.message || response.statusText}`);
  }

  const session = await response.json();
  return {
    id: session.id,
    url: session.url,
    status: session.status
  };
}

export interface StripeSessionVerification {
  id: string;
  paymentStatus: 'paid' | 'unpaid' | 'no_payment_required';
  status: 'open' | 'complete' | 'expired';
  amountTotal?: number;
  currency?: string;
  customerEmail?: string;
  customerName?: string;
  metadata?: Record<string, string>;
  paymentIntent?: string;
}

/**
 * Retrieves and verifies a Stripe Checkout Session.
 */
export async function retrieveStripeCheckoutSession(sessionId: string): Promise<StripeSessionVerification> {
  if (!sessionId || typeof sessionId !== 'string') {
    throw new Error('Valid Stripe sessionId is required.');
  }

  const { secretKey, baseUrl } = getStripeConfig();

  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured.');
  }

  const response = await fetch(`${baseUrl}/checkout/sessions/${encodeURIComponent(sessionId)}`, {
    signal: AbortSignal.timeout(15000),
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${secretKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[Stripe Retrieve Session Error]', response.status, errorData);
    throw new Error(`Failed to retrieve Stripe session: ${errorData.error?.message || response.statusText}`);
  }

  const session = await response.json();

  return {
    id: session.id,
    paymentStatus: session.payment_status,
    status: session.status,
    amountTotal: session.amount_total ? session.amount_total / 100 : undefined,
    currency: session.currency?.toUpperCase(),
    customerEmail: session.customer_details?.email || session.customer_email,
    customerName: session.customer_details?.name,
    metadata: session.metadata || {},
    paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id
  };
}

/**
 * Checks a webhook's Stripe-Signature header (HMAC-SHA256 of "timestamp.rawBody" with the
 * endpoint's whsec_ secret) and rejects events older than 5 minutes to stop replays.
 */
export function isValidStripeWebhookSignature(
  rawBody: Buffer | string,
  signatureHeader: string | undefined,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): boolean {
  if (!signatureHeader || !secret) return false;
  const parts = signatureHeader.split(',').map(p => p.split('='));
  const timestamp = Number(parts.find(([k]) => k === 't')?.[1]);
  if (!Number.isFinite(timestamp) || Math.abs(nowSeconds - timestamp) > 300) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.`).update(rawBody).digest();
  return parts
    .filter(([k]) => k === 'v1')
    .some(([, v]) => {
      const given = Buffer.from(v || '', 'hex');
      return given.length === expected.length && timingSafeEqual(given, expected);
    });
}
