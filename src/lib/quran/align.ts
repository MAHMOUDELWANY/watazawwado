/**
 * Classroom 4.4: lines a transcript up against the expected words of the assigned part and flags missing, changed and
 * extra words. Pure (no model, no DOM). Expected words should be the API's `text_imlaei_simple`; the transcript of a
 * Quran-tuned speech model is plain Arabic, so both go through the same normaliser before comparing.
 */
export type ExpectedWord = { key: string; text: string };
export type AlignOp =
  | { kind: 'ok'; key: string; heard: string }
  | { kind: 'changed'; key: string; heard: string }
  | { kind: 'missing'; key: string }
  | { kind: 'extra'; heard: string; after: string | null };

/** Two words count as the same when their letters are this close (a model often drops or adds one letter). */
export const SAME_WORD = 0.75;

/** Arabic letters only: no harakat, Quranic marks, tatweel or punctuation; alef, ya, ta marbuta and hamza seats unified. */
export function normalizeArabic(s: string): string {
  return String(s || '')
    .replace(/[ؐ-ًؚ-ٰٟۖ-ۭـ]/g, '')
    .replace(/[آأإٱٲٳ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/[^ء-ي\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export const words = (s: string) => normalizeArabic(s).split(' ').filter(Boolean);

function lev(a: string, b: string): number {
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return row[b.length];
}

/** 1 for the same letters, 0 for nothing in common. */
export function similarity(a: string, b: string): number {
  const x = normalizeArabic(a), y = normalizeArabic(b);
  if (!x && !y) return 1;
  return 1 - lev(x, y) / Math.max(x.length, y.length);
}

/**
 * Word-level edit alignment. A near-identical word is a match (cost 0), a different word costs 1, and a missing or
 * extra word costs 1, so the cheapest path explains the recitation with the fewest mistakes.
 */
export function alignWords(expected: ExpectedWord[], heardText: string | string[]): AlignOp[] {
  const heard = Array.isArray(heardText) ? heardText.flatMap(words) : words(heardText);
  const exp = expected.map((w) => ({ ...w, norm: normalizeArabic(w.text) }));
  const n = exp.length, m = heard.length;
  const same = (i: number, j: number) => similarity(exp[i].norm, heard[j]) >= SAME_WORD;
  const cost: number[][] = Array.from({ length: n + 1 }, (_, i) => Array.from({ length: m + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) {
    cost[i][j] = Math.min(cost[i - 1][j - 1] + (same(i - 1, j - 1) ? 0 : 1), cost[i - 1][j] + 1, cost[i][j - 1] + 1);
  }
  const ops: AlignOp[] = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && cost[i][j] === cost[i - 1][j - 1] + (same(i - 1, j - 1) ? 0 : 1)) {
      ops.push({ kind: same(i - 1, j - 1) ? 'ok' : 'changed', key: exp[i - 1].key, heard: heard[j - 1] });
      i--; j--;
    } else if (i > 0 && cost[i][j] === cost[i - 1][j] + 1) {
      ops.push({ kind: 'missing', key: exp[i - 1].key });
      i--;
    } else {
      ops.push({ kind: 'extra', heard: heard[j - 1], after: i > 0 ? exp[i - 1].key : null });
      j--;
    }
  }
  return ops.reverse();
}

/** The flagged words of an alignment, keyed by expected word ("2:255:3"); an extra word sits on the word before it. */
export function flaggedKeys(ops: AlignOp[]): Array<{ key: string; kind: 'missing' | 'changed' | 'extra' }> {
  const out: Array<{ key: string; kind: 'missing' | 'changed' | 'extra' }> = [];
  for (const op of ops) {
    if (op.kind === 'missing' || op.kind === 'changed') out.push({ key: op.key, kind: op.kind });
    else if (op.kind === 'extra' && op.after) out.push({ key: op.after, kind: 'extra' });
  }
  return out;
}
