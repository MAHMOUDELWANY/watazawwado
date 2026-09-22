/**
 * paymentStatus.ts
 * 
 * Reusable, authoritative client-side payment status reconciliation.
 * Mirrors the canonical server-side reconcileBookingPayments logic in /api/index.ts (lines 2230-2294).
 * 
 * Accurately derives the payment state for a given booking given the student's payment records,
 * preventing false "Confirmed" representations when a booking is awaiting payment claim or manual review.
 */

export type ReconciledPaymentStatus =
  | 'free_trial'
  | 'paid'
  | 'partially_paid'
  | 'pending_review'
  | 'payment_rejected'
  | 'unpaid';

export interface BookingPaymentSummary {
  payment_status: ReconciledPaymentStatus;
  expected_amount: number | null;
  confirmed_amount: number;
  currency: string | null;
  isPendingPayment: boolean; // True if payment is unpaid, partially paid, or under review
  isAwaitingVerification: boolean; // True specifically if a payment claim has been submitted and is under review
  isUnpaid: boolean; // True if no payment claim has been submitted yet for a non-trial lesson
  isRejected: boolean; // True if payment claim was rejected
  isPaidOrTrial: boolean; // True if fully paid or free trial
}

/**
 * Reconciles the payment status of a booking using the student's payments list.
 * Exactly adheres to /api/index.ts lines 2230-2294.
 */
export function getBookingPaymentSummary(booking: any, payments: any[] = []): BookingPaymentSummary {
  if (!booking) {
    return {
      payment_status: 'unpaid',
      expected_amount: null,
      confirmed_amount: 0,
      currency: null,
      isPendingPayment: true,
      isAwaitingVerification: false,
      isUnpaid: true,
      isRejected: false,
      isPaidOrTrial: false
    };
  }

  // 1. Expected amount determination - Never invent arbitrary amounts
  let expectedAmount: number | null = null;
  const isTrial = booking.bookingType === 'trial' || booking.booking_type === 'trial';

  if (isTrial) {
    expectedAmount = 0;
  } else if (
    booking.feeAmountUsd !== null &&
    booking.feeAmountUsd !== undefined &&
    !isNaN(Number(booking.feeAmountUsd))
  ) {
    expectedAmount = Number(booking.feeAmountUsd);
  } else if (
    booking.fee_amount_usd !== null &&
    booking.fee_amount_usd !== undefined &&
    !isNaN(Number(booking.fee_amount_usd))
  ) {
    expectedAmount = Number(booking.fee_amount_usd);
  } else {
    expectedAmount = null;
  }

  // 2. Filter payments linked to this booking via explicit booking_id (or bookingId) or reference code
  const bookingId = booking.id;
  const bookingRef = booking.referenceCode || booking.reference_code;

  const bPayments = (payments || []).filter((p: any) => {
    if (!p) return false;
    const pBookingId = p.bookingId || p.booking_id;
    if (pBookingId && bookingId && pBookingId === bookingId) return true;
    const pRef = p.paymentReference || p.payment_reference;
    if (pRef && bookingRef && pRef.trim().toUpperCase() === bookingRef.trim().toUpperCase()) return true;
    return false;
  });

  // 3. Sum confirmed payments
  const confirmedPayments = bPayments.filter((p: any) => p.status === 'confirmed');
  const confirmedAmount = confirmedPayments.reduce(
    (acc: number, p: any) => acc + Number(p.amount || 0),
    0
  );

  // 4. Pending review payments
  const pendingPayments = bPayments.filter((p: any) => p.status === 'pending');

  // 5. Rejected payments
  const rejectedPayments = bPayments.filter(
    (p: any) => p.status === 'rejected' || (p.notes && typeof p.notes === 'string' && p.notes.includes('[REJECTED'))
  );

  // 6. Currency
  let currency: string | null =
    bPayments[0]?.currency || booking.currency || 'USD';

  // 7. Status computation (exactly matching /api/index.ts lines 2270-2285)
  let paymentStatus: ReconciledPaymentStatus = 'unpaid';

  if (isTrial || expectedAmount === 0) {
    paymentStatus = 'free_trial';
  } else if (expectedAmount !== null && expectedAmount > 0 && confirmedAmount >= expectedAmount) {
    paymentStatus = 'paid';
  } else if (expectedAmount !== null && confirmedAmount > 0 && confirmedAmount < expectedAmount) {
    paymentStatus = 'partially_paid';
  } else if (confirmedAmount > 0 && expectedAmount === null) {
    paymentStatus = 'paid';
  } else if (pendingPayments.length > 0) {
    paymentStatus = 'pending_review';
  } else if (rejectedPayments.length > 0 && confirmedAmount === 0) {
    paymentStatus = 'payment_rejected';
  } else {
    paymentStatus = 'unpaid';
  }

  const isPaidOrTrial = paymentStatus === 'paid' || paymentStatus === 'free_trial';
  const isPendingPayment = !isPaidOrTrial && booking.status !== 'cancelled';
  const isAwaitingVerification = paymentStatus === 'pending_review';
  const isUnpaid = paymentStatus === 'unpaid';
  const isRejected = paymentStatus === 'payment_rejected';

  return {
    payment_status: paymentStatus,
    expected_amount: expectedAmount,
    confirmed_amount: Number(confirmedAmount.toFixed(2)),
    currency,
    isPendingPayment,
    isAwaitingVerification,
    isUnpaid,
    isRejected,
    isPaidOrTrial
  };
}
