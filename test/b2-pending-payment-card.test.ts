import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('B2: a lesson held for payment shows outside the booking flow (owner 2026-10-28)', () => {
  it('the card is on home, lessons, wallet and booking', () => {
    for (const page of ['StudentHomePage', 'StudentLessonsPage', 'StudentWalletPage', 'StudentBookingPage']) {
      assert.match(read(`src/student/pages/${page}.tsx`), /<PendingPaymentCard /, page);
    }
    // The booking flow verifies its own Stripe return.
    assert.match(read('src/student/pages/StudentBookingPage.tsx'), /handleStripeReturn=\{false\}/);
  });

  it('shows only unpaid pay-now holds that have not expired, with Pay and Let it go', () => {
    const card = read('src/student/components/PendingPaymentCard.tsx');
    assert.match(card, /b\.paymentPlan === 'pay_now'/);
    assert.match(card, /holdExpiresAt/);
    assert.match(card, /release-hold/);
    assert.match(card, /StudentPaymentClaimModal/);
  });

  it('release-hold only cancels the caller\'s own unpaid pending hold, and a payment confirmed meanwhile wins', () => {
    const api = read('api/index.ts');
    const i = api.indexOf("app.post('/api/student/bookings/:id/release-hold'");
    assert.ok(i > 0);
    const route = api.slice(i, i + 2000);
    assert.match(route, /verifyStudentAuth/);
    assert.match(route, /resolveStudentBooking/);
    assert.match(route, /booking\.status !== 'pending' \|\| booking\.payment_plan !== 'pay_now' \|\| booking\.package_entitlement_id/);
    assert.match(route, /\.eq\('status', 'pending'\)/);
    // The student list carries the hold end for pending lessons only.
    assert.match(api, /holdExpiresAt: b\.status === 'pending' \? b\.hold_expires_at \|\| null : null/);
  });
});
