/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — GOOGLE CALENDAR INTEGRATION
 * File: server/integrations/googleCalendar.ts
 * Role: Robust, Server-Side Google Calendar v3 OAuth & Event Sync
 * ====================================================================
 */

import crypto from 'crypto';

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

export interface CalendarEventPayload {
  teacherId?: string;
  teacher_id?: string;
  referenceCode: string;
  learnerName: string;
  parentName?: string | null;
  serviceName: string;
  mode: 'trial' | 'regular';
  scheduledStart: string; // ISO 8601 UTC
  scheduledEnd: string;   // ISO 8601 UTC
  studentTimezone: string;
  cairoTimeDisplay?: string | null;
  durationMinutes: number;
  zoomMeetingLink: string;
  contactEmail: string;
  contactWhatsapp?: string | null;
  notes?: string | null;
}

export interface GoogleFreeBusyInterval {
  start: string;
  end: string;
}

/**
 * Returns Google OAuth client credentials safely from environment.
 */
export function getGoogleOAuthCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const isProduction = process.env.NODE_ENV === 'production';

  let redirectUri = '';
  if (process.env.GOOGLE_REDIRECT_URI) {
    try {
      const parsed = new URL(process.env.GOOGLE_REDIRECT_URI);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        redirectUri = process.env.GOOGLE_REDIRECT_URI;
      }
    } catch {
      redirectUri = '';
    }
  } else if (process.env.APP_URL) {
    try {
      const parsed = new URL(process.env.APP_URL);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        const base = parsed.origin;
        redirectUri = `${base}/api/integrations/google-calendar/callback`;
      }
    } catch {
      redirectUri = '';
    }
  } else if (!isProduction) {
    redirectUri = 'http://localhost:3000/api/integrations/google-calendar/callback';
  }

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret && redirectUri)
  };
}

/**
 * Generates the secure OAuth 2.0 Authorization URL for Mahmoud.
 */
export function generateGoogleAuthUrl(state = 'teacher_auth'): string {
  const { clientId, redirectUri, isConfigured } = getGoogleOAuthCredentials();
  
  if (!isConfigured) {
    throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL or GOOGLE_REDIRECT_URI in environment.');
  }

  const scopes = [
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/userinfo.email'
  ];

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopes.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    state
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchanges authorization code for Google access and refresh tokens.
 */
export async function exchangeGoogleCodeForTokens(code: string): Promise<GoogleTokens & { accountEmail: string }> {
  const { clientId, clientSecret, redirectUri, isConfigured } = getGoogleOAuthCredentials();

  if (!isConfigured) {
    throw new Error('Google OAuth is not configured. Please set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and APP_URL or GOOGLE_REDIRECT_URI in environment.');
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google token exchange failed (${response.status}): ${errText}`);
  }

  const tokenData = await response.json();
  const accessToken = tokenData.access_token;
  const refreshToken = tokenData.refresh_token;
  const expiresIn = tokenData.expires_in || 3600;
  const expiresAt = Date.now() + expiresIn * 1000;

  // Retrieve teacher's account email
  let accountEmail = 'teacher@mahmoudteaching.com';
  try {
    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (userInfoRes.ok) {
      const userInfo = await userInfoRes.json();
      if (userInfo.email) accountEmail = userInfo.email;
    }
  } catch {
    // Non-fatal fallback
  }

  return {
    accessToken,
    refreshToken,
    expiresAt,
    tokenType: tokenData.token_type || 'Bearer',
    scope: tokenData.scope,
    accountEmail
  };
}

/**
 * Refreshes an expired Google access token using the stored refresh token.
 */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number }> {
  const { clientId, clientSecret } = getGoogleOAuthCredentials();

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Google token refresh failed: ${errText}`);
  }

  const tokenData = await response.json();
  const expiresIn = tokenData.expires_in || 3600;
  return {
    accessToken: tokenData.access_token,
    expiresAt: Date.now() + expiresIn * 1000
  };
}

/**
 * Queries Google Calendar Free/Busy API to find conflicting events on Mahmoud's calendar.
 */
export async function queryGoogleFreeBusy(
  accessToken: string,
  timeMinIso: string,
  timeMaxIso: string,
  calendarId = 'primary'
): Promise<GoogleFreeBusyInterval[]> {
  const response = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      timeMin: timeMinIso,
      timeMax: timeMaxIso,
      timeZone: 'UTC',
      items: [{ id: calendarId }]
    })
  });

  if (!response.ok) {
    throw new Error(`Failed to query Google Calendar Free/Busy (${response.status})`);
  }

  const data = await response.json();
  const calendarBusy = data.calendars?.[calendarId]?.busy || [];
  return calendarBusy.map((b: any) => ({
    start: b.start,
    end: b.end
  }));
}

/**
 * Generates a deterministic SHA-256 hexadecimal event ID for Google Calendar.
 *
 * Google Calendar API v3 specification for event `id`:
 * - Characters allowed: lowercase digits 0-9 and letters a-v (length between 5 and 1024 chars).
 *
 * Deterministic SHA-256 output is 64 hexadecimal characters ([0-9a-f]).
 * Since [0-9a-f] is a strict subset of [0-9a-v], the lowercase hexadecimal
 * SHA-256 digest is guaranteed to be a valid Google Calendar event ID.
 *
 * Identity composition:
 * - referenceCode: Unique booking reference code (e.g. WTZ-2026-XXXXX)
 * - teacherId: Authoritative teacher ID (e.g. teacher-001)
 * This guarantees:
 * 1. Booking X with Teacher A -> deterministic ID A
 * 2. Booking X with Teacher B -> deterministic ID B (teacher isolation)
 * 3. Calling this N times concurrently produces identical ID
 */
export function generateDeterministicGoogleCalendarEventId(
  referenceCode: string,
  teacherId?: string | null
): string {
  const normRef = (referenceCode || '').trim().toLowerCase();
  const normTeacher = (teacherId || 'default').trim().toLowerCase();

  return crypto
    .createHash('sha256')
    .update(`watazawwado:${normRef}:${normTeacher}`)
    .digest('hex');
}

/**
 * Retrieves a single Google Calendar event by its ID.
 * Returns null if the event does not exist (404/410).
 * Throws explicit errors on authorization failure (401/403) or transient API errors (5xx).
 */
export async function getGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = 'primary'
): Promise<{ eventId: string; htmlLink: string; status?: string } | null> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  );

  if (response.status === 404 || response.status === 410) {
    return null;
  }

  if (response.status === 401 || response.status === 403) {
    const err = await response.text();
    throw new Error(`Google Calendar getEvent unauthorized (${response.status}): ${err}`);
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar getEvent error (${response.status}): ${err}`);
  }

  const data = await response.json();
  return {
    eventId: data.id,
    htmlLink: data.htmlLink || '',
    status: data.status
  };
}

/**
 * Searches for an existing calendar event matching the booking reference code to prevent duplicates.
 */
export async function findExistingGoogleCalendarEvent(
  accessToken: string,
  referenceCode: string,
  calendarId = 'primary',
  targetTeacherId?: string
): Promise<{ eventId: string; htmlLink: string } | null> {
  try {
    const query = encodeURIComponent(referenceCode);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?q=${query}&maxResults=5`,
      {
        headers: { Authorization: `Bearer ${accessToken}` }
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    const items = data.items || [];
    const matched = items.find((item: any) => {
      const matchesRef =
        item.summary?.includes(referenceCode) ||
        item.description?.includes(referenceCode) ||
        item.extendedProperties?.private?.booking_reference === referenceCode;

      if (!matchesRef) return false;

      const eventTeacherId = item.extendedProperties?.private?.teacher_id;
      if (eventTeacherId && targetTeacherId && eventTeacherId !== targetTeacherId) {
        return false;
      }
      return true;
    });

    if (matched) {
      return {
        eventId: matched.id,
        htmlLink: matched.htmlLink || ''
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Creates an event on Mahmoud's Google Calendar for a confirmed booking.
 * Employs deterministic event IDs, atomic insertion, and HTTP 409 Conflict reconciliation
 * to guarantee strict idempotency under concurrent workers, retries, and network timeouts.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  booking: CalendarEventPayload,
  calendarId = 'primary'
): Promise<{ eventId: string; htmlLink: string }> {
  const targetTeacherId = (booking.teacherId || booking.teacher_id || '').trim();
  const deterministicEventId = generateDeterministicGoogleCalendarEventId(
    booking.referenceCode,
    targetTeacherId
  );

  // 1. Direct O(1) lookup by deterministic event ID
  let existingById: { eventId: string; htmlLink: string; status?: string } | null = null;
  try {
    existingById = await getGoogleCalendarEvent(accessToken, deterministicEventId, calendarId);
  } catch (lookupErr: any) {
    // If it was an explicit auth error (401/403), rethrow immediately
    const msg = (lookupErr?.message || '').toLowerCase();
    if (msg.includes('unauthorized') || msg.includes('(401)') || msg.includes('(403)')) {
      throw lookupErr;
    }
    // For other transient errors before POST, proceed to try creation
  }

  if (existingById && existingById.status !== 'cancelled') {
    // Already created on Google Calendar. Update times if rescheduled
    await updateGoogleCalendarEvent(
      accessToken,
      existingById.eventId,
      booking.scheduledStart,
      booking.scheduledEnd,
      booking.cairoTimeDisplay,
      calendarId
    );
    return existingById;
  }

  // 2. Secondary recovery check: legacy search by reference code (for events created prior to deterministic IDs)
  const existingBySearch = await findExistingGoogleCalendarEvent(accessToken, booking.referenceCode, calendarId, targetTeacherId);
  if (existingBySearch) {
    await updateGoogleCalendarEvent(
      accessToken,
      existingBySearch.eventId,
      booking.scheduledStart,
      booking.scheduledEnd,
      booking.cairoTimeDisplay,
      calendarId
    );
    return existingBySearch;
  }

  const isTrial = booking.mode === 'trial';
  const prefix = isTrial ? '🌱 [Free Trial]' : '📖 [1-on-1 Lesson]';
  const summary = `${prefix} ${booking.serviceName} — ${booking.learnerName}`;

  const descriptionLines = [
    `🎓 Mahmoud 1-on-1 Teaching Session`,
    `----------------------------------------`,
    `Learner: ${booking.learnerName}${booking.parentName ? ` (Parent: ${booking.parentName})` : ''}`,
    `Subject: ${booking.serviceName}`,
    `Type: ${isTrial ? 'Complimentary Free Trial (30-45 min)' : 'Standard 1-on-1 Lesson'}`,
    `Duration: ${booking.durationMinutes} minutes`,
    ``,
    `🕒 Scheduled Times:`,
    `• Student Local Time: ${booking.studentTimezone}`,
    `• Cairo Time: ${booking.cairoTimeDisplay || 'Africa/Cairo'}`,
    ``,
    `🔗 Live Zoom Classroom:`,
    `${booking.zoomMeetingLink}`,
    ``,
    `📞 Student Contact:`,
    `• Email: ${booking.contactEmail}`,
    booking.contactWhatsapp ? `• WhatsApp: ${booking.contactWhatsapp}` : null,
    booking.notes ? `\n📝 Student Goals & Notes:\n${booking.notes}` : null,
    ``,
    `🔖 Reference Code: ${booking.referenceCode}`,
    `⚡ Auto-generated by Mahmoud Teaching Platform.`
  ].filter(Boolean);

  const eventBody = {
    id: deterministicEventId,
    summary,
    description: descriptionLines.join('\n'),
    start: {
      dateTime: booking.scheduledStart,
      timeZone: 'UTC'
    },
    end: {
      dateTime: booking.scheduledEnd,
      timeZone: 'UTC'
    },
    extendedProperties: {
      private: {
        platform: 'mahmoud_teaching_platform',
        booking_reference: booking.referenceCode,
        learner_name: booking.learnerName,
        service_name: booking.serviceName,
        booking_mode: booking.mode,
        idempotency_key: deterministicEventId,
        teacher_id: targetTeacherId
      }
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 1440 }, // 24 hours before
        { method: 'popup', minutes: 60 }    // 1 hour before
      ]
    }
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventBody)
  });

  // 3. Handle 409 Conflict: Concurrent worker or retry after lost response
  if (response.status === 409) {
    console.log(`[createGoogleCalendarEvent] Event ${deterministicEventId} already exists (HTTP 409 Conflict). Reconciling existing event.`);
    const existing = await getGoogleCalendarEvent(accessToken, deterministicEventId, calendarId);
    if (existing) {
      // Reconcile times if rescheduled
      await updateGoogleCalendarEvent(
        accessToken,
        existing.eventId,
        booking.scheduledStart,
        booking.scheduledEnd,
        booking.cairoTimeDisplay,
        calendarId
      );
      return existing;
    }
    // If GET returned null (404/410), event existence is unconfirmed on Google Calendar.
    // MUST NOT return a false-success stub! Throw a retryable error for the worker outbox.
    throw new Error(
      `Google Calendar event conflict (409) reconciliation pending for ${deterministicEventId}: remote event unavailable; retryable.`
    );
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar event creation failed (${response.status}): ${err}`);
  }

  const result = await response.json();
  return {
    eventId: result.id || deterministicEventId,
    htmlLink: result.htmlLink || ''
  };
}

/**
 * Updates an existing Google Calendar event when a booking is rescheduled.
 */
export async function updateGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  newStartUtc: string,
  newEndUtc: string,
  cairoTimeDisplay?: string | null,
  calendarId = 'primary'
): Promise<boolean> {
  const patchBody = {
    start: {
      dateTime: newStartUtc,
      timeZone: 'UTC'
    },
    end: {
      dateTime: newEndUtc,
      timeZone: 'UTC'
    }
  };

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patchBody)
    }
  );

  if (!response.ok) {
    if (response.status === 404 || response.status === 410) {
      console.warn(`[updateGoogleCalendarEvent] Event ${eventId} not found (status ${response.status}) on Google Calendar.`);
      return false;
    }
    const err = await response.text();
    throw new Error(`Google Calendar event update failed (${response.status}): ${err}`);
  }

  return true;
}

/**
 * Deletes or cancels a Google Calendar event when a booking is cancelled.
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  eventId: string,
  calendarId = 'primary'
): Promise<boolean> {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  // 204 No Content is success, 404/410 means already deleted
  if (response.status === 204 || response.status === 404 || response.status === 410) {
    return true;
  }

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar event deletion failed (${response.status}): ${err}`);
  }

  return true;
}
