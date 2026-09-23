/**
 * paymentPresentation.ts
 *
 * Pure, side-effect-free presentation helpers for the Student Payment UX.
 *
 * Scope: ONLY the calm, truthful presentation of payment records. This module
 * does NOT re-implement payment authority. Booking-linked payment state is
 * derived exclusively from the existing authoritative helper
 * `getBookingPaymentSummary` (src/lib/paymentStatus.ts), which mirrors the
 * server-side `reconcileBookingPayments` logic. This file only maps that
 * already-authoritative state (or the raw server payment status) to calm,
 * bilingual labels — it never invents a new status enum or amount.
 */

import type { ReconciledPaymentStatus } from '../lib/paymentStatus';

export type PaymentTone = 'success' | 'warning' | 'destructive' | 'neutral';

/** The kind of item a payment record belongs to. */
export type PaymentItemKind = 'booking' | 'package' | 'unlinked';

/**
 * Classify a payment record by its owning item.
 * Package payments are identified by a package entitlement id and are kept
 * strictly distinguishable from booking payments.
 */
export function classifyPaymentItem(payment: any): PaymentItemKind {
  if (!payment) return 'unlinked';
  const entitlementId = payment.entitlementId || payment.entitlement_id;
  if (entitlementId) return 'package';
  const bookingId = payment.bookingId || payment.booking_id;
  if (bookingId) return 'booking';
  return 'unlinked';
}

export interface PaymentRecordPresentation {
  /** The authoritative state key used to render the row. */
  stateKey: string;
  label: string;
  tone: PaymentTone;
}

/**
 * Presentation for a booking-linked payment record.
 *
 * `state` comes from the existing authoritative `getBookingPaymentSummary`
 * helper (never recomputed here). The record's own server `status` is only
 * used to disambiguate the "rejected" case, which the reconciliation contract
 * exposes as `payment_rejected`.
 */
export function presentBookingPayment(
  paymentStatus: ReconciledPaymentStatus,
  isAr: boolean
): PaymentRecordPresentation {
  switch (paymentStatus) {
    case 'paid':
      return {
        stateKey: 'paid',
        label: isAr ? 'مؤكد ومُفعّل' : 'Verified & Activated',
        tone: 'success'
      };
    case 'free_trial':
      return {
        stateKey: 'free_trial',
        label: isAr ? 'تجربة مجانية' : 'Free Trial',
        tone: 'neutral'
      };
    case 'partially_paid':
      return {
        stateKey: 'partial',
        label: isAr ? 'مدفوع جزئياً' : 'Partially Paid',
        tone: 'warning'
      };
    case 'pending_review':
      return {
        stateKey: 'pending_review',
        label: isAr ? 'بانتظار التحقق' : 'Awaiting Verification',
        tone: 'warning'
      };
    case 'payment_rejected':
      return {
        stateKey: 'rejected',
        label: isAr ? 'مرفوض' : 'Rejected',
        tone: 'destructive'
      };
    case 'unpaid':
    default:
      return {
        stateKey: 'unpaid',
        label: isAr ? 'لم يتم إرسال إثبات بعد' : 'No Payment Submitted Yet',
        tone: 'neutral'
      };
  }
}

/**
 * Presentation for a package or unlinked payment record.
 *
 * Package payments are NOT run through booking-specific reconciliation
 * (package_entitlements has its own lifecycle). We only surface the server's
 * own payment status truthfully:
 *   pending   -> under review (a claim was submitted, awaiting verification)
 *   confirmed -> verified & activated
 *   rejected  -> rejected (only when the server says rejected)
 *   anything else -> never claim "verified".
 */
export function presentDirectPayment(
  serverStatus: string | null | undefined,
  isAr: boolean
): PaymentRecordPresentation {
  switch (serverStatus) {
    case 'confirmed':
      return {
        stateKey: 'confirmed',
        label: isAr ? 'مؤكد ومُفعّل' : 'Verified & Activated',
        tone: 'success'
      };
    case 'pending':
      return {
        stateKey: 'pending',
        label: isAr ? 'قيد المراجعة' : 'Under Review',
        tone: 'warning'
      };
    case 'rejected':
      return {
        stateKey: 'rejected',
        label: isAr ? 'مرفوض' : 'Rejected',
        tone: 'destructive'
      };
    default:
      // Never assert a positive or negative verification outcome we did not receive.
      return {
        stateKey: 'unverified',
        label: isAr ? 'بانتظار التحقق' : 'Awaiting Verification',
        tone: 'neutral'
      };
  }
}
