import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyInput, emptyDigits } from '../src/components/auth/otpLogic.js';
import { SUBJECT_MEANING_EN } from '../src/components/onboarding/subjects.js';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// P4-025/026/027: a child's way in.
describe('P4-025/026/027 a child gets in on their own', () => {
  it('the code option sits inside the sign-in dialog, before the email field', () => {
    const s = src('src/components/StudentAuthModal.tsx');
    const kid = s.indexOf('data-testid="kid-code-entry"');
    assert.ok(kid > 0 && kid < s.indexOf('htmlFor="auth-email"'));
  });

  it('six quick keys land in six boxes', () => {
    // The card applies every key to the newest digits (digitsRef), so a quick second key is not lost.
    let d = emptyDigits(6);
    let focus = 0;
    for (const k of '457150') ({ digits: d, focus } = applyInput(d, focus, k));
    assert.equal(d.join(''), '457150');
    const card = src('src/components/auth/OtpVerificationCard.tsx');
    assert.ok(card.includes('applyInput(digitsRef.current, i, value)'));
    assert.ok(!card.includes('setTimeout(() => inputRefs.current[i]?.select(), 0)'), 'focus still moves on a timer');
  });

  it('the kid space has no booking buttons and no grown-up progress card', () => {
    const cur = src('src/student/pages/StudentCurriculumPage.tsx');
    assert.ok(cur.includes("useLocation().pathname.startsWith('/kid')"));
    // The only booking button is inside BookOrAskParent, which shows words instead on /kid.
    assert.equal(cur.split("<Button onClick={() => navigate('/student/book')}").length - 1, 1);
    assert.ok(!src('src/kid/KidApp.tsx').includes('<HomeProgressCard'));
    assert.ok(src('src/components/ui/MobileTabBar.tsx').includes('text-[12.5px]'));
  });
});

// P4-010/031/032: one voice, meanings first.
describe('P4-010/031/032 plain words', () => {
  it('admin-tool labels are gone from onboarding, booking and home', () => {
    const files = ['src/student/pages/StudentOnboardingPage.tsx', 'src/components/booking/StepReviewSummary.tsx', 'src/student/pages/StudentHomePage.tsx', 'src/components/ui/CountryTimezonePicker.tsx', 'src/components/booking/BookingConfirmation.tsx'];
    const banned = ['Child(ren)', 'Instructors Breakdown', 'Selected Discipline', 'Session Investment', "'Instructor:'", "'Track:'", 'Auto-sets timezone', 'Review & Confirm Profile', 'logged for your local schedule'];
    for (const f of files) for (const b of banned) assert.ok(!src(f).includes(b), `${f} still says ${b}`);
  });

  it('Arabic subject names come with their meaning, and a newcomer has a door', () => {
    for (const id of ['tajweed', 'quran-memorization', 'zad-essentials', 'seerah', 'modern-standard-arabic']) assert.ok(SUBJECT_MEANING_EN[id]);
    assert.ok(!src('src/booking/mockData.ts').includes('Makhaarij, Sifaat'));
    assert.ok(src('src/components/public/homepage/PublicHomepage.tsx').includes('<NewToIslamDoor'));
    assert.ok(src('src/components/public/learning/LearningPage.tsx').includes("get('family')"));
    assert.ok(!src('src/booking/mockData.ts').includes('My child knows nothing yet'));
  });
});
