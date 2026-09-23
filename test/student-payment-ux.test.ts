/**
 * Focused tests for the minimal Student Payment UX hardening.
 *
 * Covers the two concrete, scoped changes only:
 *   1) Authoritative payment reconciliation presentation (truthful state labels)
 *   2) Session / error / loading state logic (no silent return, retry present,
 *      error distinct from empty)
 *
 * These are pure-logic tests (no live server). They do NOT claim production E2E.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyPaymentItem,
  presentBookingPayment,
  presentDirectPayment
} from '../src/student/paymentPresentation';
import { getBookingPaymentSummary } from '../src/lib/paymentStatus';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE_SRC = readFileSync(
  join(__dirname, '../src/student/pages/StudentPaymentsPage.tsx'),
  'utf8'
);

// ---------------------------------------------------------------------------
// Payment item classification — package vs booking must stay distinguishable
// ---------------------------------------------------------------------------

test('package payment is classified as package, not booking', () => {
  assert.equal(classifyPaymentItem({ entitlementId: 'ent-1', bookingId: null }), 'package');
  assert.equal(classifyPaymentItem({ entitlement_id: 'ent-1' }), 'package');
});

test('booking payment is classified as booking', () => {
  assert.equal(classifyPaymentItem({ bookingId: 'bk-1', entitlementId: null }), 'booking');
  assert.equal(classifyPaymentItem({ booking_id: 'bk-1' }), 'booking');
});

test('payment with neither id is unlinked (never forced through booking reconciliation)', () => {
  assert.equal(classifyPaymentItem({}), 'unlinked');
  assert.equal(classifyPaymentItem(null), 'unlinked');
});

// ---------------------------------------------------------------------------
// Booking payment presentation — derived from the authoritative helper
// ---------------------------------------------------------------------------

test('booking with NO submitted payment is not shown as awaiting verification', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'pending', feeAmountUsd: 15, bookingType: 'paid' };
  const summary = getBookingPaymentSummary(booking, []);
  assert.equal(summary.payment_status, 'unpaid');
  assert.equal(summary.isAwaitingVerification, false);
  const en = presentBookingPayment(summary.payment_status, false);
  assert.equal(en.label, 'No Payment Submitted Yet');
  assert.notEqual(en.label, 'Awaiting Verification');
});

test('booking payment under review is shown as awaiting verification', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'pending', feeAmountUsd: 15, bookingType: 'paid' };
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'pending' }];
  const summary = getBookingPaymentSummary(booking, payments);
  assert.equal(summary.payment_status, 'pending_review');
  assert.equal(summary.isAwaitingVerification, true);
  const en = presentBookingPayment(summary.payment_status, false);
  assert.equal(en.label, 'Awaiting Verification');
  assert.notEqual(en.label, 'Verified & Activated');
});

test('verified payment is shown as verified/activated (only from confirmed data)', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'confirmed', feeAmountUsd: 15, bookingType: 'paid' };
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'confirmed' }];
  const summary = getBookingPaymentSummary(booking, payments);
  assert.equal(summary.payment_status, 'paid');
  const en = presentBookingPayment(summary.payment_status, false);
  assert.equal(en.label, 'Verified & Activated');
  assert.equal(en.tone, 'success');
});

test('rejected booking payment surfaces as rejected (only when data says so)', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'pending', feeAmountUsd: 15, bookingType: 'paid' };
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'rejected' }];
  const summary = getBookingPaymentSummary(booking, payments);
  assert.equal(summary.payment_status, 'payment_rejected');
  const en = presentBookingPayment(summary.payment_status, false);
  assert.equal(en.label, 'Rejected');
  assert.equal(en.tone, 'destructive');
});

test('partial booking payment is shown as partially paid (not verified)', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'pending', feeAmountUsd: 30, bookingType: 'paid' };
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 10, status: 'confirmed' }];
  const summary = getBookingPaymentSummary(booking, payments);
  assert.equal(summary.payment_status, 'partially_paid');
  const en = presentBookingPayment(summary.payment_status, false);
  assert.equal(en.label, 'Partially Paid');
  assert.notEqual(en.tone, 'success');
});

// ---------------------------------------------------------------------------
// Direct (package / unlinked) presentation — server status only, never invented
// ---------------------------------------------------------------------------

test('package payment confirmed is shown verified; pending is under review; unknown is never positive', () => {
  assert.equal(presentDirectPayment('confirmed', false).label, 'Verified & Activated');
  assert.equal(presentDirectPayment('confirmed', false).tone, 'success');
  assert.equal(presentDirectPayment('pending', false).label, 'Under Review');
  assert.equal(presentDirectPayment('pending', false).tone, 'warning');
  assert.equal(presentDirectPayment('rejected', false).label, 'Rejected');
  // An unknown/absent server status must never be presented as verified.
  const unknown = presentDirectPayment(undefined, false);
  assert.notEqual(unknown.tone, 'success');
  assert.notEqual(unknown.label, 'Verified & Activated');
});

test('Arabic labels render for both booking and direct presentation', () => {
  assert.equal(presentBookingPayment('paid', true).label, 'مؤكد ومُفعّل');
  assert.equal(presentBookingPayment('unpaid', true).label, 'لم يتم إرسال إثبات بعد');
  assert.equal(presentDirectPayment('pending', true).label, 'قيد المراجعة');
});

// ---------------------------------------------------------------------------
// Contradiction guards — no "payment needed" + "under review" simultaneously
// ---------------------------------------------------------------------------

test('a single booking cannot be simultaneously unpaid and awaiting verification', () => {
  const booking = { id: 'bk-1', referenceCode: 'REF1', status: 'pending', feeAmountUsd: 15, bookingType: 'paid' };
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'pending' }];
  const s = getBookingPaymentSummary(booking, payments);
  // The awaiting-claim bucket requires isUnpaid || isRejected; verify it excludes this case.
  const inAwaitingClaim = s.isUnpaid || s.isRejected;
  assert.equal(inAwaitingClaim, false);
  assert.equal(s.isAwaitingVerification, true);
});

// ---------------------------------------------------------------------------
// Session / error / loading state hardening (source-level guarantees)
// ---------------------------------------------------------------------------

test('fetchData does NOT silently return when the session token is missing', () => {
  // The old defect was: `if (!token) return;` leaving loading stuck / empty state.
  assert.ok(
    !/if\s*\(\s*!token\s*\)\s*return\s*;/.test(PAGE_SRC),
    'StudentPaymentsPage must not silently return on a missing token'
  );
  // It must set an explicit auth error and exit loading instead.
  assert.ok(/setAuthError\(true\)/.test(PAGE_SRC), 'missing token must set an explicit auth error');
});

test('a 401 response maps to an explicit auth/session state, not an empty history', () => {
  assert.ok(/status\s*===\s*401/.test(PAGE_SRC), 'page must detect 401 as an auth state');
});

test('the fetch error state provides a Try Again retry affordance bound to fetchData', () => {
  assert.ok(/Try Again/.test(PAGE_SRC), 'English retry label present');
  assert.ok(/إعادة المحاولة/.test(PAGE_SRC), 'Arabic retry label present');
  // Retry must reuse the existing fetchData function (no new fetch path).
  assert.ok(/onClick=\{fetchData\}/.test(PAGE_SRC), 'retry must call the existing fetchData');
});

test('auth/session error is visually distinct from the empty-history state', () => {
  assert.ok(/authError\s*\?/.test(PAGE_SRC), 'authError has its own render branch');
  assert.ok(/No payments recorded yet/.test(PAGE_SRC), 'empty-history copy still exists separately');
  assert.ok(/session is unavailable or has expired/.test(PAGE_SRC), 'explicit session copy present');
});

test('loading state is cleared when auth/session is missing (no stuck loading)', () => {
  // fetchData sets loading=false in a finally block, and auth state returns early
  // inside the try, so the finally still runs and clears loading.
  assert.ok(/finally\s*\{[\s\S]*?setLoading\(false\)/.test(PAGE_SRC), 'loading is always cleared');
});
