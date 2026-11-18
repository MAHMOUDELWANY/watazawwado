import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTime, useTransform, type MotionValue } from 'motion/react';
import { ZadRig } from '../../../zad/ZadRig';

/**
 * The hero's right side: Zad (3D where WebGL is there, SVG otherwise) standing on a gold khatam medallion, the four
 * kinds of provision (the academy's 3D medals) orbiting him on a tilted ring, and the whole stage leaning toward the mouse in layers (parallax
 * depth: back glow, medallion, orbit, Zad). Decorative; the heading says the same in words.
 */

// The four kinds of provision as the academy's own 3D medals (public/badges/shelf, the student portal's badge renders).
export const SUBJECT_MEDALS = [
  { id: 'surah', l: { en: 'Quran', ar: 'القرآن' } },
  { id: 'tajweed', l: { en: 'Tajweed', ar: 'التجويد' } },
  { id: 'zad-level', l: { en: 'Zad Path', ar: 'منهج زاد' } },
  { id: 'language-level', l: { en: 'Arabic · English', ar: 'العربية · الإنجليزية' } },
] as const;
const ORBIT = SUBJECT_MEDALS;

export function Medal({ id, className, eager }: { id: string; className?: string; eager?: boolean }) {
  return <img src={`/badges/shelf/${id}.webp`} alt="" aria-hidden="true" width={180} height={180} loading={eager ? 'eager' : 'lazy'} decoding="async" draggable={false} className={`select-none object-contain drop-shadow-[0_18px_22px_rgba(28,20,17,0.45)] ${className ?? ''}`} />;
}

function Khatam({ className }: { className?: string }) {
  // Eight-point khatam: two squares turned 45° to each other, gold foil gradient, fine inner line.
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="hero-foil" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D58E" /><stop offset=".45" stopColor="#E5A93C" /><stop offset=".55" stopColor="#FFF1C9" /><stop offset="1" stopColor="#B4552F" />
        </linearGradient>
      </defs>
      <g transform="translate(100 100)">
        <rect x="-62" y="-62" width="124" height="124" rx="10" fill="none" stroke="url(#hero-foil)" strokeWidth="3" />
        <rect x="-62" y="-62" width="124" height="124" rx="10" fill="none" stroke="url(#hero-foil)" strokeWidth="3" transform="rotate(45)" />
        <circle r="44" fill="none" stroke="url(#hero-foil)" strokeWidth="1.2" strokeDasharray="2 5" />
        <circle r="84" fill="none" stroke="url(#hero-foil)" strokeOpacity=".5" strokeWidth=".8" />
      </g>
    </svg>
  );
}

/**
 * Phones (owner, 2026-11-18): the brand line written around Zad, the first half over the top of the circle, the
 * second under it. Each half slides in from its own side and settles on the circle.
 */
function RingText({ isEn, reduce }: { isEn: boolean; reduce: boolean }) {
  const top = isEn ? 'Provision that lasts,' : 'زادٌ يبقى،';
  const bottom = isEn ? 'for you and your family.' : 'لك ولأهل بيتك.';
  // Arabic cannot follow a curved path in Chrome (the letters lose their joins), so it sits on two straight lines,
  // above and below Zad, each sliding in from its own side.
  if (!isEn) {
    const slide = (from: string, delay: number) => (reduce ? {} : { initial: { x: from, opacity: 0 }, animate: { x: 0, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 70, damping: 16, delay } });
    return (
      <div className="lg:hidden absolute inset-0 z-30 pointer-events-none" aria-hidden="true">
        <motion.p className="absolute inset-x-0 top-[1%] text-center font-editorial font-bold text-[2.6rem] leading-none text-foreground" {...slide('60%', 0.2)}>{top}</motion.p>
        <motion.p className="absolute inset-x-0 bottom-[0%] text-center font-editorial font-bold text-[2.4rem] leading-tight text-ribbon" {...slide('-60%', 0.45)}>{bottom}</motion.p>
      </div>
    );
  }
  const enter = (from: number, delay: number) => (reduce ? {} : {
    initial: { rotate: from, opacity: 0 },
    animate: { rotate: 0, opacity: 1 },
    transition: { type: 'spring' as const, stiffness: 60, damping: 16, delay },
  });
  return (
    <svg viewBox="0 0 400 400" className="lg:hidden absolute inset-0 z-30 w-full h-full pointer-events-none overflow-visible" aria-hidden="true">
      <defs>
        <path id="ring-top" d="M -12 200 A 212 212 0 0 1 412 200" />
        <path id="ring-bottom" d="M 2 200 A 198 198 0 0 0 398 200" />
        <linearGradient id="ring-ribbon" x1="0" x2="1">
          <stop offset="0" stopColor="#C51F24" /><stop offset=".5" stopColor="#E5A93C" /><stop offset="1" stopColor="#087D91" />
        </linearGradient>
      </defs>
      <motion.g style={{ transformBox: 'view-box', transformOrigin: '200px 200px' }} {...enter(-100, 0.2)}>
        <text className="font-editorial font-medium" fontSize={34} style={{ fill: 'var(--foreground)' }}>
          <textPath href="#ring-top" startOffset="50%" textAnchor="middle">{top}</textPath>
        </text>
      </motion.g>
      <motion.g style={{ transformBox: 'view-box', transformOrigin: '200px 200px' }} {...enter(100, 0.45)}>
        <text className="font-editorial font-bold" fontSize={30} fill="url(#ring-ribbon)">
          <textPath href="#ring-bottom" startOffset="50%" textAnchor="middle">{bottom}</textPath>
        </text>
      </motion.g>
    </svg>
  );
}

export function HeroStage({ isEn, ringText = false }: { isEn: boolean; ringText?: boolean }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });
  const layer = (depth: number) => ({ x: useTransform(sx, (v) => v * depth), y: useTransform(sy, (v) => v * depth) });
  const back = layer(-10);
  const mid = layer(10);
  const front = layer(22);

  return (
    <div
      className="relative mx-auto w-full max-w-[520px] aspect-square select-none"
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
      aria-hidden="true"
    >
      {/* Back: the warm glow and a slowly turning medallion. */}
      <motion.div className="absolute inset-0" style={back}>
        <div className="absolute inset-[8%] rounded-full blur-3xl opacity-80" style={{ background: 'radial-gradient(closest-side, rgba(229,169,60,0.45), rgba(197,31,36,0.18) 60%, transparent)' }} />
        <motion.div className="absolute inset-[6%]" animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 120, repeat: Infinity, ease: 'linear' }}>
          <Khatam className="w-full h-full opacity-70" />
        </motion.div>
      </motion.div>

      {/* Middle: a small world behind Zad: a lit sphere, and two rings on different tilts (read as 3D orbits). */}
      <motion.div className="absolute inset-0" style={mid}>
        <div className="absolute inset-[22%] rounded-full bg-[radial-gradient(circle_at_35%_30%,rgba(255,241,201,0.55),rgba(229,169,60,0.22)_45%,rgba(180,85,47,0.12)_70%,transparent_72%)] shadow-[inset_-18px_-24px_50px_rgba(180,85,47,0.18)]" />
        <div className="absolute left-[6%] right-[6%] top-[39%] bottom-[39%] rounded-[50%] border border-[#E5A93C]/45 shadow-[0_0_30px_rgba(229,169,60,0.25)]" />
        <div className={`absolute inset-[10%] rounded-[50%] border border-dashed border-[#B4552F]/30 [transform:rotateX(70deg)_rotateY(-28deg)] ${reduce ? '' : 'animate-[spin_40s_linear_infinite_reverse]'}`} />
      </motion.div>
      {/* Front: Zad, standing on a soft pedestal of light (between the far and near halves of the orbit). */}
      <motion.div className="absolute inset-0 z-10 grid place-items-center" style={front}>
        <div className="relative">
          <div className="absolute left-1/2 bottom-[6%] w-[70%] h-[12%] -translate-x-1/2 rounded-[50%] bg-[#1C1411]/25 blur-xl" />
          <ZadRig pose="wave" size={230} />
        </div>
      </motion.div>
      {ORBIT.map((o, k) => <OrbitToken key={o.l.en} k={k} o={o} isEn={isEn} reduce={!!reduce} style={mid} />)}
      {ringText && <RingText isEn={isEn} reduce={!!reduce} />}
    </div>
  );
}

function OrbitToken({ k, o, isEn, reduce, style }: { k: number; o: (typeof ORBIT)[number]; isEn: boolean; reduce: boolean; style: { x: MotionValue<number>; y: MotionValue<number> } }) {
  const time = useTime();
  const phase = (k / ORBIT.length) * Math.PI * 2;
  const angle = useTransform(time, (ms) => (reduce ? phase : phase + (ms / 36000) * Math.PI * 2));
  const left = useTransform(angle, (a) => `${50 + Math.cos(a) * 39}%`);
  const top = useTransform(angle, (a) => `${50 + Math.sin(a) * 11}%`);
  const scale = useTransform(angle, (a) => 0.78 + 0.3 * ((Math.sin(a) + 1) / 2));
  const zIndex = useTransform(angle, (a) => (Math.sin(a) > 0 ? 20 : 5));
  const opacity = useTransform(angle, (a) => 0.55 + 0.45 * ((Math.sin(a) + 1) / 2));
  // The medal turns a little as it travels, so the gold catches the light.
  const spin = useTransform(angle, (a) => Math.cos(a) * 28);
  return (
    <motion.div className="absolute" style={{ left, top, zIndex, x: style.x, y: style.y }}>
      <motion.div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ scale, opacity }}>
        <motion.span className="block" style={{ rotateY: spin }}><Medal id={o.id} eager className="w-[70px] h-[70px] sm:w-[92px] sm:h-[92px]" /></motion.span>
        <span className="-mt-1 rounded-full bg-background/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-foreground ring-1 ring-border whitespace-nowrap backdrop-blur">{isEn ? o.l.en : o.l.ar}</span>
      </motion.div>
    </motion.div>
  );
}
