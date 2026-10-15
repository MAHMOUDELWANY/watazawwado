/**
 * Placement question banks (owner decision 2026-10-16): fixed, reviewed questions per subject and
 * level, in English and Arabic. Authoring rule: the FIRST option is the correct one; the server
 * shuffles options per student, so tests differ while answers stay checkable.
 */
export type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';
export const LEVELS: Level[] = ['beginner', 'elementary', 'intermediate', 'advanced'];

export interface BankQuestion {
  q: { en: string; ar: string };
  /** Same options in both languages (e.g. Arabic words), or one list per language. */
  options: string[] | { en: string[]; ar: string[] };
  skill: { en: string; ar: string };
}

export type SubjectBank = Record<Level, BankQuestion[]>;

/** q('English question', 'السؤال بالعربي', [correct, ...others], 'skill en|المهارة') */
export function q(en: string, ar: string, options: BankQuestion['options'], skill: string): BankQuestion {
  const [sEn, sAr] = skill.split('|');
  return { q: { en, ar }, options, skill: { en: sEn, ar: sAr || sEn } };
}

/** Options that differ by language: two lists in the same order. */
export const bi = (en: string[], ar: string[]) => ({ en, ar });
