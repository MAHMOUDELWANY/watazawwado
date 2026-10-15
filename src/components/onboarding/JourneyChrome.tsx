import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Check } from 'lucide-react';

/**
 * Backdrop and step trail for the onboarding "journey". The backdrop is a slow-drifting
 * eight-point-star lattice (khatam) with two soft brand glows; it stays still for people who
 * prefer reduced motion.
 */
export function JourneyBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute -top-40 -start-40 w-[520px] h-[520px] rounded-full bg-[#087D91]/20 blur-[110px]" />
      <div className="absolute -bottom-48 -end-40 w-[520px] h-[520px] rounded-full bg-[#C51F24]/15 blur-[120px]" />
      <svg className="journey-lattice absolute inset-[-80px] w-[calc(100%+160px)] h-[calc(100%+160px)] text-[#8B4935] dark:text-[#D8C6AE]">
        <defs>
          <pattern id="khatam" width="72" height="72" patternUnits="userSpaceOnUse">
            <g fill="none" stroke="currentColor" strokeOpacity="0.13" strokeWidth="1">
              <rect x="18" y="18" width="36" height="36" />
              <rect x="18" y="18" width="36" height="36" transform="rotate(45 36 36)" />
              <circle cx="36" cy="36" r="6" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#khatam)" />
      </svg>
    </div>
  );
}

/** Three stops of the journey; the line fills as the student moves on. */
export function JourneyTrail({ step, labels }: { step: number; labels: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ol className="flex items-center justify-center gap-0 w-full max-w-md mx-auto" aria-label="progress">
      {labels.map((label, i) => {
        const n = i + 1;
        const done = n < step;
        const current = n === step;
        return (
          <li key={label} className="flex items-center flex-1 last:flex-none" aria-current={current ? 'step' : undefined}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <span
                className={`grid place-items-center w-9 h-9 rounded-full text-sm font-bold border-2 transition-colors ${
                  current ? 'bg-[#C51F24] border-[#C51F24] text-white shadow-[0_0_0_6px_rgba(197,31,36,.15)]'
                    : done ? 'bg-[#087D91] border-[#087D91] text-white'
                    : 'bg-surface border-[#D8C6AE] text-muted-foreground'
                }`}
              >
                {done ? <Check className="w-4 h-4" aria-hidden="true" /> : n}
              </span>
              <span className={`text-xs whitespace-nowrap ${current ? 'font-bold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
            </div>
            {i < labels.length - 1 && (
              <span className="relative flex-1 h-[3px] mx-2 -mt-5 rounded-full bg-[#D8C6AE]/50 overflow-hidden">
                <motion.span
                  className="absolute inset-y-0 start-0 bg-[#087D91] rounded-full"
                  initial={false}
                  animate={{ width: done ? '100%' : '0%' }}
                  transition={reduce ? { duration: 0 } : { duration: 0.5, ease: 'easeOut' }}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
