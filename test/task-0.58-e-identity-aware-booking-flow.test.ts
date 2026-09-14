import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.58-E — Authenticated Student Identity & Repeat Booking Flow Verification', () => {
  const stepStudentDetailsPath = path.join(process.cwd(), 'src', 'components', 'booking', 'StepStudentDetails.tsx');
  const bookingFlowPath = path.join(process.cwd(), 'src', 'components', 'booking', 'BookingFlow.tsx');
  const studentBookingPagePath = path.join(process.cwd(), 'src', 'student', 'pages', 'StudentBookingPage.tsx');

  const stepStudentDetailsSource = fs.readFileSync(stepStudentDetailsPath, 'utf8');
  const bookingFlowSource = fs.readFileSync(bookingFlowPath, 'utf8');
  const studentBookingPageSource = fs.readFileSync(studentBookingPagePath, 'utf8');

  describe('1. StepStudentDetails — Identity-Aware Rendering', () => {
    it('declares and accepts authenticated student identity props', () => {
      assert.ok(stepStudentDetailsSource.includes('isAuthenticatedStudent?: boolean'), 'Should accept isAuthenticatedStudent prop');
      assert.ok(stepStudentDetailsSource.includes('bookingPreference?: \'self\' | \'child\''), 'Should accept bookingPreference prop');
      assert.ok(stepStudentDetailsSource.includes('canBookForChild?: boolean'), 'Should accept canBookForChild prop');
      assert.ok(stepStudentDetailsSource.includes('studentName?: string'), 'Should accept studentName prop');
      assert.ok(stepStudentDetailsSource.includes('studentEmail?: string'), 'Should accept studentEmail prop');
    });

    it('suppresses generic audience toggle for authenticated adult students', () => {
      // It should condition audience presentation on isAuthenticatedStudent
      assert.ok(
        stepStudentDetailsSource.includes('isAuthenticatedStudent ? ('),
        'Audience cards must be conditioned on isAuthenticatedStudent'
      );
    });

    it('displays verified student identity context card for authenticated self-learners', () => {
      assert.ok(
        stepStudentDetailsSource.includes('id="student-identity-context"'),
        'Should render student-identity-context card'
      );
      assert.ok(
        stepStudentDetailsSource.includes('Authenticated Student Account · Self-Learning'),
        'Should state authenticated self-learning account'
      );
    });

    it('displays authorized guardian contexts (single-child preselected vs multi-child selectable)', () => {
      assert.ok(
        stepStudentDetailsSource.includes('id="child-preselected-context"'),
        'Should render child preselected context card'
      );
      assert.ok(
        stepStudentDetailsSource.includes('id="multi-child-selection-context"'),
        'Should render multi child selection context card'
      );
      assert.ok(
        stepStudentDetailsSource.includes('id="guardian-self-context"'),
        'Should render guardian self-booking context card'
      );
    });

    it('requires studentId selection when multiple linked children exist', () => {
      assert.ok(
        stepStudentDetailsSource.includes('(linkedChildren.length === 0 || !!formData.studentId)'),
        'Validation must enforce studentId when linked children exist'
      );
    });
  });

  describe('2. BookingFlow — Initial State Resolution for Authenticated Students', () => {
    it('accepts and passes identity props to StepStudentDetails', () => {
      assert.ok(bookingFlowSource.includes('isAuthenticatedStudent?: boolean'), 'BookingFlow accepts isAuthenticatedStudent');
      assert.ok(bookingFlowSource.includes('bookingPreference?: \'self\' | \'child\''), 'BookingFlow accepts bookingPreference');
      assert.ok(bookingFlowSource.includes('canBookForChild?: boolean'), 'BookingFlow accepts canBookForChild');
      assert.ok(bookingFlowSource.includes('studentName?: string'), 'BookingFlow accepts studentName');
      assert.ok(bookingFlowSource.includes('studentEmail?: string'), 'BookingFlow accepts studentEmail');
    });

    it('resolves audience and initial child studentId accurately on initialization', () => {
      assert.ok(bookingFlowSource.includes('const resolvedAudience: LearnerAudience ='), 'Resolves initial learner audience');
      assert.ok(bookingFlowSource.includes('resolvedStudentId = initialData?.studentId'), 'Resolves initial student ID for single linked child');
    });
  });

  describe('3. StudentBookingPage — Entry Points & Repeat Booking Separation', () => {
    it('separates Case B repeat choice entry card from the detailed form', () => {
      assert.ok(
        studentBookingPageSource.includes('id="repeat-last-booking-card"'),
        'Should render repeat last booking card'
      );
      assert.ok(
        studentBookingPageSource.includes('id="btn-reuse-last-booking"'),
        'Should have button to reuse last booking details'
      );
      assert.ok(
        studentBookingPageSource.includes('id="btn-dismiss-reuse-booking"'),
        'Should have button to start fresh with a new booking'
      );
    });

    it('passes student profile identity props to BookingFlow', () => {
      assert.ok(
        studentBookingPageSource.includes('isAuthenticatedStudent={true}'),
        'Passes isAuthenticatedStudent={true}'
      );
      assert.ok(
        studentBookingPageSource.includes('bookingPreference={profile?.bookingPreference || \'self\'}'),
        'Passes bookingPreference'
      );
      assert.ok(
        studentBookingPageSource.includes('studentName={profile?.name}'),
        'Passes studentName'
      );
      assert.ok(
        studentBookingPageSource.includes('studentEmail={profile?.email}'),
        'Passes studentEmail'
      );
    });
  });
});
