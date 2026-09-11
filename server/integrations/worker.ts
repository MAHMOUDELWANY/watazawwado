/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — INTEGRATION WORKER
 * File: server/integrations/worker.ts
 * Role: Durable outbox processor for booking integration jobs.
 * ====================================================================
 */
import { createClient } from '@supabase/supabase-js';
import { syncBookingIntegrations, syncCancelledBooking, syncRescheduledBooking } from './syncEngine.js';
import { scheduleBookingReminders, cancelBookingReminders, rescheduleBookingReminders } from '../notifications/reminderEngine.js';
import { dispatchNotification } from '../notifications/dispatcher.js';
import { DateTime } from 'luxon';

function sanitizeErrorMessage(msg: string): string {
  if (!msg) return 'Unknown error';
  return msg
    .replace(/ya29\.[0-9A-Za-z\-_]+/g, '[REDACTED_TOKEN]')
    .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED]')
    .replace(/(access_token|refresh_token|client_secret)=[^&\s]+/gi, '$1=[REDACTED]');
}

function getAdminSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

export async function processIntegrationJobs(batchSize = 5, clientOverride?: any, targetBookingId?: string): Promise<number> {
  const supabase = clientOverride || getAdminSupabase();
  if (!supabase) {
    console.warn('[Integration Worker] Admin Supabase client not configured.');
    return 0;
  }

  // 1. Claim Jobs (strictly scoped to targetBookingId when provided)
  const rpcParams: { p_batch_size: number; p_booking_id?: string } = { p_batch_size: batchSize };
  if (targetBookingId && typeof targetBookingId === 'string' && targetBookingId.trim() !== '') {
    rpcParams.p_booking_id = targetBookingId.trim();
  }

  const { data: jobs, error: claimError } = await supabase
    .rpc('claim_integration_jobs', rpcParams);

  if (claimError || !jobs || jobs.length === 0) {
    if (claimError) console.error('[Integration Worker] Claim error:', claimError);
    return 0;
  }

  let processedCount = 0;

  // 2. Process each job
  for (const job of jobs) {
    try {
      if (job.job_type === 'booking_sync') {
        const { data: booking, error: bError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', job.booking_id)
          .maybeSingle();

        if (bError) {
          throw new Error(`Booking database query error: ${bError.message}`);
        }
        if (!booking) {
          throw new Error(`Booking record not found: ${job.booking_id}`);
        }

        // Stale job protection: If booking was cancelled, do not sync or email
        if (booking.status === 'cancelled') {
          console.log(`[Worker] job_type=booking_sync but booking ${booking.reference_code} is cancelled. Skipping sync.`);
          const { error: skipErr, data: updatedJobs } = await supabase
            .from('integration_jobs')
            .update({
              status: 'completed',
              completed_at: new Date().toISOString(),
              locked_at: null,
              last_error: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', job.id)
            .eq('status', 'processing')
            .select('id');

          if (skipErr) {
            throw new Error(`Failed to persist skipped job completion: ${skipErr.message}`);
          }
          if (!updatedJobs || updatedJobs.length === 0) {
            throw new Error(`Job ${job.id} cancelled skip lost update: status was no longer 'processing'`);
          }

          processedCount++;
          continue;
        }

        // Run sync (Idempotent)
        const syncResult = await syncBookingIntegrations({
          id: booking.id,
          referenceCode: booking.reference_code,
          teacherId: booking.teacher_id,
          learnerName: booking.student_name || booking.contact_name,
          parentName: booking.parent_name,
          serviceName: booking.service_name || '1-on-1 Lesson',
          mode: booking.booking_type,
          scheduledStart: booking.scheduled_start,
          scheduledEnd: booking.scheduled_end,
          studentTimezone: booking.student_timezone,
          cairoTimeDisplay: booking.cairo_time_display,
          durationMinutes: booking.duration_minutes,
          contactEmail: booking.contact_email,
          contactWhatsapp: booking.contact_whatsapp,
          zoomMeetingLink: booking.zoom_meeting_link,
          notes: booking.notes
        });

        if (!syncResult.success) {
          const errMsg = syncResult.errors && syncResult.errors.length > 0 
            ? syncResult.errors.join(', ') 
            : 'Sync failed without explicit message';
          throw new Error(errMsg);
        }

        // Notifications
        try {
          const isTrial = booking.booking_type === 'trial';
          const scheduledStartIso = booking.scheduled_start;
          const studentTz = booking.student_timezone || 'Africa/Cairo';
          const startLuxon = DateTime.fromISO(scheduledStartIso).setZone(studentTz);
          
          await scheduleBookingReminders({
            id: booking.id,
            scheduledStartUtc: scheduledStartIso,
            referenceCode: booking.reference_code
          });
          
          await dispatchNotification({
            eventType: isTrial ? 'TRIAL_BOOKED' : 'BOOKING_CONFIRMED',
            booking: {
              id: booking.id,
              referenceCode: booking.reference_code,
              serviceName: booking.service_name || (isTrial ? 'Free Trial Lesson' : '1-on-1 Lesson'),
              learnerName: booking.student_name || booking.contact_name || 'Student',
              contactEmail: booking.contact_email,
              contactWhatsapp: booking.contact_whatsapp || null,
              date: startLuxon.toFormat('cccc, MMMM d, yyyy'),
              timeDisplay: startLuxon.toFormat('hh:mm a'),
              timezone: studentTz,
              durationMinutes: booking.duration_minutes || (isTrial ? 30 : 60),
              zoomLink: syncResult.zoomMeetingLink || booking.zoom_meeting_link || null,
              cairoTimeDisplay: booking.cairo_time_display || null,
              isTrial
            }
          });
        } catch (notifErr) {
          console.error('[Integration Worker] Notification Dispatch Error', notifErr);
        }

        // Mark Success: Fail-safe persistence check with lost-update protection
        const { error: updateErr, data: updatedJobs } = await supabase
          .from('integration_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            locked_at: null,
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('status', 'processing')
          .select('id');

        if (updateErr) {
          throw new Error(`Failed to persist job completion: ${updateErr.message}`);
        }
        if (!updatedJobs || updatedJobs.length === 0) {
          throw new Error(`Job ${job.id} completion lost update: status was no longer 'processing'`);
        }

        processedCount++;

      } else if (job.job_type === 'booking_cancel') {
        const { data: booking, error: bError } = await supabase
          .from('bookings')
          .select('id, reference_code, teacher_id, status, scheduled_start, student_timezone, service_name, student_name, contact_name, contact_email, contact_whatsapp')
          .eq('id', job.booking_id)
          .maybeSingle();
          
        if (bError) {
          throw new Error(`Booking database query error: ${bError.message}`);
        }
        if (!booking) {
          throw new Error(`Booking record not found: ${job.booking_id}`);
        }
        
        // We ensure authoritative state is cancelled
        if (booking.status !== 'cancelled') {
           console.log(`[Worker] job_type=booking_cancel but booking ${booking.reference_code} is not cancelled. Skipping.`);
        } else {
           const res = await syncCancelledBooking(booking.reference_code, booking.teacher_id);
           if (!res.success) {
             throw new Error(res.message);
           }
           
           try {
              await cancelBookingReminders(booking.id);
              
              // Only dispatch if start time is present, needed for format
              if (booking.scheduled_start) {
                  const studentTz = booking.student_timezone || 'Africa/Cairo';
                  const startLuxon = DateTime.fromISO(booking.scheduled_start).setZone(studentTz);
                  await dispatchNotification({
                    eventType: 'BOOKING_CANCELLED',
                    booking: {
                      id: booking.id,
                      referenceCode: booking.reference_code,
                      serviceName: booking.service_name || '1-on-1 Lesson',
                      learnerName: booking.student_name || booking.contact_name || 'Student',
                      contactEmail: booking.contact_email,
                      contactWhatsapp: booking.contact_whatsapp || null,
                      date: startLuxon.toFormat('cccc, MMMM d, yyyy'),
                      timeDisplay: startLuxon.toFormat('hh:mm a'),
                      timezone: studentTz,
                      durationMinutes: 60,
                      isTrial: false,
                      cairoTimeDisplay: null,
                      zoomLink: null
                    }
                  });
              }
           } catch (notifErr) {
              console.error('[Integration Worker] Notification Dispatch Error for Cancel', notifErr);
           }
        }

        // Mark Success: Fail-safe persistence check with lost-update protection
        const { error: updateErr, data: updatedJobs } = await supabase
          .from('integration_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            locked_at: null,
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('status', 'processing')
          .select('id');

        if (updateErr) {
          throw new Error(`Failed to persist cancel job completion: ${updateErr.message}`);
        }
        if (!updatedJobs || updatedJobs.length === 0) {
          throw new Error(`Job ${job.id} cancel completion lost update: status was no longer 'processing'`);
        }

        processedCount++;

      } else if (job.job_type === 'booking_reschedule') {
        const { data: booking, error: bError } = await supabase
          .from('bookings')
          .select('id, reference_code, teacher_id, status, scheduled_start, scheduled_end, student_timezone, service_name, student_name, contact_name, contact_email, contact_whatsapp, cairo_time_display')
          .eq('id', job.booking_id)
          .maybeSingle();
          
        if (bError) {
          throw new Error(`Booking database query error: ${bError.message}`);
        }
        if (!booking) {
          throw new Error(`Booking record not found: ${job.booking_id}`);
        }
        
        // Ensure authoritative state is not cancelled
        if (booking.status === 'cancelled') {
           console.log(`[Worker] job_type=booking_reschedule but booking ${booking.reference_code} is cancelled. Skipping.`);
        } else {
           const res = await syncRescheduledBooking(booking.reference_code, booking.scheduled_start, booking.scheduled_end, booking.cairo_time_display, booking.teacher_id);
           if (!res.success) {
             throw new Error(res.message);
           }
           
           try {
              await rescheduleBookingReminders(booking.id, booking.scheduled_start, booking.reference_code);
              
              if (booking.scheduled_start) {
                  const studentTz = booking.student_timezone || 'Africa/Cairo';
                  const newStartLuxon = DateTime.fromISO(booking.scheduled_start).setZone(studentTz);
                  
                  await dispatchNotification({
                    eventType: 'BOOKING_RESCHEDULED',
                    booking: {
                      id: booking.id,
                      referenceCode: booking.reference_code,
                      serviceName: booking.service_name || '1-on-1 Lesson',
                      learnerName: booking.student_name || booking.contact_name || 'Student',
                      contactEmail: booking.contact_email,
                      contactWhatsapp: booking.contact_whatsapp || null,
                      date: newStartLuxon.toFormat('cccc, MMMM d, yyyy'),
                      timeDisplay: newStartLuxon.toFormat('hh:mm a'),
                      timezone: studentTz,
                      durationMinutes: 60,
                      isTrial: false,
                      cairoTimeDisplay: booking.cairo_time_display || null,
                      zoomLink: null
                    }
                  });
              }
           } catch (notifErr) {
              console.error('[Integration Worker] Notification Dispatch Error for Reschedule', notifErr);
           }
        }

        // Mark Success: Fail-safe persistence check with lost-update protection
        const { error: updateErr, data: updatedJobs } = await supabase
          .from('integration_jobs')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            locked_at: null,
            last_error: null,
            updated_at: new Date().toISOString()
          })
          .eq('id', job.id)
          .eq('status', 'processing')
          .select('id');

        if (updateErr) {
          throw new Error(`Failed to persist reschedule job completion: ${updateErr.message}`);
        }
        if (!updatedJobs || updatedJobs.length === 0) {
          throw new Error(`Job ${job.id} reschedule completion lost update: status was no longer 'processing'`);
        }

        processedCount++;

      } else {
        // Unknown job type
        throw new Error(`Unknown job_type: ${job.job_type}`);
      }
    } catch (jobErr: any) {
      const sanitizedErrMsg = sanitizeErrorMessage(jobErr?.message);
      console.error(`[Integration Worker] Failed job ${job.id}:`, sanitizedErrMsg);
      
      const newAttempts = (job.attempts || 0) + 1;
      const lowerErr = sanitizedErrMsg.toLowerCase();
      const isPermanent = lowerErr.includes('invalid_grant') || 
                          lowerErr.includes('unauthorized') || 
                          lowerErr.includes('not found') || 
                          lowerErr.includes('(401)') || 
                          lowerErr.includes('(403)') || 
                          lowerErr.includes('(400)');

      const isDead = isPermanent || newAttempts >= 5;
      
      // Backoff: 1m, 5m, 15m, 1h
      const backoffMinutes = [1, 5, 15, 60][newAttempts - 1] || 60;
      
      const { error: failPersistErr } = await supabase
        .from('integration_jobs')
        .update({
          status: isDead ? 'dead_letter' : 'failed',
          attempts: isPermanent ? Math.max(newAttempts, 5) : newAttempts,
          last_error: sanitizedErrMsg,
          locked_at: null,
          next_attempt_at: isDead ? null : DateTime.utc().plus({ minutes: backoffMinutes }).toISO(),
          updated_at: new Date().toISOString()
        })
        .eq('id', job.id);

      if (failPersistErr) {
        console.error(`[Integration Worker] CRITICAL: Failed to persist failure state for job ${job.id}:`, failPersistErr);
        throw new Error(`CRITICAL: Failed to persist failure state for job ${job.id}: ${failPersistErr.message}`);
      }
    }
  }

  return processedCount;
}
