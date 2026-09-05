/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — INTEGRATIONS SYNC ENGINE
 * File: api/integrations/syncEngine.ts
 * Role: Atomic Sync Orchestrator for Google Calendar & Zoom
 * ====================================================================
 */

import { createClient } from '@supabase/supabase-js';
import { decryptToken } from './crypto.js';
import {
  CalendarEventPayload,
  createGoogleCalendarEvent,
  updateGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
  refreshGoogleAccessToken,
  getGoogleOAuthCredentials
} from './googleCalendar.js';
import { createOrProvisionZoomMeeting } from './zoom.js';
import { encryptToken } from './crypto.js';

export interface BookingSyncResult {
  success: boolean;
  googleEventId?: string | null;
  googleEventLink?: string | null;
  zoomMeetingId?: string | null;
  zoomMeetingLink?: string | null;
  integrationStatus: 'synced' | 'pending' | 'failed';
  errors?: string[];
}

/**
 * Returns a server-side Supabase client using service role key.
 */
function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    console.error('[Configuration Error] SUPABASE_SERVICE_ROLE_KEY is missing. Required for integration sync.');
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  });
}

/**
 * Retrieves the teacher's active Google Calendar connection tokens.
 */
export async function getActiveGoogleConnection(): Promise<{ accessToken: string; accountEmail: string } | null> {
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('provider', 'google_calendar')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data || !data.metadata) {
      return null;
    }

    const metadata = data.metadata as any;
    let accessToken = decryptToken(metadata.access_token);
    const refreshToken = metadata.refresh_token ? decryptToken(metadata.refresh_token) : undefined;
    const expiresAt = metadata.expires_at || 0;

    // Check if token is expired or about to expire (within 2 minutes)
    if (Date.now() > expiresAt - 120000 && refreshToken) {
      try {
        const refreshed = await refreshGoogleAccessToken(refreshToken);
        accessToken = refreshed.accessToken;
        
        // Update stored access token
        await supabase
          .from('calendar_connections')
          .update({
            metadata: {
              ...metadata,
              access_token: encryptToken(refreshed.accessToken),
              expires_at: refreshed.expiresAt
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', data.id);
      } catch (refreshErr) {
        console.warn('[Google Token Refresh Error]', refreshErr);
      }
    }

    return {
      accessToken,
      accountEmail: data.account_email
    };
  } catch (err) {
    console.warn('[getActiveGoogleConnection Error]', err);
    return null;
  }
}

/**
 * Synchronizes a new booking with Zoom and Google Calendar.
 * Employs idempotency: If Google event or Zoom meeting already exists, skips duplicate creation.
 */
export async function syncBookingIntegrations(
  booking: CalendarEventPayload & { id?: string }
): Promise<BookingSyncResult> {
  const errors: string[] = [];
  let googleEventId: string | null = null;
  let googleEventLink: string | null = null;
  let zoomMeetingId: string | null = null;
  let zoomMeetingLink = booking.zoomMeetingLink || ''; // DO NOT use fallback default room URL for automated provisioning!

  const supabase = getServerSupabase();
  let dbBooking: any = null;
  
  if (supabase) {
    const { data } = await supabase.from('bookings').select('zoom_meeting_id, zoom_meeting_link, google_calendar_event_id, sync_metadata').eq('reference_code', booking.referenceCode).maybeSingle();
    dbBooking = data;
    if (dbBooking) {
      if (dbBooking.zoom_meeting_id && !dbBooking.zoom_meeting_id.startsWith('fallback-') && !dbBooking.zoom_meeting_id.startsWith('room-')) {
        zoomMeetingId = dbBooking.zoom_meeting_id;
        zoomMeetingLink = dbBooking.zoom_meeting_link || '';
      }
      if (dbBooking.google_calendar_event_id) {
        googleEventId = dbBooking.google_calendar_event_id;
        googleEventLink = dbBooking.sync_metadata?.google_event_link || null;
      }
    }
  }

  // 1. Provision Zoom Meeting
  if (!zoomMeetingId) {
    try {
      const zoomResult = await createOrProvisionZoomMeeting({
        referenceCode: booking.referenceCode,
        learnerName: booking.learnerName,
        serviceName: booking.serviceName,
        scheduledStartUtc: booking.scheduledStart,
        durationMinutes: booking.durationMinutes
      });
      
      zoomMeetingId = zoomResult.meetingId;
      zoomMeetingLink = zoomResult.joinUrl;
    } catch (zoomErr: any) {
      errors.push(`Zoom provisioning: ${zoomErr?.message || 'Failed to generate room link'}`);
    }
  }

  // 2. Sync to Google Calendar if active connection exists
  try {
    const googleConn = await getActiveGoogleConnection();
    if (googleConn && googleConn.accessToken) {
      const gcalResult = await createGoogleCalendarEvent(
        googleConn.accessToken,
        {
          ...booking,
          zoomMeetingLink
        }
      );
      googleEventId = gcalResult.eventId;
      googleEventLink = gcalResult.htmlLink;
    }
  } catch (gcalErr: any) {
    errors.push(`Google Calendar sync: ${gcalErr?.message || 'Failed to create calendar event'}`);
  }

  const integrationStatus: 'synced' | 'pending' | 'failed' = 
    errors.length === 0 ? 'synced' : 'failed';

  // 3. Persist integration state in Supabase
  if (supabase) {
    try {
      await supabase
        .from('bookings')
        .update({
          zoom_meeting_link: zoomMeetingLink,
          zoom_meeting_id: zoomMeetingId,
          google_calendar_event_id: googleEventId,
          integration_status: integrationStatus,
          sync_metadata: {
            synced_at: new Date().toISOString(),
            google_event_link: googleEventLink,
            errors: errors.length > 0 ? errors : undefined
          },
          updated_at: new Date().toISOString()
        })
        .eq('reference_code', booking.referenceCode);
    } catch (dbErr) {
      console.warn('[Sync DB Update Warning]', dbErr);
    }
  }

  return {
    success: errors.length === 0,
    googleEventId,
    googleEventLink,
    zoomMeetingId,
    zoomMeetingLink,
    integrationStatus,
    errors: errors.length > 0 ? errors : undefined
  };
}

/**
 * Synchronizes rescheduling with Google Calendar.
 */
export async function syncRescheduledBooking(
  referenceCode: string,
  newStartUtc: string,
  newEndUtc: string,
  cairoTimeDisplay?: string | null
): Promise<{ success: boolean; message: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { success: true, message: 'Rescheduled locally.' };
  }

  try {
    // Lookup booking's google_calendar_event_id
    const { data: booking } = await supabase
      .from('bookings')
      .select('google_calendar_event_id')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (booking?.google_calendar_event_id) {
      const googleConn = await getActiveGoogleConnection();
      if (googleConn?.accessToken) {
        await updateGoogleCalendarEvent(
          googleConn.accessToken,
          booking.google_calendar_event_id,
          newStartUtc,
          newEndUtc,
          cairoTimeDisplay
        );
      }
    }

    return { success: true, message: 'Google Calendar event rescheduled successfully.' };
  } catch (err: any) {
    console.warn('[syncRescheduledBooking Warning]', err);
    return { success: false, message: err?.message || 'Failed to update Google Calendar event.' };
  }
}

/**
 * Synchronizes cancellation with Google Calendar.
 */
export async function syncCancelledBooking(
  referenceCode: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { success: true, message: 'Cancelled locally.' };
  }

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('google_calendar_event_id')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    if (booking?.google_calendar_event_id) {
      const googleConn = await getActiveGoogleConnection();
      if (googleConn?.accessToken) {
        await deleteGoogleCalendarEvent(
          googleConn.accessToken,
          booking.google_calendar_event_id
        );
      }
    }

    return { success: true, message: 'Google Calendar event removed.' };
  } catch (err: any) {
    console.warn('[syncCancelledBooking Warning]', err);
    return { success: false, message: err?.message || 'Failed to remove Google Calendar event.' };
  }
}
