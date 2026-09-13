import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  findLastEligibleBooking,
  formatLastBookingSummary,
  mapLastBookingToBookingFormData,
  calculateTrialEligibility
} from '../src/student/pages/StudentBookingPage.js';

describe('Task 0.58 — Repeat Last Booking Workflow Tests', () => {
  const sampleProfile = {
    id: 'student-uuid-123',
    name: 'Tariq Al-Mansoor',
    email: 'tariq@example.com',
    whatsapp: '+15551234567',
    currentLevel: 'intermediate',
    bookingPreference: 'self',
    timezone: 'America/New_York',
    learningNeeds: 'Tajweed rules and Madd'
  };

  const sampleChildProfile = {
    id: 'guardian-uuid-456',
    name: 'Fatima Al-Mansoor',
    email: 'fatima@example.com',
    whatsapp: '+15559876543',
    currentLevel: 'beginner',
    bookingPreference: 'child',
    timezone: 'America/Toronto',
    learningNeeds: 'Quran recitation for 9yo daughter',
    guardian: {
      parentName: 'Fatima Al-Mansoor',
      parentEmail: 'fatima@example.com',
      parentWhatsapp: '+15559876543'
    },
    linkedChildren: [
      {
        id: 'child-1',
        name: 'Amina Al-Mansoor',
        currentLevel: 'beginner'
      }
    ]
  };

  describe('1. findLastEligibleBooking', () => {
    it('returns null when bookings array is empty, null, or undefined', () => {
      assert.strictEqual(findLastEligibleBooking([]), null);
      assert.strictEqual(findLastEligibleBooking(null), null);
      assert.strictEqual(findLastEligibleBooking(undefined as any), null);
    });

    it('ignores cancelled or failed bookings', () => {
      const bookings = [
        {
          id: 'b-cancelled',
          serviceId: 'quran-reading',
          durationMinutes: 45,
          status: 'cancelled',
          scheduledStart: '2026-09-10T14:00:00Z'
        },
        {
          id: 'b-failed',
          serviceId: 'tajweed',
          durationMinutes: 60,
          status: 'failed',
          scheduledStart: '2026-09-12T14:00:00Z'
        }
      ];

      assert.strictEqual(findLastEligibleBooking(bookings), null);
    });

    it('rejects bookings with invalid services not recognized by the system', () => {
      const bookings = [
        {
          id: 'b-invalid-service',
          serviceId: 'unrecognized-astronomy-class',
          durationMinutes: 45,
          status: 'confirmed',
          scheduledStart: '2026-09-10T14:00:00Z'
        }
      ];

      assert.strictEqual(findLastEligibleBooking(bookings), null);
    });

    it('rejects bookings with unsupported duration values', () => {
      const bookings = [
        {
          id: 'b-invalid-duration',
          serviceId: 'quran-reading',
          durationMinutes: 999, // unsupported
          status: 'confirmed',
          scheduledStart: '2026-09-10T14:00:00Z'
        }
      ];

      assert.strictEqual(findLastEligibleBooking(bookings), null);
    });

    it('selects the most recent eligible completed booking among multiple bookings, ignoring future/confirmed', () => {
      const bookings = [
        {
          id: 'b-older',
          serviceId: 'quran-reading',
          durationMinutes: 45,
          status: 'completed',
          scheduledStart: '2026-09-01T10:00:00Z'
        },
        {
          id: 'b-newest',
          serviceId: 'tajweed',
          durationMinutes: 60,
          status: 'confirmed',
          scheduledStart: '2026-09-10T15:00:00Z' // Ignored because it's confirmed, not completed
        },
        {
          id: 'b-middle',
          serviceId: 'quran-memorization',
          durationMinutes: 30,
          status: 'completed',
          scheduledStart: '2026-09-05T12:00:00Z'
        }
      ];

      const chosen = findLastEligibleBooking(bookings);
      assert.ok(chosen);
      assert.strictEqual(chosen.id, 'b-middle');
      assert.strictEqual(chosen.serviceId, 'quran-memorization');
      assert.strictEqual(chosen.durationMinutes, 30);
    });

    it('supports snake_case column names from direct database queries', () => {
      const bookings = [
        {
          id: 'b-snake',
          service_id: 'arabic-conversation',
          duration_minutes: 45,
          status: 'completed',
          scheduled_start: '2026-09-01T16:00:00Z',
          contact_name: 'Zaid',
          contact_email: 'zaid@example.com'
        }
      ];

      const chosen = findLastEligibleBooking(bookings);
      assert.ok(chosen);
      assert.strictEqual(chosen.id, 'b-snake');
      assert.strictEqual(chosen.service_id, 'arabic-conversation');
      assert.strictEqual(chosen.duration_minutes, 45);
    });

    it('fails closed safely on malformed booking objects', () => {
      const malformed = [null, undefined, 123, 'not an object', {}];
      assert.strictEqual(findLastEligibleBooking(malformed as any), null);
    });
  });

  describe('2. formatLastBookingSummary', () => {
    it('formats [service] · [level] · [duration] correctly', () => {
      const booking = {
        serviceId: 'quran-reading',
        durationMinutes: 45,
        currentLevel: 'beginner'
      };

      const result = formatLastBookingSummary(booking, sampleProfile);
      assert.strictEqual(result.serviceTitle, 'Quran Reading (Noorani Qaidah & Fluency)');
      assert.strictEqual(result.levelText, 'Beginner');
      assert.strictEqual(result.durationText, '45 mins');
      assert.strictEqual(result.summaryText, 'Quran Reading (Noorani Qaidah & Fluency) · Beginner · 45 mins');
    });

    it('handles missing level gracefully', () => {
      const booking = {
        serviceId: 'tajweed',
        durationMinutes: 60
      };

      const result = formatLastBookingSummary(booking, { ...sampleProfile, currentLevel: undefined });
      assert.strictEqual(result.serviceTitle, 'Tajweed Rules & Applied Articulation');
      assert.strictEqual(result.levelText, undefined);
      assert.strictEqual(result.durationText, '60 mins');
      assert.strictEqual(result.summaryText, 'Tajweed Rules & Applied Articulation · 60 mins');
    });

    it('capitalizes level names cleanly', () => {
      const booking = {
        service_id: 'quran-memorization',
        duration_minutes: 30,
        current_level: 'intermediate'
      };

      const result = formatLastBookingSummary(booking);
      assert.strictEqual(result.serviceTitle, 'Quran Memorization (Hifz)');
      assert.strictEqual(result.levelText, 'Intermediate');
      assert.strictEqual(result.summaryText, 'Quran Memorization (Hifz) · Intermediate · 30 mins');
    });

    it('falls back to safe default if booking is null', () => {
      const result = formatLastBookingSummary(null);
      assert.strictEqual(result.summaryText, 'Lesson · 45 mins');
    });
  });

  describe('3. mapLastBookingToBookingFormData', () => {
    it('pre-populates booking form for adult learner and sets initialStep to 5', () => {
      const lastBooking = {
        id: 'b-adult-1',
        serviceId: 'tajweed',
        durationMinutes: 45,
        bookingType: 'regular',
        contactName: 'Tariq Al-Mansoor',
        contactEmail: 'tariq@example.com',
        contactWhatsapp: '+15551234567',
        notes: 'Review Surah Al-Baqarah Tajweed',
        goal: 'Recite with confident Tajweed',
        studentTimezone: 'America/New_York'
      };

      const { initialData, matchedServiceId, initialMode, initialStep } = mapLastBookingToBookingFormData(
        lastBooking,
        sampleProfile,
        false // trial not allowed
      );

      assert.strictEqual(initialStep, 5, 'Must jump directly to Step 5 (Schedule/Date & Time)');
      assert.strictEqual(matchedServiceId, 'tajweed');
      assert.strictEqual(initialMode, 'regular');
      assert.strictEqual(initialData.serviceId, 'tajweed');
      assert.strictEqual(initialData.duration, 45);
      assert.strictEqual(initialData.audience, 'adult');
      assert.strictEqual(initialData.studentName, 'Tariq Al-Mansoor');
      assert.strictEqual(initialData.email, 'tariq@example.com');
      assert.strictEqual(initialData.whatsapp, '+15551234567');
      assert.strictEqual(initialData.notes, 'Review Surah Al-Baqarah Tajweed');
      assert.strictEqual(initialData.goal, 'Recite with confident Tajweed');
      assert.strictEqual(initialData.timezone, 'America/New_York');
      assert.strictEqual(initialData.date, '', 'Date must be unselected for new lesson');
      assert.strictEqual(initialData.timeSlot, null, 'Time slot must be unselected for new lesson');
    });

    it('pre-populates booking form for child learner with parent/guardian information', () => {
      const lastBooking = {
        id: 'b-child-1',
        serviceId: 'quran-reading',
        durationMinutes: 30,
        bookingType: 'regular',
        contactName: 'Amina Al-Mansoor',
        parentName: 'Fatima Al-Mansoor',
        contactEmail: 'fatima@example.com',
        contactWhatsapp: '+15559876543',
        notes: 'Help with Noon Sakinah',
        studentTimezone: 'America/Toronto'
      };

      const { initialData, matchedServiceId, initialMode, initialStep } = mapLastBookingToBookingFormData(
        lastBooking,
        sampleChildProfile,
        false
      );

      assert.strictEqual(initialStep, 5);
      assert.strictEqual(matchedServiceId, 'quran-reading');
      assert.strictEqual(initialMode, 'regular');
      assert.strictEqual(initialData.audience, 'child');
      assert.strictEqual(initialData.childName, 'Amina Al-Mansoor');
      assert.strictEqual(initialData.parentName, 'Fatima Al-Mansoor');
      assert.strictEqual(initialData.parentEmail, 'fatima@example.com');
      assert.strictEqual(initialData.parentWhatsapp, '+15559876543');
      assert.strictEqual(initialData.parentNotes, 'Help with Noon Sakinah');
      assert.strictEqual(initialData.timezone, 'America/Toronto');
    });

    it('enforces regular mode when student has already consumed their trial', () => {
      const lastBooking = {
        id: 'b-trial-previous',
        serviceId: 'quran-reading',
        durationMinutes: 30,
        bookingType: 'trial' // previous was trial
      };

      // When canBookTrial is false:
      const { initialMode } = mapLastBookingToBookingFormData(lastBooking, sampleProfile, false);
      assert.strictEqual(initialMode, 'regular', 'Cannot reuse trial mode if trial is already consumed');
    });
  });

  describe('4. End-to-End Workflow Rules Validation', () => {
    it('new student with 0 previous bookings: findLastEligibleBooking is null, trial is enabled', () => {
      const bookings: any[] = [];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);

      const trial = calculateTrialEligibility(bookings, null);
      assert.strictEqual(trial.canBookTrial, true);
      assert.strictEqual(trial.hasUsedTrial, false);
    });

    it('student with only cancelled bookings: findLastEligibleBooking is null, trial still available', () => {
      const bookings = [
        {
          id: 'b-c1',
          service_id: 'quran-reading',
          duration_minutes: 30,
          status: 'cancelled',
          booking_type: 'trial'
        }
      ];

      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null, 'Cancelled bookings are not eligible for reuse');

      const trial = calculateTrialEligibility(bookings, null);
      assert.strictEqual(trial.canBookTrial, true, 'Cancelled trial does not consume trial eligibility');
    });

    it('student with previous completed lesson: eligible for repeat, trial is consumed', () => {
      const bookings = [
        {
          id: 'b-completed-1',
          service_id: 'quran-reading',
          duration_minutes: 45,
          status: 'completed',
          booking_type: 'regular',
          scheduled_start: '2026-09-08T15:00:00Z'
        },
        {
          id: 'b-trial-old',
          service_id: 'quran-reading',
          duration_minutes: 30,
          status: 'completed',
          booking_type: 'trial',
          scheduled_start: '2026-08-25T15:00:00Z'
        }
      ];

      const eligible = findLastEligibleBooking(bookings);
      assert.ok(eligible);
      assert.strictEqual(eligible.id, 'b-completed-1');

      const trial = calculateTrialEligibility(bookings, null);
      assert.strictEqual(trial.canBookTrial, false);
      assert.strictEqual(trial.hasUsedTrial, true);

      const summary = formatLastBookingSummary(eligible, sampleProfile);
      assert.strictEqual(summary.summaryText, 'Quran Reading (Noorani Qaidah & Fluency) · Intermediate · 45 mins');

      const formData = mapLastBookingToBookingFormData(eligible, sampleProfile, trial.canBookTrial);
      assert.strictEqual(formData.initialStep, 5);
      assert.strictEqual(formData.initialMode, 'regular');
      assert.strictEqual(formData.initialData.duration, 45);
    });
  });
});
