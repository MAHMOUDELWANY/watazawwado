import test from 'node:test';
import assert from 'node:assert';
import { findLastEligibleBooking, mapStudentProfileToBookingInitialData, mapLastBookingToBookingFormData } from '../src/student/pages/StudentBookingPage';

test('Task 0.57-E: Last Lesson Semantics', async (t) => {
  await t.test('1. Completed lesson is selected', () => {
    const bookings = [{ status: 'completed', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    const chosen = findLastEligibleBooking(bookings);
    assert.ok(chosen);
  });
  
  await t.test('2. Future confirmed booking is excluded', () => {
    const bookings = [{ status: 'confirmed', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });

  await t.test('3. Future pending booking is excluded', () => {
    const bookings = [{ status: 'pending', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });

  await t.test('4. Future rescheduled booking is excluded', () => {
    const bookings = [{ status: 'rescheduled', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });

  await t.test('5. Cancelled booking is excluded', () => {
    const bookings = [{ status: 'cancelled', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });

  await t.test('6. Failed/incomplete booking is excluded', () => {
    const bookings = [{ status: 'failed', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });

  await t.test('9. Latest eligible completed/taken lesson wins', () => {
    const bookings = [
      { id: '1', status: 'completed', scheduled_start: new Date(Date.now() - 172800000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 },
      { id: '2', status: 'completed', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
    ];
    const chosen = findLastEligibleBooking(bookings);
    assert.strictEqual(chosen.id, '2');
  });

  await t.test('10. Future booking cannot override a completed past lesson', () => {
    const bookings = [
      { id: '1', status: 'completed', scheduled_start: new Date(Date.now() - 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 },
      { id: '2', status: 'confirmed', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }
    ];
    const chosen = findLastEligibleBooking(bookings);
    assert.strictEqual(chosen.id, '1');
  });

  await t.test('11. Future-only history produces no last lesson', () => {
    const bookings = [{ status: 'confirmed', scheduled_start: new Date(Date.now() + 86400000).toISOString(), service_id: 'quran-reading', duration_minutes: 30 }];
    assert.strictEqual(findLastEligibleBooking(bookings), null);
  });
});

test('Task 0.57-E: Multi-child and Identity', async (t) => {
  await t.test('14. One linked child may be naturally defaulted', () => {
    const profile = { learnerType: 'child', guardian: { parentName: 'P' }, linkedChildren: [{ id: 'c1', name: 'Child 1' }] };
    const { initialData } = mapStudentProfileToBookingInitialData(profile, false);
    assert.strictEqual(initialData.studentId, 'c1');
  });

  await t.test('15. Multiple children require explicit selection', () => {
    const profile = { learnerType: 'child', guardian: { parentName: 'P' }, linkedChildren: [{ id: 'c1', name: 'Child 1' }, { id: 'c2', name: 'Child 2' }] };
    const { initialData } = mapStudentProfileToBookingInitialData(profile, false);
    assert.strictEqual(initialData.studentId, '');
  });

  await t.test('18. Previous Child A remains Child A only if still linked', () => {
    const profile = { learnerType: 'child', guardian: { parentName: 'P' }, linkedChildren: [{ id: 'c1', name: 'Child 1' }, { id: 'c2', name: 'Child 2' }] };
    const lastBooking = { studentId: 'c1', contactName: 'Child 1', parentName: 'P' };
    const { initialData } = mapLastBookingToBookingFormData(lastBooking, profile, false);
    assert.strictEqual(initialData.studentId, 'c1');
  });

  await t.test('19. Previous Child A never silently becomes Child B', () => {
    const profile = { learnerType: 'child', guardian: { parentName: 'P' }, linkedChildren: [{ id: 'c2', name: 'Child 2' }] };
    const lastBooking = { studentId: 'c1', contactName: 'Child 1', parentName: 'P' };
    const { initialData } = mapLastBookingToBookingFormData(lastBooking, profile, false);
    assert.strictEqual(initialData.studentId, ''); // Selection cleared
  });
});
