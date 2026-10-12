/**
 * ====================================================================
 * WATAZAWWADO ACADEMY — PAYPAL AUTOMATED PAYMENT SERVICE
 * File: server/payment/paypalService.ts
 * Role: Official PayPal REST v2 Integration (OAuth2, Orders, Capture)
 * ====================================================================
 */

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  mode: 'live' | 'sandbox';
  baseUrl: string;
}

export function getPayPalConfig(): PayPalConfig {
  const clientId = (process.env.PAYPAL_CLIENT_ID || '').trim();
  const clientSecret = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
  const mode = (process.env.PAYPAL_MODE || 'live').toLowerCase() === 'sandbox' ? 'sandbox' : 'live';
  const baseUrl = mode === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';

  return { clientId, clientSecret, mode, baseUrl };
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

/**
 * Retrieves a valid OAuth2 Bearer token from PayPal.
 * Caches tokens until 60 seconds before expiration.
 */
export async function getPayPalAccessToken(): Promise<string> {
  const { clientId, clientSecret, baseUrl } = getPayPalConfig();

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials missing: PAYPAL_CLIENT_ID or PAYPAL_CLIENT_SECRET is not configured.');
  }

  const now = Date.now();
  if (cachedAccessToken && cachedAccessToken.expiresAt > now) {
    return cachedAccessToken.token;
  }

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PayPal OAuth Error]', response.status, errorText);
    throw new Error(`PayPal authentication failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const token = data.access_token as string;
  const expiresInSeconds = Number(data.expires_in) || 3600;

  cachedAccessToken = {
    token,
    expiresAt: now + (expiresInSeconds - 60) * 1000
  };

  return token;
}

export interface CreateOrderParams {
  amount: number;
  currency: string;
  description?: string;
  customId?: string;
  invoiceId?: string;
  referenceId?: string;
}

export interface PayPalOrderResult {
  id: string;
  status: string;
}

/**
 * Creates a PayPal Order server-side with authoritative pricing.
 */
export async function createPayPalOrder(params: CreateOrderParams): Promise<PayPalOrderResult> {
  const token = await getPayPalAccessToken();
  const { baseUrl } = getPayPalConfig();

  const formattedAmount = Number(params.amount).toFixed(2);
  const currencyCode = (params.currency || 'USD').toUpperCase();

  const bodyPayload: any = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        reference_id: params.referenceId || 'default_unit',
        description: params.description || 'Watazawwado Academy Educational Services',
        custom_id: params.customId || undefined,
        invoice_id: params.invoiceId || undefined,
        amount: {
          currency_code: currencyCode,
          value: formattedAmount
        }
      }
    ],
    application_context: {
      brand_name: 'Watazawwado Academy',
      landing_page: 'NO_PREFERENCE',
      user_action: 'PAY_NOW',
      shipping_preference: 'NO_SHIPPING'
    }
  };

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[PayPal Create Order Error]', response.status, errorData);
    throw new Error(`Failed to create PayPal order: ${errorData.message || response.statusText}`);
  }

  const order = await response.json();
  return {
    id: order.id,
    status: order.status
  };
}

export interface PayPalCaptureResult {
  id: string;
  status: string; // 'COMPLETED'
  captureId?: string;
  amount?: number;
  currency?: string;
  payerEmail?: string;
  payerName?: string;
  customId?: string;
}

/**
 * Captures an authorized PayPal order server-side and verifies completion.
 */
export async function capturePayPalOrder(orderId: string): Promise<PayPalCaptureResult> {
  if (!orderId || typeof orderId !== 'string') {
    throw new Error('Valid PayPal orderId is required.');
  }

  const token = await getPayPalAccessToken();
  const { baseUrl } = getPayPalConfig();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('[PayPal Capture Order Error]', response.status, errorData);
    throw new Error(`Failed to capture PayPal order: ${errorData.message || errorData.details?.[0]?.description || response.statusText}`);
  }

  const captureData = await response.json();
  const captureUnit = captureData.purchase_units?.[0]?.payments?.captures?.[0];

  return {
    id: captureData.id,
    status: captureData.status,
    captureId: captureUnit?.id,
    amount: captureUnit?.amount?.value ? Number(captureUnit.amount.value) : undefined,
    currency: captureUnit?.amount?.currency_code,
    payerEmail: captureData.payer?.email_address,
    payerName: captureData.payer?.name?.given_name ? `${captureData.payer.name.given_name} ${captureData.payer.name.surname || ''}`.trim() : undefined,
    customId: captureUnit?.custom_id || captureData.purchase_units?.[0]?.custom_id
  };
}

/**
 * Fetches order details to verify order status without capturing.
 */
export async function getPayPalOrderDetails(orderId: string): Promise<any> {
  const token = await getPayPalAccessToken();
  const { baseUrl } = getPayPalConfig();

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${encodeURIComponent(orderId)}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch PayPal order details (${response.status})`);
  }

  return response.json();
}
