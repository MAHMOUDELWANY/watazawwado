/**
 * Focused tests for the Student E2E session/truthfulness hardening.
 *
 * Covers ONLY the concrete, verified A–D defects fixed in this change set:
 *   D1 — StudentHomePage: silent `if (!token) return;` in the independently
 *        loaded package + payment sections (missing/expired session must not
 *        silently look like empty/unloaded data).
 *   D2 — StudentPackagesPage: silent `if (!token) return;` paths.
 *   D3 — StudentProfilePage: silent `if (!token) return;` paths.
 *   B/C — StudentHomePage: unreachable `p.status === 'verified'` branch removed;
 *        the canonical server payment enum is
 *        'pending' | 'confirmed' | 'rejected' | 'refunded'.
 *
 * These are pure-logic / source-contract tests (no live server, no browser).
 * They do NOT claim production runtime or E2E verification.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { getBookingPaymentSummary } from '../src/lib/paymentStatus';

const __dirname = dirname(fileURLToPath(import.meta.url));
const read = (p: string) => readFileSync(join(__dirname, p), 'utf8');

const HOME = read('../src/student/pages/StudentHomePage.tsx');
const PACKAGES = read('../src/student/pages/StudentPackagesPage.tsx');
const PROFILE = read('../src/student/pages/StudentProfilePage.tsx');

// ---------------------------------------------------------------------------
// D1 — StudentHomePage silent returns removed + explicit session state
// ---------------------------------------------------------------------------

test('StudentHomePage has no silent `if (!token) return;` in any fetch', () => {
  assert.ok(
    !/if\s*\(\s*!token\s*\)\s*return\s*;/.test(HOME),
    'Home must not silently return on a missing token'
  );
});

test('StudentHomePage sets an explicit session error for the packages section', () => {
  assert.ok(
    /if\s*\(\s*!token\s*\)\s*\{[\s\S]*?setPackagesError\(/.test(HOME),
    'missing token in packages fetch must set an explicit session error'
  );
});

test('StudentHomePage sets an explicit session error for the payments section', () => {
  assert.ok(
    /if\s*\(\s*!token\s*\)\s*\{[\s\S]*?setPaymentsError\(/.test(HOME),
    'missing token in payments fetch must set an explicit session error'
  );
});

test('StudentHomePage package/payment sections keep independent loading/error/retry', () => {
  // The two sections remain independently gated (not coupled to core fetch).
  assert.ok(/packagesLoading\s*\?/.test(HOME), 'packages loading branch present');
  assert.ok(/packagesError\s*\?/.test(HOME), 'packages error branch present');
  assert.ok(/paymentsLoading\s*\?/.test(HOME), 'payments loading branch present');
  assert.ok(/paymentsError\s*\?/.test(HOME), 'payments error branch present');
  // Both error branches offer a bounded retry bound to their own fetch.
  assert.ok(/onClick=\{fetchPackagesData\}/.test(HOME), 'packages retry bound to fetchPackagesData');
  assert.ok(/onClick=\{fetchPaymentsData\}/.test(HOME), 'payments retry bound to fetchPaymentsData');
});

// ---------------------------------------------------------------------------
// B/C — StudentHomePage unreachable `verified` branch removed, no new enum
// ---------------------------------------------------------------------------

test('StudentHomePage no longer tests the non-existent `verified` payment status', () => {
  assert.ok(
    !/status\s*===\s*'verified'/.test(HOME) && !/status\s*===\s*"verified"/.test(HOME),
    "'verified' is not a valid payment status and must not be tested"
  );
});

test('StudentHomePage verified presentation derives from the authoritative reconciliation', () => {
  assert.ok(/hasVerifiedPayment/.test(HOME), 'a reconciliation-derived signal exists');
  assert.ok(
    /getBookingPaymentSummary\([\s\S]*?\)\.payment_status\s*===\s*'paid'/.test(HOME),
    'booking-linked verified state must come from getBookingPaymentSummary'
  );
  assert.ok(
    /some\(\s*p\s*=>\s*p\.status\s*===\s*'confirmed'\s*\)/.test(HOME),
    'package/unlinked verified state must use the real server status confirmed'
  );
});

test('StudentHomePage does not introduce a new payment status enum', () => {
  // It must not declare its own ReconciledPaymentStatus-like union.
  assert.ok(
    !/type\s+\w*Payment\w*Status\s*=/.test(HOME),
    'no new payment status enum may be declared in the page'
  );
});

// ---------------------------------------------------------------------------
// Authoritative contract sanity — the enum really excludes `verified`
// ---------------------------------------------------------------------------

test('reconciliation never yields a status named `verified`', () => {
  const booking = { id: 'b1', status: 'confirmed', bookingType: 'paid', feeAmountUsd: 30, currency: 'USD' };
  const payments = [{ bookingId: 'b1', status: 'confirmed', amount: 30, currency: 'USD' }];
  const summary = getBookingPaymentSummary(booking, payments);
  assert.equal(summary.payment_status, 'paid');
  assert.notEqual(String(summary.payment_status), 'verified');
});

// ---------------------------------------------------------------------------
// D2 — StudentPackagesPage silent returns removed + explicit session state
// ---------------------------------------------------------------------------

test('StudentPackagesPage has no silent `if (!token) return;`', () => {
  assert.ok(
    !/if\s*\(\s*!token\s*\)\s*return\s*;/.test(PACKAGES),
    'Packages must not silently return on a missing token'
  );
});

test('StudentPackagesPage missing token sets an explicit auth/session state', () => {
  assert.ok(/setAuthError\(true\)/.test(PACKAGES), 'missing token sets explicit authError');
  assert.ok(/if\s*\(\s*authError\s*\)/.test(PACKAGES), 'authError has its own render branch');
  assert.ok(
    /session is unavailable or has expired/.test(PACKAGES),
    'explicit session copy present (EN)'
  );
  assert.ok(/جلسة الدخول غير متاحة أو منتهية/.test(PACKAGES), 'explicit session copy present (AR)');
});

test('StudentPackagesPage missing session is distinct from the truthful empty state', () => {
  assert.ok(
    /No active packages yet/.test(PACKAGES),
    'the truthful empty-packages state must still exist separately'
  );
});

test('StudentPackagesPage ledger missing token sets an explicit ledger error', () => {
  assert.ok(
    /if\s*\(\s*!token\s*\)\s*\{[\s\S]*?setLedgerError\(/.test(PACKAGES),
    'missing token in ledger fetch must set an explicit error, not silently return'
  );
});

// ---------------------------------------------------------------------------
// D3 — StudentProfilePage silent returns removed
// ---------------------------------------------------------------------------

test('StudentProfilePage has no silent `if (!token) return;`', () => {
  assert.ok(
    !/if\s*\(\s*!token\s*\)\s*return\s*;/.test(PROFILE),
    'Profile must not silently return on a missing token'
  );
});

test('StudentProfilePage probes surface an explicit session state', () => {
  // Both diagnostic probes must set an error instead of no-op'ing silently.
  const probeMatches = PROFILE.match(/if\s*\(\s*!token\s*\)\s*\{[\s\S]*?setError\(/g) || [];
  assert.ok(
    probeMatches.length >= 2,
    'both silent probe returns must be replaced with an explicit session error'
  );
});

test('StudentProfilePage keeps its throwing session behavior for GET/PATCH', () => {
  // The authoritative load/save paths keep failing closed (throw) — unchanged.
  const throws = PROFILE.match(/throw new Error\([\s\S]*?Session token missing/g) || [];
  assert.ok(throws.length >= 2, 'fetchProfile and handleSave must still throw on missing token');
});

// ---------------------------------------------------------------------------
// No new payment/notification state engine introduced anywhere
// ---------------------------------------------------------------------------

test('no new payment status engine was introduced in the touched pages', () => {
  for (const [name, src] of [['Home', HOME], ['Packages', PACKAGES], ['Profile', PROFILE]] as const) {
    assert.ok(
      !/engine/i.test(src) || !/new\s+PaymentStatusEngine/.test(src),
      `${name} must not introduce a payment status engine`
    );
  }
});

test('packages/profile pages reuse existing auth/session architecture', () => {
  assert.ok(/useTeacherAuth\(\)/.test(PACKAGES), 'Packages uses the existing auth hook');
  assert.ok(/useTeacherAuth\(\)/.test(PROFILE), 'Profile uses the existing auth hook');
});
