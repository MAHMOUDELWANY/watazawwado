import crypto from 'crypto';
import { MASTER_SPEC } from '../src/data/master_spec.js';
import { FAQS, HOW_IT_WORKS_STEPS } from '../src/data/content.js';
import { SITE_FACTS } from '../server/siteFacts.js';
import express from 'express';
import { waitUntil } from '@vercel/functions';
import { DateTime } from 'luxon';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { encryptToken } from '../server/integrations/crypto.js';
import {
  getActiveGoogleConnection,
  isTeacherCurrentlyAuthorized
} from '../server/integrations/syncEngine.js';
import { getZoomCredentials, getZoomStartUrl } from '../server/integrations/zoom.js';
import {
  generateGoogleAuthUrl,
  exchangeGoogleCodeForTokens,
  getGoogleOAuthCredentials,
  sanitizeGoogleAuthCode
} from '../server/integrations/googleCalendar.js';
import {
  syncBookingIntegrations,
  syncRescheduledBooking,
  syncCancelledBooking
} from '../server/integrations/syncEngine.js';
import {
  computeAvailableSlots,
  validateSlotAvailability,
  resolveAuthoritativeTeacherForAvailability,
  isOnLaterDay
} from '../server/integrations/availabilityEngine.js';
import {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
} from '../server/leadTransitions.js';
import { dispatchNotification } from '../server/notifications/dispatcher.js';
import { ACADEMY_PHONE_DIGITS } from '../server/notifications/whatsapp.js';
import {
  scheduleBookingReminders,
  rescheduleBookingReminders,
  cancelBookingReminders,
  processDueReminders
} from '../server/notifications/reminderEngine.js';
import { processIntegrationJobs } from '../server/integrations/worker.js';
import { getEmailConfigStatus, sendEmail } from '../server/notifications/emailService.js';
import { renderWelcomeEmail } from '../server/notifications/emailTemplates.js';
import { resolveEmailLanguage } from '../server/notifications/dispatcher.js';
import {
  evaluateAssessment,
  findForbiddenPricingFields,
  SUPPORTED_DURATIONS,
  type ServiceAssessment
} from '../server/pricing/pricingEngine.js';
import { computeOffer, isLegitimateOffer } from '../server/pricing/offers.js';
import { lessonFeeUsd } from '../server/pricing/pricingEngine.js';
import {
  runIntakeTurn,
  parseModelJson,
  INTAKE_OPENING_AR,
  INTAKE_OPENING_EN,
  type IntakeTurnMessage
} from '../server/intake/intakeService.js';
import { createIntakeToken, readIntakeToken } from '../server/intake/intakeToken.js';
import { registerCommunityRoutes, ensureTeacherThreads, PLACEMENT_BEFORE_BOOKING } from '../server/routes/community.js';
import { registerCrmRoutes, createCrmTask } from '../server/routes/crm.js';
import { registerExportRoutes } from '../server/routes/exports.js';
import { registerFunnelRoutes } from '../server/routes/funnel.js';
import { registerFeedbackRoutes } from '../server/routes/feedback.js';
import { registerPrivacyRoutes } from '../server/routes/privacy.js';
import { registerTeacherLoadRoutes } from '../server/routes/teacherLoad.js';
import { registerSummaryDraftRoutes } from '../server/routes/summaryDraft.js';
import { registerCalendarFeedRoutes } from '../server/routes/calendarFeed.js';
import { registerLessonTeacherMoveRoutes } from '../server/routes/lessonTeacherMove.js';
import { registerAccountPreferenceRoutes } from '../server/routes/accountPreferences.js';
import { findSubject, levelsFor } from '../src/components/onboarding/subjects.js';
import { registerOpsRoutes, computeHealth, apiErrorMonitor, recordHeartbeat, HEARTBEAT_REMINDER_CRON, HEARTBEAT_STRIPE_WEBHOOK } from '../server/routes/ops.js';
import { registerCurriculumRoutes } from '../server/routes/curriculum.js';
import { registerProgressRoutes, validateFamilyNoteFields, canTeacherWriteForLesson } from '../server/routes/progress.js';
import { announceNewStudent, type NewLearner } from '../server/onboarding/newStudent.js';
import { isAdultAge, isGuardianAge, isChildAge, parseAge, ADULT_MIN_AGE, GUARDIAN_MIN_AGE, CHILD_MIN_AGE, CHILD_MAX_AGE } from '../src/lib/ageRules.js';
import { sanitizeLeadSource, isHeardAbout } from '../src/lib/leadSource.js';
import { notifyUser, notifySuperAdmins, resolveLearnerAccount } from '../server/notifications/inbox.js';
import { notifyLowBalance } from '../server/notifications/lowBalance.js';
import { studentRescheduleBlock, studentCancelBlock, nextWeekSlot } from '../server/booking/studentWindows.js';
import { processTrialFollowUps } from '../server/notifications/trialFollowUp.js';
import { processQuietLearners, quietEmailsEnabled, isQuietRunHour } from '../server/notifications/quietLearners.js';
import { processMonthlyProgressEmails, monthlyEmailsEnabled, isSendWindow, reportMonthFor, monthLabel } from '../server/notifications/monthlyProgress.js';
import {
  validateIntakeOutput
} from '../server/intake/intakeSchema.js';
import {
  resolveOfferPurchasability,
  CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
  type CatalogEntry
} from '../server/pricing/offerPurchasability.js';
import {
  createStripeCheckoutSession,
  retrieveStripeCheckoutSession,
  getStripeConfig,
  isValidStripeWebhookSignature,
  type StripeSessionVerification
} from '../server/payment/stripeService.js';

dotenv.config();

const app = express();

export function getSupabaseAdminClient() {
  const rawUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
  if (!cleanUrl || !serviceKey) return null;
  try {
    return createClient(cleanUrl, serviceKey, {
      auth: { persistSession: false },
      global: { fetch: (input: any, init?: any) => globalThis.fetch(input, init) }
    });
  } catch {
    return null;
  }
}

const EMAIL_PATTERN = /^[^\s@,()"'%*\\;:<>]+@[^\s@,()"'%*\\;:<>]+\.[^\s@,()"'%*\\;:<>]+$/;

/** Basic email shape check that also rejects characters with meaning in PostgREST filters. */
export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}

/** Quotes a value for use inside a PostgREST .or() filter so commas/parens can't inject conditions. */
export function pgrstValue(value: string): string {
  return '"' + String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

/** Escapes LIKE wildcards so the value is matched literally by ilike. */
export function escapeLike(value: string): string {
  return String(value).replace(/[\\%_*]/g, m => '\\' + m);
}

/** auth.admin.listUsers() returns one page (50 users by default); walk every page. */
async function listAllAuthUsers(client: any): Promise<any[]> {
  const users: any[] = [];
  for (let page = 1; page <= 100; page++) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const batch = data?.users || [];
    users.push(...batch);
    if (batch.length < 1000) break;
  }
  return users;
}

/**
 * Queues the calendar/Zoom/reminder/confirmation job for a confirmed booking and starts it without
 * holding up the response (Google + Zoom + emails take several seconds). waitUntil keeps the Vercel
 * function alive until it finishes; the cron worker retries anything left pending.
 */
async function enqueueAndRunBookingSync(client: any, bookingId: string): Promise<void> {
  const { error } = await client.from('integration_jobs').insert({ booking_id: bookingId, job_type: 'booking_sync', status: 'pending' });
  // 23505: an open job for this booking already exists (partial unique index); just run it.
  if (error && error.code !== '23505') {
    console.warn('[Booking Sync] enqueue failed:', error.message);
    return;
  }
  waitUntil(
    processIntegrationJobs(1, undefined, bookingId).catch(err => {
      console.warn('[Booking Sync] immediate run failed, left for the cron worker', err);
    })
  );
}

/** An error whose message was written for end users and may be returned as-is. */
class PublicError extends Error {}

/**
 * Message safe to send to a client: our own PublicError text, or a message raised on purpose
 * by our SQL functions (RAISE EXCEPTION ... ERRCODE 'P0xxx'). Anything else (PostgREST, provider
 * or driver errors) is replaced by the fallback; the caller logs the detail.
 */
function clientErrorMessage(err: any, fallback: string): string {
  if (err instanceof PublicError) return err.message;
  if (err && typeof err.code === 'string' && err.code.startsWith('P0') && err.message) return err.message;
  return fallback;
}

/** How long an unpaid booking holds its slot (RULES.md §2). Longer than Stripe's 30-minute session. */
const PAYMENT_HOLD_MINUTES = 35;
// RULES.md §2/§5 (decided 2026-10-14).
const MAX_LOST_TRIALS = 5;
const MAX_STUDENT_REFUNDED_LESSONS = 3;
// Bump when the terms page changes in substance; stored with each booking/package as proof of consent.
const TERMS_VERSION = '2026-10-20.1';
// Keep in sync with AGREEMENT_VERSION in src/pages/StaffAgreementPage.tsx; bump to make every teacher accept again.
const TEACHER_AGREEMENT_VERSION = '2026-10-15.2';

/** Cancels unpaid bookings whose payment hold expired, freeing their slots. Never throws. */
async function releaseExpiredPaymentHolds(client: any): Promise<void> {
  try {
    const { error } = await client.rpc('release_expired_payment_holds');
    if (error) console.warn('[Payment Holds] release failed:', error.message);
  } catch (err) {
    console.warn('[Payment Holds] release failed:', err);
  }
}

function devAuthDisabled(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production' || process.env.ALLOW_DEV_AUTH !== 'true';
}

const PRODUCTION_APP_ORIGIN = 'https://watazawwado.academy';

/** Returns the request origin only if it is one of this site's own origins; otherwise the canonical app origin. */
function resolveTrustedAppOrigin(requestOrigin?: string): string {
  const trusted = new Set<string>([PRODUCTION_APP_ORIGIN, 'https://www.watazawwado.academy']);
  let appOrigin = PRODUCTION_APP_ORIGIN;
  if (process.env.APP_URL) {
    try {
      appOrigin = new URL(process.env.APP_URL).origin;
      trusted.add(appOrigin);
    } catch { /* keep default */ }
  }
  if (process.env.NODE_ENV !== 'production') trusted.add('http://localhost:3000');
  return requestOrigin && trusted.has(requestOrigin) ? requestOrigin : appOrigin;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

// Note: this store is per serverless instance, so it only slows abuse down. A shared
// store (e.g. Vercel WAF rate limiting or Upstash) is needed for a hard limit.
function getClientIp(req: express.Request): string {
  const realIp = req.headers['x-real-ip'];
  if (typeof realIp === 'string' && realIp) return realIp.trim();
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket.remoteAddress || 'unknown';
}

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = getClientIp(req);
  const now = Date.now();

  if (rateLimitStore.size > 10000) {
    for (const [key, entry] of rateLimitStore) {
      if (now > entry.resetTime) rateLimitStore.delete(key);
    }
  }

  let record = rateLimitStore.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + RATE_LIMIT_WINDOW };
  }

  record.count++;
  rateLimitStore.set(ip, record);

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  next();
}

// rawBody is kept for the Stripe webhook signature check.
app.use(express.json({ limit: '1mb', verify: (req: any, _res, buf) => { req.rawBody = buf; } }));
app.use('/api', apiErrorMonitor(getSupabaseAdminClient));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/learning-guide', rateLimit, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: 'Invalid or missing messages payload.' });
    }

    // Rebuild the conversation server-side: only user/model turns with a single text part,
    // so callers can't smuggle extra parts, files or other roles to the model.
    const contents = messages.map((msg: any) => ({
      role: msg?.role === 'model' ? 'model' : 'user',
      parts: [{ text: typeof msg?.parts?.[0]?.text === 'string' ? msg.parts[0].text : '' }]
    }));
    if (contents[contents.length - 1].role !== 'user' || contents.some(c => !c.parts[0].text)) {
      return res.status(400).json({ error: 'Invalid or missing messages payload.' });
    }

    const totalLength = contents.reduce((acc, c) => acc + c.parts[0].text.length, 0);
    if (totalLength > 10000) {
      return res.status(400).json({ error: 'Payload too large.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Homepage guide (owner request 2026-10-16): answers "who are you / how does it work / prices"
    // from the site's own content, summarizes it for people who don't want to read, and when a
    // visitor sounds interested, warmly invites them to book the free trial.
    const faqText = FAQS.map((f: any) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
    const stepsText = (HOW_IT_WORKS_STEPS as any[]).map((s: any, i: number) => `${i + 1}. ${s.title || s.titleEn || ''}: ${s.description || s.descriptionEn || ''}`).join('\n');
    const systemInstruction = `You are the friendly guide on the Watazawwado homepage (online 1-on-1 Quran, Tajweed, the Zad Path, Arabic and English lessons).
Your job:
1. Answer visitors' questions about who we are, how it works, subjects, teachers, prices, the free trial, payments and policies, using ONLY the facts below. If something is not covered, say you'll let the team answer and suggest WhatsApp or the website chat. Never invent prices, names, degrees or promises.
2. If someone doesn't want to read the pages, give a short, clear summary (a few lines or bullets).
3. Whenever the visitor shows any interest in trying, starting, prices, their child, or their level, warmly encourage them to book the free trial lesson: explain it's free, 30 minutes, no card needed, and the steps (free account → short profile → pick a time → short placement test after booking). Invite them with a short call to action like "Book your free trial from the button at the top of the page." Be encouraging, never pushy, no fake urgency.
Tone: warm, human, short answers (usually under 120 words). Reply in the visitor's language: English, or Arabic (simple Arabic with a friendly Egyptian touch) if they write in Arabic.
<current_facts priority="highest">
${SITE_FACTS}
</current_facts>
<how_it_works>
${stepsText}
</how_it_works>
<faq note="older wording; current_facts wins on any difference">
${faqText}
</faq>
<background_spec note="older product vision; current_facts wins on any difference">
${MASTER_SPEC}
</background_spec>`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error('AI Error:', error);
    res.status(500).json({ error: 'Failed to generate response.' });
  }
});

// 1. INTEGRATIONS: STATUS ENDPOINT
app.get('/api/integrations/status', verifyTeacherAuth, async (req: any, res) => {
  try {
    const teacherId = req.teacherUser?.id;
    const googleConn = teacherId ? await getActiveGoogleConnection(teacherId) : null;
    const googleCreds = getGoogleOAuthCredentials();
    const zoomCreds = getZoomCredentials();
    const emailStatus = getEmailConfigStatus();

    res.json({
      googleCalendar: {
        isConfigured: googleCreds.isConfigured,
        isConnected: !!googleConn,
        accountEmail: googleConn?.accountEmail || null
      },
      zoom: {
        isConfigured: zoomCreds.isConfigured
      },
      email: {
        isConfigured: emailStatus.isConfigured,
        provider: 'Brevo',
        senderEmail: emailStatus.senderEmail,
        senderName: emailStatus.senderName,
        teacherEmail: emailStatus.teacherEmail
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// 2. INTEGRATIONS: GOOGLE CALENDAR AUTH URL
app.get('/api/integrations/google-calendar/auth-url', verifyTeacherAuth, (req: any, res: any) => {
  try {
    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });
    }

    const { redirectUri, isConfigured } = getGoogleOAuthCredentials();
    if (!isConfigured) {
      return res.status(503).json({
        error: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL or GOOGLE_REDIRECT_URI in environment.',
        isConfigured: false
      });
    }

    const nonce = crypto.randomBytes(16).toString('hex');
    const b64Redirect = Buffer.from(redirectUri).toString('base64');
    const payload = `${teacherId}:${nonce}:${b64Redirect}`;
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const signature = hmac.digest('hex');
    const state = `${Buffer.from(payload).toString('base64')}.${signature}`;

    res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    const authUrl = generateGoogleAuthUrl(state, redirectUri);
    res.json({ authUrl });
  } catch (error: any) {
    console.error("AUTH_URL_ERROR:", error); res.status(500).json({ error: 'Failed to start Google Calendar connection.' });
  }
});

// 3. INTEGRATIONS: GOOGLE CALENDAR OAUTH CALLBACK
app.get('/api/integrations/google-calendar/callback', async (req: any, res: any) => {
  const isProduction = process.env.NODE_ENV === 'production';
  let trustedOrigin: string | null = null;

  if (process.env.APP_URL) {
    try {
      const parsedUrl = new URL(process.env.APP_URL);
      if (parsedUrl.protocol === 'http:' || parsedUrl.protocol === 'https:') {
        trustedOrigin = parsedUrl.origin;
      }
    } catch {
      trustedOrigin = null;
    }
  } else if (!isProduction) {
    trustedOrigin = 'http://localhost:3000';
  }

  const renderError = (status: number, message: string) => {
    const postMessageScript = trustedOrigin ? `
            <script>
              if (window.opener) {
                try {
                  const payload = ${JSON.stringify({ type: 'GOOGLE_CALENDAR_ERROR', error: message }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')};
                  window.opener.postMessage(payload, '${trustedOrigin}');
                } catch (e) {}
              }
            </script>` : '';

    res.status(status).send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Google Calendar Connection Failed</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #FAF8F5;
              color: #362E3B;
              padding: 24px;
              box-sizing: border-box;
            }
            .card {
              background: white;
              border-radius: 12px;
              padding: 32px;
              max-width: 440px;
              width: 100%;
              text-align: center;
              box-shadow: 0 4px 20px rgba(54, 46, 59, 0.08);
              border: 1px solid #E8E5E0;
            }
            h2 { color: #BA7A6A; margin-top: 0; font-size: 20px; }
            p { color: #574F5A; font-size: 14px; line-height: 1.5; margin-bottom: 24px; }
            button {
              background: #087D91;
              color: white;
              border: none;
              border-radius: 8px;
              padding: 10px 20px;
              font-size: 14px;
              cursor: pointer;
              font-weight: 500;
            }
            button:hover { background: #5B7A68; }
          </style>
        </head>
        <body>
          <div class="card">
            <h2>Connection Incomplete</h2>
            <p>${message}</p>
            <button onclick="window.close()">Close Window</button>
            ${postMessageScript}
          </div>
        </body>
      </html>
    `);
  };

  try {
    const rawCode = req.query.code;
    const state = req.query.state as string;
    if (!rawCode) {
      return renderError(400, 'Missing authorization code.');
    }

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const expectedState = match ? match[1] : null;

    if (!expectedState || state !== expectedState) {
      return renderError(403, 'Invalid or expired OAuth state parameter (CSRF).');
    }

    const parts = state.split('.');
    if (parts.length !== 2) {
      return renderError(403, 'Malformed OAuth state parameter.');
    }
    const [b64Payload, signature] = parts;

    const payload = Buffer.from(b64Payload, 'base64').toString('utf8');
    const hmac = crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-secret');
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');

    const sigBuf = Buffer.from(String(signature), 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
    if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
      return renderError(403, 'Invalid OAuth state signature.');
    }

    const [teacherId, nonce, b64Redirect] = payload.split(':');
    if (!teacherId) {
      return renderError(403, 'OAuth state missing teacher identity.');
    }

    let embeddedRedirectUri: string | undefined;
    if (b64Redirect) {
      try {
        embeddedRedirectUri = Buffer.from(b64Redirect, 'base64').toString('utf8');
        if (embeddedRedirectUri) {
          const redirectOrigin = new URL(embeddedRedirectUri).origin;
          if (redirectOrigin) {
            trustedOrigin = redirectOrigin;
          }
        }
      } catch {
        embeddedRedirectUri = undefined;
      }
    }

    // Explicitly revalidate teacher authorization at callback time
    const isAuthorized = await isTeacherCurrentlyAuthorized(teacherId);
    if (!isAuthorized) {
      return renderError(403, 'Unauthorized: Teacher account is not authorized or has been deactivated.');
    }

    const { isConfigured } = getGoogleOAuthCredentials(embeddedRedirectUri);
    if (!isConfigured) {
      return renderError(503, 'Configuration Error: Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL or GOOGLE_REDIRECT_URI in environment.');
    }

    const code = sanitizeGoogleAuthCode(rawCode);
    const tokenData = await exchangeGoogleCodeForTokens(code, embeddedRedirectUri);

    // Store securely in DB using service role
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      // Invalidate old connections FOR THIS TEACHER ONLY
      const { error: updateError } = await supabase
        .from('calendar_connections')
        .update({ is_active: false })
        .eq('provider', 'google_calendar')
        .eq('teacher_id', teacherId);

      if (updateError) {
        console.error('[OAuth Callback] Failed to deactivate previous calendar connections:', updateError);
        return renderError(500, 'Database Error: Failed to prepare calendar connection state. Please try again.');
      }

      // Insert new connection
      const { data: insertData, error: insertError } = await supabase.from('calendar_connections').insert({
        teacher_id: teacherId,
        provider: 'google_calendar',
        account_email: tokenData.accountEmail || 'unknown@calendar.google.com',
        is_active: true,
        metadata: {
          access_token: encryptToken(tokenData.accessToken),
          refresh_token: tokenData.refreshToken ? encryptToken(tokenData.refreshToken) : undefined,
          expires_at: tokenData.expiresAt
        }
      }).select('id').single();

      if (insertError || !insertData) {
        console.error('[OAuth Callback] Failed to insert new calendar connection:', insertError);
        return renderError(500, 'Database Error: Google Calendar was authorized, but the connection could not be saved to your account. Please try again.');
      }
    } else {
      console.error('[OAuth Callback] Missing Supabase configuration. Cannot persist calendar connection.');
      return renderError(503, 'Configuration Error: Database credentials missing. Please contact support.');
    }

    if (!trustedOrigin) {
      console.error('[OAuth Callback] Trusted origin could not be determined. APP_URL is missing or invalid.');
      return renderError(500, 'Authentication Failed: Google Calendar connection failed. Please try again.');
    }

    const safePayload = JSON.stringify({
      type: 'GOOGLE_CALENDAR_CONNECTED',
      email: tokenData.accountEmail || 'Connected'
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    // Clear oauth_state cookie to prevent replay attacks
    res.setHeader('Set-Cookie', 'oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');

    // Return HTML to close popup and notify parent
    res.send(`
      <!DOCTYPE html>
      <html>
        <head><title>Integration Successful</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAF8F5; color: #362E3B;">
          <div style="text-align: center;">
            <h2 style="color: #087D91;">Integration Successful!</h2>
            <p>Google Calendar has been connected. You can close this window.</p>
            <script>
              if (window.opener) {
                try {
                  window.opener.postMessage(${safePayload}, '${trustedOrigin}');
                } catch (e) {}
                setTimeout(() => window.close(), 1500);
              } else {
                setTimeout(() => window.close(), 2500);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.warn("[OAuth Callback] Connection exchange failed:", error?.message || error);
    renderError(500, 'Authentication Failed: Google Calendar connection failed. Please try again.');
  }
});

// 6. INTEGRATIONS: GOOGLE CALENDAR DISCONNECT
app.post('/api/integrations/google-calendar/disconnect', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

      await supabase
        .from('calendar_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('provider', 'google_calendar')
        .eq('teacher_id', teacherId);
    }

    res.json({ success: true, message: 'Google Calendar disconnected.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to disconnect Google Calendar.', code: 'DISCONNECT_FAILED' });
  }
});

// --- AUTH HELPER ---
async function getVerifiedBookingManagement(referenceCode: string, managementToken: string): Promise<any | null> {
  if (!referenceCode || !managementToken) return null;
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[Configuration Error] SUPABASE_SERVICE_ROLE_KEY missing for management auth check.');
    return null; // Fail closed
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc('get_booking_management', {
    p_reference_code: referenceCode,
    p_management_token: managementToken
  });

  if (error || !data || !data.reference) {
    return null;
  }

  // Ensure bookingId is populated
  if (!data.bookingId) {
    const { data: b } = await supabase
      .from('bookings')
      .select('id')
      .eq('reference_code', data.reference)
      .maybeSingle();
    if (b?.id) {
      data.bookingId = b.id;
    }
  }

  return data;
}

async function verifyManagementToken(referenceCode: string, managementToken: string): Promise<boolean> {
  const data = await getVerifiedBookingManagement(referenceCode, managementToken);
  return Boolean(data && data.reference);
}
// ---

// 7. INTEGRATIONS: SYNC BOOKING (CALENDAR & ZOOM)

// ==========================================
// Phase 3A: Package Catalog Integration
// ==========================================


app.get('/api/packages', async (req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { data, error } = await supabaseAdmin
      .from('package_catalog')
      .select('id, package_type, name, lesson_count, price_amount, currency, is_active, eligibility_rules')
      .eq('is_active', true)
      .order('price_amount', { ascending: true });

    if (error) {
      // If table does not exist or fails, fail gracefully
      console.warn('[Package Catalog] Error fetching packages:', error.message);
      return res.json({ success: true, data: [] });
    }

    res.json({ success: true, data: data || [] });
  } catch (err) {
    console.error('[Package Catalog] Unexpected error:', err);
    res.json({ success: true, data: [] });
  }
});

// ====================================================================
// AUTHORITATIVE BOOKING RESERVATION & CREATION ENDPOINT
// ====================================================================
app.post('/api/bookings/create', rateLimit, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const {
      serviceId,
      duration,
      date,
      timeSlot,
      timezone,
      contactName,
      contactEmail,
      contactWhatsapp,
      parentName,
      audience,
      goal,
      notes,
      teacherId,
      packageEntitlementId,
      studentId,
      mode
    } = req.body || {};

    let cleanEmail = String(contactEmail || '').trim().toLowerCase();
    const cleanName = String(contactName || '').trim();
    const cleanParentName = String(parentName || '').trim();
    const cleanWhatsapp = String(contactWhatsapp || '').trim();
    const cleanTimezone = String(timezone || 'Africa/Cairo').trim();
    const cleanServiceId = String(serviceId || 'quran-reading').trim();
    const cleanMode = mode === 'trial' ? 'trial' : 'regular';
    const isTrial = cleanMode === 'trial';
    const isChild = audience === 'child';
    const durationMins = Number(duration) || 60;

    if (![30, 45, 60].includes(durationMins)) {
      return res.status(400).json({ error: 'Lesson duration must be 30, 45 or 60 minutes.' });
    }
    if (isTrial && durationMins > 45) {
      return res.status(400).json({ error: 'A free trial can be at most 45 minutes.' });
    }
    if (!DateTime.local().setZone(cleanTimezone).isValid) {
      return res.status(400).json({ error: 'Invalid timezone.' });
    }
    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }
    if (!cleanName || cleanName.length < 2) {
      return res.status(400).json({ error: 'Student name is required (minimum 2 characters).' });
    }
    if (isChild && (!cleanParentName || cleanParentName.length < 2)) {
      return res.status(400).json({ error: 'Parent or guardian name is required for child learners.' });
    }
    if (!date || !timeSlot || (!timeSlot.time24 && !timeSlot.utcStartIso)) {
      return res.status(400).json({ error: 'A valid lesson date and time slot must be selected.' });
    }

    // Resolve Auth User / Student profile if token provided
    let linkedStudentId: string | null = null;
    let authUserId: string | null = null;
    let authUserEmail = '';
    let assignedTeacherId: string | null = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { data: uData } = await supabaseAdmin.auth.getUser(token);
        if (uData?.user?.id) {
          authUserId = uData.user.id;
          authUserEmail = (uData.user.email || '').toLowerCase();
          const { data: st } = await supabaseAdmin
            .from('students')
            .select('id, assigned_teacher_id')
            .eq('auth_user_id', authUserId)
            .maybeSingle();
          if (st?.id) {
            linkedStudentId = st.id;
            assignedTeacherId = st.assigned_teacher_id || null;
          }
        }
      } catch (authErr) {
        // Non-blocking
      }
    }

    // Booking for a specific learner or with package credits requires a signed-in account
    // that is authorized for that learner (self or a guardian's child).
    let authorizedLearnerIds: string[] = [];
    if (authUserId) {
      const learners = await getAuthorizedLearnersForStudent(supabaseAdmin, {
        studentUser: { student_id: linkedStudentId, email: authUserEmail }
      });
      authorizedLearnerIds = learners.map(l => l.id);
    }
    if (studentId) {
      const requestedStudentId = String(studentId).trim();
      if (!authorizedLearnerIds.includes(requestedStudentId)) {
        return res.status(403).json({ error: 'You are not allowed to book for this learner.' });
      }
      linkedStudentId = requestedStudentId;
    }
    // RULES.md §2: no guest bookings. Every booking belongs to a signed-in account,
    // and the booking's contact email is always that account's email.
    if (!authUserId || !authUserEmail) {
      return res.status(401).json({ error: 'Please sign in or create an account to book a lesson.', code: 'AUTH_REQUIRED' });
    }
    cleanEmail = authUserEmail;

    if (isTrial) {
      const trialOwnerFilter = [
        `contact_email.eq.${pgrstValue(cleanEmail)}`,
        ...(cleanWhatsapp ? [`contact_whatsapp.eq.${pgrstValue(cleanWhatsapp)}`] : []),
        ...(authorizedLearnerIds.length ? [`student_id.in.(${authorizedLearnerIds.map(pgrstValue).join(',')})`] : [])
      ].join(',');

      // One free trial per student: a trial that is booked, confirmed or completed uses it.
      const { data: activeTrials } = await supabaseAdmin
        .from('bookings')
        .select('id')
        .eq('booking_type', 'trial')
        .in('status', ['pending', 'confirmed', 'rescheduled', 'completed'])
        .or(trialOwnerFilter)
        .limit(1);
      if (activeTrials && activeTrials.length > 0) {
        return res.status(400).json({
          error: 'You already have a free trial on this account. Each student gets one free trial, but you can book a regular lesson any time.'
        });
      }

      // RULES.md §2: after a cancelled or missed trial, wait 48 hours before booking again.
      const cooldownStart = DateTime.utc().minus({ hours: 48 }).toISO();
      const { data: recentLostTrial } = await supabaseAdmin
        .from('bookings')
        .select('updated_at')
        .eq('booking_type', 'trial')
        .in('status', ['cancelled', 'no_show'])
        .gte('updated_at', cooldownStart)
        .or(trialOwnerFilter)
        .order('updated_at', { ascending: false })
        .limit(1);
      if (recentLostTrial && recentLostTrial.length > 0) {
        const availableAt = DateTime.fromISO(recentLostTrial[0].updated_at).plus({ hours: 48 });
        return res.status(400).json({
          error: `Your last free trial was cancelled or missed, so you can book a new one after ${availableAt.toUTC().toFormat('dd LLL yyyy, HH:mm')} (UTC).`,
          code: 'TRIAL_COOLDOWN',
          availableAt: availableAt.toUTC().toISO()
        });
      }

      // RULES.md §2: after 5 cancelled or missed trials, no more free trials (paid lessons stay open).
      const { count: lostTrials } = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('booking_type', 'trial')
        .in('status', ['cancelled', 'no_show'])
        .or(trialOwnerFilter);
      if ((lostTrials || 0) >= MAX_LOST_TRIALS) {
        return res.status(400).json({
          error: 'This account has used up its free trials. You are always welcome to book a regular lesson.',
          code: 'TRIAL_LIMIT'
        });
      }
    }

    // RULES.md §5: the student accepts the current terms (cancellation & refund policy) before booking.
    if (req.body?.acceptedTerms !== true) {
      return res.status(400).json({ error: 'Please read and accept the terms and the cancellation & refund policy first.', code: 'TERMS_REQUIRED' });
    }
    // Consumer withdrawal right: a paid single lesson needs the separate early-start request.
    // shortcut: no own column; a paid booking with terms_version >= 2026-10-15.2 proves it (the server refuses without it).
    if (!isTrial && !packageEntitlementId && req.body?.acceptedEarlyStart !== true) {
      return res.status(400).json({ error: 'Please confirm that you want the lesson to take place before the 14-day withdrawal period ends.', code: 'EARLY_START_REQUIRED' });
    }

    // Calculate Timestamps
    let scheduledStartUtc: string;
    let scheduledEndUtc: string;
    let cairoTimeDisplay: string;

    if (timeSlot.utcStartIso) {
      // The end is always derived from the validated duration, never taken from the client.
      const dt = DateTime.fromISO(String(timeSlot.utcStartIso), { zone: 'utc' });
      if (!dt.isValid) {
        return res.status(400).json({ error: 'Invalid scheduling date or time.' });
      }
      scheduledStartUtc = dt.toISO()!;
      scheduledEndUtc = dt.plus({ minutes: durationMins }).toISO()!;
      cairoTimeDisplay = dt.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a');
    } else {
      const time24 = timeSlot.time24;
      const dt = DateTime.fromISO(`${date}T${time24}`, { zone: cleanTimezone });
      if (!dt.isValid) {
        return res.status(400).json({ error: 'Invalid scheduling date or time.' });
      }
      scheduledStartUtc = dt.toUTC().toISO()!;
      scheduledEndUtc = dt.plus({ minutes: durationMins }).toUTC().toISO()!;
      cairoTimeDisplay = dt.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a');
    }

    if (new Date(scheduledStartUtc).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Please choose a lesson time in the future.' });
    }
    // RULES.md §2: no same-day bookings; the lesson starts tomorrow at the earliest.
    if (!isOnLaterDay(DateTime.fromISO(scheduledStartUtc), cleanTimezone)) {
      return res.status(400).json({ error: 'Lessons can be booked from tomorrow onwards. Please choose another day.', code: 'SAME_DAY' });
    }

    // Resolve teacher (RULES.md §1): the learner's assigned teacher by default. A client-supplied teacher
    // is honored only if it is that teacher or a bookable teacher (working hours in the site or Google connected).
    let learnerTeacherId: string | null = assignedTeacherId;
    if (linkedStudentId) {
      const { data: learnerRow } = await supabaseAdmin.from('students').select('assigned_teacher_id').eq('id', linkedStudentId).maybeSingle();
      learnerTeacherId = learnerRow?.assigned_teacher_id || learnerTeacherId;
    }
    const requestedTeacherId = typeof teacherId === 'string' ? teacherId.trim() : '';
    let resolvedTeacherId: string | null = null;
    if (requestedTeacherId && requestedTeacherId !== learnerTeacherId) {
      resolvedTeacherId = await resolveAuthoritativeTeacherForAvailability(requestedTeacherId);
      if (!resolvedTeacherId) {
        return res.status(400).json({ error: 'The selected teacher is not available for booking.' });
      }
    } else {
      resolvedTeacherId = learnerTeacherId || await resolveAuthoritativeTeacherForAvailability(undefined);
    }

    await releaseExpiredPaymentHolds(supabaseAdmin);

    // Validate slot availability against the resolved (trusted) teacher
    const slotValidation = await validateSlotAvailability(scheduledStartUtc, scheduledEndUtc, resolvedTeacherId || undefined);
    if (slotValidation.isAvailable === false) {
      return res.status(409).json({ error: slotValidation.conflictReason || 'This time slot is no longer available. Please select another slot.' });
    }

    // Resolve service rate and calculate authoritative fee
    const { data: srv } = await supabaseAdmin
      .from('services')
      .select('title, arabic_title, hourly_rate_usd, is_active, supported_durations, trial_allowed')
      .eq('id', cleanServiceId)
      .maybeSingle();

    if (!srv || !srv.is_active) {
      return res.status(400).json({ error: 'This service is not available for booking.' });
    }
    if (Array.isArray(srv.supported_durations) && !srv.supported_durations.includes(durationMins)) {
      return res.status(400).json({ error: 'This lesson length is not offered for this service.' });
    }
    if (isTrial && srv.trial_allowed === false) {
      return res.status(400).json({ error: 'Free trials are not offered for this service.' });
    }

    const hourlyRate = Number(srv.hourly_rate_usd);
    const serviceTitle = srv?.title || '1-on-1 Lesson';

    let calculatedFee = 0;
    let bookingStatus = 'confirmed';
    let resolvedPackageEntitlementId: string | null = null;

    if (packageEntitlementId) {
      const { data: entitlement } = await supabaseAdmin
        .from('package_entitlements')
        .select('id, remaining_credits, status, purchaser_account_id, learner_student_id, metadata, package_catalog:package_catalog_id(eligibility_rules)')
        .eq('id', packageEntitlementId)
        .maybeSingle();

      if (!entitlement || entitlement.status !== 'active' || entitlement.remaining_credits <= 0) {
        return res.status(400).json({ error: 'Package entitlement is inactive or has no remaining credits.' });
      }

      const ownsEntitlement =
        entitlement.purchaser_account_id === authUserId ||
        (entitlement.learner_student_id && authorizedLearnerIds.includes(entitlement.learner_student_id));
      if (!ownsEntitlement) {
        return res.status(403).json({ error: 'This package does not belong to your account.' });
      }

      // RULES.md §4: credits are for the same price band and lesson length they were bought for.
      const cat: any = Array.isArray((entitlement as any).package_catalog) ? (entitlement as any).package_catalog[0] : (entitlement as any).package_catalog;
      const rules: any = (entitlement as any).metadata?.hourly_rate ? (entitlement as any).metadata : cat?.eligibility_rules || {};
      if (rules.hourly_rate && Number(rules.hourly_rate) !== hourlyRate) {
        return res.status(400).json({ error: 'This package is for a different subject group. Please pick a matching subject.', code: 'PACKAGE_GROUP_MISMATCH' });
      }
      if (rules.duration_minutes && Number(rules.duration_minutes) !== durationMins) {
        return res.status(400).json({ error: `This package is for ${rules.duration_minutes}-minute lessons. Please choose that length.`, code: 'PACKAGE_DURATION_MISMATCH' });
      }

      // Credits are consumed when the teacher records the lesson as completed
      // (teacher_record_lesson_outcome), so booking only checks that upcoming
      // lessons don't exceed the remaining credits.
      const { count: upcomingOnPackage } = await supabaseAdmin
        .from('bookings')
        .select('id', { count: 'exact', head: true })
        .eq('package_entitlement_id', entitlement.id)
        .in('status', ['pending', 'confirmed', 'rescheduled']);
      if ((upcomingOnPackage || 0) >= entitlement.remaining_credits) {
        return res.status(400).json({ error: 'All remaining package credits are already booked.' });
      }

      resolvedPackageEntitlementId = entitlement.id;
      calculatedFee = 0;
      bookingStatus = 'confirmed';
    } else if (isTrial) {
      calculatedFee = 0;
      bookingStatus = 'confirmed';
    } else {
      // Regular paid lesson: status must be PENDING payment!
      calculatedFee = lessonFeeUsd(hourlyRate, durationMins);
      bookingStatus = 'pending';
    }

    // Unique reference code
    let referenceCode = '';
    for (let attempts = 0; attempts < 5; attempts++) {
      const candidate = `MHM-${crypto.randomInt(0, 0xffffff).toString(16).toUpperCase().padStart(6, '0')}`;
      const { data: existing } = await supabaseAdmin.from('bookings').select('id').eq('reference_code', candidate).maybeSingle();
      if (!existing) {
        referenceCode = candidate;
        break;
      }
    }
    if (!referenceCode) {
      referenceCode = `MHM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    }

    // The DB verifies management tokens with bcrypt (pgcrypto crypt), so hash them the same way.
    // The plaintext token is only returned once to the booker and never stored.
    const managementToken = crypto.randomBytes(24).toString('base64url');
    const { data: bcryptHash, error: hashErr } = await supabaseAdmin.rpc('hash_management_token', { p_token: managementToken });
    if (hashErr || !bcryptHash) {
      // Until migration 20261013000000 is applied; such bookings can't be self-managed (pre-existing behavior).
      console.error('[Create Booking] hash_management_token unavailable, falling back to sha256', hashErr?.message);
    }
    const managementTokenHash: string = bcryptHash || crypto.createHash('sha256').update(managementToken).digest('hex');

    // Link or create the CRM lead. leads is unique on lower(email) (an expression index, so
    // upsert onConflict:'email' can't target it). An existing lead is never overwritten by
    // unauthenticated input; its status only moves forward through the allowed transitions.
    let leadId: string | null = null;
    try {
      const { data: existingLead } = await supabaseAdmin
        .from('leads')
        .select('id, status')
        .ilike('email', escapeLike(cleanEmail))
        .maybeSingle();

      if (existingLead) {
        leadId = existingLead.id;
        const nextStatus = isTrial ? 'trial_booked' : null;
        if (nextStatus && nextStatus !== existingLead.status && isAllowedLeadTransition(existingLead.status, nextStatus)) {
          await supabaseAdmin.from('leads').update({ status: nextStatus, updated_at: new Date().toISOString() }).eq('id', existingLead.id);
        }
      } else {
        const { data: newLead, error: leadInsertErr } = await supabaseAdmin
          .from('leads')
          .insert({
            name: cleanName,
            email: cleanEmail,
            whatsapp: cleanWhatsapp || null,
            learner_type: isChild ? 'child' : 'adult',
            service_interest_id: cleanServiceId,
            goal: goal || '',
            source: 'web_booking_modal',
            status: isTrial ? 'trial_booked' : 'lead',
            notes: isChild ? `Parent: ${cleanParentName}. ${notes || ''}` : (notes || '')
          })
          .select('id')
          .single();
        if (leadInsertErr) console.warn('[Create Booking] Lead insert failed:', leadInsertErr.message);
        leadId = newLead?.id || null;
      }
    } catch (leadErr) {
      console.warn('[Create Booking] Lead link non-critical warning:', leadErr);
    }

    // Insert Booking
    const { data: newBooking, error: bErr } = await supabaseAdmin
      .from('bookings')
      .insert({
        reference_code: referenceCode,
        management_token_hash: managementTokenHash,
        student_id: linkedStudentId,
        teacher_id: resolvedTeacherId,
        lead_id: leadId,
        service_id: cleanServiceId,
        booking_type: isTrial ? 'trial' : 'regular',
        duration_minutes: durationMins,
        scheduled_start: scheduledStartUtc,
        scheduled_end: scheduledEndUtc,
        student_timezone: cleanTimezone,
        cairo_time_display: cairoTimeDisplay,
        status: bookingStatus,
        // RULES.md §2: an unpaid booking only holds its slot briefly (Stripe sessions expire after 30 min).
        hold_expires_at: bookingStatus === 'pending' ? DateTime.utc().plus({ minutes: PAYMENT_HOLD_MINUTES }).toISO() : null,
        terms_version: TERMS_VERSION,
        terms_accepted_at: new Date().toISOString(),
        contact_name: cleanName,
        contact_email: cleanEmail,
        contact_whatsapp: cleanWhatsapp || null,
        parent_name: isChild ? cleanParentName : null,
        fee_amount_usd: calculatedFee,
        zoom_meeting_link: 'pending',
        notes: isChild ? `Parent: ${cleanParentName}. ${notes || ''}` : (notes || ''),
        integration_status: 'pending',
        sync_metadata: {},
        package_entitlement_id: resolvedPackageEntitlementId
      })
      .select('*')
      .single();

    if (bErr || !newBooking) {
      console.error('[Create Booking Insert Error]', bErr);
      return res.status(500).json({ error: 'Failed to create booking reservation. Please try again.' });
    }

    // If already confirmed (trial or package credit), trigger calendar integration & reminders
    if (bookingStatus === 'confirmed') {
      try {
        await enqueueAndRunBookingSync(supabaseAdmin, newBooking.id);

        const startMillis = new Date(scheduledStartUtc).getTime();
        const rem24 = new Date(startMillis - 24 * 60 * 60 * 1000).toISOString();
        const rem1 = new Date(startMillis - 60 * 60 * 1000).toISOString();
        if (new Date(rem24) > new Date()) {
          const { error: rem24Err } = await supabaseAdmin.from('reminders').insert({
            booking_id: newBooking.id,
            reminder_type: '24h_before',
            scheduled_for: rem24,
            status: 'pending'
          });
          if (rem24Err) console.warn('[Create Booking] 24h reminder insert failed:', rem24Err.message);
        }
        if (new Date(rem1) > new Date()) {
          const { error: rem1Err } = await supabaseAdmin.from('reminders').insert({
            booking_id: newBooking.id,
            reminder_type: '1h_before',
            scheduled_for: rem1,
            status: 'pending'
          });
          if (rem1Err) console.warn('[Create Booking] 1h reminder insert failed:', rem1Err.message);
        }
      } catch (syncErr) {
        console.warn('[Create Booking Sync Warning]', syncErr);
      }
    }

    return res.status(201).json({
      success: true,
      bookingId: newBooking.id,
      referenceCode: newBooking.reference_code,
      managementToken,
      status: newBooking.status,
      feeAmountUsd: Number(newBooking.fee_amount_usd),
      serviceName: serviceTitle,
      cairoTimeDisplay: newBooking.cairo_time_display,
      scheduledStart: newBooking.scheduled_start,
      scheduledEnd: newBooking.scheduled_end,
      zoomMeetingLink: newBooking.zoom_meeting_link,
      isTrial,
      packageEntitlementId: resolvedPackageEntitlementId
    });
  } catch (err: any) {
    console.error('[Create Booking Fatal Error]', err);
    return res.status(500).json({ error: clientErrorMessage(err, 'Failed to process booking.') });
  }
});


app.post('/api/integrations/sync-booking', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking || !booking.referenceCode || !booking.managementToken) {
      return res.status(400).json({ error: 'Invalid booking data for synchronization.' });
    }

    const isAuth = await verifyManagementToken(booking.referenceCode, booking.managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const managementData = await getVerifiedBookingManagement(booking.referenceCode, booking.managementToken);
    const targetBookingId = managementData?.bookingId;

    // Fast-path: Trigger the outbox worker strictly scoped to THIS booking!
    if (targetBookingId) {
      await processIntegrationJobs(1, undefined, targetBookingId);
    }

    // Fetch the updated booking to return the latest zoom link
    const supabase = getSupabaseAdminClient();
    if (supabase) {
        const { data: b } = await supabase.from('bookings').select('zoom_meeting_link, google_calendar_event_id, integration_status').eq('reference_code', booking.referenceCode).maybeSingle();
        if (b) {
            return res.json({
                zoomMeetingLink: b.zoom_meeting_link,
                googleEventId: b.google_calendar_event_id,
                integrationStatus: b.integration_status
            });
        }
    }

    res.json({ integrationStatus: 'pending' });
  } catch (error: any) {
    console.error('Sync booking fast-path error:', error);
    res.json({ integrationStatus: 'pending' });
  }
});

// 8. INTEGRATIONS: RESCHEDULE EVENT SYNC
app.post('/api/integrations/reschedule', async (req, res) => {
  try {
    const { referenceCode, managementToken } = req.body;
    if (!referenceCode || !managementToken) {
      return res.status(400).json({ error: 'Missing reschedule parameters.' });
    }

    const managementData = await getVerifiedBookingManagement(referenceCode, managementToken);
    if (!managementData) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const targetBookingId = managementData.bookingId;

    // Trigger worker asynchronously strictly scoped to this booking
    if (targetBookingId) {
      processIntegrationJobs(1, undefined, targetBookingId).catch(err => console.error('[Fast-path reschedule error]', err));
    }

    return res.status(202).json({ success: true, message: 'Reschedule job queued for background processing.' });
  } catch (err: any) {
    console.error('Error in /api/integrations/reschedule:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});
app.post('/api/integrations/cancel', async (req, res) => {
  try {
    const { referenceCode, managementToken } = req.body;
    if (!referenceCode || !managementToken) {
      return res.status(400).json({ error: 'Missing reference code or token.' });
    }

    const managementData = await getVerifiedBookingManagement(referenceCode, managementToken);
    if (!managementData) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const targetBookingId = managementData.bookingId;

    // Trigger worker asynchronously strictly scoped to this booking
    if (targetBookingId) {
      processIntegrationJobs(1, undefined, targetBookingId).catch(err => console.error('[Fast-path cancel error]', err));
    }

    return res.status(202).json({ success: true, message: 'Cancellation job queued for background processing.' });
  } catch (error: any) {
    console.error('Cancel sync error:', error);
    res.status(500).json({ error: 'Failed to queue cancelled event.', code: 'CANCEL_QUEUE_FAILED' });
  }
});

// 10. INTEGRATIONS: REAL AVAILABILITY LOOKUP
app.get('/api/integrations/availability', async (req, res) => {
  try {
    const holdClient = getSupabaseAdminClient();
    if (holdClient) await releaseExpiredPaymentHolds(holdClient);

    const timezone = req.query.timezone as string;
    if (!timezone) {
      return res.status(400).json({ error: 'Timezone is required.', code: 'INVALID_AVAILABILITY_REQUEST' });
    }

    let safeTimezone = timezone;
    if (!DateTime.local().setZone(safeTimezone).isValid) {
      console.warn('Invalid timezone received, falling back to Africa/Cairo: ', timezone);
      safeTimezone = 'Africa/Cairo';
    }

    const parseStrictInt = (str: string | undefined, defaultVal: number): number | null => {
      if (str === undefined) return defaultVal;
      if (!/^([1-9]\d*|0)$/.test(str)) return null;
      return parseInt(str, 10);
    };

    const daysRaw = req.query.days as string;
    const durationRaw = req.query.duration as string;

    const daysCount = parseStrictInt(daysRaw, 14);
    if (daysCount === null || daysCount < 1 || daysCount > 60) {
      return res.status(400).json({ error: 'Invalid days.', code: 'INVALID_AVAILABILITY_REQUEST' });
    }

    const duration = parseStrictInt(durationRaw, 30);
    if (duration === null || ![30, 45, 60].includes(duration)) {
      return res.status(400).json({ error: 'Invalid duration.', code: 'INVALID_AVAILABILITY_REQUEST' });
    }

    let teacherId = typeof req.query.teacherId === 'string' ? req.query.teacherId : (typeof req.query.teacher_id === 'string' ? req.query.teacher_id : undefined);

    // If teacherId was not passed explicitly in query, attempt to resolve from authenticated student Bearer token if present
    if (!teacherId && req.headers.authorization?.startsWith('Bearer ')) {
      try {
        const supabaseAdmin = getSupabaseAdminClient();
        if (supabaseAdmin) {
          const token = req.headers.authorization.split(' ')[1];
          const { data: { user } } = await supabaseAdmin.auth.getUser(token);
          if (user) {
            const { data: student } = await supabaseAdmin
              .from('students')
              .select('assigned_teacher_id')
              .eq('auth_user_id', user.id)
              .maybeSingle();
            if (student?.assigned_teacher_id) {
              teacherId = student.assigned_teacher_id;
            }
          }
        }
      } catch {
        // Silently continue to fallback resolution
      }
    }

    const days = await computeAvailableSlots(safeTimezone, daysCount, duration, teacherId);
    res.json({ success: true, days, timezone: safeTimezone });
  } catch (error: any) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Failed to compute availability.', code: 'AVAILABILITY_FETCH_FAILED' });
  }
});

// 11. INTEGRATIONS: VALIDATE SLOT AVAILABILITY (SERVER-SIDE AUTHORITATIVE CHECK)
app.post('/api/integrations/validate-slot', async (req, res) => {
  try {
    const holdClient = getSupabaseAdminClient();
    if (holdClient) await releaseExpiredPaymentHolds(holdClient);

    const { scheduledStartUtc, scheduledEndUtc, teacherId, teacher_id } = req.body;
    if (!scheduledStartUtc || !scheduledEndUtc) {
      return res.status(400).json({ isAvailable: false, conflictReason: 'Missing slot timestamps.' });
    }

    if (!DateTime.fromISO(scheduledStartUtc).isValid || !DateTime.fromISO(scheduledEndUtc).isValid) {
      return res.status(400).json({ isAvailable: false, conflictReason: 'Invalid slot timestamps.' });
    }

    const resolvedTeacherId = typeof teacherId === 'string' ? teacherId : (typeof teacher_id === 'string' ? teacher_id : undefined);
    const result = await validateSlotAvailability(scheduledStartUtc, scheduledEndUtc, resolvedTeacherId);
    res.json(result);
  } catch (error: any) {
    console.error('Slot validation error:', error);
    res.status(500).json({ isAvailable: false, conflictReason: 'Validation error.', code: 'SLOT_VALIDATION_FAILED' });
  }
});

// 12. INTEGRATIONS: RETRY FAILED INTEGRATION SYNC
app.post('/api/integrations/retry-sync', verifyTeacherAuth, async (req, res) => {
  try {
    const { referenceCode } = req.body;
    if (!referenceCode) {
      return res.status(400).json({ error: 'Missing booking reference code.' });
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('[Configuration Error] SUPABASE_SERVICE_ROLE_KEY missing.');
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: booking, error: bError } = await supabase
      .from('bookings')
      .select('*')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (bError || !booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const teacherUser = (req as any).teacherUser;
    if (teacherUser?.role !== 'super_admin' && booking.teacher_id !== teacherUser?.id) {
      return res.status(403).json({ error: 'Forbidden: this booking is not assigned to you.' });
    }
    if (!['confirmed', 'rescheduled'].includes(booking.status)) {
      return res.status(400).json({ error: 'Only confirmed bookings can be synced.' });
    }

    // Always sync into the booking's own teacher's calendar, never the caller's.
    const syncResult = await syncBookingIntegrations({
      referenceCode: booking.reference_code,
      teacherId: booking.teacher_id,
      learnerName: booking.contact_name,
      parentName: booking.parent_name,
      serviceName: '1-on-1 Lesson',
      mode: booking.booking_type === 'trial' ? 'trial' : 'regular',
      scheduledStart: booking.scheduled_start,
      scheduledEnd: booking.scheduled_end,
      studentTimezone: booking.student_timezone,
      cairoTimeDisplay: booking.cairo_time_display,
      durationMinutes: booking.duration_minutes,
      zoomMeetingLink: booking.zoom_meeting_link,
      contactEmail: booking.contact_email,
      contactWhatsapp: booking.contact_whatsapp,
      notes: booking.notes
    });

    res.json(syncResult);
  } catch (error: any) {
    console.error('Retry sync error:', error);
    res.status(500).json({ error: 'Failed to retry sync.', code: 'RETRY_SYNC_FAILED' });
  }
});

// 12. SERVER-SIDE TEACHER AUTHENTICATION & AUTHORIZATION MIDDLEWARE

function extractSupabaseProjectRef(urlStr?: string): string | null {
  if (!urlStr) return null;
  try {
    const url = new URL(urlStr.trim());
    const hostname = url.hostname.toLowerCase();
    const parts = hostname.split('.');
    if (parts.length >= 3 && parts[1] === 'supabase' && parts[2] === 'co') {
      return parts[0];
    }
  } catch {}
  return null;
}

const devStudentProfiles: Record<string, any> = {
  'dev-student-token': {
    auth_id: 'student-mock-auth-001',
    email: 'student.a@example.com',
    student_id: '11111111-2222-3333-4444-555555555555',
    name: 'Student A',
    studentProfile: {
      id: '11111111-2222-3333-4444-555555555555',
      name: 'Student A',
      email: 'student.a@example.com',
      timezone: 'America/New_York',
      learner_type: 'adult',
      current_level: 'intermediate',
      status: 'active',
      booking_preference: 'self',
      canBookForChild: false,
      linkedChildren: []
    }
  },
  'dev-student-b-token': {
    auth_id: 'student-mock-auth-002',
    email: 'student.b@example.com',
    student_id: '22222222-2222-3333-4444-555555555555',
    name: 'Student B',
    studentProfile: {
      id: '22222222-2222-3333-4444-555555555555',
      name: 'Student B',
      email: 'student.b@example.com',
      timezone: 'Europe/London',
      learner_type: 'adult',
      current_level: 'beginner',
      status: 'active',
      booking_preference: 'self',
      canBookForChild: false,
      linkedChildren: []
    }
  },
  'dev-guardian-student-token': {
    auth_id: 'guardian-mock-auth-003',
    email: 'guardian@example.com',
    student_id: '33333333-3333-3333-3333-333333333333',
    name: 'Parent Guardian',
    studentProfile: {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Parent Guardian',
      email: 'guardian@example.com',
      timezone: 'America/Toronto',
      learner_type: 'adult',
      current_level: 'intermediate',
      status: 'active',
      booking_preference: 'self',
      canBookForChild: true,
      linkedChildren: [
        { id: 'child-001', name: 'Aisha Al-Harithi', currentLevel: 'beginner' }
      ]
    }
  }
};

async function verifyStudentAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    // Dev tokens/headers are honored only with an explicit opt-in, never on a production deployment.
    const isProd = devAuthDisabled();

    // Safe project consistency diagnosis (never exposes credentials or ref strings)
    const clientProjectRef = typeof req.headers['x-client-project-ref'] === 'string' ? req.headers['x-client-project-ref'].trim() : null;
    const backendProjectRef = extractSupabaseProjectRef(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    if (clientProjectRef && backendProjectRef) {
      res.setHeader('x-project-consistency', clientProjectRef === backendProjectRef ? 'MATCH' : 'MISMATCH');
    } else {
      res.setHeader('x-project-consistency', 'UNKNOWN');
    }

    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Expected Bearer token format.' });
    }

    // Strict production security
    if (isProd && (token === 'dev-student-token' || token === 'dev-student-b-token' || token === 'dev-teacher-token' || token === 'dev-super-admin-token')) {
      return res.status(401).json({ error: 'Unauthorized. Development tokens are strictly forbidden in production.' });
    }

    const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

    if (supabaseUrl && serviceKey) {
      // Allow dev test tokens in non-production environments when testing
      if (!isProd && devStudentProfiles[token]) {
        req.studentUser = JSON.parse(JSON.stringify(devStudentProfiles[token]));
        return next();
      }

      // Explicitly reject teacher and super admin tokens attempting student portal APIs
      if (!isProd && (token === 'dev-teacher-token' || token === 'dev-super-admin-token' || token === 'dev-inactive-teacher-token' || req.headers['x-dev-teacher-auth'])) {
        return res.status(403).json({ error: 'Forbidden. Teachers cannot access student portal APIs.' });
      }

      const supabaseAdmin = getSupabaseAdminClient();
      if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid or expired session token.' });

      // Check if it's a teacher trying to access the student portal (active or inactive)
      const userEmail = (user.email || '').toLowerCase().trim();
      const { data: teacherRecord } = await supabaseAdmin
        .from('teacher_accounts')
        .select('email, role, is_active')
        .eq('email', userEmail)
        .maybeSingle();

      if (teacherRecord && teacherRecord.role !== 'super_admin') {
        return res.status(403).json({ error: 'Forbidden. Teachers cannot access student portal APIs.' });
      }

      // Check student profile by auth_user_id
      let { data: studentRecord, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, name, email, timezone, learner_type, current_level, status, assigned_teacher_id')
        .eq('auth_user_id', user.id)
        .maybeSingle();

      if (studentError) {
        console.error('[verifyStudentAuth] Database error resolving student profile:', studentError.message);
        return res.status(500).json({ error: 'Internal server error resolving student profile.' });
      }

      // Safe deterministic linking if an unlinked historical record exists for this verified email
      if (!studentRecord && userEmail) {
        const { data: matchingStudents, error: matchError } = await supabaseAdmin
          .from('students')
          .select('id, name, email, timezone, learner_type, current_level, status, auth_user_id, assigned_teacher_id')
          .ilike('email', escapeLike(userEmail));

        if (!matchError && matchingStudents) {
          const unlinked = matchingStudents.filter((s: any) => !s.auth_user_id);
          // Only auto-link if exactly 1 unlinked record exists and no other records exist for this email
          if (unlinked.length === 1 && matchingStudents.length === 1) {
            const candidate = unlinked[0];
            const { data: linkedStudent, error: linkError } = await supabaseAdmin
              .from('students')
              .update({ auth_user_id: user.id })
              .eq('id', candidate.id)
              .is('auth_user_id', null)
              .select('id, name, email, timezone, learner_type, current_level, status, assigned_teacher_id')
              .single();

            if (!linkError && linkedStudent) {
              console.log(`[verifyStudentAuth] Safely linked existing student profile ${candidate.id} to auth user ${user.id}`);
              studentRecord = linkedStudent;
            }
          } else if (matchingStudents.length > 0) {
            console.error('[verifyStudentAuth] Identity conflict. Email is already associated with a student record but cannot be linked to this auth user.');
            return res.status(409).json({ error: 'Identity conflict. This email is already associated with an account.' });
          }
        }
      }

      // Section 9: Do NOT silently insert a Student from profile lookup.
      // Only create a new student record if NO matching record exists at all (genuine new user).
      // Note: Student onboarding and profile initialization is handled exclusively in /api/student/onboarding.

      const authUserIdHash = crypto.createHash('sha256').update(user.id).digest('hex').substring(0, 8);
      const studentIdHash = studentRecord?.id ? crypto.createHash('sha256').update(studentRecord.id).digest('hex').substring(0, 8) : 'none';

      res.setHeader('x-student-auth-verified', 'true');
      res.setHeader('x-student-auth-user-id-hash', authUserIdHash);
      res.setHeader('x-student-backend-project-ref', backendProjectRef || 'unknown');
      res.setHeader('x-student-record-found', studentRecord ? 'true' : 'false');
      res.setHeader('x-student-id-hash', studentIdHash);

      req.studentUser = {
        auth_id: user.id,
        email: userEmail,
        student_id: studentRecord?.id || null,
        assigned_teacher_id: studentRecord?.assigned_teacher_id || null,
        name: studentRecord?.name || user.user_metadata?.full_name || 'Student',
        studentProfile: studentRecord || null
      };

      res.setHeader('x-student-user-attached', 'true');
      res.setHeader('x-student-has-student-id', studentRecord?.id ? 'true' : 'false');

      return next();
    }

    // Non-production fallback when Supabase is not configured
    if (!isProd && devStudentProfiles[token]) {
      req.studentUser = JSON.parse(JSON.stringify(devStudentProfiles[token]));
      return next();
    }

    if (!isProd && (token === 'dev-teacher-token' || token === 'dev-inactive-teacher-token' || req.headers['x-dev-teacher-auth'])) {
      return res.status(403).json({ error: 'Forbidden. Teachers cannot access student portal APIs.' });
    }

    return res.status(401).json({ error: 'Unauthorized access.' });
  } catch (err: any) {
    console.error('Student Auth Verification Error:', err);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

async function verifyTeacherAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const devHeader = req.headers['x-dev-teacher-auth'];
    // Dev tokens/headers are honored only with an explicit opt-in, never on a production deployment.
    const isProd = devAuthDisabled();

    // Safe project consistency diagnosis (never exposes credentials or ref strings)
    const clientProjectRef = typeof req.headers['x-client-project-ref'] === 'string' ? req.headers['x-client-project-ref'].trim() : null;
    const backendProjectRef = extractSupabaseProjectRef(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);
    if (clientProjectRef && backendProjectRef) {
      res.setHeader('x-project-consistency', clientProjectRef === backendProjectRef ? 'MATCH' : 'MISMATCH');
    } else {
      res.setHeader('x-project-consistency', 'UNKNOWN');
    }

    if (!authHeader && !devHeader) {
      const stage = 'NO_AUTH_HEADER';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(401).json({ error: 'Authentication required. Authorization header missing.', diagnosticStage: stage });
    }

    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Strict production security: dev tokens are NEVER accepted in production
    if (isProd && (token === 'dev-teacher-token' || token === 'dev-inactive-teacher-token' || token === 'dev-student-token' || token === 'dev-student-b-token' || devHeader)) {
      const stage = 'DEV_TOKEN_REJECTED_PROD';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(401).json({ error: 'Unauthorized. Development tokens are strictly forbidden in production.', diagnosticStage: stage });
    }

    if (!isProd && (token === 'dev-student-token' || token === 'dev-student-b-token' || token === 'dev-guardian-student-token')) {
      const stage = 'STUDENT_TOKEN_REJECTED_FOR_TEACHER_API';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(403).json({ error: 'Forbidden. Student accounts cannot access teacher dashboard APIs.', diagnosticStage: stage });
    }

    // Inactive teacher token check for test and development simulation
    if (!isProd && token === 'dev-inactive-teacher-token') {
      const stage = 'TEACHER_INACTIVE';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(403).json({ error: 'Access denied. Teacher account is inactive.', diagnosticStage: stage });
    }

    // Dev super_admin token bypass for local development / non-production ONLY
    if (!isProd && token === 'dev-super-admin-token') {
      req.teacherUser = {
        id: 'd7d1e5b4-f2e6-41f8-ac40-3b3b8e862b76',
        email: 'mahmoudelwany98@gmail.com',
        name: 'Ustadh Mahmoud (Super Admin)',
        role: 'super_admin',
        appRole: 'super_admin'
      };
      req.teacherAuthStage = 'AUTHORIZED';
      res.setHeader('x-auth-diagnostic-stage', 'AUTHORIZED');
      return next();
    }

    // Dev teacher token bypass for local development / non-production ONLY
    if (!isProd && (token === 'dev-teacher-token' || devHeader === 'true')) {
      req.teacherUser = {
        id: '9cd86044-eb13-4547-88e4-567c4f6a57d8',
        email: 'mhmwdlwany4222@gmail.com',
        name: 'Ustadh Mahmoud',
        role: 'teacher',
        appRole: 'teacher'
      };
      req.teacherAuthStage = 'AUTHORIZED';
      res.setHeader('x-auth-diagnostic-stage', 'AUTHORIZED');
      return next();
    }

    // For all real tokens: token MUST be provided in Bearer format
    if (!token) {
      const stage = 'INVALID_BEARER_FORMAT';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(401).json({ error: 'Authentication required. Expected Bearer token format.', diagnosticStage: stage });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      const stage = 'SUPABASE_CONFIG_MISSING';
      res.setHeader('x-auth-diagnostic-stage', stage);
      console.error('[verifyTeacherAuth] Database integration is not properly configured. Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
      return res.status(503).json({ error: 'Database integration is not properly configured.', diagnosticStage: stage });
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      const stage = 'SUPABASE_TOKEN_REJECTED';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(401).json({ error: 'Invalid or expired session token.', diagnosticStage: stage });
    }

    const email = (user.email || '').toLowerCase().trim();

    // Authoritative role lookup in teacher_accounts allowlist
    const { data: teacherRecord, error: teacherError } = await supabaseAdmin
      .from('teacher_accounts')
      .select('role, is_active, display_name, gender, agreement_version')
      .eq('email', email)
      .maybeSingle();

    if (teacherError || !teacherRecord) {
      const stage = 'TEACHER_NOT_FOUND';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(403).json({ error: 'Access denied. Account is not authorized for the teacher workspace.', diagnosticStage: stage });
    }

    if (!teacherRecord.is_active) {
      const stage = 'TEACHER_INACTIVE';
      res.setHeader('x-auth-diagnostic-stage', stage);
      return res.status(403).json({ error: 'Access denied. Teacher account is inactive.', diagnosticStage: stage });
    }

    // Ensure teacher profile exists in public.profiles for relational integrity (e.g. calendar_connections.teacher_id -> profiles.id)
    try {
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        await supabaseAdmin
          .from('profiles')
          .upsert({
            id: user.id,
            email: email,
            display_name: teacherRecord.display_name || user.user_metadata?.full_name || 'Teacher',
            role: teacherRecord.role,
            timezone: 'Africa/Cairo'
          });
      }
    } catch (profileErr) {
      console.warn('[verifyTeacherAuth] Profile sync warning:', profileErr);
    }

    req.teacherAuthStage = 'AUTHORIZED';
    res.setHeader('x-auth-diagnostic-stage', 'AUTHORIZED');
    req.teacherUser = {
      ...user,
      role: teacherRecord.role,
      appRole: teacherRecord.role,
      display_name: teacherRecord.display_name || 'Teacher',
      gender: teacherRecord.gender || 'male',
      agreementRequired: teacherRecord.role !== 'super_admin' && teacherRecord.agreement_version !== TEACHER_AGREEMENT_VERSION
    };
    // A teacher must accept the current teacher agreement before using the dashboard.
    const reqPath = String(req.originalUrl || req.url || '').split('?')[0];
    if (req.teacherUser.agreementRequired && !reqPath.endsWith('/api/dashboard/me') && !reqPath.endsWith('/api/dashboard/agreement/accept')) {
      res.setHeader('x-auth-diagnostic-stage', 'AGREEMENT_REQUIRED');
      return res.status(403).json({ error: 'Please read and accept the teacher agreement first.', code: 'AGREEMENT_REQUIRED', diagnosticStage: 'AGREEMENT_REQUIRED' });
    }
    return next();
  } catch (err) {
    console.error('[verifyTeacherAuth] Unexpected error during authentication verification:', err);
    res.setHeader('x-auth-diagnostic-stage', 'INTERNAL_ERROR');
    return res.status(500).json({ error: 'Internal server error during authentication.', diagnosticStage: 'INTERNAL_ERROR' });
  }
}

// Helper: Authoritatively resolve teacher metadata without email-based substring heuristics
export async function resolveTeacherMetadata(
  teacherIdentifier: string | null | undefined,
  supabaseAdmin: any
): Promise<{
  id: string;
  email: string;
  name: string;
  display_name: string;
  gender: 'male' | 'female';
  role: 'teacher' | 'super_admin';
  is_active: boolean;
} | null> {
  if (!teacherIdentifier) return null;
  const clean = String(teacherIdentifier).trim();
  if (!clean || clean === 'null' || clean === 'undefined') return null;

  if (!supabaseAdmin) return null;

  let teacherEmail: string | null = null;
  let authUserId: string | null = null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clean);
  if (isUuid) {
    authUserId = clean;
    try {
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(clean);
      if (userData?.user?.email) {
        teacherEmail = userData.user.email.toLowerCase().trim();
      }
    } catch (err) {
      console.warn('[resolveTeacherMetadata] getUserById error:', err);
    }
  } else if (clean.includes('@')) {
    teacherEmail = clean.toLowerCase().trim();
  }

  if (teacherEmail) {
    const { data: teacherAccount } = await supabaseAdmin
      .from('teacher_accounts')
      .select('email, role, is_active, display_name, gender')
      .eq('email', teacherEmail)
      .maybeSingle();

    if (teacherAccount) {
      if (!authUserId) {
        try {
          const matched = (await listAllAuthUsers(supabaseAdmin)).find((u: any) => u.email?.toLowerCase().trim() === teacherEmail);
          if (matched) authUserId = matched.id;
        } catch {}
      }

      return {
        id: authUserId || clean,
        email: teacherAccount.email,
        name: teacherAccount.display_name || 'Teacher',
        display_name: teacherAccount.display_name || 'Teacher',
        gender: teacherAccount.gender || 'male',
        role: teacherAccount.role || 'teacher',
        is_active: teacherAccount.is_active ?? true
      };
    }
  }

  return null;
}

export async function resolveSmartTeacherRouting(
  gender: string,
  supabaseAdmin: any
): Promise<{ id: string | null; name: string; email: string }> {
  const isFemale = gender === 'female';
  const targetGender = isFemale ? 'female' : 'male';
  const defaultName = isFemale ? 'المعلمة (بانتظار التعيين)' : 'الأستاذ محمود';
  const defaultEmail = isFemale ? '' : 'mahmoudelwany98@gmail.com';

  if (!supabaseAdmin) {
    return {
      id: isFemale ? null : 'd7d1e5b4-f2e6-41f8-ac40-3b3b8e862b76',
      name: defaultName,
      email: defaultEmail
    };
  }

  try {
    // 1. Query active teacher with matching gender from teacher_accounts
    const { data: matchedAccount } = await supabaseAdmin
      .from('teacher_accounts')
      .select('email, display_name, gender')
      .eq('gender', targetGender)
      .eq('is_active', true)
      .limit(1)
      .maybeSingle();

    const teacherEmail = matchedAccount?.email || defaultEmail;
    const teacherDisplayName = matchedAccount?.display_name || defaultName;

    // 2. Resolve auth user ID for this email
    const teacherMeta = await resolveTeacherMetadata(teacherEmail, supabaseAdmin);
    if (teacherMeta?.id) {
      return { id: teacherMeta.id, name: teacherDisplayName, email: teacherEmail };
    }

    // 3. Fallback: query auth.users
    try {
      const matchedUser = (await listAllAuthUsers(supabaseAdmin)).find(
        (u: any) => u.email?.toLowerCase().trim() === teacherEmail.toLowerCase().trim()
      );
      if (matchedUser?.id) {
        return { id: matchedUser.id, name: teacherDisplayName, email: teacherEmail };
      }
    } catch {}

    // 4. Fallback: query profiles where email = teacherEmail
    const { data: prof } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('email', teacherEmail)
      .maybeSingle();

    if (prof?.id) {
      return { id: prof.id, name: teacherDisplayName, email: teacherEmail };
    }

    return { id: null, name: teacherDisplayName, email: teacherEmail };
  } catch (err) {
    console.warn('[resolveSmartTeacherRouting Error]', err);
    return { id: null, name: defaultName, email: defaultEmail };
  }
}

export type PublicTeacher = { id: string; email: string; nameEn: string; nameAr: string; gender: 'male' | 'female'; photo: string | null };

/**
 * Teachers a new student can choose at onboarding: every active account with the 'teacher' role
 * (the super admin only when no teacher exists yet). id is the auth user id stored in
 * students.assigned_teacher_id. email stays on the server (never sent to the browser).
 */
export async function listPublicTeachers(supabaseAdmin: any): Promise<PublicTeacher[]> {
  if (!supabaseAdmin) return [];
  const { data: accounts, error } = await supabaseAdmin
    .from('teacher_accounts')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error || !accounts?.length) return [];
  const teachers = accounts.filter((a: any) => a.role === 'teacher');
  const pool = teachers.length ? teachers : accounts.filter((a: any) => a.role === 'super_admin');
  const emails = pool.map((a: any) => String(a.email || '').toLowerCase().trim()).filter(Boolean);
  const idByEmail = new Map<string, string>();
  const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email').in('email', emails);
  (profiles || []).forEach((p: any) => p.email && idByEmail.set(String(p.email).toLowerCase().trim(), p.id));
  if (emails.some((e: string) => !idByEmail.has(e))) {
    try {
      (await listAllAuthUsers(supabaseAdmin)).forEach((u: any) => {
        const e = String(u.email || '').toLowerCase().trim();
        if (emails.includes(e) && !idByEmail.has(e)) idByEmail.set(e, u.id);
      });
    } catch {}
  }
  return pool
    .map((a: any) => {
      const email = String(a.email || '').toLowerCase().trim();
      const gender: 'male' | 'female' = a.gender === 'female' ? 'female' : 'male';
      // "Ustadh Mahmoud (Super Admin)" -> "Ustadh Mahmoud"
      const nameEn = String(a.display_name || '').replace(/\s*\(.*\)\s*$/, '').trim() || (gender === 'female' ? 'Ustadha' : 'Ustadh');
      return {
        id: idByEmail.get(email) || '',
        email,
        nameEn,
        nameAr: String(a.display_name_ar || '').trim() || nameEn,
        gender,
        photo: typeof a.photo_url === 'string' && /^(\/|https:\/\/)/.test(a.photo_url) ? a.photo_url : null
      };
    })
    .filter((t: PublicTeacher) => t.id);
}

// Middleware: Strict Super Admin Authorization
export const requireSuperAdmin = (req: any, res: any, next: any) => {
  const role = req.teacherUser?.appRole || req.teacherUser?.role;
  if (role !== 'super_admin') {
    res.setHeader('x-auth-diagnostic-stage', 'SUPER_ADMIN_REQUIRED');
    return res.status(403).json({
      error: 'Forbidden. This action requires Super Admin privileges.',
      diagnosticStage: 'SUPER_ADMIN_REQUIRED',
      requiredRole: 'super_admin',
      actualRole: role || 'teacher'
    });
  }
  return next();
};

app.get('/api/teacher-auth-diagnostic', verifyTeacherAuth, (req: any, res: any) => {
  const clientRef = typeof req.headers['x-client-project-ref'] === 'string' ? req.headers['x-client-project-ref'].trim() : null;
  const backendRef = extractSupabaseProjectRef(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

  let projectConsistency: 'MATCH' | 'MISMATCH' | 'UNKNOWN' = 'UNKNOWN';
  if (clientRef && backendRef) {
    projectConsistency = clientRef === backendRef ? 'MATCH' : 'MISMATCH';
  }

  res.json({
    diagnostic: true,
    authenticated: true,
    tokenVerification: 'success',
    teacherAuthorization: 'authorized',
    supabaseConfig: 'present',
    projectConsistency,
    stage: 'AUTHORIZED'
  });
});

function transformBookingToDashboardLesson(b: any) {
  const scheduledStart = b.scheduled_start;
  const scheduledEnd = b.scheduled_end || (scheduledStart && b.duration_minutes
    ? DateTime.fromISO(scheduledStart).plus({ minutes: b.duration_minutes }).toISO()
    : null);

  // Learner/parent semantics: do not collapse parent into learner_name
  const learnerName = b.student_name || b.contact_name || null;
  const parentName = b.parent_name || null;

  // Real fee integrity: do not fabricate $7 or any default
  let feeAmountUsd: number | null = null;
  if (b.fee_amount_usd !== null && b.fee_amount_usd !== undefined && b.fee_amount_usd !== '') {
    const parsed = Number(b.fee_amount_usd);
    feeAmountUsd = isNaN(parsed) ? null : parsed;
  } else if (b.booking_type === 'trial') {
    feeAmountUsd = 0;
  }

  // Real status: do not fabricate 'confirmed'
  const status = b.status || null;

  // Real timezone: do not fabricate 'UTC'
  const studentTimezone = b.student_timezone || null;

  let integrationStatus: 'synced' | 'pending' | 'failed' | 'manual_action_required' | 'active' = 'pending';
  if (b.integration_status) {
    integrationStatus = b.integration_status;
  } else if (b.zoom_meeting_id && b.google_calendar_event_id) {
    integrationStatus = 'synced';
  }

  return {
    id: b.id,
    reference_code: b.reference_code || null,
    learner_name: learnerName,
    parent_name: parentName,
    contact_email: b.contact_email || '',
    contact_whatsapp: b.contact_whatsapp || undefined,
    service_id: b.service_id || null,
    service_name: b.service_id ? b.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Teaching Session',
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    duration_minutes: b.duration_minutes !== null && b.duration_minutes !== undefined ? Number(b.duration_minutes) : null,
    status: status,
    is_free_trial: b.booking_type === 'trial',
    zoom_meeting_link: b.zoom_host_url || b.zoom_join_url || null,
    zoom_host_url: b.zoom_host_url || null,
    zoom_join_url: b.zoom_join_url || null,
    zoom_meeting_id: b.zoom_meeting_id || null,
    google_calendar_event_id: b.google_calendar_event_id || null,
    integration_status: integrationStatus,
    student_timezone: studentTimezone,
    cairo_time_display: b.cairo_time_display,
    fee_amount_usd: feeAmountUsd,
    notes: b.notes || ''
  };
}

// 12b. DASHBOARD: Teacher identity / workspace role verification
// RULES.md §1: a teacher's dashboard knows nothing about payments. Every /api/dashboard response
// is filtered for non-super-admins, so a new endpoint can't leak money fields by accident.
const PAYMENT_FIELD = /fee|payment|price|amount|revenue|refund|paid|currency|pay_?later|hold_expires|entitlement/i;
export function stripPaymentFields(value: any): any {
  if (Array.isArray(value)) return value.map(stripPaymentFields);
  if (!value || typeof value !== 'object' || value instanceof Date) return value;
  const out: any = {};
  for (const [key, v] of Object.entries(value)) {
    if (!PAYMENT_FIELD.test(key)) out[key] = stripPaymentFields(v);
  }
  return out;
}
app.use('/api/dashboard', (req: any, res: any, next: any) => {
  const json = res.json.bind(res);
  res.json = (body: any) => json(req.teacherUser && req.teacherUser.role !== 'super_admin' ? stripPaymentFields(body) : body);
  next();
});

// Teacher on-site notifications: their lessons booked, moved or cancelled in the last 14 days (no payment data).
app.get('/api/dashboard/notifications', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    let query = supabase
      .from('bookings')
      .select('id, reference_code, booking_type, status, contact_name, service_id, scheduled_start, created_at, updated_at')
      .in('status', ['confirmed', 'rescheduled', 'cancelled'])
      .gte('updated_at', DateTime.utc().minus({ days: 14 }).toISO()!)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (req.teacherUser?.role !== 'super_admin') query = query.eq('teacher_id', req.teacherUser.id);
    const { data, error } = await query;
    if (error) throw error;
    res.json({
      notifications: (data || []).map((b: any) => ({
        id: `${b.id}:${b.status}:${b.updated_at}`,
        bookingId: b.id,
        kind: b.status === 'cancelled' ? 'cancelled' : b.status === 'rescheduled' ? 'rescheduled' : b.booking_type === 'trial' ? 'new_trial' : 'new_booking',
        learnerName: b.contact_name,
        serviceId: b.service_id,
        referenceCode: b.reference_code,
        scheduledStart: b.scheduled_start,
        at: b.updated_at
      }))
    });
  } catch (err) {
    console.error('[GET /api/dashboard/notifications]', err);
    res.status(500).json({ error: 'Could not load notifications.' });
  }
});

// Teacher starts the lesson as the Zoom host (fresh start_url). Students only get the join link
// and wait in the waiting room, so a student who joins first never becomes the host.
app.get('/api/dashboard/bookings/:id/zoom-host-url', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data: booking } = await supabase.from('bookings').select('id, teacher_id, zoom_meeting_id').eq('id', req.params.id).maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
    if (req.teacherUser?.role !== 'super_admin' && booking.teacher_id !== req.teacherUser?.id) {
      return res.status(403).json({ error: 'This lesson is not yours.' });
    }
    const meetingId = String(booking.zoom_meeting_id || '');
    if (!meetingId || meetingId.startsWith('fallback-') || meetingId.startsWith('room-')) {
      return res.status(409).json({ error: 'The Zoom meeting for this lesson is still being prepared.' });
    }
    const url = await getZoomStartUrl(meetingId);
    if (!url) return res.status(502).json({ error: 'Zoom did not return a host link. Please try again.' });
    res.json({ url });
  } catch (err) {
    console.error('[GET /api/dashboard/bookings/:id/zoom-host-url]', err);
    res.status(500).json({ error: 'Could not open Zoom. Please try again.' });
  }
});

// Teacher asks the student to move a lesson (RULES.md §2). The student sees it on the site and moves it
// themselves; teachers don't move or cancel lessons directly (the super admin can).
app.post('/api/dashboard/bookings/:id/reschedule-request', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data: booking } = await supabase.from('bookings').select('id, teacher_id, status, scheduled_start').eq('id', req.params.id).maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
    if (req.teacherUser?.role !== 'super_admin' && booking.teacher_id !== req.teacherUser?.id) {
      return res.status(403).json({ error: 'This lesson is not yours.' });
    }
    if (!['confirmed', 'rescheduled'].includes(booking.status) || new Date(booking.scheduled_start).getTime() <= Date.now()) {
      return res.status(400).json({ error: 'Only upcoming lessons can be moved.' });
    }
    const note = typeof req.body?.note === 'string' ? req.body.note.trim().slice(0, 500) : '';
    const { error } = await supabase
      .from('bookings')
      .update({ reschedule_requested_at: new Date().toISOString(), reschedule_request_note: note || null, updated_at: new Date().toISOString() })
      .eq('id', booking.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error('[POST /api/dashboard/bookings/:id/reschedule-request]', err);
    res.status(500).json({ error: 'Could not send the request. Please try again.' });
  }
});

app.get('/api/dashboard/me', verifyTeacherAuth, async (req: any, res: any) => {
  return res.json({
    success: true,
    user: {
      id: req.teacherUser?.id,
      email: req.teacherUser?.email,
      name: req.teacherUser?.name || req.teacherUser?.user_metadata?.name || 'Teacher',
      role: req.teacherUser?.appRole || 'teacher',
      appRole: req.teacherUser?.appRole || 'teacher',
      isTeacher: true,
      // The welcome screen greets the teacher by name (and أستاذ/أستاذة by gender).
      displayName: req.teacherUser?.display_name || null,
      gender: req.teacherUser?.gender || null,
      agreementRequired: req.teacherUser?.agreementRequired === true
    }
  });
});

// Teacher accepts the current teacher agreement (/staff/agreement). Stored as proof with the version.
app.post('/api/dashboard/agreement/accept', verifyTeacherAuth, async (req: any, res: any) => {
  if (req.body?.version !== TEACHER_AGREEMENT_VERSION || req.body?.accepted !== true) {
    return res.status(400).json({ error: 'Please tick the box to accept the current agreement.', code: 'AGREEMENT_VERSION' });
  }
  const supabase = getSupabaseAdminClient();
  if (!supabase || !req.teacherUser?.email) return res.json({ success: true }); // dev tokens have no row
  const { error } = await supabase
    .from('teacher_accounts')
    .update({ agreement_version: TEACHER_AGREEMENT_VERSION, agreement_accepted_at: new Date().toISOString() })
    .eq('email', String(req.teacherUser.email).toLowerCase().trim());
  if (error) {
    console.error('[Teacher agreement accept]', error.message);
    return res.status(500).json({ error: 'Could not save your acceptance. Please try again.' });
  }
  return res.json({ success: true });
});

// 13. DASHBOARD: Fetch today's lessons
app.get('/api/dashboard/today', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.error('[Dashboard Error] Database configuration missing or invalid.');
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    // Teacher's timezone is Africa/Cairo
    const nowCairo = DateTime.now().setZone('Africa/Cairo');
    const startOfDayUtc = nowCairo.startOf('day').toUTC().toISO();
    const endOfDayUtc = nowCairo.endOf('day').toUTC().toISO();

    let todayQuery = supabase
      .from('bookings')
      .select('*')
      .gte('scheduled_start', startOfDayUtc)
      .lte('scheduled_start', endOfDayUtc);

    if (req.teacherUser?.role !== 'super_admin') {
      todayQuery = todayQuery.eq('teacher_id', req.teacherUser.id);
    }

    const { data, error } = await todayQuery.order('scheduled_start', { ascending: true });

    if (error) {
      console.error('[Dashboard Fetch Error]', error);
      return res.status(500).json({ error: 'Failed to load today\'s lessons.' });
    }

    const lessons = (data || []).map(transformBookingToDashboardLesson);

    // Compute operational summary metrics
    const nowUtc = nowCairo.toUTC();
    const activeLessons = lessons.filter(l => l.status !== 'cancelled');
    const trialsCount = activeLessons.filter(l => l.is_free_trial).length;

    // Check completed: strictly count lessons where teacher explicitly recorded status === 'completed'
    const completedCount = lessons.filter(l => l.status === 'completed').length;

    // Check items needing attention: failed integrations, missing Zoom on upcoming active lesson, or past unresolved lesson
    const needsAttentionCount = activeLessons.filter(l => {
      if (l.status === 'completed' || l.status === 'no_show') return false;
      const isFailed = l.integration_status === 'failed' || l.integration_status === 'manual_action_required';
      const isMissingZoom = !l.zoom_host_url && !l.zoom_join_url;
      if (!l.scheduled_start) return isFailed;
      const startDt = DateTime.fromISO(l.scheduled_start);
      if (!startDt.isValid) return isFailed;
      const endDt = l.scheduled_end
        ? DateTime.fromISO(l.scheduled_end)
        : startDt.plus({ minutes: l.duration_minutes || 30 });
      // Attention if failed, starting in < 2 hours with no zoom, or scheduled end passed without outcome
      const isSoon = startDt.diff(nowUtc, 'hours').hours < 2 && startDt > nowUtc;
      const isPastUnresolved = endDt < nowUtc && l.status === 'confirmed';
      return isFailed || (isMissingZoom && isSoon) || isPastUnresolved;
    }).length;

    const validCandidates = lessons.filter(l => {
      if (!l.scheduled_start) return false;
      if (l.status === 'cancelled' || l.status === 'completed' || l.status === 'no_show') return false;
      const startDt = DateTime.fromISO(l.scheduled_start);
      if (!startDt.isValid) return false;
      const endDt = l.scheduled_end
        ? DateTime.fromISO(l.scheduled_end)
        : startDt.plus({ minutes: l.duration_minutes || 30 });
      return endDt > nowUtc;
    });

    const inProgressLesson = validCandidates
      .filter(l => {
        const startDt = DateTime.fromISO(l.scheduled_start);
        const endDt = l.scheduled_end
          ? DateTime.fromISO(l.scheduled_end)
          : startDt.plus({ minutes: l.duration_minutes || 30 });
        return nowUtc >= startDt && nowUtc <= endDt;
      })
      .sort((a, b) => DateTime.fromISO(a.scheduled_start).toMillis() - DateTime.fromISO(b.scheduled_start).toMillis())[0];

    const upcomingLesson = validCandidates
      .filter(l => DateTime.fromISO(l.scheduled_start) > nowUtc)
      .sort((a, b) => DateTime.fromISO(a.scheduled_start).toMillis() - DateTime.fromISO(b.scheduled_start).toMillis())[0];

    const nextLesson = inProgressLesson || upcomingLesson || null;

    // TE-01: who the next lesson is with (age, level, subject) and what the family was last told.
    const nextRow = nextLesson ? (data || []).find((b: any) => b.id === nextLesson.id) : null;
    let nextLessonContext: any = null;
    if (nextRow?.student_id) {
      const [{ data: st }, { data: notes }] = await Promise.all([
        supabase.from('students').select('age, current_level, learning_interest, learner_type').eq('id', nextRow.student_id).maybeSingle(),
        supabase.from('lesson_notes').select('family_summary, next_steps, created_at').eq('student_id', nextRow.student_id)
          .or('family_summary.not.is.null,next_steps.not.is.null').order('created_at', { ascending: false }).limit(1)
      ]);
      nextLessonContext = {
        age: st?.age ?? null,
        level: st?.current_level || null,
        subject: st?.learning_interest || null,
        lastFamilySummary: notes?.[0]?.family_summary || null,
        lastNextSteps: notes?.[0]?.next_steps || null,
        lastNoteAt: notes?.[0]?.created_at || null
      };
    }

    // TE-01 → PR-06: this teacher's completed lessons of the last 14 days with no family summary yet.
    let missingNotes: any[] = [];
    {
      let pastQuery = supabase
        .from('bookings')
        .select('id, student_id, contact_name, service_id, scheduled_start, teacher_id')
        .eq('status', 'completed')
        .gte('scheduled_start', nowCairo.minus({ days: 14 }).toUTC().toISO())
        .lt('scheduled_start', startOfDayUtc)
        .order('scheduled_start', { ascending: false })
        .limit(40);
      if (req.teacherUser?.role !== 'super_admin') pastQuery = pastQuery.eq('teacher_id', req.teacherUser.id);
      const { data: past } = await pastQuery;
      const pastIds = (past || []).map((b: any) => b.id);
      if (pastIds.length) {
        const { data: sessions } = await supabase.from('lesson_sessions').select('id, booking_id').in('booking_id', pastIds);
        const sessionIds = (sessions || []).map((s: any) => s.id);
        const { data: withSummary } = sessionIds.length
          ? await supabase.from('lesson_notes').select('session_id').in('session_id', sessionIds).not('family_summary', 'is', null)
          : { data: [] as any[] };
        const summarized = new Set((withSummary || []).map((n: any) => n.session_id));
        const bookingHasSummary = new Set((sessions || []).filter((s: any) => summarized.has(s.id)).map((s: any) => s.booking_id));
        const missing = (past || []).filter((b: any) => !bookingHasSummary.has(b.id)).slice(0, 10);
        const missingStudentIds = [...new Set(missing.map((b: any) => b.student_id).filter(Boolean))];
        const { data: names } = missingStudentIds.length
          ? await supabase.from('students').select('id, name').in('id', missingStudentIds)
          : { data: [] as any[] };
        const nameById = new Map((names || []).map((s: any) => [s.id, s.name]));
        missingNotes = missing.map((b: any) => ({
          id: b.id,
          student_id: b.student_id,
          learner_name: nameById.get(b.student_id) || b.contact_name,
          service_id: b.service_id,
          scheduled_start: b.scheduled_start
        }));
      }
    }

    res.json({
      lessons,
      summary: {
        total_today: lessons.length,
        active_today: activeLessons.length,
        trials_today: trialsCount,
        completed_today: completedCount,
        needs_attention_count: needsAttentionCount,
        next_lesson: nextLesson,
        next_lesson_context: nextLessonContext
      },
      missing_notes: missingNotes
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// CRM-06: one admin search across accounts, children (through their parent), emails, phone numbers, booking
// references and payments; every hit carries the page to open.
app.get('/api/dashboard/admin/search', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const q = typeof req.query?.q === 'string' ? req.query.q.trim().slice(0, 80) : '';
    if (q.length < 2) return res.json({ results: [] });
    const pattern = pgrstValue(`%${escapeLike(q)}%`);
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(q);
    const [students, guardians, bookings, payments, leads] = await Promise.all([
      supabase.from('students').select('id, name, email, learner_type').or(`name.ilike.${pattern},email.ilike.${pattern},whatsapp.ilike.${pattern}`).limit(8),
      supabase.from('guardians').select('student_id, parent_name, parent_email').or(`parent_name.ilike.${pattern},parent_email.ilike.${pattern}`).limit(8),
      supabase.from('bookings').select('id, reference_code, student_id, contact_name, scheduled_start, status').or(`reference_code.ilike.${pattern},contact_email.ilike.${pattern},contact_name.ilike.${pattern}`).order('scheduled_start', { ascending: false }).limit(8),
      isUuid
        ? supabase.from('payments').select('id, student_id, amount, currency, status, created_at').or(`id.eq.${q},payment_reference.ilike.${pattern}`).limit(8)
        : supabase.from('payments').select('id, student_id, amount, currency, status, created_at').ilike('payment_reference', `%${escapeLike(q)}%`).limit(8),
      supabase.from('leads').select('id, name, email, status').or(`name.ilike.${pattern},email.ilike.${pattern}`).limit(8)
    ]);
    const childIds = [...new Set((guardians.data || []).map((g: any) => g.student_id))];
    const { data: children } = childIds.length ? await supabase.from('students').select('id, name').in('id', childIds) : { data: [] as any[] };
    const childName = new Map((children || []).map((c: any) => [c.id, c.name]));
    const results: Array<{ type: string; id: string; title: string; subtitle: string; link: string }> = [];
    for (const s of students.data || []) results.push({ type: 'student', id: s.id, title: s.name || s.email || 'Student', subtitle: [s.email, s.learner_type].filter(Boolean).join(' · '), link: `/dashboard/students/${s.id}` });
    for (const g of guardians.data || []) {
      if (results.some((r) => r.id === g.student_id)) continue;
      results.push({ type: 'child', id: g.student_id, title: childName.get(g.student_id) || 'Child', subtitle: `${g.parent_name || ''}${g.parent_email ? ` · ${g.parent_email}` : ''}`, link: `/dashboard/students/${g.student_id}` });
    }
    for (const b of bookings.data || []) results.push({ type: 'booking', id: b.id, title: b.reference_code || 'Booking', subtitle: [b.contact_name, b.status, b.scheduled_start?.slice(0, 10)].filter(Boolean).join(' · '), link: b.student_id ? `/dashboard/students/${b.student_id}` : '/dashboard/bookings' });
    for (const p of payments.data || []) results.push({ type: 'payment', id: p.id, title: `${p.amount ?? ''} ${p.currency || ''}`.trim() || 'Payment', subtitle: [p.status, p.created_at?.slice(0, 10)].filter(Boolean).join(' · '), link: p.student_id ? `/dashboard/students/${p.student_id}` : '/dashboard/pay-later' });
    for (const l of leads.data || []) results.push({ type: 'lead', id: l.id, title: l.name || l.email || 'Lead', subtitle: [l.email, l.status].filter(Boolean).join(' · '), link: '/dashboard/leads' });
    return res.json({ results: results.slice(0, 30) });
  } catch (err) {
    console.error('[GET /api/dashboard/admin/search]', err);
    return res.status(500).json({ error: 'Search failed.' });
  }
});

// AD-01: what needs the admin today, as counts with a link each. Same filters as the pages they open.
app.get('/api/dashboard/admin/action-items', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const now = DateTime.utc();
    const endOfToday = DateTime.now().setZone('Africa/Cairo').endOf('day').toUTC().toISO();
    const [tasks, payLater, refunds, placements, threads, noZoom, health] = await Promise.all([
      supabase.from('crm_tasks').select('id', { count: 'exact', head: true }).is('done_at', null).lte('due_at', endOfToday),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('status', 'pending').eq('payment_plan', 'pay_later'),
      supabase.from('package_entitlements').select('id', { count: 'exact', head: true }).eq('status', 'active')
        .eq('metadata->>source', 'cancellation_credit').not('metadata->>refund_requested_at', 'is', null),
      supabase.from('placement_tests').select('id', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('chat_threads').select('last_message_at, staff_last_read_at, last_sender_role').eq('kind', 'support')
        .not('last_message_at', 'is', null).gte('last_message_at', now.minus({ days: 30 }).toISO()).limit(500),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).in('status', ['confirmed', 'rescheduled'])
        .gte('scheduled_start', now.toISO()).lte('scheduled_start', now.plus({ hours: 24 }).toISO())
        .or('zoom_meeting_link.is.null,zoom_meeting_link.not.like.http*'),
      computeHealth(supabase, PLACEMENT_BEFORE_BOOKING)
    ]);
    // Unread = the family wrote last and the admin hasn't opened it since (two columns, so compared here).
    const unreadChats = (threads.data || []).filter((t: any) =>
      !['teacher', 'admin'].includes(t.last_sender_role) && (!t.staff_last_read_at || t.staff_last_read_at < t.last_message_at)
    ).length;
    const healthWarnings = health.checks.filter((c: any) => c.status !== 'green').length;
    return res.json({
      items: [
        { key: 'follow_ups', count: tasks.count || 0, link: '/dashboard' },
        { key: 'pay_later', count: payLater.count || 0, link: '/dashboard/pay-later' },
        { key: 'refunds', count: refunds.count || 0, link: '/dashboard/pay-later' },
        { key: 'placements', count: placements.count || 0, link: '/dashboard/placement' },
        { key: 'unread_chats', count: unreadChats, link: '/dashboard/messages' },
        { key: 'health', count: healthWarnings, link: '/dashboard/health' },
        { key: 'no_zoom_24h', count: noZoom.count || 0, link: '/dashboard/upcoming' }
      ]
    });
  } catch (err) {
    console.error('[Admin action items]', err);
    return res.status(500).json({ error: 'Failed to load action items.' });
  }
});

// TE-04: a new teacher's first-week checklist; every item ticks itself from real data.
app.get('/api/dashboard/onboarding-checklist', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });
    const teacherId = req.teacherUser?.id;
    const email = String(req.teacherUser?.email || '').toLowerCase();
    const [account, hours, calendar, zoom] = await Promise.all([
      supabase.from('teacher_accounts').select('agreement_version, photo_url').eq('email', email).maybeSingle(),
      supabase.from('availability').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('is_active', true),
      supabase.from('calendar_connections').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).eq('provider', 'google_calendar').eq('is_active', true),
      supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('teacher_id', teacherId).like('zoom_meeting_link', 'http%')
    ]);
    const isAdmin = req.teacherUser?.role === 'super_admin';
    const items = [
      { key: 'agreement', done: isAdmin || account.data?.agreement_version === TEACHER_AGREEMENT_VERSION, link: '/staff/agreement' },
      { key: 'hours', done: (hours.count || 0) > 0, link: '/dashboard/availability' },
      { key: 'calendar', done: (calendar.count || 0) > 0, link: '/dashboard/settings' },
      { key: 'photo', done: Boolean(account.data?.photo_url), link: '/dashboard/messages' },
      { key: 'zoom', done: (zoom.count || 0) > 0, link: '/dashboard/upcoming' }
    ];
    return res.json({ items, allDone: items.every(i => i.done) });
  } catch (err) {
    console.error('[Onboarding checklist]', err);
    return res.status(500).json({ error: 'Failed to load the checklist.' });
  }
});

// 14. DASHBOARD: Fetch upcoming lessons
app.get('/api/dashboard/upcoming', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      console.error('[Dashboard Error] Database configuration missing or invalid.');
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const nowCairo = DateTime.now().setZone('Africa/Cairo');
    const endOfDayUtc = nowCairo.endOf('day').toUTC().toISO();

    // Query range in days (default 7, min 1, max 60)
    const daysParam = parseInt(req.query.days as string, 10);
    const rangeDays = (!isNaN(daysParam) && daysParam >= 1 && daysParam <= 60) ? daysParam : 7;
    const rangeEndUtc = nowCairo.plus({ days: rangeDays }).endOf('day').toUTC().toISO();

    let upcomingQuery = supabase
      .from('bookings')
      .select('*')
      .gt('scheduled_start', endOfDayUtc)
      .lte('scheduled_start', rangeEndUtc)
      .neq('status', 'cancelled');

    if (req.teacherUser?.role !== 'super_admin') {
      upcomingQuery = upcomingQuery.eq('teacher_id', req.teacherUser.id);
    }

    const { data, error } = await upcomingQuery
      .order('scheduled_start', { ascending: true })
      .limit(60);

    if (error) {
      console.error('[Dashboard Fetch Error]', error);
      return res.status(500).json({ error: 'Failed to load upcoming lessons.' });
    }

    const lessons = (data || []).map(transformBookingToDashboardLesson);

    res.json({ lessons, range_days: rangeDays });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15. DASHBOARD: Fetch active and historical students (enriched list)
app.get('/api/dashboard/students', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { status, search } = req.query;

    let studentsQuery = supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    // Strict Role Scoping: Standard Teacher sees only their assigned students
    if (req.teacherUser?.role !== 'super_admin') {
      studentsQuery = studentsQuery.eq('assigned_teacher_id', req.teacherUser.id);
    }

    if (status && status !== 'all' && ['active', 'paused', 'inactive'].includes(status as string)) {
      studentsQuery = studentsQuery.eq('status', status as string);
    }

    const { data: rawStudents, error: studentsError } = await studentsQuery;

    if (studentsError) {
      console.error('[Dashboard Students Error]', studentsError);
      return res.status(500).json({ error: 'Failed to load students.' });
    }

    const students = rawStudents || [];

    if (students.length === 0) {
      return res.json({ students: [] });
    }

    const studentIds = students.map(s => s.id);
    const studentEmails = students.map(s => s.email?.toLowerCase().trim()).filter(Boolean) as string[];
    const studentLeadIds = students.map(s => s.lead_id).filter(Boolean) as string[];

    // Push filtering to database query level using indexed identifiers (student_id, contact_email, lead_id)
    const bookingOrFilters: string[] = [`student_id.in.(${studentIds.join(',')})`];
    if (studentEmails.length > 0) {
      bookingOrFilters.push(`contact_email.in.(${studentEmails.map(e => `"${e}"`).join(',')})`);
    }
    if (studentLeadIds.length > 0) {
      bookingOrFilters.push(`lead_id.in.(${studentLeadIds.join(',')})`);
    }

    // Fetch related guardians, scoped bookings, notes count, services, and teachers in parallel
    const [guardiansRes, bookingsRes, notesRes, servicesRes, teachersRes] = await Promise.all([
      supabase.from('guardians').select('student_id, parent_name').in('student_id', studentIds),
      supabase
        .from('bookings')
        .select('id, student_id, lead_id, contact_email, scheduled_start, scheduled_end, duration_minutes, status, booking_type, service_id, parent_name, zoom_meeting_link, sync_metadata')
        .or(bookingOrFilters.join(','))
        .order('scheduled_start', { ascending: true }),
      supabase.from('lesson_notes').select('id, student_id').in('student_id', studentIds),
      supabase.from('services').select('id, title, arabic_title'),
      supabase.from('teacher_accounts').select('email, display_name')
    ]);

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.title);
      }
    }

    // Map teacher display names
    const teacherNameMap = new Map<string, string>();
    (teachersRes.data || []).forEach(t => {
      teacherNameMap.set(t.email.toLowerCase().trim(), t.display_name || 'Teacher');
    });

    // Map guardians by student_id
    const guardianMap = new Map<string, string>();
    if (guardiansRes.data) {
      for (const g of guardiansRes.data) {
        if (g.student_id && g.parent_name) {
          guardianMap.set(g.student_id, g.parent_name);
        }
      }
    }

    // Map notes count by student_id
    const notesCountMap = new Map<string, number>();
    if (notesRes.data) {
      for (const n of notesRes.data) {
        if (n.student_id) {
          notesCountMap.set(n.student_id, (notesCountMap.get(n.student_id) || 0) + 1);
        }
      }
    }

    // Map scoped bookings by student_id, email, or lead_id
    const allBookings = bookingsRes.data || [];
    const nowIso = new Date().toISOString();

    const enrichedStudents = students.map(st => {
      const emailLower = st.email?.toLowerCase().trim();
      const stBookings = allBookings.filter(b =>
        (b.student_id && b.student_id === st.id) ||
        (emailLower && b.contact_email && b.contact_email.toLowerCase().trim() === emailLower) ||
        (st.lead_id && b.lead_id && b.lead_id === st.lead_id)
      );

      // Completed bookings (only factual completed count, no invented numbers)
      const completedBookings = stBookings.filter(b => b.status === 'completed');
      const totalCompletedLessons = completedBookings.length;

      // Upcoming bookings (scheduled_start >= now and status in ('confirmed', 'pending'))
      const upcomingBookings = stBookings
        .filter(b => b.scheduled_start >= nowIso && ['confirmed', 'pending'].includes(b.status))
        .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

      const nextBooking = upcomingBookings[0] || null;

      // Last completed booking
      const pastCompleted = completedBookings
        .filter(b => b.scheduled_start < nowIso)
        .sort((a, b) => b.scheduled_start.localeCompare(a.scheduled_start));
      const lastBooking = pastCompleted[0] || null;

      // Parent name resolution
      let parentName = guardianMap.get(st.id) || null;
      if (!parentName) {
        const bookingWithParent = stBookings.find(b => b.parent_name && b.parent_name.trim());
        if (bookingWithParent) {
          parentName = bookingWithParent.parent_name.trim();
        }
      }

      // Primary service resolution
      let primaryServiceId: string | null = null;
      const trialWithAssessment = stBookings.find(b => b.booking_type === 'trial' && b.sync_metadata?.trial_assessment?.recommended_service_id);
      if (trialWithAssessment) {
        primaryServiceId = trialWithAssessment.sync_metadata.trial_assessment.recommended_service_id;
      } else if (stBookings.length > 0) {
        const latestBooking = [...stBookings].sort((a, b) => b.scheduled_start.localeCompare(a.scheduled_start))[0];
        primaryServiceId = latestBooking?.service_id || null;
      }

      const assignedTeacherName = st.assigned_teacher_id
        ? (teacherNameMap.get(String(st.assigned_teacher_id).toLowerCase().trim()) || 'Teacher')
        : null;

      return {
        id: st.id,
        lead_id: st.lead_id || null,
        name: st.name,
        email: st.email || null,
        whatsapp: st.whatsapp || null,
        learner_type: st.learner_type || null,
        parent_name: parentName,
        country: st.country || null,
        timezone: st.timezone || null,
        gender: st.gender || 'undisclosed',
        teacher_gender_preference: st.teacher_gender_preference || 'no_preference',
        assigned_teacher_id: st.assigned_teacher_id || null,
        assigned_teacher_name: assignedTeacherName,
        current_level: st.current_level || null,
        status: st.status || 'active',
        primary_service_id: primaryServiceId,
        primary_service_name: primaryServiceId ? (serviceMap.get(primaryServiceId) || primaryServiceId) : null,
        total_completed_lessons: totalCompletedLessons,
        next_lesson: nextBooking ? {
          id: nextBooking.id,
          scheduled_start: nextBooking.scheduled_start,
          duration_minutes: nextBooking.duration_minutes,
          service_id: nextBooking.service_id,
          service_name: serviceMap.get(nextBooking.service_id) || nextBooking.service_id,
          status: nextBooking.status,
          zoom_join_url: nextBooking.zoom_meeting_link?.startsWith('http') ? nextBooking.zoom_meeting_link : null
        } : null,
        last_lesson: lastBooking ? {
          id: lastBooking.id,
          scheduled_start: lastBooking.scheduled_start,
          service_id: lastBooking.service_id,
          service_name: serviceMap.get(lastBooking.service_id) || lastBooking.service_id
        } : null,
        notes_count: notesCountMap.get(st.id) || 0,
        notes: st.notes || null,
        created_at: st.created_at,
        updated_at: st.updated_at
      };
    });

    // In-memory text search if requested
    let filteredStudents = enrichedStudents;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.toLowerCase().trim();
      filteredStudents = enrichedStudents.filter(s =>
        s.name.toLowerCase().includes(q) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.parent_name && s.parent_name.toLowerCase().includes(q)) ||
        (s.whatsapp && s.whatsapp.toLowerCase().includes(q)) ||
        (s.primary_service_name && s.primary_service_name.toLowerCase().includes(q))
      );
    }

    res.json({ students: filteredStudents });
  } catch (err) {
    console.error('[Dashboard Students Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15B. DASHBOARD: Fetch full detail of a specific student
app.get('/api/dashboard/students/:id', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (studentError) {
      console.error('[Dashboard Student Detail Error]', studentError);
      return res.status(500).json({ error: 'Failed to load student record.' });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Strict Scope Enforcement: standard Teacher cannot access another teacher's student
    if (req.teacherUser?.role !== 'super_admin') {
      if (student.assigned_teacher_id !== req.teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to view this student.' });
      }
    }

    const emailLower = student.email?.toLowerCase().trim();
    const leadId = student.lead_id;

    // Database-level filtered booking query using indexed identifiers (student_id, contact_email, lead_id)
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, reference_code, student_id, lead_id, service_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, contact_whatsapp, parent_name, cancellation_reason, notes, fee_amount_usd, zoom_meeting_link, sync_metadata, created_at, updated_at')
      .order('scheduled_start', { ascending: false });

    const filterClauses: string[] = [`student_id.eq.${id}`];
    if (emailLower) {
      filterClauses.push(`contact_email.ilike.${pgrstValue(escapeLike(emailLower))}`);
    }
    if (leadId) {
      filterClauses.push(`lead_id.eq.${leadId}`);
    }

    if (filterClauses.length > 1) {
      bookingsQuery = bookingsQuery.or(filterClauses.join(','));
    } else {
      bookingsQuery = bookingsQuery.eq('student_id', id);
    }

    // Fetch related records in parallel
    const [guardiansRes, goalsRes, bookingsRes, notesRes, milestonesRes, servicesRes, leadRes] = await Promise.all([
      supabase.from('guardians').select('*').eq('student_id', id).maybeSingle(),
      supabase.from('student_goals').select('*').eq('student_id', id).order('created_at', { ascending: false }),
      bookingsQuery,
      supabase
        .from('lesson_notes')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
      supabase
        .from('learner_milestones')
        .select('*')
        .eq('student_id', id)
        .order('reached_at', { ascending: false }),
      supabase.from('services').select('id, title, arabic_title'),
      leadId
        ? supabase.from('leads').select('*').eq('id', leadId).maybeSingle()
        : (emailLower ? supabase.from('leads').select('*').ilike('email', escapeLike(emailLower)).maybeSingle() : Promise.resolve({ data: null, error: null }))
    ]);

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.title);
      }
    }

    // Bookings returned are strictly scoped to this student from the database query
    const allBookings = bookingsRes.data || [];

    const nowIso = new Date().toISOString();
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const totalCompletedLessons = completedBookings.length;

    // Next scheduled lesson
    const upcomingBookings = allBookings
      .filter(b => b.scheduled_start >= nowIso && ['confirmed', 'pending'].includes(b.status))
      .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
    const nextBooking = upcomingBookings[0] || null;

    // Last completed lesson
    const pastCompleted = completedBookings
      .filter(b => b.scheduled_start < nowIso)
      .sort((a, b) => b.scheduled_start.localeCompare(a.scheduled_start));
    const lastBooking = pastCompleted[0] || null;

    // Parent / guardian resolution
    let guardian = guardiansRes.data || null;
    if (guardian) {
      const cleanEmail = (guardian.parent_email && guardian.parent_email.trim())
        ? guardian.parent_email.trim()
        : null;
      guardian = {
        ...guardian,
        parent_email: cleanEmail,
        parent_whatsapp: guardian.parent_whatsapp || null
      };
    } else {
      const bookingWithParent = allBookings.find(b => b.parent_name && b.parent_name.trim());
      if (bookingWithParent) {
        guardian = {
          id: 'inferred',
          student_id: id,
          parent_name: bookingWithParent.parent_name.trim(),
          parent_email: bookingWithParent.contact_email || null,
          parent_whatsapp: bookingWithParent.contact_whatsapp || null,
          relationship_type: 'parent',
          created_at: bookingWithParent.created_at
        };
      }
    }

    // Primary service resolution
    let primaryServiceId: string | null = null;
    const primaryGoal = (goalsRes.data || []).find(g => g.is_primary && g.service_id);
    if (primaryGoal?.service_id) {
      primaryServiceId = primaryGoal.service_id;
    } else {
      const trialWithAssessment = allBookings.find(b => b.booking_type === 'trial' && b.sync_metadata?.trial_assessment?.recommended_service_id);
      if (trialWithAssessment) {
        primaryServiceId = trialWithAssessment.sync_metadata.trial_assessment.recommended_service_id;
      } else if (allBookings.length > 0) {
        primaryServiceId = allBookings[0].service_id || null;
      }
    }

    // Extract trial & assessment context if available
    let trialContext: any = null;
    const trialBooking = allBookings.find(b => b.booking_type === 'trial');
    if (trialBooking) {
      const assessment = trialBooking.sync_metadata?.trial_assessment || null;
      trialContext = {
        booking_id: trialBooking.id,
        reference_code: trialBooking.reference_code,
        trial_date: trialBooking.scheduled_start,
        status: trialBooking.status,
        assessed_level: assessment?.current_level || null,
        recommended_service_id: assessment?.recommended_service_id || null,
        recommended_service_name: assessment?.recommended_service_id
          ? (serviceMap.get(assessment.recommended_service_id) || assessment.recommended_service_id)
          : null,
        recommended_duration: assessment?.recommended_duration || null,
        recommended_frequency: assessment?.recommended_frequency || null,
        learning_plan_summary: assessment?.learning_plan_summary || null,
        private_notes: assessment?.private_notes || null,
        assessed_at: assessment?.assessed_at || null
      };
    }

    // Extract lead context if available
    let leadContext: any = null;
    if (leadRes.data) {
      const l = leadRes.data;
      leadContext = {
        lead_id: l.id,
        origin_status: l.status,
        service_interest_id: l.service_interest_id || null,
        service_interest_name: l.service_interest_id ? (serviceMap.get(l.service_interest_id) || l.service_interest_id) : null,
        goal: l.goal || null,
        notes: l.notes || null,
        created_at: l.created_at
      };
    }

    // Format notes
    const formattedNotes = (notesRes.data || []).map(n => ({
      id: n.id,
      student_id: n.student_id,
      session_id: n.session_id || null,
      content: n.private_notes,
      observations: n.observations || null,
      next_steps: n.next_steps || null,
      family_summary: n.family_summary || null,
      achievements: n.achievements ?? null,
      created_at: n.created_at,
      updated_at: n.updated_at
    }));

    // Format bookings history
    // TE-02: latest placement result and the conversation with this family (the teacher's lesson chat, or the
    // admin's support chat). No money is read here.
    const learnerAccount = await resolveLearnerAccount(supabase, id);
    const isAdminViewer = req.teacherUser?.role === 'super_admin';
    const [placementRes, threadRes] = await Promise.all([
      supabase.from('placement_tests')
        .select('id, service_id, status, score, max_score, suggested_level, admin_level, submitted_at, reviewed_at')
        .eq('learner_student_id', id).in('status', ['submitted', 'reviewed'])
        .order('created_at', { ascending: false }).limit(1),
      learnerAccount.userId
        ? (isAdminViewer
            ? supabase.from('chat_threads').select('id').eq('kind', 'support').eq('owner_user_id', learnerAccount.userId).limit(1)
            : supabase.from('chat_threads').select('id').eq('kind', 'lesson').eq('owner_user_id', learnerAccount.userId).eq('teacher_id', req.teacherUser?.id).limit(1))
        : Promise.resolve({ data: [] as any[] })
    ]);
    const latestPlacement = placementRes.data?.[0] || null;

    const formattedBookings = allBookings.map(b => ({
      id: b.id,
      reference_code: b.reference_code,
      booking_type: b.booking_type,
      service_id: b.service_id,
      service_name: serviceMap.get(b.service_id) || b.service_id,
      duration_minutes: b.duration_minutes,
      scheduled_start: b.scheduled_start,
      scheduled_end: b.scheduled_end,
      status: b.status,
      zoom_join_url: b.zoom_meeting_link?.startsWith('http') ? b.zoom_meeting_link : null,
      cancellation_reason: b.cancellation_reason || null,
      notes: b.notes || null
    }));

    res.json({
      student: {
        id: student.id,
        lead_id: student.lead_id || null,
        name: student.name,
        email: student.email || null,
        whatsapp: student.whatsapp || null,
        learner_type: student.learner_type || null,
        country: student.country || null,
        timezone: student.timezone || null,
        current_level: student.current_level || null,
        status: student.status || 'active',
        notes: student.notes || null,
        created_at: student.created_at,
        updated_at: student.updated_at
      },
      guardian,
      goals: (goalsRes.data || []).map(g => ({
        id: g.id,
        service_id: g.service_id || null,
        service_name: g.service_id ? (serviceMap.get(g.service_id) || g.service_id) : null,
        goal_text: g.goal_text,
        is_primary: g.is_primary,
        status: g.status
      })),
      primary_service_id: primaryServiceId,
      primary_service_name: primaryServiceId ? (serviceMap.get(primaryServiceId) || primaryServiceId) : null,
      total_completed_lessons: totalCompletedLessons,
      next_lesson: nextBooking ? {
        id: nextBooking.id,
        reference_code: nextBooking.reference_code,
        scheduled_start: nextBooking.scheduled_start,
        duration_minutes: nextBooking.duration_minutes,
        service_id: nextBooking.service_id,
        service_name: serviceMap.get(nextBooking.service_id) || nextBooking.service_id,
        status: nextBooking.status,
        zoom_join_url: nextBooking.zoom_meeting_link?.startsWith('http') ? nextBooking.zoom_meeting_link : null
      } : null,
      last_lesson: lastBooking ? {
        id: lastBooking.id,
        scheduled_start: lastBooking.scheduled_start,
        service_id: lastBooking.service_id,
        service_name: serviceMap.get(lastBooking.service_id) || lastBooking.service_id
      } : null,
      bookings: formattedBookings,
      trial_context: trialContext,
      lead_context: leadContext,
      notes: formattedNotes,
      milestones: milestonesRes.data || [],
      services: servicesRes.data || [],
      placement: latestPlacement ? {
        id: latestPlacement.id,
        service_id: latestPlacement.service_id,
        status: latestPlacement.status,
        score: latestPlacement.score,
        max_score: latestPlacement.max_score,
        level: latestPlacement.admin_level || latestPlacement.suggested_level || null,
        reviewed: latestPlacement.status === 'reviewed',
        at: latestPlacement.reviewed_at || latestPlacement.submitted_at
      } : null,
      chat_thread_id: threadRes.data?.[0]?.id || null
    });
  } catch (err) {
    console.error('[Dashboard Student Detail Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// GET /api/dashboard/students/:id/ai-brief is POST because we might pass additional dynamic context later
app.post('/api/dashboard/students/:id/ai-brief', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    // 1. Fetch student to authorize
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('assigned_teacher_id, name, learner_type, current_level, status')
      .eq('id', id)
      .maybeSingle();

    if (studentError) {
      console.error('[AI Brief] Error fetching student:', studentError);
      return res.status(500).json({ error: 'Failed to load student record.' });
    }

    if (!student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // 2. Strict Scope Enforcement
    if (req.teacherUser?.role !== 'super_admin') {
      if (student.assigned_teacher_id !== req.teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to view this student.' });
      }
    }

    // 3. Gather Context (Minimizing PII)
    const [goalsRes, lessonsRes, intakesRes] = await Promise.all([
      supabase.from('student_goals').select('goal_text, service_id, is_primary').eq('student_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('lesson_notes').select('next_steps, observations, private_notes, created_at').eq('student_id', id).order('created_at', { ascending: false }).limit(3),
      supabase.from('student_intakes').select('learning_profile, assessment').eq('learner_student_id', id).order('created_at', { ascending: false }).limit(1)
    ]);

    const context = {
      student: {
        first_name: student.name ? student.name.split(' ')[0] : 'Student',
        learner_type: student.learner_type,
        current_level: student.current_level,
        status: student.status
      },
      goals: goalsRes.data || [],
      recent_lessons: (lessonsRes.data || []).map(l => ({
        date: l.created_at,
        next_steps: l.next_steps,
        observations: l.observations,
        private_notes: l.private_notes
      })),
      intake: intakesRes.data?.[0] || null
    };

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable (missing API key).' });
    }

    // 4. Generate AI Brief
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `You are an expert teaching assistant in the Watazawwado educational platform.
Your task is to provide a brief, structured lesson preparation guide for the teacher based on the provided student context.

Student Context:
${JSON.stringify(context, null, 2)}

Guidelines:
- This is strictly advisory (human-in-the-loop).
- Provide a short summary of the student's status.
- Suggest 2-3 specific preparation ideas or topics to review.
- Suggest 1-2 engaging questions or activities to start the next lesson.
- If the context is insufficient (e.g., no past lessons), explicitly state that and offer general advice based on the learner type or level.
- DO NOT make auth decisions, assign teachers, discuss pricing/financials, or invent history/abilities.
- Use a calm, professional, and encouraging tone in Arabic.
- Format the output in clear Markdown with headings and bullet points.
- Include this exact label at the very top of your response (in bold): **«ملخص استرشادي مقترح — لا يغني عن تقييم المعلم المباشر»**`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt
    });

    const brief = response.text || 'Unable to generate brief at this time.';

    res.json({ brief });
  } catch (err: any) {
    console.error('[AI Brief Error]', err);
    if (err.status === 503 || err.message?.toLowerCase().includes('timeout') || err.message?.toLowerCase().includes('fetch failed')) {
      return res.status(503).json({ error: 'AI service is currently unavailable. Please try again later.' });
    }
    res.status(500).json({ error: 'Internal Server Error while generating brief.' });
  }
});


// 15C. DASHBOARD: Update student profile fields
app.patch('/api/dashboard/students/:id', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const {
      name,
      email,
      whatsapp,
      learner_type,
      country,
      timezone,
      current_level,
      status,
      notes,
      parent_name,
      parent_email,
      parent_whatsapp,
      gender,
      teacher_gender_preference,
      teacherGenderPreference
    } = req.body;

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Student name cannot be empty.' });
      }
      updates.name = name.trim();
    }

    if (email !== undefined) {
      if (email === null || email === '') {
        updates.email = null;
      } else {
        const trimmedEmail = email.trim().toLowerCase();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(trimmedEmail)) {
          return res.status(400).json({ error: 'Please provide a valid email address.' });
        }
        updates.email = trimmedEmail;
      }
    }

    // Validate parent email if explicitly provided
    let trimmedParentEmail: string | null = null;
    if (parent_email !== undefined && parent_email !== null) {
      if (typeof parent_email === 'string' && parent_email.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(parent_email.trim())) {
          return res.status(400).json({ error: 'Please provide a valid parent/guardian email address.' });
        }
        trimmedParentEmail = parent_email.trim().toLowerCase();
      } else {
        trimmedParentEmail = null;
      }
    }

    let trimmedParentWhatsapp: string | null = null;
    if (parent_whatsapp !== undefined && parent_whatsapp !== null) {
      if (typeof parent_whatsapp === 'string' && parent_whatsapp.trim()) {
        trimmedParentWhatsapp = parent_whatsapp.trim();
      } else {
        trimmedParentWhatsapp = null;
      }
    }

    if (whatsapp !== undefined) {
      updates.whatsapp = whatsapp ? whatsapp.trim() : null;
    }

    if (country !== undefined) {
      updates.country = country ? country.trim() : null;
    }

    if (timezone !== undefined) {
      if (timezone === null || timezone === '') {
        updates.timezone = null;
      } else {
        const trimmedTz = timezone.trim();
        const isValidTz = DateTime.now().setZone(trimmedTz).isValid;
        if (!isValidTz) {
          return res.status(400).json({ error: `Invalid IANA timezone: '${trimmedTz}'. Please supply a standard timezone.` });
        }
        updates.timezone = trimmedTz;
      }
    }

    if (learner_type !== undefined) {
      if (learner_type === null || learner_type === '') {
        updates.learner_type = null;
      } else if (['adult', 'child'].includes(learner_type)) {
        updates.learner_type = learner_type;
      } else {
        return res.status(400).json({ error: "Invalid learner type. Allowed values are 'adult', 'child', or null." });
      }
    }

    if (current_level !== undefined) {
      if (current_level === null || current_level === '') {
        updates.current_level = null;
      } else if (['beginner', 'elementary', 'intermediate', 'advanced'].includes(current_level)) {
        updates.current_level = current_level;
      } else {
        return res.status(400).json({ error: "Invalid level. Allowed: 'beginner', 'elementary', 'intermediate', 'advanced', or null." });
      }
    }

    if (status !== undefined) {
      if (['active', 'paused', 'inactive'].includes(status)) {
        updates.status = status;
      } else {
        return res.status(400).json({ error: "Invalid status. Allowed values are 'active', 'paused', 'inactive'." });
      }
    }

    if (notes !== undefined) {
      updates.notes = notes ? notes.trim() : null;
    }

    if (gender !== undefined) {
      if (['male', 'female', 'undisclosed'].includes(gender)) {
        updates.gender = gender;
      } else {
        return res.status(400).json({ error: "Invalid gender. Allowed: 'male', 'female', 'undisclosed'." });
      }
    }

    const rawTargPref = teacher_gender_preference !== undefined ? teacher_gender_preference : teacherGenderPreference;
    if (rawTargPref !== undefined) {
      if (['no_preference', 'male_teacher', 'female_teacher'].includes(rawTargPref)) {
        updates.teacher_gender_preference = rawTargPref;
      } else {
        return res.status(400).json({ error: "Invalid teacher preference. Allowed: 'no_preference', 'male_teacher', 'female_teacher'." });
      }
    }

    const { data: existingStudent, error: fetchErr } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr) {
      return res.status(500).json({ error: 'Failed to verify student record.' });
    }
    if (!existingStudent) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    // Strict Scope Enforcement: standard Teacher can only update their assigned student
    if (req.teacherUser?.role !== 'super_admin') {
      if (existingStudent.assigned_teacher_id !== req.teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to modify this student.' });
      }
    }

    // Apply updates to students table
    const { data: updatedStudent, error: updateErr } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Student Profile Update Error]', updateErr);
      return res.status(500).json({ error: 'Failed to update student profile.' });
    }

    // Handle parent/guardian update in guardians table if any guardian field is specified
    if (parent_name !== undefined || parent_email !== undefined || parent_whatsapp !== undefined) {
      const trimmedParent = parent_name !== undefined ? (parent_name ? String(parent_name).trim() : '') : undefined;
      const { data: existingGuardian } = await supabase
        .from('guardians')
        .select('*')
        .eq('student_id', id)
        .maybeSingle();

      if (existingGuardian) {
        const finalParentName = trimmedParent !== undefined ? trimmedParent : existingGuardian.parent_name;
        const finalParentEmail = parent_email !== undefined ? trimmedParentEmail : existingGuardian.parent_email;
        const finalParentWhatsapp = parent_whatsapp !== undefined ? trimmedParentWhatsapp : existingGuardian.parent_whatsapp;

        if (!finalParentName && !finalParentEmail && !finalParentWhatsapp) {
          await supabase
            .from('guardians')
            .delete()
            .eq('id', existingGuardian.id);
        } else {
          const guardianUpdates: Record<string, any> = {
            parent_name: finalParentName || 'Parent / Guardian',
            parent_email: finalParentEmail || null,
            parent_whatsapp: finalParentWhatsapp || null
          };

          const { error: gUpdateErr } = await supabase
            .from('guardians')
            .update(guardianUpdates)
            .eq('id', existingGuardian.id);

          if (gUpdateErr) {
            console.error('[Guardians Update Error]', gUpdateErr);
            return res.status(500).json({ error: 'Failed to update guardian contact information.' });
          }
        }
      } else if ((trimmedParent && trimmedParent.length > 0) || trimmedParentEmail || trimmedParentWhatsapp) {
        const guardianInsert: Record<string, any> = {
          student_id: id,
          parent_name: trimmedParent || 'Parent / Guardian',
          parent_email: trimmedParentEmail || null,
          parent_whatsapp: trimmedParentWhatsapp || null,
          relationship_type: 'parent'
        };

        const { error: gInsertErr } = await supabase
          .from('guardians')
          .insert(guardianInsert);

        if (gInsertErr) {
          console.error('[Guardians Insert Error]', gInsertErr);
          return res.status(500).json({ error: 'Failed to save guardian contact information.' });
        }
      }
    }

    res.json({
      success: true,
      message: 'Student profile updated successfully.',
      student: updatedStudent
    });
  } catch (err) {
    console.error('[Dashboard Update Student Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15C-2. DASHBOARD (Super Admin Only): Assign / Reassign Teacher to Student
app.patch('/api/dashboard/admin/students/:id/assign-teacher', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { id } = req.params;
    const { teacher_id } = req.body;

    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not configured.' });
    }

    const { data: student, error: sErr } = await supabase
      .from('students')
      .select('id, name')
      .eq('id', id)
      .maybeSingle();

    if (sErr || !student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    let targetTeacher: any = null;

    if (teacher_id !== null && teacher_id !== undefined && String(teacher_id).trim() !== '' && String(teacher_id).trim() !== 'null') {
      const cleanTeacherId = String(teacher_id).trim();

      targetTeacher = await resolveTeacherMetadata(cleanTeacherId, supabase);

      if (!targetTeacher) {
        return res.status(400).json({ error: 'Invalid teacher: target account is not registered in teacher_accounts.' });
      }

      if (!targetTeacher.is_active) {
        return res.status(400).json({ error: 'Cannot assign student to an inactive teacher account.' });
      }

      if (!['teacher', 'super_admin'].includes(targetTeacher.role)) {
        return res.status(400).json({ error: 'Invalid teacher role.' });
      }
    }

    const newAssignedTeacherId = targetTeacher ? targetTeacher.id : null;

    const { data: updated, error: updateErr } = await supabase
      .from('students')
      .update({
        assigned_teacher_id: newAssignedTeacherId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, assigned_teacher_id')
      .single();

    if (updateErr) {
      console.error('[Assign Teacher Error]', updateErr);
      return res.status(500).json({ error: clientErrorMessage(updateErr, 'Failed to update student teacher assignment.') });
    }

    // The new teacher gets an on-site notice, and the account gets a chat with them.
    if (targetTeacher?.id) {
      waitUntil((async () => {
        try {
          const account = await resolveLearnerAccount(supabase, id);
          if (account.userId) await ensureTeacherThreads(supabase, account.userId, [targetTeacher.id]);
          await notifyUser(supabase, { userId: targetTeacher.id, staff: true }, {
            kind: 'student_assigned',
            title: { en: 'A student was assigned to you', ar: 'اتعيّن ليك طالب' },
            body: { en: `${student.name} is now your student. The chat with them is open.`, ar: `${student.name} بقى من طلابك. المحادثة معاه مفتوحة.` },
            link: '/dashboard/students'
          });
        } catch (err) {
          console.warn('[Assign Teacher] notice failed', err);
        }
      })());
    }

    // Lessons already booked stay with the teacher they were booked with; new bookings use the new teacher.
    const { count: upcomingWithPrevious } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', id)
      .in('status', ['pending', 'confirmed', 'rescheduled'])
      .gt('scheduled_start', new Date().toISOString())
      .or(newAssignedTeacherId ? `teacher_id.is.null,teacher_id.neq.${newAssignedTeacherId}` : 'teacher_id.not.is.null');

    res.json({
      success: true,
      message: upcomingWithPrevious
        ? `Teacher updated. New bookings go to the new teacher. ${upcomingWithPrevious} upcoming lesson(s) are still with the previous teacher: reschedule or cancel them from Bookings if needed.`
        : 'Teacher updated. New bookings go to the new teacher.',
      student_id: updated.id,
      assigned_teacher_id: updated.assigned_teacher_id,
      assigned_teacher: targetTeacher ? {
        id: targetTeacher.id,
        email: targetTeacher.email,
        name: targetTeacher.display_name,
        gender: targetTeacher.gender,
        role: targetTeacher.role
      } : null
    });
  } catch (err) {
    console.error('[Assign Teacher Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15C-3. DASHBOARD (Super Admin Only): Teacher accounts directory with operational metrics
app.get('/api/dashboard/admin/teachers', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not configured.' });
    }

    const { data: accounts, error: accErr } = await supabase
      .from('teacher_accounts')
      .select('*')
      .order('created_at', { ascending: true });

    if (accErr) {
      console.error('[Admin Teachers Error]', accErr);
      return res.status(500).json({ error: 'Failed to load teacher accounts.' });
    }

    const teachersList = accounts || [];
    const nowIso = new Date().toISOString();

    let authUsers: any[] = [];
    try {
      authUsers = await listAllAuthUsers(supabase);
    } catch {}

    const authUserByEmail = new Map<string, string>();
    authUsers.forEach(u => {
      if (u.email) authUserByEmail.set(u.email.toLowerCase().trim(), u.id);
    });

    // Fetch assigned students count and upcoming lessons count per teacher
    const [studentsRes, upcomingBookingsRes, completedBookingsRes] = await Promise.all([
      supabase.from('students').select('id, assigned_teacher_id'),
      supabase.from('bookings').select('id, teacher_id, scheduled_start, status').gte('scheduled_start', nowIso).neq('status', 'cancelled'),
      supabase.from('bookings').select('id, teacher_id, status').eq('status', 'completed')
    ]);

    const assignedCountByTeacher = new Map<string, number>();
    (studentsRes.data || []).forEach(s => {
      if (s.assigned_teacher_id) {
        const key = s.assigned_teacher_id.toLowerCase().trim();
        assignedCountByTeacher.set(key, (assignedCountByTeacher.get(key) || 0) + 1);
      }
    });

    const upcomingCountByTeacher = new Map<string, number>();
    (upcomingBookingsRes.data || []).forEach(b => {
      if (b.teacher_id) {
        const key = b.teacher_id.toLowerCase().trim();
        upcomingCountByTeacher.set(key, (upcomingCountByTeacher.get(key) || 0) + 1);
      }
    });

    const completedCountByTeacher = new Map<string, number>();
    (completedBookingsRes.data || []).forEach(b => {
      if (b.teacher_id) {
        const key = b.teacher_id.toLowerCase().trim();
        completedCountByTeacher.set(key, (completedCountByTeacher.get(key) || 0) + 1);
      }
    });

    const enriched = teachersList.map(t => {
      const emailLower = t.email.toLowerCase().trim();
      const authId = authUserByEmail.get(emailLower) || null;
      const countKey = authId ? authId.toLowerCase() : emailLower;

      return {
        id: authId,
        email: t.email,
        display_name: t.display_name || (t.role === 'super_admin' ? 'Super admin' : 'Teacher'),
        role: t.role,
        is_active: t.is_active ?? true,
        gender: t.gender || 'male',
        assigned_students_count: (assignedCountByTeacher.get(countKey) || 0) + (assignedCountByTeacher.get(emailLower) || 0),
        upcoming_lessons_count: (upcomingCountByTeacher.get(countKey) || 0) + (upcomingCountByTeacher.get(emailLower) || 0),
        completed_lessons_count: (completedCountByTeacher.get(countKey) || 0) + (completedCountByTeacher.get(emailLower) || 0),
        agreement_accepted_at: t.agreement_version === TEACHER_AGREEMENT_VERSION ? t.agreement_accepted_at : null,
        created_at: t.created_at
      };
    });

    res.json({ teachers: enriched });
  } catch (err) {
    console.error('[Admin Teachers Handler Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15C-4. DASHBOARD (Super Admin Only): Toggle active status of teacher account
app.patch('/api/dashboard/admin/teachers/:email/toggle-active', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { email } = req.params;
    const { is_active } = req.body;

    if (typeof is_active !== 'boolean') {
      return res.status(400).json({ error: 'Invalid is_active boolean value.' });
    }

    // Express already URL-decodes route params; normalize the same way teacher_accounts stores emails.
    const targetEmail = String(email).trim().toLowerCase();

    // Super admin accounts can't be deactivated from the dashboard (prevents locking everyone out).
    if (!is_active) {
      const { data: target } = await supabase.from('teacher_accounts').select('role').ilike('email', escapeLike(targetEmail)).maybeSingle();
      if (target?.role === 'super_admin') {
        return res.status(403).json({ error: 'Super Admin accounts cannot be deactivated.' });
      }
    }

    const { data: updated, error: updateErr } = await supabase
      .from('teacher_accounts')
      .update({ is_active, updated_at: new Date().toISOString() })
      .ilike('email', escapeLike(targetEmail))
      .select()
      .single();

    if (updateErr) {
      console.error('[Toggle Teacher Active Error]', updateErr);
      return res.status(500).json({ error: 'Failed to update teacher account status.' });
    }

    res.json({
      success: true,
      message: `Teacher ${email} status updated to ${is_active ? 'active' : 'inactive'}.`,
      teacher: updated
    });
  } catch (err) {
    console.error('[Toggle Teacher Active Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15D. DASHBOARD: Student Private Notes CRUD
app.get('/api/dashboard/students/:id/notes', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    // Scope check: standard Teacher can only access notes for their assigned students
    if (req.teacherUser?.role !== 'super_admin') {
      const { data: st } = await supabase.from('students').select('assigned_teacher_id').eq('id', id).maybeSingle();
      if (!st || st.assigned_teacher_id !== req.teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to view notes for this student.' });
      }
    }

    const { data, error } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('student_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[Student Notes Fetch Error]', error);
      return res.status(500).json({ error: 'Failed to load notes.' });
    }

    const notes = (data || []).map(n => ({
      id: n.id,
      student_id: n.student_id,
      session_id: n.session_id || null,
      content: n.private_notes,
      observations: n.observations || null,
      next_steps: n.next_steps || null,
      family_summary: n.family_summary || null,
      achievements: n.achievements ?? null,
      created_at: n.created_at,
      updated_at: n.updated_at
    }));

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/dashboard/students/:id/notes', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { content, observations, next_steps } = req.body;

    const familyCheck = validateFamilyNoteFields(req.body);
    if (familyCheck.ok === false) {
      return res.status(400).json({ error: familyCheck.error });
    }

    const hasPrivateContent = typeof content === 'string' && content.trim().length > 0;
    const hasFamilySummary =
      typeof familyCheck.value.family_summary === 'string' &&
      familyCheck.value.family_summary.trim().length > 0;
    const hasAchievements = Array.isArray(familyCheck.value.achievements)
      ? familyCheck.value.achievements.length > 0
      : Boolean(familyCheck.value.achievements);

    if (!hasPrivateContent && !hasFamilySummary && !hasAchievements) {
      return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    const rawBookingId =
      typeof req.body?.booking_id === 'string'
        ? req.body.booking_id
        : typeof req.body?.bookingId === 'string'
          ? req.body.bookingId
          : null;

    // Verify student exists and check authorization (including lesson/session ownership if provided)
    const access = await canTeacherWriteForLesson(supabase, req.teacherUser, {
      studentId: id,
      bookingId: rawBookingId,
      sessionId: familyCheck.value.session_id ?? null,
    });

    if (!access.exists) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    if (!access.allowed) {
      return res.status(403).json({
        error: access.reason || 'Forbidden: You do not have authorization to add notes for this student.',
      });
    }

    const insertRow: Record<string, any> = {
      student_id: id,
      private_notes: hasPrivateContent ? content.trim() : '',
      observations: observations && typeof observations === 'string' ? observations.trim() : null,
      next_steps: next_steps && typeof next_steps === 'string' ? next_steps.trim() : null
    };
    if (familyCheck.value.family_summary !== undefined) {
      insertRow.family_summary = familyCheck.value.family_summary;
    }
    if (familyCheck.value.achievements !== undefined) {
      insertRow.achievements = familyCheck.value.achievements;
    }
    if (access.resolvedSessionId || familyCheck.value.session_id !== undefined) {
      insertRow.session_id = access.resolvedSessionId ?? familyCheck.value.session_id ?? null;
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('lesson_notes')
      .insert(insertRow)
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error('[Student Note Creation Error]', insertErr);
      return res.status(500).json({ error: 'Failed to create student note.' });
    }

    res.status(201).json({
      success: true,
      message: 'Private note saved.',
      note: {
        id: inserted.id,
        student_id: inserted.student_id,
        session_id: inserted.session_id || null,
        content: inserted.private_notes,
        observations: inserted.observations,
        next_steps: inserted.next_steps,
        family_summary: inserted.family_summary || null,
        achievements: inserted.achievements ?? null,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/dashboard/students/:id/notes/:noteId', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id, noteId } = req.params;
    const { content, observations, next_steps } = req.body;

    const familyCheck = validateFamilyNoteFields(req.body);
    if (familyCheck.ok === false) {
      return res.status(400).json({ error: familyCheck.error });
    }

    if (req.teacherUser?.role !== 'super_admin') {
      const { data: student } = await supabase.from('students').select('assigned_teacher_id').eq('id', id).maybeSingle();
      if (!student || student.assigned_teacher_id !== req.teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to modify notes for this student.' });
      }
    }

    const { data: existing, error: findErr } = await supabase
      .from('lesson_notes')
      .select('*')
      .eq('id', noteId)
      .eq('student_id', id)
      .maybeSingle();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Note not found or does not belong to this student.' });
    }

    const updates: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (content !== undefined) {
      if (typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({ error: 'Note content cannot be empty.' });
      }
      updates.private_notes = content.trim();
    }

    if (observations !== undefined) {
      updates.observations = observations && typeof observations === 'string' ? observations.trim() : null;
    }

    if (next_steps !== undefined) {
      updates.next_steps = next_steps && typeof next_steps === 'string' ? next_steps.trim() : null;
    }

    if (familyCheck.value.family_summary !== undefined) {
      updates.family_summary = familyCheck.value.family_summary;
    }

    if (familyCheck.value.achievements !== undefined) {
      updates.achievements = familyCheck.value.achievements;
    }

    if (familyCheck.value.session_id !== undefined) {
      updates.session_id = familyCheck.value.session_id;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('lesson_notes')
      .update(updates)
      .eq('id', noteId)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error('[Student Note Update Error]', updateErr);
      return res.status(500).json({ error: 'Failed to update note.' });
    }

    res.json({
      success: true,
      message: 'Note updated.',
      note: {
        id: updated.id,
        student_id: updated.student_id,
        session_id: updated.session_id || null,
        content: updated.private_notes,
        observations: updated.observations,
        next_steps: updated.next_steps,
        family_summary: updated.family_summary || null,
        achievements: updated.achievements ?? null,
        created_at: updated.created_at,
        updated_at: updated.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/api/dashboard/students/:id/notes/:noteId', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id, noteId } = req.params;

    if ((req as any).teacherUser?.role !== 'super_admin') {
      const { data: student } = await supabase.from('students').select('assigned_teacher_id').eq('id', id).maybeSingle();
      if (!student || student.assigned_teacher_id !== (req as any).teacherUser?.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to modify notes for this student.' });
      }
    }

    const { data: existing, error: findErr } = await supabase
      .from('lesson_notes')
      .select('id')
      .eq('id', noteId)
      .eq('student_id', id)
      .maybeSingle();

    if (findErr || !existing) {
      return res.status(404).json({ error: 'Note not found or does not belong to this student.' });
    }

    const { error: deleteErr } = await supabase
      .from('lesson_notes')
      .delete()
      .eq('id', noteId);

    if (deleteErr) {
      console.error('[Student Note Delete Error]', deleteErr);
      return res.status(500).json({ error: 'Failed to delete note.' });
    }

    res.json({ success: true, message: 'Note deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16. DASHBOARD: Helper to reconcile booking payments truthfully
function reconcileBookingPayments(
  booking: any,
  payments: any[],
  service?: any
): {
  payment_status: 'free_trial' | 'paid' | 'partially_paid' | 'pending_review' | 'payment_rejected' | 'unpaid';
  expected_amount: number | null;
  confirmed_amount: number;
  currency: string | null;
  payments: any[];
} {
  // Expected amount determination - Never invent arbitrary amounts
  let expectedAmount: number | null = null;
  if (booking.booking_type === 'trial') {
    expectedAmount = 0;
  } else if (booking.fee_amount_usd !== null && booking.fee_amount_usd !== undefined && !isNaN(Number(booking.fee_amount_usd))) {
    expectedAmount = Number(booking.fee_amount_usd);
  } else if (service?.hourly_rate_usd !== undefined && service?.hourly_rate_usd !== null && !isNaN(Number(service.hourly_rate_usd))) {
    const hourly = Number(service.hourly_rate_usd);
    const duration = Number(booking.duration_minutes) || 60;
    expectedAmount = Number(((hourly * duration) / 60).toFixed(2));
  } else {
    expectedAmount = null; // Stays null ("Not set")
  }

  // Filter payments linked to this booking ONLY via explicit booking_id (No auto-matching by student_id)
  const bPayments = payments.filter(p => p.booking_id === booking.id);

  // Confirmed sum
  const confirmedPayments = bPayments.filter(p => p.status === 'confirmed');
  const confirmedAmount = confirmedPayments.reduce((acc, p) => acc + Number(p.amount || 0), 0);

  // Pending payments
  const pendingPayments = bPayments.filter(p => p.status === 'pending');

  // Rejected payments
  const rejectedPayments = bPayments.filter(p => p.status === 'rejected' || (p.notes && p.notes.includes('[REJECTED')));

  // Currency: Explicit from linked payment, booking currency, or configured fee schema
  let currency: string | null = bPayments[0]?.currency || booking.currency || null;
  if (!currency && (booking.fee_amount_usd !== null && booking.fee_amount_usd !== undefined || service?.hourly_rate_usd !== undefined)) {
    currency = 'USD'; // Legitimately comes from configured fee_amount_usd / hourly_rate_usd schema
  }

  // Status computation
  let paymentStatus: 'free_trial' | 'paid' | 'partially_paid' | 'pending_review' | 'payment_rejected' | 'unpaid' = 'unpaid';
  if (booking.booking_type === 'trial' || expectedAmount === 0) {
    paymentStatus = 'free_trial';
  } else if (expectedAmount !== null && expectedAmount > 0 && confirmedAmount >= expectedAmount) {
    paymentStatus = 'paid';
  } else if (expectedAmount !== null && confirmedAmount > 0 && confirmedAmount < expectedAmount) {
    paymentStatus = 'partially_paid';
  } else if (confirmedAmount > 0 && expectedAmount === null) {
    paymentStatus = 'paid';
  } else if (pendingPayments.length > 0) {
    paymentStatus = 'pending_review';
  } else if (rejectedPayments.length > 0 && confirmedAmount === 0) {
    paymentStatus = 'payment_rejected';
  } else {
    paymentStatus = 'unpaid';
  }

  return {
    payment_status: paymentStatus,
    expected_amount: expectedAmount,
    confirmed_amount: Number(confirmedAmount.toFixed(2)),
    currency,
    payments: bPayments
  };
}

// 16. DASHBOARD: Fetch bookings with search, filters, truthful pagination, and payment reconciliation
app.get('/api/dashboard/bookings', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const {
      status,
      service,
      type,
      payment_status,
      date_range,
      search,
      page = '1',
      limit = '100'
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 100));
    const offset = (pageNum - 1) * limitNum;
    const nowIso = new Date().toISOString();

    // Base query helper
    const buildBaseQuery = () => {
      let q = supabase.from('bookings').select('*', { count: 'exact' });

      // Status filter
      if (status && status !== 'all') {
        q = q.eq('status', status as string);
      }

      // Service filter
      if (service && service !== 'all') {
        q = q.eq('service_id', service as string);
      }

      // Booking type filter
      if (type && type !== 'all') {
        q = q.eq('booking_type', type as string);
      }

      // Date range filter
      if (date_range === 'upcoming') {
        q = q.gte('scheduled_start', nowIso).neq('status', 'cancelled');
      } else if (date_range === 'past') {
        q = q.lt('scheduled_start', nowIso);
      } else if (date_range === 'today') {
        const startOfDay = DateTime.now().setZone('Africa/Cairo').startOf('day').toUTC().toISO();
        const endOfDay = DateTime.now().setZone('Africa/Cairo').endOf('day').toUTC().toISO();
        if (startOfDay && endOfDay) {
          q = q.gte('scheduled_start', startOfDay).lte('scheduled_start', endOfDay);
        }
      }

      // Search filter (name, email, parent, reference_code)
      if (search && typeof search === 'string' && search.trim()) {
        const cleanSearch = search.trim();
        const pattern = pgrstValue(`%${escapeLike(cleanSearch)}%`);
        q = q.or(`contact_name.ilike.${pattern},contact_email.ilike.${pattern},reference_code.ilike.${pattern},parent_name.ilike.${pattern}`);
      }

      // Teacher scope enforcement
      if ((req as any).teacherUser?.role !== 'super_admin') {
        q = q.eq('teacher_id', (req as any).teacherUser.id);
      }

      // Order by scheduled_start descending
      return q.order('scheduled_start', { ascending: false });
    };

    const isSuperAdmin = (req as any).teacherUser?.role === 'super_admin';
    const tId = (req as any).teacherUser?.id;

    const baseCountQuery = () => {
      let q = supabase.from('bookings').select('*', { count: 'exact', head: true });
      if (!isSuperAdmin) q = q.eq('teacher_id', tId);
      return q;
    };

    // Parallel fetch services & operational summary counts
    const [servicesRes, summaryCountsRes] = await Promise.all([
      supabase.from('services').select('id, title, arabic_title, hourly_rate_usd'),
      Promise.all([
        baseCountQuery(),
        baseCountQuery().gte('scheduled_start', nowIso).neq('status', 'cancelled'),
        isSuperAdmin ? supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
        baseCountQuery().eq('status', 'completed'),
        isSuperAdmin ? supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').gte('confirmed_at', DateTime.now().minus({ days: 7 }).toISO() || '') : Promise.resolve({ count: 0 })
      ])
    ]);

    const serviceMap = new Map((servicesRes.data || []).map(s => [s.id, s]));

    // Global calculation of unpaid_upcoming_count across the ENTIRE upcoming dataset
    let unpaidUpcomingCount = 0;
    try {
      if (isSuperAdmin) {
        const { data: upcomingRegular } = await supabase
          .from('bookings')
          .select('id, fee_amount_usd, service_id, duration_minutes')
          .gte('scheduled_start', nowIso)
          .neq('status', 'cancelled')
          .eq('booking_type', 'regular');

        if (upcomingRegular && upcomingRegular.length > 0) {
          const upIds = upcomingRegular.map(b => b.id);
          const { data: upPayments } = await supabase
            .from('payments')
            .select('booking_id, amount, status')
            .in('booking_id', upIds);

          const confirmedPaymentsByBooking = new Map<string, number>();
          (upPayments || []).forEach(p => {
            if (p.booking_id && p.status === 'confirmed') {
              confirmedPaymentsByBooking.set(
                p.booking_id,
                (confirmedPaymentsByBooking.get(p.booking_id) || 0) + Number(p.amount || 0)
              );
            }
          });

          for (const ub of upcomingRegular) {
            let expAmt: number | null = null;
            if (ub.fee_amount_usd !== null && ub.fee_amount_usd !== undefined && !isNaN(Number(ub.fee_amount_usd))) {
              expAmt = Number(ub.fee_amount_usd);
            } else {
              const s = serviceMap.get(ub.service_id);
              if (s?.hourly_rate_usd !== undefined && s?.hourly_rate_usd !== null && !isNaN(Number(s.hourly_rate_usd))) {
                const dur = Number(ub.duration_minutes) || 60;
                expAmt = Number(((Number(s.hourly_rate_usd) * dur) / 60).toFixed(2));
              }
            }
            const confAmt = confirmedPaymentsByBooking.get(ub.id) || 0;
            const isFullyPaid = expAmt !== null && expAmt > 0 ? confAmt >= expAmt : (confAmt > 0);
            if (!isFullyPaid) {
              unpaidUpcomingCount++;
            }
          }
        }
      }
    } catch (countErr) {
      console.error('[Error calculating unpaid_upcoming_count]', countErr);
    }

    let finalBookings: any[] = [];
    let totalCount = 0;

    // Truthful payment_status filtering + pagination
    const isPaymentStatusFiltered = payment_status && payment_status !== 'all';

    if (isPaymentStatusFiltered) {
      // 2-Step Server-Side Query: fetch candidates matching base query, reconcile all, and paginate truthfully
      const { data: candidateData, error: candidateErr } = await buildBaseQuery();
      if (candidateErr) {
        console.error('[Dashboard Bookings Candidate Error]', candidateErr);
        return res.status(500).json({ error: 'Failed to load bookings.' });
      }

      const candidateBookings = candidateData || [];
      const candidateIds = candidateBookings.map(b => b.id);

      const { data: candidatePayments } = candidateIds.length > 0
        ? await supabase.from('payments').select('*').in('booking_id', candidateIds)
        : { data: [] };

      const paymentsList = candidatePayments || [];

      // Reconcile and filter
      const reconciledCandidates = candidateBookings.map(b => {
        const srv = serviceMap.get(b.service_id);
        const reconciliation = reconcileBookingPayments(b, paymentsList, srv);
        return {
          id: b.id,
          reference_code: b.reference_code,
          student_id: b.student_id,
          lead_id: b.lead_id,
          contact_name: b.contact_name,
          contact_email: b.contact_email,
          contact_whatsapp: b.contact_whatsapp,
          parent_name: b.parent_name,
          service_id: b.service_id,
          service_name: srv?.title || (b.service_id ? b.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Teaching Session'),
          service_arabic_title: srv?.arabic_title || null,
          booking_type: b.booking_type,
          duration_minutes: b.duration_minutes,
          scheduled_start: b.scheduled_start,
          scheduled_end: b.scheduled_end,
          student_timezone: b.student_timezone,
          cairo_time_display: b.cairo_time_display,
          status: b.status,
          cancellation_reason: b.cancellation_reason,
          notes: b.notes,
          fee_amount_usd: reconciliation.expected_amount,
          zoom_meeting_link: b.zoom_host_url || b.zoom_join_url || b.zoom_meeting_link || null,
          zoom_host_url: b.zoom_host_url || null,
          zoom_join_url: b.zoom_join_url || null,
          google_calendar_event_id: b.google_calendar_event_id || null,
          integration_status: b.integration_status || 'pending',
          created_at: b.created_at,
          updated_at: b.updated_at,
          payment_status: reconciliation.payment_status,
          expected_amount: reconciliation.expected_amount,
          confirmed_amount: reconciliation.confirmed_amount,
          currency: reconciliation.currency,
          payments: reconciliation.payments
        };
      });

      const matchingBookings = reconciledCandidates.filter(b => b.payment_status === payment_status);
      totalCount = matchingBookings.length;
      finalBookings = matchingBookings.slice(offset, offset + limitNum);
    } else {
      // Standard database pagination
      const query = buildBaseQuery().range(offset, offset + limitNum - 1);
      const { data: bookingsData, error: bookingsError, count } = await query;

      if (bookingsError) {
        console.error('[Dashboard Bookings Error]', bookingsError);
        return res.status(500).json({ error: 'Failed to load bookings.' });
      }

      const bookings = bookingsData || [];
      const bookingIds = bookings.map(b => b.id);
      totalCount = count || 0;

      const { data: pagePayments } = bookingIds.length > 0
        ? await supabase.from('payments').select('*').in('booking_id', bookingIds)
        : { data: [] };

      const paymentsList = pagePayments || [];

      finalBookings = bookings.map(b => {
        const srv = serviceMap.get(b.service_id);
        const reconciliation = reconcileBookingPayments(b, paymentsList, srv);
        return {
          id: b.id,
          reference_code: b.reference_code,
          student_id: b.student_id,
          lead_id: b.lead_id,
          contact_name: b.contact_name,
          contact_email: b.contact_email,
          contact_whatsapp: b.contact_whatsapp,
          parent_name: b.parent_name,
          service_id: b.service_id,
          service_name: srv?.title || (b.service_id ? b.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Teaching Session'),
          service_arabic_title: srv?.arabic_title || null,
          booking_type: b.booking_type,
          duration_minutes: b.duration_minutes,
          scheduled_start: b.scheduled_start,
          scheduled_end: b.scheduled_end,
          student_timezone: b.student_timezone,
          cairo_time_display: b.cairo_time_display,
          status: b.status,
          cancellation_reason: b.cancellation_reason,
          notes: b.notes,
          fee_amount_usd: reconciliation.expected_amount,
          zoom_meeting_link: b.zoom_host_url || b.zoom_join_url || b.zoom_meeting_link || null,
          zoom_host_url: b.zoom_host_url || null,
          zoom_join_url: b.zoom_join_url || null,
          google_calendar_event_id: b.google_calendar_event_id || null,
          integration_status: b.integration_status || 'pending',
          created_at: b.created_at,
          updated_at: b.updated_at,
          payment_status: reconciliation.payment_status,
          expected_amount: reconciliation.expected_amount,
          confirmed_amount: reconciliation.confirmed_amount,
          currency: reconciliation.currency,
          payments: reconciliation.payments
        };
      });
    }

    const [totalBookingsRes, upcomingBookingsRes, pendingPaymentsRes, completedBookingsRes, recentConfirmedRes] = summaryCountsRes;

    res.json({
      bookings: finalBookings,
      total: totalCount,
      page: pageNum,
      limit: limitNum,
      summary: {
        total_bookings: totalBookingsRes.count || 0,
        upcoming_count: upcomingBookingsRes.count || 0,
        unpaid_upcoming_count: unpaidUpcomingCount,
        pending_payments_count: pendingPaymentsRes.count || 0,
        recently_confirmed_count: recentConfirmedRes.count || 0,
        completed_count: completedBookingsRes.count || 0
      }
    });
  } catch (err) {
    console.error('[Dashboard Bookings Handler Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16b. DASHBOARD: Fetch single booking details with student, lead, and payment history
app.get('/api/dashboard/bookings/:id', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (bErr) {
      console.error('[Get Booking Detail Error]', bErr);
      return res.status(500).json({ error: 'Failed to retrieve booking.' });
    }

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // Teacher visibility enforcement
    if ((req as any).teacherUser?.role !== 'super_admin') {
      if (booking.teacher_id !== (req as any).teacherUser.id) {
        return res.status(403).json({ error: 'Forbidden: You do not have authorization to view this booking.' });
      }
    }

    // Fetch related records in parallel
    const [studentRes, leadRes, paymentsRes, serviceRes, sessionRes] = await Promise.all([
      booking.student_id ? supabase.from('students').select('id, name, email, whatsapp, timezone, current_level, status').eq('id', booking.student_id).maybeSingle() : Promise.resolve({ data: null }),
      booking.lead_id ? supabase.from('leads').select('id, name, email, whatsapp, status').eq('id', booking.lead_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('payments').select('*').eq('booking_id', booking.id).order('created_at', { ascending: false }),
      booking.service_id ? supabase.from('services').select('id, title, arabic_title, hourly_rate_usd').eq('id', booking.service_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from('lesson_sessions').select('id, attendance, completion_status, covered_material, next_action').eq('booking_id', booking.id).maybeSingle()
    ]);

    const service = serviceRes.data;
    const payments = paymentsRes.data || [];
    const reconciliation = reconcileBookingPayments(booking, payments, service);

    res.json({
      booking: {
        ...booking,
        service_name: service?.title || (booking.service_id ? booking.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Teaching Session'),
        service_arabic_title: service?.arabic_title || null,
        payment_status: reconciliation.payment_status,
        expected_amount: reconciliation.expected_amount,
        confirmed_amount: reconciliation.confirmed_amount,
        currency: reconciliation.currency,
        payments: reconciliation.payments,
        student: studentRes.data || null,
        lead: leadRes.data || null,
        lesson_session: sessionRes.data || null
      }
    });
  } catch (err) {
    console.error('[Dashboard Booking Detail Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Shared validation logic for teacher booking transitions
export function validateTeacherLifecycleTransition(
  existingBooking: any,
  newStatus: string | undefined,
  teacherUserId: string | undefined,
  nowUtcIso: string,
  isSuperAdmin = false
): {
  valid: boolean;
  statusCode?: number;
  error?: string;
  isIdempotent?: boolean;
  message?: string
} {
  // 1. Authorization check (unassigned bookings are super-admin only)
  if (!isSuperAdmin && existingBooking.teacher_id !== teacherUserId) {
    return { valid: false, statusCode: 403, error: 'Not authorized to manage this booking.' };
  }

  if (!newStatus || newStatus === existingBooking.status) {
    if (!newStatus) return { valid: true };
  }

  // 2. Cancellation check
  if (newStatus !== 'cancelled' && existingBooking.status === 'cancelled') {
    return { valid: false, statusCode: 400, error: 'Cannot change status of a cancelled booking.' };
  }

  // 3. Status validity
  const validTransitions = ['completed', 'no_show', 'cancelled'];
  if (!validTransitions.includes(newStatus) && newStatus !== existingBooking.status) {
    return { valid: false, statusCode: 400, error: `Invalid status transition: ${newStatus}` };
  }

  const nowUtc = DateTime.fromISO(nowUtcIso);
  const startDt = existingBooking.scheduled_start ? DateTime.fromISO(existingBooking.scheduled_start) : null;

  // 4. Completed transitions
  if (newStatus === 'completed') {
    if (existingBooking.status === 'completed') {
      return { valid: true, isIdempotent: true, message: 'Booking already marked as completed.' };
    }
    if (startDt && startDt.isValid && startDt > nowUtc.plus({ minutes: 15 })) {
      return { valid: false, statusCode: 400, error: 'Cannot mark a future lesson as completed before its scheduled start time.' };
    }
  }

  // 5. No-show transitions
  if (newStatus === 'no_show') {
    if (existingBooking.status === 'no_show') {
      return { valid: true, isIdempotent: true, message: 'Booking already marked as no-show.' };
    }
    if (startDt && startDt.isValid && startDt > nowUtc) {
      return { valid: false, statusCode: 400, error: 'Cannot mark a future lesson as no-show before its scheduled start time.' };
    }
  }

  return { valid: true };
}

// 16c. DASHBOARD: Update booking (status, notes, cancellation, reschedule)
app.patch('/api/dashboard/bookings/:id', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const {
      status,
      cancellation_reason,
      notes,
      scheduled_start,
      scheduled_end,
      cairo_time_display,
      covered_material
    } = req.body;

    const { data: existingBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingBooking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    const nowUtc = DateTime.now().toUTC();
    const transitionValidation = validateTeacherLifecycleTransition(
      existingBooking,
      status,
      (req as any).teacherUser?.id,
      nowUtc.toISO()!,
      (req as any).teacherUser?.role === 'super_admin'
    );

    if (!transitionValidation.valid) {
      return res.status(transitionValidation.statusCode || 400).json({ error: transitionValidation.error });
    }

    if (transitionValidation.isIdempotent) {
      return res.json({ success: true, booking: existingBooking, message: transitionValidation.message });
    }

    const isAdminActor = (req as any).teacherUser?.role === 'super_admin';
    // RULES.md §1 (2026-10-15): a teacher moves their own lessons, with a reason; only the super admin cancels.
    if (!isAdminActor && status === 'cancelled') {
      return res.status(403).json({ error: 'Teachers can move a lesson but not cancel it. To cancel, please contact the admin.', code: 'ADMIN_ONLY' });
    }
    const rescheduleReason = typeof req.body?.reschedule_reason === 'string' ? req.body.reschedule_reason.trim().slice(0, 500) : '';

    // Moving a lesson that is over or cancelled would revive it (the reschedule RPC sets status='rescheduled').
    if (scheduled_start && ['cancelled', 'completed', 'no_show'].includes(existingBooking.status)) {
      return res.status(400).json({ error: `Cannot reschedule a ${String(existingBooking.status).replace('_', '-')} booking.` });
    }

    // 1. Transactional Cancellation Path
    if (status === 'cancelled') {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('teacher_cancel_booking', {
        p_booking_id: id,
        p_reason: cancellation_reason || 'Cancelled by teacher',
        p_notes: notes || null
      });

      if (rpcErr) {
        console.error('[Teacher Cancel RPC Error]', rpcErr);
        return res.status(500).json({ error: clientErrorMessage(rpcErr, 'Failed to cancel booking.') });
      }

      // Best-effort fast path worker trigger AFTER commit
      processIntegrationJobs().catch(err => console.error('[Teacher Cancel job process error]', err));

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking });
    }

    // 2. Transactional Reschedule Path
    if (scheduled_start) {
      const newStart = DateTime.fromISO(String(scheduled_start), { zone: 'utc' });
      if (!newStart.isValid || newStart <= DateTime.utc()) {
        return res.status(400).json({ error: 'Please choose a new time in the future.' });
      }
      // The end always follows the lesson's own length, never the request.
      const newEnd = newStart.plus({ minutes: Number(existingBooking.duration_minutes) || 60 });
      const oldStart = DateTime.fromISO(existingBooking.scheduled_start);
      if (!isAdminActor) {
        if (rescheduleReason.length < 3) {
          return res.status(400).json({ error: 'Please write the reason for moving the lesson. The student will see it.', code: 'REASON_REQUIRED' });
        }
        if (oldStart <= DateTime.utc()) {
          return res.status(400).json({ error: 'Only upcoming lessons can be moved.' });
        }
        if (!isOnLaterDay(newStart, existingBooking.student_timezone)) {
          return res.status(400).json({ error: 'A lesson can be moved to tomorrow or a later day (student time).', code: 'SAME_DAY' });
        }
        const slot = await validateSlotAvailability(newStart.toISO()!, newEnd.toISO()!, existingBooking.teacher_id || undefined);
        if (slot.isAvailable === false) {
          return res.status(409).json({ error: slot.conflictReason || 'This time is not free. Please choose another one.' });
        }
      }

      const { error: rpcErr } = await supabase.rpc('teacher_reschedule_booking', {
        p_booking_id: id,
        p_new_start: newStart.toISO(),
        p_new_end: newEnd.toISO(),
        p_cairo_time_display: newStart.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a'),
        p_notes: notes || null
      });

      if (rpcErr) {
        if ((rpcErr as any).code === '23P01') return res.status(409).json({ error: 'This time was just taken. Please choose another one.' });
        console.error('[Teacher Reschedule RPC Error]', rpcErr);
        return res.status(500).json({ error: clientErrorMessage(rpcErr, 'Failed to reschedule booking.') });
      }

      // Best-effort fast path worker trigger AFTER commit (moves Zoom/calendar, re-arms reminders, emails the student).
      processIntegrationJobs().catch(err => console.error('[Teacher Reschedule job process error]', err));

      let whatsappUrl: string | null = null;
      if (!isAdminActor) {
        // CRM-08: keep a record of teacher moves for the admin's teacher view (best effort; the move already happened).
        const { error: moveLogErr } = await supabase.from('teacher_lesson_moves').insert({
          booking_id: id,
          teacher_id: (req as any).teacherUser?.id || null,
          old_start: oldStart.toISO(),
          new_start: newStart.toISO(),
          reason: rescheduleReason || null
        });
        if (moveLogErr) console.warn('[Teacher Reschedule] move log failed:', moveLogErr.message);
        const tz = existingBooking.student_timezone || 'UTC';
        const fmt = (d: DateTime) => d.setZone(tz).toFormat('ccc d LLL, HH:mm');
        const teacherName = (req as any).teacherUser?.display_name || 'Teacher';
        const learner = existingBooking.contact_name || 'Student';
        // On-site notice for the admin, and for the student with the teacher's reason.
        await notifySuperAdmins(supabase, {
          kind: 'teacher_rescheduled',
          title: { en: `${teacherName} moved a lesson`, ar: `${teacherName} غيّر ميعاد حصة` },
          body: {
            en: `${learner}: ${fmt(oldStart)} → ${fmt(newStart)} (${tz}). Reason: ${rescheduleReason}`,
            ar: `${learner}: ${fmt(oldStart)} ← ${fmt(newStart)} (${tz}). السبب: ${rescheduleReason}`
          },
          link: '/dashboard/bookings'
        });
        const account = await resolveLearnerAccount(supabase, existingBooking.student_id);
        if (account.userId) {
          await notifyUser(supabase, { userId: account.userId }, {
            kind: 'lesson_moved_by_teacher',
            title: { en: 'Your teacher moved your lesson', ar: 'معلمك غيّر ميعاد حصتك' },
            body: {
              en: `New time: ${fmt(newStart)} (${tz}). ${teacherName}: “${rescheduleReason}”. We are sorry for the change.`,
              ar: `الميعاد الجديد: ${fmt(newStart)} (${tz}). ${teacherName}: «${rescheduleReason}». نعتذر لك عن التغيير.`
            },
            link: '/student/lessons'
          });
        }
        // Less than 3 hours before the lesson: the teacher also tells the admin on WhatsApp.
        if (oldStart.diffNow('hours').hours < 3) {
          const text = `السلام عليكم، أنا ${teacherName}. غيّرت ميعاد حصة ${learner} (رقم الحجز ${existingBooking.reference_code}) قبل أقل من 3 ساعات من موعدها.\nالميعاد القديم: ${fmt(oldStart)}\nالميعاد الجديد: ${fmt(newStart)} (${tz})\nالسبب: ${rescheduleReason}`;
          whatsappUrl = `https://wa.me/${ACADEMY_PHONE_DIGITS}?text=${encodeURIComponent(text)}`;
        }
      }

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking, whatsappUrl });
    }

    // 3. Transactional Outcome Path
    if (status === 'completed' || status === 'no_show') {
      const creditDecision = req.body.no_show_credit_decision === 'used' || req.body.consume_package_credit === true
        ? 'used'
        : 'returned';

      const { data: rpcData, error: rpcErr } = await supabase.rpc('teacher_record_lesson_outcome', {
        p_booking_id: id,
        p_teacher_id: (req as any).teacherUser?.id,
        p_outcome: status,
        p_notes: notes || null,
        p_covered_material: covered_material || null,
        p_no_show_credit_decision: creditDecision
      });

      if (rpcErr) {
        console.error(`[Teacher Record Outcome RPC Error]`, rpcErr);
        const statusCode = rpcErr.code === 'P0002' ? 404 :
                           rpcErr.code === 'P0003' ? 403 :
                           400;
        return res.status(statusCode).json({ error: rpcErr.message || `Failed to record lesson outcome: ${status}` });
      }

      // CRM-04: every attended free trial gets one admin follow-up for the next day.
      if (status === 'completed' && existingBooking.booking_type === 'trial' && existingBooking.student_id) {
        waitUntil(createCrmTask(supabase, {
          accountStudentId: existingBooking.student_id,
          title: `Follow up after the free trial (${existingBooking.reference_code}) · متابعة بعد الحصة التجريبية`,
          dueAt: new Date(Date.now() + 24 * 3_600_000),
          source: 'trial_followup',
          dedupeKey: `trial:${existingBooking.id}`
        }));
      }

      // RN-02: only when a credit was actually used (a no-show with the credit returned changes nothing).
      if (existingBooking.package_entitlement_id && (status === 'completed' || creditDecision === 'used')) {
        waitUntil(notifyLowBalance(supabase, existingBooking.package_entitlement_id));
      }

      return res.json(rpcData);
    }

    // 4. Fallback standard update path (for non-lifecycle updates like notes only)
    if (status && status !== existingBooking.status) {
       // Block arbitrary status updates
       return res.status(400).json({ error: 'Cannot set arbitrary booking status via this endpoint.' });
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    const { data: updatedBooking, error: updateErr } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Update Booking Error]', updateErr);
      return res.status(500).json({ error: 'Failed to update booking notes.' });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    console.error('[Dashboard Update Booking Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16d. DASHBOARD: Fetch all payments with status/unmatched filtering
app.get('/api/dashboard/payments', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ payments: [] });
      }
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { status, unmatched_only, limit = '100' } = req.query;
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string, 10) || 100));

    let query = supabase.from('payments').select('*', { count: 'exact' });

    if (status && status !== 'all') {
      query = query.eq('status', status as string);
    }

    if (unmatched_only === 'true') {
      query = query.is('booking_id', null);
    }

    query = query.order('created_at', { ascending: false }).limit(limitNum);

    const { data: paymentsData, error: paymentsErr, count } = await query;

    if (paymentsErr) {
      console.error('[Dashboard Payments Error]', paymentsErr);
      return res.status(500).json({ error: 'Failed to retrieve payments.' });
    }

    const payments = paymentsData || [];
    const bookingIds = payments.map(p => p.booking_id).filter(Boolean) as string[];
    const studentIds = payments.map(p => p.student_id).filter(Boolean) as string[];

    // Fetch matching bookings and students in batch for display context
    const [bookingsRes, studentsRes] = await Promise.all([
      bookingIds.length > 0
        ? supabase.from('bookings').select('id, reference_code, contact_name, contact_email, service_id, scheduled_start').in('id', bookingIds)
        : Promise.resolve({ data: [] }),
      studentIds.length > 0
        ? supabase.from('students').select('id, name, email').in('id', studentIds)
        : Promise.resolve({ data: [] })
    ]);

    const bookingMap = new Map((bookingsRes.data || []).map(b => [b.id, b]));
    const studentMap = new Map((studentsRes.data || []).map(s => [s.id, s]));

    const enrichedPayments = payments.map(p => {
      const b = p.booking_id ? bookingMap.get(p.booking_id) : null;
      const s = p.student_id ? studentMap.get(p.student_id) : null;
      return {
        ...p,
        booking_reference: b?.reference_code || null,
        contact_name: b?.contact_name || s?.name || null,
        contact_email: b?.contact_email || s?.email || null,
        scheduled_start: b?.scheduled_start || null
      };
    });

    res.json({ payments: enrichedPayments, total: count || 0 });
  } catch (err) {
    console.error('[Dashboard Payments Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16e. DASHBOARD: Record manual payment directly
app.post('/api/dashboard/payments', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const {
      booking_id,
      student_id,
      amount,
      currency,
      payment_method,
      payment_reference,
      status = 'confirmed',
      notes
    } = req.body;

    // Strict validation - Never invent or accept invalid amount
    const parsedAmount = Number(amount);
    if (!parsedAmount || isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
      return res.status(400).json({ error: 'A valid positive payment amount is required.' });
    }

    // Strict currency validation - No silent USD fallback
    let finalCurrency: string | null = null;
    if (currency && typeof currency === 'string' && currency.trim()) {
      const cleanCur = currency.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(cleanCur)) {
        return res.status(400).json({ error: 'Invalid currency code. Please provide a standard 3-letter currency code (e.g. USD, CAD, GBP, EUR).' });
      }
      finalCurrency = cleanCur;
    } else if (!booking_id) {
      return res.status(400).json({ error: 'Currency is required for manual payments without a booking.' });
    }

    const validMethods = ['international_bank_iban', 'ach_routing', 'payoneer', 'stripe', 'wise', 'other'];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${validMethods.join(', ')}` });
    }

    const validStatuses = ['pending', 'confirmed', 'rejected', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    if (!finalCurrency && booking_id) {
      // Check if booking has configured fee
      const { data: b } = await supabase.from('bookings').select('fee_amount_usd, service_id').eq('id', booking_id).maybeSingle();
      if (b?.fee_amount_usd !== null && b?.fee_amount_usd !== undefined) {
        finalCurrency = 'USD';
      }
    }

    if (!finalCurrency) {
      return res.status(400).json({ error: 'A valid 3-letter currency code is required.' });
    }

    let finalStudentId = student_id || null;

    // Auto-link student from booking if booking_id provided
    if (booking_id && !finalStudentId) {
      const { data: b } = await supabase.from('bookings').select('student_id').eq('id', booking_id).maybeSingle();
      if (b?.student_id) {
        finalStudentId = b.student_id;
      }
    }

    const isConfirmed = status === 'confirmed';
    const insertPayload = {
      booking_id: booking_id || null,
      student_id: finalStudentId,
      amount: Number(parsedAmount.toFixed(2)),
      currency: finalCurrency,
      payment_method,
      payment_reference: payment_reference ? String(payment_reference).trim() : null,
      status,
      confirmed_at: isConfirmed ? new Date().toISOString() : null,
      notes: notes ? String(notes).trim() : null
    };

    const { data: newPayment, error: insertErr } = await supabase
      .from('payments')
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) {
      console.error('[Record Payment Error]', insertErr);
      return res.status(500).json({ error: 'Failed to record payment.', code: 'PAYMENT_RECORD_FAILED' });
    }

    res.status(201).json({ success: true, payment: newPayment });
  } catch (err) {
    console.error('[Dashboard Record Payment Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16f. DASHBOARD: Confirm pending payment (Idempotent)
app.post('/api/dashboard/payments/:id/confirm', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    // Use atomic RPC for state transition and downstream effects
    const { data: result, error: rpcErr } = await supabase.rpc('verify_payment_atomic', {
      p_payment_id: id
    });

    if (rpcErr) {
      console.error('[Confirm Payment Error]', rpcErr);
      return res.status(500).json({ error: 'Failed to confirm payment. The booking or package may no longer be awaiting payment.', code: 'PAYMENT_CONFIRM_FAILED' });
    }

    // We still need to fetch the updated payment to trigger notifications
    const { data: updated } = await supabase.from('payments').select('*').eq('id', id).single();
    if (!updated) {
       return res.status(404).json({ error: 'Payment not found.' });
    }

    if (updated.booking_id) {
      await enqueueAndRunBookingSync(supabase, updated.booking_id);
    }

    // Dispatch payment confirmed notification asynchronously
    try {
      let learnerName = 'Student';
      let contactEmail: string | undefined = undefined;
      let contactWhatsapp: string | undefined = undefined;
      let reference = updated.payment_reference || id;
      let serviceName = '1-on-1 Teaching';

      // The payment is already confirmed at this point; nothing below may turn that into an error response.
      if (updated.booking_id) {
        const { data: b } = await supabase
          .from('bookings')
          .select('reference_code, contact_name, contact_email, contact_whatsapp, service_id')
          .eq('id', updated.booking_id)
          .maybeSingle();

        if (b) {
          learnerName = b.contact_name || learnerName;
          contactEmail = b.contact_email;
          contactWhatsapp = b.contact_whatsapp;
          reference = b.reference_code || reference;
          if (b.service_id) {
            const { data: srv } = await supabase.from('services').select('title').eq('id', b.service_id).maybeSingle();
            serviceName = srv?.title || serviceName;
          }
        }
      } else if (updated.student_id) {
        const { data: st } = await supabase
          .from('students')
          .select('name, email, whatsapp')
          .eq('id', updated.student_id)
          .maybeSingle();

        if (st) {
          learnerName = st.name || learnerName;
          contactEmail = st.email;
          contactWhatsapp = st.whatsapp;
        }
      }

      await dispatchNotification({
        eventType: 'PAYMENT_CONFIRMED',
        payment: {
          id: updated.id,
          amount: Number(updated.amount),
          currency: updated.currency || 'USD',
          paymentMethod: updated.payment_method,
          paymentReference: updated.payment_reference,
          notes: updated.notes
        },
        booking: {
          referenceCode: reference,
          serviceName,
          learnerName,
          contactEmail: contactEmail || '',
          contactWhatsapp: contactWhatsapp || null,
          date: '',
          timeDisplay: '',
          timezone: 'Africa/Cairo',
          durationMinutes: 60
        }
      });
    } catch (notifErr) {
      console.error('[Payment Confirmation Notification Error]', notifErr);
    }

    res.json({ success: true, message: 'Payment confirmed successfully.', payment: updated });
  } catch (err) {
    console.error('[Confirm Payment Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16g. DASHBOARD: Reject pending payment (Idempotent and resilient)
app.post('/api/dashboard/payments/:id/reject', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { reason } = req.body;

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (pErr || !payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    if (payment.status === 'rejected') {
      return res.json({
        success: true,
        message: 'Payment is already marked rejected.',
        payment
      });
    }

    // Only unconfirmed claims can be rejected; a confirmed payment has already
    // confirmed the booking / granted credits and needs a refund flow instead.
    if (payment.status !== 'pending') {
      return res.status(409).json({ error: `Only pending payments can be rejected (this one is ${payment.status}).` });
    }

    const rejectionNote = reason ? `[REJECTED: ${String(reason).trim()}]` : '[REJECTED by teacher]';
    const updatedNotes = payment.notes ? `${rejectionNote} ${payment.notes}` : rejectionNote;

    const { data: updated, error: uErr } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')
      .select()
      .single();

    if (uErr) {
      console.error('[Reject Payment Error]', uErr);
      return res.status(500).json({ error: 'Failed to reject payment.', code: 'PAYMENT_REJECT_FAILED' });
    }

    res.json({ success: true, message: 'Payment rejected.', payment: updated });
  } catch (err) {
    console.error('[Reject Payment Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16h. DASHBOARD: Delete payment
app.delete('/api/dashboard/payments/:id', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    // RULES.md §5: confirmed or refunded payments are records of real money and are never deleted.
    const { data: deleted, error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id)
      .in('status', ['pending', 'rejected'])
      .select('id');

    if (error) {
      console.error('[Delete Payment Error]', error);
      return res.status(500).json({ error: 'Failed to delete payment.', code: 'PAYMENT_DELETE_FAILED' });
    }
    if (!deleted || deleted.length === 0) {
      return res.status(409).json({ error: 'Only pending or rejected payments can be deleted. Use "Refund" for confirmed payments.' });
    }

    res.json({ success: true, message: 'Payment removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ====================================================================
// AUTOMATED PAYMENT ENGINE (STRIPE CHECKOUT)
// ====================================================================

/**
 * Fulfills an automated payment atomically and dispatches confirmation notifications.
 */
async function fulfillAutomatedPayment(params: {
  paymentMethod: 'stripe';
  paymentReference: string;
  amount: number;
  currency: string;
  notes?: string;
  targetType: 'booking' | 'package';
  targetId: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const supabaseAdmin = getSupabaseAdminClient();
  if (!supabaseAdmin) {
    throw new Error('Database service unavailable.');
  }

  const cleanReference = String(params.paymentReference).trim();

  // 1. Resolve target booking or package entitlement
  let expectedAmount = 0;
  let expectedCurrency = 'USD';
  let bookingId: string | null = null;
  let entitlementId: string | null = null;
  let studentId: string | null = null;
  let serviceName = 'Educational Service';
  let learnerName = params.customerName || 'Student';
  let contactEmail = params.customerEmail || '';
  let contactWhatsapp: string | null = null;
  let referenceCode = cleanReference;

  let bookingDetailsForNotif: any = null;

  if (params.targetType === 'booking') {
    const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(params.targetId).trim());
    let bQuery = supabaseAdmin
      .from('bookings')
      .select('id, reference_code, student_id, contact_name, contact_email, contact_whatsapp, service_id, fee_amount_usd, status, scheduled_start, duration_minutes, student_timezone, cairo_time_display, zoom_meeting_link');

    if (isTargetUuid) {
      bQuery = bQuery.or(`id.eq.${params.targetId},reference_code.eq.${params.targetId}`);
    } else {
      bQuery = bQuery.eq('reference_code', String(params.targetId).trim());
    }

    const { data: booking, error: bErr } = await bQuery.maybeSingle();

    if (bErr || !booking) {
      console.error('[fulfillAutomatedPayment] booking not found:', bErr, 'targetId:', params.targetId);
      throw new Error(`Booking ${params.targetId} not found.`);
    }

    bookingId = booking.id;
    expectedAmount = Number(booking.fee_amount_usd || 0);
    studentId = booking.student_id;
    learnerName = booking.contact_name || learnerName;
    contactEmail = booking.contact_email || contactEmail;
    contactWhatsapp = booking.contact_whatsapp;
    referenceCode = booking.reference_code;

    // Fetch service title from services table
    if (booking.service_id) {
      const { data: srv } = await supabaseAdmin.from('services').select('title').eq('id', booking.service_id).maybeSingle();
      serviceName = srv?.title || '1-on-1 Lesson';
    } else {
      serviceName = '1-on-1 Lesson';
    }

    bookingDetailsForNotif = booking;
  } else if (params.targetType === 'package') {
    const { data: entitlement } = await supabaseAdmin
      .from('package_entitlements')
      .select('id, learner_student_id, price_paid, currency, package_catalog_id, package_catalog:package_catalog_id(name, price_amount, currency)')
      .eq('id', params.targetId)
      .maybeSingle();

    if (!entitlement) {
      throw new Error(`Package entitlement ${params.targetId} not found.`);
    }

    entitlementId = entitlement.id;
    studentId = entitlement.learner_student_id;
    const cat: any = Array.isArray(entitlement.package_catalog) ? entitlement.package_catalog[0] : entitlement.package_catalog;
    expectedAmount = Number(entitlement.price_paid || cat?.price_amount || 0);
    expectedCurrency = entitlement.currency || cat?.currency || 'USD';
    serviceName = cat?.name || 'Lesson Package';
    referenceCode = entitlement.id;

    if (studentId) {
      const { data: st } = await supabaseAdmin
        .from('students')
        .select('name, email, whatsapp')
        .eq('id', studentId)
        .maybeSingle();
      if (st) {
        learnerName = st.name || learnerName;
        contactEmail = st.email || contactEmail;
        contactWhatsapp = st.whatsapp;
      }
    }
  }

  // 2. Idempotency: the same gateway reference may only ever confirm the same target.
  const { data: existingPayment } = await supabaseAdmin
    .from('payments')
    .select('id, status, booking_id, entitlement_id, notes')
    .eq('payment_reference', cleanReference)
    .maybeSingle();

  if (existingPayment) {
    if (existingPayment.booking_id !== bookingId || existingPayment.entitlement_id !== entitlementId) {
      console.error('[fulfillAutomatedPayment] reference reused for a different target', { cleanReference, bookingId, entitlementId });
      throw new PublicError('This payment reference belongs to a different order.');
    }
    // A wrong-amount payment stays for manual review; a page reload or webhook retry must not confirm it.
    if (existingPayment.status !== 'confirmed' && String(existingPayment.notes || '').startsWith('AMOUNT MISMATCH')) {
      throw new PublicError('Payment amount does not match the order. It has been recorded for manual review.');
    }
    if (existingPayment.status !== 'confirmed') {
      const { error: retryErr } = await supabaseAdmin.rpc('verify_payment_atomic', { p_payment_id: existingPayment.id });
      if (retryErr) {
        console.error('[fulfillAutomatedPayment] verify_payment_atomic failed on retry', retryErr);
        throw new PublicError('Payment received but could not be confirmed automatically. It is pending manual review.');
      }
    }
    return { success: true, paymentId: existingPayment.id, isIdempotent: true };
  }

  // 3. The gateway must have collected exactly the price of this target.
  const paidCents = Math.round(Number(params.amount) * 100);
  const expectedCents = Math.round(expectedAmount * 100);
  const paidCurrency = (params.currency || 'USD').toUpperCase();
  const amountMatches = expectedCents > 0 && paidCents === expectedCents && paidCurrency === expectedCurrency.toUpperCase();

  const { data: newPayment, error: pInsertErr } = await supabaseAdmin
    .from('payments')
    .insert({
      booking_id: bookingId,
      entitlement_id: entitlementId,
      student_id: studentId,
      amount: Number(params.amount),
      currency: paidCurrency,
      payment_method: params.paymentMethod,
      payment_reference: cleanReference,
      status: 'pending',
      notes: amountMatches
        ? (params.notes || `Automated ${params.paymentMethod} verified payment`)
        : `AMOUNT MISMATCH — manual review required. Paid ${paidCurrency} ${Number(params.amount).toFixed(2)}, expected ${expectedCurrency} ${expectedAmount.toFixed(2)}. ${params.notes || ''}`.trim()
    })
    .select('*')
    .single();

  if (pInsertErr || !newPayment) {
    console.error('[Insert Automated Payment Error]', pInsertErr);
    throw new PublicError('Failed to record payment.');
  }

  if (!amountMatches) {
    console.error('[fulfillAutomatedPayment] amount mismatch', { paymentId: newPayment.id, paidCents, expectedCents, paidCurrency, expectedCurrency });
    throw new PublicError('Payment amount does not match the order. It has been recorded for manual review.');
  }

  // 4. Atomic fulfillment via Postgres RPC (confirms booking, activates entitlement, allocates credits).
  // If the RPC refuses (e.g. booking no longer pending), the payment stays pending for manual review —
  // never force the status, or cancelled bookings and expired packages get revived.
  const { error: rpcErr } = await supabaseAdmin.rpc('verify_payment_atomic', {
    p_payment_id: newPayment.id
  });
  if (rpcErr) {
    console.error('[fulfillAutomatedPayment] verify_payment_atomic failed', { paymentId: newPayment.id, rpcErr });
    throw new PublicError('Payment received but could not be confirmed automatically. It is pending manual review.');
  }

  if (bookingId) {
    await enqueueAndRunBookingSync(supabaseAdmin, bookingId);
  }

  // 5. Asynchronously dispatch Brevo confirmation emails (to the student and to the lesson's teacher)
  try {
    // Format in the student's timezone; the server runs in UTC.
    const studentStart = bookingDetailsForNotif?.scheduled_start
      ? DateTime.fromISO(bookingDetailsForNotif.scheduled_start).setZone(bookingDetailsForNotif.student_timezone || 'Africa/Cairo')
      : null;
    const scheduledDateStr = studentStart?.isValid ? studentStart.toFormat('LLL d, yyyy') : '';
    const scheduledTimeStr = studentStart?.isValid ? studentStart.toFormat('hh:mm a') : '';

    // First: dispatch PAYMENT_CONFIRMED
    await dispatchNotification({
      eventType: 'PAYMENT_CONFIRMED',
      payment: {
        id: newPayment.id,
        amount: Number(newPayment.amount),
        currency: newPayment.currency || 'USD',
        paymentMethod: params.paymentMethod,
        paymentReference: cleanReference,
        notes: newPayment.notes
      },
      booking: {
        referenceCode,
        serviceName,
        learnerName,
        contactEmail,
        contactWhatsapp,
        date: scheduledDateStr,
        timeDisplay: scheduledTimeStr,
        timezone: bookingDetailsForNotif?.student_timezone || 'Africa/Cairo',
        durationMinutes: bookingDetailsForNotif?.duration_minutes || 60,
        cairoTimeDisplay: bookingDetailsForNotif?.cairo_time_display
      }
    });

  } catch (notifErr) {
    console.warn('[Notification Dispatch Warning]', notifErr);
  }

  return {
    success: true,
    paymentId: newPayment.id,
    referenceCode,
    bookingId,
    serviceName,
    status: 'confirmed'
  };
}

// 2. Zero-Trust Payment Intent Creation (server authoritative pricing)
app.post('/api/payments/create-intent', rateLimit, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const { gateway, targetType, targetId, successUrl, cancelUrl } = req.body;

    if (gateway !== 'stripe') {
      return res.status(400).json({ error: 'Invalid payment gateway. Must be "stripe".' });
    }

    if (!targetType || !['booking', 'package'].includes(targetType) || !targetId) {
      return res.status(400).json({ error: 'Valid targetType and targetId are required.' });
    }

    let authoritativeAmount = 0;
    let authoritativeCurrency = 'USD';
    let itemTitle = 'Watazawwado Academy Lesson';
    let customerEmail: string | undefined = undefined;

    if (targetType === 'booking') {
      const isTargetUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(targetId).trim());
      let bQuery = supabaseAdmin
        .from('bookings')
        .select('id, reference_code, fee_amount_usd, service_id, contact_email, status, hold_expires_at, payment_plan');

      if (isTargetUuid) {
        bQuery = bQuery.or(`id.eq.${targetId},reference_code.eq.${targetId}`);
      } else {
        bQuery = bQuery.eq('reference_code', String(targetId).trim());
      }

      const { data: booking, error: bErr } = await bQuery.maybeSingle();

      if (bErr || !booking) {
        console.error('[create-intent] booking not found:', bErr, 'targetId:', targetId);
        return res.status(404).json({ error: 'Booking not found.' });
      }

      // Check if an actual completed payment already exists for this booking
      const { data: existingPayment } = await supabaseAdmin
        .from('payments')
        .select('id, status')
        .eq('booking_id', booking.id)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (existingPayment) {
        return res.status(400).json({ error: 'This booking has already been paid and confirmed.' });
      }

      // Only unpaid bookings with a server-computed fee are payable. Trials and
      // package-credit bookings have fee 0 and must never be charged.
      if (booking.status !== 'pending') {
        return res.status(400).json({ error: 'This booking is not awaiting payment.' });
      }
      if (booking.payment_plan === 'pay_now' && booking.hold_expires_at && new Date(booking.hold_expires_at).getTime() <= Date.now()) {
        return res.status(410).json({ error: 'Your reserved time has expired. Please choose a time again.', code: 'HOLD_EXPIRED' });
      }
      authoritativeAmount = Number(booking.fee_amount_usd || 0);
      authoritativeCurrency = 'USD';

      if (booking.service_id) {
        const { data: srv } = await supabaseAdmin.from('services').select('title').eq('id', booking.service_id).maybeSingle();
        itemTitle = `Lesson: ${srv?.title || 'Arabic & Quran'}`;
      } else {
        itemTitle = 'Lesson: Arabic & Quran';
      }

      customerEmail = booking.contact_email;
    } else if (targetType === 'package') {
      // Check if targetId is an existing entitlement
      const { data: entitlement } = await supabaseAdmin
        .from('package_entitlements')
        .select('id, price_paid, currency, status, package_catalog_id, package_catalog:package_catalog_id(name, price_amount, currency)')
        .eq('id', targetId)
        .maybeSingle();

      // Only an existing entitlement awaiting payment can be paid for: payment confirmation
      // activates an entitlement, so charging for a bare catalog id could never be fulfilled.
      if (!entitlement) {
        return res.status(404).json({ error: 'Package not found. Please select the package from your student portal.' });
      }
      if (entitlement.status !== 'pending_payment') {
        return res.status(400).json({ error: 'This package is not awaiting payment.' });
      }
      const cat: any = Array.isArray(entitlement.package_catalog) ? entitlement.package_catalog[0] : entitlement.package_catalog;
      authoritativeAmount = Number(entitlement.price_paid || cat?.price_amount || 0);
      authoritativeCurrency = entitlement.currency || cat?.currency || 'USD';
      itemTitle = cat?.name || 'Lesson Package';
    }

    if (authoritativeAmount <= 0) {
      return res.status(400).json({ error: 'No payment is required for this item.' });
    }

    // Redirects after checkout may only point back at this site.
    const hostOrigin = resolveTrustedAppOrigin(req.headers.origin as string | undefined);
    const sameSiteUrl = (url: unknown) => {
      try {
        return typeof url === 'string' && new URL(url).origin === hostOrigin ? url : undefined;
      } catch {
        return undefined;
      }
    };

    const defaultSuccessUrl = `${hostOrigin}/student/payments?session_id={CHECKOUT_SESSION_ID}&gateway=stripe`;
    const defaultCancelUrl = `${hostOrigin}/student/payments?payment_cancelled=true`;

    const session = await createStripeCheckoutSession({
      amount: authoritativeAmount,
      currency: authoritativeCurrency,
      title: itemTitle,
      customerEmail,
      metadata: {
        targetType,
        targetId: String(targetId)
      },
      successUrl: sameSiteUrl(successUrl) || defaultSuccessUrl,
      cancelUrl: sameSiteUrl(cancelUrl) || defaultCancelUrl
    });

    return res.json({
      success: true,
      gateway: 'stripe',
      sessionId: session.id,
      sessionUrl: session.url,
      amount: authoritativeAmount,
      currency: authoritativeCurrency
    });
  } catch (err: any) {
    console.error('[Create Payment Intent Error]', err);
    return res.status(500).json({ error: clientErrorMessage(err, 'Failed to initialize payment gateway.') });
  }
});

/** Confirms a paid Checkout Session; shared by the return-page verify route and the Stripe webhook. */
async function confirmStripeSession(session: StripeSessionVerification) {
  // The target comes only from the metadata the server wrote when it created the session.
  const targetType = session.metadata?.targetType as 'booking' | 'package' | undefined;
  const targetId = session.metadata?.targetId;
  if ((targetType !== 'booking' && targetType !== 'package') || !targetId) {
    throw new PublicError('This checkout session was not created by this site.');
  }

  const fulfillment = await fulfillAutomatedPayment({
    paymentMethod: 'stripe',
    paymentReference: session.paymentIntent || session.id,
    amount: session.amountTotal || 0,
    currency: session.currency || 'USD',
    notes: `Automated Stripe checkout payment verified (${session.customerEmail || ''})`,
    targetType,
    targetId,
    customerEmail: session.customerEmail,
    customerName: session.customerName
  });
  return { ...fulfillment, targetType, targetId };
}

// 4. Automated Stripe Session Verification (student returns from Stripe)
app.post('/api/payments/stripe/verify', rateLimit, async (req: any, res: any) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required.' });
    }

    const session = await retrieveStripeCheckoutSession(sessionId);

    if (session.paymentStatus !== 'paid') {
      return res.status(400).json({
        error: `Stripe payment not completed. Status: ${session.paymentStatus}`,
        paymentStatus: session.paymentStatus
      });
    }

    const fulfillment = await confirmStripeSession(session);

    return res.json({
      success: true,
      status: 'confirmed',
      paymentId: fulfillment.paymentId,
      isIdempotent: fulfillment.isIdempotent,
      targetType: fulfillment.targetType,
      targetId: fulfillment.targetId
    });
  } catch (err: any) {
    console.error('[Stripe Verify Error]', err);
    return res.status(500).json({ error: clientErrorMessage(err, 'Failed to verify Stripe payment.') });
  }
});

// 5. Stripe webhook: confirms the payment even if the student closes the page after paying.
app.post('/api/payments/stripe/webhook', async (req: any, res: any) => {
  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return res.status(503).json({ error: 'Webhook not configured.' });
  }
  if (!req.rawBody || !isValidStripeWebhookSignature(req.rawBody, req.headers['stripe-signature'], secret)) {
    return res.status(400).json({ error: 'Invalid signature.' });
  }

  const event = req.body;
  await recordHeartbeat(getSupabaseAdminClient(), HEARTBEAT_STRIPE_WEBHOOK, { type: String(event?.type || '') });
  if (event?.type !== 'checkout.session.completed' && event?.type !== 'checkout.session.async_payment_succeeded') {
    return res.json({ received: true });
  }

  try {
    // Re-read the session from Stripe so the amount and status are authoritative.
    const session = await retrieveStripeCheckoutSession(String(event.data?.object?.id || ''));
    if (session.paymentStatus === 'paid') {
      await confirmStripeSession(session);
    }
    return res.json({ received: true });
  } catch (err: any) {
    console.error('[Stripe Webhook Error]', { eventId: event?.id, err });
    // PublicError = recorded for manual review or not ours; a retry would not change it.
    if (err instanceof PublicError) return res.json({ received: true });
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

// ============================================================================
// RULES.md §2 / §5: pay later, refunds, and student self-service changes
// ============================================================================

/** Minimum paid lessons before a student may use "pay later" (RULES.md §5). */
const PAY_LATER_MIN_PAID_LESSONS = 12;

/** Completed, non-trial lessons that were actually paid (confirmed payment or package credit). */
async function countPaidLessons(supabase: any, learnerIds: string[]): Promise<number> {
  if (learnerIds.length === 0) return 0;
  const { data: completed } = await supabase
    .from('bookings')
    .select('id, package_entitlement_id')
    .in('student_id', learnerIds)
    .eq('booking_type', 'regular')
    .eq('status', 'completed');
  const rows: any[] = completed || [];
  const viaPackage = rows.filter(b => b.package_entitlement_id).length;
  const singleIds = rows.filter(b => !b.package_entitlement_id).map(b => b.id);
  if (singleIds.length === 0) return viaPackage;
  const { data: paid } = await supabase
    .from('payments')
    .select('booking_id')
    .in('booking_id', singleIds)
    .eq('status', 'confirmed');
  return viaPackage + new Set((paid || []).map((p: any) => p.booking_id)).size;
}

async function resolveStudentBooking(supabase: any, req: any, bookingId: string) {
  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .maybeSingle();
  if (!booking) return { booking: null, error: { status: 404, message: 'Lesson not found.' } };
  const learners = await getAuthorizedLearnersForStudent(supabase, req);
  if (!learners.some(l => l.id === booking.student_id)) {
    return { booking: null, error: { status: 403, message: 'This lesson does not belong to your account.' } };
  }
  return { booking, error: null };
}

// Student: can this account use "pay later"?
app.get('/api/student/pay-later', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const learners = await getAuthorizedLearnersForStudent(supabase, req);
    const paidLessons = await countPaidLessons(supabase, learners.map(l => l.id));
    res.json({ eligible: paidLessons >= PAY_LATER_MIN_PAID_LESSONS, paidLessons, required: PAY_LATER_MIN_PAID_LESSONS });
  } catch (err) {
    console.error('[GET /api/student/pay-later]', err);
    res.status(500).json({ error: 'Could not check pay-later eligibility.' });
  }
});

// Student: book now, pay later (trusted students only). The booking waits for super-admin approval.
app.post('/api/bookings/:referenceCode/pay-later', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });

    const { data: booking } = await supabase
      .from('bookings')
      .select('id, reference_code, student_id, status, booking_type, payment_plan, package_entitlement_id, fee_amount_usd, scheduled_start, hold_expires_at, contact_name')
      .eq('reference_code', String(req.params.referenceCode || '').trim())
      .maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const learners = await getAuthorizedLearnersForStudent(supabase, req);
    if (!learners.some(l => l.id === booking.student_id)) {
      return res.status(403).json({ error: 'This booking does not belong to your account.' });
    }
    if (booking.status !== 'pending' || booking.booking_type !== 'regular' || booking.package_entitlement_id || booking.payment_plan !== 'pay_now') {
      return res.status(400).json({ error: 'This booking cannot be switched to pay later.' });
    }
    if (booking.hold_expires_at && new Date(booking.hold_expires_at).getTime() <= Date.now()) {
      return res.status(410).json({ error: 'Your reserved time has expired. Please choose a time again.', code: 'HOLD_EXPIRED' });
    }

    const paidLessons = await countPaidLessons(supabase, learners.map(l => l.id));
    if (paidLessons < PAY_LATER_MIN_PAID_LESSONS) {
      return res.status(403).json({ error: `Pay later is available after ${PAY_LATER_MIN_PAID_LESSONS} paid lessons.`, paidLessons });
    }

    const { error: updErr } = await supabase
      .from('bookings')
      .update({ payment_plan: 'pay_later', hold_expires_at: null, updated_at: new Date().toISOString() })
      .eq('id', booking.id)
      .eq('status', 'pending')
      .eq('payment_plan', 'pay_now');
    if (updErr) {
      console.error('[pay-later] update failed', updErr.message);
      return res.status(500).json({ error: 'Could not reserve your lesson. Please try again.' });
    }

    const isAr = req.body?.lang === 'ar';
    const when = DateTime.fromISO(booking.scheduled_start).setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a');
    const text = isAr
      ? `السلام عليكم، حجزت درس (${booking.reference_code}) يوم ${when} بتوقيت القاهرة واخترت "ادفع لاحقاً" بقيمة $${Number(booking.fee_amount_usd).toFixed(2)}. أرجو الموافقة على الحجز.`
      : `Assalamu alaikum! I booked lesson ${booking.reference_code} on ${when} (Cairo time) and chose "pay later" ($${Number(booking.fee_amount_usd).toFixed(2)}). Could you approve my booking, please?`;
    const whatsappUrl = `https://wa.me/${ACADEMY_PHONE_DIGITS}?text=${encodeURIComponent(text)}`;

    res.json({ success: true, status: 'awaiting_approval', whatsappUrl });
  } catch (err) {
    console.error('[POST /api/bookings/:ref/pay-later]', err);
    res.status(500).json({ error: 'Could not reserve your lesson. Please try again.' });
  }
});

// Super admin: pay-later bookings waiting for a decision.
app.get('/api/dashboard/pay-later', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await supabase
      .from('bookings')
      .select('id, reference_code, student_id, contact_name, contact_email, contact_whatsapp, service_id, duration_minutes, scheduled_start, fee_amount_usd, created_at')
      .eq('status', 'pending')
      .eq('payment_plan', 'pay_later')
      .order('scheduled_start', { ascending: true });
    if (error) throw error;
    res.json({ bookings: data || [] });
  } catch (err) {
    console.error('[GET /api/dashboard/pay-later]', err);
    res.status(500).json({ error: 'Could not load pay-later requests.' });
  }
});

// Super admin: approve or reject a pay-later booking.
app.post('/api/dashboard/bookings/:id/pay-later/:decision', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { id, decision } = req.params;
    if (decision !== 'approve' && decision !== 'reject') {
      return res.status(400).json({ error: 'Decision must be approve or reject.' });
    }

    const approve = decision === 'approve';
    const { data: updated, error } = await supabase
      .from('bookings')
      .update({
        status: approve ? 'confirmed' : 'cancelled',
        cancellation_reason: approve ? null : 'Pay-later request declined',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('status', 'pending')
      .eq('payment_plan', 'pay_later')
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!updated) return res.status(409).json({ error: 'This request was already handled.' });

    // Approved: Zoom, calendar, reminders and confirmation email, exactly like a paid booking.
    if (approve) await enqueueAndRunBookingSync(supabase, id);
    res.json({ success: true, status: approve ? 'confirmed' : 'cancelled' });
  } catch (err) {
    console.error('[POST /api/dashboard/bookings/:id/pay-later]', err);
    res.status(500).json({ error: 'Could not update this request.' });
  }
});

// Super admin: refund a confirmed payment (never delete it) — RULES.md §5.
// Super admin: lesson credits whose owners asked for a refund instead (RULES.md §5).
app.get('/api/dashboard/refund-requests', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data, error } = await supabase
      .from('package_entitlements')
      .select('id, learner_student_id, price_paid, currency, metadata, created_at, students:learner_student_id(name, email, whatsapp)')
      .eq('status', 'active')
      .eq('metadata->>source', 'cancellation_credit')
      .not('metadata->>refund_requested_at', 'is', null)
      .order('updated_at', { ascending: true });
    if (error) throw error;
    res.json({
      requests: (data || []).map((c: any) => {
        const st: any = Array.isArray(c.students) ? c.students[0] : c.students;
        return {
          creditId: c.id,
          paymentId: c.metadata?.source_payment_id || null,
          amount: c.price_paid,
          currency: c.currency || 'USD',
          requestedAt: c.metadata?.refund_requested_at,
          learnerName: st?.name || null,
          email: st?.email || null,
          whatsapp: st?.whatsapp || null
        };
      })
    });
  } catch (err) {
    console.error('[GET /api/dashboard/refund-requests]', err);
    res.status(500).json({ error: 'Could not load refund requests.' });
  }
});

/** Tells the student (on the site and by email) that a refund was sent (RULES.md §5: up to 14 days). */
async function notifyRefund(supabase: any, paymentId: string): Promise<void> {
  try {
    const { data: payment } = await supabase.from('payments').select('amount, currency, student_id, booking_id').eq('id', paymentId).maybeSingle();
    if (!payment) return;
    let studentId = payment.student_id;
    let email: string | null = null;
    let name: string | null = null;
    if (payment.booking_id) {
      const { data: b } = await supabase.from('bookings').select('student_id, contact_email, contact_name').eq('id', payment.booking_id).maybeSingle();
      studentId = studentId || b?.student_id;
      email = b?.contact_email || null;
      name = b?.contact_name || null;
    }
    // A child's lessons belong to the parent's account.
    const account = await resolveLearnerAccount(supabase, studentId);
    const userId = account.userId;
    email = account.viaParent ? account.email : (email || account.email);
    name = name || account.name;
    const amount = Number(payment.amount).toFixed(2) + ' ' + String(payment.currency || 'USD').toUpperCase();
    await notifyUser(supabase, { userId, email, name }, {
      kind: 'refund_sent',
      title: { en: 'Your refund is on its way', ar: 'تم إرسال المبلغ المسترد' },
      body: {
        en: 'We have refunded ' + amount + '. It can take up to 14 days to reach your account, depending on your bank or payment method.',
        ar: 'رجّعنالك ' + amount + '. ممكن ياخد لحد 14 يوم لحد ما يوصل حسابك، حسب البنك أو وسيلة الدفع.'
      },
      link: '/student/payments'
    }, { email: true });
  } catch (err) {
    console.warn('[Refund] notify failed', err);
  }
}

app.post('/api/dashboard/payments/:id/refund', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 500) : null;
    const { data, error } = await supabase.rpc('refund_payment_atomic', { p_payment_id: req.params.id, p_reason: reason });
    if (error) {
      console.error('[Refund Payment Error]', error);
      return res.status(400).json({ error: clientErrorMessage(error, 'Could not refund this payment.') });
    }
    // Cancel the Zoom meeting / calendar event of any lesson the refund cancelled.
    try {
      await processIntegrationJobs();
    } catch (jobErr) {
      console.warn('[Refund] integration jobs left for the cron worker', jobErr);
    }
    await notifyRefund(supabase, req.params.id);
    res.json({ success: true, ...((data as any) || {}) });
  } catch (err) {
    console.error('[POST /api/dashboard/payments/:id/refund]', err);
    res.status(500).json({ error: 'Could not refund this payment.' });
  }
});

// Student: reschedule a lesson. Trials: once, at least 1 hour before. Regular: at least 3 hours before.
// RN-04: "same time next week?" after a lesson attended in the last 7 days, when the teacher is free then and nothing
// is booked for the coming week yet. A suggestion only: one tap opens the booking flow with that time; nothing is booked.
app.get('/api/student/next-week-suggestion', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });
    const learners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);
    const requested = typeof req.query?.learnerId === 'string' ? req.query.learnerId.trim() : '';
    if (requested && !learners.some((l) => l.id === requested)) return res.status(403).json({ error: 'This learner is not on your account.' });
    const learnerIds = requested ? [requested] : learners.map((l) => l.id);
    if (!learnerIds.length) return res.json({ suggestion: null });

    const now = DateTime.utc();
    const { data: rows, error } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, service_id, duration_minutes, scheduled_start, student_timezone, status, teacher_id')
      .in('student_id', learnerIds)
      .gte('scheduled_start', now.minus({ days: 7 }).toISO())
      .order('scheduled_start', { ascending: false })
      .limit(50);
    if (error) return res.status(500).json({ error: 'Could not check your lessons.' });

    const last = (rows || []).find((b: any) => b.status === 'completed' && b.teacher_id);
    if (!last) return res.json({ suggestion: null });
    const alreadyBooked = (rows || []).some((b: any) =>
      b.student_id === last.student_id && ['pending', 'confirmed', 'rescheduled'].includes(b.status) &&
      DateTime.fromISO(b.scheduled_start) > now && DateTime.fromISO(b.scheduled_start) < now.plus({ days: 8 })
    );
    if (alreadyBooked) return res.json({ suggestion: null });

    const slot = nextWeekSlot(last.scheduled_start, Number(last.duration_minutes), now, last.student_timezone);
    if (!slot) return res.json({ suggestion: null });
    // The real engine decides, exactly as for any booking.
    const free = await validateSlotAvailability(slot.startIso, slot.endIso, last.teacher_id);
    if (!free.isAvailable) return res.json({ suggestion: null });

    const teacher = await resolveTeacherMetadata(last.teacher_id, supabaseAdmin);
    return res.json({
      suggestion: {
        fromBookingId: last.id,
        learnerId: last.student_id,
        learnerName: learners.find((l) => l.id === last.student_id)?.name || null,
        serviceId: last.service_id,
        durationMinutes: last.duration_minutes,
        utcStartIso: slot.startIso,
        utcEndIso: slot.endIso,
        teacherName: teacher?.display_name || null
      }
    });
  } catch (err) {
    console.error('[GET /api/student/next-week-suggestion]', err);
    return res.status(500).json({ error: 'Could not check your lessons.' });
  }
});

app.post('/api/student/bookings/:id/reschedule', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });

    const { booking, error: ownErr } = await resolveStudentBooking(supabase, req, req.params.id);
    if (ownErr) return res.status(ownErr.status).json({ error: ownErr.message });

    // RULES.md §2: any lesson can be moved up to 1 hour before it starts; a free trial only once.
    const moveBlock = studentRescheduleBlock(booking);
    if (moveBlock) return res.status(moveBlock.status).json({ error: moveBlock.error, ...(moveBlock.code ? { code: moveBlock.code } : {}) });

    const newStart = DateTime.fromISO(String(req.body?.utcStartIso || ''), { zone: 'utc' });
    if (!newStart.isValid || newStart < DateTime.utc().plus({ minutes: 10 })) {
      return res.status(400).json({ error: 'Please choose a new time in the future.' });
    }
    // RULES.md §2: the new time is on a later day than today, never the same day.
    if (!isOnLaterDay(newStart, booking.student_timezone)) {
      return res.status(400).json({ error: 'A lesson can be moved to tomorrow or a later day. Please choose another day.', code: 'SAME_DAY' });
    }
    const newEnd = newStart.plus({ minutes: booking.duration_minutes });

    // shortcut: a new time overlapping this lesson's own old slot may be reported busy; pick another slot.
    const slot = await validateSlotAvailability(newStart.toISO()!, newEnd.toISO()!, booking.teacher_id || undefined);
    if (slot.isAvailable === false) {
      return res.status(409).json({ error: slot.conflictReason || 'This time is no longer available. Please choose another one.' });
    }

    const { data: moved, error: moveErr } = await supabase
      .from('bookings')
      .update({
        scheduled_start: newStart.toISO(),
        scheduled_end: newEnd.toISO(),
        cairo_time_display: newStart.setZone('Africa/Cairo').toFormat('dd LLL yyyy, hh:mm a'),
        status: 'rescheduled',
        reschedule_count: (booking.reschedule_count || 0) + 1,
        reschedule_requested_at: null,
        reschedule_request_note: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', booking.id)
      .eq('reschedule_count', booking.reschedule_count || 0) // a concurrent reschedule loses
      .select('id')
      .maybeSingle();
    if (moveErr) {
      // 23P01: exclusion constraint — someone took the slot in the meantime.
      if ((moveErr as any).code === '23P01') return res.status(409).json({ error: 'This time was just taken. Please choose another one.' });
      console.error('[student reschedule] update failed', moveErr.message);
      return res.status(500).json({ error: 'Could not move your lesson. Please try again.' });
    }
    if (!moved) return res.status(409).json({ error: 'This lesson was just changed. Please refresh and try again.' });

    // The old time's reminders are cancelled; the new time gets its own (RULES.md §2 reminders).
    await rescheduleBookingReminders(booking.id, newStart.toISO()!, booking.reference_code);

    // Move the Zoom meeting and calendar event.
    const { error: jobErr } = await supabase.from('integration_jobs').insert({ booking_id: booking.id, job_type: 'booking_reschedule', status: 'pending' });
    if (jobErr && jobErr.code !== '23505') console.warn('[student reschedule] job enqueue failed:', jobErr.message);
    try {
      await processIntegrationJobs(1, undefined, booking.id);
    } catch (err) {
      console.warn('[student reschedule] integration left for the cron worker', err);
    }

    res.json({ success: true, scheduledStart: newStart.toISO(), rescheduleCount: (booking.reschedule_count || 0) + 1 });
  } catch (err) {
    console.error('[POST /api/student/bookings/:id/reschedule]', err);
    res.status(500).json({ error: 'Could not move your lesson. Please try again.' });
  }
});

// Student cancellation (RULES.md §2/§5): a free trial up to 1 hour before; any other lesson up to 3 hours before.
// A paid single lesson cancelled in time comes back as a lesson credit; a package lesson keeps its credit.
app.post('/api/student/bookings/:id/cancel', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });

    const { booking, error: ownErr } = await resolveStudentBooking(supabase, req, req.params.id);
    if (ownErr) return res.status(ownErr.status).json({ error: ownErr.message });

    const cancelBlock = studentCancelBlock(booking);
    if (cancelBlock) return res.status(cancelBlock.status).json({ error: cancelBlock.error, ...(cancelBlock.code ? { code: cancelBlock.code } : {}) });
    const isTrial = booking.booking_type === 'trial';
    const reason = typeof req.body?.reason === 'string' && req.body.reason.trim() ? req.body.reason.trim().slice(0, 500) : 'Cancelled by student';

    const isPaidSingle = !isTrial && !booking.package_entitlement_id && booking.payment_plan !== 'pay_later';
    if (isPaidSingle) {
      const { data: result, error: rpcErr } = await supabase.rpc('student_cancel_paid_lesson_to_credit', {
        p_booking_id: booking.id,
        p_purchaser_account_id: req.studentUser?.auth_id,
        p_reason: reason
      });
      if (rpcErr) {
        console.error('[student cancel -> credit]', rpcErr.message);
        return res.status(400).json({ error: clientErrorMessage(rpcErr, 'Could not cancel your lesson. Please try again.') });
      }
      try {
        await processIntegrationJobs(1, undefined, booking.id);
      } catch (err) {
        console.warn('[student cancel] integration left for the cron worker', err);
      }
      return res.json({ success: true, creditId: result?.creditId || null });
    }

    const { data: cancelled, error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancellation_reason: reason, updated_at: new Date().toISOString() })
      .eq('id', booking.id)
      .in('status', ['confirmed', 'rescheduled'])
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!cancelled) return res.status(409).json({ error: 'This lesson was just changed. Please refresh.' });

    await supabase.from('reminders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('booking_id', booking.id).eq('status', 'pending');
    const { error: jobErr } = await supabase.from('integration_jobs').insert({ booking_id: booking.id, job_type: 'booking_cancel', status: 'pending' });
    if (jobErr && jobErr.code !== '23505') console.warn('[student cancel] job enqueue failed:', jobErr.message);
    try {
      await processIntegrationJobs(1, undefined, booking.id);
    } catch (err) {
      console.warn('[student cancel] integration left for the cron worker', err);
    }

    res.json({
      success: true,
      // RULES.md §2: a cancelled trial means a 48-hour wait before booking a new one.
      ...(isTrial ? { nextTrialAvailableAt: DateTime.utc().plus({ hours: 48 }).toISO() } : {})
    });
  } catch (err) {
    console.error('[POST /api/student/bookings/:id/cancel]', err);
    res.status(500).json({ error: 'Could not cancel your lesson. Please try again.' });
  }
});

// Student: ask for a refund of an unused lesson credit instead of rebooking (RULES.md §5).
// At most MAX_STUDENT_REFUNDED_LESSONS per account; the owner pays within 14 days and records it with the Refund button.
app.post('/api/student/credits/:id/refund-request', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const authUserId = req.studentUser?.auth_id;

    const { data: credit } = await supabase
      .from('package_entitlements')
      .select('id, purchaser_account_id, learner_student_id, status, used_credits, price_paid, currency, metadata')
      .eq('id', req.params.id)
      .maybeSingle();
    const learners = await getAuthorizedLearnersForStudent(supabase, req);
    const owns = credit && (credit.purchaser_account_id === authUserId || learners.some(l => l.id === credit.learner_student_id));
    if (!credit || !owns || credit.metadata?.source !== 'cancellation_credit') {
      return res.status(404).json({ error: 'Lesson credit not found.' });
    }
    if (credit.status !== 'active' || credit.used_credits > 0) {
      return res.status(400).json({ error: 'This credit was already used or refunded.' });
    }
    const { count: upcoming } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .eq('package_entitlement_id', credit.id)
      .in('status', ['pending', 'confirmed', 'rescheduled']);
    if ((upcoming || 0) > 0) {
      return res.status(400).json({ error: 'This credit is already booked for a lesson. Cancel that lesson first.' });
    }

    const { data: accountCredits } = await supabase
      .from('package_entitlements')
      .select('id, metadata')
      .eq('purchaser_account_id', credit.purchaser_account_id);
    const refundedSoFar = (accountCredits || []).filter((c: any) => c.metadata?.source === 'cancellation_credit' && c.metadata?.refunded === true).length;
    if (refundedSoFar >= MAX_STUDENT_REFUNDED_LESSONS) {
      return res.status(400).json({
        error: `Refunds are limited to ${MAX_STUDENT_REFUNDED_LESSONS} lessons per account, and this account has reached that limit. Your credit stays valid for a future lesson.`,
        code: 'REFUND_LIMIT'
      });
    }

    const { error: updErr } = await supabase
      .from('package_entitlements')
      .update({ metadata: { ...credit.metadata, refund_requested_at: new Date().toISOString() }, updated_at: new Date().toISOString() })
      .eq('id', credit.id);
    if (updErr) console.warn('[refund request] could not record the request:', updErr.message);

    const termsUrl = `${resolveTrustedAppOrigin(req.headers.origin as string | undefined)}/terms#refunds`;
    const amount = `${Number(credit.price_paid).toFixed(2)} ${credit.currency || 'USD'}`;
    const text = [
      'Assalamu alaikum,',
      `I would like a refund for my cancelled lesson instead of a lesson credit (credit ID: ${credit.id}, amount: ${amount}).`,
      'I have read the refund policy and I agree to wait up to 14 days to receive the money.',
      'Account / payment method to receive the refund: ',
      '',
      'السلام عليكم،',
      `أريد استرداد مبلغ حصتي الملغاة بدل رصيد الحصة (رقم الرصيد: ${credit.id}، المبلغ: ${amount}).`,
      'قرأت سياسة الاسترداد وموافق أنتظر لحد 14 يوم لحد ما يوصلني المبلغ.',
      'الحساب / وسيلة الدفع اللي عايز أستلم عليها: ',
      '',
      `Terms / الشروط: ${termsUrl}`
    ].join('\n');
    res.json({
      success: true,
      whatsappUrl: `https://wa.me/${ACADEMY_PHONE_DIGITS}?text=${encodeURIComponent(text)}`,
      refundsLeft: MAX_STUDENT_REFUNDED_LESSONS - refundedSoFar - 1
    });
  } catch (err) {
    console.error('[POST /api/student/credits/:id/refund-request]', err);
    res.status(500).json({ error: 'Could not start your refund request. Please try again.' });
  }
});

// 16d. DASHBOARD: Fetch super admin overview metrics
app.get('/api/dashboard/overview-metrics', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const nowCairo = DateTime.now().setZone('Africa/Cairo');
    const startOfDayUtc = nowCairo.startOf('day').toUTC().toISO();
    const endOfDayUtc = nowCairo.endOf('day').toUTC().toISO();
    const startOfWeekUtc = nowCairo.startOf('week').toUTC().toISO();
    const endOfWeekUtc = nowCairo.endOf('week').toUTC().toISO();
    const thirtyDaysAgoUtc = nowCairo.minus({ days: 30 }).toUTC().toISO();
    const nowUtc = DateTime.now().toUTC().toISO();

    const [
      activeStudentsRes,
      teachersRes,
      lessonsTodayRes,
      lessonsThisWeekRes,
      trialsUpcomingRes,
      trialsTotalRes,
      newStudents30dRes,
      pendingPaymentsRes,
      unassignedStudentsRes,
      allActiveStudentsRes,
      allBookingsThisWeekRes
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('profiles').select('id, email, display_name, role'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('scheduled_start', startOfDayUtc).lte('scheduled_start', endOfDayUtc).neq('status', 'cancelled'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('scheduled_start', startOfWeekUtc).lte('scheduled_start', endOfWeekUtc).neq('status', 'cancelled'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_type', 'trial').gte('scheduled_start', nowUtc).neq('status', 'cancelled'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_type', 'trial'),
      supabase.from('students').select('*', { count: 'exact', head: true }).gte('created_at', thirtyDaysAgoUtc),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('students').select('*', { count: 'exact', head: true }).is('assigned_teacher_id', null).eq('status', 'active'),
      supabase.from('students').select('id, assigned_teacher_id').eq('status', 'active'),
      supabase.from('bookings').select('id, teacher_id').gte('scheduled_start', startOfWeekUtc).lte('scheduled_start', endOfWeekUtc).neq('status', 'cancelled')
    ]);

    const activeStudentsList = allActiveStudentsRes.data || [];
    const bookingsThisWeekList = allBookingsThisWeekRes.data || [];
    const teachersList = teachersRes.data || [];

    const teacher_capacity = teachersList.map((t: any) => {
      const active_students = activeStudentsList.filter((s: any) => s.assigned_teacher_id === t.id).length;
      const lessons_this_week = bookingsThisWeekList.filter((b: any) => b.teacher_id === t.id).length;
      return {
        teacher_id: t.id,
        email: t.email,
        name: t.display_name || t.email,
        role: t.role,
        active_students,
        lessons_this_week
      };
    });

    res.json({
      active_students: activeStudentsRes.count || 0,
      active_teachers: teachersList.length,
      lessons_today: lessonsTodayRes.count || 0,
      lessons_this_week: lessonsThisWeekRes.count || 0,
      trials_upcoming: trialsUpcomingRes.count || 0,
      trials_total: trialsTotalRes.count || 0,
      new_students_30d: newStudents30dRes.count || 0,
      pending_payments: pendingPaymentsRes.count || 0,
      unassigned_students: unassignedStudentsRes.count || 0,
      students_needing_attention: 0,
      teacher_capacity
    });
  } catch (err) {
    console.error('[Dashboard Overview Metrics Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 17. DASHBOARD: Fetch teacher stats
app.get('/api/dashboard/stats', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const isSuperAdmin = (req as any).teacherUser?.role === 'super_admin';
    const tId = (req as any).teacherUser?.id;

    let studentsQ = supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active');
    let bookingsQ = supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed');
    let trialsQ = supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_type', 'trial');

    if (!isSuperAdmin) {
      studentsQ = studentsQ.eq('assigned_teacher_id', tId);
      bookingsQ = bookingsQ.eq('teacher_id', tId);
      trialsQ = trialsQ.eq('teacher_id', tId);
    }

    const [leadsRes, studentsRes, bookingsRes, trialsRes, paymentsRes] = await Promise.all([
      isSuperAdmin ? supabase.from('leads').select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
      studentsQ,
      bookingsQ,
      trialsQ,
      isSuperAdmin ? supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending') : Promise.resolve({ count: 0 }),
    ]);

    res.json({
      stats: {
        totalLeads: leadsRes.count || 0,
        activeStudents: studentsRes.count || 0,
        upcomingBookings: bookingsRes.count || 0,
        trialBookings: trialsRes.count || 0,
        pendingPayments: paymentsRes.count || 0,
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

function transformBookingToDashboardTrial(b: any, leadMap?: Map<string, any>, serviceMap?: Map<string, any>) {
  const scheduledStart = b.scheduled_start;
  const scheduledEnd = b.scheduled_end || (scheduledStart && b.duration_minutes
    ? DateTime.fromISO(scheduledStart).plus({ minutes: b.duration_minutes }).toISO()
    : null);

  const learnerName = b.student_name || b.contact_name || null;
  const parentName = b.parent_name || null;

  const lead = (b.lead_id && leadMap?.get(b.lead_id)) ||
               (b.contact_email && leadMap?.get(b.contact_email.toLowerCase())) || null;
  const service = (b.service_id && serviceMap?.get(b.service_id)) || null;

  let integrationStatus: 'synced' | 'pending' | 'failed' | 'manual_action_required' | 'active' = 'pending';
  if (b.integration_status) {
    integrationStatus = b.integration_status;
  } else if (b.zoom_meeting_id && b.google_calendar_event_id) {
    integrationStatus = 'synced';
  }

  // Parse assessment from sync_metadata if present
  let assessment: any = null;
  if (b.sync_metadata && typeof b.sync_metadata === 'object' && b.sync_metadata.trial_assessment) {
    assessment = b.sync_metadata.trial_assessment;
  }

  const zoomHostUrl = b.sync_metadata?.zoomStartUrl || b.zoom_host_url || null;
  const zoomJoinUrl = b.sync_metadata?.zoomJoinUrl || b.zoom_join_url || b.zoom_meeting_link || null;

  return {
    id: b.id,
    reference_code: b.reference_code || null,
    lead_id: b.lead_id || (lead ? lead.id : null),
    student_id: b.student_id || null,
    learner_name: learnerName,
    parent_name: parentName,
    contact_email: b.contact_email || '',
    contact_whatsapp: b.contact_whatsapp || null,
    service_id: b.service_id || null,
    service_name: service ? service.title : (b.service_id ? b.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Trial Session'),
    scheduled_start: scheduledStart,
    scheduled_end: scheduledEnd,
    duration_minutes: b.duration_minutes !== null && b.duration_minutes !== undefined ? Number(b.duration_minutes) : null,
    status: b.status || null,
    student_timezone: b.student_timezone || null,
    cairo_time_display: b.cairo_time_display || null,
    goal: lead?.goal || b.learning_goal || b.notes || null,
    notes: b.notes || lead?.notes || null,
    zoom_meeting_link: zoomHostUrl || zoomJoinUrl,
    zoom_host_url: zoomHostUrl,
    zoom_join_url: zoomJoinUrl,
    zoom_meeting_id: b.zoom_meeting_id || null,
    google_calendar_event_id: b.google_calendar_event_id || null,
    integration_status: integrationStatus,
    assessment: assessment,
    lead_status: lead?.status || null,
    created_at: b.created_at
  };
}

// 18. DASHBOARD: Fetch free trials
app.get('/api/dashboard/trials', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    let trialsQuery = supabase
      .from('bookings')
      .select('*')
      .eq('booking_type', 'trial')
      .order('scheduled_start', { ascending: true });

    if ((req as any).teacherUser?.role !== 'super_admin') {
      trialsQuery = trialsQuery.eq('teacher_id', (req as any).teacherUser.id);
    }

    const [bookingsRes, leadsRes, servicesRes] = await Promise.all([
      trialsQuery,
      supabase.from('leads').select('*'),
      supabase.from('services').select('id, title, arabic_title')
    ]);

    if (bookingsRes.error) {
      console.error('[Dashboard Trials Error]', bookingsRes.error);
      return res.status(500).json({ error: 'Failed to load trial sessions.' });
    }

    const leadMap = new Map<string, any>();
    if (leadsRes.data) {
      for (const l of leadsRes.data) {
        leadMap.set(l.id, l);
        if (l.email) leadMap.set(l.email.toLowerCase(), l);
      }
    }

    const serviceMap = new Map<string, any>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s);
      }
    }

    const trials = (bookingsRes.data || []).map(b => transformBookingToDashboardTrial(b, leadMap, serviceMap));

    const nowCairo = DateTime.now().setZone('Africa/Cairo');
    const startOfDayUtc = nowCairo.startOf('day').toUTC().toISO();

    // Upcoming trials: scheduled_start >= today start in Cairo, active status
    const upcomingTrials = trials.filter(t => {
      if (t.status === 'cancelled' || t.status === 'completed') return false;
      if (!t.scheduled_start) return true;
      return t.scheduled_start >= startOfDayUtc;
    }).sort((a, b) => {
      const aTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
      const bTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
      return aTime - bTime;
    });

    // Recent / Past trials: completed, cancelled, or in the past
    const recentTrials = trials.filter(t => {
      if (t.status === 'completed' || t.status === 'cancelled') return true;
      if (!t.scheduled_start) return false;
      return t.scheduled_start < startOfDayUtc;
    }).sort((a, b) => {
      const aTime = a.scheduled_start ? new Date(a.scheduled_start).getTime() : 0;
      const bTime = b.scheduled_start ? new Date(b.scheduled_start).getTime() : 0;
      return bTime - aTime; // descending
    });

    res.json({
      upcoming_trials: upcomingTrials,
      recent_trials: recentTrials,
      total_trials: trials.length
    });
  } catch (err) {
    console.error('[Dashboard Trials Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 19. DASHBOARD: Update trial assessment & recommendation
app.post('/api/dashboard/trials/:id/assessment', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { assessment, mark_completed, update_lead_status } = req.body;

    // Fetch existing booking
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !booking || booking.booking_type !== 'trial') {
      return res.status(404).json({ error: 'Trial booking not found.' });
    }

    const assessingTeacher = (req as any).teacherUser;
    if (assessingTeacher?.role !== 'super_admin' && booking.teacher_id !== assessingTeacher?.id) {
      return res.status(403).json({ error: 'Forbidden: this trial is not assigned to you.' });
    }

    // If update_lead_status is requested, load associated lead and validate transition BEFORE any mutations
    let leadRecord: any = null;
    if (update_lead_status) {
      if (!VALID_LEAD_STATUSES.includes(update_lead_status)) {
        return res.status(400).json({ error: `Invalid lead status: ${update_lead_status}` });
      }

      const targetLeadId = booking.lead_id;
      if (targetLeadId) {
        const { data } = await supabase.from('leads').select('*').eq('id', targetLeadId).maybeSingle();
        leadRecord = data;
      } else if (booking.contact_email) {
        const { data } = await supabase.from('leads').select('*').ilike('email', escapeLike(booking.contact_email.trim())).maybeSingle();
        leadRecord = data;
      }

      if (!leadRecord) {
        return res.status(404).json({ error: 'Associated lead record not found.' });
      }

      if (update_lead_status !== leadRecord.status) {
        const isAllowed = isAllowedLeadTransition(leadRecord.status, update_lead_status);
        const isTeacherCorrection = req.body.is_correction === true || req.body.force_correction === true;

        if (!isAllowed && !isTeacherCorrection) {
          return res.status(400).json({
            error: `Invalid lead status transition from '${leadRecord.status}' to '${update_lead_status}'. If this is a teacher correction, set is_correction: true.`
          });
        }
      }
    }

    const currentSyncMetadata = booking.sync_metadata || {};
    const updatedSyncMetadata = {
      ...currentSyncMetadata,
      trial_assessment: {
        ...(currentSyncMetadata.trial_assessment || {}),
        ...assessment,
        assessed_at: new Date().toISOString()
      }
    };

    const bookingUpdates: any = {
      sync_metadata: updatedSyncMetadata,
      updated_at: new Date().toISOString()
    };

    if (mark_completed) {
      bookingUpdates.status = 'completed';
    }

    const { error: updateError } = await supabase
      .from('bookings')
      .update(bookingUpdates)
      .eq('id', id);

    if (updateError) {
      console.error('[Trial Assessment Update Error]', updateError);
      return res.status(500).json({ error: 'Failed to save trial assessment.' });
    }

    // If update_lead_status is requested, update the associated lead
    if (update_lead_status && leadRecord) {
      const { error: leadUpdateError } = await supabase
        .from('leads')
        .update({
          status: update_lead_status,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadRecord.id);

      if (leadUpdateError) {
        console.error('[Trial Assessment Lead Update Error]', leadUpdateError);
        return res.status(500).json({ error: 'Failed to update lead status.' });
      }

      // If converted to active_student, ensure student record exists in students table
        if (update_lead_status === 'active_student') {
          const { data: existingStudent } = await supabase
            .from('students')
            .select('id')
            .or(`lead_id.eq.${pgrstValue(leadRecord.id)},email.ilike.${pgrstValue(escapeLike(booking.contact_email))}`)
            .maybeSingle();

          // Timezone determination rule:
          // 1. Verified student timezone on booking or lead
          // 2. Explicitly supplied valid timezone in req.body.timezone
          // 3. otherwise null (NEVER silently default to 'Africa/Cairo')
          const determinedTimezone = (booking.student_timezone && booking.student_timezone.trim()) ||
            (leadRecord.timezone && leadRecord.timezone.trim()) ||
            (req.body.timezone && typeof req.body.timezone === 'string' && req.body.timezone.trim()) ||
            null;

          // Level determination rule:
          // 1. Explicitly assessed current level
          // 2. Trustworthy existing booking/lead level data
          // 3. otherwise null (NEVER silently default to 'beginner')
          const determinedLevel = (assessment?.current_level && assessment.current_level.trim()) ||
            (booking.current_level && booking.current_level.trim()) ||
            (leadRecord.current_level && leadRecord.current_level.trim()) ||
            null;

          // Learner type determination rule:
          let determinedLearnerType: 'child' | 'adult' | null = null;
          if (booking.parent_name || booking.notes?.toLowerCase().includes('parent') || leadRecord.notes?.toLowerCase().includes('parent')) {
            determinedLearnerType = 'child';
          } else if (leadRecord.learner_type === 'child' || leadRecord.learner_type === 'adult') {
            determinedLearnerType = leadRecord.learner_type;
          }

          const genuineNotes = [
            booking.reference_code ? `Enrolled after trial ${booking.reference_code}.` : 'Enrolled after trial.',
            assessment?.learning_plan_summary || assessment?.notes || ''
          ].filter(Boolean).join(' ').trim();

          if (!existingStudent) {
            const studentInsert: any = {
              lead_id: leadRecord.id,
              name: booking.student_name || booking.contact_name || leadRecord.name || 'Student',
              email: booking.contact_email || leadRecord.email || null,
              whatsapp: booking.contact_whatsapp || leadRecord.whatsapp || null,
              learner_type: determinedLearnerType,
              timezone: determinedTimezone,
              current_level: determinedLevel,
              status: 'active',
              notes: genuineNotes || null
            };

            let { error: insertErr } = await supabase.from('students').insert(studentInsert);
            // Backward-compatibility resilience: If DB schema still has strict NOT NULL on timezone or learner_type
            if (insertErr && insertErr.message?.includes('not-null constraint')) {
              console.warn('[Students Insert] Database schema enforces not-null on optional field, applying schema fallback.');
              if (insertErr.message.includes('timezone') && !studentInsert.timezone) {
                delete studentInsert.timezone;
              }
              if (insertErr.message.includes('learner_type') && !studentInsert.learner_type) {
                delete studentInsert.learner_type;
              }
              insertErr = (await supabase.from('students').insert(studentInsert)).error;
            }
            if (insertErr) {
              console.error('[Trial Assessment] Student record could not be created', insertErr.message);
            }
          } else {
            const studentUpdates: any = {
              status: 'active',
              updated_at: new Date().toISOString()
            };
            if (determinedTimezone) studentUpdates.timezone = determinedTimezone;
            if (determinedLevel) studentUpdates.current_level = determinedLevel;
            if (determinedLearnerType) studentUpdates.learner_type = determinedLearnerType;

            await supabase
              .from('students')
              .update(studentUpdates)
              .eq('id', existingStudent.id);
          }
        }
      }

    res.json({ success: true, message: 'Trial assessment saved successfully.' });
  } catch (err) {
    console.error('[Trial Assessment Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 20. DASHBOARD: Fetch leads with pipeline status & associated trial info
app.get('/api/dashboard/leads', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { status, search } = req.query;

    let query = supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (status && status !== 'all') {
      query = query.eq('status', status as string);
    }

    const [leadsRes, bookingsRes, servicesRes] = await Promise.all([
      query.limit(100),
      supabase
        .from('bookings')
        .select('id, reference_code, lead_id, contact_email, parent_name, scheduled_start, duration_minutes, status, booking_type, sync_metadata')
        .order('scheduled_start', { ascending: false }),
      supabase.from('services').select('id, title')
    ]);

    if (leadsRes.error) {
      console.error('[Dashboard Leads Error]', leadsRes.error);
      return res.status(500).json({ error: 'Failed to load leads.' });
    }

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.title);
      }
    }

    const allBookings = bookingsRes.data || [];

    // Marketing source of the account behind each lead (first-touch tags + "how did you hear"), matched by email.
    const leadEmails = [...new Set((leadsRes.data || []).map(l => String(l.email || '').toLowerCase()).filter(Boolean))];
    const sourceByEmail = new Map<string, { lead_source: any; heard_about: string | null }>();
    if (leadEmails.length) {
      const { data: sourced, error: sourcedErr } = await supabase.from('students').select('email, lead_source, heard_about').in('email', leadEmails);
      if (sourcedErr) console.warn('[Dashboard Leads] lead sources not loaded:', sourcedErr.message);
      for (const st of sourced || []) {
        if (st.email && (st.lead_source || st.heard_about)) sourceByEmail.set(String(st.email).toLowerCase(), { lead_source: st.lead_source || null, heard_about: st.heard_about || null });
      }
    }

    const leads = (leadsRes.data || []).map(lead => {
      // Find associated booking (prioritizing trial)
      const leadBookings = allBookings.filter(b =>
        (b.lead_id && b.lead_id === lead.id) ||
        (b.contact_email && b.contact_email.toLowerCase() === lead.email.toLowerCase())
      );
      const trialBooking = leadBookings.find(b => b.booking_type === 'trial') || leadBookings[0] || null;

      let nextAction = 'Contact via WhatsApp or Email';
      switch (lead.status) {
        case 'visitor':
        case 'lead':
          nextAction = 'Contact & Introduce Services';
          break;
        case 'contacted':
          nextAction = 'Invite to Book Free Trial';
          break;
        case 'trial_booked':
          nextAction = 'Prepare for Free Trial';
          break;
        case 'trial_completed':
          nextAction = 'Send Recommended Learning Plan';
          break;
        case 'potential_student':
          nextAction = 'Follow Up on Lesson Package';
          break;
        case 'active_student':
          nextAction = 'Active Learner — View Schedule';
          break;
        case 'returning_student':
          nextAction = 'Schedule Next Lesson Cycle';
          break;
        case 'lost':
          nextAction = 'Re-engage Later / Archive';
          break;
      }

      // Check for parent name either on lead or trial
      let parentName: string | null = null;
      if (trialBooking?.parent_name) {
        parentName = trialBooking.parent_name;
      } else if (lead.notes && lead.notes.includes('Parent:')) {
        const match = lead.notes.match(/Parent:\s*([^,\n]+)/i);
        if (match) parentName = match[1].trim();
      }

      // Automated Follow-up Engine calculation
      const nowMs = Date.now();
      const createdAtMs = lead.created_at ? new Date(lead.created_at).getTime() : nowMs;
      const updatedAtMs = lead.updated_at ? new Date(lead.updated_at).getTime() : createdAtMs;
      const hoursSinceCreated = Math.max(0, Math.round((nowMs - createdAtMs) / (1000 * 60 * 60)));
      const hoursSinceUpdate = Math.max(0, Math.round((nowMs - updatedAtMs) / (1000 * 60 * 60)));

      let needsFollowup = false;
      let followupReason: string | null = null;

      if ((lead.status === 'visitor' || lead.status === 'lead') && hoursSinceCreated >= 48) {
        needsFollowup = true;
        followupReason = `Pending initial contact (${hoursSinceCreated}h since inquiry)`;
      } else if (lead.status === 'contacted' && hoursSinceUpdate >= 72) {
        needsFollowup = true;
        followupReason = `Awaiting trial booking response (${Math.round(hoursSinceUpdate / 24)}d since contact)`;
      } else if (lead.status === 'trial_completed' && hoursSinceUpdate >= 24) {
        needsFollowup = true;
        followupReason = `Trial completed — learning plan recommendation due (${hoursSinceUpdate}h)`;
      } else if (lead.status === 'potential_student' && hoursSinceUpdate >= 96) {
        needsFollowup = true;
        followupReason = `Check-in on package enrollment (${Math.round(hoursSinceUpdate / 24)}d)`;
      }

      return {
        id: lead.id,
        name: lead.name,
        email: lead.email,
        whatsapp: lead.whatsapp || null,
        learner_type: lead.learner_type || null,
        service_interest_id: lead.service_interest_id || null,
        service_interest_name: lead.service_interest_id ? (serviceMap.get(lead.service_interest_id) || lead.service_interest_id) : null,
        goal: lead.goal || null,
        source: lead.source || null,
        acquisition: sourceByEmail.get(String(lead.email || '').toLowerCase()) || null,
        status: lead.status,
        notes: lead.notes || null,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        parent_name: parentName,
        trial_booking: trialBooking ? {
          id: trialBooking.id,
          reference_code: trialBooking.reference_code || null,
          scheduled_start: trialBooking.scheduled_start,
          duration_minutes: trialBooking.duration_minutes !== null && trialBooking.duration_minutes !== undefined ? Number(trialBooking.duration_minutes) : null,
          status: trialBooking.status,
          is_completed: trialBooking.status === 'completed',
          has_assessment: Boolean(trialBooking.sync_metadata?.trial_assessment)
        } : null,
        next_action: nextAction,
        needs_followup: needsFollowup,
        followup_reason: followupReason,
        hours_since_created: hoursSinceCreated,
        hours_since_update: hoursSinceUpdate
      };
    });

    // Compute pipeline summary
    const pipelineSummary: Record<string, number> = {
      visitor: 0,
      lead: 0,
      contacted: 0,
      trial_booked: 0,
      trial_completed: 0,
      potential_student: 0,
      active_student: 0,
      returning_student: 0,
      lost: 0
    };
    let followupRequiredCount = 0;

    for (const l of leads) {
      if (pipelineSummary[l.status] !== undefined) {
        pipelineSummary[l.status]++;
      }
      if (l.needs_followup) {
        followupRequiredCount++;
      }
    }

    // Apply search filter if present
    let filteredLeads = leads;
    if (search && typeof search === 'string' && search.trim()) {
      const q = search.trim().toLowerCase();
      filteredLeads = leads.filter(l =>
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        (l.whatsapp && l.whatsapp.includes(q)) ||
        (l.parent_name && l.parent_name.toLowerCase().includes(q))
      );
    }

    res.json({
      leads: filteredLeads,
      total: filteredLeads.length,
      pipeline_summary: pipelineSummary,
      followup_required_count: followupRequiredCount
    });
  } catch (err) {
    console.error('[Dashboard Leads Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 20b. DASHBOARD: Conversion Funnel & Pipeline Analytics
app.get('/api/dashboard/analytics', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { range, start_date, end_date } = req.query;

    let startDateIso: string | null = null;
    let endDateIso: string | null = null;

    if (range === 'today') {
      startDateIso = DateTime.now().setZone('Africa/Cairo').startOf('day').toUTC().toISO();
      endDateIso = DateTime.now().setZone('Africa/Cairo').endOf('day').toUTC().toISO();
    } else if (range === 'last_7_days') {
      startDateIso = DateTime.now().setZone('Africa/Cairo').minus({ days: 7 }).startOf('day').toUTC().toISO();
      endDateIso = DateTime.now().setZone('Africa/Cairo').endOf('day').toUTC().toISO();
    } else if (range === 'last_30_days') {
      startDateIso = DateTime.now().setZone('Africa/Cairo').minus({ days: 30 }).startOf('day').toUTC().toISO();
      endDateIso = DateTime.now().setZone('Africa/Cairo').endOf('day').toUTC().toISO();
    } else if (range === 'this_month') {
      startDateIso = DateTime.now().setZone('Africa/Cairo').startOf('month').toUTC().toISO();
      endDateIso = DateTime.now().setZone('Africa/Cairo').endOf('month').toUTC().toISO();
    } else if (range === 'custom' && start_date && end_date) {
      startDateIso = DateTime.fromISO(start_date as string).setZone('Africa/Cairo').startOf('day').toUTC().toISO();
      endDateIso = DateTime.fromISO(end_date as string).setZone('Africa/Cairo').endOf('day').toUTC().toISO();
    }

    const isSuperAdmin = (req as any).teacherUser?.role === 'super_admin';
    const tId = (req as any).teacherUser?.id;

    // 1. Current Pipeline: Fetch students (scoped if teacher) and leads (superadmin only)
    let studentsBase = supabase.from('students').select('id, lead_id, email, status, created_at');
    if (!isSuperAdmin) studentsBase = studentsBase.eq('assigned_teacher_id', tId);

    const [allLeadsRes, allStudentsRes, servicesRes] = await Promise.all([
      isSuperAdmin ? supabase.from('leads').select('id, name, email, status, service_interest_id, source, created_at, updated_at') : Promise.resolve({ data: [] }),
      studentsBase,
      supabase.from('services').select('id, title')
    ]);

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.title);
      }
    }

    const allLeads = allLeadsRes.data || [];
    const allStudents = allStudentsRes.data || [];

    // Global pipeline stage counts (Where are leads right now?)
    const currentPipeline: Record<string, number> = {
      visitor: 0,
      lead: 0,
      contacted: 0,
      trial_booked: 0,
      trial_completed: 0,
      potential_student: 0,
      active_student: 0,
      returning_student: 0,
      lost: 0
    };

    for (const l of allLeads) {
      if (currentPipeline[l.status] !== undefined) {
        currentPipeline[l.status]++;
      }
    }

    // 2. Period Scoped Data Fetching
    let leadsQuery = supabase.from('leads').select('id, name, email, status, service_interest_id, source, created_at, updated_at');
    let bookingsQuery = supabase.from('bookings').select('id, lead_id, student_id, contact_email, booking_type, status, scheduled_start, service_id, created_at');
    let paymentsQuery = supabase.from('payments').select('id, amount, status, created_at');

    if (!isSuperAdmin) {
      bookingsQuery = bookingsQuery.eq('teacher_id', tId);
    }

    if (startDateIso && endDateIso) {
      leadsQuery = leadsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
      bookingsQuery = bookingsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
      paymentsQuery = paymentsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
    }

    const [periodLeadsRes, periodBookingsRes, periodPaymentsRes] = await Promise.all([
      isSuperAdmin ? leadsQuery : Promise.resolve({ data: [] }),
      bookingsQuery,
      isSuperAdmin ? paymentsQuery : Promise.resolve({ data: [] })
    ]);

    const periodLeads = periodLeadsRes.data || [];
    const periodBookings = periodBookingsRes.data || [];
    const periodPayments = periodPaymentsRes.data || [];

    // Demographics & Distributions for period leads
    const sourcesDistribution: Record<string, number> = {};
    const servicesDistribution: Record<string, number> = {};
    const urgentFollowups: any[] = [];
    const nowMs = Date.now();

    for (const l of periodLeads) {
      const src = l.source || 'direct_website';
      sourcesDistribution[src] = (sourcesDistribution[src] || 0) + 1;

      const sName = l.service_interest_id ? (serviceMap.get(l.service_interest_id) || l.service_interest_id) : 'General Inquiry';
      servicesDistribution[sName] = (servicesDistribution[sName] || 0) + 1;

      const cAt = l.created_at ? new Date(l.created_at).getTime() : nowMs;
      const uAt = l.updated_at ? new Date(l.updated_at).getTime() : cAt;
      const hoursCreated = Math.max(0, Math.round((nowMs - cAt) / (1000 * 60 * 60)));
      const hoursUpdated = Math.max(0, Math.round((nowMs - uAt) / (1000 * 60 * 60)));

      if ((l.status === 'visitor' || l.status === 'lead') && hoursCreated >= 48) {
        urgentFollowups.push({
          id: l.id,
          name: l.name,
          status: l.status,
          hours: hoursCreated,
          reason: 'Uncontacted lead for over 48 hours'
        });
      } else if (l.status === 'trial_completed' && hoursUpdated >= 24) {
        urgentFollowups.push({
          id: l.id,
          name: l.name,
          status: l.status,
          hours: hoursUpdated,
          reason: 'Trial completed — learning plan pending > 24 hours'
        });
      }
    }

    // --- COHORT CALCULATIONS (Strict ID-Based Identity) ---
    // A. Lead -> Trial Conversion Rate
    // Denominator: Leads created in period (or all leads if no range)
    const cohortLeads = startDateIso && endDateIso ? periodLeads : allLeads;
    let leadToTrialRate: number | null = null;
    let leadToTrialNumerator = 0;

    if (cohortLeads.length > 0) {
      const leadIdsWithTrial = new Set<string>();
      for (const l of cohortLeads) {
        const hasTrialBookingByFk = periodBookings.some(b =>
          b.booking_type === 'trial' && (b.lead_id === l.id || (b.student_id && allStudents.some(s => s.id === b.student_id && s.lead_id === l.id)))
        );
        if (hasTrialBookingByFk) {
          leadIdsWithTrial.add(l.id);
        }
      }
      leadToTrialNumerator = leadIdsWithTrial.size;
      leadToTrialRate = Math.round((leadToTrialNumerator / cohortLeads.length) * 100);
    }

    // B. Trial -> Active Student Conversion Rate
    // Denominator: Unique leads with completed trials in period cohort linked via explicit lead_id / student_id FKs
    const completedTrialBookings = periodBookings.filter(b => b.booking_type === 'trial' && b.status === 'completed');
    const trialLeadIds = new Set<string>();

    for (const b of completedTrialBookings) {
      if (b.lead_id) {
        trialLeadIds.add(b.lead_id);
      } else if (b.student_id) {
        const student = allStudents.find(s => s.id === b.student_id);
        if (student && student.lead_id) {
          trialLeadIds.add(student.lead_id);
        }
      }
    }

    let trialToStudentRate: number | null = null;
    let trialToStudentNumerator = 0;

    if (trialLeadIds.size > 0) {
      for (const leadId of trialLeadIds) {
        const lead = allLeads.find(l => l.id === leadId);
        const isLeadActive = lead && (lead.status === 'active_student' || lead.status === 'returning_student');
        const isStudentActive = allStudents.some(s => s.lead_id === leadId && s.status === 'active');
        if (isLeadActive || isStudentActive) {
          trialToStudentNumerator++;
        }
      }
      trialToStudentRate = Math.round((trialToStudentNumerator / trialLeadIds.size) * 100);
    }

    // C. Overall Conversion Rate
    let overallConversionRate: number | null = null;
    if (cohortLeads.length > 0) {
      let activeCount = 0;
      for (const l of cohortLeads) {
        const isLeadActive = l.status === 'active_student' || l.status === 'returning_student';
        const isStudentActive = allStudents.some(s => s.lead_id === l.id && s.status === 'active');
        if (isLeadActive || isStudentActive) {
          activeCount++;
        }
      }
      overallConversionRate = Math.round((activeCount / cohortLeads.length) * 100);
    }

    // Payment Operational Status Metrics
    let confirmedPayments = 0;
    let pendingPayments = 0;
    let rejectedPayments = 0;

    for (const p of periodPayments) {
      if (p.status === 'confirmed') confirmedPayments++;
      if (p.status === 'pending') pendingPayments++;
      if (p.status === 'rejected') rejectedPayments++;
    }

    res.json({
      funnel: {
        total_leads_in_cohort: cohortLeads.length,
        trials_completed_in_cohort: trialLeadIds.size,
        rates: {
          lead_to_trial_rate: leadToTrialRate,
          trial_to_student_rate: trialToStudentRate,
          overall_conversion_rate: overallConversionRate
        },
        cohort_explanation: cohortLeads.length === 0
          ? 'No leads registered in selected date range'
          : trialLeadIds.size === 0
            ? 'No completed trials in selected date range'
            : null
      },
      current_pipeline: currentPipeline,
      sources_distribution: sourcesDistribution,
      services_distribution: servicesDistribution,
      urgent_followups: urgentFollowups.slice(0, 10),
      total_students_enrolled: allStudents.filter(s => s.status === 'active').length,
      total_bookings_count: periodBookings.length,
      payments: {
        confirmed_count: confirmedPayments,
        pending_count: pendingPayments,
        rejected_count: rejectedPayments
      }
    });
  } catch (err) {
    console.error('[Dashboard Analytics Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 20c. DASHBOARD: Get teacher settings
app.get('/api/dashboard/availability', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: No valid teacher session' });
    }

    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('weekday', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('[Dashboard API] Error fetching availability:', error);
      return res.status(500).json({ error: 'Failed to retrieve availability.' });
    }

    return res.json({ success: true, availability: data || [] });
  } catch (error: any) {
    console.error('[Dashboard API] Availability get exception:', error);
    return res.status(500).json({ error: 'Failed to retrieve availability.' });
  }
});

app.put('/api/dashboard/availability', verifyTeacherAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const teacherId = req.teacherUser?.id;
    if (!teacherId) {
      return res.status(401).json({ error: 'Unauthorized: No valid teacher session' });
    }

    const { schedule } = req.body;
    if (!Array.isArray(schedule)) {
      return res.status(400).json({ error: 'Schedule must be an array of intervals.' });
    }
    // RULES.md §1: each teacher enters hours in their own time zone.
    const timezone = typeof req.body?.timezone === 'string' ? req.body.timezone.trim() : '';
    if (timezone && !DateTime.local().setZone(timezone).isValid) {
      return res.status(400).json({ error: 'Unknown time zone.' });
    }

    const validatedIntervals: any[] = [];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

    for (const item of schedule) {
      if (typeof item.weekday !== 'number' || item.weekday < 0 || item.weekday > 6) {
         return res.status(400).json({ error: `Invalid weekday: ${item.weekday}. Must be integer 0-6.` });
      }

      let startTime = item.start_time;
      let endTime = item.end_time;

      if (startTime.length === 5) startTime += ':00';
      if (endTime.length === 5) endTime += ':00';

      if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
        return res.status(400).json({ error: `Invalid time format for weekday ${item.weekday}. Must be HH:mm:ss or HH:mm.` });
      }

      const startTimeDate = new Date(`1970-01-01T${startTime}Z`);
      const endTimeDate = new Date(`1970-01-01T${endTime}Z`);

      if (startTimeDate >= endTimeDate) {
         return res.status(400).json({ error: `Start time must be before end time for weekday ${item.weekday}.` });
      }

      validatedIntervals.push({
        teacher_id: teacherId,
        weekday: item.weekday,
        start_time: startTime,
        end_time: endTime,
        is_active: item.is_active !== undefined ? Boolean(item.is_active) : true
      });
    }

    const { error: rpcError } = await supabase.rpc('update_teacher_availability', {
      p_teacher_id: teacherId,
      p_schedule: validatedIntervals,
      p_timezone: timezone || null
    });

    if (rpcError) {
      console.error('[Dashboard API] Error updating availability via RPC:', rpcError);
      return res.status(500).json({ error: 'Failed to update availability transactionally.' });
    }

    return res.json({ success: true, message: 'Availability updated successfully.' });

  } catch (error: any) {
    console.error('[Dashboard API] Availability put exception:', error);
    return res.status(500).json({ error: 'Failed to update availability.' });
  }
});

// 20c. DASHBOARD: Get teacher settings
app.get('/api/dashboard/settings', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data, error } = await supabase.from('settings').select('*');
    if (error) throw error;

    res.json(data || []);
  } catch (err) {
    console.error('[Dashboard Settings GET Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- SERVER-AUTHORITATIVE SETTINGS SCHEMA & ALLOWLIST (Blocker #2) ---
const SETTINGS_ALLOWLIST: Record<string, { category: string; validate: (v: any) => { valid: boolean; message?: string } }> = {
  teacher_name: {
    category: 'Profile',
    validate: (val) => {
      if (typeof val !== 'string' || val.trim().length < 2 || val.trim().length > 100) {
        return { valid: false, message: 'Teacher name must be a string between 2 and 100 characters.' };
      }
      return { valid: true };
    }
  },
  bio: {
    category: 'Profile',
    validate: (val) => {
      if (typeof val !== 'string' || val.length > 2000) {
        return { valid: false, message: 'Bio must be a string up to 2000 characters.' };
      }
      return { valid: true };
    }
  },
  contact_email: {
    category: 'Contact',
    validate: (val) => {
      if (typeof val !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())) {
        return { valid: false, message: 'Contact email must be a valid email address.' };
      }
      return { valid: true };
    }
  },
  contact_whatsapp: {
    category: 'Contact',
    validate: (val) => {
      if (typeof val !== 'string' || !/^[0-9+\s-]{7,20}$/.test(val.trim())) {
        return { valid: false, message: 'WhatsApp number must be between 7 and 20 digits.' };
      }
      return { valid: true };
    }
  },
  timezone: {
    category: 'Timezone',
    validate: (val) => {
      if (typeof val !== 'string' || !DateTime.now().setZone(val.trim()).isValid) {
        return { valid: false, message: 'Timezone must be a valid IANA timezone identifier (e.g. Africa/Cairo).' };
      }
      return { valid: true };
    }
  },
  trial_enabled: {
    category: 'Policies',
    validate: (val) => {
      if (typeof val !== 'boolean') {
        return { valid: false, message: 'trial_enabled must be a boolean.' };
      }
      return { valid: true };
    }
  },
  trial_duration: {
    category: 'Policies',
    validate: (val) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 15 || num > 45) {
        return { valid: false, message: 'Trial duration must be an integer between 15 and 45 minutes.' };
      }
      return { valid: true };
    }
  },
  cancellation_hours: {
    category: 'Policies',
    validate: (val) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 1 || num > 72) {
        return { valid: false, message: 'Cancellation window must be an integer between 1 and 72 hours.' };
      }
      return { valid: true };
    }
  },
  payment_methods: {
    category: 'Payment',
    validate: (val) => {
      // Legacy manual-payment setting (no longer shown); stored values may include 'paypal', so it stays valid.
      const allowed = ['bank_transfer', 'ach', 'payoneer', 'paypal', 'wise', 'international_bank_iban', 'ach_routing'];
      if (!Array.isArray(val) || !val.every(m => typeof m === 'string' && allowed.includes(m))) {
        return { valid: false, message: `payment_methods must be an array of valid identifiers: ${allowed.join(', ')}` };
      }
      return { valid: true };
    }
  },
  payment_instructions: {
    category: 'Payment',
    validate: (val) => {
      if (typeof val !== 'string' || val.length > 2000) {
        return { valid: false, message: 'Payment instructions must be a string up to 2000 characters.' };
      }
      return { valid: true };
    }
  },
  language: {
    category: 'Preferences',
    validate: (val) => {
      if (val !== 'en' && val !== 'ar') {
        return { valid: false, message: "Language must be either 'en' or 'ar'." };
      }
      return { valid: true };
    }
  },
  theme: {
    category: 'Preferences',
    validate: (val) => {
      if (val !== 'light' && val !== 'dark') {
        return { valid: false, message: "Theme must be either 'light' or 'dark'." };
      }
      return { valid: true };
    }
  }
};

// 20d. DASHBOARD: Upsert teacher settings with strict server-side validation (Blocker #2)
app.patch('/api/dashboard/settings', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const { settings } = req.body;
    if (!Array.isArray(settings)) return res.status(400).json({ error: 'Settings array is required' });

    const validatedItems: any[] = [];
    const now = new Date().toISOString();

    for (const item of settings) {
      if (!item || typeof item !== 'object' || !item.key) {
        return res.status(400).json({ error: 'Each setting item must be an object containing a key.' });
      }

      const schema = SETTINGS_ALLOWLIST[item.key];
      if (!schema) {
        return res.status(400).json({ error: `Unknown settings key '${item.key}'. Only recognized settings keys are allowed.` });
      }

      if (item.category && item.category !== schema.category) {
        return res.status(400).json({ error: `Category mismatch for key '${item.key}': expected '${schema.category}', got '${item.category}'.` });
      }

      const check = schema.validate(item.value);
      if (!check.valid) {
        return res.status(400).json({ error: `Invalid value for setting '${item.key}': ${check.message}` });
      }

      validatedItems.push({
        key: item.key,
        value: item.value,
        category: schema.category,
        description: item.description || `${item.key} configuration`,
        updated_at: now
      });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data, error } = await supabase.from('settings').upsert(validatedItems, { onConflict: 'key' }).select();
    if (error) throw error;

    res.json({ message: 'Settings updated successfully', settings: data });
  } catch (err) {
    console.error('[Dashboard Settings PATCH Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 20e. DASHBOARD: Update service hourly rate / options safely
app.patch('/api/dashboard/services/:id', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { id } = req.params;
    const { hourly_rate_usd, trial_allowed, is_active } = req.body;

    const updates: any = { updated_at: new Date().toISOString() };

    if (hourly_rate_usd !== undefined) {
      const rate = Number(hourly_rate_usd);
      if (isNaN(rate) || !isFinite(rate) || rate < 0) {
        return res.status(400).json({ error: 'Hourly rate must be a non-negative number.' });
      }
      updates.hourly_rate_usd = Number(rate.toFixed(2));
    }

    if (trial_allowed !== undefined) {
      if (typeof trial_allowed !== 'boolean') {
        return res.status(400).json({ error: 'trial_allowed must be a boolean.' });
      }
      updates.trial_allowed = trial_allowed;
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean.' });
      }
      updates.is_active = is_active;
    }

    const { data, error } = await supabase
      .from('services')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return res.status(500).json({ error: 'Failed to update service details.' });
    }

    res.json({ message: 'Service details updated successfully', service: data });
  } catch (err) {
    console.error('[Dashboard Service PATCH Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 21. DASHBOARD: Update lead status, notes, or details
app.patch('/api/dashboard/leads/:id', verifyTeacherAuth, requireSuperAdmin, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { status, notes, service_interest_id, goal } = req.body;

    if (status && !VALID_LEAD_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid lead status: ${status}` });
    }

    // Retrieve current lead to validate transition
    const { data: currentLead, error: fetchLeadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchLeadError || !currentLead) {
      return res.status(404).json({ error: 'Lead record not found.' });
    }

    if (status && status !== currentLead.status) {
      const isAllowedTransition = isAllowedLeadTransition(currentLead.status, status);
      const isTeacherCorrection = req.body.is_correction === true || req.body.force_correction === true;

      if (!isAllowedTransition && !isTeacherCorrection) {
        return res.status(400).json({
          error: `Invalid lead status transition from '${currentLead.status}' to '${status}'. If this is a teacher correction, set is_correction: true.`
        });
      }
    }

    const updates: any = { updated_at: new Date().toISOString() };
    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (service_interest_id !== undefined) updates.service_interest_id = service_interest_id;
    if (goal !== undefined) updates.goal = goal;

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      console.error('[Lead Update Error]', updateError);
      return res.status(500).json({ error: 'Failed to update lead record.' });
    }

    // If status transitioned to active_student, ensure student record is created/active
    if (status === 'active_student' && updatedLead) {
      const { data: existingStudent } = await supabase
        .from('students')
        .select('id')
        .or(`lead_id.eq.${pgrstValue(updatedLead.id)},email.ilike.${pgrstValue(escapeLike(updatedLead.email))}`)
        .maybeSingle();

      // Look for any existing booking for this lead to recover verified timezone and assessment
      const { data: leadBookings } = await supabase
        .from('bookings')
        .select('student_timezone, parent_name, sync_metadata')
        .or(`lead_id.eq.${pgrstValue(updatedLead.id)},contact_email.ilike.${pgrstValue(escapeLike(updatedLead.email))}`)
        .order('created_at', { ascending: false })
        .limit(1);

      const matchedBooking = leadBookings?.[0];
      const trialAssessment = matchedBooking?.sync_metadata?.trial_assessment;

      // Timezone determination rule:
      // 1. verified student timezone on booking or lead
      // 2. explicitly supplied valid timezone in request
      // 3. otherwise null (NEVER silently default to 'Africa/Cairo')
      const determinedTimezone = (matchedBooking?.student_timezone && matchedBooking.student_timezone.trim()) ||
        (updatedLead.timezone && updatedLead.timezone.trim()) ||
        (req.body.timezone && typeof req.body.timezone === 'string' && req.body.timezone.trim()) ||
        null;

      // Level determination rule:
      // 1. explicitly assessed current level from trial assessment
      // 2. explicitly supplied level in req.body.current_level
      // 3. otherwise null (NEVER silently default to 'beginner')
      const determinedLevel = (trialAssessment?.current_level && trialAssessment.current_level.trim()) ||
        (req.body.current_level && typeof req.body.current_level === 'string' && req.body.current_level.trim()) ||
        null;

      // Learner type determination rule:
      let determinedLearnerType: 'child' | 'adult' | null = null;
      if (matchedBooking?.parent_name || updatedLead.notes?.toLowerCase().includes('parent')) {
        determinedLearnerType = 'child';
      } else if (updatedLead.learner_type === 'child' || updatedLead.learner_type === 'adult') {
        determinedLearnerType = updatedLead.learner_type;
      }

      const genuineNotes = updatedLead.notes
        ? `Enrolled from lead pipeline. ${updatedLead.notes}`.trim()
        : 'Enrolled from lead pipeline.';

      if (!existingStudent) {
        const studentInsert: any = {
          lead_id: updatedLead.id,
          name: updatedLead.name,
          email: updatedLead.email,
          whatsapp: updatedLead.whatsapp,
          learner_type: determinedLearnerType,
          timezone: determinedTimezone,
          current_level: determinedLevel,
          status: 'active',
          notes: genuineNotes
        };

        let { error: insertErr } = await supabase.from('students').insert(studentInsert);
        // Fallback resilience if DB schema still has legacy not-null constraint
        if (insertErr && insertErr.message?.includes('not-null constraint')) {
          console.warn('[Students Insert] Applying legacy fallback for not-null column.');
          if (insertErr.message.includes('timezone') && !studentInsert.timezone) {
            delete studentInsert.timezone;
          }
          if (insertErr.message.includes('learner_type') && !studentInsert.learner_type) {
            delete studentInsert.learner_type;
          }
          insertErr = (await supabase.from('students').insert(studentInsert)).error;
        }
        if (insertErr) {
          console.error('[Lead Conversion] Student record could not be created', insertErr.message);
        }
      } else {
        const studentUpdates: any = {
          status: 'active',
          updated_at: new Date().toISOString()
        };
        if (determinedTimezone) studentUpdates.timezone = determinedTimezone;
        if (determinedLevel) studentUpdates.current_level = determinedLevel;
        if (determinedLearnerType) studentUpdates.learner_type = determinedLearnerType;

        await supabase
          .from('students')
          .update(studentUpdates)
          .eq('id', existingStudent.id);
      }
    }

    res.json({ success: true, lead: updatedLead });
  } catch (err) {
    console.error('[Lead Update Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 22. PUBLIC: Contact inquiry submission (creates or updates real lead)
app.post('/api/contact', rateLimit, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Service temporarily unavailable.' });
    }

    const { name, email, whatsapp, serviceInterest, message, source } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Name is required.' });
    }
    if (!email || typeof email !== 'string' || !isValidEmail(email.trim().toLowerCase())) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanWhatsapp = whatsapp ? String(whatsapp).trim().slice(0, 40) : null;
    const cleanMessage = message ? String(message).trim().slice(0, 2000) : null;
    const cleanSource = typeof source === 'string' && /^[a-z_]{1,40}$/.test(source) ? source : 'website_contact';

    // Check if lead already exists by lower(email)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, notes, status')
      .ilike('email', escapeLike(cleanEmail))
      .maybeSingle();

    if (existingLead) {
      // Anyone can submit this form with any email, so an existing lead's contact
      // fields are never overwritten; the new details are recorded in the note instead.
      const stamp = DateTime.now().setZone('Africa/Cairo').toFormat('yyyy-MM-dd HH:mm');
      const details = [`name: ${cleanName}`, cleanWhatsapp ? `whatsapp: ${cleanWhatsapp}` : null].filter(Boolean).join(', ');
      const appendNotes = `${existingLead.notes || ''}\n[${stamp}] Inquiry (${details})${cleanMessage ? `: ${cleanMessage}` : ''}`.trim();

      await supabase
        .from('leads')
        .update({
          notes: appendNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLead.id);
    } else {
      await supabase
        .from('leads')
        .insert({
          name: cleanName,
          email: cleanEmail,
          whatsapp: cleanWhatsapp,
          learner_type: 'adult',
          service_interest_id: serviceInterest || null,
          goal: cleanMessage,
          source: cleanSource,
          status: 'lead',
          notes: cleanMessage ? `Initial inquiry: ${cleanMessage}` : null
        });
    }

    // Dispatch LEAD_CREATED notification asynchronously
    try {
      await dispatchNotification({
        eventType: 'LEAD_CREATED',
        lead: {
          name: cleanName,
          email: cleanEmail,
          whatsapp: cleanWhatsapp,
          serviceInterest: serviceInterest || undefined,
          goal: cleanMessage,
          source: cleanSource
        }
      });
    } catch (notifErr) {
      console.error('[Contact Lead Notification Error]', notifErr);
    }

    res.json({
      success: true,
      message: 'Thank you for reaching out. Our team will be in touch with you shortly.'
    });
  } catch (err) {
    console.error('[Contact Submission Error]', err);
    res.status(500).json({ error: 'Failed to process inquiry. Please contact via WhatsApp.' });
  }
});

// PR-09: super admin preview of the monthly progress email (dry run: reads only, sends and records nothing).
app.get('/api/dashboard/admin/monthly-progress/preview', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  const client = getSupabaseAdminClient();
  if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
  const raw = typeof req.query?.month === 'string' ? req.query.month : '';
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(raw) ? raw : reportMonthFor(DateTime.utc());
  try {
    const result = await processMonthlyProgressEmails(client, { month, dryRun: true, limit: 1000 });
    return res.json({
      month,
      monthLabel: monthLabel(month),
      enabled: monthlyEmailsEnabled(),
      count: result.recipients.length,
      skipped: result.skipped,
      recipients: result.recipients.slice(0, 200).map((r) => ({ name: r.name, email: r.email, family: r.viaParent, learners: r.learners.map((l) => ({ name: l.learnerName, lessons: l.lessons })) }))
    });
  } catch (err) {
    console.error('[GET monthly-progress/preview]', err);
    return res.status(500).json({ error: 'Could not build the preview.' });
  }
});

// RN-06: super admin preview of the "we miss you" list (dry run: reads only, sends and records nothing).
app.get('/api/dashboard/admin/quiet-learners/preview', verifyTeacherAuth, requireSuperAdmin, async (_req: any, res: any) => {
  const client = getSupabaseAdminClient();
  if (!client) return res.status(503).json({ error: 'Database integration is not properly configured.' });
  try {
    const result = await processQuietLearners(client, { dryRun: true, limit: 500 });
    return res.json({
      enabled: quietEmailsEnabled(),
      count: result.candidates.length,
      skipped: result.skipped,
      accounts: result.candidates.slice(0, 200).map((a) => ({ name: a.learnerName, email: a.email, family: a.viaParent, lastLesson: a.lastLesson }))
    });
  } catch (err) {
    console.error('[GET quiet-learners/preview]', err);
    return res.status(500).json({ error: 'Could not build the preview.' });
  }
});

// 23. CRON: Process pending 24h and 1h lesson reminders
app.all('/api/cron/process-reminders', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    // Fail closed: without a configured secret the endpoint is disabled in every environment.
    if (!cronSecret) {
      return res.status(503).json({ error: 'CRON_SECRET is not configured on the server.' });
    }

    // Require Authorization: Bearer <CRON_SECRET> header; query-string secrets are strictly rejected
    {
      if (!authHeader || !/^Bearer\s+\S+/i.test(authHeader)) {
        return res.status(401).json({ error: 'Unauthorized cron request.' });
      }

      const token = authHeader.replace(/^Bearer\s+/i, '').trim();
      const aBuf = Buffer.from(token, 'utf8');
      const bBuf = Buffer.from(cronSecret, 'utf8');
      const isAuthorized = aBuf.length === bBuf.length && crypto.timingSafeEqual(aBuf, bBuf);
      if (!isAuthorized) {
        return res.status(401).json({ error: 'Unauthorized cron request.' });
      }
    }

    const cronClient = getSupabaseAdminClient();
    if (cronClient) await releaseExpiredPaymentHolds(cronClient);

    const integrationsProcessed = await processIntegrationJobs();

    const summary = await processDueReminders();
    // Production only: the test suite calls this route against the shared database and must not email real families.
    const trialFollowUps = process.env.VERCEL_ENV === 'production' ? await processTrialFollowUps(cronClient) : 0;
    // PR-09: off until the owner sets MONTHLY_PROGRESS_EMAILS=on (production only); then the 1st-5th of each month.
    let monthlyProgress = 0;
    if (cronClient && monthlyEmailsEnabled() && isSendWindow(DateTime.utc())) {
      try { monthlyProgress = (await processMonthlyProgressEmails(cronClient)).sent; } catch (err) { console.warn('[Cron] monthly progress failed:', err); }
    }
    // RN-06: off until the owner sets QUIET_LEARNER_EMAILS=on (production only); once a day.
    let quietLearners = 0;
    if (cronClient && quietEmailsEnabled() && isQuietRunHour(DateTime.utc())) {
      try { quietLearners = (await processQuietLearners(cronClient)).sent; } catch (err) { console.warn('[Cron] quiet learners failed:', err); }
    }
    await recordHeartbeat(cronClient, HEARTBEAT_REMINDER_CRON, { integrationsProcessed, trialFollowUps, monthlyProgress, quietLearners });
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary,
      integrationsProcessed
    });
  } catch (err: any) {
    console.error('[Cron Process Reminders Error]', err);
    res.status(500).json({ error: 'Internal Server Error processing reminders.' });
  }
});

// ====================================================================
// 24. STUDENT PORTAL APIS (Phase 7 Foundation)
// ====================================================================

// GET /api/student/me - Retrieve authenticated student's profile
app.get('/api/student/me', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      res.setHeader('x-student-me-branch', 'BRANCH_A_NO_STUDENT_ID');
      console.warn('[GET /api/student/me Diag] 404 at Branch A: student_id is missing from req.studentUser');
      return res.status(404).json({
        error: 'Student profile not found.',
        diagnosticBranch: 'BRANCH_A_NO_STUDENT_ID',
        hasAuthUser: Boolean(req.studentUser?.auth_id)
      });
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();

    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      const mockProfile = req.studentUser?.studentProfile || {
        id: studentId,
        name: req.studentUser?.name || 'Student',
        email: req.studentUser?.email || 'student@example.com',
        timezone: 'UTC',
        status: 'active',
        learner_type: 'adult',
        current_level: 'beginner'
      };
      const mockCanBookForChild = mockProfile.canBookForChild ?? (
        mockProfile.learner_type === 'child' ||
        Boolean(mockProfile.guardian) ||
        Boolean(mockProfile.linkedChildren && mockProfile.linkedChildren.length > 0)
      );
      const rawPref = mockProfile.booking_preference || mockProfile.bookingPreference || 'self';
      const safePref = mockCanBookForChild ? rawPref : 'self';

      res.setHeader('x-student-me-branch', 'SUCCESS_DEV_MOCK');
      return res.json({
        id: mockProfile.id,
        name: mockProfile.name,
        email: mockProfile.email,
        whatsapp: mockProfile.whatsapp || null,
        country: mockProfile.country || null,
        timezone: mockProfile.timezone || 'UTC',
        learnerType: mockProfile.learner_type || 'adult',
        currentLevel: mockProfile.current_level || 'beginner',
        status: mockProfile.status || 'active',
        bookingPreference: safePref,
        canBookForChild: mockCanBookForChild,
        linkedChildren: mockProfile.linkedChildren || [],
        createdAt: mockProfile.created_at || new Date().toISOString(),
        guardian: null,
        goals: []
      });
    }

    try {
      const [studentRes, guardianRes, goalsRes, linkedChildrenRes] = await Promise.all([
        supabaseAdmin
          .from('students')
          .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, booking_preference, created_at, onboarding_completed, learning_interest, learning_goal, learning_needs, assigned_teacher_id, gender, teacher_gender_preference, age')
          .eq('id', studentId)
          .single(),
        supabaseAdmin
          .from('guardians')
          .select('parent_name, parent_email, parent_whatsapp, relationship_type')
          .eq('student_id', studentId)
          .maybeSingle(),
        supabaseAdmin
          .from('student_goals')
          .select('id, goal_text, is_primary, status')
          .eq('student_id', studentId)
          .eq('status', 'in_progress'),
        supabaseAdmin
          .from('guardians')
          .select('student_id, parent_name, parent_email, students:student_id(id, name, current_level, gender, assigned_teacher_id, learner_type, learning_interest, notes, status, age)')
          .ilike('parent_email', escapeLike((req.studentUser?.email || '').trim()))
      ]);

      if (studentRes.error || !studentRes.data) {
        console.error('[GET /api/student/me Diag] 404 at Branch B: student fetch failed', {
          errorCode: studentRes.error?.code,
          errorMessage: studentRes.error?.message,
          hasData: Boolean(studentRes.data),
          hasProfileInReq: Boolean(req.studentUser?.studentProfile)
        });
        res.setHeader('x-student-me-branch', 'BRANCH_B_STUDENT_FETCH_FAILED');
        res.setHeader('x-student-me-db-code', studentRes.error?.code || 'NO_DATA');

        // Resilient recovery: if verifyStudentAuth already found the student profile safely, resolve from it
        if (req.studentUser?.studentProfile) {
          console.log('[GET /api/student/me Diag] Resiliently resolving from verified studentProfile in verifyStudentAuth');
          const mp = req.studentUser.studentProfile;
          const mockCanBookForChild = mp.canBookForChild ?? (
            mp.learner_type === 'child' ||
            Boolean(mp.guardian) ||
            Boolean(mp.linkedChildren && mp.linkedChildren.length > 0)
          );
          const rawPref = mp.booking_preference || mp.bookingPreference || 'self';
          const safePref = mockCanBookForChild ? rawPref : 'self';

          return res.json({
            id: mp.id,
            name: mp.name,
            email: mp.email,
            whatsapp: mp.whatsapp || null,
            country: mp.country || null,
            timezone: mp.timezone || 'UTC',
            learnerType: mp.learner_type || 'adult',
            currentLevel: mp.current_level || 'beginner',
            status: mp.status || 'active',
            bookingPreference: safePref,
            canBookForChild: mockCanBookForChild,
            linkedChildren: mp.linkedChildren || [],
            onboardingCompleted: mp.onboarding_completed ?? true,
            learningInterest: mp.learning_interest || 'Quran Reading',
            learningGoal: mp.learning_goal || null,
            learningNeeds: mp.learning_needs || null,
            createdAt: mp.created_at || new Date().toISOString(),
            guardian: null,
            goals: []
          });
        }

        return res.status(404).json({
          error: 'Student profile not found.',
          diagnosticBranch: 'BRANCH_B_STUDENT_FETCH_FAILED',
          dbErrorCode: studentRes.error?.code || null
        });
      }

      res.setHeader('x-student-me-branch', 'SUCCESS');
      const profile = studentRes.data;
      const guardian = guardianRes.data || null;
      const goals = goalsRes.data || [];

      // Determine child booking eligibility authoritatively
      const isChildStudentWithGuardian = profile.learner_type === 'child' && Boolean(guardian);
      const rawChildren = (linkedChildrenRes?.data || [])
        .map((g: any) => g.students)
        .filter(Boolean);

      const linkedChildrenFromGuardians = await Promise.all(
        rawChildren.map(async (child: any) => {
          let teacherName = null;
          if (child.assigned_teacher_id) {
            const meta = await resolveTeacherMetadata(child.assigned_teacher_id, supabaseAdmin);
            teacherName = meta ? meta.display_name : null;
          }
          if (!teacherName) {
            teacherName = 'المعلم المختص'; // no assigned teacher yet: never guess one by gender
          }
          return {
            id: child.id,
            name: child.name,
            currentLevel: child.current_level || 'beginner',
            age: child.age ?? null,
            gender: child.gender || 'undisclosed',
            learnerType: child.learner_type || 'child',
            learningInterest: child.learning_interest || null,
            notes: child.notes || null,
            assignedTeacherId: child.assigned_teacher_id || null,
            assignedTeacherName: teacherName,
            status: child.status || 'active'
          };
        })
      );
      const canBookForChild = isChildStudentWithGuardian || linkedChildrenFromGuardians.length > 0;
      const rawPref = (profile as any).booking_preference || (canBookForChild ? 'child' : 'self');
      const bookingPreference = canBookForChild ? rawPref : 'self';

      let assignedTeacherName = null;
      if (profile.assigned_teacher_id) {
        const teacherMeta = await resolveTeacherMetadata(profile.assigned_teacher_id, supabaseAdmin);
        assignedTeacherName = teacherMeta ? teacherMeta.display_name : null;
      }

      return res.json({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        whatsapp: profile.whatsapp || null,
        country: profile.country || null,
        timezone: profile.timezone || 'UTC',
        learnerType: profile.learner_type || 'adult',
        age: (profile as any).age ?? null,
        currentLevel: profile.current_level || 'beginner',
        status: profile.status || 'active',
        assignedTeacherId: profile.assigned_teacher_id || null,
        assignedTeacherName,
        teacherAssignmentStatus: (profile as any).teacher_assignment_status || 'pending_review',
        gender: profile.gender || 'undisclosed',
        teacherGenderPreference: profile.teacher_gender_preference || 'no_preference',
        bookingPreference,
        canBookForChild,
        linkedChildren: linkedChildrenFromGuardians,
        onboardingCompleted: profile.onboarding_completed ?? false,
        learningInterest: profile.learning_interest || null,
        learningGoal: profile.learning_goal || (goals[0]?.goal_text || null),
        learningNeeds: profile.learning_needs || null,
        createdAt: profile.created_at,
        guardian: guardian ? {
          parentName: guardian.parent_name,
          parentEmail: guardian.parent_email,
          parentWhatsapp: guardian.parent_whatsapp || null,
          relationshipType: guardian.relationship_type || 'parent'
        } : null,
        goals: goals.map((g: any) => ({
          id: g.id,
          goalText: g.goal_text,
          isPrimary: g.is_primary,
          status: g.status
        }))
      });
    } catch (dbErr: any) {
      console.error('[GET /api/student/me DB Catch]', dbErr);
      if (req.studentUser?.studentProfile) {
        console.log('[GET /api/student/me Diag] Catch recovery: resolving from verified studentProfile in verifyStudentAuth');
        const mp = req.studentUser.studentProfile;
        const mockCanBookForChild = mp.canBookForChild ?? (
          mp.learner_type === 'child' ||
          Boolean(mp.guardian) ||
          Boolean(mp.linkedChildren && mp.linkedChildren.length > 0)
        );
        const rawPref = mp.booking_preference || mp.bookingPreference || 'self';
        const safePref = mockCanBookForChild ? rawPref : 'self';

        return res.json({
          id: mp.id,
          name: mp.name,
          email: mp.email,
          timezone: mp.timezone || 'UTC',
          learnerType: mp.learner_type || 'adult',
          currentLevel: mp.current_level || 'beginner',
          status: mp.status || 'active',
          assignedTeacherId: mp.assigned_teacher_id || mp.assignedTeacherId || null,
          assignedTeacherName: mp.assigned_teacher_name || mp.assignedTeacherName || null,
          teacherAssignmentStatus: mp.teacher_assignment_status || 'pending_review',
          gender: mp.gender || 'undisclosed',
          teacherGenderPreference: mp.teacher_gender_preference || 'no_preference',
          bookingPreference: safePref,
          canBookForChild: mockCanBookForChild,
          linkedChildren: mp.linkedChildren || [],
          onboardingCompleted: mp.onboarding_completed ?? true,
          learningInterest: mp.learning_interest || 'Quran Reading',
          learningGoal: mp.learning_goal || null,
          learningNeeds: mp.learning_needs || null,
          createdAt: new Date().toISOString(),
          guardian: null,
          goals: []
        });
      }
      throw dbErr;
    }
  } catch (err: any) {
    console.error('[GET /api/student/me Error]', err);
    return res.status(500).json({ error: 'Internal server error retrieving student profile.' });
  }
});

// Dedicated diagnostic endpoint for student authentication & identity resolution
app.get('/api/student-auth-diagnostic', verifyStudentAuth, (req: any, res: any) => {
  const clientRef = typeof req.headers['x-client-project-ref'] === 'string' ? req.headers['x-client-project-ref'].trim() : null;
  const backendRef = extractSupabaseProjectRef(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL);

  let projectConsistency: 'MATCH' | 'MISMATCH' | 'UNKNOWN' = 'UNKNOWN';
  if (clientRef && backendRef) {
    projectConsistency = clientRef === backendRef ? 'MATCH' : 'MISMATCH';
  }

  const authUserIdHash = req.studentUser?.auth_id
    ? crypto.createHash('sha256').update(req.studentUser.auth_id).digest('hex').substring(0, 8)
    : null;
  const studentIdHash = req.studentUser?.student_id
    ? crypto.createHash('sha256').update(req.studentUser.student_id).digest('hex').substring(0, 8)
    : null;

  res.json({
    diagnostic: true,
    authenticated: true,
    tokenVerification: 'success',
    studentAuthorization: req.studentUser?.student_id ? 'authorized' : 'unlinked',
    backendProjectRef: backendRef || 'unknown',
    projectConsistency,
    authUserIdHash,
    studentIdHash,
    hasStudentUser: Boolean(req.studentUser),
    hasStudentId: Boolean(req.studentUser?.student_id),
    hasStudentProfile: Boolean(req.studentUser?.studentProfile),
    stage: 'STUDENT_AUTHORIZED'
  });
});

// GET /api/student/teachers - Teachers a student can choose at onboarding (no emails).
app.get('/api/student/teachers', verifyStudentAuth, async (_req: any, res: any) => {
  try {
    const teachers = await listPublicTeachers(getSupabaseAdminClient());
    res.json({ teachers: teachers.map(({ email: _email, ...t }) => t) });
  } catch (err) {
    console.error('[GET /api/student/teachers Error]', err);
    res.json({ teachers: [] });
  }
});

// GET /api/geo - Country of the visitor from the hosting edge (used only to pre-fill onboarding).
app.get('/api/geo', (req: any, res: any) => {
  const raw = String(req.headers['x-vercel-ip-country'] || '').trim().toUpperCase();
  res.setHeader('Cache-Control', 'private, no-store');
  res.json({ country: /^[A-Z]{2}$/.test(raw) ? raw : null });
});

// POST /api/student/onboarding - Complete onboarding for new student
app.post('/api/student/onboarding', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    // Validate that client cannot submit or assign privileged roles
    if (req.body && (req.body.role !== undefined || req.body.appRole !== undefined || req.body.isTeacher !== undefined || req.body.is_teacher !== undefined)) {
      return res.status(422).json({ error: 'Assignment of privileged role is strictly forbidden.' });
    }

    const {
      name,
      learnerType,
      parentName,
      parentWhatsapp,
      learningInterest,
      currentLevel,
      learningGoal,
      learningNeeds,
      timezone,
      whatsapp,
      gender,
      country,
      teacherGenderPreference,
      teacher_gender_preference,
      children,
      age,
      guardianAge,
      teacherId,
      leadSource,
      heardAbout
    } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(422).json({ error: 'Please provide a valid name (at least 2 characters).' });
    }
    // Exact ages (owner decisions 2026-10-16): a personal account is 18+, a family account is
    // opened by a guardian aged 18+, and each child is 6-17 (src/lib/ageRules.ts).
    if (learnerType === 'child') {
      if (!isGuardianAge(guardianAge)) {
        return res.status(422).json({ error: `A family account is opened by a parent or guardian aged ${GUARDIAN_MIN_AGE} or over.` });
      }
      const namedChildren = Array.isArray(children) ? children.filter((c: any) => typeof c?.name === 'string' && c.name.trim()) : [];
      if (!namedChildren.length) {
        return res.status(422).json({ error: 'Please add at least one child.' });
      }
      if (namedChildren.length > 10) {
        return res.status(422).json({ error: 'A family account can have up to 10 children.' });
      }
      if (namedChildren.some((c: any) => !isChildAge(c?.age))) {
        return res.status(422).json({ error: `Each child must be ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE} years old. Learners aged ${ADULT_MIN_AGE} or over open their own account.` });
      }
    } else if (!isAdultAge(age)) {
      return res.status(422).json({ error: `A personal account is for learners aged ${ADULT_MIN_AGE} or over. Under ${ADULT_MIN_AGE}? A parent opens a family account.` });
    }

    const validLevels = ['beginner', 'elementary', 'intermediate', 'advanced'];
    const resolvedLevel = validLevels.includes(currentLevel) ? currentLevel : 'beginner';
    const resolvedLearnerType = learnerType === 'child' ? 'child' : 'adult';
    const resolvedGender = ['male', 'female', 'undisclosed'].includes(gender) ? gender : 'undisclosed';
    const rawTeacherPref = teacherGenderPreference || teacher_gender_preference;
    const resolvedTeacherPref = ['no_preference', 'male_teacher', 'female_teacher'].includes(rawTeacherPref) ? rawTeacherPref : 'no_preference';

    let resolvedTimezone = 'UTC';
    if (timezone && typeof timezone === 'string' && DateTime.now().setZone(timezone.trim()).isValid) {
      resolvedTimezone = timezone.trim();
    } else if (req.studentUser?.studentProfile?.timezone) {
      resolvedTimezone = req.studentUser.studentProfile.timezone;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();

    // Routing: the teacher the learner picked (must be an active teacher), else by preferred gender.
    const publicTeachers = await listPublicTeachers(supabaseAdmin);
    const pickTeacher = (id: unknown) => (typeof id === 'string' ? publicTeachers.find(t => t.id === id) : undefined) || null;
    const routeTeacher = async (chosenId: unknown, targetGender: 'male' | 'female') => {
      const chosen = pickTeacher(chosenId) || publicTeachers.find(t => t.gender === targetGender);
      return chosen ? { id: chosen.id, name: chosen.nameEn, email: chosen.email } : resolveSmartTeacherRouting(targetGender, supabaseAdmin);
    };
    const chosenAdultTeacher = pickTeacher(teacherId);
    const routingTargetGender = chosenAdultTeacher?.gender || (resolvedTeacherPref === 'female_teacher' ? 'female' : (resolvedTeacherPref === 'male_teacher' ? 'male' : (resolvedGender === 'female' ? 'female' : 'male')));
    const routedTeacher = await routeTeacher(teacherId, routingTargetGender);

    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentProfile) {
        req.studentUser.studentProfile.name = name.trim();
        req.studentUser.studentProfile.learner_type = resolvedLearnerType;
        req.studentUser.studentProfile.current_level = resolvedLevel;
        req.studentUser.studentProfile.timezone = resolvedTimezone;
        req.studentUser.studentProfile.gender = resolvedGender;
        req.studentUser.studentProfile.teacher_gender_preference = resolvedTeacherPref;
        req.studentUser.studentProfile.assigned_teacher_id = routedTeacher.id;
        req.studentUser.studentProfile.assigned_teacher_name = routedTeacher.name;
        req.studentUser.studentProfile.teacher_assignment_status = 'pending_review';
        req.studentUser.studentProfile.onboarding_completed = true;
        if (country) req.studentUser.studentProfile.country = String(country).trim();
        if (whatsapp) req.studentUser.studentProfile.whatsapp = String(whatsapp).trim();
        if (learningInterest) req.studentUser.studentProfile.learning_interest = String(learningInterest).trim();
        if (learningGoal) req.studentUser.studentProfile.learning_goal = String(learningGoal).trim();
        if (learningNeeds) req.studentUser.studentProfile.learning_needs = String(learningNeeds).trim();

        if (resolvedLearnerType === 'child' && Array.isArray(children) && children.length > 0) {
          req.studentUser.studentProfile.linkedChildren = children.map((c: any, idx: number) => ({
            id: c.id || `child-${idx + 1}`,
            name: (c.name || '').trim(),
            gender: c.gender === 'female' ? 'female' : 'male',
            currentLevel: c.currentLevel || 'beginner',
            learningInterest: c.learningInterest || 'quran-reading',
            notes: c.notes || c.learningNeeds || null,
            assignedTeacherId: c.gender === 'female' ? 'afnan-id' : 'mahmoud-id',
            assignedTeacherName: 'المعلم المختص',
            status: 'active'
          }));
          req.studentUser.studentProfile.canBookForChild = true;
          req.studentUser.studentProfile.bookingPreference = 'child';
        }
      }
      return res.json({
        success: true,
        onboardingCompleted: true,
        assignedTeacherId: routedTeacher.id,
        assignedTeacherName: routedTeacher.name,
        teacherAssignmentStatus: 'pending_review',
        profile: {
          id: studentId,
          name: name.trim(),
          email: req.studentUser?.email || 'student@example.com',
          timezone: resolvedTimezone,
          country: country || null,
          learnerType: resolvedLearnerType,
          currentLevel: resolvedLevel,
          gender: resolvedGender,
          teacherGenderPreference: resolvedTeacherPref,
          assignedTeacherId: routedTeacher.id,
          assignedTeacherName: routedTeacher.name,
          teacherAssignmentStatus: 'pending_review',
          onboardingCompleted: true,
          learningInterest: learningInterest || null,
          learningGoal: learningGoal || null,
          learningNeeds: learningNeeds || null,
          canBookForChild: resolvedLearnerType === 'child',
          bookingPreference: resolvedLearnerType === 'child' ? 'child' : 'self',
          linkedChildren: req.studentUser?.studentProfile?.linkedChildren || []
        }
      });
    }

    // 1. Update students row with smart teacher routing assignment
    const studentUpdate: Record<string, any> = {
      name: (resolvedLearnerType === 'child' && parentName ? parentName.trim() : name.trim()),
      learner_type: resolvedLearnerType,
      current_level: resolvedLevel,
      timezone: resolvedTimezone,
      gender: resolvedGender,
      teacher_gender_preference: resolvedTeacherPref,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };
    if (resolvedLearnerType === 'child') {
      studentUpdate.booking_preference = 'child';
      // The parent row is not a learner: its age is the guardian's (checked 18+ above).
      studentUpdate.age = parseAge(guardianAge);
    } else {
      studentUpdate.age = Number(age);
    }
    // Auto-route only on first assignment; never override a teacher an admin already assigned.
    if (routedTeacher.id && !req.studentUser?.studentProfile?.assigned_teacher_id) {
      studentUpdate.assigned_teacher_id = routedTeacher.id;
    }
    if (country) studentUpdate.country = String(country).trim();
    if (whatsapp) studentUpdate.whatsapp = String(whatsapp).trim();
    if (parentWhatsapp && resolvedLearnerType === 'child') studentUpdate.whatsapp = String(parentWhatsapp).trim();
    if (learningInterest) studentUpdate.learning_interest = String(learningInterest).trim();
    if (learningGoal) studentUpdate.learning_goal = String(learningGoal).trim();
    if (learningNeeds) studentUpdate.learning_needs = String(learningNeeds).trim();
    if (isHeardAbout(heardAbout)) studentUpdate.heard_about = heardAbout;

    const { data: updatedStudent, error: updateErr } = await supabaseAdmin
      .from('students')
      .update(studentUpdate)
      .eq('id', studentId)
      .select()
      .single();

    if (updateErr) {
      console.error('[POST /api/student/onboarding DB Error]', updateErr);
      return res.status(500).json({ error: 'Failed to save onboarding information.' });
    }

    // First touch only: an account's lead source is written once and never overwritten.
    const cleanLeadSource = sanitizeLeadSource(leadSource);
    if (cleanLeadSource) {
      const { error: sourceErr } = await supabaseAdmin.from('students').update({ lead_source: cleanLeadSource }).eq('id', studentId).is('lead_source', null);
      if (sourceErr) console.warn('[POST /api/student/onboarding] lead source not saved:', sourceErr.message);
    }

    // 2. Handle child guardian and multiple children if provided
    const effectiveParentName = (parentName || name).trim();
    const effectiveParentPhone = parentWhatsapp ? String(parentWhatsapp).trim() : (whatsapp ? String(whatsapp).trim() : null);
    const parentEmail = (updatedStudent?.email || req.studentUser?.email || '').toLowerCase().trim();

    // Learners to announce to their teachers (first onboarding only, below).
    const newLearners: NewLearner[] = [];

    if (resolvedLearnerType === 'child') {
      if (Array.isArray(children) && children.length > 0) {
        for (const child of children) {
          const childName = (child.name || '').trim();
          if (!childName) continue;

          const childGender = child.gender === 'female' ? 'female' : 'male';
          const childTeacherPref = child.teacherGenderPreference === 'female_teacher'
            ? 'female_teacher'
            : (child.teacherGenderPreference === 'male_teacher' ? 'male_teacher' : 'no_preference');
          const childTargetGender = pickTeacher(child.teacherId)?.gender || (childTeacherPref === 'female_teacher' ? 'female' : (childTeacherPref === 'male_teacher' ? 'male' : (childGender === 'female' ? 'female' : 'male')));
          const childRoutedTeacher = await routeTeacher(child.teacherId, childTargetGender);

          // A client-supplied child id is only honored if this parent is already its guardian;
          // otherwise any student could attach themselves to someone else's child.
          let childStudentId: string | null = null;
          if (child.id && parentEmail) {
            const { data: ownedChild } = await supabaseAdmin
              .from('guardians')
              .select('student_id')
              .eq('student_id', String(child.id))
              .ilike('parent_email', escapeLike(parentEmail))
              .maybeSingle();
            if (!ownedChild) continue;
            childStudentId = ownedChild.student_id;
          }
          if (!childStudentId) {
            const { data: newChild, error: newChildErr } = await supabaseAdmin
              .from('students')
              .insert({
                name: childName,
                learner_type: 'child',
                gender: childGender,
                teacher_gender_preference: childTeacherPref,
                assigned_teacher_id: childRoutedTeacher.id,
                current_level: ['beginner', 'elementary', 'intermediate', 'advanced'].includes(child.currentLevel) ? child.currentLevel : 'beginner',
                learning_interest: child.learningInterest ? String(child.learningInterest).trim() : 'quran-reading',
                country: country ? String(country).trim() : null,
                timezone: resolvedTimezone,
                whatsapp: effectiveParentPhone,
                notes: child.notes ? String(child.notes).trim() : (child.learningNeeds ? String(child.learningNeeds).trim() : null),
                learning_goal: child.learningGoal ? String(child.learningGoal).trim() : null,
                status: 'active',
                age: Number(child.age),
                onboarding_completed: true
              })
              .select('id')
              .single();

            if (newChildErr || !newChild?.id) {
              console.error('[POST /api/student/onboarding] child insert failed', newChildErr?.message);
              return res.status(500).json({ error: `We could not save ${childName}'s profile. Please try again.` });
            }
            childStudentId = newChild.id;
            newLearners.push({
              name: childName,
              age: parseAge(child.age),
              gender: childGender,
              subject: child.learningInterest ? String(child.learningInterest).trim() : 'quran-reading',
              level: child.currentLevel || 'beginner',
              notes: child.notes ? String(child.notes).trim().slice(0, 500) : null,
              teacherId: childRoutedTeacher.id
            });
          }

          if (childStudentId && parentEmail) {
            const { data: existingG } = await supabaseAdmin
              .from('guardians')
              .select('id')
              .eq('student_id', childStudentId)
              .ilike('parent_email', escapeLike(parentEmail))
              .maybeSingle();

            if (!existingG) {
              await supabaseAdmin
                .from('guardians')
                .insert({
                  student_id: childStudentId,
                  parent_name: effectiveParentName,
                  parent_email: parentEmail,
                  parent_whatsapp: effectiveParentPhone,
                  relationship_type: 'parent'
                });
            } else {
              await supabaseAdmin
                .from('guardians')
                .update({
                  parent_name: effectiveParentName,
                  parent_whatsapp: effectiveParentPhone
                })
                .eq('id', existingG.id);
            }
          }
        }
      } else if (parentName && typeof parentName === 'string' && parentName.trim().length > 1) {
        // Fallback for single child legacy flow
        const { data: existingG } = await supabaseAdmin
          .from('guardians')
          .select('id')
          .eq('student_id', studentId)
          .maybeSingle();

        if (existingG) {
          await supabaseAdmin
            .from('guardians')
            .update({
              parent_name: effectiveParentName,
              parent_whatsapp: effectiveParentPhone
            })
            .eq('student_id', studentId);
        } else {
          await supabaseAdmin
            .from('guardians')
            .insert({
              student_id: studentId,
              parent_name: effectiveParentName,
              parent_email: parentEmail,
              parent_whatsapp: effectiveParentPhone,
              relationship_type: 'parent'
            });
        }
      }
    }

    // 3. Save primary learning goal to student_goals if provided
    if (learningGoal && typeof learningGoal === 'string' && learningGoal.trim().length > 0) {
      await supabaseAdmin
        .from('student_goals')
        .insert({
          student_id: studentId,
          goal_text: learningGoal.trim(),
          is_primary: true,
          status: 'in_progress'
        });
    }

    // 4. Safe deterministic legacy guest booking linking during onboarding:
    if (updatedStudent?.email) {
      try {
        await supabaseAdmin
          .from('bookings')
          .update({ student_id: studentId })
          .is('student_id', null)
          .eq('contact_email', updatedStudent.email.toLowerCase().trim());
      } catch (linkErr) {
        console.warn('[Onboarding Claim Bookings Warning]', linkErr);
      }
    }

    let assignedTeacherName = null;
    if (updatedStudent.assigned_teacher_id) {
      const teacherMeta = await resolveTeacherMetadata(updatedStudent.assigned_teacher_id, supabaseAdmin);
      assignedTeacherName = teacherMeta ? teacherMeta.display_name : null;
    }

    // New student: their teacher(s) get an email and an on-site notice with the onboarding details,
    // a lesson chat opens with each teacher, and the super admin is told (owner decision 2026-10-16).
    if (!req.studentUser?.studentProfile?.onboarding_completed) {
      if (resolvedLearnerType === 'adult') {
        newLearners.push({
          name: String(updatedStudent.name || name).trim(),
          age: parseAge(age),
          gender: resolvedGender,
          subject: updatedStudent.learning_interest || null,
          level: resolvedLevel,
          goal: updatedStudent.learning_goal || null,
          notes: updatedStudent.learning_needs || null,
          teacherId: updatedStudent.assigned_teacher_id || null
        });
      }
      const teacherContacts = publicTeachers.length ? publicTeachers : await listPublicTeachers(supabaseAdmin);
      waitUntil(announceNewStudent(
        supabaseAdmin,
        {
          ownerUserId: req.studentUser?.auth_id || null,
          name: String(updatedStudent.name || name).trim(),
          email: parentEmail || null,
          whatsapp: updatedStudent.whatsapp || null,
          country: updatedStudent.country || null,
          timezone: updatedStudent.timezone || null,
          isFamily: resolvedLearnerType === 'child',
          guardianAge: resolvedLearnerType === 'child' ? parseAge(guardianAge) : null
        },
        newLearners,
        teacherContacts.map(t => ({ id: t.id, email: t.email, name: t.nameEn }))
      ));
    }

    // Welcome email, only the first time onboarding is completed (owner request 2026-10-16).
    if (!req.studentUser?.studentProfile?.onboarding_completed && parentEmail) {
      const welcomeTo = parentEmail;
      const childNames = resolvedLearnerType === 'child' && Array.isArray(children)
        ? children.map((c: any) => String(c?.name || '').trim()).filter(Boolean)
        : [];
      waitUntil((async () => {
        try {
          const lang = await resolveEmailLanguage(welcomeTo);
          const mail = renderWelcomeEmail({
            name: String(resolvedLearnerType === 'child' ? (parentName || name) : name).trim(),
            teacherName: assignedTeacherName || routedTeacher.name || null,
            isFamily: resolvedLearnerType === 'child',
            childNames,
            lang
          });
          await sendEmail({ to: welcomeTo, ...mail, from: 'info' });
        } catch (err) {
          console.warn('[Onboarding] welcome email failed', err);
        }
      })());
    }

    // 5. Query updated linked children for response
    let finalLinkedChildren: any[] = [];
    if (parentEmail) {
      const { data: guardiansData } = await supabaseAdmin
        .from('guardians')
        .select('student_id, parent_name, parent_email, students:student_id(id, name, current_level, gender, assigned_teacher_id, learner_type, learning_interest, notes, status, age)')
        .ilike('parent_email', escapeLike(parentEmail));

      const rawC = (guardiansData || []).map((g: any) => g.students).filter(Boolean);
      finalLinkedChildren = await Promise.all(
        rawC.map(async (c: any) => {
          let teacherName = null;
          if (c.assigned_teacher_id) {
            const meta = await resolveTeacherMetadata(c.assigned_teacher_id, supabaseAdmin);
            teacherName = meta ? meta.display_name : null;
          }
          if (!teacherName) {
            teacherName = 'المعلم المختص'; // no assigned teacher yet: never guess one by gender
          }
          return {
            id: c.id,
            name: c.name,
            currentLevel: c.current_level || 'beginner',
            age: c.age ?? null,
            gender: c.gender || 'undisclosed',
            learnerType: c.learner_type || 'child',
            learningInterest: c.learning_interest || null,
            notes: c.notes || null,
            assignedTeacherId: c.assigned_teacher_id || null,
            assignedTeacherName: teacherName,
            status: c.status || 'active'
          };
        })
      );
    }

    return res.json({
      success: true,
      onboardingCompleted: true,
      assignedTeacherId: updatedStudent.assigned_teacher_id || routedTeacher.id,
      assignedTeacherName: assignedTeacherName || routedTeacher.name,
      teacherAssignmentStatus: (updatedStudent as any).teacher_assignment_status || 'pending_review',
      profile: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        timezone: updatedStudent.timezone,
        country: updatedStudent.country || null,
        learnerType: updatedStudent.learner_type,
        currentLevel: updatedStudent.current_level,
        gender: (updatedStudent as any).gender || resolvedGender,
        teacherGenderPreference: (updatedStudent as any).teacher_gender_preference || resolvedTeacherPref,
        assignedTeacherId: updatedStudent.assigned_teacher_id || routedTeacher.id,
        assignedTeacherName: assignedTeacherName || routedTeacher.name,
        teacherAssignmentStatus: (updatedStudent as any).teacher_assignment_status || 'pending_review',
        onboardingCompleted: true,
        learningInterest: updatedStudent.learning_interest,
        learningGoal: updatedStudent.learning_goal,
        learningNeeds: updatedStudent.learning_needs,
        canBookForChild: resolvedLearnerType === 'child' || finalLinkedChildren.length > 0,
        bookingPreference: (resolvedLearnerType === 'child' || finalLinkedChildren.length > 0) ? 'child' : 'self',
        linkedChildren: finalLinkedChildren
      }
    });
  } catch (err: any) {
    console.error('[POST /api/student/onboarding Error]', err);
    return res.status(500).json({ error: 'Internal server error processing onboarding.' });
  }
});

// PATCH /api/student/me - Safely update authenticated student's profile
// PA-02: a parent adds one more child after onboarding. Same rules as onboarding: the account holder is an
// adult (every onboarded account is 18+), the child is 6-17 (src/lib/ageRules.ts), at most 10 children,
// teacher = the one picked (if active) or routed by gender. Never touches the parent's own profile.
app.post('/api/student/children', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    const parentEmail = String(req.studentUser?.email || '').toLowerCase().trim();
    if (!studentId || !parentEmail) return res.status(404).json({ error: 'Student profile not found.' });
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database service unavailable.' });

    const { data: parent } = await supabaseAdmin
      .from('students')
      .select('id, name, whatsapp, country, timezone, onboarding_completed, learner_type')
      .eq('id', studentId)
      .maybeSingle();
    // Children are created without a login, so whoever is signed in is the account holder.
    // (A family account's own row is stored with learner_type 'child'; that is not a child.)
    if (!parent?.onboarding_completed) return res.status(409).json({ error: 'Please finish setting up your account first.' });

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    if (name.length < 2 || name.length > 80) return res.status(422).json({ error: 'Please write the child\'s name (2 to 80 characters).' });
    if (!isChildAge(req.body?.age)) {
      return res.status(422).json({ error: `Each child must be ${CHILD_MIN_AGE} to ${CHILD_MAX_AGE} years old. Learners aged ${ADULT_MIN_AGE} or over open their own account.` });
    }
    const gender = req.body?.gender === 'female' ? 'female' : 'male';
    // Only a subject from the catalogue, and only one of that subject's levels (or beginner).
    const subject = typeof req.body?.learningInterest === 'string' && findSubject(req.body.learningInterest.trim())
      ? req.body.learningInterest.trim()
      : 'quran-reading';
    const subjectLevels = levelsFor(subject).map(l => l.id as string);
    const level = subjectLevels.includes(req.body?.currentLevel) ? req.body.currentLevel : 'beginner';
    const teacherPref = ['male_teacher', 'female_teacher'].includes(req.body?.teacherGenderPreference) ? req.body.teacherGenderPreference : 'no_preference';
    const notes = typeof req.body?.notes === 'string' && req.body.notes.trim() ? req.body.notes.trim().slice(0, 500) : null;

    const learners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);
    // A retry (slow network, second tab) for the same child returns the child already added instead of a duplicate.
    const childIds = learners.filter(l => !l.isPrimary).map(l => l.id);
    if (childIds.length) {
      const { data: sameChild } = await supabaseAdmin
        .from('students')
        .select('id, name, current_level, learning_interest')
        .in('id', childIds)
        .ilike('name', escapeLike(name))
        .eq('age', Number(req.body.age))
        .gte('created_at', new Date(Date.now() - 10 * 60_000).toISOString())
        .limit(1);
      const dup = sameChild?.[0];
      if (dup) return res.status(200).json({ child: { id: dup.id, name: dup.name, currentLevel: dup.current_level, learningInterest: dup.learning_interest }, alreadyAdded: true });
    }
    if (childIds.length >= 10) return res.status(422).json({ error: 'A family account can have up to 10 children.' });

    const publicTeachers = await listPublicTeachers(supabaseAdmin);
    const picked = typeof req.body?.teacherId === 'string' ? publicTeachers.find(t => t.id === req.body.teacherId) : undefined;
    const targetGender: 'male' | 'female' = picked?.gender || (teacherPref === 'female_teacher' ? 'female' : teacherPref === 'male_teacher' ? 'male' : gender);
    const fallback = publicTeachers.find(t => t.gender === targetGender);
    const teacher = picked || fallback
      ? { id: (picked || fallback)!.id }
      : await resolveSmartTeacherRouting(targetGender, supabaseAdmin);

    const { data: child, error: childErr } = await supabaseAdmin
      .from('students')
      .insert({
        name,
        learner_type: 'child',
        gender,
        teacher_gender_preference: teacherPref,
        assigned_teacher_id: teacher.id,
        current_level: level,
        learning_interest: subject,
        country: parent.country || null,
        timezone: parent.timezone || 'UTC',
        whatsapp: parent.whatsapp || null,
        notes,
        status: 'active',
        age: Number(req.body.age),
        onboarding_completed: true
      })
      .select('id, name, current_level, learning_interest, assigned_teacher_id')
      .single();
    if (childErr || !child?.id) {
      console.error('[POST /api/student/children] insert failed', childErr?.message);
      return res.status(500).json({ error: `We could not save ${name}'s profile. Please try again.` });
    }

    const { error: gErr } = await supabaseAdmin.from('guardians').insert({
      student_id: child.id,
      parent_name: parent.name,
      parent_email: parentEmail,
      parent_whatsapp: parent.whatsapp || null,
      relationship_type: 'parent'
    });
    if (gErr) {
      // Without the guardian link the parent could not see or book for the child: undo.
      await supabaseAdmin.from('students').delete().eq('id', child.id);
      console.error('[POST /api/student/children] guardian link failed', gErr.message);
      return res.status(500).json({ error: `We could not save ${name}'s profile. Please try again.` });
    }

    waitUntil(announceNewStudent(
      supabaseAdmin,
      {
        ownerUserId: req.studentUser?.auth_id || null,
        name: parent.name,
        email: parentEmail,
        whatsapp: parent.whatsapp || null,
        country: parent.country || null,
        timezone: parent.timezone || null,
        isFamily: true,
        guardianAge: null
      },
      [{ name, age: parseAge(req.body.age), gender, subject, level, notes, teacherId: teacher.id }],
      publicTeachers.map(t => ({ id: t.id, email: t.email, name: t.nameEn }))
    ));

    return res.status(201).json({ child: { id: child.id, name: child.name, currentLevel: child.current_level, learningInterest: child.learning_interest } });
  } catch (err: any) {
    console.error('[POST /api/student/children]', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

app.patch('/api/student/me', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const { name, timezone, whatsapp, country, parentName, parentWhatsapp, booking_preference, bookingPreference, gender, teacherGenderPreference, teacher_gender_preference } = req.body || {};

    // Validate safe fields only - explicitly reject any attempts to modify forbidden attributes
    const forbiddenFields = [
      'id', 'student_id', 'studentId', 'auth_user_id', 'auth_id', 'status',
      'lead_id', 'notes', 'created_at', 'updated_at', 'current_level', 'role',
      'email', 'onboarding_completed', 'assigned_teacher_id'
    ];
    for (const field of forbiddenFields) {
      if (req.body && req.body[field] !== undefined) {
        return res.status(422).json({ error: `Modification of field '${field}' is strictly forbidden.` });
      }
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(422).json({ error: 'Name must be at least 2 characters long.' });
      }
      updatePayload.name = name.trim();
    }

    if (timezone !== undefined) {
      if (typeof timezone !== 'string' || !DateTime.now().setZone(timezone.trim()).isValid) {
        return res.status(422).json({ error: `Invalid IANA timezone identifier: '${timezone}'.` });
      }
      updatePayload.timezone = timezone.trim();
    }

    if (whatsapp !== undefined) {
      updatePayload.whatsapp = typeof whatsapp === 'string' ? whatsapp.trim() : null;
    }

    if (country !== undefined) {
      updatePayload.country = typeof country === 'string' ? country.trim() : null;
    }

    if (gender !== undefined) {
      if (!['male', 'female', 'undisclosed'].includes(gender)) {
        return res.status(422).json({ error: "Invalid gender. Must be 'male', 'female', or 'undisclosed'." });
      }
      updatePayload.gender = gender;
    }

    const rawTeacherPref = teacherGenderPreference !== undefined ? teacherGenderPreference : teacher_gender_preference;
    if (rawTeacherPref !== undefined) {
      if (!['no_preference', 'male_teacher', 'female_teacher'].includes(rawTeacherPref)) {
        return res.status(422).json({ error: "Invalid teacher preference. Must be 'no_preference', 'male_teacher', or 'female_teacher'." });
      }
      updatePayload.teacher_gender_preference = rawTeacherPref;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();

    // Booking preference validation & persistence
    const rawBookingPref = booking_preference !== undefined ? booking_preference : bookingPreference;
    if (rawBookingPref !== undefined) {
      if (rawBookingPref !== 'self' && rawBookingPref !== 'child') {
        return res.status(422).json({ error: "Invalid booking preference. Must be 'self' or 'child'." });
      }

      // Same eligibility rule as GET /api/student/me: a child with a guardian, or a parent with linked children.
      if (rawBookingPref === 'child') {
        let canBookForChild = false;
        if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
          const mp = req.studentUser?.studentProfile;
          canBookForChild = mp?.canBookForChild ?? (
            mp?.learner_type === 'child' ||
            Boolean(mp?.guardian) ||
            Boolean(mp?.linkedChildren && mp.linkedChildren.length > 0)
          );
        } else {
          const [studentCheck, guardianCheck, parentCheck] = await Promise.all([
            supabaseAdmin.from('students').select('learner_type').eq('id', studentId).maybeSingle(),
            supabaseAdmin.from('guardians').select('student_id').eq('student_id', studentId).maybeSingle(),
            supabaseAdmin.from('guardians').select('student_id').ilike('parent_email', escapeLike((req.studentUser?.email || '').trim())).limit(1)
          ]);
          const isChildWithGuardian = studentCheck.data?.learner_type === 'child' && Boolean(guardianCheck.data);
          const isParentOfChild = Boolean(parentCheck.data && parentCheck.data.length > 0);
          canBookForChild = isChildWithGuardian || isParentOfChild;
        }
        if (!canBookForChild) {
          return res.status(422).json({
            error: 'Account has no linked child relationship. Booking preference cannot be set to child.'
          });
        }
      }

      updatePayload.booking_preference = rawBookingPref;
    }

    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentProfile) {
        if (updatePayload.name) req.studentUser.studentProfile.name = updatePayload.name;
        if (updatePayload.timezone) req.studentUser.studentProfile.timezone = updatePayload.timezone;
        if (updatePayload.whatsapp !== undefined) req.studentUser.studentProfile.whatsapp = updatePayload.whatsapp;
        if (updatePayload.country !== undefined) req.studentUser.studentProfile.country = updatePayload.country;
        if (updatePayload.gender !== undefined) req.studentUser.studentProfile.gender = updatePayload.gender;
        if (updatePayload.teacher_gender_preference !== undefined) {
          req.studentUser.studentProfile.teacher_gender_preference = updatePayload.teacher_gender_preference;
        }
        if (updatePayload.booking_preference !== undefined) {
          req.studentUser.studentProfile.booking_preference = updatePayload.booking_preference;
          req.studentUser.studentProfile.bookingPreference = updatePayload.booking_preference;
          const authHeader = req.headers.authorization;
          const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
          if (!isProd && token && devStudentProfiles[token]) {
            devStudentProfiles[token].studentProfile.booking_preference = updatePayload.booking_preference;
            devStudentProfiles[token].studentProfile.bookingPreference = updatePayload.booking_preference;
          }
        }
      }
      return res.json({
        id: studentId,
        name: updatePayload.name || req.studentUser?.name || 'Student',
        email: req.studentUser?.email || 'student@example.com',
        whatsapp: updatePayload.whatsapp || null,
        country: updatePayload.country || null,
        timezone: updatePayload.timezone || req.studentUser?.studentProfile?.timezone || 'UTC',
        learnerType: req.studentUser?.studentProfile?.learner_type || 'adult',
        currentLevel: req.studentUser?.studentProfile?.current_level || 'beginner',
        gender: updatePayload.gender || req.studentUser?.studentProfile?.gender || 'undisclosed',
        teacherGenderPreference: updatePayload.teacher_gender_preference || req.studentUser?.studentProfile?.teacher_gender_preference || 'no_preference',
        assignedTeacherId: req.studentUser?.studentProfile?.assigned_teacher_id || null,
        assignedTeacherName: req.studentUser?.studentProfile?.assigned_teacher_name || null,
        teacherAssignmentStatus: req.studentUser?.studentProfile?.teacher_assignment_status || 'pending_review',
        bookingPreference: updatePayload.booking_preference || req.studentUser?.studentProfile?.booking_preference || 'self',
        status: req.studentUser?.studentProfile?.status || 'active',
        updatedAt: new Date().toISOString()
      });
    }

    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('students')
      .update(updatePayload)
      .eq('id', studentId)
      .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, booking_preference, created_at, updated_at, gender, teacher_gender_preference, assigned_teacher_id')
      .single();

    if (updateError || !updatedStudent) {
      console.error('[PATCH /api/student/me DB Error]', updateError);
      return res.status(500).json({ error: 'Failed to update student profile.' });
    }

    // Handle guardian updates if provided for child learner
    if (parentName !== undefined || parentWhatsapp !== undefined) {
      const { data: existingGuardian } = await supabaseAdmin
        .from('guardians')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingGuardian) {
        const guardianPayload: Record<string, any> = {};
        if (parentName !== undefined) guardianPayload.parent_name = String(parentName).trim();
        if (parentWhatsapp !== undefined) guardianPayload.parent_whatsapp = String(parentWhatsapp).trim();
        await supabaseAdmin
          .from('guardians')
          .update(guardianPayload)
          .eq('student_id', studentId);
      }
    }

    let assignedTeacherName = null;
    if (updatedStudent.assigned_teacher_id) {
      const teacherMeta = await resolveTeacherMetadata(updatedStudent.assigned_teacher_id, supabaseAdmin);
      assignedTeacherName = teacherMeta ? teacherMeta.display_name : null;
    }

    return res.json({
      id: updatedStudent.id,
      name: updatedStudent.name,
      email: updatedStudent.email,
      whatsapp: updatedStudent.whatsapp,
      country: updatedStudent.country,
      timezone: updatedStudent.timezone,
      learnerType: updatedStudent.learner_type,
      currentLevel: updatedStudent.current_level,
      bookingPreference: (updatedStudent as any).booking_preference || 'self',
      status: updatedStudent.status,
      gender: updatedStudent.gender || 'undisclosed',
      teacherGenderPreference: updatedStudent.teacher_gender_preference || 'no_preference',
      assignedTeacherId: updatedStudent.assigned_teacher_id || null,
      assignedTeacherName,
      teacherAssignmentStatus: (updatedStudent as any).teacher_assignment_status || 'pending_review',
      updatedAt: updatedStudent.updated_at
    });
  } catch (err: any) {
    console.error('[PATCH /api/student/me Error]', err);
    return res.status(500).json({ error: 'Internal server error updating student profile.' });
  }
});

// GET /api/student/bookings - Retrieve authenticated student's bookings (pure read-only)
app.get('/api/student/bookings', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.json([]);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentBookings) {
        return res.json(req.studentUser.studentBookings);
      }
      return res.json([]);
    }

    // Bookings of this account and its linked children (the same learners the cancel/reschedule routes accept).
    const learners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);
    const learnerIds = learners.length ? learners.map(l => l.id) : [studentId];
    const learnerNameById = new Map(learners.map(l => [l.id, l.name]));
    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, student_id, reference_code, service_id, package_entitlement_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, contact_whatsapp, parent_name, notes, fee_amount_usd, zoom_meeting_link, created_at, teacher_id, reschedule_count, payment_plan, reschedule_requested_at, reschedule_request_note')
      .in('student_id', learnerIds)
      .order('scheduled_start', { ascending: true });

    if (bookingsError) {
      console.error('[GET /api/student/bookings DB Error]', bookingsError);
      return res.status(500).json({ error: 'Failed to retrieve student bookings.' });
    }

    // Resolve services metadata safely
    const serviceIds = Array.from(new Set((bookingsData || []).map((b: any) => b.service_id).filter(Boolean)));
    const serviceMap = new Map<string, any>();

    if (serviceIds.length > 0) {
      const { data: servicesData } = await supabaseAdmin
        .from('services')
        .select('id, title, arabic_title')
        .in('id', serviceIds);

      if (servicesData) {
        for (const s of servicesData) {
          serviceMap.set(s.id, s);
        }
      }
    }

    // Resolve package entitlement metadata safely (batched, 0 N+1)
    const pkgEntitlementIds = Array.from(new Set((bookingsData || []).map((b: any) => b.package_entitlement_id).filter(Boolean)));
    const packageMap = new Map<string, any>();

    if (pkgEntitlementIds.length > 0) {
      const { data: entRows } = await supabaseAdmin
        .from('package_entitlements')
        .select('id, package_catalog_id, package_catalog:package_catalog_id(id, name, package_type)')
        .in('id', pkgEntitlementIds);

      if (entRows) {
        for (const ent of entRows) {
          const cat: any = Array.isArray(ent.package_catalog) ? ent.package_catalog[0] : ent.package_catalog;
          packageMap.set(ent.id, {
            packageName: cat?.name || 'Lesson Package',
            packageType: cat?.package_type || 'monthly'
          });
        }
      }
    }

    // Map to a clean, coherent DTO that matches both the new explicit contract and legacy fields
    // ST-01 lesson-day card: the teacher's display name and, per learner, the latest "next steps" the teacher
    // shared with the family (the same field the progress page shows; never private notes).
    const nowIso = new Date().toISOString();
    const upcomingRows = (bookingsData || []).filter((b: any) => ['confirmed', 'rescheduled'].includes(b.status) && b.scheduled_end > nowIso);
    const teacherIds = Array.from(new Set(upcomingRows.map((b: any) => b.teacher_id).filter(Boolean))) as string[];
    const [teacherMetas, { data: nextStepRows }] = await Promise.all([
      Promise.all(teacherIds.map(async (tid) => [tid, await resolveTeacherMetadata(tid, supabaseAdmin)] as const)),
      upcomingRows.length
        ? supabaseAdmin
            .from('lesson_notes')
            .select('student_id, next_steps, created_at')
            .in('student_id', learnerIds)
            .not('next_steps', 'is', null)
            .order('created_at', { ascending: false })
            .limit(50)
        : Promise.resolve({ data: [] as any[] })
    ]);
    const teacherNameById = new Map<string, string | null>(teacherMetas.map(([tid, m]) => [tid, m?.display_name || null]));
    const nextStepsByStudent = new Map<string, string>();
    for (const n of nextStepRows || []) {
      const text = String(n.next_steps || '').trim();
      if (text && !nextStepsByStudent.has(n.student_id)) nextStepsByStudent.set(n.student_id, text.slice(0, 400));
    }

    const formattedBookings = (bookingsData || []).map((b: any) => {
      const isUpcoming = ['confirmed', 'rescheduled'].includes(b.status) && b.scheduled_end > nowIso;
      const s = serviceMap.get(b.service_id);
      const serviceTitle = s?.title || 'Lesson';
      const zoomUrl = (b.zoom_meeting_link && typeof b.zoom_meeting_link === 'string' && b.zoom_meeting_link.trim().length > 0)
        ? b.zoom_meeting_link.trim()
        : null;

      const pkgInfo = b.package_entitlement_id ? packageMap.get(b.package_entitlement_id) : null;

      return {
        id: b.id,
        studentId: b.student_id,
        learnerName: learnerNameById.get(b.student_id) || null,
        referenceCode: b.reference_code,
        serviceId: b.service_id,
        serviceTitle,
        serviceArabicTitle: s?.arabic_title || '',
        bookingType: b.booking_type,
        scheduledStart: b.scheduled_start,
        scheduledEnd: b.scheduled_end,
        durationMinutes: b.duration_minutes,
        studentTimezone: b.student_timezone,
        status: b.status,
        contactName: b.contact_name || null,
        contactEmail: b.contact_email || null,
        contactWhatsapp: b.contact_whatsapp || null,
        parentName: b.parent_name || null,
        notes: b.notes || null,
        feeAmountUsd: b.fee_amount_usd,
        zoomMeetingLink: zoomUrl,
        packageEntitlementId: b.package_entitlement_id || null,
        teacherId: b.teacher_id || null,
        teacherName: isUpcoming && b.teacher_id ? teacherNameById.get(b.teacher_id) || null : null,
        prepareNote: isUpcoming ? nextStepsByStudent.get(b.student_id) || null : null,
        rescheduleCount: b.reschedule_count || 0,
        rescheduleRequestedAt: b.reschedule_requested_at || null,
        rescheduleRequestNote: b.reschedule_request_note || null,
        paymentPlan: b.payment_plan || 'pay_now',
        packageName: pkgInfo?.packageName || (b.package_entitlement_id ? 'Lesson Package' : null),
        packageType: pkgInfo?.packageType || (b.package_entitlement_id ? 'monthly' : null),
        isPackageBooking: Boolean(b.package_entitlement_id),
        // Harmonized contract aliases for UI compatibility
        lesson_date: b.scheduled_start,
        duration: b.duration_minutes,
        zoom_join_url: zoomUrl,
        services: {
          title: serviceTitle,
          arabic_title: s?.arabic_title || ''
        },
        createdAt: b.created_at
      };
    });

    return res.json(formattedBookings);
  } catch (err: any) {
    console.error('[GET /api/student/bookings Error]', err);
    return res.status(500).json({ error: 'Internal server error retrieving student bookings.' });
  }
});

// Helper: resolve authorized learners for a student account (self + linked children)
async function getAuthorizedLearnersForStudent(supabaseAdmin: any, req: any) {
  const studentId = req.studentUser?.student_id;
  const userEmail = (req.studentUser?.email || '').trim().toLowerCase();
  const learners: Array<{ id: string; name: string; learnerType: string; isPrimary: boolean }> = [];

  if (!supabaseAdmin) {
    if (studentId) {
      learners.push({
        id: studentId,
        name: req.studentUser?.name || 'Student',
        learnerType: req.studentUser?.studentProfile?.learner_type || 'adult',
        isPrimary: true
      });
    }
    if (Array.isArray(req.studentUser?.studentProfile?.linkedChildren)) {
      for (const child of req.studentUser.studentProfile.linkedChildren) {
        if (child?.id && !learners.some(l => l.id === child.id)) {
          learners.push({
            id: child.id,
            name: child.name || 'Child',
            learnerType: 'child',
            isPrimary: false
          });
        }
      }
    }
    return learners;
  }

  // 1. Primary student
  if (studentId) {
    const studentName = req.studentUser?.name || req.studentUser?.studentProfile?.name || 'Student';
    const learnerType = req.studentUser?.studentProfile?.learner_type || 'adult';
    learners.push({
      id: studentId,
      name: studentName,
      learnerType,
      isPrimary: true
    });
  }

  // 2. Linked children via guardians table
  if (userEmail) {
    try {
      const { data: guardianRows } = await supabaseAdmin
        .from('guardians')
        .select('student_id, parent_name, parent_email, students:student_id(id, name, learner_type, current_level)')
        .ilike('parent_email', escapeLike(userEmail));

      if (guardianRows) {
        for (const g of guardianRows) {
          const child = g.students;
          if (child && child.id && !learners.some(l => l.id === child.id)) {
            learners.push({
              id: child.id,
              name: child.name || 'Child',
              learnerType: child.learner_type || 'child',
              isPrimary: false
            });
          }
        }
      }
    } catch (gErr: any) {
      console.warn('[getAuthorizedLearnersForStudent Warning]', gErr.message);
    }
  }

  return learners;
}

// GET /api/student/packages - Retrieve authenticated student's package entitlements & active catalog & eligible learners
app.get('/api/student/packages', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    const authUserId = req.studentUser?.auth_id;

    if (!studentId && !authUserId) {
      return res.json({ entitlements: [], catalog: [], creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 }, learners: [] });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const authorizedLearners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);

    if (!supabaseAdmin) {
      // The server/DB package catalog is the SINGLE source of truth for package
      // prices, currency and lesson counts. When it is unavailable we MUST NOT
      // fabricate package rows or prices. Return a truthful unavailable state.
      console.warn('[GET /api/student/packages] Supabase unavailable — no synthetic catalog returned.');
      return res.status(503).json({
        error: 'Packages are temporarily unavailable. Please try again shortly.',
        error_ar: 'الباقات غير متاحة حالياً. حاول مرة أخرى بعد قليل.',
        code: 'PACKAGE_CATALOG_UNAVAILABLE',
        catalogAvailable: false,
        entitlements: [],
        catalog: [],
        creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 },
        learners: [],
      });
    }

    // 1. Fetch available package catalog (authoritative source of truth)
    const { data: catalogData, error: catalogError } = await supabaseAdmin
      .from('package_catalog')
      .select('id, package_type, name, lesson_count, price_amount, currency, is_active, eligibility_rules')
      .eq('is_active', true)
      .order('price_amount', { ascending: true });

    if (catalogError) {
      // Catalog read failed: fail truthfully, never fabricate prices.
      console.warn('[GET /api/student/packages] Catalog read failed:', catalogError.message);
      return res.status(503).json({
        error: 'Packages are temporarily unavailable. Please try again shortly.',
        error_ar: 'الباقات غير متاحة حالياً. حاول مرة أخرى بعد قليل.',
        code: 'PACKAGE_CATALOG_UNAVAILABLE',
        catalogAvailable: false,
        entitlements: [],
        catalog: [],
        creditSummary: { totalRemaining: 0, totalPurchased: 0, totalUsed: 0 },
        learners: authorizedLearners,
      });
    }

    // 2. Build entitlement filter for purchaser account and all authorized learners
    const authorizedStudentIds = authorizedLearners.map(l => l.id).filter(Boolean);
    const learnerFilterParts = authorizedStudentIds.map(id => `learner_student_id.eq.${id}`);

    let entitlementFilter = '';
    if (authUserId) {
      entitlementFilter = `purchaser_account_id.eq.${authUserId}`;
      if (learnerFilterParts.length > 0) {
        entitlementFilter += `,${learnerFilterParts.join(',')}`;
      }
    } else if (learnerFilterParts.length > 0) {
      entitlementFilter = learnerFilterParts.join(',');
    }

    const { data: entitlementsData, error: entErr } = await supabaseAdmin
      .from('package_entitlements')
      .select('id, package_catalog_id, purchaser_account_id, learner_student_id, status, purchased_quantity, remaining_credits, price_paid, currency, payment_reference, metadata, created_at, updated_at')
      .or(entitlementFilter)
      .order('created_at', { ascending: false });

    if (entErr) {
      console.warn('[GET /api/student/packages DB Warning]', entErr.message);
    }

    // Map catalog metadata to entitlements
    const catalogMap = new Map<string, any>();
    for (const item of catalogData || []) {
      catalogMap.set(item.id, item);
    }

    // Build learner names map
    const learnerNameMap = new Map<string, string>();
    for (const l of authorizedLearners) {
      learnerNameMap.set(l.id, l.name);
    }

    // Resolve any remaining learner student IDs that weren't in authorizedLearners
    const unmappedLearnerIds = Array.from(new Set(
      (entitlementsData || [])
        .map((e: any) => e.learner_student_id)
        .filter((id: any) => Boolean(id) && !learnerNameMap.has(id))
    ));

    if (unmappedLearnerIds.length > 0) {
      const { data: extraStudents } = await supabaseAdmin
        .from('students')
        .select('id, name')
        .in('id', unmappedLearnerIds);
      if (extraStudents) {
        for (const es of extraStudents) {
          learnerNameMap.set(es.id, es.name);
        }
      }
    }

    const formattedEntitlements = (entitlementsData || []).map((ent: any) => {
      const cat = catalogMap.get(ent.package_catalog_id);
      const isCredit = ent.metadata?.source === 'cancellation_credit';
      return {
        id: ent.id,
        packageCatalogId: ent.package_catalog_id,
        packageName: isCredit ? 'Lesson credit (cancelled lesson)' : (cat?.name || 'Lesson Package'),
        packageNameAr: isCredit ? 'رصيد حصة (من حصة ملغاة)' : (cat?.eligibility_rules?.name_ar || null),
        isCredit,
        refundRequestedAt: ent.metadata?.refund_requested_at || null,
        durationMinutes: ent.metadata?.duration_minutes ?? cat?.eligibility_rules?.duration_minutes ?? null,
        hourlyRate: ent.metadata?.hourly_rate ?? cat?.eligibility_rules?.hourly_rate ?? null,
        packageType: cat?.package_type || 'monthly',
        status: ent.status, // 'pending_payment' | 'active' | 'exhausted' | 'cancelled'
        purchasedQuantity: ent.purchased_quantity || 0,
        remainingCredits: ent.remaining_credits || 0,
        pricePaid: ent.price_paid,
        // PA-04: the family care saving the server applied (catalogue price minus what was charged).
        familySaving: ent.metadata?.family_discount && cat?.price_amount != null
          ? Math.max(0, Math.round((Number(cat.price_amount) - Number(ent.price_paid)) * 100) / 100) || null
          : null,
        currency: ent.currency || 'USD',
        paymentReference: ent.payment_reference || null,
        learnerStudentId: ent.learner_student_id || null,
        learnerName: ent.learner_student_id ? (learnerNameMap.get(ent.learner_student_id) || null) : null,
        createdAt: ent.created_at,
        updatedAt: ent.updated_at
      };
    });

    // Compute credit summary
    let totalRemaining = 0;
    let totalPurchased = 0;

    for (const e of formattedEntitlements) {
      if (e.status === 'active') {
        totalRemaining += e.remainingCredits;
      }
      if (e.status === 'active' || e.status === 'exhausted') {
        totalPurchased += e.purchasedQuantity;
      }
    }

    const totalUsed = Math.max(0, totalPurchased - totalRemaining);

    return res.json({
      entitlements: formattedEntitlements,
      catalog: catalogData || [],
      creditSummary: {
        totalRemaining,
        totalPurchased,
        totalUsed
      },
      learners: authorizedLearners
    });
  } catch (err: any) {
    console.error('[GET /api/student/packages Error]', err);
    return res.status(500).json({ error: 'Internal server error retrieving student packages.' });
  }
});

// POST /api/student/packages/select - Initiate package purchase with multi-child learner support
app.post('/api/student/packages/select', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    const authUserId = req.studentUser?.auth_id;

    if (!authUserId) {
      return res.status(403).json({ error: 'Authenticated account required to purchase packages.' });
    }

    const { packageCatalogId, learnerStudentId } = req.body;
    if (!packageCatalogId || typeof packageCatalogId !== 'string') {
      return res.status(400).json({ error: 'Valid packageCatalogId is required.' });
    }
    if (req.body?.acceptedTerms !== true) {
      return res.status(400).json({ error: 'Please read and accept the terms and the cancellation & refund policy first.', code: 'TERMS_REQUIRED' });
    }
    if (req.body?.acceptedEarlyStart !== true) {
      return res.status(400).json({ error: 'Please confirm that you want lessons to start before the 14-day withdrawal period ends.', code: 'EARLY_START_REQUIRED' });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const authorizedLearners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);

    // Validate learner ownership / authorization
    let targetLearnerId: string | null = studentId || null;
    if (learnerStudentId) {
      const isAuthorized = authorizedLearners.some(l => l.id === learnerStudentId);
      if (!isAuthorized) {
        return res.status(403).json({
          error: 'Unauthorized learner selection. You can only purchase packages for your own account or authorized learners.'
        });
      }
      targetLearnerId = learnerStudentId;
    }

    if (!supabaseAdmin) {
      return res.json({
        success: true,
        entitlement: {
          id: 'dev-entitlement-' + Date.now(),
          package_catalog_id: packageCatalogId,
          learner_student_id: targetLearnerId,
          status: 'pending_payment',
          purchased_quantity: 4,
          remaining_credits: 0,
          price_paid: 80,
          currency: 'USD'
        },
        message: 'Package entitlement created. Please submit your payment reference for verification.'
      });
    }

    // 1. Fetch package from catalog
    const { data: catalogItem, error: catErr } = await supabaseAdmin
      .from('package_catalog')
      .select('id, name, package_type, lesson_count, price_amount, currency, is_active, eligibility_rules')
      .eq('id', packageCatalogId)
      .eq('is_active', true)
      .maybeSingle();

    if (catErr || !catalogItem) {
      return res.status(404).json({ error: 'Package not found or currently inactive.' });
    }

    // RULES.md §4 family care: 5% off a package for a second (third, ...) child of the same account,
    // i.e. when this account already has an active paid package for a different learner.
    const { data: siblingPackages } = await supabaseAdmin
      .from('package_entitlements')
      .select('id, learner_student_id, metadata')
      .eq('purchaser_account_id', authUserId)
      .eq('status', 'active')
      .gt('price_paid', 0);
    const familyDiscount = (siblingPackages || []).some((e: any) =>
      e.learner_student_id && e.learner_student_id !== targetLearnerId && e.metadata?.source !== 'cancellation_credit');
    const pricePaid = familyDiscount
      ? Math.round(Number(catalogItem.price_amount) * 0.95 * 100) / 100
      : Number(catalogItem.price_amount);

    // 2. Create pending entitlement row
    const { data: newEntitlement, error: insertErr } = await supabaseAdmin
      .from('package_entitlements')
      .insert({
        package_catalog_id: catalogItem.id,
        purchaser_account_id: authUserId,
        learner_student_id: targetLearnerId,
        status: 'pending_payment',
        purchased_quantity: catalogItem.lesson_count,
        remaining_credits: 0, // Credits are 0 until payment is confirmed by teacher
        price_paid: pricePaid,
        currency: catalogItem.currency || 'USD',
        metadata: {
          hourly_rate: catalogItem.eligibility_rules?.hourly_rate ?? null,
          duration_minutes: catalogItem.eligibility_rules?.duration_minutes ?? null,
          family_discount: familyDiscount,
          terms_version: TERMS_VERSION,
          terms_accepted_at: new Date().toISOString(),
          early_start_accepted_at: new Date().toISOString()
        }
      })
      .select('id, package_catalog_id, learner_student_id, status, purchased_quantity, remaining_credits, price_paid, currency, created_at')
      .single();

    if (insertErr || !newEntitlement) {
      console.error('[POST /api/student/packages/select Insert Error]', insertErr);
      return res.status(500).json({ error: 'Failed to create package entitlement.' });
    }

    return res.status(201).json({
      success: true,
      entitlement: newEntitlement,
      package: catalogItem,
      familyDiscount,
      familySaving: familyDiscount ? Math.round((Number(catalogItem.price_amount) - pricePaid) * 100) / 100 : null,
      message: 'Package entitlement created. Please submit your payment reference to activate your credits.'
    });
  } catch (err: any) {
    console.error('[POST /api/student/packages/select Error]', err);
    return res.status(500).json({ error: 'Internal server error selecting package.' });
  }
});

// GET /api/student/packages/ledger - Retrieve authenticated student's credit ledger history
app.get('/api/student/packages/ledger', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    const authUserId = req.studentUser?.auth_id;

    if (!studentId && !authUserId) {
      return res.json({ ledger: [] });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    const authorizedLearners = await getAuthorizedLearnersForStudent(supabaseAdmin, req);

    if (!supabaseAdmin) {
      return res.json({
        ledger: [
          {
            id: 'dev-ledger-001',
            packageEntitlementId: 'dev-entitlement-001',
            bookingId: 'dev-booking-001',
            bookingReference: 'MHM-100234',
            activityType: 'completed_consumed',
            deltaCredits: -1,
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            learnerStudentId: studentId,
            learnerName: req.studentUser?.name || 'Student',
            packageName: '4-Lesson Foundation Package'
          },
          {
            id: 'dev-ledger-002',
            packageEntitlementId: 'dev-entitlement-001',
            bookingId: null,
            bookingReference: null,
            activityType: 'grant',
            deltaCredits: 4,
            createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
            learnerStudentId: studentId,
            learnerName: req.studentUser?.name || 'Student',
            packageName: '4-Lesson Foundation Package'
          }
        ]
      });
    }

    // 1. Resolve authorized entitlement IDs
    const authorizedStudentIds = authorizedLearners.map(l => l.id).filter(Boolean);
    const learnerFilterParts = authorizedStudentIds.map(id => `learner_student_id.eq.${id}`);

    let entitlementFilter = '';
    if (authUserId) {
      entitlementFilter = `purchaser_account_id.eq.${authUserId}`;
      if (learnerFilterParts.length > 0) {
        entitlementFilter += `,${learnerFilterParts.join(',')}`;
      }
    } else if (learnerFilterParts.length > 0) {
      entitlementFilter = learnerFilterParts.join(',');
    }

    const { data: entitlements, error: entErr } = await supabaseAdmin
      .from('package_entitlements')
      .select('id, package_catalog_id, learner_student_id, package_catalog:package_catalog_id(id, name)')
      .or(entitlementFilter);

    if (entErr) {
      console.warn('[GET /api/student/packages/ledger DB Warning]', entErr.message);
    }

    const entitlementIds = (entitlements || []).map((e: any) => e.id);
    if (entitlementIds.length === 0) {
      return res.json({ ledger: [] });
    }

    // Map package catalog names by entitlement ID
    const entitlementNameMap = new Map<string, string>();
    for (const ent of entitlements || []) {
      const cat: any = Array.isArray(ent.package_catalog) ? ent.package_catalog[0] : ent.package_catalog;
      entitlementNameMap.set(ent.id, cat?.name || 'Lesson Package');
    }

    // 2. Query credit ledger strictly for authorized entitlements
    const { data: ledgerRows, error: ledgerErr } = await supabaseAdmin
      .from('package_credit_ledger')
      .select('id, package_entitlement_id, booking_id, learner_student_id, activity_type, delta_credits, created_at')
      .in('package_entitlement_id', entitlementIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ledgerErr) {
      console.error('[GET /api/student/packages/ledger Error]', ledgerErr);
      return res.status(500).json({ error: 'Failed to retrieve credit history.' });
    }

    // 3. Batch resolve booking references and learner names
    const bookingIds = Array.from(new Set((ledgerRows || []).map((r: any) => r.booking_id).filter(Boolean)));
    const bookingMap = new Map<string, any>();

    if (bookingIds.length > 0) {
      const { data: bookingsData } = await supabaseAdmin
        .from('bookings')
        .select('id, reference_code')
        .in('id', bookingIds);

      if (bookingsData) {
        for (const b of bookingsData) {
          bookingMap.set(b.id, b);
        }
      }
    }

    const learnerNameMap = new Map<string, string>();
    for (const l of authorizedLearners) {
      learnerNameMap.set(l.id, l.name);
    }

    const extraLearnerIds = Array.from(new Set(
      (ledgerRows || [])
        .map((r: any) => r.learner_student_id)
        .filter((id: any) => Boolean(id) && !learnerNameMap.has(id))
    ));

    if (extraLearnerIds.length > 0) {
      const { data: extraStudents } = await supabaseAdmin
        .from('students')
        .select('id, name')
        .in('id', extraLearnerIds);
      if (extraStudents) {
        for (const es of extraStudents) {
          learnerNameMap.set(es.id, es.name);
        }
      }
    }

    // 4. Format clean, safe student-facing DTO (no internal secrets or idempotency keys)
    const formattedLedger = (ledgerRows || []).map((row: any) => {
      const booking = row.booking_id ? bookingMap.get(row.booking_id) : null;
      return {
        id: row.id,
        packageEntitlementId: row.package_entitlement_id,
        bookingId: row.booking_id || null,
        bookingReference: booking?.reference_code || null,
        activityType: row.activity_type,
        deltaCredits: Number(row.delta_credits) || 0,
        createdAt: row.created_at,
        learnerStudentId: row.learner_student_id || null,
        learnerName: row.learner_student_id ? (learnerNameMap.get(row.learner_student_id) || null) : null,
        packageName: entitlementNameMap.get(row.package_entitlement_id) || null
      };
    });

    return res.json({ ledger: formattedLedger });
  } catch (err: any) {
    console.error('[GET /api/student/packages/ledger Error]', err);
    return res.status(500).json({ error: 'Internal server error retrieving credit ledger.' });
  }
});

// GET /api/student/payments - Retrieve authenticated student's payment history
app.get('/api/student/payments', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;

    // Without a student record there is nothing to scope the query to; never run it unfiltered.
    if (!studentId) {
      return res.json({ payments: [] });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.json({ payments: [] });
    }

    // Fetch payments associated with student or their bookings
    const query = supabaseAdmin
      .from('payments')
      .select(`
        id,
        booking_id,
        entitlement_id,
        student_id,
        amount,
        currency,
        payment_method,
        payment_reference,
        status,
        notes,
        created_at,
        updated_at
      `)
      .eq('student_id', studentId);

    const { data: paymentsData, error: paymentsErr } = await query.order('created_at', { ascending: false });

    if (paymentsErr) {
      console.warn('[GET /api/student/payments DB Error]', paymentsErr.message);
      return res.json({ payments: [] });
    }

    // Resolve booking and package names for each payment
    const bookingIds = (paymentsData || []).map((p: any) => p.booking_id).filter(Boolean);
    const entitlementIds = (paymentsData || []).map((p: any) => p.entitlement_id).filter(Boolean);

    const bookingMap = new Map<string, any>();
    if (bookingIds.length > 0) {
      const { data: bData } = await supabaseAdmin
        .from('bookings')
        .select('id, reference_code, service_id, scheduled_start')
        .in('id', bookingIds);
      for (const b of bData || []) {
        bookingMap.set(b.id, b);
      }
    }

    const entitlementMap = new Map<string, any>();
    if (entitlementIds.length > 0) {
      const { data: eData } = await supabaseAdmin
        .from('package_entitlements')
        .select('id, package_catalog_id, purchased_quantity, package_catalog ( name )')
        .in('id', entitlementIds);
      for (const e of eData || []) {
        entitlementMap.set(e.id, e);
      }
    }

    const formattedPayments = (paymentsData || []).map((p: any) => {
      let itemDescription = 'Lesson Fee';
      let referenceIdentifier = p.payment_reference || '';

      if (p.booking_id && bookingMap.has(p.booking_id)) {
        const b = bookingMap.get(p.booking_id);
        itemDescription = `Lesson (${b.reference_code})`;
        if (!referenceIdentifier) referenceIdentifier = b.reference_code;
      } else if (p.entitlement_id && entitlementMap.has(p.entitlement_id)) {
        const e = entitlementMap.get(p.entitlement_id);
        const name = (e as any).package_catalog?.name || 'Lesson Package';
        itemDescription = `${name} (${e.purchased_quantity} credits)`;
      }

      return {
        id: p.id,
        bookingId: p.booking_id,
        entitlementId: p.entitlement_id,
        amount: p.amount,
        currency: p.currency || 'USD',
        paymentMethod: p.payment_method,
        paymentReference: p.payment_reference,
        status: p.status, // 'pending' | 'confirmed' | 'rejected'
        notes: p.notes,
        itemDescription,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      };
    });

    return res.json({ payments: formattedPayments });
  } catch (err: any) {
    console.error('[GET /api/student/payments Error]', err);
    return res.status(500).json({ error: 'Internal server error retrieving student payments.' });
  }
});


// ====================================================================
// PHASE 05 — AI INTAKE + INTELLIGENT PRICING
// Flow: understand → assess → summarize → recommend → teacher review → offer
//
// Security model (unchanged from the rest of the app):
//   * Student identity derives ONLY from verifyStudentAuth (auth.uid() →
//     students.auth_user_id → students.id). Browser-supplied ids are ignored.
//   * All writes to intake/offer tables happen server-side (service_role).
//   * RLS remains SELECT-only for owners; no widening.
// ====================================================================

const INTAKE_MAX_MESSAGES = 40;

/** Normalise a transcript entry. */
function coerceTurnMessages(raw: any): IntakeTurnMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-INTAKE_MAX_MESSAGES)
    .map((m) => ({ role: m.role, content: String(m.content).slice(0, 4000) }));
}

// GET /api/intake/opening — brand-appropriate opening line (public, no PII)
app.get('/api/intake/opening', (_req, res) => {
  res.json({ ar: INTAKE_OPENING_AR, en: INTAKE_OPENING_EN });
});

// POST /api/intake/turn — run ONE adaptive intake turn (student-authenticated)
// The response contains a NON-authoritative draft: reply, profile, assessment,
// and the deterministic pricing recommendation. Nothing here is a final offer.
app.post('/api/intake/turn', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable.', code: 'AI_UNAVAILABLE' });
    }

    const messages = coerceTurnMessages(req.body?.messages);
    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return res.status(400).json({ error: 'A non-empty conversation ending with a user message is required.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const result = await runIntakeTurn(messages, ai);

    if (!result.ok || !result.output) {
      // Fail closed: never surface model text as authoritative.
      console.warn('[POST /api/intake/turn] Invalid model output:', result.errors);
      return res.status(502).json({ error: 'The assistant could not produce a valid response. Please try again.', code: 'INVALID_AI_OUTPUT' });
    }

    const output = result.output;

    // Deterministic pricing — the model never provides numbers.
    let recommendation = null;
    if (output.assessment) {
      const forbidden = findForbiddenPricingFields(output.assessment as any);
      if (forbidden.length > 0) {
        return res.status(502).json({ error: 'Invalid assessment payload.', code: 'FORBIDDEN_PRICING_FIELDS' });
      }
      recommendation = evaluateAssessment(output.assessment as ServiceAssessment);
    }

    // The final result is signed so /api/intake/complete saves exactly what the AI produced.
    const intakeToken = output.is_complete && output.assessment && req.studentUser?.auth_id
      ? createIntakeToken(req.studentUser.auth_id, output.profile, output.assessment, (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim())
      : null;

    return res.json({
      reply: output.reply,
      isComplete: output.is_complete,
      nextQuestion: output.next_question || null,
      profile: output.profile,
      assessment: output.assessment,
      recommendation,
      intakeToken,
    });
  } catch (err: any) {
    console.error('Intake error:', err);
    return res.status(500).json({ error: 'Failed to process intake turn.' });
  }
});

// POST /api/intake/complete — persist the structured intake (server-authoritative)
app.post('/api/intake/complete', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const authUserId = req.studentUser?.auth_id;
    const learnerStudentId = req.studentUser?.student_id || null;

    if (!authUserId) {
      return res.status(401).json({ error: 'Authenticated student identity is required.' });
    }

    // Only the server-signed result of /api/intake/turn is accepted, never a profile or assessment typed by the browser.
    const signed = readIntakeToken(req.body?.intakeToken, authUserId, (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim());
    const conversation = coerceTurnMessages(req.body?.conversation);

    if (!signed) {
      return res.status(400).json({ error: 'The assessment is missing or expired. Please finish the conversation again.' });
    }

    // Re-validate through the same strict schema used for the model output.
    const synthetic = { reply: 'ok', is_complete: true, profile: signed.profile, assessment: signed.assessment };
    const validated = validateIntakeOutput(synthetic);
    if (!validated.ok || !validated.value?.assessment) {
      return res.status(400).json({ error: 'Invalid intake payload.', details: validated.errors });
    }

    // Recompute the deterministic recommendation SERVER-SIDE. Never trust a
    // browser-supplied recommendation or price.
    const recommendation = evaluateAssessment(validated.value.assessment);

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { data: inserted, error } = await supabaseAdmin
      .from('student_intakes')
      .insert({
        auth_user_id: authUserId,
        learner_student_id: learnerStudentId,
        status: recommendation.teacher_review_required ? 'awaiting_teacher_review' : 'offer_ready',
        conversation,
        learning_profile: validated.value.profile,
        assessment: validated.value.assessment,
        pricing_recommendation: recommendation,
        service_category: recommendation.band === 'religious'
          ? (validated.value.assessment.service_category === 'islamic_studies' ? 'islamic_studies' : 'quran')
          : (validated.value.assessment.service_category === 'english' ? 'english' : 'arabic'),
        teacher_review_required: recommendation.teacher_review_required,
      })
      .select('id, status, teacher_review_required, created_at')
      .single();

    if (error || !inserted) {
      console.error('[POST /api/intake/complete] Insert error:', error?.message);
      return res.status(500).json({ error: 'Could not save the intake.' });
    }

    // On-site only (owner decision 2026-10-16: admin alerts stay on the website, no emails).
    if (inserted.status === 'awaiting_teacher_review') {
      await notifySuperAdmins(supabaseAdmin, {
        kind: 'intake_submitted',
        title: { en: 'New learning request from the AI guide', ar: 'طلب جديد من المرشد الذكي' },
        body: { en: 'A student finished the AI guide chat. Review the request and reply in the chat.', ar: 'طالب خلّص محادثة المرشد. راجع الطلب ورد عليه في الشات.' },
        link: '/dashboard/intakes'
      });
    }

    return res.json({
      intakeId: inserted.id,
      status: inserted.status,
      teacherReviewRequired: inserted.teacher_review_required,
      recommendation,
    });
  } catch (err: any) {
    console.error('[POST /api/intake/complete Error]', err);
    return res.status(500).json({ error: 'Failed to save intake.' });
  }
});

// --------------------------------------------------------------------
// PHASE 05 — READ-TIME OFFER STATE (derived, never stored)
// --------------------------------------------------------------------
// Purchasability and purchase state are DERIVED at read time from existing
// verified data. No column, no FK, and no catalog row is manufactured. A
// teacher-approved CUSTOM price with no exact active-catalog carrier stays
// approved-but-not-purchasable. Acceptance NEVER implies payment/entitlement.
async function loadActiveCatalog(supabaseAdmin: any): Promise<CatalogEntry[]> {
  const { data, error } = await supabaseAdmin
    .from('package_catalog')
    .select('id, price_amount, currency, lesson_count, is_active')
    .eq('is_active', true);
  if (error) {
    console.warn('[phase05] package_catalog read failed:', error.message);
    return [];
  }
  return (data || []) as CatalogEntry[];
}

async function loadActiveEntitlementCatalogIds(supabaseAdmin: any, authUserId: string): Promise<Set<string>> {
  const set = new Set<string>();
  if (!authUserId) return set;
  const { data, error } = await supabaseAdmin
    .from('package_entitlements')
    .select('package_catalog_id, status')
    .eq('purchaser_account_id', authUserId)
    .eq('status', 'active');
  if (error) {
    console.warn('[phase05] package_entitlements read failed:', error.message);
    return set;
  }
  for (const row of data || []) {
    if (row?.package_catalog_id) set.add(row.package_catalog_id);
  }
  return set;
}

/**
 * Derive the full, non-collapsed offer state for UI consumption. The five
 * concepts stay distinct; `accepted` is never coerced into `paid` or
 * `entitlement_active`. Every field is server-derived from verified data.
 */
function deriveOfferState(
  offer: any,
  activeCatalog: CatalogEntry[],
  activeEntitlementCatalogIds: Set<string>
) {
  const purchasability = resolveOfferPurchasability(
    { approved_price_usd: Number(offer?.approved_price_usd), currency: offer?.currency || 'USD' },
    activeCatalog
  );

  const status = offer?.status || null;
  const approved = offer?.approved_price_usd != null && Number(offer.approved_price_usd) > 0;
  const accepted = status === 'accepted';
  const entitlementActive = Boolean(
    purchasability.purchasable &&
      purchasability.packageCatalogId &&
      activeEntitlementCatalogIds.has(purchasability.packageCatalogId)
  );
  // Payment is only ever confirmed by the existing entitlement activation flow.
  const paid = entitlementActive;

  return {
    approved,
    purchasable: purchasability.purchasable,
    accepted,
    paid,
    entitlement_active: entitlementActive,
    purchasability: {
      purchasable: purchasability.purchasable,
      package_catalog_id: purchasability.packageCatalogId,
      reason: purchasability.reason,
      purchase_route: purchasability.purchasable ? '/student/packages' : null,
      message: purchasability.purchasable ? null : CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
    },
  };
}

// GET /api/intake/:id — owner (or teacher) reads their intake + offer state
app.get('/api/intake/:id', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const authUserId = req.studentUser?.auth_id;
    if (!authUserId) return res.status(401).json({ error: 'Authenticated student identity is required.' });

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data: intake, error } = await supabaseAdmin
      .from('student_intakes')
      .select('id, auth_user_id, status, learning_profile, assessment, pricing_recommendation, teacher_review_required, created_at')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !intake) return res.status(404).json({ error: 'Intake not found.' });
    // Ownership enforcement (server-side). teacher_notes are never included.
    if (intake.auth_user_id !== authUserId) return res.status(404).json({ error: 'Intake not found.' });

    const { data: offer } = await supabaseAdmin
      .from('learning_offers')
      .select('id, service_category, duration_minutes, approved_price_usd, teacher_adjusted, offer, status, offered_at')
      .eq('intake_id', intake.id)
      .in('status', ['offered', 'accepted'])
      .maybeSingle();

    return res.json({ intake, offer: offer || null });
  } catch (err: any) {
    console.error('[GET /api/intake/:id Error]', err);
    return res.status(500).json({ error: 'Failed to load intake.' });
  }
});

// GET /api/student/offers — presented offers for the authenticated student
app.get('/api/student/offers', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const authUserId = req.studentUser?.auth_id;
    if (!authUserId) return res.status(401).json({ error: 'Authenticated student identity is required.' });

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data, error } = await supabaseAdmin
      .from('learning_offers')
      .select('id, intake_id, service_category, service_id, duration_minutes, approved_price_usd, offer, status, offered_at')
      .eq('auth_user_id', authUserId)
      .in('status', ['offered', 'accepted'])
      .order('offered_at', { ascending: false });

    if (error) {
      console.warn('[GET /api/student/offers] Error:', error.message);
      return res.json({ offers: [] });
    }

    // Derive (never store) purchasability + purchase state at read time.
    const activeCatalog = await loadActiveCatalog(supabaseAdmin);
    const activeEntitlementCatalogIds = await loadActiveEntitlementCatalogIds(supabaseAdmin, authUserId);
    const offers = (data || []).map((o: any) => ({
      ...o,
      offer_state: deriveOfferState(o, activeCatalog, activeEntitlementCatalogIds),
    }));

    return res.json({ offers });
  } catch (err: any) {
    console.error('[GET /api/student/offers Error]', err);
    return res.status(500).json({ error: 'Failed to load offers.' });
  }
});

// POST /api/student/offers/:id/accept — student accepts a presented offer.
//
// SEMANTICS (critical): accepting an offer records the student's INTENT to
// proceed. It is NOT payment, NOT entitlement creation, and NOT proof of
// purchase. The authoritative commercial state lives exclusively in the
// existing package/payment architecture (package_entitlements + payments).
// Acceptance therefore hands the student off to that existing purchase flow.
app.post('/api/student/offers/:id/accept', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const authUserId = req.studentUser?.auth_id;
    if (!authUserId) return res.status(401).json({ error: 'Authenticated student identity is required.' });

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data: offer, error } = await supabaseAdmin
      .from('learning_offers')
      .select('id, auth_user_id, status, approved_price_usd, offer')
      .eq('id', req.params.id)
      .maybeSingle();

    if (error || !offer || offer.auth_user_id !== authUserId) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    // Derive (never store) purchasability against real active catalog data.
    // A custom approved price with no exact catalog carrier stays
    // accepted-but-not-purchasable; acceptance never becomes payment.
    const activeCatalog = await loadActiveCatalog(supabaseAdmin);
    const activeEntitlementCatalogIds = await loadActiveEntitlementCatalogIds(supabaseAdmin, authUserId);
    const currentState = deriveOfferState(
      { ...offer, status: 'accepted' },
      activeCatalog,
      activeEntitlementCatalogIds
    );

    // Acceptance is idempotent and never implies payment.
    const responseBody = {
      success: true,
      status: 'accepted',
      // Explicit: acceptance != purchase == false.
      purchaseCompleted: false,
      purchaseRequired: true,
      /** Non-collapsed, server-derived state for the UI. */
      offer_state: currentState,
      /** The existing purchase flow remains authoritative — ONLY when purchasable. */
      nextStep: currentState.purchasable
        ? {
            path: '/student/packages',
            kind: 'existing_package_purchase',
            message: 'Your offer is accepted. To activate lessons and credits, complete the existing package purchase and payment verification flow.',
          }
        : {
            path: null,
            kind: 'custom_offer_purchase_deferred',
            message: CUSTOM_OFFER_PURCHASE_UNAVAILABLE.en,
            message_ar: CUSTOM_OFFER_PURCHASE_UNAVAILABLE.ar,
          },
    };

    if (offer.status === 'accepted') {
      return res.json({ ...responseBody, isIdempotent: true });
    }
    if (offer.status !== 'offered') {
      return res.status(409).json({ error: 'This offer can no longer be accepted.' });
    }

    const { error: updErr } = await supabaseAdmin
      .from('learning_offers')
      .update({ status: 'accepted', decided_at: new Date().toISOString() })
      .eq('id', offer.id)
      .eq('status', 'offered');

    if (updErr) return res.status(500).json({ error: 'Could not accept the offer.' });

    return res.json(responseBody);
  } catch (err: any) {
    console.error('[POST /api/student/offers/:id/accept Error]', err);
    return res.status(500).json({ error: 'Failed to accept offer.' });
  }
});

// --------------------------------------------------------------------
// TEACHER REVIEW (authoritative) — staff only
// --------------------------------------------------------------------

// GET /api/dashboard/intakes — review queue
app.get('/api/dashboard/intakes', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const statusFilter = typeof req.query.status === 'string' ? req.query.status : null;
    let query = supabaseAdmin
      .from('student_intakes')
      .select('id, auth_user_id, learner_student_id, status, service_category, learning_profile, assessment, pricing_recommendation, teacher_review_required, created_at')
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusFilter) query = query.eq('status', statusFilter);

    const { data, error } = await query;
    if (error) {
      console.warn('[GET /api/dashboard/intakes] Error:', error.message);
      return res.json({ intakes: [] });
    }

    // Attach any existing offers (approved data only), each enriched with
    // read-time purchasability derived from REAL active catalog data.
    const ids = (data || []).map((i: any) => i.id);
    const offerMap = new Map<string, any>();
    let activeCatalogForTeacher: CatalogEntry[] = [];
    if (ids.length > 0) {
      activeCatalogForTeacher = await loadActiveCatalog(supabaseAdmin);
      const { data: offers } = await supabaseAdmin
        .from('learning_offers')
        .select('id, intake_id, approved_price_usd, teacher_adjusted, offer, status')
        .in('intake_id', ids);
      for (const o of offers || []) {
        const purchasability = resolveOfferPurchasability(
          { approved_price_usd: Number(o?.approved_price_usd), currency: 'USD' },
          activeCatalogForTeacher
        );
        offerMap.set(o.intake_id, {
          ...o,
          purchasable: purchasability.purchasable,
          purchasability: {
            purchasable: purchasability.purchasable,
            package_catalog_id: purchasability.packageCatalogId,
            reason: purchasability.reason,
            purchase_route: purchasability.purchasable ? '/student/packages' : null,
            message: purchasability.purchasable ? null : CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
          },
        });
      }
    }

    return res.json({
      intakes: (data || []).map((i: any) => ({ ...i, offer: offerMap.get(i.id) || null })),
    });
  } catch (err: any) {
    console.error('[GET /api/dashboard/intakes Error]', err);
    return res.status(500).json({ error: 'Failed to load intakes.' });
  }
});

// GET /api/dashboard/intakes/:id — full detail incl. private notes + audit trail
app.get('/api/dashboard/intakes/:id', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data: intake, error } = await supabaseAdmin
      .from('student_intakes')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error || !intake) return res.status(404).json({ error: 'Intake not found.' });

    const { data: offers } = await supabaseAdmin
      .from('learning_offers')
      .select('*')
      .eq('intake_id', intake.id)
      .order('created_at', { ascending: false });

    const { data: events } = await supabaseAdmin
      .from('intake_review_events')
      .select('id, action, notes, teacher_id, created_at')
      .eq('intake_id', intake.id)
      .order('created_at', { ascending: false });

    // Derive (never store) purchasability for each offer so the teacher UI can
    // show approved vs purchasable distinctly. No schema change, no FK.
    const activeCatalog = await loadActiveCatalog(supabaseAdmin);
    const offersWithState = (offers || []).map((o: any) => {
      const purchasability = resolveOfferPurchasability(
        { approved_price_usd: Number(o?.approved_price_usd), currency: o?.currency || 'USD' },
        activeCatalog
      );
      return {
        ...o,
        purchasable: purchasability.purchasable,
        purchasability: {
          purchasable: purchasability.purchasable,
          package_catalog_id: purchasability.packageCatalogId,
          reason: purchasability.reason,
          purchase_route: purchasability.purchasable ? '/student/packages' : null,
          message: purchasability.purchasable ? null : CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
        },
      };
    });

    return res.json({ intake, offers: offersWithState, events: events || [] });
  } catch (err: any) {
    console.error('[GET /api/dashboard/intakes/:id Error]', err);
    return res.status(500).json({ error: 'Failed to load intake detail.' });
  }
});

// POST /api/dashboard/intakes/:id/review — approve | adjust
app.post('/api/dashboard/intakes/:id/review', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const teacherId = req.teacherUser?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });

    const action = req.body?.action;
    // "Request more info" was replaced by the on-site chat with the student (owner decision 2026-10-16).
    if (!['approve', 'adjust'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve or adjust.' });
    }
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.slice(0, 2000) : null;

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

    const { data: intake, error } = await supabaseAdmin
      .from('student_intakes')
      .select('*')
      .eq('id', req.params.id)
      .maybeSingle();
    if (error || !intake) return res.status(404).json({ error: 'Intake not found.' });

    const recommendation = intake.pricing_recommendation || {};
    const assessment = intake.assessment || {};


    // ---- approve / adjust: create the authoritative offer ----
    const duration = [30, 45, 60].includes(Number(req.body?.duration_minutes))
      ? Number(req.body.duration_minutes)
      : (assessment.preferred_duration || recommendation.duration_minutes || 60);

    // Approved price: explicit teacher input for 'adjust'; recommendation for 'approve'.
    let approvedPrice: number | null = null;
    let teacherAdjusted = false;

    if (action === 'adjust') {
      const raw = req.body?.approved_price_usd;
      if (typeof raw !== 'number' || !Number.isFinite(raw) || raw <= 0) {
        return res.status(400).json({ error: 'A positive approved_price_usd is required when adjusting.' });
      }
      approvedPrice = Math.round((raw + Number.EPSILON) * 100) / 100;
      teacherAdjusted = true;
    } else {
      if (typeof recommendation.recommended_price_usd !== 'number' || recommendation.recommended_price_usd <= 0) {
        return res.status(409).json({
          error: 'No deterministic price is available for this case. Use "adjust" to set an explicit approved amount.',
          code: 'REVIEW_REQUIRED_MANUAL_PRICE',
        });
      }
      // The recommended price was computed for one lesson length; approving another length needs an explicit price.
      if (recommendation.duration_minutes && Number(recommendation.duration_minutes) !== duration) {
        return res.status(409).json({
          error: `The recommended price is for ${recommendation.duration_minutes}-minute lessons. Use "adjust" to set the price for ${duration} minutes.`,
          code: 'REVIEW_REQUIRED_MANUAL_PRICE',
        });
      }
      approvedPrice = recommendation.recommended_price_usd;
      teacherAdjusted = false;
    }

    // Optional legitimate offer (validated to be a real reduction).
    let offerSnapshot: any = null;
    const reqOffer = req.body?.offer;
    if (reqOffer && typeof reqOffer === 'object') {
      const candidate = computeOffer({
        approvedPriceUsd: approvedPrice!,
        durationMinutes: duration,
        lessonCount: Number(reqOffer.lessonCount) || 1,
        isFirstLesson: reqOffer.isFirstLesson === true,
        isReturningStudent: reqOffer.isReturningStudent === true,
      });
      if (candidate && isLegitimateOffer(candidate)) offerSnapshot = candidate;
    }

    const serviceCategory = intake.service_category
      || (assessment.service_category === 'english' ? 'english'
        : assessment.service_category === 'islamic_studies' ? 'islamic_studies'
        : assessment.service_category === 'arabic' ? 'arabic' : 'quran');

    const { data: offerRow, error: offerErr } = await supabaseAdmin
      .from('learning_offers')
      .insert({
        intake_id: intake.id,
        auth_user_id: intake.auth_user_id,
        learner_student_id: intake.learner_student_id || null,
        service_category: serviceCategory,
        service_id: assessment.service_id || null,
        duration_minutes: duration,
        recommended_price_usd: typeof recommendation.recommended_price_usd === 'number' ? recommendation.recommended_price_usd : null,
        recommended_tier: recommendation.tier || null,
        approved_price_usd: approvedPrice,
        teacher_adjusted: teacherAdjusted,
        offer: offerSnapshot,
        status: 'offered',
        teacher_notes: notes,
        offered_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (offerErr || !offerRow) {
      console.error('[POST review] Offer insert error:', offerErr?.message);
      return res.status(500).json({ error: 'Could not create the offer.' });
    }

    await supabaseAdmin.from('intake_review_events').insert({
      intake_id: intake.id, offer_id: offerRow.id, teacher_id: teacherId, action, notes,
    });
    await supabaseAdmin
      .from('student_intakes')
      .update({ status: 'offer_ready', teacher_review_required: false })
      .eq('id', intake.id);

    return res.json({
      success: true,
      action,
      offerId: offerRow.id,
      approvedPriceUsd: approvedPrice,
      teacherAdjusted,
      offer: offerSnapshot,
    });
  } catch (err: any) {
    console.error('[POST /api/dashboard/intakes/:id/review Error]', err);
    return res.status(500).json({ error: 'Failed to record review.' });
  }
});

// --------------------------------------------------------------------
// 22. STAFF MANAGEMENT (Super Admin Only)
// --------------------------------------------------------------------


app.post('/api/dashboard/admin/teachers', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { email, role = 'teacher', is_active = true, display_name, gender } = req.body || {};
    if (!email || typeof email !== 'string') {
      return res.status(400).json({ error: 'Valid email is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return res.status(400).json({ error: 'Invalid email format.' });
    }

    if (role !== 'teacher' && role !== 'super_admin') {
      return res.status(400).json({ error: 'Invalid teacher role. Must be teacher or super_admin.' });
    }

    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { data, error } = await supabase
      .from('teacher_accounts')
      .upsert({
        email: cleanEmail,
        role,
        is_active: Boolean(is_active),
        ...(typeof display_name === 'string' && display_name.trim() ? { display_name: display_name.trim().slice(0, 120) } : {}),
        ...(gender === 'male' || gender === 'female' ? { gender } : {}),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: clientErrorMessage(error, 'Failed to provision teacher account.') });
    }

    // New teachers get Supabase's invite email to set a password, then use the staff login.
    // An existing account (the email already signed up) just keeps its password.
    let invited = false;
    const { error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(cleanEmail, {
      redirectTo: `${resolveTrustedAppOrigin(req.headers.origin as string | undefined)}/staff/set-password`
    });
    if (!inviteErr) invited = true;
    else if (!/already|registered|exists/i.test(inviteErr.message)) console.warn('[Add teacher] invite failed:', inviteErr.message);

    return res.status(201).json({ success: true, teacher: data, invited });
  } catch (err: any) {
    return res.status(500).json({ error: clientErrorMessage(err, 'Internal server error.') });
  }
});

registerCommunityRoutes(app, {
  getClient: getSupabaseAdminClient,
  rateLimit,
  verifyStudentAuth,
  verifyTeacherAuth,
  requireSuperAdmin,
  getLearners: getAuthorizedLearnersForStudent
});

registerCurriculumRoutes(app, {
  getClient: getSupabaseAdminClient,
  rateLimit,
  verifyStudentAuth,
  verifyTeacherAuth,
  getLearners: getAuthorizedLearnersForStudent
});

registerProgressRoutes(app, {
  getClient: getSupabaseAdminClient,
  rateLimit,
  verifyStudentAuth,
  verifyTeacherAuth,
  requireSuperAdmin,
  getLearners: getAuthorizedLearnersForStudent
});

registerCrmRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin
});

registerFunnelRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin
});

registerFeedbackRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyStudentAuth,
  verifyTeacherAuth,
  requireSuperAdmin,
  rateLimit,
  getLearners: getAuthorizedLearnersForStudent,
  teacherName: resolveTeacherMetadata
});

registerPrivacyRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyStudentAuth,
  verifyTeacherAuth,
  requireSuperAdmin,
  rateLimit,
  getLearners: getAuthorizedLearnersForStudent,
  notifyAdmins: (client, notice) => notifySuperAdmins(client, notice),
  // Production only: local test runs share the database and must not email the team.
  emailPrivacyTeam: async (subject, text) => {
    if (process.env.VERCEL_ENV !== 'production') return;
    const html = `<pre style="font-family:inherit;white-space:pre-wrap">${text.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as any)[c])}</pre>`;
    await sendEmail({ to: 'privacy@watazawwado.academy', subject, text, html, from: 'privacy' });
  }
});

registerTeacherLoadRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin
});

registerSummaryDraftRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  rateLimit,
  // The family's language: the account's saved choice (RULES.md §6), English by default.
  familyLanguage: async (client, studentId) => {
    const account = await resolveLearnerAccount(client, studentId);
    return account.email ? resolveEmailLanguage(account.email) : 'en';
  },
  generate: async (prompt) => {
    if (!process.env.GEMINI_API_KEY) throw new Error('missing GEMINI_API_KEY');
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const response = await ai.models.generateContent({ model: 'gemini-3.1-flash-lite', contents: prompt });
    return response.text || '';
  }
});

registerAccountPreferenceRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyStudentAuth,
  rateLimit
});

registerCalendarFeedRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyStudentAuth,
  rateLimit,
  escapeLike
});

registerLessonTeacherMoveRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin,
  resolveTeacher: resolveTeacherMetadata
});

registerExportRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin
});

registerOpsRoutes(app, {
  getClient: getSupabaseAdminClient,
  verifyTeacherAuth,
  requireSuperAdmin,
  placementBeforeBooking: PLACEMENT_BEFORE_BOOKING
});

export {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
};

export default app;
