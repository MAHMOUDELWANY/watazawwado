import React from 'react';
import { ClipContext } from '../Say';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Lesson, LessonPage } from '../../types';
import { KineticTitle, Khatam, ease, CRIMSON, GOLD, TEAL } from '../cinema/Cinema';

/**
 * Adults "motion stage" (owner, 2026-10-24, after the cinema pass): no photo drifting for nothing. Each page is a designed
 * stage, light paper or warm night, where one motion graphic explains the idea step by step, after the owner's references:
 * one hero object that travels and becomes the diagram, lines that draw, blocks that rise, a camera that only moves to
 * reach something. The text column on the left carries the words: the hadith in English first (Arabic beneath it), then
 * every explanation line stays on screen, the newest one strongest.
 */

export type Tone = 'light' | 'dark';
export type GraphicProps = { lines: number; items: number; interaction: boolean; labels: string[]; tone: Tone };
/** keepOnAsk: the graphic draws its own answer to the question, so the stage does not dim it. */
export type StageDef = { tone: Tone; Graphic: React.ComponentType<GraphicProps>; marks?: string[]; keepOnAsk?: boolean };

export const PAPER = '#F6F1E8';
export const NIGHT = '#120C09';
export const INK_TEXT = '#1F1612';
export const ink = (tone: Tone) => (tone === 'light' ? INK_TEXT : PAPER);
export const soft = (tone: Tone) => (tone === 'light' ? 'rgba(31,22,18,0.55)' : 'rgba(246,241,232,0.6)');

type Seen = { lines: number; items: number; evidence: boolean; interaction: boolean };

export function StagePage({ page, v, lesson, stage, interaction, cover = false, next = false }: {
  page: LessonPage; v: Seen; lesson: Lesson; stage: StageDef; interaction: React.ReactNode; cover?: boolean; next?: boolean;
}) {
  const { tone, Graphic } = stage;
  // Each version keeps the system and its own voice: Kids brighter and bigger, Teens bolder and quicker.
  const look = lesson.version;
  const kids = look === 'kids';
  const quick = look === 'teens' ? 0.75 : 1;
  const started = !cover && (v.evidence || v.lines > 0 || v.items > 0 || v.interaction);
  // The text is the hero until the explanation starts, then it docks under the title. On a scene-setting page
  // (contextFirst) the lines come first and the text stays the hero until the question.
  const ctx = Boolean(page.contextFirst);
  const docked = ctx ? v.interaction : v.lines > 0 || v.items > 0 || v.interaction;
  const hero = v.evidence && !docked;
  const evidence = page.evidence;
  const showLines = v.lines > 0 && !(ctx && hero);
  const keep = docked && evidence ? 2 : 4;
  const first = Math.max(0, v.lines - 1 - keep);
  const big = page.interaction?.kind === 'clues' || page.interaction?.kind === 'choose';
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: tone === 'light' ? PAPER : '#2A0E10' }}>
      <Backdrop tone={tone} look={look} />

      {/* The graphic steps back while the text is the hero, and while the learner answers. */}
      {/* When a question arrives the graphic steps up and back (from the top right) so the question strip sits under it,
          never on top of it; the bigger answer cards (clues, choices) also dim it. */}
      <motion.div className="absolute inset-0" style={{ transformOrigin: '1500px 130px' }} initial={false}
        animate={{ opacity: hero ? 0.1 : v.interaction && big ? 0.3 : 1, scale: v.interaction && big ? 0.62 : 1 }} transition={{ duration: 0.8, ease }}>
        <ClipContext.Provider value={{ subject: lesson.subject, lesson: lesson.number, clips: page.say ?? [] }}>
          <Graphic lines={v.lines} items={v.items} interaction={v.interaction} labels={page.items ?? []} tone={tone} />
        </ClipContext.Provider>
      </motion.div>

      {/* Title: big on the opening beat, then it steps back to the corner (the cover keeps it). */}
      <motion.div className="absolute origin-top-left" style={{ left: 110, top: cover ? 170 : 96, width: cover ? 760 : 1100 }} initial={false}
        animate={{ scale: started ? 0.46 : 1, y: started || cover ? 0 : 200 }} transition={{ duration: 0.7 * quick, ease }}>
        {(cover || next) && (
          <p className="m-0 mb-4 font-sans font-bold uppercase" style={{ fontSize: 20, letterSpacing: '0.2em', color: tone === 'light' ? CRIMSON : GOLD }}>
            {cover ? lesson.part ?? `Lesson ${lesson.number}` : 'Next time on Zad Essentials'}
          </p>
        )}
        {cover && <p lang="ar" dir="rtl" className="m-0 mb-2 w-fit font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: 46, color: tone === 'light' ? '#8B1A1E' : GOLD }}>{lesson.titleAr}</p>}
        <KineticTitle key={page.title} text={cover ? lesson.title : page.title} size={cover ? (lesson.title.length > 22 ? 90 : 124) : 112} color={ink(tone)} />
        {cover && (
          <motion.p className="m-0 mt-8 font-sans" style={{ fontSize: 27, lineHeight: 1.45, color: soft(tone), maxWidth: 640 }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1, duration: 0.8, ease }}>
            {lesson.goal}
          </motion.p>
        )}
      </motion.div>
      <motion.div className="absolute" style={{ right: 300, top: 72 }} initial={{ x: 200, rotate: -120, scale: 0.3, opacity: 0 }} animate={{ x: 0, rotate: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', bounce: 0.2, duration: 1.2, delay: 0.2 }}>
        <Khatam size={30} glow={tone === 'dark'} />
      </motion.div>

      {evidence && v.evidence && <Quote arabic={evidence.arabic} meaning={evidence.meaning} reference={evidence.reference} docked={docked} tone={tone} marks={stage.marks} />}

      {/* The left column carries the words: the lines (newest strongest), and under them the question when it comes, so
          the question fills the empty column instead of covering the graphic. Bigger answer cards sit on the right. */}
      <div className="absolute flex flex-col gap-4" style={{ left: 110, bottom: 120, width: 560 }}>
        <AnimatePresence>
          {showLines && page.lines.slice(v.interaction && !big ? Math.max(0, v.lines - 2) : first, v.lines).map((l, j, arr) => {
            const i = v.lines - arr.length + j;
            const now = i === v.lines - 1 && !v.interaction;
            return (
              <motion.p key={i} layout="position" className="m-0 font-sans"
                initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }} animate={{ opacity: now ? 1 : 0.55, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, transition: { duration: 0.25 } }} transition={{ duration: 0.6 * quick, ease }}
                style={{ fontSize: now ? (kids ? 34 : 30) : v.interaction ? 18 : kids ? 22 : 20, lineHeight: 1.3, fontWeight: now ? (look === 'teens' ? 750 : 650) : 500, color: ink(tone), transition: 'font-size 0.5s cubic-bezier(0.22,1,0.36,1)' }}>
                {l}
              </motion.p>
            );
          })}
        </AnimatePresence>
        {interaction && !big && <motion.div layout="position">{interaction}</motion.div>}
      </div>
      <AnimatePresence>
        {interaction && big && (
          <motion.div className="absolute" style={{ right: 110, bottom: 104, width: 760 }} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.6, ease }}>
            {interaction}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** The khatam star tiled as a lattice (the site's geometric motif): two squares at 45° per tile, in outline. */
const KHATAM_TILE = (stroke: string) =>
  `url("data:image/svg+xml,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'><g fill='none' stroke='${stroke}' stroke-width='1.2'><rect x='35' y='35' width='50' height='50'/><rect x='35' y='35' width='50' height='50' transform='rotate(45 60 60)'/><circle cx='60' cy='60' r='9'/><path d='M0 0 L25 25 M120 0 L95 25 M0 120 L25 95 M120 120 L95 95'/></g></svg>`)}")`;

/** The stage itself: paper with a warm glow rising from the floor; or, for the unseen and the endings, a deep night in
 *  the brand's own colours (crimson to teal, never flat black) with the khatam lattice and two brand lights. */
export function Backdrop({ tone, look = 'adults' }: { tone: Tone; look?: 'kids' | 'teens' | 'adults' }) {
  if (look === 'kids' && tone === 'light') return <KidsPaper />;
  if (look === 'teens' && tone === 'light') return <TeensPaper />;
  return tone === 'light' ? (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(70% 55% at 70% 108%, rgba(229,169,60,0.38), transparent 70%), radial-gradient(40% 40% at 96% 0%, rgba(197,31,36,0.10), transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: KHATAM_TILE('rgba(139,73,53,0.07)'), backgroundSize: '120px 120px' }} />
    </>
  ) : (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(155deg, #4A1216 0%, #2A0E10 38%, #12232A 78%, #0B3A42 100%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: KHATAM_TILE('rgba(229,169,60,0.13)'), backgroundSize: '120px 120px', maskImage: 'radial-gradient(120% 100% at 70% 40%, #000 30%, rgba(0,0,0,0.35) 100%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(55% 55% at 78% 105%, rgba(229,169,60,0.30), transparent 70%), radial-gradient(40% 45% at 100% 0%, rgba(15,163,184,0.28), transparent 70%), radial-gradient(45% 50% at 0% 100%, rgba(197,31,36,0.35), transparent 70%)' }} />
    </>
  );
}

/** Kids: a sunny sheet, a sky-teal morning in the top corner, warm sand at the foot, and the lattice in bright stars. */
function KidsPaper() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFF7E6 0%, #FBEFD9 100%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(48% 55% at 92% -6%, rgba(15,163,184,0.28), transparent 70%), radial-gradient(70% 50% at 70% 112%, rgba(229,169,60,0.45), transparent 70%), radial-gradient(30% 30% at 0% 100%, rgba(197,31,36,0.12), transparent 70%)' }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: KHATAM_TILE('rgba(229,169,60,0.22)'), backgroundSize: '96px 96px', maskImage: 'radial-gradient(90% 80% at 75% 50%, #000 20%, transparent 80%)' }} />
    </>
  );
}

/** Teens: paper with a bold ribbon slash across the graphic side and a firmer lattice. */
function TeensPaper() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0" style={{ background: '#F4EEE4' }} />
      <div className="pointer-events-none absolute" style={{ left: 640, top: -200, width: 260, height: 1400, transform: 'rotate(24deg)', background: `linear-gradient(180deg, ${CRIMSON}, ${GOLD} 55%, ${TEAL})`, opacity: 0.09 }} />
      <div className="pointer-events-none absolute inset-0" style={{ backgroundImage: KHATAM_TILE('rgba(31,22,18,0.08)'), backgroundSize: '120px 120px' }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: 'radial-gradient(60% 50% at 80% 110%, rgba(197,31,36,0.16), transparent 70%)' }} />
    </>
  );
}

/** The hadith or ayah: English as the hero, the Arabic beneath it; then it docks under the title as a compact card. */
function Quote({ arabic, meaning, reference, docked, tone, marks = [] }: { arabic: string; meaning: string; reference: string; docked: boolean; tone: Tone; marks?: string[] }) {
  const longText = meaning.length > 220;
  return (
    <motion.figure layout transition={{ duration: 0.9, ease }} className="absolute m-0"
      initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.8, delay: 0.4, ease } }}
      style={docked ? { left: 110, top: 236, width: 540 } : { left: 200, top: 250, width: 1200 }}>
      <motion.div layout="position" className="mb-4 h-[3px] w-24 rounded-full" style={{ background: `linear-gradient(90deg, ${CRIMSON}, ${GOLD}, ${TEAL})` }} />
      <motion.blockquote layout="position" className="m-0 font-serif" style={{ fontSize: docked ? (longText ? 17 : 21) : longText ? 34 : 46, lineHeight: 1.32, color: ink(tone), transition: 'font-size 0.9s cubic-bezier(0.22,1,0.36,1)' }}>
        “<Marked text={meaning} marks={marks} on={docked} />”
      </motion.blockquote>
      {(!docked || arabic.length < 110) && (
        <motion.p layout="position" lang="ar" dir="rtl" className="m-0 mt-4 font-bold" style={{ fontFamily: 'var(--font-display-ar)', fontSize: docked ? 17 : longText ? 24 : 30, lineHeight: 1.7, color: tone === 'light' ? '#8B1A1E' : '#E9B9A0', opacity: docked ? 0.8 : 1 }}>
          {arabic}
        </motion.p>
      )}
      <motion.span layout="position" className="mt-2 block font-sans font-bold" style={{ fontSize: docked ? 13 : 17, color: soft(tone) }}>{reference}</motion.span>
    </motion.figure>
  );
}

/** Underlines the words the graphic is about, once the explanation starts. */
function Marked({ text, marks, on }: { text: string; marks: string[]; on: boolean }) {
  if (!marks.length) return <>{text}</>;
  const re = new RegExp(`\\b(${marks.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`, 'gi');
  return (
    <>
      {text.split(re).map((part, i) =>
        marks.some((m) => m.toLowerCase() === part.toLowerCase()) ? (
          <span key={i} className="relative inline-block font-semibold" style={{ color: on ? CRIMSON : 'inherit', transition: 'color 0.6s' }}>
            {part}
            <motion.span className="absolute bottom-0 left-0 h-[2px] w-full origin-left rounded-full" style={{ background: CRIMSON }} initial={false} animate={{ scaleX: on ? 1 : 0 }} transition={{ duration: 0.7, delay: 0.5, ease }} />
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

/** The hero object of the references, in our colours: a crimson-to-gold sphere with a soft glow. */
export function Orb({ size = 38, style, glow = 1 }: { size?: number; style?: React.CSSProperties; glow?: number }) {
  return (
    <span className="absolute block rounded-full" style={{
      width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
      background: `radial-gradient(circle at 35% 30%, #FFE3A3 0%, ${GOLD} 28%, ${CRIMSON} 78%)`,
      boxShadow: `0 0 ${size * 0.8 * glow}px ${size * 0.25 * glow}px rgba(229,120,60,0.55), inset -4px -6px 10px rgba(120,10,12,0.35)`, ...style,
    }} />
  );
}

/** A small card for a clue or a fact: label, the fact, and what it means. */
export function FactCard({ tag, fact, means, tone, style }: { tag: string; fact: string; means: string; tone: Tone; style?: React.CSSProperties }) {
  return (
    <div className="absolute rounded-[22px]" style={{ width: 330, padding: '18px 22px', background: tone === 'light' ? '#FFFDF8' : 'rgba(246,241,232,0.95)', boxShadow: '0 30px 60px -30px rgba(60,20,10,0.45), 0 0 0 1px rgba(31,22,18,0.06)', ...style }}>
      <span className="font-sans font-bold uppercase" style={{ fontSize: 12, letterSpacing: '0.16em', color: CRIMSON }}>{tag}</span>
      <p className="m-0 mt-1 font-serif" style={{ fontSize: 25, lineHeight: 1.15, color: INK_TEXT }}>{fact}</p>
      <p className="m-0 mt-2 font-sans font-semibold" style={{ fontSize: 16, color: '#8B4935' }}>→ {means}</p>
    </div>
  );
}

/** Points along a cubic Bézier, for things that travel a drawn route. */
export function bezier(p0: number[], p1: number[], p2: number[], p3: number[], n = 40) {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = i / n, u = 1 - t;
    return {
      x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    };
  });
}

export function useReduce() {
  return Boolean(useReducedMotion());
}
