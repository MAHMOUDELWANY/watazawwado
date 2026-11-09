/**
 * Curriculum homework (owner review 2026-11-09). After a lesson the teacher marks the pages covered; the learner
 * gets questions made ONLY from those pages, at their age version, checked automatically.
 *
 * Why these question types (retrieval practice, Roediger & Karpicke 2006; Dunlosky et al. 2013): answering from
 * memory with feedback right after each answer fixes learning better than re-reading. Questions test understanding
 * first (why / what would you do / which fits), then recall; each answer shows a one-line explanation from the slide.
 * Several variants per set let a retry use different questions on the same pages. Spaced review sets come back
 * 7 and 21 days after a lesson is finished (spacing effect, Cepeda et al. 2006).
 */
import type { Lesson, LessonPage } from '../../src/curriculum/types.js';

type L = { en: string; ar: string };

export type Question =
  | { id: string; type: 'mcq'; skill: 'understand' | 'apply' | 'recall'; page: number; prompt: L; options: L[]; answer: number; explain: L }
  | { id: string; type: 'truefalse'; skill: 'understand' | 'apply' | 'recall'; page: number; prompt: L; answer: boolean; explain: L }
  | { id: string; type: 'order'; skill: 'understand' | 'apply' | 'recall'; page: number; prompt: L; items: L[]; explain: L };

export type Variant = { questions: Question[] };
export type Kind = 'part' | 'lesson' | 'review';

export const PASS_PERCENT = 80;
export const VARIANTS_PER_SET = 3;

/** How many questions: a short part stays short so the learner does it, a finished lesson gets a fuller set. */
export function questionCount(kind: Kind, pages: number): number {
  if (kind === 'lesson') return Math.min(10, Math.max(7, Math.ceil(pages * 0.6)));
  if (kind === 'review') return 6;
  return Math.min(7, Math.max(4, pages));
}

/** The content of the pages, as the model reads it. Teacher notes give the meaning behind each slide. */
export function pagesText(lesson: Lesson, from: number, to: number): string {
  const out: string[] = [];
  lesson.pages.slice(from - 1, to).forEach((p: LessonPage, i) => {
    const n = from + i;
    const parts = [`### Page ${n}: ${p.title}`];
    if (p.lines?.length) parts.push(`On the slide: ${p.lines.join(' / ')}`);
    if (p.items?.length) parts.push(`Items: ${p.items.join(' / ')}`);
    if (p.evidence) parts.push(`Text shown: ${p.evidence.arabic} — "${p.evidence.meaning}" (${p.evidence.reference})`);
    if (p.vocab?.length) parts.push(`Words: ${p.vocab.map((v) => `${v.arabic} (${v.translit}) = ${v.meaning}`).join('; ')}`);
    if (p.interaction && 'prompt' in p.interaction) parts.push(`Asked in class: ${p.interaction.prompt}`);
    if (p.explain?.length) parts.push(`Teacher's explanation: ${p.explain.join(' ')}`);
    out.push(parts.join('\n'));
  });
  return out.join('\n\n');
}

const AGE_STYLE: Record<string, string> = {
  kids: 'Learner is 6–11. Very short sentences, everyday words, friendly. Mostly true/false and 3-option questions. Make it feel like a game.',
  teens: 'Learner is 12–17. Direct, a bit of fun, real-life situations from school, friends and phones. 4 options.',
  adults: 'Learner is an adult. Respectful and thoughtful; situations from work, family and daily worship. 4 options.',
};

export function buildHomeworkPrompt(p: { lesson: Lesson; from: number; to: number; kind: Kind; count: number; variants: number }): string {
  return `You write homework for Watazawwado Academy, an online academy for English-speaking Muslim families.
Course: ${p.lesson.subjectTitle}. Lesson ${p.lesson.number}: "${p.lesson.title}". Pages ${p.from}–${p.to} were taught.
${AGE_STYLE[p.lesson.version] || AGE_STYLE.adults}

Write ${p.variants} DIFFERENT versions of the homework, each with exactly ${p.count} questions. A learner who fails version 1 will get version 2, so the versions must not repeat questions; they test the same ideas from different angles.

Rules:
- Use ONLY the content of the pages below. No outside facts, no extra hadith, ayat, names or dates. Never invent a hadith or change an ayah.
- Together, the questions of each version cover every page listed (at least one question per page where the page has an idea; skip pure title pages).
- Mostly understanding: "why", "what does this show", "which situation fits", "what would you do"; then a little recall of key words, names or steps. No trick questions; wrong options should be believable mistakes.
- The aim of our lessons is a change in the heart and in behaviour, not memorizing facts. Questions should make the learner think about the idea and how it lives in their week, while still checking they understood.
- "explain" is one short, warm sentence that teaches the right answer from the slide.
- Every text is given in English (en) and Arabic (ar). Arabic: clear, simple Modern Standard Arabic. Keep Quran and hadith text exactly as on the slide.
- Types: "mcq" (options + answer index from 0), "truefalse" (answer true/false), "order" (items in the correct order, 3–5 items; only for real sequences on the slides).
- "page" is the page number the question comes from. "skill" is understand, apply or recall.

Pages:
${pagesText(p.lesson, p.from, p.to)}`;
}

const L_SCHEMA = { type: 'object', properties: { en: { type: 'string' }, ar: { type: 'string' } }, required: ['en', 'ar'] };
export const HOMEWORK_SCHEMA = {
  type: 'object',
  properties: {
    variants: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          questions: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['mcq', 'truefalse', 'order'] },
                skill: { type: 'string', enum: ['understand', 'apply', 'recall'] },
                page: { type: 'integer' },
                prompt: L_SCHEMA,
                options: { type: 'array', items: L_SCHEMA },
                answer: { type: 'integer' },
                answerBool: { type: 'boolean' },
                items: { type: 'array', items: L_SCHEMA },
                explain: L_SCHEMA,
              },
              required: ['type', 'skill', 'page', 'prompt', 'explain'],
            },
          },
        },
        required: ['questions'],
      },
    },
  },
  required: ['variants'],
};

const txt = (v: any, max = 400): L | null => {
  const en = typeof v?.en === 'string' ? v.en.trim().slice(0, max) : '';
  const ar = typeof v?.ar === 'string' ? v.ar.trim().slice(0, max) : '';
  return en && ar ? { en, ar } : null;
};

/** Keeps only well-formed questions from the model's output, on pages inside the range. */
export function validateVariants(raw: any, from: number, to: number, minQuestions: number): Variant[] {
  const out: Variant[] = [];
  for (const [vi, v] of (Array.isArray(raw?.variants) ? raw.variants : []).entries()) {
    const qs: Question[] = [];
    for (const [qi, q] of (Array.isArray(v?.questions) ? v.questions : []).entries()) {
      const prompt = txt(q?.prompt);
      const explain = txt(q?.explain);
      const page = Number(q?.page);
      const skill = ['understand', 'apply', 'recall'].includes(q?.skill) ? q.skill : 'understand';
      if (!prompt || !explain || !Number.isInteger(page) || page < from || page > to) continue;
      const id = `v${vi}q${qi}`;
      if (q.type === 'mcq') {
        const options = (Array.isArray(q.options) ? q.options : []).map((o: any) => txt(o, 200)).filter(Boolean) as L[];
        const answer = Number(q.answer);
        if (options.length < 2 || options.length > 5 || !Number.isInteger(answer) || answer < 0 || answer >= options.length) continue;
        qs.push({ id, type: 'mcq', skill, page, prompt, options, answer, explain });
      } else if (q.type === 'truefalse') {
        const answer = typeof q.answerBool === 'boolean' ? q.answerBool : typeof q.answer === 'boolean' ? q.answer : q.answer === 1 ? true : q.answer === 0 ? false : null;
        if (answer === null) continue;
        qs.push({ id, type: 'truefalse', skill, page, prompt, answer, explain });
      } else if (q.type === 'order') {
        const items = (Array.isArray(q.items) ? q.items : []).map((o: any) => txt(o, 200)).filter(Boolean) as L[];
        if (items.length < 3 || items.length > 6) continue;
        qs.push({ id, type: 'order', skill, page, prompt, items, explain });
      }
    }
    if (qs.length >= minQuestions) out.push({ questions: qs });
  }
  return out;
}

/** Same order on every load for one learner, different between questions. */
function seededShuffle<T>(arr: T[], seed: string): T[] {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    const j = Math.abs(h) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** What the learner's browser gets: no answers, order items shuffled (with stable ids). */
export function publicQuestions(v: Variant | undefined, seed: string) {
  return (v?.questions || []).map((q) => {
    if (q.type === 'mcq') return { id: q.id, type: q.type, page: q.page, prompt: q.prompt, options: q.options };
    if (q.type === 'truefalse') return { id: q.id, type: q.type, page: q.page, prompt: q.prompt };
    const items = q.items.map((it, i) => ({ key: String(i), ...it }));
    let shuffled = seededShuffle(items, `${seed}:${q.id}`);
    if (shuffled.every((it, i) => it.key === String(i))) shuffled = [...shuffled.slice(1), shuffled[0]];
    return { id: q.id, type: q.type, page: q.page, prompt: q.prompt, items: shuffled };
  });
}

export type Graded = { id: string; correct: boolean; explain: L; correctAnswer: number | boolean | string[] };

/** Checks every answer. Order answers are the item keys in the learner's order. */
export function gradeVariant(v: Variant, answers: Record<string, unknown>): { score: number; total: number; results: Graded[] } {
  const results = v.questions.map((q): Graded => {
    const a = answers?.[q.id];
    if (q.type === 'mcq') return { id: q.id, correct: Number(a) === q.answer, explain: q.explain, correctAnswer: q.answer };
    if (q.type === 'truefalse') return { id: q.id, correct: a === q.answer, explain: q.explain, correctAnswer: q.answer };
    const right = q.items.map((_, i) => String(i));
    return { id: q.id, correct: Array.isArray(a) && a.length === right.length && a.every((k, i) => String(k) === right[i]), explain: q.explain, correctAnswer: right };
  });
  const score = results.filter((r) => r.correct).length;
  return { score, total: results.length, results };
}

export const passed = (score: number, total: number) => total > 0 && (score / total) * 100 >= PASS_PERCENT;

/** Badges come from the learner's homework history; nothing extra is stored. */
export const BADGES = [
  { id: 'first', need: (h: History) => h.passed >= 1, title: { en: 'First homework done', ar: 'أول واجب' } },
  { id: 'perfect', need: (h: History) => h.perfect >= 1, title: { en: 'Full marks', ar: 'الدرجة النهائية' } },
  { id: 'five', need: (h: History) => h.passed >= 5, title: { en: 'Five homeworks', ar: 'خمس واجبات' } },
  { id: 'lesson', need: (h: History) => h.lessons >= 1, title: { en: 'A whole lesson mastered', ar: 'درس كامل متقن' } },
  { id: 'review', need: (h: History) => h.reviews >= 1, title: { en: 'Came back to remember', ar: 'رجع وافتكر' } },
  { id: 'ten', need: (h: History) => h.passed >= 10, title: { en: 'Ten homeworks', ar: 'عشر واجبات' } },
] as const;

export type History = { passed: number; perfect: number; lessons: number; reviews: number };

export function historyOf(sets: Array<{ status: string; kind: string; score: number | null; total: number | null }>): History {
  const ok = sets.filter((s) => s.status === 'passed' || s.status === 'done');
  return {
    passed: ok.length,
    perfect: ok.filter((s) => s.total && s.score === s.total).length,
    lessons: ok.filter((s) => s.kind === 'lesson').length,
    reviews: ok.filter((s) => s.kind === 'review').length,
  };
}

export const earnedBadges = (h: History) => BADGES.filter((b) => b.need(h)).map((b) => ({ id: b.id, title: b.title }));
