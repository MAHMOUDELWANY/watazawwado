/**
 * ====================================================================
 * WATAZAWWADO — OFFERS & DISCOUNTS (ETHICAL)
 * File: server/pricing/offers.ts
 *
 * Role: Pure functions that compute LEGITIMATE, TRANSPARENT discounts on
 *       top of a teacher-approved price. Every discount must represent a
 *       real reduction and must be explainable to the student.
 *
 * PROHIBITED (enforced by design): fake urgency, fake scarcity,
 * countdowns, "was $X now $Y" inflation, confirmshaming, and any pricing
 * influenced by wealth / willingness-to-pay / demographics.
 * ====================================================================
 */

import { round2 } from './pricingEngine.js';

export type OfferKind =
  | 'first_lesson'
  | 'package_savings'
  | 'returning_student'
  | 'none';

export interface OfferDefinition {
  kind: OfferKind;
  label_en: string;
  label_ar: string;
  /** Percentage (0-1] or fixed amount; expressed explicitly, never hidden. */
  type: 'percent' | 'fixed';
  value: number;
}

export interface AppliedOffer {
  kind: OfferKind;
  label_en: string;
  label_ar: string;
  original_price_usd: number;
  discount_usd: number;
  final_price_usd: number;
  /** Human-readable, truthful explanation shown to the student. */
  explanation_en: string;
  explanation_ar: string;
}

export interface OfferInput {
  approvedPriceUsd: number;
  durationMinutes: number;
  lessonCount?: number;         // >1 for package discount
  isReturningStudent?: boolean;
  isFirstLesson?: boolean;
  /** Configurable discount magnitudes. Kept OUT of base pricing. */
  config?: {
    firstLessonPercent?: number;   // e.g. 0.15
    packagePercentPerExtraLesson?: number; // e.g. 0.03 capped
    packageMaxPercent?: number;    // e.g. 0.20
    returningStudentPercent?: number; // e.g. 0.10
  };
}

/**
 * Business magnitudes are NOT yet approved. Therefore ALL discount
 * magnitudes default to 0 (off). The framework stays in place and can be
 * activated the moment Mahmoud approves explicit numbers — but no
 * unapproved discount can ever be applied by default.
 */
const DEFAULT_CONFIG = {
  firstLessonPercent: 0,
  packagePercentPerExtraLesson: 0,
  packageMaxPercent: 0,
  returningStudentPercent: 0,
};

/**
 * Compute the single best legitimate offer. Never returns a discount that
 * produces a negative or zero price. Only one offer is applied at a time to
 * avoid stacked/confusing discounts.
 */
export function computeOffer(input: OfferInput): AppliedOffer | null {
  const price = round2(Number(input.approvedPriceUsd));
  if (!Number.isFinite(price) || price <= 0) return null;

  const cfg = { ...DEFAULT_CONFIG, ...(input.config || {}) };

  // Priority: package savings > first lesson > returning student.
  // (Package savings reflect the largest genuine benefit.)
  if (input.lessonCount && input.lessonCount > 1 && cfg.packagePercentPerExtraLesson > 0) {
    const rawPct = cfg.packagePercentPerExtraLesson * (input.lessonCount - 1);
    const pct = Math.min(rawPct, cfg.packageMaxPercent);
    if (pct > 0) {
      const discount = round2(price * pct);
      const final = round2(price - discount);
      if (final > 0 && discount > 0) {
        return {
          kind: 'package_savings',
          label_en: `Package savings (${input.lessonCount} lessons)`,
          label_ar: `توفير الباقة (${input.lessonCount} حصص)`,
          original_price_usd: price,
          discount_usd: discount,
          final_price_usd: final,
          explanation_en: `A real ${Math.round(pct * 100)}% reduction because you are reserving ${input.lessonCount} lessons together.`,
          explanation_ar: `خصم حقيقي بنسبة ${Math.round(pct * 100)}٪ لأنك تحجز ${input.lessonCount} حصص معًا.`,
        };
      }
    }
  }

  if (input.isFirstLesson && cfg.firstLessonPercent > 0) {
    const discount = round2(price * cfg.firstLessonPercent);
    const final = round2(price - discount);
    if (final > 0 && discount > 0) {
      return {
        kind: 'first_lesson',
        label_en: 'First lesson offer',
        label_ar: 'عرض الحصة الأولى',
        original_price_usd: price,
        discount_usd: discount,
        final_price_usd: final,
        explanation_en: `An introductory reduction of ${Math.round(cfg.firstLessonPercent * 100)}% on your first lesson.`,
        explanation_ar: `خصم ترحيبي بنسبة ${Math.round(cfg.firstLessonPercent * 100)}٪ على حصتك الأولى.`,
      };
    }
  }

  if (input.isReturningStudent && cfg.returningStudentPercent > 0) {
    const discount = round2(price * cfg.returningStudentPercent);
    const final = round2(price - discount);
    if (final > 0 && discount > 0) {
      return {
        kind: 'returning_student',
        label_en: 'Returning student offer',
        label_ar: 'عرض الطالب العائد',
        original_price_usd: price,
        discount_usd: discount,
        final_price_usd: final,
        explanation_en: `A thank-you reduction of ${Math.round(cfg.returningStudentPercent * 100)}% for continuing with us.`,
        explanation_ar: `خصم شكر بنسبة ${Math.round(cfg.returningStudentPercent * 100)}٪ لاستمرارك معنا.`,
      };
    }
  }

  return null;
}

/**
 * Validate an offer/discount is legitimate (real reduction, valid bounds).
 * Used defensively at the persistence boundary.
 */
export function isLegitimateOffer(offer: AppliedOffer): boolean {
  if (!offer) return false;
  if (offer.original_price_usd <= 0 || offer.final_price_usd <= 0) return false;
  if (offer.discount_usd <= 0) return false;
  if (round2(offer.original_price_usd - offer.discount_usd) !== round2(offer.final_price_usd)) return false;
  if (offer.final_price_usd >= offer.original_price_usd) return false;
  return true;
}
