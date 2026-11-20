import React, { useCallback, useEffect, useState } from 'react';
import { Check, Quote } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { notify } from '../../components/ui/Feedback';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Outcome = 'teacher_absent' | 'learner_no_show' | 'completed' | 'no_fault';
type Item = {
  bookingId: string; teacherName: string | null; status: 'open' | 'appealed' | 'final';
  resolution: 'confirmed' | 'expired' | 'appeal_accepted' | 'appeal_rejected' | null; outcome: Outcome | null;
  appealReason: string | null; adminNote: string | null; deadlineAt: string; createdAt: string;
  lesson: { referenceCode: string | null; scheduledStart: string; learnerName: string | null } | null;
};
type Decision = { item: Item; action: 'accept' | 'reject' };

const OUTCOMES: Record<Outcome, [string, string]> = {
  teacher_absent: ['Teacher absent (unpaid, learner gets the lesson back)', 'غياب المعلم (مش مدفوعة، والطالب يرجعله الدرس)'],
  learner_no_show: ['Learner no-show (paid, the lesson is used)', 'غياب الطالب (مدفوعة، والدرس بيتحسب)'],
  completed: ['The lesson was held (paid)', 'الحصة اتعملت (مدفوعة)'],
  no_fault: ['Nobody\'s fault (unpaid, learner gets the lesson back, not counted against the teacher)', 'مش غلطة حد (مش مدفوعة، والطالب يرجعله الدرس، ومش محسوبة على المعلم)'],
};
const RESOLUTIONS: Record<NonNullable<Item['resolution']>, [string, string]> = {
  confirmed: ['Teacher confirmed', 'المعلم أكّد'],
  expired: ['No answer in 48 h', 'مفيش رد في 48 ساعة'],
  appeal_accepted: ['Appeal accepted', 'الاعتراض اتقبل'],
  appeal_rejected: ['Appeal rejected', 'الاعتراض اترفض'],
};

/** Super admin: teachers' appeals against "nobody came, recorded as teacher absent" (next to Late reasons). */
export default function AbsenceAppealsPage() {
  const { t, isAr } = useT();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [outcome, setOutcome] = useState<Outcome>('learner_no_show');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      setItems((await dashboardFetch<{ items: Item[] }>('/api/admin/absence-cases')).items || []);
    } catch {
      setItems((was) => was ?? []);
      setLoadFailed(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const waiting = (items || []).filter((i) => i.status === 'appealed');
  const others = (items || []).filter((i) => i.status !== 'appealed');

  const save = async () => {
    if (!decision) return;
    setBusy(true);
    setFormError('');
    try {
      await dashboardFetch(`/api/admin/absence-cases/${decision.item.bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: decision.action, note: note.trim() || undefined, ...(decision.action === 'accept' ? { outcome } : {}) }),
      });
      notify(decision.action === 'accept' ? t('Appeal accepted. The lesson was recorded.', 'الاعتراض اتقبل والحصة اتسجلت.') : t('Appeal rejected. It stays teacher absent.', 'الاعتراض اترفض وفضلت غياب معلم.'));
      setDecision(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || t('Could not save the decision. Try again.', 'معرفناش نحفظ القرار. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const row = (it: Item) => (
    <li key={it.bookingId}>
      <Card className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <p className="font-semibold text-foreground">{it.teacherName || t('Teacher', 'معلم')}</p>
          <span className="text-sm text-muted-foreground">
            {it.status === 'open' ? t('Waiting for the teacher', 'مستنيين المعلم')
              : it.resolution ? t(...RESOLUTIONS[it.resolution]) : t('Appealed', 'فيه اعتراض')}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">
          {it.lesson?.learnerName && <>{t(`Lesson with ${it.lesson.learnerName}`, `حصة ${it.lesson.learnerName}`)} · </>}
          {it.lesson && <bdi>{when(it.lesson.scheduledStart)}</bdi>}
          {it.lesson?.referenceCode && <> · <bdi dir="ltr">{it.lesson.referenceCode}</bdi></>}
        </p>
        {it.appealReason && (
          <blockquote className="flex gap-2.5 rounded-[var(--r-2)] bg-sand-light px-3.5 py-3 text-foreground dark:bg-sand/40">
            <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent rtl:-scale-x-100" aria-hidden="true" />
            <p className="whitespace-pre-wrap break-words" dir="auto">{it.appealReason}</p>
          </blockquote>
        )}
        {it.outcome && <p className="text-sm text-foreground">{t(...OUTCOMES[it.outcome])}{it.adminNote && <> · <span dir="auto">{it.adminNote}</span></>}</p>}
        {it.status === 'appealed' && (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => { setDecision({ item: it, action: 'accept' }); setOutcome('learner_no_show'); setNote(''); setFormError(''); }}>{t('Accept', 'اقبل')}</Button>
            <Button size="sm" variant="outline" onClick={() => { setDecision({ item: it, action: 'reject' }); setNote(''); setFormError(''); }}>{t('Reject', 'ارفض')}</Button>
          </div>
        )}
      </Card>
    </li>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-5 px-4 py-6 text-start">
      <header className="space-y-1">
        <h1 className={`font-editorial text-3xl text-foreground ${isAr ? 'font-bold' : 'font-medium tracking-tight'}`}>{t('Missed-lesson appeals', 'اعتراضات الحصص الفايتة')}</h1>
        <p className="text-muted-foreground">
          {t('When nobody joins a lesson, it is recorded as teacher absent. The teacher confirms or appeals within 48 hours; appeals wait for you here.',
            'لما محدش يدخل الحصة بتتسجل غياب معلم. المعلم بيأكّد أو يعترض خلال 48 ساعة، والاعتراضات بتستناك هنا.')}
        </p>
      </header>

      {loadFailed && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <p className="flex-1 text-foreground">{t('Could not load the appeals.', 'معرفناش نحمّل الاعتراضات.')}</p>
          <Button variant="outline" size="sm" onClick={load}>{t('Try again', 'جرّب تاني')}</Button>
        </Card>
      )}
      {items === null && <div className="skeleton-glass h-40 rounded-[var(--r-3)]" aria-hidden="true" />}
      {items && !loadFailed && waiting.length === 0 && (
        <div className="rounded-[var(--r-3)] border border-dashed border-border px-6 py-8 text-center">
          <Check className="mx-auto mb-2 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="font-semibold text-foreground">{t('No appeal is waiting', 'مفيش اعتراض مستني')}</p>
        </div>
      )}
      <ul className="space-y-3">{waiting.map(row)}</ul>
      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold text-foreground">{t('Other missed lessons', 'حصص فايتة تانية')}</h2>
          <ul className="space-y-3">{others.map(row)}</ul>
        </section>
      )}

      <Modal
        isOpen={Boolean(decision)} onClose={() => !busy && setDecision(null)}
        title={decision?.action === 'accept' ? t('Accept the appeal', 'اقبل الاعتراض') : t('Reject the appeal', 'ارفض الاعتراض')}
        footer={<div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDecision(null)} disabled={busy}>{t('Cancel', 'إلغاء')}</Button>
          <Button onClick={save} isLoading={busy}>{t('Save', 'احفظ')}</Button>
        </div>}
      >
        <div className="space-y-3 text-start">
          {decision?.action === 'accept' ? (
            <label className="block space-y-1.5">
              <span className="font-semibold text-foreground">{t('What really happened?', 'إيه اللي حصل فعلًا؟')}</span>
              <Select value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome)}>
                {(['learner_no_show', 'completed', 'no_fault'] as Outcome[]).map((o) => <option key={o} value={o}>{t(...OUTCOMES[o])}</option>)}
              </Select>
            </label>
          ) : (
            <p className="text-muted-foreground">{t(OUTCOMES.teacher_absent[0], OUTCOMES.teacher_absent[1])}</p>
          )}
          <label className="block space-y-1.5">
            <span className="text-sm text-muted-foreground">{t('Note (optional)', 'ملاحظة (اختياري)')}</span>
            <Textarea value={note} maxLength={400} rows={3} onChange={(e) => setNote(e.target.value)} />
          </label>
          {formError && <p role="alert" className="text-sm text-destructive">{formError}</p>}
        </div>
      </Modal>
    </div>
  );
}
