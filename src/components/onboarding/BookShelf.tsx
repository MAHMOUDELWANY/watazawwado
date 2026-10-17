import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { SUBJECT_FAMILIES, findSubject, subjectTagline } from './subjects';
import { SubjectMark } from './SubjectMark';

/**
 * "Choose your provision": the 14 subjects are books on three shelves (Quran, Islamic studies,
 * languages), each family bound in one brand colour with the subject's animated emblem (the same
 * hand-drawn SVGs as the Subjects page) on the spine.
 * The chosen book slides up out of the shelf with a ribbon, and its description opens below.
 * Keyboard: radio group with arrow keys.
 */

const HEIGHTS = [180, 196, 172, 188, 182];

export function BookShelf({ value, onChange, isAr, name }: { value: string; onChange: (id: string) => void; isAr: boolean; name: string }) {
  const reduce = useReducedMotion();
  const all = SUBJECT_FAMILIES.flatMap((f) => f.subjects.map((s) => s.id));
  const chosen = findSubject(value);
  const move = (dir: number) => {
    const next = all[(Math.max(0, all.indexOf(value)) + dir + all.length) % all.length];
    onChange(next);
    document.getElementById(`${name}-${next}`)?.focus();
  };

  return (
    <div>
      <div role="radiogroup" aria-label={isAr ? 'المادة' : 'Subject'} className="space-y-7">
        {SUBJECT_FAMILIES.map((family) => (
          <div key={family.key}>
            <p className="mb-2 text-sm font-bold" style={{ color: family.color }}>
              <span className="dark:brightness-150">{isAr ? family.ar : family.en}</span>
            </p>
            <div className="flex items-end justify-center gap-1 sm:gap-2.5 px-1 h-[218px]">
              {family.subjects.map((s, i) => {
                const selected = value === s.id;
                return (
                  <motion.button
                    key={s.id}
                    id={`${name}-${s.id}`}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={isAr ? s.ar : s.en}
                    tabIndex={selected || (!chosen && s.id === all[0]) ? 0 : -1}
                    onClick={() => onChange(s.id)}
                    onKeyDown={(e) => {
                      const next = isAr ? 'ArrowLeft' : 'ArrowRight';
                      const prev = isAr ? 'ArrowRight' : 'ArrowLeft';
                      if (e.key === next || e.key === 'ArrowDown') { e.preventDefault(); move(1); }
                      if (e.key === prev || e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
                    }}
                    animate={{ y: selected ? -22 : 0 }}
                    whileHover={reduce || selected ? undefined : { y: -7 }}
                    transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                    className="book-spine relative shrink-0 w-[52px] sm:w-[70px] rounded-[6px_6px_3px_3px] cursor-pointer text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:ring-[#D8C6AE]"
                    style={{
                      height: HEIGHTS[i % HEIGHTS.length],
                      background: `linear-gradient(90deg, ${family.color}E6 0%, ${family.color} 18%, ${family.color} 80%, ${family.color}C0 100%)`,
                      boxShadow: selected
                        ? `0 18px 28px -10px ${family.color}AA, inset 0 0 0 1px rgba(255,255,255,.25)`
                        : 'inset -3px 0 6px rgba(0,0,0,.18), inset 0 0 0 1px rgba(255,255,255,.08)',
                      filter: chosen && !selected ? 'saturate(.75) brightness(.92)' : undefined
                    }}
                  >
                    <span className="absolute inset-x-0 top-3 h-[3px] bg-[#D8C6AE]/80" aria-hidden="true" />
                    <span className="absolute inset-x-0 bottom-3 h-[3px] bg-[#D8C6AE]/80" aria-hidden="true" />
                    <span className="absolute inset-x-0 top-5 flex justify-center" aria-hidden="true">
                      <span className={`block w-11 h-11 sm:w-[60px] sm:h-[60px] transition-transform duration-300 ${selected ? 'scale-110' : ''}`}>
                        <SubjectMark subjectId={s.id} size={60} rounded="rounded-full" className="!w-full !h-full bg-white/10" />
                      </span>
                    </span>
                    <span
                      className="absolute left-1/2 top-[70px] sm:top-[86px] -translate-x-1/2 text-[12px] sm:text-[13px] font-semibold leading-tight whitespace-nowrap overflow-hidden max-h-[calc(100%-94px)] sm:max-h-[calc(100%-110px)]"
                      style={{ writingMode: 'vertical-rl' }}
                      aria-hidden="true"
                    >
                      {isAr ? s.spineAr : s.spineEn}
                    </span>
                    <AnimatePresence>
                      {selected && (
                        <motion.span
                          initial={reduce ? false : { scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          exit={{ scaleY: 0 }}
                          style={{ originY: 0 }}
                          className="absolute -bottom-7 end-2.5 w-3.5 h-9 bg-[#D8C6AE] [clip-path:polygon(0_0,100%_0,100%_100%,50%_78%,0_100%)]"
                          aria-hidden="true"
                        />
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>
            <div className="h-3 rounded-full bg-[linear-gradient(180deg,#D8C6AE,#8B4935)] shadow-[0_8px_14px_-6px_rgba(139,73,53,.55)]" aria-hidden="true" />
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {chosen && (
          <motion.div
            key={chosen.subject.id}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="mt-6 flex items-start gap-4 rounded-2xl border p-4 sm:p-5"
            style={{ borderColor: `${chosen.family.color}55`, background: `${chosen.family.color}0F` }}
            aria-live="polite"
          >
            <SubjectMark subjectId={chosen.subject.id} color={chosen.family.color} size={64} />
            <div className="min-w-0">
              <p className="font-display text-lg font-bold text-foreground">{isAr ? chosen.subject.ar : chosen.subject.en}</p>
              <p className="text-sm text-muted-foreground leading-relaxed mt-0.5">{subjectTagline(chosen.subject.id, isAr)}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
