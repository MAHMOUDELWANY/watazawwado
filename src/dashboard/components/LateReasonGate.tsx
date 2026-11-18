import React, { useCallback, useEffect, useId, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Clock3 } from 'lucide-react';
import FocusTrap from '../../components/FocusTrap';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Pending = { bookingId: string; lateMinutes: number; lesson: { referenceCode: string | null; scheduledStart: string; durationMinutes?: number | null; learnerName: string | null } | null };

const MIN = 10;
const MAX = 2000;

/**
 * Classroom Task 10: while any lesson waits for a late reason, this covers the whole teacher dashboard (Start buttons
 * included). It cannot be closed; it goes away once every reason is sent, and comes back after sign-in until then.
 * Tone (design brief 4.6): "tell us, so we can help", not "you were caught". Free text only (owner decision).
 */
export default function LateReasonGate() {
  const { t, isAr } = useT();
  const reduce = useReducedMotion();
  const headingId = useId();
  const hintId = useId();
  const [pending, setPending] = useState<Pending[]>([]);
  const [total, setTotal] = useState(0);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await dashboardFetch<{ pending: Pending[] }>('/api/dashboard/late-reasons/pending');
      const list = data.pending || [];
      setPending(list);
      setTotal((n) => (list.length === 0 ? 0 : Math.max(n, list.length)));
    } catch {
      // A failed check never locks the teacher out; it runs again on the next load.
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const current = pending[0];
  // The dashboard behind must not scroll while the gate is up.
  useEffect(() => {
    if (!current) return;
    const was = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = was; };
  }, [Boolean(current)]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;

  const length = reason.trim().length;
  const ready = length >= MIN && length <= MAX;
  const send = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ready || sending) return;
    setSending(true);
    setError('');
    try {
      await dashboardFetch(`/api/dashboard/late-reasons/${current.bookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      setReason('');
      await load();
    } catch {
      // The words stay in the box, so nothing is lost.
      setError(t("That didn't send. Your words are still here. Try again.", 'ما اتبعتش. كلامك لسه موجود، جرّب تاني.'));
    } finally {
      setSending(false);
    }
  };

  const locale = isAr ? 'ar-EG' : 'en-GB';
  const start = current.lesson ? new Date(current.lesson.scheduledStart) : null;
  const day = start ? start.toLocaleDateString(locale, { weekday: 'long' }) : '';
  const date = start ? start.toLocaleDateString(locale, { day: 'numeric', month: 'long' }) : '';
  const time = start ? start.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }) : '';
  const learner = current.lesson?.learnerName;
  const step = total > 1 ? total - pending.length + 1 : 0;
  const left = MIN - length;

  return (
    <div className="khatam-field brand-lights fixed inset-0 z-[200] flex items-stretch justify-center overflow-y-auto bg-background sm:items-center sm:p-6" dir={isAr ? 'rtl' : 'ltr'}>
      <FocusTrap>
        <motion.form
          role="dialog" aria-modal="true" aria-labelledby={headingId} onSubmit={send}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.2 : 0.42, ease: [0.22, 1, 0.36, 1] }}
          className="glass-3 relative flex min-h-full w-full flex-col gap-5 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(1.75rem,env(safe-area-inset-top))] text-start sm:min-h-0 sm:max-w-lg sm:rounded-[var(--r-4)] sm:p-8"
        >
          {step > 0 && (
            <p className="text-sm font-medium text-muted-foreground tabular-nums">
              {t(`${step} of ${total}`, `${step} من ${total}`)}
            </p>
          )}
          <div className="space-y-2">
            <h2 id={headingId} className={`font-editorial text-[1.75rem] leading-tight text-foreground ${isAr ? 'font-bold' : 'font-medium tracking-tight'}`}>
              {day ? t(`You joined late on ${day}`, `دخلت الحصة متأخر يوم ${day}`) : t('You joined a lesson late', 'دخلت حصة متأخر')}
            </h2>
            <p className="max-w-prose text-muted-foreground">
              {t('It happens. Tell us what got in the way, in your own words, so we can help it not happen again.',
                'بتحصل. احكيلنا إيه اللي أخّرك بكلامك، عشان نقدر نساعدك إنها ما تتكررش.')}
            </p>
          </div>

          <div className="flex items-center gap-3 rounded-[var(--r-2)] border border-sand-border bg-sand-light p-3.5 dark:bg-sand/40">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">
                {learner ? t(`Lesson with ${learner}`, `حصة ${learner}`) : t('Your lesson', 'حصتك')}
              </p>
              <p className="text-sm text-muted-foreground">
                {date}{time && <> · <bdi dir="ltr">{time}</bdi></>}
                {current.lesson?.referenceCode && <> · <bdi dir="ltr">{current.lesson.referenceCode}</bdi></>}
              </p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--r-pill)] bg-accent/10 px-3 py-1.5 text-sm font-semibold text-accent">
              <Clock3 className="h-4 w-4" aria-hidden="true" />
              <span className="tabular-nums">{t(`${current.lateMinutes} min late`, `${current.lateMinutes} دقيقة`)}</span>
            </span>
          </div>

          <div className="space-y-2">
            <label htmlFor={`${headingId}-reason`} className="block font-semibold text-foreground">{t('What happened?', 'إيه اللي حصل؟')}</label>
            <Textarea
              id={`${headingId}-reason`}
              value={reason}
              onChange={(e) => { setReason(e.target.value); if (error) setError(''); }}
              maxLength={MAX}
              rows={5}
              aria-describedby={hintId}
              aria-invalid={Boolean(error) || undefined}
              placeholder={t('For example: the power went out at home for twenty minutes.', 'مثلًا: الكهربا قطعت عندنا في البيت ربع ساعة.')}
              className="min-h-32"
            />
            <p id={hintId} className="flex justify-between gap-3 text-sm text-muted-foreground" aria-live="polite">
              <span>{left > 0 ? t(`${left} more ${left === 1 ? 'character' : 'characters'} to go`, `لسه ${left} حروف`) : t('Thank you, that helps.', 'شكرًا، كده واضح.')}</span>
              <span className="tabular-nums" dir="ltr">{length}/{MAX}</span>
            </p>
          </div>

          {error && <p role="alert" className="rounded-[var(--r-2)] bg-crimson-light px-3 py-2 text-sm font-medium text-foreground dark:bg-crimson/15">{error}</p>}

          <div className="mt-auto space-y-2 sm:mt-0">
            <Button type="submit" size="lg" isLoading={sending} disabled={!ready} className="w-full">
              {t('Send', 'ابعت')}
            </Button>
            {pending.length > 1 && (
              <p className="text-center text-sm text-muted-foreground">
                {t(`${pending.length - 1} more ${pending.length === 2 ? 'lesson' : 'lessons'} after this one`, `بعدها ${pending.length - 1} كمان`)}
              </p>
            )}
          </div>
        </motion.form>
      </FocusTrap>
    </div>
  );
}
