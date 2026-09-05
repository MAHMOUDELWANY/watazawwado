import { supabase, isSupabaseConfigured } from './supabase';
import {
  BookingFormData,
  MockBookingRecord,
} from '../booking/types';
import {
  calculateUtcTimes,
  check3HourPolicyEligibility,
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
              reason: 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or contact Mahmoud directly on WhatsApp for manual assistance.',
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
    let feeAmountUsd = isTrial ? 0 : 7.00;

    if (isSupabaseConfigured()) {
      try {
        const { data: atomicResult, error: atomicError } = await supabase.rpc('create_booking_atomic', {
          p_booking: {
            contact_name: learnerName,
            contact_email: contactEmail,
            contact_whatsapp: contactWhatsapp,
            parent_name: parentName || null,
            audience: data.audience,
            service_id: data.serviceId,
            booking_type: isTrial ? 'trial' : 'regular',
            duration_minutes: data.duration,
            scheduled_start: scheduledStartUtc,
            scheduled_end: scheduledEndUtc,
            student_timezone: data.timezone,
            cairo_time_display: cairoTimeDisplay,
            goal: data.goal === 'custom' ? data.customGoalText : data.goal,
            notes: data.audience === 'child' ? data.parentNotes : data.notes,
          },
        });

        if (atomicError) {
          return { success: false, error: atomicError.message || 'Booking failed due to server error.' };
        }

        if (atomicResult) {
          referenceCode = atomicResult.referenceCode;
          managementToken = atomicResult.managementToken;
          serviceName = atomicResult.serviceName || serviceName;
          feeAmountUsd = atomicResult.feeAmountUsd || feeAmountUsd;
          zoomMeetingLink = atomicResult.zoomMeetingLink || zoomMeetingLink;
        }
      } catch (err: any) {
        console.error('Supabase atomic booking error:', err);
        return { success: false, error: 'Database service is currently unavailable. Please try again later or contact Mahmoud directly.' };
      }
    } else if (isProduction) {
      return { success: false, error: 'Database service is currently unavailable in production. Please try again later.' };
    }

    // Trigger Server-Side Integrations (Google Calendar & Zoom) asynchronously
    let googleCalendarEventId: string | null = null;
    let integrationStatus: 'synced' | 'pending' = 'pending';

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
      status: 'confirmed',
      email: contactEmail,
      whatsapp: contactWhatsapp
    };

    this.mockBookingStore.push(bookingResult);

    return {
      success: true,
      referenceCode,
      managementToken,
      message: 'Your booking has been successfully secured.',
      bookingDetails: bookingResult as any
    };
  },

  checkPolicyEligibility(scheduledIsoDatetime: string) {
    return check3HourPolicyEligibility(scheduledIsoDatetime);
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
      }
    }

    // Local store lookup
    const found = this.mockBookingStore.find(
      (b) => b.reference.toUpperCase() === cleanRef.toUpperCase() && (!managementToken || b.managementToken === managementToken)
    );
    return found || null;
  },

  async cancelBooking(cleanRef: string, token: string, reason?: string) {
    if (isSupabaseConfigured() && token) {
      try {
        const { error: rpcError } = await supabase.rpc('cancel_booking_by_management', {
          p_reference_code: cleanRef,
          p_management_token: token,
          p_reason: reason || 'Cancelled by student through portal',
        });
        
        if (rpcError) return { success: false, message: `Cancellation failed: ${rpcError.message}` };
      } catch (err: any) {
        return { success: false, message: `Cancellation failed: ${err?.message || 'Database error'}` };
      }
    }

    // Update local store
    const local = this.mockBookingStore.find((b) => b.reference.toUpperCase() === cleanRef.toUpperCase());
    if (local) {
      local.status = 'cancelled';
    }

    // Notify integration cancellation in background
    try {
      fetch('/api/integrations/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceCode: cleanRef, managementToken: token })
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return { success: true, message: `Booking ${cleanRef} has been cancelled.` };
  },

  async rescheduleBooking(cleanRef: string, token: string, newDate: string, newTime24: string, timezone: string, durationMinutes: number) {
    let scheduledStartUtc: string;
    let scheduledEndUtc: string;
    let cairoTimeDisplay: string;
    
    try {
      const times = calculateUtcTimes(newDate, newTime24, timezone, durationMinutes);
      scheduledStartUtc = times.scheduledStartUtc;
      scheduledEndUtc = times.scheduledEndUtc;
      cairoTimeDisplay = times.cairoTimeDisplay;
    } catch (e) {
      return { success: false, message: 'Invalid new date/time.' };
    }

    // Pre-validate slot availability for reschedule
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
            message: valData.conflictReason || 'The selected reschedule time slot is no longer available.'
          };
        }
      }
    } catch {
      // Non-blocking fallback
    }

    if (isSupabaseConfigured() && token) {
      try {
        const { error: rpcError } = await supabase.rpc('reschedule_booking_by_management', {
          p_reference_code: cleanRef,
          p_management_token: token,
          p_new_start: scheduledStartUtc,
          p_new_end: scheduledEndUtc,
          p_cairo_time_display: cairoTimeDisplay,
        });

        if (rpcError) return { success: false, message: `Reschedule failed: ${rpcError.message}` };
      } catch (err: any) {
        return { success: false, message: `Reschedule failed: ${err?.message || 'Database error'}` };
      }
    }

    // Update local store
    const local = this.mockBookingStore.find((b) => b.reference.toUpperCase() === cleanRef.toUpperCase());
    if (local) {
      local.scheduledIsoDatetime = scheduledStartUtc;
      local.scheduledEndIsoDatetime = scheduledEndUtc;
      local.cairoTimeDisplay = cairoTimeDisplay;
      local.status = 'rescheduled';
    }

    // Notify integration reschedule in background
    try {
      fetch('/api/integrations/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referenceCode: cleanRef,
          managementToken: token,
          newStartUtc: scheduledStartUtc,
          newEndUtc: scheduledEndUtc,
          cairoTimeDisplay
        })
      }).catch(() => {});
    } catch {
      // Non-blocking
    }

    return { success: true, message: 'Booking successfully rescheduled.' };
  }
};
