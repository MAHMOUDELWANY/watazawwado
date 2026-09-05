/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — GOOGLE CALENDAR INTEGRATION
 * File: api/integrations/googleCalendar.ts
 * Role: Robust, Server-Side Google Calendar v3 OAuth & Event Sync
 * ====================================================================
 */

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  tokenType?: string;
  scope?: string;
}

export interface CalendarEventPayload {
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
 * Searches for an existing calendar event matching the booking reference code to prevent duplicates.
 */
export async function findExistingGoogleCalendarEvent(
  accessToken: string,
  referenceCode: string,
  calendarId = 'primary'
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
    const matched = items.find((item: any) =>
      item.summary?.includes(referenceCode) ||
      item.description?.includes(referenceCode) ||
      item.extendedProperties?.private?.booking_reference === referenceCode
    );

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
 * Employs idempotency and structured extendedProperties.
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  booking: CalendarEventPayload,
  calendarId = 'primary'
): Promise<{ eventId: string; htmlLink: string }> {
  // 1. Check if event was already created on a previous attempt
  const existing = await findExistingGoogleCalendarEvent(accessToken, booking.referenceCode, calendarId);
  if (existing) {
    // Already created, update times if needed
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
        booking_mode: booking.mode
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

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Google Calendar event creation failed (${response.status}): ${err}`);
  }

  const result = await response.json();
  return {
    eventId: result.id,
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
