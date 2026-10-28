/**
 * Screen 2 of the regular booking flow (owner D4, 2026-10-28): one lesson or a package, as the same
 * envelope cards as the public pricing. Choosing a package buys it inside the flow (this screen's
 * Continue opens the checkout, see BookingFlow) and the first lesson is booked from it. Package prices come only
 * from the server catalog (RULES.md §4); the server charges, this screen only shows.
 */

import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { Language, LessonDuration, PackageCatalogEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import type { EnvelopePlan } from '../public/pricing/EnvelopeCard';

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
  const hourlyRate = service.hourlyRateUsd || 9;
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
    total: isAr ? 'بتدفع الحصة دي بس' : 'You pay for this lesson only',
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
          ? ['أول حصة بتتحجز بعد الدفع على طول', 'باقي الحصص تحجزها وقت ما يناسبك', 'رصيدك ظاهر في محفظتي']
          : ['Your first lesson is booked right after paying', 'Book the rest whenever it suits you', 'Your balance shows in My wallet'],
        tone: TONES[i % TONES.length],
      };
    }),
  ];

  const chosenId = selectedCatalogId || 'single';
  const chosenPackage = packages.find((p) => p.id === selectedCatalogId);

  return (
    <div className="space-y-5" data-testid="booking-plan-step">
      <div>
        <h3 className="font-display text-lg font-bold text-foreground">{isAr ? 'حصة واحدة ولا باقة؟' : 'One lesson or a package?'}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr
            ? `${service.arabicName} · ${n(duration)} دقيقة. الباقة بتقلل سعر الحصة.`
            : `${service.name} · ${duration} minutes. A package lowers the price of each lesson.`}
        </p>
      </div>

      {/* Plans as small envelope cards: one column on phones, side by side from tablets. Tap anywhere to choose. */}
      <div role="radiogroup" aria-label={isAr ? 'اختار الخطة' : 'Choose a plan'} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {plans.map((plan) => {
          const chosen = plan.id === chosenId;
          const edge = { teal: '#087D91', crimson: '#C51F24', copper: '#8B4935' }[plan.tone];
          return (
            <button
              key={plan.id}
              type="button"
              role="radio"
              aria-checked={chosen}
              data-plan-id={plan.id}
              onClick={() => onSelect?.(plan.catalogId)}
              className={`relative overflow-hidden text-start rounded-2xl border bg-surface p-4 ps-5 cursor-pointer focus-ring transition-[border-color,box-shadow] ${
                chosen ? 'border-[#0A2E35] shadow-[0_0_0_2px_#0A2E35] dark:border-teal dark:shadow-[0_0_0_2px_var(--color-teal)]' : 'border-border hover:border-foreground/40'
              }`}
            >
              {/* Envelope edge in the plan's colour */}
              <span aria-hidden="true" className="absolute inset-y-0 start-0 w-1.5" style={{ background: edge }} />
              <span className="flex items-start justify-between gap-3">
                <span className="min-w-0">
                  <span className="block font-display text-lg font-bold text-foreground">{plan.title}</span>
                  <span className="block text-sm text-muted-foreground">{plan.meta}</span>
                </span>
                <span aria-hidden="true" className={`mt-1 w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${chosen ? 'border-[#0A2E35] bg-[#0A2E35] text-white dark:border-teal dark:bg-teal' : 'border-border'}`}>
                  {chosen && <Check className="w-4 h-4" />}
                </span>
              </span>
              <span className="mt-3 flex items-baseline flex-wrap gap-x-2 gap-y-1">
                <span className="font-editorial text-2xl font-bold text-foreground" dir="ltr">{plan.perLesson}</span>
                <span className="text-sm text-muted-foreground">{isAr ? 'للحصة' : 'a lesson'}</span>
                {plan.badge && <span className="ms-auto text-xs font-bold px-2 py-0.5 rounded-full" style={{ color: edge, background: `${edge}1A` }}>{plan.badge}</span>}
              </span>
              <span className="block text-sm text-muted-foreground mt-0.5">{plan.total}</span>
              {chosen && (
                <span className="mt-3 block space-y-1">
                  {plan.features.map((f) => (
                    <span key={f} className="flex items-start gap-2 text-sm text-foreground/85">
                      <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color: edge }} aria-hidden="true" />
                      <span>{f}</span>
                    </span>
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {chosenPackage && (
        <div className={`rounded-2xl border p-4 space-y-3 ${acceptedTerms && acceptedEarlyStart ? 'border-border bg-surface' : 'border-amber-500/50 bg-amber-500/5'}`} data-testid="booking-package-terms">
          <p className="text-sm text-foreground">
            {isAr
              ? `هتدفع ${money(Number(chosenPackage.price_amount))} للباقة دلوقتي، وبعدها تختار ميعاد أول حصة، وده من غير دفع تاني.`
              : `You pay ${money(Number(chosenPackage.price_amount))} for the package now, then pick the time of your first lesson with nothing more to pay.`}
          </p>
          <label className="flex items-start gap-3 text-sm text-foreground/90 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[#0A2E35]" checked={acceptedTerms} onChange={(e) => onAcceptTerms?.(e.target.checked)} />
            <span>
              {isAr ? 'قريت ووافقت على ' : 'I have read and accept the '}
              <a href={isAr ? '/ar/terms' : '/terms'} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
                {isAr ? 'الشروط وسياسة الإلغاء والاسترداد' : 'terms and the cancellation & refund policy'}
              </a>
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-foreground/90 cursor-pointer">
            <input type="checkbox" className="mt-0.5 w-5 h-5 shrink-0 accent-[#0A2E35]" checked={acceptedEarlyStart} onChange={(e) => onAcceptEarlyStart?.(e.target.checked)} />
            <span>
              {isAr
                ? 'عايز الحصص تبدأ قبل ما تخلص مدة الـ 14 يوم بتاعة الرجوع.'
                : 'I want lessons to start before the 14-day withdrawal period ends.'}
            </span>
          </label>
        </div>
      )}

      <div className="p-3.5 rounded-xl glass-card text-xs text-foreground/80 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {isAr
            ? 'تقدر تلغي الحصة قبلها بـ 3 ساعات وترجع لك كرصيد، أو تغيّر موعدها لحد ساعة قبل بدايتها.'
            : 'You can cancel up to 3 hours before a lesson and get it back as a credit, or move it up to 1 hour before it starts.'}{' '}
          <a href={isAr ? '/ar/terms#cancellation' : '/terms#cancellation'} target="_blank" rel="noopener noreferrer" className="underline font-semibold">
            {isAr ? 'السياسة كاملة' : 'Full policy'}
          </a>
        </span>
      </div>
    </div>
  );
};
