import React, { useState } from 'react';
import { NotebookPen } from 'lucide-react';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

const MAX = 4000;

/** Super admin observer only: private notes on this visit, saved to admin_observations. The teacher never sees them. */
export function ObserverNotes({ bookingId, ticket }: { bookingId: string; ticket: string }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const save = async () => {
    setState('saving');
    try {
      const res = await fetch(`/api/classroom/${encodeURIComponent(bookingId)}/observation`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
        body: JSON.stringify({ notes }),
      });
      setState(res.ok ? 'saved' : 'error');
    } catch {
      setState('error');
    }
  };

  // Bottom corner of the stage, where the teacher's reactions sit (an observer has none).
  if (!open) {
    return (
      <div className="absolute bottom-4 start-4 z-20">
        <Button variant="glass" onClick={() => setOpen(true)}>
          <NotebookPen className="h-4 w-4" aria-hidden="true" />
          {t('Private notes', 'ملاحظات خاصة')}
        </Button>
      </div>
    );
  }
  return (
    <div className="glass-3 absolute bottom-4 start-4 z-20 grid w-[min(22rem,calc(100vw-2rem))] gap-2 rounded-[var(--r-card,1rem)] p-3">
      <label htmlFor="observer-notes" className="text-sm font-semibold text-foreground">{t('Private notes (only super admins see these)', 'ملاحظات خاصة (السوبر أدمن بس اللي بيشوفها)')}</label>
      <Textarea id="observer-notes" value={notes} maxLength={MAX} rows={4}
        onChange={(e) => { setNotes(e.target.value); setState('idle'); }} />
      <div className="flex items-center gap-2">
        <Button onClick={save} disabled={state === 'saving'}>{t('Save', 'احفظ')}</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>{t('Hide', 'اخفي')}</Button>
        <span role="status" className="ms-auto text-xs text-muted-foreground">
          {state === 'saved' ? t('Saved', 'اتحفظت') : state === 'error' ? t('Not saved. Try again.', 'ما اتحفظتش. جرّب تاني.') : `${notes.length}/${MAX}`}
        </span>
      </div>
    </div>
  );
}
