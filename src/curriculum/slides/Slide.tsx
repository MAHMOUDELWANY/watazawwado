import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useAnimate, useReducedMotion } from 'motion/react';
import type { Interaction, Lesson, LessonPage } from '../types';
import { SceneArt, P } from './Art';
import { play } from './sfx';
import { ClueLens, Unveil, DoorsLight, PackZad, Callback, type Lens } from './Scenes';
import { BUILDS, STUDIES, MOMENTS, PACKED } from './lessons';

/** Correct answers per bin of a game checkpoint, for the teacher report (PLAN §3a.3b). */
export type GameResult = Record<string, { correct: number; total: number }>;

export const CANVAS_W = 1600;
export const CANVAS_H = 900;

/** How many build steps a page has: each line, each item, the evidence, then the interaction. */
export function stepsFor(page: LessonPage): number {
  return page.lines.length + (page.items?.length || 0) + (page.evidence ? 1 : 0) + (page.interaction ? 1 : 0);
}

/** What is visible at build step `step` (0 = nothing yet, stepsFor = everything). */
function visibility(page: LessonPage, step: number) {
  let rest = step;
  const take = (n: number) => { const t = Math.min(Math.max(rest, 0), n); rest -= n; return t; };
  const lines = take(page.lines.length);
  let interaction = false;
  if (page.askFirst && page.interaction) interaction = take(1) === 1;
  const items = take(page.items?.length || 0);
  const evidence = Boolean(page.evidence) && take(1) === 1;
  if (!page.askFirst && page.interaction) interaction = take(1) === 1;
  return { lines, items, evidence, interaction };
}

const ease = [0.22, 1, 0.36, 1] as const;
const build = { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.6, ease } };

interface SlideProps {
  lesson: Lesson;
  pageIndex: number;
  step: number;
  onCorrect: () => void;
  onGameResult: (r: GameResult) => void;
}

/** One slide on the fixed 1600 × 900 notebook canvas. */
export function Slide({ lesson, pageIndex, step, onCorrect, onGameResult }: SlideProps) {
  const page = lesson.pages[pageIndex];
  const v = visibility(page, step);
  const chapter = [...lesson.chapters].reverse().find((c) => c.page <= pageIndex);
  const rootRef = useRef<HTMLDivElement>(null);
  const [found, setFound] = useState<string[]>([]);
  const [chosen, setChosen] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const stage = isStage(compositionFor(page));
  // Stepping back past the question (or replaying it) clears what the child found or chose, so the art matches the question.
  useEffect(() => {
    if (!v.interaction) { setFound([]); setChosen(null); setAnswered(false); }
  }, [v.interaction]);
  // Each new build step lands at the bottom of the text column; bring it into view.
  useEffect(() => {
    if (step === 0) return;
    const t = window.setTimeout(() => rootRef.current?.querySelectorAll('.slide-scroll').forEach((el) => { const last = el.lastElementChild as HTMLElement | null; if (last) el.scrollTo({ top: Math.max(0, last.offsetTop + last.offsetHeight - el.clientHeight + 16), behavior: 'smooth' }); }), 120);
    return () => window.clearTimeout(t);
  }, [step]);

  return (
    <div ref={rootRef} className="absolute inset-0 overflow-hidden" style={{ background: P.paper, color: P.ink }} dir="ltr" lang="en">
      {!stage && <Paper />}
      <Body page={page} v={v} step={step} lesson={lesson} found={found} chosen={chosen} answered={answered} onAnswer={() => setAnswered(true)} onChoose={setChosen} onCorrect={onCorrect} onGameResult={onGameResult} onClue={(l) => setFound((f) => (f.includes(l) ? f : [...f, l]))} />
      {stage && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[150px]" style={{ background: 'linear-gradient(180deg, rgba(20,12,8,0.55), transparent)' }} />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[150px]" style={{ background: 'linear-gradient(0deg, rgba(20,12,8,0.6), transparent)' }} />
        </>
      )}
      <header className="absolute left-[120px] right-[260px] top-[46px] flex items-center gap-4">
        <KhatamStar size={30} color={P.crimson} />
        <span className="font-sans text-[24px] font-bold" style={{ color: stage ? '#FFF8EA' : P.crimson }}>Lesson {lesson.number}</span>
        <span className="font-sans text-[24px] font-semibold" style={{ color: stage ? '#F3E6CC' : P.inkSoft }}>{chapter?.label}</span>
        <span lang="ar" dir="rtl" className="font-serif text-[30px] font-bold leading-none" style={{ color: stage ? P.goldSoft : P.copper }}>{lesson.titleAr}</span>
      </header>
      <div
        className="absolute right-[90px] top-0 w-[136px] pb-4 pt-9 text-center shadow-[0_16px_34px_-16px_rgba(197,31,36,0.7)]"
        style={{ background: `linear-gradient(180deg, ${P.crimson}, #9E171C)`, borderRadius: '0 0 68px 68px / 0 0 56px 56px' }}
      >
        <div className="font-sans text-[17px] font-bold text-white/85">Lesson</div>
        <div className="font-serif text-[60px] font-bold leading-none text-white">{String(lesson.number).padStart(2, '0')}</div>
        <div className="mx-auto mt-2 w-fit"><KhatamStar size={22} color={P.goldSoft} /></div>
      </div>


      <ChapterTracker lesson={lesson} pageIndex={pageIndex} light={stage} />
    </div>
  );
}

/** The slide's words at reading size, for screens where the 16:9 canvas is too small to read (a phone held upright).
 *  It follows the same build steps as the canvas, so it never shows more than the teacher has revealed. */
export function SlideText({ page, step }: { page: LessonPage; step: number }) {
  const v = visibility(page, step);
  // The answer page of the reveal keeps its title back until the veil parts (see the 'unveil' composition).
  const hideTitle = compositionFor(page) === 'unveil' && page.layout === 'evidence' && v.lines === 0;
  if (hideTitle) return null;
  const e = page.evidence;
  return (
    <section lang="en" dir="ltr" aria-label="Slide text" className="space-y-2 rounded-[20px] bg-[#FFFDF7] px-4 py-3 text-[#1E1410] ring-1 ring-black/5">
      <h3 className="font-serif text-xl font-bold leading-tight">{page.title}</h3>
      {v.evidence && e ? (
        <figure className="space-y-1">
          <blockquote lang="ar" dir="rtl" className="font-serif text-2xl leading-[1.7]">{e.arabic}</blockquote>
          <figcaption className="text-[15px] leading-snug">
            <span className="italic">“{e.meaning}”</span>
            <span className="mt-0.5 block text-[13px] font-bold" style={{ color: P.copper }}>{e.reference}</span>
          </figcaption>
        </figure>
      ) : (
        page.lines.slice(0, v.lines).map((l, i) => (
          <p key={i} className={`text-[16px] leading-snug ${i === v.lines - 1 ? 'font-semibold' : 'opacity-70'}`}>{l}</p>
        ))
      )}
      {v.items > 0 && (
        <ol className="flex flex-wrap gap-1.5">
          {page.items!.slice(0, v.items).map((it) => <li key={it} className="rounded-full bg-[#FCEFD2] px-2.5 py-0.5 text-[14px] font-bold">{it}</li>)}
        </ol>
      )}
      {v.interaction && page.interaction && <p className="text-[16px] font-bold" style={{ color: P.teal }}>{page.interaction.prompt}</p>}
    </section>
  );
}

const KHATAM = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Cg fill='none' stroke='%238B4935' stroke-opacity='0.13' stroke-width='1.4'%3E%3Crect x='24' y='24' width='48' height='48'/%3E%3Crect x='24' y='24' width='48' height='48' transform='rotate(45 48 48)'/%3E%3Ccircle cx='48' cy='48' r='8'/%3E%3C/g%3E%3C/svg%3E\")";

/** The brand's eight-point khatam star. */
export function KhatamStar({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="8" y="8" width="24" height="24" fill={color} />
      <rect x="8" y="8" width="24" height="24" fill={color} transform="rotate(45 20 20)" />
      <circle cx="20" cy="20" r="5" fill="#FAF7F2" opacity="0.9" />
    </svg>
  );
}

function Paper() {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 59px, rgba(139,73,53,0.09) 59px 60px)', backgroundPosition: '0 30px' }}
      />
      <div className="absolute inset-0" style={{ backgroundImage: KHATAM, WebkitMaskImage: 'radial-gradient(ellipse 60% 70% at 100% 100%, #000, transparent 70%)', maskImage: 'radial-gradient(ellipse 60% 70% at 100% 100%, #000, transparent 70%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(900px 500px at 92% 8%, rgba(229,169,60,0.14), transparent 70%), radial-gradient(700px 500px at 0% 100%, rgba(8,125,145,0.08), transparent 70%)' }} />
      <div className="absolute top-0 bottom-0 left-[80px] w-[2px]" style={{ background: 'rgba(197,31,36,0.25)' }} />
    </>
  );
}

function ChapterTracker({ lesson, pageIndex, light = false }: { lesson: Lesson; pageIndex: number; light?: boolean }) {
  return (
    <footer className="absolute left-[120px] right-[90px] bottom-[34px] flex items-center gap-8">
      <span className="font-sans text-[19px] font-bold" style={{ color: light ? '#E9DCC5' : P.inkSoft }}>In this lesson</span>
      {lesson.chapters.map((c, i) => {
        const next = lesson.chapters[i + 1]?.page ?? lesson.pages.length;
        const state = pageIndex >= next ? 'done' : pageIndex >= c.page ? 'now' : 'later';
        return (
          <span key={c.label} className="flex items-center gap-3 font-sans text-[20px] font-bold" style={{ color: state === 'later' ? (light ? 'rgba(255,248,234,0.55)' : '#A39686') : light ? '#FFF8EA' : P.ink }}>
            <span
              className="flex h-9 w-9 items-center justify-center rounded-full text-[17px]"
              style={{
                background: state === 'now' ? P.crimson : state === 'done' ? P.teal : 'transparent',
                color: state === 'later' ? '#A39686' : '#fff',
                border: state === 'later' ? '2px solid #D8CBB8' : 'none',
              }}
            >
              {state === 'done' ? '✓' : i + 1}
            </span>
            {c.label}
          </span>
        );
      })}
      <span className="ml-auto font-sans text-[18px] font-bold" style={{ color: '#A39686' }}>
        {pageIndex + 1} / {lesson.pages.length}
      </span>
    </footer>
  );
}

/* ---------- art direction: "illuminated storybook" ----------
   Two surfaces. Stage = the painting fills the slide (story moments, questions, the cliffhanger).
   Paper = the notebook page (evidence, diagrams, the game). Each page gets a composition from its role,
   so the lesson alternates rhythm instead of repeating one template (docs/curriculum/PLAN.md, slide system v3). */

/** Painted scenes (owner, ChatGPT) in public/curriculum/zad-kids/<lesson>/; scenes not listed fall back to SVG art. */
export const SCENE_IMAGES: Partial<Record<LessonPage['scene'], string>> = {
  doorsHero: 'l01/cover', doors: 'l01/cover', chalkboard: 'l01/classroom', jiddo: 'l01/jiddo', madinah: 'l01/madinah', stranger: 'l01/stranger',
  sitting: 'l01/sitting', pillars: 'l01/pillars', roots: 'l01/roots', drawing: 'l01/drawing', reveal: 'l01/reveal', backpack: 'l01/backpack', lego: 'l01/lego',
  crash: 'l02/crash', sky: 'l02/sky', lock: 'l02/lock', camel: 'l02/camel', park: 'l02/park', boat: 'l02/boat',
  window: 'l02/cover', baby: 'l02/baby', desert: 'l02/desert-sky',
  oneSun: 'l03/cover', sunrise: 'l03/sunrise', recite: 'l03/recite', masjidNight: 'l03/masjid-night', dua: 'l03/dua', football: 'l03/football',
};

/** Where the crop of a wide (16:9) painting sits when its box cuts it (CSS object-position), so the people stay in view. */
const SCENE_FOCUS: Partial<Record<LessonPage['scene'], string>> = { sunrise: '75% 50%', dua: '32% 50%', football: '10% 50%' };

/** Where labels point on each painting (% of the image box): x,y = the point, lx,ly = the label. */
type Pin = { x: number; y: number; lx: number; ly: number };
const PINS: Partial<Record<LessonPage['scene'], Pin[]>> = {
  doors: [{ x: 18, y: 50, lx: 18, ly: 86 }, { x: 50, y: 50, lx: 50, ly: 86 }, { x: 82, y: 50, lx: 82, ly: 86 }],
};
/** Clues found on the stranger page: a lens magnifies the detail in stranger.webp (x,y = % of the image). */
const CLUE_LENSES: Record<string, Lens> = {
  'No dust from a journey': { x: 31, y: 88, lx: 64, ly: 66, label: 'No dust?' },
  'Nobody knew who he was': { x: 52, y: 26, lx: 30, ly: 6, label: 'Who is he?', ring: { w: 300, h: 330 } },
};
const STRANGER = { w: 1086, h: 1448 };

type Composition = 'title' | 'picturebook' | 'portrait' | 'manuscript' | 'diagram' | 'spotlight' | 'luminous' | 'unveil' | 'arena' | 'journal' | 'cliffhanger';

export function compositionFor(page: LessonPage): Composition {
  // The two reveal pages share one veiled courtyard that opens across them (Scenes.tsx, Unveil).
  if (page.scene === 'reveal' && (page.layout === 'question' || page.layout === 'evidence')) return 'unveil';
  switch (page.layout) {
    case 'cover': return 'title';
    case 'story': return 'picturebook';
    case 'evidence':
      if (page.interaction?.kind === 'clues') return 'portrait';
      return page.scene === 'reveal' ? 'luminous' : 'manuscript';
    case 'concept': return 'diagram';
    case 'question': return page.scene === 'reveal' ? 'luminous' : 'spotlight';
    case 'game': return 'arena';
    case 'mission': return 'journal';
    case 'next': return 'cliffhanger';
  }
}
/** Dark compositions put light chrome (header, tracker) over the painting. */
export const isStage = (c: Composition) => c === 'title' || c === 'spotlight' || c === 'luminous' || c === 'unveil' || c === 'cliffhanger';

/** The painting, with one authored entrance: it settles out of a soft blur, then drifts slowly. */
function Painting({ page, className = '', style, drift = true, children }: { page: LessonPage; className?: string; style?: React.CSSProperties; drift?: boolean; children?: React.ReactNode }) {
  const reduce = useReducedMotion();
  // A painting the owner has not delivered yet shows a warm wash, so the page's motion still reads on it.
  const [missing, setMissing] = useState<string | null>(null);
  const listed = SCENE_IMAGES[page.scene];
  const src = listed && listed !== missing ? listed : undefined;
  return (
    <div className={`absolute overflow-hidden ${className}`} style={style}>
      {/* The slow camera move scales the painting and its overlays together, so motion drawn over it stays on its spot. */}
      <motion.div
        className="absolute inset-0"
        initial={reduce ? false : { scale: 1.1 }}
        animate={reduce ? undefined : { scale: 1 }}
        transition={{ duration: drift ? 16 : 1.2, ease: 'easeOut' }}
      >
        {src ? (
          <motion.img
            src={`/curriculum/zad-kids/${src}.webp`}
            alt={page.title}
            draggable={false}
            onError={() => setMissing(src)}
            className="h-full w-full object-cover"
            style={{ objectPosition: SCENE_FOCUS[page.scene] }}
            initial={reduce ? false : { filter: 'blur(8px) saturate(0.85)' }}
            animate={reduce ? undefined : { filter: 'blur(0px) saturate(1)' }}
            transition={{ duration: 0.8, ease }}
          />
        ) : listed ? (
          <div className="h-full w-full" role="img" aria-label={page.title} style={{ background: 'radial-gradient(ellipse at 60% 40%, #F3D9A4 0%, #C98D57 60%, #7A4A30 100%)' }} />
        ) : (
          <SceneArt id={page.scene} label={page.title} />
        )}
        {children}
      </motion.div>
    </div>
  );
}

/** A label with a leader line pointing at a spot in the painting (the reference's annotation device). */
function Pins({ pins, labels }: { pins: Pin[]; labels: (string | null)[] }) {
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        {pins.map((p, i) =>
          labels[i] ? (
            <motion.line
              key={i}
              x1={p.x} y1={p.y} x2={p.lx} y2={p.ly}
              stroke={P.gold} strokeWidth={3} vectorEffect="non-scaling-stroke" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.6, ease }}
            />
          ) : null,
        )}
      </svg>
      {pins.map((p, i) =>
        labels[i] ? (
          <React.Fragment key={i}>
            <motion.span
              className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white"
              style={{ left: `${p.x}%`, top: `${p.y}%`, background: P.crimson, boxShadow: '0 0 0 6px rgba(229,169,60,0.45)' }}
              initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 18 }}
            />
            <motion.span
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full px-5 py-2 font-sans text-[24px] font-bold shadow-[0_10px_24px_-12px_rgba(30,20,16,0.6)]"
              style={{ left: `${p.lx}%`, top: `${p.ly}%`, background: '#FFFDF7', color: P.crimson }}
              initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35, duration: 0.4, ease }}
            >
              {labels[i]}
            </motion.span>
          </React.Fragment>
        ) : null,
      )}
    </>
  );
}

function Title({ children, size = 84, light = false }: { children: React.ReactNode; size?: number; light?: boolean }) {
  return (
    <h2 className="font-serif font-medium leading-[1.02] tracking-[-0.015em] [text-wrap:balance]" style={{ fontSize: size, color: light ? '#FFF8EA' : P.ink }}>
      {children}
    </h2>
  );
}

/** Narration builds line by line; the newest line is the brightest, earlier ones step back. */
function Lines({ lines, count, size = 40, light = false }: { lines: string[]; count: number; size?: number; light?: boolean }) {
  return (
    <div className="space-y-3">
      {lines.slice(0, count).map((l, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 18, filter: 'blur(4px)' }}
          animate={{ opacity: i === count - 1 ? 1 : 0.62, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.55, ease }}
          className="font-sans font-medium leading-[1.32] [text-wrap:pretty]"
          style={{ fontSize: size, color: light ? '#FFF8EA' : P.ink }}
        >
          {l}
        </motion.p>
      ))}
    </div>
  );
}

/** Manuscript treatment: the Arabic is the hero, written in right to left between gold rules. */
function Manuscript({ page, size = 60, light = false, align = 'center' }: { page: LessonPage; size?: number; light?: boolean; align?: 'center' | 'start' }) {
  const e = page.evidence!;
  const write = Math.min(4, 1 + e.arabic.length / 40);
  return (
    <motion.figure initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={align === 'center' ? 'text-center' : ''}>
      <div className={`flex items-center gap-4 ${align === 'center' ? 'justify-center' : ''}`} aria-hidden="true">
        <span className="h-px w-20" style={{ background: P.gold }} />
        <KhatamStar size={20} color={P.gold} />
        <span className="h-px w-20" style={{ background: P.gold }} />
      </div>
      <motion.blockquote
        lang="ar"
        dir="rtl"
        className="mt-4 font-serif leading-[1.75]"
        style={{ fontSize: size, color: light ? '#FFF3D6' : P.ink, textShadow: light ? '0 0 30px rgba(246,213,142,0.45)' : undefined }}
        initial={{ clipPath: 'inset(0 0 0 100%)' }}
        animate={{ clipPath: 'inset(0 0 0 0%)' }}
        transition={{ duration: write, ease: 'easeInOut' }}
      >
        {e.arabic}
      </motion.blockquote>
      <motion.figcaption initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(3, write * 0.7), duration: 0.6, ease }} className="mt-3">
        <span className="block font-serif text-[27px] italic leading-snug" style={{ color: light ? '#F3E6CC' : P.inkSoft }}>“{e.meaning}”</span>
        <span className="mt-2 block font-sans text-[19px] font-bold" style={{ color: light ? P.goldSoft : P.copper }}>{e.reference}</span>
      </motion.figcaption>
    </motion.figure>
  );
}

function Vocab({ page, light = false }: { page: LessonPage; light?: boolean }) {
  if (!page.vocab?.length) return null;
  return (
    <div className="flex flex-wrap gap-6">
      {page.vocab.map((w) => (
        <span key={w.translit} className="flex items-baseline gap-3 font-sans text-[22px]" style={{ color: light ? '#FFF8EA' : P.ink }}>
          <motion.span lang="ar" dir="rtl" className="shrink-0 whitespace-nowrap font-serif text-[40px] leading-none" style={{ color: light ? P.goldSoft : P.crimson }} initial={{ clipPath: 'inset(0 0 0 100%)' }} animate={{ clipPath: 'inset(0 0 0 0%)' }} transition={{ duration: 0.9, delay: 0.3, ease: 'easeInOut' }}>{w.arabic}</motion.span>
          <b className="shrink-0 whitespace-nowrap">{w.translit}</b>
          <span style={{ color: light ? '#E9DCC5' : P.inkSoft }}>{w.meaning}</span>
        </span>
      ))}
    </div>
  );
}

function Scrim({ to }: { to: 'side' | 'sideEnd' | 'bottom' | 'all' }) {
  const bg =
    to === 'sideEnd'
      ? 'linear-gradient(270deg, rgba(20,12,8,0.9) 0%, rgba(20,12,8,0.62) 42%, rgba(20,12,8,0) 72%)'
      : to === 'side'
      ? 'linear-gradient(90deg, rgba(20,12,8,0.88) 0%, rgba(20,12,8,0.6) 40%, rgba(20,12,8,0) 72%)'
      : to === 'bottom'
        ? 'linear-gradient(0deg, rgba(20,12,8,0.9) 0%, rgba(20,12,8,0.45) 40%, rgba(20,12,8,0) 68%)'
        : 'radial-gradient(ellipse at 50% 45%, rgba(5,30,36,0.3), rgba(5,20,24,0.85) 80%)';
  return <div className="pointer-events-none absolute inset-0" style={{ background: bg }} />;
}

const COL = 'slide-scroll overflow-y-auto pb-4 pr-4';

/** An Arabic term the lesson teaches somewhere in its vocab, looked up by its transliteration. */
const vocabOf = (lesson: Lesson, translit: string) => lesson.pages.flatMap((p) => p.vocab ?? []).find((w) => w.translit === translit);

/** The lesson's three answers (Iman, Islam, Ihsan), as the doors page lists them, with their Arabic. */
function threeDoors(lesson: Lesson) {
  const items = lesson.pages.find((p) => p.scene === 'doors' && p.items)?.items ?? [];
  return items.map((it) => { const label = it.split(':')[0].trim(); return { label, arabic: vocabOf(lesson, label)?.arabic }; });
}

function Body({ page, v, step, lesson, found, chosen, answered, onAnswer, onChoose, onCorrect, onGameResult, onClue }: {
  page: LessonPage; v: ReturnType<typeof visibility>; step: number; lesson: Lesson; found: string[]; chosen: string | null; answered: boolean;
  onAnswer: () => void; onChoose: (option: string) => void; onCorrect: () => void; onGameResult: (r: GameResult) => void; onClue: (label: string) => void;
}) {
  const c = compositionFor(page);
  const Moment = MOMENTS[page.scene];
  const Packed = PACKED[lesson.number];
  const interaction = page.interaction && v.interaction ? <InteractionView interaction={page.interaction} onCorrect={onCorrect} onGameResult={onGameResult} onClue={onClue} onChoose={onChoose} onAnswer={onAnswer} /> : null;

  switch (c) {
    case 'title':
      return (
        <>
          <Painting page={page} className="inset-0">{Moment && <Moment v={v} lesson={lesson} />}</Painting>
          <Scrim to="side" />
          <div className="absolute left-[120px] top-[190px] w-[780px]">
            <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.7, ease }} lang="ar" dir="rtl" className="w-fit font-serif text-[48px] font-bold" style={{ color: P.goldSoft }}>
              {lesson.titleAr}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.9, ease }} className="mt-1">
              <Title size={124} light>{lesson.title}</Title>
            </motion.div>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.8 }} className="mt-8 max-w-[620px] font-sans text-[30px] leading-[1.45]" style={{ color: '#F3E6CC' }}>
              {lesson.goal}
            </motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.3, duration: 0.8 }} className="mt-8 flex items-center gap-3 font-sans text-[22px] font-semibold" style={{ color: P.goldSoft }}>
              <KhatamStar size={20} color={P.gold} />
              {lesson.minutes} minutes, {lesson.pages.length} pages
            </motion.p>
          </div>
        </>
      );

    case 'picturebook':
      // Book spread: the written page on the left, the painting bleeding off the right edge.
      return (
        <>
          <Painting
            page={page}
            className="left-[600px] right-0 top-0 bottom-[100px] rounded-bl-[40px]"
            style={{ maskImage: 'linear-gradient(90deg, transparent 0, #000 120px)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 120px)' }}
          >
            {Moment && <Moment v={v} lesson={lesson} />}
          </Painting>
          <div className={`absolute left-[120px] top-[140px] bottom-[120px] w-[580px] space-y-6 ${COL}`}>
            <Title size={68}>{page.title}</Title>
            {v.evidence ? <Manuscript page={page} size={40} align="start" /> : <Lines lines={page.lines} count={v.lines} size={32} />}
            {interaction}
          </div>
        </>
      );

    case 'portrait':
      return (
        <>
          <Painting page={page} className="right-0 top-0 bottom-[100px] w-[560px] rounded-bl-[40px]" style={{ maskImage: 'linear-gradient(90deg, transparent 0, #000 90px)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0, #000 90px)' }}>
            {found.filter((l) => CLUE_LENSES[l]).map((l) => (
              <ClueLens key={l} name="stranger" img={STRANGER} box={{ w: 560, h: 800 }} lens={CLUE_LENSES[l]} />
            ))}
          </Painting>
          <div className={`absolute left-[120px] right-[620px] top-[140px] bottom-[120px] space-y-5 ${COL}`}>
            <Title size={58}>{page.title}</Title>
            {!v.interaction && <Lines lines={page.lines} count={v.lines} size={30} />}
            {v.evidence && <Manuscript page={page} size={40} align="start" />}
            {interaction}
          </div>
        </>
      );

    case 'manuscript': {
      // Pages whose painting can show the idea get a large annotated print instead of the small arch.
      const Study = STUDIES[page.scene];
      if (Study)
        return (
          <>
            <div className={`absolute left-[120px] top-[140px] bottom-[120px] w-[560px] space-y-5 ${COL}`}>
              <Title size={60}>{page.title}</Title>
              {!v.evidence && <Lines lines={page.lines} count={v.lines} size={32} />}
              {v.evidence && <Manuscript page={page} size={36} align="start" />}
              <Vocab page={page} />
              {interaction}
            </div>
            <Study v={v} label={page.title} />
          </>
        );
      return (
        <>
          <Painting
            page={page}
            className="right-[110px] top-[160px] h-[300px] w-[270px]"
            style={{ borderRadius: '50% 50% 26px 26px / 34% 34% 26px 26px', boxShadow: '0 30px 60px -30px rgba(139,73,53,0.6)', outline: `2px solid ${P.goldSoft}`, outlineOffset: 8 }}
          />
          <div className={`absolute left-[120px] right-[430px] top-[140px] bottom-[120px] space-y-5 ${COL}`}>
            <Title size={60}>{page.title}</Title>
            {!v.evidence && <Lines lines={page.lines} count={v.lines} size={34} />}
            {v.evidence && <Manuscript page={page} size={44} align="start" />}
            <Vocab page={page} />
            {interaction}
          </div>
        </>
      );
    }

    case 'diagram': {
      const pins = PINS[page.scene] || [];
      const labels = pins.map((_, i) => (i < v.items ? page.items?.[i] ?? null : null));
      // Pages whose painting can act out the idea get a scene build instead of labels on a still picture.
      const built = (page.items || []).map((it, i) => (i < v.items ? it : null));
      const Build = BUILDS[page.scene];
      return (
        <>
          <div className={`absolute left-[120px] top-[140px] bottom-[120px] w-[520px] space-y-6 ${COL}`}>
            <Title size={68}>{page.title}</Title>
            <Lines lines={page.lines} count={v.lines} size={32} />
            <Vocab page={page} />
            {interaction}
          </div>
          {Build ? (
            <Build labels={built} label={page.title} />
          ) : page.scene === 'doors' && page.items ? (
            <DoorsLight items={page.items} v={v} label={page.title} arabic={(w) => vocabOf(lesson, w)?.arabic} />
          ) : (
            <Painting page={page} drift={false} className="left-[700px] top-[120px] h-[640px] w-[800px] rounded-[32px]" style={{ boxShadow: '0 40px 80px -40px rgba(139,73,53,0.55)' }}>
              <Pins pins={pins} labels={labels} />
            </Painting>
          )}
        </>
      );
    }

    case 'spotlight':
      return (
        <>
          <div className="band-deep absolute inset-0" />
          <Painting
            page={page}
            drift={false}
            className={`right-0 top-0 bottom-0 w-[640px] ${Moment ? '' : 'opacity-40'}`}
            style={Moment
              ? { maskImage: 'linear-gradient(90deg, transparent, #000 22%)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 22%)' }
              : { maskImage: 'linear-gradient(90deg, transparent, #000 60%)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 60%)' }}
          >
            {Moment && <Moment v={v} lesson={lesson} />}
          </Painting>
          <div className={`absolute left-[120px] right-[460px] top-[150px] bottom-[120px] space-y-6 ${COL}`}>
            <Title size={72} light>{page.title}</Title>
            {!v.evidence && <Lines lines={page.lines} count={v.lines} size={36} light />}
            {v.evidence && <Manuscript page={page} size={44} light align="start" />}
            {interaction}
          </div>
          {/* p8: the answer links back to Ms. Clarke's question on the classroom page. */}
          {page.scene === 'pillars' && answered && <Callback name="classroom" caption="Just like Ms. Clarke" />}
        </>
      );

    case 'luminous':
      return (
        <>
          <Painting page={page} className="inset-0" />
          <Scrim to="all" />
          <div className={`absolute left-[200px] right-[200px] top-[150px] bottom-[120px] text-center ${COL}`}>
            <Title size={88} light>{page.title}</Title>
            <div className="mx-auto mt-6 max-w-[1000px] space-y-6">
              {!v.evidence && <Lines lines={page.lines} count={v.lines} size={36} light />}
              {v.evidence && <Manuscript page={page} size={64} light />}
              {interaction && <div className="text-left">{interaction}</div>}
            </div>
          </div>
        </>
      );

    case 'unveil': {
      const revealed = page.layout === 'evidence';
      // The answer page keeps its title ("It was Jibril!") back until the first step parts the veil, so the guess
      // asked at the end of the page before is not spoiled. On the guess itself the story steps back behind the question.
      const hold = revealed && v.lines === 0;
      return (
        <>
          <Unveil revealed={revealed} step={step} v={v} name={revealed ? page.vocab?.[0] : undefined} teach={threeDoors(lesson)} />
          <div className={`absolute left-[120px] top-[150px] bottom-[120px] w-[640px] space-y-6 ${COL}`}>
            <motion.div initial={false} animate={{ opacity: v.interaction ? 0.45 : 1 }} transition={{ duration: 0.5 }} className="space-y-6">
              {!hold && (
                <motion.div initial={revealed ? { opacity: 0, y: 16 } : false} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: revealed ? 1.2 : 0, ease }}>
                  <Title size={revealed ? 96 : 64} light>{page.title}</Title>
                </motion.div>
              )}
              {!v.evidence && <Lines lines={page.lines} count={v.lines} size={34} light />}
              {v.evidence && <Manuscript page={page} size={44} light align="start" />}
            </motion.div>
            {interaction}
          </div>
        </>
      );
    }

    case 'arena':
      return (
        <div className="absolute left-[120px] right-[110px] top-[140px] bottom-[120px] slide-scroll space-y-4 overflow-y-auto pr-4">
          <Title size={52}>{page.title}</Title>
          {interaction}
        </div>
      );

    case 'journal':
      return (
        <>
          {page.scene === 'backpack' ? (
            <>
              <PackZad v={v} label={page.title} chosen={chosen} word={vocabOf(lesson, 'zad')} doors={threeDoors(lesson)} />
              {Packed && <div className="pointer-events-none absolute left-[-5px] top-[110px] h-[690px] w-[690px]"><Packed v={v} /></div>}
            </>
          ) : (
            <Painting page={page} className="left-0 top-[110px] bottom-[100px] w-[680px] rounded-r-[40px]" style={{ maskImage: 'linear-gradient(270deg, transparent 0, #000 140px)', WebkitMaskImage: 'linear-gradient(270deg, transparent 0, #000 140px)' }} />
          )}
          <div className={`absolute left-[760px] right-[110px] top-[140px] bottom-[120px] space-y-6 ${COL}`}>
            <Title size={72}>{page.title}</Title>
            {!v.interaction && <Lines lines={page.lines} count={v.lines} size={30} />}
            <Vocab page={page} />
            {interaction}
          </div>
        </>
      );

    case 'cliffhanger':
      // The painting keeps the left two thirds, so the people in it stay clear of the text on the right.
      return (
        <>
          <div className="band-deep absolute inset-0" />
          <Painting page={page} className="left-0 top-0 bottom-0 w-[1040px]" style={{ maskImage: 'linear-gradient(270deg, transparent 0, #000 260px)', WebkitMaskImage: 'linear-gradient(270deg, transparent 0, #000 260px)' }}>
            {Moment && <Moment v={v} lesson={lesson} />}
          </Painting>
          <Scrim to="sideEnd" />
          <div className={`absolute right-[110px] top-[200px] bottom-[120px] w-[720px] space-y-6 ${COL}`}>
            <motion.span initial={{ opacity: 0, letterSpacing: '0.3em' }} animate={{ opacity: 1, letterSpacing: '0.01em' }} transition={{ duration: 1.2, ease }} className="block font-serif text-[34px] italic" style={{ color: P.goldSoft }}>
              Next time on Zad Essentials…
            </motion.span>
            <Title size={92} light>{page.title}</Title>
            <Lines lines={page.lines} count={v.lines} size={34} light />
            {interaction}
          </div>
        </>
      );
  }
}

/* ---------- interactions (sized for the canvas) ---------- */

function InteractionView({ interaction, onCorrect, onGameResult, onClue, onChoose, onAnswer }: { interaction: Interaction; onCorrect: () => void; onGameResult: (r: GameResult) => void; onClue?: (label: string) => void; onChoose?: (option: string) => void; onAnswer?: () => void }) {
  switch (interaction.kind) {
    case 'ask':
      return <Ask prompt={interaction.prompt} reveal={interaction.reveal} onAnswer={onAnswer} />;
    case 'clues':
      return <Clues interaction={interaction} onCorrect={onCorrect} onClue={onClue} />;
    case 'choose':
      return <Choose interaction={interaction} onChoose={onChoose} />;
    case 'sort':
      return <SortGame interaction={interaction} onCorrect={onCorrect} onResult={onGameResult} />;
  }
}

/** The question seal: the brand's khatam star with a glyph in it, stamped on to every question and game card. */
function Seal({ glyph, color = P.crimson, size = 64 }: { glyph: string; color?: string; size?: number }) {
  return (
    <motion.span
      aria-hidden="true"
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      initial={{ scale: 0, rotate: -45 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 18 }}
    >
      <svg viewBox="0 0 40 40" className="absolute inset-0 h-full w-full">
        <rect x="8" y="8" width="24" height="24" fill={color} />
        <rect x="8" y="8" width="24" height="24" fill={color} transform="rotate(45 20 20)" />
      </svg>
      <span className="relative font-serif font-bold text-white" style={{ fontSize: size * 0.42 }}>{glyph}</span>
    </motion.span>
  );
}

/** A question to think about: the seal, the question, a pause, then the answer unfolds under a gold rule. */
function Ask({ prompt, reveal, onAnswer }: { prompt: string; reveal?: string; onAnswer?: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div {...build} className="relative rounded-[30px] bg-[#FFFDF7] px-8 pb-7 pt-6 shadow-[0_24px_50px_-30px_rgba(91,58,30,0.75)] ring-1 ring-[#E3D6B8]">
      <div className="flex items-start gap-5">
        <Seal glyph="?" color={P.teal} />
        <div className="min-w-0 flex-1">
          <span className="font-sans text-[18px] font-bold uppercase tracking-[0.18em]" style={{ color: P.teal }}>Think first</span>
          <p className="mt-1 font-sans text-[30px] font-bold leading-snug" style={{ color: P.ink }}>{prompt}</p>
        </div>
      </div>
      {reveal && (
        <AnimatePresence initial={false} mode="wait">
          {open ? (
            <motion.div key="a" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.5, ease }} className="overflow-hidden">
              <motion.span className="mt-5 block h-[2px] origin-left" style={{ background: P.gold }} initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.6, ease }} />
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5, ease }} className="mt-4 ps-[84px] font-sans text-[28px] font-semibold leading-snug" style={{ color: P.copper }}>
                {reveal}
              </motion.p>
            </motion.div>
          ) : (
            <motion.button
              key="b"
              type="button"
              whileTap={{ scale: 0.96 }}
              onClick={() => { setOpen(true); play('chime'); onAnswer?.(); }}
              className="ms-[84px] mt-5 rounded-full px-7 py-2.5 font-sans text-[22px] font-bold shadow-[0_10px_20px_-12px_rgba(139,73,53,0.8)]"
              style={{ background: P.gold, color: P.ink }}
            >
              Show the answer
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}

const LETTERS = 'ABCDEF';

/** An answer card: a letter badge, the text, and a mark that stamps on when it is picked. */
function OptionCard({ letter, label, state, onPick }: { letter: string; label: string; state: 'idle' | 'picked' | 'right' | 'wrong'; onPick: () => void }) {
  const tone = state === 'right' ? { border: P.teal, bg: '#E3F3F2' } : state === 'picked' ? { border: P.gold, bg: '#FCEFD2' } : state === 'wrong' ? { border: '#E7CFCB', bg: '#F7F1EC' } : { border: '#E3D6B8', bg: '#FFFDF7' };
  const plain = state === 'idle' || state === 'wrong';
  return (
    <motion.button
      type="button"
      onClick={onPick}
      aria-pressed={state !== 'idle'}
      whileHover={state === 'idle' ? { y: -3 } : undefined}
      whileTap={{ scale: 0.97 }}
      animate={state === 'wrong' ? { x: [0, -8, 8, -4, 0], opacity: 0.6 } : { opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="relative flex items-center gap-4 rounded-[22px] border-[3px] px-5 py-3.5 text-left font-sans text-[23px] font-bold shadow-[0_12px_24px_-20px_rgba(91,58,30,0.7)]"
      style={{ borderColor: tone.border, background: tone.bg, color: P.ink }}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-sans text-[20px] font-bold" style={{ background: plain ? '#F1E7D3' : tone.border, color: plain ? P.inkSoft : '#fff' }}>
        {state === 'right' ? '✓' : state === 'picked' ? '★' : letter}
      </span>
      <span className="leading-snug">{label}</span>
    </motion.button>
  );
}

function Clues({ interaction, onCorrect, onClue }: { interaction: Extract<Interaction, { kind: 'clues' }>; onCorrect: () => void; onClue?: (label: string) => void }) {
  const [picked, setPicked] = useState<number[]>([]);
  const needed = interaction.clues.filter((c) => c.correct).length;
  const found = picked.filter((i) => interaction.clues[i].correct).length;
  const pick = (i: number) => {
    if (picked.includes(i)) return;
    const right = interaction.clues[i].correct;
    const next = [...picked, i];
    setPicked(next);
    if (right) onClue?.(interaction.clues[i].label);
    if (right && next.filter((j) => interaction.clues[j].correct).length === needed) onCorrect();
    else play(right ? 'correct' : 'oops');
  };
  return (
    <motion.div {...build} className="space-y-4">
      <div className="flex items-center gap-4">
        <Seal glyph="?" color={P.copper} size={56} />
        <p className="font-sans text-[26px] font-bold leading-snug">{interaction.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {interaction.clues.map((clue, i) => (
          <OptionCard key={clue.label} letter={LETTERS[i]} label={clue.label} state={picked.includes(i) ? (clue.correct ? 'right' : 'wrong') : 'idle'} onPick={() => pick(i)} />
        ))}
      </div>
      <div className="flex items-center gap-3" aria-live="polite">
        {Array.from({ length: needed }).map((_, i) => (
          <motion.span key={i} className="h-4 w-4 rounded-full border-[3px]" animate={{ backgroundColor: i < found ? P.teal : 'rgba(255,255,255,0)', scale: i < found ? [1, 1.4, 1] : 1 }} style={{ borderColor: P.teal }} />
        ))}
        <span className="font-sans text-[22px] font-bold" style={{ color: found === needed ? P.teal : P.inkSoft }}>
          {found === needed ? 'You found both clues. Great detective work!' : `Clues found: ${found} of ${needed}`}
        </span>
      </div>
    </motion.div>
  );
}

function Choose({ interaction, onChoose }: { interaction: Extract<Interaction, { kind: 'choose' }>; onChoose?: (option: string) => void }) {
  const [choice, setChoice] = useState<number | null>(null);
  return (
    <motion.div {...build} className="space-y-4">
      <div className="flex items-center gap-4">
        <Seal glyph="★" color={P.gold} size={56} />
        <p className="font-sans text-[28px] font-bold leading-snug">{interaction.prompt}</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {interaction.options.map((o, i) => (
          <OptionCard key={o} letter={LETTERS[i]} label={o} state={choice === i ? 'picked' : 'idle'} onPick={() => { setChoice(i); play('pop'); onChoose?.(o); }} />
        ))}
      </div>
    </motion.div>
  );
}

const DOOR_COLORS: Record<number, string> = { 0: P.teal, 1: P.crimson, 2: P.gold };

/** The game checkpoint. One card at a time comes up from the deck; the child drags it to a door, or taps the door.
 *  The right door takes it in and glows; the wrong door shakes and the card stays to try again. The teacher's report
 *  counts the first try of each card, so trying again never hides what needs reinforcing. */
function SortGame({ interaction, onCorrect, onResult }: { interaction: Extract<Interaction, { kind: 'sort' }>; onCorrect: () => void; onResult: (r: GameResult) => void }) {
  const reduce = useReducedMotion();
  const cards = interaction.cards;
  const [first, setFirst] = useState<Record<number, string>>({});
  const [sorted, setSorted] = useState<number[]>([]);
  const [miss, setMiss] = useState<{ bin: string; n: number } | null>(null);
  const [hit, setHit] = useState<string | null>(null);
  const [scope, animate] = useAnimate();
  const current = cards.findIndex((_, i) => !sorted.includes(i));
  const done = current === -1;

  const drop = (bin: string) => {
    if (done) return;
    const nextFirst = first[current] === undefined ? { ...first, [current]: bin } : first;
    setFirst(nextFirst);
    if (cards[current].bin !== bin) {
      play('oops');
      setMiss((m) => ({ bin, n: (m?.n ?? 0) + 1 }));
      if (!reduce) {
        animate(`[data-bin="${bin}"]`, { x: [0, -7, 7, -3, 0] }, { duration: 0.4 });
        animate('[data-card]', { x: [0, -12, 12, -5, 0] }, { duration: 0.4 });
      }
      return;
    }
    setMiss(null);
    setHit(bin);
    window.setTimeout(() => setHit((h) => (h === bin ? null : h)), 700);
    if (!reduce) animate(`[data-bin="${bin}"]`, { scale: [1, 1.05, 1] }, { duration: 0.5 });
    const nextSorted = [...sorted, current];
    setSorted(nextSorted);
    if (nextSorted.length === cards.length) {
      onResult(scoreSort(interaction, nextFirst));
      onCorrect();
    } else play('correct');
  };
  const restart = () => { setFirst({}); setSorted([]); setMiss(null); setHit(null); };
  const firstRight = Object.entries(first).filter(([i, b]) => cards[Number(i)].bin === b).length;

  return (
    <div ref={scope} className="space-y-5">
      <div className="flex items-center gap-4">
        <Seal glyph="✦" color={P.crimson} size={56} />
        <p className="font-sans text-[28px] font-bold leading-snug">{interaction.prompt}</p>
        <span className="ms-auto flex shrink-0 gap-1.5" aria-label={`${sorted.length} of ${cards.length} sorted`}>
          {cards.map((_, i) => (
            <span key={i} className="h-3 w-3 rounded-full transition-colors duration-300" style={{ background: sorted.includes(i) ? P.teal : i === current ? P.gold : '#E3D6B8' }} />
          ))}
        </span>
      </div>

      <div className="relative flex h-[96px] items-center justify-center">
        {/* The deck: the cards still to come peek out behind the one in play. */}
        {!done && cards.length - sorted.length > 1 && (
          <span className="absolute h-[76px] w-[520px] translate-x-2 translate-y-2 rotate-[1.5deg] rounded-[20px] border-[3px] border-[#E3D6B8] bg-[#F6EEDD]" aria-hidden="true" />
        )}
        <AnimatePresence mode="popLayout">
          {done ? (
            <motion.p key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease }} className="font-serif text-[40px] font-bold" style={{ color: P.teal }} aria-live="polite">
              All sorted! {firstRight} of {cards.length} on the first try.
            </motion.p>
          ) : (
            <motion.button
              key={current}
              data-card
              type="button"
              drag={!reduce}
              dragSnapToOrigin
              dragElastic={0.6}
              whileDrag={{ scale: 1.06, rotate: -2, zIndex: 10 }}
              onDragEnd={(e) => {
                const pt = e as PointerEvent;
                const bin = document.elementsFromPoint(pt.clientX, pt.clientY).map((el) => el.closest('[data-bin]')).find(Boolean) as HTMLElement | undefined;
                if (bin?.dataset.bin) drop(bin.dataset.bin);
              }}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 40, rotate: 4 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 160, scale: 0.5, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.45, ease }}
              className="relative z-[1] w-[520px] cursor-grab touch-none rounded-[20px] border-[3px] bg-[#FFFDF7] px-6 py-4 text-center font-sans text-[28px] font-bold active:cursor-grabbing"
              style={{ borderColor: P.gold, color: P.ink, boxShadow: '0 16px 30px -22px rgba(91,58,30,0.7)' }}
              aria-label={`Card: ${cards[current].label}. Drag it to a door, or tap a door.`}
            >
              {cards[current].label}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      <p className="h-7 text-center font-sans text-[21px] font-bold" style={{ color: miss ? P.crimson : P.inkSoft }} aria-live="polite">
        {done ? '' : miss ? 'Not that door. Look again and try another one.' : 'Drag the card to its door, or tap the door.'}
      </p>

      <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${interaction.bins.length}, minmax(0, 1fr))` }}>
        {interaction.bins.map((bin, bi) => {
          const color = DOOR_COLORS[bi] ?? P.teal;
          const inside = sorted.filter((i) => cards[i].bin === bin.id);
          const glow = hit === bin.id;
          return (
            <button
              key={bin.id}
              data-bin={bin.id}
              type="button"
              onClick={() => drop(bin.id)}
              disabled={done}
              aria-label={`${bin.label}: ${bin.hint}`}
              className="relative flex min-h-[250px] flex-col items-center gap-2 overflow-hidden px-4 pb-4 pt-12 text-center enabled:cursor-pointer"
              style={{ background: color, borderRadius: '50% 50% 24px 24px / 110px 110px 24px 24px', boxShadow: `inset 0 0 0 5px rgba(255,255,255,0.22)${glow ? `, 0 0 0 6px ${P.goldSoft}, 0 0 40px ${P.goldSoft}` : ', 0 18px 30px -22px rgba(30,20,16,0.7)'}`, transition: 'box-shadow 0.6s ease' }}
            >
              <span className="font-serif text-[40px] font-bold text-white">{bin.label}</span>
              <span className="font-sans text-[20px] font-bold text-white/85">{bin.hint}</span>
              <span className="mt-1 flex w-full flex-col gap-1.5">
                {inside.map((i) => (
                  <motion.span key={i} initial={{ opacity: 0, y: -30, scale: 0.7 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }} className="w-full rounded-[12px] bg-[#FFFDF7] px-3 py-1.5 font-sans text-[18px] font-bold" style={{ color: P.ink }}>
                    {cards[i].label}
                  </motion.span>
                ))}
              </span>
            </button>
          );
        })}
      </div>
      {Object.keys(first).length > 0 && (
        <button type="button" onClick={restart} className="rounded-full border-[3px] px-7 py-2.5 font-sans text-[22px] font-bold" style={{ borderColor: '#E3D6B8' }}>
          {done ? 'Play again' : 'Start again'}
        </button>
      )}
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
