import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  ChevronLeft, ChevronRight, Maximize2, Minimize2, Star, PenLine, Highlighter, MousePointer2, Eraser, LayoutGrid,
  Timer, RotateCcw, BookOpenText, X, Clapperboard, Volume2, VolumeX, Smartphone, Trash2, Check, Lock,
} from 'lucide-react';
import type { Lesson } from './types';
import { Slide, stepsFor, CANVAS_W, CANVAS_H, scoreSort, SCENE_IMAGES, type GameResult } from './slides/Slide';
import { InkLayer, type InkTool } from './slides/Ink';
import { Opening } from './slides/Opening';
import { LessonEnd } from './slides/motion/LessonEnd';
import { P, asset } from './slides/Art';
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
  /** A free sample: the lesson stops after these pages behind a lock, with a call to book (owner, 2026-10-23). */
  sample?: { totalPages: number; teaser: string; onBook: () => void };
}

const INK_COLORS = [P.crimson, P.teal, P.gold, P.ink];
/** Lesson timer lengths: 5 to 60 minutes in steps of 5, so the teacher always sees how much of the class is left. */
const TIMER_MINUTES = Array.from({ length: 12 }, (_, i) => (i + 1) * 5);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/** Slide player v2: fixed 16:9 canvas, build steps, pen/marker/laser, page grid, timer, explanation panel. */
export function LessonPlayer({ lesson, lang: initialLang, teacher = false, onGameResult, onPageChange, sample }: Props) {
  // The player follows the language the user picked for the site (owner, 2026-10-22: no switch inside the player).
  const { lang: appLang } = useAppLanguage();
  const lang = appLang || initialLang;
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const [page, setPage] = useState(0);
  // The series opening plays before the first lesson of a version; the clapper button replays it.
  const [opening, setOpening] = useState(Boolean(lesson.opening));
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
  // The lesson timer counts down to an end time, so it stays right even if the tab sleeps.
  const [timerEnd, setTimerEnd] = useState(0);
  const [timerLeft, setTimerLeft] = useState(0);
  const [timerMenu, setTimerMenu] = useState(false);
  const [finished, setFinished] = useState(false);
  const swipe = useRef<{ x: number; y: number; id: number } | null>(null);
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
  // Decode every painting of the lesson up front (nearest pages first), so no page freezes while its image loads.
  useEffect(() => {
    const order = lesson.pages.map((_, i) => i).sort((a, b) => Math.abs(a - page) - Math.abs(b - page));
    const seen = new Set<string>();
    for (const i of order) {
      const name = SCENE_IMAGES[lesson.pages[i].scene];
      if (!name || seen.has(name)) continue;
      seen.add(name);
      const img = new Image();
      img.src = asset(`${name}.webp`);
      img.decode?.().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson]);
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
  // The end of the lesson: leave full screen and show the closing card (owner, 2026-10-22).
  const finish = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    setFullscreen(false);
    setTool('none');
    setFinished(true);
    play('praise');
  }, []);
  const forward = useCallback(() => {
    if (step < total) setStep((s) => s + 1);
    else if (page < last) goPage(page + 1);
    else finish();
  }, [step, total, page, last, goPage, finish]);
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
    if (!timerEnd) { setTimerLeft(0); return; }
    const tick = () => {
      const left = Math.max(0, Math.round((timerEnd - Date.now()) / 1000));
      setTimerLeft(left);
      if (!left) { play('chime'); setTimerEnd(0); }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timerEnd]);
  const startTimer = (min: number) => { setTimerEnd(min ? Date.now() + min * 60_000 : 0); setTimerMenu(false); };

  const toggleFullscreen = useCallback(() => {
    const fill = (on: boolean) => setFullscreen(on);
    if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; }
    if (fullscreen) { fill(false); return; }
    // iPhone Safari has no element full screen, and embedded browsers may refuse it or never answer:
    // then fill the window instead, with the same layout.
    if (!document.fullscreenEnabled || !rootRef.current?.requestFullscreen) { fill(true); return; }
    const t = window.setTimeout(() => { if (!document.fullscreenElement) fill(true); }, 800);
    rootRef.current.requestFullscreen().then(() => {
      window.clearTimeout(t);
      // Phones and tablets: turn the slide sideways by itself where the browser allows it (Android Chrome).
      (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> })?.lock?.('landscape').catch(() => {});
    }, () => { window.clearTimeout(t); fill(true); });
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
      else if (teacher && k === 'l') setTool((t) => (t === 'laser' ? 'none' : 'laser'));
      else if (k === 'e') setTool((t) => (t === 'eraser' ? 'none' : 'eraser'));
      else if (k === 'c') setClearSignal((c) => c + 1);
      else if (k === 'g') setGrid((g) => !g);
      else if (teacher && k === 'n') setNotes((n) => !n);
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

  // Replay the current slide's motion whenever it is really seen (owner, 2026-10-24: the first page looked still on
  // opening): when the player first comes into view, when the tab comes back, and on entering or leaving full screen.
  // An animation that ran while hidden has already finished by the time anyone looks.
  useEffect(() => {
    const el = rootRef.current;
    let seen = false;
    const io = el && 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !seen) { seen = true; setReplay((r) => r + 1); }
      if (!e.isIntersecting) seen = false;
    }, { threshold: 0.5 }) : null;
    if (el && io) io.observe(el);
    const onVisible = () => { if (document.visibilityState === 'visible') setReplay((r) => r + 1); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { io?.disconnect(); document.removeEventListener('visibilitychange', onVisible); };
  }, []);
  useEffect(() => { setReplay((r) => r + 1); }, [fullscreen]);

  useEffect(() => {
    const sync = () => {
      const on = Boolean(document.fullscreenElement);
      setFullscreen(on);
    };
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  const btn = (active = false) =>
    `h-12 min-w-12 px-3 inline-flex items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] disabled:opacity-35 ${
      active ? 'bg-[#E5A93C] text-[#1E1410]' : 'text-[#1E1410] hover:bg-[#8B4935]/10'
    }`;

  const timerMenuEl = (
    <span role="menu" className={`${fullscreen ? 'w-[300px]' : 'absolute w-[228px]'} z-50 grid grid-cols-4 gap-1.5 rounded-2xl bg-[#FFFDF7] p-2.5 shadow-[0_18px_40px_-14px_rgba(59,34,25,0.55)] ring-1 ring-black/5 ${fullscreen ? '' : 'bottom-full start-1/2 mb-2 -translate-x-1/2 rtl:translate-x-1/2'}`}>
      <span className="col-span-4 px-1 pb-1 text-xs font-bold text-[#453D34]">{L('Minutes left in the lesson', 'الدقايق الفاضلة في الحصة')}</span>
      {TIMER_MINUTES.map((m) => (
        <button key={m} type="button" role="menuitem" onClick={() => startTimer(m)} className="h-10 rounded-xl text-sm font-bold tabular-nums text-[#1E1410] hover:bg-[#F6D58E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">{m}</button>
      ))}
      {timerLeft > 0 && (
        <button type="button" role="menuitem" onClick={() => startTimer(0)} className="col-span-4 h-10 rounded-xl text-sm font-bold text-[#C51F24] hover:bg-[#C51F24]/10">{L('Stop the timer', 'وقّف المؤقت')}</button>
      )}
    </span>
  );

  const toolbar = (
    <nav
      dir={ar ? 'rtl' : 'ltr'}
      aria-label={L('Lesson controls', 'التحكم في الدرس')}
      className={`flex items-center gap-1 rounded-[28px] [&>*]:shrink-0 border border-white/70 bg-[#FAF7F2]/90 shadow-[0_18px_40px_-20px_rgba(139,73,53,0.55)] backdrop-blur-xl transition-[transform,opacity] duration-300 ${
        fullscreen
          ? // Full screen: a rail in a side drawer (right in English, left in Arabic), opened on its arrow handle.
            'max-h-full shrink-0 flex-col items-center overflow-y-auto px-1.5 py-2 [overflow-anchor:none]'
          : // Under the slide, fixed in place with it (never sticky, never floating), wrapping onto rows instead of running off
            // the side when the screen is narrow or rotated (owner, 2026-10-22 and 2026-10-23).
            'w-full max-w-full flex-wrap justify-center px-3 py-2 xl:justify-start'
      }`}
    >
      <button type="button" className={btn(grid)} onClick={() => setGrid((g) => !g)} aria-pressed={grid} title={L('All pages (G)', 'كل الصفحات (G)')} aria-label={L('All pages', 'كل الصفحات')}>
        <LayoutGrid className="w-5 h-5 shrink-0" />
      </button>
      <button type="button" className={btn(tool === 'pen')} onClick={() => setTool((t) => (t === 'pen' ? 'none' : 'pen'))} aria-pressed={tool === 'pen'} title={L('Pen (D)', 'قلم (D)')} aria-label={L('Pen', 'قلم')}>
        <PenLine className="w-5 h-5 shrink-0" />
      </button>
      <button type="button" className={btn(tool === 'marker')} onClick={() => setTool((t) => (t === 'marker' ? 'none' : 'marker'))} aria-pressed={tool === 'marker'} title={L('Highlighter (H)', 'تظليل (H)')} aria-label={L('Highlighter', 'تظليل')}>
        <Highlighter className="w-5 h-5 shrink-0" />
      </button>
      {/* Students get a study kit only: pen, highlighter, eraser. The laser and the teacher's notes are for presenting. */}
      {teacher && (
        <button type="button" className={btn(tool === 'laser')} onClick={() => setTool((t) => (t === 'laser' ? 'none' : 'laser'))} aria-pressed={tool === 'laser'} title={L('Laser pointer (L)', 'مؤشر ليزر (L)')} aria-label={L('Laser pointer', 'مؤشر ليزر')}>
          <MousePointer2 className="w-5 h-5 shrink-0" />
        </button>
      )}
      <button type="button" className={btn(tool === 'eraser')} onClick={() => setTool((t) => (t === 'eraser' ? 'none' : 'eraser'))} aria-pressed={tool === 'eraser'} title={L('Eraser: drag over what to remove (E)', 'ممحاة: اسحبها على اللي عايز تمسحه (E)')} aria-label={L('Eraser', 'ممحاة')}>
        <Eraser className="w-5 h-5 shrink-0" />
      </button>
      {(tool === 'eraser' || fullscreen) && (
        <button type="button" disabled={tool !== 'eraser'} className={`${btn()} text-[#C51F24]`} onClick={() => setClearSignal((c) => c + 1)} title={L('Clear the whole page (C)', 'امسح الصفحة كلها (C)')} aria-label={L('Clear the whole page', 'امسح الصفحة كلها')}>
          <Trash2 className="w-5 h-5 shrink-0" />
        </button>
      )}
      {/* Always in place (dimmed until a pen is picked), so choosing a tool never shifts the buttons under the cursor. */}
      {(
        <span className={`${fullscreen ? 'grid grid-cols-2 gap-1 py-1' : 'inline-flex'} transition-opacity duration-150 ${tool === 'pen' || tool === 'marker' ? '' : 'pointer-events-none opacity-30'}`} inert={tool !== 'pen' && tool !== 'marker'}>
          {INK_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => setInkColor(c)} aria-label={L('Ink colour', 'لون الحبر')} aria-pressed={inkColor === c} className={`${fullscreen ? 'h-7 w-7' : 'h-11 w-8'} inline-flex items-center justify-center`}>
              <span className={`block rounded-full ring-2 ring-offset-2 ring-offset-[#FAF7F2] ${fullscreen ? 'h-4 w-4' : 'h-6 w-6'} ${inkColor === c ? 'ring-[#1E1410]' : 'ring-transparent'}`} style={{ background: c }} />
            </button>
          ))}
        </span>
      )}
      <span className={fullscreen ? 'my-1.5 h-px w-full bg-[#8B4935]/15' : 'mx-1 hidden h-7 w-px bg-[#8B4935]/20 xl:mx-auto xl:block'} aria-hidden="true" />
      {lesson.opening && (
        <button type="button" className={btn(opening)} onClick={() => setOpening((o) => !o)} aria-pressed={opening} title={L('Series opening: meet the characters', 'مقدمة السلسلة: تعرّف على الشخصيات')} aria-label={L('Series opening', 'مقدمة السلسلة')}>
          <Clapperboard className="w-5 h-5 shrink-0" />
        </button>
      )}
      <button type="button" className={btn()} onClick={replayStep} title={L('Replay the last step (R)', 'أعد آخر خطوة (R)')} aria-label={L('Replay the last step', 'أعد آخر خطوة')}>
        <RotateCcw className="w-5 h-5 shrink-0" />
      </button>
      {teacher && (
        <>
          <span className="relative">
            <button
              type="button"
              className={btn(timerLeft > 0 || timerMenu)}
              onClick={() => setTimerMenu((m) => !m)}
              aria-expanded={timerMenu}
              title={L('Lesson timer: 5 to 60 minutes', 'مؤقت الحصة: من 5 لـ 60 دقيقة')}
              aria-label={L('Lesson timer', 'مؤقت الحصة')}
            >
              <Timer className="w-5 h-5 shrink-0" />
              {timerLeft > 0 && !fullscreen && <span className="tabular-nums">{clock(timerLeft)}</span>}
            </button>
            {timerMenu && !fullscreen && timerMenuEl}
          </span>
          <button type="button" className={btn()} onClick={cheer} title={L('Praise (P)', 'تشجيع (P)')} aria-label={L('Praise', 'تشجيع')}>
            <Star className="w-5 h-5 shrink-0 text-[#E5A93C]" />
          </button>
        </>
      )}
      <button type="button" className={btn()} onClick={toggleMute} aria-pressed={muted} title={muted ? L('Sound off (M)', 'الصوت مقفول (M)') : L('Sound on (M)', 'الصوت شغال (M)')} aria-label={muted ? L('Turn sound on', 'شغّل الصوت') : L('Turn sound off', 'اقفل الصوت')}>
        {muted ? <VolumeX className="w-5 h-5 shrink-0" /> : <Volume2 className="w-5 h-5 shrink-0" />}
      </button>
      {teacher && (
        <button type="button" className={btn(notes)} onClick={() => setNotes((n) => !n)} aria-pressed={notes} title={L('Explanation (N)', 'الشرح (N)')} aria-label={L('Explanation', 'الشرح')}>
          <BookOpenText className="w-5 h-5 shrink-0" />
        </button>
      )}
      {/* Extra page for a 60-minute lesson; skip it in 30 minutes (docs/curriculum/RULES.md §1.7). The slide shows the page count. */}
      {current.optional && <span className={`rounded-full bg-[#E5A93C]/20 px-2.5 py-1 text-xs font-bold text-[#8B4935] ${fullscreen ? '' : 'ms-auto'}`}>{L('Optional', 'إضافية')}</span>}
      {!fullscreen && (
        <button
          type="button"
          onClick={toggleFullscreen}
          title={L('Full screen (F)', 'ملء الشاشة (F)')}
          className={`${current.optional ? '' : 'xl:ms-auto'} relative max-xl:order-first max-xl:w-full h-12 shrink-0 whitespace-nowrap inline-flex items-center justify-center gap-2 rounded-full bg-[#C51F24] px-5 text-[15px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(197,31,36,0.8)] transition-[background-color,transform] duration-150 hover:bg-[#A8181D] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] focus-visible:ring-offset-2`}
        >
          {/* On a phone held upright the hint is the button itself: a phone that turns sideways and one short line. */}
          <motion.span className="hidden portrait:max-xl:inline-flex" aria-hidden="true"
            animate={reduce ? undefined : { rotate: [0, 0, -90, -90, 0] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.3, 0.5, 0.8, 1] }}>
            <Smartphone className="w-5 h-5" />
          </motion.span>
          <Maximize2 className="w-5 h-5 portrait:max-xl:hidden" />
          {L('Full screen', 'ملء الشاشة')}
          <span className="hidden text-[12px] font-semibold text-white/80 portrait:max-xl:inline">{L('· best sideways', '· أحسن بالعرض')}</span>
        </button>
      )}
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
    <div ref={rootRef} onPointerDownCapture={primeSounds} dir="ltr" className={`flex gap-3 ${fillWindow ? 'fixed inset-0 z-[100]' : 'relative'} ${fullscreen ? 'band-deep h-full p-3 pb-16 [@media(max-height:620px)]:p-0' : 'flex-col'}`}>
      <div dir={ar ? 'rtl' : 'ltr'} className={`relative flex flex-col gap-3 overflow-hidden ${fullscreen ? 'min-h-0 flex-1' : ''}`}>
        <div className={`flex min-w-0 flex-1 flex-col gap-3 ${fullscreen ? 'h-full min-h-0' : ''}`}>
          <div
            ref={stageRef}
            className={`relative min-w-0 ${fullscreen ? 'min-h-0 flex-1' : 'aspect-video'}`}
            style={{ touchAction: tool === 'none' ? 'pan-y' : undefined }}
            // Swipe left / right on a phone or tablet to go forward / back (owner, 2026-10-22). Taps, vertical scrolls,
            // drawing and the game's draggable card are left alone.
            onPointerDown={(e) => {
              if (opening || e.pointerType === 'mouse' || tool !== 'none' || (e.target as Element).closest('[data-no-swipe], input, textarea')) return;
              swipe.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s || s.id !== e.pointerId) return;
              const dx = e.clientX - s.x;
              const dy = e.clientY - s.y;
              if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
              if (dx < 0) forward(); else backward();
            }}
            onPointerCancel={() => (swipe.current = null)}
          >
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
              <AnimatePresence>
                {opening && lesson.opening && <Opening lesson={lesson} data={lesson.opening} ar={ar} onDone={() => { setOpening(false); goPage(0); }} />}
              </AnimatePresence>
              {timerLeft > 0 && (
                // Small and out of the way; amber in the last 5 minutes, crimson in the last minute.
                <div className="pointer-events-none absolute right-[200px] top-[28px] z-20 flex items-center gap-2 rounded-full px-4 py-1.5 font-sans text-[22px] font-bold tabular-nums shadow-md"
                  style={{ background: timerLeft <= 60 ? P.crimson : timerLeft <= 300 ? P.gold : 'rgba(255,253,247,0.92)', color: timerLeft <= 60 ? '#fff' : P.ink }}>
                  <Timer className="h-5 w-5" aria-hidden="true" />{clock(timerLeft)}
                </div>
              )}
              <AnimatePresence>{praise && <Praise />}</AnimatePresence>
              <AnimatePresence>
                {finished && sample && (
                  <motion.div dir={ar ? 'rtl' : 'ltr'} className="band-deep absolute inset-0 z-40 flex flex-col items-center justify-center gap-7 px-24 text-center"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
                    <motion.span className="flex h-36 w-36 items-center justify-center rounded-full bg-[#E5A93C]/15 ring-2 ring-[#E5A93C]/60" aria-hidden="true"
                      initial={reduce ? false : { scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.35, duration: 0.8 }}>
                      <Lock className="h-16 w-16 text-[#F6D58E]" />
                    </motion.span>
                    <p className="font-serif text-[72px] font-bold leading-[1.05] text-white">{sample.teaser}</p>
                    <p className="max-w-[1000px] font-sans text-[30px] leading-snug text-white/80">
                      {L(`You watched ${lesson.pages.length} of ${sample.totalPages} pages. Book a free trial lesson and your teacher opens the rest with you.`,
                        `شفت ${lesson.pages.length} من ${sample.totalPages} صفحة. احجز حصة تجريبية مجانية، والمعلم يفتحلك باقي الدرس.`)}
                    </p>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => { setFinished(false); goPage(0); }} className="rounded-full bg-white/10 px-8 py-4 font-sans text-[26px] font-bold text-white ring-1 ring-white/30 hover:bg-white/20">{L('Watch again', 'اتفرج تاني')}</button>
                      <button type="button" onClick={sample.onBook} className="rounded-full bg-[#C51F24] px-10 py-4 font-sans text-[28px] font-bold text-white shadow-[0_14px_30px_-12px_rgba(197,31,36,0.8)] hover:bg-[#A8181D]">{L('Book a free trial', 'احجز حصة تجريبية مجانية')}</button>
                    </div>
                  </motion.div>
                )}
                {finished && !sample && (
                  <LessonEnd lesson={lesson} ar={ar} teacher={Boolean(teacher)} onRestart={() => { setFinished(false); goPage(0); }} onClose={() => setFinished(false)} />
                )}
              </AnimatePresence>
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
            {/* Back / Next live on the slide's lower corners, outside the tool bar, so they are always one tap away
                (owner, 2026-10-22). Next shows this page's build steps. Arrow keys and swipes do the same. */}
            <div dir="ltr" className={`pointer-events-none absolute inset-x-2 bottom-[15%] z-30 flex items-end justify-between sm:inset-x-3 ${opening ? 'hidden' : ''}`}>
              <button type="button" onClick={backward} disabled={page === 0 && step === 0} aria-label={L('Back', 'رجوع')} title={L('Back (←)', 'رجوع (←)')}
                className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#FFFDF7]/85 text-[#1E1410] shadow-[0_10px_24px_-10px_rgba(30,20,16,0.6)] ring-1 ring-black/5 backdrop-blur transition-[transform,opacity] duration-150 hover:bg-[#FFFDF7] active:scale-95 disabled:opacity-0 sm:h-12 sm:w-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <button type="button" onClick={forward} aria-label={page === last && step >= total ? L('Finish the lesson', 'خلّص الدرس') : L('Next', 'التالي')} title={L('Next (→ or Space)', 'التالي (→ أو مسافة)')}
                className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-[#C51F24] ps-4 pe-3 text-white shadow-[0_12px_28px_-10px_rgba(197,31,36,0.7)] transition-[transform,opacity] duration-150 hover:bg-[#A9191E] active:scale-95 disabled:opacity-30 sm:h-12 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
                {page === last && step >= total ? (
                  <span className="text-sm font-bold">{sample ? L('See the rest', 'شوف الباقي') : L('Finish', 'خلّص الدرس')}</span>
                ) : total > 0 && (
                  <span className="flex gap-1" aria-hidden="true">
                    {Array.from({ length: total }).map((_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i < step ? 'bg-white' : 'bg-white/35'}`} />)}
                  </span>
                )}
                {page === last && step >= total ? (sample ? <Lock className="h-5 w-5" aria-hidden="true" /> : <Check className="h-6 w-6" aria-hidden="true" />) : <ChevronRight className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {/* The page list at a readable size on phones, where the grid inside the slide is too small. */}
          {!fullscreen && scale < 0.36 && grid && (
            <ol className="grid grid-cols-2 gap-2" aria-label={L('All pages', 'كل الصفحات')}>
              {lesson.pages.map((p, i) => (
                <li key={i}>
                  <button type="button" dir="ltr" lang="en" onClick={() => goPage(i)} className={`min-h-11 w-full rounded-2xl px-3 py-2 text-start text-sm font-bold ${i === page ? 'bg-[#E5A93C] text-[#1E1410]' : 'bg-[#FFFDF7] text-[#1E1410] ring-1 ring-black/5'}`}>
                    <span className="me-1.5 opacity-60">{i + 1}</span>{p.title}{p.optional && <span className="ms-1.5 opacity-60">· {L('Optional', 'إضافية')}</span>}
                  </button>
                </li>
              ))}
            </ol>
          )}
        </div>
        {!teacher ? null : isWide ? (
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
      {fullscreen && (
        <>
          {/* Exit lives in the strip under the slide, in the corner away from the tools rail, on every screen size (owner, 2026-10-22). */}
          <button
            type="button"
            onClick={toggleFullscreen}
            title={L('Exit full screen (Esc)', 'خروج من ملء الشاشة (Esc)')}
            aria-label={L('Exit full screen', 'خروج من ملء الشاشة')}
            className={`absolute bottom-2.5 ${toolsSide === 'left' ? 'right-3' : 'left-3'} z-40 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#C51F24] text-white shadow-[0_10px_24px_-10px_rgba(0,0,0,0.6)] ring-2 ring-white/70 transition-[background-color,transform] duration-150 hover:bg-[#A8181D] active:scale-[0.94] focus-visible:outline-none focus-visible:ring-[#E5A93C]`}
          >
            <Minimize2 className="h-5 w-5" />
          </button>
          {timerMenu && (
            <div className="absolute inset-0 z-[60] grid place-items-center bg-black/35" onClick={() => setTimerMenu(false)}>
              <div dir={ar ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>{timerMenuEl}</div>
            </div>
          )}
        </>
      )}
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
