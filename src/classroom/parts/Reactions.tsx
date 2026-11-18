import React from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Hand, HelpCircle, Lightbulb, Repeat, Snail } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';

export type ReactionKind = 'hand' | 'confused' | 'slower' | 'repeat' | 'thinking';

export const REACTIONS: Array<{ kind: ReactionKind; Icon: typeof Hand; en: string; ar: string; seenEn?: string; seenAr?: string }> = [
  { kind: 'hand', Icon: Hand, en: 'Raise my hand', ar: 'عايز أتكلم', seenEn: 'Raised a hand', seenAr: 'رفع إيده' },
  { kind: 'repeat', Icon: Repeat, en: 'Say it again', ar: 'قولها تاني' },
  { kind: 'slower', Icon: Snail, en: 'Slower, please', ar: 'أبطأ لو سمحت' },
  { kind: 'confused', Icon: HelpCircle, en: "I didn't understand", ar: 'مفهمتش' },
  { kind: 'thinking', Icon: Lightbulb, en: "I'm thinking", ar: 'بفكّر' },
];
const SHOW_MS = 8000;

/**
 * Learner: the five teaching signals, in a sheet that grows from the bar. Adults get a labelled list; a child gets
 * big picture tiles with words under them (DESIGN-BRIEF 3.6).
 */
export function ReactionSheet({ kid, onSend }: { kid: boolean; onSend: (kind: ReactionKind) => void }) {
  const { t } = useT();
  if (kid) {
    return (
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {REACTIONS.map(({ kind, Icon, en, ar }) => (
          <li key={kind}>
            <button type="button" onClick={() => onSend(kind)}
              className="room-press grid min-h-[6.5rem] w-full content-center justify-items-center gap-2 rounded-[var(--r-3)] bg-white/[0.06] px-2 py-3 text-center text-[0.95rem] font-semibold leading-tight text-foreground ring-1 ring-white/10 hover:bg-white/10 focus-ring">
              <span className="arch-tile grid h-12 w-11 place-items-center bg-[#3B2219] text-[#F6D58E]"><Icon className="h-6 w-6" aria-hidden="true" /></span>
              {t(en, ar)}
            </button>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="grid gap-0.5">
      {REACTIONS.map(({ kind, Icon, en, ar }) => (
        <li key={kind}>
          <button type="button" onClick={() => onSend(kind)}
            className="room-press flex min-h-12 w-full items-center gap-3 rounded-[var(--r-2)] px-3 text-start text-[0.95rem] font-medium text-foreground hover:bg-white/[0.08] focus-ring">
            <Icon className="h-5 w-5 shrink-0 text-[#F0B54A]" aria-hidden="true" />{t(en, ar)}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Teacher: a reaction lands on the learner's own tile, so the eye never leaves the face. Each fades after 8 seconds. */
export function ReactionStream({ items, name }: { items: Array<{ id: number; kind: ReactionKind }>; name: string }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  return (
    <div aria-live="polite" className="pointer-events-none flex flex-col items-start gap-1.5">
      <AnimatePresence initial={false}>
        {items.map(({ id, kind }) => {
          const k = REACTIONS.find((x) => x.kind === kind)!;
          return (
            <motion.p key={id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, transform: 'translateY(8px)' }}
              animate={{ opacity: 1, transform: 'translateY(0px)' }}
              exit={{ opacity: 0, transition: { duration: 0.3 } }}
              transition={reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.35 }}
              className={cn('face-scrim flex items-center gap-2 rounded-[var(--r-pill)] py-1 pe-3 ps-1 text-[0.82rem]', kind === 'hand' && 'ring-1 ring-[rgba(246,213,142,0.6)]')}>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-[#3B2219]"><k.Icon className="h-4 w-4 text-[#F6D58E]" aria-hidden="true" /></span>
              <span><span className="font-semibold">{name}</span> · {t(k.seenEn ?? k.en, k.seenAr ?? k.ar)}</span>
            </motion.p>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const REACTION_SHOW_MS = SHOW_MS;
