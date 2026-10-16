import { test } from 'node:test';
import assert from 'node:assert/strict';
import { firstName, welcomeGreeting, markJustSignedIn, consumeJustSignedIn } from '../src/components/ui/WelcomeLoader';

test('firstName skips titles, emails and placeholders', () => {
  assert.equal(firstName('Ustadh Mahmoud Elwany'), 'Mahmoud');
  assert.equal(firstName('الأستاذة  أفنان'), 'أفنان');
  assert.equal(firstName('sara@example.com'), null);
  assert.equal(firstName('Student'), null);
  assert.equal(firstName('  '), null);
  assert.equal(firstName(undefined), null);
});

test('student greeting, with and without a name', () => {
  assert.deepEqual(welcomeGreeting({ role: 'student', lang: 'ar', name: 'Yusuf Ali' }), { title: 'أهلاً يا Yusuf', subtitle: 'بنجهّزلك ركنك…' });
  assert.equal(welcomeGreeting({ role: 'student', lang: 'en', name: 'Yusuf Ali' }).title, 'Welcome back, Yusuf.');
  assert.equal(welcomeGreeting({ role: 'student', lang: 'en', name: null }).title, 'Welcome back.');
  assert.equal(welcomeGreeting({ role: 'student', lang: 'ar' }).title, 'أهلاً وسهلاً');
});

test('teacher greeting follows gender, neutral when unknown', () => {
  assert.equal(welcomeGreeting({ role: 'teacher', lang: 'ar', name: 'محمود', gender: 'male' }).title, 'أهلاً أستاذ محمود');
  assert.equal(welcomeGreeting({ role: 'teacher', lang: 'ar', name: 'أفنان', gender: 'female' }).title, 'أهلاً أستاذة أفنان');
  assert.equal(welcomeGreeting({ role: 'teacher', lang: 'ar', name: 'أفنان' }).title, 'أهلاً أفنان');
  assert.equal(welcomeGreeting({ role: 'teacher', lang: 'ar', name: 'أفنان' }).subtitle, 'طلابك مستنيينك');
});

test('admin greeting has its own line', () => {
  assert.notEqual(welcomeGreeting({ role: 'admin', lang: 'en', name: 'Mahmoud' }).subtitle, welcomeGreeting({ role: 'teacher', lang: 'en', name: 'Mahmoud' }).subtitle);
});

test('sign-in flag is used once and expires', () => {
  const store = new Map<string, string>();
  (globalThis as any).sessionStorage = {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  };
  assert.equal(consumeJustSignedIn(), false);
  markJustSignedIn();
  assert.equal(consumeJustSignedIn(), true);
  assert.equal(consumeJustSignedIn(), false, 'second navigation must not hold');
  markJustSignedIn();
  assert.equal(consumeJustSignedIn(Date.now() + 120_000), false, 'an old sign-in does not hold');
  delete (globalThis as any).sessionStorage;
});
