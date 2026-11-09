import React, { useId } from 'react';
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';

/**
 * Zad (prototype v4, brand colours 2026-11-09): the 3D crimson khatam badge with a gold inner star, simple eyes (never a human face, no mouth), arms ending in
 * small four-point star hands (a spark of the same khatam), and sixteen expressions, each with its own effect
 * layer (sparkle rings, rays of light, hearts, thought dots, sleep z's, shock rings). Motion stays relaxed:
 * long eased loops, soft springs between poses, arms trailing the body. Pure SVG + Motion.
 */
export type ZadPose =
  | 'idle' | 'wave' | 'cheer' | 'point' | 'thanks' | 'sad' | 'peek' | 'wow'
  | 'think' | 'love' | 'sleepy' | 'shy' | 'excited' | 'proud' | 'dua' | 'clap';

const ease = [0.45, 0, 0.55, 1] as const;
const loop = (duration: number, extra: object = {}) => ({ duration, repeat: Infinity, ease, ...extra });
const soft = { type: 'spring' as const, stiffness: 90, damping: 14, mass: 0.9 };
// Motion owns transform-origin, so joints go through originX/originY (px in the view box)
const at = (x: number, y: number) => ({ transformBox: 'view-box' as const, originX: `${x}px`, originY: `${y}px` });
const centre = { transformBox: 'fill-box' as const, originX: 0.5, originY: 0.5 };

type Eyes = 'open' | 'happy' | 'closed' | 'sad' | 'wow' | 'star' | 'sleepy' | 'up' | 'down';
type Fx = 'none' | 'sparkles' | 'burst' | 'hearts' | 'think' | 'zzz' | 'shock' | 'rays' | 'clap';
type Parts = { body: TargetAndTransition; armL: TargetAndTransition; armR: TargetAndTransition; feet: TargetAndTransition; eyes: Eyes; fx: Fx; blush?: number };

const still = { y: 0 };
const POSES: Record<ZadPose, Parts> = {
  idle: { body: { y: [0, -2.5, 0], rotate: [0, 1.2, 0, -1.2, 0], scaleY: [1, 1.02, 1], transition: loop(4.8) }, armL: { rotate: [0, 6, 0], transition: loop(4.8, { delay: 0.2 }) }, armR: { rotate: [0, -6, 0], transition: loop(4.8, { delay: 0.2 }) }, feet: still, eyes: 'open', fx: 'none' },
  wave: { body: { rotate: [0, 3, 0], y: 0, transition: loop(1.8) }, armL: { rotate: 4, transition: soft }, armR: { rotate: [-100, -135, -100], transition: loop(0.9) }, feet: still, eyes: 'happy', fx: 'none' },
  cheer: {
    // a full twirl in the air: squash, leap, spin (scaleX through zero reads as a 3D turn), land
    body: { y: [0, 6, -34, -34, 0, 0], scaleX: [1, 1.1, 0.9, -0.9, 1, 1], scaleY: [1, 0.86, 1.1, 1.1, 0.95, 1], transition: loop(1.8, { times: [0, 0.15, 0.4, 0.55, 0.78, 1], repeatDelay: 0.3 }) },
    armL: { rotate: [110, 140, 110], transition: loop(0.45) }, armR: { rotate: [-110, -140, -110], transition: loop(0.45) },
    feet: { y: [0, 0, -34, -34, 0, 0], transition: loop(1.8, { times: [0, 0.15, 0.4, 0.55, 0.78, 1], repeatDelay: 0.3 }) }, eyes: 'happy', fx: 'burst',
  },
  point: { body: { rotate: -4, x: -2, y: 0, transition: soft }, armL: { rotate: [0, 5, 0], transition: loop(3) }, armR: { rotate: [-46, -54, -46], transition: loop(1.6) }, feet: still, eyes: 'open', fx: 'none' },
  thanks: { body: { rotate: [0, 7, 7, 0], y: [0, 3, 3, 0], transition: loop(3.2, { times: [0, 0.3, 0.7, 1], repeatDelay: 0.6 }) }, armL: { rotate: -92, transition: soft }, armR: { rotate: [0, -8, 0], transition: loop(3.2) }, feet: still, eyes: 'closed', fx: 'sparkles', blush: 0.75 },
  sad: { body: { y: 4, scaleY: 0.96, rotate: -4, transition: soft }, armL: { rotate: -14, transition: soft }, armR: { rotate: 14, transition: soft }, feet: still, eyes: 'sad', fx: 'none' },
  peek: { body: { y: [0, -2, 0], transition: loop(3) }, armL: { rotate: 70, transition: soft }, armR: { rotate: -70, transition: soft }, feet: still, eyes: 'open', fx: 'none' },
  wow: { body: { y: [0, -8, 0], scaleY: [1, 1.08, 1], transition: loop(1.6, { repeatDelay: 0.6 }) }, armL: { rotate: 40, transition: soft }, armR: { rotate: -40, transition: soft }, feet: still, eyes: 'wow', fx: 'shock' },
  think: { body: { rotate: [0, 6, 6, 0], transition: loop(4, { times: [0, 0.3, 0.7, 1] }) }, armL: { rotate: [0, 4, 0], transition: loop(4) }, armR: { rotate: 92, transition: soft }, feet: still, eyes: 'up', fx: 'think' },
  love: { body: { scale: [1, 1.05, 1, 1.05, 1], transition: loop(1.4, { repeatDelay: 0.5 }) }, armL: { rotate: -92, transition: soft }, armR: { rotate: 92, transition: soft }, feet: still, eyes: 'happy', fx: 'hearts', blush: 0.9 },
  sleepy: { body: { rotate: [0, -7, 0, 7, 0], y: [0, 2, 0, 2, 0], transition: loop(6) }, armL: { rotate: -8, transition: soft }, armR: { rotate: 8, transition: soft }, feet: still, eyes: 'sleepy', fx: 'zzz' },
  shy: { body: { rotate: [0, -5, 0], x: [0, -1, 0], transition: loop(2.6) }, armL: { rotate: -48, transition: soft }, armR: { rotate: 48, transition: soft }, feet: still, eyes: 'down', fx: 'none', blush: 1 },
  excited: { body: { y: [0, -10, 0, -6, 0], rotate: [0, -4, 0, 4, 0], transition: loop(0.9) }, armL: { rotate: [100, 125, 100], transition: loop(0.3) }, armR: { rotate: [-100, -125, -100], transition: loop(0.3) }, feet: { y: [0, -10, 0, -6, 0], transition: loop(0.9) }, eyes: 'star', fx: 'sparkles' },
  proud: { body: { scale: 1.06, y: -2, rotate: [0, 2, 0], transition: { ...soft, rotate: loop(3) } }, armL: { rotate: 28, transition: soft }, armR: { rotate: -28, transition: soft }, feet: still, eyes: 'closed', fx: 'rays' },
  dua: { body: { y: [0, -2, 0], transition: loop(4) }, armL: { rotate: [86, 92, 86], transition: loop(4) }, armR: { rotate: [-86, -92, -86], transition: loop(4) }, feet: still, eyes: 'closed', fx: 'rays' },
  clap: { body: { y: [0, -3, 0], transition: loop(0.5) }, armL: { rotate: [-50, -78, -50], transition: loop(0.5) }, armR: { rotate: [50, 78, 50], transition: loop(0.5) }, feet: still, eyes: 'happy', fx: 'clap' },
};

const INK = '#2A1710';
const STAR = 'M61 20 L72.8 31.6 L89.3 31.7 L89.4 48.2 L101 60 L89.4 71.8 L89.3 88.3 L72.8 88.4 L61 100 L49.2 88.4 L32.7 88.3 L32.6 71.8 L21 60 L32.6 48.2 L32.7 31.7 L49.2 31.6 Z';
const STAR_IN = 'M61 29 L69.8 37.9 L82.3 37.8 L82.4 50.3 L91.2 60 L82.4 69.7 L82.3 82.2 L69.8 82.1 L61 91 L52.2 82.1 L39.7 82.2 L39.6 69.7 L30.8 60 L39.6 50.3 L39.7 37.8 L52.2 37.9 Z';
const spark = (x: number, y: number, r: number, w = 0.3) =>
  `M${x} ${y - r} Q${x + r * w} ${y - r * w} ${x + r} ${y} Q${x + r * w} ${y + r * w} ${x} ${y + r} Q${x - r * w} ${y + r * w} ${x - r} ${y} Q${x - r * w} ${y - r * w} ${x} ${y - r} Z`;

function EyeSet({ kind, look }: { kind: Eyes; look: boolean }) {
  const reduce = useReducedMotion();
  const line = { fill: 'none', stroke: INK, strokeWidth: 3.3, strokeLinecap: 'round' as const };
  if (kind === 'happy') return <g {...line}><path d="M49.5 60 q5 -7 10 0" /><path d="M62.5 60 q5 -7 10 0" /></g>;
  if (kind === 'closed') return <g {...line}><path d="M49.5 57 q5 5.5 10 0" /><path d="M62.5 57 q5 5.5 10 0" /></g>;
  if (kind === 'sleepy') return <g {...line}><path d="M49.5 59 q5 2.5 10 0" /><path d="M62.5 59 q5 2.5 10 0" /></g>;
  if (kind === 'star') {
    return (
      <g>
        {[54.5, 67.5].map((cx) => (
          <motion.path key={cx} d={spark(cx, 58, 7, 0.22)} fill={INK} style={centre}
            animate={reduce ? undefined : { scale: [1, 1.25, 1], rotate: [0, 20, 0] }} transition={loop(0.6)} />
        ))}
        <circle cx="56" cy="55.5" r="1.2" fill="#fff" /><circle cx="69" cy="55.5" r="1.2" fill="#fff" />
      </g>
    );
  }
  const sad = kind === 'sad', wow = kind === 'wow';
  const ry = wow ? 7.4 : sad ? 5.4 : 6.4;
  const dx = kind === 'up' ? -1.6 : 0, dy = kind === 'up' ? -2.2 : kind === 'down' ? 2.2 : 0;
  return (
    <g>
      {sad && <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><path d="M48.5 49.5 l9.5 -4.2" /><path d="M73.5 49.5 l-9.5 -4.2" /></g>}
      <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.08, 1, 1] }} transition={{ duration: 5.2, repeat: Infinity, times: [0, 0.9, 0.925, 0.95, 1] }} style={centre}>
        <ellipse cx="54.5" cy="57.5" rx={wow ? 6 : 5.2} ry={ry} fill="#FFFFFF" />
        <ellipse cx="67.5" cy="57.5" rx={wow ? 6 : 5.2} ry={ry} fill="#FFFFFF" />
        <motion.g animate={reduce || !look ? { x: dx, y: dy } : { x: [0, 0, 1.6, 1.6, 0, -1.6, -1.6, 0] }}
          transition={look ? { duration: 8, repeat: Infinity, ease, times: [0, 0.3, 0.36, 0.5, 0.56, 0.7, 0.86, 0.92] } : soft}>
          <ellipse cx="55" cy="58.5" rx={wow ? 2.8 : 3.6} ry={wow ? 3.4 : sad ? 3.9 : 4.6} fill={INK} />
          <ellipse cx="68" cy="58.5" rx={wow ? 2.8 : 3.6} ry={wow ? 3.4 : sad ? 3.9 : 4.6} fill={INK} />
          <circle cx="56.4" cy="56.3" r="1.5" fill="#fff" /><circle cx="69.4" cy="56.3" r="1.5" fill="#fff" />
          <circle cx="53.9" cy="60.6" r=".7" fill="#fff" opacity=".8" /><circle cx="66.9" cy="60.6" r=".7" fill="#fff" opacity=".8" />
        </motion.g>
      </motion.g>
      {sad && <motion.path d="M51 64 q-1.6 3 0 4.4 q1.6 -1.4 0 -4.4z" fill="#8FC7E8" animate={reduce ? undefined : { y: [0, 6], opacity: [0, 1, 0] }} transition={loop(1.8, { repeatDelay: 0.8 })} />}
    </g>
  );
}

/* the effect layer that makes each feeling visible */
function Effects({ fx }: { fx: Fx }) {
  const reduce = useReducedMotion();
  if (reduce || fx === 'none') return null;
  if (fx === 'sparkles' || fx === 'burst') {
    const n = fx === 'burst' ? 10 : 5;
    return (
      <g>
        {fx === 'burst' && (
          <motion.circle cx="61" cy="60" r="30" fill="none" stroke="#F6D58E" strokeWidth="2" style={centre}
            animate={{ scale: [0.6, 1.9], opacity: [0.8, 0] }} transition={loop(1.8, { times: [0.4, 0.9], repeatDelay: 0.3 })} />
        )}
        {Array.from({ length: n }, (_, i) => {
          const ang = (i / n) * Math.PI * 2 - Math.PI / 2;
          const R = fx === 'burst' ? 54 : 48;
          const x = 61 + Math.cos(ang) * R, y = 60 + Math.sin(ang) * R;
          return (
            <motion.path key={i} d={spark(x, y, i % 2 ? 4.5 : 6.5)} fill={i % 3 ? '#F6D58E' : '#12A4BC'} style={centre}
              animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 90] }} transition={loop(1.4, { delay: i * 0.12, repeatDelay: 0.3 })} />
          );
        })}
      </g>
    );
  }
  if (fx === 'hearts') {
    return (
      <g>
        {[[40, 0], [82, 0.6], [61, 1.2]].map(([x, d], i) => (
          <motion.path key={i} d={`M${x} 34 c-3 -4 -9 -2 -7 3 c1 3 7 7 7 7 s6 -4 7 -7 c2 -5 -4 -7 -7 -3z`} fill="#E5484D" style={centre}
            animate={{ y: [0, -26], opacity: [0, 1, 0], scale: [0.6, 1, 0.8] }} transition={loop(2, { delay: d })} />
        ))}
      </g>
    );
  }
  if (fx === 'think') {
    return (
      <g fill="#12A4BC">
        {[[90, 30, 2.5], [98, 22, 3.5], [108, 12, 5]].map(([x, y, r], i) => (
          <motion.circle key={i} cx={x} cy={y} r={r} animate={{ opacity: [0.2, 1, 0.2], y: [0, -2, 0] }} transition={loop(1.5, { delay: i * 0.25 })} />
        ))}
      </g>
    );
  }
  if (fx === 'zzz') {
    return (
      <g fill="#C9B8A3" fontFamily="Georgia, serif" fontWeight="700">
        {[0, 1, 2].map((i) => (
          <motion.text key={i} x={88 + i * 7} y={30 - i * 6} fontSize={8 + i * 3}
            animate={{ opacity: [0, 1, 0], y: [0, -10] }} transition={loop(2.4, { delay: i * 0.6 })}>z</motion.text>
        ))}
      </g>
    );
  }
  if (fx === 'shock') {
    return (
      <g fill="none" stroke="#F6D58E" strokeWidth="2" strokeLinecap="round">
        {[0, 0.4].map((d, i) => (
          <motion.circle key={i} cx="61" cy="60" r="34" style={centre} animate={{ scale: [0.8, 1.6], opacity: [0.9, 0] }} transition={loop(1.6, { delay: d, repeatDelay: 0.6 })} />
        ))}
        {[[30, 22, 24, 14], [92, 22, 98, 14], [61, 14, 61, 5]].map(([x1, y1, x2, y2], i) => (
          <motion.path key={i} d={`M${x1} ${y1} L${x2} ${y2}`} strokeWidth="3" animate={{ opacity: [0, 1, 0] }} transition={loop(1.6, { repeatDelay: 0.6 })} />
        ))}
      </g>
    );
  }
  if (fx === 'rays') {
    return (
      <motion.g style={at(61, 60)} animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} opacity=".55">
        {Array.from({ length: 12 }, (_, i) => (
          <path key={i} d="M61 60 L57 -2 L65 -2 Z" fill="#F6D58E" opacity={i % 2 ? 0.35 : 0.6} transform={`rotate(${i * 30} 61 60)`} />
        ))}
      </motion.g>
    );
  }
  if (fx === 'clap') {
    return <motion.path d={spark(61, 92, 7)} fill="#FFE7A8" style={centre} animate={{ scale: [0, 1.3, 0], opacity: [0, 1, 0] }} transition={loop(0.5)} />;
  }
  return null;
}

/** a short arm ending in a four-point star hand, a small spark of the khatam itself */
function Arm({ side, id }: { side: 'L' | 'R'; id: (n: string) => string }) {
  const s = side === 'L' ? -1 : 1;
  const sx = 61 + s * 27, sy = 68;
  const hx = sx + s * 11, hy = sy + 15;
  return (
    <g>
      <path d={`M${sx} ${sy} Q${sx + s * 9} ${sy + 4} ${hx} ${hy}`} fill="none" stroke="#8B4935" strokeWidth="7.5" strokeLinecap="round" />
      <path d={`M${sx} ${sy} Q${sx + s * 9} ${sy + 4} ${hx} ${hy}`} fill="none" stroke="#C9876F" strokeWidth="3" strokeLinecap="round" opacity=".75" />
      <path d={spark(hx, hy, 9.5, 0.34)} fill={`url(#${id('hand')})`} stroke="#9C6422" strokeWidth="1" strokeLinejoin="round" transform={`rotate(${s * 12} ${hx} ${hy})`} />
      <circle cx={hx - 1.6} cy={hy - 1.8} r="1.7" fill="#FFF6DC" opacity=".9" />
    </g>
  );
}

export function ZadRig({ pose, size = 140, glow = true }: { pose: ZadPose; size?: number; glow?: boolean }) {
  const reduce = useReducedMotion();
  const p = POSES[pose];
  const a = (t: TargetAndTransition) => (reduce ? undefined : t);
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `zr-${n}-${uid}`;
  const jump = pose === 'cheer' || pose === 'excited';
  return (
    <svg viewBox="0 0 122 124" width={size} height={size * 124 / 122} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={id('gold')} cx="34%" cy="24%" r="85%">
          <stop offset="0" stopColor="#FF9C94" /><stop offset=".35" stopColor="#E3343A" /><stop offset=".72" stopColor="#C51F24" /><stop offset="1" stopColor="#7E1216" />
        </radialGradient>
        <linearGradient id={id('edge')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#8E1418" /><stop offset="1" stopColor="#4A0B0D" /></linearGradient>
        <linearGradient id={id('bevel')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFD9D2" stopOpacity=".7" /><stop offset=".5" stopColor="#F6D58E" stopOpacity=".1" /><stop offset="1" stopColor="#5A0C0F" stopOpacity=".45" /></linearGradient>
        <radialGradient id={id('hand')} cx="38%" cy="32%" r="75%"><stop offset="0" stopColor="#FFF0C4" /><stop offset=".55" stopColor="#EDB54C" /><stop offset="1" stopColor="#B57A2A" /></radialGradient>
        <radialGradient id={id('face')} cx="45%" cy="35%" r="70%"><stop offset="0" stopColor="#FFFEF9" /><stop offset=".8" stopColor="#FBF0DA" /><stop offset="1" stopColor="#EED9B2" /></radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#F6C25A" stopOpacity=".42" /><stop offset="1" stopColor="#F6C25A" stopOpacity="0" /></radialGradient>
        <clipPath id={id('clip')}><path d={STAR} /></clipPath>
      </defs>

      {glow && <motion.circle cx="61" cy="61" r="58" fill={`url(#${id('halo')})`} animate={a({ opacity: [0.65, 1, 0.65], transition: loop(4.8) })} />}
      <Effects fx={p.fx} />

      <motion.ellipse cx="61" cy="119" rx="24" ry="4" fill="#1F1A17" opacity=".18" style={centre}
        animate={a(jump ? { scaleX: [1, 0.6, 1], opacity: [0.18, 0.08, 0.18], transition: loop(pose === 'cheer' ? 1.8 : 0.9, { repeatDelay: pose === 'cheer' ? 0.3 : 0 }) } : { scaleX: 1, opacity: 0.18 })} />

      <motion.g animate={a(p.feet)}>
        <path d="M53 101 v10 M69 101 v10" stroke="#6E3A2A" strokeWidth="3.6" strokeLinecap="round" />
        <ellipse cx="51" cy="113" rx="7.6" ry="4.3" fill="#8B4935" /><ellipse cx="71" cy="113" rx="7.6" ry="4.3" fill="#8B4935" />
        <ellipse cx="49" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" /><ellipse cx="69" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" />
      </motion.g>

      <motion.g animate={a(p.body)} style={at(61, 112)}>
        <path d={STAR} transform="translate(1.6 3.4)" fill={`url(#${id('edge')})`} />
        <path d={STAR} fill={`url(#${id('gold')})`} stroke="#6B0F12" strokeWidth="1.1" strokeLinejoin="round" />
        <path d={STAR} fill="none" stroke="#FFB4AC" strokeOpacity=".6" strokeWidth="1" strokeLinejoin="round" transform="translate(-.6 -.8)" clipPath={`url(#${id('clip')})`} />
        <path d={STAR_IN} fill={`url(#${id('bevel')})`} stroke="#F2C46A" strokeOpacity=".95" strokeWidth="1.6" strokeLinejoin="round" />
        <g clipPath={`url(#${id('clip')})`}>
          <motion.rect x="-40" y="0" width="20" height="130" fill="#FFFFFF" opacity=".26" transform="rotate(-28 61 61)"
            animate={a({ x: [-40, 150], transition: { duration: pose === 'proud' ? 1.6 : 3.2, repeat: Infinity, repeatDelay: pose === 'proud' ? 1 : 5, ease } })} />
        </g>
        <circle cx="61.4" cy="61.6" r="21" fill="#5A0C0F" opacity=".4" />
        <circle cx="61" cy="61" r="22.2" fill="none" stroke="#E5A93C" strokeWidth="1.4" />
        <circle cx="61" cy="61" r="20.5" fill={`url(#${id('face')})`} />
        <EyeSet kind={p.eyes} look={pose === 'idle' || pose === 'peek'} />
        <motion.g animate={{ opacity: p.blush ?? 0.55 }} transition={soft}>
          <ellipse cx="46.5" cy="68.5" rx="4.4" ry="2.4" fill="#F29C9C" /><ellipse cx="75.5" cy="68.5" rx="4.4" ry="2.4" fill="#F29C9C" />
        </motion.g>
        {/* arms in front, so a hand can rest on the heart or the chin */}
        <motion.g animate={a(p.armL)} style={at(34, 68)}><Arm side="L" id={id} /></motion.g>
        <motion.g animate={a(p.armR)} style={at(88, 68)}><Arm side="R" id={id} /></motion.g>
      </motion.g>
    </svg>
  );
}
