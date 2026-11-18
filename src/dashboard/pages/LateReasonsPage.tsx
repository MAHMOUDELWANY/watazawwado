import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, Check, MinusCircle, Quote } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { Modal } from '../../components/ui/Modal';
import { notify } from '../../components/ui/Feedback';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Item = {
  bookingId: string; teacherId?: string; teacherName: string | null; lateMinutes: number; reason: string | null;
  status: 'pending' | 'sent' | 'excused' | 'deducted'; adminNote: string | null; createdAt: string;
  lesson: { referenceCode: string | null; scheduledStart: string; learnerName: string | null } | null;
};
type Filter = 'waiting' | 'reviewed';
type Decision = { item: Item; action: 'excuse' | 'deduct' };

const NOTE_MAX = 400;
const isOpen = (it: Item) => it.status === 'pending' || it.status === 'sent';
const monthOf = (it: Item) => (it.lesson?.scheduledStart || it.createdAt).slice(0, 7);

/** "1st", "2nd"... for "2nd this month". */
const ordinalEn = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th'}`;

/** Classroom Task 10 (super admin): each late lesson with the teacher's reason. Excuse, or deduct with a note. */
export default function LateReasonsPage() {
  const { t, isAr } = useT();
  const [items, setItems] = useState<Item[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('waiting');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(async () => {
    setLoadFailed(false);
    try {
      setItems((await dashboardFetch<{ items: Item[] }>('/api/admin/late-reasons')).items || []);
    } catch {
      setItems((was) => was ?? []);
      setLoadFailed(true);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  // How many times this teacher was late in the same month, in lesson order: facts first (design brief 4.7).
  const nth = useMemo(() => {
    const out = new Map<string, number>();
    const groups = new Map<string, Item[]>();
    for (const it of items || []) {
      const key = `${it.teacherId || it.teacherName}|${monthOf(it)}`;
      groups.set(key, [...(groups.get(key) || []), it]);
    }
    for (const list of groups.values()) {
      list.sort((a, b) => (a.lesson?.scheduledStart || a.createdAt).localeCompare(b.lesson?.scheduledStart || b.createdAt))
        .forEach((it, i) => out.set(it.bookingId, i + 1));
    }
    return out;
  }, [items]);

  const waiting = (items || []).filter(isOpen)
    .sort((a, b) => Number(b.status === 'sent') - Number(a.status === 'sent')); // reasons in first, then still waiting
  const reviewed = (items || []).filter((it) => !isOpen(it));
  const shown = filter === 'waiting' ? waiting : reviewed;
  const decided = waiting.filter((it) => it.status === 'sent').length;

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const when = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const monthName = (it: Item) => new Date(`${monthOf(it)}-01T12:00:00Z`).toLocaleDateString(locale, { month: 'long', year: 'numeric' });

  const startDecision = (item: Item, action: Decision['action']) => {
    setDecision({ item, action });
    setNote('');
    setAmount('');
    setFormError('');
  };

  const amountNum = Number(amount);
  const amountOk = amountNum > 0 && amountNum <= 1_000_000;
  const noteOk = note.trim().length >= 3;

  const confirm = async () => {
    if (!decision) return;
    const { item, action } = decision;
    if (!noteOk) return setFormError(t('Write a short note first (3 characters or more).', 'اكتب ملاحظة قصيرة الأول (3 حروف أو أكتر).'));
    if (action === 'deduct' && !amountOk) return setFormError(t('Enter the amount to deduct.', 'اكتب مبلغ الخصم.'));
    setBusy(true);
    setFormError('');
    try {
      await dashboardFetch(`/api/admin/late-reasons/${item.bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: note.trim(), ...(action === 'deduct' ? { amountCents: Math.round(amountNum * 100) } : {}) }),
      });
      notify(action === 'deduct' ? t('Deduction added to payroll.', 'الخصم اتضاف للمرتبات.') : t('Excused.', 'اتعفى.'));
      setDecision(null);
      await load();
    } catch (err: any) {
      setFormError(err?.message || t('Could not save the review. Try again.', 'معرفناش نحفظ المراجعة. جرّب تاني.'));
    } finally {
      setBusy(false);
    }
  };

  const late = (n: number) => (
    <span className="inline-flex items-center gap-1 rounded-[var(--r-pill)] bg-accent/10 px-2.5 py-1 text-sm font-semibold text-accent">
      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
      <span className="tabular-nums">{t(`${n} min late`, `${n} دقيقة تأخير`)}</span>
    </span>
  );

  const tab = (key: Filter, en: string, ar: string, count: number) => (
    <button type="button" role="tab" aria-selected={filter === key} onClick={() => setFilter(key)}
      className={`inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-semibold transition-colors duration-[var(--dur-ui)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal sm:flex-none ${
        filter === key ? 'bg-surface text-teal shadow-[var(--shadow-1)]' : 'text-muted-foreground hover:text-foreground'}`}>
      {t(en, ar)}
      <span className={`min-w-6 rounded-[var(--r-pill)] px-1.5 text-xs tabular-nums ${filter === key ? 'bg-teal/10' : 'bg-surface-warm'}`}>{count}</span>
    </button>
  );

  return (
    <div dir={isAr ? 'rtl' : 'ltr'} className="mx-auto max-w-3xl space-y-5 px-4 py-6 text-start">
      <header className="space-y-1">
        <h1 className={`font-editorial text-3xl text-foreground ${isAr ? 'font-bold' : 'font-medium tracking-tight'}`}>{t('Late to lessons', 'التأخير عن الحصص')}</h1>
        <p className="text-muted-foreground">
          {items === null ? t('Loading…', 'بنحمّل…')
            : decided ? t(`${decided} ${decided === 1 ? 'reason needs' : 'reasons need'} a decision.`, `${decided} محتاجين قرار.`)
            : t('Nothing needs a decision right now.', 'مفيش حاجة محتاجة قرار دلوقتي.')}
        </p>
      </header>

      <div role="tablist" aria-label={t('Show', 'اعرض')} className="flex gap-1 rounded-[var(--r-pill)] bg-surface-subtle p-1 sm:inline-flex">
        {tab('waiting', 'Waiting', 'مستني', waiting.length)}
        {tab('reviewed', 'Reviewed', 'اتراجع', reviewed.length)}
      </div>

      {loadFailed && (
        <Card className="flex flex-wrap items-center gap-3 p-4">
          <p className="flex-1 text-foreground">{t('Could not load late reasons.', 'معرفناش نحمّل أسباب التأخير.')}</p>
          <Button variant="outline" size="sm" onClick={load}>{t('Try again', 'جرّب تاني')}</Button>
        </Card>
      )}

      {items === null && (
        <div className="space-y-3" aria-hidden="true">
          {[0, 1].map((i) => <div key={i} className="skeleton-glass h-40 rounded-[var(--r-3)]" />)}
        </div>
      )}

      {items && !loadFailed && shown.length === 0 && (
        <div className="rounded-[var(--r-3)] border border-dashed border-border px-6 py-10 text-center">
          <Check className="mx-auto mb-2 h-6 w-6 text-teal" aria-hidden="true" />
          <p className="font-semibold text-foreground">
            {filter === 'waiting' ? t('Nothing waiting', 'مفيش حاجة مستنية') : t('Nothing reviewed yet', 'لسه مفيش حاجة اتراجعت')}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === 'waiting'
              ? t('When a teacher joins a lesson late, it shows up here with their reason.', 'لما معلم يدخل حصة متأخر، هتظهر هنا مع السبب بتاعه.')
              : t('Excused and deducted lessons are kept here.', 'الحصص اللي اتعفت أو اتخصم عليها بتفضل هنا.')}
          </p>
        </div>
      )}

      <ul className="space-y-3">
        {shown.map((it) => {
          const n = nth.get(it.bookingId) || 1;
          return (
            <li key={it.bookingId}>
              <Card className="space-y-3 p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <p className="font-semibold text-foreground">{it.teacherName || t('Teacher', 'معلم')}</p>
                  {late(it.lateMinutes)}
                  {n > 1 && (
                    <span className="text-sm text-muted-foreground">
                      {t(`${ordinalEn(n)} this month`, `المرة رقم ${n} الشهر ده`)}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {it.lesson?.learnerName && <>{t(`Lesson with ${it.lesson.learnerName}`, `حصة ${it.lesson.learnerName}`)} · </>}
                  {it.lesson && <bdi>{when(it.lesson.scheduledStart)}</bdi>}
                  {it.lesson?.referenceCode && <> · <bdi dir="ltr">{it.lesson.referenceCode}</bdi></>}
                </p>

                {it.reason ? (
                  <blockquote className="flex gap-2.5 rounded-[var(--r-2)] bg-sand-light px-3.5 py-3 text-foreground dark:bg-sand/40">
                    <Quote className="mt-0.5 h-4 w-4 shrink-0 text-accent rtl:-scale-x-100" aria-hidden="true" />
                    <p className="whitespace-pre-wrap break-words" dir="auto">{it.reason}</p>
                  </blockquote>
                ) : (
                  <p className="rounded-[var(--r-2)] border border-dashed border-border px-3.5 py-3 text-sm text-muted-foreground">
                    {t('Waiting for the teacher to send a reason. They see a note on their next sign-in.', 'مستنيين المعلم يبعت السبب. هتظهرله رسالة أول ما يدخل.')}
                  </p>
                )}

                {isOpen(it) ? (
                  <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => startDecision(it, 'deduct')} className="gap-1.5">
                      <MinusCircle className="h-4 w-4 text-accent" aria-hidden="true" />
                      {t('Deduct…', 'خصم…')}
                    </Button>
                    <Button variant="outline" onClick={() => startDecision(it, 'excuse')} className="gap-1.5 border-teal/40 text-teal">
                      <Check className="h-4 w-4" aria-hidden="true" />
                      {t('Excuse…', 'إعفاء…')}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start gap-2 border-t border-border pt-3 text-sm">
                    <span className={`inline-flex items-center gap-1 rounded-[var(--r-pill)] px-2.5 py-1 font-semibold ${it.status === 'excused' ? 'bg-teal/10 text-teal' : 'bg-accent/10 text-accent'}`}>
                      {it.status === 'excused' ? <Check className="h-3.5 w-3.5" aria-hidden="true" /> : <MinusCircle className="h-3.5 w-3.5" aria-hidden="true" />}
                      {it.status === 'excused' ? t('Excused', 'اتعفى') : t('Deducted', 'اتخصم')}
                    </span>
                    {it.adminNote && <p className="min-w-0 flex-1 pt-1 text-muted-foreground" dir="auto">{it.adminNote}</p>}
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>

      <Modal isOpen={Boolean(decision)} onClose={() => !busy && setDecision(null)} maxWidth="md"
        title={decision?.action === 'deduct' ? t('Deduct from pay', 'خصم من المرتب') : t('Excuse this lesson', 'إعفاء الحصة دي')}
        footer={decision && (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDecision(null)} disabled={busy}>{t('Cancel', 'إلغاء')}</Button>
            <Button onClick={confirm} isLoading={busy} disabled={!noteOk || (decision.action === 'deduct' && !amountOk)}>
              {decision.action === 'deduct'
                ? t(`Deduct ${amountOk ? amountNum.toFixed(2) : ''}`.trim(), `اخصم ${amountOk ? amountNum.toFixed(2) : ''}`.trim())
                : t('Excuse', 'اعفي')}
            </Button>
          </div>
        )}>
        {decision && (
          <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4 text-start">
            <p className="text-sm text-muted-foreground">
              {decision.item.teacherName || t('Teacher', 'معلم')} · {t(`${decision.item.lateMinutes} min late`, `${decision.item.lateMinutes} دقيقة تأخير`)}
              {decision.item.lesson?.referenceCode && <> · <bdi dir="ltr">{decision.item.lesson.referenceCode}</bdi></>}
            </p>
            {decision.action === 'deduct' && (
              <label className="block space-y-1.5">
                <span className="text-sm font-semibold text-foreground">{t("Amount, in the teacher's pay currency", 'المبلغ، بعملة مرتب المعلم')}</span>
                <Input type="number" min="0.01" step="0.01" inputMode="decimal" dir="ltr" value={amount} autoFocus
                  onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="max-w-40 tabular-nums" />
              </label>
            )}
            <label className="block space-y-1.5">
              <span className="text-sm font-semibold text-foreground">{t('Note', 'ملاحظة')}</span>
              <Textarea rows={3} maxLength={NOTE_MAX} value={note} dir="auto" autoFocus={decision.action === 'excuse'}
                onChange={(e) => setNote(e.target.value)}
                placeholder={decision.action === 'deduct'
                  ? t('Shown on the payroll line.', 'هتظهر في سطر المرتب.')
                  : t('For example: power cut, confirmed.', 'مثلًا: الكهربا قطعت، اتأكدنا.')} />
            </label>
            {decision.action === 'deduct' && (
              <p className="rounded-[var(--r-2)] bg-sand-light px-3.5 py-3 text-sm text-foreground dark:bg-sand/40">
                {t(`This adds a line of −${amountOk ? amountNum.toFixed(2) : '…'} to ${decision.item.teacherName || 'the teacher'}'s pay for ${monthName(decision.item)}.`,
                  `ده هيضيف سطر −${amountOk ? amountNum.toFixed(2) : '…'} على مرتب ${decision.item.teacherName || 'المعلم'} لشهر ${monthName(decision.item)}.`)}
              </p>
            )}
            {formError && <p role="alert" className="text-sm font-medium text-destructive">{formError}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
