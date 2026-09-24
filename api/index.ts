import crypto from 'crypto';
import { MASTER_SPEC } from '../src/data/master_spec.js';
import express from 'express';
import { DateTime } from 'luxon';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { encryptToken } from '../server/integrations/crypto.js';
import {
  getActiveGoogleConnection,
  isTeacherCurrentlyAuthorized
} from '../server/integrations/syncEngine.js';
import { getZoomCredentials } from '../server/integrations/zoom.js';
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
  validateSlotAvailability
} from '../server/integrations/availabilityEngine.js';
import {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
} from '../server/leadTransitions.js';
import { dispatchNotification } from '../server/notifications/dispatcher.js';
import {
  scheduleBookingReminders,
  rescheduleBookingReminders,
  cancelBookingReminders,
  processDueReminders
} from '../server/notifications/reminderEngine.js';
import { processIntegrationJobs } from '../server/integrations/worker.js';
import { getEmailConfigStatus } from '../server/notifications/emailService.js';
import {
  evaluateAssessment,
  findForbiddenPricingFields,
  SUPPORTED_DURATIONS,
  type ServiceAssessment
} from '../server/pricing/pricingEngine.js';
import { computeOffer, isLegitimateOffer } from '../server/pricing/offers.js';
import {
  runIntakeTurn,
  parseModelJson,
  INTAKE_OPENING_AR,
  INTAKE_OPENING_EN,
  type IntakeTurnMessage
} from '../server/intake/intakeService.js';
import {
  validateIntakeOutput
} from '../server/intake/intakeSchema.js';
import {
  resolveOfferPurchasability,
  CUSTOM_OFFER_PURCHASE_UNAVAILABLE,
  type CatalogEntry
} from '../server/pricing/offerPurchasability.js';

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

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS = 10;

function rateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  
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

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/learning-guide', rateLimit, async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages) || messages.length === 0 || messages.length > 20) {
      return res.status(400).json({ error: 'Invalid or missing messages payload.' });
    }
    
    const totalLength = messages.reduce((acc, msg) => acc + (msg?.parts?.[0]?.text?.length || 0), 0);
    if (totalLength > 10000) {
      return res.status(400).json({ error: 'Payload too large.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'AI service unavailable.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const systemInstruction = `You are the AI Learning Guide for Mahmoud Teaching Platform.
Your role is to guide visitors, not replace Mahmoud.
Speak in a calm, human, knowledgeable, trustworthy, premium, and approachable tone.
Keep responses concise and helpful. Use English unless the user speaks Arabic.
Below is the Master Project Spec which defines the product, services, rules, and business logic.
You must adhere strictly to these rules, services, prices, and policies. Do not invent information that is not in the spec.
<master_spec>
${MASTER_SPEC}
</master_spec>`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: messages,
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
    console.error("AUTH_URL_ERROR:", error); res.status(500).json({ error: String(error.stack || error) });
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
              background: #6F907D;
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

    if (signature !== expectedSignature) {
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
            <h2 style="color: #6F907D;">Integration Successful!</h2>
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


/**
 * Authenticated multi-lesson purchase plan.
 * Server is the only authority for learner, catalog, price, availability,
 * entitlement ownership, and booking creation.
 */
app.post('/api/student/multi-lesson-plan', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const authUserId = req.studentUser?.auth_id;
    const studentId = req.studentUser?.student_id;
    if (!authUserId || !studentId) {
      return res.status(401).json({ error: 'Authenticated student profile required.' });
    }

    const {
      serviceId, durationMinutes, studentTimezone, catalogId, lessonCount,
      expectedTotalUsd, currency, lessons, contactName, contactEmail,
      contactWhatsapp, notes
    } = req.body || {};

    if (!Array.isArray(lessons) || lessons.length < 2 || lessons.length !== Number(lessonCount)) {
      return res.status(400).json({ error: 'Invalid lesson plan.' });
    }

    const { data: result, error: rpcErr } = await supabaseAdmin.rpc('create_multi_lesson_booking_plan', {
      p_payload: {
        student_id: studentId,
        service_id: String(serviceId || ''),
        duration_minutes: Number(durationMinutes),
        student_timezone: String(studentTimezone || ''),
        catalog_id: String(catalogId || ''),
        lesson_count: Number(lessonCount),
        expected_total_usd: Number(expectedTotalUsd),
        currency: String(currency || 'USD').toUpperCase(),
        lessons: lessons.map((l: any) => ({
          scheduled_start: l.scheduledStart || l.scheduled_start,
          scheduled_end: l.scheduledEnd || l.scheduled_end
        })),
        contact_name: String(contactName || ''),
        contact_email: String(contactEmail || ''),
        contact_whatsapp: contactWhatsapp ? String(contactWhatsapp) : '',
        notes: notes ? String(notes) : ''
      }
    });

    if (rpcErr) {
      console.error('[Multi-lesson plan RPC]', rpcErr);
      return res.status(409).json({ error: rpcErr.message || 'The selected lesson times are no longer available.' });
    }

    if (!result?.success || !result.entitlementId) {
      return res.status(500).json({ error: 'Could not create the lesson plan.' });
    }

    return res.status(201).json({
      success: true,
      status: result.status,
      entitlementId: result.entitlementId,
      paymentId: result.paymentId,
      lessonCount: result.lessonCount,
      totalAmount: result.totalAmount,
      currency: result.currency,
      bookings: result.bookings
    });
  } catch (err: any) {
    console.error('[Multi-lesson plan]', err);
    return res.status(500).json({ error: 'Failed to create the lesson plan.' });
  }
});

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
    const timezone = req.query.timezone as string;
    if (!timezone) {
      return res.status(400).json({ error: 'Timezone is required.', code: 'INVALID_AVAILABILITY_REQUEST' });
    }

    if (!DateTime.local().setZone(timezone).isValid) {
      return res.status(400).json({ error: 'Invalid timezone.', code: 'INVALID_AVAILABILITY_REQUEST' });
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

    const days = await computeAvailableSlots(timezone, daysCount, duration, teacherId);
    res.json({ success: true, days, timezone });
  } catch (error: any) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Failed to compute availability.', code: 'AVAILABILITY_FETCH_FAILED' });
  }
});

// 11. INTEGRATIONS: VALIDATE SLOT AVAILABILITY (SERVER-SIDE AUTHORITATIVE CHECK)
app.post('/api/integrations/validate-slot', async (req, res) => {
  try {
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

    const syncResult = await syncBookingIntegrations({
      referenceCode: booking.reference_code,
      teacherId: (req as any).teacherUser?.id || booking.teacher_id,
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
    const isProd = process.env.NODE_ENV === 'production';

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

      if (teacherRecord) {
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
          .ilike('email', userEmail);

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
    const isProd = process.env.NODE_ENV === 'production';

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
        id: 'teacher-admin-001',
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
        id: 'teacher-mahmoud-001',
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
      .select('role, is_active')
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
            display_name: user.user_metadata?.full_name || 'Ustadh Mahmoud',
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
      appRole: teacherRecord.role
    };
    return next();
  } catch (err) {
    console.error('[verifyTeacherAuth] Unexpected error during authentication verification:', err);
    res.setHeader('x-auth-diagnostic-stage', 'INTERNAL_ERROR');
    return res.status(500).json({ error: 'Internal server error during authentication.', diagnosticStage: 'INTERNAL_ERROR' });
  }
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

// ----------------------------------------------------------------------------
// Task 0.55.4-B: Public-Safe Vercel Runtime Supabase Configuration Diagnostic
// Purpose: Allows pre-authentication diagnosis of Vercel serverless environment variables.
// Absolutely NEVER exposes secret values, prefixes, suffixes, lengths, or hashes.
// ----------------------------------------------------------------------------
app.get('/api/runtime-supabase-diagnostic', (req, res) => {
  const hasUrl = Boolean(
    (process.env.SUPABASE_URL && process.env.SUPABASE_URL.trim()) ||
    (process.env.VITE_SUPABASE_URL && process.env.VITE_SUPABASE_URL.trim())
  );
  const hasServiceRoleKey = Boolean(
    process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY.trim()
  );
  const adminClient = getSupabaseAdminClient();

  res.json({
    diagnostic: true,
    runtime: "vercel",
    supabaseUrl: hasUrl ? "PRESENT" : "MISSING",
    supabaseServiceRoleKey: hasServiceRoleKey ? "PRESENT" : "MISSING",
    adminClient: adminClient ? "AVAILABLE" : "UNAVAILABLE"
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
app.get('/api/dashboard/me', verifyTeacherAuth, async (req: any, res: any) => {
  return res.json({
    success: true,
    user: {
      id: req.teacherUser?.id,
      email: req.teacherUser?.email,
      name: req.teacherUser?.name || req.teacherUser?.user_metadata?.name || 'Ustadh Mahmoud',
      role: req.teacherUser?.appRole || 'teacher',
      appRole: req.teacherUser?.appRole || 'teacher',
      isTeacher: true
    }
  });
});

// 13. DASHBOARD: Fetch today's lessons
app.get('/api/dashboard/today', verifyTeacherAuth, async (req, res) => {
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

    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gte('scheduled_start', startOfDayUtc)
      .lte('scheduled_start', endOfDayUtc)
      .order('scheduled_start', { ascending: true });

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

    // Next lesson algorithm:
    // Candidate criteria:
    // - Valid scheduled_start
    // - Not cancelled (l.status !== 'cancelled')
    // - Not completed (l.status !== 'completed')
    // - Not no_show (l.status !== 'no_show')
    // - Current time is before lesson end (endDt > nowUtc)
    // Priority:
    // 1. In Progress (nowUtc >= startDt && nowUtc <= endDt)
    // 2. Next upcoming lesson (startDt > nowUtc, sorted by startDt ascending)
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

    res.json({
      lessons,
      summary: {
        total_today: lessons.length,
        active_today: activeLessons.length,
        trials_today: trialsCount,
        completed_today: completedCount,
        needs_attention_count: needsAttentionCount,
        next_lesson: nextLesson
      }
    });
  } catch (err) {
    console.error('[Dashboard Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 14. DASHBOARD: Fetch upcoming lessons
app.get('/api/dashboard/upcoming', verifyTeacherAuth, async (req, res) => {
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

    // Upcoming means after today in Cairo time up to rangeEndUtc
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .gt('scheduled_start', endOfDayUtc)
      .lte('scheduled_start', rangeEndUtc)
      .neq('status', 'cancelled')
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
app.get('/api/dashboard/students', verifyTeacherAuth, async (req, res) => {
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

    // Fetch related guardians, scoped bookings, notes count, and services in parallel (avoids N+1 and avoids full-table scan)
    const [guardiansRes, bookingsRes, notesRes, servicesRes] = await Promise.all([
      supabase.from('guardians').select('student_id, parent_name').in('student_id', studentIds),
      supabase
        .from('bookings')
        .select('id, student_id, lead_id, contact_email, scheduled_start, scheduled_end, duration_minutes, status, booking_type, service_id, parent_name, zoom_meeting_link, sync_metadata')
        .or(bookingOrFilters.join(','))
        .order('scheduled_start', { ascending: true }),
      supabase.from('lesson_notes').select('id, student_id').in('student_id', studentIds),
      supabase.from('services').select('id, title, arabic_title')
    ]);

    const serviceMap = new Map<string, string>();
    if (servicesRes.data) {
      for (const s of servicesRes.data) {
        serviceMap.set(s.id, s.title);
      }
    }

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

      // Primary service resolution (from trial assessment, recent booking, or null)
      let primaryServiceId: string | null = null;
      const trialWithAssessment = stBookings.find(b => b.booking_type === 'trial' && b.sync_metadata?.trial_assessment?.recommended_service_id);
      if (trialWithAssessment) {
        primaryServiceId = trialWithAssessment.sync_metadata.trial_assessment.recommended_service_id;
      } else if (stBookings.length > 0) {
        const latestBooking = [...stBookings].sort((a, b) => b.scheduled_start.localeCompare(a.scheduled_start))[0];
        primaryServiceId = latestBooking?.service_id || null;
      }

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
app.get('/api/dashboard/students/:id', verifyTeacherAuth, async (req, res) => {
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

    const emailLower = student.email?.toLowerCase().trim();
    const leadId = student.lead_id;

    // Database-level filtered booking query using indexed identifiers (student_id, contact_email, lead_id)
    let bookingsQuery = supabase
      .from('bookings')
      .select('id, reference_code, student_id, lead_id, service_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, contact_whatsapp, parent_name, cancellation_reason, notes, fee_amount_usd, zoom_meeting_link, sync_metadata, created_at, updated_at')
      .order('scheduled_start', { ascending: false });

    const filterClauses: string[] = [`student_id.eq.${id}`];
    if (emailLower) {
      filterClauses.push(`contact_email.ilike.${emailLower}`);
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
    const [guardiansRes, goalsRes, bookingsRes, notesRes, servicesRes, leadRes] = await Promise.all([
      supabase.from('guardians').select('*').eq('student_id', id).maybeSingle(),
      supabase.from('student_goals').select('*').eq('student_id', id).order('created_at', { ascending: false }),
      bookingsQuery,
      supabase
        .from('lesson_notes')
        .select('*')
        .eq('student_id', id)
        .order('created_at', { ascending: false }),
      supabase.from('services').select('id, title, arabic_title'),
      leadId 
        ? supabase.from('leads').select('*').eq('id', leadId).maybeSingle()
        : (emailLower ? supabase.from('leads').select('*').ilike('email', emailLower).maybeSingle() : Promise.resolve({ data: null, error: null }))
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
      content: n.private_notes,
      observations: n.observations || null,
      next_steps: n.next_steps || null,
      created_at: n.created_at,
      updated_at: n.updated_at
    }));

    // Format bookings history
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
      services: servicesRes.data || []
    });
  } catch (err) {
    console.error('[Dashboard Student Detail Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 15C. DASHBOARD: Update student profile fields
app.patch('/api/dashboard/students/:id', verifyTeacherAuth, async (req, res) => {
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
      parent_whatsapp
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

// 15D. DASHBOARD: Student Private Notes CRUD
app.get('/api/dashboard/students/:id/notes', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
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
      content: n.private_notes,
      observations: n.observations || null,
      next_steps: n.next_steps || null,
      created_at: n.created_at,
      updated_at: n.updated_at
    }));

    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/api/dashboard/students/:id/notes', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { content, observations, next_steps } = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ error: 'Note content cannot be empty.' });
    }

    // Verify student exists
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id')
      .eq('id', id)
      .maybeSingle();

    if (studentErr || !student) {
      return res.status(404).json({ error: 'Student record not found.' });
    }

    const { data: inserted, error: insertErr } = await supabase
      .from('lesson_notes')
      .insert({
        student_id: id,
        private_notes: content.trim(),
        observations: observations && typeof observations === 'string' ? observations.trim() : null,
        next_steps: next_steps && typeof next_steps === 'string' ? next_steps.trim() : null
      })
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
        content: inserted.private_notes,
        observations: inserted.observations,
        next_steps: inserted.next_steps,
        created_at: inserted.created_at,
        updated_at: inserted.updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.patch('/api/dashboard/students/:id/notes/:noteId', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id, noteId } = req.params;
    const { content, observations, next_steps } = req.body;

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
        content: updated.private_notes,
        observations: updated.observations,
        next_steps: updated.next_steps,
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
        q = q.or(`contact_name.ilike.%${cleanSearch}%,contact_email.ilike.%${cleanSearch}%,reference_code.ilike.%${cleanSearch}%,parent_name.ilike.%${cleanSearch}%`);
      }

      // Order by scheduled_start descending
      return q.order('scheduled_start', { ascending: false });
    };

    // Parallel fetch services & operational summary counts
    const [servicesRes, summaryCountsRes] = await Promise.all([
      supabase.from('services').select('id, title, arabic_title, hourly_rate_usd'),
      Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).gte('scheduled_start', nowIso).neq('status', 'cancelled'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
        supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'confirmed').gte('confirmed_at', DateTime.now().minus({ days: 7 }).toISO() || '')
      ])
    ]);

    const serviceMap = new Map((servicesRes.data || []).map(s => [s.id, s]));

    // Global calculation of unpaid_upcoming_count across the ENTIRE upcoming dataset
    let unpaidUpcomingCount = 0;
    try {
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
  nowUtcIso: string
): { 
  valid: boolean; 
  statusCode?: number; 
  error?: string; 
  isIdempotent?: boolean; 
  message?: string 
} {
  // 1. Authorization check
  if (existingBooking.teacher_id && existingBooking.teacher_id !== teacherUserId) {
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
      nowUtc.toISO()!
    );

    if (!transitionValidation.valid) {
      return res.status(transitionValidation.statusCode || 400).json({ error: transitionValidation.error });
    }

    if (transitionValidation.isIdempotent) {
      return res.json({ success: true, booking: existingBooking, message: transitionValidation.message });
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
        return res.status(500).json({ error: rpcErr.message || 'Failed to cancel booking.' });
      }

      // Best-effort fast path worker trigger AFTER commit
      processIntegrationJobs().catch(err => console.error('[Teacher Cancel job process error]', err));

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking });
    }

    // 2. Transactional Reschedule Path
    if (scheduled_start && scheduled_end) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('teacher_reschedule_booking', {
        p_booking_id: id,
        p_new_start: scheduled_start,
        p_new_end: scheduled_end,
        p_cairo_time_display: cairo_time_display || null,
        p_notes: notes || null
      });

      if (rpcErr) {
        console.error('[Teacher Reschedule RPC Error]', rpcErr);
        return res.status(500).json({ error: rpcErr.message || 'Failed to reschedule booking.' });
      }

      // Best-effort fast path worker trigger AFTER commit
      processIntegrationJobs().catch(err => console.error('[Teacher Reschedule job process error]', err));

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking });
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
      return res.status(500).json({ error: updateErr.message || 'Failed to update booking notes.' });
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
app.post('/api/dashboard/payments', verifyTeacherAuth, async (req, res) => {
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

    const validMethods = ['international_bank_iban', 'ach_routing', 'payoneer', 'paypal', 'wise', 'other'];
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
      return res.status(500).json({ error: 'Failed to confirm payment: ' + rpcErr.message, code: 'PAYMENT_CONFIRM_FAILED' });
    }

    // We still need to fetch the updated payment to trigger notifications
    const { data: updated } = await supabase.from('payments').select('*').eq('id', id).single();
    if (!updated) {
       return res.status(404).json({ error: 'Payment not found.' });
    }

    // Dispatch payment confirmed notification asynchronously
    try {
      let learnerName = 'Student';
      let contactEmail: string | undefined = undefined;
      let contactWhatsapp: string | undefined = undefined;
      let reference = updated.payment_reference || id;
      let serviceName = '1-on-1 Teaching';

      const supabaseAdmin = getSupabaseAdminClient();
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database integration is not properly configured.' });
      }

      if (updated.booking_id) {
        const { data: b } = await supabaseAdmin
          .from('bookings')
          .select('reference_code, student_name, contact_name, contact_email, contact_whatsapp, service_name')
          .eq('id', updated.booking_id)
          .maybeSingle();

        if (b) {
          learnerName = b.student_name || b.contact_name || learnerName;
          contactEmail = b.contact_email;
          contactWhatsapp = b.contact_whatsapp;
          reference = b.reference_code || reference;
          serviceName = b.service_name || serviceName;
        }
      } else if (updated.student_id) {
        const { data: st } = await supabaseAdmin
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

    const rejectionNote = reason ? `[REJECTED: ${reason.trim()}]` : '[REJECTED by teacher]';
    const updatedNotes = payment.notes ? `${rejectionNote} ${payment.notes}` : rejectionNote;

    // Try status: 'rejected'
    let { data: updated, error: uErr } = await supabase
      .from('payments')
      .update({
        status: 'rejected',
        notes: updatedNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    // Resilient fallback if cloud DB check constraint not yet migrated
    if (uErr && uErr.message?.includes('payments_status_check')) {
      const fallbackRes = await supabase
        .from('payments')
        .update({
          notes: updatedNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      updated = fallbackRes.data;
      uErr = fallbackRes.error;
    }

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

    const { error } = await supabase
      .from('payments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[Delete Payment Error]', error);
      return res.status(500).json({ error: 'Failed to delete payment.', code: 'PAYMENT_DELETE_FAILED' });
    }

    res.json({ success: true, message: 'Payment removed.' });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16i. PUBLIC/STUDENT: Report payment confirmation reference safely
app.post('/api/bookings/:referenceCode/payment-claim', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const { referenceCode } = req.params;
    const { payment_method, payment_reference, amount, currency, notes } = req.body;

    if (!payment_reference || typeof payment_reference !== 'string' || !payment_reference.trim()) {
      return res.status(400).json({ error: 'Payment reference code is required.' });
    }

    const validMethods = ['international_bank_iban', 'ach_routing', 'payoneer', 'paypal', 'wise', 'other'];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${validMethods.join(', ')}` });
    }

    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.status(403).json({ error: 'Student authentication required.' });
    }

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, student_id, service_id, duration_minutes, booking_type, fee_amount_usd, status')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (bErr || !booking) {
      return res.status(404).json({ error: 'Booking reference not found.' });
    }

    if (booking.student_id !== studentId) {
      return res.status(403).json({ error: 'You are not authorized to claim payment for this booking.' });
    }

    if (booking.booking_type === 'trial') {
      return res.status(400).json({ error: 'Free trials do not require payment.' });
    }

    let finalAmount: number | null = null;
    let finalCurrency: string | null = null;

    if (booking.fee_amount_usd !== null && booking.fee_amount_usd !== undefined && Number(booking.fee_amount_usd) > 0) {
      finalAmount = Number(Number(booking.fee_amount_usd).toFixed(2));
      finalCurrency = 'USD';
    } else if (booking.service_id) {
      const { data: srv } = await supabase.from('services').select('hourly_rate_usd').eq('id', booking.service_id).maybeSingle();
      if (srv?.hourly_rate_usd && Number(srv.hourly_rate_usd) > 0) {
        const duration = Number(booking.duration_minutes) || 60;
        finalAmount = Number(((Number(srv.hourly_rate_usd) * duration) / 60).toFixed(2));
        finalCurrency = 'USD';
      }
    }

    if (!finalAmount || finalAmount <= 0 || !finalCurrency) {
      return res.status(400).json({ error: 'Authoritative payment amount/currency could not be determined from booking. Cannot process claim.' });
    }

    // Idempotency: Check if a payment with this reference already exists for this booking
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('booking_id', booking.id)
      .eq('payment_reference', String(payment_reference).trim())
      .maybeSingle();

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment reference already recorded. Awaiting verification.',
        payment_id: existingPayment.id
      });
    }

    const { data: newPayment, error: pErr } = await supabase
      .from('payments')
      .insert({
        booking_id: booking.id,
        student_id: booking.student_id || null,
        amount: finalAmount,
        currency: finalCurrency,
        payment_method,
        payment_reference: String(payment_reference).trim(),
        status: 'pending',
        notes: notes ? `Student claim: ${String(notes).trim()}` : 'Student reported payment'
      })
      .select()
      .single();

    if (pErr) {
      console.error('[Payment Claim Error]', pErr);
      return res.status(500).json({ error: 'Could not record payment reference.' });
    }

    // Dispatch PAYMENT_CLAIMED notification asynchronously
    try {
      let learnerName = 'Student';
      let contactEmail: string | undefined = undefined;
      let contactWhatsapp: string | undefined = undefined;
      let serviceName = '1-on-1 Lesson';

      const { data: b } = await supabase
        .from('bookings')
        .select('student_name, contact_name, contact_email, contact_whatsapp, service_name')
        .eq('reference_code', referenceCode)
        .maybeSingle();

      if (b) {
        learnerName = b.student_name || b.contact_name || learnerName;
        contactEmail = b.contact_email;
        contactWhatsapp = b.contact_whatsapp;
        serviceName = b.service_name || serviceName;
      }

      await dispatchNotification({
        eventType: 'PAYMENT_CLAIMED',
        payment: {
          id: newPayment.id,
          amount: finalAmount,
          currency: finalCurrency,
          paymentMethod: payment_method,
          paymentReference: String(payment_reference).trim(),
          notes: notes ? String(notes).trim() : undefined
        },
        booking: {
          referenceCode,
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
      console.error('[Payment Claim Notification Error]', notifErr);
    }

    res.status(201).json({ 
      success: true, 
      message: 'Payment reported successfully. Ustadh Mahmoud will verify and confirm receipt.',
      payment_id: newPayment.id
    });
  } catch (err) {
    console.error('[Payment Claim Server Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


// 16j. PUBLIC/STUDENT: Report package payment confirmation reference safely
app.post('/api/packages/:entitlementId/payment-claim', rateLimit, verifyStudentAuth, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database service unavailable.' });
    }

    const { entitlementId } = req.params;
    const { payment_method, payment_reference, amount, currency, notes } = req.body;

    if (!payment_reference || typeof payment_reference !== 'string' || !payment_reference.trim()) {
      return res.status(400).json({ error: 'Payment reference code is required.' });
    }

    const validMethods = ['international_bank_iban', 'ach_routing', 'payoneer', 'paypal', 'wise', 'other'];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${validMethods.join(', ')}` });
    }

    const authUserId = req.studentUser?.auth_id;
    if (!authUserId) {
      return res.status(403).json({ error: 'Student authentication required.' });
    }

    const { data: entitlement, error: eErr } = await supabase
      .from('package_entitlements')
      .select('id, purchaser_account_id, price_paid, currency, status, learner_student_id')
      .eq('id', entitlementId)
      .maybeSingle();

    if (eErr || !entitlement) {
      return res.status(404).json({ error: 'Package entitlement not found.' });
    }

    if (entitlement.purchaser_account_id !== authUserId) {
      return res.status(403).json({ error: 'You are not authorized to claim payment for this package.' });
    }

    if (entitlement.status !== 'pending_payment') {
      return res.status(400).json({ error: 'Package is not pending payment.' });
    }

    let finalAmount: number | null = null;
    let finalCurrency: string | null = null;

    if (entitlement.price_paid !== null && Number(entitlement.price_paid) > 0) {
      finalAmount = Number(Number(entitlement.price_paid).toFixed(2));
      finalCurrency = entitlement.currency || 'USD';
    }

    if (!finalAmount || finalAmount <= 0 || !finalCurrency) {
      return res.status(400).json({ error: 'Authoritative payment amount/currency could not be determined from package. Cannot process claim.' });
    }

    // Idempotency check
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, status')
      .eq('entitlement_id', entitlement.id)
      .eq('payment_reference', String(payment_reference).trim())
      .maybeSingle();

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: 'Payment reference already recorded. Awaiting verification.',
        payment_id: existingPayment.id
      });
    }

    const { data: newPayment, error: pErr } = await supabase
      .from('payments')
      .insert({
        entitlement_id: entitlement.id,
        booking_id: null,
        student_id: entitlement.learner_student_id || req.studentUser?.student_id || null,
        amount: finalAmount,
        currency: finalCurrency,
        payment_method,
        payment_reference: String(payment_reference).trim(),
        status: 'pending',
        notes: notes ? `Student package claim: ${String(notes).trim()}` : 'Student reported package payment'
      })
      .select()
      .single();

    if (pErr) {
      console.error('[Package Payment Claim Error]', pErr);
      return res.status(500).json({ error: 'Could not record package payment reference.' });
    }

    // Attempt to update package_entitlements payment_reference (for legacy UI or tracking)
    await supabase.from('package_entitlements').update({ payment_reference: String(payment_reference).trim() }).eq('id', entitlement.id);

    try {
      await dispatchNotification({
        eventType: 'PAYMENT_CLAIMED',
        payment: {
          id: newPayment.id,
          amount: finalAmount,
          currency: finalCurrency,
          paymentMethod: payment_method,
          paymentReference: String(payment_reference).trim(),
          notes: notes ? String(notes).trim() : undefined
        },
        booking: {
          referenceCode: entitlement.id.substring(0, 8),
          serviceName: 'Package Purchase',
          learnerName: 'Student',
          contactEmail: '',
          contactWhatsapp: null,
          date: '',
          timeDisplay: '',
          timezone: 'Africa/Cairo',
          durationMinutes: 0
        }
      });
    } catch (notifErr) {
      console.error('[Package Payment Claim Notification Error]', notifErr);
    }

    res.status(201).json({
      success: true,
      message: 'Package payment reported successfully. Ustadh Mahmoud will verify and activate your package.',
      payment_id: newPayment.id
    });
  } catch (err) {
    console.error('[Package Payment Claim Server Error]', err);
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

    const [leadsRes, studentsRes, bookingsRes, trialsRes, paymentsRes] = await Promise.all([
      supabase.from('leads').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'confirmed'),
      supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('booking_type', 'trial'),
      supabase.from('payments').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
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

    const [bookingsRes, leadsRes, servicesRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .eq('booking_type', 'trial')
        .order('scheduled_start', { ascending: true }),
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

    if (fetchError || !booking) {
      return res.status(404).json({ error: 'Trial booking not found.' });
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
        const { data } = await supabase.from('leads').select('*').ilike('email', booking.contact_email.trim()).maybeSingle();
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
            .or(`lead_id.eq.${leadRecord.id},email.ilike.${booking.contact_email}`)
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
              await supabase.from('students').insert(studentInsert);
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
      if (process.env.NODE_ENV !== 'production') {
        return res.json({ leads: [] });
      }
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
      if (process.env.NODE_ENV !== 'production') {
        return res.json({
          funnel: {
            steps: [],
            rates: {
              lead_to_trial_rate: 0,
              trial_to_student_rate: 0,
              overall_conversion_rate: 0
            }
          },
          current_pipeline: {
            lead: 0,
            trial_booked: 0,
            active_student: 0,
            completed: 0,
            lost: 0
          },
          time_to_convert_days: {
            avg_lead_to_trial: null,
            avg_trial_to_active: null
          }
        });
      }
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

    // 1. Current Pipeline: Always fetch ALL active leads for current stage distribution (unfiltered by date)
    const [allLeadsRes, allStudentsRes, servicesRes] = await Promise.all([
      supabase.from('leads').select('id, name, email, status, service_interest_id, source, created_at, updated_at'),
      supabase.from('students').select('id, lead_id, email, status, created_at'),
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

    if (startDateIso && endDateIso) {
      leadsQuery = leadsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
      bookingsQuery = bookingsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
      paymentsQuery = paymentsQuery.gte('created_at', startDateIso).lte('created_at', endDateIso);
    }

    const [periodLeadsRes, periodBookingsRes, periodPaymentsRes] = await Promise.all([
      leadsQuery,
      bookingsQuery,
      paymentsQuery
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

    // Atomic update via RPC
    // Timezone is enforced server-side inside the RPC based on canonical teacher profile
    const { error: rpcError } = await supabase.rpc('update_teacher_availability', {
      p_teacher_id: teacherId,
      p_schedule: validatedIntervals
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
app.patch('/api/dashboard/settings', verifyTeacherAuth, async (req, res) => {
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
app.patch('/api/dashboard/services/:id', verifyTeacherAuth, async (req, res) => {
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
        .or(`lead_id.eq.${updatedLead.id},email.ilike.${updatedLead.email}`)
        .maybeSingle();

      // Look for any existing booking for this lead to recover verified timezone and assessment
      const { data: leadBookings } = await supabase
        .from('bookings')
        .select('student_timezone, student_name, parent_name, sync_metadata')
        .or(`lead_id.eq.${updatedLead.id},contact_email.ilike.${updatedLead.email}`)
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
          name: matchedBooking?.student_name || updatedLead.name,
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
          await supabase.from('students').insert(studentInsert);
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
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'A valid email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const cleanName = name.trim();
    const cleanWhatsapp = whatsapp ? String(whatsapp).trim() : null;
    const cleanMessage = message ? String(message).trim() : null;
    const cleanSource = source || 'website_contact';

    // Check if lead already exists by lower(email)
    const { data: existingLead } = await supabase
      .from('leads')
      .select('id, notes, status')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingLead) {
      const appendNotes = cleanMessage 
        ? `${existingLead.notes || ''}\n[${DateTime.now().setZone('Africa/Cairo').toFormat('yyyy-MM-dd HH:mm')}] Inquiry: ${cleanMessage}`.trim()
        : existingLead.notes;

      await supabase
        .from('leads')
        .update({
          name: cleanName,
          whatsapp: cleanWhatsapp || undefined,
          service_interest_id: serviceInterest || undefined,
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
      message: 'Thank you for reaching out. Ustadh Mahmoud will be in touch with you shortly.'
    });
  } catch (err) {
    console.error('[Contact Submission Error]', err);
    res.status(500).json({ error: 'Failed to process inquiry. Please contact via WhatsApp.' });
  }
});

// 23. CRON: Process pending 24h and 1h lesson reminders
app.all('/api/cron/process-reminders', async (req, res) => {
  try {
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.authorization;

    if (process.env.NODE_ENV === 'production' && !cronSecret) {
      return res.status(503).json({ error: 'CRON_SECRET is not configured on the server.' });
    }

    // Require Authorization: Bearer <CRON_SECRET> header; query-string secrets are strictly rejected
    if (cronSecret) {
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

    const integrationsProcessed = await processIntegrationJobs();

    const summary = await processDueReminders();
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
          .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, booking_preference, created_at, onboarding_completed, learning_interest, learning_goal, learning_needs, assigned_teacher_id')
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
          .select('student_id, parent_name, parent_email, students:student_id(id, name, current_level)')
          .ilike('parent_email', (req.studentUser?.email || '').trim())
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
      const linkedChildrenFromGuardians = (linkedChildrenRes?.data || [])
        .map((g: any) => g.students)
        .filter(Boolean);
      const canBookForChild = isChildStudentWithGuardian || linkedChildrenFromGuardians.length > 0;
      const rawPref = (profile as any).booking_preference || 'self';
      const bookingPreference = canBookForChild ? rawPref : 'self';

      return res.json({
        id: profile.id,
        name: profile.name,
        email: profile.email,
        whatsapp: profile.whatsapp || null,
        country: profile.country || null,
        timezone: profile.timezone || 'UTC',
        learnerType: profile.learner_type || 'adult',
        currentLevel: profile.current_level || 'beginner',
        status: profile.status || 'active',
        assignedTeacherId: profile.assigned_teacher_id || null,
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
      whatsapp
    } = req.body || {};

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(422).json({ error: 'Please provide a valid name (at least 2 characters).' });
    }

    const validLevels = ['beginner', 'elementary', 'intermediate', 'advanced'];
    const resolvedLevel = validLevels.includes(currentLevel) ? currentLevel : 'beginner';
    const resolvedLearnerType = learnerType === 'child' ? 'child' : 'adult';

    let resolvedTimezone = 'UTC';
    if (timezone && typeof timezone === 'string' && DateTime.now().setZone(timezone.trim()).isValid) {
      resolvedTimezone = timezone.trim();
    } else if (req.studentUser?.studentProfile?.timezone) {
      resolvedTimezone = req.studentUser.studentProfile.timezone;
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();

    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentProfile) {
        req.studentUser.studentProfile.name = name.trim();
        req.studentUser.studentProfile.learner_type = resolvedLearnerType;
        req.studentUser.studentProfile.current_level = resolvedLevel;
        req.studentUser.studentProfile.timezone = resolvedTimezone;
        req.studentUser.studentProfile.onboarding_completed = true;
        if (whatsapp) req.studentUser.studentProfile.whatsapp = String(whatsapp).trim();
        if (learningInterest) req.studentUser.studentProfile.learning_interest = String(learningInterest).trim();
        if (learningGoal) req.studentUser.studentProfile.learning_goal = String(learningGoal).trim();
        if (learningNeeds) req.studentUser.studentProfile.learning_needs = String(learningNeeds).trim();
      }
      return res.json({
        success: true,
        onboardingCompleted: true,
        profile: {
          id: studentId,
          name: name.trim(),
          email: req.studentUser?.email || 'student@example.com',
          timezone: resolvedTimezone,
          learnerType: resolvedLearnerType,
          currentLevel: resolvedLevel,
          onboardingCompleted: true,
          learningInterest: learningInterest || null,
          learningGoal: learningGoal || null,
          learningNeeds: learningNeeds || null
        }
      });
    }

    // 1. Update students row
    const studentUpdate: Record<string, any> = {
      name: name.trim(),
      learner_type: resolvedLearnerType,
      current_level: resolvedLevel,
      timezone: resolvedTimezone,
      onboarding_completed: true,
      updated_at: new Date().toISOString()
    };
    if (whatsapp) studentUpdate.whatsapp = String(whatsapp).trim();
    if (learningInterest) studentUpdate.learning_interest = String(learningInterest).trim();
    if (learningGoal) studentUpdate.learning_goal = String(learningGoal).trim();
    if (learningNeeds) studentUpdate.learning_needs = String(learningNeeds).trim();

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

    // 2. Handle child guardian if provided
    if (resolvedLearnerType === 'child' && parentName && typeof parentName === 'string' && parentName.trim().length > 1) {
      const parentNameClean = parentName.trim();
      const parentPhoneClean = parentWhatsapp ? String(parentWhatsapp).trim() : null;

      const { data: existingG } = await supabaseAdmin
        .from('guardians')
        .select('id')
        .eq('student_id', studentId)
        .maybeSingle();

      if (existingG) {
        await supabaseAdmin
          .from('guardians')
          .update({
            parent_name: parentNameClean,
            parent_whatsapp: parentPhoneClean
          })
          .eq('student_id', studentId);
      } else {
        await supabaseAdmin
          .from('guardians')
          .insert({
            student_id: studentId,
            parent_name: parentNameClean,
            parent_email: updatedStudent?.email || req.studentUser?.email,
            parent_whatsapp: parentPhoneClean,
            relationship_type: 'parent'
          });
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
    // Claim unlinked guest bookings strictly matching verified student email and with student_id IS NULL
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

    return res.json({
      success: true,
      onboardingCompleted: true,
      profile: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        timezone: updatedStudent.timezone,
        learnerType: updatedStudent.learner_type,
        currentLevel: updatedStudent.current_level,
        onboardingCompleted: true,
        learningInterest: updatedStudent.learning_interest,
        learningGoal: updatedStudent.learning_goal,
        learningNeeds: updatedStudent.learning_needs
      }
    });
  } catch (err: any) {
    console.error('[POST /api/student/onboarding Error]', err);
    return res.status(500).json({ error: 'Internal server error processing onboarding.' });
  }
});

// PATCH /api/student/me - Safely update authenticated student's profile
app.patch('/api/student/me', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.status(404).json({ error: 'Student profile not found.' });
    }

    const { name, timezone, whatsapp, country, parentName, parentWhatsapp, booking_preference, bookingPreference } = req.body || {};

    // Validate safe fields only - explicitly reject any attempts to modify forbidden attributes
    const forbiddenFields = [
      'id', 'student_id', 'studentId', 'auth_user_id', 'auth_id', 'status',
      'lead_id', 'notes', 'created_at', 'updated_at', 'current_level', 'role',
      'email', 'onboarding_completed'
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

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();

    // Booking preference validation & persistence
    const rawBookingPref = booking_preference !== undefined ? booking_preference : bookingPreference;
    if (rawBookingPref !== undefined) {
        if (rawBookingPref !== 'self' && rawBookingPref !== 'child') {
          return res.status(422).json({ error: "Invalid booking preference. Must be 'self' or 'child'." });
        }

        // Check if student has an authoritative child/guardian relationship
        let studentCanBookChild = false;
        if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
          const mp = req.studentUser?.studentProfile;
          studentCanBookChild = mp?.canBookForChild ?? (
            mp?.learner_type === 'child' ||
            Boolean(mp?.guardian) ||
            Boolean(mp?.linkedChildren && mp?.linkedChildren.length > 0)
          );
        } else {
          const [studentCheck, guardianCheck, parentCheck] = await Promise.all([
            supabaseAdmin.from('students').select('learner_type').eq('id', studentId).single(),
            supabaseAdmin.from('guardians').select('id').eq('student_id', studentId).maybeSingle(),
            supabaseAdmin.from('guardians').select('id').ilike('parent_email', (req.studentUser?.email || '').trim()).limit(1)
          ]);
          const isChildWithGuardian = studentCheck.data?.learner_type === 'child' && Boolean(guardianCheck.data);
          const isParentOfChild = Boolean(parentCheck.data && parentCheck.data.length > 0);
          studentCanBookChild = isChildWithGuardian || isParentOfChild;
        }

        if (rawBookingPref === 'child' && !studentCanBookChild) {
          return res.status(422).json({
            error: 'Account has no linked child relationship. Booking preference cannot be set to child.'
          });
        }

        updatePayload.booking_preference = rawBookingPref;
      }
    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentProfile) {
        if (updatePayload.name) req.studentUser.studentProfile.name = updatePayload.name;
        if (updatePayload.timezone) req.studentUser.studentProfile.timezone = updatePayload.timezone;
        if (updatePayload.whatsapp !== undefined) req.studentUser.studentProfile.whatsapp = updatePayload.whatsapp;
        if (updatePayload.country !== undefined) req.studentUser.studentProfile.country = updatePayload.country;
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
        bookingPreference: updatePayload.booking_preference || req.studentUser?.studentProfile?.booking_preference || 'self',
        status: req.studentUser?.studentProfile?.status || 'active',
        updatedAt: new Date().toISOString()
      });
    }

    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('students')
      .update(updatePayload)
      .eq('id', studentId)
      .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, booking_preference, created_at, updated_at')
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

    // Fetch bookings belonging strictly to this authenticated student (idempotent read)
    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, reference_code, service_id, package_entitlement_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, contact_whatsapp, parent_name, notes, fee_amount_usd, zoom_meeting_link, created_at')
      .eq('student_id', studentId)
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
    const formattedBookings = (bookingsData || []).map((b: any) => {
      const s = serviceMap.get(b.service_id);
      const serviceTitle = s?.title || 'Lesson';
      const zoomUrl = (b.zoom_meeting_link && typeof b.zoom_meeting_link === 'string' && b.zoom_meeting_link.trim().length > 0)
        ? b.zoom_meeting_link.trim()
        : null;

      const pkgInfo = b.package_entitlement_id ? packageMap.get(b.package_entitlement_id) : null;

      return {
        id: b.id,
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
        .ilike('parent_email', userEmail);

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
      .select('id, package_catalog_id, purchaser_account_id, learner_student_id, status, purchased_quantity, remaining_credits, price_paid, currency, payment_reference, created_at, updated_at')
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
      return {
        id: ent.id,
        packageCatalogId: ent.package_catalog_id,
        packageName: cat?.name || 'Lesson Package',
        packageType: cat?.package_type || 'monthly',
        status: ent.status, // 'pending_payment' | 'active' | 'exhausted' | 'cancelled'
        purchasedQuantity: ent.purchased_quantity || 0,
        remainingCredits: ent.remaining_credits || 0,
        pricePaid: ent.price_paid,
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
      .select('id, name, package_type, lesson_count, price_amount, currency, is_active')
      .eq('id', packageCatalogId)
      .eq('is_active', true)
      .maybeSingle();

    if (catErr || !catalogItem) {
      return res.status(404).json({ error: 'Package not found or currently inactive.' });
    }

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
        price_paid: catalogItem.price_amount,
        currency: catalogItem.currency || 'USD'
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
    const authUserId = req.studentUser?.auth_id;

    if (!studentId && !authUserId) {
      return res.json({ payments: [] });
    }

    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin) {
      return res.json({ payments: [] });
    }

    // Fetch payments associated with student or their bookings
    let query = supabaseAdmin
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
      `);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

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

    return res.json({
      reply: output.reply,
      isComplete: output.is_complete,
      nextQuestion: output.next_question || null,
      profile: output.profile,
      assessment: output.assessment,
      recommendation,
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

    const rawProfile = req.body?.profile;
    const rawAssessment = req.body?.assessment;
    const conversation = coerceTurnMessages(req.body?.conversation);

    if (!rawProfile || typeof rawProfile !== 'object') {
      return res.status(400).json({ error: 'A structured learning profile is required.' });
    }
    if (!rawAssessment || typeof rawAssessment !== 'object') {
      return res.status(400).json({ error: 'A structured service assessment is required.' });
    }

    // Re-validate through the same strict schema used for the model output.
    const synthetic = { reply: 'ok', is_complete: true, profile: rawProfile, assessment: rawAssessment };
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
// TEACHER REVIEW (authoritative) — Mahmoud only
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

// POST /api/dashboard/intakes/:id/review — approve | adjust | request_more_info
app.post('/api/dashboard/intakes/:id/review', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const teacherId = req.teacherUser?.id;
    if (!teacherId) return res.status(401).json({ error: 'Unauthorized: missing teacher identity' });

    const action = req.body?.action;
    if (!['approve', 'adjust', 'request_more_info'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Must be approve, adjust, or request_more_info.' });
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

    // ---- request_more_info: no offer created; audit event only ----
    if (action === 'request_more_info') {
      await supabaseAdmin.from('intake_review_events').insert({
        intake_id: intake.id, teacher_id: teacherId, action, notes,
      });
      await supabaseAdmin
        .from('student_intakes')
        .update({ status: 'draft', teacher_review_required: true })
        .eq('id', intake.id);
      return res.json({ success: true, action, status: 'draft' });
    }

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
app.get('/api/dashboard/admin/teachers', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.json({
        teachers: [
          { email: 'mahmoudelwany98@gmail.com', role: 'super_admin', is_active: true },
          { email: 'mhmwdlwany4222@gmail.com', role: 'teacher', is_active: true }
        ]
      });
    }

    const { data, error } = await supabase
      .from('teacher_accounts')
      .select('email, role, is_active, created_at, updated_at')
      .order('created_at', { ascending: true });

    if (error) {
      return res.status(500).json({ error: 'Failed to retrieve teacher accounts.' });
    }

    return res.json({ teachers: data || [] });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

app.post('/api/dashboard/admin/teachers', verifyTeacherAuth, requireSuperAdmin, async (req: any, res: any) => {
  try {
    const { email, role = 'teacher', is_active = true } = req.body || {};
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
      return res.status(201).json({
        success: true,
        teacher: { email: cleanEmail, role, is_active: Boolean(is_active) }
      });
    }

    const { data, error } = await supabase
      .from('teacher_accounts')
      .upsert({
        email: cleanEmail,
        role,
        is_active: Boolean(is_active),
        updated_at: new Date().toISOString()
      }, { onConflict: 'email' })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message || 'Failed to provision teacher account.' });
    }

    return res.status(201).json({ success: true, teacher: data });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
});

export {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
};

export default app;
