/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — ZOOM INTEGRATION
 * File: api/integrations/zoom.ts
 * Role: Server-Side Zoom Meeting Creation & Classroom Link Management
 * ====================================================================
 */

export interface ZoomMeetingResult {
  meetingId: string;
  joinUrl: string;
  passcode?: string;
  isDynamicMeeting: boolean;
  rawResponse?: any;
}

export interface ZoomMeetingOptions {
  referenceCode: string;
  learnerName: string;
  serviceName: string;
  scheduledStartUtc: string; // ISO 8601 UTC
  durationMinutes: number;
}

/**
 * Returns Zoom Server-to-Server OAuth credentials.
 */
export function getZoomCredentials() {
  const accountId = process.env.ZOOM_ACCOUNT_ID || '';
  const clientId = process.env.ZOOM_CLIENT_ID || '';
  const clientSecret = process.env.ZOOM_CLIENT_SECRET || '';
  return {
    accountId,
    clientId,
    clientSecret,
    isConfigured: Boolean(accountId && clientId && clientSecret)
  };
}

let cachedZoomToken: { accessToken: string; expiresAt: number } | null = null;

/**
 * Retrieves a valid Server-to-Server OAuth access token for Zoom API.
 */
async function getZoomAccessToken(): Promise<string> {
  const { accountId, clientId, clientSecret, isConfigured } = getZoomCredentials();
  
  if (!isConfigured) {
    throw new Error('Zoom API credentials are not configured.');
  }

  if (cachedZoomToken && Date.now() < cachedZoomToken.expiresAt - 60000) {
    return cachedZoomToken.accessToken;
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const tokenUrl = `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`;

  const response = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Zoom token request failed (${response.status}): ${err}`);
  }

  const data = await response.json();
  const expiresIn = data.expires_in || 3600;
  cachedZoomToken = {
    accessToken: data.access_token,
    expiresAt: Date.now() + expiresIn * 1000
  };

  return cachedZoomToken.accessToken;
}

/**
 * Creates or provisions a Zoom meeting for a scheduled teaching session.
 * 
 * If Zoom Server-to-Server OAuth is configured in environment, it creates
 * a dedicated meeting via the official Zoom API.
 * 
 * If credentials are not present or external API is temporarily unreachable,
 * it returns Mahmoud's configured teaching room link with a deterministic session reference.
 */
export async function createOrProvisionZoomMeeting(
  options: ZoomMeetingOptions
): Promise<ZoomMeetingResult> {
  const { isConfigured } = getZoomCredentials();

  // If credentials are not configured, throw error
  if (!isConfigured) {
    throw new Error('Zoom API credentials are not configured. Cannot provision meeting.');
  }

  try {
    const token = await getZoomAccessToken();
    const startTimeFormatted = options.scheduledStartUtc.replace(/\.\d{3}Z$/, 'Z');
    const expectedTopicSuffix = `[${options.referenceCode}]`;

    // 1. Reconcile: Check if a meeting was already created for this booking (in case local DB save failed previously)
    try {
      const searchRes = await fetch('https://api.zoom.us/v2/users/me/meetings?type=scheduled&page_size=300', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData && searchData.meetings) {
          const existingMeeting = searchData.meetings.find((m: any) => m.topic && m.topic.includes(expectedTopicSuffix));
          if (existingMeeting) {
            console.log(`[Zoom Idempotency] Found existing meeting ${existingMeeting.id} for ref ${options.referenceCode}`);
            return {
              meetingId: String(existingMeeting.id),
              joinUrl: existingMeeting.join_url,
              isDynamicMeeting: true,
              rawResponse: { id: existingMeeting.id, start_url: existingMeeting.start_url }
            };
          }
        }
      }
    } catch (searchErr) {
      console.warn('[Zoom Idempotency Check Warning] Failed to query existing meetings, proceeding with creation', searchErr);
    }

    // 2. Create if not found
    const payload = {
      topic: `Mahmoud Teaching: ${options.serviceName} (${options.learnerName}) ${expectedTopicSuffix}`,
      type: 2, // Scheduled meeting
      start_time: startTimeFormatted,
      duration: options.durationMinutes,
      timezone: 'UTC',
      settings: {
        host_video: true,
        participant_video: true,
        join_before_host: false,
        mute_upon_entry: false,
        waiting_room: true,
        audio: 'both',
        auto_recording: 'none'
      }
    };

    const res = await fetch('https://api.zoom.us/v2/users/me/meetings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const err = await res.text();
      console.error(`[Zoom API Error] Status ${res.status}: ${err}`);
      throw new Error(`Zoom API Error (${res.status}): ${err}`);
    }

    const meeting = await res.json();
    return {
      meetingId: String(meeting.id),
      joinUrl: meeting.join_url,
      passcode: meeting.password,
      isDynamicMeeting: true,
      rawResponse: { id: meeting.id, start_url: meeting.start_url }
    };
  } catch (error: any) {
    console.error(`[Zoom Provisioning Error]`, error);
    throw new Error(error?.message || 'Failed to provision Zoom meeting');
  }
}
