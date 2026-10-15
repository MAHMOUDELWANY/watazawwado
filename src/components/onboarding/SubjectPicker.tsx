import React from 'react';
import { Check } from 'lucide-react';

/**
 * Subject choice at onboarding: the site's 13 subjects in three families, each family in one of the
 * brand colours, each subject marked by a large Arabic letter. Radio-group semantics for keyboards
 * and screen readers.
 */

interface Subject { id: string; glyph: string; en: string; ar: string }
interface Family { key: string; color: string; en: string; ar: string; subjects: Subject[] }

export const SUBJECT_FAMILIES: Family[] = [
  {
    key: 'quran', color: '#087D91', en: 'Quran', ar: 'القرآن الكريم',
    subjects: [
      { id: 'quran-reading', glyph: 'ق', en: 'Reading & Noorani Qaida', ar: 'القراءة والقاعدة النورانية' },
      { id: 'tajweed', glyph: 'ج', en: 'Tajweed', ar: 'التجويد ومخارج الحروف' },
      { id: 'quran-memorization', glyph: 'ح', en: 'Memorization (Hifz)', ar: 'الحفظ' },
      { id: 'quran-revision', glyph: 'ر', en: 'Revision (Muraja‘ah)', ar: 'المراجعة والتثبيت' }
    ]
  },
  {
    key: 'islamic', color: '#8B4935', en: 'Islamic studies', ar: 'العلوم الشرعية',
    subjects: [
      { id: 'islamic-studies', glyph: 'إ', en: 'Islamic studies', ar: 'الدراسات الإسلامية' },
      { id: 'aqeedah', glyph: 'ع', en: 'Aqeedah (creed)', ar: 'العقيدة' },
      { id: 'fiqh', glyph: 'ف', en: 'Fiqh (worship & daily life)', ar: 'الفقه الميسر' },
      { id: 'seerah', glyph: 'س', en: 'Seerah', ar: 'السيرة النبوية' }
    ]
  },
  {
    key: 'languages', color: '#C51F24', en: 'Languages', ar: 'اللغات',
    subjects: [
      { id: 'arabic-foundations', glyph: 'أ', en: 'Arabic for beginners', ar: 'أساسيات العربية' },
      { id: 'modern-standard-arabic', glyph: 'ض', en: 'Modern Standard Arabic', ar: 'العربية الفصحى' },
      { id: 'arabic-conversation', glyph: 'ك', en: 'Arabic conversation', ar: 'المحادثة بالعربية' },
      { id: 'egyptian-arabic', glyph: 'م', en: 'Egyptian Arabic', ar: 'اللهجة المصرية' },
      { id: 'english', glyph: 'E', en: 'English', ar: 'اللغة الإنجليزية' }
    ]
  }
];

export const subjectLabel = (id: string, isAr: boolean) => {
  for (const f of SUBJECT_FAMILIES) {
    const s = f.subjects.find((x) => x.id === id);
    if (s) return isAr ? s.ar : s.en;
  }
  return id;
};

export function SubjectPicker({ value, onChange, isAr, name }: { value: string; onChange: (id: string) => void; isAr: boolean; name: string }) {
  const all = SUBJECT_FAMILIES.flatMap((f) => f.subjects.map((s) => s.id));
  const move = (dir: number) => {
    const next = all[(all.indexOf(value) + dir + all.length) % all.length];
    onChange(next);
    document.getElementById(`${name}-${next}`)?.focus();
  };

  return (
    <div className="space-y-5" role="radiogroup" aria-label={isAr ? 'المادة' : 'Subject'}>
      {SUBJECT_FAMILIES.map((family) => (
        <section key={family.key} aria-label={isAr ? family.ar : family.en}>
          <h4 className="flex items-center gap-2 mb-2.5 text-sm font-bold" style={{ color: family.color }}>
            <span className="h-4 w-1 rounded-full" style={{ background: family.color }} aria-hidden="true" />
            {isAr ? family.ar : family.en}
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
            {family.subjects.map((s) => {
              const selected = value === s.id;
              return (
                <button
                  key={s.id}
                  id={`${name}-${s.id}`}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  tabIndex={selected || (!all.includes(value) && s.id === all[0]) ? 0 : -1}
                  onClick={() => onChange(s.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); move(isAr && e.key === 'ArrowRight' ? -1 : 1); }
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); move(isAr && e.key === 'ArrowLeft' ? 1 : -1); }
                  }}
                  className={`group relative flex items-center gap-3 min-h-[64px] p-2.5 rounded-2xl border text-start transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
                    selected ? 'text-white shadow-md' : 'border-border bg-surface hover:bg-surface-subtle text-foreground'
                  }`}
                  style={selected ? { background: family.color, borderColor: family.color } : undefined}
                >
                  <span
                    className={`shrink-0 grid place-items-center w-11 h-11 rounded-xl font-display text-2xl leading-none ${selected ? 'bg-white/20 text-white' : 'dark:brightness-[1.7]'}`}
                    style={selected ? undefined : { background: `${family.color}26`, color: family.color }}
                    aria-hidden="true"
                  >
                    {s.glyph}
                  </span>
                  <span className="text-sm font-semibold leading-snug">{isAr ? s.ar : s.en}</span>
                  {selected && <Check className="absolute top-1.5 end-1.5 w-3.5 h-3.5" aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
