import React, { useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';

/** AD-02: only lessons still ahead and not finished can be picked for a bulk cancel. */
export const bulkCancelable = (b: { status: string; scheduled_start: string }, now = Date.now()) =>
  ['pending', 'confirmed', 'rescheduled'].includes(b.status) && Date.parse(b.scheduled_start) > now;

/**
 * AD-02: cancel several lessons with one reason. Each lesson goes through the same single-lesson request as the
 * lesson screen (PATCH /api/dashboard/bookings/:id), one after the other, so the server applies the usual rules,
 * credits and emails to each. Super admin only.
 */
export function BulkCancelBar({ ids, onDone, onClear }: { ids: string[]; onDone: () => void; onClear: () => void }) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number } | null>(null);
  if (!ids.length && !result) return null;

  const run = async () => {
    if (reason.trim().length < 3) return;
    if (!window.confirm(t(`Cancel ${ids.length} lessons? Each family is told, and paid lessons get a lesson credit as usual.`, `تلغي ${ids.length} حصة؟ كل أسرة هيوصلها إشعار، والحصص المدفوعة بترجع رصيد زي العادي.`))) return;
    setBusy(true);
    let ok = 0, failed = 0;
    for (const id of ids) {
      try {
        await dashboardFetch(`/api/dashboard/bookings/${id}`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled', cancellation_reason: reason.trim() }) });
        ok++;
      } catch {
        failed++;
      }
    }
    setBusy(false);
    setResult({ ok, failed });
    setReason('');
    onDone();
  };

  return (
    <div role="region" aria-label={t('Bulk actions', 'إجراءات جماعية')} data-testid="bulk-cancel-bar" className="sticky top-2 z-10 glass-card border border-border rounded-2xl p-4 space-y-3 shadow-lg">
      {result ? (
        <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
          <span>{t(`${result.ok} cancelled`, `${result.ok} اتلغت`)}{result.failed ? t(`, ${result.failed} could not be cancelled (open them one by one)`, `، ${result.failed} ماتلغتش (افتحها واحدة واحدة)`) : ''}</span>
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>{t('Close', 'إغلاق')}</Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground">{t(`${ids.length} lessons selected`, `${ids.length} حصة مختارة`)}</p>
          <label className="block text-xs text-muted-foreground" htmlFor="bulk-cancel-reason">{t('Reason (the family sees it)', 'السبب (الأسرة بتشوفه)')}</label>
          <input
            id="bulk-cancel-reason"
            value={reason}
            maxLength={500}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-xl border border-border glass-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={run} isLoading={busy} disabled={reason.trim().length < 3} className="bg-destructive text-destructive-foreground">
              {t('Cancel the selected lessons', 'الغي الحصص المختارة')}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClear} disabled={busy}>{t('Clear selection', 'شيل الاختيار')}</Button>
          </div>
        </>
      )}
    </div>
  );
}
