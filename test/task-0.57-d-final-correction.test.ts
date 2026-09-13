import test from 'node:test';
import assert from 'node:assert';
import { findLastEligibleBooking, mapStudentProfileToBookingInitialData, mapLastBookingToBookingFormData } from '../src/student/pages/StudentBookingPage';

test('Task 0.57-D: Final Correction: True Last Lesson + Explicit Multi-Child Target', async (t) => {
  await t.test('Last Lesson Logic', async (t) => {
    await t.test('1. Completed lesson is selected', () => {
      const bookings = [
        { status: 'completed', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.ok(eligible);
      assert.strictEqual(eligible.status, 'completed');
    });

    await t.test('2. Future confirmed booking is excluded', () => {
      const bookings = [
        { status: 'confirmed', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);
    });

    await t.test('3. Future pending booking is excluded', () => {
      const bookings = [
        { status: 'pending', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);
    });

    await t.test('4. Future rescheduled booking is excluded', () => {
      const bookings = [
        { status: 'rescheduled', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);
    });

    await t.test('5. Cancelled lesson is excluded', () => {
      const bookings = [
        { status: 'cancelled', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);
    });
    
    await t.test('6. No eligible completed/taken lesson -> returns null', () => {
      const bookings = [
        { status: 'no_show', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
      ];
      const eligible = findLastEligibleBooking(bookings);
      assert.strictEqual(eligible, null);
    });
  });

  await t.test('Multiple Children Logic', async (t) => {
    await t.test('Guardian with one child may default to that child', () => {
      const profile = {
        id: 'parent1',
        learnerType: 'child',
        guardian: { parentName: 'A', parentEmail: 'a@b.com' },
        linkedChildren: [{ id: 'child1', name: 'Child A', current_level: 'beginner' }]
      };
      const result = mapStudentProfileToBookingInitialData(profile, true);
      assert.strictEqual(result.initialData.studentId, 'child1');
      assert.strictEqual(result.initialData.childName, 'Child A');
    });

    await t.test('Guardian with multiple children must explicitly select a child', () => {
      const profile = {
        id: 'parent1',
        learnerType: 'child',
        guardian: { parentName: 'A', parentEmail: 'a@b.com' },
        linkedChildren: [
          { id: 'child1', name: 'Child A', current_level: 'beginner' },
          { id: 'child2', name: 'Child B', current_level: 'beginner' }
        ]
      };
      const result = mapStudentProfileToBookingInitialData(profile, true);
      assert.strictEqual(result.initialData.studentId, ''); // No default
      assert.strictEqual(result.initialData.childName, ''); // No default
    });
  });
  
  await t.test('Repeat Booking Identity Preservation', async (t) => {
    await t.test('Previous Child A remains Child A only if still linked', () => {
      const profile = {
        id: 'parent1',
        learnerType: 'child',
        guardian: { parentName: 'A', parentEmail: 'a@b.com' },
        linkedChildren: [
          { id: 'child1', name: 'Child A', current_level: 'beginner' },
          { id: 'child2', name: 'Child B', current_level: 'beginner' }
        ]
      };
      const lastBooking = {
        service_id: 'quran-reading',
        duration_minutes: 30,
        booking_type: 'regular',
        student_id: 'child1',
        parent_name: 'A'
      };
      const result = mapLastBookingToBookingFormData(lastBooking, profile, false);
      assert.strictEqual(result.initialData.studentId, 'child1');
      assert.strictEqual(result.initialData.childName, 'Child A');
    });

    await t.test('If previous child is no longer linked, explicit child selection is required', () => {
       const profile = {
        id: 'parent1',
        learnerType: 'child',
        guardian: { parentName: 'A', parentEmail: 'a@b.com' },
        linkedChildren: [
          { id: 'child2', name: 'Child B', current_level: 'beginner' }
        ]
      };
      const lastBooking = {
        service_id: 'quran-reading',
        duration_minutes: 30,
        booking_type: 'regular',
        student_id: 'child1', // no longer linked
        parent_name: 'A'
      };
      const result = mapLastBookingToBookingFormData(lastBooking, profile, false);
      assert.strictEqual(result.initialData.studentId, ''); // Selection cleared
      assert.strictEqual(result.initialData.childName, ''); // Name cleared
    });
  });
});
