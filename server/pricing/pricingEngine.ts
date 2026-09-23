/**
 * ====================================================================
 * WATAZAWWADO — DETERMINISTIC PRICING ENGINE
 * File: server/pricing/pricingEngine.ts
 *
 * Role: Pure, side-effect-free business rule engine that converts a
 *       structured Service Assessment (produced by the AI intake layer)
 *       into a Pricing Recommendation.
 *
 * NON-NEGOTIABLE PRINCIPLES
 * 1. This module NEVER accepts a price from an LLM. It only consumes
 *    categorical assessment facts and derives numbers from approved
 *    business baselines.
 * 2. Ability to pay / perceived wealth / demographics are NOT inputs and
 *    can never influence the result. The input type deliberately omits
 *    them, and untrusted extra fields are ignored (see tests).
 * 3. Advanced/specialized pricing numbers are NOT approved. When a case
 *    exits the deterministic baseline band, the engine does NOT invent a
 *    number: it sets teacher_review_required = true and returns no
 *    authoritative price.
 * 4. Fail closed: unknown/unsupported services yield teacher_review_required.
 * ====================================================================
 */

export type ServiceBand = 'religious' | 'language';
export type ServiceCategory = 'quran' | 'islamic_studies' | 'arabic' | 'english';
export type AssessedLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'specialized';
export type Triage = 'low' | 'medium' | 'high';
export type DurationMinutes = 30 | 45 | 60;
export type ComplexityTier = 'STANDARD' | 'ELEVATED' | 'SPECIALIZED';

/** Structured assessment produced by the intake layer. No monetary fields. */
export interface ServiceAssessment {
  /** Service category as defined in public.services.category */
  service_category: ServiceCategory;
  /** Canonical service id from public.services (optional but preferred) */
  service_id?: string | null;
  /** The actual requested outcome (free-form, factual, from conversation) */
  learning_goal?: string | null;
  /** Current level — ONE input among several, never the sole determinant */
  current_level?: AssessedLevel | null;
  target_level?: AssessedLevel | null;
  /** Specific skills the student needs (e.g. 'speaking', 'nahw', 'i\'rab') */
  specific_skills?: string[] | null;
  /** Real-world use case (exam prep, academic reading, travel, work...) */
  use_case?: string | null;
  complexity: Triage;
  preparation_required: Triage;
  customization: Triage;
  specialization: boolean;
  /** Only true when a real deadline materially changes preparation/service */
  time_sensitive?: boolean;
  previous_experience?: string | null;
  preferred_duration?: DurationMinutes | null;
}

/** Recommendation object. `recommended_price_usd` is authoritative ONLY when required_review is false. */
export interface PricingRecommendation {
  tier: ComplexityTier;
  band: ServiceBand;
  duration_minutes: DurationMinutes;
  /** Approved baseline price for the band+duration (may act as a floor in review cases). */
  baseline_price_usd: number;
  /** Rule-derived price. null when the case must be reviewed. */
  recommended_price_usd: number | null;
  teacher_review_required: boolean;
  /** Machine-readable reasons for transparency/auditability. */
  reasons: string[];
}

/** Approved business baselines (NON-NEGOTIABLE). */
export const APPROVED_BASELINES: Record<ServiceBand, Record<DurationMinutes, number>> = {
  religious: { 60: 8, 45: 6, 30: 4 },
  language: { 60: 12, 45: 9, 30: 6 },
};

export const SUPPORTED_DURATIONS: DurationMinutes[] = [30, 45, 60];

/** Category → band mapping. Extensible, but explicit. */
export function resolveBand(category: ServiceCategory): ServiceBand | null {
  switch (category) {
    case 'quran':
    case 'islamic_studies':
      return 'religious';
    case 'arabic':
    case 'english':
      return 'language';
    default:
      return null;
  }
}

/**
 * Exact proportional baseline pricing for the approved anchor (60 min).
 * religious 60=$8 → 45=$6, 30=$4 ; language 60=$12 → 45=$9, 30=$6.
 */
export function baselinePrice(band: ServiceBand, duration: DurationMinutes): number {
  const anchor = APPROVED_BASELINES[band][60];
  const raw = (anchor * duration) / 60;
  return round2(raw);
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function isSupportedDuration(d: unknown): d is DurationMinutes {
  return typeof d === 'number' && (SUPPORTED_DURATIONS as number[]).includes(d);
}

/**
 * Core deterministic evaluation. Pure function.
 * Given the same assessment it always returns the same recommendation.
 */
export function evaluateAssessment(assessment: ServiceAssessment): PricingRecommendation {
  const reasons: string[] = [];

  // 1. Resolve band (fail closed on unknown categories).
  const band = resolveBand(assessment?.service_category as ServiceCategory);
  if (!band) {
    return {
      tier: 'SPECIALIZED',
      band: 'religious',
      duration_minutes: 60,
      baseline_price_usd: 0,
      recommended_price_usd: null,
      teacher_review_required: true,
      reasons: ['unsupported_service_category: cannot price safely'],
    };
  }

  // 2. Resolve duration (fail closed on unsupported durations).
  const duration = assessment.preferred_duration;
  if (!isSupportedDuration(duration)) {
    return {
      tier: 'SPECIALIZED',
      band,
      duration_minutes: 60,
      baseline_price_usd: 0,
      recommended_price_usd: null,
      teacher_review_required: true,
      reasons: ['unsupported_or_missing_duration: cannot price safely'],
    };
  }

  const baseline = baselinePrice(band, duration);

  // 3. Deterministic escalation signals (NO level-only pricing).
  const highComplexity = assessment.complexity === 'high';
  const highPreparation = assessment.preparation_required === 'high';
  const highCustomization = assessment.customization === 'high';
  const specialized = assessment.specialization === true;
  const timeSensitive = assessment.time_sensitive === true;

  const mediumComplexity = assessment.complexity === 'medium';
  const mediumPreparation = assessment.preparation_required === 'medium';
  const mediumCustomization = assessment.customization === 'medium';

  // 3a. Any "high"/specialized signal → exceeds deterministic baseline authority.
  if (highComplexity || highPreparation || highCustomization || specialized) {
    if (highComplexity) reasons.push('complexity_high');
    if (highPreparation) reasons.push('preparation_high');
    if (highCustomization) reasons.push('customization_high');
    if (specialized) reasons.push('specialized_expertise_required');
    reasons.push('advanced_pricing_not_approved: routed to teacher review');
    return {
      tier: 'SPECIALIZED',
      band,
      duration_minutes: duration,
      baseline_price_usd: baseline,
      recommended_price_usd: null,
      teacher_review_required: true,
      reasons,
    };
  }

  // 3b. Medium signals or a materially time-sensitive request → elevated tier,
  //     still within baseline authority in documentation terms, but we do not
  //     have an approved elevated number, so we surface it for review only when
  //     TIME actually changes preparation/service requirements.
  if (timeSensitive) {
    reasons.push('meaningful_time_constraint');
    reasons.push('elevated_pricing_not_approved: routed to teacher review');
    return {
      tier: 'ELEVATED',
      band,
      duration_minutes: duration,
      baseline_price_usd: baseline,
      recommended_price_usd: null,
      teacher_review_required: true,
      reasons,
    };
  }

  // 3c. Standard band → deterministic approved price.
  if (mediumComplexity) reasons.push('complexity_medium');
  if (mediumPreparation) reasons.push('preparation_medium');
  if (mediumCustomization) reasons.push('customization_medium');

  // Current/target level is recorded as an input but does NOT alter price by itself.
  if (assessment.current_level) reasons.push(`level_input:${assessment.current_level}`);
  if (assessment.target_level) reasons.push(`target_level:${assessment.target_level}`);

  reasons.push('standard_band: approved baseline applies');

  return {
    tier: 'STANDARD',
    band,
    duration_minutes: duration,
    baseline_price_usd: baseline,
    recommended_price_usd: baseline,
    teacher_review_required: false,
    reasons,
  };
}

/**
 * Explicit guard used by the intake layer to ensure the AI output never
 * carries a monetary field. Returns the list of forbidden keys present.
 */
export function findForbiddenPricingFields(input: any): string[] {
  const forbidden = [
    'price', 'price_usd', 'recommended_price', 'final_price', 'amount',
    'discount', 'willingness_to_pay', 'ability_to_pay', 'wealth', 'income',
    'budget', 'salary', 'country_income', 'demographic_price',
  ];
  if (!input || typeof input !== 'object') return [];
  const found: string[] = [];
  for (const key of Object.keys(input)) {
    if (forbidden.includes(key.toLowerCase())) found.push(key);
  }
  return found;
}
