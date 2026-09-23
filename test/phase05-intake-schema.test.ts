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
import {
  validateIntakeOutput,
  INTAKE_RESPONSE_SCHEMA,
  DURATION_VALUES,
  DURATION_ENUM_STRINGS,
  normalizeDuration,
} from '../server/intake/intakeSchema.js';

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

/**
 * Regression suite for the Gemini structured-output schema defect:
 * numeric `enum: [30,45,60]` on `preferred_duration` was rejected by the
 * provider with `400 INVALID_ARGUMENT ... (TYPE_STRING)`. The schema now
 * advertises STRING enums, and validation normalizes back to the numeric
 * `DurationMinutes` domain type.
 */
describe('Phase 05 — Gemini duration schema (string enum) + normalization', () => {
  const profileSchema: any = (INTAKE_RESPONSE_SCHEMA.properties as any).profile.properties.preferred_duration;
  const assessmentSchema: any = (INTAKE_RESPONSE_SCHEMA.properties as any).assessment.properties.preferred_duration;

  it('declares preferred_duration as a STRING enum in BOTH profile and assessment', () => {
    assert.equal(profileSchema.type, 'string');
    assert.equal(assessmentSchema.type, 'string');
  });

  it('uses only string enum values (never numeric) everywhere in the schema', () => {
    const enums: any[][] = [];
    const walk = (o: any) => {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (Array.isArray(o.enum)) enums.push(o.enum);
      for (const k of Object.keys(o)) walk(o[k]);
    };
    walk(INTAKE_RESPONSE_SCHEMA);
    assert.ok(enums.length > 0, 'schema should declare at least one enum');
    for (const e of enums) {
      for (const v of e) assert.equal(typeof v, 'string', `enum member must be a string, got ${JSON.stringify(v)}`);
    }
    for (const v of profileSchema.enum) assert.equal(typeof v, 'string');
    for (const v of assessmentSchema.enum) assert.equal(typeof v, 'string');
  });

  it('enum strings exactly match the numeric DURATION_VALUES domain', () => {
    assert.deepEqual(profileSchema.enum, DURATION_ENUM_STRINGS);
    assert.deepEqual(assessmentSchema.enum, DURATION_ENUM_STRINGS);
    assert.deepEqual(DURATION_ENUM_STRINGS, ['30', '45', '60']);
    assert.deepEqual(DURATION_VALUES, [30, 45, 60]);
  });

  it('normalizeDuration maps string enum values to numeric DurationMinutes', () => {
    assert.equal(normalizeDuration('30'), 30);
    assert.equal(normalizeDuration('45'), 45);
    assert.equal(normalizeDuration('60'), 60);
    // Backward-compatible: numeric inputs still accepted.
    assert.equal(normalizeDuration(30), 30);
    assert.equal(normalizeDuration(60), 60);
  });

  it('normalizeDuration fails closed for invalid / non-membership values', () => {
    for (const bad of ['90', '0', '-30', '30.5', '45min', '', 'thirty', ' 30x', '3 0', null, undefined, true, {}, [], NaN, Infinity]) {
      assert.equal(normalizeDuration(bad), null, `expected null for ${JSON.stringify(bad)}`);
    }
  });

  it('profile.preferred_duration string normalizes to numeric 60 through validation', () => {
    const r = validateIntakeOutput(validOutput({
      profile: {
        subject: 'Quran',
        preferred_duration: '60',
        stated_fields: ['subject'], inferred_fields: [], uncertain: false,
      },
    }));
    assert.equal(r.ok, true);
    assert.equal(r.value?.profile.preferred_duration, 60);
    assert.equal(typeof r.value?.profile.preferred_duration, 'number');
  });

  it('assessment.preferred_duration string normalizes to numeric 45 through validation', () => {
    const r = validateIntakeOutput(validOutput({
      is_complete: true,
      assessment: {
        service_category: 'arabic',
        complexity: 'medium', preparation_required: 'low', customization: 'high', specialization: false,
        preferred_duration: '45',
      },
    }));
    assert.equal(r.ok, true);
    assert.equal(r.value?.assessment?.preferred_duration, 45);
    assert.equal(typeof r.value?.assessment?.preferred_duration, 'number');
  });

  it('invalid duration strings are dropped (fail closed) on BOTH paths, without inventing a value', () => {
    const r = validateIntakeOutput(validOutput({
      profile: { subject: 'Quran', preferred_duration: '90', uncertain: false },
      is_complete: true,
      assessment: {
        service_category: 'quran',
        complexity: 'low', preparation_required: 'low', customization: 'low', specialization: false,
        preferred_duration: 'thirty',
      },
    }));
    assert.equal(r.ok, true);
    assert.equal(r.value?.profile.preferred_duration, null);
    assert.equal(r.value?.assessment?.preferred_duration, null);
  });

  it('still fails closed on forbidden monetary fields after the schema change', () => {
    const bad = validOutput({
      profile: { subject: 'Quran', preferred_duration: '30', uncertain: false },
    });
    (bad.profile as any).price = 8;
    const r = validateIntakeOutput(bad);
    assert.equal(r.ok, false);
    assert.ok(r.errors[0].includes('forbidden_monetary_fields'));
  });

  it('schema still declares no monetary properties', () => {
    const asText = JSON.stringify(INTAKE_RESPONSE_SCHEMA).toLowerCase();
    for (const forbidden of ['"price', '"amount', '"discount', '"budget', '"currency']) {
      assert.equal(asText.includes(forbidden), false, `schema must not declare ${forbidden}`);
    }
  });
});
