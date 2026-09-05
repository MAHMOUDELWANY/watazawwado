/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — NOTIFICATION DISPATCHER
 * File: api/notifications/dispatcher.ts
 * Role: Centralized, Idempotent Event Dispatcher with Durable Claim Ownership
 * ====================================================================
 */

import { createClient } from '@supabase/supabase-js';
import {
  renderStudentBookingConfirmation,
  renderStudentTrialConfirmation,
  renderStudentPaymentConfirmed,
  renderStudentCancellation,
  renderStudentReschedule,
  renderStudent24hReminder,
  renderStudent1hReminder,
  renderTeacherNotification
} from './emailTemplates.js';
import { sendEmail, OFFICIAL_TEACHER_EMAIL } from './emailService.js';

export type NotificationEventType =
  | 'BOOKING_CONFIRMED'
  | 'TRIAL_BOOKED'
  | 'PAYMENT_CLAIMED'
  | 'PAYMENT_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'BOOKING_RESCHEDULED'
  | 'LEAD_CREATED'
  | 'LESSON_24H_REMINDER'
  | 'LESSON_1H_REMINDER';

export interface NotificationPayload {
  eventType: NotificationEventType;
  booking?: {
    id?: string;
    referenceCode: string;
    serviceName: string;
    learnerName: string;
    contactEmail: string;
    contactWhatsapp?: string | null;
    date: string;
    timeDisplay: string;
    timezone: string;
    durationMinutes: number;
    zoomLink?: string | null;
    cairoTimeDisplay?: string | null;
    isTrial?: boolean;
    feeAmount?: number | null;
    currency?: string | null;
    oldDate?: string;
    oldTimeDisplay?: string;
  };
  payment?: {
    id: string;
    amount: number;
    currency: string;
    paymentMethod: string;
    paymentReference?: string | null;
    notes?: string | null;
  };
  lead?: {
    id?: string;
    name: string;
    email?: string | null;
    whatsapp?: string | null;
    serviceInterest?: string | null;
    goal?: string | null;
    isTrial?: boolean;
    source?: string | null;
  };
  customMessage?: string;
}

export interface DispatchResult {
  success: boolean;
  idempotentSkipped?: boolean;
  studentEmailSent?: boolean;
  teacherEmailSent?: boolean;
  errors?: string[];
}

export interface ClaimResult {
  claimed: boolean;
  claimToken: string | null;
}

function getServerSupabase() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
}

/**
 * Builds a deterministic idempotency key for notifications.
 */
export function buildIdempotencyKey(payload: NotificationPayload): string {
  const { eventType, booking, payment, lead } = payload;
  if (booking?.referenceCode) {
    if (eventType === 'BOOKING_RESCHEDULED') {
      return `booking:${booking.referenceCode}:rescheduled:${booking.date}:${booking.timeDisplay}`;
    }
    return `booking:${booking.referenceCode}:${eventType}`;
  }
  if (payment?.id) {
    return `payment:${payment.id}:${eventType}`;
  }
  if (lead?.email || lead?.whatsapp) {
    return `lead:${lead.email || lead.whatsapp}:${eventType}`;
  }
  return `event:${eventType}:${Date.now()}`;
}

/**
 * Sanitizes any raw exception or error details to guarantee sensitive tokens,
 * Brevo keys, SQL syntax, or server paths are never exposed to callers.
 */
export function sanitizeErrorSummary(rawErrors: (string | undefined | null)[]): string {
  const valid = rawErrors.filter((e): e is string => typeof e === 'string' && e.trim().length > 0);
  if (valid.length === 0) return 'Notification delivery failed';

  return valid.map(err => {
    const lower = err.toLowerCase();
    if (lower.includes('unauthorized') || lower.includes('key') || lower.includes('secret') || lower.includes('token') || lower.includes('xkeysib')) {
      return 'Notification provider authentication failed';
    }
    if (lower.includes('connect') || lower.includes('econn') || lower.includes('timeout') || lower.includes('network') || lower.includes('500') || lower.includes('502') || lower.includes('503')) {
      return 'Notification delivery service temporarily unavailable';
    }
    if (lower.includes('syntax') || lower.includes('database') || lower.includes('relation') || lower.includes('column') || lower.includes('postgres') || lower.includes('supabase') || lower.includes('sql')) {
      return 'Notification database processing error';
    }
    if (lower.includes('unconfigured')) {
      return 'Notification service not configured';
    }
    return 'Notification could not be delivered';
  }).join('; ');
}

export function sanitizeDispatcherError(err: unknown): string {
  const str = String((err as any)?.message || err || '').toLowerCase();
  if (str.includes('unauthorized') || str.includes('key') || str.includes('secret') || str.includes('token') || str.includes('xkeysib')) {
    return 'Notification service configuration unavailable';
  }
  if (str.includes('network') || str.includes('timeout') || str.includes('fetch') || str.includes('econn') || str.includes('enotfound') || str.includes('getaddrinfo') || str.includes('dns')) {
    return 'Notification service connection error';
  }
  if (str.includes('postgres') || str.includes('supabase') || str.includes('sql') || str.includes('database')) {
    return 'Notification database error';
  }
  return 'Notification could not be dispatched';
}

/**
 * Tries to claim a notification for sending idempotently via the database.
 * Returns the durable ownership token if claim succeeded.
 */
async function claimNotification(key: string, eventType: string): Promise<ClaimResult> {
  const supabase = getServerSupabase();
  if (!supabase) {
    // Fail safe if DB is unavailable. Do not send untracked duplicates.
    return { claimed: false, claimToken: null }; 
  }

  try {
    const { data, error } = await supabase.rpc('claim_notification_event', {
      p_key: key,
      p_type: eventType
    });

    if (error) {
      console.warn('[Idempotency Claim RPC Error]', error);
      return { claimed: false, claimToken: null };
    }

    if (data && typeof data === 'object') {
      if (data.claimed && data.claim_token) {
        return { claimed: true, claimToken: String(data.claim_token) };
      }
      return { claimed: false, claimToken: null };
    }

    if (data === true) {
      return { claimed: true, claimToken: 'legacy-token' };
    }

    return { claimed: false, claimToken: null };
  } catch (err) {
    console.warn('[Idempotency Claim Warning]', err);
    return { claimed: false, claimToken: null };
  }
}

/**
 * Marks a notification event as finalized (sent or failed) using durable claim ownership.
 */
async function finalizeNotification(
  key: string,
  claimToken: string | null,
  success: boolean,
  errors?: string[],
  messageId?: string
): Promise<boolean> {
  const supabase = getServerSupabase();
  if (!supabase || !claimToken) return false;
  
  try {
    const sanitizedError = errors && errors.length > 0 ? sanitizeErrorSummary(errors) : null;

    const { data, error } = await supabase.rpc('finalize_notification_event', {
      p_key: key,
      p_token: claimToken,
      p_status: success ? 'sent' : 'failed',
      p_message_id: messageId || null,
      p_error: sanitizedError
    });

    if (error) {
      console.warn('[Idempotency Finalize RPC Error]', error);
      return false;
    }

    return data === true;
  } catch (err) {
    console.warn('[Idempotency Finalize Warning]', err);
    return false;
  }
}

/**
 * Clears the in-memory idempotency cache (useful for testing).
 * Retained for backwards compatibility in tests.
 */
export function clearIdempotencyCache(): void {
  // No-op for db-backed idempotency
}

/**
 * Centralized Dispatcher for all Platform Events.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<DispatchResult> {
  const baseKey = buildIdempotencyKey(payload);
  const errors: string[] = [];
  let idempotentSkipped = false;
  let studentEmailSent = false;
  let teacherEmailSent = false;
  let attemptedSends = 0;

  const { eventType, booking, payment, lead } = payload;

  try {
    switch (eventType) {
      // 1. Regular Booking Confirmation
      case 'BOOKING_CONFIRMED': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudentBookingConfirmation({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              date: booking.date,
              timeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              durationMinutes: booking.durationMinutes,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink,
              cairoTimeDisplay: booking.cairoTimeDisplay,
              feeAmount: booking.feeAmount,
              currency: booking.currency
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`Student email: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }

        // Notify Teacher
        if (booking) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'new_booking',
              title: `New Booking: ${booking.serviceName} (${booking.durationMinutes} min)`,
              summary: `A new 1-on-1 lesson has been scheduled by ${booking.learnerName}.`,
              details: {
                'Student': booking.learnerName,
                'Email': booking.contactEmail,
                'WhatsApp': booking.contactWhatsapp || 'None provided',
                'Service': booking.serviceName,
                'Date & Time': `${booking.date} at ${booking.timeDisplay} (${booking.timezone})`,
                'Cairo Time': booking.cairoTimeDisplay || 'N/A',
                'Reference Code': booking.referenceCode,
                'Zoom Link': booking.zoomLink || 'Generating...'
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 2. Free Trial Booked
      case 'TRIAL_BOOKED': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudentTrialConfirmation({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              date: booking.date,
              timeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              durationMinutes: booking.durationMinutes,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink,
              cairoTimeDisplay: booking.cairoTimeDisplay
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`Student trial email: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }

        // Notify Teacher
        if (booking) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'new_trial',
              title: `New Free Trial Booked: ${booking.serviceName}`,
              summary: `A complimentary 1-on-1 trial has been scheduled by ${booking.learnerName}.`,
              details: {
                'Learner': booking.learnerName,
                'Email': booking.contactEmail,
                'WhatsApp': booking.contactWhatsapp || 'None provided',
                'Service': booking.serviceName,
                'Date & Time': `${booking.date} at ${booking.timeDisplay} (${booking.timezone})`,
                'Duration': `${booking.durationMinutes} minutes (Complimentary Trial)`,
                'Reference': booking.referenceCode,
                'Zoom Link': booking.zoomLink || 'Generating...'
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 3. Payment Claimed by Student (Pending Teacher Verification)
      case 'PAYMENT_CLAIMED': {
        if (booking && payment) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'payment_claimed',
              title: `Payment Claimed: ${payment.amount} ${payment.currency} [Ref: ${booking.referenceCode}]`,
              summary: `${booking.learnerName} has submitted payment details for verification.`,
              details: {
                'Student': booking.learnerName,
                'Booking Ref': booking.referenceCode,
                'Service': booking.serviceName,
                'Amount': `${payment.amount} ${payment.currency}`,
                'Payment Method': payment.paymentMethod,
                'Transaction Reference': payment.paymentReference || 'None provided',
                'Student Notes': payment.notes || 'None'
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher payment claim alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 4. Payment Confirmed by Teacher
      case 'PAYMENT_CONFIRMED': {
        if (booking && booking.contactEmail && payment) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudentPaymentConfirmed({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              amount: payment.amount,
              currency: payment.currency,
              paymentMethod: payment.paymentMethod,
              paymentReference: payment.paymentReference,
              bookingRef: booking.referenceCode,
              date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`Student payment confirmation: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 5. Booking Cancelled
      case 'BOOKING_CANCELLED': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudentCancellation({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              date: booking.date,
              timeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              bookingRef: booking.referenceCode
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`Student cancellation: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }

        // Notify Teacher
        if (booking) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'cancelled',
              title: `Lesson Cancelled: ${booking.serviceName} [Ref: ${booking.referenceCode}]`,
              summary: `A scheduled lesson with ${booking.learnerName} has been cancelled.`,
              details: {
                'Student': booking.learnerName,
                'Email': booking.contactEmail,
                'Service': booking.serviceName,
                'Was Scheduled For': `${booking.date} at ${booking.timeDisplay} (${booking.timezone})`,
                'Booking Ref': booking.referenceCode
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher cancellation alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 6. Booking Rescheduled
      case 'BOOKING_RESCHEDULED': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudentReschedule({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              oldDate: booking.oldDate || 'Previous Date',
              oldTimeDisplay: booking.oldTimeDisplay || 'Previous Time',
              newDate: booking.date,
              newTimeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              durationMinutes: booking.durationMinutes,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`Student reschedule: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }

        // Notify Teacher
        if (booking) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'rescheduled',
              title: `Lesson Rescheduled: ${booking.serviceName} [Ref: ${booking.referenceCode}]`,
              summary: `${booking.learnerName} has rescheduled their lesson.`,
              details: {
                'Student': booking.learnerName,
                'Service': booking.serviceName,
                'New Date & Time': `${booking.date} at ${booking.timeDisplay} (${booking.timezone})`,
                'Previous Time': `${booking.oldDate || 'N/A'} at ${booking.oldTimeDisplay || 'N/A'}`,
                'Booking Ref': booking.referenceCode,
                'Zoom Link': booking.zoomLink || 'Same room'
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher reschedule alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 7. Lead Created (Contact / Inquiry)
      case 'LEAD_CREATED': {
        if (lead) {
          const teacherKey = `${baseKey}:teacher`;
          const claimRes = await claimNotification(teacherKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const teacherEmail = renderTeacherNotification({
              eventType: 'new_lead',
              title: `New Inquiry / Lead: ${lead.name}`,
              summary: `A prospective student has reached out via the contact form.`,
              details: {
                'Name': lead.name,
                'Email': lead.email || 'None provided',
                'WhatsApp': lead.whatsapp || 'None provided',
                'Service Interest': lead.serviceInterest || 'General Inquiry',
                'Learning Goal': lead.goal || 'None specified',
                'Free Trial Requested': lead.isTrial ? 'Yes' : 'No'
              }
            });

            const teacherRes = await sendEmail({
              to: OFFICIAL_TEACHER_EMAIL,
              toName: 'Mahmoud Elwany',
              subject: teacherEmail.subject,
              html: teacherEmail.html,
              text: teacherEmail.text
            });
            teacherEmailSent = teacherRes.success;
            await finalizeNotification(teacherKey, claimRes.claimToken, teacherRes.success, teacherRes.error ? [teacherRes.error] : undefined, teacherRes.messageId);
            if (!teacherRes.success && teacherRes.error) {
              errors.push(`Teacher lead alert: ${sanitizeErrorSummary([teacherRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 8. 24-Hour Reminder
      case 'LESSON_24H_REMINDER': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudent24hReminder({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              date: booking.date,
              timeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              durationMinutes: booking.durationMinutes,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink,
              isTrial: booking.isTrial
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`24h reminder email: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }

      // 9. 1-Hour Reminder
      case 'LESSON_1H_REMINDER': {
        if (booking && booking.contactEmail) {
          const studentKey = `${baseKey}:student`;
          const claimRes = await claimNotification(studentKey, eventType);
          if (claimRes.claimed && claimRes.claimToken) {
            attemptedSends++;
            const studentEmail = renderStudent1hReminder({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              timeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink
            });

            const studentRes = await sendEmail({
              to: booking.contactEmail,
              toName: booking.learnerName,
              subject: studentEmail.subject,
              html: studentEmail.html,
              text: studentEmail.text
            });
            studentEmailSent = studentRes.success;
            await finalizeNotification(studentKey, claimRes.claimToken, studentRes.success, studentRes.error ? [studentRes.error] : undefined, studentRes.messageId);
            if (!studentRes.success && studentRes.error) {
              errors.push(`1h reminder email: ${sanitizeErrorSummary([studentRes.error])}`);
            }
          } else {
            idempotentSkipped = true;
          }
        }
        break;
      }
    }

    const anySent = studentEmailSent || teacherEmailSent;
    const allAttemptedFailed = attemptedSends > 0 && !anySent;

    return {
      success: !allAttemptedFailed,
      idempotentSkipped,
      studentEmailSent,
      teacherEmailSent,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (err: any) {
    console.warn('[Dispatch Notification Warning]', err);
    
    return {
      success: false,
      errors: [sanitizeDispatcherError(err)]
    };
  }
}
