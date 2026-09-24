/**
 * notificationsPresentation.ts
 *
 * Shared, PURE student-notification projection.
 *
 * This module is the SINGLE source of truth for how the student notification
 * list AND the unread badge are derived. It is a read-only projection over
 * already-fetched authoritative payloads:
 *   - /api/student/bookings
 *   - /api/student/payments
 *   - /api/student/packages
 *
 * It does NOT re-implement payment authority. Booking payment state is derived
 * exclusively from the existing authoritative `getBookingPaymentSummary`
 * helper (src/lib/paymentStatus.ts). No new status enum, no server read-state,
 * no browser-supplied student ids.
 *
 * Identity keys (notification `id`) are deterministic and language-independent:
 * switching EN/AR never changes an id, so read state is preserved across
 * language switches.
 */

import { DateTime } from 'luxon';
import { getBookingPaymentSummary } from '../lib/paymentStatus';

export type StudentNotificationType =
  | 'lesson_reminder'
  | 'payment_action'
  | 'payment_verified'
  | 'payment_review'
  | 'payment_partial'
  | 'package_active'
  | 'lesson_cancelled';

export interface StudentNotificationItem {
  id: string;
  type: StudentNotificationType;
  title: string;
  titleAr: string;
  description: string;
  descriptionAr: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  actionLabelAr?: string;
  zoomUrl?: string;
}

/** Per-user localStorage key for read state (single shared contract). */
export function notificationReadStateKey(userId: string | undefined | null): string {
  return `watazawwado_notifications_${userId ?? 'anonymous'}`;
}

/** True when a lesson start is strictly in the future. */
export function getLessonStart(booking: any): string | null {
  const start = booking?.scheduledStart || booking?.scheduled_start || booking?.lesson_date;
  return start || null;
}

/** A valid (http/https) Zoom URL, or undefined. */
export function getValidZoomUrl(booking: any): string | undefined {
  const raw = String(booking?.zoomMeetingLink || booking?.zoom_join_url || '').trim();
  if (raw.startsWith('https://') || raw.startsWith('http://')) return raw;
  return undefined;
}

const UPCOMING_WINDOW_HOURS = 72;

/**
 * Build the student notification projection from authoritative payloads.
 * `readIds` marks items already read by the student (local contract).
 */
export function buildStudentNotifications(
  bookings: any[],
  payments: any[],
  packagesData: any,
  readIds: Set<string> = new Set()
): StudentNotificationItem[] {
  const items: StudentNotificationItem[] = [];
  const safeBookings = Array.isArray(bookings) ? bookings : [];
  const safePayments = Array.isArray(payments) ? payments : [];

  const bookingById = new Map<string, any>();
  for (const b of safeBookings) {
    if (b && b.id) bookingById.set(String(b.id), b);
  }

  const push = (item: Omit<StudentNotificationItem, 'read'>) => {
    items.push({ ...item, read: readIds.has(item.id) });
  };

  // ---------------------------------------------------------------------
  // 1. Booking-scoped notifications (lesson reminders, payment state,
  //    cancellations). Payment state reuses the authoritative helper.
  // ---------------------------------------------------------------------
  safeBookings.forEach((b: any) => {
    if (!b) return;
    const bookingKey = String(b.id || b.referenceCode || b.reference_code || '');
    const refCode = b.referenceCode || b.reference_code || '';
    const titleEn = b.serviceTitle || b.services?.title || 'Private Lesson';
    const titleAr = b.serviceArabicTitle || b.services?.arabic_title || titleEn;

    // 1a. Upcoming lesson reminder — future confirmed/rescheduled only.
    const startStr = getLessonStart(b);
    if (startStr && (b.status === 'confirmed' || b.status === 'rescheduled')) {
      const dt = DateTime.fromISO(startStr);
      if (dt.isValid) {
        const diffHours = dt.diffNow().as('hours');
        if (diffHours > 0 && diffHours < UPCOMING_WINDOW_HOURS) {
          const zoomUrl = getValidZoomUrl(b);
          push({
            id: `lesson_upcoming_${bookingKey}`,
            type: 'lesson_reminder',
            title: `Upcoming Lesson: ${titleEn}`,
            titleAr: `موعد درس قادم: ${titleAr}`,
            description: `Scheduled for ${dt.setLocale('en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} with Ustadh Mahmoud.`,
            descriptionAr: `مجدول في ${dt.setLocale('ar').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)} مع الأستاذ محمود.`,
            timestamp: dt.toISO() || new Date().toISOString(),
            actionUrl: zoomUrl || '/student/lessons',
            actionLabel: zoomUrl ? 'Join Zoom Classroom' : 'View Lesson',
            actionLabelAr: zoomUrl ? 'دخول فصل زووم' : 'تفاصيل الدرس',
            zoomUrl
          });
        }
      }
    }

    // 1b. Payment state for a pending booking — authoritative reconciliation.
    if (b.status === 'pending') {
      const summary = getBookingPaymentSummary(b, safePayments);
      const summaryCurrency = summary.currency || 'USD';
      const expected = summary.expected_amount;

      switch (summary.payment_status) {
        case 'unpaid':
        case 'payment_rejected': {
          const isRejected = summary.payment_status === 'payment_rejected';
          push({
            id: `payment_action_${bookingKey}`,
            type: 'payment_action',
            title: isRejected ? `Payment Needs Attention: ${titleEn}` : `Payment Claim Needed: ${titleEn}`,
            titleAr: isRejected ? `الدفع يحتاج مراجعة: ${titleAr}` : `مطلوب تأكيد الدفع: ${titleAr}`,
            description: isRejected
              ? `Your previous payment reference for booking ${refCode || 'N/A'} was not confirmed. Please submit a new reference.`
              : `Booking ref ${refCode || 'N/A'} is awaiting payment confirmation to guarantee your schedule slot.`,
            descriptionAr: isRejected
              ? `لم يتم تأكيد إثبات الدفع السابق للحجز ${refCode || '—'}. يرجى إرسال رقم مرجعي جديد.`
              : `الحجز ذو المرجع ${refCode || '—'} بانتظار إرسال إثبات الدفع لتثبيت الموعد.`,
            timestamp: b.createdAt || b.created_at || new Date().toISOString(),
            actionUrl: '/student/payments',
            actionLabel: 'Submit Payment Proof',
            actionLabelAr: 'إرسال إثبات الدفع'
          });
          break;
        }
        case 'pending_review': {
          push({
            id: `payment_review_${bookingKey}`,
            type: 'payment_review',
            title: `Payment Claim Awaiting Verification: ${titleEn}`,
            titleAr: `إثبات الدفع بانتظار التحقق: ${titleAr}`,
            description: `Your payment claim for booking ${refCode || 'N/A'} has been received and is awaiting verification by Ustadh Mahmoud. No further action is required.`,
            descriptionAr: `تم استلام إثبات الدفع للحجز ${refCode || '—'} وهو بانتظار مراجعة الأستاذ محمود. لا يلزم اتخاذ أي إجراء إضافي.`,
            timestamp: b.updatedAt || b.updated_at || b.createdAt || b.created_at || new Date().toISOString(),
            actionUrl: '/student/payments',
            actionLabel: 'Track Status',
            actionLabelAr: 'متابعة الحالة'
          });
          break;
        }
        case 'partially_paid': {
          const paid = summary.confirmed_amount;
          push({
            id: `payment_partial_${bookingKey}`,
            type: 'payment_partial',
            title: `Partially Paid: ${titleEn}`,
            titleAr: `مدفوع جزئياً: ${titleAr}`,
            description: `Booking ${refCode || 'N/A'} has ${paid} ${summaryCurrency} of ${expected ?? '—'} ${summaryCurrency} confirmed. The remaining balance is still required.`,
            descriptionAr: `تم تأكيد ${paid} ${summaryCurrency} من أصل ${expected ?? '—'} ${summaryCurrency} للحجز ${refCode || '—'}. لا يزال الرصيد المتبقي مطلوباً.`,
            timestamp: b.updatedAt || b.updated_at || b.createdAt || b.created_at || new Date().toISOString(),
            actionUrl: '/student/payments',
            actionLabel: 'View Payment Details',
            actionLabelAr: 'عرض تفاصيل الدفع'
          });
          break;
        }
        case 'paid': {
          push({
            id: `payment_verified_${bookingKey}`,
            type: 'payment_verified',
            title: `Payment Verified: ${titleEn}`,
            titleAr: `تم تأكيد الدفع: ${titleAr}`,
            description: `Ustadh Mahmoud has verified the payment for booking ${refCode || 'N/A'}. Your session is active.`,
            descriptionAr: `قام الأستاذ محمود بالتحقق من دفع الحجز ${refCode || '—'}. الحصة مفعلة.`,
            timestamp: b.updatedAt || b.updated_at || b.createdAt || b.created_at || new Date().toISOString(),
            actionUrl: '/student/payments',
            actionLabel: 'View Receipt',
            actionLabelAr: 'عرض الإيصال'
          });
          break;
        }
        case 'free_trial':
        default:
          // Free trials and any non-actionable state produce no payment notice.
          break;
      }
    }

    // 1c. Cancelled booking — authoritative status only, WhatsApp coordination.
    if (b.status === 'cancelled') {
      push({
        id: `lesson_cancelled_${bookingKey}`,
        type: 'lesson_cancelled',
        title: `Lesson Cancelled: ${titleEn}`,
        titleAr: `تم إلغاء الدرس: ${titleAr}`,
        description: startStr
          ? `The session originally set for ${DateTime.fromISO(startStr).toFormat('LLL dd')} was cancelled. Message Ustadh Mahmoud on WhatsApp to reschedule.`
          : 'A scheduled session was cancelled. Message Ustadh Mahmoud on WhatsApp to reschedule.',
        descriptionAr: 'تم إلغاء الجلسة التي كانت مجدولة مع الأستاذ محمود. يمكنك مراسلته عبر واتساب لإعادة الجدولة.',
        timestamp: b.updatedAt || b.updated_at || new Date().toISOString(),
        actionUrl: '/student/lessons',
        actionLabel: 'Check Schedule',
        actionLabelAr: 'مراجعة الجدول'
      });
    }
  });

  // ---------------------------------------------------------------------
  // 2. Payment-scoped notifications for records NOT handled at booking scope
  //    (package / unlinked). Uses the server's own payment status only.
  //    Package payments are never forced through booking reconciliation.
  // ---------------------------------------------------------------------
  safePayments.forEach((p: any) => {
    if (!p) return;
    const pBookingId = p.bookingId || p.booking_id;
    // If this payment belongs to a booking we already projected above, skip
    // to avoid duplicate/contradictory states.
    if (pBookingId && bookingById.has(String(pBookingId))) return;

    const ref = p.paymentReference || p.payment_reference || p.id?.slice?.(0, 8) || '';
    const amount = p.amount ? `$${p.amount}` : '';
    const currency = p.currency || 'USD';

    if (p.status === 'confirmed') {
      push({
        id: `payment_verified_${p.id || ref}`,
        type: 'payment_verified',
        title: `Payment Verified & Confirmed ${amount}`,
        titleAr: `تم تأكيد وقبول الدفع بنجاح ${amount}`,
        description: `Ustadh Mahmoud has verified your payment reference ${ref}. Your credits are active.`,
        descriptionAr: `قام الأستاذ محمود بالتحقق من الحوالة ذات المرجع ${ref}. تم تفعيل الرصيد بنجاح.`,
        timestamp: p.confirmed_at || p.updatedAt || p.updated_at || p.createdAt || p.created_at || new Date().toISOString(),
        actionUrl: '/student/payments',
        actionLabel: 'View Receipt',
        actionLabelAr: 'عرض الإيصال'
      });
    } else if (p.status === 'pending') {
      push({
        id: `payment_review_${p.id || ref}`,
        type: 'payment_review',
        title: `Payment Under Review (${ref})`,
        titleAr: `إثبات الدفع قيد المراجعة (${ref})`,
        description: `Your payment claim of ${amount} ${currency} via ${p.paymentMethod || p.payment_method || 'transfer'} is being reviewed.`,
        descriptionAr: `إثبات الدفع للحوالة ${amount} ${currency} عبر ${p.paymentMethod || p.payment_method || 'التحويل'} قيد المراجعة والاعتماد.`,
        timestamp: p.createdAt || p.created_at || new Date().toISOString(),
        actionUrl: '/student/payments',
        actionLabel: 'Track Status',
        actionLabelAr: 'متابعة الحالة'
      });
    }
  });

  // ---------------------------------------------------------------------
  // 3. Package availability — informational, concrete per-entitlement
  //    identity. A stable deterministic id per entitlement prevents a generic
  //    global notice from reappearing solely because credits remain > 0.
  // ---------------------------------------------------------------------
  const entitlements = Array.isArray(packagesData?.entitlements) ? packagesData.entitlements : [];
  entitlements.forEach((ent: any) => {
    if (!ent || !ent.id) return;
    if (ent.status !== 'active') return;
    const remaining = Number(ent.remainingCredits);
    if (!Number.isFinite(remaining) || remaining <= 0) return;

    const learnerSuffix = ent.learnerName ? ` (${ent.learnerName})` : '';
    push({
      id: `package_credits_${ent.id}`,
      type: 'package_active',
      title: `${remaining} Lesson Credits Ready`,
      titleAr: `لديك ${remaining} حصص جاهزة للحجز`,
      description: `You have active prepaid package credits${learnerSuffix}. Select your preferred time with Ustadh Mahmoud.`,
      descriptionAr: `رصيد باقتك متاح ومفعل. يمكنك حجز موعد جديد مباشرة باستخدام رصيدك.`,
      timestamp: ent.updatedAt || ent.updated_at || ent.createdAt || ent.created_at || new Date().toISOString(),
      actionUrl: '/student/book',
      actionLabel: 'Book with Package',
      actionLabelAr: 'حجز باستخدام الرصيد'
    });
  });

  // Deterministic ordering: newest first, then stable id tie-break.
  return items.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime();
    const timeB = new Date(b.timestamp).getTime();
    if (timeB !== timeA) return timeB - timeA;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

/** Unread count derived from the SAME projection used by the list. */
export function countUnread(items: StudentNotificationItem[]): number {
  return (items || []).filter(i => !i.read).length;
}

/** Safely read saved notification read IDs from client storage */
export function getSavedNotificationReadIds(userId?: string): Set<string> {
  if (typeof window === 'undefined') return new Set<string>();
  try {
    const saved = window.localStorage.getItem(notificationReadStateKey(userId));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return new Set<string>(parsed.map(String));
    }
  } catch {
    // Safe fallback
  }
  return new Set<string>();
}
