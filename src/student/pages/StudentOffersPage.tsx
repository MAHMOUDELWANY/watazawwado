import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, Clock, Sparkles, Info, ArrowRight } from 'lucide-react';
import { analyticsRepository } from '../../lib/analyticsRepository';

/**
 * ====================================================================
 * WATAZAWWADO — MY OFFERS (student)
 * File: src/student/pages/StudentOffersPage.tsx
 *
 * Shows ONLY teacher-approved offers (authoritative). The AI
 * recommendation is never presented here as a final price.
 * ====================================================================
 */

interface StudentOffersPageProps {
  session?: { access_token?: string | null } | null;
  lang?: 'en' | 'ar';
}

interface OfferRow {
  id: string;
  intake_id: string;
  service_category: string;
  duration_minutes: number;
  approved_price_usd: number;
  offer: any | null;
  status: string;
  offered_at: string | null;
}

export default function StudentOffersPage({ session, lang = 'en' }: StudentOffersPageProps) {
  const isAr = lang === 'ar';
  const [offers, setOffers] = useState<OfferRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState<string | null>(null);

  const authHeaders = (): Record<string, string> => {
    const token = session?.access_token;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch('/api/student/offers', { headers: authHeaders() });
      const data = await r.json();
      if (!r.ok) {
        setError(isAr ? 'تعذّر تحميل العروض.' : 'Could not load your offers.');
        return;
      }
      setOffers(data.offers || []);
      if ((data.offers || []).length > 0) {
        analyticsRepository.logEvent('offer_viewed', { count: data.offers.length });
      }
    } catch {
      setError(isAr ? 'تعذّر تحميل العروض.' : 'Could not load your offers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [session?.access_token]);

  const accept = async (id: string) => {
    setAccepting(id);
    try {
      const r = await fetch(`/api/student/offers/${id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
      });
      if (r.ok) {
        analyticsRepository.logEvent('offer_accepted', {});
        setOffers((prev) => prev.map((o) => (o.id === id ? { ...o, status: 'accepted' } : o)));
      }    } finally {
      setAccepting(null);
    }
  };

  const catLabel = (c: string) => {
    const map: Record<string, [string, string]> = {
      quran: ['Quran', 'القرآن'],
      islamic_studies: ['Islamic Studies', 'الدراسات الإسلامية'],
      arabic: ['Arabic', 'العربية'],
      english: ['English', 'الإنجليزية'],
    };
    const v = map[c] || [c, c];
    return isAr ? v[1] : v[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto" dir={isAr ? 'rtl' : 'ltr'}>
      <h1 className="text-2xl font-semibold text-foreground mb-1">
        {isAr ? 'عروضي' : 'My Offers'}
      </h1>
      <p className="text-muted-foreground text-sm mb-6">
        {isAr
          ? 'العروض اللي الأستاذ محمود راجعها ووافق عليها بنفسه.'
          : 'Offers personally reviewed and approved by Ustadh Mahmoud.'}
      </p>

      {error && (
        <div className="flex items-center gap-2 text-sm text-warning bg-warning/10 rounded-lg p-3 mb-4">
          <Info className="w-4 h-4" /> {error}
        </div>
      )}

      {offers.length === 0 && !error && (
        <div className="bg-surface border border-border rounded-xl p-8 text-center text-muted-foreground">
          {isAr ? 'لسه مفيش عروض جاهزة.' : 'No offers yet.'}
        </div>
      )}

      <div className="space-y-4">
        {offers.map((o) => {
          const hasOffer = o.offer && typeof o.offer === 'object';
          const finalPrice = hasOffer ? Number(o.offer.final_price_usd) : Number(o.approved_price_usd);
          return (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface border border-border rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2 text-primary text-sm font-medium mb-1">
                    <Sparkles className="w-4 h-4" />
                    {catLabel(o.service_category)}
                  </div>
                  <div className="text-foreground">
                    <span className="text-xl font-semibold">${finalPrice}</span>
                    <span className="text-muted-foreground text-sm">
                      {' '}· {o.duration_minutes} {isAr ? 'دقيقة' : 'min'}
                    </span>
                  </div>
                </div>
                {o.status === 'accepted' ? (
                  <span className="inline-flex items-center gap-1 text-success text-sm">
                    <CheckCircle2 className="w-4 h-4" /> {isAr ? 'تم قبول العرض' : 'Offer accepted'}
                  </span>
                ) : (
                  <button
                    onClick={() => accept(o.id)}
                    disabled={accepting === o.id}
                    className="h-10 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {accepting === o.id && <Loader2 className="w-4 h-4 animate-spin" />}
                    {isAr ? 'أوافق على العرض' : 'Accept offer'}
                  </button>
                )}
              </div>

              {o.status === 'accepted' && (
                <div className="mt-3 text-sm rounded-lg bg-muted/60 p-3 border border-border-subtle">
                  <p className="text-foreground font-medium">
                    {isAr ? 'الخطوة التالية: إتمام الحجز والدفع' : 'Next step: complete purchase & payment'}
                  </p>
                  <p className="text-muted-foreground mt-1">
                    {isAr
                      ? 'قبولك للعرض يسجّل رغبتك فقط. لتفعيل الحصص والرصيد، أكمل شراء الباقة وتأكيد الدفع عبر صفحة الباقات.'
                      : 'Accepting records your intent only. To activate lessons and credits, complete the package purchase and payment verification in the Packages page.'}
                  </p>
                  <a
                    href="/student/packages"
                    className="inline-flex items-center gap-1 mt-2 text-primary hover:underline font-medium"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {isAr ? 'إلى الباقات والدفع' : 'Go to Packages & payment'}
                  </a>
                </div>
              )}

              {hasOffer && (
                <div className="mt-3 text-sm text-muted-foreground border-t border-border-subtle pt-3">
                  <p className="font-medium text-foreground">{isAr ? o.offer.label_ar : o.offer.label_en}</p>
                  <p className="mt-1">
                    {isAr
                      ? `السعر الأصلي $${o.offer.original_price_usd} — خصم $${o.offer.discount_usd}`
                      : `Original $${o.offer.original_price_usd} — you save $${o.offer.discount_usd}`}
                  </p>
                  <p className="mt-1">{isAr ? o.offer.explanation_ar : o.offer.explanation_en}</p>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
