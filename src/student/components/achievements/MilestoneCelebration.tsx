import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { X } from 'lucide-react';
import FocusTrap from '../../../components/FocusTrap';
import { AchievementEmblem } from './AchievementEmblems';
import type { AgeGroup, Bilingual, CelebrationItem } from './achievements';
import type { IslamicSeason } from '../../../lib/islamicSeason';

/**
 * PR-04: one short celebration for a new achievement, then it settles on the shelf. No sound (adab rule).
 * Kids: the emblem springs up, a gold pulse, gentle falling stars and crescents (2 s).
 * Teens: it rises smoothly with a soft halo (1.5 s). Adults and guardians: a quiet fade with a still glow (1 s).
 * Reduced motion: everything appears at once, no confetti.
 */
export function MilestoneCelebration({
  item, headline, seasonLine, season, ageGroup, alsoNew, isAr, onClose
}: {
  item: CelebrationItem;
  headline: Bilingual;
  seasonLine: Bilingual | null;
  season: IslamicSeason;
  ageGroup: AgeGroup;
  alsoNew: number;
  isAr: boolean;
  onClose: () => void;
}) {
  const reduce = useReducedMotion();
  const pick = (b: Bilingual) => (isAr ? b.ar : b.en);
  const playful = ageGroup === 'kids' && !reduce;

  const emblemMotion = reduce
    ? { initial: false as const }
    : ageGroup === 'kids'
      ? { initial: { y: 70, scale: 0.6, opacity: 0 }, animate: { y: 0, scale: 1, opacity: 1 }, transition: { type: 'spring' as const, stiffness: 200, damping: 15 } }
      : ageGroup === 'teens'
        ? { initial: { y: 24, opacity: 0 }, animate: { y: 0, opacity: 1 }, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const } }
        : { initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { duration: 0.6 } };

  const glowMotion = reduce || ageGroup === 'adults'
    ? { initial: false as const }
    : ageGroup === 'kids'
      ? { initial: { opacity: 0, scale: 0.6 }, animate: { opacity: [0, 0.75, 0.35], scale: [0.6, 1.25, 1] }, transition: { duration: 2, times: [0, 0.45, 1] } }
      : { initial: { opacity: 0 }, animate: { opacity: 0.6 }, transition: { duration: 1.2 } };

  return (
    <FocusTrap onEscape={onClose}>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="milestone-celebration-title"
        aria-describedby="milestone-celebration-praise"
        dir={isAr ? 'rtl' : 'ltr'}
        data-testid="milestone-celebration"
        data-age-group={ageGroup}
      >
        <div className="absolute inset-0 bg-[#05363F]/55 dark:bg-black/65 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

        {playful && <Confetti />}

        <motion.div
          initial={reduce ? false : { opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-sm rounded-[28px] glass-dialog border border-[#E5A93C]/40 shadow-2xl px-6 pt-10 pb-6 text-center text-foreground overflow-hidden"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            className="absolute top-3 end-3 w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle focus-ring cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>

          <div className="relative mx-auto w-36 h-36 flex items-center justify-center">
            <motion.div
              {...glowMotion}
              aria-hidden="true"
              className="absolute inset-0 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(246,213,142,0.85) 0%, rgba(229,169,60,0.35) 45%, transparent 70%)', opacity: reduce || ageGroup === 'adults' ? 0.5 : undefined }}
            />
            {season === 'ramadan' && <SeasonMark kind="crescent" />}
            {season === 'dhul-hijjah' && <SeasonMark kind="kaaba" />}
            <motion.div {...emblemMotion} className="relative">
              <AchievementEmblem id={item.emblem} className="w-28 h-28 drop-shadow-[0_10px_24px_rgba(185,120,42,0.45)]" />
            </motion.div>
          </div>

          <p className="mt-4 text-xs font-bold uppercase tracking-wider text-[#B9782A] dark:text-[#E5A93C]">
            {isAr ? 'إنجاز جديد' : 'New milestone'}
          </p>
          <h2 id="milestone-celebration-title" className="mt-1 font-display text-2xl font-bold leading-snug">
            {pick(item.title)}
          </h2>
          <p id="milestone-celebration-praise" className="mt-2 text-base text-foreground/90 leading-relaxed">
            {pick(headline)}
          </p>
          {seasonLine && <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{pick(seasonLine)}</p>}
          {alsoNew > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {isAr
                ? (alsoNew === 1 ? 'ومعاه وسام تاني على الرف' : `ومعاه ${alsoNew.toLocaleString('ar-EG')} أوسمة تانية على الرف`)
                : `${alsoNew === 1 ? 'One more emblem is' : `${alsoNew} more emblems are`} waiting on your shelf`}
            </p>
          )}

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full min-h-11 rounded-2xl btn-primary-material text-primary-foreground text-sm font-bold cursor-pointer"
          >
            {isAr ? 'كمّل' : 'Continue'}
          </button>
        </motion.div>
      </div>
    </FocusTrap>
  );
}

/** Faint seasonal mark behind the emblem: a crescent in Ramadan, the Kaaba's outline in the first days of Dhul Hijjah. */
function SeasonMark({ kind }: { kind: 'crescent' | 'kaaba' }) {
  return (
    <svg viewBox="0 0 96 96" className="absolute inset-0 w-full h-full opacity-25" aria-hidden="true" fill="none">
      {kind === 'crescent'
        ? <path d="M64 14 A36 36 0 1 0 64 82 A28 28 0 1 1 64 14 Z" fill="#F6D58E" />
        : <g stroke="#F6D58E" strokeWidth="2"><path d="M26 34 L48 26 L70 34 V70 L48 78 L26 70 Z" /><path d="M26 34 L48 42 L70 34 M48 42 V78 M26 44 L48 52 L70 44" /></g>}
    </svg>
  );
}

/** About two dozen small stars and crescents drifting down once, then fading. Transform and opacity only. */
function Confetti() {
  const pieces = React.useMemo(
    () => Array.from({ length: 24 }, (_, i) => ({
      left: (i * 41) % 100,
      delay: (i % 8) * 0.08,
      drift: ((i * 37) % 60) - 30,
      rotate: ((i * 53) % 220) - 110,
      kind: i % 3,
      color: ['#E5A93C', '#14A3B8', '#F6D58E', '#C51F24'][i % 4]
    })),
    []
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <motion.svg
          key={i}
          viewBox="0 0 20 20"
          className="absolute top-0 w-3.5 h-3.5"
          style={{ left: `${p.left}%` }}
          initial={{ y: -30, x: 0, rotate: 0, opacity: 0 }}
          animate={{ y: '75vh', x: p.drift, rotate: p.rotate, opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.9, delay: p.delay, ease: 'easeIn', times: [0, 0.1, 0.75, 1] }}
        >
          {p.kind === 0 && <path d="M10 1 L12 7.5 L19 10 L12 12.5 L10 19 L8 12.5 L1 10 L8 7.5 Z" fill={p.color} />}
          {p.kind === 1 && <path d="M13 2 A8 8 0 1 0 13 18 A6 6 0 1 1 13 2 Z" fill={p.color} />}
          {p.kind === 2 && <rect x="5" y="5" width="10" height="10" transform="rotate(45 10 10)" fill={p.color} />}
        </motion.svg>
      ))}
    </div>
  );
}
