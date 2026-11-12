import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { humanDate, humanTime } from '../src/lib/lessonDate.js';
import { validateStep } from '../src/booking/validation.js';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

class MemStore {
  m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

// P4-007: one thing at a time for a new family.
describe('P4-007 no interruptions before the first booking', () => {
  it('the install card waits for a second visit', async () => {
    (globalThis as any).window ??= {};
    const { isReturningVisit } = await import('../src/components/pwa/InstallApp.js');
    const local = new MemStore();
    assert.equal(isReturningVisit(local, new MemStore()), false, 'first visit');
    assert.equal(isReturningVisit(local, new MemStore()), true, 'second visit');
    assert.equal(isReturningVisit(null, null), false, 'blocked storage');
  });

  it('the tour and the reminders prompt wait for the first booking; the card never covers a dialog', () => {
    const app = src('src/student/StudentApp.tsx');
    assert.ok(app.includes('if (authModalOpen || hasBooking !== true) return;'));
    assert.ok(app.includes('hold={showGlobalTour || hasBooking !== true}'));
    assert.ok(src('src/components/pwa/InstallApp.tsx').includes(`document.querySelector('[role="dialog"], [aria-modal="true"]')`));
  });
});

// P4-008/009/021: booking says dates the way people do, picks nothing for the family, and leads to the sibling.
describe('P4-008/009/021 booking', () => {
  it('dates and times follow the page language', () => {
    assert.equal(humanDate('2026-11-16', false), 'Monday 16 November');
    assert.match(humanDate('2026-11-16', true), /الاثنين/);
    assert.match(humanTime('05:00 PM', true), /٥:٠٠/);
    assert.match(humanTime('17:00', false), /^(5:00\s?pm|17:00)$/i);
    assert.equal(humanTime('soon', false), 'soon');
  });

  it('a free trial needs no goal; a paid lesson still does', () => {
    const base: any = { goal: '', customGoalText: '', serviceId: 'quran-reading' };
    assert.equal(validateStep(2, { ...base, mode: 'trial' }).isValid, true);
    assert.equal(validateStep(2, { ...base, mode: 'regular' }).isValid, false);
  });

  it('no time is picked for the family and the confirmation opens at the top with the sibling next', () => {
    const step = src('src/components/booking/StepDateTime.tsx');
    assert.ok(!step.includes('if (defaultSlot) onSelectSlot(defaultSlot)'), 'a slot is still pre-selected');
    assert.ok(!step.includes('onSelectSlot(firstAvailSlot)'));
    const conf = src('src/components/booking/BookingConfirmation.tsx');
    assert.ok(conf.includes('headingRef.current?.focus'));
    assert.ok(src('src/components/booking/BookingFlow.tsx').includes('nextAction={siblingTrialAction}'));
    assert.ok(src('src/components/booking/StepLearner.tsx').includes("goal: serviceId === formData.serviceId ? formData.goal : ''"));
  });
});

// P4-009 (rest of proposal 5): a trial in three screens, a child's times after school first, the teacher named.
describe('P4-009 booking v2, rest', () => {
  it('a flow that starts as a trial has three screens and matching titles', () => {
    const flow = src('src/components/booking/BookingFlow.tsx');
    assert.ok(flow.includes('startedAsTrial ? [[1, 2, 3, 4], [5], [6]]'));
    assert.ok(flow.includes('threeScreens={startedAsTrial && !isMultiStepFlow}'));
    assert.ok(src('src/components/booking/BookingHeader.tsx').includes('if (threeScreens) stepTitles.splice(1, 1);'));
  });

  it('a child sees morning after the evening and the earliest times only on request', () => {
    const s = src('src/components/booking/StepDateTime.tsx');
    assert.ok(s.includes("const EARLIEST_CHILD_TIME = '07:00'"));
    assert.ok(s.indexOf('{!forChild && morningBlock}') < s.indexOf('{/* Afternoon */}'));
    assert.ok(s.indexOf('{forChild && morningBlock}') > s.indexOf('{/* Evening */}'));
  });

  it('the confirmation names the teacher', () => {
    assert.ok(src('src/components/booking/BookingFlow.tsx').includes('teacherName={lessonTeacherName}'));
    assert.ok(src('src/student/pages/StudentBookingPage.tsx').includes('teacherName={profile?.assignedTeacherName'));
  });
});
