import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAge, isAdultAge, isGuardianAge, isChildAge, signupAgeProblem } from '../src/lib/ageRules';
import { newStudentDetails } from '../server/onboarding/newStudent';

test('parseAge accepts whole numbers typed as digits or sent as numbers', () => {
  assert.equal(parseAge('9'), 9);
  assert.equal(parseAge(' 24 '), 24);
  assert.equal(parseAge(41), 41);
  assert.equal(parseAge(''), null);
  assert.equal(parseAge('9.5'), null);
  assert.equal(parseAge('-3'), null);
  assert.equal(parseAge('ten'), null);
});

test('a typed child age passes (regression: "Please enter the age of child #1" with an age entered)', () => {
  assert.equal(isChildAge('9'), true);
});

test('children are 6 to 17', () => {
  assert.equal(isChildAge('5'), false);
  assert.equal(isChildAge('6'), true);
  assert.equal(isChildAge('17'), true);
  assert.equal(isChildAge('18'), false);
});

test('personal accounts and guardians are 18 or over', () => {
  assert.equal(isAdultAge('17'), false);
  assert.equal(isAdultAge('18'), true);
  assert.equal(isGuardianAge(16), false);
  assert.equal(isGuardianAge('35'), true);
  assert.equal(isGuardianAge('101'), false);
});

test('sign-up gate: a personal account must confirm 18+, a family account needs a guardian aged 18+', () => {
  assert.equal(signupAgeProblem({ accountType: 'self', confirmedAdult: false }), 'confirm_adult');
  assert.equal(signupAgeProblem({ accountType: 'self', confirmedAdult: true }), null);
  assert.equal(signupAgeProblem({ accountType: 'family', guardianAge: '15' }), 'guardian_age');
  assert.equal(signupAgeProblem({ accountType: 'family', guardianAge: '' }), 'guardian_age');
  assert.equal(signupAgeProblem({ accountType: 'family', guardianAge: '40' }), null);
});

test('teacher email lists the account and each child it will teach', () => {
  const rows = newStudentDetails(
    { ownerUserId: 'u1', name: 'Amina', email: 'a@example.com', whatsapp: '+441234', country: 'GB', timezone: 'Europe/London', isFamily: true, guardianAge: 38 },
    [
      { name: 'Yusuf', age: 9, gender: 'male', subject: 'tajweed', level: 'beginner', notes: 'shy', teacherId: 't1' },
      { name: 'Maryam', age: 7, gender: 'female', subject: 'quran-reading', level: 'beginner', teacherId: 't1' }
    ]
  );
  const flat = rows.map(([en, , v]) => `${en}=${v ?? ''}`);
  assert.ok(flat.includes('Parent / guardian=Amina'));
  assert.ok(flat.includes('Guardian age=38'));
  assert.ok(flat.includes('Child 1=Yusuf · 9 · male'));
  assert.ok(flat.includes('Child 2: subject=quran-reading · beginner'));
  assert.ok(flat.includes('Child 1: notes=shy'));
  // Teachers never get the family's contact details (owner, 2026-10-28).
  assert.ok(flat.includes('Email=') && flat.includes('WhatsApp='));
});

test('admin email has contact details and the chosen teacher of each learner', () => {
  const rows = newStudentDetails(
    { ownerUserId: 'u1', name: 'Omar', email: 'o@example.com', whatsapp: '+441234', country: 'GB', timezone: 'Europe/London', isFamily: false },
    [{ name: 'Omar', age: 30, gender: 'male', subject: 'arabic', level: 'beginner', teacherId: 't1' }],
    { forAdmin: true, teacherName: (id) => (id === 't1' ? 'Ustadh Ali' : null) }
  );
  const flat = rows.map(([en, , v]) => `${en}=${v ?? ''}`);
  assert.ok(flat.includes('Email=o@example.com'));
  assert.ok(flat.includes('WhatsApp=+441234'));
  assert.ok(flat.includes('Learner: teacher=Ustadh Ali'));
});
