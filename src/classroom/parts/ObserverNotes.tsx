import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, NotebookPen, Timer } from 'lucide-react';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

const MAX = 4000;
const DEBOUNCE_MS = 1500;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/** "12:34" or "1:02:05", the lesson clock for a timestamp line. */
export function lessonClock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(h ? 2 : 1, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm.padStart(2, '0')}:${ss}`;
}

/**
 * Super admin observer only: private notes on this visit, saved to admin_observations. The teacher never sees them.
 * Design brief 4.5: autosave (1.5 s after typing stops, on blur, on leave and on pagehide), "Mark this moment" puts
 * the lesson clock at the cursor, and the panel is opaque (it holds text being typed) and small enough to leave the
 * lesson in view. `startMs` is the scheduled lesson start; without it the clock counts from when the panel opened.
 */
export function ObserverNotes({ bookingId, ticket, startMs, onOpenChange }: { bookingId: string; ticket: string; startMs?: number; onOpenChange?: (open: boolean) => void }) {
  const { t, isAr } = useT();
  // Open from the start on laptops (the notes are the admin's work); a capsule on phones, so the lesson stays in view.
  const [open, setOpen] = useState(() => typeof window === 'undefined' || window.matchMedia('(min-width: 640px)').matches);
  const [notes, setNotes] = useState('');
  const [state, setState] = useState<SaveState>('idle');
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const area = useRef<HTMLTextAreaElement>(null);
  const openedAt = useRef(Date.now());
  const latest = useRef('');
  const lastSaved = useRef('');
  const seq = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  latest.current = notes;
  // The room docks the open panel beside the content on desktop instead of under it.
  useEffect(() => { onOpenChange?.(open); }, [open, onOpenChange]);

  const url = `/api/classroom/${encodeURIComponent(bookingId)}/observation`;
  const request = useCallback((text: string, keepalive = false) => fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
    body: JSON.stringify({ notes: text }),
    keepalive,
  }), [url, ticket]);

  const save = useCallback(async () => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    const text = latest.current;
    if (text === lastSaved.current) return;
    const mine = ++seq.current;
    setState('saving');
    try {
      const res = await request(text);
      if (mine !== seq.current) return; // a newer save owns the status
      if (!res.ok) throw res.status;
      lastSaved.current = text;
      setSavedAt(new Date());
      setState(latest.current === text ? 'saved' : 'idle');
    } catch (status) {
      if (mine !== seq.current) return;
      setState('error');
      // Network or server trouble: keep trying quietly while the admin watches. A 4xx will not get better by itself.
      if (!(typeof status === 'number' && status < 500)) timer.current = setTimeout(save, 5000);
    }
  }, [request]);

  // Leaving the page (tab closed, Leave quietly, navigation): send what is unsaved without waiting for an answer.
  const flushOnLeave = useCallback(() => {
    if (latest.current === lastSaved.current) return;
    try { request(latest.current, true); lastSaved.current = latest.current; } catch { /* nothing more we can do */ }
  }, [request]);

  useEffect(() => {
    window.addEventListener('pagehide', flushOnLeave);
    return () => {
      window.removeEventListener('pagehide', flushOnLeave);
      if (timer.current) clearTimeout(timer.current);
      flushOnLeave();
    };
  }, [flushOnLeave]);

  const change = (text: string) => {
    setNotes(text);
    setState('idle');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, DEBOUNCE_MS);
  };

  const markMoment = () => {
    const el = area.current;
    const at = el ? el.selectionStart : notes.length;
    const end = el ? el.selectionEnd : notes.length;
    const before = notes.slice(0, at);
    const stamp = `${before && !before.endsWith('\n') ? '\n' : ''}[${lessonClock(Date.now() - (startMs ?? openedAt.current))}] `;
    const next = before + stamp + notes.slice(end);
    if (next.length > MAX) return;
    change(next);
    const caret = at + stamp.length;
    requestAnimationFrame(() => { el?.focus(); el?.setSelectionRange(caret, caret); });
  };

  const time = savedAt?.toLocaleTimeString(isAr ? 'ar-EG' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  const status = state === 'saving' ? t('Saving…', 'بيتحفظ…')
    : state === 'error' ? t('Not saved yet. Your notes are still here.', 'ما اتحفظش لسه. ملاحظاتك لسه هنا.')
    : state === 'saved' && time ? t(`Saved · ${time}`, `اتحفظ · ${time}`)
    : notes ? t('Saves in a moment', 'هيتحفظ بعد لحظة')
    : t('Saves as you type', 'بيتحفظ وانت بتكتب');
  const dot = state === 'error' ? 'bg-crimson' : state === 'saved' ? 'bg-teal' : state === 'saving' ? 'bg-gold animate-pulse' : 'bg-muted-foreground/40';

  // Closed: a small capsule in the stage corner (an observer has no reactions there). Open: a compact opaque panel;
  // on phones it is a sheet across the bottom of the stage, on wider screens a 22rem card in the same corner.
  if (!open) {
    return (
      <div className="absolute bottom-3 start-3 z-20 sm:bottom-4 sm:start-4">
        <button type="button" onClick={() => setOpen(true)} aria-expanded="false" aria-controls="observer-notes-panel"
          className="glass-3 inline-flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-semibold text-foreground transition-transform duration-[var(--dur-tap)] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal">
          <NotebookPen className="h-4 w-4 text-accent" aria-hidden="true" />
          {t('Private notes', 'ملاحظات خاصة')}
          <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
          <span className="sr-only">{status}</span>
        </button>
      </div>
    );
  }

  return (
    <section id="observer-notes-panel" aria-labelledby="observer-notes-title"
      className="absolute inset-x-2 bottom-2 z-20 flex max-h-[60%] flex-col gap-2 rounded-[var(--r-3)] border border-border bg-surface p-3 shadow-[var(--shadow-3)] sm:inset-x-auto sm:bottom-4 sm:start-4 sm:w-[22rem] sm:max-h-[min(26rem,70%)]">
      <header className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <h2 id="observer-notes-title" className="text-sm font-semibold text-foreground">
            <label htmlFor="observer-notes">{t('Private notes', 'ملاحظات خاصة')}</label>
          </h2>
          <p className="text-xs text-muted-foreground">{t('Only super admins see these.', 'السوبر أدمن بس اللي بيشوفها.')}</p>
        </div>
        <button type="button" onClick={() => { save(); setOpen(false); }} aria-expanded="true" aria-controls="observer-notes-panel"
          aria-label={t('Hide notes', 'اخفي الملاحظات')}
          className="-me-1 -mt-1 grid h-11 w-11 shrink-0 place-items-center rounded-[var(--r-2)] text-muted-foreground hover:bg-surface-subtle hover:text-foreground focus-visible:outline-2 focus-visible:outline-teal">
          <ChevronDown className="h-5 w-5" aria-hidden="true" />
        </button>
      </header>
      <Textarea ref={area} id="observer-notes" value={notes} maxLength={MAX} rows={5} dir="auto"
        aria-describedby="observer-notes-status"
        placeholder={t('What you notice, as it happens. Use "Mark this moment" to stamp the lesson time.', 'اللي بتلاحظه أول بأول. "علّم اللحظة دي" بتحط وقت الحصة.')}
        className="min-h-24 flex-1 resize-none text-sm leading-relaxed"
        onChange={(e) => change(e.target.value)} onBlur={save} />
      <div className="flex items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={markMoment} className="min-h-11 gap-1.5 px-3 text-sm sm:min-h-9">
          <Timer className="h-4 w-4 text-teal" aria-hidden="true" />
          {t('Mark this moment', 'علّم اللحظة دي')}
        </Button>
        <p id="observer-notes-status" role="status" className="ms-auto flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot}`} aria-hidden="true" />
          <span className="truncate">{status}</span>
        </p>
      </div>
      {notes.length > MAX * 0.9 && (
        <p className="text-xs text-accent tabular-nums" dir="ltr">{notes.length}/{MAX}</p>
      )}
    </section>
  );
}
