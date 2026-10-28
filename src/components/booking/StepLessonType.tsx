import React, { useEffect, useState } from 'react';
import { activateOnKey } from '../../lib/a11y';
import { motion } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, Gift, CalendarCheck, Package } from 'lucide-react';
import { BookingMode, Language, LessonDuration, PackageCatalogEntry, PackageEntitlementEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';

interface StepLessonTypeProps {
  mode: BookingMode;
  duration: LessonDuration;
  serviceId: string;
  onChangeMode: (mode: BookingMode) => void;
  onChangeDuration: (duration: LessonDuration) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
  trialDisabled?: boolean;
  trialDisabledReason?: string;
  selectedPackageId?: string;
  hidePackagePurchase?: boolean;
  onSelectPackage?: (id: string | undefined) => void;
  activeEntitlements?: PackageEntitlementEntry[];
  packageEntitlementId?: string;
  onSelectPackageEntitlement?: (id: string | undefined) => void;
  /** Inside a screen with several steps, the screen shows one Back/Continue for all of them. */
  hideNav?: boolean;
}

export const StepLessonType: React.FC<StepLessonTypeProps> = ({
  mode,
  duration,
  serviceId,
  onChangeMode,
  onChangeDuration,
  onNext,
  onBack,
  hideNav = false,
  lang,
  trialDisabled = false,
  trialDisabledReason,
  selectedPackageId,
  hidePackagePurchase = false,
  onSelectPackage,
  activeEntitlements = [],
  packageEntitlementId,
  onSelectPackageEntitlement
}) => {
  const isEn = lang === 'en';

  const [packages, setPackages] = useState<PackageCatalogEntry[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // Filter for valid active entitlements with positive remaining credits
  const eligibleEntitlements = activeEntitlements.filter(
    (e) => e.status === 'active' && e.remainingCredits > 0
  );
  const hasActiveCredits = eligibleEntitlements.length > 0;

  useEffect(() => {
    if (hidePackagePurchase) { setLoadingPackages(false); return; }
    fetch('/api/packages')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setPackages(data.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingPackages(false));
  }, []);

  const service = BOOKING_SERVICES.find((s) => s.id === serviceId) || BOOKING_SERVICES[0];

  const durations: { length: LessonDuration; label: string; arabicLabel: string; note: string; arabicNote: string }[] = [
    {
      length: 30,
      label: '30 Minutes',
      arabicLabel: '٣٠ دقيقة',
      note: 'Best for young children, first letters, or a short Tajweed drill.',
      arabicNote: 'مناسبة للأطفال الصغار، وأول الحروف، أو تدريب تجويد قصير.'
    },
    {
      length: 45,
      label: '45 Minutes',
      arabicLabel: '٤٥ دقيقة',
      note: 'Balanced depth for Quran recitation combined with Tajweed corrections.',
      arabicNote: 'مدة متوازنة تجمع بين التلاوة القرآنية والتصحيح التجويدي الهادئ.'
    },
    {
      length: 60,
      label: '60 Minutes',
      arabicLabel: '٦٠ دقيقة',
      note: 'A full hour: room for a Zad Path lesson, or deeper Fusha and English practice.',
      arabicNote: 'ساعة كاملة: وقت كفاية لحصة من مسار الأثر، أو تدريب أعمق في الفصحى والإنجليزي.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Mode Choice (Free Trial vs Regular): only while a free trial is still possible. */}
      {!trialDisabled && (
      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-foreground/80 dark:text-accent/90 mb-2.5">
          {isEn ? 'Choose Your Booking Type' : 'نوع الحجز المطلوب'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Free Trial Card */}
          <motion.div
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey}
            whileHover={trialDisabled ? {} : { scale: 1.015, y: -1 }}
            whileTap={trialDisabled ? {} : { scale: 0.985 }}
            onClick={() => {
              if (trialDisabled) return;
              onChangeMode('trial');
              if (duration > 45) onChangeDuration(30);
              onSelectPackageEntitlement?.(undefined);
              onSelectPackage?.(undefined);
            }}
            className={`p-4 sm:p-5 rounded-2xl border text-start transition-all relative ${
              trialDisabled
                ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-background/60 border-border'
                : mode === 'trial'
                ? 'border-teal-500 bg-teal-500/15 dark:bg-teal-500/25 ring-2 ring-teal-500 shadow-sm cursor-pointer'
                : 'glass-card border-border/80 hover:border-teal-500/40 hover:bg-surface-subtle cursor-pointer'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${trialDisabled ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' : 'bg-teal-500/20 text-teal-700 dark:text-teal-300'}`}>
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    {isEn ? 'Free Trial Session' : 'جلسة تجريبية مجانية'}
                  </h4>
                  <span className={`text-sm font-semibold ${trialDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-teal-700 dark:text-teal-300'}`}>
                    {trialDisabled
                      ? (isEn ? 'Already Claimed' : 'مستخدمة مسبقاً')
                      : (isEn ? '$0.00 • No card required' : 'مجاناً (٠.٠٠ دولار) • بدون بطاقة')}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mode === 'trial' && !trialDisabled
                    ? 'bg-teal-600 text-white'
                    : 'border border-border'
                }`}
              >
                {mode === 'trial' && !trialDisabled && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
              {isEn
                ? '30-minute introductory meeting to evaluate level and agree on a personalized plan.'
                : 'لقاء تعريفي مدته ٣٠ دقيقة لتحديد المستوى ومناقشة الخطة التعليمية المناسبة.'}
            </p>

            <div className="text-[11px] text-muted-foreground font-medium">
              {trialDisabled
                ? (trialDisabledReason || (isEn ? '• Already booked' : '• تم استخدام الجلسة مسبقاً'))
                : (isEn ? '• 1 free trial per new student' : '• جلسة واحدة مجانية لكل طالب جديد')}
            </div>
          </motion.div>

          {/* Regular Lesson Card */}
          <motion.div
            role="button"
            tabIndex={0}
            onKeyDown={activateOnKey}
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChangeMode('regular')}
            className={`p-4 sm:p-5 rounded-2xl border text-start transition-all cursor-pointer relative ${
              mode === 'regular'
                ? 'border-primary bg-primary/10 ring-2 ring-primary/40 shadow-sm'
                : 'glass-card border-border/80 hover:border-primary/40 hover:bg-surface-subtle'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${mode === 'regular' ? 'bg-primary/20 text-primary' : 'bg-muted-foreground/15 text-muted-foreground'}`}>
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-bold text-foreground">
                    {isEn ? 'Regular 1-on-1 Lesson' : 'درس فردي منتظم'}
                  </h4>
                  <span className={`text-sm font-semibold ${mode === 'regular' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {hasActiveCredits
                      ? (isEn ? 'Prepaid Credits Available • $0 today' : 'رصيد باقة متاح • ٠.٠٠$ اليوم')
                      : (isEn
                        ? `From $${calculateLessonFee(serviceId, 30, false)} • 30, 45, or 60 min`
                        : `يبدأ من $${calculateLessonFee(serviceId, 30, false)} • ٣٠ أو ٤٥ أو ٦٠ دقيقة`)}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mode === 'regular'
                    ? 'bg-primary text-white'
                    : 'border border-border'
                }`}
              >
                {mode === 'regular' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <p className="text-xs text-foreground/80 dark:text-accent/80 leading-relaxed mb-2">
              {isEn
                ? 'Dedicated 1-on-1 curriculum instruction at your preferred schedule.'
                : 'درس منهجي مباشر خاص بك مع المعلم وفق جدولك المفضل.'}
            </p>

            <div className="text-[11px] text-primary font-medium">
              {hasActiveCredits
                ? (isEn ? '• Uses your active package credits' : '• يخصم من رصيد باقاتك المتاحة')
                : (isEn ? '• Standalone lesson or multi-lesson bundles' : '• حجز درس مستقل أو باقات شهرية')}
            </div>
          </motion.div>
        </div>
      </div>

      )}

      {/* Lesson length: three compact choices; the note of the chosen one shows below. */}
      <div className="space-y-2.5">
        <p className="text-sm font-semibold text-foreground">{isEn ? 'Lesson length' : 'مدة الحصة'}</p>
        <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={isEn ? 'Lesson length' : 'مدة الحصة'}>
          {durations.map((d) => {
            const isSelected = duration === d.length;
            const isDisabled = mode === 'trial' && d.length === 60; // Master Spec: 60 min is not a trial option
            const price = mode === 'trial'
              ? (isEn ? 'Free' : 'مجاناً')
              : packageEntitlementId
              ? (isEn ? '1 credit' : 'رصيد حصة')
              : `$${calculateLessonFee(serviceId, d.length, false)}`;
            return (
              <button
                key={d.length}
                type="button"
                role="radio"
                aria-checked={isSelected}
                disabled={isDisabled}
                onClick={() => onChangeDuration(d.length)}
                className={`min-h-16 px-2 py-3 rounded-2xl border text-center transition-colors cursor-pointer focus-ring disabled:opacity-40 disabled:cursor-not-allowed ${
                  isSelected
                    ? 'border-[#0A2E35] bg-[#0A2E35] text-white dark:border-teal dark:bg-teal/20 dark:text-foreground'
                    : 'border-border bg-surface text-foreground hover:border-foreground/40'
                }`}
              >
                <span className="block font-display text-lg font-bold leading-tight">{isEn ? `${d.length} min` : `${d.arabicLabel}`}</span>
                <span className={`block text-sm font-semibold ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>{price}</span>
              </button>
            );
          })}
        </div>
        {(() => {
          const chosen = durations.find((d) => d.length === duration);
          return chosen ? <p className="text-sm text-muted-foreground">{isEn ? chosen.note : chosen.arabicNote}</p> : null;
        })()}
      </div>

      {/* Package Entitlement Credit Redemption (When Active Entitlements Exist) */}
      {mode === 'regular' && hasActiveCredits && (
        <div className="pt-4 border-t border-border space-y-3">
          <label className="block text-sm font-semibold uppercase tracking-wider text-foreground/80 dark:text-accent/90">
            {isEn ? 'Use an existing lesson credit' : 'استخدم رصيد درس موجود'}
          </label>

          <div className="grid grid-cols-1 gap-3">
            {/* Active Entitlements */}
            {eligibleEntitlements.map((ent) => {
              const isSelected = packageEntitlementId === ent.id;

              return (
                <motion.div
                  role="button"
                  tabIndex={0}
                  onKeyDown={activateOnKey}
                  key={ent.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    onSelectPackageEntitlement?.(ent.id);
                    onSelectPackage?.(undefined);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-start transition-all cursor-pointer relative ${
                    isSelected
                      ? 'glass-card border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                      : 'glass-surface border-border hover:border-primary/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-1.5">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-secondary/40 text-accent">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display text-base font-medium text-foreground">
                            {isEn ? 'Existing lesson credit' : 'رصيد درس موجود'}
                          </h4>
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary/30 text-accent">
                            {isEn ? `${ent.remainingCredits} lessons remaining` : `${ent.remainingCredits} دروس متبقية`}
                          </span>
                        </div>
                        <span className="text-sm text-primary font-semibold">
                          {isEn ? 'Use 1 existing lesson credit' : 'استخدم رصيد درس واحد'}
                        </span>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-primary text-white'
                          : 'border border-border'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>

                  <p className="text-sm text-foreground/80 dark:text-accent/80 mt-2 leading-relaxed">
                    {isEn
                      ? 'This lesson will be linked to your prepaid package. No payment is required today. One credit will be deducted only after your lesson is completed.'
                      : 'سيتم ربط هذا الدرس بباقاتك مسبقة الدفع دون الحاجة لأي دفع اليوم، وسيتم خصم الرصيد فقط بعد إتمام الدرس مع الأستاذ.'}
                  </p>
                </motion.div>
              );
            })}

            {/* Standalone Pay per lesson option */}
            <motion.div
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                onSelectPackageEntitlement?.(undefined);
                onSelectPackage?.(undefined);
              }}
              className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                !packageEntitlementId
                  ? 'glass-card border-primary ring-2 ring-primary/40 bg-primary/10 shadow-xs'
                  : 'glass-surface border-border opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-display font-medium text-foreground">
                    {isEn ? 'Pay for this single lesson' : 'دفع مباشر لهذا الدرس بشكل مستقل'}
                  </h4>
                  <p className="text-sm text-foreground/80 dark:text-accent/90 mt-1">
                    {isEn
                      ? `Standard standalone booking for one session ($${calculateLessonFee(serviceId, duration, false)} USD).`
                      : `حجز مستقل لدرس واحد ($${calculateLessonFee(serviceId, duration, false)} دولار أمريكي).`}
                  </p>
                </div>
                <div className="text-end">
                  <span className="font-medium text-primary font-bold">
                    ${calculateLessonFee(serviceId, duration, false)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

{/* Controls */}
      {!hideNav && (
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/80 dark:text-accent/80 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Student Details' : 'الرجوع للبيانات'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl btn-primary-material text-white text-sm font-semibold shadow-md transition-all cursor-pointer"
        >
          <span>
            {mode === 'trial'
              ? (isEn ? 'Next: Pick Date & Time' : 'التالي: اختيار موعد الجلسة')
              : packageEntitlementId
              ? (isEn ? 'Next: Pick Date & Time' : 'التالي: اختيار موعد الحصة')
              : (isEn ? 'Next: Choose Plan & Lessons' : 'التالي: اختيار عدد الدروس والباقة')}
          </span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
      )}
    </div>
  );
};

