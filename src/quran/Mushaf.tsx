import React, { useMemo } from 'react';
import { parseTajweed, ruleColor, rulesIn, TAJWEED_RULES } from '../lib/quran/tajweed';
import { QURAN_FONT, useQuranFont } from '../curriculum/slides/Say';
import { useT } from '../lib/language';
import { cn } from '../lib/utils';
import { wordKey, type MarkType, type QuranChapter, type QuranPage, type QuranWord } from './api';

/** Mark colours are ours (never green): crimson, copper, gold and teal; the tajweed colours inside the words are content. */
export const MARK_STYLE: Record<MarkType, { line: string; bg: string; en: string; ar: string }> = {
  wrong_word: { line: 'var(--crimson, #A3263A)', bg: 'rgba(163,38,58,0.12)', en: 'Wrong word', ar: 'كلمة غلط' },
  missed: { line: '#B5835A', bg: 'rgba(181,131,90,0.16)', en: 'Missed', ar: 'ناقصة' },
  added: { line: 'var(--gold, #C9A227)', bg: 'rgba(201,162,39,0.16)', en: 'Added', ar: 'زيادة' },
  tajweed: { line: 'var(--teal, #0B8FA3)', bg: 'rgba(11,143,163,0.12)', en: 'Tajweed note', ar: 'ملاحظة تجويد' },
};
/** Detector flags (4.4) reuse the mark look: changed = wrong word, missing = missed, extra = added. */
export const FLAG_AS_MARK = { changed: 'wrong_word', missing: 'missed', extra: 'added' } as const;

const arDigits = (n: number) => n.toLocaleString('ar-EG');

function Word({ w, verseKey, mark, active, dim, onWord }: {
  w: QuranWord; verseKey: string; mark?: MarkType; active: boolean; dim: boolean; onWord?: (key: string, el: HTMLElement) => void;
}) {
  const parts = useMemo(() => parseTajweed(w.t), [w.t]);
  const key = wordKey(verseKey, w.p);
  const style: React.CSSProperties = mark ? { textDecoration: 'underline wavy', textDecorationColor: MARK_STYLE[mark].line, textUnderlineOffset: '0.45em', background: MARK_STYLE[mark].bg } : {};
  const inner = parts.map((p, i) => <span key={i} style={p.rule && ruleColor(p.rule) ? { color: ruleColor(p.rule)! } : undefined}>{p.text}</span>);
  const cls = cn('rounded-md px-[0.08em] transition-colors', active && 'bg-[var(--gold,#C9A227)]/30', dim && 'opacity-40');
  return onWord ? (
    <button type="button" data-word={key} onClick={(e) => onWord(key, e.currentTarget)} style={style}
      className={cn(cls, 'cursor-pointer hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--focus)]')}>
      {inner}
    </button>
  ) : <span data-word={key} style={style} className={cls}>{inner}</span>;
}

/**
 * One mushaf page (Uthmani, 15-line layout from the API) with tajweed colours. Words wrap on a narrow phone; on a wide
 * screen each line is justified like the printed page. `onWord` makes the words tappable (teacher marks).
 */
export function Mushaf({ page, chapters, bismillah, marks, active, range, onWord, className }: {
  page: QuranPage;
  chapters?: QuranChapter[];
  /** The words of 1:1, shown above each surah that opens with the basmala. */
  bismillah?: QuranWord[];
  marks?: Map<string, MarkType>;
  active?: string | null;
  /** Ayat outside it are dimmed (homework). */
  range?: { surah: number; from: number; to: number } | null;
  onWord?: (key: string, el: HTMLElement) => void;
  className?: string;
}) {
  useQuranFont();
  const { isAr } = useT();
  const lines = useMemo(() => {
    const out = new Map<number, Array<{ verse: QuranPage['verses'][number]; w: QuranWord; last: boolean }>>();
    for (const v of page.verses) v.words.forEach((w, i) => {
      if (!out.has(w.line)) out.set(w.line, []);
      out.get(w.line)!.push({ verse: v, w, last: i === v.words.length - 1 });
    });
    return [...out.entries()].sort((a, b) => a[0] - b[0]);
  }, [page]);
  const inRange = (v: { chapter: number; verse: number }) => !range || (v.chapter === range.surah && v.verse >= range.from && v.verse <= range.to);

  return (
    <div dir="rtl" lang="ar" className={cn('mushaf-page mx-auto w-full max-w-[44rem] rounded-[var(--r-3,1.25rem)] bg-[#FBF6EC] px-3 py-5 text-[#1F1A17] shadow-sm ring-1 ring-[#E6D9C3] sm:px-8', className)}
      style={{ fontFamily: QURAN_FONT, fontSize: 'clamp(1.2rem, 4.4vw, 1.85rem)', lineHeight: 2.3 }} aria-label={isAr ? `صفحة ${arDigits(page.page)}` : `Page ${page.page}`}>
      {lines.map(([line, items]) => {
        const opener = items.find((x) => x.verse.verse === 1 && x.w.p === 1);
        const ch = opener && chapters?.find((c) => c.n === opener.verse.chapter);
        return (
          <React.Fragment key={line}>
            {opener && (
              <div className="my-2 grid justify-items-center gap-1 text-center">
                <div className="w-full rounded-full border border-[#D9C7A6] bg-[#F3E7D2] py-1 text-[0.8em] text-[#7A5A2E]">{ch ? `سورة ${ch.ar}` : ''}</div>
                {ch?.bismillah && bismillah && <div className="text-[0.9em]">{bismillah.map((w) => <span key={w.p}>{parseTajweed(w.t).map((p, i) => <span key={i} style={p.rule && ruleColor(p.rule) ? { color: ruleColor(p.rule)! } : undefined}>{p.text}</span>)} </span>)}</div>}
              </div>
            )}
            <div className="mushaf-line flex flex-wrap justify-center gap-x-[0.28em] sm:justify-between">
              {items.map(({ verse, w, last }) => (
                <React.Fragment key={`${verse.key}:${w.p}`}>
                  <Word w={w} verseKey={verse.key} mark={marks?.get(wordKey(verse.key, w.p))} active={active === wordKey(verse.key, w.p)} dim={!inRange(verse)} onWord={onWord} />
                  {last && <span className={cn('select-none text-[0.8em] text-[#A06620]', !inRange(verse) && 'opacity-40')} aria-label={isAr ? `آية ${arDigits(verse.verse)}` : `Ayah ${verse.verse}`}>﴿{arDigits(verse.verse)}﴾</span>}
                </React.Fragment>
              ))}
            </div>
          </React.Fragment>
        );
      })}
      <div className="mt-3 text-center text-[0.6em] text-[#7A5A2E]">{arDigits(page.page)}</div>
    </div>
  );
}

/** The tajweed colours on this page and what they mean. */
export function TajweedLegend({ page }: { page: QuranPage }) {
  const { isAr, t } = useT();
  const rules = useMemo(() => rulesIn(page.verses.flatMap((v) => v.words.map((w) => parseTajweed(w.t)))), [page]);
  if (!rules.length) return null;
  return (
    <details className="rounded-xl border border-border bg-surface p-3 text-sm">
      <summary className="cursor-pointer font-semibold">{t('Tajweed colours on this page', 'ألوان التجويد في الصفحة دي')}</summary>
      <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {rules.map((r) => (
          <li key={r} className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full ring-1 ring-black/10" style={{ background: TAJWEED_RULES[r].color }} aria-hidden="true" />
            <span>{isAr ? TAJWEED_RULES[r].ar : TAJWEED_RULES[r].en}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}
