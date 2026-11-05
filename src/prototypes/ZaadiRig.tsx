import React, { useId } from 'react';
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';

/**
 * Zaadi with a body (prototype v2, "premium"): a burnished gold khatam with a bevel, a sheen and a rim, glossy eyes
 * that look around, feathered wings with follow-through, and sparkles when it celebrates.
 * Pure SVG + Motion, no new dependency. Every part moves around its own joint, so nothing leaves the figure.
 */
export type ZaadiPose = 'idle' | 'wave' | 'cheer' | 'point' | 'thanks' | 'sad' | 'peek';

const loop = { repeat: Infinity, ease: 'easeInOut' as const };
const joint = (x: number, y: number) => ({ transformBox: 'fill-box' as const, originX: x, originY: y });
// wings trail the body a little (follow-through), which is what makes motion feel alive
const lag = (t: TargetAndTransition, d = 0.08): TargetAndTransition => ({ ...t, transition: { ...(t.transition as object), delay: d } });

type Parts = { body: TargetAndTransition; wingL: TargetAndTransition; wingR: TargetAndTransition; feet: TargetAndTransition; eyes: 'open' | 'happy' | 'closed' | 'sad' };

const POSES: Record<ZaadiPose, Parts> = {
  idle: {
    body: { y: [0, -3, 0], scaleY: [1, 1.025, 1], scaleX: [1, 0.99, 1], transition: { duration: 3.4, ...loop } },
    wingL: lag({ rotate: [0, -9, 0], transition: { duration: 3.4, ...loop } }, 0.15),
    wingR: lag({ rotate: [0, 9, 0], transition: { duration: 3.4, ...loop } }, 0.15),
    feet: { y: 0 }, eyes: 'open',
  },
  wave: {
    body: { rotate: [0, 4, 0, 4, 0], transition: { duration: 1.4, ...loop, repeatDelay: 0.4 } },
    wingL: { rotate: 0 },
    wingR: lag({ rotate: [-20, -100, -62, -100, -62, -20], transition: { duration: 1.4, ...loop, repeatDelay: 0.4 } }),
    feet: { y: 0 }, eyes: 'happy',
  },
  cheer: {
    body: { y: [0, 7, -36, 0, 3, 0], scaleY: [1, 0.84, 1.12, 1, 0.94, 1], scaleX: [1, 1.12, 0.93, 1, 1.04, 1], rotate: [0, 0, -8, 0, 0, 0], transition: { duration: 1.15, ...loop, repeatDelay: 0.45 } },
    wingL: lag({ rotate: [0, 40, -55, 35, -40, 0], transition: { duration: 1.15, ...loop, repeatDelay: 0.45 } }),
    wingR: lag({ rotate: [0, -40, 55, -35, 40, 0], transition: { duration: 1.15, ...loop, repeatDelay: 0.45 } }),
    feet: { y: [0, 0, -36, 0, 0, 0], transition: { duration: 1.15, ...loop, repeatDelay: 0.45 } },
    eyes: 'happy',
  },
  point: {
    body: { rotate: [0, -6, -4], x: [0, -3, -2], transition: { duration: 0.5 } },
    wingL: { rotate: [0, -6, 0], transition: { duration: 2, ...loop } },
    wingR: { rotate: [0, -80, -70, -80], transition: { duration: 1.2, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatType: 'mirror' } },
    feet: { y: 0 }, eyes: 'open',
  },
  thanks: {
    body: { rotate: [0, 0, 10, 10, 0], y: [0, 0, 4, 4, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } },
    wingL: lag({ rotate: [0, 72, 72, 72, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } }),
    wingR: lag({ rotate: [0, -10, -10, -10, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } }),
    feet: { y: 0 }, eyes: 'closed',
  },
  sad: {
    body: { y: 5, scaleY: 0.95, rotate: -5, transition: { type: 'spring', stiffness: 120, damping: 12 } },
    wingL: { rotate: 24, transition: { type: 'spring', stiffness: 110, damping: 10, delay: 0.1 } },
    wingR: { rotate: -24, transition: { type: 'spring', stiffness: 110, damping: 10, delay: 0.1 } },
    feet: { y: 0 }, eyes: 'sad',
  },
  peek: {
    body: { y: [0, -2, 0], transition: { duration: 2.4, ...loop } },
    wingL: lag({ rotate: [0, -16, 0], transition: { duration: 2.4, ...loop } }),
    wingR: lag({ rotate: [0, 16, 0], transition: { duration: 2.4, ...loop } }),
    feet: { y: 0 }, eyes: 'open',
  },
};

const INK = '#2A1710';
const STAR = 'M61 22 L72.5 33.3 L88.6 33.4 L88.7 49.5 L100 61 L88.7 72.5 L88.6 88.6 L72.5 88.7 L61 100 L49.5 88.7 L33.4 88.6 L33.3 72.5 L22 61 L33.3 49.5 L33.4 33.4 L49.5 33.3 Z';
const STAR_IN = 'M61 31 L69.6 39.5 L81.6 39.4 L81.7 51.4 L90.2 61 L81.7 70.6 L81.6 82.6 L69.6 82.5 L61 91 L52.4 82.5 L40.4 82.6 L40.3 70.6 L31.8 61 L40.3 51.4 L40.4 39.4 L52.4 39.5 Z';
const WING_L = 'M33 64 C21 55 8 61 7 74 C10 74 12 76 12.5 79 C15.5 79 17.5 81 18.5 84 C25.5 84.5 31.5 79 36 72 Z';
const WING_R = 'M89 64 C101 55 114 61 115 74 C112 74 110 76 109.5 79 C106.5 79 104.5 81 103.5 84 C96.5 84.5 90.5 79 86 72 Z';

function Eyes({ kind, look }: { kind: Parts['eyes']; look: boolean }) {
  const reduce = useReducedMotion();
  if (kind === 'happy') return <g fill="none" stroke={INK} strokeWidth="3.4" strokeLinecap="round"><path d="M49.5 61 q5 -7 10 0" /><path d="M62.5 61 q5 -7 10 0" /></g>;
  if (kind === 'closed') return <g fill="none" stroke={INK} strokeWidth="3.2" strokeLinecap="round"><path d="M49.5 58 q5 5.5 10 0" /><path d="M62.5 58 q5 5.5 10 0" /></g>;
  const sad = kind === 'sad';
  return (
    <g>
      {sad && <g stroke={INK} strokeWidth="2.4" strokeLinecap="round"><path d="M48.5 50.5 l9.5 -4.2" /><path d="M73.5 50.5 l-9.5 -4.2" /></g>}
      <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.08, 1, 1] }} transition={{ duration: 4.6, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }} style={joint(0.5, 0.5)}>
        {/* whites */}
        <ellipse cx="54.5" cy={sad ? 60 : 58.5} rx="5.2" ry={sad ? 5.4 : 6.4} fill="#FFFFFF" />
        <ellipse cx="67.5" cy={sad ? 60 : 58.5} rx="5.2" ry={sad ? 5.4 : 6.4} fill="#FFFFFF" />
        {/* irises look around now and then */}
        <motion.g animate={reduce || !look ? undefined : { x: [0, 0, 1.6, 1.6, 0, -1.6, -1.6, 0], y: [0, 0, 0.4, 0.4, 0, 0.4, 0.4, 0] }}
          transition={{ duration: 7, repeat: Infinity, times: [0, 0.3, 0.34, 0.5, 0.54, 0.7, 0.86, 0.9] }}>
          <ellipse cx="55" cy={sad ? 61 : 59.5} rx="3.6" ry={sad ? 3.9 : 4.6} fill={INK} />
          <ellipse cx="68" cy={sad ? 61 : 59.5} rx="3.6" ry={sad ? 3.9 : 4.6} fill={INK} />
          <circle cx="56.4" cy="57.4" r="1.5" fill="#fff" /><circle cx="69.4" cy="57.4" r="1.5" fill="#fff" />
          <circle cx="53.8" cy="61.6" r=".7" fill="#fff" opacity=".8" /><circle cx="66.8" cy="61.6" r=".7" fill="#fff" opacity=".8" />
        </motion.g>
      </motion.g>
    </g>
  );
}

function Sparkles({ on }: { on: boolean }) {
  const reduce = useReducedMotion();
  if (!on || reduce) return null;
  const pts = [[16, 30, 0], [106, 26, 0.25], [8, 92, 0.5], [114, 96, 0.7], [61, 6, 0.4]] as const;
  return (
    <g>
      {pts.map(([x, y, d], i) => (
        <motion.path key={i} d={`M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z`}
          fill="#FFE7A8" style={joint(0.5, 0.5)}
          animate={{ scale: [0, 1.2, 0], opacity: [0, 1, 0], rotate: [0, 45] }} transition={{ duration: 1.1, repeat: Infinity, delay: d, repeatDelay: 0.5 }} />
      ))}
    </g>
  );
}

export function ZaadiRig({ pose, size = 140, glow = true }: { pose: ZaadiPose; size?: number; glow?: boolean }) {
  const reduce = useReducedMotion();
  const p = POSES[pose];
  const a = (t: TargetAndTransition) => (reduce ? undefined : t);
  // unique ids: a url(#id) pointing into a hidden copy of Zaadi would paint nothing
  const uid = useId().replace(/:/g, '');
  const id = (n: string) => `zr-${n}-${uid}`;
  return (
    <svg viewBox="0 0 122 124" width={size} height={size * 124 / 122} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={id('gold')} cx="38%" cy="28%" r="80%">
          <stop offset="0" stopColor="#FFF0C2" /><stop offset=".38" stopColor="#F2BE55" /><stop offset=".75" stopColor="#D49A35" /><stop offset="1" stopColor="#9C6422" />
        </radialGradient>
        <linearGradient id={id('bevel')} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFF6DA" stopOpacity=".85" /><stop offset=".5" stopColor="#F6D58E" stopOpacity=".15" /><stop offset="1" stopColor="#8A561C" stopOpacity=".35" /></linearGradient>
        <linearGradient id={id('wing')} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#FFF1CC" /><stop offset=".55" stopColor="#F0C66E" /><stop offset="1" stopColor="#C88C2E" /></linearGradient>
        <radialGradient id={id('face')} cx="45%" cy="38%" r="70%"><stop offset="0" stopColor="#FFFDF6" /><stop offset="1" stopColor="#FBEFD6" /></radialGradient>
        <radialGradient id={id('halo')} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#F6C25A" stopOpacity=".45" /><stop offset="1" stopColor="#F6C25A" stopOpacity="0" /></radialGradient>
        <clipPath id={id('clip')}><path d={STAR} /></clipPath>
      </defs>

      {glow && <motion.circle cx="61" cy="62" r="58" fill={`url(#${id('halo')})`} animate={a({ opacity: [0.7, 1, 0.7], transition: { duration: 3.4, ...loop } })} />}
      <Sparkles on={pose === 'cheer'} />

      <motion.ellipse cx="61" cy="119" rx="24" ry="4" fill="#3A1A08" opacity=".18" style={joint(0.5, 0.5)}
        animate={a(pose === 'cheer' ? { scaleX: [1, 1.1, 0.55, 1, 1, 1], opacity: [0.18, 0.22, 0.07, 0.18, 0.18, 0.18], transition: { duration: 1.15, repeat: Infinity, repeatDelay: 0.45 } } : { scaleX: 1 })} />

      {/* feet */}
      <motion.g animate={a(p.feet)}>
        <path d="M52.5 103 v8.5 M69.5 103 v8.5" stroke="#A86E26" strokeWidth="3.6" strokeLinecap="round" />
        <ellipse cx="50.5" cy="113" rx="7.6" ry="4.3" fill="#B97A2C" /><ellipse cx="71.5" cy="113" rx="7.6" ry="4.3" fill="#B97A2C" />
        <ellipse cx="48.5" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" /><ellipse cx="69.5" cy="111.6" rx="3.2" ry="1.3" fill="#F6D58E" opacity=".55" />
      </motion.g>

      <motion.g animate={a(p.body)} style={joint(0.5, 0.95)}>
        {/* feathered wings */}
        <motion.g animate={a(p.wingL)} style={joint(0.95, 0.25)}>
          <path d={WING_L} fill={`url(#${id('wing')})`} stroke="#A86E26" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M30 67 C22 66 16 69 13 75 M31 71 C25 72 21 76 19 80" fill="none" stroke="#B9782A" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
        </motion.g>
        <motion.g animate={a(p.wingR)} style={joint(0.05, 0.25)}>
          <path d={WING_R} fill={`url(#${id('wing')})`} stroke="#A86E26" strokeWidth="1.1" strokeLinejoin="round" />
          <path d="M92 67 C100 66 106 69 109 75 M91 71 C97 72 101 76 103 80" fill="none" stroke="#B9782A" strokeOpacity=".45" strokeWidth="1" strokeLinecap="round" />
        </motion.g>

        {/* the khatam body: gold, bevel, engraved inner star, sheen, rim */}
        <path d={STAR} fill={`url(#${id('gold')})`} stroke="#8A561C" strokeWidth="1.4" strokeLinejoin="round" />
        <path d={STAR_IN} fill={`url(#${id('bevel')})`} stroke="#FFF2C9" strokeOpacity=".55" strokeWidth=".9" strokeLinejoin="round" />
        <g clipPath={`url(#${id('clip')})`}>
          <motion.rect x="-40" y="10" width="22" height="120" fill="#FFFFFF" opacity=".28" transform="rotate(-28 61 61)"
            animate={a({ x: [-40, 150], transition: { duration: 2.6, repeat: Infinity, repeatDelay: 4.5, ease: 'easeInOut' } })} />
        </g>

        {/* face */}
        <circle cx="61" cy="62" r="20.5" fill={`url(#${id('face')})`} stroke="#E9C98B" strokeWidth="1" />
        <Eyes kind={p.eyes} look={pose === 'idle' || pose === 'peek'} />
        <ellipse cx="46.5" cy="69.5" rx="4.2" ry="2.3" fill="#F29C9C" opacity=".55" /><ellipse cx="75.5" cy="69.5" rx="4.2" ry="2.3" fill="#F29C9C" opacity=".55" />
      </motion.g>
    </svg>
  );
}
