import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Section 08-B: Student Profile & Account Visual UX Refinement', () => {
  const profilePagePath = path.join(process.cwd(), 'src/student/pages/StudentProfilePage.tsx');
  const profilePageSource = fs.readFileSync(profilePagePath, 'utf-8');

  it('1. Design System Tokens: Uses semantic tokens for background, surface, text, and borders', () => {
    // Assert semantic tokens are used
    assert.ok(profilePageSource.includes('bg-surface'), 'Must use bg-surface token');
    assert.ok(profilePageSource.includes('bg-surface-subtle'), 'Must use bg-surface-subtle token');
    assert.ok(profilePageSource.includes('text-foreground'), 'Must use text-foreground token');
    assert.ok(profilePageSource.includes('text-muted-foreground'), 'Must use text-muted-foreground token');
    assert.ok(profilePageSource.includes('border-border'), 'Must use border-border token');
    assert.ok(profilePageSource.includes('text-primary'), 'Must use text-primary token');

    // Anti-slop / hardcoded color audit
    assert.ok(!profilePageSource.includes('bg-emerald-'), 'Must not use raw bg-emerald-* classes');
    assert.ok(!profilePageSource.includes('bg-rose-'), 'Must not use raw bg-rose-* classes');
    assert.ok(!profilePageSource.includes('bg-amber-'), 'Must not use raw bg-amber-* classes');
  });

  it('2. RTL & Logical Properties: Uses logical spacing and positioning properties', () => {
    assert.ok(profilePageSource.includes('start-'), 'Must use logical start-* positioning for icons');
    assert.ok(profilePageSource.includes('ps-'), 'Must use logical ps-* padding for inputs');
    assert.ok(profilePageSource.includes('me-'), 'Must use logical me-* margin for buttons');
  });

  it('3. Teacher Relationship: Respectfully presents Ustadh Mahmoud 1-on-1 teaching relationship', () => {
    assert.ok(profilePageSource.includes('Ustadh Mahmoud'), 'Must reference Ustadh Mahmoud');
    assert.ok(profilePageSource.includes('الأستاذ محمود'), 'Must include Arabic name for Ustadh Mahmoud');
    assert.ok(profilePageSource.includes('1-on-1') || profilePageSource.includes('1-على-1'), 'Must highlight 1-on-1 teaching model');
    // Does not include fake messaging or imaginary stats
    assert.ok(!profilePageSource.includes('chatWithTeacher'), 'Must not invent fake teacher chat workflow');
    assert.ok(!profilePageSource.includes('totalLessonsCompleted: 42'), 'Must not invent fake statistics');
  });

  it('4. Accessibility & Touch Targets: Enforces 44px min touch targets and explicit label associations', () => {
    assert.ok(profilePageSource.includes('htmlFor="student-name"'), 'Must have accessible label for student name');
    assert.ok(profilePageSource.includes('id="student-name"'), 'Must have id matching student name label');
    assert.ok(profilePageSource.includes('htmlFor="student-timezone"'), 'Must have accessible label for timezone');
    assert.ok(profilePageSource.includes('id="student-timezone"'), 'Must have id matching timezone label');
    assert.ok(profilePageSource.includes('htmlFor="student-whatsapp"'), 'Must have accessible label for whatsapp');
    assert.ok(profilePageSource.includes('id="student-whatsapp"'), 'Must have id matching whatsapp label');
    assert.ok(profilePageSource.includes('min-h-[44px]'), 'Must enforce minimum 44px touch targets on form controls and buttons');
  });

  it('5. Theme & Language: Uses centralized ThemeProvider and provides bilingual interface controls', () => {
    assert.ok(profilePageSource.includes('useTheme'), 'Must use centralized useTheme hook');
    assert.ok(profilePageSource.includes('toggleTheme'), 'Must provide theme toggle');
    assert.ok(profilePageSource.includes('handleToggleLang'), 'Must provide language toggle handler');
  });

  it('6. Architectural Invariants: Preserves effectiveSession.access_token and student auth endpoints', () => {
    assert.ok(profilePageSource.includes('effectiveSession?.access_token'), 'Must use effectiveSession.access_token');
    assert.ok(profilePageSource.includes('/api/student/me'), 'Must call /api/student/me');
    assert.ok(profilePageSource.includes('/api/student-auth-diagnostic'), 'Must preserve diagnostic endpoint');
    assert.ok(profilePageSource.includes('Authorization: `Bearer ${token}`'), 'Must attach Authorization Bearer header');
    assert.ok(!profilePageSource.includes("localStorage.getItem('token')"), 'No localStorage token extraction');
  });

  it('7. Default Booking Preference: Supports self vs child with disabled guardian gating', () => {
    assert.ok(profilePageSource.includes('bookingPreference'), 'Must manage bookingPreference state');
    assert.ok(profilePageSource.includes('canBookForChild'), 'Must check canBookForChild capability');
    assert.ok(profilePageSource.includes('disabled={!canBookForChild}'), 'Must disable child option if not permitted');
  });
});
