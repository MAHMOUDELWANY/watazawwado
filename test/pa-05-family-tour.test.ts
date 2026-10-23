import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { familyTourSteps, isFamilyAccount, markFamilyTourSeen, shouldAutoOpenFamilyTour, FAMILY_TOUR_SEEN_PREFIX } from '../src/student/familyTour.js';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
};
const family = { id: 'p1', onboardingCompleted: true, linkedChildren: [{ id: 'c1' }] };

describe('PA-05 family tour', () => {
  it('has four steps (children, booking, progress, chat) in both languages', () => {
    for (const isAr of [true, false]) {
      const steps = familyTourSteps(isAr);
      assert.deepStrictEqual(steps.map((s) => s.targetId[0]), ['child-switcher', 'nav-book-link', 'student-progress', 'student-messages']);
      for (const s of steps) assert.ok(s.title && s.description);
    }
    assert.ok(/[؀-ۿ]/.test(familyTourSteps(true)[0].title));
  });

  it('opens once for a family account that finished onboarding', () => {
    const store = memory();
    assert.strictEqual(shouldAutoOpenFamilyTour(family, store), true);
    markFamilyTourSeen(family, store);
    assert.strictEqual(store.getItem(FAMILY_TOUR_SEEN_PREFIX + 'p1'), '1');
    assert.strictEqual(shouldAutoOpenFamilyTour(family, store), false, 'not twice');
    assert.strictEqual(shouldAutoOpenFamilyTour({ ...family, id: 'p2' }, store), true, 'per account');
  });

  it('never opens for adult learners, unfinished onboarding or a missing profile', () => {
    const store = memory();
    assert.strictEqual(shouldAutoOpenFamilyTour({ ...family, linkedChildren: [] }, store), false);
    assert.strictEqual(shouldAutoOpenFamilyTour({ ...family, onboardingCompleted: false }, store), false);
    assert.strictEqual(shouldAutoOpenFamilyTour(null, store), false);
    assert.strictEqual(isFamilyAccount({}), false);
    assert.strictEqual(shouldAutoOpenFamilyTour(family, { getItem: () => { throw new Error('blocked'); } }), false);
  });

  it('every tour target exists in the portal and the help button replays it', () => {
    const app = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');
    const switcher = fs.readFileSync('src/student/activeLearner.tsx', 'utf8');
    assert.ok(switcher.includes('data-tour="child-switcher"'));
    assert.ok(app.includes("tour: 'student-messages'"), 'messages tab is a target on phones');
    assert.ok(app.includes('data-tour={item.tour}'), 'sidebar links carry student-progress / student-messages');
    assert.ok(app.includes('isFamilyAccount(profile) ? familyTourSteps(isAr) : globalTourSteps'));
    assert.ok(app.includes('markFamilyTourSeen(profile'));
  });
});
