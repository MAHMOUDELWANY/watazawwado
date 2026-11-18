import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTime, useTransform, type MotionValue } from 'motion/react';
import { MushafEmblem, PathEmblem } from '../../emblems/DoorEmblems';
import { ZadRig } from '../../../zad/ZadRig';

/**
 * The hero's right side: Zad (3D where WebGL is there, SVG otherwise) standing on a gold khatam medallion, the four
 * kinds of provision orbiting him on a tilted ring, and the whole stage leaning toward the mouse in layers (parallax
 * depth: back glow, medallion, orbit, Zad). Decorative; the heading says the same in words.
 */

const ORBIT = [
  { l: { en: 'Quran', ar: 'القرآن' }, g: <MushafEmblem className="w-9 h-9 sm:w-11 sm:h-11" /> },
  { l: { en: 'Zad Path', ar: 'منهج زاد' }, g: <PathEmblem className="w-9 h-9 sm:w-11 sm:h-11" /> },
  { l: { en: 'Arabic', ar: 'العربية' }, g: <span lang="ar" className="font-editorial font-bold text-3xl text-[#F6D58E] leading-none">ض</span> },
  { l: { en: 'English', ar: 'الإنجليزية' }, g: <span lang="en" className="font-editorial font-bold text-2xl text-[#F6D58E] leading-none">Aa</span> },
];

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

export function HeroStage({ isEn }: { isEn: boolean }) {
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

      {/* Middle: the orbit ring (an ellipse read as a tilted circle). */}
      <motion.div className="absolute inset-0" style={mid}>
        <div className="absolute left-[6%] right-[6%] top-[39%] bottom-[39%] rounded-[50%] border border-[#E5A93C]/45 shadow-[0_0_30px_rgba(229,169,60,0.25)]" />
      </motion.div>
      {/* Front: Zad, standing on a soft pedestal of light (between the far and near halves of the orbit). */}
      <motion.div className="absolute inset-0 z-10 grid place-items-center" style={front}>
        <div className="relative">
          <div className="absolute left-1/2 bottom-[6%] w-[70%] h-[12%] -translate-x-1/2 rounded-[50%] bg-[#1C1411]/25 blur-xl" />
          <ZadRig pose="wave" size={230} />
        </div>
      </motion.div>
      {ORBIT.map((o, k) => <OrbitToken key={o.l.en} k={k} o={o} isEn={isEn} reduce={!!reduce} style={mid} />)}
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
  const opacity = useTransform(angle, (a) => 0.65 + 0.35 * ((Math.sin(a) + 1) / 2));
  return (
    <motion.div className="absolute" style={{ left, top, zIndex, x: style.x, y: style.y }}>
      <motion.div className="-translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1" style={{ scale, opacity }}>
        <span className="grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-[linear-gradient(160deg,#3B2219,#1C1411)] ring-1 ring-[#F6D58E]/30 shadow-[inset_0_1px_1px_rgba(246,213,142,0.25),0_18px_30px_-12px_rgba(28,20,17,0.6)]">{o.g}</span>
        <span className="rounded-full bg-background/90 px-2 py-0.5 text-[10px] sm:text-xs font-bold text-foreground ring-1 ring-border whitespace-nowrap">{isEn ? o.l.en : o.l.ar}</span>
      </motion.div>
    </motion.div>
  );
}
