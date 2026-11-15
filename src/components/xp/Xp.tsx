import React, { useId } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { FlaskConical, Lock } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * XP design system (owner, 2026-11-15; spec docs/design/XP.md). One look for points wherever a child sees them:
 * the gold khatam coin, the count, the bar to the next milestone, the "+N" that rises when points arrive, the stage
 * track, achievement tiles and dance tiles. Built on the site tokens (--gold, --gold-soft, --gold-deep, --crimson,
 * --copper) so light and dark themes both work. No green: progress fills crimson to gold.
 */

const STAR = 'M12 2.2 L14.6 4.9 L18.4 4.9 L18.4 8.6 L21.1 11.3 L18.4 14 L18.4 17.7 L14.6 17.7 L12 20.4 L9.4 17.7 L5.6 17.7 L5.6 14 L2.9 11.3 L5.6 8.6 L5.6 4.9 L9.4 4.9 Z';

/** The XP coin: a gold disc with the khatam star struck into it. */
export function XpCoin({ size = 20, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" className={cn('shrink-0 drop-shadow-[0_1px_1px_rgba(90,40,10,0.35)]', className)}>
      <defs>
        <radialGradient id={`xc-${id}`} cx="35%" cy="28%" r="80%">
          <stop offset="0" stopColor="#FFF3C9" /><stop offset=".45" stopColor="#F3C15A" /><stop offset="1" stopColor="#B9782A" />
        </radialGradient>
        <linearGradient id={`xs-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFE9A8" /><stop offset="1" stopColor="#C98A2E" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="12" r="11.2" fill={`url(#xc-${id})`} stroke="#9A6220" strokeWidth=".8" />
      <circle cx="12" cy="12" r="9" fill="none" stroke="#FFF3C9" strokeOpacity=".55" strokeWidth=".6" />
      <path d={STAR} transform="translate(0 .7) scale(1)" fill="#A86A22" opacity=".55" />
      <path d={STAR} fill={`url(#xs-${id})`} stroke="#9A6220" strokeWidth=".5" strokeLinejoin="round" />
    </svg>
  );
}

/** The total: coin, number, "XP". `hero` is the big one at the top of the companion card. */
export function XpCount({ xp, size = 'chip', label = 'XP', className }: { xp: number; size?: 'chip' | 'hero'; label?: string; className?: string }) {
  const hero = size === 'hero';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-bold tabular-nums',
        'bg-[color-mix(in_srgb,var(--gold)_16%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--gold)_45%,transparent)] text-[var(--gold-deep)] dark:text-[var(--gold-soft)]',
        hero ? 'gap-2 px-3.5 py-1.5 text-lg' : 'gap-1.5 px-2.5 py-1 text-sm',
        className,
      )}
      data-testid="xp-count"
    >
      <XpCoin size={hero ? 26 : 18} />
      <motion.span key={xp} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', duration: 0.4, bounce: 0.35 }}>{xp}</motion.span>
      <span className={cn('font-semibold opacity-75', hero ? 'text-xs' : 'text-[11px]')}>{label}</span>
    </span>
  );
}

/** "+N" rising from the count when points arrive. Keyed by a counter so each gain plays once. */
export function XpGain({ gain, id }: { gain: number; id: number }) {
  const reduce = useReducedMotion();
  return (
    <AnimatePresence>
      {gain > 0 && (
        <motion.span
          key={id}
          initial={{ y: 4, opacity: 0, scale: 0.8 }}
          animate={reduce ? { opacity: [0, 1, 0] } : { y: -30, opacity: [0, 1, 1, 0], scale: 1 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute -top-2 end-2 inline-flex items-center gap-1 rounded-full bg-[var(--gold)] px-2 py-0.5 text-xs font-bold text-[#3A1E0C] shadow-[0_4px_14px_-4px_rgba(229,169,60,0.8)]"
          aria-hidden="true"
        >
          +{gain}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

/** Progress to the next milestone: crimson to gold, a light sweep along the fill, a coin at the goal. */
export function XpBar({ value, caption, className }: { value: number; caption?: React.ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={cn('grid gap-1.5', className)}>
      <div className="flex items-center gap-2">
        <div
          className="relative h-3 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--foreground)_9%,transparent)] ring-1 ring-inset ring-[color-mix(in_srgb,var(--foreground)_6%,transparent)]"
          role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}
        >
          <motion.div
            className="absolute inset-y-0 start-0 overflow-hidden rounded-full bg-[linear-gradient(90deg,var(--crimson),#E0672E_55%,var(--gold))] rtl:bg-[linear-gradient(270deg,var(--crimson),#E0672E_55%,var(--gold))]"
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          >
            <span className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-white/25" />
            {!reduce && pct > 0 && (
              <motion.span
                className="absolute inset-y-0 w-10 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent"
                animate={{ left: ['-20%', '120%'] }}
                transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.4, ease: 'easeInOut' }}
              />
            )}
          </motion.div>
        </div>
        <XpCoin size={20} />
      </div>
      {caption && <p className="text-xs text-muted-foreground">{caption}</p>}
    </div>
  );
}

/** The growth stages in a row: done ones filled, the current one ringed in gold, later ones faint. */
export function StageTrack({ stages, current }: { stages: { key: string; label: string; xp: number }[]; current: number }) {
  return (
    <ol className="grid gap-1" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }} data-testid="xp-stage-track">
      {stages.map((s, i) => {
        const done = i < current, now = i === current;
        return (
          <li key={s.key} className="grid justify-items-center gap-1 text-center" aria-current={now ? 'step' : undefined}>
            <span className="flex w-full items-center">
              <span className={cn('h-0.5 flex-1 rounded-full', i === 0 ? 'opacity-0' : done || now ? 'bg-[var(--gold)]' : 'bg-border')} />
              <span
                className={cn(
                  'grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold tabular-nums transition-colors',
                  done && 'bg-[var(--gold)] text-[#3A1E0C]',
                  now && 'bg-[var(--crimson)] text-white ring-2 ring-[var(--gold)] ring-offset-2 ring-offset-[var(--card)]',
                  !done && !now && 'bg-[color-mix(in_srgb,var(--foreground)_8%,transparent)] text-muted-foreground',
                )}
              >
                {i + 1}
              </span>
              <span className={cn('h-0.5 flex-1 rounded-full', i === stages.length - 1 ? 'opacity-0' : done ? 'bg-[var(--gold)]' : 'bg-border')} />
            </span>
            <span className={cn('text-[11px] leading-tight', now ? 'font-bold text-foreground' : 'text-muted-foreground')}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** A teacher-given achievement: icon on a sand disc with a gold ring, the label, the points it is worth. */
export function AchievementTile({ icon: Icon, label, xp, onClick }: { icon: React.ComponentType<{ className?: string }>; label: string; xp: number; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex min-h-14 items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2 text-start text-sm font-semibold transition-[transform,background-color] duration-150 hover:bg-surface-subtle active:scale-[0.97] focus-ring"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color-mix(in_srgb,var(--gold)_14%,var(--card))] ring-1 ring-[color-mix(in_srgb,var(--gold)_55%,transparent)] text-[var(--copper)]">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0 flex-1 leading-snug">{label}</span>
      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold tabular-nums text-[var(--gold-deep)] dark:text-[var(--gold-soft)]">+{xp}<XpCoin size={14} /></span>
    </button>
  );
}

/** A dance (or any XP unlock): open ones play, locked ones show the lock and the XP needed. */
export function UnlockTile({ icon: Icon, label, need, locked, active, onClick }: {
  icon: React.ComponentType<{ className?: string }>; label: string; need: number; locked: boolean; active?: boolean; onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={locked}
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-h-[78px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 text-sm font-semibold transition-[transform,background-color,border-color] duration-150 focus-ring',
        locked && 'cursor-not-allowed border-dashed border-border text-muted-foreground/70',
        !locked && !active && 'border-border bg-card hover:bg-surface-subtle active:scale-[0.96]',
        !locked && active && 'border-[var(--gold)] bg-[color-mix(in_srgb,var(--gold)_14%,var(--card))] active:scale-[0.96]',
      )}
    >
      {locked ? <Lock className="h-5 w-5" aria-hidden="true" /> : <Icon className="h-[22px] w-[22px] text-[var(--crimson)]" />}
      <span className="leading-tight">{label}</span>
      {locked && <span className="inline-flex items-center gap-1 text-[11px] font-bold tabular-nums">{need}<XpCoin size={12} /></span>}
    </button>
  );
}

/** Marks anything that is a preview with made-up points, so nobody takes it for real progress. */
export function DemoChip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--copper)] px-2 py-0.5 text-[11px] font-bold text-[var(--copper)]">
      <FlaskConical className="h-3 w-3" aria-hidden="true" />{label}
    </span>
  );
}
