import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getLessonStart } from '../src/student/lessonsPresentation.js';

// P4-001: Home showed 6:00 PM for a lesson the Lessons page showed at 5:00 PM London, because Home formatted the
// start in the device's zone. Every shown lesson time must be in the account's zone, whatever the device says.
describe('P4-001 lesson start in the account zone', () => {
  const booking = { scheduledStart: '2026-11-16T17:00:00.000Z' };

  it('shows the same wall clock for the account zone, not the device zone', () => {
    assert.equal(getLessonStart(booking, 'Europe/London')?.toFormat('HH:mm'), '17:00');
    assert.equal(getLessonStart(booking, 'America/New_York')?.toFormat('HH:mm'), '12:00');
    assert.equal(getLessonStart(booking, 'Europe/Warsaw')?.toFormat('HH:mm'), '18:00');
  });

  it('keeps the old behaviour without a zone and rejects bad input', () => {
    assert.equal(getLessonStart(booking)?.toMillis(), Date.parse(booking.scheduledStart));
    assert.equal(getLessonStart({ scheduledStart: 'not a date' }, 'Europe/London'), null);
    assert.equal(getLessonStart({}, 'Europe/London'), null);
  });

  it('Home formats every lesson time through the account zone', () => {
    const src = readFileSync(new URL('../src/student/pages/StudentHomePage.tsx', import.meta.url), 'utf8');
    // Times shown on Home go through getLessonStart(..., getActiveWorkingTimezone()), never a bare fromISO.
    assert.ok(!/DateTime\.fromISO\([^)]*\)\s*\.setLocale/.test(src), 'a lesson time is formatted without a zone');
    assert.ok((src.match(/getLessonStart\([^)]*getActiveWorkingTimezone\(\)\)/g) || []).length >= 3);
  });
});

// P4-002: right after onboarding the portal kept the sign-up row's zone (UTC) until a reload, so a New York family
// picked its first trial on a UTC clock. Onboarding must make the zone it just saved the active one.
describe('P4-002 onboarding sets the chosen zone at once', () => {
  it('calls setActiveWorkingTimezone with the saved zone when onboarding succeeds', () => {
    const src = readFileSync(new URL('../src/student/pages/StudentOnboardingPage.tsx', import.meta.url), 'utf8');
    const ok = src.indexOf('setCompletedSuccess(true);');
    const set = src.indexOf('setActiveWorkingTimezone(data.profile?.timezone || timezone)');
    assert.ok(ok > 0 && set > ok && set - ok < 300, 'onboarding success does not set the active zone');
  });
});
