/**
 * ====================================================================
 * WATAZAWWADO — DISCOUNT CODES, ACCOUNT BALANCE, REFERRAL CODES
 * File: server/pricing/discounts.ts
 *
 * Pure functions (no database) shared by the checkout quote and the payment intent, so the price the
 * family sees is the price they are charged. Owner decisions 2026-10-22 (RULES.md §4):
 *  - A code stacks with package savings and the family 5%, but total savings stay within a cap of the
 *    list price (a setting). A "gift" code is outside the cap and may cover the whole price.
 *  - Account balance is money, not a discount: it is used after the code and is outside the cap.
 *  - A total of 0 needs no payment (the booking is confirmed right away).
 * ====================================================================
 */

import { round2 } from './pricingEngine.js';

export type DiscountType = 'percent' | 'fixed';
export type CodeScope = 'all' | 'lessons' | 'packages';
export type CheckoutTarget = 'booking' | 'package';

export interface DiscountCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  value: number;
  applies_to: CodeScope;
  first_purchase_only: boolean;
  min_amount_usd: number;
  max_redemptions: number | null;
  max_per_account: number;
  starts_at: string | null;
  ends_at: string | null;
  is_gift: boolean;
  is_active: boolean;
}

export interface GrowthSettings {
  referral_enabled: boolean;
  friend_credit_usd: number;
  referrer_credit_usd: number;
  savings_cap_percent: number;
  max_rewards_per_year: number;
}

export const DEFAULT_GROWTH_SETTINGS: GrowthSettings = {
  referral_enabled: true,
  friend_credit_usd: 5,
  referrer_credit_usd: 5,
  savings_cap_percent: 25,
  max_rewards_per_year: 10,
};

/** Stripe refuses card charges under $0.50; a smaller remainder is waived instead. */
export const MIN_CHARGE_USD = 0.5;

const clampNumber = (v: unknown, min: number, max: number, fallback: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
};

/** Reads the stored `growth_program` setting, falling back to safe defaults field by field. */
export function parseGrowthSettings(value: unknown): GrowthSettings {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const d = DEFAULT_GROWTH_SETTINGS;
  return {
    referral_enabled: typeof v.referral_enabled === 'boolean' ? v.referral_enabled : d.referral_enabled,
    friend_credit_usd: round2(clampNumber(v.friend_credit_usd, 0, 100, d.friend_credit_usd)),
    referrer_credit_usd: round2(clampNumber(v.referrer_credit_usd, 0, 100, d.referrer_credit_usd)),
    savings_cap_percent: clampNumber(v.savings_cap_percent, 0, 100, d.savings_cap_percent),
    max_rewards_per_year: Math.round(clampNumber(v.max_rewards_per_year, 0, 100, d.max_rewards_per_year)),
  };
}

/** Validates a settings update from the admin page; returns an error message or null. */
export function validateGrowthSettings(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'Settings must be an object.';
  const v = value as Record<string, unknown>;
  if (typeof v.referral_enabled !== 'boolean') return 'referral_enabled must be true or false.';
  for (const key of ['friend_credit_usd', 'referrer_credit_usd'] as const) {
    const n = Number(v[key]);
    if (!Number.isFinite(n) || n < 0 || n > 100) return `${key} must be between 0 and 100.`;
  }
  const cap = Number(v.savings_cap_percent);
  if (!Number.isFinite(cap) || cap < 0 || cap > 100) return 'savings_cap_percent must be between 0 and 100.';
  const max = Number(v.max_rewards_per_year);
  if (!Number.isInteger(max) || max < 0 || max > 100) return 'max_rewards_per_year must be a whole number between 0 and 100.';
  return null;
}

/** Codes are stored and compared in upper case without spaces. */
export function normalizeCode(input: unknown): string {
  return typeof input === 'string' ? input.trim().toUpperCase().replace(/\s+/g, '') : '';
}

export const CODE_PATTERN = /^[A-Z0-9_-]{3,32}$/;

export type CodeRejection =
  | 'NOT_FOUND'
  | 'NOT_ACTIVE'
  | 'NOT_STARTED'
  | 'EXPIRED'
  | 'WRONG_ITEM'
  | 'FIRST_PURCHASE_ONLY'
  | 'MIN_AMOUNT'
  | 'USED_UP'
  | 'ALREADY_USED';

/** Friendly, honest reasons shown under the code box. */
export const CODE_REJECTION_TEXT: Record<CodeRejection, { en: string; ar: string }> = {
  NOT_FOUND: { en: "We couldn't find this code. Check the spelling and try again.", ar: 'الكود ده مش موجود. اتأكد من كتابته وجرّب تاني.' },
  NOT_ACTIVE: { en: 'This code is no longer active.', ar: 'الكود ده مبقاش شغال.' },
  NOT_STARTED: { en: "This code isn't active yet.", ar: 'الكود ده لسه ما بدأش.' },
  EXPIRED: { en: 'This code has expired.', ar: 'الكود ده انتهت مدته.' },
  WRONG_ITEM: { en: "This code doesn't apply to this item.", ar: 'الكود ده مش للنوع ده من الحجز.' },
  FIRST_PURCHASE_ONLY: { en: 'This code is for a first purchase only.', ar: 'الكود ده لأول شراء بس.' },
  MIN_AMOUNT: { en: 'This code needs a larger order.', ar: 'الكود ده محتاج مبلغ أكبر.' },
  USED_UP: { en: 'This code has been fully used.', ar: 'الكود ده خلص استخدامه.' },
  ALREADY_USED: { en: "You've already used this code.", ar: 'انت استخدمت الكود ده قبل كده.' },
};

/** Maps the RPC's limit errors (raised under lock) to the same reasons. */
export function rejectionFromRpcMessage(message: string | undefined): CodeRejection | null {
  if (!message) return null;
  if (message.includes('CODE_USED_UP')) return 'USED_UP';
  if (message.includes('CODE_ALREADY_USED')) return 'ALREADY_USED';
  if (message.includes('CODE_NOT_ACTIVE')) return 'NOT_ACTIVE';
  return null;
}

/**
 * The checks that need no counting (counts are rechecked under lock in apply_checkout_discount_atomic).
 * `usedTotal` / `usedByAccount` let the quote warn early; pass 0 when unknown.
 */
export function checkCodeEligibility(
  code: DiscountCode | null,
  ctx: { targetType: CheckoutTarget; baseAmount: number; hasPaidBefore: boolean; now?: Date; usedTotal?: number; usedByAccount?: number }
): CodeRejection | null {
  if (!code) return 'NOT_FOUND';
  if (!code.is_active) return 'NOT_ACTIVE';
  const now = (ctx.now || new Date()).getTime();
  if (code.starts_at && new Date(code.starts_at).getTime() > now) return 'NOT_STARTED';
  if (code.ends_at && new Date(code.ends_at).getTime() <= now) return 'EXPIRED';
  if (code.applies_to === 'lessons' && ctx.targetType !== 'booking') return 'WRONG_ITEM';
  if (code.applies_to === 'packages' && ctx.targetType !== 'package') return 'WRONG_ITEM';
  if (code.first_purchase_only && ctx.hasPaidBefore) return 'FIRST_PURCHASE_ONLY';
  if (Number(code.min_amount_usd || 0) > 0 && ctx.baseAmount < Number(code.min_amount_usd)) return 'MIN_AMOUNT';
  if (code.max_redemptions != null && (ctx.usedTotal || 0) >= code.max_redemptions) return 'USED_UP';
  if ((ctx.usedByAccount || 0) >= (code.max_per_account || 1)) return 'ALREADY_USED';
  return null;
}

export interface CheckoutInput {
  /** Full price before any saving: single-lesson price × lessons for a package, the lesson fee otherwise. */
  listAmount: number;
  /** The stored price before this checkout's code/balance (already includes package savings and family 5%). */
  baseAmount: number;
  code?: DiscountCode | null;
  walletBalance?: number;
  useCredit?: boolean;
  capPercent?: number;
}

export interface CheckoutBreakdown {
  listAmount: number;
  baseAmount: number;
  /** Package savings + family discount already in the stored price. */
  priorSavings: number;
  codeDiscount: number;
  /** True when the cap made the code smaller than its face value. */
  codeCapped: boolean;
  creditUsed: number;
  finalAmount: number;
  /** The few cents under Stripe's minimum that were waived, if any. */
  waived: number;
}

export function computeCheckout(input: CheckoutInput): CheckoutBreakdown {
  const base = round2(Math.max(0, Number(input.baseAmount) || 0));
  const list = round2(Math.max(base, Number(input.listAmount) || 0));
  const priorSavings = round2(list - base);
  const code = input.code || null;

  // 1. The code's face value, never more than what is left to pay.
  let codeDiscount = 0;
  if (code) {
    const raw = code.discount_type === 'percent'
      ? (base * Math.min(100, Math.max(0, Number(code.value)))) / 100
      : Math.max(0, Number(code.value));
    codeDiscount = round2(Math.min(base, raw));
  }

  // 2. The cap on total savings (package + family + code), measured against the list price.
  let codeCapped = false;
  if (code && !code.is_gift) {
    const capPercent = Math.min(100, Math.max(0, Number(input.capPercent ?? DEFAULT_GROWTH_SETTINGS.savings_cap_percent)));
    const room = Math.max(0, round2((list * capPercent) / 100 - priorSavings));
    if (codeDiscount > room) {
      codeDiscount = room;
      codeCapped = true;
    }
  }

  let afterCode = round2(base - codeDiscount);

  // 3. Account balance pays what is left.
  const balance = input.useCredit === false ? 0 : Math.max(0, round2(Number(input.walletBalance) || 0));
  let creditUsed = round2(Math.min(balance, afterCode));
  let finalAmount = round2(afterCode - creditUsed);
  let waived = 0;

  // 4. Never leave a remainder Stripe cannot charge.
  if (finalAmount > 0 && finalAmount < MIN_CHARGE_USD) {
    if (afterCode >= MIN_CHARGE_USD && creditUsed > 0) {
      // Use less balance so a chargeable $0.50 remains.
      creditUsed = round2(afterCode - MIN_CHARGE_USD);
      finalAmount = MIN_CHARGE_USD;
    } else {
      waived = finalAmount;
      codeDiscount = round2(codeDiscount + waived);
      finalAmount = 0;
    }
  }

  return { listAmount: list, baseAmount: base, priorSavings, codeDiscount, codeCapped, creditUsed, finalAmount, waived };
}

/** Readable invite code from a first name plus random letters, e.g. AMINA7K2Q. No look-alike characters. */
export function generateReferralCode(name: string | null | undefined, random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  const prefix = String(name || '')
    .normalize('NFKD')
    .replace(/[^A-Za-z]/g, '')
    .toUpperCase()
    .slice(0, 6);
  let tail = '';
  for (let i = 0; i < 4; i++) tail += alphabet[Math.floor(random() * alphabet.length) % alphabet.length];
  return (prefix.length >= 2 ? prefix : 'WZ') + tail;
}

/** One sentence describing a code, used in the admin preview and on receipts. */
export function describeCode(code: Pick<DiscountCode, 'discount_type' | 'value' | 'applies_to' | 'first_purchase_only' | 'ends_at'>, lang: 'en' | 'ar'): string {
  const amount = code.discount_type === 'percent' ? `${Number(code.value)}%` : `$${Number(code.value).toFixed(2).replace(/\.00$/, '')}`;
  const scope = {
    all: { en: 'any lesson or package', ar: 'أي حصة أو باقة' },
    lessons: { en: 'single lessons', ar: 'الحصص المفردة' },
    packages: { en: 'packages', ar: 'الباقات' },
  }[code.applies_to][lang];
  const parts = lang === 'ar' ? [`خصم ${amount} على ${scope}`] : [`${amount} off ${scope}`];
  if (code.first_purchase_only) parts.push(lang === 'ar' ? 'لأول شراء' : 'first purchase only');
  if (code.ends_at) {
    const d = new Date(code.ends_at);
    if (!Number.isNaN(d.getTime())) {
      const date = d.toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      parts.push(lang === 'ar' ? `لحد ${date}` : `until ${date}`);
    }
  }
  return parts.join(lang === 'ar' ? '، ' : ', ');
}
