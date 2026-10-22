import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Play, RotateCcw, SkipForward } from 'lucide-react';
import type { CastMember, Lesson, SeriesOpening } from '../types';
import { P, asset } from './Art';
import { play } from './sfx';

/* ---------- Series opening: "meet the cast" before the first lesson (owner, 2026-10-22; RULES.md §1.10) ----------
   Played like the opening of an anime: a cold open, one hard-cut card per character, the whole cast together, then
   the episode title. Runs on its own on the 1600×900 canvas; Next / click moves on a beat, Skip ends it. Transform and
   opacity only (plus clip-path on the colour panels), so it stays smooth while the lesson's paintings preload. */

const STAR = 'M50 4 L63.4 17.6 L82.5 17.5 L82.4 36.6 L96 50 L82.4 63.4 L82.5 82.5 L63.4 82.4 L50 96 L36.6 82.4 L17.5 82.5 L17.6 63.4 L4 50 L17.6 36.6 L17.5 17.5 L36.6 17.6 Z';
const COLD = 2900;
const CARD = 3700;
const TEAM = 5200;

export function Opening({ lesson, data, ar = false, onDone }: { lesson: Lesson; data: SeriesOpening; ar?: boolean; onDone: () => void }) {
  const reduce = useReducedMotion() ?? false;
  const kids = lesson.version === 'kids';
  const n = data.cast.length;
  const last = n + 2; // 0 cold open · 1..n cast · n+1 together · n+2 title card
  const [beat, setBeat] = useState(0);
  const next = () => setBeat((b) => Math.min(last, b + 1));

  useEffect(() => {
    if (beat >= last) return;
    const t = window.setTimeout(next, beat === 0 ? COLD : beat <= n ? CARD : TEAM);
    return () => window.clearTimeout(t);
  }, [beat, last, n]);

  // The opening owns the arrow keys while it plays; captured before the player's own shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowright' || k === ' ' || k === 'pagedown' || k === 'enter') { e.preventDefault(); e.stopPropagation(); beat >= last ? onDone() : next(); }
      else if (k === 'arrowleft' || k === 'pageup') { e.preventDefault(); e.stopPropagation(); setBeat((b) => Math.max(0, b - 1)); }
      else if (k === 's') { e.stopPropagation(); onDone(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [beat, last, onDone]);

  const [series, version] = lesson.subjectTitle.split(' · ');

  return (
    <motion.div
      dir="ltr" lang="en"
      className="absolute inset-0 z-50 cursor-pointer overflow-hidden bg-[#061317] select-none"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.5 } }}
      onClick={() => (beat >= last ? undefined : next())}
      role="region" aria-label={`${series} opening: meet the characters`}
    >
      <AnimatePresence mode="popLayout">
        {beat === 0 && <ColdOpen key="cold" series={series} version={version} kids={kids} reduce={reduce} />}
        {beat >= 1 && beat <= n && (
          <CastCard key={data.cast[beat - 1].id} m={data.cast[beat - 1]} i={beat - 1} total={n} kids={kids} reduce={reduce} />
        )}
        {beat === n + 1 && <Together key="team" data={data} series={series} kids={kids} reduce={reduce} />}
        {beat === last && <TitleCard key="title" lesson={lesson} data={data} series={series} reduce={reduce} ar={ar} onStart={onDone} onReplay={() => setBeat(0)} />}
      </AnimatePresence>

      {/* Progress ticks and Skip: the teacher always knows how long is left and can leave at any moment. */}
      {beat < last && (
        <div className="pointer-events-none absolute inset-x-0 bottom-[34px] z-30 flex items-center justify-center gap-2">
          {Array.from({ length: last }, (_, i) => (
            <span key={i} className="h-[5px] rounded-full transition-[width,background-color] duration-300" style={{ width: i === beat ? 54 : 18, background: i <= beat ? P.goldSoft : 'rgba(255,255,255,0.25)' }} />
          ))}
        </div>
      )}
      {beat < last && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDone(); }}
          className="absolute right-[44px] top-[40px] z-30 inline-flex items-center gap-3 rounded-full bg-white/10 px-7 py-3.5 font-sans text-[24px] font-bold text-white ring-1 ring-white/25 backdrop-blur-md transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]"
        >
          {ar ? 'تخطّي' : 'Skip'} <SkipForward className="h-6 w-6 rtl:rotate-180" />
        </button>
      )}
    </motion.div>
  );
}

/** Cold open: a line of light cuts the dark, folds into the star, the star shockwaves and the series title slams in. */
function ColdOpen({ series, version, kids, reduce }: { series: string; version: string; kids: boolean; reduce: boolean }) {
  useEffect(() => { play('whoosh', 0.1); play('reveal', 1.1); play('thud', 1.75); }, []);
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.25 } }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, #0B4C57 0%, #05262D 45%, #020B0D 100%)' }} />
      <Halftone opacity={0.07} />
      {/* the cut of light */}
      <motion.div className="absolute left-0 top-1/2 h-[3px] w-full origin-left" style={{ background: `linear-gradient(90deg, transparent, ${P.goldSoft}, #fff, ${P.goldSoft}, transparent)`, boxShadow: '0 0 30px 6px rgba(246,213,142,0.6)' }}
        initial={{ transform: 'scaleX(0)', opacity: 1 }} animate={{ transform: 'scaleX(1)', opacity: [1, 1, 0] }} transition={{ duration: 1.1, ease: [0.7, 0, 0.2, 1], opacity: { times: [0, 0.75, 1], duration: 1.2 } }} />
      {/* shockwave rings */}
      {[0, 0.18, 0.36].map((d) => (
        <motion.div key={d} className="absolute left-1/2 top-[40%] h-[260px] w-[260px] rounded-full border-[3px]" style={{ borderColor: P.goldSoft, marginLeft: -130, marginTop: -130 }}
          initial={{ transform: 'scale(0.2)', opacity: 0 }} animate={{ transform: 'scale(4.2)', opacity: [0, 0.9, 0] }} transition={{ delay: 1.1 + d, duration: 1.2, ease: 'easeOut' }} />
      ))}
      <motion.svg viewBox="0 0 100 100" className="absolute left-1/2 top-[40%] h-[230px] w-[230px] -translate-x-1/2 -translate-y-1/2" aria-hidden="true"
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(0.2) rotate(-180deg)' }} animate={{ opacity: 1, transform: 'scale(1) rotate(0deg)' }} transition={{ delay: 0.9, type: 'spring', stiffness: 120, damping: 13 }}>
        <defs>
          <linearGradient id="op-star" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF1C9" /><stop offset="1" stopColor={P.gold} /></linearGradient>
        </defs>
        <path d={STAR} fill="url(#op-star)" />
        <path d={STAR} fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.2" transform="translate(50 50) scale(0.62) translate(-50 -50)" />
      </motion.svg>
      <div className="absolute inset-x-0 top-[57%] text-center">
        <motion.p lang="ar" dir="rtl" className="font-serif text-[64px] font-bold leading-none" style={{ color: P.goldSoft }}
          initial={{ opacity: 0, transform: 'translateY(20px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ delay: 1.35, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
          أول الزاد
        </motion.p>
        <motion.p className="mt-5 font-serif text-[118px] font-bold uppercase leading-none text-white" style={{ letterSpacing: '0.06em', textShadow: '0 10px 50px rgba(0,0,0,0.6)' }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(1.5)' }} animate={{ opacity: 1, transform: 'scale(1)' }} transition={{ delay: 1.7, type: 'spring', stiffness: 260, damping: 18 }}>
          {series}
        </motion.p>
        <motion.span className="mt-6 inline-block rounded-full px-8 py-2.5 font-sans text-[30px] font-extrabold uppercase tracking-[0.35em] text-white" style={{ background: kids ? '#E58A2B' : P.crimson }}
          initial={{ opacity: 0, transform: 'translateY(16px) scale(0.8)' }} animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }} transition={{ delay: 2.1, type: 'spring', stiffness: 300, damping: 16 }}>
          {version}
        </motion.span>
      </div>
    </motion.div>
  );
}

/** One character: a hard cut to their colour, speed lines, their name huge behind them, then the name plate. */
function CastCard({ m, i, total, kids, reduce }: { m: CastMember; i: number; total: number; kids: boolean; reduce: boolean }) {
  const flip = i % 2 === 1; // characters alternate sides, like the cuts of an opening
  useEffect(() => { play('whoosh'); play('thud', 0.45); }, []);
  const lines = useMemo(() => speedLines(i + 3, kids), [i, kids]);
  const cx = flip ? 470 : 1130;
  const panelIn = flip ? 'polygon(0% 0%, 58% 0%, 46% 100%, 0% 100%)' : 'polygon(42% 0%, 100% 0%, 100% 100%, 54% 100%)';
  const panelFrom = flip ? 'polygon(0% 0%, 0% 0%, 0% 100%, 0% 100%)' : 'polygon(100% 0%, 100% 0%, 100% 100%, 100% 100%)';
  const side = flip ? 1 : -1;

  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.18 } }}>
      <div className="absolute inset-0" style={{ background: `radial-gradient(circle at ${flip ? 75 : 25}% 50%, #12262B 0%, #061317 70%)` }} />
      {/* colour panel slicing in */}
      <motion.div className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${m.color} 0%, ${shade(m.color, -0.35)} 100%)` }}
        initial={{ clipPath: panelFrom }} animate={{ clipPath: panelIn }} transition={{ duration: reduce ? 0 : 0.45, ease: [0.8, 0, 0.2, 1] }} />
      <Halftone opacity={0.14} />
      {/* giant outlined name drifting behind */}
      <motion.p aria-hidden="true" className="absolute top-[18%] whitespace-nowrap font-serif text-[380px] font-bold uppercase leading-none"
        style={{ color: 'transparent', WebkitTextStroke: '3px rgba(255,255,255,0.16)', left: 0 }}
        initial={{ transform: `translateX(${flip ? -300 : 400}px)` }} animate={{ transform: `translateX(${flip ? 100 : -100}px)` }} transition={{ duration: reduce ? 0 : CARD / 1000, ease: 'linear' }}>
        {m.name.replace('Aunt ', '')}
      </motion.p>
      {/* speed lines (rays for the kids' version) */}
      {!reduce && (
        <motion.div className="absolute inset-0" style={{ transformOrigin: `${cx / 16}% 50%` }} aria-hidden="true"
          initial={{ opacity: 0, transform: 'rotate(0deg)' }} animate={{ opacity: [0, 1, 0.55], transform: 'rotate(8deg)' }} transition={{ duration: CARD / 1000, ease: 'linear', opacity: { duration: 1.2, times: [0, 0.2, 1] } }}>
          <svg className="h-full w-full" viewBox="0 0 1600 900">
            {lines.map((l, k) => (
              <line key={k} x1={cx + Math.cos(l.a) * l.r0} y1={450 + Math.sin(l.a) * l.r0} x2={cx + Math.cos(l.a) * 1500} y2={450 + Math.sin(l.a) * 1500}
                stroke={kids ? (k % 3 === 0 ? P.goldSoft : '#fff') : '#fff'} strokeOpacity={l.o} strokeWidth={l.w} strokeLinecap="round" />
            ))}
          </svg>
        </motion.div>
      )}
      {/* the character */}
      <motion.img src={asset(m.img)} alt="" draggable={false}
        className="absolute bottom-0 h-[860px] w-[720px] object-contain object-bottom"
        style={{ left: cx - 360, filter: 'drop-shadow(0 30px 40px rgba(0,0,0,0.45))' }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, transform: `translateX(${-side * 340}px) scale(1.12)` }}
        animate={{ opacity: 1, transform: 'translateX(0px) scale(1)' }}
        transition={{ type: 'spring', stiffness: kids ? 170 : 210, damping: kids ? 13 : 20, delay: 0.12 }} />
      {/* white flash on the cut */}
      {!reduce && <motion.div className="pointer-events-none absolute inset-0 bg-white" initial={{ opacity: 0.85 }} animate={{ opacity: 0 }} transition={{ duration: 0.3 }} />}
      {/* name plate */}
      <div className={`absolute top-[150px] w-[640px] ${flip ? 'right-[110px] text-right' : 'left-[110px]'}`}>
        <motion.p className="font-sans text-[26px] font-extrabold tracking-[0.3em] text-white/60"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          {String(i + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </motion.p>
        <motion.p className="mt-2 font-serif text-[150px] font-bold leading-[0.95] text-white" style={{ textShadow: '0 12px 40px rgba(0,0,0,0.45)' }}
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: `translateX(${side * 80}px) skewX(${side * -8}deg)` }}
          animate={{ opacity: 1, transform: 'translateX(0px) skewX(0deg)' }} transition={{ delay: 0.4, type: 'spring', stiffness: 260, damping: 20 }}>
          {m.name}
        </motion.p>
        <motion.div className={`mt-3 flex items-center gap-5 ${flip ? 'justify-end' : ''}`}
          initial={{ opacity: 0, transform: 'translateY(14px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ delay: 0.7, duration: 0.5 }}>
          <span lang="ar" dir="rtl" className="font-serif text-[64px] font-bold leading-none" style={{ color: P.goldSoft }}>{m.nameAr}</span>
          {m.age && <span className="rounded-full bg-white px-5 py-1.5 font-sans text-[26px] font-extrabold" style={{ color: m.color }}>{m.age}</span>}
        </motion.div>
        <motion.p className="mt-8 font-sans text-[38px] font-bold leading-[1.25] text-white [text-wrap:balance]"
          initial={{ clipPath: flip ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0%)' }} transition={{ delay: 1, duration: 0.8, ease: [0.65, 0, 0.35, 1] }}>
          {m.line}
        </motion.p>
        <div className={`mt-7 flex flex-wrap gap-3 ${flip ? 'justify-end' : ''}`}>
          {m.traits.map((t, k) => (
            <motion.span key={t} className="rounded-full border-2 border-white/70 bg-black/20 px-5 py-2 font-sans text-[24px] font-bold text-white backdrop-blur-sm"
              initial={{ opacity: 0, transform: 'scale(0.6)' }} animate={{ opacity: 1, transform: 'scale(1)' }} transition={{ delay: 1.6 + k * 0.14, type: 'spring', stiffness: 400, damping: 18 }}>
              {t}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

/** The whole cast together: they rise one after another into one line-up under a sweep of light. */
function Together({ data, series, kids, reduce }: { data: SeriesOpening; series: string; kids: boolean; reduce: boolean }) {
  useEffect(() => { play('sparkle', 0.3); play('chime', 1.6); }, []);
  // Leads in the middle: 0 and 1 are the two main characters.
  const order = [...data.cast.slice(2).filter((_, k) => k % 2 === 0).reverse(), data.cast[0], data.cast[1], ...data.cast.slice(2).filter((_, k) => k % 2 === 1)];
  const w = 1500 / order.length;
  return (
    <motion.div className="absolute inset-0" exit={{ opacity: 0, transition: { duration: 0.3 } }}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 85%, #1B6E73 0%, #0B3C44 40%, #04161A 100%)' }} />
      <Halftone opacity={0.06} />
      {/* rays behind the line-up */}
      {!reduce && (
        <motion.div className="absolute left-1/2 top-[64%] h-[1800px] w-[1800px]" style={{ marginLeft: -900, marginTop: -900, background: `repeating-conic-gradient(from 0deg, rgba(246,213,142,0.13) 0deg 6deg, transparent 6deg 18deg)`, maskImage: 'radial-gradient(circle, #000 0%, transparent 62%)', WebkitMaskImage: 'radial-gradient(circle, #000 0%, transparent 62%)' }}
          initial={{ opacity: 0, transform: 'rotate(0deg)' }} animate={{ opacity: 1, transform: 'rotate(25deg)' }} transition={{ duration: TEAM / 1000, ease: 'linear', opacity: { duration: 0.8 } }} />
      )}
      <div className="absolute inset-x-0 bottom-[60px] h-[120px]" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(246,213,142,0.45), transparent 70%)' }} />
      {order.map((m, k) => {
        const lead = m.id === data.cast[0].id || m.id === data.cast[1].id;
        return (
          <motion.img key={m.id} src={asset(m.img)} alt={m.name} draggable={false}
            className="absolute bottom-[70px] object-contain object-bottom"
            style={{ left: 50 + k * w - (lead ? 40 : 10), width: w + (lead ? 80 : 20), height: lead ? 520 : 440, zIndex: lead ? 2 : 1, filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.5))' }}
            initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(160px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }}
            transition={{ delay: 0.15 + Math.abs(k - (order.length - 1) / 2) * 0.16, type: 'spring', stiffness: kids ? 150 : 190, damping: kids ? 12 : 18 }} />
        );
      })}
      {/* light sweep across them */}
      {!reduce && (
        <motion.div className="pointer-events-none absolute bottom-0 top-0 w-[260px]" style={{ background: 'linear-gradient(100deg, transparent, rgba(255,255,255,0.28), transparent)', zIndex: 3 }}
          initial={{ transform: 'translateX(-300px) skewX(-15deg)' }} animate={{ transform: 'translateX(1900px) skewX(-15deg)' }} transition={{ delay: 1.5, duration: 1.3, ease: 'easeInOut' }} />
      )}
      <div className="absolute inset-x-0 top-[56px] z-10 text-center">
        <motion.p className="font-sans text-[26px] font-extrabold uppercase tracking-[0.4em]" style={{ color: P.goldSoft }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
          {series}
        </motion.p>
        <motion.p className="mx-auto mt-3 max-w-[1300px] font-serif text-[66px] font-bold leading-[1.05] text-white [text-wrap:balance]" style={{ textShadow: '0 10px 40px rgba(0,0,0,0.5)' }}
          initial={{ opacity: 0, transform: 'translateY(24px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ delay: 1.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          {data.tagline}
        </motion.p>
        <motion.p lang="ar" dir="rtl" className="mt-2 font-serif text-[40px] font-bold" style={{ color: P.goldSoft }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.8, duration: 0.6 }}>
          {data.taglineAr}
        </motion.p>
      </div>
    </motion.div>
  );
}

/** The episode card: what this first lesson is called, and a big Start. */
function TitleCard({ lesson, data, series, reduce, ar, onStart, onReplay }: { lesson: Lesson; data: SeriesOpening; series: string; reduce: boolean; ar: boolean; onStart: () => void; onReplay: () => void }) {
  useEffect(() => { play('reveal'); }, []);
  return (
    <motion.div className="absolute inset-0 cursor-default" exit={{ opacity: 0 }} onClick={(e) => e.stopPropagation()}>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, #0B4C57 0%, #05262D 55%, #020B0D 100%)' }} />
      <Halftone opacity={0.06} />
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-0 opacity-25" aria-hidden="true">
        {data.cast.map((m) => <img key={m.id} src={asset(m.img)} alt="" className="h-[300px] w-[200px] object-contain object-bottom" style={{ filter: 'brightness(0) saturate(0)', opacity: 0.9 }} />)}
      </div>
      <div className="absolute inset-x-0 top-[170px] text-center">
        <motion.p className="font-sans text-[28px] font-extrabold uppercase tracking-[0.45em]" style={{ color: P.goldSoft }}
          initial={{ opacity: 0, transform: 'translateY(10px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ duration: 0.5 }}>
          {series} · Episode {lesson.number}
        </motion.p>
        <motion.p className="mx-auto mt-6 max-w-[1300px] font-serif text-[110px] font-bold leading-[1] text-white [text-wrap:balance]"
          initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'scale(1.15)' }} animate={{ opacity: 1, transform: 'scale(1)' }} transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 20 }}>
          {lesson.title}
        </motion.p>
        <motion.p lang="ar" dir="rtl" className="mt-5 font-serif text-[56px] font-bold" style={{ color: P.goldSoft }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {lesson.titleAr}
        </motion.p>
        <motion.div className="mt-14 flex items-center justify-center gap-6"
          initial={{ opacity: 0, transform: 'translateY(20px)' }} animate={{ opacity: 1, transform: 'translateY(0px)' }} transition={{ delay: 0.9, duration: 0.5 }}>
          <button type="button" onClick={onStart} autoFocus
            className="inline-flex items-center gap-4 rounded-full px-14 py-6 font-sans text-[40px] font-extrabold text-white shadow-[0_24px_50px_-18px_rgba(197,31,36,0.9)] transition-transform duration-150 hover:scale-[1.03] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#E5A93C]"
            style={{ background: P.crimson }}>
            <Play className="h-10 w-10 fill-current" /> {ar ? 'ابدأ الدرس' : 'Start the lesson'}
          </button>
          <button type="button" onClick={onReplay} aria-label={ar ? 'شوف المقدمة تاني' : 'Watch the opening again'}
            className="inline-flex h-[92px] w-[92px] items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/30 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
            <RotateCcw className="h-9 w-9" />
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}

/** Manga-style halftone dots over the whole frame. */
function Halftone({ opacity }: { opacity: number }) {
  return <div className="pointer-events-none absolute inset-0" style={{ opacity, backgroundImage: 'radial-gradient(#fff 1.6px, transparent 1.8px)', backgroundSize: '16px 16px', maskImage: 'linear-gradient(120deg, #000, transparent 70%)', WebkitMaskImage: 'linear-gradient(120deg, #000, transparent 70%)' }} aria-hidden="true" />;
}

function speedLines(seed: number, kids: boolean) {
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return Array.from({ length: kids ? 28 : 46 }, (_, k) => ({
    a: (k / (kids ? 28 : 46)) * Math.PI * 2 + rnd() * 0.08,
    r0: 360 + rnd() * 220,
    w: kids ? 10 + rnd() * 14 : 1.5 + rnd() * 4,
    o: kids ? 0.12 + rnd() * 0.12 : 0.18 + rnd() * 0.3,
  }));
}

/** Lighten (amt > 0) or darken (amt < 0) a hex colour. */
function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? c * (1 + amt) : c + (255 - c) * amt)));
  return `rgb(${f(n >> 16)}, ${f((n >> 8) & 255)}, ${f(n & 255)})`;
}
