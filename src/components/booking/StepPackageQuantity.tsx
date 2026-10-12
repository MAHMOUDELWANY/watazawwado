/**
 * ====================================================================
 * WATAZAWWADO ACADEMY — DEDICATED LESSON PACKAGE & QUANTITY STEP
 * File: src/components/booking/StepPackageQuantity.tsx
 * Role: Dedicated Step 5 for selecting lesson bundles (1, 4, 8, 12)
 *       or customizing quantity with stepper. Styled like homepage
 *       pricing cards with Liquid Glass aesthetic.
 * ====================================================================
 */

import React from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShieldCheck,
  Plus,
  Minus,
  CheckCircle2,
  Clock,
  HelpCircle
} from 'lucide-react';
import { Language, LessonDuration, PackageCatalogEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

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
  lessonCount,
  onChangeCount,
  catalog = [],
  lang,
  onNext,
  onBack,
}) => {
  const isEn = lang === 'en';
  const isAr = lang === 'ar';

  const service = BOOKING_SERVICES.find((s) => s.id === serviceId) || BOOKING_SERVICES[0];
  const hourlyRate = service.hourlyRateUsd || 9;
  const singleLessonFee = calculateLessonFee(serviceId, duration, false);

  // Pricing calculations based on duration and hourly rate
  // Base rates: Quran/Islamic = $9/hr, Languages/English = $13/hr
  const computeBundleRate = (count: number) => {
    // If available in DB catalog for 60m USD weekly
    if (duration === 60 && hourlyRate === 9 && catalog.length > 0) {
      const match = catalog.find(c => c.package_type === 'weekly' && c.lesson_count === count && c.is_active);
      if (match && match.price_amount > 0) {
        return {
          total: match.price_amount,
          perLesson: Math.round((match.price_amount / count) * 100) / 100,
          savings: Math.max(0, Math.round((singleLessonFee * count - match.price_amount) * 100) / 100),
        };
      }
    }

    // Default calculations with standard bundle discounts
    let perLessonDiscount = 0;
    if (count >= 12) perLessonDiscount = 0.15; // ~15% discount
    else if (count >= 8) perLessonDiscount = 0.11; // ~11% discount
    else if (count >= 4) perLessonDiscount = 0.06; // ~6% discount

    if (hourlyRate === 9 && duration === 60) {
      if (count === 4) return { total: 34, perLesson: 8.5, savings: 2 };
      if (count === 8) return { total: 64, perLesson: 8.0, savings: 8 };
      if (count === 12) return { total: 92, perLesson: 7.67, savings: 16 };
    }

    if (hourlyRate === 13 && duration === 60) {
      if (count === 4) return { total: 48, perLesson: 12.0, savings: 4 };
      if (count === 8) return { total: 92, perLesson: 11.5, savings: 12 };
      if (count === 12) return { total: 132, perLesson: 11.0, savings: 24 };
    }

    const unroundedTotal = singleLessonFee * count * (1 - perLessonDiscount);
    const total = Math.round(unroundedTotal);
    const perLesson = Math.round((total / count) * 100) / 100;
    const savings = Math.max(0, Math.round((singleLessonFee * count - total) * 100) / 100);
    return { total, perLesson, savings };
  };

  const packageCards = [
    {
      count: 1,
      title: isEn ? 'Single Lesson' : 'درس فردي مستقل',
      badge: isEn ? 'Pay as you go' : 'دفع مباشر',
      subtitle: isEn ? 'Pay for one lesson at a time with full scheduling freedom.' : 'حجز جلسة واحدة مستقلة دون التزام مسبق.',
      rate: { total: singleLessonFee, perLesson: singleLessonFee, savings: 0 },
      isPopular: false,
    },
    {
      count: 4,
      title: isEn ? 'Starter Pace (4 Lessons)' : 'باقة التأسيس (٤ حصص)',
      badge: isEn ? 'Starter' : 'بداية ميسرة',
      subtitle: isEn ? '1 private session per week for a calm, sustainable habit.' : 'حصة واحدة أسبوعياً لتأسيس سليم وثابت دون ضغط.',
      rate: computeBundleRate(4),
      isPopular: false,
    },
    {
      count: 8,
      title: isEn ? 'Consistent Growth (8 Lessons)' : 'باقة الاستمرار (٨ حصص)',
      badge: isEn ? 'Most Popular' : 'الأكثر طلباً واختياراً',
      subtitle: isEn ? '2 private sessions per week — the proven rhythm for fluency.' : 'حصتان أسبوعياً — الوتيرة الذهبية المعتمدة لإتقان التلاوة.',
      rate: computeBundleRate(8),
      isPopular: true,
    },
    {
      count: 12,
      title: isEn ? 'Intensive Track (12 Lessons)' : 'باقة الإتقان (١٢ حصة)',
      badge: isEn ? 'Best Value' : 'أعلى توفير',
      subtitle: isEn ? '3 sessions per week for rapid memorization or advanced grammar.' : '٣ حصص أسبوعياً للحفظ المتقن ودراسة النحو والعلوم.',
      rate: computeBundleRate(12),
      isPopular: false,
    },
  ];

  const currentRate = computeBundleRate(lessonCount);

  return (
    <div className="space-y-6">
      {/* Step Header */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <label className="block text-sm font-semibold uppercase tracking-wider text-foreground/80 dark:text-accent/90">
            {isEn ? 'Choose Your Package or Lesson Quantity' : 'اختر باقة الدروس أو عدد الحصص'}
          </label>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-secondary" />
            <span>
              {isEn ? `${duration} min per session` : `${duration} دقيقة للحصة`} • {isEn ? service.name : service.arabicName}
            </span>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {isAr
            ? 'وفر أكثر مع الباقات الشهرية المعتمدة، مع حرية توزيع واختيار مواعيد الحصص وفق جدولك المفضل.'
            : 'Save more with bundled lessons, with complete flexibility to schedule each session at your convenience.'}
        </p>
      </div>

      {/* Package Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {packageCards.map((pkg) => {
          const isSelected = lessonCount === pkg.count;
          return (
            <motion.div
              key={pkg.count}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onChangeCount(pkg.count)}
              className={`rounded-3xl border text-start transition-all cursor-pointer relative flex flex-col justify-between overflow-hidden shadow-sm ${
                isSelected
                  ? 'border-teal-500 bg-teal-500/15 dark:bg-teal-500/25 ring-2 ring-teal-500 shadow-xl shadow-teal-500/15'
                  : pkg.isPopular
                  ? 'glass-card border-secondary/60 hover:border-secondary hover:shadow-md'
                  : 'glass-surface border-border/80 hover:border-primary/40'
              }`}
            >
              {/* 4-Color Gradient Top Edge Accent */}
              <div
                className={`h-1.5 w-full ${
                  isSelected
                    ? 'bg-[linear-gradient(135deg,#087D91_0%,#D8C6AE_40%,#8B4935_75%,#C51F24_100%)]'
                    : pkg.isPopular
                    ? 'bg-[linear-gradient(135deg,#087D91_0%,#D8C6AE_50%,#C51F24_100%)]'
                    : 'bg-[linear-gradient(135deg,rgba(8,125,145,0.4)_0%,rgba(197,31,36,0.4)_100%)]'
                }`}
              />

              <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
                {/* Card Header & Badges */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                          pkg.isPopular
                            ? 'bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/30'
                            : 'bg-primary/10 text-primary border border-primary/20'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{pkg.badge}</span>
                      </span>

                      {pkg.rate.savings > 0 && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                          {isEn ? `Save $${pkg.rate.savings}` : `وفر $${pkg.rate.savings}`}
                        </span>
                      )}
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-teal-600 text-white shadow-xs' : 'border border-border/80'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4" />}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h4 className={`font-display text-lg font-bold mb-1 ${isSelected ? 'text-teal-950 dark:text-teal-100' : 'text-foreground'}`}>
                    {pkg.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {pkg.subtitle}
                  </p>
                </div>

                {/* Crystal-Clear Pricing Box */}
                <div className="p-3.5 rounded-2xl glass-surface border border-border/70 flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {isEn ? 'Total Package' : 'إجمالي الباقة'}
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className={`text-2xl sm:text-3xl font-black font-display ${isSelected ? 'text-teal-700 dark:text-teal-300' : 'text-primary'}`}>
                        ${pkg.rate.total}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        USD
                      </span>
                    </div>
                  </div>
                  <div className="text-end">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      {isEn ? 'Per Lesson' : 'سعر الحصة'}
                    </span>
                    <div className="text-sm font-bold text-foreground mt-0.5">
                      ${pkg.rate.perLesson.toFixed(2)}
                      <span className="text-[10px] text-muted-foreground font-normal ms-1">
                        {isEn ? '/ lesson' : '/ للحصة'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Custom Stepper for Custom Quantities */}
      <div className="p-4 rounded-2xl glass-card border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-accent" />
            <span>{isEn ? 'Custom Lesson Quantity' : 'أو اختر عدداً مخصصاً من الحصص'}</span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isEn
              ? 'Select any quantity from 1 to 24 lessons according to your schedule.'
              : 'يمكنك اختيار أي عدد من ١ حتى ٢٤ حصة دراسية حسب خطتك.'}
          </p>
        </div>

        {/* Counter Stepper */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            disabled={lessonCount <= 1}
            onClick={() => onChangeCount(Math.max(1, lessonCount - 1))}
            className="w-9 h-9 rounded-xl glass-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label={isEn ? 'Decrease lessons' : 'تقليل عدد الدروس'}
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="text-lg font-black font-display text-primary w-10 text-center">
            {lessonCount}
          </span>

          <button
            type="button"
            disabled={lessonCount >= 24}
            onClick={() => onChangeCount(Math.min(24, lessonCount + 1))}
            className="w-9 h-9 rounded-xl glass-surface border border-border flex items-center justify-center text-foreground hover:bg-surface-subtle disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            aria-label={isEn ? 'Increase lessons' : 'زيادة عدد الدروس'}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Summary Pill */}
      <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/25 flex items-center justify-between text-xs sm:text-sm text-teal-900 dark:text-teal-200">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
          <span>
            <strong>{lessonCount} {isEn ? (lessonCount === 1 ? 'lesson' : 'lessons') : (lessonCount === 1 ? 'حصة واحدة' : 'حصص')}</strong> • {isEn ? 'Total:' : 'المجموع:'} ${currentRate.total} USD
            {currentRate.savings > 0 && ` (${isEn ? `You save $${currentRate.savings}` : `وفر $${currentRate.savings}`})`}
          </span>
        </div>
        <span className="font-semibold text-teal-700 dark:text-teal-300">
          ${currentRate.perLesson.toFixed(2)} {isEn ? '/ session' : '/ حصة'}
        </span>
      </div>

      {/* Clear Reassurance Note */}
      <div className="p-3.5 rounded-xl glass-card border-none text-xs text-foreground/80 dark:text-accent/90 flex items-start gap-2.5">
        <ShieldCheck className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span>
            {isEn
              ? 'Lesson bundles are prepaid credit blocks with no recurring subscription. You have free rescheduling up to 3 hours before any session. '
              : 'الباقات الشهرية حصص مسبقة الدفع بدون اشتراك متكرر. يمكنك إعادة جدولة أي حصة مجاناً قبل موعدها بـ ٣ ساعات. '}
          </span>
          <a
            href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I have a question about lesson packages.')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#25D366] font-bold underline hover:opacity-80 transition-opacity"
          >
            {isEn ? 'Chat with Mahmoud on WhatsApp' : 'للاستفسار تواصل مع محمود عبر واتساب'}
          </a>
        </div>
      </div>

      {/* Step Navigation Controls */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/80 dark:text-accent/80 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back: Lesson Type' : 'الرجوع: نوع الدرس'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl btn-primary-material text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
        >
          <span>
            {lessonCount === 1
              ? (isEn ? 'Next: Pick Date & Time' : 'التالي: اختيار التاريخ والوقت')
              : (isEn ? `Next: Schedule ${lessonCount} Lessons` : `التالي: جدول مواعيد الـ ${lessonCount} حصص`)}
          </span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
};
