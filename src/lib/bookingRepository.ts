import { supabase, isSupabaseConfigured } from './supabase';
import {
  BookingFormData,
  MockBookingRecord,
} from '../booking/types';
import { calculateLessonFee } from '../booking/mockData';
import {
  calculateUtcTimes,
} from './timezone';

const isProduction = Boolean((import.meta as any).env?.PROD);

export interface TrialEligibilityResult {
  eligible: boolean;
  reason?: string;
}

export interface BookingSubmissionResult {
  success: boolean;
  referenceCode?: string;
  managementToken?: string;
  message?: string;
  bookingDetails?: any;
  error?: string;
}

export const bookingRepository = {
  mockBookingStore: [] as MockBookingRecord[],

  async checkTrialEligibility(email: string, whatsapp?: string): Promise<TrialEligibilityResult> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = whatsapp ? whatsapp.replace(/[^0-9+]/g, '') : '';

    if (!cleanEmail) {
      return { eligible: false, reason: 'A valid email address is required to verify trial eligibility.' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('check_trial_eligibility', {
          p_email: cleanEmail,
          p_whatsapp: cleanPhone || undefined,
        });

        if (!rpcError && typeof rpcResult === 'boolean') {
          if (!rpcResult) {
            return {
              eligible: false,
              reason: 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message us on WhatsApp and we will help.',
            };
          }
          return { eligible: true };
        }
      } catch (err) {
        console.warn('Supabase trial eligibility check failed, failing closed for safety.');
        return { eligible: false, reason: 'Unable to verify trial eligibility due to a server error. Please try again later.' };
      }
    }

    // Local fallback check in mock store if Supabase is not configured
    const existing = this.mockBookingStore.find(
      (b) => b.mode === 'trial' && (b.email === cleanEmail || (cleanPhone && b.whatsapp === cleanPhone))
    );
    if (existing) {
      return {
        eligible: false,
        reason: 'A complimentary trial session has already been booked with this email in this session.',
      };
    }

    if (isProduction && !isSupabaseConfigured()) {
      return { eligible: false, reason: 'Service is currently unavailable. Please try again later.' };
    }

    return { eligible: true };
  },

  calculateUtcTimes(dateStr: string, time24Str: string, timezone: string, durationMinutes: number) {
    return calculateUtcTimes(dateStr, time24Str, timezone, durationMinutes);
  },

  async submitBooking(data: BookingFormData): Promise<BookingSubmissionResult> {
    const isTrial = data.mode === 'trial';
    const contactEmail = (data.audience === 'child' ? data.parentEmail || '' : data.email || '').trim().toLowerCase();
    const contactWhatsapp = (data.audience === 'child' ? data.parentWhatsapp || '' : data.whatsapp || '').trim();
    const learnerName = (data.audience === 'child' ? data.childName || '' : data.studentName || '').trim();
    const parentName = data.audience === 'child' ? (data.parentName || '').trim() : undefined;

    if (!contactEmail || !contactEmail.includes('@')) {
      return { success: false, error: 'A valid contact email address is required.' };
    }
    if (!learnerName || learnerName.length < 2) {
      return { success: false, error: 'Please provide the student’s name.' };
    }
    if (data.audience === 'child' && (!parentName || parentName.length < 2)) {
      return { success: false, error: 'Parent or guardian name is required for child learners.' };
    }
    if (!data.timeSlot) {
      return { success: false, error: 'Please select an available lesson time slot.' };
    }

    if (isTrial) {
      const eligibility = await this.checkTrialEligibility(contactEmail, contactWhatsapp);
      if (!eligibility.eligible) {
        return { success: false, error: eligibility.reason || 'One free trial allowed per new student.' };
      }
    }

    let scheduledStartUtc: string;
    let scheduledEndUtc: string;
    let cairoTimeDisplay: string;

    try {
      const times = calculateUtcTimes(
        data.date,
        data.timeSlot.time24,
        data.timezone,
        data.duration
      );
      scheduledStartUtc = times.scheduledStartUtc;
      scheduledEndUtc = times.scheduledEndUtc;
      cairoTimeDisplay = times.cairoTimeDisplay;
    } catch (tzErr: any) {
      return { success: false, error: `Invalid date or time scheduling: ${tzErr?.message || 'Please verify selected slot.'}` };
    }

    // Server-side slot pre-validation to avoid double booking
    try {
      const valRes = await fetch('/api/integrations/validate-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledStartUtc, scheduledEndUtc })
      });
      if (valRes.ok) {
        const valData = await valRes.json();
        if (valData.isAvailable === false) {
          return {
            success: false,
            error: valData.conflictReason || 'This time slot is no longer available. Please select another slot.'
          };
        }
      }
    } catch {
      // Graceful fallback if offline
    }

    let referenceCode = `MHM-${Math.floor(10000 + Math.random() * 90000)}`;
    let managementToken = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `tok_${Date.now()}`;
    let zoomMeetingLink = '';
    let serviceName = '1-on-1 Lesson';
    let feeAmountUsd = calculateLessonFee(data.serviceId, data.duration, isTrial);
    let studentIdToLink: string | null = (data as any).studentId || null;
    let bookingStatus: 'confirmed' | 'pending' = isTrial || Boolean(data.packageEntitlementId) ? 'confirmed' : 'pending';

    try {
      let token: string | null = null;
      try {
        const { getFreshAccessToken } = await import('./auth');
        token = await getFreshAccessToken();
      } catch {}

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/bookings/create', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          serviceId: data.serviceId,
          duration: data.duration,
          date: data.date,
          timeSlot: data.timeSlot,
          timezone: data.timezone,
          contactName: learnerName,
          contactEmail,
          contactWhatsapp,
          parentName: parentName || null,
          audience: data.audience,
          goal: data.goal === 'custom' ? data.customGoalText : data.goal,
          notes: data.audience === 'child' ? data.parentNotes : data.notes,
          teacherId: (data as any).teacherId,
          packageEntitlementId: data.packageEntitlementId || null,
          acceptedTerms: data.acceptedTerms === true,
          acceptedEarlyStart: data.acceptedEarlyStart === true,
          package_entitlement_id: data.packageEntitlementId || null,
          studentId: studentIdToLink,
          mode: data.mode
        })
      });

      const resData = await res.json().catch(() => ({}));
      if (!res.ok || !resData.success) {
        return {
          success: false,
          error: resData.error || 'Booking failed due to server error. Please try again.'
        };
      }

      referenceCode = resData.referenceCode;
      managementToken = resData.managementToken;
      serviceName = resData.serviceName || serviceName;
      feeAmountUsd = resData.feeAmountUsd !== undefined ? resData.feeAmountUsd : feeAmountUsd;
      zoomMeetingLink = resData.zoomMeetingLink || zoomMeetingLink;
      bookingStatus = resData.status || bookingStatus;
    } catch (err: any) {
      console.error('Server booking error:', err);
      return { success: false, error: 'Database service is currently unavailable. Please try again later or message us on WhatsApp.' };
    }

    // Trigger Server-Side Integrations (Google Calendar & Zoom) only for confirmed bookings
    let googleCalendarEventId: string | null = null;
    let integrationStatus: 'synced' | 'pending' = 'pending';

    if (bookingStatus === 'confirmed') {
      try {
        const syncRes = await fetch('/api/integrations/sync-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking: {
              referenceCode,
              managementToken,
              learnerName,
              parentName,
              serviceName,
              mode: isTrial ? 'trial' : 'regular',
              scheduledStart: scheduledStartUtc,
              scheduledEnd: scheduledEndUtc,
              studentTimezone: data.timezone,
              cairoTimeDisplay,
              durationMinutes: data.duration,
              zoomMeetingLink,
              contactEmail,
              contactWhatsapp,
              notes: data.audience === 'child' ? data.parentNotes : data.notes
            }
          })
        });

        if (syncRes.ok) {
          const syncData = await syncRes.json();
          if (syncData.zoomMeetingLink) {
            zoomMeetingLink = syncData.zoomMeetingLink;
          }
          if (syncData.googleEventId) {
            googleCalendarEventId = syncData.googleEventId;
          }
          integrationStatus = syncData.integrationStatus || 'synced';
        }
      } catch (syncErr) {
        console.warn('[Sync API Client Warning]', syncErr);
      }
    }

    const bookingResult: MockBookingRecord = {
      reference: referenceCode,
      managementToken,
      mode: isTrial ? 'trial' : 'regular',
      serviceName,
      learnerName,
      parentName,
      feeAmountUsd,
      zoomMeetingLink,
      googleCalendarEventId,
      integrationStatus,
      scheduledIsoDatetime: scheduledStartUtc,
      scheduledEndIsoDatetime: scheduledEndUtc,
      durationMinutes: data.duration,
      timezone: data.timezone,
      cairoTimeDisplay,
      status: bookingStatus,
      email: contactEmail,
      whatsapp: contactWhatsapp
    };

    if (!isSupabaseConfigured()) {
      this.mockBookingStore.push(bookingResult);
    }

    return {
      success: true,
      referenceCode,
      managementToken,
      message: bookingStatus === 'confirmed' ? 'Your booking has been successfully secured.' : 'Your booking reservation has been created.',
      bookingDetails: bookingResult as any
    };
  },

  async lookupBooking(cleanRef: string, managementToken?: string): Promise<MockBookingRecord | null> {
    if (isSupabaseConfigured() && managementToken) {
      try {
        const { data, error } = await supabase.rpc('get_booking_management', {
          p_reference_code: cleanRef,
          p_management_token: managementToken,
        });

        if (error || !data) return null;

        return {
          reference: data.reference,
          managementToken: data.managementToken || managementToken,
          mode: data.mode,
          serviceName: data.serviceName,
          learnerName: data.learnerName,
          parentName: data.parentName,
          feeAmountUsd: data.feeAmountUsd,
          zoomMeetingLink: data.zoomMeetingLink,
          googleCalendarEventId: data.googleCalendarEventId,
          integrationStatus: data.integrationStatus || 'synced',
          scheduledIsoDatetime: data.scheduledIsoDatetime,
          scheduledEndIsoDatetime: data.scheduledEndIsoDatetime,
          durationMinutes: data.durationMinutes,
          timezone: data.timezone,
          cairoTimeDisplay: data.cairoTimeDisplay,
          status: data.status,
          email: 'hidden',
          whatsapp: 'hidden'
        };
      } catch (err) {
        console.error('Database lookup failed:', err);
        return null;
      }
    }

    // In production / configured Supabase environment, never fall back to in-memory mock storage
    if (isSupabaseConfigured()) {
      return null;
    }

    // Local store lookup (only in unconfigured / offline development mode)
    const found = this.mockBookingStore.find(
      (b) => b.reference.toUpperCase() === cleanRef.toUpperCase() && (!managementToken || b.managementToken === managementToken)
    );
    return found || null;
  }
};
