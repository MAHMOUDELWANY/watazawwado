/**
 * ====================================================================
 * WATAZAWWADO — AI INTAKE SCHEMA + VALIDATION
 * File: server/intake/intakeSchema.ts
 *
 * Role: Defines the STRICT structured contract the LLM must return for
 *       the Adaptive Intake turn, plus runtime validation so that
 *       free-form model text can never become authoritative.
 *
 * SECURITY: The schema deliberately contains NO monetary fields. Any
 *           price-like key in the model output is rejected (fail closed).
 * ====================================================================
 */

import {
  findForbiddenPricingFields,
  type ServiceAssessment,
  type ServiceCategory,
  type Triage,
  type AssessedLevel,
  type DurationMinutes
} from '../pricing/pricingEngine.js';

export const SERVICE_CATEGORIES: ServiceCategory[] = ['quran', 'islamic_studies', 'arabic', 'english'];
export const TRIAGE_VALUES: Triage[] = ['low', 'medium', 'high'];
export const LEVEL_VALUES: AssessedLevel[] = ['beginner', 'elementary', 'intermediate', 'advanced', 'specialized'];
export const DURATION_VALUES: DurationMinutes[] = [30, 45, 60];

export interface IntakeProfileFields {
  subject?: string | null;
  service_id?: string | null;
  learning_goal?: string | null;
  current_level?: AssessedLevel | null;
  target_level?: AssessedLevel | null;
  specific_skills?: string[] | null;
  use_case?: string | null;
  timeline?: string | null;
  previous_experience?: string | null;
  preferred_duration?: DurationMinutes | null;
  special_requirements?: string | null;
  /** Which facts above came directly from the student vs were inferred. */
  stated_fields?: string[];
  inferred_fields?: string[];
  uncertain: boolean;
}

export interface IntakeModelOutput {
  /** Natural assistant reply shown to the student. */
  reply: string;
  /** True once enough information has been gathered to assess. */
  is_complete: boolean;
  /** Profile built ONLY from information actually known so far. */
  profile: IntakeProfileFields;
  /** Structured assessment (categorical only). Null until complete. */
  assessment: ServiceAssessment | null;
  /** Optional single next question the assistant wants to ask (adaptive). */
  next_question?: string | null;
}

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  value?: IntakeModelOutput;
}

function isTriage(v: any): v is Triage {
  return TRIAGE_VALUES.includes(v);
}

function isLevel(v: any): v is AssessedLevel {
  return LEVEL_VALUES.includes(v);
}

function isDuration(v: any): v is DurationMinutes {
  return DURATION_VALUES.includes(v);
}

function sanitizeStringArray(v: any): string[] | null {
  if (!Array.isArray(v)) return null;
  const out = v.filter((x) => typeof x === 'string' && x.trim() !== '').map((x) => x.trim()).slice(0, 20);
  return out;
}

/**
 * Validate + normalize the raw parsed model output.
 * Rejects any forbidden monetary key anywhere in the object tree.
 */
export function validateIntakeOutput(raw: any): ValidationResult {
  const errors: string[] = [];

  if (!raw || typeof raw !== 'object') {
    return { ok: false, errors: ['output_not_an_object'] };
  }

  // 1. Reject embedded monetary fields (fail closed, recursively).
  const forbidden = collectForbiddenKeys(raw, []);
  if (forbidden.length > 0) {
    return { ok: false, errors: [`forbidden_monetary_fields:${forbidden.join(',')}`] };
  }

  const reply = typeof raw.reply === 'string' ? raw.reply.trim() : '';
  if (!reply) errors.push('missing_reply');
  if (reply.length > 4000) errors.push('reply_too_long');

  const isComplete = raw.is_complete === true;

  const p = raw.profile && typeof raw.profile === 'object' ? raw.profile : {};
  const profile: IntakeProfileFields = {
    subject: typeof p.subject === 'string' ? p.subject.trim().slice(0, 200) : null,
    service_id: typeof p.service_id === 'string' ? p.service_id.trim().slice(0, 100) : null,
    learning_goal: typeof p.learning_goal === 'string' ? p.learning_goal.trim().slice(0, 500) : null,
    current_level: isLevel(p.current_level) ? p.current_level : null,
    target_level: isLevel(p.target_level) ? p.target_level : null,
    specific_skills: sanitizeStringArray(p.specific_skills),
    use_case: typeof p.use_case === 'string' ? p.use_case.trim().slice(0, 300) : null,
    timeline: typeof p.timeline === 'string' ? p.timeline.trim().slice(0, 200) : null,
    previous_experience: typeof p.previous_experience === 'string' ? p.previous_experience.trim().slice(0, 400) : null,
    preferred_duration: isDuration(p.preferred_duration) ? p.preferred_duration : null,
    special_requirements: typeof p.special_requirements === 'string' ? p.special_requirements.trim().slice(0, 400) : null,
    stated_fields: sanitizeStringArray(p.stated_fields) || [],
    inferred_fields: sanitizeStringArray(p.inferred_fields) || [],
    uncertain: p.uncertain === true,
  };

  // 2. Assessment validation (only when present).
  let assessment: ServiceAssessment | null = null;
  if (raw.assessment && typeof raw.assessment === 'object') {
    const a = raw.assessment;
    if (!SERVICE_CATEGORIES.includes(a.service_category)) {
      errors.push('invalid_service_category');
    }
    if (!isTriage(a.complexity)) errors.push('invalid_complexity');
    if (!isTriage(a.preparation_required)) errors.push('invalid_preparation_required');
    if (!isTriage(a.customization)) errors.push('invalid_customization');
    if (typeof a.specialization !== 'boolean') errors.push('invalid_specialization');

    if (errors.length === 0) {
      assessment = {
        service_category: a.service_category,
        service_id: typeof a.service_id === 'string' ? a.service_id : null,
        learning_goal: typeof a.learning_goal === 'string' ? a.learning_goal.trim().slice(0, 500) : null,
        current_level: isLevel(a.current_level) ? a.current_level : null,
        target_level: isLevel(a.target_level) ? a.target_level : null,
        specific_skills: sanitizeStringArray(a.specific_skills),
        use_case: typeof a.use_case === 'string' ? a.use_case.trim().slice(0, 300) : null,
        complexity: a.complexity,
        preparation_required: a.preparation_required,
        customization: a.customization,
        specialization: a.specialization === true,
        time_sensitive: a.time_sensitive === true,
        previous_experience: typeof a.previous_experience === 'string' ? a.previous_experience.trim().slice(0, 400) : null,
        preferred_duration: isDuration(a.preferred_duration) ? a.preferred_duration : null,
      };
    }
  }

  // 3. Completion consistency: if flagged complete, an assessment is required.
  if (isComplete && !assessment) {
    errors.push('complete_without_assessment');
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    errors: [],
    value: {
      reply,
      is_complete: isComplete,
      profile,
      assessment,
      next_question: typeof raw.next_question === 'string' ? raw.next_question.trim().slice(0, 300) : null,
    },
  };
}

/** Recursively collect forbidden monetary keys from any nested object. */
function collectForbiddenKeys(obj: any, acc: string[], depth = 0): string[] {
  if (depth > 6 || !obj || typeof obj !== 'object') return acc;
  const hits = findForbiddenPricingFields(obj);
  for (const h of hits) if (!acc.includes(h)) acc.push(h);
  if (Array.isArray(obj)) {
    for (const item of obj) collectForbiddenKeys(item, acc, depth + 1);
  } else {
    for (const k of Object.keys(obj)) {
      collectForbiddenKeys(obj[k], acc, depth + 1);
    }
  }
  return acc;
}

/**
 * JSON schema (OpenAPI subset) used for Gemini structured output.
 * No monetary properties are declared anywhere.
 */
export const INTAKE_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    reply: { type: 'string' },
    is_complete: { type: 'boolean' },
    next_question: { type: 'string' },
    profile: {
      type: 'object',
      properties: {
        subject: { type: 'string' },
        service_id: { type: 'string' },
        learning_goal: { type: 'string' },
        current_level: { type: 'string', enum: LEVEL_VALUES },
        target_level: { type: 'string', enum: LEVEL_VALUES },
        specific_skills: { type: 'array', items: { type: 'string' } },
        use_case: { type: 'string' },
        timeline: { type: 'string' },
        previous_experience: { type: 'string' },
        preferred_duration: { type: 'integer', enum: DURATION_VALUES },
        special_requirements: { type: 'string' },
        stated_fields: { type: 'array', items: { type: 'string' } },
        inferred_fields: { type: 'array', items: { type: 'string' } },
        uncertain: { type: 'boolean' },
      },
    },
    assessment: {
      type: 'object',
      properties: {
        service_category: { type: 'string', enum: SERVICE_CATEGORIES },
        service_id: { type: 'string' },
        learning_goal: { type: 'string' },
        current_level: { type: 'string', enum: LEVEL_VALUES },
        target_level: { type: 'string', enum: LEVEL_VALUES },
        specific_skills: { type: 'array', items: { type: 'string' } },
        use_case: { type: 'string' },
        complexity: { type: 'string', enum: TRIAGE_VALUES },
        preparation_required: { type: 'string', enum: TRIAGE_VALUES },
        customization: { type: 'string', enum: TRIAGE_VALUES },
        specialization: { type: 'boolean' },
        time_sensitive: { type: 'boolean' },
        previous_experience: { type: 'string' },
        preferred_duration: { type: 'integer', enum: DURATION_VALUES },
      },
      required: ['service_category', 'complexity', 'preparation_required', 'customization', 'specialization'],
    },
  },
  required: ['reply', 'is_complete', 'profile'],
};
