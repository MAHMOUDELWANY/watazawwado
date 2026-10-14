/**
 * Step 5 of the regular booking flow: book one lesson now, or see the matching
 * packages. Package prices come only from the server catalog (RULES.md §4);
 * packages are bought on the student packages page, then each lesson is booked with a credit.
 */

import React from 'react';
import { ArrowRight, ArrowLeft, Check, Clock, Package, ShieldCheck } from 'lucide-react';
import { Language, LessonDuration, PackageCatalogEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';

interface StepPackageQuantityProps {
  serviceId: string;
  duration: LessonDuration;
  lessonCount: number;
  onChangeCount: (count: number) => void;
  catalog?: PackageCatalogEntry[];
  lang: Language;
  onNext: () => void;
  onBack: () => void;
}

export const StepPackageQuantity: React.FC<StepPackageQuantityProps> = ({
  serviceId,
  duration,
  catalog = [],
  lang,
  onNext,
  onBack,
}) => {
  const isAr = lang === 'ar';
  const service = BOOKING_SERVICES.find((s) => s.id === serviceId) || BOOKING_SERVICES[0];
  const hourlyRate = service.hourlyRateUsd || 9;
  const singleLessonFee = calculateLessonFee(serviceId, duration, false);

  // Packages for this subject's price band and this lesson length.
  const packages = catalog
    .filter(c => c.is_active
      && Number(c.eligibility_rules?.hourly_rate) === hourlyRate
      && Number(c.eligibility_rules?.duration_minutes) === duration)
    .sort((a, b) => a.lesson_count - b.lesson_count);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80">
            {isAr ? 'درس واحد ولا باقة؟' : 'One lesson or a package?'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span>
              {isAr ? `${duration} دقيقة للحصة` : `${duration} min per lesson`} • {isAr ? service.arabicName : service.name}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-teal-500 bg-teal-500/10 ring-2 ring-teal-500 p-5 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
            <Check className="w-5 h-5 text-teal-600" />
            {isAr ? 'درس واحد' : 'Single lesson'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isAr ? 'احجز وادفع حصة واحدة دلوقتي، بدون أي التزام.' : 'Book and pay for one lesson now, no commitment.'}
          </p>
        </div>
        <div className="text-2xl font-black font-display text-primary">${singleLessonFee}</div>
      </div>

      {packages.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'عايز توفّر؟ الباقات بتديك سعر أقل للحصة. اشتري الباقة من صفحة الباقات، وبعدها احجز كل حصة برصيدك.'
              : 'Want to save? Packages give you a lower price per lesson. Buy one on the packages page, then book each lesson with your credits.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packages.map(pkg => {
              const savings = Math.max(0, Math.round((singleLessonFee * pkg.lesson_count - Number(pkg.price_amount)) * 100) / 100);
              return (
                <div key={pkg.id} className="glass-surface rounded-2xl border border-border/80 p-4 space-y-1">
                  <div className="font-bold text-foreground">
                    {isAr ? `${pkg.lesson_count} حصص` : `${pkg.lesson_count} lessons`}
                  </div>
                  <div className="text-xl font-black font-display text-primary">${Number(pkg.price_amount)}</div>
                  {savings > 0 && (
                    <div className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                      {isAr ? `بتوفّر $${savings}` : `You save $${savings}`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <a
            href="/student/packages"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary underline"
          >
            <Package className="w-4 h-4" />
            {isAr ? 'شوف الباقات' : 'See packages'}
          </a>
        </div>
      )}

      <div className="p-3.5 rounded-xl glass-card text-xs text-foreground/80 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          {isAr
            ? 'تقدر تلغي الحصة قبلها بـ 3 ساعات وترجع لك كرصيد، أو تغيّر موعدها لحد ساعة قبل بدايتها.'
            : 'You can cancel up to 3 hours before a lesson and get it back as a credit, or move it up to 1 hour before it starts.'}{' '}
          <a href="/terms#cancellation" className="underline font-semibold">
            {isAr ? 'السياسة كاملة' : 'Full policy'}
          </a>
        </span>
      </div>

      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/80 hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
          <span>{isAr ? 'رجوع' : 'Back'}</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl btn-primary-material text-white text-sm font-semibold shadow-md cursor-pointer"
        >
          <span>{isAr ? 'التالي: اختار الميعاد' : 'Next: pick a time'}</span>
          <ArrowRight className={`w-4 h-4 ${isAr ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
};
