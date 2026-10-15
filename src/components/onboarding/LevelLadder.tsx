import React from 'react';

/**
 * Current level as a rising four-step ladder: the steps grow taller from beginner to advanced and
 * fill up to the chosen one, with that level's description underneath.
 */

export const LEVELS = [
  { id: 'beginner', en: 'Beginner', ar: 'مبتدئ', descEn: 'Starting from the letters or with no background yet.', descAr: 'بادئ من الحروف أو من غير خلفية قبل كده.' },
  { id: 'elementary', en: 'Elementary', ar: 'أساسي', descEn: 'Knows letters and simple words; building fluency.', descAr: 'بيعرف الحروف والكلمات البسيطة، وبيبني الطلاقة.' },
  { id: 'intermediate', en: 'Intermediate', ar: 'متوسط', descEn: 'Reads or speaks with some hesitation; needs polishing.', descAr: 'بيقرأ أو بيتكلم مع شوية تردد، ومحتاج ضبط.' },
  { id: 'advanced', en: 'Advanced', ar: 'متقدم', descEn: 'Fluent; deepening rules, memorization or advanced study.', descAr: 'متمكن، وبيتعمق في الأحكام أو الحفظ أو الدراسة المتقدمة.' }
];

export function LevelLadder({ value, onChange, isAr, name }: { value: string; onChange: (id: string) => void; isAr: boolean; name: string }) {
  const at = Math.max(0, LEVELS.findIndex((l) => l.id === value));
  const pick = (i: number) => {
    const next = LEVELS[Math.min(LEVELS.length - 1, Math.max(0, i))];
    onChange(next.id);
    document.getElementById(`${name}-${next.id}`)?.focus();
  };

  return (
    <div>
      <div role="radiogroup" aria-label={isAr ? 'المستوى الحالي' : 'Current level'} className="grid grid-cols-4 gap-1.5 items-end">
        {LEVELS.map((l, i) => {
          const filled = i <= at;
          const selected = i === at;
          return (
            <button
              key={l.id}
              id={`${name}-${l.id}`}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(l.id)}
              onKeyDown={(e) => {
                const fwd = isAr ? 'ArrowLeft' : 'ArrowRight';
                const back = isAr ? 'ArrowRight' : 'ArrowLeft';
                if (e.key === fwd || e.key === 'ArrowUp') { e.preventDefault(); pick(at + 1); }
                if (e.key === back || e.key === 'ArrowDown') { e.preventDefault(); pick(at - 1); }
              }}
              className="group flex flex-col items-stretch gap-1.5 cursor-pointer focus-visible:outline-none"
            >
              <span
                className={`block rounded-t-xl rounded-b-md transition-colors group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 ${
                  filled ? '' : 'bg-surface-subtle group-hover:bg-border'
                }`}
                style={{ height: `${28 + i * 16}px`, background: filled ? (selected ? '#087D91' : '#087D9155') : undefined }}
                aria-hidden="true"
              />
              <span className={`text-xs sm:text-sm text-center leading-tight ${selected ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>
                {isAr ? l.ar : l.en}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-foreground/80 min-h-[2.5rem]" aria-live="polite">
        {isAr ? LEVELS[at].descAr : LEVELS[at].descEn}
      </p>
    </div>
  );
}
