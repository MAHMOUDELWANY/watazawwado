/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — EMAIL SERVICE (BREVO TRANSACTIONAL LAYER)
 * File: server/notifications/emailService.ts
 * Role: Provider-neutral transactional email service adapter backed by
 *       Brevo HTTP API (https://api.brevo.com/v3/smtp/email).
 * ====================================================================
 */

export const DEFAULT_TEACHER_EMAIL = 'mahmoudelwany98@gmail.com';
export const DEFAULT_SENDER_NAME = 'Mahmoud Elwany';

export const OFFICIAL_TEACHER_EMAIL =
  process.env.NOTIFICATION_TEACHER_EMAIL ||
  process.env.NOTIFICATION_FROM_EMAIL ||
  DEFAULT_TEACHER_EMAIL;

export const OFFICIAL_SENDER_NAME =
  process.env.NOTIFICATION_FROM_NAME || DEFAULT_SENDER_NAME;

export const OFFICIAL_SENDER_HEADER = `"${OFFICIAL_SENDER_NAME}" <${OFFICIAL_TEACHER_EMAIL}>`;

export interface SendEmailOptions {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
  replyToName?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  status: 'sent' | 'simulated_unconfigured' | 'unconfigured' | 'failed';
  provider: 'brevo' | 'simulation' | 'unconfigured';
  error?: string;
}

export interface EmailConfigStatus {
  isConfigured: boolean;
  provider: 'brevo' | 'unconfigured';
  senderEmail: string;
  senderName: string;
  replyToEmail: string;
  teacherEmail: string;
}

/**
 * Returns safe Email / Brevo configuration status for settings and dashboards.
 * NEVER exposes secrets or API keys.
 */
export function getEmailConfigStatus(): EmailConfigStatus {
  const apiKey = process.env.BREVO_API_KEY;
  const isConfigured = Boolean(apiKey && apiKey.trim().length > 0);

  const senderEmail = process.env.NOTIFICATION_FROM_EMAIL || DEFAULT_TEACHER_EMAIL;
  const senderName = process.env.NOTIFICATION_FROM_NAME || DEFAULT_SENDER_NAME;
  const replyToEmail =
    process.env.NOTIFICATION_REPLY_TO_EMAIL || senderEmail;
  const teacherEmail =
    process.env.NOTIFICATION_TEACHER_EMAIL || DEFAULT_TEACHER_EMAIL;

  return {
    isConfigured,
    provider: isConfigured ? 'brevo' : 'unconfigured',
    senderEmail,
    senderName,
    replyToEmail,
    teacherEmail
  };
}

/**
 * Legacy compatibility alias for settings dashboards.
 */
export function getGmailConfigStatus(): {
  isConfigured: boolean;
  senderEmail: string;
  provider: 'brevo' | 'unconfigured';
} {
  const status = getEmailConfigStatus();
  return {
    isConfigured: status.isConfigured,
    senderEmail: status.senderEmail,
    provider: status.provider
  };
}

/**
 * Validates basic email address structure.
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Provider-neutral email sender backed by Brevo Transactional Email HTTP API.
 * 
 * Rules:
 * 1. If BREVO_API_KEY is configured, sends via POST https://api.brevo.com/v3/smtp/email.
 * 2. In production (NODE_ENV === 'production') without BREVO_API_KEY:
 *    Returns { success: false, status: 'unconfigured' }. Never fakes 'sent'.
 * 3. In non-production without BREVO_API_KEY:
 *    Returns { success: false, status: 'simulated_unconfigured' } and logs safe notice.
 * 4. All provider errors are sanitized before returning to client callers.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const config = getEmailConfigStatus();
  const apiKey = process.env.BREVO_API_KEY?.trim();
  const isProduction = process.env.NODE_ENV === 'production';

  // 1. Recipient validation
  if (!options.to || !isValidEmail(options.to)) {
    return {
      success: false,
      status: 'failed',
      provider: config.isConfigured ? 'brevo' : 'unconfigured',
      error: 'Invalid recipient email address.'
    };
  }

  // 2. Unconfigured Handling
  if (!config.isConfigured || !apiKey) {
    if (isProduction) {
      // Production must NEVER claim email was sent without real provider
      console.warn('[Email Alert] Email delivery attempted in production but BREVO_API_KEY is not configured.');
      return {
        success: false,
        status: 'unconfigured',
        provider: 'unconfigured',
        error: 'Email delivery is not configured.'
      };
    }

    // Development / preview simulation mode
    console.log(`[Email Simulation - Development Mode]
To: ${options.to} ${options.toName ? `(${options.toName})` : ''}
Subject: "${options.subject}"
From: "${config.senderName}" <${config.senderEmail}>
Note: Set BREVO_API_KEY to enable live email delivery.`);

    return {
      success: false,
      status: 'simulated_unconfigured',
      provider: 'simulation',
      error: 'Email delivery is in development simulation mode (BREVO_API_KEY unconfigured).'
    };
  }

  // 3. Brevo Transactional API Dispatch
  try {
    const senderEmail = process.env.NOTIFICATION_FROM_EMAIL || DEFAULT_TEACHER_EMAIL;
    const senderName = process.env.NOTIFICATION_FROM_NAME || DEFAULT_SENDER_NAME;
    const replyToEmail =
      options.replyTo ||
      process.env.NOTIFICATION_REPLY_TO_EMAIL ||
      senderEmail;
    const replyToName =
      options.replyToName ||
      process.env.NOTIFICATION_FROM_NAME ||
      senderName;

    const requestBody = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: options.to.trim(),
          ...(options.toName ? { name: options.toName.trim() } : {})
        }
      ],
      subject: options.subject,
      htmlContent: options.html,
      textContent: options.text,
      replyTo: {
        email: replyToEmail.trim(),
        name: replyToName
      }
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    let response: Response;
    try {
      response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.ok) {
      let messageId: string | undefined;
      try {
        const responseData = await response.json();
        messageId = responseData?.messageId || responseData?.id;
      } catch {
        // Response succeeded without parseable JSON messageId
        messageId = `brevo-${Date.now()}`;
      }

      return {
        success: true,
        status: 'sent',
        provider: 'brevo',
        messageId: messageId ? String(messageId) : `brevo-${Date.now()}`
      };
    }

    // Handle provider error without exposing secrets or raw internal error payloads
    let sanitizedError = 'Email delivery failed.';
    try {
      const errorJson = await response.json();
      if (response.status === 401 || response.status === 403) {
        console.error('[Brevo Auth Error] Invalid or unauthorized BREVO_API_KEY. Status:', response.status);
        sanitizedError = 'Email service authentication failed.';
      } else if (response.status === 400) {
        console.error('[Brevo Bad Request] Message rejected by provider. Code:', errorJson?.code, 'Message:', errorJson?.message);
        sanitizedError = 'Email parameters rejected by provider.';
      } else if (response.status === 402 || response.status === 429) {
        console.error('[Brevo Rate Limit / Quota] Quota exceeded. Status:', response.status);
        sanitizedError = 'Email daily send limit reached. Please try again later.';
      } else {
        console.error('[Brevo Dispatch Error] Status:', response.status);
        sanitizedError = 'Email delivery failed.';
      }
    } catch {
      console.error('[Brevo HTTP Error] Status:', response.status);
    }

    return {
      success: false,
      status: 'failed',
      provider: 'brevo',
      error: sanitizedError
    };
  } catch (err: any) {
    const isTimeout = err?.name === 'AbortError';
    console.error('[Email Dispatch Network Error]', isTimeout ? 'Request timed out after 10s' : 'Network failure');
    return {
      success: false,
      status: 'failed',
      provider: 'brevo',
      error: isTimeout ? 'Email provider request timed out.' : 'Email dispatch failed.'
    };
  }
}
