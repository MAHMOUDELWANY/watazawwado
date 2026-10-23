import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Layer, type Built } from '../Scenes';
import { useCue } from '../sfx';

/* ---------- Adults Lesson 1: The Man No One Knew (brief: docs/curriculum/zad-essentials-adults/L01-the-man-no-one-knew.md)
   Look: docs/curriculum/style/adults.md. v2 after the owner's review (2026-10-23: "premium motion for grown-ups"):
   documentary lower-thirds instead of paper tags, volumetric light with drifting dust, film grain and light leaks,
   real depth (perspective, parallax), kinetic type. Few sounds. Stills in public/curriculum/zad-adults/l01.
   Safe frame: everything stays below the lesson badge (y > 170 on the canvas) and above the chapter strip (y < 790).
   Positions over stills are % of the still's box. Motion: transform, opacity, filter and clip-path only. */

const A = (name: string) => `zad-adults/l01/${name}`;
const ease = [0.22, 1, 0.36, 1] as const;
const INK = '#0B151C';
const BONE = '#EFE8DC';
const GOLD = '#E8C27A';

function rng(seed: number) {
  let t = seed >>> 0;
  return () => { t += 0x6d2b79f5; let r = Math.imul(t ^ (t >>> 15), 1 | t); r ^= r + Math.imul(r ^ (r >>> 7), 61 | r); return ((r ^ (r >>> 14)) >>> 0) / 4294967296; };
}

/* ---------- cinematic primitives ---------- */

/** Film over a still: moving grain, a warm light leak drifting across, a breathing vignette. */
function Film({ leak = true }: { leak?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {leak && !reduce && (
        <motion.div className="absolute left-0 top-[-20%] h-[140%] w-[60%] rounded-full will-change-transform"
          style={{ background: 'radial-gradient(closest-side, rgba(255,190,120,0.26), rgba(255,140,80,0.07) 55%, transparent 72%)', mixBlendMode: 'screen' }}
          initial={{ x: '-100%' }} animate={{ x: ['-100%', '190%'] }} transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', repeatDelay: 4 }} />
      )}
      {/* Grain is static: an animated turbulence filter re-renders every frame and made the page stutter (owner, 2026-10-23). */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay">
        <filter id="a1grain"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" /></filter>
        <rect width="100%" height="100%" filter="url(#a1grain)" />
      </svg>
      <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 95% at 50% 45%, transparent 55%, rgba(0,0,0,0.42) 100%)' }} />
    </div>
  );
}

/** Dust drifting slowly in the air, catching the light. */
function Motes({ count = 22, seed = 1, box = { x: 0, y: 0, w: 100, h: 100 }, color = '255,230,170' }: { count?: number; seed?: number; box?: { x: number; y: number; w: number; h: number }; color?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const r = rng(seed);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const x = box.x + r() * box.w, y = box.y + r() * box.h, s = 2 + r() * 4, d = 6 + r() * 8;
        return (
          <motion.span key={i} className="absolute rounded-full" style={{ left: `${x}%`, top: `${y}%`, width: s, height: s, background: `rgba(${color},0.9)`, boxShadow: `0 0 ${s * 3}px rgba(${color},0.7)` }}
            animate={{ x: [0, (r() - 0.5) * 60, 0], y: [0, -20 - r() * 40, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: d, delay: r() * d, repeat: Infinity, ease: 'easeInOut' }} />
        );
      })}
    </div>
  );
}

/** A volumetric shaft of light: a soft wedge from (x, y), angled, slowly breathing. */
function Beam({ x, y, angle = 30, length = 120, width = 26, opacity = 0.5 }: { x: number; y: number; angle?: number; length?: number; width?: number; opacity?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="pointer-events-none absolute origin-top" aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%`, width: `${width}%`, height: `${length}%`, marginLeft: `-${width / 2}%`, rotate: `${angle}deg`,
        background: 'linear-gradient(180deg, rgba(255,236,190,0.75), rgba(255,220,160,0.18) 60%, transparent)', clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
        maskImage: 'linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent)', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 35%, #000 65%, transparent)', mixBlendMode: 'screen' }}
      initial={{ opacity: 0 }} animate={reduce ? { opacity } : { opacity: [opacity * 0.6, opacity, opacity * 0.6] }}
      transition={reduce ? { duration: 0.6 } : { duration: 7, repeat: Infinity, ease: 'easeInOut' }} />
  );
}

/** A soft round bloom of light that breathes. */
function Bloom({ x, y, size = 30, color = '255,226,170', strength = 0.7 }: { x: number; y: number; size?: number; color?: string; strength?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.span className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
      style={{ left: `${x}%`, top: `${y}%`, width: `${size}%`, aspectRatio: '1', background: `radial-gradient(circle, rgba(${color},${strength}), rgba(${color},0) 65%)`, mixBlendMode: 'screen' }}
      initial={{ opacity: 0 }} animate={reduce ? { opacity: 1 } : { opacity: [0.55, 1, 0.55], scale: [0.96, 1.04, 0.96] }}
      transition={reduce ? { duration: 0.5 } : { duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
  );
}

/** A documentary lower-third: dark glass, a gold rule that draws first, then the words slide out of it. */
function Caption({ children, ar, style, delay = 0, align = 'left', tone = 'dark' }: { children?: React.ReactNode; ar?: string; style: React.CSSProperties; delay?: number; align?: 'left' | 'center'; tone?: 'dark' | 'light' }) {
  const reduce = useReducedMotion();
  const dark = tone === 'dark';
  return (
    <motion.div className={`pointer-events-none absolute flex max-w-[78%] items-stretch gap-3 rounded-[10px] px-4 py-2.5 ${align === 'center' ? '-translate-x-1/2' : ''}`}
      style={{ background: dark ? 'rgba(8,16,22,0.8)' : 'rgba(250,246,238,0.94)', boxShadow: '0 18px 40px -20px rgba(0,0,0,0.8)', ...style }}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reduce ? 0.2 : 0.5, delay: reduce ? 0 : delay }}>
      <motion.span className="w-[3px] shrink-0 rounded-full" style={{ background: GOLD, transformOrigin: 'top' }}
        initial={reduce ? false : { scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.5, delay: reduce ? 0 : delay + 0.1, ease }} />
      <motion.span className="flex flex-col leading-tight" initial={reduce ? false : { opacity: 0, x: -14, filter: 'blur(6px)' }} animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.8, delay: reduce ? 0 : delay + 0.35, ease }}>
        {ar && <span lang="ar" dir="rtl" className="font-serif text-[28px] font-bold leading-[1.35]" style={{ color: GOLD }}>{ar}</span>}
        {children && <span className="font-sans text-[20px] font-semibold tracking-[0.01em]" style={{ color: dark ? BONE : INK }}>{children}</span>}
      </motion.span>
    </motion.div>
  );
}

/** Arabic set large in light: it sharpens out of a blur while a wipe uncovers it from the right. */
function Word({ ar, style, size = 64, delay = 0, color = GOLD, glow = true }: { ar: string; style: React.CSSProperties; size?: number; delay?: number; color?: string; glow?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.span lang="ar" dir="rtl" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif font-bold"
      style={{ color, fontSize: size, textShadow: glow ? '0 0 30px rgba(232,194,122,0.55)' : 'none', ...style }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, filter: 'blur(10px)', clipPath: 'inset(0 0 0 100%)' }}
      animate={{ opacity: 1, filter: 'blur(0px)', clipPath: 'inset(0 0 0 0%)' }}
      transition={{ duration: reduce ? 0.2 : 1.6, delay: reduce ? 0 : delay, ease }}>{ar}</motion.span>
  );
}

/** English set in the serif, words rising one by one out of a mask. */
function Kinetic({ text, style, size = 34, delay = 0, color = BONE }: { text: string; style: React.CSSProperties; size?: number; delay?: number; color?: string }) {
  const reduce = useReducedMotion();
  return (
    <span className="pointer-events-none absolute flex -translate-x-1/2 flex-wrap justify-center gap-x-[0.28em] font-serif italic" style={{ fontSize: size, color, ...style }}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-[0.1em]">
          <motion.span className="inline-block" initial={reduce ? { opacity: 0 } : { y: '110%' }} animate={reduce ? { opacity: 1 } : { y: '0%' }}
            transition={{ duration: reduce ? 0.2 : 0.9, delay: reduce ? 0 : delay + i * 0.08, ease }}>{w}</motion.span>
        </span>
      ))}
    </span>
  );
}

/** Deep backdrop for code-drawn panels. */
function Stage({ tone = 'ink' }: { tone?: 'ink' | 'dusk' | 'night' }) {
  const base = {
    ink: 'radial-gradient(120% 90% at 50% 0%, #1B3240 0%, #0B151C 62%, #05090C 100%)',
    dusk: 'radial-gradient(130% 100% at 50% 100%, #7A3E2A 0%, #32221F 45%, #0B151C 100%)',
    night: 'radial-gradient(120% 90% at 50% 20%, #142640 0%, #070F1B 65%, #03060A 100%)',
  }[tone];
  return <div className="pointer-events-none absolute inset-0" aria-hidden="true" style={{ background: base }} />;
}

/** Stars that twinkle at their own pace. */
function Stars({ count = 70, seed = 3, top = 70 }: { count?: number; seed?: number; top?: number }) {
  const reduce = useReducedMotion();
  const r = rng(seed);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const s = r() < 0.85 ? 1.5 : 3;
        return (
          <motion.span key={i} className="absolute rounded-full bg-white" style={{ left: `${r() * 100}%`, top: `${r() * top}%`, width: s, height: s, boxShadow: s > 2 ? '0 0 8px rgba(255,255,255,0.9)' : undefined }}
            animate={reduce ? { opacity: 0.8 } : { opacity: [0.2, 1, 0.2] }} transition={{ duration: 2 + r() * 4, delay: r() * 3, repeat: Infinity }} />
        );
      })}
    </div>
  );
}

/** A framed 4:3 panel right of the text, inside the safe frame. */
function Panel({ children, label, still, tone, film = true }: { children?: React.ReactNode; label: string; still?: string; tone?: 'ink' | 'dusk' | 'night'; film?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="absolute left-[720px] top-[184px] h-[570px] w-[760px] overflow-hidden rounded-[22px]" role="img" aria-label={label}
      style={{ boxShadow: '0 50px 90px -40px rgba(5,15,22,0.9), 0 0 0 1px rgba(232,194,122,0.18)' }}
      initial={reduce ? false : { opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.9, ease }}>
      <Stage tone={tone} />
      {still && (
        <Layer name={A(still)} filter="none" style={{ objectFit: 'cover' }}
          initial={reduce ? false : { scale: 1.12 }} animate={{ scale: 1.02 }} transition={{ duration: 18, ease: 'easeOut' }} />
      )}
      {children}
      {film && <Film leak={Boolean(still)} />}
    </motion.div>
  );
}

/* ---------- Spark ---------- */

/** Cover: a shaft of dawn falls into the courtyard; dust turns in it; the film breathes. */
export function ShaftOfLight(_: { v: Built }) {
  return (
    <>
      <Beam x={82} y={-8} angle={38} length={140} width={34} opacity={0.55} />
      <Motes count={26} seed={21} box={{ x: 40, y: 30, w: 50, h: 60 }} />
      <Film />
    </>
  );
}

/** p2 The misted mirror: condensation beads on the glass; a hand-wide streak wipes clear along a slant, then the
 *  morning question is written in the clear stripe. */
export function MirrorWipe({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  const r = rng(5);
  return (
    <>
      <motion.div className="absolute inset-0" aria-hidden="true"
        style={{ background: 'linear-gradient(180deg, rgba(222,231,236,0.62), rgba(198,211,220,0.56))' }}
        initial={false}
        animate={{ clipPath: v.lines >= 1 ? 'polygon(0 0,100% 0,100% 24%,0 34%,0 56%,100% 46%,100% 100%,0 100%)' : 'polygon(0 0,100% 0,100% 24%,0 34%,0 34%,100% 24%,100% 100%,0 100%)' }}
        transition={{ duration: reduce ? 0 : 2.2, ease }} />
      {Array.from({ length: 26 }, (_, i) => (
        <span key={i} className="pointer-events-none absolute rounded-full" aria-hidden="true"
          style={{ left: `${r() * 100}%`, top: `${r() < 0.5 ? r() * 22 : 58 + r() * 40}%`, width: 3 + r() * 6, height: 3 + r() * 7, background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.9), rgba(200,215,225,0.2))' }} />
      ))}
      {v.lines >= 3 && <Kinetic text="If today were my last day…" style={{ left: '50%', top: '33%' }} size={40} color="#FFFFFF" delay={0.4} />}
      <Film leak={false} />
    </>
  );
}

/** p3 The bedside: the sun flares in the window; a warm bloom gathers on the hands; knowing is joined to seeing. */
export function HandsWarm({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  return (
    <>
      <Bloom x={62} y={18} size={40} color="255,190,120" />
      {!reduce && [0.2, 0.36, 0.5].map((k, i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" aria-hidden="true"
          style={{ left: `${62 - k * 40}%`, top: `${18 + k * 60}%`, width: 30 + i * 18, height: 30 + i * 18, border: '2px solid rgba(255,210,150,0.35)', mixBlendMode: 'screen' }}
          animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 6, delay: i, repeat: Infinity }} />
      ))}
      <Bloom x={42} y={66} size={36} strength={v.lines >= 3 ? 0.8 : 0.4} />
      {v.lines >= 3 && <Caption style={{ left: '8%', top: '34%' }} delay={0.3}>They knew all their lives</Caption>}
      {v.lines >= 3 && <Caption style={{ left: '40%', top: '50%' }} delay={1.3}>At the end, they saw</Caption>}
      <Film />
    </>
  );
}

/** p4 The street: bokeh lights drift, a headlight sweep follows the car; then the gap is named. */
export function FuneralPasses({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  const r = rng(9);
  return (
    <>
      {!reduce && Array.from({ length: 12 }, (_, i) => (
        <motion.span key={i} className="pointer-events-none absolute rounded-full" aria-hidden="true"
          style={{ left: `${r() * 100}%`, top: `${30 + r() * 30}%`, width: 20 + r() * 40, height: 20 + r() * 40, background: `radial-gradient(circle, rgba(${r() < 0.5 ? '255,200,130' : '180,210,255'},0.35), transparent 70%)`, mixBlendMode: 'screen' }}
          animate={{ x: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }} transition={{ duration: 8 + r() * 6, repeat: Infinity, ease: 'easeInOut' }} />
      ))}
      {!reduce && (
        <motion.div className="pointer-events-none absolute left-0 top-[48%] h-[20%] w-[40%] will-change-transform" aria-hidden="true"
          style={{ background: 'radial-gradient(closest-side, rgba(255,236,190,0.4), transparent)', mixBlendMode: 'screen' }}
          initial={{ x: '-100%' }} animate={{ x: '260%' }} transition={{ duration: 12, repeat: Infinity, ease: 'linear' }} />
      )}
      {v.lines >= 2 && <Caption style={{ left: '8%', top: '24%' }} delay={0.3}>Everyone here is sure</Caption>}
      {v.interaction && <Caption style={{ left: '8%', top: '78%' }} delay={0.3}>Sure, and not moved</Caption>}
      <Film />
    </>
  );
}

/* ---------- Zad ---------- */

/** p5 Al-Hijr 15:99: dusk turns to night; the sun sinks behind the hills with a bloom, stars come out, and the word is
 *  set where the sun went down. */
export function SunsetCertainty({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const set = v.evidence;
  useCue('chime', set, 1.8);
  return (
    <Panel label={label} tone="dusk">
      <motion.div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #0A1424 0%, #142A44 55%, #2B2A3A 100%)' }} initial={false}
        animate={{ opacity: set ? 1 : 0 }} transition={{ duration: reduce ? 0 : 3.5 }} aria-hidden="true" />
      {set && <Stars count={60} seed={7} top={55} />}
      <motion.div className="absolute left-1/2 h-[150px] w-[150px] -translate-x-1/2 rounded-full" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, #FFF4D6 0%, #F5B754 45%, rgba(245,183,84,0) 70%)', boxShadow: '0 0 140px 50px rgba(245,170,80,0.35)' }}
        initial={false} animate={{ top: set ? '72%' : '30%', opacity: set ? 0.35 : 1 }} transition={{ duration: reduce ? 0 : 3.5, ease: [0.45, 0, 0.2, 1] }} />
      <svg className="absolute inset-x-0 bottom-0 h-[34%] w-full" viewBox="0 0 760 190" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 70 C120 40 220 80 330 55 C450 28 560 75 760 45 L760 190 L0 190 Z" fill="#1A120F" />
        <path d="M0 110 C160 80 300 120 440 95 C560 75 660 110 760 90 L760 190 L0 190 Z" fill="#0D0907" />
      </svg>
      <motion.div className="absolute inset-x-0 top-[64%] h-[10%]" aria-hidden="true" style={{ background: 'linear-gradient(180deg, transparent, rgba(255,170,90,0.35), transparent)', filter: 'blur(8px)' }}
        initial={false} animate={{ opacity: set ? 0.9 : 0.4 }} transition={{ duration: 2 }} />
      {v.lines >= 2 && <Caption style={{ left: '6%', top: '8%' }} delay={0.3}>The one thing no one doubts</Caption>}
      {set && <Word ar="ٱلْيَقِينُ" style={{ left: '50%', top: '44%' }} size={86} delay={2.6} />}
    </Panel>
  );
}

/** p6 Where the gap is: three glass steps rise in perspective; light falls on the highest; a fracture marks the gap. */
export function GapSteps({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const lit = labels.filter(Boolean).length;
  const steps = [{ x: 8, h: 26 }, { x: 37, h: 46 }, { x: 66, h: 66 }];
  return (
    <motion.div className="absolute left-[700px] top-[184px] h-[580px] w-[790px] overflow-hidden rounded-[22px]" role="img" aria-label={`${label}: ${lit} of 3`}
      style={{ boxShadow: '0 50px 90px -40px rgba(5,15,22,0.9), 0 0 0 1px rgba(232,194,122,0.18)' }}>
      <Stage />
      {lit >= 3 && <Beam x={80} y={-10} angle={8} length={90} width={30} opacity={0.6} />}
      <div className="absolute inset-0" style={{ perspective: 900 }}>
        <div className="absolute inset-x-0 bottom-[10%] top-0" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(14deg)' }}>
          {steps.map((s, i) => (
            <motion.div key={i} className="absolute bottom-0 w-[26%] rounded-t-[10px]"
              style={{ left: `${s.x}%`, height: `${s.h}%`, transformOrigin: 'bottom',
                background: ['linear-gradient(180deg, rgba(120,160,175,0.55), rgba(40,70,85,0.35))', 'linear-gradient(180deg, rgba(220,140,100,0.65), rgba(110,50,30,0.45))', 'linear-gradient(180deg, rgba(255,215,140,0.9), rgba(200,140,50,0.55))'][i],
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.5), 0 0 ${i === 2 && lit >= 3 ? 70 : 20}px -6px rgba(255,210,140,${i < lit ? 0.6 : 0})` }}
              initial={false} animate={{ scaleY: i < lit ? 1 : 0.02, opacity: i < lit ? 1 : 0.25 }} transition={{ duration: reduce ? 0 : 1.2, ease }} />
          ))}
        </div>
      </div>
      {labels.map((l, i) => {
        if (!l) return null;
        const [word, hint] = l.split(':').map((s) => s.trim());
        return <Caption key={l} style={{ left: `${steps[i].x}%`, top: `${84 - steps[i].h - 18}%`, maxWidth: '30%' }} delay={0.6}>
          <span className="block text-[21px] font-bold" style={{ color: GOLD }}>{word}</span><span className="block text-[15px] font-medium opacity-90">{hint}</span>
        </Caption>;
      })}
      {lit >= 2 && (
        <svg className="pointer-events-none absolute left-[33%] top-[42%] h-[40%] w-[5%] overflow-visible" viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M10 0 L6 18 L13 34 L5 52 L12 70 L8 100" fill="none" stroke={P.crimson} strokeWidth={2.5} vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1, delay: 0.8 }} />
        </svg>
      )}
      {lit >= 2 && <Caption style={{ left: '27%', top: '88%' }} delay={1.4}>the gap</Caption>}
      {lit >= 3 && <Motes count={14} seed={33} box={{ x: 64, y: 0, w: 30, h: 40 }} />}
      <Film leak={false} />
    </motion.div>
  );
}

/** p7 Madinah: a shaft of morning light moves across the courtyard; dust turns in it. */
export function MadinahMorning(_: { v: Built }) {
  return (
    <>
      <Beam x={78} y={-10} angle={28} length={130} width={30} opacity={0.5} />
      <Motes count={22} seed={8} box={{ x: 40, y: 35, w: 50, h: 55 }} />
      <Film />
    </>
  );
}

const CHAIN = [
  { en: 'The Prophet', ar: 'النبي ﷺ' },
  { en: 'Umar ibn al-Khattab', ar: 'عمر بن الخطاب' },
  { en: 'Abdullah ibn Umar', ar: 'عبد الله بن عمر' },
  { en: "Yahya ibn Ya'mar", ar: 'يحيى بن يعمر' },
  { en: 'Sahih Muslim, then us', ar: 'صحيح مسلم' },
];

/** p8 Why Ibn Umar told it: a vertical line of light; a pulse travels down it and each name ignites as it arrives,
 *  from the Messenger ﷺ to the page in front of the learner. Names only; no one is drawn. */
export function NarratorChain({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  const lit = v.lines >= 3 ? CHAIN.length : v.lines >= 2 ? 3 : v.lines >= 1 ? 2 : 1;
  const y = (i: number) => 22 + i * 15;
  return (
    <div className="absolute inset-0" role="img" aria-label="The chain of narrators">
      <Stage tone="dusk" />
      <div className="absolute left-[34%] top-[22%] h-[60%] w-[2px] bg-[rgba(232,194,122,0.18)]" aria-hidden="true" />
      <motion.div className="absolute left-[34%] top-[22%] w-[2px] origin-top" aria-hidden="true" style={{ background: `linear-gradient(180deg, ${GOLD}, #FFF4D6)`, boxShadow: '0 0 14px rgba(232,194,122,0.9)' }}
        initial={false} animate={{ height: `${(lit - 1) * 15}%` }} transition={{ duration: reduce ? 0 : 1.2, ease }} />
      {!reduce && lit > 1 && (
        <motion.span key={lit} className="absolute left-[34%] h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" aria-hidden="true"
          style={{ boxShadow: '0 0 24px 8px rgba(255,236,190,0.9)' }}
          initial={{ top: `${y(lit - 2)}%`, opacity: 1 }} animate={{ top: `${y(lit - 1)}%`, opacity: [1, 1, 0] }} transition={{ duration: 1.2, ease }} />
      )}
      {CHAIN.map((c, i) => (
        <motion.div key={c.en} className="absolute flex -translate-y-1/2 items-center gap-4" style={{ left: '34%', top: `${y(i)}%` }} initial={false}
          animate={{ opacity: i < lit ? 1 : 0.15 }} transition={{ duration: 0.8, delay: i < lit ? 0.9 : 0 }}>
          <span className="-ml-[9px] h-[18px] w-[18px] rounded-full border-2" style={{ borderColor: GOLD, background: i < lit ? GOLD : 'transparent', boxShadow: i < lit ? '0 0 16px rgba(232,194,122,0.9)' : undefined }} />
          <span className="flex flex-col leading-tight">
            <span lang="ar" dir="rtl" className="font-serif text-[30px] font-bold" style={{ color: i === 2 ? '#FFD9A0' : GOLD }}>{c.ar}</span>
            <span className="font-sans text-[18px] font-semibold" style={{ color: BONE }}>{c.en}</span>
          </span>
        </motion.div>
      ))}
      {v.evidence && <Caption style={{ left: '8%', top: '86%' }} delay={0.3}>When doubt came, he went back to the source</Caption>}
      <Film leak={false} />
    </div>
  );
}

/** p9 The stranger: layers of blowing sand at three depths (far slow and fine, near fast and coarse) part around the
 *  small figure, who stays clear in a calm halo. */
export function SandAround(_: { v: Built }) {
  const reduce = useReducedMotion();
  const hole = 'radial-gradient(ellipse 11% 18% at 50% 60%, transparent 60%, #000 100%)';
  const layer = (n: number, seed: number, speed: number, thick: number, alpha: number) => {
    const r = rng(seed);
    return Array.from({ length: n }, (_, i) => (
      <motion.span key={`${seed}-${i}`} className="absolute left-0 block rounded-full will-change-transform" style={{ top: `${r() * 100}%`, width: 30 + r() * 90, height: thick, background: `linear-gradient(90deg, rgba(225,185,120,0), rgba(225,185,120,${alpha}))` }}
        initial={{ x: -140 }} animate={{ x: 900 }} transition={{ duration: (1.6 + r()) / speed, delay: r() * 2, repeat: Infinity, ease: 'linear' }} />
    ));
  };
  return (
    <>
      {!reduce && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ maskImage: hole, WebkitMaskImage: hole }} aria-hidden="true">
          {layer(28, 14, 0.7, 2, 0.5)}{layer(22, 15, 1.1, 3, 0.7)}{layer(12, 16, 1.8, 6, 0.55)}
        </div>
      )}
      <Bloom x={50} y={60} size={22} strength={0.5} />
      <Film />
    </>
  );
}

/** p10 Knees to knees: a beam falls between the two cushions; dust turns in it; a thin gold arc closes the space. */
export function CushionsClose({ v }: { v: Built }) {
  return (
    <>
      <Beam x={50} y={-6} angle={0} length={90} width={30} opacity={0.6} />
      <Motes count={18} seed={12} box={{ x: 38, y: 10, w: 24, h: 60 }} />
      {v.lines >= 1 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M28 66 C40 55 60 55 72 66" fill="none" stroke={GOLD} strokeWidth={2} vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 6px rgba(232,194,122,0.9))' }}
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease }} />
        </svg>
      )}
      {v.lines >= 1 && <Caption style={{ left: '50%', top: '40%' }} align="center" delay={1} ar={v.evidence ? 'رُكبَتَيه إلى رُكبَتَيه' : undefined}>Knees to knees</Caption>}
      {v.lines >= 3 && <Caption style={{ left: '50%', top: '82%' }} align="center" delay={0.3}>Full attention, then the questions</Caption>}
      <Film />
    </>
  );
}

const PILLARS = [
  { en: 'Shahadah', ar: 'الشهادة' }, { en: 'Salah', ar: 'الصلاة' }, { en: 'Zakah', ar: 'الزكاة' },
  { en: 'Fasting', ar: 'الصوم' }, { en: 'Hajj', ar: 'الحج' },
];

/** p11 Islam: fluted stone columns rise out of the floor one by one, each throwing dust and a shadow; when the fifth
 *  stands the lintel settles on them and a light sweeps across the stone. */
export function ColumnsRise({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const up = Math.min(v.items, PILLARS.length);
  const done = up === PILLARS.length;
  useCue('thud', done, 0.9);
  const left = (i: number) => 11 + i * 16.5;
  const stone = 'repeating-linear-gradient(90deg, #B9AE9C 0 6%, #E9E1D2 6% 12%, #CFC4B2 12% 16%), linear-gradient(90deg, rgba(0,0,0,0.35), transparent 30%, transparent 70%, rgba(0,0,0,0.4))';
  return (
    <Panel label={`${label}: ${up} of 5`}>
      <Beam x={50} y={-20} angle={0} length={80} width={70} opacity={done ? 0.45 : 0.18} />
      <div className="absolute inset-x-0 bottom-0 h-[16%]" style={{ background: 'linear-gradient(180deg, #2A2621, #14110E)' }} aria-hidden="true" />
      <motion.div className="absolute left-[7%] right-[7%] top-[12%] h-[9%] overflow-hidden rounded-[4px]" aria-hidden="true"
        style={{ background: done ? 'linear-gradient(180deg, #F2EBDD, #BDB09B)' : 'transparent', border: done ? 'none' : '1.5px dashed rgba(239,232,220,0.35)', boxShadow: done ? '0 12px 30px -10px rgba(0,0,0,0.8)' : undefined }}
        initial={false} animate={{ y: done ? 12 : 0 }} transition={{ duration: reduce ? 0 : 1, ease: [0.6, 0, 0.2, 1], delay: done ? 0.5 : 0 }}>
        {done && !reduce && <motion.span className="absolute inset-y-0 w-[30%]" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)' }}
          initial={{ left: '-30%' }} animate={{ left: '110%' }} transition={{ duration: 1.6, delay: 1.5, ease: 'easeInOut' }} />}
      </motion.div>
      {PILLARS.map((p, i) => (
        <div key={p.en} className="absolute bottom-[16%] top-[23%]" style={{ left: `${left(i)}%`, width: '11%' }}>
          <motion.div className="absolute inset-0 rounded-t-[4px]" style={{ background: stone, transformOrigin: 'bottom', boxShadow: i < up ? '18px 10px 30px -10px rgba(0,0,0,0.7)' : undefined }}
            initial={false} animate={{ scaleY: i < up ? 1 : 0, opacity: i < up ? 1 : 0 }} transition={{ duration: reduce ? 0 : 1.1, ease }} />
          {i < up && <Word ar={p.ar} style={{ left: '50%', top: '50%', color: '#5A4B3A', textShadow: '0 1px 0 rgba(255,255,255,0.6), 0 -1px 0 rgba(0,0,0,0.35)' }} size={24} delay={0.9} glow={false} />}
          {i < up && !reduce && <motion.span className="absolute -bottom-[6%] left-1/2 h-10 w-[160%] -translate-x-1/2 rounded-full" style={{ background: 'radial-gradient(closest-side, rgba(220,200,170,0.6), transparent)', filter: 'blur(6px)' }}
            initial={{ opacity: 0.9, scale: 0.4 }} animate={{ opacity: 0, scale: 1.6 }} transition={{ duration: 1.4, delay: 0.8 }} aria-hidden="true" />}
          <span className="absolute -bottom-[18%] left-1/2 -translate-x-1/2 whitespace-nowrap font-sans text-[17px] font-semibold tracking-wide" style={{ color: i < up ? BONE : 'rgba(239,232,220,0.2)' }}>{p.en}</span>
        </div>
      ))}
      {v.evidence && <Caption style={{ left: '50%', top: '2.5%' }} align="center" delay={0.3}>"You are right." He already knew.</Caption>}
    </Panel>
  );
}

const SIX = ['Allah', 'His angels', 'His books', 'His messengers', 'The Last Day', 'Qadar'];

/** p12 Iman: a core of light; six lights on a slowly turning ring ignite and send a beam to the core, which grows
 *  brighter with each. */
export function SixLights({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const lit = Math.min(v.items, SIX.length);
  const pt = (i: number) => { const a = (Math.PI * 2 * i) / SIX.length - Math.PI / 2; return { x: 380 + 215 * Math.cos(a), y: 285 + 190 * Math.sin(a) }; };
  return (
    <Panel label={`${label}: ${lit} of 6`} tone="night">
      <Stars count={40} seed={19} top={100} />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
        <motion.ellipse cx="380" cy="285" rx="215" ry="190" fill="none" stroke="rgba(232,194,122,0.25)" strokeWidth="1.5" strokeDasharray="2 10"
          animate={reduce ? undefined : { rotate: 360 }} style={{ transformOrigin: '380px 285px' }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }} />
        {SIX.slice(0, lit).map((_, i) => (
          <motion.line key={i} x1="380" y1="285" x2={pt(i).x} y2={pt(i).y} stroke={GOLD} strokeWidth="1.5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 0.8 }}
            transition={{ duration: 0.9, ease }} style={{ filter: 'drop-shadow(0 0 4px rgba(232,194,122,0.9))' }} />
        ))}
      </svg>
      <motion.span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
        style={{ width: 70, height: 70, background: 'radial-gradient(circle, #FFF6DC, #E8C27A 50%, rgba(232,194,122,0) 72%)' }}
        initial={false} animate={{ scale: 0.6 + (lit / SIX.length) * 1.4, opacity: 0.4 + (lit / SIX.length) * 0.6 }} transition={{ duration: 1, ease }} />
      {SIX.map((w, i) => (
        <motion.div key={w} className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2" style={{ left: `${(pt(i).x / 760) * 100}%`, top: `${(pt(i).y / 570) * 100}%` }}
          initial={false} animate={{ opacity: i < lit ? 1 : 0.18 }} transition={{ duration: 0.8 }}>
          <span className="h-4 w-4 rounded-full" style={{ background: i < lit ? '#FFF4D6' : 'transparent', border: `1.5px solid ${GOLD}`, boxShadow: i < lit ? '0 0 20px 6px rgba(232,194,122,0.8)' : undefined }} />
          <span className="whitespace-nowrap font-sans text-[18px] font-semibold" style={{ color: BONE }}>{w}</span>
        </motion.div>
      ))}
    </Panel>
  );
}

/** p13 Ihsan: two planes in perspective. Above, a luminous plane barely there: as if you see Him. Below, a solid gold
 *  floor: He sees you. A ray joins them. */
export function IhsanSteps({ v, label }: { v: Built; label: string }) {
  const show = v.lines >= 1;
  return (
    <Panel label={label} tone="night">
      <div className="absolute inset-0" style={{ perspective: 800 }} aria-hidden="true">
        <motion.div className="absolute left-[14%] right-[14%] top-[18%] h-[22%] rounded-[14px]"
          style={{ transform: 'rotateX(55deg)', background: 'linear-gradient(180deg, rgba(255,244,214,0.35), rgba(255,244,214,0.05))', border: '1px solid rgba(255,244,214,0.6)', boxShadow: '0 0 80px 10px rgba(255,236,190,0.25)' }}
          initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.4, ease }} />
        <motion.div className="absolute left-[6%] right-[6%] top-[58%] h-[26%] rounded-[14px]"
          style={{ transform: 'rotateX(60deg)', background: 'linear-gradient(180deg, #F0C66E, #9A6A12)', boxShadow: '0 30px 60px -20px rgba(0,0,0,0.8), 0 0 60px -10px rgba(232,194,122,0.6)' }}
          initial={{ opacity: 0 }} animate={{ opacity: show ? 1 : 0 }} transition={{ duration: 1.4, delay: 0.4, ease }} />
      </div>
      {show && <Beam x={50} y={30} angle={0} length={40} width={14} opacity={0.6} />}
      {v.evidence && <Word ar="كَأنَّك تَراه" style={{ left: '50%', top: '27%' }} size={50} delay={0.3} />}
      {v.evidence && <Word ar="فإنَّه يَراك" style={{ left: '50%', top: '69%' }} color="#3A2608" size={50} delay={1.3} glow={false} />}
      {v.evidence && <Caption style={{ left: '50%', top: '86%' }} align="center" delay={2}>If not the first, never less than the second</Caption>}
    </Panel>
  );
}

/** p14 The Hour: an hourglass of glass and brass; grains fall in a thin stream, the top empties, the heap grows. */
export function HourglassRuns({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const r = rng(41);
  return (
    <Panel label={label} tone="dusk">
      <Bloom x={50} y={48} size={60} strength={0.25} />
      <div className="absolute left-1/2 top-[8%] h-[76%] -translate-x-1/2" style={{ aspectRatio: '2 / 3' }} aria-hidden="true">
        <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 200 300">
          <defs>
            <linearGradient id="a1brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#5A3A1E" /><stop offset="0.5" stopColor="#C9934A" /><stop offset="1" stopColor="#5A3A1E" /></linearGradient>
            <linearGradient id="a1glass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="rgba(255,255,255,0.18)" /><stop offset="0.25" stopColor="rgba(255,255,255,0.02)" /><stop offset="0.8" stopColor="rgba(255,255,255,0.06)" /><stop offset="1" stopColor="rgba(255,255,255,0.2)" /></linearGradient>
            <clipPath id="a1top"><path d="M48 20 C48 105 94 128 98 150 L102 150 C106 128 152 105 152 20 Z" /></clipPath>
            <clipPath id="a1bot"><path d="M98 150 C94 172 48 195 48 280 L152 280 C152 195 106 172 102 150 Z" /></clipPath>
          </defs>
          <g clipPath="url(#a1top)">
            <motion.rect x="40" width="120" height="140" fill="#E6C487" initial={false} animate={{ y: reduce ? 70 : [50, 140] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          </g>
          <g clipPath="url(#a1bot)">
            <motion.ellipse cx="100" cy="282" rx="60" fill="#E6C487" initial={false} animate={{ ry: reduce ? 40 : [12, 70] }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }} />
          </g>
          <path d="M48 20 C48 105 94 128 98 150 C94 172 48 195 48 280 L152 280 C152 195 106 172 102 150 C106 128 152 105 152 20 Z" fill="url(#a1glass)" stroke="rgba(239,232,220,0.55)" strokeWidth="1.5" />
          <rect x="30" y="8" width="140" height="14" rx="5" fill="url(#a1brass)" />
          <rect x="30" y="278" width="140" height="14" rx="5" fill="url(#a1brass)" />
        </svg>
        {!reduce && Array.from({ length: 16 }, (_, i) => (
          <motion.span key={i} className="absolute left-1/2 h-[3px] w-[3px] rounded-full bg-[#F1D49A]" style={{ marginLeft: (r() - 0.5) * 3 }}
            initial={{ top: '50%', opacity: 1 }} animate={{ top: ['50%', '86%'], opacity: [1, 1, 0] }} transition={{ duration: 0.9, delay: i * 0.06, repeat: Infinity, ease: 'easeIn' }} />
        ))}
      </div>
      {v.evidence && <Caption style={{ left: '6%', top: '84%' }} delay={0.4}>Its time is with Allah alone</Caption>}
      {v.interaction && <Caption style={{ left: '6%', top: '6%' }} delay={0.3}>Certain. Hidden. So, ready.</Caption>}
    </Panel>
  );
}

/** p15 The reveal: a far point of light on the night horizon opens into slowly turning rays; the name is set above. */
export function FarLightOpens({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const open = v.evidence;
  useCue('reveal', open, 0.3);
  return (
    <Panel label={label} tone="night">
      <Stars count={50} seed={23} top={60} />
      <div className="absolute inset-x-0 bottom-0 h-[30%]" style={{ background: 'linear-gradient(180deg, #120E0B, #060504)' }} aria-hidden="true" />
      {open && !reduce && (
        <motion.div className="absolute left-1/2 top-[70%] h-[160%] w-[160%] -translate-x-1/2 -translate-y-1/2" aria-hidden="true"
          style={{ background: 'repeating-conic-gradient(from 0deg, rgba(255,240,205,0.22) 0deg 4deg, transparent 4deg 16deg)', maskImage: 'radial-gradient(circle, #000 4%, transparent 50%)', WebkitMaskImage: 'radial-gradient(circle, #000 4%, transparent 50%)' }}
          initial={{ opacity: 0, rotate: 0 }} animate={{ opacity: 1, rotate: 25 }} transition={{ opacity: { duration: 2 }, rotate: { duration: 60, repeat: Infinity, ease: 'linear' } }} />
      )}
      <motion.div className="absolute left-1/2 top-[70%] h-[22%] w-[16%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, #FFFFFF, rgba(255,240,205,0.6) 30%, rgba(255,240,205,0) 70%)', mixBlendMode: 'screen' }}
        initial={false} animate={{ scale: open ? 3.4 : 1, opacity: open ? 1 : 0.7 }} transition={{ duration: reduce ? 0 : 2.4, ease }} />
      {open && <Motes count={20} seed={29} box={{ x: 30, y: 40, w: 40, h: 40 }} color="255,250,235" />}
      {open && <Word ar="جِبريل" style={{ left: '50%', top: '30%' }} size={96} delay={1.2} />}
      {open && <Caption style={{ left: '50%', top: '82%' }} align="center" ar="يُعَلِّمُكُم دينَكُم" delay={2.2}>to teach you your deen</Caption>}
    </Panel>
  );
}

const LEVELS = [{ r: 255, name: 'Islam' }, { r: 175, name: 'Iman' }, { r: 95, name: 'Ihsan' }];

/** p16 Three levels of one deen: three rings, each inside the last, turning at their own speeds; each lights from the
 *  outside in, and the core glows when all three are lit. */
export function RingsInward({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const lit = labels.filter(Boolean).length;
  return (
    <motion.div className="absolute left-[700px] top-[184px] h-[580px] w-[790px] overflow-hidden rounded-[22px]" role="img" aria-label={`${label}: ${lit} of 3`}
      style={{ boxShadow: '0 50px 90px -40px rgba(5,15,22,0.9), 0 0 0 1px rgba(232,194,122,0.18)' }}>
      <Stage tone="night" />
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 790 580" aria-hidden="true">
        {LEVELS.map((l, i) => (
          <g key={l.name}>
            <motion.circle cx="395" cy="290" r={l.r} fill={['rgba(60,85,96,0.35)', 'rgba(139,73,53,0.4)', 'rgba(232,194,122,0.55)'][i]} initial={false}
              animate={{ opacity: i < lit ? 1 : 0.08 }} transition={{ duration: 1.2, ease }} />
            <motion.circle cx="395" cy="290" r={l.r} fill="none" stroke={GOLD} strokeWidth="1.5" strokeDasharray={`${2 + i * 2} ${10 + i * 4}`} initial={false}
              animate={reduce ? { opacity: i < lit ? 0.8 : 0.15 } : { rotate: i % 2 ? -360 : 360, opacity: i < lit ? 0.8 : 0.15 }} style={{ transformOrigin: '395px 290px' }}
              transition={{ rotate: { duration: 60 + i * 30, repeat: Infinity, ease: 'linear' }, opacity: { duration: 1 } }} />
          </g>
        ))}
      </svg>
      {lit === 3 && <Bloom x={50} y={50} size={30} />}
      {LEVELS.map((l, i) => (i < lit ? (
        <Caption key={l.name} style={{ left: '50%', top: `${50 - ((l.r - 30) / 580) * 100}%` }} align="center" delay={0.5}>{labels[i]?.split(':')[0]}</Caption>
      ) : null))}
      <Film leak={false} />
    </motion.div>
  );
}

/** p17 At-Takathur 102:1–2: the sun lowers and the shadows lengthen across the graves as the ayah is read. */
export function ShadowsLengthen({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  return (
    <Panel label={label} still="graves">
      <motion.div className="absolute inset-0" aria-hidden="true" style={{ background: 'linear-gradient(105deg, rgba(11,21,28,0) 25%, rgba(11,21,28,0.65) 100%)' }}
        initial={false} animate={{ opacity: v.evidence ? 1 : 0.15 }} transition={{ duration: reduce ? 0 : 5, ease: 'easeInOut' }} />
      <Bloom x={94} y={36} size={36} color="255,190,110" />
      <Motes count={14} seed={44} box={{ x: 10, y: 40, w: 80, h: 40 }} />
      {v.lines >= 2 && <Caption style={{ left: '5%', top: '6%' }} delay={0.3}>Busy, all the way here</Caption>}
      {v.evidence && <Caption style={{ left: '5%', top: '78%' }} ar="زُرْتُمُ" delay={1.2}>visited: guests, not residents</Caption>}
    </Panel>
  );
}

const COUNTS = [
  { label: 'Followers', from: 1240, to: 12480 },
  { label: 'Balance', from: 3200, to: 28900 },
  { label: 'Likes', from: 88, to: 9410 },
];

function Counter({ from, to, run }: { from: number; to: number; run: boolean }) {
  const reduce = useReducedMotion();
  const [n, setN] = React.useState(from);
  React.useEffect(() => {
    if (!run || reduce) { setN(run ? to : from); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 2600); setN(Math.round(from + (to - from) * (1 - (1 - k) ** 3))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, from, to, reduce]);
  return <>{n.toLocaleString('en-GB')}</>;
}

/** p18 "My wealth, my wealth": three glass counters climb; at the question they blur and drift away like dust, and one
 *  quiet card rises and glows: what you gave. */
export function CountersFade({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  const gone = v.interaction;
  return (
    <div className="absolute inset-0">
      <Stage />
      <div className="absolute left-[14%] right-[8%] top-[18%] space-y-4">
        {COUNTS.map((c, i) => (
          <motion.div key={c.label} className="flex items-baseline justify-between rounded-[14px] px-5 py-3"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(239,232,220,0.12)' }}
            initial={false} animate={gone ? { opacity: 0, y: -40 } : { opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0.2 : 1.6, delay: i * 0.25, ease }}>
            <span className="font-sans text-[20px] font-semibold" style={{ color: 'rgba(239,232,220,0.7)' }}>{c.label}</span>
            <span className="font-serif text-[46px] font-bold tabular-nums" style={{ color: BONE }}><Counter from={c.from} to={c.to} run={v.lines >= 1} /></span>
          </motion.div>
        ))}
      </div>
      {gone && <Motes count={18} seed={52} box={{ x: 14, y: 15, w: 78, h: 40 }} color="239,232,220" />}
      {gone && (
        <motion.div className="absolute left-[24%] right-[18%] top-[58%] rounded-[16px] px-6 py-5 text-center"
          style={{ background: 'linear-gradient(180deg, rgba(232,194,122,0.22), rgba(232,194,122,0.06))', border: `1px solid ${GOLD}`, boxShadow: '0 0 60px -10px rgba(232,194,122,0.6)' }}
          initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2, delay: 1.4, ease }}>
          <span className="block font-sans text-[16px] font-semibold uppercase tracking-[0.2em]" style={{ color: 'rgba(239,232,220,0.7)' }}>Still yours</span>
          <span className="block font-serif text-[34px] font-bold" style={{ color: GOLD }}>What you gave</span>
        </motion.div>
      )}
      <Film leak={false} />
    </div>
  );
}

/** p19 'Ilm al-yaqeen: rings of sound carry "a true report" across the dark; a heart is drawn in a single line and
 *  fills with a slow warm light when the knowledge reaches it. */
export function SoundToHeart({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const reach = v.evidence;
  useCue('chime', reach, 1.6);
  return (
    <Panel label={label}>
      <span className="absolute left-[22%] top-[44%] -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-serif text-[30px] italic" style={{ color: BONE }}>a true report</span>
      {!reduce && [0, 1, 2, 3].map((i) => (
        <motion.span key={i} className="absolute left-[22%] top-[44%] h-[100px] w-[100px] -translate-x-1/2 -translate-y-1/2 rounded-full border" aria-hidden="true"
          style={{ borderColor: 'rgba(232,194,122,0.55)' }}
          animate={{ left: ['22%', '70%'], scale: [0.5, 1.8], opacity: [0.8, 0] }} transition={{ duration: 3.4, delay: i * 0.85, repeat: Infinity, ease: 'easeOut' }} />
      ))}
      <svg className="absolute left-[70%] top-[44%] h-[200px] w-[200px] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 100 100" aria-hidden="true">
        <motion.path d="M50 86 C20 64 8 46 18 30 C28 16 44 20 50 34 C56 20 72 16 82 30 C92 46 80 64 50 86 Z" fill="none" stroke={BONE} strokeWidth="1.5"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, ease }} />
        <motion.path d="M50 86 C20 64 8 46 18 30 C28 16 44 20 50 34 C56 20 72 16 82 30 C92 46 80 64 50 86 Z" fill="#C51F24" initial={false}
          animate={{ opacity: reach ? 0.9 : 0 }} transition={{ duration: 2, delay: 1.2 }} style={{ filter: 'drop-shadow(0 0 18px rgba(197,31,36,0.85))' }} />
      </svg>
      {reach && <Bloom x={70} y={44} size={40} color="220,90,80" strength={0.5} />}
      {v.lines >= 2 && <Caption style={{ left: '52%', top: '8%' }} delay={0.4}>…until it reaches the heart</Caption>}
      {reach && <Word ar="عِلْمَ ٱلْيَقِينِ" style={{ left: '50%', top: '84%' }} size={52} delay={2} />}
    </Panel>
  );
}

/** p20 'Ayn al-yaqeen: an eye with a golden iris opens slowly; its pupil narrows to the light and rays spread out. */
export function EyeOpens({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const open = v.evidence;
  useCue('reveal', open, 1);
  return (
    <Panel label={label} tone="night">
      {open && !reduce && (
        <motion.div className="absolute left-1/2 top-[44%] h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2" aria-hidden="true"
          style={{ background: 'repeating-conic-gradient(from 0deg, rgba(232,194,122,0.14) 0deg 3deg, transparent 3deg 12deg)', maskImage: 'radial-gradient(circle, #000 10%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle, #000 10%, transparent 55%)' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1, rotate: 15 }} transition={{ opacity: { duration: 2, delay: 1.5 }, rotate: { duration: 40, repeat: Infinity, ease: 'linear' } }} />
      )}
      <svg className="absolute left-1/2 top-[44%] h-[62%] w-[84%] -translate-x-1/2 -translate-y-1/2 overflow-visible" viewBox="0 0 400 200" aria-hidden="true">
        <defs>
          <clipPath id="a1eye"><path d="M20 100 C110 8 290 8 380 100 C290 192 110 192 20 100 Z" /></clipPath>
          <radialGradient id="a1iris"><stop offset="0" stopColor="#120A04" /><stop offset="0.26" stopColor="#120A04" /><stop offset="0.3" stopColor="#F4D592" /><stop offset="0.7" stopColor="#C2802F" /><stop offset="1" stopColor="#5E3414" /></radialGradient>
        </defs>
        <g clipPath="url(#a1eye)">
          <rect width="400" height="200" fill="#EDE6DA" />
          <circle cx="200" cy="100" r="72" fill="url(#a1iris)" />
          <circle cx="200" cy="100" r="60" fill="none" stroke="rgba(90,50,20,0.35)" strokeWidth="1" strokeDasharray="1 3" />
          <motion.circle cx="200" cy="100" fill="#0A0603" initial={false} animate={{ r: open ? 14 : 22 }} transition={{ duration: 2, delay: 1.4 }} />
          <circle cx="222" cy="80" r="9" fill="rgba(255,255,255,0.85)" />
          <motion.rect x="0" width="400" height="100" fill={INK} initial={false} animate={{ y: open ? -104 : 0 }} transition={{ duration: reduce ? 0 : 2.4, ease: [0.6, 0, 0.2, 1] }} />
          <motion.rect x="0" width="400" height="100" fill={INK} initial={false} animate={{ y: open ? 204 : 100 }} transition={{ duration: reduce ? 0 : 2.4, ease: [0.6, 0, 0.2, 1] }} />
        </g>
        <path d="M20 100 C110 8 290 8 380 100 C290 192 110 192 20 100 Z" fill="none" stroke="rgba(239,232,220,0.5)" strokeWidth="1.5" />
      </svg>
      {v.lines >= 2 && <Caption style={{ left: '6%', top: '6%' }} delay={0.4}>Everyone reaches it. The question is when.</Caption>}
      {open && <Word ar="عَيْنَ ٱلْيَقِينِ" style={{ left: '50%', top: '86%' }} size={50} delay={2.4} />}
    </Panel>
  );
}

const THROUGH = ['Told', 'Seen', 'Inside'];

/** p21 Haqq al-yaqeen: three arches one behind another; with each level the camera moves through the next arch, until
 *  the last opens into light. */
export function ArchesDeeper({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  const lit = Math.min(v.items, 3);
  const arch = (s: number) => { const w = 300 * s, x = 380 - w / 2, top = 560 - 440 * s; return `M${x} 570 L${x} ${top + w / 2} A${w / 2} ${w / 2} 0 0 1 ${x + w} ${top + w / 2} L${x + w} 570 Z`; };
  return (
    <Panel label={`${label}: ${lit} of 3`} tone="dusk">
      <motion.div className="absolute inset-0" initial={false} animate={{ scale: reduce ? 1 : [1, 1.12, 1.3, 1.55][lit] }} style={{ transformOrigin: '50% 70%' }} transition={{ duration: 2.2, ease }}>
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 760 570" aria-hidden="true">
          {[1.2, 0.85, 0.55].map((s, i) => (
            <motion.path key={s} d={arch(s)} fill={['#1F2A30', '#4A2A1E', '#FFE7B0'][i]} stroke={GOLD} strokeOpacity={0.5} strokeWidth={1.5}
              initial={false} animate={{ opacity: i < lit ? 1 : 0.12 }} transition={{ duration: 1.2 }} />
          ))}
        </svg>
        {lit >= 3 && <Bloom x={50} y={72} size={36} />}
        {lit >= 3 && <Motes count={14} seed={61} box={{ x: 38, y: 50, w: 24, h: 40 }} />}
      </motion.div>
      {THROUGH.slice(0, lit).map((w, i) => <Caption key={w} style={{ left: '6%', top: `${8 + i * 12}%` }} delay={0.6}>{`${i + 1}. ${w}`}</Caption>)}
      {v.evidence && <Word ar="حَقُّ ٱلْيَقِينِ" style={{ left: '50%', top: '88%' }} color="#3A2608" size={46} delay={0.6} glow={false} />}
    </Panel>
  );
}

/** p22 The wow: "From hearing to seeing". A misted glass with condensation fills the panel over the dawn horizon.
 *  Hearing: the words arrive as ripples on the glass. Seeing (first phrase): a swipe clears the mist from one corner.
 *  Inside (second phrase): the camera pushes through the glass into the light while dust streams past. */
export function MistToSight({ labels, label }: { labels: (string | null)[]; label: string }) {
  const reduce = useReducedMotion();
  const stage = labels.filter(Boolean).length; // 0 hearing, 1 seeing, 2 inside
  useCue('whoosh', stage >= 1, 0.2);
  useCue('reveal', stage >= 2, 0.8);
  const r = rng(71);
  return (
    <motion.div className="absolute left-[680px] top-[184px] h-[590px] w-[830px] overflow-hidden rounded-[22px]" role="img" aria-label={`${label}: ${['hearing', 'seeing', 'inside'][stage]}`}
      style={{ boxShadow: '0 50px 90px -40px rgba(5,15,22,0.9), 0 0 0 1px rgba(232,194,122,0.25)' }}>
      <motion.div className="absolute inset-0" initial={false} animate={{ scale: stage >= 2 && !reduce ? 1.6 : 1 }} transition={{ duration: 3.6, ease: [0.65, 0, 0.35, 1] }}>
        <Stage tone="dusk" />
        <Layer name={A('horizon')} filter="none" style={{ objectFit: 'cover' }} />
        {stage >= 1 && <Beam x={50} y={74} angle={180} length={90} width={60} opacity={0.5} />}
        {stage >= 2 && <Bloom x={50} y={72} size={70} strength={0.8} />}
        <motion.div className="absolute inset-0" aria-hidden="true"
          style={{ background: 'linear-gradient(180deg, rgba(228,234,238,0.88), rgba(206,216,222,0.82))' }}
          initial={false}
          animate={{ clipPath: stage >= 1 ? 'ellipse(0% 0% at 10% 90%)' : 'ellipse(150% 150% at 10% 90%)' }}
          transition={{ duration: reduce ? 0 : 2.2, ease: [0.5, 0, 0.2, 1] }}>
          {Array.from({ length: 40 }, (_, i) => (
            <span key={i} className="absolute rounded-full" style={{ left: `${r() * 100}%`, top: `${r() * 100}%`, width: 3 + r() * 8, height: 3 + r() * 10, background: 'radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95), rgba(170,190,200,0.25))' }} />
          ))}
        </motion.div>
        {stage === 0 && !reduce && [0, 1, 2, 3].map((i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 h-[120px] w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2" aria-hidden="true"
            style={{ borderColor: 'rgba(14,26,34,0.3)' }}
            animate={{ scale: [0.3, 3.4], opacity: [0.8, 0] }} transition={{ duration: 3.2, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }} />
        ))}
      </motion.div>
      {stage >= 2 && !reduce && Array.from({ length: 24 }, (_, i) => {
        const a = r() * Math.PI * 2, d = 40 + r() * 40;
        return <motion.span key={i} className="pointer-events-none absolute left-1/2 top-[66%] h-[3px] w-[3px] rounded-full bg-[#FFF4D6]" aria-hidden="true"
          style={{ boxShadow: '0 0 8px rgba(255,236,190,0.9)' }}
          initial={{ x: 0, y: 0, opacity: 0, scale: 0.5 }} animate={{ x: Math.cos(a) * d * 8, y: Math.sin(a) * d * 5, opacity: [0, 1, 0], scale: [0.5, 2.5] }}
          transition={{ duration: 2.4, delay: 0.6 + r() * 2, repeat: Infinity, ease: 'easeIn' }} />;
      })}
      {stage === 0 && <Kinetic text="You heard it." style={{ left: '50%', top: '44%' }} size={44} color={INK} />}
      {labels[0] && <Word ar={labels[0]} style={{ left: '70%', top: '18%' }} size={60} delay={1.6} />}
      {labels[1] && <Word ar={labels[1]} style={{ left: '30%', top: '18%' }} size={60} delay={1} />}
      {stage >= 1 && <Caption style={{ left: '50%', top: '84%' }} align="center" delay={stage >= 2 ? 3 : 1.8}>{stage >= 2 ? 'This is where the course wants to take you' : 'You see it'}</Caption>}
      <Film leak={stage >= 1} />
    </motion.div>
  );
}

/* ---------- Athar ---------- */

/** p23 Hanzalah: the lane to a lit doorway; the lamp flickers; a dotted path is drawn from the gathering to the home,
 *  and the reply is set beneath it. */
export function LaneTwoStates({ v, label }: { v: Built; label: string }) {
  const reduce = useReducedMotion();
  return (
    <Panel label={label} still="lane">
      <motion.span className="absolute left-[49%] top-[58%] h-[26%] w-[14%] -translate-x-1/2 -translate-y-1/2 rounded-full" aria-hidden="true"
        style={{ background: 'radial-gradient(circle, rgba(255,190,110,0.85), rgba(255,160,80,0) 70%)', mixBlendMode: 'screen' }}
        animate={reduce ? { opacity: 0.8 } : { opacity: [0.6, 1, 0.7, 0.95, 0.6] }} transition={{ duration: 3, repeat: Infinity }} />
      {v.lines >= 1 && (
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <motion.path d="M20 26 C30 50 40 58 48 60" fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="2 6" vectorEffect="non-scaling-stroke"
            initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.8, delay: 0.6, ease }} />
        </svg>
      )}
      {v.lines >= 1 && <Caption style={{ left: '5%', top: '6%' }} ar="كَأنَّا رَأيُ عَينٍ" delay={0.2}>At the gathering</Caption>}
      {v.lines >= 1 && <Caption style={{ left: '56%', top: '44%' }} delay={1.8}>At home: we forgot</Caption>}
      {v.evidence && <Caption style={{ left: '50%', top: '78%' }} align="center" ar="ساعةً وساعةً" delay={0.5}>an hour and an hour</Caption>}
    </Panel>
  );
}

/** p24 Friday, then Monday: notification cards stack up on the laptop screen one after another; then the way back is
 *  named. */
export function MondayPile({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  return (
    <>
      {v.lines >= 1 && <Caption style={{ left: '6%', top: '20%' }} delay={0.2}>Friday: moved</Caption>}
      {v.lines >= 2 && [0, 1, 2, 3, 4].map((i) => (
        <motion.span key={i} className="pointer-events-none absolute h-[5%] w-[16%] rounded-[6px]" aria-hidden="true"
          style={{ left: '60%', top: `${44 + i * 3.2}%`, background: 'rgba(250,250,252,0.92)', boxShadow: '0 6px 14px -6px rgba(0,0,0,0.6)', borderLeft: `4px solid ${P.crimson}` }}
          initial={reduce ? false : { opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.3 + i * 0.35, ease }} />
      ))}
      {v.lines >= 3 && <Caption style={{ left: '6%', top: '76%' }} delay={0.4}>Go back to the source</Caption>}
      <Film />
    </>
  );
}

/** p25–28 The cases: a single desk light on a dark page, and the thin outline of a khatam star turning slowly. */
export function CaseLight({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0">
      <Stage />
      <Beam x={52} y={-10} angle={0} length={80} width={50} opacity={0.35} />
      <motion.svg className="absolute left-1/2 top-[48%] h-[54%] w-[54%] -translate-x-1/2 -translate-y-1/2" viewBox="-60 -60 120 120" aria-hidden="true"
        animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}>
        <path d="M0 -50 L14 -34 L35 -35 L34 -14 L50 0 L34 14 L35 35 L14 34 L0 50 L-14 34 L-35 35 L-34 14 L-50 0 L-34 -14 L-35 -35 L-14 -34 Z" fill="none" stroke={GOLD} strokeOpacity={v.interaction ? 0.7 : 0.3} strokeWidth="0.8" />
        <rect x="-26" y="-26" width="52" height="52" fill="none" stroke={GOLD} strokeOpacity="0.25" strokeWidth="0.6" transform="rotate(45)" />
      </motion.svg>
      {v.interaction && <Motes count={12} seed={83} box={{ x: 35, y: 30, w: 30, h: 40 }} />}
      <Film leak={false} />
    </div>
  );
}

/* ---------- Ahd ---------- */

/** p30 Zad al-Yaqeen: a leather notebook opens in three dimensions onto bone pages; a pen writes the first line. */
export function NotebookOpens({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pen', v.lines >= 2, 0.9);
  return (
    <div className="absolute inset-0" style={{ perspective: 1400 }}>
      <Stage />
      <Beam x={40} y={-10} angle={12} length={90} width={60} opacity={0.3} />
      <div className="absolute left-[14%] right-[10%] top-[18%] bottom-[14%]" style={{ transformStyle: 'preserve-3d', transform: 'rotateX(18deg)' }}>
        <div className="absolute inset-0 rounded-[10px] px-[7%] pt-[12%]" style={{ background: `repeating-linear-gradient(180deg, ${BONE} 0 46px, #D9CDB9 46px 47px)`, boxShadow: '0 50px 80px -30px rgba(0,0,0,0.9)' }}>
          <span lang="ar" dir="rtl" className="absolute right-[7%] top-[3%] font-serif text-[32px] font-bold" style={{ color: P.copper }}>زاد اليقين</span>
          {v.lines >= 2 && (
            <motion.span className="block font-serif text-[32px] italic leading-[47px]" style={{ color: INK }}
              initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 2.4, delay: 1, ease: 'linear' }}>
              I am now certain that…
            </motion.span>
          )}
          {v.lines >= 3 && <span className="mt-[47px] block font-sans text-[20px] font-semibold" style={{ color: '#6B6157' }}>This week: ______________</span>}
        </div>
        <motion.div className="absolute inset-0 rounded-[10px]" aria-hidden="true"
          style={{ background: 'linear-gradient(135deg, #4A2C1C, #1E120C)', transformOrigin: 'left center', backfaceVisibility: 'hidden', boxShadow: 'inset 0 0 0 3px rgba(232,194,122,0.35)' }}
          initial={reduce ? { opacity: 0 } : { rotateY: 0 }} animate={reduce ? { opacity: 0 } : { rotateY: -165 }} transition={{ duration: 1.8, delay: 0.3, ease: [0.6, 0, 0.2, 1] }}>
          <span lang="ar" dir="rtl" className="absolute inset-0 flex items-center justify-center font-serif text-[48px] font-bold" style={{ color: GOLD }}>زاد اليقين</span>
        </motion.div>
      </div>
      <Film leak={false} />
    </div>
  );
}

/** p31 Next time: the stars come out over the desert, one crosses the sky, and the first question is written. */
export function FirstQuestionSky({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  return (
    <>
      <Stars count={50} seed={31} top={70} />
      {v.lines >= 3 && !reduce && (
        <motion.span className="pointer-events-none absolute block h-[2px] w-[160px] rounded-full" aria-hidden="true"
          style={{ background: 'linear-gradient(90deg, rgba(255,246,216,0), #FFF6D8)', boxShadow: '0 0 12px 2px rgba(255,236,170,0.8)', rotate: '18deg' }}
          initial={{ left: '5%', top: '10%', opacity: 0 }} animate={{ left: '60%', top: '30%', opacity: [0, 1, 0] }} transition={{ duration: 1.4, delay: 0.5, ease: 'easeIn' }} />
      )}
      {v.lines >= 3 && <Kinetic text="Is there a Maker at all?" style={{ left: '40%', top: '70%' }} size={40} delay={1.4} />}
      <Film leak={false} />
    </>
  );
}
