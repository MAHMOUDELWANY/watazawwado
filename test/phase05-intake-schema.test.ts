/**
 * ====================================================================
 * WATAZAWWADO — AI INTAKE SCHEMA VALIDATION TEST SUITE
 * File: test/phase05-intake-schema.test.ts
 *
 * Ensures free-form model output can never become authoritative:
 *  - missing/extra info handled
 *  - forbidden monetary fields rejected (fail closed)
 *  - completion requires an assessment
 *  - uncertainty flags preserved
 * ====================================================================
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validateIntakeOutput, INTAKE_RESPONSE_SCHEMA } from '../server/intake/intakeSchema.js';

function validOutput(over: any = {}) {
  return {
    reply: 'تمام، خلينا نفهم هدفك الأول.',
    is_complete: false,
    profile: {
      subject: 'English',
      learning_goal: 'IELTS preparation',
      current_level: 'intermediate',
      stated_fields: ['subject', 'learning_goal'],
      inferred_fields: [],
      uncertain: false,
    },
    assessment: null,
    ...over,
  };
}

describe('Phase 05 — AI Intake Schema Validation', () => {
  it('accepts a well-formed partial turn', () => {
    const r = validateIntakeOutput(validOutput());
    assert.equal(r.ok, true);
    assert.equal(r.value?.reply.length > 0, true);
    assert.equal(r.value?.is_complete, false);
  });

  it('accepts a complete turn with a valid assessment', () => {
    const r = validateIntakeOutput(validOutput({
      is_complete: true,
      assessment: {
        service_category: 'english',
        complexity: 'high',
        preparation_required: 'high',
        customization: 'high',
        specialization: true,
      },
    }));
    assert.equal(r.ok, true);
    assert.equal(r.value?.assessment?.service_category, 'english');
    assert.equal(r.value?.assessment?.specialization, true);
  });

  it('rejects when marked complete without an assessment', () => {
    const r = validateIntakeOutput(validOutput({ is_complete: true, assessment: null }));
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('complete_without_assessment'));
  });

  it('fails closed on embedded monetary fields', () => {
    const bad = validOutput();
    (bad as any).assessment = {
      service_category: 'quran',
      complexity: 'low',
      preparation_required: 'low',
      customization: 'low',
      specialization: false,
      price: 8,
    };
    const r = validateIntakeOutput(bad);
    assert.equal(r.ok, false);
    assert.ok(r.errors[0].includes('forbidden_monetary_fields'));
  });

  it('fails closed on deeply nested ability-to-pay', () => {
    const bad = validOutput();
    (bad.profile as any).extra = { willingness_to_pay: 500 };
    const r = validateIntakeOutput(bad);
    assert.equal(r.ok, false);
    assert.ok(r.errors[0].includes('forbidden_monetary_fields'));
  });

  it('rejects an invalid service category in the assessment', () => {
    const r = validateIntakeOutput(validOutput({
      is_complete: true,
      assessment: {
        service_category: 'astrophysics',
        complexity: 'low', preparation_required: 'low', customization: 'low', specialization: false,
      },
    }));
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('invalid_service_category'));
  });

  it('rejects non-boolean specialization', () => {
    const r = validateIntakeOutput(validOutput({
      is_complete: true,
      assessment: {
        service_category: 'quran',
        complexity: 'low', preparation_required: 'low', customization: 'low', specialization: 'yes',
      },
    }));
    assert.equal(r.ok, false);
    assert.ok(r.errors.includes('invalid_specialization'));
  });

  it('rejects missing reply and non-object output', () => {
    assert.equal(validateIntakeOutput(null).ok, false);
    assert.equal(validateIntakeOutput(validOutput({ reply: '' })).ok, false);
  });

  it('declares NO monetary properties in the response schema', () => {
    const asText = JSON.stringify(INTAKE_RESPONSE_SCHEMA).toLowerCase();
    for (const forbidden of ['"price', '"amount', '"discount', '"budget', '"currency']) {
      assert.equal(asText.includes(forbidden), false, `schema must not declare ${forbidden}`);
    }
  });

  it('preserves uncertainty + stated/inferred distinction', () => {
    const r = validateIntakeOutput(validOutput({
      profile: {
        subject: 'Arabic',
        stated_fields: ['subject'],
        inferred_fields: ['learning_goal'],
        uncertain: true,
      },
    }));
    assert.equal(r.ok, true);
    assert.equal(r.value?.profile.uncertain, true);
    assert.deepEqual(r.value?.profile.stated_fields, ['subject']);
    assert.deepEqual(r.value?.profile.inferred_fields, ['learning_goal']);
  });
});
