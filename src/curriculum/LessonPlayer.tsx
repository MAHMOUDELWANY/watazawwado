import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Star, PenLine, Highlighter, MousePointer2, Eraser, LayoutGrid,
  Timer, RotateCcw, SkipBack, BookOpenText, X, Globe, Volume2, VolumeX,
} from 'lucide-react';
import type { Lesson } from './types';
import { Slide, SlideText, stepsFor, CANVAS_W, CANVAS_H, scoreSort, type GameResult } from './slides/Slide';
import { InkLayer, type InkTool } from './slides/Ink';
import { P } from './slides/Art';
import { useAppLanguage } from '../lib/language';
import { play, isMuted, setMuted, primeSounds } from './slides/sfx';

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
  // The explanation and (in full screen) the tool rail are drawers that slide in from the side on an arrow handle, closed
  // by default, so the slide gets the whole width (owner, 2026-10-22). Below lg the explanation stacks under the slide.
  const wide = () => typeof window === 'undefined' || window.innerWidth >= 1024;
  const [isWide, setIsWide] = useState(wide);
  const [notes, setNotes] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [timerLeft, setTimerLeft] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [muted, setMutedState] = useState(isMuted);
  const toggleMute = useCallback(() => setMutedState((m) => { setMuted(!m); return !m; }), []);
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  // Which way the last page turn went, so the next slide slides in from the side the teacher is moving towards.
  const [dir, setDir] = useState(1);
  const reduce = useReducedMotion();
  const current = lesson.pages[page];
  const total = stepsFor(current);
  const last = lesson.pages.length - 1;

  useEffect(() => onPageChange?.(page), [page, onPageChange]);
  useEffect(() => {
    const onResize = () => setIsWide(wide());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

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
    if (next !== page) { play('page'); setDir(next > page ? 1 : -1); }
    setPage(next);
    setStep(atEnd ? stepsFor(lesson.pages[next]) : 0);
    setGrid(false);
  }, [last, lesson.pages, page]);

  /** Next = reveal the next build step; when the page is fully built, go to the next page. */
  const forward = useCallback(() => {
    if (step < total) setStep((s) => s + 1);
    else if (page < last) goPage(page + 1);
  }, [step, total, page, last, goPage]);
  const backward = useCallback(() => {
    if (step > 0) setStep((s) => s - 1);
    else if (page > 0) goPage(page - 1, true);
  }, [step, page, goPage]);

  /** Replay = act out the newest build step again (on a page with no steps yet, its entrance). Earlier steps stay put. */
  const replayStep = useCallback(() => {
    if (step === 0) { setReplay((r) => r + 1); return; }
    const s = step;
    setStep(s - 1);
    requestAnimationFrame(() => setStep(s));
  }, [step]);
  /** Start again = back to this page's first build step, with its entrance and any answers cleared. */
  const restartPage = useCallback(() => {
    setStep(0);
    setReplay((r) => r + 1);
  }, []);

  const cheer = useCallback(() => {
    play('praise');
    setPraise(true);
    window.setTimeout(() => setPraise(false), 2300);
  }, []);

  useEffect(() => {
    if (!timerLeft) return;
    const id = window.setTimeout(() => setTimerLeft((t) => t - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timerLeft]);

  const toggleFullscreen = useCallback(() => {
    const fill = (on: boolean) => setFullscreen(on);
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (fullscreen) { fill(false); return; }
    // iPhone Safari has no element full screen, and embedded browsers may refuse it or never answer:
    // then fill the window instead, with the same layout.
    if (!document.fullscreenEnabled || !rootRef.current?.requestFullscreen) { fill(true); return; }
    const t = window.setTimeout(() => { if (!document.fullscreenElement) fill(true); }, 800);
    rootRef.current.requestFullscreen().then(() => window.clearTimeout(t), () => { window.clearTimeout(t); fill(true); });
  }, [fullscreen]);
  const fillWindow = fullscreen && typeof document !== 'undefined' && !document.fullscreenElement;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === ' ' || k === 'pagedown') { e.preventDefault(); forward(); }
      else if (k === 'arrowleft' || k === 'pageup') { e.preventDefault(); backward(); }
      else if (k === 'escape') { setTool('none'); setGrid(false); if (fillWindow) toggleFullscreen(); }
      else if (k === 'd') setTool((t) => (t === 'pen' ? 'none' : 'pen'));
      else if (k === 'h') setTool((t) => (t === 'marker' ? 'none' : 'marker'));
      else if (k === 'l') setTool((t) => (t === 'laser' ? 'none' : 'laser'));
      else if (k === 'e') setClearSignal((c) => c + 1);
      else if (k === 'g') setGrid((g) => !g);
      else if (k === 'n') setNotes((n) => !n);
      else if (k === 't') setToolsOpen((o) => !o);
      else if (k === 'r') replayStep();
      else if (k === 'home') { e.preventDefault(); restartPage(); }
      else if (k === 'f') toggleFullscreen();
      else if (k === 'm') toggleMute();
      else if (teacher && k === 'p') cheer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [forward, backward, cheer, teacher, toggleFullscreen, replayStep, restartPage, fillWindow, toggleMute]);

  useEffect(() => {
    const sync = () => {
      const on = Boolean(document.fullscreenElement);
      setFullscreen(on);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const btn = (active = false) =>
    `h-11 min-w-11 px-2.5 inline-flex items-center justify-center gap-1.5 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] disabled:opacity-35 ${
      active ? 'bg-[#E5A93C] text-[#1E1410]' : 'text-[#1E1410] hover:bg-[#8B4935]/10'
    }`;

  const toolbar = (
    <nav
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={L('Lesson controls', 'التحكم في الدرس')}
      className={`flex items-center gap-1 rounded-[28px] [&>*]:shrink-0 border border-white/70 bg-[#FAF7F2]/90 shadow-[0_18px_40px_-20px_rgba(139,73,53,0.55)] backdrop-blur-xl transition-[transform,opacity] duration-300 ${
        fullscreen
          ? // Full screen: a rail in a side drawer (right in English, left in Arabic), opened on its arrow handle.
            'max-h-full shrink-0 flex-col overflow-y-auto px-1.5 py-2'
          : // Phones: one sticky row that scrolls sideways, so Back and Next never leave the screen.
            'sticky bottom-2 z-20 flex-nowrap overflow-x-auto px-2 py-1.5 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible'
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
      <button type="button" className={btn()} onClick={replayStep} title={L('Replay the last step (R)', 'أعد آخر خطوة (R)')} aria-label={L('Replay the last step', 'أعد آخر خطوة')}>
        <RotateCcw className="w-[18px] h-[18px]" />
      </button>
      <button type="button" className={btn()} onClick={restartPage} title={L('Start this page again from its first step (Home)', 'ابدأ الصفحة من أول خطوة (Home)')} aria-label={L('Start this page again', 'ابدأ الصفحة من الأول')}>
        <SkipBack className="w-[18px] h-[18px] rtl:rotate-180" />
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
      <button type="button" className={btn()} onClick={toggleMute} aria-pressed={muted} title={muted ? L('Sound off (M)', 'الصوت مقفول (M)') : L('Sound on (M)', 'الصوت شغال (M)')} aria-label={muted ? L('Turn sound on', 'شغّل الصوت') : L('Turn sound off', 'اقفل الصوت')}>
        {muted ? <VolumeX className="w-[18px] h-[18px]" /> : <Volume2 className="w-[18px] h-[18px]" />}
      </button>
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
        {/* Extra page for a 60-minute lesson; skip it in 30 minutes (docs/curriculum/RULES.md §1.7). */}
        {current.optional && <span className="ms-2 rounded-full bg-[#E5A93C]/20 px-2 py-0.5 text-[#8B4935]">{L('Optional', 'إضافية')}</span>}
      </span>
    </nav>
  );

  const notesAr = ar ? lesson.teacherAr?.[page] : undefined;
  const notesPanel = (
    <aside dir={notesAr ? 'rtl' : 'ltr'} lang={notesAr ? 'ar' : 'en'} className={`flex flex-col gap-4 overflow-y-auto rounded-[24px] bg-[#FFFDF7] p-5 text-[#1E1410] ring-1 ring-black/5 shadow-[0_24px_60px_-20px_rgba(59,34,25,0.55)] ${isWide ? 'h-full w-[360px]' : ''}`} aria-label={L('Explanation', 'الشرح')}>
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-2xl font-bold leading-tight">{notesAr?.title ?? current.title}</h3>
        <button type="button" onClick={() => setNotes(false)} className="rounded-full p-1.5 hover:bg-black/5" aria-label={L('Close explanation', 'اقفل الشرح')}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="space-y-3 text-[17px] leading-relaxed">
        {(notesAr?.explain ?? current.explain).map((p, i) => <p key={i}>{p}</p>)}
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
      {teacher && (notesAr?.note ?? current.teacherNote) && (
        <p className="rounded-2xl bg-[#FCEFD2] px-4 py-3 text-[15px] leading-relaxed">
          <b>{L('Teaching tip: ', 'نصيحة للشرح: ')}</b>
          {notesAr?.note ?? current.teacherNote}
        </p>
      )}
    </aside>
  );

  // Notes open on the reading side (left in English, right in Arabic); the full-screen tool rail on the other side.
  const notesSide = ar ? 'right' : 'left';
  const toolsSide = ar ? 'left' : 'right';

  return (
    <div ref={rootRef} onPointerDownCapture={primeSounds} dir="ltr" className={`flex gap-3 ${fillWindow ? 'fixed inset-0 z-[100]' : 'relative'} ${fullscreen ? 'band-deep h-full p-3' : 'flex-col'}`}>
      <div dir={ar ? 'rtl' : 'ltr'} className={`relative flex flex-col gap-3 overflow-hidden ${fullscreen ? 'min-h-0 flex-1' : ''}`}>
        <div className={`flex min-w-0 flex-1 flex-col gap-3 ${fullscreen ? 'h-full min-h-0' : ''}`}>
          <div ref={stageRef} className={`relative min-w-0 ${fullscreen ? 'min-h-0 flex-1' : 'aspect-video'}`}>
            <div
              className="absolute left-1/2 top-1/2 overflow-hidden rounded-[22px] shadow-[0_30px_70px_-35px_rgba(59,34,25,0.7)]"
              style={{ width: CANVAS_W, height: CANVAS_H, transform: `translate(-50%, -50%) scale(${scale})` }}
            >
              {/* Page turn: the old slide fades out quickly, then the new one drifts in from the side we are moving to.
                  One slide at a time (mode "wait") and transform + opacity only: two full-size slides blurring over each
                  other was the lag and the visual noise the owner saw (2026-10-22). Transform strings run off the main thread. */}
              <AnimatePresence initial={false} custom={dir} mode="wait">
                <motion.div
                  key={page}
                  custom={dir}
                  className="absolute inset-0"
                  variants={{
                    enter: (d: number) => (reduce ? { opacity: 0 } : { opacity: 0, transform: `translateX(${40 * d}px)` }),
                    center: { opacity: 1, transform: 'translateX(0px)', transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] } },
                    leave: (d: number) => (reduce ? { opacity: 0, transition: { duration: 0.15 } } : { opacity: 0, transform: `translateX(${-20 * d}px)`, transition: { duration: 0.16, ease: [0.4, 0, 1, 1] } }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="leave"
                >
                  <div key={replay} className="absolute inset-0">
                    <Slide lesson={lesson} pageIndex={page} step={step} onCorrect={cheer} onGameResult={(r) => onGameResult?.(page, r)} />
                  </div>
                </motion.div>
              </AnimatePresence>
              <InkLayer tool={tool} color={inkColor} pageKey={String(page)} clearSignal={clearSignal} width={CANVAS_W} height={CANVAS_H} />
              {timerLeft > 0 && (
                <div className="absolute right-[90px] top-[130px] rounded-full bg-white px-6 py-2 font-sans text-[34px] font-bold tabular-nums shadow-lg" style={{ color: timerLeft <= 10 ? P.crimson : P.ink }}>
                  {Math.floor(timerLeft / 60)}:{String(timerLeft % 60).padStart(2, '0')}
                </div>
              )}
              <AnimatePresence>{praise && <Praise />}</AnimatePresence>
              <AnimatePresence>
                {grid && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} dir="ltr" lang="en" className="band-deep absolute inset-0 z-30 p-16">
                    <p className="mb-8 font-serif text-[48px] font-bold text-white">{lesson.title}</p>
                    <ol className="grid grid-cols-4 gap-5">
                      {lesson.pages.map((p, i) => (
                        <li key={i}>
                          <button
                            type="button"
                            onClick={() => goPage(i)}
                            className={`w-full rounded-[20px] px-6 py-5 text-left font-sans text-[24px] font-bold transition-colors ${i === page ? 'bg-[#E5A93C] text-[#1E1410]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                          >
                            <span className="block text-[18px] opacity-70">{i + 1}{p.optional && ` · ${L('Optional', 'إضافية')}`}</span>
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
          {/* Below ~575px of slide width the canvas text is too small to read; give its words at reading size. */}
          {!fullscreen && scale < 0.36 && (
            <>
              <p className="hidden items-center gap-2 text-sm font-bold text-[#8B4935] portrait:flex">
                <RotateCcw className="h-4 w-4 rotate-90" aria-hidden="true" />
                {L('Turn your phone sideways for a bigger slide.', 'لف الموبايل بالعرض عشان الشريحة تكبر.')}
              </p>
              {grid ? (
                <ol className="grid grid-cols-2 gap-2" aria-label={L('All pages', 'كل الصفحات')}>
                  {lesson.pages.map((p, i) => (
                    <li key={i}>
                      <button type="button" dir="ltr" lang="en" onClick={() => goPage(i)} className={`min-h-11 w-full rounded-2xl px-3 py-2 text-start text-sm font-bold ${i === page ? 'bg-[#E5A93C] text-[#1E1410]' : 'bg-[#FFFDF7] text-[#1E1410] ring-1 ring-black/5'}`}>
                        <span className="me-1.5 opacity-60">{i + 1}</span>{p.title}{p.optional && <span className="ms-1.5 opacity-60">· {L('Optional', 'إضافية')}</span>}
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <SlideText page={current} step={step} />
              )}
            </>
          )}
        </div>
        {isWide ? (
          <Drawer side={notesSide} open={notes} onToggle={() => setNotes((n) => !n)} icon={<BookOpenText className="h-4 w-4" />} label={notes ? L('Hide explanation (N)', 'اخفي الشرح (N)') : L('Show explanation (N)', 'اظهر الشرح (N)')}>
            {notesPanel}
          </Drawer>
        ) : notes && notesPanel}
      </div>
      {fullscreen ? (
        <Drawer side={toolsSide} open={toolsOpen} onToggle={() => setToolsOpen((o) => !o)} icon={<PenLine className="h-4 w-4" />} label={toolsOpen ? L('Hide tools (T)', 'اخفي الأدوات (T)') : L('Show tools (T)', 'اظهر الأدوات (T)')} padded>
          {toolbar}
        </Drawer>
      ) : toolbar}
    </div>
  );
}

/** A side drawer over the slide: only its arrow handle shows until it is opened, then the panel slides in with a spring.
 *  Transform only, so it never re-lays out the slide underneath (docs: animation-performance). */
function Drawer({ side, open, onToggle, icon, label, padded = false, children }: {
  side: 'left' | 'right'; open: boolean; onToggle: () => void; icon: React.ReactNode; label: string; padded?: boolean; children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  const right = side === 'right';
  const Arrow = right === open ? ChevronRight : ChevronLeft;
  return (
    <div dir="ltr" className={`pointer-events-none absolute inset-y-0 z-40 flex items-center ${right ? 'right-0 flex-row' : 'left-0 flex-row-reverse'} ${padded ? 'py-3' : ''}`}>
      <motion.div
        className={`flex h-full items-center ${right ? 'flex-row' : 'flex-row-reverse'}`}
        initial={false}
        animate={{ transform: open ? 'translateX(0%)' : `translateX(${right ? 'calc(100% - 34px)' : 'calc(-100% + 34px)'})` }}
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 40, mass: 0.9 }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-label={label}
          title={label}
          className={`pointer-events-auto flex h-24 w-[34px] shrink-0 flex-col items-center justify-center gap-1.5 border border-white/70 bg-[#FAF7F2]/95 text-[#1E1410] shadow-[0_12px_30px_-14px_rgba(59,34,25,0.6)] backdrop-blur-xl transition-colors hover:bg-[#F6D58E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${right ? 'rounded-l-2xl border-r-0' : 'rounded-r-2xl border-l-0'}`}
        >
          {icon}
          <Arrow className="h-4 w-4" aria-hidden="true" />
        </button>
        <div className="pointer-events-auto flex h-full max-h-full" inert={!open}>{children}</div>
      </motion.div>
    </div>
  );
}

/** Our praise: "Zādak Allāh!" (زادك الله, may Allah give you more), the academy's own word from zad. The brand's khatam
 *  star draws itself in gold, the Arabic is written in right to left like every ayah in the lesson, and a few motes of
 *  light rise, as if added to the learner's zad. Calm and short: it honours the answer, it does not throw a party. */
function Praise() {
  const reduce = useReducedMotion();
  const ease = [0.22, 1, 0.36, 1] as const;
  // The khatam: a square and the same square turned 45°, as one outline.
  const star = 'M50 10 L61.7 21.7 L78.3 21.7 L78.3 38.3 L90 50 L78.3 61.7 L78.3 78.3 L61.7 78.3 L50 90 L38.3 78.3 L21.7 78.3 L21.7 61.7 L10 50 L21.7 38.3 L21.7 21.7 L38.3 21.7 Z';
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.4 } }} className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center" role="status" aria-live="assertive">
      <div className="absolute inset-0 backdrop-blur-[3px]" style={{ background: 'radial-gradient(ellipse 70% 75% at 50% 50%, rgba(30,20,16,0.9), rgba(30,20,16,0.7))' }} />
      <motion.div
        className="absolute h-[760px] w-[760px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(246,213,142,0.38), rgba(229,169,60,0.08) 45%, transparent 70%)' }}
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease }}
      />
      {!reduce && Array.from({ length: 12 }).map((_, i) => (
        <motion.span
          key={i}
          className="absolute h-2.5 w-2.5 rounded-full"
          style={{ left: `calc(50% + ${Math.round(Math.sin(i * 2.4) * 260)}px)`, top: '58%', background: i % 3 ? P.goldSoft : '#FFF8EA', boxShadow: '0 0 12px rgba(246,213,142,0.9)' }}
          initial={{ y: 0, opacity: 0, scale: 0.4 }}
          animate={{ y: -220 - (i % 4) * 50, opacity: [0, 1, 0], scale: 1 }}
          transition={{ duration: 1.6, delay: 0.35 + (i % 6) * 0.08, ease: 'easeOut' }}
        />
      ))}
      <div className="relative flex flex-col items-center">
        <motion.svg width="150" height="150" viewBox="0 0 100 100" aria-hidden="true" initial={reduce ? false : { rotate: -45, scale: 0.7 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
          <motion.path d={star} fill="none" stroke={P.gold} strokeWidth={3} strokeLinejoin="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.7, ease: 'easeInOut' }} />
          <motion.path d={star} fill={P.gold} initial={{ opacity: 0 }} animate={{ opacity: 0.9 }} transition={{ delay: reduce ? 0 : 0.55, duration: 0.4 }} />
          <circle cx="50" cy="50" r="11" fill="#FFF8EA" />
        </motion.svg>
        <motion.p
          lang="ar"
          dir="rtl"
          className="mt-4 font-serif text-[132px] font-bold leading-[1.2]"
          style={{ color: '#FFF3D6', textShadow: '0 0 40px rgba(246,213,142,0.55)' }}
          initial={reduce ? { opacity: 0 } : { clipPath: 'inset(0 0 0 100%)' }}
          animate={reduce ? { opacity: 1 } : { clipPath: 'inset(0 0 0 0%)' }}
          transition={{ delay: 0.25, duration: 0.8, ease: 'easeInOut' }}
        >
          زادك الله
        </motion.p>
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.5, ease }} className="mt-2 font-sans text-[34px] font-semibold" style={{ color: P.goldSoft }}>
          Zādak Allāh! May Allah give you more.
        </motion.p>
      </div>
    </motion.div>
  );
}
