/**
 * lessonsPresentation.ts
 *
 * Pure, side-effect-free presentation helpers for the student "My Lessons" page.
 *
 * These helpers only DERIVE readable labels/buckets from data the page already
 * fetches through authenticated server routes. They never:
 *   - trust a browser-supplied student id,
 *   - mutate bookings, credits, or payment state,
 *   - invent backend booking/payment states.
 *
 * Booking `status` values are exactly those allowed by the backend schema:
 *   'pending' | 'confirmed' | 'cancelled' | 'rescheduled' | 'completed' | 'no_show'
 * (see supabase/migrations/20260903000000_phase3_core_schema.sql).
 */

import { DateTime } from 'luxon';

export type LessonFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

export type StatusVariant =
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline'
  | 'success'
  | 'warning';

export interface LessonStatusPresentation {
  label: string;
  variant: StatusVariant;
}

/** Minimal payment-state shape the presentation layer needs (from getBookingPaymentSummary). */
export interface BookingPaymentState {
  isPendingPayment: boolean;
  isAwaitingVerification: boolean;
  isPaidOrTrial: boolean;
}

export interface CategorizedLessons {
  all: any[];
  upcoming: any[];
  completed: any[];
  cancelled: any[];
}

/** Booking statuses that represent a not-yet-finalised, in-flight lesson. */
const IN_FLIGHT_STATUSES = ['confirmed', 'pending', 'rescheduled'];

/** Grace window (ms) during/just after which a lesson is still shown as "upcoming". */
const UPCOMING_GRACE_MS = 60 * 60 * 1000;

/** Resolve a booking's scheduled start as a valid Luxon DateTime, or null. */
export function getLessonStart(booking: any): DateTime | null {
  const raw = booking?.scheduledStart || booking?.scheduled_start || booking?.lesson_date;
  if (!raw) return null;
  const dt = DateTime.fromISO(raw);
  return dt.isValid ? dt : null;
}

function startMillis(booking: any, fallback: number): number {
  const start = getLessonStart(booking);
  return start ? start.toMillis() : fallback;
}

/**
 * Categorize bookings into upcoming / completed / cancelled(history) buckets.
 *
 * Truthfulness rule: only a booking whose backend status is genuinely
 * `completed` may appear in the "Completed" bucket. A past booking that is still
 * `confirmed`/`pending`/`rescheduled` (teacher has not finalised it), or any
 * unrecognised status, is history — it must NOT be presented as completed.
 */
export function categorizeLessons(
  bookings: any[],
  nowMs: number = Date.now()
): CategorizedLessons {
  const upcoming: any[] = [];
  const completed: any[] = [];
  const cancelled: any[] = [];

  (Array.isArray(bookings) ? bookings : []).forEach((b) => {
    const status = b?.status;

    if (status === 'completed') {
      completed.push(b);
      return;
    }
    if (status === 'cancelled' || status === 'no_show') {
      cancelled.push(b);
      return;
    }

    const start = getLessonStart(b);
    const withinGrace = start ? start.toMillis() - nowMs >= -UPCOMING_GRACE_MS : false;

    if (IN_FLIGHT_STATUSES.includes(status) && withinGrace) {
      upcoming.push(b);
      return;
    }

    // Past-but-unfinalised, or an unrecognised status: never claim "completed".
    cancelled.push(b);
  });

  upcoming.sort((a, b) => startMillis(a, Number.POSITIVE_INFINITY) - startMillis(b, Number.POSITIVE_INFINITY));
  completed.sort((a, b) => startMillis(b, 0) - startMillis(a, 0));
  cancelled.sort((a, b) => startMillis(b, 0) - startMillis(a, 0));

  return {
    all: [...upcoming, ...completed, ...cancelled],
    upcoming,
    completed,
    cancelled,
  };
}

/**
 * Whether the student may reach the (WhatsApp-only) Reschedule / Cancel
 * coordination entry point for this booking.
 *
 * This is an ELIGIBILITY check for showing a coordination affordance only — it
 * does not authorise or perform any mutation. Finalised lessons
 * (completed/cancelled/no_show), not-yet-confirmed lessons, and lessons whose
 * start time has passed are excluded.
 */
export function isCoordinationAllowed(booking: any, nowMs: number = Date.now()): boolean {
  const status = booking?.status;
  if (status !== 'confirmed' && status !== 'rescheduled') return false;
  const start = getLessonStart(booking);
  if (!start) return false;
  return start.toMillis() > nowMs;
}

/**
 * Payment-aware, truthful status presentation.
 *
 * The booking `status` is authoritative for lifecycle, but we must not overstate:
 * a booking that is `confirmed` in slot terms while its payment is still
 * outstanding (unpaid / partially paid / under review / rejected) is NOT shown
 * as plain "Confirmed".
 */
export function getLessonDisplayStatus(
  booking: any,
  payment: BookingPaymentState,
  isAr: boolean
): LessonStatusPresentation {
  const status = booking?.status;

  switch (status) {
    case 'completed':
      return { label: isAr ? 'مكتمل' : 'Completed', variant: 'success' };
    case 'cancelled':
      return { label: isAr ? 'ملغى' : 'Cancelled', variant: 'destructive' };
    case 'no_show':
      return { label: isAr ? 'لم يحضر' : 'No Show', variant: 'destructive' };
    case 'rescheduled':
      return { label: isAr ? 'تمت إعادة الجدولة' : 'Rescheduled', variant: 'secondary' };
    case 'pending':
      return { label: isAr ? 'في انتظار الدفع' : 'Pending Payment', variant: 'warning' };
    case 'confirmed': {
      if (payment.isPendingPayment) {
        return payment.isAwaitingVerification
          ? {
              label: isAr ? 'بانتظار اعتماد الدفع' : 'Awaiting Payment Verification',
              variant: 'warning',
            }
          : { label: isAr ? 'بانتظار الدفع' : 'Awaiting Payment', variant: 'warning' };
      }
      return { label: isAr ? 'مؤكد ومجدول' : 'Confirmed', variant: 'success' };
    }
    default:
      return {
        label: status ? String(status) : isAr ? 'غير معروف' : 'Unknown',
        variant: 'outline',
      };
  }
}
