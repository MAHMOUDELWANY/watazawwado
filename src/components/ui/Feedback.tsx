import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';
import { getStoredLanguage } from '../../lib/language';

/**
 * App-wide feedback: short toasts and a confirm dialog, replacing the browser's alert() and confirm().
 * Call notify()/confirmAction() from anywhere; <FeedbackHost /> (mounted once per app shell) renders them.
 */

type Tone = 'success' | 'error';
type Toast = { id: number; text: string; tone: Tone };
type Confirm = { message: string; confirmLabel?: string; danger?: boolean; resolve: (ok: boolean) => void };

let toastListener: ((t: Toast) => void) | null = null;
let confirmListener: ((c: Confirm) => void) | null = null;
let nextId = 1;

export function notify(text: string, tone: Tone = 'success') {
  toastListener?.({ id: nextId++, text, tone });
}

/** Resolves true when the person confirms. Falls back to window.confirm if no host is mounted. */
export function confirmAction(message: string, opts: { confirmLabel?: string; danger?: boolean } = {}): Promise<boolean> {
  if (!confirmListener) return Promise.resolve(window.confirm(message));
  return new Promise((resolve) => confirmListener!({ message, ...opts, resolve }));
}

export function FeedbackHost() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<Confirm | null>(null);
  const isAr = getStoredLanguage() === 'ar';

  useEffect(() => {
    toastListener = (t) => {
      setToasts((list) => [...list.slice(-2), t]);
      setTimeout(() => setToasts((list) => list.filter((x) => x.id !== t.id)), t.tone === 'error' ? 6000 : 3500);
    };
    confirmListener = setPending;
    return () => {
      toastListener = null;
      confirmListener = null;
    };
  }, []);

  const answer = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] md:bottom-6 z-[70] flex flex-col items-center gap-2 px-4 pointer-events-none" aria-live="polite">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              role={t.tone === 'error' ? 'alert' : 'status'}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="pointer-events-auto max-w-md w-full sm:w-auto flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-[#0A2E35] text-white text-sm font-medium shadow-lg"
            >
              {t.tone === 'error'
                ? <AlertCircle className="w-4 h-4 shrink-0 text-[#F2A7A0]" aria-hidden="true" />
                : <CheckCircle2 className="w-4 h-4 shrink-0 text-[#8FD6C2]" aria-hidden="true" />}
              <span>{t.text}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={!!pending}
        onClose={() => answer(false)}
        maxWidth="sm"
        hideCloseButton
        footer={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 w-full">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => answer(false)}>{isAr ? 'رجوع' : 'Go back'}</Button>
            <Button
              className={`w-full sm:w-auto ${pending?.danger ? 'bg-destructive hover:bg-destructive/90 text-white' : ''}`}
              onClick={() => answer(true)}
              autoFocus
            >
              {pending?.confirmLabel || (isAr ? 'أيوه، كمّل' : 'Yes, continue')}
            </Button>
          </div>
        }
      >
        <p className="text-[15px] leading-relaxed text-foreground">{pending?.message}</p>
      </Modal>
    </>
  );
}
