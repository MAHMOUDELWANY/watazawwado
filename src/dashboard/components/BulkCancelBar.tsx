import React, { useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Button } from '../../components/ui/Button';
import { TeacherPicker, useActiveTeachers, moveLessonToTeacher } from './MoveTeacherControl';
import { confirmAction } from '../../components/ui/Feedback';

/** AD-02: only lessons still ahead and not finished can be picked for a bulk cancel. */
export const bulkCancelable = (b: { status: string; scheduled_start: string }, now = Date.now()) =>
  ['pending', 'confirmed', 'rescheduled'].includes(b.status) && Date.parse(b.scheduled_start) > now;

/**
 * AD-02: cancel several lessons with one reason. Each lesson goes through the same single-lesson request as the
 * lesson screen (PATCH /api/dashboard/bookings/:id), one after the other, so the server applies the usual rules,
 * credits and emails to each. Super admin only.
 * AD-02b: the same bar can instead move the picked lessons to another teacher, again one single-lesson request
 * (POST /api/dashboard/admin/bookings/:id/move-teacher) per lesson, and reports how many moved and how many did not.
 */
export function BulkCancelBar({ ids, onDone, onClear }: { ids: string[]; onDone: () => void; onClear: () => void }) {
  const { t } = useT();
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: number; failed: number; kind: 'cancel' | 'move'; firstError?: string } | null>(null);
  const [teacherId, setTeacherId] = useState('');
  const teachers = useActiveTeachers(ids.length > 0);
  if (!ids.length && !result) return null;

  const runMove = async () => {
    if (!teacherId || reason.trim().length < 3) return;
    if (!await confirmAction(t(`Move ${ids.length} lessons to the chosen teacher? Same times and prices; each family and both teachers are told.`, `تنقل ${ids.length} حصة للمدرس اللي اخترته؟ نفس المواعيد ونفس الأسعار، وكل أسرة والمدرسين الاتنين هيوصلهم إشعار.`))) return;
    setBusy(true);
    let ok = 0, failed = 0;
    let firstError: string | undefined;
    for (const id of ids) {
      try {
        await moveLessonToTeacher(id, teacherId, reason);
        ok++;
      } catch (err: any) {
        failed++;
        firstError = firstError || err?.message;
      }
    }
    setBusy(false);
    setResult({ ok, failed, kind: 'move', firstError });
    setReason('');
    setTeacherId('');
    onDone();
  };

  const run = async () => {
    if (reason.trim().length < 3) return;
    if (!await confirmAction(t(`Cancel ${ids.length} lessons? Each family is told, and paid lessons get a lesson credit as usual.`, `تلغي ${ids.length} حصة؟ كل أسرة هيوصلها إشعار، والحصص المدفوعة بترجع رصيد زي العادي.`))) return;
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
    setResult({ ok, failed, kind: 'cancel' });
    setReason('');
    onDone();
  };

  return (
    <div role="region" aria-label={t('Bulk actions', 'إجراءات جماعية')} data-testid="bulk-cancel-bar" className="sticky top-2 z-10 glass-card border border-border rounded-2xl p-4 space-y-3 shadow-lg">
      {result ? (
        <div className="flex flex-wrap items-center gap-3 text-sm" role="status">
          {result.kind === 'cancel' ? (
            <span>{t(`${result.ok} cancelled`, `${result.ok} اتلغت`)}{result.failed ? t(`, ${result.failed} could not be cancelled (open them one by one)`, `، ${result.failed} ماتلغتش (افتحها واحدة واحدة)`) : ''}</span>
          ) : (
            <span>{t(`${result.ok} moved`, `${result.ok} اتنقلت`)}{result.failed ? t(`, ${result.failed} could not be moved (open them one by one)`, `، ${result.failed} مااتنقلتش (افتحها واحدة واحدة)`) : ''}{result.firstError ? ` · ${result.firstError}` : ''}</span>
          )}
          <Button size="sm" variant="ghost" onClick={() => setResult(null)}>{t('Close', 'إغلاق')}</Button>
        </div>
      ) : (
        <>
          <p className="text-sm font-semibold text-foreground">{t(`${ids.length} lessons selected`, `${ids.length} حصة مختارة`)}</p>
          <label className="block text-xs text-muted-foreground" htmlFor="bulk-cancel-reason">{t('Reason (the family sees it when you cancel)', 'السبب (الأسرة بتشوفه لو لغيت)')}</label>
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
          <div className="space-y-2 border-t border-border pt-3" data-testid="bulk-move-teacher">
            <label className="block text-xs text-muted-foreground" htmlFor="bulk-move-teacher-pick">{t('Or move them to another teacher (same times and prices)', 'أو انقلها لمدرس تاني (نفس المواعيد والأسعار)')}</label>
            <TeacherPicker id="bulk-move-teacher-pick" teachers={teachers} value={teacherId} onChange={setTeacherId} disabled={busy} />
            <Button size="sm" variant="outline" onClick={runMove} isLoading={busy} disabled={!teacherId || reason.trim().length < 3}>
              {t('Move to another teacher', 'انقلها لمدرس تاني')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
