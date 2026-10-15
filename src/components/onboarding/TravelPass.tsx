import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { User, Users, Check } from 'lucide-react';

/**
 * Step one of the onboarding journey as a traveller's ticket: choose how you travel (alone or as a
 * family caravan), then fill a boarding-pass card whose seal shows your initial as you type.
 */

export function TravelModeChoice({ value, onChange, isAr }: { value: 'adult' | 'child'; onChange: (v: 'adult' | 'child') => void; isAr: boolean }) {
  const reduce = useReducedMotion();
  const modes = [
    { id: 'adult' as const, Icon: User, title: isAr ? 'مسافر لوحدي' : 'Travelling alone', sub: isAr ? 'هتعلّم بنفسي في حصص فردية' : 'I am learning for myself', color: '#087D91' },
    { id: 'child' as const, Icon: Users, title: isAr ? 'قافلة العيلة' : 'Family caravan', sub: isAr ? 'هسجّل أولادي، ولكل واحد معلمه' : 'I am enrolling my children', color: '#8B4935' }
  ];
  return (
    <div role="radiogroup" aria-label={isAr ? 'مين هيتعلم' : 'Who is learning'} className="grid grid-cols-2 gap-3 sm:gap-4">
      {modes.map(({ id, Icon, title, sub, color }) => {
        const selected = value === id;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(id)}
            whileTap={reduce ? undefined : { scale: 0.97 }}
            className={`relative overflow-hidden rounded-3xl border-2 p-4 sm:p-6 text-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
              selected ? 'text-white' : 'border-border bg-surface hover:bg-surface-subtle text-foreground'
            }`}
            style={selected ? { background: `linear-gradient(160deg, ${color}, ${color}CC)`, borderColor: color } : undefined}
          >
            <span
              className="mx-auto mb-3 grid place-items-center w-14 h-14 sm:w-16 sm:h-16 rounded-full"
              style={{ background: selected ? 'rgba(255,255,255,.18)' : `${color}1F`, color: selected ? '#fff' : color }}
              aria-hidden="true"
            >
              <Icon className="w-7 h-7 sm:w-8 sm:h-8 dark:brightness-150" />
            </span>
            <span className="block font-display text-base sm:text-xl font-bold leading-tight">{title}</span>
            <span className={`block mt-1 text-xs sm:text-sm ${selected ? 'text-white/85' : 'text-muted-foreground'}`}>{sub}</span>
            {selected && <Check className="absolute top-3 end-3 w-4 h-4" aria-hidden="true" />}
          </motion.button>
        );
      })}
    </div>
  );
}

/** Boarding-pass card: a stub with the traveller's initial seal, cut-out edges, then the fields. */
export function PassCard({ name, isAr, children }: { name: string; isAr: boolean; children: React.ReactNode }) {
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <div className="relative rounded-3xl border border-[#D8C6AE]/70 bg-[#FFFDF8] dark:bg-[#1E2224] shadow-[0_24px_50px_-28px_rgba(139,73,53,.55)]">
      {/* cut-out notches on both edges, where the stub tears off */}
      <span className="absolute -start-3 top-[92px] w-6 h-6 rounded-full bg-background border-e border-[#D8C6AE]/70" aria-hidden="true" />
      <span className="absolute -end-3 top-[92px] w-6 h-6 rounded-full bg-background border-s border-[#D8C6AE]/70" aria-hidden="true" />
      <div className="flex items-center gap-4 px-5 sm:px-7 h-[104px] border-b-2 border-dashed border-[#D8C6AE]/80">
        <motion.span
          key={initial || 'empty'}
          initial={{ scale: 0.6, rotate: -18, opacity: 0 }}
          animate={{ scale: 1, rotate: -8, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 18 }}
          className="grid place-items-center shrink-0 w-16 h-16 rounded-full border-[3px] border-double border-[#C51F24] text-[#C51F24] font-display text-2xl"
          aria-hidden="true"
        >
          {initial || 'و'}
        </motion.span>
        <div className="min-w-0">
          <p className="text-xs text-[#8B4935] dark:text-[#D8C6AE]">{isAr ? 'تذكرة رحلة التعلّم' : 'Learning journey ticket'}</p>
          <p className="font-display text-xl sm:text-2xl font-bold text-[#1F1A17] dark:text-[#F3EFE6] truncate">
            {name.trim() || (isAr ? 'اسمك هنا' : 'Your name here')}
          </p>
        </div>
        <span className="ms-auto hidden sm:block text-end text-[11px] leading-tight text-[#8B4935] dark:text-[#D8C6AE]" aria-hidden="true">
          <span className="block font-display text-lg text-[#087D91] dark:text-[#5FC3D3]">وتزودوا</span>
          WATAZAWWADO
        </span>
      </div>
      <div className="px-5 sm:px-7 py-6 space-y-6">{children}</div>
    </div>
  );
}

/** One labelled ticket field (the input sits on a dotted line instead of in a box). */
export function PassField({ label, htmlFor, children, className = '' }: { label: string; htmlFor?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#8B4935] dark:text-[#D8C6AE] mb-1">{label}</label>
      {children}
    </div>
  );
}

export const passInputClass =
  'w-full bg-transparent border-0 border-b-2 border-dotted border-[#D8C6AE] focus:border-[#087D91] focus:border-solid px-0 py-2 text-lg font-semibold text-[#1F1A17] dark:text-[#F3EFE6] placeholder:text-[#B9A994] placeholder:font-normal focus:outline-none focus:ring-0 transition-colors';

/** Two round "seals" to stamp (used for gender). */
export function SealChoice<T extends string>({ options, value, onChange, label }: { options: { id: T; text: string }[]; value: T; onChange: (v: T) => void; label: string }) {
  const reduce = useReducedMotion();
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-3">
      {options.map((o) => {
        const selected = o.id === value;
        return (
          <motion.button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.id)}
            animate={{ rotate: selected ? -6 : 0, scale: selected ? 1.04 : 1 }}
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 320, damping: 18 }}
            className={`px-5 py-2.5 rounded-full border-2 text-sm font-bold cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
              selected ? 'border-[#C51F24] text-[#C51F24] bg-[#C51F24]/8 border-double border-[3px]' : 'border-[#D8C6AE] text-muted-foreground hover:border-[#8B4935]'
            }`}
          >
            {o.text}
          </motion.button>
        );
      })}
    </div>
  );
}

/** "Your guide on the journey": the teacher choice, with an initial medallion per teacher. */
export function GuideChoice({ teachers, value, onChange, isAr }: {
  teachers: { id: string; nameAr: string; nameEn: string }[];
  value: string;
  onChange: (id: string) => void;
  isAr: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={isAr ? 'مرشدك في الرحلة' : 'Your guide'} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {teachers.map((t, i) => {
        const selected = value === t.id;
        const name = isAr ? t.nameAr : t.nameEn;
        const color = i === 0 ? '#087D91' : '#8B4935';
        return (
          <button
            key={t.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(t.id)}
            className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-start cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${
              selected ? 'bg-white/70 dark:bg-white/5' : 'border-transparent bg-[#D8C6AE]/15 hover:bg-[#D8C6AE]/25'
            }`}
            style={selected ? { borderColor: color } : undefined}
          >
            <span className="grid place-items-center shrink-0 w-11 h-11 rounded-full text-white font-display text-lg" style={{ background: color }} aria-hidden="true">
              {name.replace(/^(الأستاذة?|Ustadh|Teacher)\s+/, '').charAt(0)}
            </span>
            <span className="flex-1 min-w-0 font-bold text-sm text-foreground">{name}</span>
            {selected && <Check className="w-4 h-4 shrink-0" style={{ color }} aria-hidden="true" />}
          </button>
        );
      })}
    </div>
  );
}
