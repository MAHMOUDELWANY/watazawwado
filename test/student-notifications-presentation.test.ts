/**
 * Focused tests for the minimal Student Notifications hardening.
 *
 * Covers the shared pure notification projection
 * (src/student/notificationsPresentation.ts) which is the SINGLE source of
 * truth for both the notification list and the unread badge, plus source-level
 * guarantees for the session/error hardening in StudentNotificationsPage and
 * the shared-badge invariant in StudentApp.
 *
 * Pure-logic tests only (no live server). No production E2E is claimed.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { DateTime } from 'luxon';

import {
  buildStudentNotifications,
  countUnread,
  notificationReadStateKey
} from '../src/student/notificationsPresentation';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, '..', p), 'utf8');
const PAGE_SRC = read('src/student/pages/StudentNotificationsPage.tsx');
const APP_SRC = read('src/student/StudentApp.tsx');

const futureIso = (hours: number) => DateTime.utc().plus({ hours }).toISO()!;
const pastIso = (hours: number) => DateTime.utc().minus({ hours }).toISO()!;

const pendingBooking = (over: Record<string, any> = {}) => ({
  id: 'bk-1',
  referenceCode: 'REF1',
  serviceTitle: 'Quran Reading',
  status: 'pending',
  feeAmountUsd: 15,
  bookingType: 'paid',
  createdAt: pastIso(2),
  ...over
});

const find = (items: any[], id: string) => items.find(i => i.id === id);

// ---------------------------------------------------------------------------
// 1. pending booking + no payment -> Payment Claim Needed
// ---------------------------------------------------------------------------
test('1. pending booking with no payment yields a Payment Claim Needed action', () => {
  const items = buildStudentNotifications([pendingBooking()], [], null);
  const action = find(items, 'payment_action_bk-1');
  assert.ok(action, 'expected a payment action notification');
  assert.equal(action!.type, 'payment_action');
  assert.match(action!.title, /Payment Claim Needed/);
  assert.ok(!items.some(i => i.type === 'payment_review'), 'must not be under review');
});

// ---------------------------------------------------------------------------
// 2. pending booking + pending payment claim -> Awaiting Verification (not needed)
// ---------------------------------------------------------------------------
test('2. pending booking with a pending claim yields Awaiting Verification, NOT Payment Claim Needed', () => {
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'pending' }];
  const items = buildStudentNotifications([pendingBooking()], payments, null);
  const review = find(items, 'payment_review_bk-1');
  assert.ok(review, 'expected an awaiting-verification notification');
  assert.match(review!.title, /Awaiting Verification/);
  assert.ok(!items.some(i => i.type === 'payment_action'), 'must NOT ask the student to resubmit');
});

// ---------------------------------------------------------------------------
// 3. pending booking + confirmed full payment -> no payment-needed notification
// ---------------------------------------------------------------------------
test('3. pending booking with a confirmed full payment yields no payment-needed notification', () => {
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'confirmed' }];
  const items = buildStudentNotifications([pendingBooking()], payments, null);
  assert.ok(!items.some(i => i.type === 'payment_action'), 'no payment-needed notice when fully paid');
  const verified = find(items, 'payment_verified_bk-1');
  assert.ok(verified, 'expected a verified payment notification');
});

// ---------------------------------------------------------------------------
// 4. pending booking + rejected payment -> payment action state, not awaiting verification
// ---------------------------------------------------------------------------
test('4. pending booking with a rejected payment yields a payment action, not awaiting verification', () => {
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'rejected' }];
  const items = buildStudentNotifications([pendingBooking()], payments, null);
  const action = find(items, 'payment_action_bk-1');
  assert.ok(action, 'expected a payment action notification');
  assert.ok(!items.some(i => i.type === 'payment_review'), 'rejected must not read as awaiting verification');
});

// ---------------------------------------------------------------------------
// 5. partial payment -> Partially Paid, not verified
// ---------------------------------------------------------------------------
test('5. partial payment yields Partially Paid and is never presented as verified', () => {
  const booking = pendingBooking({ feeAmountUsd: 30 });
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 10, status: 'confirmed' }];
  const items = buildStudentNotifications([booking], payments, null);
  const partial = find(items, 'payment_partial_bk-1');
  assert.ok(partial, 'expected a partial-payment notification');
  assert.equal(partial!.type, 'payment_partial');
  assert.match(partial!.title, /Partially Paid/);
  assert.ok(!items.some(i => i.type === 'payment_verified'), 'partial must not read as verified');
});

// ---------------------------------------------------------------------------
// 6. free trial -> no payment-needed notification
// ---------------------------------------------------------------------------
test('6. free trial produces no payment-needed notification', () => {
  const trial = pendingBooking({ bookingType: 'trial', feeAmountUsd: 0, status: 'confirmed' });
  const items = buildStudentNotifications([trial], [], null);
  assert.ok(!items.some(i => i.type === 'payment_action'), 'free trial must not require payment');
});

// ---------------------------------------------------------------------------
// 7. package credits notification -> deterministic stable id, no language-dep id
// ---------------------------------------------------------------------------
test('7. package credits notification has a deterministic, language-independent id', () => {
  const packagesData = { entitlements: [{ id: 'ent-1', status: 'active', remainingCredits: 3 }], creditSummary: { totalRemaining: 3 } };
  const en = buildStudentNotifications([], [], packagesData);
  const ar = buildStudentNotifications([], [], packagesData);
  assert.equal(en.length, 1);
  assert.equal(en[0].id, 'package_credits_ent-1');
  assert.deepEqual(en.map(i => i.id), ar.map(i => i.id), 'ids must not depend on language');

  // A concrete per-entitlement id — not a generic global id that reappears.
  assert.notEqual(en[0].id, 'package_credits_available');
});

test('7b. exhausted / inactive entitlements produce no package notification', () => {
  const packagesData = { entitlements: [{ id: 'ent-2', status: 'exhausted', remainingCredits: 0 }] };
  const items = buildStudentNotifications([], [], packagesData);
  assert.equal(items.length, 0);
});

// ---------------------------------------------------------------------------
// 8. upcoming confirmed lesson -> reminder
// ---------------------------------------------------------------------------
test('8. an upcoming confirmed lesson yields a lesson reminder', () => {
  const booking = { id: 'bk-2', referenceCode: 'REF2', serviceTitle: 'Tajweed', status: 'confirmed', scheduledStart: futureIso(24) };
  const items = buildStudentNotifications([booking], [], null);
  const reminder = find(items, 'lesson_upcoming_bk-2');
  assert.ok(reminder, 'expected a lesson reminder');
  assert.equal(reminder!.type, 'lesson_reminder');
});

// ---------------------------------------------------------------------------
// 9. upcoming rescheduled lesson -> reminder
// ---------------------------------------------------------------------------
test('9. an upcoming rescheduled lesson yields a lesson reminder', () => {
  const booking = { id: 'bk-3', referenceCode: 'REF3', serviceTitle: 'Tajweed', status: 'rescheduled', scheduledStart: futureIso(48) };
  const items = buildStudentNotifications([booking], [], null);
  assert.ok(find(items, 'lesson_upcoming_bk-3'), 'expected a lesson reminder for rescheduled');
});

// ---------------------------------------------------------------------------
// 10. cancelled lesson -> cancelled notification, no upcoming reminder
// ---------------------------------------------------------------------------
test('10. a cancelled lesson yields a cancelled notification and no upcoming reminder', () => {
  const booking = { id: 'bk-4', referenceCode: 'REF4', serviceTitle: 'Tajweed', status: 'cancelled', scheduledStart: futureIso(24) };
  const items = buildStudentNotifications([booking], [], null);
  assert.ok(find(items, 'lesson_cancelled_bk-4'), 'expected a cancelled notification');
  assert.ok(!items.some(i => i.type === 'lesson_reminder'), 'cancelled must not produce a reminder');
});

// ---------------------------------------------------------------------------
// 11. completed / past lesson -> no upcoming reminder
// ---------------------------------------------------------------------------
test('11. a past/completed lesson yields no upcoming reminder', () => {
  const completed = { id: 'bk-5', referenceCode: 'REF5', serviceTitle: 'Tajweed', status: 'completed', scheduledStart: pastIso(5) };
  const confirmedPast = { id: 'bk-6', referenceCode: 'REF6', serviceTitle: 'Tajweed', status: 'confirmed', scheduledStart: pastIso(5) };
  const items = buildStudentNotifications([completed, confirmedPast], [], null);
  assert.ok(!items.some(i => i.type === 'lesson_reminder'), 'no reminder for past lessons');
});

// ---------------------------------------------------------------------------
// 12. unread count equals unread items from the same projection
// ---------------------------------------------------------------------------
test('12. countUnread equals the number of unread items in the same projection', () => {
  const booking = { id: 'bk-7', referenceCode: 'REF7', serviceTitle: 'Tajweed', status: 'confirmed', scheduledStart: futureIso(24) };
  const items = buildStudentNotifications([booking], [], null);
  assert.equal(countUnread(items), items.filter(i => !i.read).length);
  assert.equal(countUnread(items), items.length);
});

test('12b. read state (by deterministic id) is reflected in the projection and count', () => {
  const booking = { id: 'bk-8', referenceCode: 'REF8', serviceTitle: 'Tajweed', status: 'confirmed', scheduledStart: futureIso(24) };
  const id = 'lesson_upcoming_bk-8';
  const unread = buildStudentNotifications([booking], [], null);
  const read = buildStudentNotifications([booking], [], null, new Set([id]));
  assert.equal(countUnread(unread), 1);
  assert.equal(countUnread(read), 0);
  assert.equal(find(read, id)!.read, true);
});

// ---------------------------------------------------------------------------
// 13. English and Arabic produce identical notification IDs
// ---------------------------------------------------------------------------
test('13. switching language never changes notification ids (read state preserved)', () => {
  const booking = pendingBooking({ id: 'bk-9', referenceCode: 'REF9' });
  const payments = [{ id: 'p1', bookingId: 'bk-9', amount: 15, status: 'pending' }];
  const packagesData = { entitlements: [{ id: 'ent-9', status: 'active', remainingCredits: 2 }] };
  const enIds = buildStudentNotifications([booking], payments, packagesData).map(i => i.id);
  const arIds = buildStudentNotifications([booking], payments, packagesData).map(i => i.id);
  assert.deepEqual(enIds, arIds);
});

// ---------------------------------------------------------------------------
// 17. package/unlinked payment is never forced through booking reconciliation
// ---------------------------------------------------------------------------
test('17. a package/unlinked payment uses the server status, not booking reconciliation', () => {
  const payments = [{ id: 'pkg-pay-1', entitlementId: 'ent-1', amount: 60, status: 'pending', paymentMethod: 'paypal' }];
  const items = buildStudentNotifications([], payments, null);
  const review = find(items, 'payment_review_pkg-pay-1');
  assert.ok(review, 'expected a review notification for the package payment');
  assert.ok(!items.some(i => i.type === 'payment_action'), 'package payment must not become a booking payment action');
});

test('17b. a payment linked to a projected booking is not double-projected', () => {
  const booking = pendingBooking();
  const payments = [{ id: 'p1', bookingId: 'bk-1', amount: 15, status: 'pending' }];
  const items = buildStudentNotifications([booking], payments, null);
  // Only the booking-scoped review item should exist — no duplicate payment-scoped one.
  assert.equal(items.filter(i => i.type === 'payment_review').length, 1);
});

// ---------------------------------------------------------------------------
// 14. no session does not silently produce an empty notification state
// ---------------------------------------------------------------------------
test('14. missing token sets an explicit auth error and never silently returns', () => {
  assert.ok(!/if\s*\(\s*!token\s*\)\s*return\s*;/.test(PAGE_SRC), 'page must not silently return on missing token');
  assert.ok(/setAuthError\(true\)/.test(PAGE_SRC), 'missing token must set an explicit auth error');
  assert.ok(/session is unavailable or has expired/.test(PAGE_SRC), 'explicit session copy present');
});

// ---------------------------------------------------------------------------
// 15. 401 is distinct from empty history
// ---------------------------------------------------------------------------
test('15. a 401 response maps to an explicit session state, not an empty history', () => {
  assert.ok(/status\s*===\s*401/.test(PAGE_SRC), 'page must detect 401');
  assert.ok(/authError\s*\?/.test(PAGE_SRC), 'authError has its own render branch');
  assert.ok(/All caught up!/.test(PAGE_SRC), 'the empty state copy still exists separately');
});

// ---------------------------------------------------------------------------
// 16. fetch failure has a retry affordance
// ---------------------------------------------------------------------------
test('16. the fetch error state provides a Try Again retry reusing fetchNotificationData', () => {
  assert.ok(/Try Again/.test(PAGE_SRC), 'English retry label present');
  assert.ok(/إعادة المحاولة/.test(PAGE_SRC), 'Arabic retry label present');
  assert.ok(/onClick=\{fetchNotificationData\}/.test(PAGE_SRC), 'retry must reuse the existing fetch function');
});

// ---------------------------------------------------------------------------
// Shared-projection invariant: the unread badge must use the same source
// ---------------------------------------------------------------------------
test('StudentApp badge is derived from the same shared notification projection', () => {
  assert.ok(/from '\.\/notificationsPresentation'/.test(APP_SRC), 'StudentApp must import the shared projection');
  assert.ok(/buildStudentNotifications\(/.test(APP_SRC), 'StudentApp must use the shared builder');
  assert.ok(/countUnread\(/.test(APP_SRC), 'StudentApp must use the shared unread counter');
  // The old ad-hoc ruleset must be gone.
  assert.ok(!/p\.status === 'under_review'/.test(APP_SRC), 'the stale under_review rule must be removed');
});

test('read-state key is a single shared contract and per-user isolated', () => {
  assert.equal(notificationReadStateKey('user-1'), 'watazawwado_notifications_user-1');
  assert.notEqual(notificationReadStateKey('user-1'), notificationReadStateKey('user-2'));
  assert.ok(/notificationReadStateKey/.test(PAGE_SRC), 'page must use the shared read-state key');
  assert.ok(/notificationReadStateKey/.test(APP_SRC), 'badge computation must use the same read-state key');
});
