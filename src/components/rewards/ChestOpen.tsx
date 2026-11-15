import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence, useAnimationControls, useReducedMotion } from 'motion/react';
import { Button } from '../ui/Button';
import FocusTrap from '../FocusTrap';

/**
 * Tap-to-open reward chest, used wherever the site gives a chest (challenge wins, later review chests).
 * Three taps, an optional rarity upgrade on the second tap, then the lid bursts open and the reward rises.
 * The reward and rarity must come from the server; this component only plays them.
 */

export type ChestRarity = 'rare' | 'epic';
export interface ChestReward { title: string; xp: number; image?: string }

const TIER = {
  rare: { label: 'نادر', bg: '#087D91', bgDeep: '#065A69', panel: '#0E93A8', panelDark: '#066474', spark: '#D5EEF1' },
  epic: { label: 'ملحمي', bg: '#9E161A', bgDeep: '#6E0F12', panel: '#C51F24', panelDark: '#8A1418', spark: '#FFE2B8' },
} as const;
const GOLD = '#F2B53A';
const GOLD_LIGHT = '#FFD978';
const GOLD_DARK = '#B97A12';

function Chest({ tier, lidOpen, glow }: { tier: (typeof TIER)[ChestRarity]; lidOpen: boolean; glow: boolean }) {
  return (
    <svg viewBox="0 0 200 190" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="100" cy="178" rx="70" ry="9" fill="#000" opacity="0.18" />
      {/* inside light, visible once the lid lifts */}
      <motion.path d="M38 92 h124 v14 h-124z" fill={GOLD_LIGHT} initial={false} animate={{ opacity: glow ? 1 : 0 }} />
      {/* body */}
      <rect x="30" y="92" width="140" height="80" rx="14" fill={tier.panelDark} />
      <rect x="30" y="92" width="140" height="70" rx="14" fill={tier.panel} />
      <rect x="44" y="104" width="112" height="6" rx="3" fill="#fff" opacity="0.14" />
      <rect x="44" y="120" width="112" height="6" rx="3" fill="#000" opacity="0.08" />
      <rect x="22" y="88" width="30" height="86" rx="10" fill={GOLD_DARK} />
      <rect x="22" y="88" width="30" height="78" rx="10" fill={GOLD} />
      <rect x="148" y="88" width="30" height="86" rx="10" fill={GOLD_DARK} />
      <rect x="148" y="88" width="30" height="78" rx="10" fill={GOLD} />
      <rect x="26" y="92" width="8" height="60" rx="4" fill={GOLD_LIGHT} opacity="0.8" />
      {/* lid, pivots on its back edge */}
      <motion.g
        style={{ transformOrigin: '100px 92px', transformBox: 'view-box' }}
        initial={false}
        animate={lidOpen ? { rotate: -24, y: -46, x: -6 } : { rotate: 0, y: 0, x: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 13 }}
      >
        <path d="M30 96 Q30 44 100 40 Q170 44 170 96 Z" fill={tier.panelDark} />
        <path d="M34 92 Q36 50 100 46 Q164 50 166 92 Z" fill={tier.panel} />
        <path d="M52 70 Q100 52 148 70" stroke="#fff" strokeOpacity="0.18" strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d="M22 98 Q20 48 46 42 L52 44 Q36 56 38 98 Z" fill={GOLD} />
        <path d="M178 98 Q180 48 154 42 L148 44 Q164 56 162 98 Z" fill={GOLD} />
        <rect x="20" y="86" width="160" height="16" rx="8" fill={GOLD_DARK} />
        <rect x="20" y="84" width="160" height="13" rx="6.5" fill={GOLD} />
        <rect x="30" y="86" width="60" height="4" rx="2" fill={GOLD_LIGHT} />
        {/* khatam lock */}
        <g transform="translate(100 98)">
          <rect x="-15" y="-15" width="30" height="30" rx="5" fill={GOLD_DARK} transform="rotate(45)" />
          <rect x="-15" y="-15" width="30" height="30" rx="5" fill={GOLD_DARK} />
          <rect x="-13" y="-13" width="26" height="26" rx="4" fill={GOLD} transform="rotate(45)" />
          <rect x="-13" y="-13" width="26" height="26" rx="4" fill={GOLD} />
          <circle r="6" fill="#fff" opacity="0.9" />
        </g>
      </motion.g>
    </svg>
  );
}

const SPARKS = Array.from({ length: 10 }, (_, i) => ({ x: (i * 37) % 100, y: (i * 53) % 100, d: 1.6 + (i % 4) * 0.5, s: 6 + (i % 3) * 4 }));

export function ChestOpen({ rarity, upgrade = false, reward, onDone }: { rarity: ChestRarity; upgrade?: boolean; reward: ChestReward; onDone: () => void }) {
  const still = useReducedMotion();
  const chest = useAnimationControls();
  const [taps, setTaps] = useState(0);
  const [tier, setTier] = useState<ChestRarity>(rarity);
  const [swoosh, setSwoosh] = useState(0);
  const [phase, setPhase] = useState<'tapping' | 'ready' | 'opening' | 'open'>('tapping');
  const [burst, setBurst] = useState(0);
  const t = TIER[tier];
  const finalTier: ChestRarity = upgrade ? 'epic' : rarity;
  const particles = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ a: (i / 22) * Math.PI * 2 + (i % 2) * 0.2, r: 110 + (i % 5) * 28, s: 5 + (i % 4) * 3 })), []);

  useEffect(() => {
    if (still || phase !== 'tapping') return;
    const id = setInterval(() => chest.start({ rotate: [0, -4, 4, -3, 0], transition: { duration: 0.5 } }), 2600);
    return () => clearInterval(id);
  }, [still, phase, chest]);

  const tap = async () => {
    if (phase === 'opening' || phase === 'open') return;
    if (phase === 'ready') {
      setPhase('opening');
      if (!still) await chest.start({ x: [0, -7, 7, -9, 9, -5, 0], scale: [1, 1.04, 1.04, 1.08, 1.08, 1.12, 1], transition: { duration: 0.45 } });
      setBurst((b) => b + 1);
      setPhase('open');
      return;
    }
    const n = taps + 1;
    setTaps(n);
    setBurst((b) => b + 1);
    if (!still) chest.start({ y: [0, -38, 0], scaleY: [1, 1.08, 0.86, 1], scaleX: [1, 0.94, 1.12, 1], transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } });
    if (n === 2 && upgrade) setTimeout(() => { setSwoosh((s) => s + 1); setTier('epic'); }, 260);
    if (n === 3) setTimeout(() => setPhase('ready'), 500);
  };

  const hint = phase === 'ready' ? 'اضغط للفتح!' : taps === 2 ? 'باقي ضغطة!' : 'اضغط! اضغط!';

  return (
    <FocusTrap onEscape={onDone}>
    <motion.div
      className="fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden px-6 text-white"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, backgroundColor: phase === 'open' ? '#1C120D' : t.bg }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.45 }}
      role="dialog"
      aria-modal="true"
      aria-label="صندوق جايزة"
    >
      {!still && SPARKS.map((p, i) => (
        <motion.span
          key={i}
          className="pointer-events-none absolute"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.s, height: p.s, background: t.spark, clipPath: 'polygon(50% 0,62% 38%,100% 50%,62% 62%,50% 100%,38% 62%,0 50%,38% 38%)' }}
          animate={{ opacity: [0, 1, 0], scale: [0.4, 1, 0.4] }}
          transition={{ duration: p.d, repeat: Infinity, delay: i * 0.3 }}
        />
      ))}

      <AnimatePresence mode="popLayout">
        {phase !== 'open' && (
          <motion.p key={tier} className="font-display text-2xl tracking-wide" initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }}>
            {TIER[tier].label}
          </motion.p>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={tap}
        className="relative mt-6 h-[210px] w-[220px] cursor-pointer touch-manipulation rounded-3xl outline-none focus-visible:ring-2 focus-visible:ring-white/70"
        aria-label={phase === 'open' ? 'اتفتح' : hint}
        disabled={phase === 'opening' || phase === 'open'}
      >
        {/* light rays + glow behind the open chest */}
        <AnimatePresence>
          {phase === 'open' && (
            <motion.div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2" initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}>
              <motion.div
                className="h-[520px] w-[520px] rounded-full"
                style={{ background: `repeating-conic-gradient(from 0deg, ${GOLD_LIGHT}55 0deg 9deg, transparent 9deg 24deg)`, maskImage: 'radial-gradient(circle, #000 18%, transparent 62%)', WebkitMaskImage: 'radial-gradient(circle, #000 18%, transparent 62%)' }}
                animate={still ? undefined : { rotate: 360 }}
                transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 m-auto h-40 w-40 rounded-full blur-2xl" style={{ background: GOLD_LIGHT, opacity: 0.55 }} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* rarity upgrade swoosh */}
        <AnimatePresence>
          {swoosh > 0 && (
            <motion.svg key={swoosh} viewBox="0 0 200 200" className="pointer-events-none absolute -inset-10 h-[calc(100%+80px)] w-[calc(100%+80px)]" initial={{ rotate: -120, opacity: 1 }} animate={{ rotate: 200, opacity: [1, 1, 0] }} transition={{ duration: 0.8, ease: 'easeOut' }}>
              <path d="M100 12 A88 88 0 1 1 22 60" fill="none" stroke="#fff" strokeWidth="7" strokeLinecap="round" />
            </motion.svg>
          )}
        </AnimatePresence>

        <motion.div className="relative h-full w-full" animate={chest} style={{ transformOrigin: '50% 90%' }}>
          <Chest tier={t} lidOpen={phase === 'open'} glow={phase === 'open'} />
        </motion.div>

        {/* the reward rises out of the chest and floats above it */}
        {phase === 'open' && reward.image && (
          <motion.img
            src={reward.image}
            alt=""
            className="pointer-events-none absolute left-1/2 top-[30%] h-28 w-auto -translate-x-1/2 drop-shadow-[0_10px_28px_rgba(255,217,120,0.7)]"
            initial={{ y: 40, scale: 0.3, opacity: 0 }}
            animate={still ? { y: -120, scale: 1, opacity: 1 } : { y: [-110, -126, -110], scale: 1, opacity: 1 }}
            transition={still ? { duration: 0 } : { y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.7 }, default: { type: 'spring', stiffness: 180, damping: 14, delay: 0.15 } }}
          />
        )}

        {/* sparkle burst on each tap, bigger when it opens */}
        <AnimatePresence>
          {burst > 0 && !still && (
            <motion.div key={burst} className="pointer-events-none absolute left-1/2 top-1/2" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: phase === 'open' ? 1.4 : 0.7, delay: 0.2 }}>
              {particles.slice(0, phase === 'open' ? 22 : 9).map((p, i) => (
                <motion.span
                  key={i}
                  className="absolute rounded-full"
                  style={{ width: p.s, height: p.s, background: i % 3 ? GOLD_LIGHT : '#fff' }}
                  initial={{ x: 0, y: 0, scale: 0 }}
                  animate={{ x: Math.cos(p.a) * p.r * (phase === 'open' ? 1.4 : 0.6), y: Math.sin(p.a) * p.r * (phase === 'open' ? 1.4 : 0.6) - (phase === 'open' ? 60 : 20), scale: [0, 1.2, 0.6] }}
                  transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      <div className="mt-6 min-h-[132px] text-center">
        <AnimatePresence mode="wait">
          {phase === 'open' ? (
            <motion.div key="reward" className="flex flex-col items-center" initial={{ y: 60, opacity: 0, scale: 0.6 }} animate={{ y: 0, opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16, delay: 0.25 }}>
              <p className="text-sm text-[#FFD978]">{TIER[finalTier].label}</p>
              <p className="font-editorial text-[26px] leading-tight">{reward.title}</p>
              <p className="mt-1 font-display text-lg tabular-nums" dir="ltr">+{reward.xp} XP</p>
              <Button className="mt-5 min-w-[200px]" onClick={onDone} autoFocus>تمام</Button>
            </motion.div>
          ) : (
            <motion.div key="tapping" exit={{ opacity: 0 }}>
              <div className="flex justify-center gap-3" aria-hidden>
                {[0, 1, 2].map((i) => (
                  <motion.span key={i} className="h-4 w-4 rounded-full border-2 border-white/80" animate={{ backgroundColor: i < taps ? '#FFFFFF' : 'rgba(255,255,255,0)', scale: i === taps - 1 ? [1, 1.5, 1] : 1 }} transition={{ duration: 0.35 }} />
                ))}
              </div>
              <motion.p key={hint} className="mt-4 font-display text-lg" initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>{hint}</motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
    </FocusTrap>
  );
}
