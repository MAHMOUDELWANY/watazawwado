/**
 * BACKLOG MK-01 to MK-04 (brand and growth strategy, owner 2026-11-12):
 * MK-01 $10 list price + founding code limit, MK-02 retention bonus, MK-03 About credentials, MK-04 homepage copy.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { APPROVED_HOURLY_RATES, baselinePrice, lessonFeeUsd } from '../server/pricing/pricingEngine.js';
import { checkCodeEligibility, computeCheckout, type DiscountCode } from '../server/pricing/discounts.js';
import { summarizeQuarter, quarterRange, currentQuarter, fullPriceList, type RetentionLesson } from '../server/payroll/retention.js';
import { LESSON_UNIT_USD } from '../server/routes/sponsorship.js';

const read = (p: string) => fs.readFileSync(p, 'utf8');

describe('MK-01: $10 an hour for Quran, Tajweed and Islamic studies', () => {
  it('prices the band at $10 and keeps languages at $13', () => {
    assert.equal(APPROVED_HOURLY_RATES.religious, 10);
    assert.equal(APPROVED_HOURLY_RATES.language, 13);
    assert.equal(baselinePrice('religious', 30), 5);
    assert.equal(baselinePrice('religious', 45), 7.5);
    assert.equal(baselinePrice('religious', 60), 10);
    assert.equal(lessonFeeUsd(10, 30), 5);
    assert.equal(LESSON_UNIT_USD, 5);
  });

  it('moves the services, packages and credits in one migration', () => {
    const sql = read('supabase/migrations/20261112000000_price_10_and_founding_code.sql');
    assert.match(sql, /UPDATE public\.services SET hourly_rate_usd = 10\.00 WHERE hourly_rate_usd = 9\.00/);
    assert.match(sql, /\(4, 9\.50::numeric\), \(8, 9\.25\), \(12, 9\.00\)/);
    assert.match(sql, /SET is_active = false/);
    assert.match(sql, /jsonb_set\(metadata, '\{hourly_rate\}', '10'::jsonb\)/);
    assert.match(sql, /max_accounts IS NOT NULL AND v_used = 0/);
    assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.apply_checkout_discount_atomic.*TO service_role/);
  });

  it('shows no $9 price on public pages, terms, SEO or the AI facts', () => {
    for (const f of [
      'src/components/public/pricing/PricingPage.tsx', 'src/components/public/homepage/PublicHomepage.tsx',
      'src/components/public/terms/TermsPage.tsx', 'src/data/seo.ts', 'src/data/subjectPages.ts',
      'src/components/booking/StepReviewSummary.tsx', 'server/siteFacts.ts', 'src/booking/mockData.ts',
    ]) {
      const s = read(f);
      // "$9" alone is now a real package price ($9.00 an hour for 12 lessons), so look for the old list-price wording.
      assert.doesNotMatch(s, /\$9 an hour|\$9\/h|\b9\$ للساعة|٩\$|٩ دولار|\b9 دولار|hourlyRateUsd: 9\b|[Ff]rom \$9/, f);
    }
    assert.match(read('api/index.ts'), /TERMS_VERSION = '2026-11-12\.1'/);
  });

  const founding: DiscountCode = {
    id: 'f', code: 'FOUNDING15', discount_type: 'percent', value: 15, applies_to: 'all', first_purchase_only: false,
    min_amount_usd: 0, max_redemptions: null, max_per_account: 1000, max_accounts: 20, starts_at: null, ends_at: null,
    is_gift: false, is_active: true,
  };
  const ctx = { targetType: 'booking' as const, baseAmount: 10, hasPaidBefore: true };

  it('the founding code takes the first 20 families, who keep it all year', () => {
    assert.equal(checkCodeEligibility(founding, { ...ctx, usedAccounts: 19, usedByAccount: 0 }), null);
    assert.equal(checkCodeEligibility(founding, { ...ctx, usedAccounts: 20, usedByAccount: 0 }), 'USED_UP');
    assert.equal(checkCodeEligibility(founding, { ...ctx, usedAccounts: 20, usedByAccount: 37 }), null);
    assert.equal(computeCheckout({ listAmount: 10, baseAmount: 10, code: founding, capPercent: 25 }).finalAmount, 8.5);
  });

  it('stays inside the 25% cap on top of package and sibling savings', () => {
    // 12-lesson package at $9.00 (list $10) for a second child: 108 × 0.95 = 102.60, list 120, cap 30 → 17.40 left.
    const r = computeCheckout({ listAmount: 120, baseAmount: 102.6, code: founding, capPercent: 25 });
    assert.equal(r.codeCapped, true);
    assert.equal(r.finalAmount, 90);
  });
});

describe('MK-02: quarterly retention bonus', () => {
  const lesson = (over: Partial<RetentionLesson>): RetentionLesson => ({
    studentId: 's1', learnerName: 'A', scheduledStart: '2026-10-05T10:00:00Z', durationMinutes: 60, status: 'completed',
    bookingType: 'regular', packageEntitlementId: null, feeUsd: 10, redemption: null, ...over,
  });

  it('reads quarters', () => {
    assert.deepEqual(quarterRange('2026-Q4'), { start: '2026-10-01T00:00:00.000Z', end: '2027-01-01T00:00:00.000Z' });
    assert.equal(quarterRange('2026-Q5'), null);
    assert.equal(currentQuarter(new Date('2026-11-12T00:00:00Z')), '2026-Q4');
  });

  it('counts only full-price held lessons toward the pool (10% of list)', () => {
    assert.equal(fullPriceList(lesson({})), 10);
    assert.equal(fullPriceList(lesson({ packageEntitlementId: 'p' })), null);
    assert.equal(fullPriceList(lesson({ bookingType: 'trial', feeUsd: 0 })), null);
    assert.equal(fullPriceList(lesson({ status: 'cancelled' })), null);
    assert.equal(fullPriceList(lesson({ feeUsd: 8.5, redemption: { listAmount: 10, discountAmount: 1.5 } })), null);
    // Balance is money, not a discount.
    assert.equal(fullPriceList(lesson({ feeUsd: 5, redemption: { listAmount: 10, discountAmount: 0 } })), 10);
  });

  it('builds the summary: learners, leavers, hours, pool and the minimum', () => {
    const now = new Date('2027-01-20T00:00:00Z');
    const lessons = [
      lesson({ studentId: 's1' }), lesson({ studentId: 's1', scheduledStart: '2026-12-20T10:00:00Z' }),
      lesson({ studentId: 's2', durationMinutes: 30, feeUsd: 5 }),
      lesson({ studentId: 's3', packageEntitlementId: 'p' }),
      lesson({ studentId: 's4', bookingType: 'trial', feeUsd: 0 }),
    ];
    const s = summarizeQuarter({
      quarter: '2026-Q4', lessons, minLearners: 3, now, laterStudentIds: new Set(['s1']),
      moves: [{ studentId: 's3', learnerName: 'C', reasonType: 'times', initiator: 'family', decidedAt: '2026-11-01T00:00:00Z' }],
    });
    assert.equal(s.learnersTaught, 3);
    assert.equal(s.meetsMinimum, true);
    assert.equal(s.fullPriceLessons, 3);
    assert.equal(s.fullPriceHours, 2.5);
    assert.equal(s.poolUsd, 2.5);
    assert.deepEqual(s.leavers.map((l) => [l.studentId, l.why]), [['s3', 'moved'], ['s2', 'stopped']]);
  });

  it('is super admin only and paid through the monthly bonus; teachers accept the new agreement', () => {
    const routes = read('server/routes/retentionBonus.ts');
    assert.doesNotMatch(read('server/routes/payroll.ts'), /fee_amount_usd/);
    assert.match(read('api/index.ts'), /registerRetentionBonusRoutes\(app, \{/);
    assert.match(routes, /app\.get\('\/api\/dashboard\/payroll\/retention', deps\.verifyTeacherAuth, deps\.requireSuperAdmin/);
    assert.match(routes, /app\.put\('\/api\/dashboard\/payroll\/retention\/settings', deps\.rateLimit, deps\.verifyTeacherAuth, deps\.requireSuperAdmin/);
    assert.match(read('src/dashboard/components/RetentionBonus.tsx'), /\/api\/dashboard\/payroll\/adjustments/);
    assert.match(read('api/index.ts'), /TEACHER_AGREEMENT_VERSION = '2026-11-12\.1'/);
    const agreement = read('src/pages/StaffAgreementPage.tsx');
    assert.match(agreement, /AGREEMENT_VERSION = '2026-11-12\.1'/);
    assert.match(agreement, /retention bonus/);
    assert.doesNotMatch(agreement, /10%|full-price/);
  });
});

describe('MK-03: About page credentials', () => {
  it('states the approved proof, and nothing it forbids', () => {
    const about = read('src/components/public/about/AboutPage.tsx');
    for (const s of ["Hafs 'an 'Asim", 'Al-Azhar secondary school', '100+ students in person and about 25 online', "Currently studying the seven Qira'at", 'برواية حفص عن عاصم', 'القراءات السبع']) {
      assert.ok(about.includes(s), s);
    }
    for (const f of ['src/components/public/about/AboutPage.tsx', 'server/siteFacts.ts']) assert.doesNotMatch(read(f), /Preply|C1 English|institute/i, f);
  });
});

describe('MK-04: homepage copy', () => {
  it('drops the kicker and adds the sub-line, the caption and the young-adult line', () => {
    const home = read('src/components/public/homepage/PublicHomepage.tsx');
    assert.doesNotMatch(home, /Online 1-on-1 classes/);
    assert.match(home, /Provision that lasts/);
    assert.match(home, /Pick your teacher from real profiles\. After every class, we tell you how it went, before you have to ask\./);
    assert.match(read('src/components/public/homepage/TeacherDuo.tsx'), /See each teacher's story before you book\./);
    assert.match(read('src/components/public/homepage/TwoWays.tsx'), /Drifted\? Start where you are\. No lectures\./);
  });
});
