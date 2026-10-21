import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { Star, X, Check } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { useActiveLearner } from '../activeLearner';
import { Button } from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Textarea';

interface Pending {
  bookingId: string;
  learnerName: string | null;
  subject: { en: string; ar: string };
  scheduledStart: string;
}

const DISMISS_KEY = 'watazawwado_feedback_dismissed';
const LABELS_AR = ['مش كويس', 'محتاج تحسين', 'كويس', 'حلو جدًا', 'ممتاز'];
const LABELS_EN = ['Poor', 'Could be better', 'Good', 'Very good', 'Excellent'];

/**
 * ST-02: after a lesson, one tap to say how it went (stored for our team; a teacher only ever sees an average of 5+),
 * then an optional comment and the teacher's family summary when it is written.
 */
export function LessonFeedbackCard({ isAr, timezone }: { isAr: boolean; timezone: string }) {
  const { activeId } = useActiveLearner();
  const [pending, setPending] = useState<Pending | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [stage, setStage] = useState<'rate' | 'comment' | 'done'>('rate');
  const [summary, setSummary] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setPending(null); setStage('rate'); setRating(0); setComment(''); setError('');
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<{ pending: Pending | null }>(`/api/student/lesson-feedback/pending${q}`)
      .then((d) => {
        if (cancelled || !d?.pending) return;
        let dismissed: string | null = null;
        try { dismissed = window.localStorage.getItem(DISMISS_KEY); } catch { /* storage blocked */ }
        if (dismissed !== d.pending.bookingId) setPending(d.pending);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [activeId]);

  if (!pending) return null;

  const send = async (value: number, text: string | null) => {
    setBusy(true); setError('');
    try {
      const r = await authedJson<{ familySummary: string | null }>(`/api/student/bookings/${pending.bookingId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ rating: value, comment: text })
      });
      setSummary(r.familySummary);
      return true;
    } catch (e: any) {
      setError(isAr ? 'معرفناش نحفظ تقييمك، جرّب تاني.' : e?.message || 'Could not save your rating.');
      return false;
    } finally {
      setBusy(false);
    }
  };

  const rate = async (value: number) => {
    setRating(value);
    if (await send(value, null)) setStage('comment');
  };
  const sendComment = async () => {
    if (!comment.trim() || await send(rating, comment.trim())) setStage('done');
  };
  const dismiss = () => {
    try { window.localStorage.setItem(DISMISS_KEY, pending.bookingId); } catch { /* storage blocked */ }
    setPending(null);
  };

  const when = DateTime.fromISO(pending.scheduledStart).setZone(timezone || 'UTC').setLocale(isAr ? 'ar' : 'en');
  const subject = isAr ? pending.subject.ar : pending.subject.en;
  const who = pending.learnerName ? (isAr ? ` لـ${pending.learnerName}` : ` with ${pending.learnerName}`) : '';
  const labels = isAr ? LABELS_AR : LABELS_EN;

  return (
    <section data-testid="lesson-feedback" className="relative p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="lesson-feedback-title">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 id="lesson-feedback-title" className="text-sm font-semibold text-foreground">
            {stage === 'rate'
              ? (isAr ? `إيه رأيك في درس ${subject}${who}؟` : `How was the ${subject} lesson${who}?`)
              : (isAr ? 'شكرًا، وصلنا تقييمك' : 'Thank you, we have your rating')}
          </h2>
          {when.isValid && <p className="text-xs text-muted-foreground">{when.toFormat(isAr ? 'cccc d LLLL، h:mm a' : 'cccc d LLLL, h:mm a')}</p>}
        </div>
        <button type="button" onClick={dismiss} aria-label={isAr ? 'إخفاء' : 'Hide'} className="tap-44 relative w-8 h-8 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-subtle cursor-pointer shrink-0">
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {stage === 'rate' && (
        <div role="group" aria-label={isAr ? 'التقييم' : 'Rating'} className="flex items-center gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((v) => (
            <button
              key={v}
              type="button"
              disabled={busy}
              onClick={() => rate(v)}
              aria-label={`${v} / 5 · ${labels[v - 1]}`}
              title={labels[v - 1]}
              className="w-11 h-11 grid place-items-center rounded-xl hover:bg-surface-subtle cursor-pointer disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Star className={`w-7 h-7 ${v <= rating ? 'fill-gold text-gold' : 'text-muted-foreground'}`} aria-hidden="true" />
            </button>
          ))}
        </div>
      )}

      {stage === 'comment' && (
        <div className="space-y-2">
          <label htmlFor="lesson-feedback-comment" className="text-xs text-muted-foreground">
            {isAr ? 'عايز تقول لنا حاجة كمان؟ (اختياري، بيوصل لفريقنا بس)' : 'Anything else to tell us? (optional, only our team reads it)'}
          </label>
          <Textarea id="lesson-feedback-comment" value={comment} maxLength={1000} rows={3} onChange={(e) => setComment(e.target.value)} />
          <div className="flex gap-2">
            <Button size="sm" onClick={sendComment} isLoading={busy}>{isAr ? 'ابعت' : 'Send'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setStage('done')}>{isAr ? 'لا، شكرًا' : 'No, thanks'}</Button>
          </div>
        </div>
      )}

      {stage !== 'rate' && (
        <div className="text-sm rounded-xl bg-surface-subtle p-3">
          {summary ? (
            <>
              <p className="text-xs font-semibold text-muted-foreground mb-1">{isAr ? 'ملخص المعلم للدرس' : "Your teacher's summary"}</p>
              <p className="whitespace-pre-line text-foreground">{summary}</p>
            </>
          ) : (
            <p className="text-muted-foreground">{isAr ? 'المعلم هيكتب ملخص قصير للدرس قريب، وهتلاقيه في صفحة التقدّم.' : 'Your teacher will write a short summary soon; you will find it on the progress page.'}</p>
          )}
        </div>
      )}

      {stage === 'done' && (
        <Button size="sm" variant="ghost" onClick={dismiss}><Check className="w-4 h-4 me-1" aria-hidden="true" />{isAr ? 'تمام' : 'Done'}</Button>
      )}

      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
