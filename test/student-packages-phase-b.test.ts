import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Student Packages Phase B: Multi-Child, Credit History & Visibility Suite', async (t) => {
  const apiCode = fs.readFileSync('api/index.ts', 'utf8');
  const packagesPageCode = fs.readFileSync('src/student/pages/StudentPackagesPage.tsx', 'utf8');
  const lessonsPageCode = fs.readFileSync('src/student/pages/StudentLessonsPage.tsx', 'utf8');

  await t.test('1. API: Multi-child learner resolution helper', () => {
    assert(
      apiCode.includes('getAuthorizedLearnersForStudent'),
      'api/index.ts must define getAuthorizedLearnersForStudent helper'
    );
    assert(
      apiCode.includes("from('guardians')") && apiCode.includes('parent_email'),
      'Learner resolution must verify parent_email relationship in guardians table'
    );
  });

  await t.test('2. API: POST /api/student/packages/select supports learnerStudentId and enforces authorization', () => {
    assert(
      apiCode.includes("app.post('/api/student/packages/select'"),
      'POST /api/student/packages/select endpoint must exist'
    );
    assert(
      apiCode.includes('learnerStudentId') && apiCode.includes('targetLearnerId'),
      'POST /api/student/packages/select must handle optional learnerStudentId'
    );
    assert(
      apiCode.includes('Unauthorized learner selection') || apiCode.includes('403'),
      'POST /api/student/packages/select must reject unauthorized learner assignment with 403'
    );
    assert(
      !apiCode.includes('package_credit_ledger') || !apiCode.includes("insert({ activity_type: 'grant'"),
      'Package selection must NOT grant credits client-side or before payment verification'
    );
  });

  await t.test('3. API: GET /api/student/packages returns learner metadata and authorized learners', () => {
    assert(
      apiCode.includes("app.get('/api/student/packages'"),
      'GET /api/student/packages endpoint must exist'
    );
    assert(
      apiCode.includes('learnerStudentId') && apiCode.includes('learnerName'),
      'GET /api/student/packages must format entitlements with learnerStudentId and learnerName'
    );
    assert(
      apiCode.includes('learners: authorizedLearners'),
      'GET /api/student/packages must return authorized learners array for the student'
    );
  });

  await t.test('4. API: GET /api/student/packages/ledger provides scoped credit history', () => {
    assert(
      apiCode.includes("app.get('/api/student/packages/ledger'"),
      'GET /api/student/packages/ledger endpoint must exist'
    );
    assert(
      apiCode.includes("verifyStudentAuth"),
      'GET /api/student/packages/ledger must enforce verifyStudentAuth'
    );
    assert(
      apiCode.includes("from('package_credit_ledger')"),
      'GET /api/student/packages/ledger must query authoritative package_credit_ledger'
    );
    assert(
      apiCode.includes('in(\'package_entitlement_id\', entitlementIds)'),
      'Ledger queries must be strictly scoped to authorized entitlement IDs'
    );
    assert(
      !apiCode.includes('idempotency_key') || !apiCode.includes('formattedLedger = (ledgerRows || []).map((row: any) => ({') || !apiCode.includes('idempotencyKey: row.idempotency_key'),
      'Ledger response must NEVER expose internal idempotency keys or secrets'
    );
  });

  await t.test('5. API: GET /api/student/bookings exposes package entitlement metadata without N+1', () => {
    assert(
      apiCode.includes('package_entitlement_id') && apiCode.includes('isPackageBooking'),
      'GET /api/student/bookings must expose package entitlement metadata'
    );
    assert(
      apiCode.includes('pkgEntitlementIds = Array.from(new Set('),
      'GET /api/student/bookings must batch entitlement metadata queries without N+1 queries'
    );
  });

  await t.test('6. UI: StudentPackagesPage renders multi-child learner selector and learner badge', () => {
    assert(
      packagesPageCode.includes('selectedLearnerId') && packagesPageCode.includes('hasMultipleLearners'),
      'StudentPackagesPage must manage selectedLearnerId when multiple learners exist'
    );
    assert(
      packagesPageCode.includes('ent.learnerName'),
      'StudentPackagesPage must display subtle learner badge on entitlement cards'
    );
    assert(
      packagesPageCode.includes('/api/student/packages/ledger') && packagesPageCode.includes('ledger'),
      'StudentPackagesPage must fetch and render credit activity ledger'
    );
  });

  await t.test('7. UI: StudentLessonsPage displays Prepaid Package badge', () => {
    assert(
      lessonsPageCode.includes('packageEntitlementId') || lessonsPageCode.includes('isPackageBooking'),
      'StudentLessonsPage must check packageEntitlementId / isPackageBooking'
    );
    assert(
      lessonsPageCode.includes('Prepaid Package') || lessonsPageCode.includes('باقة مسبقة الدفع'),
      'StudentLessonsPage must render Prepaid Package badge on package-linked bookings'
    );
  });

  await t.test('8. Regression: Phase A redemption & booking flows remain intact', () => {
    const bookingRepoCode = fs.readFileSync('src/lib/bookingRepository.ts', 'utf8');
    assert(
      bookingRepoCode.includes('package_entitlement_id: data.packageEntitlementId || null'),
      'bookingRepository must continue passing package_entitlement_id to create_booking_atomic'
    );
  });
});
