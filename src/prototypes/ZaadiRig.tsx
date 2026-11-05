import React, { useId } from 'react';
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';

/**
 * Zaadi (prototype v3): the gold khatam star with simple eyes (no mouth, no human face), now a 3D badge with
 * depth (extruded edge, bevel, sheen, inset face) and two small arms with round hands for gestures: wave, point,
 * clap, hand on heart, hands up. Motion is slow and relaxed: long eased loops, soft springs between poses,
 * and arms that trail the body a little. Pure SVG + Motion, no new dependency.
 */
export type ZaadiPose = 'idle' | 'wave' | 'cheer' | 'point' | 'thanks' | 'sad' | 'peek' | 'wow';

const ease = [0.45, 0, 0.55, 1] as const; // soft in-out
const loop = (duration: number, extra: object = {}) => ({ duration, repeat: Infinity, ease, ...extra });
const soft = { type: 'spring' as const, stiffness: 90, damping: 14, mass: 0.9 };
// joints in viewBox units: the arm turns at the shoulder, the body at the feet
// Motion owns transform-origin, so the joint goes through originX/originY (px in the view box)
const at = (x: number, y: number) => ({ transformBox: 'view-box' as const, originX: `${x}px`, originY: `${y}px` });

type Eyes = 'open' | 'happy' | 'closed' | 'sad' | 'wow';
type Parts = { body: TargetAndTransition; armL: TargetAndTransition; armR: TargetAndTransition; feet: TargetAndTransition; eyes: Eyes };

const POSES: Record<ZaadiPose, Parts> = {
  idle: {
    body: { y: [0, -2.5, 0], rotate: [0, 1.2, 0, -1.2, 0], scaleY: [1, 1.02, 1], transition: loop(4.8) },
    armL: { rotate: [0, 6, 0], transition: loop(4.8, { delay: 0.2 }) },
    armR: { rotate: [0, -6, 0], transition: loop(4.8, { delay: 0.2 }) },
    feet: { y: 0 }, eyes: 'open',
  },
  wave: {
    body: { rotate: [0, 3, 0], y: 0, transition: loop(1.8) },
    armL: { rotate: 4, transition: soft },
    armR: { rotate: [-100, -135, -100], transition: loop(0.9) },
    feet: { y: 0 }, eyes: 'happy',
  },
  cheer: {
    body: { y: [0, 5, -30, 0, 0], scaleY: [1, 0.88, 1.08, 0.97, 1], scaleX: [1, 1.08, 0.95, 1.02, 1], transition: loop(1.5, { times: [0, 0.18, 0.45, 0.72, 1], repeatDelay: 0.35 }) },
    armL: { rotate: [110, 135, 110], transition: loop(0.5) },
    armR: { rotate: [-110, -135, -110], transition: loop(0.5) },
    feet: { y: [0, 0, -30, 0, 0], transition: loop(1.5, { times: [0, 0.18, 0.45, 0.72, 1], repeatDelay: 0.35 }) },
    eyes: 'happy',
  },
  point: {
    body: { rotate: -4, x: -2, y: 0, transition: soft },
    armL: { rotate: [0, 5, 0], transition: loop(3) },
    armR: { rotate: [-46, -52, -46], transition: loop(1.6) },
    feet: { y: 0 }, eyes: 'open',
  },
  thanks: {
    body: { rotate: [0, 7, 7, 0], y: [0, 3, 3, 0], transition: loop(3.2, { times: [0, 0.3, 0.7, 1], repeatDelay: 0.6 }) },
    armL: { rotate: -92, transition: soft }, // hand on the heart
    armR: { rotate: [0, -8, 0], transition: loop(3.2) },
    feet: { y: 0 }, eyes: 'closed',
  },
  sad: {
    body: { y: 4, scaleY: 0.96, rotate: -4, transition: soft },
    armL: { rotate: -14, transition: soft },
    armR: { rotate: 14, transition: soft },
    feet: { y: 0 }, eyes: 'sad',
  },
  peek: {
    body: { y: [0, -2, 0], transition: loop(3) },
    armL: { rotate: 70, transition: soft }, // hands on the edge
    armR: { rotate: -70, transition: soft },
    feet: { y: 0 }, eyes: 'open',
  },
  wow: {
    body: { y: [0, -6, 0], scaleY: [1, 1.05, 1], transition: { duration: 0.6, ease } },
    armL: { rotate: 40, transition: soft },
    armR: { rotate: -40, transition: soft },
    feet: { y: 0 }, eyes: 'wow',
  },
};

const INK = '#2A1710';
const STAR = 'M61 20 L72.8 31.6 L89.3 31.7 L89.4 48.2 L101 60 L89.4 71.8 L89.3 88.3 L72.8 88.4 L61 100 L49.2 88.4 L32.7 88.3 L32.6 71.8 L21 60 L32.6 48.2 L32.7 31.7 L49.2 31.6 Z';
const STAR_IN = 'M61 29 L69.8 37.9 L82.3 37.8 L82.4 50.3 L91.2 60 L82.4 69.7 L82.3 82.2 L69.8 82.1 L61 91 L52.2 82.1 L39.7 82.2 L39.6 69.7 L30.8 60 L39.6 50.3 L39.7 37.8 L52.2 37.9 Z';

function EyeSet({ kind, look }: { kind: Eyes; look: boolean }) {
  const reduce = useReducedMotion();
  if (kind === 'happy') return <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round"><path d="M49.5 60 q5 -7 10 0" /><path d="M62.5 60 q5 -7 10 0" /></g>;
  if (kind === 'closed') return <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round"><path d="M49.5 57 q5 5.5 10 0" /><path d="M62.5 57 q5 5.5 10 0" /></g>;
  const sad = kind === 'sad';
  const wow = kind === 'wow';
  const ry = wow ? 7.4 : sad ? 5.4 : 6.4;
  return (
    <g>
      {sad && <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><path d="M48.5 49.5 l9.5 -4.2" /><path d="M73.5 49.5 l-9.5 -4.2" /></g>}
      <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.08, 1, 1] }} transition={{ duration: 5.2, repeat: Infinity, times: [0, 0.9, 0.925, 0.95, 1] }}
        style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}>
        <ellipse cx="54.5" cy="57.5" rx={wow ? 6 : 5.2} ry={ry} fill="#FFFFFF" />
        <ellipse cx="67.5" cy="57.5" rx={wow ? 6 : 5.2} ry={ry} fill="#FFFFFF" />
        <motion.g animate={reduce || !look ? undefined : { x: [0, 0, 1.6, 1.6, 0, -1.6, -1.6, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease, times: [0, 0.3, 0.36, 0.5, 0.56, 0.7, 0.86, 0.92] }}>
          <ellipse cx="55" cy="58.5" rx={wow ? 2.8 : 3.6} ry={wow ? 3.4 : sad ? 3.9 : 4.6} fill={INK} />
          <ellipse cx="68" cy="58.5" rx={wow ? 2.8 : 3.6} ry={wow ? 3.4 : sad ? 3.9 : 4.6} fill={INK} />
          <circle cx="56.4" cy="56.3" r="1.5" fill="#fff" /><circle cx="69.4" cy="56.3" r="1.5" fill="#fff" />
          <circle cx="53.9" cy="60.6" r=".7" fill="#fff" opacity=".8" /><circle cx="66.9" cy="60.6" r=".7" fill="#fff" opacity=".8" />
        </motion.g>
      </motion.g>
    </g>
  );
}

function Sparkles({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  if (!on || reduce) return null;
  const pts = [[14, 30, 0], [108, 24, 0.3], [8, 90, 0.55], [114, 92, 0.8], [61, 4, 0.45]] as const;
  return (
    <g>
      {pts.map(([x, y, d], i) => (
        <motion.path key={i} d={`M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z`}
          fill="#FFE7A8" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
          animate={{ scale: [0, 1.15, 0], opacity: [0, 1, 0], rotate: [0, 45] }} transition={{ duration: 1.3, repeat: Infinity, delay: d, repeatDelay: 0.6, ease }} />
      ))}
    </g>
  );
}

/** a short arm with a round hand; drawn hanging down-and-out from the shoulder, then rotated */
function Arm({ side, id }: { side: 'L' | 'R'; id: (n: string) => string }) {
  const s = side === 'L' ? -1 : 1;
  const sx = 61 + s * 27, sy = 68;           // shoulder
  const hx = sx + s * 11, hy = sy + 15;      // hand
  return (
    <g>
      <path d={`M${sx} ${sy} Q${sx + s * 9} ${sy + 4} ${hx} ${hy}`} fill="none" stroke="#B37A2C" strokeWidth="8.5" strokeLinecap="round" />
      <path d={`M${sx} ${sy} Q${sx + s * 9} ${sy + 4} ${hx} ${hy}`} fill="none" stroke="#E9B652" strokeWidth="3.4" strokeLinecap="round" opacity=".75" />
      <circle cx={hx} cy={hy} r="8.6" fill={`url(#${id('hand')})`} stroke="#9C6422" strokeWidth="1" />
      <circle cx={hx - 2.6} cy={hy - 2.8} r="2.4" fill="#FFF4D6" opacity=".8" />
    </g>
  );
}

export function ZaadiRig({ pose, size = 140, glow = true }: { pose: ZaadiPose; size?: number; glow?: boolean }) {
  const reduce = useReducedMotion();
  const p = POSES[pose];
  const a = (t: TargetAndTransition) => (reduce ? undefined : t);
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `zr-${n}-${uid}`;
  return (
    <svg viewBox="0 0 122 124" width={size} height={size * 124 / 122} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={id('gold')} cx="34%" cy="24%" r="85%">
          <stop offset="0" stopColor="#FFF3CF" /><stop offset=".35" stopColor="#F4C35C" /><stop offset=".72" stopColor="#D69B36" /><stop offset="1" stopColor="#9C6422" />
        </radialGradient>
        <linearGradient id={id('edge')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B57A2A" /><stop offset="1" stopColor="#6E4115" /></linearGradient>
        <linearGradient id={id('bevel')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF6DA" stopOpacity=".9" /><stop offset=".5" stopColor="#F6D58E" stopOpacity=".12" /><stop offset="1" stopColor="#7A4A16" stopOpacity=".4" /></linearGradient>
        <radialGradient id={id('hand')} cx="35%" cy="30%" r="75%"><stop offset="0" stopColor="#FFEDB8" /><stop offset=".6" stopColor="#EAB24B" /><stop offset="1" stopColor="#B57A2A" /></radialGradient>
        <radialGradient id={id('face')} cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#FFFEF9" /><stop offset=".8" stopColor="#FBF0DA" /><stop offset="1" stopColor="#EED9B2" /></radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#F6C25A" stopOpacity=".42" /><stop offset="1" stopColor="#F6C25A" stopOpacity="0" /></radialGradient>
        <clipPath id={id('clip')}><path d={STAR} /></clipPath>
      </defs>

      {glow && <motion.circle cx="61" cy="61" r="58" fill={`url(#${id('halo')})`} animate={a({ opacity: [0.65, 1, 0.65], transition: loop(4.8) })} />}
      <Sparkles on={pose === 'cheer'} />

      <motion.ellipse cx="61" cy="119" rx="24" ry="4" fill="#3A1A08" opacity=".18" style={{ transformBox: 'fill-box', transformOrigin: '50% 50%' }}
        animate={a(pose === 'cheer' ? { scaleX: [1, 1.08, 0.6, 1, 1], opacity: [0.18, 0.22, 0.08, 0.18, 0.18], transition: loop(1.5, { times: [0, 0.18, 0.45, 0.72, 1], repeatDelay: 0.35 }) } : { scaleX: 1, opacity: 0.18 })} />

      {/* feet */}
      <motion.g animate={a(p.feet)}>
        <path d="M53 101 v10 M69 101 v10" stroke="#A86E26" strokeWidth="3.6" strokeLinecap="round" />
        <ellipse cx="51" cy="113" rx="7.6" ry="4.3" fill="#B97A2C" /><ellipse cx="71" cy="113" rx="7.6" ry="4.3" fill="#B97A2C" />
        <ellipse cx="49" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" /><ellipse cx="69" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" />
      </motion.g>

      <motion.g animate={a(p.body)} style={at(61, 112)}>
        {/* 3D badge: extruded edge, gold face, bevelled inner star, moving sheen */}
        <path d={STAR} transform="translate(1.6 3.4)" fill={`url(#${id('edge')})`} />
        <path d={STAR} fill={`url(#${id('gold')})`} stroke="#8A561C" strokeWidth="1.1" strokeLinejoin="round" />
        <path d={STAR} fill="none" stroke="#FFF2C9" strokeOpacity=".7" strokeWidth="1" strokeLinejoin="round" transform="translate(-.6 -.8)" clipPath={`url(#${id('clip')})`} />
        <path d={STAR_IN} fill={`url(#${id('bevel')})`} stroke="#FFF2C9" strokeOpacity=".5" strokeWidth=".9" strokeLinejoin="round" />
        <g clipPath={`url(#${id('clip')})`}>
          <motion.rect x="-40" y="0" width="20" height="130" fill="#FFFFFF" opacity=".26" transform="rotate(-28 61 61)"
            animate={a({ x: [-40, 150], transition: { duration: 3.2, repeat: Infinity, repeatDelay: 5, ease } })} />
        </g>

        {/* inset face */}
        <circle cx="61.4" cy="61.6" r="21" fill="#8A561C" opacity=".35" />
        <circle cx="61" cy="61" r="20.5" fill={`url(#${id('face')})`} />
        <EyeSet kind={p.eyes} look={pose === 'idle' || pose === 'peek'} />
        <ellipse cx="46.5" cy="68.5" rx="4.2" ry="2.3" fill="#F29C9C" opacity=".55" /><ellipse cx="75.5" cy="68.5" rx="4.2" ry="2.3" fill="#F29C9C" opacity=".55" />
        {/* arms in front, so a hand can rest on the heart */}
        <motion.g animate={a(p.armL)} style={at(34, 68)}><Arm side="L" id={id} /></motion.g>
        <motion.g animate={a(p.armR)} style={at(88, 68)}><Arm side="R" id={id} /></motion.g>

      </motion.g>
    </svg>
  );
}
