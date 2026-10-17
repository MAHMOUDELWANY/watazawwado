import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Star, PenLine, Highlighter, MousePointer2, Eraser, LayoutGrid,
  Timer, RotateCcw, BookOpenText, X, Globe,
} from 'lucide-react';
import type { Lesson } from './types';
import { Slide, stepsFor, CANVAS_W, CANVAS_H, scoreSort, type GameResult } from './slides/Slide';
import { InkLayer, type InkTool } from './slides/Ink';
import { P } from './slides/Art';
import { useAppLanguage } from '../lib/language';

export { scoreSort, type GameResult };

interface Props {
  lesson: Lesson;
  /** Chrome language; lesson content is always English (PLAN §3.11). */
  lang: 'ar' | 'en';
  /** Teacher mode: praise, timer and teaching tips. */
  teacher?: boolean;
  onGameResult?: (pageIndex: number, result: GameResult) => void;
  /** Called with the 0-based page index whenever the page changes (the teacher report uses it). */
  onPageChange?: (pageIndex: number) => void;
}

const INK_COLORS = [P.crimson, P.teal, P.gold, P.ink];
const TIMER_STEPS = [0, 60, 120, 180, 300];

/** Slide player v2: fixed 16:9 canvas, build steps, pen/marker/laser, page grid, timer, explanation panel. */
export function LessonPlayer({ lesson, lang: initialLang, teacher = false, onGameResult, onPageChange }: Props) {
  // The player switches the site language itself, so the teacher never leaves the lesson to change it.
  const { lang: appLang, toggleLanguage } = useAppLanguage();
  const lang = appLang || initialLang;
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const [page, setPage] = useState(0);
  const [step, setStep] = useState(0);
  const [tool, setTool] = useState<InkTool>('none');
  const [inkColor, setInkColor] = useState(INK_COLORS[0]);
  const [clearSignal, setClearSignal] = useState(0);
  const [replay, setReplay] = useState(0);
  const [praise, setPraise] = useState(false);
  const [grid, setGrid] = useState(false);
  const [notes, setNotes] = useState(true);
  const [timerLeft, setTimerLeft] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [chromeVisible, setChromeVisible] = useState(true);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const current = lesson.pages[page];
  const total = stepsFor(current);
  const last = lesson.pages.length - 1;

  useEffect(() => onPageChange?.(page), [page, onPageChange]);

  useLayoutEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const fit = () => {
      const r = el.getBoundingClientRect();
      setScale(Math.min(r.width / CANVAS_W, (r.height || Infinity) / CANVAS_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fullscreen, notes]);

  const goPage = useCallback((p: number, atEnd = false) => {
    const next = Math.min(last, Math.max(0, p));
    setPage(next);
    setStep(atEnd ? stepsFor(lesson.pages[next]) : 0);
    setGrid(false);
  }, [last, lesson.pages]);

  /** Next = reveal the next build step; when the page is fully built, go to the next page. */
  const forward = useCallback(() => {
    if (step < total) setStep((s) => s + 1);
    else if (page < last) goPage(page + 1);
  }, [step, total, page, last, goPage]);
  const backward = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else if (page > 0) goPage(page - 1, true);
  }, [step, page, goPage]);

  const cheer = useCallback(() => {
    setPraise(true);
    window.setTimeout(() => setPraise(false), 1900);
  }, []);

  useEffect(() => {
    if (!timerLeft) return;
    const id = window.setTimeout(() => setTimerLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerLeft]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else rootRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === ' ' || k === 'pagedown') { e.preventDefault(); forward(); }
      else if (k === 'arrowleft' || k === 'pageup') { e.preventDefault(); backward(); }
      else if (k === 'escape') { setTool('none'); setGrid(false); }
      else if (k === 'd') setTool((t) => (t === 'pen' ? 'none' : 'pen'));
      else if (k === 'h') setTool((t) => (t === 'marker' ? 'none' : 'marker'));
      else if (k === 'l') setTool((t) => (t === 'laser' ? 'none' : 'laser'));
      else if (k === 'e') setClearSignal((c) => c + 1);
      else if (k === 'g') setGrid((g) => !g);
      else if (k === 'n') setNotes((n) => !n);
      else if (k === 'r') setReplay((r) => r + 1);
      else if (k === 'f') toggleFullscreen();
      else if (teacher && k === 'p') cheer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forward, backward, cheer, teacher, toggleFullscreen]);

  useEffect(() => {
    const sync = () => {
      const on = Boolean(document.fullscreenElement);
      setFullscreen(on);
      setNotes(!on);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  // In full screen the controls hide while the teacher talks and come back when the mouse moves.
  useEffect(() => {
    if (!fullscreen) { setChromeVisible(true); return; }
    let t = window.setTimeout(() => setChromeVisible(false), 2500);
    const wake = () => { setChromeVisible(true); window.clearTimeout(t); t = window.setTimeout(() => setChromeVisible(false), 2500); };
    window.addEventListener('mousemove', wake);
    return () => { window.clearTimeout(t); window.removeEventListener('mousemove', wake); };
  }, [fullscreen]);

  const btn = (active = false) =>
    `h-11 min-w-11 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] disabled:opacity-35 ${
      active ? 'bg-[#E5A93C] text-[#1E1410]' : 'text-[#1E1410] hover:bg-[#8B4935]/10'
    }`;

  const toolbar = (
    <nav
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={L('Lesson controls', 'التحكم في الدرس')}
      className={`flex items-center gap-1 rounded-[28px] border border-white/70 bg-[#FAF7F2]/90 shadow-[0_18px_40px_-20px_rgba(139,73,53,0.55)] backdrop-blur-xl transition-[transform,opacity] duration-300 ${
        fullscreen
          ? // Full screen: a vertical rail that slides in from the side (right in English, left in Arabic, owner 2026-10-17).
            `absolute top-1/2 z-50 max-h-[calc(100%-2rem)] -translate-y-1/2 flex-col overflow-y-auto px-1.5 py-2 ${ar ? 'left-4' : 'right-4'} ${chromeVisible ? 'translate-x-0 opacity-100' : `${ar ? '-translate-x-24' : 'translate-x-24'} pointer-events-none opacity-0`}`
          : 'flex-wrap px-2 py-1.5'
      }`}
    >
      <button type="button" className={btn()} onClick={backward} disabled={page === 0 && step === 0} aria-label={L('Back', 'رجوع')} title={L('Back (←)', 'رجوع (←)')}>
        <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
      </button>
      <button type="button" className={`${btn()} bg-[#C51F24] text-white hover:bg-[#A9191E] px-4`} onClick={forward} disabled={page === last && step >= total} aria-label={L('Next', 'التالي')} title={L('Next (→ or Space)', 'التالي (→ أو مسافة)')}>
        <span className="flex gap-1" aria-hidden="true">
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i < step ? 'bg-white' : 'bg-white/35'}`} />
          ))}
        </span>
        <ChevronRight className="w-5 h-5 rtl:rotate-180" />
      </button>
      <span className={fullscreen ? 'my-1 h-px w-6 bg-[#8B4935]/20' : 'mx-1 h-6 w-px bg-[#8B4935]/20'} aria-hidden="true" />
      <button type="button" className={btn(grid)} onClick={() => setGrid((g) => !g)} aria-pressed={grid} title={L('All pages (G)', 'كل الصفحات (G)')} aria-label={L('All pages', 'كل الصفحات')}>
        <LayoutGrid className="w-[18px] h-[18px]" />
      </button>
      <button type="button" className={btn(tool === 'pen')} onClick={() => setTool((t) => (t === 'pen' ? 'none' : 'pen'))} aria-pressed={tool === 'pen'} title={L('Pen (D)', 'قلم (D)')} aria-label={L('Pen', 'قلم')}>
        <PenLine className="w-[18px] h-[18px]" />
      </button>
      <button type="button" className={btn(tool === 'marker')} onClick={() => setTool((t) => (t === 'marker' ? 'none' : 'marker'))} aria-pressed={tool === 'marker'} title={L('Highlighter (H)', 'تظليل (H)')} aria-label={L('Highlighter', 'تظليل')}>
        <Highlighter className="w-[18px] h-[18px]" />
      </button>
      <button type="button" className={btn(tool === 'laser')} onClick={() => setTool((t) => (t === 'laser' ? 'none' : 'laser'))} aria-pressed={tool === 'laser'} title={L('Laser pointer (L)', 'مؤشر ليزر (L)')} aria-label={L('Laser pointer', 'مؤشر ليزر')}>
        <MousePointer2 className="w-[18px] h-[18px]" />
      </button>
      {(tool === 'pen' || tool === 'marker') &&
        INK_COLORS.map((c) => (
          <button key={c} type="button" onClick={() => setInkColor(c)} aria-label={L('Ink colour', 'لون الحبر')} aria-pressed={inkColor === c} className="h-11 w-8 inline-flex items-center justify-center">
            <span className={`block h-6 w-6 rounded-full ring-2 ring-offset-2 ring-offset-[#FAF7F2] ${inkColor === c ? 'ring-[#1E1410]' : 'ring-transparent'}`} style={{ background: c }} />
          </button>
        ))}
      <button type="button" className={btn()} onClick={() => setClearSignal((c) => c + 1)} title={L('Clear drawing (E)', 'امسح الرسم (E)')} aria-label={L('Clear drawing', 'امسح الرسم')}>
        <Eraser className="w-[18px] h-[18px]" />
      </button>
      <span className={fullscreen ? 'my-1 h-px w-6 bg-[#8B4935]/20' : 'mx-1 h-6 w-px bg-[#8B4935]/20'} aria-hidden="true" />
      <button type="button" className={btn()} onClick={() => setReplay((r) => r + 1)} title={L('Replay animation (R)', 'أعد الحركة (R)')} aria-label={L('Replay animation', 'أعد الحركة')}>
        <RotateCcw className="w-[18px] h-[18px]" />
      </button>
      {teacher && (
        <>
          <button
            type="button"
            className={btn(timerLeft > 0)}
            onClick={() => setTimerLeft((t) => TIMER_STEPS[(TIMER_STEPS.findIndex((s) => s >= t) + 1) % TIMER_STEPS.length])}
            title={L('Thinking timer: tap for 1, 2, 3, 5 minutes', 'مؤقت التفكير: دوس لـ 1 أو 2 أو 3 أو 5 دقايق')}
            aria-label={L('Timer', 'مؤقت')}
          >
            <Timer className="w-[18px] h-[18px]" />
            {timerLeft > 0 && <span className="tabular-nums">{Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}</span>}
          </button>
          <button type="button" className={btn()} onClick={cheer} title={L('Praise (P)', 'تشجيع (P)')} aria-label={L('Praise', 'تشجيع')}>
            <Star className="w-[18px] h-[18px] text-[#E5A93C]" />
          </button>
        </>
      )}
      <button type="button" className={btn(notes)} onClick={() => setNotes((n) => !n)} aria-pressed={notes} title={L('Explanation (N)', 'الشرح (N)')} aria-label={L('Explanation', 'الشرح')}>
        <BookOpenText className="w-[18px] h-[18px]" />
      </button>
      <button type="button" className={btn()} onClick={toggleFullscreen} title={L('Full screen (F)', 'ملء الشاشة (F)')} aria-label={fullscreen ? L('Exit full screen', 'خروج من ملء الشاشة') : L('Full screen', 'ملء الشاشة')}>
        {fullscreen ? <Minimize2 className="w-[18px] h-[18px]" /> : <Maximize2 className="w-[18px] h-[18px]" />}
      </button>
      <button type="button" className={btn()} onClick={toggleLanguage} title={L('عربي', 'English')} aria-label={L('Switch to Arabic', 'Switch to English')}>
        <Globe className="w-[18px] h-[18px]" />
        <span>{ar ? 'EN' : 'عربي'}</span>
      </button>
      <span className={`text-xs font-bold text-[#453D34] tabular-nums ${fullscreen ? 'py-1' : 'ms-auto pe-3 ps-2'}`}>
        {L('Page', 'صفحة')} {page + 1}/{lesson.pages.length}
      </span>
    </nav>
  );

  const notesPanel = notes && (
    <aside dir="ltr" lang="en" className={`flex flex-col gap-4 overflow-y-auto rounded-[24px] bg-[#FFFDF7] p-5 text-[#1E1410] ring-1 ring-black/5 shadow-[0_18px_40px_-28px_rgba(91,58,30,0.5)] lg:w-[360px] lg:shrink-0 ${fullscreen ? `absolute ${ar ? 'right-5' : 'left-5'} top-5 bottom-24 z-40 w-[360px]` : 'lg:max-h-[min(78vh,720px)]'}`} aria-label={L('Explanation', 'الشرح')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-2xl font-bold leading-tight">{current.title}</h3>
        <button type="button" onClick={() => setNotes(false)} className="rounded-full p-1.5 hover:bg-black/5" aria-label={L('Close explanation', 'اقفل الشرح')}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3 text-[17px] leading-relaxed">
        {current.explain.map((p, i) => <p key={i}>{p}</p>)}
      </div>
      {current.vocab?.length ? (
        <ul className="space-y-1.5 border-t border-black/10 pt-3">
          {current.vocab.map((w) => (
            <li key={w.translit} className="flex items-baseline gap-2 text-[16px]">
              <span lang="ar" dir="rtl" className="font-serif text-xl">{w.arabic}</span>
              <b>{w.translit}</b>
              <span className="text-[#14555F]">{w.meaning}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {teacher && current.teacherNote && (
        <p className="rounded-2xl bg-[#FCEFD2] px-4 py-3 text-[15px] leading-relaxed">
          <b>{L('Teaching tip: ', 'نصيحة للشرح: ')}</b>
          {current.teacherNote}
        </p>
      )}
    </aside>
  );

  return (
    <div ref={rootRef} dir="ltr" className={`relative flex flex-col gap-3 ${fullscreen ? 'band-deep h-full p-3' : ''}`}>
      <div dir={ar ? 'rtl' : 'ltr'} className={`flex flex-col gap-3 lg:flex-row ${fullscreen ? 'min-h-0 flex-1' : ''}`}>
        <div ref={stageRef} className={`relative min-w-0 flex-1 ${fullscreen ? 'h-full min-h-0' : 'aspect-video'}`}>
          <div
            className="absolute left-1/2 top-1/2 overflow-hidden rounded-[22px] shadow-[0_30px_70px_-35px_rgba(59,34,25,0.7)]"
            style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            <div key={`${page}-${replay}`} className="absolute inset-0">
              <Slide lesson={lesson} pageIndex={page} step={step} onCorrect={cheer} onGameResult={(r) => onGameResult?.(page, r)} />
            </div>
            <InkLayer tool={tool} color={inkColor} pageKey={String(page)} clearSignal={clearSignal} width={CANVAS_W} height={CANVAS_H} />
            {timerLeft > 0 && (
              <div className="absolute right-[90px] top-[130px] rounded-full bg-white px-6 py-2 font-sans text-[34px] font-bold tabular-nums shadow-lg" style={{ color: timerLeft <= 10 ? P.crimson : P.ink }}>
                {Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}
              </div>
            )}
            <AnimatePresence>{praise && <Praise />}</AnimatePresence>
            <AnimatePresence>
              {grid && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="band-deep absolute inset-0 z-30 p-16">
                  <p className="mb-8 font-serif text-[48px] font-bold text-white">{lesson.title}</p>
                  <ol className="grid grid-cols-4 gap-5">
                    {lesson.pages.map((p, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => goPage(i)}
                          className={`w-full rounded-[20px] px-6 py-5 text-left font-sans text-[24px] font-bold transition-colors ${i === page ? 'bg-[#E5A93C] text-[#1E1410]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                          <span className="block text-[18px] opacity-70">{i + 1}</span>
                          {p.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        {notesPanel}
      </div>
      {toolbar}
    </div>
  );
}

function Praise() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" role="status" aria-live="assertive">
      <motion.div
        className="absolute h-[1400px] w-[1400px] rounded-full"
        style={{ background: 'repeating-conic-gradient(from 0deg, rgba(246,213,142,0.45) 0deg 8deg, transparent 8deg 22deg)' }}
        initial={{ rotate: 0, scale: 0.6 }}
        animate={{ rotate: 40, scale: 1 }}
        transition={{ duration: 1.9, ease: 'easeOut' }}
      />
      {Array.from({ length: 26 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-4 w-2.5 rounded-sm"
          style={{ background: [P.gold, P.teal, P.crimson, '#ffffff'][i % 4] }}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{ x: Math.cos(i * 0.9) * (300 + (i % 5) * 70), y: Math.sin(i * 0.9) * (220 + (i % 3) * 60), rotate: 220, opacity: 0 }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
        />
      ))}
      <motion.div
        initial={{ scale: 0.5, rotate: -6 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
        className="relative rounded-[36px] px-16 py-10 text-center shadow-2xl ring-8 ring-[#E5A93C]/60"
        style={{ background: P.ink }}
      >
        <p className="font-serif text-[88px] font-bold leading-none text-[#E5A93C]">MashaAllah!</p>
        <p className="mt-4 text-[54px] tracking-[0.35em] text-[#E5A93C]" aria-hidden="true">★★★</p>
      </motion.div>
    </motion.div>
  );
}
