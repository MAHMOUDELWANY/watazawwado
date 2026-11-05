import React, { useId } from 'react';
import { motion, useReducedMotion, type TargetAndTransition } from 'motion/react';

/**
 * Zaadi with a body (prototype): a gold khatam star with eyes, two small wings and two feet, so it can wave, point,
 * cheer, thank and feel sad, the way a mascot talks with motion. Pure SVG + Motion, no new dependency.
 * Every part rotates around its own joint (transformBox fill-box + origin), so nothing leaves the figure.
 */
export type ZaadiPose = 'idle' | 'wave' | 'cheer' | 'point' | 'thanks' | 'sad' | 'peek';

const loop = { repeat: Infinity, ease: 'easeInOut' as const };
const joint = (x: number, y: number) => ({ transformBox: 'fill-box' as const, originX: x, originY: y });

type Parts = { body: TargetAndTransition; wingL: TargetAndTransition; wingR: TargetAndTransition; feet: TargetAndTransition; eyes: 'open' | 'happy' | 'closed' | 'sad' };

const POSES: Record<ZaadiPose, Parts> = {
  idle: {
    body: { y: [0, -3, 0], scaleY: [1, 1.02, 1], transition: { duration: 3.2, ...loop } },
    wingL: { rotate: [0, -8, 0], transition: { duration: 3.2, ...loop } },
    wingR: { rotate: [0, 8, 0], transition: { duration: 3.2, ...loop } },
    feet: { y: 0 }, eyes: 'open',
  },
  wave: {
    body: { rotate: [0, 4, 0, 4, 0], transition: { duration: 1.4, ...loop, repeatDelay: 0.4 } },
    wingL: { rotate: 0 },
    wingR: { rotate: [-20, -95, -60, -95, -60, -20], transition: { duration: 1.4, ...loop, repeatDelay: 0.4 } },
    feet: { y: 0 }, eyes: 'happy',
  },
  cheer: {
    body: { y: [0, 6, -34, 0, 3, 0], scaleY: [1, 0.86, 1.1, 1, 0.94, 1], scaleX: [1, 1.1, 0.94, 1, 1.04, 1], rotate: [0, 0, -8, 0, 0, 0], transition: { duration: 1.1, ...loop, repeatDelay: 0.5 } },
    wingL: { rotate: [0, 40, -50, 30, -40, 0], transition: { duration: 1.1, ...loop, repeatDelay: 0.5 } },
    wingR: { rotate: [0, -40, 50, -30, 40, 0], transition: { duration: 1.1, ...loop, repeatDelay: 0.5 } },
    feet: { y: [0, 0, -34, 0, 0, 0], transition: { duration: 1.1, ...loop, repeatDelay: 0.5 } },
    eyes: 'happy',
  },
  point: {
    body: { rotate: [0, -6, -4], x: [0, -3, -2], transition: { duration: 0.5 } },
    wingL: { rotate: [0, -6, 0], transition: { duration: 2, ...loop } },
    wingR: { rotate: [0, -78, -70, -78], transition: { duration: 1.2, times: [0, 0.3, 0.65, 1], repeat: Infinity, repeatType: 'mirror' } },
    feet: { y: 0 }, eyes: 'open',
  },
  thanks: {
    body: { rotate: [0, 0, 10, 10, 0], y: [0, 0, 4, 4, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } },
    wingL: { rotate: [0, 70, 70, 70, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } },
    wingR: { rotate: [0, -10, -10, -10, 0], transition: { duration: 2.2, ...loop, repeatDelay: 0.6 } },
    feet: { y: 0 }, eyes: 'closed',
  },
  sad: {
    body: { y: 5, scaleY: 0.95, rotate: -5, transition: { type: 'spring', stiffness: 120, damping: 12 } },
    wingL: { rotate: 22, transition: { type: 'spring', stiffness: 120, damping: 12 } },
    wingR: { rotate: -22, transition: { type: 'spring', stiffness: 120, damping: 12 } },
    feet: { y: 0 }, eyes: 'sad',
  },
  peek: {
    body: { y: [0, -2, 0], transition: { duration: 2.4, ...loop } },
    wingL: { rotate: [0, -14, 0], transition: { duration: 2.4, ...loop } },
    wingR: { rotate: [0, 14, 0], transition: { duration: 2.4, ...loop } },
    feet: { y: 0 }, eyes: 'open',
  },
};

function Eyes({ kind }: { kind: Parts['eyes'] }) {
  const reduce = useReducedMotion();
  const ink = '#2B1A12';
  if (kind === 'happy') return <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round"><path d="M50 60 q4.5 -6 9 0" /><path d="M63 60 q4.5 -6 9 0" /></g>;
  if (kind === 'closed') return <g fill="none" stroke={ink} strokeWidth="3.2" strokeLinecap="round"><path d="M50 57 q4.5 5 9 0" /><path d="M63 57 q4.5 5 9 0" /></g>;
  return (
    <g>
      {kind === 'sad' && <g stroke={ink} strokeWidth="2.4" strokeLinecap="round"><path d="M49 51 l9 -4" /><path d="M73 51 l-9 -4" /></g>}
      <motion.g animate={reduce ? undefined : { scaleY: [1, 1, 0.1, 1, 1] }} transition={{ duration: 4, repeat: Infinity, times: [0, 0.9, 0.93, 0.96, 1] }}
        style={joint(0.5, 0.5)} fill={ink}>
        <ellipse cx="54.5" cy={kind === 'sad' ? 60 : 58} rx="3.6" ry={kind === 'sad' ? 4.2 : 5} />
        <ellipse cx="67.5" cy={kind === 'sad' ? 60 : 58} rx="3.6" ry={kind === 'sad' ? 4.2 : 5} />
        <circle cx="55.8" cy="56.2" r="1.3" fill="#fff" /><circle cx="68.8" cy="56.2" r="1.3" fill="#fff" />
      </motion.g>
    </g>
  );
}

export function ZaadiRig({ pose, size = 140 }: { pose: ZaadiPose; size?: number }) {
  const reduce = useReducedMotion();
  const p = POSES[pose];
  // unique gradient ids: a url(#id) pointing into a hidden copy of Zaadi would paint nothing
  const uid = useId().replace(/:/g, '');
  const gold = `zr-gold-${uid}`, wing = `zr-wing-${uid}`;
  const a = (t: TargetAndTransition) => (reduce ? undefined : t);
  return (
    <svg viewBox="0 0 122 124" width={size} height={size * 124 / 122} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <radialGradient id={gold} cx="45%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFF1C9" /><stop offset=".5" stopColor="#EDB548" /><stop offset="1" stopColor="#B9782A" />
        </radialGradient>
        <linearGradient id={wing} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#F6D58E" /><stop offset="1" stopColor="#D49A35" /></linearGradient>
      </defs>
      {/* ground shadow */}
      <motion.ellipse cx="61" cy="119" rx="26" ry="4.5" fill="#5A2A10" opacity=".16"
        animate={a(pose === 'cheer' ? { scaleX: [1, 1.1, 0.6, 1, 1, 1], opacity: [0.16, 0.2, 0.08, 0.16, 0.16, 0.16], transition: { duration: 1.1, repeat: Infinity, repeatDelay: 0.5 } } : { scaleX: 1 })}
        style={joint(0.5, 0.5)} />
      {/* feet */}
      <motion.g animate={a(p.feet)} fill="#B9782A">
        <path d="M52 104 v8 M70 104 v8" stroke="#B9782A" strokeWidth="3.5" strokeLinecap="round" /><ellipse cx="50" cy="113" rx="7.5" ry="4.2" /><ellipse cx="72" cy="113" rx="7.5" ry="4.2" />
      </motion.g>
      {/* body + wings move together; wings also swing on their shoulders */}
      <motion.g animate={a(p.body)} style={joint(0.5, 0.95)}>
        <motion.path animate={a(p.wingL)} style={joint(0.95, 0.2)}
          d="M30 62 C14 58 6 70 9 84 C18 86 28 80 34 72 Z" fill={`url(#${wing})`} stroke="#B9782A" strokeWidth="1.2" />
        <motion.path animate={a(p.wingR)} style={joint(0.05, 0.2)}
          d="M92 62 C108 58 116 70 113 84 C104 86 94 80 88 72 Z" fill={`url(#${wing})`} stroke="#B9782A" strokeWidth="1.2" />
        <g>
          <rect x="29" y="29" width="64" height="64" rx="10" fill={`url(#${gold})`} />
          <rect x="29" y="29" width="64" height="64" rx="10" fill={`url(#${gold})`} transform="rotate(45 61 61)" />
          <circle cx="61" cy="62" r="21" fill="#FFF8E8" />
          <Eyes kind={p.eyes} />
          <ellipse cx="46" cy="69" rx="4" ry="2.2" fill="#F4A3A3" opacity=".6" /><ellipse cx="76" cy="69" rx="4" ry="2.2" fill="#F4A3A3" opacity=".6" />
        </g>
      </motion.g>
    </svg>
  );
}
