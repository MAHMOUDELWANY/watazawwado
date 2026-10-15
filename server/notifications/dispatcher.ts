/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — NOTIFICATION DISPATCHER
 * File: server/notifications/dispatcher.ts
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
  renderTeacherNotification,
  type EmailLang
} from './emailTemplates.js';
import { sendEmail, OFFICIAL_ADMIN_EMAIL } from './emailService.js';

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
    /** Terms the student accepted for this booking; repeated in the confirmation email (durable medium). */
    termsVersion?: string | null;
    termsAcceptedAt?: string | null;
    isPackageLesson?: boolean;
    oldDate?: string;
    oldTimeDisplay?: string;
    /** The lesson's own teacher (RULES.md §1); teacher emails fall back to the official address. */
    teacherEmail?: string | null;
    teacherName?: string | null;
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
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
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
    // Time-bound events include the lesson time, so a rescheduled lesson gets fresh reminders.
    if (eventType === 'BOOKING_RESCHEDULED') {
      return `booking:${booking.referenceCode}:rescheduled:${booking.date}:${booking.timeDisplay}`;
    }
    if (eventType === 'LESSON_24H_REMINDER' || eventType === 'LESSON_1H_REMINDER') {
      return `booking:${booking.referenceCode}:${eventType}:${booking.date}:${booking.timeDisplay}`;
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
 * The language a recipient chose on the site (user_language_preferences); English otherwise.
 */
export async function resolveEmailLanguage(email: string | null | undefined): Promise<EmailLang> {
  const supabase = getServerSupabase();
  if (!supabase || !email) return 'en';
  try {
    const { data } = await supabase
      .from('user_language_preferences')
      .select('language')
      .ilike('email', email.trim().replace(/[\\%_]/g, '\\$&'))
      .order('updated_at', { ascending: false })
      .limit(1);
    return data?.[0]?.language === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Centralized Dispatcher for all Platform Events.
 * Routing (RULES.md §1, §5): students get their lesson emails; the lesson's teacher gets
 * bookings, cancellations and moves with NO payment details; every payment alert and new
 * lead goes to the super admin only.
 */
export async function dispatchNotification(payload: NotificationPayload): Promise<DispatchResult> {
  const baseKey = buildIdempotencyKey(payload);
  const errors: string[] = [];
  let idempotentSkipped = false;
  let studentEmailSent = false;
  let teacherEmailSent = false;
  let attemptedSends = 0;

  const { eventType, booking, payment, lead } = payload;

  // Claims the idempotency key, renders in the recipient's language and sends once.
  const sendOnce = async (
    role: 'student' | 'teacher' | 'admin',
    to: string,
    toName: string,
    build: (lang: EmailLang) => { subject: string; html: string; text: string }
  ) => {
    const key = `${baseKey}:${role}`;
    const claim = await claimNotification(key, eventType);
    if (!claim.claimed || !claim.claimToken) {
      idempotentSkipped = true;
      return;
    }
    attemptedSends++;
    const email = build(await resolveEmailLanguage(to));
    const res = await sendEmail({ to, toName, subject: email.subject, html: email.html, text: email.text });
    if (role === 'student') studentEmailSent = res.success; else teacherEmailSent = teacherEmailSent || res.success;
    await finalizeNotification(key, claim.claimToken, res.success, res.error ? [res.error] : undefined, res.messageId);
    if (!res.success && res.error) errors.push(`${role} email: ${sanitizeErrorSummary([res.error])}`);
  };

  const teacherTo = booking?.teacherEmail || OFFICIAL_ADMIN_EMAIL;
  const teacherName = booking?.teacherName || 'Teacher';
  const lessonRows = (b: NonNullable<NotificationPayload['booking']>): Array<[string, string, unknown]> => [
    ['Student', 'الطالب', b.learnerName],
    ['Subject', 'المادة', b.serviceName],
    ['When', 'الموعد', `${b.date} · ${b.timeDisplay} (${b.timezone})`],
    ['Cairo time', 'بتوقيت القاهرة', b.cairoTimeDisplay || ''],
    ['Length', 'المدة', `${b.durationMinutes} min`],
    ['Booking ref', 'رقم الحجز', b.referenceCode],
    ['Zoom link', 'رابط Zoom', b.zoomLink || '']
  ];

  try {
    switch (eventType) {
      case 'BOOKING_CONFIRMED':
      case 'TRIAL_BOOKED': {
        if (!booking) break;
        const isTrial = eventType === 'TRIAL_BOOKED';
        if (booking.contactEmail) {
          await sendOnce('student', booking.contactEmail, booking.learnerName, lang => isTrial
            ? renderStudentTrialConfirmation({ ...booking, bookingRef: booking.referenceCode, lang })
            : renderStudentBookingConfirmation({ ...booking, bookingRef: booking.referenceCode, lang }));
        }
        await sendOnce('teacher', teacherTo, teacherName, lang => renderTeacherNotification({
          eventType: isTrial ? 'new_trial' : 'new_booking',
          summary: `${booking.learnerName} booked ${isTrial ? 'a free trial' : 'a lesson'} in ${booking.serviceName}.`,
          summaryAr: `${booking.learnerName} حجز ${isTrial ? 'حصة تجريبية' : 'حصة'} في ${booking.serviceName}.`,
          details: lessonRows(booking),
          lang
        }));
        break;
      }

      case 'PAYMENT_CLAIMED': {
        if (!booking || !payment) break;
        await sendOnce('admin', OFFICIAL_ADMIN_EMAIL, 'Super admin', lang => renderTeacherNotification({
          eventType: 'payment_claimed',
          summary: `${booking.learnerName} reported a payment of ${payment.amount} ${payment.currency}. Please check and confirm it.`,
          summaryAr: `${booking.learnerName} بلّغ إنه دفع ${payment.amount} ${payment.currency}. راجعه وأكّده.`,
          details: [
            ['Student', 'الطالب', booking.learnerName],
            ['Item', 'الخدمة', booking.serviceName],
            ['Amount', 'المبلغ', `${payment.amount} ${payment.currency}`],
            ['Method', 'طريقة الدفع', payment.paymentMethod],
            ['Payment ref', 'مرجع الدفع', payment.paymentReference || ''],
            ['Booking ref', 'رقم الحجز', booking.referenceCode],
            ['Notes', 'ملاحظات', payment.notes || '']
          ],
          lang
        }));
        break;
      }

      case 'PAYMENT_CONFIRMED': {
        if (!booking || !payment) break;
        if (booking.contactEmail) {
          await sendOnce('student', booking.contactEmail, booking.learnerName, lang => renderStudentPaymentConfirmed({
            learnerName: booking.learnerName,
            serviceName: booking.serviceName,
            amount: payment.amount,
            currency: payment.currency,
            paymentMethod: payment.paymentMethod,
            paymentReference: payment.paymentReference,
            bookingRef: booking.referenceCode,
            date: new Date().toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
            lang
          }));
        }
        await sendOnce('admin', OFFICIAL_ADMIN_EMAIL, 'Super admin', lang => renderTeacherNotification({
          eventType: 'payment_confirmed',
          summary: `Payment of ${payment.amount} ${payment.currency} from ${booking.learnerName} is confirmed.`,
          summaryAr: `تم تأكيد دفع ${payment.amount} ${payment.currency} من ${booking.learnerName}.`,
          details: [
            ['Student', 'الطالب', booking.learnerName],
            ['Item', 'الخدمة', booking.serviceName],
            ['Amount', 'المبلغ', `${payment.amount} ${payment.currency}`],
            ['Method', 'طريقة الدفع', payment.paymentMethod],
            ['Payment ref', 'مرجع الدفع', payment.paymentReference || ''],
            ['Booking ref', 'رقم الحجز', booking.referenceCode]
          ],
          lang
        }));
        break;
      }

      case 'BOOKING_CANCELLED':
      case 'BOOKING_RESCHEDULED': {
        if (!booking) break;
        const moved = eventType === 'BOOKING_RESCHEDULED';
        if (booking.contactEmail) {
          await sendOnce('student', booking.contactEmail, booking.learnerName, lang => moved
            ? renderStudentReschedule({
              learnerName: booking.learnerName,
              serviceName: booking.serviceName,
              oldDate: booking.oldDate || '—',
              oldTimeDisplay: booking.oldTimeDisplay || '',
              newDate: booking.date,
              newTimeDisplay: booking.timeDisplay,
              timezone: booking.timezone,
              durationMinutes: booking.durationMinutes,
              bookingRef: booking.referenceCode,
              zoomLink: booking.zoomLink,
              lang
            })
            : renderStudentCancellation({ ...booking, bookingRef: booking.referenceCode, lang }));
        }
        await sendOnce('teacher', teacherTo, teacherName, lang => renderTeacherNotification({
          eventType: moved ? 'rescheduled' : 'cancelled',
          summary: moved
            ? `The lesson with ${booking.learnerName} moved to ${booking.date} · ${booking.timeDisplay}.`
            : `The lesson with ${booking.learnerName} on ${booking.date} was cancelled.`,
          summaryAr: moved
            ? `حصة ${booking.learnerName} اتنقلت لـ ${booking.date} · ${booking.timeDisplay}.`
            : `حصة ${booking.learnerName} يوم ${booking.date} اتلغت.`,
          details: [
            ...lessonRows(booking),
            ...(moved ? [['Previous time', 'الميعاد القديم', `${booking.oldDate || ''} ${booking.oldTimeDisplay || ''}`.trim()] as [string, string, unknown]] : [])
          ],
          lang
        }));
        break;
      }

      case 'LEAD_CREATED': {
        if (!lead) break;
        await sendOnce('admin', OFFICIAL_ADMIN_EMAIL, 'Super admin', lang => renderTeacherNotification({
          eventType: 'new_lead',
          summary: `${lead.name} is interested in learning with us.`,
          summaryAr: `${lead.name} مهتم يتعلم معانا.`,
          details: [
            ['Name', 'الاسم', lead.name],
            ['Email', 'الإيميل', lead.email || ''],
            ['WhatsApp', 'واتساب', lead.whatsapp || ''],
            ['Interest', 'الاهتمام', lead.serviceInterest || ''],
            ['Goal', 'الهدف', lead.goal || ''],
            ['Wants a free trial', 'عايز تجربة مجانية', lead.isTrial ? 'Yes / أيوه' : 'No / لأ']
          ],
          lang
        }));
        break;
      }

      case 'LESSON_24H_REMINDER':
      case 'LESSON_1H_REMINDER': {
        if (!booking?.contactEmail) break;
        await sendOnce('student', booking.contactEmail, booking.learnerName, lang => eventType === 'LESSON_24H_REMINDER'
          ? renderStudent24hReminder({ ...booking, bookingRef: booking.referenceCode, lang })
          : renderStudent1hReminder({ ...booking, bookingRef: booking.referenceCode, lang }));
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
