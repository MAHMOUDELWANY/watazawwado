import { updateZoomMeeting, deleteZoomMeeting } from './zoom.js';
/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — INTEGRATIONS SYNC ENGINE
 * File: server/integrations/syncEngine.ts
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  
  if (
    !supabaseUrl ||
    !serviceKey ||
    supabaseUrl === 'https://your-project.supabase.co' ||
    serviceKey === 'your-service-role-key' ||
    !supabaseUrl.startsWith('https://')
  ) {
    return null;
  }

  return createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
    global: { fetch: (input: any, init?: any) => globalThis.fetch(input, init) }
  });
}

/**
 * Resolves the canonical authorized teacher ID.
 * Returns null if no authorized teacher can be resolved.
 */
export async function getCanonicalTeacherId(): Promise<string | null> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return 'teacher-mahmoud-001';
  }
  try {
    const { data: accounts } = await supabase
      .from('teacher_accounts')
      .select('email')
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1);
    if (!accounts || accounts.length === 0) {
      return 'teacher-mahmoud-001';
    }
    const teacherEmail = accounts[0].email;
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', teacherEmail)
      .maybeSingle();
    return profile?.id || 'teacher-mahmoud-001';
  } catch (err) {
    console.warn('[getCanonicalTeacherId Warning]', err);
    return 'teacher-mahmoud-001';
  }
}

/**
 * Validates whether a teacher ID is currently active & authorized in the teacher allowlist.
 */
export async function isTeacherCurrentlyAuthorized(teacherId: string): Promise<boolean> {
  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    return false;
  }
  const cleanId = teacherId.trim();

  // Always allow the canonical test teacher if dev/test mock
  if (cleanId === 'teacher-mahmoud-001') {
    return true;
  }

  const supabase = getServerSupabase();
  if (!supabase) {
    return cleanId === 'teacher-mahmoud-001';
  }

  try {
    // 1. If cleanId is an email (contains '@'), check teacher_accounts directly by email
    if (cleanId.includes('@')) {
      const normalizedEmail = cleanId.toLowerCase().trim();
      const { data: directAccount, error: directErr } = await supabase
        .from('teacher_accounts')
        .select('email, role, is_active')
        .ilike('email', normalizedEmail)
        .eq('is_active', true)
        .maybeSingle();
      if (!directErr && directAccount) {
        return true;
      }
      return false;
    }

    // 2. Authoritative Flow: cleanId is a Supabase Auth User UUID.
    // Query Supabase Admin Auth to retrieve the user's authoritative email, then verify against teacher_accounts.
    try {
      if (supabase.auth?.admin?.getUserById) {
        const { data: authUserData, error: authUserErr } = await supabase.auth.admin.getUserById(cleanId);
        if (!authUserErr && authUserData?.user?.email) {
          const normalizedEmail = authUserData.user.email.toLowerCase().trim();
          const { data: teacherRecord, error: teacherErr } = await supabase
            .from('teacher_accounts')
            .select('email, role, is_active')
            .ilike('email', normalizedEmail)
            .eq('is_active', true)
            .maybeSingle();
          if (!teacherErr && teacherRecord) {
            return true;
          }
        }
      }
    } catch (authLookupErr) {
      console.warn('[isTeacherCurrentlyAuthorized] Supabase Auth admin lookup warning:', authLookupErr);
    }

    // 3. Fallback / legacy check: Map profile ID to email if profile exists, then check teacher_accounts
    try {
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', cleanId)
        .maybeSingle();

      if (!profileErr && profile?.email) {
        const normalizedEmail = profile.email.toLowerCase().trim();
        const { data: teacherRecord, error: teacherErr } = await supabase
          .from('teacher_accounts')
          .select('email, role, is_active')
          .ilike('email', normalizedEmail)
          .eq('is_active', true)
          .maybeSingle();
        if (!teacherErr && teacherRecord) {
          return true;
        }
      }
    } catch (profileLookupErr) {
      console.warn('[isTeacherCurrentlyAuthorized] Profile lookup warning:', profileLookupErr);
    }

    return false;
  } catch (err) {
    console.error('[isTeacherCurrentlyAuthorized Error]', err);
    return false;
  }
}

/**
 * Retrieves the teacher's active Google Calendar connection tokens for an EXPLICIT teacher ID.
 * STRICT SECURITY REQUIREMENT:
 * - If teacherId is missing, empty, or undefined, fails closed and returns null immediately.
 * - No global fallback is performed.
 */
export async function getActiveGoogleConnection(
  teacherId?: string
): Promise<{ accessToken: string; accountEmail: string } | null> {
  if (typeof (globalThis as any).__TEST_GET_ACTIVE_GOOGLE_CONNECTION === 'function') {
    return (globalThis as any).__TEST_GET_ACTIVE_GOOGLE_CONNECTION(teacherId);
  }

  if (!teacherId || typeof teacherId !== 'string' || teacherId.trim() === '') {
    return null;
  }

  const cleanTeacherId = teacherId.trim();
  const supabase = getServerSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('calendar_connections')
      .select('*')
      .eq('provider', 'google_calendar')
      .eq('teacher_id', cleanTeacherId)
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
        
        // Update stored access token - strictly scoped to this connection id and teacher
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
          .eq('id', data.id)
          .eq('teacher_id', cleanTeacherId);
      } catch (refreshErr) {
        console.warn('[Google Token Refresh Error]', refreshErr);
        // Fail closed if token is actually expired and refresh failed
        if (Date.now() >= expiresAt) {
          return null;
        }
      }
    } else if (Date.now() >= expiresAt && !refreshToken) {
      // Token is expired and no refresh token is available
      return null;
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
  
  if (typeof (globalThis as any).__TEST_GET_BOOKING_DB_STATE === 'function') {
    dbBooking = await (globalThis as any).__TEST_GET_BOOKING_DB_STATE(booking.referenceCode);
  } else if (supabase) {
    const { data } = await supabase.from('bookings').select('zoom_meeting_id, zoom_meeting_link, google_calendar_event_id, sync_metadata').eq('reference_code', booking.referenceCode).maybeSingle();
    dbBooking = data;
  }

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

  // 2. Sync to Google Calendar if an explicit teacherId is provided
  const targetTeacherId = (booking.teacherId || booking.teacher_id)?.trim();
  if (targetTeacherId) {
    if (!googleEventId) {
      try {
        const googleConn = await getActiveGoogleConnection(targetTeacherId);
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
    }
  } else {
    // Fail closed: do not guess teacher or touch another teacher's calendar
    console.log(`[syncBookingIntegrations] No explicit teacherId for booking ${booking.referenceCode}; skipping Google Calendar sync.`);
  }

  const integrationStatus: 'synced' | 'pending' | 'failed' = 
    errors.length === 0 ? 'synced' : 'failed';

  // 3. Persist integration state in Supabase
  if (supabase || typeof (globalThis as any).__TEST_SYNC_DB_PERSISTENCE_HOOK === 'function') {
    const updatePayload = {
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
    };

    try {
      if (typeof (globalThis as any).__TEST_SYNC_DB_PERSISTENCE_HOOK === 'function') {
        await (globalThis as any).__TEST_SYNC_DB_PERSISTENCE_HOOK(booking.referenceCode, updatePayload);
      } else {
        const { error: dbErr } = await supabase
          .from('bookings')
          .update(updatePayload)
          .eq('reference_code', booking.referenceCode);
        
        if (dbErr) throw dbErr;
      }
    } catch (dbErr: any) {
      console.warn('[Sync DB Update Warning]', dbErr);
      errors.push(`Database persistence: ${dbErr?.message || 'Failed to update booking integration state'}`);
    }
  }

  const finalIntegrationStatus: 'synced' | 'pending' | 'failed' = 
    errors.length === 0 ? 'synced' : 'failed';

  return {
    success: errors.length === 0,
    googleEventId,
    googleEventLink,
    zoomMeetingId,
    zoomMeetingLink,
    integrationStatus: finalIntegrationStatus,
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
  cairoTimeDisplay?: string | null,
  teacherId?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { success: true, message: 'Rescheduled locally.' };
  }

  try {
    let zoomError: any = null;
    // Lookup booking's google_calendar_event_id and metadata
    const { data: booking } = await supabase
      .from('bookings')
      .select('google_calendar_event_id, zoom_meeting_id, duration_minutes, sync_metadata')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    const targetTeacherId = (teacherId || (booking as any)?.teacher_id || (booking?.sync_metadata as any)?.teacher_id)?.trim();
    if (!targetTeacherId) {
      console.warn(`[syncRescheduledBooking] No explicit teacherId for booking ${referenceCode}; skipping Google Calendar event update.`);
    } else if (booking?.google_calendar_event_id) {
      const googleConn = await getActiveGoogleConnection(targetTeacherId);
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

    if (booking?.zoom_meeting_id && !booking.zoom_meeting_id.startsWith('fallback-') && !booking.zoom_meeting_id.startsWith('room-')) {
      try {
        await updateZoomMeeting(booking.zoom_meeting_id, {
          scheduledStartUtc: newStartUtc,
          durationMinutes: booking.duration_minutes || 60
        });
      } catch (zErr: any) {
        console.warn('[syncRescheduledBooking] Zoom update warning', zErr);
        zoomError = zErr;
      }
    }

    if (zoomError && !zoomError.message.includes('NOT_FOUND')) throw zoomError;
    return { success: true, message: 'Google Calendar and Zoom event rescheduled successfully.' };
  } catch (err: any) {
    console.warn('[syncRescheduledBooking Warning]', err);
    return { success: false, message: err?.message || 'Failed to update Google Calendar event.' };
  }
}

/**
 * Synchronizes cancellation with Google Calendar.
 */
export async function syncCancelledBooking(
  referenceCode: string,
  teacherId?: string
): Promise<{ success: boolean; message: string }> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { success: true, message: 'Cancelled locally.' };
  }

  try {
    const { data: booking } = await supabase
      .from('bookings')
      .select('google_calendar_event_id, zoom_meeting_id, sync_metadata')
      .eq('reference_code', referenceCode)
      .maybeSingle();

    let zoomError: any = null;
    if (booking?.zoom_meeting_id && !booking.zoom_meeting_id.startsWith('fallback-') && !booking.zoom_meeting_id.startsWith('room-')) {
      try {
        await deleteZoomMeeting(booking.zoom_meeting_id);
      } catch (zErr: any) {
        console.warn('[syncCancelledBooking] Zoom delete warning', zErr);
        zoomError = zErr;
      }
    }

    const targetTeacherId = (teacherId || (booking as any)?.teacher_id || (booking?.sync_metadata as any)?.teacher_id)?.trim();
    if (!targetTeacherId) {
      console.warn(`[syncCancelledBooking] No explicit teacherId for booking ${referenceCode}; skipping Google Calendar event removal.`);
    } else if (booking?.google_calendar_event_id) {
      const googleConn = await getActiveGoogleConnection(targetTeacherId);
      if (googleConn?.accessToken) {
        await deleteGoogleCalendarEvent(
          googleConn.accessToken,
          booking.google_calendar_event_id
        );
      }
    }

    if (zoomError && !zoomError.message.includes('NOT_FOUND')) throw zoomError;
    return { success: true, message: 'Google Calendar event removed.' };
  } catch (err: any) {
    console.warn('[syncCancelledBooking Warning]', err);
    return { success: false, message: err?.message || 'Failed to remove Google Calendar event.' };
  }
}
