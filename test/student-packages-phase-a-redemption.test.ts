import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Student Packages Phase A: UX & Real Credit Redemption Integration Suite', async (t) => {
  await t.test('1. bookingRepository: passes package_entitlement_id into create_booking_atomic RPC', () => {
    const repoCode = fs.readFileSync('src/lib/bookingRepository.ts', 'utf8');

    assert(
      repoCode.includes('package_entitlement_id: data.packageEntitlementId || null'),
      'bookingRepository must pass package_entitlement_id (or null) to create_booking_atomic'
    );
    assert(
      !repoCode.includes('package_credit_ledger'),
      'bookingRepository must NEVER perform browser-side client deductions to package_credit_ledger'
    );
  });

  await t.test('2. StepLessonType: renders credit redemption option when active entitlements exist', () => {
    const lessonTypeCode = fs.readFileSync('src/components/booking/StepLessonType.tsx', 'utf8');

    assert(
      lessonTypeCode.includes('activeEntitlements'),
      'StepLessonType must accept activeEntitlements prop'
    );
    assert(
      lessonTypeCode.includes('onSelectPackageEntitlement'),
      'StepLessonType must support selecting package entitlement'
    );
    assert(
      lessonTypeCode.includes('remaining_credits > 0') || lessonTypeCode.includes('remainingCredits > 0') || lessonTypeCode.includes('e.remaining_credits'),
      'StepLessonType must filter for entitlements with remaining credits > 0'
    );
  });

  await t.test('3. StepReviewSummary: sets fee to 0 and displays prepaid package badge when entitlement is chosen', () => {
    const reviewCode = fs.readFileSync('src/components/booking/StepReviewSummary.tsx', 'utf8');

    assert(
      reviewCode.includes('const isPackageCredit = Boolean(formData.packageEntitlementId);'),
      'StepReviewSummary must identify package credit mode'
    );
    assert(
      reviewCode.includes('const fee = isTrial || isPackageCredit ? 0 :'),
      'StepReviewSummary must calculate fee as $0 for package bookings'
    );
    assert(
      reviewCode.includes('Covered by Package') || reviewCode.includes('Prepaid package credit'),
      'StepReviewSummary must provide clear copy indicating coverage by package'
    );
    assert(
      reviewCode.includes('Confirm with Package Credit'),
      'StepReviewSummary button text must reflect package confirmation'
    );
  });

  await t.test('4. BookingConfirmation: shows package credit banner and avoids duplicate payment instructions', () => {
    const confCode = fs.readFileSync('src/components/booking/BookingConfirmation.tsx', 'utf8');

    assert(
      confCode.includes('!confirmation.isFreeTrial && !confirmation.packageEntitlementId'),
      'BookingConfirmation must only show payment instructions for unpaid standalone lessons'
    );
    assert(
      confCode.includes('confirmation.packageEntitlementId') && confCode.includes('Prepaid Lesson Package'),
      'BookingConfirmation must display prepaid package credit confirmation badge'
    );
  });

  await t.test('5. StudentPackagesPage: deep-links directly to booking flow with entitlementId', () => {
    const pkgPageCode = fs.readFileSync('src/student/pages/StudentPackagesPage.tsx', 'utf8');

    assert(
      pkgPageCode.includes('to={`/student/book?entitlementId=${item.id}`}') ||
      pkgPageCode.includes('/student/book?entitlementId='),
      'StudentPackagesPage must link active entitlements to /student/book?entitlementId=...'
    );
  });

  await t.test('6. StudentBookingPage: fetches student packages and supports entitlement pre-selection', () => {
    const bookingPageCode = fs.readFileSync('src/student/pages/StudentBookingPage.tsx', 'utf8');

    assert(
      bookingPageCode.includes('/api/student/packages'),
      'StudentBookingPage must fetch /api/student/packages'
    );
    assert(
      bookingPageCode.includes('requestedEntitlementId') && bookingPageCode.includes('packageEntitlementId'),
      'StudentBookingPage must propagate requestedEntitlementId to initial booking form data'
    );
    assert(
      bookingPageCode.includes('activeEntitlements={packagesData?.entitlements || []}'),
      'StudentBookingPage must pass active entitlements to BookingFlow component'
    );
  });
});
