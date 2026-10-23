import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from '../Art';
import { Layer, src, type Built } from '../Scenes';
import { useCue } from '../sfx';
import { DepthStill, type Shot, type Light } from '../DepthStill';

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

/* ---------- v3: the documentary reel (owner, 2026-10-23: "cinematic documentary"; the code-drawn diagrams looked
   cheap). A real still is the hero of every idea page, moving in real depth (its depth map: DepthStill). On each build
   step the camera travels to the detail the line is about and the focus pulls to it; between steps it breathes. One
   lower-third at a time. Stills without a depth map fall back to a flat camera move; a missing still to a title card.
   Shots: x, y = where the camera looks (% of the photo), z = zoom, focus = depth in focus (0 far … 1 near),
   pan = sideways parallax. ---------- */

/** Translation (in % of the box) that brings (x, y) to the centre at zoom z, clamped so the still always covers the box. */
function aim({ x, y, z }: Shot) {
  const room = 50 * (1 - 1 / z);
  const c = (d: number) => Math.max(-room, Math.min(room, d));
  return { x: `${c(50 - x)}%`, y: `${c(50 - y)}%`, scale: z };
}

const at = (shots: Shot[], k: number) => shots[Math.max(0, Math.min(k, shots.length - 1))];

function Reel({ still, shots, k, ar, kicker, label, light, depth = true, tone = 'ink', grade = 'then', children }: {
  still: string; shots: Shot[]; k: number; ar: string; kicker?: string; label: string; light?: Light; depth?: boolean;
  tone?: 'ink' | 'dusk' | 'night'; grade?: 'then' | 'now'; children?: React.ReactNode;
}) {
  const reduce = Boolean(useReducedMotion());
  const [mode, setMode] = React.useState<'depth' | 'flat' | 'card'>(depth ? 'depth' : 'flat');
  const f = at(shots, k);
  const toFlat = React.useCallback(() => setMode('flat'), []);
  return (
    <motion.div className="absolute left-[720px] top-[184px] h-[570px] w-[760px] overflow-hidden rounded-[22px]" role="img" aria-label={label}
      style={{ boxShadow: '0 50px 90px -40px rgba(5,15,22,0.9), 0 0 0 1px rgba(232,194,122,0.18)', background: INK }}
      initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1.1, ease }}>
      {mode === 'depth' && (
        <DepthStill img={src(A(still))} depth={src(A(`${still}-depth`))} shot={f} light={light} grade={grade} still={reduce} onFail={toFlat} />
      )}
      {mode === 'flat' && (
        <motion.div className="absolute inset-0 will-change-transform" initial={reduce ? false : aim({ ...shots[0], z: shots[0].z * 1.06 })}
          animate={aim(f)} transition={{ duration: reduce ? 0 : 3.2, ease: [0.45, 0, 0.2, 1] }}>
          <img src={src(A(still))} alt="" aria-hidden="true" draggable={false} onError={() => setMode('card')}
            className="absolute inset-0 h-full w-full select-none object-cover" />
        </motion.div>
      )}
      {mode === 'card' && (
        <>
          <Stage tone={tone} />
          <Word ar={ar} style={{ left: '50%', top: '44%' }} size={ar.length > 12 ? 70 : 104} delay={0.3} />
          {kicker && <Kinetic text={kicker} style={{ left: '50%', top: '62%' }} size={26} delay={1} color="rgba(239,232,220,0.75)" />}
        </>
      )}
      {children}
      <Film leak={false} />
    </motion.div>
  );
}

/** One lower-third at a time, as in a documentary: step n replaces the caption with point n. */
function Thirds({ items, k, from = 0 }: { items: { en: string; ar?: string }[]; k: number; from?: number }) {
  const i = Math.min(k - from, items.length) - 1;
  if (i < 0) return null;
  const t = items[i];
  return <Caption key={t.en} ar={t.ar} style={{ left: '5%', bottom: '6%' }} delay={0.3}>{t.en}</Caption>;
}

/** How many build steps of a study page are showing (text first in Adults, then lines and items). */
const shown = (v: Built) => (v.evidence ? 1 : 0) + v.lines + v.items;

/* ---------- Zad: the questions ---------- */

const PILLARS = [
  { en: 'The two testimonies', ar: 'الشهادتان' }, { en: 'Salah', ar: 'الصلاة' }, { en: 'Zakah', ar: 'الزكاة' },
  { en: 'Fasting Ramadan', ar: 'الصوم' }, { en: 'Hajj', ar: 'الحج' },
];
/** Islam: palm-trunk columns in the old mosque. As each pillar is named, focus and camera move to the next column, far
 *  to near, until the nearest stands sharp in front of us. */
export function ColumnsRise({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="pillars" ar="الإسلام" kicker="What a Muslim does" label={label} k={k} light={{ x: 62, y: -8, strength: 0.7 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.5, pan: -0.6 }, { x: 46, y: 46, z: 1.15, focus: 0.4, pan: -0.2 },
        { x: 54, y: 50, z: 1.2, focus: 0.4, pan: 0.1 }, { x: 58, y: 52, z: 1.22, focus: 0.55, pan: 0.3 },
        { x: 38, y: 45, z: 1.5, focus: 0.36, pan: -0.5 }, { x: 46, y: 45, z: 1.5, focus: 0.46, pan: -0.3 },
        { x: 56, y: 47, z: 1.45, focus: 0.57, pan: 0 }, { x: 69, y: 50, z: 1.4, focus: 0.72, pan: 0.3 },
        { x: 82, y: 50, z: 1.25, focus: 0.93, pan: 0.6 },
      ]}>
      {k === 3 && <Caption style={{ left: '5%', top: '6%' }} delay={0.6}>"You are right." He already knew.</Caption>}
      <Thirds items={PILLARS} k={k} from={3} />
    </Reel>
  );
}

const SIX = [{ en: 'Allah' }, { en: 'His angels' }, { en: 'His books' }, { en: 'His messengers' }, { en: 'The Last Day' }, { en: 'Qadar' }];
/** Iman, the unseen: a quiet room before fajr. With each of the six the camera rises from the prayer mat to the window
 *  and the focus travels out to the last stars. */
export function SixLights({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="window" ar="الإيمان" kicker="What a Muslim holds true" label={label} k={k} grade="now" tone="night" light={{ x: 91, y: 57, strength: 0.45 }}
      shots={[
        { x: 50, y: 55, z: 1.02, focus: 0.6, pan: -0.4 }, { x: 36, y: 76, z: 1.3, focus: 0.88, pan: -0.3 },
        { x: 58, y: 52, z: 1.15, focus: 0.5, pan: 0 }, { x: 62, y: 46, z: 1.2, focus: 0.4, pan: 0.1 },
        { x: 64, y: 41, z: 1.3, focus: 0.3, pan: 0.2 }, { x: 66, y: 37, z: 1.4, focus: 0.2, pan: 0.3 },
        { x: 67, y: 34, z: 1.5, focus: 0.12, pan: 0.35 }, { x: 67, y: 31, z: 1.6, focus: 0.06, pan: 0.4 },
        { x: 66, y: 33, z: 1.35, focus: 0.05, pan: 0.2 },
      ]}>
      <Thirds items={SIX} k={k} from={2} />
    </Reel>
  );
}

/** Ihsan: one person praying alone, seen from behind. The focus settles on him at "as if you see Him", then the camera
 *  moves into the light falling just ahead of him. */
export function IhsanSteps({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="prayer" ar="كأنك تراه" kicker="As if you see Him" label={label} k={k} grade="now" light={{ x: 87, y: 12, strength: 0.9 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.3, pan: -0.5 }, { x: 50, y: 45, z: 1.28, focus: 0.58, pan: 0 },
        { x: 56, y: 64, z: 1.45, focus: 0.62, pan: 0.3 }, { x: 52, y: 42, z: 1.15, focus: 0.45, pan: 0.1 },
      ]}>
      {k >= 1 && <Caption ar="كَأنَّك تَراه" style={{ left: '5%', top: '6%' }} delay={1.2}>as if you see Him</Caption>}
      {k >= 2 && <Caption ar="فإنَّه يَراك" style={{ left: '5%', bottom: '6%' }} delay={0.4}>if not, He sees you</Caption>}
    </Reel>
  );
}

/** The Hour: the hourglass sharp on its ledge, then the falling sand, then the focus leaves it for the open desert
 *  through the door: so who is he? */
export function HourglassRuns({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="hourglass" ar="الساعة" kicker="Its time is with Allah alone" label={label} k={k} light={{ x: 81, y: 27, strength: 1 }}
      shots={[
        { x: 55, y: 50, z: 1.02, focus: 0.4, pan: 0.5 }, { x: 31, y: 45, z: 1.5, focus: 0.92, pan: -0.3 },
        { x: 31, y: 60, z: 1.8, focus: 0.92, pan: -0.2 }, { x: 76, y: 40, z: 1.3, focus: 0.1, pan: 0.4 },
      ]}>
      {k >= 2 && <Caption style={{ left: '5%', bottom: '6%' }} delay={0.4}>Certain, and hidden</Caption>}
    </Reel>
  );
}

/** The reveal: the open doorway, the bright morning outside, footprints that lead out and stop. */
export function FarLightOpens({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  useCue('reveal', k >= 1, 0.3);
  return (
    <Reel still="doorway" ar="جبريل" kicker="He came to teach you your deen" label={label} k={k} tone="night" light={{ x: 55, y: 42, strength: 1 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.55, pan: -0.4 }, { x: 57, y: 55, z: 1.3, focus: 0.2, pan: 0 },
        { x: 60, y: 82, z: 1.6, focus: 0.45, pan: 0.2 }, { x: 55, y: 46, z: 1.15, focus: 0.15, pan: 0.1 },
      ]}>
      {k >= 1 && <Caption ar="جِبريلُ" style={{ left: '5%', top: '6%' }} delay={1.4}>Jibril</Caption>}
      {k >= 2 && <Caption ar="يُعَلِّمُكُم دينَكُم" style={{ left: '5%', bottom: '6%' }} delay={0.4}>to teach you your deen</Caption>}
    </Reel>
  );
}

const LEVELS = [{ en: 'Islam: what I do', ar: 'الإسلام' }, { en: 'Iman: what I hold true', ar: 'الإيمان' }, { en: 'Ihsan: as if I see Him', ar: 'الإحسان' }];
/** Three levels of one deen: the old mosque from above, three nested spaces; the camera descends through each and the
 *  focus moves inward with it. */
export function RingsInward({ labels, label }: { labels: (string | null)[]; label: string }) {
  const k = labels.filter(Boolean).length;
  return (
    <Reel still="above" ar="دين واحد" kicker="Three depths of one deen" label={label} k={k} light={{ x: 18, y: 8, strength: 0.3 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.75, pan: 0 }, { x: 50, y: 52, z: 1.12, focus: 0.8, pan: -0.3 },
        { x: 48, y: 46, z: 1.35, focus: 0.85, pan: 0 }, { x: 48, y: 40, z: 1.7, focus: 0.92, pan: 0.3 },
      ]}>
      <Thirds items={LEVELS} k={k} />
    </Reel>
  );
}

/* ---------- Zad: knowing and seeing ---------- */

const GAP = [{ en: 'Knowing: you were told, and you agree' }, { en: 'Certain knowledge: it has reached the heart' }, { en: 'Seeing it: failing to act becomes rare' }];
/** Where the gap is: the shelf of books (all we know), the phone glowing on the desk (what pulls us), the empty chair
 *  (nobody sitting with it). */
export function GapSteps({ labels, label }: { labels: (string | null)[]; label: string }) {
  const k = labels.filter(Boolean).length;
  return (
    <Reel still="shelf" ar="تعرف… أم ترى؟" kicker="Knowing is not yet seeing" label={label} k={k} grade="now" light={{ x: 84, y: 24, strength: 0.6 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.5, pan: -0.3 }, { x: 72, y: 34, z: 1.4, focus: 0.55, pan: 0.2 },
        { x: 64, y: 70, z: 1.6, focus: 0.76, pan: 0.3 }, { x: 42, y: 56, z: 1.18, focus: 0.84, pan: -0.4 },
      ]}>
      <Thirds items={GAP} k={k} />
    </Reel>
  );
}

/** At-Takathur 102:1–2: the graves in late light (no depth map yet: a flat camera move). */
export function ShadowsLengthen({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="graves" ar="ألهاكم التكاثر" label={label} k={k} depth={false}
      shots={[
        { x: 50, y: 45, z: 1.08, focus: 0.5 }, { x: 62, y: 60, z: 1.35, focus: 0.5 },
        { x: 45, y: 70, z: 1.5, focus: 0.5 }, { x: 50, y: 50, z: 1.05, focus: 0.5 },
      ]}>
      {k >= 1 && <Caption style={{ left: '5%', top: '6%' }} delay={1}>Busy, all the way here</Caption>}
      {k >= 3 && <Caption ar="زُرْتُمُ" style={{ left: '5%', bottom: '6%' }} delay={0.4}>visited: guests, not residents</Caption>}
    </Reel>
  );
}

/** A depth still filling a painting (story, question and journal pages), its shot chosen by the page's build step. */
function PaintingDepth({ name, shots, k, light, grade = 'then' }: { name: string; shots: Shot[]; k: number; light?: Light; grade?: 'then' | 'now' }) {
  const reduce = Boolean(useReducedMotion());
  const [ok, setOk] = React.useState(true);
  const fail = React.useCallback(() => setOk(false), []);
  return ok ? <DepthStill img={src(A(name))} depth={src(A(`${name}-depth`))} shot={at(shots, k)} light={light} grade={grade} still={reduce} onFail={fail} /> : null;
}
const steps = (v: Built) => (v.evidence ? 1 : 0) + v.lines + v.items + (v.interaction ? 1 : 0);

/** "My wealth, my wealth": the bowl of dates (ate), the robe (wore), the purse with coins (gave); at the question the
 *  three fates come in. */
export function CountersFade({ v }: { v: Built }) {
  const items = [{ en: 'Ate: used up' }, { en: 'Wore: worn out' }, { en: 'Gave: sent ahead' }];
  return (
    <>
      <PaintingDepth name="purse" k={steps(v)} light={{ x: 20, y: 10, strength: 0.4 }} shots={[
        { x: 60, y: 60, z: 1.02, focus: 0.7, pan: -0.3 }, { x: 65, y: 65, z: 1.35, focus: 0.86, pan: -0.1 },
        { x: 80, y: 45, z: 1.35, focus: 0.8, pan: 0.2 }, { x: 74, y: 76, z: 1.5, focus: 0.95, pan: 0.3 },
      ]} />
      {v.interaction && <Caption style={{ right: '6%', bottom: '6%' }} delay={0.4}>{items.map((t) => t.en).join(' · ')}</Caption>}
      <Film leak={false} />
    </>
  );
}

/** 'Ilm al-yaqeen: the listener sharp at the back of the mosque; then the focus travels to the lamps far ahead, the
 *  source of what he hears. */
export function SoundToHeart({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="listening" ar="عِلْمَ ٱلْيَقِينِ" kicker="Knowledge from a true report" label={label} k={k} grade="now" tone="night" light={{ x: 63, y: 24, strength: 0.6 }}
      shots={[
        { x: 50, y: 50, z: 1.02, focus: 0.9, pan: -0.3 }, { x: 42, y: 60, z: 1.3, focus: 0.95, pan: -0.2 },
        { x: 62, y: 34, z: 1.45, focus: 0.15, pan: 0.3 },
      ]}>
      {k >= 2 && <Caption ar="عِلْمَ ٱلْيَقِينِ" style={{ left: '5%', bottom: '6%' }} delay={0.4}>heard, and certain</Caption>}
    </Reel>
  );
}

/** 'Ayn al-yaqeen: the empty seat sharp, the world outside soft; then the focus goes through the glass and the
 *  landscape comes sharp in the first sun. */
export function EyeOpens({ v, label }: { v: Built; label: string }) {
  const k = shown(v);
  return (
    <Reel still="train" ar="عَيْنَ ٱلْيَقِينِ" kicker="Certainty by seeing" label={label} k={k} grade="now" light={{ x: 93, y: 37, strength: 1 }}
      shots={[
        { x: 40, y: 50, z: 1.02, focus: 0.9, pan: -0.5 }, { x: 65, y: 52, z: 1.3, focus: 0.15, pan: 0.2 },
        { x: 80, y: 46, z: 1.55, focus: 0.08, pan: 0.4 }, { x: 68, y: 50, z: 1.2, focus: 0.1, pan: 0.1 },
      ]}>
      {k >= 2 && <Caption ar="عَيْنَ ٱلْيَقِينِ" style={{ left: '5%', bottom: '6%' }} delay={0.4}>seen with the eyes</Caption>}
    </Reel>
  );
}

const ROAD = ['Iman', 'Taharah and Salah', 'The pillars', 'Ihsan'];
/** What this course is for: the caravan road at dawn; with each part of the course the camera travels further down it
 *  and the focus moves out to the lit town at the end. */
export function CourseArches({ labels, label }: { labels: (string | null)[]; label: string }) {
  const k = labels.filter(Boolean).length;
  return (
    <Reel still="road" ar="من العلم إلى الرؤية" kicker="From knowing to seeing" label={label} k={k} light={{ x: 31, y: 31, strength: 0.9 }}
      shots={[
        { x: 50, y: 55, z: 1.02, focus: 0.85, pan: -0.3 }, { x: 48, y: 62, z: 1.15, focus: 0.75, pan: -0.1 },
        { x: 52, y: 54, z: 1.3, focus: 0.5, pan: 0 }, { x: 58, y: 48, z: 1.5, focus: 0.3, pan: 0.2 },
        { x: 60, y: 44, z: 1.75, focus: 0.15, pan: 0.3 },
      ]}>
      <Thirds items={ROAD.map((en, i) => ({ en: `${i + 1}. ${en}` }))} k={k} />
    </Reel>
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

/** The cases: each one a still of today's world; the focus moves from the setting to what the case turns on. */
const caseScene = (name: string, shots: Shot[], light?: Light) => function CaseScene({ v }: { v: Built }) {
  return <><PaintingDepth name={name} k={steps(v)} shots={shots} light={light} grade="now" /><Film leak={false} /></>;
};
export const CaseLight = caseScene('canteen', [
  { x: 60, y: 60, z: 1.02, focus: 0.9, pan: 0.3 }, { x: 82, y: 66, z: 1.3, focus: 0.92, pan: 0.3 },
  { x: 50, y: 40, z: 1.35, focus: 0.35, pan: -0.3 }, { x: 52, y: 42, z: 1.4, focus: 0.35, pan: -0.2 },
]);
export const CaseTwo = caseScene('suitcase', [
  { x: 50, y: 55, z: 1.02, focus: 0.8, pan: -0.3 }, { x: 32, y: 74, z: 1.35, focus: 0.9, pan: -0.3 },
  { x: 76, y: 25, z: 1.4, focus: 0.1, pan: 0.3 }, { x: 46, y: 70, z: 1.2, focus: 0.85, pan: 0 },
], { x: 78, y: 22, strength: 0.4 });
export const CaseThree = caseScene('corridor', [
  { x: 50, y: 50, z: 1.02, focus: 0.3, pan: 0.3 }, { x: 74, y: 36, z: 1.5, focus: 0.15, pan: 0.3 },
  { x: 58, y: 82, z: 1.6, focus: 0.7, pan: -0.2 }, { x: 55, y: 60, z: 1.2, focus: 0.5, pan: 0 },
], { x: 92, y: 20, strength: 0.5 });
export const CaseFour = caseScene('phone', [
  { x: 50, y: 55, z: 1.02, focus: 0.8, pan: -0.3 }, { x: 58, y: 68, z: 1.5, focus: 0.95, pan: 0.2 },
  { x: 60, y: 40, z: 1.3, focus: 0.4, pan: 0.3 }, { x: 56, y: 62, z: 1.25, focus: 0.9, pan: 0 },
], { x: 63, y: 30, strength: 0.6 });

/** Zad al-Yaqeen: the notebook open on the desk at fajr; the focus moves from the window to the empty page, and the
 *  first line arrives as it would be written. */
export function NotebookOpens({ v }: { v: Built }) {
  const reduce = useReducedMotion();
  useCue('pen', v.lines >= 2, 0.9);
  return (
    <>
      <PaintingDepth name="notebook" k={Math.min(v.lines, 3)} light={{ x: 85, y: 12, strength: 0.7 }} shots={[
        { x: 70, y: 30, z: 1.05, focus: 0.15, pan: 0.3 }, { x: 60, y: 60, z: 1.2, focus: 0.7, pan: 0 },
        { x: 55, y: 70, z: 1.45, focus: 0.9, pan: -0.2 }, { x: 58, y: 66, z: 1.35, focus: 0.9, pan: -0.1 },
      ]} />
      {v.lines >= 2 && (
        <motion.div className="pointer-events-none absolute left-[8%] right-[8%] bottom-[8%] rounded-[12px] px-6 py-4"
          style={{ background: 'rgba(239,232,220,0.93)', boxShadow: '0 30px 60px -30px rgba(0,0,0,0.9)' }}
          initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease }}>
          <span lang="ar" dir="rtl" className="block font-serif text-[22px] font-bold" style={{ color: P.copper }}>زاد اليقين</span>
          <motion.span className="block font-serif text-[30px] italic" style={{ color: INK }}
            initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }} animate={{ clipPath: 'inset(0 0% 0 0)' }} transition={{ duration: 2.4, delay: 0.8, ease: 'linear' }}>
            I am now certain that…
          </motion.span>
        </motion.div>
      )}
      <Film leak={false} />
    </>
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
