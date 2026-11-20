import React, { useCallback, useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarX2 } from 'lucide-react';
import FocusTrap from '../../components/FocusTrap';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Pending = { bookingId: string; deadlineAt: string; lesson: { referenceCode: string | null; scheduledStart: string; learnerName: string | null } | null };

const MIN = 10;
const MAX = 2000;

/**
 * Owner decision 2026-11-20: a room lesson nobody joined is recorded as missed (teacher absent) for 48 hours. This card
 * covers the dashboard, like LateReasonGate, until the teacher confirms or appeals with a reason; it never closes
 * without one of the two. No answer in 48 hours makes it final (the server sweep), and the card stops showing.
 */
export default function AbsenceGate({ hold = false }: { hold?: boolean }) {
  const { t, isAr } = useT();
  const reduce = useReducedMotion();
  const headingId = useId();
  const hintId = useId();
  const [pending, setPending] = useState<Pending[]>([]);
  const [appealing, setAppealing] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState<'' | 'confirm' | 'appeal'>('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setPending((await dashboardFetch<{ pending: Pending[] }>('/api/dashboard/absence-cases/pending')).pending || []);
    } catch {
      // A failed check never locks the teacher out; it runs again on the next load.
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const current = hold ? undefined : pending[0];
  useEffect(() => {
    if (!current) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = was; };
  }, [Boolean(current)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const length = reason.trim().length;
  const ready = length >= MIN && length <= MAX;
  const act = async (kind: 'confirm' | 'appeal', e?: React.FormEvent) => {
    e?.preventDefault();
    if (busy || (kind === 'appeal' && !ready)) return;
    setBusy(kind);
    setError('');
    try {
      await dashboardFetch(`/api/dashboard/absence-cases/${current.bookingId}/${kind}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kind === 'appeal' ? { reason: reason.trim() } : {}),
      });
      setReason('');
      setAppealing(false);
      await load();
    } catch {
      setError(t("That didn't save. Your words are still here. Try again.", 'ما اتحفظش. كلامك لسه موجود، جرّب تاني.'));
    } finally {
      setBusy('');
    }
  };

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const start = current.lesson ? new Date(current.lesson.scheduledStart) : null;
  const when = start ? start.toLocaleString(locale, { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '';
  const hoursLeft = Math.max(1, Math.round((Date.parse(current.deadlineAt) - Date.now()) / 3_600_000));
  const left = MIN - length;

  return (
    <div className="khatam-field brand-lights fixed inset-0 z-[200] flex items-stretch justify-center overflow-y-auto bg-background sm:items-center sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <FocusTrap>
        <motion.form
          role="dialog" aria-modal="true" aria-labelledby={headingId} onSubmit={(e) => act('appeal', e)}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="glass-3 relative flex min-h-full w-full flex-col gap-5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-start sm:min-h-0 sm:max-w-lg sm:rounded-[var(--r-4)] sm:p-8"
        >
          <div className="space-y-2">
            <h2 id={headingId} className={`font-editorial text-[1.75rem] leading-tight text-foreground ${isAr ? 'font-bold' : 'font-medium tracking-tight'}`}>
              {t('This lesson was recorded as missed', 'الحصة دي اتسجلت إنها فاتت')}
            </h2>
            <p className="max-w-prose text-muted-foreground">
              {t('Nobody joined the room, so we recorded it as missed on your side: it is not paid and the learner gets the lesson back. If that is right, confirm. If something else happened, tell us and our team will look at it.',
                'محدش دخل الغرفة، فسجلناها غياب من ناحيتك: مش مدفوعة والطالب بيرجعله الدرس. لو ده صح أكّد. لو حصل حاجة تانية احكيلنا والإدارة هتراجعها.')}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[var(--r-2)] border border-sand-border bg-sand-light p-3.5 dark:bg-sand/40">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {current.lesson?.learnerName ? t(`Lesson with ${current.lesson.learnerName}`, `حصة ${current.lesson.learnerName}`) : t('Your lesson', 'حصتك')}
              </p>
              <p className="text-sm text-muted-foreground">
                <bdi>{when}</bdi>
                {current.lesson?.referenceCode && <> · <bdi dir="ltr">{current.lesson.referenceCode}</bdi></>}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--r-pill)] bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
              <CalendarX2 className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">{t(`${hoursLeft} h left`, `فاضل ${hoursLeft} ساعة`)}</span>
            </span>
          </div>

          {appealing && (
            <div className="space-y-2">
              <label htmlFor={`${headingId}-reason`} className="block font-semibold text-foreground">{t('What happened?', 'إيه اللي حصل؟')}</label>
              <Textarea
                id={`${headingId}-reason`} value={reason} rows={5} maxLength={MAX} aria-describedby={hintId} autoFocus
                onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
                placeholder={t('For example: I was in the room from the start; the learner could not open the link.', 'مثلًا: كنت في الغرفة من الأول، والطالب ماعرفش يفتح اللينك.')}
                className="min-h-32"
              />
              <p id={hintId} className="flex justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
                <span>{left > 0 ? t(`${left} more ${left === 1 ? 'character' : 'characters'} to go`, `لسه ${left} حروف`) : t('Thank you, that helps.', 'شكرًا، كده واضح.')}</span>
                <span className="tabular-nums" dir="ltr">{length}/{MAX}</span>
              </p>
            </div>
          )}

          {error && <p role="alert" className="rounded-[var(--r-2)] bg-crimson-light px-3 py-2 text-sm font-medium text-foreground dark:bg-crimson/15">{error}</p>}

          <div className="mt-auto flex flex-col gap-2 sm:mt-0">
            {appealing ? (
              <>
                <Button type="submit" size="lg" isLoading={busy === 'appeal'} disabled={!ready || Boolean(busy)} className="w-full">{t('Send the appeal', 'ابعت الاعتراض')}</Button>
                <Button type="button" variant="ghost" onClick={() => setAppealing(false)} disabled={Boolean(busy)} className="w-full">{t('Back', 'رجوع')}</Button>
              </>
            ) : (
              <>
                <Button type="button" size="lg" isLoading={busy === 'confirm'} disabled={Boolean(busy)} onClick={() => act('confirm')} className="w-full">{t('Confirm, I missed it', 'أكّد، فاتتني')}</Button>
                <Button type="button" variant="outline" size="lg" disabled={Boolean(busy)} onClick={() => setAppealing(true)} className="w-full">{t('Appeal with a reason', 'اعترض واكتب السبب')}</Button>
              </>
            )}
          </div>
        </motion.form>
      </FocusTrap>
    </div>
  );
}
