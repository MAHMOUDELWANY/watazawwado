import React, { useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { P } from './Art';

/* ---------- Motion primitives for scene builds (docs/curriculum/RULES.md §1.10) ----------
   Code-drawn elements any lesson can add to its paintings: bursts and drifting particles, a toy-brick castle that
   builds itself, cut-out sprites, a magnifying lens and depth layers. Positions are % of the parent box unless noted.
   Under reduced motion everything shows its end state. */

const out = [0.23, 1, 0.32, 1] as const;

/** Deterministic random numbers, so a burst looks the same every time the page is shown. */
function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export const BRICK_COLORS = [P.crimson, P.teal, P.gold, '#F3E6CC', '#3E7CB1', '#5E9E4B'];

/* ---------- bursts: one moment (a crash, a poof, sparks) ---------- */

export type BurstKind = 'bricks' | 'sparks' | 'dust';

/** Pieces fly out from (x, y). Bricks fall and stay on `floor` (% of the box); sparks and dust fade away. */
export function Burst({ x, y, kind, count = 14, seed = 7, floor = 92, spread = 30, delay = 0 }: {
  x: number; y: number; kind: BurstKind; count?: number; seed?: number; floor?: number; spread?: number; delay?: number;
}) {
  const reduce = useReducedMotion();
  if (reduce && kind !== 'bricks') return null;
  const r = rng(seed);
  const pieces = Array.from({ length: count }, (_, i) => {
    const a = r() * Math.PI * 2;
    const d = spread * (0.35 + r() * 0.65);
    return { i, dx: Math.cos(a) * d, dy: Math.sin(a) * d * 0.7, rot: (r() - 0.5) * 720, s: 0.6 + r() * 0.8, c: BRICK_COLORS[i % BRICK_COLORS.length], t: r() * 0.15 };
  });
  return (
    <div className="pointer-events-none absolute inset-0 overflow-visible" aria-hidden="true">
      {pieces.map((p) => {
        const style: React.CSSProperties = { left: `${x}%`, top: `${y}%` };
        if (kind === 'bricks') {
          const endX = x + p.dx;
          const endY = Math.max(y, floor - p.s * 2);
          return (
            <motion.span
              key={p.i} className="absolute block rounded-[3px] border-2 border-black/25"
              style={{ ...style, width: 38 * p.s, height: 22 * p.s, background: p.c, marginLeft: -19 * p.s, marginTop: -11 * p.s, boxShadow: "0 6px 10px -4px rgba(30,20,16,0.5)" }}
              initial={reduce ? { left: `${endX}%`, top: `${endY}%`, rotate: p.rot / 4 } : { left: `${x}%`, top: `${y}%`, rotate: 0, opacity: 0 }}
              animate={{ left: [`${x}%`, `${x + p.dx * 0.6}%`, `${endX}%`], top: [`${y}%`, `${y + p.dy - 14}%`, `${endY}%`], rotate: p.rot, opacity: 1 }}
              transition={reduce ? { duration: 0 } : { duration: 0.9 + p.t, delay: delay + p.t, ease: ['easeOut', 'easeIn'], times: [0, 0.45, 1] }}
            />
          );
        }
        const size = kind === 'sparks' ? 7 * p.s : 34 * p.s;
        return (
          <motion.span
            key={p.i} className="absolute block rounded-full"
            style={{ ...style, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2,
              background: kind === 'sparks' ? '#FFE7A3' : 'rgba(225,212,190,0.85)',
              boxShadow: kind === 'sparks' ? '0 0 10px 3px rgba(255,214,120,0.9)' : undefined, filter: kind === 'dust' ? 'blur(3px)' : undefined }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{ x: `${p.dx * 6}px`, y: `${p.dy * 6}px`, opacity: [0, 1, 0], scale: kind === 'dust' ? 1.6 : 1 }}
            transition={{ duration: kind === 'dust' ? 1.1 : 0.8, delay: delay + p.t, ease: out }}
          />
        );
      })}
    </div>
  );
}

/* ---------- drift: something that keeps happening (a sandstorm, twinkling stars) ---------- */

/** Sand streaks blowing across the box from the left, on a loop. */
export function Sandstorm({ count = 40, seed = 3, strength = 1 }: { count?: number; seed?: number; strength?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const r = rng(seed);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const top = r() * 100;
        const len = 20 + r() * 50;
        const dur = (0.9 + r() * 0.9) / strength;
        return (
          <motion.span
            key={i} className="absolute block h-[3px] rounded-full"
            style={{ top: `${top}%`, width: len, background: 'linear-gradient(90deg, rgba(222,180,110,0), rgba(222,180,110,0.85))' }}
            initial={{ left: '-10%' }} animate={{ left: '110%' }}
            transition={{ duration: dur, delay: r() * 1.5, repeat: Infinity, ease: 'linear' }}
          />
        );
      })}
    </div>
  );
}

/** A shooting star crossing the box once, from (x1, y1) to (x2, y2). */
export function ShootingStar({ x1 = 15, y1 = 12, x2 = 70, y2 = 34, delay = 0 }: { x1?: number; y1?: number; x2?: number; y2?: number; delay?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return (
    <motion.span
      className="pointer-events-none absolute block h-[3px] w-[140px] rounded-full" aria-hidden="true"
      style={{ rotate: `${angle}deg`, transformOrigin: '100% 50%', marginLeft: -140, background: 'linear-gradient(90deg, rgba(255,246,216,0), #FFF6D8)', boxShadow: '0 0 12px 2px rgba(255,236,170,0.8)' }}
      initial={{ left: `${x1}%`, top: `${y1}%`, opacity: 0 }}
      animate={{ left: `${x2}%`, top: `${y2}%`, opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.1, delay, ease: 'easeIn' }}
    />
  );
}

/** Rings spreading out on water from (x, y), on a loop. */
export function Ripples({ x, y, w = 30, count = 3 }: { x: number; y: number; w?: number; count?: number }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <motion.span
          key={i} className="absolute block rounded-[50%] border-[3px] border-white/70"
          style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, aspectRatio: '3 / 1', translateX: '-50%', translateY: '-50%' }}
          initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: [0.6, 1.8], opacity: [0, 0.8, 0] }}
          transition={{ duration: 2.4, delay: i * 0.8, repeat: Infinity, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

/* ---------- a toy-brick castle that builds itself, brick by brick ---------- */

type Brick = { x: number; y: number; w: number; c: string };
const BW = 40;
const BH = 20;

/** Bricks from the bottom row up: a wall (x 160-440) with a gate gap and battlements, two towers. viewBox 0 0 600 420. */
const CASTLE: Brick[] = (() => {
  const bricks: Brick[] = [];
  let k = 0;
  const add = (x: number, y: number, w: number) => bricks.push({ x, y, w, c: BRICK_COLORS[k++ % 4] });
  for (let row = 0; row < 7; row++) {
    const y = 400 - row * BH;
    const segs: [number, number][] = row % 2
      ? [[160, 20], ...Array.from({ length: 6 }, (_, i) => [180 + i * BW, BW] as [number, number]), [420, 20]]
      : Array.from({ length: 7 }, (_, i) => [160 + i * BW, BW] as [number, number]);
    segs.forEach(([x, w], i) => {
      if (row < 4 && x + w > 262 && x < 338) return; // the gate
      if (row === 6 && i % 2) return; // battlements
      add(x, y, w);
    });
  }
  for (const tx of [80, 440]) {
    for (let row = 0; row < 11; row++) {
      const y = 400 - row * BH;
      if (row % 2) { add(tx, y, BW); add(tx + BW, y, BW); } else add(tx, y, 2 * BW);
    }
  }
  return bricks.sort((a, b) => b.y - a.y || a.x - b.x);
})();
export const CASTLE_BRICKS = CASTLE.length;

/** The castle. `built` raises the bricks (each drops in on its turn); `open` swings the gate open with light inside;
 *  `shine` sweeps a gold line over every brick (the pieces fit). */
export function BrickCastle({ built, open = false, shine = false, stagger = 0.045, className = '', style }: {
  built: boolean; open?: boolean; shine?: boolean; stagger?: number; className?: string; style?: React.CSSProperties;
}) {
  const reduce = useReducedMotion();
  const roofs = [{ x: 80 }, { x: 440 }];
  const after = reduce ? 0 : CASTLE.length * stagger;
  return (
    <svg viewBox="0 0 600 420" className={`absolute overflow-visible ${className}`} style={style} aria-hidden="true">
      <defs>
        <radialGradient id="gateGlow"><stop offset="0" stopColor="#FFE7A3" /><stop offset="1" stopColor="#FFE7A3" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx="300" cy="404" rx="270" ry="14" fill="rgba(60,30,10,0.18)" />
      {/* Light behind the gate, seen when it opens. */}
      <motion.rect x="262" y="320" width="76" height="80" fill="#FFE7A3" initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.6 }} />
      <motion.circle cx="300" cy="360" r="80" fill="url(#gateGlow)" initial={false} animate={{ opacity: open ? 0.9 : 0 }} transition={{ duration: 0.8 }} />
      {CASTLE.map((b, i) => (
        <motion.g
          key={i}
          initial={reduce ? false : { opacity: 0, y: -90 }}
          animate={built ? { opacity: 1, y: 0 } : { opacity: 0, y: -90 }}
          transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 26, delay: built ? i * stagger : 0 }}
        >
          <rect x={b.x + 1} y={b.y - BH + 1} width={b.w - 2} height={BH - 2} rx="3" fill={b.c} stroke="rgba(30,20,16,0.35)" strokeWidth="2" />
          {Array.from({ length: Math.round(b.w / 20) }, (_, s) => (
            <rect key={s} x={b.x + 6 + s * 20} y={b.y - BH - 4} width="9" height="5" rx="1.5" fill={b.c} stroke="rgba(30,20,16,0.3)" strokeWidth="1.5" />
          ))}
          {shine && (
            <motion.rect
              x={b.x + 1} y={b.y - BH + 1} width={b.w - 2} height={BH - 2} rx="3" fill="none" stroke="#FFE7A3" strokeWidth="3"
              initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0.35] }} transition={{ duration: 0.8, delay: reduce ? 0 : i * 0.02 }}
            />
          )}
        </motion.g>
      ))}
      {/* Gate arch and doors. */}
      <motion.g initial={reduce ? false : { opacity: 0 }} animate={{ opacity: built ? 1 : 0 }} transition={{ delay: built ? after * 0.6 : 0, duration: 0.4 }}>
        <path d="M258 320 Q300 280 342 320" fill="none" stroke={P.copper} strokeWidth="8" strokeLinecap="round" />
        {[0, 1].map((s) => (
          <motion.rect
            key={s} x={s ? 300 : 262} y="320" width="38" height="80" rx="3" fill="#7A4A2B" stroke="#3B2219" strokeWidth="2"
            style={{ transformBox: 'fill-box', transformOrigin: s ? '100% 50%' : '0% 50%' }}
            initial={false} animate={{ scaleX: open ? 0.14 : 1 }} transition={reduce ? { duration: 0 } : { duration: 0.9, ease: out }}
          />
        ))}
      </motion.g>
      {/* Tower roofs and the flag, last of all. */}
      <motion.g initial={reduce ? false : { opacity: 0, y: -40 }} animate={built ? { opacity: 1, y: 0 } : { opacity: 0, y: -40 }} transition={reduce ? { duration: 0 } : { delay: built ? after + 0.5 : 0, type: 'spring', stiffness: 300, damping: 20 }}>
        {roofs.map((r) => <path key={r.x} d={`M${r.x - 8} 180 L${r.x + 40} 122 L${r.x + 88} 180 Z`} fill={P.teal} stroke="rgba(30,20,16,0.35)" strokeWidth="2" />)}
        <line x1="480" y1="122" x2="480" y2="74" stroke={P.ink} strokeWidth="4" />
        <motion.path
          d="M482 76 C500 70 512 84 532 78 L532 102 C512 108 500 94 482 100 Z" fill={P.crimson}
          style={{ transformBox: 'fill-box', transformOrigin: '0% 50%' }}
          animate={reduce ? undefined : { skewY: [0, 7, 0, -7, 0], scaleX: [1, 0.92, 1, 0.94, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>
    </svg>
  );
}

/* ---------- cut-outs: a character or prop on a transparent background ---------- */

/** A transparent cut-out (`characters/maryam-point.png`, `l02/magnifier.png`) that enters and can float. If the file is
 *  not there yet, nothing shows, so a page never breaks while the owner's images are on their way. */
export function Sprite({ name, style, enter = 'up', delay = 0, float = false, className = '', animate }: {
  name: string; style: React.CSSProperties; enter?: 'up' | 'left' | 'right' | 'drop' | 'fade'; delay?: number; float?: boolean; className?: string;
  animate?: React.ComponentProps<typeof motion.img>['animate'];
}) {
  const reduce = useReducedMotion();
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  const from = { up: { y: 60 }, left: { x: -120 }, right: { x: 120 }, drop: { y: -220, rotate: -12 }, fade: {} }[enter];
  return (
    <motion.img
      src={`/curriculum/zad-kids/${name}`} alt="" aria-hidden="true" draggable={false} onError={() => setMissing(true)}
      className={`pointer-events-none absolute select-none ${className}`} style={style}
      initial={reduce ? false : { opacity: 0, ...from }}
      animate={animate ?? (float && !reduce ? { opacity: 1, x: 0, y: [0, -8, 0], rotate: 0 } : { opacity: 1, x: 0, y: 0, rotate: 0 })}
      transition={reduce ? { duration: 0 } : float
        ? { opacity: { duration: 0.5, delay }, x: { delay, type: 'spring', bounce: 0.3 }, y: { duration: 3, delay: delay + 0.6, repeat: Infinity, ease: 'easeInOut' }, rotate: { delay } }
        : { delay, type: 'spring', duration: 0.8, bounce: enter === 'drop' ? 0.45 : 0.25 }}
    />
  );
}

/* ---------- a magnifying lens with room for its own motion inside ---------- */

/** A round lens showing `zoom`× the spot (x, y) of an image (% of the image) at (lx, ly) (% of the box), with a leader
 *  line from the spot. The image fills the `box` (px) exactly, same aspect ratio. `children` are drawn
 *  inside the lens (in lens %, over the zoomed picture), e.g. an eyelid that blinks. */
export function Lens({ src, x, y, lx, ly, box, size = 230, zoom = 3, label, children, delay = 0 }: {
  src: string; x: number; y: number; lx: number; ly: number; box: { w: number; h: number }; size?: number; zoom?: number; label?: string; children?: React.ReactNode; delay?: number;
}) {
  const W = box.w * zoom;
  const H = box.h * zoom;
  const reduce = useReducedMotion();
  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <motion.line x1={x} y1={y} x2={lx} y2={ly} stroke="#FFFDF7" strokeWidth={3} strokeLinecap="round" vectorEffect="non-scaling-stroke"
          initial={{ pathLength: reduce ? 1 : 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay, ease: out }} />
      </svg>
      <motion.span className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white"
        style={{ left: `${x}%`, top: `${y}%`, background: P.crimson }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay }} />
      <motion.div
        className="pointer-events-none absolute" style={{ left: `${lx}%`, top: `${ly}%`, width: size, height: size, marginLeft: -size / 2, marginTop: -size / 2 }}
        initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }}
        transition={reduce ? { duration: 0.2 } : { delay: delay + 0.2, type: 'spring', bounce: 0.35, duration: 0.6 }}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full border-[6px] border-[#FFFDF7] bg-[#FBF5EA] shadow-[0_18px_40px_-14px_rgba(20,12,8,0.75)]">
          <div className="absolute" style={{ width: W, height: H, left: size / 2 - (x / 100) * W, top: size / 2 - (y / 100) * H }}>
            <img src={src} alt="" aria-hidden="true" draggable={false} className="h-full w-full select-none" />
          </div>
          {children}
        </div>
        {label && (
          <motion.span className="absolute left-1/2 top-full mt-4 -translate-x-1/2 whitespace-nowrap rounded-full px-5 py-2 font-sans text-[24px] font-bold shadow-[0_10px_24px_-12px_rgba(30,20,16,0.6)]"
            style={{ background: '#FFFDF7', color: P.crimson }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: reduce ? 0 : delay + 0.7 }}>
            {label}
          </motion.span>
        )}
      </motion.div>
    </>
  );
}

/* ---------- depth: painted layers that move at different speeds ---------- */

/** Layers back to front (`depth` 0 = far). They drift sideways at different speeds, and `focus` brings one layer
 *  forward and lights it. Layers whose files are missing are skipped. */
export function Depth({ layers, focus = -1 }: { layers: { name: string; depth: number }[]; focus?: number }) {
  const reduce = useReducedMotion();
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {layers.map((l, i) => (
        <DepthLayer key={l.name} name={l.name} depth={l.depth} lit={focus === i} dim={focus >= 0 && focus !== i} reduce={Boolean(reduce)} />
      ))}
    </div>
  );
}
function DepthLayer({ name, depth, lit, dim, reduce }: { name: string; depth: number; lit: boolean; dim: boolean; reduce: boolean }) {
  const [missing, setMissing] = useState(false);
  if (missing) return null;
  const travel = 1.5 + depth * 3;
  return (
    <motion.img
      src={`/curriculum/zad-kids/${name}`} alt="" draggable={false} onError={() => setMissing(true)}
      className="absolute inset-[-4%] h-[108%] w-[108%] max-w-none select-none object-cover"
      initial={false}
      animate={{ x: reduce ? 0 : [`-${travel}%`, `${travel}%`], scale: lit ? 1.05 : 1, filter: dim ? 'brightness(0.55) saturate(0.7)' : lit ? 'brightness(1.12) saturate(1.1)' : 'brightness(1)' }}
      transition={{ x: { duration: 14, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }, scale: { duration: 0.8, ease: out }, filter: { duration: 0.6 } }}
    />
  );
}

