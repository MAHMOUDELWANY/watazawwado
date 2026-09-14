import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import {
  findLastEligibleBooking,
  formatLastBookingSummary,
  calculateTrialEligibility,
  mapLastBookingToBookingFormData
} from '../src/student/pages/StudentBookingPage';

test('Task 0.58-B: Repeat Last Booking Dashboard Integration & Deep-Linking Workflow', async (t) => {
  await t.test('1. StudentHomePage imports and uses repeat booking helpers', () => {
    const homeCode = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

    assert(
      homeCode.includes("import { findLastEligibleBooking, formatLastBookingSummary } from './StudentBookingPage';"),
      'StudentHomePage must import findLastEligibleBooking and formatLastBookingSummary from StudentBookingPage'
    );
    assert(
      homeCode.includes('const lastEligibleBooking = findLastEligibleBooking(bookings);'),
      'StudentHomePage must compute lastEligibleBooking'
    );
    assert(
      homeCode.includes('const lastBookingSummary = lastEligibleBooking ? formatLastBookingSummary(lastEligibleBooking, profile) : null;'),
      'StudentHomePage must format summary using formatLastBookingSummary'
    );
  });

  await t.test('2. StudentHomePage provides Repeat Last Lesson CTA for returning students without upcoming lessons', () => {
    const homeCode = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

    assert(
      homeCode.includes('id="btn-home-repeat-lesson"'),
      'StudentHomePage must render Repeat Last Lesson button with id="btn-home-repeat-lesson"'
    );
    assert(
      homeCode.includes('to="/student/book?repeat=true"'),
      'StudentHomePage Repeat button must deep-link to /student/book?repeat=true'
    );
    assert(
      homeCode.includes('Ready for your next session'),
      'StudentHomePage must present welcoming continuity copy'
    );
    assert(
      homeCode.includes('Explore Topics'),
      'StudentHomePage must provide secondary action to explore new topics'
    );
  });

  await t.test('3. StudentHomePage provides Repeat topic link when an upcoming lesson exists', () => {
    const homeCode = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

    assert(
      homeCode.includes('id="link-home-repeat-lesson"'),
      'StudentHomePage must render quick repeat link with id="link-home-repeat-lesson"'
    );
    assert(
      homeCode.includes('to="/student/book?repeat=true"'),
      'Quick repeat link must deep-link to /student/book?repeat=true'
    );
  });

  await t.test('4. StudentHomePage Learning History includes direct repeat button for completed/confirmed bookings', () => {
    const homeCode = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

    assert(
      homeCode.includes('id={`btn-repeat-history-${b.id}`}'),
      'Learning History must provide repeat button per repeatable booking'
    );
    assert(
      homeCode.includes('to={`/student/book?repeat=true${bServiceId ? `&service=${bServiceId}` : \'\'}`}'),
      'Learning History repeat link must pass repeat=true and service ID'
    );
  });

  await t.test('5. StudentHomePage Zoom meeting link validation prevents fake /pending redirects', () => {
    const homeCode = fs.readFileSync('src/student/pages/StudentHomePage.tsx', 'utf8');

    assert(
      homeCode.includes("const rawZoom = (nextBooking?.zoomMeetingLink || nextBooking?.zoom_join_url || '').trim();"),
      'StudentHomePage must extract raw Zoom link'
    );
    assert(
      homeCode.includes("const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));"),
      'StudentHomePage must validate that Zoom URL strictly starts with https:// or http://'
    );
    assert(
      homeCode.includes('Meeting link will appear soon'),
      'StudentHomePage must display placeholder text when Zoom link is pending or invalid'
    );
  });

  await t.test('6. StudentBookingPage integrates deep-linking with searchParams and location state', () => {
    const bookingCode = fs.readFileSync('src/student/pages/StudentBookingPage.tsx', 'utf8');

    assert(
      bookingCode.includes('const [searchParams] = useSearchParams();'),
      'StudentBookingPage must initialize useSearchParams'
    );
    assert(
      bookingCode.includes('const location = useLocation();'),
      'StudentBookingPage must initialize useLocation'
    );
    assert(
      bookingCode.includes("searchParams.get('repeat') === 'true'"),
      'StudentBookingPage must check for ?repeat=true query parameter'
    );
    assert(
      bookingCode.includes('handleReuseLastBooking()'),
      'StudentBookingPage must invoke handleReuseLastBooking upon deep-link trigger'
    );
    assert(
      bookingCode.includes("navigate('/student/book', { replace: true });"),
      'StudentBookingPage must clean up URL query params when resetting or dismissing reuse'
    );
  });

  await t.test('7. Functional verification: Repeat logic respects trial consumption and child/adult preferences', () => {
    // Verified booking history with 1 completed trial booking
    const pastTrialBooking = {
      id: 'book-trial-001',
      service_id: 'quran-reading',
      duration_minutes: 30,
      status: 'completed',
      booking_type: 'trial',
      current_level: 'beginner',
      created_at: '2026-09-01T10:00:00Z',
      scheduled_start: '2026-09-01T10:00:00Z'
    };

    const bookings = [pastTrialBooking];
    const eligibility = calculateTrialEligibility(bookings, null);
    assert.strictEqual(eligibility.canBookTrial, false, 'Student with completed trial cannot book another trial');

    const last = findLastEligibleBooking(bookings);
    assert.notStrictEqual(last, null, 'Must identify past trial as eligible for repeating lesson details');

    const profile = {
      name: 'Sister Fatima',
      email: 'fatima@example.com',
      bookingPreference: 'child',
      linkedChildren: [{ id: 'child-1', name: 'Zaynab', age: 8 }]
    };

    const summary = formatLastBookingSummary(last, profile);
    assert(summary.serviceTitle.includes('Quran Reading'), 'Summary must format service title correctly');
    assert(summary.summaryText.includes('30 mins'), 'Summary must reflect duration correctly');

    const formData = mapLastBookingToBookingFormData(last, profile, eligibility.canBookTrial);
    assert.strictEqual(formData.initialMode, 'regular', 'Mode must be coerced to regular since trial is consumed');
    assert.strictEqual(formData.matchedServiceId, 'quran-reading', 'Service ID must match');
  });
});
