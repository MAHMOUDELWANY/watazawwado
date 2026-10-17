import crypto from 'crypto';
import { LEVELS, type BankQuestion, type Level, type SubjectBank } from './types.js';
import { quranReading, tajweed, quranMemorization, quranRevision } from './banks/quran.js';
import { islamicStudies, fiqh, aqeedah, seerah } from './banks/islamic.js';
import { zadEssentials } from './banks/zad.js';
import { arabicFoundations, modernStandardArabic, arabicConversation, egyptianArabic, english } from './banks/languages.js';

export { LEVELS, type Level };

/** One bank per subject on the site (service ids from src/booking/mockData.ts). */
export const BANKS: Record<string, SubjectBank> = {
  'quran-reading': quranReading,
  'tajweed': tajweed,
  'quran-memorization': quranMemorization,
  'quran-revision': quranRevision,
  'zad-essentials': zadEssentials,
  'islamic-studies': islamicStudies,
  'fiqh': fiqh,
  'aqeedah': aqeedah,
  'seerah': seerah,
  'arabic-foundations': arabicFoundations,
  'modern-standard-arabic': modernStandardArabic,
  'arabic-conversation': arabicConversation,
  'egyptian-arabic': egyptianArabic,
  'english': english
};

/** A question as stored with the test: options already shuffled, the answer index kept on the server. */
export interface TestQuestion {
  q: { en: string; ar: string };
  options: { en: string[]; ar: string[] };
  answer: number;
  level: Level;
  skill: { en: string; ar: string };
}

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function toTestQuestion(b: BankQuestion, level: Level): TestQuestion {
  const en = Array.isArray(b.options) ? b.options : b.options.en;
  const ar = Array.isArray(b.options) ? b.options : b.options.ar;
  // Authoring rule: option 0 is correct. Shuffle positions, same order for both languages.
  const order = shuffle(en.map((_, i) => i));
  return {
    q: b.q,
    options: { en: order.map((i) => en[i]), ar: order.map((i) => ar[i]) },
    answer: order.indexOf(0),
    level,
    skill: b.skill
  };
}

/**
 * 8 questions around the level chosen at onboarding: 2 from the level below, 3 at it, 3 above,
 * picked at random so every student gets a different test. At the ends: beginner = 5 beginner +
 * 3 elementary; advanced = 3 intermediate + 5 advanced (still 8; banks hold 5 per level).
 */
export function buildPlacementTest(serviceId: string, statedLevel: string): TestQuestion[] {
  const bank = BANKS[serviceId] || BANKS['quran-reading'];
  const at = Math.max(0, LEVELS.indexOf(statedLevel as Level));
  const last = LEVELS.length - 1;
  const plan: [number, number][] = at === 0 ? [[0, 5], [1, 3]] : at === last ? [[last - 1, 3], [last, 5]] : [[at - 1, 2], [at, 3], [at + 1, 3]];
  const used = new Set<BankQuestion>();
  const picked: TestQuestion[] = [];
  for (const [li, count] of plan) {
    const level = LEVELS[li];
    for (const b of shuffle(bank[level]).filter((x) => !used.has(x)).slice(0, count)) {
      used.add(b);
      picked.push(toTestQuestion(b, level));
    }
  }
  return picked;
}

/**
 * Highest tested level where the student got most questions right. Failing the lowest tested
 * level suggests the level just below it (questions are only asked around the stated level).
 */
export function suggestLevel(questions: TestQuestion[], answers: number[]): Level {
  let result: Level | null = null;
  for (let li = 0; li < LEVELS.length; li++) {
    const qs = questions.map((q, i) => ({ q, ok: answers[i] === q.answer })).filter((x) => x.q.level === LEVELS[li]);
    if (qs.length === 0) continue;
    if (qs.filter((x) => x.ok).length / qs.length >= 0.6) result = LEVELS[li];
    else {
      if (!result) result = LEVELS[Math.max(0, li - 1)];
      break;
    }
  }
  return result || 'beginner';
}

/**
 * Tests saved by the first version (AI-written, before the banks) hold one language:
 * { q: string, options: string[], skill: string }. Read them in today's shape so old rows never
 * break the student page, the report or the dashboard.
 */
export function normalizeQuestions(questions: any[], fallbackLevel: string | null): TestQuestion[] {
  const both = (v: any) => (typeof v === 'string' ? { en: v, ar: v } : v || { en: '', ar: '' });
  const level = (LEVELS.includes(fallbackLevel as Level) ? fallbackLevel : 'beginner') as Level;
  return (Array.isArray(questions) ? questions : []).map((x: any) => ({
    q: both(x?.q),
    options: Array.isArray(x?.options) ? { en: x.options, ar: x.options } : { en: x?.options?.en || [], ar: x?.options?.ar || [] },
    answer: Number.isInteger(x?.answer) ? x.answer : 0,
    level: LEVELS.includes(x?.level) ? x.level : level,
    skill: both(x?.skill)
  }));
}

/** Skills answered well / to work on, in both languages, for the report. */
export function skillSummary(questions: TestQuestion[], answers: number[]) {
  const strong = new Map<string, { en: string; ar: string }>();
  const weak = new Map<string, { en: string; ar: string }>();
  questions.forEach((q, i) => (answers[i] === q.answer ? strong : weak).set(q.skill.en, q.skill));
  for (const k of weak.keys()) strong.delete(k);
  return { strengths: [...strong.values()], toImprove: [...weak.values()] };
}
