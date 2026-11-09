import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import {
  adminTourSteps, dashTourId, familyTourSteps, isFamilyAccount, learnerTourSteps, markTourSeen, shouldAutoOpenTour,
  teacherTourSteps, tourSeenKey,
} from '../src/lib/tours.js';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
};
const TOURS = { learner: learnerTourSteps, family: familyTourSteps, teacher: teacherTourSteps, admin: adminTourSteps };

describe('Zad tours (one per account type)', () => {
  it('every tour opens with Zad in the centre, ends on the replay button, and has both languages', () => {
    for (const [kind, steps] of Object.entries(TOURS)) {
      for (const isAr of [true, false]) {
        const s = steps(isAr);
        assert.deepStrictEqual(s[0].targetId, [], `${kind}: centred welcome first`);
        assert.ok(/زاد|Zad/.test(s[0].title + s[0].description), `${kind}: Zad introduces itself`);
        assert.ok(s.at(-1)!.targetId.some((t) => t.endsWith('tour-btn')), `${kind}: last step shows the replay button`);
        for (const step of s) assert.ok(step.title && step.description);
      }
      assert.ok(/[؀-ۿ]/.test(steps(true)[1].title), `${kind}: Arabic copy`);
    }
    assert.deepStrictEqual(familyTourSteps(false).map((s) => s.targetId[0]).slice(1, 6),
      ['onboarding-welcome', 'child-switcher', 'nav-book-link', 'student-progress', 'student-messages']);
  });

  it('opens once per account and kind on this browser', () => {
    const store = memory();
    const key = tourSeenKey('teacher', 't1');
    assert.strictEqual(shouldAutoOpenTour(key, store), true);
    markTourSeen(key, store);
    assert.strictEqual(shouldAutoOpenTour(key, store), false, 'not twice');
    assert.strictEqual(shouldAutoOpenTour(tourSeenKey('teacher', 't2'), store), true, 'per account');
    assert.strictEqual(shouldAutoOpenTour(tourSeenKey('admin', 't1'), store), true, 'per kind');
  });

  it('never opens without an account key or with blocked storage', () => {
    assert.strictEqual(shouldAutoOpenTour(null, memory()), false);
    assert.strictEqual(shouldAutoOpenTour('k', null), false);
    assert.strictEqual(shouldAutoOpenTour('k', { getItem: () => { throw new Error('blocked'); } }), false);
    assert.strictEqual(isFamilyAccount({ linkedChildren: [{ id: 'c' }] }), true);
    assert.strictEqual(isFamilyAccount({}), false);
  });

  it('every target exists in the portal and the dashboard', () => {
    const app = fs.readFileSync('src/student/StudentApp.tsx', 'utf8');
    const dash = fs.readFileSync('src/dashboard/DashboardApp.tsx', 'utf8');
    assert.ok(fs.readFileSync('src/student/activeLearner.tsx', 'utf8').includes('data-tour="child-switcher"'));
    assert.ok(app.includes("tour: 'student-messages'") && app.includes('data-tour={item.tour}'));
    assert.ok(app.includes('data-tour="student-header-tour-btn"'));
    assert.ok(app.includes('markTourSeen(tourKey'));
    assert.strictEqual(dashTourId('/dashboard'), 'dash-home');
    assert.strictEqual(dashTourId('/dashboard/availability'), 'dash-availability');
    assert.ok((dash.match(/data-tour=\{dashTourId\(item\.path\)\}/g) || []).length >= 3, 'header tabs, rail and drawer');
    assert.ok(dash.includes('data-tour="admin-search"') && dash.includes('data-tour="teacher-header-tour-btn"'));
    assert.ok(dash.includes('markTourSeen(tourKey'));
  });
});
