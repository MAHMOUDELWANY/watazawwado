/**
 * Screen 2 of the regular booking flow (owner D4, 2026-10-28): one lesson or a package, as the same
 * envelope cards as the public pricing. Choosing a package buys it inside the flow (this screen's
 * Continue opens the checkout, see BookingFlow) and the first lesson is booked from it. Package prices come only
 * from the server catalog (RULES.md §4); the server charges, this screen only shows.
 */

import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { Language, LessonDuration, PackageCatalogEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import { EnvelopeCard, EnvelopePlan } from '../public/pricing/EnvelopeCard';
import { TermsConsent } from './TermsConsent';

interface StepPackageQuantityProps {
  serviceId: string;
  duration: LessonDuration;
  catalog?: PackageCatalogEntry[];
  lang: Language;
  /** Catalog id of the package chosen here; undefined = one lesson. */
  selectedCatalogId?: string;
  onSelect?: (catalogId: string | undefined) => void;
  acceptedTerms?: boolean;
  acceptedEarlyStart?: boolean;
  onAcceptTerms?: (v: boolean) => void;
  onAcceptEarlyStart?: (v: boolean) => void;
  onNext: () => void;
  onBack: () => void;
  /** Inside a screen with several steps, the screen shows one Back/Continue for all of them. */
  hideNav?: boolean;
}

const TONES: EnvelopePlan['tone'][] = ['crimson', 'copper', 'teal'];

export const StepPackageQuantity: React.FC<StepPackageQuantityProps> = ({
  serviceId,
  duration,
  catalog = [],
  lang,
  selectedCatalogId,
  onSelect,
  acceptedTerms = false,
  acceptedEarlyStart = false,
  onAcceptTerms,
  onAcceptEarlyStart,
}) => {
  const isAr = lang === 'ar';
  const service = BOOKING_SERVICES.find((s) => s.id === serviceId) || BOOKING_SERVICES[0];
  const hourlyRate = service.hourlyRateUsd || 10;
  const singleLessonFee = calculateLessonFee(serviceId, duration, false);
  const money = (v: number) => `$${Number.isInteger(v) ? v : v.toFixed(2)}`;
  const n = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));

  // Packages for this subject's price band and this lesson length.
  const packages = catalog
    .filter(c => c.is_active
      && Number(c.eligibility_rules?.hourly_rate) === hourlyRate
      && Number(c.eligibility_rules?.duration_minutes) === duration)
    .sort((a, b) => a.lesson_count - b.lesson_count);

  const single: EnvelopePlan = {
    id: 'single',
    title: isAr ? 'حصة واحدة' : 'One lesson',
    meta: isAr ? `${n(duration)} دقيقة` : `${duration} minutes`,
    perLesson: money(singleLessonFee),
    total: isAr ? 'تدفع ثمن هذه الحصة فقط' : 'You pay for this lesson only',
    features: isAr
      ? ['من غير أي التزام', 'تلغي قبلها بـ 3 ساعات وترجع لك رصيد']
      : ['No commitment', 'Cancel 3 hours before and get a lesson credit'],
    tone: 'teal',
  };
  const plans: Array<EnvelopePlan & { catalogId?: string }> = [
    single,
    ...packages.map((pkg, i) => {
      const price = Number(pkg.price_amount);
      const savings = Math.max(0, Math.round((singleLessonFee * pkg.lesson_count - price) * 100) / 100);
      return {
        id: pkg.id,
        catalogId: pkg.id,
        title: isAr ? `${n(pkg.lesson_count)} حصص` : `${pkg.lesson_count} lessons`,
        meta: isAr ? `${n(duration)} دقيقة للحصة` : `${duration} min each`,
        badge: savings > 0 ? (isAr ? `توفّر ${money(savings)}` : `Save ${money(savings)}`) : undefined,
        perLesson: money(Math.round((price / pkg.lesson_count) * 100) / 100),
        total: isAr ? `${money(price)} للباقة كلها` : `${money(price)} for the package`,
        features: isAr
          ? ['تُحجز أول حصة فور الدفع', 'تحجز باقي الحصص متى ناسبك', 'رصيدك ظاهر في محفظتي']
          : ['Your first lesson is booked right after paying', 'Book the rest whenever it suits you', 'Your balance shows in My wallet'],
        tone: TONES[i % TONES.length],
      };
    }),
  ];

  const chosenId = selectedCatalogId || 'single';
  const chosenPackage = packages.find((p) => p.id === selectedCatalogId);
  // Once a package is chosen, the grid folds into one line so no other package sits beside the amount (P4-014).
  const [showAll, setShowAll] = useState(false);
  const choose = (catalogId: string | undefined) => {
    onSelect?.(catalogId);
    setShowAll(false);
  };
  const folded = Boolean(chosenPackage) && !showAll;

  return (
    <div className="space-y-5" data-testid="booking-plan-step">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{isAr ? 'حصة واحدة أم باقة؟' : 'One lesson or a package?'}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? `${service.arabicName} · ${n(duration)} دقيقة. الباقة تخفّض سعر الحصة.`
            : `${service.name} · ${duration} minutes. A package lowers the price of each lesson.`}
        </p>
      </div>

      {/* The same envelopes as the public pricing page (owner, 2026-11-02, after the compact cards):
          phones swipe a row, larger screens show a grid. The chosen one stands out of its envelope. */}
      {folded && chosenPackage && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border-2 border-[#087D91] bg-surface p-4" data-testid="booking-package-summary">
          <span className="text-sm text-foreground">
            <span className="block font-bold">
              {isAr
                ? `${n(chosenPackage.lesson_count)} حصص × ${n(duration)} دقيقة`
                : `${chosenPackage.lesson_count} lessons × ${duration} min`}
            </span>
            <span className="font-display text-xl font-bold tabular-nums" dir="ltr">{money(Number(chosenPackage.price_amount))}</span>
          </span>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="min-h-11 px-3 text-sm font-semibold text-primary underline underline-offset-4 cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {isAr ? 'غيّر' : 'Change'}
          </button>
        </div>
      )}

      {!folded && (
      <div
        role="radiogroup"
        aria-label={isAr ? 'اختر الخطة' : 'Choose a plan'}
        className="-mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 sm:mx-0 sm:px-0 sm:grid sm:overflow-visible sm:grid-cols-2 lg:grid-cols-3"
      >
        {plans.map((plan) => {
          const chosen = plan.id === chosenId;
          return (
            <div key={plan.id} role="radio" aria-checked={chosen} className="snap-center shrink-0 w-[17rem] sm:w-auto" data-plan-id={plan.id}>
              <EnvelopeCard
                plan={plan}
                open={chosen}
                onTap={() => choose(plan.catalogId)}
                primaryLabel={chosen ? (isAr ? 'مختارة ✓' : 'Chosen ✓') : (isAr ? 'اختر هذه' : 'Choose this')}
                onPrimary={() => choose(plan.catalogId)}
                isAr={isAr}
              />
            </div>
          );
        })}
      </div>
      )}

      {chosenPackage && (
        <div className={`rounded-2xl border p-4 space-y-3 ${acceptedTerms && acceptedEarlyStart ? 'border-border bg-surface' : 'border-amber-500/50 bg-amber-500/5'}`} data-testid="booking-package-terms">
          <p className="text-sm text-foreground">
            {isAr
              ? `ستدفع ${money(Number(chosenPackage.price_amount))} للباقة الآن، ثم تختار موعد أول حصة، دون دفع إضافي.`
              : `You pay ${money(Number(chosenPackage.price_amount))} for the package now, then pick the time of your first lesson with nothing more to pay.`}
          </p>
          <TermsConsent checked={acceptedTerms} onChange={(v) => onAcceptTerms?.(v)} isAr={isAr} />
          <label className="flex items-start gap-3 min-h-11 py-1 text-sm text-foreground/90 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[#087D91]" checked={acceptedEarlyStart} onChange={(e) => onAcceptEarlyStart?.(e.target.checked)} />
            <span>
              {isAr
                ? 'أريد أن تبدأ الحصص قبل انتهاء مهلة الـ 14 يومًا للتراجع.'
                : 'I want lessons to start before the 14-day withdrawal period ends.'}
            </span>
          </label>
        </div>
      )}

      <div className="p-3.5 rounded-xl glass-card text-xs text-foreground/80 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {isAr
            ? 'يمكنك إلغاء الحصة قبل موعدها بـ 3 ساعات فتعود إليك رصيدًا، أو تغيير موعدها حتى ساعة قبل بدايتها.'
            : 'You can cancel up to 3 hours before a lesson and get it back as a credit, or move it up to 1 hour before it starts.'}{' '}
          <a href={isAr ? '/ar/terms#cancellation' : '/terms#cancellation'} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            {isAr ? 'السياسة كاملة' : 'Full policy'}
          </a>
        </span>
      </div>
    </div>
  );
};
