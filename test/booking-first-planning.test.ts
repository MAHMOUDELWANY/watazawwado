import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { catalogPriceSummary, canReviewLessons } from '../src/components/booking/MultiLessonPlan';
import { PackageCatalogEntry, TimeSlot } from '../src/booking/types';

const row = (count: number, price: number): PackageCatalogEntry => ({ id: `server-${count}`, package_type: 'weekly', name: 'Lessons', lesson_count: count, price_amount: price, currency: 'USD', is_active: true });
const read = (name: string) => fs.readFileSync(`src/${name}`, 'utf8');
const slot: TimeSlot = { id: 'slot-a', time24: '19:00', timeDisplay: '7:00 PM', period: 'evening', available: true, cairoTimeEquiv: '02:00' };

describe('booking-first planning (local contract boundary)', () => {
  it('removes packages from primary navigation but retains account route', () => {
    const app = read('student/StudentApp.tsx');
    assert.doesNotMatch(app, /path: '\/student\/packages'/);
    assert.match(app, /<Route path="\/packages"/);
    assert.doesNotMatch(app, /to="\/student\/packages"/);
  });
  it('renders catalog quantities and actual savings as display only', () => {
    assert.deepEqual(catalogPriceSummary(row(1, 8), row(2, 15)), { regular: 16, saving: 1, total: 15, perLesson: 7.5, currency: 'USD' });
    assert.deepEqual(catalogPriceSummary(row(1, 8), row(3, 21)), { regular: 24, saving: 3, total: 21, perLesson: 7, currency: 'USD' });
    assert.equal(catalogPriceSummary(row(1, 8), row(2, 16))?.saving, 0);
    assert.equal(catalogPriceSummary(row(1, 8), { ...row(2, 15), currency: 'EUR' }), null);
    const planner = read('components/booking/MultiLessonPlan.tsx');
    for (const copy of ['How many lessons would you like to book?', 'Regular total:', 'Save ', 'You save:', 'Final catalog total:', ' / lesson', 'saving > 0']) assert.ok(planner.includes(copy), copy);
    assert.match(read('student/pages/StudentBookingPage.tsx'), /catalog=\{packagesData\?\.catalog \|\| \[\]\}/);
  });
  it('requires sufficient available lesson days and exact distinct selections', () => {
    const selections = [{ date: '2026-10-06', slot }, { date: '2026-10-13', slot }];
    assert.equal(canReviewLessons(3, 2, selections), false);
    assert.equal(canReviewLessons(3, 4, selections), false);
    assert.equal(canReviewLessons(2, 2, selections), true);
    assert.equal(canReviewLessons(2, 2, [selections[0], selections[0]]), false);
    const planner = read('components/booking/MultiLessonPlan.tsx');
    assert.match(planner, /\{selectedInPeriod\.length\} of \{count\} lessons selected/);
    assert.match(planner, /availableDays\.length < count/);
    assert.match(planner, /selected\.map\(\(\{ date, slot \}\)/);
  });
  it('blocks multi-slot persistence while preserving single lesson credit redemption', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    const repo = read('lib/bookingRepository.ts');
    assert.match(flow, /if \(lessonCount !== 1\) return/);
    assert.match(flow, /phase="review"/);
    assert.match(flow, /packageEntitlementId: undefined/);
    assert.match(repo, /package_entitlement_id: data\.packageEntitlementId \|\| null/);
    assert.match(read('components/booking/StepLessonType.tsx'), /Use an existing lesson credit/);
    assert.match(read('booking/bookingService.ts'), /getAvailability\(timezone: string, duration = 30, teacherId\?: string, days\?: number\)/);
    assert.doesNotMatch(plannerAndFlow(), /fetch\('\/api\/student\/packages\/select'|pricePaid:|price_amount:/);
  });
});

function plannerAndFlow() { return read('components/booking/MultiLessonPlan.tsx') + read('components/booking/BookingFlow.tsx'); }



describe('multi-lesson atomic confirmation contract', () => {
  it('routes multi-lesson confirmation through the server endpoint only', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    assert.match(flow, /fetch\('\/api\/student\/multi-lesson-plan'/);
    assert.match(flow, /catalogId: selectedCatalog\.id/);
    assert.match(flow, /lessons: selectedLessons\.map/);
    assert.match(flow, /Authorization: `Bearer \$\{accessToken\}`/);
    assert.match(read('student/pages/StudentBookingPage.tsx'), /accessToken=\{accessToken\}/);
    assert.match(flow, /scheduledStart: slot\.utcStartIso/);
    assert.match(flow, /scheduledEnd: slot\.utcEndIso/);
    assert.doesNotMatch(flow, /new Date\(date \+ 'T00:00:00'\)/);
    assert.match(flow, /onConfirm=\{handleConfirmMultiLesson\}/);
    assert.match(flow, /multiPlanCreated/);
    assert.match(flow, /Payment is not confirmed by this screen/);
    assert.doesNotMatch(flow, /package_entitlement_id/);
  });

  it('does not enable multi-lesson confirmation when catalog data is absent', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    assert.match(flow, /if \(!selectedCatalog\)/);
    assert.match(flow, /This lesson plan is temporarily unavailable/);
    assert.match(flow, /!accessToken/);
    assert.match(flow, /!slot\.utcStartIso \|\| !slot\.utcEndIso/);
  });

  it('keeps the display-only price calculation truthful', () => {
    assert.deepEqual(catalogPriceSummary(row(1, 8), row(2, 15)), {
      regular: 16, saving: 1, total: 15, perLesson: 7.5, currency: 'USD'
    });
  });
});
