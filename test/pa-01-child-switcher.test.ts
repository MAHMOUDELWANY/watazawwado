import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { familyLearners, ACTIVE_LEARNER_STORAGE_KEY } from '../src/student/activeLearner.js';
import { LAST_OPENED_CHILD_STORAGE_KEY } from '../src/student/pages/StudentProgressPage.js';

const children = [{ id: 'c1', name: 'Yusuf' }, { id: 'c2', name: 'Maryam' }];

describe('PA-01 child switcher', () => {
  it('lists the children, and the parent too when the parent also learns', () => {
    assert.deepStrictEqual(familyLearners({ id: 'p', name: 'Amina', bookingPreference: 'self', linkedChildren: children }).map((l) => l.id), ['p', 'c1', 'c2']);
    assert.deepStrictEqual(familyLearners({ id: 'p', name: 'Amina', bookingPreference: 'child', linkedChildren: children }).map((l) => l.id), ['c1', 'c2']);
    assert.deepStrictEqual(familyLearners({ id: 'p', name: 'Omar', linkedChildren: [] }), [], 'no switcher without children');
    assert.deepStrictEqual(familyLearners(null), []);
  });

  it('shares the progress page\'s remembered child', () => {
    assert.strictEqual(ACTIVE_LEARNER_STORAGE_KEY, LAST_OPENED_CHILD_STORAGE_KEY);
  });

  it('lessons, progress, packages and booking follow the switcher', () => {
    const read = (p: string) => fs.readFileSync(p, 'utf8');
    assert.ok(read('src/student/StudentApp.tsx').includes('<ChildSwitcher'));
    assert.ok(read('src/student/StudentApp.tsx').includes('<ActiveLearnerProvider profile={profile}>'));
    assert.ok(read('src/student/pages/StudentLessonsPage.tsx').includes('b.studentId === activeId'));
    assert.ok(read('src/student/pages/StudentProgressPage.tsx').includes("nextParams.set('learnerId', activeId)"));
    assert.ok(read('src/student/pages/StudentPackagesPage.tsx').includes('e.learnerStudentId === activeId'));
    assert.ok(read('src/student/pages/StudentBookingPage.tsx').includes("audience: 'child' as const, studentId: activeChild.id"));
  });

  it('the lessons API returns the whole family, checked by the same learner helper as cancel/reschedule', () => {
    const api = fs.readFileSync('api/index.ts', 'utf8');
    const route = api.slice(api.indexOf("app.get('/api/student/bookings'"), api.indexOf("app.get('/api/student/bookings'") + 2500);
    assert.ok(route.includes('getAuthorizedLearnersForStudent(supabaseAdmin, req)'));
    assert.ok(route.includes(".in('student_id', learnerIds)"));
    assert.ok(!route.includes(".eq('student_id', studentId)"));
  });
});
