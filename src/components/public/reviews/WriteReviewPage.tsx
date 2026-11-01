import React, { useEffect, useState } from 'react';
import { useOutletContext, useParams } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { BrandLoader } from '../../ui/BrandLoader';
import { ReviewForm, type ReviewPayload } from '../../reviews/ReviewForm';

/** NX-05: the page behind a one-time review link the academy sent (/review/<token>). Not indexed. */
export function WriteReviewPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isAr = lang === 'ar';
  const { token = '' } = useParams();
  const [state, setState] = useState<'loading' | 'open' | 'closed' | 'sent'>('loading');

  useEffect(() => {
    fetch(`/api/reviews/invite/${encodeURIComponent(token)}`).then((r) => setState(r.ok ? 'open' : 'closed')).catch(() => setState('closed'));
  }, [token]);

  const submit = async (p: ReviewPayload) => {
    const r = await fetch(`/api/reviews/invite/${encodeURIComponent(token)}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(isAr ? 'معرفناش نبعت. اتأكد من البيانات وجرّب تاني.' : d.error || 'Could not send.');
    setState('sent');
  };

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-2xl mx-auto space-y-8">
          <PageHero
            title={isAr ? <>شاركنا <span className="text-ribbon">رأيك</span></> : <>Share your <span className="text-ribbon">experience</span></>}
            intro={isAr ? 'رأيك بيساعد عيلات تانية تختار عن معرفة. شكراً إنك بتاخد دقيقتين.' : 'Your words help other families choose with confidence. Thank you for taking two minutes.'}
          />
          <Card className="p-5 sm:p-7">
            {state === 'loading' && <div className="py-10 grid justify-items-center"><BrandLoader size="md" /></div>}
            {state === 'closed' && (
              <p role="alert" className="text-sm text-muted-foreground">
                {isAr ? 'اللينك ده اتستخدم قبل كده أو انتهت مدته. لو عايز تكتب رأيك، اطلب منا لينك جديد على واتساب.' : 'This link was already used or has expired. If you would like to write a review, ask us for a new link on WhatsApp.'}
              </p>
            )}
            {state === 'open' && <ReviewForm isAr={isAr} onSubmit={submit} />}
            {state === 'sent' && (
              <p role="status" className="flex items-start gap-2 text-foreground" data-testid="review-sent">
                <CheckCircle2 className="w-5 h-5 text-teal shrink-0 mt-0.5" aria-hidden="true" />
                {isAr ? 'وصلنا رأيك، جزاك الله خيراً. هيظهر على الموقع بعد ما نراجعه.' : 'We received your review. Jazakum Allahu khayran. It will appear on our site once we have looked at it.'}
              </p>
            )}
          </Card>
        </div>
      </PublicSection>
    </main>
  );
}
