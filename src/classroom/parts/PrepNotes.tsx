import React, { useState } from 'react';
import { ChevronDown, NotebookPen } from 'lucide-react';
import { useT } from '../../lib/language';

/** BUILD-LIST 1.4: the teacher's private prep notes, read-only in the room. A capsule that opens a small card. */
export function PrepNotes({ text }: { text: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  if (!text.trim()) return null;
  return (
    <div className="absolute bottom-3 end-3 z-20 grid justify-items-end gap-2 sm:bottom-4 sm:end-4">
      {open && (
        <section id="prep-notes-panel" aria-label={t('My notes', 'ملاحظاتي')}
          className="max-h-[50vh] w-[min(22rem,calc(100vw-2rem))] overflow-auto whitespace-pre-wrap rounded-[var(--r-3)] border border-border bg-surface p-3 text-sm leading-relaxed text-foreground shadow-[var(--shadow-3)]" dir="auto">
          {text}
        </section>
      )}
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls="prep-notes-panel"
        className="glass-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-semibold text-foreground focus-ring">
        <NotebookPen className="h-4 w-4 text-accent" aria-hidden="true" />
        {t('My notes', 'ملاحظاتي')}
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? '' : 'rotate-180'}`} aria-hidden="true" />
      </button>
    </div>
  );
}
