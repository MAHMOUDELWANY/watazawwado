import type { IslamicSeason } from '../../../lib/islamicSeason';

/**
 * The achievements shelf and which one new achievement to celebrate (PR-04, new badge set 2026-11-15).
 * Design: docs/superpowers/specs/2026-11-14-achievement-badges-design.md and docs/design/PROGRESS.md.
 * Pure functions; the page passes in the progress data, the homework history and the browser storage.
 *
 * Achievements come from three places, never from ability, speed or a score:
 *  - effort we can count (lessons attended, longest weekly rhythm);
 *  - milestones a teacher recorded after a lesson (learner_milestones);
 *  - homework done between lessons (homework_sets history, counted on the server).
 */

export type EmblemId =
  | 'first-lesson' | 'lessons-10' | 'lessons-25' | 'lessons-50' | 'lessons-100'
  | 'rhythm-4' | 'rhythm-12' | 'rhythm-26' | 'rhythm-52'
  | 'surah' | 'tajweed' | 'juz' | 'khatma' | 'quran-level' | 'zad-level' | 'language-level' | 'scholar-book'
  | 'teacher'
  | 'homework-first' | 'homework-10' | 'homework-25' | 'homework-50' | 'lesson-mastered' | 'came-back' | 'tried-again';

export type BadgeFamily = 'lessons' | 'rhythm' | 'subject' | 'teacher' | 'homework';
export type BadgeTier = 'copper' | 'gold' | 'grand';
export type SubjectGroup = 'quran' | 'zad' | 'lang' | 'scholar';

export interface Bilingual { en: string; ar: string }

export interface MilestoneInput {
  id: string;
  kind: string;
  title_en: string;
  title_ar: string;
  reached_at: string;
  /** The subject slug it was recorded for; picks the level badge (Quran, Zad Path, a language). */
  subject?: string;
  /** Set on milestones the site records by itself (100 lessons, a year); the effort badges already show those. */
  auto_key?: string | null;
}

/** Counted on the server from the learner's homework (server/homework/sets.ts). */
export interface HomeworkCounts { passed: number; lessons: number; reviews: number; retried: number }

export interface AchievementInput {
  lessonsTotal: number;
  longestRhythm: number;
  milestones: MilestoneInput[];
  /** Subject slugs the learner studies; subject badges show only for these. Unknown: Quran's. */
  subjects?: string[];
  homework?: HomeworkCounts | null;
}

export interface ShelfItem {
  emblem: EmblemId;
  family: BadgeFamily;
  tier: BadgeTier;
  earned: boolean;
  title: Bilingual;
  /** What earns it, shown while it is still ahead and in the close-up. */
  earnBy: Bilingual;
  /** Teacher-recorded milestones carry their own title and date (the newest one). */
  detail?: Bilingual;
  earnedAt?: string;
  /** NX-04: the newest teacher milestone behind it, which has a certificate. */
  milestoneId?: string;
  /** A badge that can be earned many times shows one badge with a count. */
  count?: number;
  /** Every teacher milestone behind a repeating badge, newest first, for the close-up. */
  entries?: MilestoneInput[];
  subjectGroup?: SubjectGroup;
}

export interface CelebrationItem {
  key: string;
  emblem: EmblemId;
  title: Bilingual;
}

type Info = { family: BadgeFamily; tier: BadgeTier; title: Bilingual; earnBy: Bilingual; group?: SubjectGroup; numbered?: boolean };
const ar = (n: number) => n.toLocaleString('ar-EG');

export const BADGE_INFO: Record<EmblemId, Info> = {
  'first-lesson': { family: 'lessons', tier: 'copper', title: { en: 'First lesson', ar: 'أول حصة' }, earnBy: { en: 'Attend your first lesson', ar: 'احضر حصتك الأولى' } },
  'lessons-10': { family: 'lessons', tier: 'copper', numbered: true, title: { en: '10 lessons', ar: `${ar(10)} حصص` }, earnBy: { en: 'Attend 10 lessons', ar: `احضر ${ar(10)} حصص` } },
  'lessons-25': { family: 'lessons', tier: 'gold', numbered: true, title: { en: '25 lessons', ar: `${ar(25)} حصة` }, earnBy: { en: 'Attend 25 lessons', ar: `احضر ${ar(25)} حصة` } },
  'lessons-50': { family: 'lessons', tier: 'gold', numbered: true, title: { en: '50 lessons', ar: `${ar(50)} حصة` }, earnBy: { en: 'Attend 50 lessons', ar: `احضر ${ar(50)} حصة` } },
  'lessons-100': { family: 'lessons', tier: 'grand', numbered: true, title: { en: '100 lessons', ar: `${ar(100)} حصة` }, earnBy: { en: 'Attend 100 lessons', ar: `احضر ${ar(100)} حصة` } },
  'rhythm-4': { family: 'rhythm', tier: 'copper', numbered: true, title: { en: 'A month of rhythm', ar: 'شهر على الإيقاع' }, earnBy: { en: 'A lesson every week, 4 weeks in a row', ar: `حصة كل أسبوع، ${ar(4)} أسابيع متتالية` } },
  'rhythm-12': { family: 'rhythm', tier: 'gold', numbered: true, title: { en: 'Three steady months', ar: 'ثلاثة أشهر ثابتة' }, earnBy: { en: 'A lesson every week, 12 weeks in a row', ar: `حصة كل أسبوع، ${ar(12)} أسبوعًا متتالية` } },
  'rhythm-26': { family: 'rhythm', tier: 'gold', numbered: true, title: { en: 'Half a steady year', ar: 'نصف سنة ثابت' }, earnBy: { en: 'A lesson every week, 26 weeks in a row', ar: `حصة كل أسبوع، ${ar(26)} أسبوعًا متتالية` } },
  'rhythm-52': { family: 'rhythm', tier: 'grand', numbered: true, title: { en: 'A full year', ar: 'سنة كاملة' }, earnBy: { en: 'A lesson every week for a whole year', ar: 'حصة كل أسبوع لمدة سنة كاملة' } },
  surah: { family: 'subject', tier: 'gold', group: 'quran', title: { en: 'A surah memorised', ar: 'حفظ سورة' }, earnBy: { en: 'Your teacher records a surah you memorised', ar: 'معلمك يسجّل سورة حفظتها' } },
  tajweed: { family: 'subject', tier: 'gold', group: 'quran', title: { en: 'A tajweed rule mastered', ar: 'إتقان حكم تجويد' }, earnBy: { en: 'Your teacher records a rule you mastered', ar: 'معلمك يسجّل حكمًا أتقنته' } },
  juz: { family: 'subject', tier: 'grand', group: 'quran', title: { en: 'A juz completed', ar: 'إتمام جزء' }, earnBy: { en: 'Your teacher records a whole juz', ar: 'معلمك يسجّل جزءًا كاملًا' } },
  khatma: { family: 'subject', tier: 'grand', group: 'quran', title: { en: 'Khatma', ar: 'ختمة' }, earnBy: { en: 'Complete the whole Quran with your teacher', ar: 'اختم القرآن كاملًا مع معلمك' } },
  'quran-level': { family: 'subject', tier: 'grand', group: 'quran', title: { en: 'A Quran level completed', ar: 'إتمام مستوى في القرآن' }, earnBy: { en: 'Finish a level of your Quran path', ar: 'أنهِ مستوى من مسار القرآن' } },
  'zad-level': { family: 'subject', tier: 'grand', group: 'zad', title: { en: 'A Zad Path level', ar: 'مستوى في مسار زاد' }, earnBy: { en: 'Finish a level of the Zad Path', ar: 'أنهِ مستوى من مسار زاد' } },
  'language-level': { family: 'subject', tier: 'grand', group: 'lang', title: { en: 'A language level', ar: 'مستوى لغة' }, earnBy: { en: 'Finish a level of your language', ar: 'أنهِ مستوى من لغتك' } },
  'scholar-book': { family: 'subject', tier: 'grand', group: 'scholar', title: { en: 'A book completed', ar: 'إتمام كتاب' }, earnBy: { en: 'Finish a book with your teacher', ar: 'أنهِ كتابًا مع معلمك' } },
  teacher: { family: 'teacher', tier: 'gold', title: { en: "Teacher's recognition", ar: 'تقدير المعلم' }, earnBy: { en: 'Your teacher gives it and writes why', ar: 'يمنحها معلمك ويكتب سببها' } },
  'homework-first': { family: 'homework', tier: 'copper', title: { en: 'First homework', ar: 'أول واجب' }, earnBy: { en: 'Finish your first homework', ar: 'أنهِ واجبك الأول' } },
  'homework-10': { family: 'homework', tier: 'copper', numbered: true, title: { en: '10 homeworks', ar: `${ar(10)} واجبات` }, earnBy: { en: 'Finish 10 homeworks', ar: `أنهِ ${ar(10)} واجبات` } },
  'homework-25': { family: 'homework', tier: 'gold', numbered: true, title: { en: '25 homeworks', ar: `${ar(25)} واجبًا` }, earnBy: { en: 'Finish 25 homeworks', ar: `أنهِ ${ar(25)} واجبًا` } },
  'homework-50': { family: 'homework', tier: 'grand', numbered: true, title: { en: '50 homeworks', ar: `${ar(50)} واجبًا` }, earnBy: { en: 'Finish 50 homeworks', ar: `أنهِ ${ar(50)} واجبًا` } },
  'lesson-mastered': { family: 'homework', tier: 'gold', title: { en: 'A whole lesson mastered', ar: 'درس كامل متقن' }, earnBy: { en: "Pass a whole lesson's homework", ar: 'اجتز واجب درس كامل' } },
  'came-back': { family: 'homework', tier: 'gold', title: { en: 'Came back and remembered', ar: 'رجعتَ وتذكّرت' }, earnBy: { en: 'Pass a review a week or three later', ar: 'اجتز مراجعة بعد أسبوع أو ثلاثة' } },
  'tried-again': { family: 'homework', tier: 'gold', title: { en: 'Tried again and made it', ar: 'حاولتَ ثانيةً ونجحت' }, earnBy: { en: "Didn't pass the first time? Try again and pass", ar: 'لم تنجح أول مرة؟ أعد المحاولة وانجح' } },
};

/** Which subject a slug belongs to; unknown slugs count as Quran (most learners start there). */
export function subjectGroupOf(slug: string | null | undefined): SubjectGroup {
  const s = (slug || '').toLowerCase();
  if (/zad|seerah|sira|islamic|aqeedah|fiqh/.test(s)) return 'zad';
  if (/scholar|mutun|kitab/.test(s)) return 'scholar';
  if (/arabic|fusha|english|egyptian|language|lugha/.test(s)) return 'lang';
  return 'quran';
}

const LEVEL_BY_GROUP: Record<SubjectGroup, EmblemId> = { quran: 'quran-level', zad: 'zad-level', lang: 'language-level', scholar: 'scholar-book' };

/** The badge for a teacher-recorded milestone (also used by the community pages and certificates). */
export function emblemForKind(kind: string | null | undefined, subject?: string | null): EmblemId {
  switch (kind) {
    case 'surah_memorized': return 'surah';
    case 'rule_mastered': return 'tajweed';
    case 'juz_completed': return 'juz';
    case 'khatma': return 'khatma';
    case 'book_completed': return 'scholar-book';
    case 'level_completed': return LEVEL_BY_GROUP[subjectGroupOf(subject)];
    default: return 'teacher';
  }
}

const COUNT_STEPS: Array<{ n: number; emblem: EmblemId }> = [
  { n: 1, emblem: 'first-lesson' }, { n: 10, emblem: 'lessons-10' }, { n: 25, emblem: 'lessons-25' }, { n: 50, emblem: 'lessons-50' }, { n: 100, emblem: 'lessons-100' },
];
const RHYTHM_STEPS: Array<{ n: number; emblem: EmblemId }> = [
  { n: 4, emblem: 'rhythm-4' }, { n: 12, emblem: 'rhythm-12' }, { n: 26, emblem: 'rhythm-26' }, { n: 52, emblem: 'rhythm-52' },
];
const SUBJECT_ORDER: EmblemId[] = ['surah', 'tajweed', 'juz', 'khatma', 'quran-level', 'zad-level', 'language-level', 'scholar-book'];

function item(emblem: EmblemId, earned: boolean, extra: Partial<ShelfItem> = {}): ShelfItem {
  const i = BADGE_INFO[emblem];
  return { emblem, family: i.family, tier: i.tier, earned, title: i.title, earnBy: i.earnBy, ...(i.group ? { subjectGroup: i.group } : {}), ...extra };
}

function fromMilestones(emblem: EmblemId, list: MilestoneInput[]): ShelfItem {
  const sorted = [...list].sort((a, b) => b.reached_at.localeCompare(a.reached_at));
  const newest = sorted[0];
  return item(emblem, Boolean(newest), newest
    ? { detail: { en: newest.title_en, ar: newest.title_ar }, earnedAt: newest.reached_at, milestoneId: newest.id, count: sorted.length, entries: sorted }
    : {});
}

/**
 * The shelf, in family order: lessons, rhythm, the learner's subjects, the teacher's recognition, homework.
 * Earned badges in colour, the rest as a faint shadow with what earns them. Only the subjects the learner studies.
 */
export function buildShelf(input: AchievementInput): ShelfItem[] {
  const items: ShelfItem[] = [];
  for (const s of COUNT_STEPS) items.push(item(s.emblem, input.lessonsTotal >= s.n));
  for (const s of RHYTHM_STEPS) items.push(item(s.emblem, input.longestRhythm >= s.n));

  const byEmblem = new Map<EmblemId, MilestoneInput[]>();
  for (const m of input.milestones.filter((x) => !x.auto_key)) {
    const e = emblemForKind(m.kind, m.subject);
    byEmblem.set(e, [...(byEmblem.get(e) || []), m]);
  }
  const groups = new Set<SubjectGroup>((input.subjects?.length ? input.subjects : ['quran']).map(subjectGroupOf));
  for (const e of SUBJECT_ORDER) {
    const list = byEmblem.get(e) || [];
    if (groups.has(BADGE_INFO[e].group!) || list.length) items.push(fromMilestones(e, list));
  }
  items.push(fromMilestones('teacher', byEmblem.get('teacher') || []));

  const h = input.homework || { passed: 0, lessons: 0, reviews: 0, retried: 0 };
  items.push(item('homework-first', h.passed >= 1), item('homework-10', h.passed >= 10), item('homework-25', h.passed >= 25), item('homework-50', h.passed >= 50));
  for (const [e, n] of [['lesson-mastered', h.lessons], ['came-back', h.reviews], ['tried-again', h.retried]] as const) {
    items.push(item(e, n > 0, n > 0 ? { count: n } : {}));
  }
  return items;
}

/** Everything earned now, as stable keys, most worth celebrating first. Homework badges celebrate on the homework page. */
export function earnedCelebrations(input: AchievementInput): CelebrationItem[] {
  const out: CelebrationItem[] = [];
  const teacher = input.milestones.filter((x) => !x.auto_key).sort((a, b) => b.reached_at.localeCompare(a.reached_at));
  for (const m of teacher) out.push({ key: `ms:${m.id}`, emblem: emblemForKind(m.kind, m.subject), title: { en: m.title_en, ar: m.title_ar } });
  for (const s of [...COUNT_STEPS].reverse()) if (input.lessonsTotal >= s.n) out.push({ key: `lessons:${s.n}`, emblem: s.emblem, title: BADGE_INFO[s.emblem].title });
  for (const s of [...RHYTHM_STEPS].reverse()) if (input.longestRhythm >= s.n) out.push({ key: `rhythm:${s.n}`, emblem: s.emblem, title: BADGE_INFO[s.emblem].title });
  return out;
}

export const SEEN_STORAGE_PREFIX = 'watazawwado_seen_achievements_';
const RECENT_TEACHER_MS = 14 * 24 * 3_600_000;

export interface StorageLike { getItem(k: string): string | null; setItem(k: string, v: string): void }

/**
 * Which one achievement to celebrate on this visit, and how many others are new as well.
 * First visit on this device: everything already earned counts as seen (no flood of old celebrations), except a
 * teacher milestone from the last 14 days, which still gets its moment.
 */
export function pickCelebration(
  learnerId: string,
  input: AchievementInput,
  storage: StorageLike | null,
  now: Date = new Date()
): { celebrate: CelebrationItem | null; alsoNew: number; markSeen: () => void } {
  const earned = earnedCelebrations(input);
  const key = SEEN_STORAGE_PREFIX + learnerId;
  let seen: Set<string> | null = null;
  try {
    const raw = storage?.getItem(key);
    if (raw) seen = new Set(JSON.parse(raw));
  } catch { seen = null; }
  if (!seen) {
    const recent = new Set(
      input.milestones.filter((m) => now.getTime() - Date.parse(m.reached_at) < RECENT_TEACHER_MS).map((m) => `ms:${m.id}`)
    );
    seen = new Set(earned.map((e) => e.key).filter((k) => !recent.has(k)));
    // Without storage we cannot remember, so celebrating would repeat on every visit: celebrate nothing.
    if (!storage) return { celebrate: null, alsoNew: 0, markSeen: () => {} };
    try { storage.setItem(key, JSON.stringify([...seen])); } catch { /* storage full or blocked */ }
  }
  const fresh = earned.filter((e) => !seen!.has(e.key));
  const markSeen = () => {
    try { storage?.setItem(key, JSON.stringify([...new Set([...seen!, ...earned.map((e) => e.key)])])); } catch { /* ignore */ }
  };
  return { celebrate: fresh[0] || null, alsoNew: Math.max(0, fresh.length - 1), markSeen };
}

export type AgeGroup = 'kids' | 'teens' | 'adults';

/** Kids 6–11, teens 12–17, adults 18+. A child with no age on record is treated as a kid. */
export function ageGroupFor(age: number | null | undefined, learnerType: string | null | undefined): AgeGroup {
  if (typeof age === 'number' && Number.isFinite(age) && age > 0) return age < 12 ? 'kids' : age < 18 ? 'teens' : 'adults';
  return learnerType === 'child' ? 'kids' : 'adults';
}

export type Audience = 'learner' | 'guardian';

/** The words that accompany the emblem: fitted to age group, gender, who is watching, and the Islamic season. */
export function praiseFor(opts: { ageGroup: AgeGroup; gender?: string | null; audience: Audience; name?: string | null; season: IslamicSeason }): { headline: Bilingual; season: Bilingual | null } {
  const female = opts.gender === 'female';
  let headline: Bilingual;
  if (opts.audience === 'guardian') {
    const name = (opts.name || '').trim();
    headline = name
      ? { en: `${name} earned a new milestone. MashaAllah!`, ar: `${name} ${female ? 'حققت' : 'حقق'} إنجاز جديد. ما شاء الله!` }
      : { en: 'A new milestone in your family. MashaAllah!', ar: 'إنجاز جديد في البيت. ما شاء الله!' };
  } else if (opts.ageGroup === 'kids') {
    headline = { en: 'MashaAllah! Excellent work, champion!', ar: female ? 'ما شاء الله! أحسنتِ يا بطلة!' : 'ما شاء الله! أحسنت يا بطل!' };
  } else if (opts.ageGroup === 'teens') {
    headline = { en: 'BarakAllahu feek. That is a real achievement.', ar: female ? 'بارك الله فيكِ، إنجاز رائع' : 'بارك الله فيك، إنجاز رائع' };
  } else {
    headline = { en: 'Real progress. May Allah accept it from you.', ar: female ? 'تقدّم ملحوظ، نسأل الله أن يتقبّل منكِ' : 'تقدّم ملحوظ، نسأل الله أن يتقبّل منك' };
  }
  const k = female && opts.audience === 'learner' ? 'ِ' : '';
  const season: Bilingual | null =
    opts.season === 'ramadan' ? { en: 'May Allah accept from you in this blessed month.', ar: `تقبّل الله منك${k} في هذا الشهر المبارك` }
    : opts.season === 'dhul-hijjah' ? { en: 'May Allah bless you in these blessed days.', ar: `بارك الله فيك${k} في هذه الأيام المباركة` }
    : opts.season === 'eid-fitr' || opts.season === 'eid-adha' ? { en: 'Eid Mubarak. May Allah accept from us and from you.', ar: `كل عام وأنت${female && opts.audience === 'learner' ? 'ِ' : ''} بخير، تقبّل الله منا ومنك${k}` }
    : null;
  return { headline, season };
}
