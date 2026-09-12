import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Task 0.58 — Authenticated Student Booking Workflow & UI Integration', () => {
  const rootDir = process.cwd();

  describe('1. Student Dashboard Navigation & Book a Lesson Routing', () => {
    it('verifies StudentApp defines /student/book route and includes Book a Lesson in navigation', () => {
      const studentAppFile = fs.readFileSync(path.join(rootDir, 'src/student/StudentApp.tsx'), 'utf-8');

      assert.ok(
        studentAppFile.includes("path=\"/book\" element={<StudentBookingPage profile={profile} />}"),
        'StudentApp must route /book to StudentBookingPage'
      );
      assert.ok(
        studentAppFile.includes("name: 'Book a Lesson', path: '/student/book'"),
        'StudentApp navigation must include Book a Lesson linked to /student/book'
      );
    });

    it('verifies StudentHomePage links directly to /student/book instead of public /#book', () => {
      const homePageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentHomePage.tsx'), 'utf-8');

      assert.ok(
        !homePageFile.includes('href="/#book"'),
        'StudentHomePage must never navigate student to public landing page anchor /#book'
      );
      assert.ok(
        homePageFile.includes('to="/student/book"'),
        'StudentHomePage must link to /student/book for booking actions'
      );
    });
  });

  describe('2. StudentBookingPage Implementation & Profile Pre-filling', () => {
    it('verifies StudentBookingPage embeds BookingFlow within student portal context', () => {
      const bookingPageFile = fs.readFileSync(path.join(rootDir, 'src/student/pages/StudentBookingPage.tsx'), 'utf-8');

      assert.ok(
        bookingPageFile.includes('<BookingFlow'),
        'StudentBookingPage must embed BookingFlow'
      );
      assert.ok(
        bookingPageFile.includes('initialData={initialData}'),
        'StudentBookingPage must pass prefilled initialData to BookingFlow'
      );
      assert.ok(
        bookingPageFile.includes('trialDisabled={!canBookTrial}'),
        'StudentBookingPage must manage trialDisabled state based on existing bookings'
      );
      assert.ok(
        bookingPageFile.includes('doneLabel="Done & Return to Student Portal"'),
        'StudentBookingPage must set appropriate return-to-portal label'
      );
    });
  });

  describe('3. BookingFlow & StepLessonType Trial-Guarding and Custom Done Action', () => {
    it('verifies BookingFlow supports trialDisabled, custom doneLabel, and prefilled initialData', () => {
      const flowFile = fs.readFileSync(path.join(rootDir, 'src/components/booking/BookingFlow.tsx'), 'utf-8');

      assert.ok(
        flowFile.includes('trialDisabled?: boolean;'),
        'BookingFlowProps must declare trialDisabled'
      );
      assert.ok(
        flowFile.includes('initialData?: Partial<BookingFormData>;'),
        'BookingFlowProps must declare initialData'
      );
      assert.ok(
        flowFile.includes('doneLabel?: string;'),
        'BookingFlowProps must declare doneLabel'
      );
      assert.ok(
        flowFile.includes('onDone?: () => void;'),
        'BookingFlowProps must declare onDone callback'
      );
    });

    it('verifies StepLessonType handles disabled free trial state cleanly', () => {
      const stepLessonFile = fs.readFileSync(path.join(rootDir, 'src/components/booking/StepLessonType.tsx'), 'utf-8');

      assert.ok(
        stepLessonFile.includes('trialDisabled?: boolean;'),
        'StepLessonTypeProps must declare trialDisabled'
      );
      assert.ok(
        stepLessonFile.includes("if (trialDisabled) return;"),
        'StepLessonType must prevent selecting trial when trialDisabled is true'
      );
      assert.ok(
        stepLessonFile.includes("Already Claimed") || stepLessonFile.includes("مستخدمة مسبقاً"),
        'StepLessonType must indicate trial has already been claimed'
      );
    });
  });

  describe('4. Zoom Pending State Protection', () => {
    it('verifies BookingConfirmation safely handles pending Zoom links without redirecting to homepage', () => {
      const confirmationFile = fs.readFileSync(path.join(rootDir, 'src/components/booking/BookingConfirmation.tsx'), 'utf-8');

      assert.ok(
        confirmationFile.includes('isValidZoomUrl'),
        'BookingConfirmation must check for valid http/https Zoom URL'
      );
      assert.ok(
        confirmationFile.includes('Link Pending') || confirmationFile.includes('قيد التجهيز'),
        'BookingConfirmation must display Link Pending badge when URL is not yet ready'
      );
      assert.ok(
        !confirmationFile.includes('href="/"') || !confirmationFile.includes('Join Classroom'),
        'BookingConfirmation must never link Join Classroom to root homepage'
      );
    });
  });
});
