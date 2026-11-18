import React, { useCallback, useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';

type Pending = { bookingId: string; lateMinutes: number; lesson: { referenceCode: string | null; scheduledStart: string; learnerName: string | null } | null };

const MIN = 10;
const MAX = 2000;
const noop = () => {};

/**
 * Classroom Task 10: while any lesson waits for a late reason, this covers the whole teacher dashboard (Start buttons
 * included). It cannot be closed; it goes away once every reason is sent, and comes back after sign-in until then.
 */
export default function LateReasonGate() {
  const { t, isAr } = useT();
  const [pending, setPending] = useState<Pending[]>([]);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await dashboardFetch<{ pending: Pending[] }>('/api/dashboard/late-reasons/pending');
      setPending(data.pending || []);
    } catch {
      // A failed check never locks the teacher out; it runs again on the next load.
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const current = pending[0];
  if (!current) return null;

  const length = reason.trim().length;
  const send = async () => {
    if (length < MIN || length > MAX) return;
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
      setError(t('That did not send. Please try again.', 'لم يُرسَل. حاول مرة أخرى.'));
    } finally {
      setSending(false);
    }
  };

  const when = current.lesson
    ? new Date(current.lesson.scheduledStart).toLocaleString(isAr ? 'ar' : 'en', { dateStyle: 'medium', timeStyle: 'short' })
    : '';

  return (
    <Modal isOpen onClose={noop} hideCloseButton layerClassName="z-[200]" maxWidth="lg"
      title={t('You were late to a lesson', 'تأخرت عن حصة')}
      footer={
        <Button onClick={send} isLoading={sending} disabled={length < MIN || length > MAX} className="w-full">
          {t('Send', 'إرسال')}
        </Button>
      }>
      <div dir={isAr ? 'rtl' : 'ltr'} className="space-y-4 text-start">
        <p className="text-foreground">
          {t(
            `You joined ${current.lateMinutes} minutes after the start of the lesson${current.lesson?.learnerName ? ` with ${current.lesson.learnerName}` : ''} (${when}). Please tell us what happened.`,
            `دخلت بعد بداية الحصة بـ ${current.lateMinutes} دقيقة${current.lesson?.learnerName ? ` مع ${current.lesson.learnerName}` : ''} (${when}). اكتب لنا ما حدث.`,
          )}
        </p>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={MAX}
          rows={5}
          aria-label={t('Reason', 'السبب')}
          placeholder={t('For example: the power went out at home.', 'مثلًا: انقطعت الكهرباء في البيت.')}
        />
        <p className="text-sm text-muted-foreground">
          {length < MIN
            ? t(`At least ${MIN} characters.`, `${MIN} أحرف على الأقل.`)
            : t(`${length} of ${MAX}`, `${length} من ${MAX}`)}
        </p>
        {pending.length > 1 && (
          <p className="text-sm text-muted-foreground">{t(`${pending.length - 1} more after this one.`, `بعدها ${pending.length - 1} أخرى.`)}</p>
        )}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      </div>
    </Modal>
  );
}
