import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

describe('Curriculum plan is discoverable by every new session', () => {
  it('PLAN.md and the source registry exist with their binding sections', () => {
    const plan = read('docs/curriculum/PLAN.md');
    for (const heading of ['## 0. Where we are', '## 3. Rules for content', '## 3a. Engagement', '## 8. Progress log']) {
      assert.ok(plan.includes(heading), `PLAN.md must keep "${heading}"`);
    }
    assert.ok(plan.includes('Zad Essentials'), 'subject name must be recorded');
    assert.ok(existsSync(join(root, 'docs/curriculum/sources.md')), 'source registry must exist');
  });

  it('CLAUDE.md and RULES.md point to the plan', () => {
    assert.ok(read('CLAUDE.md').includes('docs/curriculum/PLAN.md'));
    assert.ok(read('RULES.md').includes('docs/curriculum/PLAN.md'));
  });
});

describe('Old token-based manage-booking modal is gone', () => {
  it('removed components stay removed and nothing imports them', () => {
    for (const f of ['ManageBookingModal', 'PaymentInstructionsModal']) {
      assert.ok(!existsSync(join(root, `src/components/booking/${f}.tsx`)), `${f}.tsx must not come back`);
      assert.ok(!read('src/components/booking/BookingFlow.tsx').includes(f));
    }
  });

  it('confirmation sends students to My Lessons to change a booking', () => {
    const src = read('src/components/booking/BookingConfirmation.tsx');
    assert.ok(src.includes('to="/student/lessons"'));
    assert.ok(!src.includes('onOpenManageModal'));
  });

  it('client repository no longer carries its own cancel/reschedule path', () => {
    const repo = read('src/lib/bookingRepository.ts');
    for (const name of ['cancelBooking(', 'rescheduleBooking(', 'checkPolicyEligibility(']) {
      assert.ok(!repo.includes(name), `bookingRepository must not define ${name}`);
    }
  });
});
