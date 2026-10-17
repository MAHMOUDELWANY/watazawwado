import { BOOKING_SERVICES } from '../../booking/mockData';

/** The site's 14 subjects in three families, each with a brand colour and an Arabic-letter mark. */

export interface Subject { id: string; glyph: string; spineEn: string; spineAr: string; en: string; ar: string }
export interface Family { key: string; color: string; en: string; ar: string; subjects: Subject[] }

export const SUBJECT_FAMILIES: Family[] = [
  {
    key: 'quran', color: '#087D91', en: 'Quran', ar: 'القرآن الكريم',
    subjects: [
      { id: 'quran-reading', glyph: 'ق', spineEn: 'Reading', spineAr: 'القراءة', en: 'Reading & Noorani Qaida', ar: 'القراءة والقاعدة النورانية' },
      { id: 'tajweed', glyph: 'ج', spineEn: 'Tajweed', spineAr: 'التجويد', en: 'Tajweed', ar: 'التجويد' },
      { id: 'quran-memorization', glyph: 'ح', spineEn: 'Hifz', spineAr: 'الحفظ', en: 'Memorization', ar: 'الحفظ' },
      { id: 'quran-revision', glyph: 'ر', spineEn: 'Revision', spineAr: 'المراجعة', en: 'Revision', ar: 'المراجعة والتثبيت' }
    ]
  },
  {
    key: 'islamic', color: '#8B4935', en: 'Islamic studies', ar: 'العلوم الشرعية',
    subjects: [
      { id: 'zad-essentials', glyph: 'ز', spineEn: 'Zad', spineAr: 'أول الزاد', en: 'Zad Essentials', ar: 'أول الزاد' },
      { id: 'islamic-studies', glyph: 'إ', spineEn: 'Studies', spineAr: 'دراسات', en: 'Islamic studies', ar: 'الدراسات الإسلامية' },
      { id: 'aqeedah', glyph: 'ع', spineEn: 'Aqeedah', spineAr: 'العقيدة', en: 'Aqeedah', ar: 'العقيدة' },
      { id: 'fiqh', glyph: 'ف', spineEn: 'Fiqh', spineAr: 'الفقه', en: 'Fiqh', ar: 'الفقه الميسر' },
      { id: 'seerah', glyph: 'س', spineEn: 'Seerah', spineAr: 'السيرة', en: 'Seerah', ar: 'السيرة النبوية' }
    ]
  },
  {
    key: 'languages', color: '#C51F24', en: 'Languages', ar: 'اللغات',
    subjects: [
      { id: 'arabic-foundations', glyph: 'أ', spineEn: 'Basics', spineAr: 'الأساسيات', en: 'Arabic basics', ar: 'أساسيات العربية' },
      { id: 'modern-standard-arabic', glyph: 'ض', spineEn: 'Fusha', spineAr: 'الفصحى', en: 'Fusha Arabic', ar: 'العربية الفصحى' },
      { id: 'arabic-conversation', glyph: 'ك', spineEn: 'Speaking', spineAr: 'المحادثة', en: 'Conversation', ar: 'المحادثة' },
      { id: 'egyptian-arabic', glyph: 'م', spineEn: 'Egyptian', spineAr: 'المصري', en: 'Egyptian Arabic', ar: 'اللهجة المصرية' },
      { id: 'english', glyph: 'E', spineEn: 'English', spineAr: 'الإنجليزي', en: 'English', ar: 'الإنجليزية' }
    ]
  }
];

export function findSubject(id: string): { subject: Subject; family: Family } | null {
  for (const family of SUBJECT_FAMILIES) {
    const subject = family.subjects.find((s) => s.id === id);
    if (subject) return { subject, family };
  }
  return null;
}

export const subjectLabel = (id: string, isAr: boolean) => {
  const found = findSubject(id);
  return found ? (isAr ? found.subject.ar : found.subject.en) : id;
};

/** One-line description of a subject (from the booking catalogue). */
export const subjectTagline = (id: string, isAr: boolean) => {
  const s = BOOKING_SERVICES.find((x) => x.id === id);
  return s ? (isAr ? s.arabicTagline : s.tagline) : '';
};
