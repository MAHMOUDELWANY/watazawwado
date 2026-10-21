import React, { useState } from 'react';
import { Check } from 'lucide-react';

/**
 * A package as a card tucked in an envelope. The card rises out when `open` (hover/focus on
 * desktop, "closest to the middle of the screen" on phones; decided by the page) and slides
 * back in otherwise. The space it rises into is reserved by the wrapper's height, so it never
 * covers anything around it. Motion is plain CSS transforms and stops for reduced motion.
 */

export interface EnvelopePlan {
  id: string;
  title: string;
  meta: string;
  badge?: string;
  perLesson: string;
  total: string;
  features: string[];
  tone: 'teal' | 'crimson' | 'copper';
}

const TONES = {
  teal: {
    back: 'from-[#087D91]/30 to-[#087D91]/10 dark:from-[#12A4BC]/30 dark:to-[#12A4BC]/10',
    pocket: '[--env-a:#E3F1F3] [--env-b:#F7FBFB] dark:[--env-a:#16343A] dark:[--env-b:#1B2427]',
    edge: '#087D91',
    text: 'text-[#087D91] dark:text-[#12A4BC]',
    chip: 'bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC]'
  },
  crimson: {
    back: 'from-[#C51F24]/30 to-[#C51F24]/10 dark:from-[#E82C32]/30 dark:to-[#E82C32]/10',
    pocket: '[--env-a:#F8E4E3] [--env-b:#FDF7F6] dark:[--env-a:#3A1C1C] dark:[--env-b:#261B1A]',
    edge: '#C51F24',
    text: 'text-[#C51F24] dark:text-[#E82C32]',
    chip: 'bg-[#C51F24]/10 text-[#C51F24] dark:text-[#E82C32]'
  },
  copper: {
    back: 'from-[#8B4935]/30 to-[#E5A93C]/15 dark:from-[#DA7960]/30 dark:to-[#E5A93C]/10',
    pocket: '[--env-a:#F3E8DF] [--env-b:#FBF7F2] dark:[--env-a:#33241D] dark:[--env-b:#241C18]',
    edge: '#8B4935',
    text: 'text-[#8B4935] dark:text-[#DA7960]',
    chip: 'bg-[#8B4935]/10 text-[#8B4935] dark:text-[#DA7960]'
  }
} as const;

interface EnvelopeCardProps {
  plan: EnvelopePlan;
  open: boolean;
  onHoverChange?: (hovering: boolean) => void;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  isAr: boolean;
}

export const EnvelopeCard = React.forwardRef<HTMLDivElement, EnvelopeCardProps>(function EnvelopeCard(
  { plan, open, onHoverChange, primaryLabel, onPrimary, secondaryLabel, onSecondary, isAr },
  ref
) {
  const tone = TONES[plan.tone];
  const [focusInside, setFocusInside] = useState(false);
  const isOpen = open || focusInside;
  const gradId = `env-front-${plan.id}`;

  return (
    <div
      ref={ref}
      data-envelope-id={plan.id}
      className="relative mx-auto w-full max-w-[20rem] h-[30rem] select-none"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      onFocus={() => setFocusInside(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocusInside(false); }}
    >
      {/* Everything is clipped at the envelope's bottom edge; the card's lower part always stays inside. */}
      <div className="absolute inset-x-0 bottom-0 top-0 overflow-hidden rounded-b-[1.75rem]">
        {/* Back panel */}
        <div className={`absolute inset-x-0 bottom-0 h-[15rem] rounded-[1.75rem] bg-gradient-to-b ${tone.back} border border-black/5 dark:border-white/10`} />

        {/* The package card */}
        <div
          className={`absolute inset-x-4 bottom-[-10rem] h-[24rem] rounded-[1.4rem] bg-surface border border-border shadow-[0_18px_40px_-18px_rgba(18,16,14,0.45)] transition-transform duration-[650ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isOpen ? '-translate-y-[15rem]' : 'translate-y-[1.6rem]'}`}
          style={{ borderTop: `4px solid ${tone.edge}` }}
        >
          <div className="px-5 pt-4 pb-3 flex items-center justify-between gap-2">
            <span className="font-bold text-sm text-foreground truncate">{plan.title}</span>
            {plan.badge && <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${tone.chip}`}>{plan.badge}</span>}
          </div>
          <div className="px-5">
            <p className="flex items-baseline gap-1.5">
              <span className="font-editorial text-4xl font-bold text-foreground" dir="ltr">{plan.perLesson}</span>
              <span className="text-sm text-muted-foreground">{isAr ? 'للحصة' : 'a lesson'}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{plan.total}</p>
            <ul className="mt-3 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-foreground/85 leading-snug">
                  <Check className={`w-4 h-4 shrink-0 mt-0.5 ${tone.text}`} aria-hidden="true" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-1.5">
              <button
                type="button"
                onClick={onPrimary}
                className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
              >
                {primaryLabel}
              </button>
              <button
                type="button"
                onClick={onSecondary}
                className="w-full min-h-11 py-1 text-sm font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                {secondaryLabel}
              </button>
            </div>
          </div>
        </div>

        {/* Front pocket with a soft lip */}
        <svg
          aria-hidden="true"
          viewBox="0 0 320 176"
          preserveAspectRatio="none"
          className={`absolute inset-x-0 bottom-0 w-full h-[11rem] drop-shadow-[0_-6px_14px_rgba(18,16,14,0.10)] ${tone.pocket}`}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: 'var(--env-a)' }} />
              <stop offset="100%" style={{ stopColor: 'var(--env-b)' }} />
            </linearGradient>
          </defs>
          <path
            d="M0 44 C0 14 22 4 52 14 C 104 34 216 34 268 14 C 298 4 320 14 320 44 V176 H0 Z"
            fill={`url(#${gradId})`}
          />
          <path d="M0 44 C0 14 22 4 52 14 C 104 34 216 34 268 14 C 298 4 320 14 320 44" fill="none" stroke={tone.edge} strokeOpacity="0.35" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
        </svg>

        {/* Title on the pocket */}
        <div className="absolute inset-x-0 bottom-0 h-[11rem] px-6 pt-12 pb-5 flex flex-col justify-between pointer-events-none">
          <p className="font-editorial text-[1.6rem] leading-tight font-bold text-foreground">{plan.title}</p>
          <p className={`text-sm font-semibold ${tone.text}`}>{plan.meta}</p>
        </div>
      </div>
    </div>
  );
});
