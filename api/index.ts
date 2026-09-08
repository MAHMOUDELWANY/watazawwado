import crypto from 'crypto';
import { MASTER_SPEC } from '../src/data/master_spec.js';
import express from 'express';
import { DateTime } from 'luxon';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { encryptToken } from '../server/integrations/crypto.js';
import { getActiveGoogleConnection } from '../server/integrations/syncEngine.js';
import { getZoomCredentials } from '../server/integrations/zoom.js';
import {
  generateGoogleAuthUrl,
  exchangeGoogleCodeForTokens,
  getGoogleOAuthCredentials
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
import { getEmailConfigStatus } from '../server/notifications/emailService.js';

dotenv.config();

const app = express();

export function getSupabaseAdminClient() {
  const rawUrl = process.env.VITE_SUPABASE_URL || '';
  const cleanUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!cleanUrl || !serviceKey) return null;
  return createClient(cleanUrl, serviceKey, { auth: { persistSession: false } });
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
app.get('/api/integrations/status', verifyTeacherAuth, async (req, res) => {
  try {
    const googleConn = await getActiveGoogleConnection();
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
app.get('/api/integrations/google-calendar/auth-url', verifyTeacherAuth, (req, res) => {
  try {
    const crypto = require('crypto');
    const state = crypto.randomBytes(16).toString('hex');
    res.setHeader('Set-Cookie', `oauth_state=${state}; HttpOnly; Path=/; Max-Age=600; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
    const authUrl = generateGoogleAuthUrl(state);
    res.json({ authUrl });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate auth url.', code: 'AUTH_URL_GENERATION_FAILED' });
  }
});

// 3. INTEGRATIONS: GOOGLE CALENDAR OAUTH CALLBACK
app.get('/api/integrations/google-calendar/callback', async (req, res) => {
  try {
    const code = req.query.code as string;
    const state = req.query.state as string;
    if (!code) {
      return res.status(400).send('Missing authorization code.');
    }

    const cookieHeader = req.headers.cookie || '';
    const match = cookieHeader.match(/oauth_state=([^;]+)/);
    const expectedState = match ? match[1] : null;

    if (!expectedState || state !== expectedState) {
      return res.status(403).send('Invalid or expired OAuth state parameter (CSRF).');
    }

    const tokenData = await exchangeGoogleCodeForTokens(code);
    
    // Store securely in DB using service role
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      
      // Invalidate old connections
      await supabase
        .from('calendar_connections')
        .update({ is_active: false })
        .eq('provider', 'google_calendar');

      // Insert new connection
      await supabase.from('calendar_connections').insert({
        provider: 'google_calendar',
        account_email: tokenData.accountEmail || 'unknown@calendar.google.com',
        is_active: true,
        metadata: {
          access_token: encryptToken(tokenData.accessToken),
          refresh_token: tokenData.refreshToken ? encryptToken(tokenData.refreshToken) : undefined,
          expires_at: tokenData.expiresAt
        }
      });
    }

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

    if (!trustedOrigin) {
      console.error('[OAuth Callback] Trusted origin could not be determined. APP_URL is missing or invalid.');
      return res.status(500).send('Authentication Failed: Google Calendar connection failed. Please try again.');
    }
    
    const safePayload = JSON.stringify({ 
      type: 'GOOGLE_CALENDAR_CONNECTED', 
      email: tokenData.accountEmail || 'Connected' 
    }).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');

    // Return HTML to close popup and notify parent
    res.send(`
      <html>
        <head><title>Success</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAF8F5; color: #362E3B;">
          <div style="text-align: center;">
            <h2 style="color: #6F907D;">Integration Successful!</h2>
            <p>Google Calendar has been connected. You can close this window.</p>
            <script>
              if (window.opener) {
                window.opener.postMessage(${safePayload}, '${trustedOrigin}');
                setTimeout(() => window.close(), 2000);
              }
            </script>
          </div>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google callback error:', error);
    res.status(500).send('Authentication Failed: Google Calendar connection failed. Please try again.');
  }
});

// 6. INTEGRATIONS: GOOGLE CALENDAR DISCONNECT
app.post('/api/integrations/google-calendar/disconnect', verifyTeacherAuth, async (req, res) => {
  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
      
      await supabase
        .from('calendar_connections')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('provider', 'google_calendar');
    }

    res.json({ success: true, message: 'Google Calendar disconnected.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to disconnect Google Calendar.', code: 'DISCONNECT_FAILED' });
  }
});

// --- AUTH HELPER ---
async function verifyManagementToken(referenceCode: string, managementToken: string): Promise<boolean> {
  if (!referenceCode || !managementToken) return false;
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('[Configuration Error] SUPABASE_SERVICE_ROLE_KEY missing for management auth check.');
    return false; // Fail closed
  }
  
  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await supabase.rpc('get_booking_management', {
    p_reference_code: referenceCode,
    p_management_token: managementToken
  });
    
  return !error && data && data.reference;
}
// ---

// 7. INTEGRATIONS: SYNC BOOKING (CALENDAR & ZOOM)
app.post('/api/integrations/sync-booking', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking || !booking.referenceCode || !booking.scheduledStart || !booking.managementToken) {
      return res.status(400).json({ error: 'Invalid booking data for synchronization.' });
    }

    const isAuth = await verifyManagementToken(booking.referenceCode, booking.managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const syncResult = await syncBookingIntegrations(booking);

    // Schedule idempotent 24h & 1h reminders and dispatch notification asynchronously
    try {
      const isTrial = booking.mode === 'trial' || booking.booking_type === 'trial';
      const scheduledStartIso = booking.scheduledStart;
      const scheduledEndIso = booking.scheduledEnd || (scheduledStartIso && booking.durationMinutes
        ? DateTime.fromISO(scheduledStartIso).plus({ minutes: booking.durationMinutes }).toISO()
        : scheduledStartIso);
      const studentTz = booking.studentTimezone || 'Africa/Cairo';
      const startLuxon = DateTime.fromISO(scheduledStartIso).setZone(studentTz);

      await scheduleBookingReminders({
        id: booking.id || booking.referenceCode,
        scheduledStartUtc: scheduledStartIso,
        referenceCode: booking.referenceCode
      });

      await dispatchNotification({
        eventType: isTrial ? 'TRIAL_BOOKED' : 'BOOKING_CONFIRMED',
        booking: {
          id: booking.id,
          referenceCode: booking.referenceCode,
          serviceName: booking.serviceName || (isTrial ? 'Free Trial Lesson' : '1-on-1 Lesson'),
          learnerName: booking.learnerName || booking.studentName || 'Student',
          contactEmail: booking.contactEmail,
          contactWhatsapp: booking.contactWhatsapp || null,
          date: startLuxon.toFormat('cccc, MMMM d, yyyy'),
          timeDisplay: startLuxon.toFormat('hh:mm a'),
          timezone: studentTz,
          durationMinutes: booking.durationMinutes || (isTrial ? 30 : 60),
          zoomLink: syncResult.zoomMeetingLink || booking.zoomMeetingLink || null,
          cairoTimeDisplay: booking.cairoTimeDisplay || null,
          isTrial
        }
      });
    } catch (notifErr) {
      console.error('[Notification/Reminder Setup Error]', notifErr);
    }

    res.json(syncResult);
  } catch (error: any) {
    console.error('Sync booking error:', error);
    res.status(500).json({ error: 'Failed to synchronize booking.', code: 'SYNC_FAILED' });
  }
});

// 8. INTEGRATIONS: RESCHEDULE EVENT SYNC
app.post('/api/integrations/reschedule', async (req, res) => {
  try {
    const { referenceCode, managementToken, newStartUtc, newEndUtc, cairoTimeDisplay } = req.body;
    if (!referenceCode || !managementToken || !newStartUtc || !newEndUtc) {
      return res.status(400).json({ error: 'Missing reschedule parameters.' });
    }

    const isAuth = await verifyManagementToken(referenceCode, managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const result = await syncRescheduledBooking(referenceCode, newStartUtc, newEndUtc, cairoTimeDisplay);

    // Reschedule reminder jobs and dispatch notification asynchronously
    try {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data: b } = await supabase
          .from('bookings')
          .select('*')
          .eq('reference_code', referenceCode)
          .maybeSingle();

        if (b) {
          await rescheduleBookingReminders(b.id, newStartUtc, referenceCode);

          const studentTz = b.student_timezone || 'Africa/Cairo';
          const newStartLuxon = DateTime.fromISO(newStartUtc).setZone(studentTz);
          const oldStartLuxon = b.scheduled_start ? DateTime.fromISO(b.scheduled_start).setZone(studentTz) : null;

          await dispatchNotification({
            eventType: 'BOOKING_RESCHEDULED',
            booking: {
              id: b.id,
              referenceCode: referenceCode,
              serviceName: b.service_name || '1-on-1 Lesson',
              learnerName: b.student_name || b.contact_name || 'Student',
              contactEmail: b.contact_email,
              contactWhatsapp: b.contact_whatsapp || null,
              date: newStartLuxon.toFormat('cccc, MMMM d, yyyy'),
              timeDisplay: newStartLuxon.toFormat('hh:mm a'),
              timezone: studentTz,
              durationMinutes: b.duration_minutes || 60,
              zoomLink: b.zoom_meeting_link || null,
              cairoTimeDisplay: cairoTimeDisplay || b.cairo_time_display || null,
              oldDate: oldStartLuxon ? oldStartLuxon.toFormat('cccc, MMMM d, yyyy') : undefined,
              oldTimeDisplay: oldStartLuxon ? oldStartLuxon.toFormat('hh:mm a') : undefined
            }
          });
        }
      }
    } catch (notifErr) {
      console.error('[Reschedule Notification Error]', notifErr);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Reschedule sync error:', error);
    res.status(500).json({ error: 'Failed to sync rescheduled event.', code: 'RESCHEDULE_SYNC_FAILED' });
  }
});

// 9. INTEGRATIONS: CANCEL EVENT SYNC
app.post('/api/integrations/cancel', async (req, res) => {
  try {
    const { referenceCode, managementToken } = req.body;
    if (!referenceCode || !managementToken) {
      return res.status(400).json({ error: 'Missing reference code or token.' });
    }

    const isAuth = await verifyManagementToken(referenceCode, managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const result = await syncCancelledBooking(referenceCode);

    // Cancel pending reminder jobs and dispatch notification asynchronously
    try {
      const supabase = getSupabaseAdminClient();
      if (supabase) {
        const { data: b } = await supabase
          .from('bookings')
          .select('*')
          .eq('reference_code', referenceCode)
          .maybeSingle();

        if (b) {
          await cancelBookingReminders(b.id);

          const studentTz = b.student_timezone || 'Africa/Cairo';
          const startLuxon = DateTime.fromISO(b.scheduled_start).setZone(studentTz);

          await dispatchNotification({
            eventType: 'BOOKING_CANCELLED',
            booking: {
              id: b.id,
              referenceCode: referenceCode,
              serviceName: b.service_name || '1-on-1 Lesson',
              learnerName: b.student_name || b.contact_name || 'Student',
              contactEmail: b.contact_email,
              contactWhatsapp: b.contact_whatsapp || null,
              date: startLuxon.toFormat('cccc, MMMM d, yyyy'),
              timeDisplay: startLuxon.toFormat('hh:mm a'),
              timezone: studentTz,
              durationMinutes: b.duration_minutes || 60,
              zoomLink: b.zoom_meeting_link || null
            }
          });
        }
      }
    } catch (notifErr) {
      console.error('[Cancel Notification Error]', notifErr);
    }

    res.json(result);
  } catch (error: any) {
    console.error('Cancel sync error:', error);
    res.status(500).json({ error: 'Failed to sync cancelled event.', code: 'CANCEL_SYNC_FAILED' });
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

    const days = await computeAvailableSlots(timezone, daysCount, duration);
    res.json({ success: true, days, timezone });
  } catch (error: any) {
    console.error('Availability fetch error:', error);
    res.status(500).json({ error: 'Failed to compute availability.', code: 'AVAILABILITY_FETCH_FAILED' });
  }
});

// 11. INTEGRATIONS: VALIDATE SLOT AVAILABILITY (SERVER-SIDE AUTHORITATIVE CHECK)
app.post('/api/integrations/validate-slot', async (req, res) => {
  try {
    const { scheduledStartUtc, scheduledEndUtc } = req.body;
    if (!scheduledStartUtc || !scheduledEndUtc) {
      return res.status(400).json({ isAvailable: false, conflictReason: 'Missing slot timestamps.' });
    }

    if (!DateTime.fromISO(scheduledStartUtc).isValid || !DateTime.fromISO(scheduledEndUtc).isValid) {
      return res.status(400).json({ isAvailable: false, conflictReason: 'Invalid slot timestamps.' });
    }

    const result = await validateSlotAvailability(scheduledStartUtc, scheduledEndUtc);
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

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
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

async function verifyStudentAuth(req: any, res: any, next: any) {
  try {
    const authHeader = req.headers.authorization;
    const isProd = process.env.NODE_ENV === 'production';
    if (!authHeader) {
      return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
    }
    const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required. Expected Bearer token format.' });
    }
    
    // Strict production security
    if (isProd && (token === 'dev-student-token' || token === 'dev-student-b-token' || token === 'dev-teacher-token')) {
      return res.status(401).json({ error: 'Unauthorized. Development tokens are strictly forbidden in production.' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceKey) {
      // Allow dev test tokens in non-production environments when testing
      if (!isProd && token === 'dev-student-token') {
        req.studentUser = {
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
            status: 'active'
          }
        };
        return next();
      }

      if (!isProd && token === 'dev-student-b-token') {
        req.studentUser = {
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
            status: 'active'
          }
        };
        return next();
      }

      // Explicitly reject teacher tokens attempting student portal APIs
      if (!isProd && (token === 'dev-teacher-token' || req.headers['x-dev-teacher-auth'])) {
        return res.status(403).json({ error: 'Forbidden. Teachers cannot access student portal APIs.' });
      }

      const supabaseAdmin = getSupabaseAdminClient();
      if (!supabaseAdmin) return res.status(503).json({ error: 'Database integration is not properly configured.' });

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid or expired session token.' });

      // Check if it's a teacher trying to access the student portal
      const userEmail = (user.email || '').toLowerCase().trim();
      const { data: teacherRecord } = await supabaseAdmin
        .from('teacher_accounts')
        .select('email')
        .eq('email', userEmail)
        .eq('is_active', true)
        .maybeSingle();

      if (teacherRecord) {
        return res.status(403).json({ error: 'Forbidden. Teachers cannot access student portal APIs.' });
      }

      // Check student profile by auth_user_id
      let { data: studentRecord, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, name, email, timezone, learner_type, current_level, status')
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
          .select('id, name, email, timezone, learner_type, current_level, status, auth_user_id')
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
              .select('id, name, email, timezone, learner_type, current_level, status')
              .single();

            if (!linkError && linkedStudent) {
              console.log(`[verifyStudentAuth] Safely linked existing student profile ${candidate.id} to auth user ${user.id}`);
              studentRecord = linkedStudent;
            }
          }
        }
      }

      // If still no student record exists, create exactly one student profile
      if (!studentRecord) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || userEmail.split('@')[0] || 'Student';
        const { data: newStudent, error: insertError } = await supabaseAdmin
          .from('students')
          .insert({
            auth_user_id: user.id,
            name: fullName,
            email: userEmail,
            status: 'active',
            timezone: 'UTC',
            learner_type: 'adult',
            current_level: 'beginner'
          })
          .select('id, name, email, timezone, learner_type, current_level, status')
          .single();

        if (!insertError && newStudent) {
          studentRecord = newStudent;
        } else {
          // Retry select in case of concurrent creation
          const { data: retryStudent } = await supabaseAdmin
            .from('students')
            .select('id, name, email, timezone, learner_type, current_level, status')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          if (retryStudent) {
            studentRecord = retryStudent;
          }
        }
      }

      req.studentUser = {
        auth_id: user.id,
        email: userEmail,
        student_id: studentRecord?.id || null,
        name: studentRecord?.name || user.user_metadata?.full_name || 'Student',
        studentProfile: studentRecord || null
      };
      
      return next();
    }

    // Non-production fallback when Supabase is not configured
    if (!isProd && token === 'dev-student-token') {
      req.studentUser = {
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
          status: 'active'
        }
      };
      return next();
    }

    if (!isProd && token === 'dev-student-b-token') {
      req.studentUser = {
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
          status: 'active'
        }
      };
      return next();
    }

    if (!isProd && (token === 'dev-teacher-token' || req.headers['x-dev-teacher-auth'])) {
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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const isProd = process.env.NODE_ENV === 'production';

    if (!authHeader && !devHeader) {
      return res.status(401).json({ error: 'Authentication required. Authorization header missing.' });
    }

    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

    // Strict production security: dev-teacher-token is NEVER accepted in production
    if (isProd && (token === 'dev-teacher-token' || devHeader)) {
      return res.status(401).json({ error: 'Unauthorized. Development tokens are strictly forbidden in production.' });
    }

    // 1. Supabase Verification when service key is available
    if (supabaseUrl && serviceKey) {
      if (!token) {
        return res.status(401).json({ error: 'Authentication required. Expected Bearer token format.' });
      }

      // Check if dev token in local non-prod ONLY
      if (!isProd && token === 'dev-teacher-token') {
        req.teacherUser = {
          id: 'teacher-mahmoud-001',
          email: 'mhmwdlwany4222@gmail.com',
          name: 'Ustadh Mahmoud',
          role: 'super_admin'
        };
        return next();
      }

      const supabaseAdmin = getSupabaseAdminClient();
      if (!supabaseAdmin) {
        return res.status(503).json({ error: 'Database integration is not properly configured.' });
      }
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired session token.' });
      }

      const email = (user.email || '').toLowerCase().trim();
      
      // Authoritative role lookup in teacher_accounts allowlist
      const { data: teacherRecord, error: teacherError } = await supabaseAdmin
        .from('teacher_accounts')
        .select('role')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (teacherError || !teacherRecord) {
        return res.status(403).json({ error: 'Access denied. Account is not authorized for the teacher workspace.' });
      }

      req.teacherUser = {
        ...user,
        appRole: teacherRecord.role
      };
      return next();
    }

    // 2. Non-production development fallback if Supabase environment is not configured
    if (!isProd) {
      if (token === 'dev-teacher-token' || devHeader === 'true') {
        req.teacherUser = {
          id: 'teacher-mahmoud-001',
          email: 'mhmwdlwany4222@gmail.com',
          name: 'Ustadh Mahmoud',
          role: 'super_admin'
        };
        return next();
      }
    }

    return res.status(401).json({ error: 'Unauthorized access.' });
  } catch (err) {
    return res.status(401).json({ error: 'Authentication check failed.' });
  }
}

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
    
    // Check completed: status === 'completed' or scheduled end is past
    const completedCount = lessons.filter(l => {
      if (l.status === 'cancelled') return false;
      if (l.status === 'completed') return true;
      if (!l.scheduled_start) return false;
      const startDt = DateTime.fromISO(l.scheduled_start);
      if (!startDt.isValid) return false;
      const endDt = l.scheduled_end 
        ? DateTime.fromISO(l.scheduled_end) 
        : startDt.plus({ minutes: l.duration_minutes || 30 });
      return endDt <= nowUtc;
    }).length;

    // Check items needing attention: failed integrations or missing Zoom on upcoming active lesson
    const needsAttentionCount = activeLessons.filter(l => {
      const isFailed = l.integration_status === 'failed' || l.integration_status === 'manual_action_required';
      const isMissingZoom = !l.zoom_host_url && !l.zoom_join_url;
      if (!l.scheduled_start) return isFailed;
      const startDt = DateTime.fromISO(l.scheduled_start);
      if (!startDt.isValid) return isFailed;
      // Attention if failed or if starting in < 2 hours with no zoom link
      return isFailed || (isMissingZoom && startDt.diff(nowUtc, 'hours').hours < 2 && startDt > nowUtc);
    }).length;

    // Next lesson algorithm:
    // Candidate criteria:
    // - Valid scheduled_start
    // - Not cancelled (l.status !== 'cancelled')
    // - Not completed (l.status !== 'completed')
    // - Current time is before lesson end (endDt > nowUtc)
    // Priority:
    // 1. In Progress (nowUtc >= startDt && nowUtc <= endDt)
    // 2. Next upcoming lesson (startDt > nowUtc, sorted by startDt ascending)
    const validCandidates = lessons.filter(l => {
      if (!l.scheduled_start) return false;
      if (l.status === 'cancelled' || l.status === 'completed') return false;
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

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    // Status changes
    if (status && status !== existingBooking.status) {
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'rescheduled', 'completed', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${status}` });
      }

      updatePayload.status = status;

      // Handle cancellation: safe external sync
      if (status === 'cancelled') {
        updatePayload.cancellation_reason = cancellation_reason || 'Cancelled by teacher';
        // Remove Google Calendar event if synced
        if (existingBooking.reference_code) {
          try {
            await syncCancelledBooking(existingBooking.reference_code);
          } catch (syncErr) {
            console.warn('[Sync Cancel Warning]', syncErr);
          }
        }
      }

      // Handle completion: record lesson session if student is enrolled
      if (status === 'completed' && existingBooking.student_id) {
        const { data: existingSession } = await supabase
          .from('lesson_sessions')
          .select('id')
          .eq('booking_id', id)
          .maybeSingle();

        if (!existingSession) {
          await supabase.from('lesson_sessions').insert({
            booking_id: id,
            student_id: existingBooking.student_id,
            lesson_date: existingBooking.scheduled_start,
            attendance: 'attended',
            completion_status: 'completed',
            covered_material: covered_material || null
          });
        }
      }
    }

    // Handle rescheduling
    if (scheduled_start && scheduled_end) {
      updatePayload.scheduled_start = scheduled_start;
      updatePayload.scheduled_end = scheduled_end;
      if (cairo_time_display) {
        updatePayload.cairo_time_display = cairo_time_display;
      }
      if (status !== 'cancelled') {
        updatePayload.status = 'rescheduled';
      }

      // Sync reschedule with Google Calendar
      if (existingBooking.reference_code) {
        try {
          await syncRescheduledBooking(
            existingBooking.reference_code,
            scheduled_start,
            scheduled_end,
            cairo_time_display || existingBooking.cairo_time_display
          );
        } catch (syncErr) {
          console.warn('[Sync Reschedule Warning]', syncErr);
        }
      }
    }

    const { data: updatedBooking, error: updateErr } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Update Booking Error]', updateErr);
      return res.status(500).json({ error: updateErr.message || 'Failed to update booking.' });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    console.error('[Dashboard Update Booking Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// 16d. DASHBOARD: Fetch all payments with status/unmatched filtering
app.get('/api/dashboard/payments', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
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
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

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
    } else if (booking_id) {
      // Check if booking has configured fee
      const { data: b } = await supabase.from('bookings').select('fee_amount_usd, service_id').eq('id', booking_id).maybeSingle();
      if (b?.fee_amount_usd !== null && b?.fee_amount_usd !== undefined) {
        finalCurrency = 'USD';
      }
    }

    if (!finalCurrency) {
      return res.status(400).json({ error: 'A valid 3-letter currency code is required.' });
    }

    const validMethods = ['international_bank_iban', 'ach_routing', 'payoneer', 'paypal', 'wise', 'other'];
    if (!payment_method || !validMethods.includes(payment_method)) {
      return res.status(400).json({ error: `Payment method must be one of: ${validMethods.join(', ')}` });
    }

    const validStatuses = ['pending', 'confirmed', 'rejected', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid payment status.' });
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
app.post('/api/dashboard/payments/:id/confirm', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;

    const { data: payment, error: pErr } = await supabase
      .from('payments')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (pErr || !payment) {
      return res.status(404).json({ error: 'Payment record not found.' });
    }

    // Idempotency: already confirmed
    if (payment.status === 'confirmed') {
      return res.json({ 
        success: true, 
        message: 'Payment is already confirmed.', 
        payment 
      });
    }

    const { data: updated, error: uErr } = await supabase
      .from('payments')
      .update({
        status: 'confirmed',
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (uErr) {
      console.error('[Confirm Payment Error]', uErr);
      return res.status(500).json({ error: 'Failed to confirm payment.', code: 'PAYMENT_CONFIRM_FAILED' });
    }

    // Dispatch payment confirmed notification asynchronously
    try {
      let learnerName = 'Student';
      let contactEmail: string | undefined = undefined;
      let contactWhatsapp: string | undefined = undefined;
      let reference = payment.payment_reference || id;
      let serviceName = '1-on-1 Teaching';

      if (payment.booking_id) {
        const { data: b } = await supabase
          .from('bookings')
          .select('reference_code, student_name, contact_name, contact_email, contact_whatsapp, service_name')
          .eq('id', payment.booking_id)
          .maybeSingle();

        if (b) {
          learnerName = b.student_name || b.contact_name || learnerName;
          contactEmail = b.contact_email;
          contactWhatsapp = b.contact_whatsapp;
          reference = b.reference_code || reference;
          serviceName = b.service_name || serviceName;
        }
      } else if (payment.student_id) {
        const { data: st } = await supabase
          .from('students')
          .select('name, email, whatsapp')
          .eq('id', payment.student_id)
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
app.post('/api/dashboard/payments/:id/reject', verifyTeacherAuth, async (req, res) => {
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
app.delete('/api/dashboard/payments/:id', verifyTeacherAuth, async (req, res) => {
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
app.post('/api/bookings/:referenceCode/payment-claim', rateLimit, async (req, res) => {
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

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .select('id, student_id, service_id, duration_minutes, booking_type, fee_amount_usd, status')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (bErr || !booking) {
      return res.status(404).json({ error: 'Booking reference not found.' });
    }

    if (booking.booking_type === 'trial') {
      return res.status(400).json({ error: 'Free trials do not require payment.' });
    }

    let finalAmount: number | null = null;
    let finalCurrency: string | null = null;

    // 1. Amount validation - Never invent 0!
    if (amount !== undefined && amount !== null && amount !== '') {
      const parsedAmount = Number(amount);
      if (isNaN(parsedAmount) || !isFinite(parsedAmount) || parsedAmount <= 0 || parsedAmount > 100000) {
        return res.status(400).json({ error: 'A valid positive payment amount is required.' });
      }
      finalAmount = Number(parsedAmount.toFixed(2));
    } else {
      // Amount omitted: check trustworthy booking amount
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
    }

    if (!finalAmount || finalAmount <= 0) {
      return res.status(400).json({ error: 'Payment amount could not be determined. Please explicitly provide the payment amount.' });
    }

    // 2. Currency validation - No arbitrary fallback
    if (currency && typeof currency === 'string' && currency.trim()) {
      const cleanCurrency = currency.trim().toUpperCase();
      if (!/^[A-Z]{3}$/.test(cleanCurrency)) {
        return res.status(400).json({ error: 'Invalid currency code. Please provide a standard 3-letter currency code (e.g. USD, CAD, GBP, EUR).' });
      }
      finalCurrency = cleanCurrency;
    }

    if (!finalCurrency) {
      return res.status(400).json({ error: 'Currency is required for payment confirmation.' });
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
app.get('/api/dashboard/leads', verifyTeacherAuth, async (req, res) => {
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
    const supabase = getSupabaseAdminClient();
    if (!supabase) return res.status(503).json({ error: 'Database integration is not properly configured.' });

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
app.patch('/api/dashboard/leads/:id', verifyTeacherAuth, async (req, res) => {
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

    const summary = await processDueReminders();
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary
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
      return res.status(404).json({ error: 'Student profile not found.' });
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
        createdAt: mockProfile.created_at || new Date().toISOString(),
        guardian: null,
        goals: []
      });
    }

    try {
      const [studentRes, guardianRes, goalsRes] = await Promise.all([
        supabaseAdmin
          .from('students')
          .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, created_at, onboarding_completed, learning_interest, learning_goal, learning_needs')
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
          .eq('status', 'in_progress')
      ]);

      if (studentRes.error || !studentRes.data) {
        if (!isProd && req.studentUser?.studentProfile) {
          const mp = req.studentUser.studentProfile;
          return res.json({
            id: mp.id,
            name: mp.name,
            email: mp.email,
            timezone: mp.timezone || 'UTC',
            learnerType: mp.learner_type || 'adult',
            currentLevel: mp.current_level || 'beginner',
            status: mp.status || 'active',
            onboardingCompleted: mp.onboarding_completed ?? true,
            learningInterest: mp.learning_interest || 'Quran Reading',
            learningGoal: mp.learning_goal || null,
            learningNeeds: mp.learning_needs || null,
            createdAt: new Date().toISOString(),
            guardian: null,
            goals: []
          });
        }
        return res.status(404).json({ error: 'Student profile not found.' });
      }

      const profile = studentRes.data;
      const guardian = guardianRes.data || null;
      const goals = goalsRes.data || [];

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
      if (!isProd && req.studentUser?.studentProfile) {
        const mp = req.studentUser.studentProfile;
        return res.json({
          id: mp.id,
          name: mp.name,
          email: mp.email,
          timezone: mp.timezone || 'UTC',
          learnerType: mp.learner_type || 'adult',
          currentLevel: mp.current_level || 'beginner',
          status: mp.status || 'active',
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

// POST /api/student/onboarding - Complete onboarding for new student
app.post('/api/student/onboarding', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.status(404).json({ error: 'Student profile not found.' });
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

    const { name, timezone, whatsapp, country, parentName, parentWhatsapp } = req.body || {};

    // Validate safe fields only - explicitly reject any attempts to modify forbidden attributes
    const forbiddenFields = ['id', 'auth_user_id', 'status', 'lead_id', 'notes', 'created_at', 'updated_at', 'current_level'];
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

    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      if (req.studentUser?.studentProfile) {
        if (updatePayload.name) req.studentUser.studentProfile.name = updatePayload.name;
        if (updatePayload.timezone) req.studentUser.studentProfile.timezone = updatePayload.timezone;
        if (updatePayload.whatsapp !== undefined) req.studentUser.studentProfile.whatsapp = updatePayload.whatsapp;
        if (updatePayload.country !== undefined) req.studentUser.studentProfile.country = updatePayload.country;
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
        status: req.studentUser?.studentProfile?.status || 'active',
        updatedAt: new Date().toISOString()
      });
    }

    const { data: updatedStudent, error: updateError } = await supabaseAdmin
      .from('students')
      .update(updatePayload)
      .eq('id', studentId)
      .select('id, name, email, whatsapp, country, timezone, learner_type, current_level, status, created_at, updated_at')
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
      status: updatedStudent.status,
      updatedAt: updatedStudent.updated_at
    });
  } catch (err: any) {
    console.error('[PATCH /api/student/me Error]', err);
    return res.status(500).json({ error: 'Internal server error updating student profile.' });
  }
});

// GET /api/student/bookings - Retrieve authenticated student's bookings
app.get('/api/student/bookings', verifyStudentAuth, async (req: any, res: any) => {
  try {
    const studentId = req.studentUser?.student_id;
    if (!studentId) {
      return res.json([]);
    }

    const isProd = process.env.NODE_ENV === 'production';
    const supabaseAdmin = getSupabaseAdminClient();
    if (!supabaseAdmin || (!isProd && req.studentUser?.studentProfile)) {
      return res.json([]);
    }

    // Auto-link any existing guest bookings that match this student's email where student_id is null
    if (req.studentUser?.email) {
      try {
        await supabaseAdmin
          .from('bookings')
          .update({ student_id: studentId })
          .is('student_id', null)
          .ilike('contact_email', req.studentUser.email);
      } catch (linkErr) {
        console.warn('[Auto-link Bookings Warning]', linkErr);
      }
    }

    // Fetch bookings belonging strictly to this authenticated student
    const { data: bookingsData, error: bookingsError } = await supabaseAdmin
      .from('bookings')
      .select('id, reference_code, service_id, booking_type, duration_minutes, scheduled_start, scheduled_end, student_timezone, status, contact_name, contact_email, fee_amount_usd, zoom_meeting_link, created_at')
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

    // Map to a clean, coherent DTO that matches both the new explicit contract and legacy fields
    const formattedBookings = (bookingsData || []).map((b: any) => {
      const s = serviceMap.get(b.service_id);
      const serviceTitle = s?.title || 'Lesson';
      const zoomUrl = (b.zoom_meeting_link && typeof b.zoom_meeting_link === 'string' && b.zoom_meeting_link.trim().length > 0)
        ? b.zoom_meeting_link.trim()
        : null;

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
        feeAmountUsd: b.fee_amount_usd,
        zoomMeetingLink: zoomUrl,
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


export {
  ALLOWED_LEAD_TRANSITIONS,
  VALID_LEAD_STATUSES,
  isAllowedLeadTransition
};

export default app;
