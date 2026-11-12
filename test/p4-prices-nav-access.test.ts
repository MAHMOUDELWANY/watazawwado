import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const src = (p: string) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

// P4-016/017: prices first, no loops.
describe('P4-016/017 prices first', () => {
  it('pricing shows both hourly prices up top and packages for 30, 45 and 60 minutes', async () => {
    const page = src('src/components/public/pricing/PricingPage.tsx');
    assert.ok(page.includes('data-testid="pricing-headline"'));
    assert.ok(page.includes('([30, 45, 60] as Minutes[])'));
    assert.ok(page.includes('useState<Minutes>(30)'));
    const { plansFor } = await import('../src/components/public/pricing/PricingPage.js');
    // Same price per minute as the live catalog: 4 x 30 min Quran = $19, 8 x 30 = $37; 4 x 45 Arabic = $36.75.
    assert.equal(plansFor(10, 30)[0].en.total.startsWith('$19 for 4'), true);
    assert.equal(plansFor(10, 30)[1].en.total.startsWith('$37 for 8'), true);
    assert.equal(plansFor(13, 45)[0].en.total.startsWith('$36.75 for 4'), true);
    assert.equal(plansFor(10, 30)[0].en.perLesson, '$4.75');
  });

  it('"Book with a new package" starts a paid booking instead of an old draft, and a draft follows the zone', () => {
    assert.ok(src('src/student/pages/StudentPackagesPage.tsx').includes('to="/student/book?mode=package"'));
    const page = src('src/student/pages/StudentBookingPage.tsx');
    assert.ok(page.includes("if (wantsPackage) { clearBookingDraft(); return false; }"));
    assert.ok(src('src/components/booking/BookingFlow.tsx').includes('const rezone = Boolean(zone && !draft.pendingBooking'));
  });
});

// P4-020/035: one labelled navigation.
describe('P4-020/035 one navigation', () => {
  it('the portal has no unlabelled rail; the other pages sit in a labelled More menu', () => {
    const app = src('src/student/StudentApp.tsx');
    assert.ok(!app.includes('id="student-rail"'));
    assert.ok(app.includes('<DesktopMoreMenu items={desktopMoreItems}'));
    assert.ok(src('src/student/components/DesktopMoreMenu.tsx').includes('<span className="flex-1">{item.name}</span>'));
  });

  it('the dashboard menu shows names and group headings; the admin queue covers people, not only money', () => {
    const dash = src('src/dashboard/DashboardApp.tsx');
    assert.ok(dash.includes('<span className="relative truncate">{item.name}</span>'));
    assert.ok(dash.includes('{item.group}</span>}'));
    const api = src('api/index.ts');
    for (const key of ['teacher_changes', 'trials_24h', 'intakes', 'waitlist']) assert.ok(api.includes(`key: '${key}'`), key);
  });
});

// P4-022/024/029/037: access for everyone.
describe('P4-022/024/029/037 access', () => {
  it('a skip link comes first; the recitation never starts on a key press and stops on Escape', () => {
    const layout = src('src/components/public/layout/PublicLayout.tsx');
    assert.ok(layout.indexOf('data-testid="skip-link"') < layout.indexOf('<Navbar'));
    assert.ok(layout.includes('id="site-content"'));
    const rec = src('src/components/public/WelcomeRecitation.tsx');
    assert.ok(rec.includes("const EVENTS = ['touchend', 'pointerup', 'click'] as const;"));
    assert.ok(rec.includes("(prefers-reduced-motion: reduce)"));
    assert.ok(rec.includes("e.key === 'Escape'"));
    assert.ok(src('src/components/public/homepage/WeekWithUs.tsx').includes('aria-label={isEn ? `Step ${i + 1} of ${STEPS.length}'));
  });

  it('44 px targets, wrapping buttons, and a teen asks a parent instead of becoming one', () => {
    assert.ok(src('src/components/StudentAuthModal.tsx').includes('flex items-start gap-3 min-h-11 py-1 cursor-pointer select-none'));
    assert.ok(src('src/components/ui/TimezoneCheck.tsx').includes('flex flex-wrap gap-2'));
    const onb = src('src/student/pages/StudentOnboardingPage.tsx');
    assert.ok(onb.includes('data-testid="ask-parent-to-join"'));
    assert.ok(!onb.includes("'Switch to a family account'"));
  });
});
