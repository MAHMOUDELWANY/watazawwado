import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import {
  adminTourSteps, dashTourId, familyTourSteps, isFamilyAccount, isTourHome, learnerTourSteps, markTourSeen, shouldAutoOpenTour,
  teacherTourSteps, tourSeenKey,
} from '../src/lib/tours.js';

const memory = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => { m.set(k, v); } };
};
const TOURS = { learner: learnerTourSteps, family: familyTourSteps, teacher: teacherTourSteps, admin: adminTourSteps };

describe('Zad tours (one per account type)', () => {
  it('opens by itself only on the home page, never over a lesson room, a booking or the return from checkout (P2-007)', () => {
    for (const home of ['/student', '/student/', '/dashboard', '/dashboard/today', '/dashboard/overview']) assert.ok(isTourHome(home), home);
    for (const deep of ['/student/book', '/student/room/abc', '/student/wallet', '/student/lessons', '/dashboard/room/abc', '/dashboard/students', '/']) assert.ok(!isTourHome(deep), deep);
  });

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
    assert.deepStrictEqual(familyTourSteps(false).map((s) => s.targetId[0]).slice(1, 5),
      ['family-children', 'nav-book-link-desktop', 'learner-chips', 'student-progress']);
  });

  it('owner review 2026-11-10: every phone and desktop target exists, and steps open what they explain', () => {
    const src = ['src/student/StudentApp.tsx', 'src/student/pages/StudentHomePage.tsx', 'src/student/activeLearner.tsx', 'src/student/components/DesktopMoreMenu.tsx']
      .map((f) => fs.readFileSync(f, 'utf8')).join(' ');
    const tourIds = [...src.matchAll(/tour: '([a-z-]+)'/g)].map((m) => m[1]);
    // An id or data-tour written as an attribute, a nav item's `tour`, or an id chosen in JSX ('nav-book-link-desktop').
    const exists = (id: string) => src.includes(`"${id}"`) || src.includes(`'${id}'`) || tourIds.includes(id);
    for (const steps of [learnerTourSteps(false), familyTourSteps(false)]) {
      for (const s of steps) for (const id of [...s.targetId, ...(s.phone || [])]) assert.ok(exists(id), `missing tour target ${id}`);
      assert.ok(steps.some((s) => s.open === 'more'), 'phone steps open the More sheet');
      assert.ok(steps.some((s) => s.route === '/student/lessons'), 'the lessons step opens the lessons page');
    }
    assert.ok(fs.readFileSync('src/student/StudentApp.tsx', 'utf8').includes("setSidebarOpen(phone && step.open === 'more')"));
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
