/**
 * Practice tools (BUILD-LIST 2.11), pure: tashkeel, fill the blanks, unscramble, word matching and the question wheel.
 * Everything that must look the same on both screens comes from a seed the teacher sends.
 */

/** Arabic harakat, tanween, shadda, sukun, dagger alif and Quranic annotation marks. The letters stay. */
const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۨ-ۭ]/g;
export const stripTashkeel = (s: string) => s.replace(TASHKEEL, '');

/** A small seeded generator (mulberry32): the same seed gives the same blanks and order everywhere. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: readonly T[], seed: number): T[] {
  const rand = seeded(seed);
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const words = (text: string) => text.split(/\s+/).filter(Boolean);
/** For comparing answers: no tashkeel, no punctuation around, one case. */
export const normalize = (s: string) => stripTashkeel(s).replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase().trim();

export type BlankPart = { word: string; blank: boolean };

/** Hides about `ratio` of the words that have at least two letters; always at least one when any can be hidden. */
export function makeBlanks(text: string, seed: number, ratio = 0.3): BlankPart[] {
  const list = words(text);
  const candidates = list.map((w, i) => (normalize(w).length >= 2 ? i : -1)).filter((i) => i >= 0);
  const count = candidates.length ? Math.max(1, Math.round(candidates.length * ratio)) : 0;
  const hidden = new Set(shuffle(candidates, seed).slice(0, count));
  return list.map((word, i) => ({ word, blank: hidden.has(i) }));
}

export const sameWord = (expected: string, given: string) => normalize(expected) === normalize(given) && normalize(given) !== '';

/** The words in a new order; with two or more different words the order always differs from the sentence. */
export function scramble(text: string, seed: number): string[] {
  const list = words(text);
  if (new Set(list).size < 2) return list;
  for (let s = seed, tries = 0; tries < 20; s++, tries++) {
    const out = shuffle(list, s);
    if (out.join(' ') !== list.join(' ')) return out;
  }
  return [...list].reverse();
}

export const isUnscrambled = (text: string, answer: string[]) => answer.map(normalize).join(' ') === words(text).map(normalize).join(' ');

/** Word matching: the left column in the teacher's order, the right one shuffled (different from the pairing when it can be). */
export function matchColumns(pairs: readonly [string, string][], seed: number): { left: string[]; right: string[] } {
  const left = pairs.map((p) => p[0]);
  const right = pairs.map((p) => p[1]);
  let shuffled = shuffle(right, seed);
  if (right.length > 1 && shuffled.every((r, i) => r === right[i])) shuffled = [...shuffled.slice(1), shuffled[0]];
  return { left, right: shuffled };
}

/**
 * The question wheel picks the next question the teacher has not asked yet. No points, prizes or rewards ride on it
 * (no gambling-like mechanics): it is only a fair way to choose the next question. All asked: starts over.
 */
export function nextWheel(count: number, asked: readonly number[], rand: () => number = Math.random): number {
  if (count <= 0) return -1;
  const left = Array.from({ length: count }, (_, i) => i).filter((i) => !asked.includes(i));
  const pool = left.length ? left : Array.from({ length: count }, (_, i) => i);
  return pool[Math.floor(rand() * pool.length) % pool.length];
}

/** Lines typed by the teacher, one item per line, empty lines dropped. */
export const lines = (text: string, max = 30) => text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, max);

/** "word = meaning" (or "word - meaning", or a tab) per line, for matching. */
export function parsePairs(text: string, max = 12): [string, string][] {
  return lines(text, 50)
    .map((l) => l.split(/\s*(?:=|\t|\s-\s|،|:)\s*/))
    .filter((p) => p.length >= 2 && p[0] && p[1])
    .slice(0, max)
    .map((p) => [p[0].slice(0, 120), p.slice(1).join(' ').slice(0, 120)] as [string, string]);
}
