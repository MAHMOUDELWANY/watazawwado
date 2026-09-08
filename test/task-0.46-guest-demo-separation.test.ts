/**
 * ====================================================================
 * MAHMOUD TEACHING PLATFORM — TASK 0.46
 * GUEST DEMO VS REAL BOOKING SEPARATION TESTS
 * File: test/task-0.46-guest-demo-separation.test.ts
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.46 — Guest Demo Separation & Real Booking Protection', () => {

  it('1. Verifies Get Started Modal clearly separates Demo and Student Account paths', () => {
    const modalPath = path.resolve('src/components/GetStartedModal.tsx');
    const content = fs.readFileSync(modalPath, 'utf8');

    // Guest Option -> Try the Demo
    assert.ok(content.includes('Explore as Guest') || content.includes('استكشف كضيف'), 'Must have Explore as Guest option');
    assert.ok(content.includes('Try the Demo') || content.includes('جرب العرض التوضيحي'), 'Must prominently offer Demo');
    assert.ok(content.includes('handleLaunchDemo'), 'Guest button must trigger demo launch');
    
    // No direct Trial Booking in Guest flow
    assert.ok(!content.includes('handleDirectGuestBooking}'), 'Must not bind real booking handler directly to Guest CTA in the modal');
    assert.ok(!content.includes('Book as Guest'), 'Must avoid wording "Book as Guest" for the public CTA since it is a demo');
  });

  it('2. Verifies Student Demo Page provides conversion-focused demo completion state', () => {
    const demoPath = path.resolve('src/student/pages/StudentDemoPage.tsx');
    const content = fs.readFileSync(demoPath, 'utf8');

    // Ensure real booking wording is removed
    assert.ok(!content.includes('MHM-DEMO-789'), 'Fake booking reference must be removed');
    assert.ok(!content.includes('Demo Booking Completed!'), 'Misleading real-booking language must be removed');
    assert.ok(!content.includes('your time slot is reserved instantly'), 'Must not claim the slot is reserved in demo completion');

    // Ensure new conversion state is present
    assert.ok(content.includes('You\'ve Seen How Simple It Is'), 'Must have new demo completion heading');
    assert.ok(content.includes('Create Free Account'), 'Must have strong CTA to create real account');
    assert.ok(content.includes('Return to Homepage'), 'Must provide secondary return action');
  });

  it('3. Verifies Demo Page does not call real booking mutation APIs', () => {
    const demoPath = path.resolve('src/student/pages/StudentDemoPage.tsx');
    const content = fs.readFileSync(demoPath, 'utf8');

    assert.ok(!content.includes('bookingService.submitBooking'), 'Demo must not submit real bookings');
    assert.ok(!content.includes('create_booking_atomic'), 'Demo must not call booking RPC');
  });

  it('4. Real Booking via TrialBookingModal is preserved', () => {
    const landingPath = path.resolve('src/LandingPage.tsx');
    const content = fs.readFileSync(landingPath, 'utf8');

    // Landing page should still be capable of rendering TrialBookingModal 
    assert.ok(content.includes('TrialBookingModal'), 'LandingPage must retain real booking capabilities for authenticated users');
  });
});
