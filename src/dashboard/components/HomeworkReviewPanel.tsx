import React, { useEffect, useState } from 'react';
import { BookOpenCheck, Check, RotateCcw } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { homeworkLine, type HomeworkItem } from '../../lib/homework';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

/** NX-02: in the lesson window, the student's open homework; the teacher marks each task mastered or needs review. */
export function HomeworkReviewPanel({ studentId, bookingId }: { studentId: string; bookingId?: string | null }) {
  const { t, isAr } = useT();
  const [open, setOpen] = useState<HomeworkItem[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    dashboardFetch<{ open: HomeworkItem[] }>(`/api/dashboard/students/${studentId}/homework`)
      .then((d) => { if (!cancelled) setOpen((d.open || []).filter((hw) => !bookingId || hw.booking_id !== bookingId)); })
      .catch(() => { if (!cancelled) setOpen([]); });
    return () => { cancelled = true; };
  }, [studentId, bookingId]);

  // Tasks set in this same lesson are reviewed next time, not now.
  if (!open || (open.length === 0 && !flash)) return null;

  const review = async (hw: HomeworkItem, value: 'mastered' | 'needs_review') => {
    setBusy(hw.id); setError(null);
    try {
      await dashboardFetch(`/api/dashboard/homework/${hw.id}/review`, {
        method: 'POST', body: JSON.stringify({ review: value }),
      });
      setOpen((list) => (list || []).filter((x) => x.id !== hw.id));
      setFlash(value === 'mastered'
        ? t('Saved as mastered. The family will see it.', 'اتسجّل أتقن، والأسرة هتشوفه.')
        : t('Set again for next time.', 'اتحط تاني للمرة الجاية.'));
    } catch (err: any) {
      setError(err?.message || t('Could not save.', 'معرفناش نحفظ.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="rounded-xl border border-border p-3 space-y-2" data-testid="homework-review-panel">
      <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
        <BookOpenCheck className="w-4 h-4 text-teal" />{t('Homework from last time', 'واجب المرة اللي فاتت')}
      </h4>
      <ul className="space-y-2">
        {open.map((hw) => {
          const line = homeworkLine(hw, isAr);
          return (
            <li key={hw.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="grid">
                <span className="text-foreground">{line.title}</span>
                {line.note && <span className="text-xs text-muted-foreground">{line.note}</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <Badge variant={hw.done_at ? 'success' : 'default'}>{hw.done_at ? t('Done at home', 'خلّصه في البيت') : t('Not ticked yet', 'لسه ما علّمش')}</Badge>
                <Button type="button" size="sm" variant="outline" disabled={busy === hw.id} onClick={() => review(hw, 'mastered')}>
                  <Check className="w-4 h-4 me-1" />{t('Mastered', 'أتقن')}
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={busy === hw.id} onClick={() => review(hw, 'needs_review')}>
                  <RotateCcw className="w-4 h-4 me-1" />{t('Needs review', 'يحتاج مراجعة')}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
      {flash && <p role="status" className="text-xs text-teal">{flash}</p>}
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
