import type { Lesson } from './types';

// The Egyptian Franco track (design §4.6, egyptian/RULES.md §1): the Egyptian Adults lessons with every Arabic line in
// Franco, the spelling in docs/curriculum/franco/RULES.md. Each Arabic word or phrase the lessons use is listed once
// here; `toFranco` swaps every Arabic run of a text, longest phrase first. The test fails on any word not listed.

export const FRANCO_TRACK = 'egyptian-franco';
/** The Franco track plays the Egyptian Adults recordings: same lessons, same voice. */
export const FRANCO_SOURCE = 'egyptian-adults';

/** Egyptian Arabic (as written in the lessons) → Franco. Keys with vowel marks win over their bare form. */
export const FRANCO: Record<string, string> = {
  // phrases first, where the words join or change when said together
  'السلام عليكم': 'el salamo 3alaykom', 'وعليكم السلام': 'w 3alaykom el salam', 'مع السلامة': 'ma3a el salama',
  'صباح الخير': 'saba7 el 5eer', 'صباح النور': 'saba7 el noor', 'أهلاً وسهلاً': 'ahlan w sahlan',
  // Lesson 1
  'أهلاً': 'ahlan', 'وسهلاً': 'w sahlan', 'اسم': 'esm', 'اسمي': 'esmi', 'اسمك': 'esmak', 'اسمَك': 'esmak', 'اسمِك': 'esmek',
  'اسمَ': 'esma', 'اسمِ': 'esme', 'ك': 'k', 'إيه': 'eh', 'السلام': 'el salam', 'السلامة': 'el salama', 'عليكم': '3alaykom',
  'وعليكم': 'w 3alaykom', 'مَا': 'ma', 'اسْمُكَ': 'ismuka', 'آدم': 'Adam', 'أنا': 'ana', 'سيّد': 'Sayed', 'البوّاب': 'el bawwab',
  'تشرّفنا': 'etsharrafna', 'الشرف': 'el sharaf', 'ليّا': 'leyya', 'صباح': 'saba7', 'الخير': 'el 5eer', 'النور': 'el noor',
  'بيك': 'beek', 'بيكي': 'beeki', 'فين': 'feen', 'كام': 'kam', 'منى': 'Mona', 'بيتي': 'beeti', 'بيتَك': 'beetak',
  'بيتِك': 'beetek', 'إنت': 'enta', 'إنتي': 'enti', 'وإنت': 'w enta', 'حضرتك': '7adretak', 'حضرتَك': '7adretak',
  'حضرتِك': '7adretek', 'وحضرتك': 'w 7adretak', 'وحضرتَك': 'w 7adretak', 'حضرة': '7adra', 'عمّ': '3amm', 'آسف': 'asef',
  'آسفة': 'asfa', 'ولا': 'wala', 'يهمّك': 'yhemmak', 'يهمِّك': 'yhemmek', 'شكراً': 'shokran', 'العفو': 'el 3afw', 'مع': 'ma3a',
  'الله': 'Allah', 'يسلّمك': 'ysallemak', 'يسلّمَك': 'ysallemak', 'يسلّمِك': 'ysallemek', 'يسلّمَ': 'ysallema',
  'يسلّمِ': 'ysalleme', 'ـَك': '-ak', 'ـِك': '-ek', 'ـي': '-i', 'تمام': 'tamam', 'ع': '3', 'ح': '7', 'منين': 'meneen',
  'فصحى': 'Fus7a', 'مصري': 'Masri',
  // Lesson 2
  'من': 'men', 'يا': 'ya', 'هنا': 'hena', 'وأنا': 'w ana', 'وإنتي': 'w enti', 'هي': 'heyya', 'وهي': 'w heyya',
  'هو': 'howwa', 'ـية': '-eyya', 'ـاني': '-ani', 'ج': 'g', 'إزيّك': 'ezzayak', 'القاهرة': 'el 2ahera', 'أسوان': 'Aswan',
  'إسكندرية': 'Eskendereyya', 'طنطا': 'Tanta', 'مصر': 'Masr', 'إنجلترا': 'Engeltera', 'أمريكا': 'Amreeka', 'كندا': 'Kanada',
  'ألمانيا': 'Almanya', 'السعودية': 'el Sa3odeyya', 'مصرية': 'Masreyya', 'إنجليزي': 'engeleezi', 'إنجليزية': 'engeleezeyya',
  'كندي': 'kanadi', 'كندية': 'kanadeyya', 'ألماني': 'almani', 'ألمانية': 'almaneyya', 'أمريكاني': 'amreekani',
  'أمريكانية': 'amreekaneyya', 'أيوه': 'aywa', 'لأ': 'la2', 'نعم': 'na3am', 'لا': 'la', 'جديد': 'gedeed', 'جديدة': 'gedeeda',
  'جميل': 'gameel', 'جميلة': 'gameela', 'جامعة': 'gam3a', 'ممتاز': 'momtaz', 'ده': 'da', 'دي': 'di',
};

const MARKS = /[ً-ْٰ]/g;
const bare = (s: string) => s.replace(MARKS, '');
const BARE = new Map(Object.entries(FRANCO).map(([k, v]) => [bare(k), v]));
const find = (s: string) => FRANCO[s] ?? BARE.get(bare(s));
const PUNCT: Record<string, string> = { '؟': '?', '،': ',' };

/** Words with no Franco yet, collected while converting (the test reads this). */
export const missingFranco = new Set<string>();

/** Swaps every Arabic run in a text for its Franco spelling. */
export function toFranco(text: string): string {
  // Arrows written for right-to-left lines point the other way once the line reads left to right.
  const ltr = /[؀-ۿ]/.test(text) ? text.replace(/←/g, '→') : text;
  return ltr.replace(/[؀-ۿ]+(?:\s+[؀-ۿ]+)*/g, (run) => {
    const words = run.split(/\s+/);
    const out: string[] = [];
    for (let i = 0; i < words.length;) {
      let n = Math.min(4, words.length - i);
      for (; n > 0; n--) {
        const raw = words.slice(i, i + n).join(' ');
        const tail = raw.match(/[؟،]+$/)?.[0] ?? '';
        const hit = find(raw.slice(0, raw.length - tail.length));
        if (hit !== undefined) { out.push(hit + [...tail].map((c) => PUNCT[c]).join('')); break; }
      }
      if (n === 0) { missingFranco.add(words[i]); out.push(words[i]); n = 1; }
      i += n;
    }
    return out.join(' ');
  });
}

/** Lines that say something only true in Arabic script, rewritten for Franco: `${lesson}:${page}` → lines. */
const OVERRIDES: Record<string, string[]> = {
  '1:6': [
    'esm means name. The ending says whose.',
    'Three endings: one for me, one for "you" to a man, one for "you" to a woman.',
    'In Arabic script esmak and esmek look the same. Franco writes the vowel, so you see the difference: -ak, -ek.',
  ],
};

/** Deep-converts every string of a value (lesson data), leaving ids, file names and numbers alone. */
function convert<T>(v: T, key = ''): T {
  if (typeof v === 'string') return (['id', 'scene', 'ayah', 'voice', 'station', 'layout', 'bin'].includes(key) ? v : toFranco(v)) as T;
  if (Array.isArray(v)) return v.map((x) => convert(x, key)) as T;
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, k === 'teacherAr' || k === 'titleAr' ? x : convert(x, k)])) as T;
  return v;
}

/** An Egyptian Adults lesson in Franco, for the Franco track. Clip texts change on screen; the audio stays the same. */
export function francoLesson(lesson: Lesson): Lesson {
  const l = convert(lesson);
  l.pages = l.pages.map((p, i) => (OVERRIDES[`${lesson.number}:${i}`] ? { ...p, lines: OVERRIDES[`${lesson.number}:${i}`] } : p));
  return { ...l, subject: FRANCO_TRACK, subjectTitle: 'Egyptian Arabic · Franco', titleAr: lesson.titleAr };
}
