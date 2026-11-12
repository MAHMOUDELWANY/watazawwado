import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lessonRulesText, allLessonRulesText, reminderText } from '../src/lib/lessonRules.js';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// P4-004/005: nothing about the teacher or the child's gender is chosen for the family.
describe('P4-004/005 no pre-selected gender or teacher', () => {
  it('GuideChoice starts with no tab and never moves the pick on its own', () => {
    const s = src('src/components/onboarding/TravelPass.tsx');
    assert.ok(s.includes("useState<'male' | 'female' | null>(selectedGender || null)"));
    assert.ok(!/onChange\(first\.id\)/.test(s), 'switching gender still picks the first teacher');
    assert.ok(s.includes('No female teacher teaches this subject yet'), 'an empty gender must say so, not vanish');
  });

  it('a new child starts with no gender and needs a hand-picked teacher', () => {
    const s = src('src/student/pages/StudentOnboardingPage.tsx');
    assert.equal((s.match(/gender: '',\n\s*teacherGenderPreference: 'auto'/g) || []).length, 2);
    assert.ok(/childComplete = [^;]*Boolean\(c\.gender\) && childTeacherPicked\(c\)/.test(s));
    assert.ok(s.includes('!adultTeacherPicked'), 'an adult must pick a teacher before continuing');
    const add = src('src/student/components/AddChildForm.tsx');
    assert.ok(add.includes("useState<'male' | 'female' | ''>('')"));
    assert.ok(!add.includes('setTeacherId((teachers.find'), 'Add a child still pre-picks a teacher');
  });
});

// P4-006: the rules a family accepts match RULES.md §2.
describe('P4-006 rules and reminders at consent', () => {
  it('trial and lesson rules state the real hours', () => {
    const trial = lessonRulesText(true, false);
    assert.match(trial, /once/);
    assert.match(trial, /1 hour/);
    assert.match(trial, /48 hours/);
    assert.doesNotMatch(trial, /3 hours/);
    const lesson = lessonRulesText(false, false);
    assert.match(lesson, /up to 1 hour before/);
    assert.match(lesson, /cancel it up to 3 hours before/);
    assert.match(lessonRulesText(true, true), /٤٨ ساعة/);
    assert.ok(allLessonRulesText(false).includes(trial));
  });

  it('reminders are email 3 h, on-site 12 h and 2 h', () => {
    assert.match(reminderText(false), /3 hours before/);
    assert.match(reminderText(false), /12 hours and 2 hours/);
    for (const p of ['src/components/booking/BookingConfirmation.tsx', 'src/components/booking/StepReviewSummary.tsx', 'src/student/pages/StudentLessonsPage.tsx']) {
      assert.ok(!/24 hours and 1 hour|24h and 1h|٢٤ ساعة/.test(src(p)), `${p} still states the old reminder times`);
    }
  });
});

// P4-014/015: the amount sits next to the chosen package only; the consent sentence ticks the box.
describe('P4-014/015 checkout', () => {
  it('the package grid folds into one summary line once a package is chosen', () => {
    const s = src('src/components/booking/StepPackageQuantity.tsx');
    assert.ok(s.includes('const folded = Boolean(chosenPackage) && !showAll'));
    assert.ok(s.includes('{!folded && ('));
  });

  it('no consent label hides the terms link inside it', () => {
    for (const p of ['src/components/booking/StepPackageQuantity.tsx', 'src/components/booking/StepReviewSummary.tsx', 'src/student/pages/StudentPackagesPage.tsx']) {
      const s = src(p);
      assert.ok(s.includes('<TermsConsent'), `${p} does not use TermsConsent`);
      assert.ok(!s.includes("'terms and the cancellation & refund policy'"), `${p} still has the link inside the label`);
    }
    const row = src('src/components/booking/TermsConsent.tsx');
    assert.ok(row.indexOf('</label>') < row.indexOf('<a'), 'the terms link must sit outside the label');
  });
});
