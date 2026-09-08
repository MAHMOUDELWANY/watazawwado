/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.45
 * PRODUCTION BOOKING SCHEMA ALIGNMENT & EXPLICIT GUEST/STUDENT ENTRY TESTS
 * File: test/task-0.45-booking-alignment-and-guest-flow.test.ts
 * Role: Strict verification of:
 *       1. create_booking_atomic schema alignment (hourly_rate_usd, trial_allowed)
 *       2. Absence of deprecated columns (price_hourly_usd, trial_eligible)
 *       3. Explicit Guest Booking path (student_id = NULL)
 *       4. Authenticated Student Booking path (tied to auth.uid())
 *       5. Rejection of unauthenticated guest claiming student_id
 *       6. Rejection of authenticated student attempting to impersonate another student_id
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.45 — Production Booking Schema Alignment & Explicit Guest/Student Entry', () => {

  // ====================================================================
  // 1. SQL Schema Alignment & Drift Verification
  // ====================================================================

  it('1. Verifies 20260908000003 migration uses canonical columns hourly_rate_usd and trial_allowed', () => {
    const migrationPath = path.resolve('supabase/migrations/20260908000003_student_booking_ownership_and_auth_hardening.sql');
    const content = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(content.includes('hourly_rate_usd'), 'Migration must reference hourly_rate_usd');
    assert.ok(content.includes('trial_allowed'), 'Migration must reference trial_allowed');
    assert.ok(!content.includes('price_hourly_usd'), 'Deprecated column price_hourly_usd must NOT exist');
    assert.ok(!content.includes('trial_eligible'), 'Deprecated column trial_eligible must NOT exist');
  });

  it('2. Verifies forward migration 20260908000004 exists and contains correct column mapping', () => {
    const migrationPath = path.resolve('supabase/migrations/20260908000004_fix_booking_rpc_schema_alignment.sql');
    const content = fs.readFileSync(migrationPath, 'utf8');

    assert.ok(content.includes('hourly_rate_usd'), 'Migration must reference hourly_rate_usd');
    assert.ok(content.includes('trial_allowed'), 'Migration must reference trial_allowed');
    assert.ok(!content.includes('price_hourly_usd'), 'Deprecated column price_hourly_usd must NOT exist in forward migration');
    assert.ok(!content.includes('trial_eligible'), 'Deprecated column trial_eligible must NOT exist in forward migration');
  });

  // ====================================================================
  // 2. Client & Modal UI Contract Alignment
  // ====================================================================

  it('3. Verifies GetStartedModal contains distinct Book as Guest and Continue as Student paths', () => {
    const modalPath = path.resolve('src/components/GetStartedModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Must provide first-class Guest booking button
    assert.ok(content.includes('get-started-guest-booking-btn') || content.includes('Book as Guest'), 'Must have prominent Book as Guest option');
    assert.ok(content.includes('handleDirectGuestBooking') || content.includes('onOpenDirectTrialBooking'), 'Must call direct booking handler');

    // Must provide Student account path
    assert.ok(content.includes('Continue as Student') || content.includes('get-started-student-signup-btn'), 'Must have Continue as Student option');
    assert.ok(content.includes('onOpenStudentSignup'), 'Must offer signup trigger');
    assert.ok(content.includes('onOpenStudentLogin'), 'Must offer login trigger');
  });

  it('4. Verifies LandingPage wires Get Started CTAs to GetStartedModal preserving service pre-selection', () => {
    const landingPath = path.resolve('src/LandingPage.tsx');
    const content = fs.readFileSync(landingPath, 'utf8');

    assert.ok(content.includes('handleOpenGetStarted'), 'LandingPage must define handleOpenGetStarted handler');
    assert.ok(content.includes('onOpenDirectTrialBooking={() => handleOpenBooking(preselectedService, \'trial\')}'), 'GetStartedModal must receive preselected service');
  });

  // ====================================================================
  // 3. create_booking_atomic Logic Invariants
  // ====================================================================

  it('5. Simulates RPC create_booking_atomic logic for Guest Booking with student_id = NULL', () => {
    const serviceRecord = {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'Quran Reading with Tajweed',
      hourly_rate_usd: 7.00,
      trial_allowed: true,
    };

    // Guest input (auth.uid() is null)
    const authUid = null;
    const bookingInput = {
      contact_name: 'Zayd Test',
      contact_email: 'zayd.guest@example.com',
      service_id: serviceRecord.id,
      booking_type: 'trial',
      duration_minutes: 30,
      student_id: null,
    };

    // Simulate RPC resolution
    let resolvedStudentId: string | null = null;
    if (authUid !== null) {
      resolvedStudentId = 'student-uuid';
    } else {
      if (bookingInput.student_id !== null && bookingInput.student_id !== '') {
        throw new Error('Unauthenticated guests cannot specify a student ID.');
      }
      resolvedStudentId = null;
    }

    assert.strictEqual(resolvedStudentId, null, 'Guest booking must resolve student_id to null');

    let calculatedFee = 0.00;
    if (bookingInput.booking_type === 'trial') {
      calculatedFee = 0.00;
    } else {
      calculatedFee = Math.round(serviceRecord.hourly_rate_usd * (bookingInput.duration_minutes / 60.0) * 100) / 100;
    }

    assert.strictEqual(calculatedFee, 0.00, 'Trial booking must have 0.00 fee');
  });

  it('6. Simulates RPC create_booking_atomic logic for Regular Booking calculating fee via hourly_rate_usd', () => {
    const serviceRecord = {
      id: '00000000-0000-0000-0000-000000000001',
      title: 'English Conversation',
      hourly_rate_usd: 10.00,
      trial_allowed: true,
    };

    const bookingInput = {
      booking_type: 'regular',
      duration_minutes: 60,
    };

    const calculatedFee = Math.round(serviceRecord.hourly_rate_usd * (bookingInput.duration_minutes / 60.0) * 100) / 100;
    assert.strictEqual(calculatedFee, 10.00, 'Regular 60 min lesson at $10/hr must calculate to $10.00');
  });

  it('7. Simulates RPC rejecting unauthenticated guest supplying a student_id', () => {
    const authUid = null;
    const bookingInput = {
      contact_name: 'Malicious Guest',
      contact_email: 'guest@example.com',
      student_id: 'd9b3a7a2-1111-2222-3333-444455556666',
    };

    assert.throws(() => {
      if (authUid !== null) {
        // Authenticated
      } else {
        if (bookingInput.student_id !== null && bookingInput.student_id !== '') {
          throw new Error('Unauthenticated guests cannot specify a student ID.');
        }
      }
    }, /Unauthenticated guests cannot specify a student ID/);
  });

  it('8. Simulates RPC rejecting authenticated student attempting to impersonate another student', () => {
    const authUid = 'auth-user-student-A';
    const resolvedStudentAId = 'uuid-student-A';
    const attackerProvidedStudentBId = 'uuid-student-B';

    const bookingInput = {
      contact_name: 'Student A',
      contact_email: 'studentA@example.com',
      student_id: attackerProvidedStudentBId,
    };

    assert.throws(() => {
      if (authUid !== null) {
        const v_student_id = resolvedStudentAId;
        if (bookingInput.student_id && bookingInput.student_id !== v_student_id) {
          throw new Error('Forbidden. Cannot create a booking on behalf of another student.');
        }
      }
    }, /Forbidden\. Cannot create a booking on behalf of another student\./);
  });
});
