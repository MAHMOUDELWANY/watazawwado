import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { calculateTrialEligibility } from '../src/student/pages/StudentBookingPage.js';

// Owner review 2026-11-07 (item 21): each child in a family gets their own free trial.
describe('Free trial per learner', () => {
  const trialFor = (studentId: string, status = 'confirmed') => ({ booking_type: 'trial', status, student_id: studentId });

  it('a family keeps the trial open while any child has not had one', () => {
    const r = calculateTrialEligibility([trialFor('ali')], null, ['ali', 'sara']);
    assert.strictEqual(r.canBookTrial, true);
    assert.deepStrictEqual(r.trialUsedLearnerIds, ['ali']);
  });

  it('closes once every child had theirs; cancelled trials do not count', () => {
    assert.strictEqual(calculateTrialEligibility([trialFor('ali'), trialFor('sara')], null, ['ali', 'sara']).canBookTrial, false);
    assert.strictEqual(calculateTrialEligibility([trialFor('ali', 'cancelled')], null, ['ali']).canBookTrial, true);
  });

  it('an adult account still has one trial, and errors never open it', () => {
    assert.strictEqual(calculateTrialEligibility([trialFor('me')], null).canBookTrial, false);
    assert.strictEqual(calculateTrialEligibility(null, 'network').canBookTrial, false);
  });

  it('the server checks a child on its own and keeps the 5-lost-trials limit account-wide', () => {
    const src = fs.readFileSync('api/index.ts', 'utf8');
    assert.ok(src.includes('const trialOwnerFilter = childLesson ? `student_id.eq.${pgrstValue(linkedStudentId!)}` : accountFilter;'));
    assert.ok(/in\('status', \['cancelled', 'no_show'\]\)\s*\.or\(accountFilter\);/.test(src));
  });
});
