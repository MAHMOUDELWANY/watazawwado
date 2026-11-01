import React, { useEffect, useState } from 'react';
import { MessageSquareHeart, CheckCircle2 } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { ReviewForm, type ReviewPayload } from '../../components/reviews/ReviewForm';

/**
 * NX-05: after the first attended lesson, the family can write one review from the portal ("studied with us").
 * A quiet card: one button, no reminder nagging, gone once sent.
 */
export function WriteReviewCard({ isAr }: { isAr: boolean }) {
  const [state, setState] = useState<{ eligible: boolean; written: boolean } | null>(null);
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    authedJson<{ eligible: boolean; written: boolean }>('/api/student/review-status').then(setState).catch(() => {});
  }, []);

  if (!state?.eligible || (state.written && !sent)) return null;

  const submit = async (p: ReviewPayload) => {
    await authedJson('/api/student/reviews', { method: 'POST', body: JSON.stringify(p) });
    setSent(true);
  };

  return (
    <section data-testid="write-review-card" className="p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="write-review-title">
      <h2 id="write-review-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <MessageSquareHeart className="w-4 h-4 text-teal" aria-hidden="true" />
        {isAr ? 'رأيك يفرق مع عيلات تانية' : 'Your words help other families'}
      </h2>
      {sent ? (
        <p role="status" className="text-sm text-foreground flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal shrink-0 mt-0.5" aria-hidden="true" />
          {isAr ? 'وصلنا رأيك، جزاك الله خيراً.' : 'We received your review. Jazakum Allahu khayran.'}
        </p>
      ) : open ? (
        <ReviewForm isAr={isAr} onSubmit={submit} />
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{isAr ? 'لو حابب، اكتب رأيك في الحصص. بننشره على موقعنا بعد موافقتك.' : 'If you like, write a few words about your lessons. We show it on our site with your permission.'}</p>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>{isAr ? 'اكتب رأيك' : 'Write a review'}</Button>
        </>
      )}
    </section>
  );
}
