/**
 * ====================================================================
 * WATAZAWWADO — OFFERS & DISCOUNTS TEST SUITE
 * File: test/phase05-offers.test.ts
 *
 * Validates ethical, transparent discounts:
 *  - a discount must represent a real reduction
 *  - no negative/zero/invalid final price
 *  - package savings reflect the genuine bundle benefit
 *  - no fake "was/now" inflation
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeOffer, isLegitimateOffer } from '../server/pricing/offers.js';

describe('Phase 05 — Offers & Discounts', () => {
  it('returns null when there is no legitimate offer', () => {
    const o = computeOffer({ approvedPriceUsd: 8, durationMinutes: 60 });
    assert.equal(o, null);
  });

  it('computes a real package saving for multi-lesson bundles', () => {
    const o = computeOffer({ approvedPriceUsd: 8, durationMinutes: 60, lessonCount: 8 });
    assert.ok(o);
    assert.equal(o!.kind, 'package_savings');
    assert.ok(o!.discount_usd > 0);
    assert.equal(Number((o!.original_price_usd - o!.discount_usd).toFixed(2)), o!.final_price_usd);
    assert.ok(isLegitimateOffer(o!));
  });

  it('caps the package discount at the configured maximum', () => {
    const o = computeOffer({ approvedPriceUsd: 12, durationMinutes: 60, lessonCount: 100 });
    assert.ok(o);
    // max 20% → discount <= 2.40
    assert.ok(o!.discount_usd <= 2.4 + 1e-9);
  });

  it('never yields a zero or negative final price', () => {
    const o = computeOffer({ approvedPriceUsd: 0.01, durationMinutes: 30, lessonCount: 12 });
    // either null or strictly positive final price
    if (o) assert.ok(o.final_price_usd > 0);
  });

  it('rejects invalid/negative approved price', () => {
    assert.equal(computeOffer({ approvedPriceUsd: -5, durationMinutes: 60 }), null);
    assert.equal(computeOffer({ approvedPriceUsd: 0, durationMinutes: 60 }), null);
    assert.equal(computeOffer({ approvedPriceUsd: NaN, durationMinutes: 60 }), null);
  });

  it('does not fabricate a first-lesson discount when the percentage is 0', () => {
    const o = computeOffer({ approvedPriceUsd: 8, durationMinutes: 60, isFirstLesson: true });
    assert.equal(o, null);
  });

  it('computes a first-lesson discount when explicitly configured', () => {
    const o = computeOffer({
      approvedPriceUsd: 12, durationMinutes: 60, isFirstLesson: true,
      config: { firstLessonPercent: 0.15 },
    });
    assert.ok(o);
    assert.equal(o!.kind, 'first_lesson');
    assert.equal(o!.final_price_usd, 10.2);
    assert.ok(isLegitimateOffer(o!));
  });

  it('isLegitimateOffer rejects fake discounts', () => {
    assert.equal(isLegitimateOffer(null as any), false);
    assert.equal(isLegitimateOffer({
      kind: 'first_lesson', label_en: 'x', label_ar: 'x',
      original_price_usd: 8, discount_usd: 0, final_price_usd: 8,
      explanation_en: '', explanation_ar: '',
    } as any), false);
    assert.equal(isLegitimateOffer({
      kind: 'first_lesson', label_en: 'x', label_ar: 'x',
      original_price_usd: 8, discount_usd: 2, final_price_usd: 8, // inconsistent
      explanation_en: '', explanation_ar: '',
    } as any), false);
  });

  it('includes truthful bilingual explanations', () => {
    const o = computeOffer({ approvedPriceUsd: 8, durationMinutes: 60, lessonCount: 4 });
    assert.ok(o);
    assert.ok(o!.explanation_en.length > 0);
    assert.ok(o!.explanation_ar.length > 0);
  });
});
