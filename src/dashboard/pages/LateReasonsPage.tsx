import React, { useCallback, useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Badge } from '../../components/ui/Badge';
import { notify } from '../../components/ui/Feedback';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Item = {
  bookingId: string; teacherName: string | null; lateMinutes: number; reason: string | null;
  status: 'pending' | 'sent' | 'excused' | 'deducted'; adminNote: string | null; createdAt: string;
  lesson: { referenceCode: string | null; scheduledStart: string; learnerName: string | null } | null;
};

/** Classroom Task 10 (super admin): each late lesson with the teacher's reason. Excuse, or deduct with a note. */
export default function LateReasonsPage() {
  const { t, isAr } = useT();
  const [items, setItems] = useState<Item[] | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setItems((await dashboardFetch<{ items: Item[] }>('/api/admin/late-reasons')).items || []);
    } catch {
      setItems([]);
      notify(t('Could not load late reasons.', 'تعذر تحميل أسباب التأخير.'), 'error');
    }
  }, [t]);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const review = async (it: Item, action: 'excuse' | 'deduct') => {
    const note = (notes[it.bookingId] || '').trim();
    const amount = Number(amounts[it.bookingId]);
    if (note.length < 3) return notify(t('Write a short note first.', 'اكتب ملاحظة قصيرة أولًا.'), 'error');
    if (action === 'deduct' && !(amount > 0)) return notify(t('Enter the amount to deduct.', 'اكتب مبلغ الخصم.'), 'error');
    setBusy(it.bookingId);
    try {
      await dashboardFetch(`/api/admin/late-reasons/${it.bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note, ...(action === 'deduct' ? { amountCents: Math.round(amount * 100) } : {}) }),
      });
      notify(action === 'deduct' ? t('Deduction added to payroll.', 'أُضيف الخصم إلى الرواتب.') : t('Excused.', 'تم الإعفاء.'));
      await load();
    } catch (err: any) {
      notify(err?.message || t('Could not save the review.', 'تعذر حفظ المراجعة.'), 'error');
    } finally {
      setBusy(null);
    }
  };

  const statusLabel: Record<Item['status'], [string, string, 'warning' | 'secondary' | 'success' | 'destructive']> = {
    pending: ['Waiting for the teacher', 'بانتظار المعلم', 'warning'],
    sent: ['Reason sent', 'وصل السبب', 'secondary'],
    excused: ['Excused', 'معفى', 'success'],
    deducted: ['Deducted', 'تم الخصم', 'destructive'],
  };

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <h1 className="font-display text-2xl text-foreground">{t('Late to lessons', 'التأخر عن الحصص')}</h1>
      {items === null && <p className="text-muted-foreground">{t('Loading…', 'جارٍ التحميل…')}</p>}
      {items?.length === 0 && <p className="text-muted-foreground">{t('No late lessons.', 'لا توجد حصص متأخرة.')}</p>}
      {items?.map((it) => {
        const [en, ar, variant] = statusLabel[it.status];
        const open = it.status === 'pending' || it.status === 'sent';
        const when = it.lesson ? new Date(it.lesson.scheduledStart).toLocaleString(isAr ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' }) : '';
        return (
          <Card key={it.bookingId} className="space-y-3 p-4 text-start">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-medium text-foreground">{it.teacherName || t('Teacher', 'معلم')} · {t(`${it.lateMinutes} min late`, `تأخر ${it.lateMinutes} دقيقة`)}</p>
                <p className="text-sm text-muted-foreground">{[it.lesson?.referenceCode, it.lesson?.learnerName, when].filter(Boolean).join(' · ')}</p>
              </div>
              <Badge variant={variant}>{t(en, ar)}</Badge>
            </div>
            <p className="whitespace-pre-wrap text-foreground">{it.reason || t('No reason sent yet.', 'لم يُرسَل سبب بعد.')}</p>
            {it.adminNote && <p className="text-sm text-muted-foreground">{t('Note:', 'ملاحظة:')} {it.adminNote}</p>}
            {open && (
              <div className="space-y-2">
                <Textarea rows={2} maxLength={400} value={notes[it.bookingId] || ''} aria-label={t('Note', 'ملاحظة')}
                  placeholder={t('Note (shown on the payroll line if you deduct)', 'ملاحظة (تظهر في سطر الراتب عند الخصم)')}
                  onChange={(e) => setNotes((n) => ({ ...n, [it.bookingId]: e.target.value }))} />
                <div className="flex flex-wrap items-center gap-2">
                  <Input type="number" min="0" step="0.01" inputMode="decimal" className="w-36" value={amounts[it.bookingId] || ''}
                    aria-label={t('Amount to deduct', 'مبلغ الخصم')} placeholder={t('Amount', 'المبلغ')}
                    onChange={(e) => setAmounts((a) => ({ ...a, [it.bookingId]: e.target.value }))} />
                  <Button variant="outline" size="sm" disabled={busy === it.bookingId} onClick={() => review(it, 'deduct')}>{t('Deduct', 'خصم')}</Button>
                  <Button size="sm" isLoading={busy === it.bookingId} onClick={() => review(it, 'excuse')}>{t('Excuse', 'إعفاء')}</Button>
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
