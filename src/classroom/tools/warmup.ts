/**
 * Warm-up prompts (BUILD-LIST 2.10): a few openers for the teacher, from the learner's last lesson report, open
 * corrections and level. Shown only to the teacher, at the start of the lesson. Pure.
 */
type L = { en: string; ar: string };

export type WarmupInput = {
  level: string | null;
  report: { lessonTitle: string | null; toPage: number | null; strengths: string[]; toReinforce: string[]; note: string | null } | null;
  mistakes: Array<{ said: string; correct: string }>;
};

const LEVEL: Record<string, L> = {
  beginner: { en: 'Beginner: start with one easy question they can answer, then build.', ar: 'مبتدئ: ابدأ بسؤال سهل يقدر يجاوبه، وبعدين زوّد.' },
  elementary: { en: 'Elementary: ask them to say back one thing from last time in their own words.', ar: 'أساسي: خليه يقول حاجة من المرة اللي فاتت بكلامه.' },
  intermediate: { en: 'Intermediate: ask them to use last lesson\'s idea in a new example.', ar: 'متوسط: خليه يستخدم فكرة الحصة اللي فاتت في مثال جديد.' },
  advanced: { en: 'Advanced: ask them to explain last lesson\'s point as if teaching it.', ar: 'متقدم: خليه يشرح فكرة الحصة اللي فاتت كأنه بيدرّسها.' },
};

const clip = (s: string, n = 80) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
export const MAX_PROMPTS = 6;

export function warmupPrompts(input: WarmupInput): L[] {
  const out: L[] = [];
  const r = input.report;
  if (r?.lessonTitle) {
    const where = r.toPage ? { en: ` (they stopped at page ${r.toPage})`, ar: ` (وقف عند صفحة ${r.toPage})` } : { en: '', ar: '' };
    out.push({ en: `Ask what they remember from "${clip(r.lessonTitle)}"${where.en}.`, ar: `اسأله فاكر إيه من «${clip(r.lessonTitle)}»${where.ar}.` });
  }
  if (r?.strengths[0]) out.push({ en: `Start with a win: let them show "${clip(r.strengths[0])}".`, ar: `ابدأ بحاجة بيعرفها: خليه يورّيك «${clip(r.strengths[0])}».` });
  for (const x of (r?.toReinforce ?? []).slice(0, 2)) out.push({ en: `Quick check on "${clip(x)}".`, ar: `راجع بسرعة «${clip(x)}».` });
  for (const m of input.mistakes.slice(0, 2)) out.push({ en: `Revisit: "${clip(m.said, 40)}" → "${clip(m.correct, 40)}".`, ar: `راجع: «${clip(m.said, 40)}» ← «${clip(m.correct, 40)}».` });
  if (r?.note) out.push({ en: `From your last note: ${clip(r.note, 120)}`, ar: `من ملاحظتك الأخيرة: ${clip(r.note, 120)}` });
  const lvl = input.level ? LEVEL[input.level] : undefined;
  if (lvl) out.push(lvl);
  if (!out.length) out.push({ en: 'Ask how their week went and what they practised since last time.', ar: 'اسأله أسبوعه عامل إيه وراجع إيه من آخر مرة.' });
  return out.slice(0, MAX_PROMPTS);
}
