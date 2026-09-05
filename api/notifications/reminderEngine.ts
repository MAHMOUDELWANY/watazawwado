/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — REMINDER SCHEDULER ENGINE
 * File: api/notifications/reminderEngine.ts
 * Role: Timezone-aware, idempotent 24h & 1h lesson reminder processor
 *       with durable claim ownership and complete Supabase error inspection.
 * ====================================================================
 */

import { DateTime } from 'luxon';
import { createClient } from '@supabase/supabase-js';
import { dispatchNotification } from './dispatcher.js';

function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export interface ReminderScheduleResult {
  scheduled24h: boolean;
  scheduled1h: boolean;
}

/**
 * Sanitizes any reminder error before persisting into database.
 */
export function sanitizeReminderError(rawError: unknown): string {
  const str = String((rawError as any)?.message || rawError || '').toLowerCase();
  if (str.includes('unauthorized') || str.includes('key') || str.includes('secret') || str.includes('token')) {
    return 'Notification provider authentication error';
  }
  if (str.includes('timeout') || str.includes('connect') || str.includes('econn') || str.includes('network')) {
    return 'Delivery service connection timeout';
  }
  if (str.includes('timezone')) {
    return 'Missing or invalid student timezone';
  }
  if (str.includes('duration')) {
    return 'Missing lesson duration';
  }
  if (str.includes('start') || str.includes('datetime')) {
    return 'Invalid scheduled start datetime';
  }
  return 'Reminder delivery failed';
}

/**
 * Schedules 24h and 1h reminders for a confirmed booking.
 * Correctly evaluates scheduled instant against current time.
 */
export async function scheduleBookingReminders(booking: {
  id: string;
  scheduledStartUtc: string;
  referenceCode: string;
}): Promise<ReminderScheduleResult> {
  const supabase = getServerSupabase();
  const now = DateTime.utc();
  const start = DateTime.fromISO(booking.scheduledStartUtc, { zone: 'utc' });

  if (!start.isValid) {
    return { scheduled24h: false, scheduled1h: false };
  }

  const diffHours = start.diff(now, 'hours').hours;
  const time24h = start.minus({ hours: 24 });
  const time1h = start.minus({ hours: 1 });

  let scheduled24h = false;
  let scheduled1h = false;

  if (supabase) {
    const rowsToInsert: any[] = [];

    // Schedule 24h reminder only if lesson is more than 24h away
    if (diffHours >= 24) {
      rowsToInsert.push({
        booking_id: booking.id,
        reminder_type: '24h_before',
        scheduled_for: time24h.toISO(),
        status: 'pending'
      });
      scheduled24h = true;
    }

    // Schedule 1h reminder only if lesson is more than 1h away
    if (diffHours >= 1) {
      rowsToInsert.push({
        booking_id: booking.id,
        reminder_type: '1h_before',
        scheduled_for: time1h.toISO(),
        status: 'pending'
      });
      scheduled1h = true;
    }

    if (rowsToInsert.length > 0) {
      try {
        const { error: dbErr } = await supabase
          .from('reminders')
          .upsert(rowsToInsert, { onConflict: 'booking_id, reminder_type' });

        if (dbErr) {
          console.warn('[Reminders DB Upsert Error]', dbErr);
          return { scheduled24h: false, scheduled1h: false };
        }
      } catch (dbErr) {
        console.warn('[Reminders DB Upsert Warning]', dbErr);
        return { scheduled24h: false, scheduled1h: false };
      }
    }
  } else {
    // Fail-closed in production if database is unavailable
    if (process.env.NODE_ENV === 'production') {
      console.error('[Reminder Scheduling Error] Database client unavailable in production.');
      return { scheduled24h: false, scheduled1h: false };
    }
    scheduled24h = diffHours >= 24;
    scheduled1h = diffHours >= 1;
  }

  return { scheduled24h, scheduled1h };
}

/**
 * Cancels all pending reminders for a booking.
 */
export async function cancelBookingReminders(bookingId: string): Promise<number> {
  const supabase = getServerSupabase();
  if (!supabase) return 0;

  try {
    const { data, error } = await supabase
      .from('reminders')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('booking_id', bookingId)
      .eq('status', 'pending')
      .select();

    if (error) {
      console.warn('[Cancel Reminders Error]', error);
      return 0;
    }

    return data?.length || 0;
  } catch (err) {
    console.warn('[Cancel Reminders Warning]', err);
    return 0;
  }
}

/**
 * Reschedules reminders for a booking with a new start time.
 */
export async function rescheduleBookingReminders(
  bookingId: string,
  newScheduledStartUtc: string,
  referenceCode: string
): Promise<ReminderScheduleResult> {
  // 1. Cancel previous pending reminders
  await cancelBookingReminders(bookingId);

  // 2. Schedule new reminders
  return scheduleBookingReminders({
    id: bookingId,
    scheduledStartUtc: newScheduledStartUtc,
    referenceCode
  });
}

/**
 * Finalizes reminder state using token-verified ownership.
 */
async function finalizeReminderState(
  reminderId: string,
  claimToken: string | null,
  status: 'sent' | 'failed' | 'cancelled',
  errorInfo?: string
): Promise<boolean> {
  const supabase = getServerSupabase();
  if (!supabase) return false;

  try {
    const { data, error } = await supabase.rpc('finalize_reminder', {
      p_reminder_id: reminderId,
      p_token: claimToken,
      p_status: status,
      p_error: errorInfo ? sanitizeReminderError(errorInfo) : null
    });

    if (error) {
      console.warn('[Finalize Reminder RPC Error]', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.warn('[Finalize Reminder Warning]', err);
    return false;
  }
}

/**
 * Scans and processes all due pending reminders.
 * Idempotent: Marks reminders as processing atomically with claim tokens and skips duplicates.
 */
export async function processDueReminders(): Promise<{
  processed: number;
  sent24h: number;
  sent1h: number;
  skipped: number;
}> {
  const supabase = getServerSupabase();
  if (!supabase) {
    return { processed: 0, sent24h: 0, sent1h: 0, skipped: 0 };
  }

  const now = DateTime.utc();
  const lowerBound = now.minus({ hours: 3 }).toISO(); // Do not send if over 3 hours overdue
  const upperBound = now.plus({ minutes: 5 }).toISO(); // 5 min lookahead for scheduler jitter

  try {
    const { data: dueReminders, error: fetchErr } = await supabase
      .from('reminders')
      .select(`
        id,
        booking_id,
        reminder_type,
        scheduled_for,
        status,
        bookings (
          id,
          reference_code,
          contact_name,
          contact_email,
          contact_whatsapp,
          service_id,
          booking_type,
          scheduled_start,
          duration_minutes,
          student_timezone,
          status,
          zoom_meeting_link
        )
      `)
      .eq('status', 'pending')
      .gte('scheduled_for', lowerBound)
      .lte('scheduled_for', upperBound);

    if (fetchErr) {
      console.warn('[Fetch Due Reminders Error]', fetchErr);
      return { processed: 0, sent24h: 0, sent1h: 0, skipped: 0 };
    }

    if (!dueReminders || dueReminders.length === 0) {
      return { processed: 0, sent24h: 0, sent1h: 0, skipped: 0 };
    }

    let sent24h = 0;
    let sent1h = 0;
    let skipped = 0;

    for (const item of dueReminders) {
      const b: any = item.bookings;

      // 1. Atomic Claim for Reminder with Token
      const { data: claimData, error: claimErr } = await supabase.rpc('claim_reminder', {
        p_reminder_id: item.id
      });

      if (claimErr) {
        console.warn('[Claim Reminder RPC Error]', claimErr);
        skipped++;
        continue;
      }

      let claimToken: string | null = null;
      if (claimData && typeof claimData === 'object' && claimData.claimed && claimData.claim_token) {
        claimToken = String(claimData.claim_token);
      } else if (claimData === true) {
        claimToken = 'legacy-token';
      } else {
        // Could not claim, maybe another worker picked it up or it got cancelled
        skipped++;
        continue;
      }

      // 2. Skip and cancel if booking was cancelled, completed, or deleted
      if (!b || b.status !== 'confirmed') {
        await finalizeReminderState(item.id, claimToken, 'cancelled');
        skipped++;
        continue;
      }

      // 3. Validate essential booking data without inventing silent fallbacks
      if (!b.student_timezone || !DateTime.local().setZone(b.student_timezone).isValid) {
        await finalizeReminderState(item.id, claimToken, 'failed', 'Missing or invalid student timezone');
        skipped++;
        continue;
      }

      if (b.duration_minutes === null || b.duration_minutes === undefined || isNaN(Number(b.duration_minutes))) {
        await finalizeReminderState(item.id, claimToken, 'failed', 'Missing lesson duration');
        skipped++;
        continue;
      }

      const studentTz = b.student_timezone;
      const startDt = DateTime.fromISO(b.scheduled_start, { zone: studentTz });
      if (!startDt.isValid) {
        await finalizeReminderState(item.id, claimToken, 'failed', 'Invalid scheduled start datetime');
        skipped++;
        continue;
      }

      const dateStr = startDt.toFormat('cccc, LLLL d, yyyy');
      const timeStr = startDt.toFormat('h:mm a');

      // Cairo time
      const cairoDt = DateTime.fromISO(b.scheduled_start, { zone: 'Africa/Cairo' });
      const cairoTimeDisplay = `${cairoDt.toFormat('h:mm a')} Egypt`;

      const eventType = item.reminder_type === '24h_before' ? 'LESSON_24H_REMINDER' : 'LESSON_1H_REMINDER';
      const serviceName = b.service_id ? b.service_id.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : '1-on-1 Lesson';

      // 4. Dispatch notification
      const dispatchRes = await dispatchNotification({
        eventType,
        booking: {
          id: b.id,
          referenceCode: b.reference_code,
          serviceName,
          learnerName: b.contact_name,
          contactEmail: b.contact_email,
          contactWhatsapp: b.contact_whatsapp,
          date: dateStr,
          timeDisplay: timeStr,
          timezone: studentTz,
          durationMinutes: Number(b.duration_minutes),
          zoomLink: b.zoom_meeting_link,
          cairoTimeDisplay,
          isTrial: b.booking_type === 'trial'
        }
      });

      if (dispatchRes.success) {
        const finalized = await finalizeReminderState(item.id, claimToken, 'sent');
        if (finalized) {
          if (item.reminder_type === '24h_before') sent24h++;
          else sent1h++;
        }
      } else {
        const errorSummary = dispatchRes.errors?.join(', ') || 'Dispatch failed';
        await finalizeReminderState(item.id, claimToken, 'failed', errorSummary);
      }
    }

    return {
      processed: dueReminders.length,
      sent24h,
      sent1h,
      skipped
    };
  } catch (err) {
    console.warn('[processDueReminders Error]', err);
    return { processed: 0, sent24h: 0, sent1h: 0, skipped: 0 };
  }
}
