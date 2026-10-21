import type { IslamicSeason } from '../../../lib/islamicSeason';

/**
 * PR-04 (docs/superpowers/specs/2026-10-20-milestone-celebration-design.md): the achievements shelf and which one new
 * achievement to celebrate. Pure functions; the page passes in the progress data and the browser storage.
 *
 * Achievements come from two places:
 *  - effort we can count (lessons attended, longest weekly rhythm): never ability, never speed;
 *  - milestones a teacher recorded after a lesson (learner_milestones).
 */

export type EmblemId =
  | 'first-lesson' | 'lessons-10' | 'lessons-25' | 'lessons-50' | 'lessons-100'
  | 'rhythm-4' | 'rhythm-12' | 'rhythm-52'
  | 'surah' | 'juz' | 'tajweed' | 'level' | 'teacher';

export interface Bilingual { en: string; ar: string }

export interface ShelfItem {
  emblem: EmblemId;
  earned: boolean;
  title: Bilingual;
  /** What earns it, shown while it is still ahead. */
  earnBy: Bilingual;
  /** Teacher-recorded milestones carry their own title and date. */
  detail?: Bilingual;
  earnedAt?: string;
}

export interface CelebrationItem {
  key: string;
  emblem: EmblemId;
  title: Bilingual;
}

export interface MilestoneInput {
  id: string;
  kind: string;
  title_en: string;
  title_ar: string;
  reached_at: string;
}

export interface AchievementInput {
  lessonsTotal: number;
  longestRhythm: number;
  milestones: MilestoneInput[];
}

const COUNT_STEPS: Array<{ n: number; emblem: EmblemId; title: Bilingual }> = [
  { n: 1, emblem: 'first-lesson', title: { en: 'First lesson', ar: 'أول حصة' } },
  { n: 10, emblem: 'lessons-10', title: { en: '10 lessons', ar: '١٠ حصص' } },
  { n: 25, emblem: 'lessons-25', title: { en: '25 lessons', ar: '٢٥ حصة' } },
  { n: 50, emblem: 'lessons-50', title: { en: '50 lessons', ar: '٥٠ حصة' } },
  { n: 100, emblem: 'lessons-100', title: { en: '100 lessons', ar: '١٠٠ حصة' } }
];

const RHYTHM_STEPS: Array<{ n: number; emblem: EmblemId; title: Bilingual; earnBy: Bilingual }> = [
  { n: 4, emblem: 'rhythm-4', title: { en: 'A month of rhythm', ar: 'شهر على نفس الإيقاع' }, earnBy: { en: 'At least one lesson a week for 4 weeks in a row', ar: 'حصة على الأقل كل أسبوع لمدة ٤ أسابيع ورا بعض' } },
  { n: 12, emblem: 'rhythm-12', title: { en: 'Three steady months', ar: 'ثلاث شهور ثابتة' }, earnBy: { en: 'At least one lesson a week for 12 weeks in a row', ar: 'حصة على الأقل كل أسبوع لمدة ١٢ أسبوع ورا بعض' } },
  { n: 52, emblem: 'rhythm-52', title: { en: 'A full year', ar: 'سنة كاملة' }, earnBy: { en: 'At least one lesson every week for a whole year', ar: 'حصة على الأقل كل أسبوع لمدة سنة كاملة' } }
];

const KIND_EMBLEM: Record<string, { emblem: EmblemId; title: Bilingual; earnBy: Bilingual }> = {
  surah_memorized: { emblem: 'surah', title: { en: 'A surah memorised', ar: 'حفظ سورة' }, earnBy: { en: 'Your teacher records a surah you memorised', ar: 'معلمك يسجّل سورة حفظتها' } },
  juz_completed: { emblem: 'juz', title: { en: 'A juz completed', ar: 'إتمام جزء' }, earnBy: { en: 'Your teacher records a full juz', ar: 'معلمك يسجّل جزءاً كاملاً' } },
  rule_mastered: { emblem: 'tajweed', title: { en: 'A tajweed rule mastered', ar: 'إتقان حكم تجويد' }, earnBy: { en: 'Your teacher records a rule you mastered', ar: 'معلمك يسجّل حكماً أتقنته' } },
  level_completed: { emblem: 'level', title: { en: 'A level or book completed', ar: 'إتمام مستوى أو كتاب' }, earnBy: { en: 'Finish a level or a book with your teacher', ar: 'تخلّص مستوى أو كتاب مع معلمك' } }
};
KIND_EMBLEM.book_completed = KIND_EMBLEM.level_completed;

const TEACHER_EMBLEM = { emblem: 'teacher' as EmblemId, title: { en: "Teacher's recognition", ar: 'تقدير المعلم' } };

const countEarnBy = (n: number): Bilingual =>
  n === 1
    ? { en: 'Attend your first lesson', ar: 'احضر أول حصة' }
    : { en: `Attend ${n} lessons`, ar: `احضر ${n.toLocaleString('ar-EG')} ${n <= 10 ? 'حصص' : 'حصة'}` };

/** The shelf: the 12 standard emblems (earned in colour, the rest in outline) plus any custom teacher recognitions. */
export function buildShelf(input: AchievementInput): ShelfItem[] {
  const items: ShelfItem[] = [];
  for (const s of COUNT_STEPS) items.push({ emblem: s.emblem, earned: input.lessonsTotal >= s.n, title: s.title, earnBy: countEarnBy(s.n) });
  for (const s of RHYTHM_STEPS) items.push({ emblem: s.emblem, earned: input.longestRhythm >= s.n, title: s.title, earnBy: s.earnBy });
  for (const kind of ['surah_memorized', 'juz_completed', 'rule_mastered', 'level_completed']) {
    const def = KIND_EMBLEM[kind];
    const matches = input.milestones
      .filter((m) => KIND_EMBLEM[m.kind]?.emblem === def.emblem)
      .sort((a, b) => b.reached_at.localeCompare(a.reached_at));
    const newest = matches[0];
    items.push({
      emblem: def.emblem,
      earned: Boolean(newest),
      title: def.title,
      earnBy: def.earnBy,
      ...(newest ? { detail: { en: newest.title_en, ar: newest.title_ar }, earnedAt: newest.reached_at } : {})
    });
  }
  for (const m of input.milestones.filter((x) => !KIND_EMBLEM[x.kind])) {
    items.push({ emblem: 'teacher', earned: true, title: TEACHER_EMBLEM.title, earnBy: TEACHER_EMBLEM.title, detail: { en: m.title_en, ar: m.title_ar }, earnedAt: m.reached_at });
  }
  return items;
}

/** Everything earned now, as stable keys, most worth celebrating first. */
export function earnedCelebrations(input: AchievementInput): CelebrationItem[] {
  const out: CelebrationItem[] = [];
  const teacher = [...input.milestones].sort((a, b) => b.reached_at.localeCompare(a.reached_at));
  for (const m of teacher) {
    const def = KIND_EMBLEM[m.kind];
    out.push({ key: `ms:${m.id}`, emblem: def ? def.emblem : 'teacher', title: { en: m.title_en, ar: m.title_ar } });
  }
  for (const s of [...COUNT_STEPS].reverse()) if (input.lessonsTotal >= s.n) out.push({ key: `lessons:${s.n}`, emblem: s.emblem, title: s.title });
  for (const s of [...RHYTHM_STEPS].reverse()) if (input.longestRhythm >= s.n) out.push({ key: `rhythm:${s.n}`, emblem: s.emblem, title: s.title });
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
