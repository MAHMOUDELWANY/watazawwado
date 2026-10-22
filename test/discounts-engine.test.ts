/**
 * Discount codes, account balance and the savings cap (server/pricing/discounts.ts).
 * Owner decisions 2026-10-22, RULES.md §4.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  computeCheckout,
  checkCodeEligibility,
  parseGrowthSettings,
  validateGrowthSettings,
  normalizeCode,
  generateReferralCode,
  describeCode,
  rejectionFromRpcMessage,
  DEFAULT_GROWTH_SETTINGS,
  type DiscountCode,
} from '../server/pricing/discounts.js';

function code(over: Partial<DiscountCode> = {}): DiscountCode {
  return {
    id: 'c1',
    code: 'WELCOME',
    discount_type: 'percent',
    value: 10,
    applies_to: 'all',
    first_purchase_only: false,
    min_amount_usd: 0,
    max_redemptions: null,
    max_per_account: 1,
    starts_at: null,
    ends_at: null,
    is_gift: false,
    is_active: true,
    ...over,
  };
}

describe('computeCheckout', () => {
  it('applies a percent code to the stored price', () => {
    const r = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ value: 10 }) });
    assert.equal(r.codeDiscount, 0.9);
    assert.equal(r.finalAmount, 8.1);
    assert.equal(r.codeCapped, false);
  });

  it('applies a fixed code and never goes below zero', () => {
    const r = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ discount_type: 'fixed', value: 3 }), capPercent: 50 });
    assert.equal(r.finalAmount, 6);
    // With the default 25% cap a $3 code on a $9 lesson gives $2.25.
    assert.equal(computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ discount_type: 'fixed', value: 3 }) }).finalAmount, 6.75);
    const big = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ discount_type: 'fixed', value: 50, is_gift: true }) });
    assert.equal(big.codeDiscount, 9);
    assert.equal(big.finalAmount, 0);
  });

  it('stacks on package and family savings but keeps total savings within the cap', () => {
    // 8 x 60 min at $9: list 72, package price 66, family 5% -> 62.70 (savings 9.30 = 12.9%).
    const r = computeCheckout({ listAmount: 72, baseAmount: 62.7, code: code({ value: 20 }), capPercent: 25 });
    // Cap room: 72 * 25% = 18 - 9.30 = 8.70; a 20% code would be 12.54.
    assert.equal(r.priorSavings, 9.3);
    assert.equal(r.codeDiscount, 8.7);
    assert.equal(r.codeCapped, true);
    assert.equal(r.finalAmount, 54);
  });

  it('gives no code discount when existing savings already reach the cap', () => {
    const r = computeCheckout({ listAmount: 100, baseAmount: 70, code: code({ value: 10 }), capPercent: 25 });
    assert.equal(r.codeDiscount, 0);
    assert.equal(r.codeCapped, true);
    assert.equal(r.finalAmount, 70);
  });

  it('lets a gift code go past the cap and cover the whole price', () => {
    const r = computeCheckout({ listAmount: 72, baseAmount: 66, code: code({ value: 100, is_gift: true }), capPercent: 25 });
    assert.equal(r.codeDiscount, 66);
    assert.equal(r.finalAmount, 0);
    assert.equal(r.codeCapped, false);
  });

  it('uses account balance after the code, outside the cap', () => {
    const r = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ value: 10 }), walletBalance: 5 });
    assert.equal(r.creditUsed, 5);
    assert.equal(r.finalAmount, 3.1);
  });

  it('can pay the whole price from balance', () => {
    const r = computeCheckout({ listAmount: 4.5, baseAmount: 4.5, walletBalance: 10 });
    assert.equal(r.creditUsed, 4.5);
    assert.equal(r.finalAmount, 0);
  });

  it('skips balance when the family turns it off', () => {
    const r = computeCheckout({ listAmount: 9, baseAmount: 9, walletBalance: 10, useCredit: false });
    assert.equal(r.creditUsed, 0);
    assert.equal(r.finalAmount, 9);
  });

  it('never leaves a remainder under Stripe minimum', () => {
    const r = computeCheckout({ listAmount: 9, baseAmount: 9, walletBalance: 8.8 });
    assert.equal(r.finalAmount, 0.5);
    assert.equal(r.creditUsed, 8.5);
    const g = computeCheckout({ listAmount: 9, baseAmount: 9, code: code({ discount_type: 'fixed', value: 8.7, is_gift: true }) });
    assert.equal(g.finalAmount, 0);
    assert.equal(g.waived, 0.3);
  });

  it('keeps base - discount - credit = final, to the cent', () => {
    for (const base of [4.5, 6.75, 9, 13, 33, 62.7, 138]) {
      for (const pct of [5, 12.5, 33, 100]) {
        for (const wallet of [0, 1.11, 5, 200]) {
          const r = computeCheckout({ listAmount: base * 1.1, baseAmount: base, code: code({ value: pct }), walletBalance: wallet, capPercent: 30 });
          assert.equal(Math.round((r.baseAmount - r.codeDiscount - r.creditUsed) * 100), Math.round(r.finalAmount * 100));
          assert.ok(r.finalAmount === 0 || r.finalAmount >= 0.5);
        }
      }
    }
  });
});

describe('checkCodeEligibility', () => {
  const ctx = { targetType: 'booking' as const, baseAmount: 9, hasPaidBefore: false, now: new Date('2026-11-01T00:00:00Z') };

  it('accepts a valid code', () => assert.equal(checkCodeEligibility(code(), ctx), null));
  it('rejects unknown, inactive, early and expired codes', () => {
    assert.equal(checkCodeEligibility(null, ctx), 'NOT_FOUND');
    assert.equal(checkCodeEligibility(code({ is_active: false }), ctx), 'NOT_ACTIVE');
    assert.equal(checkCodeEligibility(code({ starts_at: '2026-12-01T00:00:00Z' }), ctx), 'NOT_STARTED');
    assert.equal(checkCodeEligibility(code({ ends_at: '2026-10-31T00:00:00Z' }), ctx), 'EXPIRED');
  });
  it('respects scope', () => {
    assert.equal(checkCodeEligibility(code({ applies_to: 'packages' }), ctx), 'WRONG_ITEM');
    assert.equal(checkCodeEligibility(code({ applies_to: 'lessons' }), { ...ctx, targetType: 'package' }), 'WRONG_ITEM');
  });
  it('respects first purchase, minimum and limits', () => {
    assert.equal(checkCodeEligibility(code({ first_purchase_only: true }), { ...ctx, hasPaidBefore: true }), 'FIRST_PURCHASE_ONLY');
    assert.equal(checkCodeEligibility(code({ min_amount_usd: 20 }), ctx), 'MIN_AMOUNT');
    assert.equal(checkCodeEligibility(code({ max_redemptions: 3 }), { ...ctx, usedTotal: 3 }), 'USED_UP');
    assert.equal(checkCodeEligibility(code({ max_per_account: 2 }), { ...ctx, usedByAccount: 2 }), 'ALREADY_USED');
  });
});

describe('settings and helpers', () => {
  it('falls back to defaults field by field', () => {
    assert.deepEqual(parseGrowthSettings(null), DEFAULT_GROWTH_SETTINGS);
    assert.equal(parseGrowthSettings({ savings_cap_percent: 300 }).savings_cap_percent, 100);
    assert.equal(parseGrowthSettings({ friend_credit_usd: '7' }).friend_credit_usd, 7);
  });
  it('validates admin updates', () => {
    assert.equal(validateGrowthSettings(DEFAULT_GROWTH_SETTINGS), null);
    assert.ok(validateGrowthSettings({ ...DEFAULT_GROWTH_SETTINGS, savings_cap_percent: -1 }));
    assert.ok(validateGrowthSettings({ ...DEFAULT_GROWTH_SETTINGS, max_rewards_per_year: 2.5 }));
  });
  it('normalizes codes', () => assert.equal(normalizeCode(' ramadan 10 '), 'RAMADAN10'));
  it('makes readable referral codes', () => {
    const c = generateReferralCode('Amina Yusuf', () => 0);
    assert.equal(c, 'AMINAYAAAA');
    assert.match(generateReferralCode('محمد'), /^WZ[A-Z2-9]{4}$/);
  });
  it('describes codes in both languages', () => {
    const c = { discount_type: 'percent' as const, value: 15, applies_to: 'packages' as const, first_purchase_only: true, ends_at: null };
    assert.equal(describeCode(c, 'en'), '15% off packages, first purchase only');
    assert.equal(describeCode(c, 'ar'), 'خصم 15% على الباقات، لأول شراء');
  });
  it('maps locked-limit errors', () => {
    assert.equal(rejectionFromRpcMessage('CODE_USED_UP'), 'USED_UP');
    assert.equal(rejectionFromRpcMessage('other'), null);
  });
});
