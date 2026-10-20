import { BOOKING_SERVICES } from '../../booking/mockData.js';

/**
 * The subject catalog (RULES.md "Subjects", owner 2026-10-18): what can be chosen today, in three families, each
 * with a brand colour and an Arabic-letter mark. The Scholar's Path has no courses yet, so it has no family here
 * (src/curriculum/catalog.ts holds its empty slot). Retired subjects are kept below only to label old records.
 */

/** A level as the learner sees it. `id` is one of the four generic levels the placement banks are written for. */
export interface SubjectLevel { id: 'beginner' | 'elementary' | 'intermediate' | 'advanced'; en: string; ar: string; descEn: string; descAr: string }
export interface Subject { id: string; glyph: string; spineEn: string; spineAr: string; en: string; ar: string; levels?: SubjectLevel[] }
export interface Family { key: string; color: string; en: string; ar: string; subjects: Subject[] }

/** One level only: no level picker; the version (Kids / Teens / Adults) comes from the learner's age. */
const BY_AGE: SubjectLevel[] = [
  { id: 'beginner', en: 'Fits your age', ar: 'على قد سنك', descEn: 'The version is picked from your age.', descAr: 'النسخة بتتحدد من السن.' }
];

export const SUBJECT_FAMILIES: Family[] = [
  {
    key: 'quran', color: '#087D91', en: 'Quran', ar: 'القرآن الكريم',
    subjects: [
      {
        id: 'quran-reading', glyph: 'ق', spineEn: 'Reading', spineAr: 'القراءة', en: 'Quran reading', ar: 'قراءة القرآن',
        levels: [
          { id: 'beginner', en: 'Foundations', ar: 'التأسيس', descEn: 'The letters, their sounds and the qaida, from zero.', descAr: 'الحروف وأصواتها والقاعدة، من الصفر.' },
          { id: 'intermediate', en: 'Reading the Mushaf', ar: 'القراءة من المصحف', descEn: 'Knows the letters; reading from the Mushaf until it flows.', descAr: 'بيعرف الحروف، وبيقرأ من المصحف لحد ما يقرأ بطلاقة.' }
        ]
      },
      {
        id: 'tajweed', glyph: 'ج', spineEn: 'Tajweed', spineAr: 'التجويد', en: 'Tajweed', ar: 'التجويد',
        levels: [
          { id: 'beginner', en: 'Level 1', ar: 'المستوى الأول', descEn: 'The essential rules, applied as you recite.', descAr: 'الأحكام الأساسية، وتطبيقها وانت بتقرأ.' },
          { id: 'intermediate', en: 'Level 2', ar: 'المستوى الثاني', descEn: 'Where each letter comes from and its qualities.', descAr: 'مخارج الحروف وصفاتها.' },
          { id: 'advanced', en: 'Level 3', ar: 'المستوى الثالث', descEn: 'The advanced rules, until the whole picture is complete.', descAr: 'الأحكام المتقدمة، لحد ما الصورة تكمل.' }
        ]
      },
      {
        // shortcut: the goal (new / revision) is stored as a level so the placement banks keep working; give it its own field if reports need it.
        id: 'quran-memorization', glyph: 'ح', spineEn: 'Hifz', spineAr: 'الحفظ', en: 'Memorization & revision', ar: 'الحفظ والمراجعة',
        levels: [
          { id: 'beginner', en: 'Starting out', ar: 'لسه ببدأ', descEn: 'New memorization, from the short surahs.', descAr: 'حفظ جديد، من السور القصيرة.' },
          { id: 'intermediate', en: 'Adding more', ar: 'بزوّد', descEn: 'I know some juz and want to go further.', descAr: 'حافظ كام جزء وعايز أكمّل.' },
          { id: 'advanced', en: 'Keeping it firm', ar: 'بثبّت', descEn: 'Mostly revision: keeping what I have.', descAr: 'مراجعة في الأساس: أثبّت اللي حفظته.' }
        ]
      }
    ]
  },
  {
    key: 'zad', color: '#8B4935', en: 'The Zad Path', ar: 'مسار الأثر',
    subjects: [
      { id: 'zad-essentials', glyph: 'ز', spineEn: 'Zad', spineAr: 'أول الزاد', en: 'Zad Essentials', ar: 'أول الزاد', levels: BY_AGE },
      { id: 'seerah', glyph: 'س', spineEn: 'Seerah', spineAr: 'السيرة', en: 'Seerah', ar: 'السيرة النبوية', levels: BY_AGE }
    ]
  },
  {
    key: 'languages', color: '#C51F24', en: 'Languages', ar: 'اللغات',
    subjects: [
      {
        id: 'modern-standard-arabic', glyph: 'ض', spineEn: 'Fusha', spineAr: 'الفصحى', en: 'Fusha Arabic', ar: 'العربية الفصحى',
        levels: [
          { id: 'beginner', en: 'Foundations', ar: 'التأسيس', descEn: 'The alphabet, reading and writing, from zero.', descAr: 'الحروف والقراءة والكتابة، من الصفر.' },
          { id: 'elementary', en: 'Beginner', ar: 'مبتدئ', descEn: 'Reads; building words, sentences and first conversations.', descAr: 'بيقرأ، وبيبني كلمات وجمل وأول محادثات.' },
          { id: 'intermediate', en: 'Intermediate', ar: 'متوسط', descEn: 'Understands and speaks with some hesitation.', descAr: 'بيفهم وبيتكلم مع شوية تردد.' },
          { id: 'advanced', en: 'Advanced', ar: 'متقدم', descEn: 'Fluent; deepening grammar, texts and style.', descAr: 'متمكن، وبيتعمق في النحو والنصوص والأسلوب.' }
        ]
      },
      {
        id: 'egyptian-arabic', glyph: 'م', spineEn: 'Egyptian', spineAr: 'المصري', en: 'Egyptian Arabic', ar: 'اللهجة المصرية',
        levels: [
          { id: 'beginner', en: 'Sounds', ar: 'الأصوات', descEn: 'The sounds of the dialect and the first everyday words.', descAr: 'أصوات اللهجة وأول كلمات الحياة اليومية.' },
          { id: 'elementary', en: 'Beginner', ar: 'مبتدئ', descEn: 'Simple everyday conversations.', descAr: 'محادثات يومية بسيطة.' },
          { id: 'intermediate', en: 'Intermediate', ar: 'متوسط', descEn: 'Talks about most things, with some hesitation.', descAr: 'بيتكلم في أغلب الحاجات مع شوية تردد.' },
          { id: 'advanced', en: 'Advanced', ar: 'متقدم', descEn: 'Fluent; idioms, humour and fast speech.', descAr: 'متمكن، تعبيرات وهزار وكلام سريع.' }
        ]
      },
      {
        id: 'english', glyph: 'E', spineEn: 'English', spineAr: 'الإنجليزي', en: 'English', ar: 'الإنجليزية',
        levels: [
          { id: 'beginner', en: 'A1 · Starter', ar: 'A1 · بداية', descEn: 'Kids: phonics and first reading. Others: the basics.', descAr: 'الأطفال: الأصوات وأول قراءة. الباقي: الأساسيات.' },
          { id: 'elementary', en: 'A2', ar: 'A2', descEn: 'Simple sentences about daily life.', descAr: 'جمل بسيطة عن الحياة اليومية.' },
          { id: 'intermediate', en: 'B1 to B2', ar: 'B1 لحد B2', descEn: 'Conversations, reading and writing with some effort.', descAr: 'محادثات وقراءة وكتابة بمجهود.' },
          { id: 'advanced', en: 'C1', ar: 'C1', descEn: 'Fluent and precise; exams and professional English.', descAr: 'طلاقة ودقة، وامتحانات وإنجليزي للشغل.' }
        ]
      }
    ]
  }
];

/** Retired 2026-10-18 (merged into another subject, or waiting for the Scholar's Path courses). Labels only. */
const RETIRED: Family = {
  key: 'retired', color: '#8B4935', en: 'Earlier subjects', ar: 'مواد سابقة',
  subjects: [
    { id: 'quran-revision', glyph: 'ر', spineEn: 'Revision', spineAr: 'المراجعة', en: 'Revision', ar: 'المراجعة والتثبيت' },
    { id: 'islamic-studies', glyph: 'إ', spineEn: 'Studies', spineAr: 'دراسات', en: 'Islamic studies', ar: 'الدراسات الإسلامية' },
    { id: 'aqeedah', glyph: 'ع', spineEn: 'Aqeedah', spineAr: 'العقيدة', en: 'Aqeedah', ar: 'العقيدة' },
    { id: 'fiqh', glyph: 'ف', spineEn: 'Fiqh', spineAr: 'الفقه', en: 'Fiqh', ar: 'الفقه الميسر' },
    { id: 'arabic-foundations', glyph: 'أ', spineEn: 'Basics', spineAr: 'الأساسيات', en: 'Arabic basics', ar: 'أساسيات العربية' },
    { id: 'arabic-conversation', glyph: 'ك', spineEn: 'Speaking', spineAr: 'المحادثة', en: 'Conversation', ar: 'المحادثة' }
  ]
};

export function findSubject(id: string): { subject: Subject; family: Family } | null {
  for (const family of [...SUBJECT_FAMILIES, RETIRED]) {
    const subject = family.subjects.find((s) => s.id === id);
    if (subject) return { subject, family };
  }
  return null;
}

/** The levels a learner can pick for a subject (an empty list means the subject is unknown or retired). */
export const levelsFor = (id: string): SubjectLevel[] => findSubject(id)?.subject.levels || [];

export const subjectLabel = (id: string, isAr: boolean) => {
  const found = findSubject(id);
  return found ? (isAr ? found.subject.ar : found.subject.en) : id;
};

/** One-line description of a subject (from the booking catalogue). */
export const subjectTagline = (id: string, isAr: boolean) => {
  const s = BOOKING_SERVICES.find((x) => x.id === id);
  return s ? (isAr ? s.arabicTagline : s.tagline) : '';
};
