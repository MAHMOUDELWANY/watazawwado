import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { catalogPriceSummary, canReviewLessons, formatLessonDay } from '../src/components/booking/MultiLessonPlan';
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
    for (const copy of ['How many lessons would you like to book?', 'Regular total:', 'Save ', 'You save:', ' / lesson', 'saving > 0']) assert.ok(planner.includes(copy), copy);
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

describe('booking review UX hierarchy', () => {
  it('leads with what was selected, times, price, then one primary action', () => {
    const planner = read('components/booking/MultiLessonPlan.tsx');
    // Section order: selected times → price → what happens → actions.
    const timesIdx = planner.indexOf('Your selected times');
    const priceIdx = planner.indexOf('>Price<');
    const explainIdx = planner.indexOf('will be checked again before the lesson plan is created');
    const editIdx = planner.indexOf('Edit times');
    const confirmIdx = planner.indexOf('Confirm lesson plan');
    for (const [name, idx] of Object.entries({ timesIdx, priceIdx, explainIdx, editIdx, confirmIdx })) {
      assert.ok(idx > -1, `missing review section: ${name}`);
    }
    assert.ok(timesIdx < priceIdx && priceIdx < explainIdx && explainIdx < editIdx, 'review sections must be ordered times → price → explanation → actions');
    assert.ok(editIdx < confirmIdx, 'Edit times must precede the primary confirm action');
  });

  it('shows total first, then per-lesson, then savings without inflating the regular price', () => {
    const planner = read('components/booking/MultiLessonPlan.tsx');
    const totalIdx = planner.indexOf('{money(price.total, price.currency)}');
    const perLessonIdx = planner.indexOf('{money(price.perLesson, price.currency)} / lesson');
    const savingIdx = planner.indexOf('You save:');
    assert.ok(totalIdx > -1 && perLessonIdx > -1 && savingIdx > -1, 'price block must show total, per-lesson and savings');
    assert.ok(totalIdx < perLessonIdx && perLessonIdx < savingIdx, 'price hierarchy must be total → per-lesson → savings');
    // savings only render when positive (never a fake zero-value "save $0")
    assert.match(planner, /\{price\.saving > 0 && \(/);
  });

  it('uses an availability-derived (UTC) date label, never a browser-local reconstruction', () => {
    const planner = read('components/booking/MultiLessonPlan.tsx');
    assert.match(planner, /export function formatLessonDay/);
    assert.match(planner, /Date\.UTC\(/);
    assert.doesNotMatch(planner, /new Date\(date \+ 'T00:00:00'\)/);
    assert.equal(formatLessonDay('2026-09-24'), 'Thu, Sep 24');
  });

  it('makes a genuinely missing session actionable instead of a silent dead button', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    assert.match(flow, /!isAuthenticatedStudent \|\| !accessToken/);
    assert.match(flow, /Your session has expired\. Please sign in again/);
    // the guard must surface an error rather than returning silently for the auth case
    assert.match(flow, /if \(!isAuthenticatedStudent \|\| !accessToken\) \{\s*setValidationError/);
  });

  it('marks the request-created state distinct from payment and never claims payment success', () => {
    const flow = read('components/booking/BookingFlow.tsx');
    assert.match(flow, /Lesson plan request created/);
    assert.match(flow, /Payment is not confirmed by this screen/);
  });
});

describe('learning guide unavailable state', () => {
  it('maps AI_UNAVAILABLE/503 to a calm, distinct state with a helpful next step', () => {
    const guide = read('components/intake/IntakeConversation.tsx');
    assert.match(guide, /data\?\.code === 'AI_UNAVAILABLE' \|\| r\.status === 503/);
    assert.match(guide, /setAiUnavailable\(true\)/);
    assert.match(guide, /The learning guide is unavailable right now\./);
    assert.match(guide, /you can still book a lesson or message Ustadh Mahmoud directly/i);
    // the unavailable state is distinct from the generic error path
    assert.match(guide, /aiUnavailable && \(/);
  });

  it('keeps the API key server-side only (never referenced in the client guide)', () => {
    const guide = read('components/intake/IntakeConversation.tsx');
    assert.doesNotMatch(guide, /GEMINI_API_KEY/);
    assert.doesNotMatch(guide, /apiKey/);
    const intakeApi = read('../api/index.ts');
    assert.match(intakeApi, /process\.env\.GEMINI_API_KEY/);
  });
});
