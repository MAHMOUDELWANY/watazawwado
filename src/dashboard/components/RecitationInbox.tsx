import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Mic } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

type Rec = { id: string; duration_sec: number | null; teacher_reply: string | null; playUrl: string | null; created_at: string };

/** NX-03, teacher: the student's recent recitations; listen and write a reply the family sees. */
export function RecitationInbox({ studentId }: { studentId: string }) {
  const { t, isAr } = useT();
  const [items, setItems] = useState<Rec[] | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardFetch<{ recordings: Rec[] }>(`/api/dashboard/students/${studentId}/recitations`)
      .then((d) => { if (!cancelled) setItems(d.recordings || []); }).catch(() => { if (!cancelled) setItems([]); });
    return () => { cancelled = true; };
  }, [studentId]);

  if (!items || items.length === 0) return null;

  const reply = async (r: Rec) => {
    setBusy(r.id); setError(null);
    try {
      const res = await dashboardFetch<{ recording: Rec }>(`/api/dashboard/recitations/${r.id}/reply`, { method: 'POST', body: JSON.stringify({ text: drafts[r.id] || '' }) });
      setItems((list) => (list || []).map((x) => (x.id === r.id ? { ...x, teacher_reply: res.recording.teacher_reply } : x)));
    } catch (e: any) {
      setError(e?.message || t('Could not save.', 'معرفناش نحفظ.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-border p-3 space-y-3" data-testid="recitation-inbox">
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5"><Mic className="w-4 h-4 text-teal" aria-hidden="true" />{t('Recitations from the student', 'تلاوات الطالب')}</h4>
      <ul className="space-y-3">
        {items.map((r) => (
          <li key={r.id} className="grid gap-2">
            <p className="text-xs text-muted-foreground">{DateTime.fromISO(r.created_at).setLocale(isAr ? 'ar' : 'en').toFormat('d LLL, HH:mm')}{r.duration_sec ? ` · ${r.duration_sec}s` : ''}</p>
            {r.playUrl && <audio controls preload="none" src={r.playUrl} className="w-full h-10" />}
            {r.teacher_reply ? (
              <p className="text-sm text-foreground whitespace-pre-line rounded-lg bg-surface-subtle p-2">{r.teacher_reply}</p>
            ) : (
              <div className="grid gap-2">
                <Textarea rows={2} maxLength={1000} value={drafts[r.id] || ''} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                  aria-label={t('Your reply', 'ردك')} placeholder={t('e.g. Beautiful. Watch the madd in ayah 3.', 'مثلاً: جميلة. خلّي بالك من المد في آية ٣.')} />
                <Button size="sm" className="w-fit" onClick={() => reply(r)} isLoading={busy === r.id} disabled={(drafts[r.id] || '').trim().length < 2}>{t('Send reply', 'ابعت الرد')}</Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
