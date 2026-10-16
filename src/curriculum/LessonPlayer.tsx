import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Star, StickyNote, Check, RotateCcw } from 'lucide-react';
import type { Interaction, Lesson, LessonPage } from './types';
import { Scene } from './Scenes';

/** Result of a game checkpoint: correct answers per bin, for the teacher report (PLAN §3a.3b). */
export type GameResult = Record<string, { correct: number; total: number }>;

interface Props {
  lesson: Lesson;
  /** Chrome language; lesson content is always English (PLAN §3.11). */
  lang: 'ar' | 'en';
  /** Teacher mode shows teacher notes and the praise button. */
  teacher?: boolean;
  onGameResult?: (pageIndex: number, result: GameResult) => void;
  /** Called with the 0-based page index whenever the page changes (the teacher report uses it). */
  onPageChange?: (pageIndex: number) => void;
}

export function LessonPlayer({ lesson, lang, teacher = false, onGameResult, onPageChange }: Props) {
  const [index, setIndex] = useState(0);
  const [showNote, setShowNote] = useState(false);
  const [praise, setPraise] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const page = lesson.pages[index];
  const last = lesson.pages.length - 1;
  const L = (en: string, ar: string) => (lang === 'ar' ? ar : en);

  useEffect(() => onPageChange?.(index), [index, onPageChange]);

  const go = useCallback((delta: number) => setIndex((i) => Math.min(last, Math.max(0, i + delta))), [last]);
  const cheer = useCallback(() => {
    setPraise(true);
    window.setTimeout(() => setPraise(false), 1800);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); go(1); }
      else if (e.key === 'ArrowLeft') go(-1);
      else if (teacher && (e.key === 'p' || e.key === 'P')) cheer();
      else if (teacher && (e.key === 'n' || e.key === 'N')) setShowNote((s) => !s);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, cheer, teacher]);

  useEffect(() => {
    const sync = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  };

  const toolBtn = 'h-10 min-w-10 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-semibold text-foreground hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40';

  return (
    <div ref={rootRef} className={`flex flex-col gap-3 ${fullscreen ? 'bg-background p-4 h-full justify-center' : ''}`}>
      <div dir="ltr" lang="en" className="relative w-full overflow-hidden rounded-[var(--r-4,28px)] glass-2 lg:aspect-video">
        <div className="absolute top-0 inset-x-0 h-1 bg-surface-subtle z-10" aria-hidden="true">
          <motion.div className="h-full bg-gold" animate={{ width: `${((index + 1) / lesson.pages.length) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>
        {/* Keyed enter animation only: exit animations can stall on fast page flips and leave the stage blank. */}
        <motion.section
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="grid lg:grid-cols-[1.15fr_1fr] h-full"
            aria-label={`${page.title}, ${index + 1} / ${lesson.pages.length}`}
          >
            <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto lg:h-full bg-surface-warm">
              <Scene id={page.scene} label={page.title} />
            </div>
            <PageText page={page} pageIndex={index} onCorrect={cheer} onGameResult={onGameResult} />
          </motion.section>
        <AnimatePresence>{praise && <Praise />}</AnimatePresence>
      </div>

      {teacher && showNote && page.teacherNote && (
        <p className="glass-1 rounded-2xl px-4 py-3 text-sm text-foreground" role="note">
          <span className="font-bold">{L('Teacher note: ', 'ملاحظة للمعلم: ')}</span>
          <span dir="ltr">{page.teacherNote}</span>
        </p>
      )}

      <nav aria-label={L('Lesson controls', 'التحكم في الدرس')} className="flex items-center justify-between gap-2 glass-1 rounded-full p-1.5">
        <button type="button" className={toolBtn} onClick={() => go(-1)} disabled={index === 0} aria-label={L('Previous page', 'الصفحة السابقة')}>
          <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
        </button>
        <span className="text-sm font-semibold tabular-nums text-muted-foreground" aria-live="polite">
          {L('Page', 'صفحة')} {index + 1} / {lesson.pages.length}
        </span>
        <div className="flex items-center gap-1">
          {teacher && (
            <>
              <button type="button" className={toolBtn} onClick={cheer} title={L('Praise (P)', 'تشجيع (P)')} aria-label={L('Praise', 'تشجيع')}>
                <Star className="w-[18px] h-[18px] text-gold" />
              </button>
              <button
                type="button"
                className={toolBtn}
                onClick={() => setShowNote((s) => !s)}
                disabled={!page.teacherNote}
                aria-pressed={showNote}
                title={L('Teacher note (N)', 'ملاحظة المعلم (N)')}
                aria-label={L('Teacher note', 'ملاحظة المعلم')}
              >
                <StickyNote className="w-[18px] h-[18px]" />
              </button>
            </>
          )}
          <button type="button" className={toolBtn} onClick={toggleFullscreen} aria-label={fullscreen ? L('Exit full screen', 'خروج من ملء الشاشة') : L('Full screen', 'ملء الشاشة')}>
            {fullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
          </button>
          <button type="button" className={`${toolBtn} bg-primary text-primary-foreground hover:bg-primary-hover`} onClick={() => go(1)} disabled={index === last} aria-label={L('Next page', 'الصفحة التالية')}>
            <ChevronRight className="w-5 h-5 rtl:rotate-180" />
          </button>
        </div>
      </nav>
    </div>
  );
}

function PageText({ page, pageIndex, onCorrect, onGameResult }: { page: LessonPage; pageIndex: number; onCorrect: () => void; onGameResult?: Props['onGameResult'] }) {
  const [revealed, setRevealed] = useState(false);
  const itemsHidden = Boolean(page.items && page.interaction?.kind === 'ask' && page.interaction.reveal && !revealed);
  return (
    <div className="flex flex-col gap-4 p-5 sm:p-7 overflow-y-auto">
      <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground leading-tight">{page.title}</h2>
      {page.lines.map((line, i) => (
        <motion.p key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.25 }} className="text-lg leading-relaxed text-foreground">
          {line}
        </motion.p>
      ))}
      {page.items && !itemsHidden && (
        <ul className="grid gap-2">
          {page.items.map((item, i) => (
            <motion.li key={item} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.15 }} className="flex gap-3 items-start glass-1 rounded-2xl px-4 py-2.5 text-base">
              <span className="shrink-0 w-6 h-6 rounded-full bg-teal text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
              <span>{item}</span>
            </motion.li>
          ))}
        </ul>
      )}
      {page.evidence && (
        <figure className="rounded-2xl border border-gold/50 bg-surface/70 px-4 py-3">
          <blockquote lang="ar" dir="rtl" className="font-arabic text-xl leading-loose text-foreground">
            «{page.evidence.arabic}»
          </blockquote>
          <figcaption className="mt-1 text-sm text-muted-foreground">
            “{page.evidence.meaning}” · {page.evidence.reference}
          </figcaption>
        </figure>
      )}
      {page.interaction && (
        <InteractionView interaction={page.interaction} revealed={revealed} onReveal={() => setRevealed(true)} onCorrect={onCorrect} onGameResult={(r) => onGameResult?.(pageIndex, r)} />
      )}
    </div>
  );
}

function InteractionView({ interaction, revealed, onReveal, onCorrect, onGameResult }: { interaction: Interaction; revealed: boolean; onReveal: () => void; onCorrect: () => void; onGameResult: (r: GameResult) => void }) {
  switch (interaction.kind) {
    case 'ask':
      return (
        <div className="rounded-2xl bg-teal/10 border border-teal/30 px-4 py-3 space-y-2">
          <p className="font-semibold text-foreground">💬 {interaction.prompt}</p>
          {interaction.reveal &&
            (revealed ? (
              <motion.p initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-foreground">
                {interaction.reveal}
              </motion.p>
            ) : (
              <button type="button" onClick={onReveal} className="text-sm font-bold text-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                Show the answer
              </button>
            ))}
        </div>
      );
    case 'clues':
      return <Clues interaction={interaction} onCorrect={onCorrect} />;
    case 'choose':
      return <Choose interaction={interaction} />;
    case 'sort':
      return <SortGame interaction={interaction} onCorrect={onCorrect} onResult={onGameResult} />;
  }
}

function Clues({ interaction, onCorrect }: { interaction: Extract<Interaction, { kind: 'clues' }>; onCorrect: () => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const needed = interaction.clues.filter((c) => c.correct).length;
  const found = picked.filter((i) => interaction.clues[i].correct).length;
  const pick = (i: number) => {
    if (picked.includes(i)) return;
    const next = [...picked, i];
    setPicked(next);
    if (interaction.clues[i].correct && next.filter((j) => interaction.clues[j].correct).length === needed) onCorrect();
  };
  return (
    <div className="space-y-2">
      <p className="font-semibold text-foreground">🔍 {interaction.prompt}</p>
      <div className="grid sm:grid-cols-2 gap-2">
        {interaction.clues.map((clue, i) => {
          const state = picked.includes(i) ? (clue.correct ? 'right' : 'wrong') : 'idle';
          return (
            <motion.button
              key={clue.label}
              type="button"
              onClick={() => pick(i)}
              animate={state === 'wrong' ? { x: [0, -6, 6, -3, 0] } : {}}
              aria-pressed={picked.includes(i)}
              className={`min-h-[44px] rounded-2xl px-3 py-2 text-start text-sm font-semibold border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                state === 'right' ? 'border-teal bg-teal/15' : state === 'wrong' ? 'border-crimson/40 bg-crimson/5 opacity-70' : 'border-border bg-surface hover:border-gold'
              }`}
            >
              {clue.label}
            </motion.button>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground" aria-live="polite">
        {found === needed ? 'You found both clues!' : `Clues found: ${found} of ${needed}`}
      </p>
    </div>
  );
}

function Choose({ interaction }: { interaction: Extract<Interaction, { kind: 'choose' }> }) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      <p className="font-semibold text-foreground">⭐ {interaction.prompt}</p>
      <div className="grid gap-2">
        {interaction.options.map((option, i) => (
          <button
            key={option}
            type="button"
            onClick={() => setChoice(i)}
            aria-pressed={choice === i}
            className={`min-h-[44px] rounded-2xl px-4 py-2 text-start font-semibold border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${choice === i ? 'border-gold bg-gold/15' : 'border-border bg-surface hover:border-gold'}`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tap a card, then tap a door. Works by touch, mouse and keyboard (no drag needed). */
function SortGame({ interaction, onCorrect, onResult }: { interaction: Extract<Interaction, { kind: 'sort' }>; onCorrect: () => void; onResult: (r: GameResult) => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [placed, setPlaced] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState(false);
  const done = Object.keys(placed).length === interaction.cards.length;

  const place = (bin: string) => {
    if (selected === null || checked) return;
    setPlaced((p) => ({ ...p, [selected]: bin }));
    setSelected(null);
  };

  const check = () => {
    const result = scoreSort(interaction, placed);
    setChecked(true);
    onResult(result);
    if (Object.values(result).every((r) => r.correct === r.total)) onCorrect();
  };

  const reset = () => {
    setPlaced({});
    setChecked(false);
    setSelected(null);
  };

  return (
    <div className="space-y-3">
      <p className="font-semibold text-foreground">🎮 {interaction.prompt}</p>
      <div className="flex flex-wrap gap-2">
        {interaction.cards.map((card, i) =>
          placed[i] ? null : (
            <button
              key={card.label}
              type="button"
              onClick={() => setSelected(i)}
              aria-pressed={selected === i}
              className={`min-h-[44px] rounded-2xl px-3 py-2 text-sm font-semibold border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected === i ? 'border-gold bg-gold/20 -translate-y-0.5 shadow-md' : 'border-border bg-surface hover:border-gold'}`}
            >
              {card.label}
            </button>
          ),
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {interaction.bins.map((bin) => (
          <button
            key={bin.id}
            type="button"
            onClick={() => place(bin.id)}
            disabled={selected === null || checked}
            aria-label={`${bin.label}: ${bin.hint}`}
            className="rounded-t-[999px] rounded-b-2xl border-2 border-teal/40 bg-teal/10 px-2 pt-5 pb-2 min-h-[120px] flex flex-col items-center gap-1 text-center enabled:hover:bg-teal/20 enabled:cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <span className="font-display font-bold text-foreground">{bin.label}</span>
            <span className="text-[11px] leading-tight text-muted-foreground">{bin.hint}</span>
            {interaction.cards.map((card, i) =>
              placed[i] === bin.id ? (
                <span key={card.label} className={`w-full rounded-lg px-1.5 py-1 text-[11px] font-semibold ${checked ? (card.bin === bin.id ? 'bg-teal text-white' : 'bg-crimson/80 text-white') : 'bg-surface'}`}>
                  {checked && (card.bin === bin.id ? '✓ ' : '✗ ')}
                  {card.label}
                </span>
              ) : null,
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        {done && !checked && (
          <button type="button" onClick={check} className="h-11 px-5 rounded-full bg-primary text-primary-foreground font-bold inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <Check className="w-4 h-4" /> Check my doors
          </button>
        )}
        {Object.keys(placed).length > 0 && (
          <button type="button" onClick={reset} className="h-11 px-4 rounded-full border border-border font-semibold inline-flex items-center gap-2 hover:bg-surface-subtle focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
            <RotateCcw className="w-4 h-4" /> Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function scoreSort(interaction: Extract<Interaction, { kind: 'sort' }>, placed: Record<number, string>): GameResult {
  const result: GameResult = {};
  for (const bin of interaction.bins) result[bin.id] = { correct: 0, total: 0 };
  interaction.cards.forEach((card, i) => {
    result[card.bin].total += 1;
    if (placed[i] === card.bin) result[card.bin].correct += 1;
  });
  return result;
}

function Praise() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-20 flex items-center justify-center bg-black/10 pointer-events-none"
      role="status"
      aria-live="assertive"
    >
      <motion.div
        initial={{ scale: 0.6, rotate: -4 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 16 }}
        className="rounded-[28px] bg-[#05363F] px-10 py-6 text-center shadow-2xl ring-4 ring-gold/70"
      >
        <p className="font-display text-3xl sm:text-4xl font-bold text-gold">MashaAllah!</p>
        <p className="mt-2 text-2xl tracking-[0.4em] text-gold" aria-hidden="true">★★★</p>
      </motion.div>
    </motion.div>
  );
}
