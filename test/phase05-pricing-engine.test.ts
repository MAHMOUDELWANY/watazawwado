/**
 * ====================================================================
 * WATAZAWWADO — PRICING ENGINE TEST SUITE
 * File: test/phase05-pricing-engine.test.ts
 *
 * Validates the deterministic business rules:
 *  - approved baselines (religious + language)
 *  - exact proportional duration pricing
 *  - level is not the sole determinant
 *  - advanced/specialized/time-sensitive cases route to teacher review
 *    with NO invented number
 *  - unsupported service fails safely
 *  - ability-to-pay / demographics can NEVER influence price
 *    (they are not input fields and are ignored)
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateAssessment,
  baselinePrice,
  resolveBand,
  findForbiddenPricingFields,
  type ServiceAssessment,
} from '../server/pricing/pricingEngine.js';

function base(over: Partial<ServiceAssessment> = {}): ServiceAssessment {
  return {
    service_category: 'quran',
    complexity: 'low',
    preparation_required: 'low',
    customization: 'low',
    specialization: false,
    preferred_duration: 60,
    ...over,
  };
}

describe('Phase 05 — Deterministic Pricing Engine', () => {
  describe('1. Approved baselines', () => {
    it('religious 60/45/30 = 8/6/4', () => {
      assert.equal(baselinePrice('religious', 60), 8);
      assert.equal(baselinePrice('religious', 45), 6);
      assert.equal(baselinePrice('religious', 30), 4);
    });
    it('language 60/45/30 = 12/9/6', () => {
      assert.equal(baselinePrice('language', 60), 12);
      assert.equal(baselinePrice('language', 45), 9);
      assert.equal(baselinePrice('language', 30), 6);
    });
    it('maps categories to bands correctly', () => {
      assert.equal(resolveBand('quran'), 'religious');
      assert.equal(resolveBand('islamic_studies'), 'religious');
      assert.equal(resolveBand('arabic'), 'language');
      assert.equal(resolveBand('english'), 'language');
    });
  });

  describe('2. Standard band produces approved price', () => {
    it('religious standard 60min → $8, no review', () => {
      const r = evaluateAssessment(base({ preferred_duration: 60 }));
      assert.equal(r.recommended_price_usd, 8);
      assert.equal(r.teacher_review_required, false);
      assert.equal(r.tier, 'STANDARD');
    });
    it('language standard 45min → $9, no review', () => {
      const r = evaluateAssessment(base({ service_category: 'english', preferred_duration: 45 }));
      assert.equal(r.recommended_price_usd, 9);
      assert.equal(r.teacher_review_required, false);
    });
    it('religious standard 30min → $4', () => {
      const r = evaluateAssessment(base({ preferred_duration: 30 }));
      assert.equal(r.recommended_price_usd, 4);
    });
  });

  describe('3. Level alone does NOT change price', () => {
    it('advanced level standard stays at baseline', () => {
      const a = evaluateAssessment(base({ current_level: 'advanced', preferred_duration: 60 }));
      const b = evaluateAssessment(base({ current_level: 'beginner', preferred_duration: 60 }));
      assert.equal(a.recommended_price_usd, b.recommended_price_usd);
      assert.equal(a.recommended_price_usd, 8);
    });
  });

  describe('4. Advanced/specialized routes to review with NO invented number', () => {
    it('high complexity → review, null price', () => {
      const r = evaluateAssessment(base({ complexity: 'high' }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
      assert.equal(r.tier, 'SPECIALIZED');
    });
    it('high preparation → review, null price', () => {
      const r = evaluateAssessment(base({ preparation_required: 'high' }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
    });
    it('high customization → review, null price', () => {
      const r = evaluateAssessment(base({ customization: 'high' }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
    });
    it('specialization true → review, null price', () => {
      const r = evaluateAssessment(base({ specialization: true }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
    });
    it('material time sensitivity → review, null price', () => {
      const r = evaluateAssessment(base({ time_sensitive: true }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
      assert.equal(r.tier, 'ELEVATED');
    });
    it('IELTS-style specialized language case routes to review', () => {
      const r = evaluateAssessment(base({
        service_category: 'english',
        learning_goal: 'IELTS preparation',
        current_level: 'intermediate',
        target_level: 'advanced',
        specific_skills: ['speaking', 'writing'],
        complexity: 'high',
        preparation_required: 'high',
        customization: 'high',
        specialization: true,
        time_sensitive: true,
      }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
      assert.equal(r.band, 'language');
    });
  });

  describe('5. Fail closed on unsupported inputs', () => {
    it('unknown category → review, no price', () => {
      const r = evaluateAssessment(base({ service_category: 'astrophysics' as any }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
      assert.ok(r.reasons.some((x) => x.includes('unsupported_service_category')));
    });
    it('missing/unsupported duration → review, no price', () => {
      const r = evaluateAssessment(base({ preferred_duration: 90 as any }));
      assert.equal(r.teacher_review_required, true);
      assert.equal(r.recommended_price_usd, null);
      assert.ok(r.reasons.some((x) => x.includes('unsupported_or_missing_duration')));
    });
  });

  describe('6. Ability to pay / demographics can never influence price', () => {
    it('forbidden pricing fields are detected', () => {
      const found = findForbiddenPricingFields({ ability_to_pay: 'high', wealth: 'rich', price: 5 });
      assert.ok(found.includes('ability_to_pay'));
      assert.ok(found.includes('wealth'));
      assert.ok(found.includes('price'));
    });
    it('extra untrusted keys on the assessment do not change the result', () => {
      const withDemographics: any = base({ preferred_duration: 60 });
      withDemographics.ability_to_pay = 'high';
      withDemographics.country = 'wealthy-country';
      withDemographics.willingness_to_pay = 999;
      const r = evaluateAssessment(withDemographics);
      assert.equal(r.recommended_price_usd, 8);
      assert.equal(r.teacher_review_required, false);
    });
  });

  describe('7. Determinism', () => {
    it('same input yields identical output', () => {
      const a = evaluateAssessment(base({ preferred_duration: 45 }));
      const b = evaluateAssessment(base({ preferred_duration: 45 }));
      assert.deepEqual(a, b);
    });
  });
});
