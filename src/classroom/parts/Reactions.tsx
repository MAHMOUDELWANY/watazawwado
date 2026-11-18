import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { Hand, HelpCircle, Lightbulb, Repeat, Snail, SmilePlus, X } from 'lucide-react';
import { useT } from '../../lib/language';

export type ReactionKind = 'hand' | 'confused' | 'slower' | 'repeat' | 'thinking';

const KINDS: Array<{ kind: ReactionKind; Icon: typeof Hand; en: string; ar: string; seenEn?: string; seenAr?: string }> = [
  { kind: 'hand', Icon: Hand, en: 'Raise my hand', ar: 'عايز أتكلم', seenEn: 'Raised a hand', seenAr: 'رفع إيده' },
  { kind: 'confused', Icon: HelpCircle, en: "I didn't understand", ar: 'مفهمتش' },
  { kind: 'slower', Icon: Snail, en: 'Slower, please', ar: 'أبطأ لو سمحت' },
  { kind: 'repeat', Icon: Repeat, en: 'Say it again', ar: 'قولها تاني' },
  { kind: 'thinking', Icon: Lightbulb, en: "I'm thinking", ar: 'بفكّر' },
];
const SHOW_MS = 8000;

/** Learner: a small menu of the five reactions. */
export function ReactionPicker({ onSend }: { onSend: (kind: ReactionKind) => void }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label={t('Reactions', 'تفاعل')}
        className="grid h-12 w-12 place-items-center rounded-full text-foreground hover:bg-surface-subtle focus-ring active:scale-[0.97] transition-transform">
        {open ? <X className="h-5 w-5" aria-hidden="true" /> : <SmilePlus className="h-5 w-5" aria-hidden="true" />}
      </button>
      {open && (
        <ul role="menu" className="glass-3 absolute bottom-14 start-1/2 z-30 grid w-56 -translate-x-1/2 rtl:translate-x-1/2 gap-0.5 rounded-[var(--r-3)] p-1.5 origin-bottom">
          {KINDS.map(({ kind, Icon, en, ar }) => (
            <li key={kind} role="none">
              <button type="button" role="menuitem" onClick={() => { onSend(kind); setOpen(false); }}
                className="flex min-h-11 w-full items-center gap-3 rounded-[var(--r-2)] px-3 text-start text-sm font-medium text-foreground hover:bg-surface-subtle focus-ring">
                <Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" />{t(en, ar)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Teacher: reactions arrive softly at the side of the stage and fade after 8 seconds. */
export function ReactionStream({ items, name }: { items: Array<{ id: number; kind: ReactionKind }>; name: string }) {
  const { t } = useT();
  const reduce = useReducedMotion();
  return (
    <div aria-live="polite" className="pointer-events-none flex flex-col items-start gap-2">
      <AnimatePresence initial={false}>
        {items.map(({ id, kind }) => {
          const k = KINDS.find((x) => x.kind === kind)!;
          return (
            <motion.p key={id}
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, transition: { duration: 0.4 } }}
              transition={reduce ? { duration: 0.2 } : { type: 'spring', bounce: 0, duration: 0.4 }}
              className="glass-2 flex items-center gap-2 rounded-[var(--r-pill)] py-1.5 pe-4 ps-1.5 text-sm text-foreground">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-sand-light"><k.Icon className="h-4 w-4 text-accent" aria-hidden="true" /></span>
              <span><span className="font-semibold">{name}</span> · {t(k.seenEn ?? k.en, k.seenAr ?? k.ar)}</span>
            </motion.p>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

export const REACTION_SHOW_MS = SHOW_MS;
