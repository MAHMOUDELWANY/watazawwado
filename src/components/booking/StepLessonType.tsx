import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, Clock, Gift, CalendarCheck, HelpCircle, Sparkles, Package } from 'lucide-react';
import { BookingMode, Language, LessonDuration, PackageCatalogEntry, PackageEntitlementEntry } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

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
}

export const StepLessonType: React.FC<StepLessonTypeProps> = ({
  mode,
  duration,
  serviceId,
  onChangeMode,
  onChangeDuration,
  onNext,
  onBack,
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
      note: 'Optimal for young children, focused Noorani Qaidah, or daily Tajweed drill.',
      arabicNote: 'مثالية للأطفال الصغار، القاعدة النورانية، أو التدريب اليومي السريع.'
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
      note: 'Comprehensive session for Arabic grammar, Islamic Studies, or dual-discipline learning.',
      arabicNote: 'جلسة شاملة وموسعة لقواعد النحو، أو الدراسات الإسلامية ومناقشاتها.'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Mode Choice (Free Trial vs Regular) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70 mb-2.5">
          {isEn ? 'Choose Your Booking Type' : 'نوع الحجز المطلوب'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Free Trial Card */}
          <motion.div
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
                ? 'bg-foreground glass-surface border-primary ring-2 ring-primary/30 shadow-xs cursor-pointer'
                : 'glass-card border-border hover:bg-foreground/40 cursor-pointer'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${trialDisabled ? 'bg-gray-200 dark:bg-gray-800 text-gray-500' : 'bg-secondary/40 text-accent'}`}>
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-medium text-foreground">
                    {isEn ? 'Free Trial Session' : 'جلسة تجريبية مجانية'}
                  </h4>
                  <span className={`text-xs font-semibold ${trialDisabled ? 'text-gray-500 dark:text-gray-400' : 'text-primary'}`}>
                    {trialDisabled
                      ? (isEn ? 'Already Claimed' : 'مستخدمة مسبقاً')
                      : (isEn ? '$0.00 • No card required' : 'مجاناً (٠.٠٠ دولار)')}
                  </span>
                </div>
              </div>
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mode === 'trial' && !trialDisabled
                    ? 'bg-primary text-white'
                    : 'border border-border'
                }`}
              >
                {mode === 'trial' && !trialDisabled && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <p className="text-xs text-foreground/70 dark:text-border/80 leading-relaxed mb-3">
              {isEn
                ? 'A 30-minute introductory meeting to get to know each other, evaluate current ability, experience Mahmoud’s teaching style, and receive an honest learning plan.'
                : 'لقاء تعريفي مدته ٣٠ دقيقة للتعارف وتقييم المستوى وتجربة أسلوب الشرح والحصول على خطة تعليمية مقترحة.'}
            </p>

            <div className="text-[11px] text-muted-foreground font-medium">
              {trialDisabled
                ? (trialDisabledReason || (isEn ? '• One free trial per student (already used)' : '• جلسة تجريبية واحدة لكل طالب (تم حجزها)'))
                : (isEn ? '• One free trial per new student' : '• جلسة تجريبية واحدة لكل طالب جديد')}
            </div>
          </motion.div>

          {/* Regular Lesson Card */}
          <motion.div
            whileHover={{ scale: 1.015, y: -1 }}
            whileTap={{ scale: 0.985 }}
            onClick={() => onChangeMode('regular')}
            className={`p-4 sm:p-5 rounded-2xl border text-start transition-all cursor-pointer relative ${
              mode === 'regular'
                ? 'bg-foreground glass-surface border-muted-foreground ring-2 ring-muted-foreground/30 shadow-xs'
                : 'glass-card border-border hover:bg-foreground/40'
            }`}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-muted-foreground/15 text-muted-foreground">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-display text-base font-medium text-foreground">
                    {isEn ? 'Regular 1-on-1 Lesson' : 'درس فردي منتظم'}
                  </h4>
                  <span className="text-xs font-semibold text-muted-foreground">
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
                    ? 'bg-muted-foreground text-white'
                    : 'border border-border'
                }`}
              >
                {mode === 'regular' && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>

            <p className="text-xs text-foreground/70 dark:text-border/80 leading-relaxed mb-3">
              {isEn
                ? 'Dedicated curriculum lesson for continuing students or those who wish to start scheduled instruction right away. Simple pay-per-lesson or monthly continuity.'
                : 'درس منهجي متكامل للطلاب الراغبين في بدء الخطة المباشرة. دفع بالدرس أو باقات شهرية ميسرة.'}
            </p>

            <div className="text-[11px] text-primary font-medium">
              {hasActiveCredits
                ? (isEn ? '• Redeemable using your active lesson package credits' : '• قابل للحجز باستخدام رصيد باقاتك النشطة')
                : (isEn ? '• Standard 1-on-1 personalized pace' : '• تدريس فردي مخصص بالكامل')}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Lesson Duration Selection */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70">
            {isEn ? 'Select Preferred Lesson Duration' : 'اختر مدة الدرس المناسبة'}
          </label>
          <span className="text-xs text-foreground/60 dark:text-border/60 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-accent" />
            {mode === 'trial'
              ? isEn ? 'Trial standard: 30 min (up to 45 min max)' : 'المدة للتجربة: ٣٠ دقيقة (بحد أقصى ٤٥ دقيقة)'
              : isEn ? 'Standard durations: 30, 45, 60 min' : 'المدد المعتمدة: ٣٠، ٤٥، ٦٠ دقيقة'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {durations.map((d) => {
            const isSelected = duration === d.length;
            const regularFee = calculateLessonFee(serviceId, d.length, false);
            const isDisabled = mode === 'trial' && d.length === 60; // Master Spec: 60 min is NOT a trial option (max trial is 45 min)

            const displayPrice = mode === 'trial'
              ? (isEn ? 'FREE' : 'مجاناً')
              : packageEntitlementId
              ? (isEn ? '1 Credit ($0 today)' : '١ رصيد (٠$ اليوم)')
              : `$${regularFee}`;

            return (
              <button
                key={d.length}
                type="button"
                disabled={isDisabled}
                onClick={() => onChangeDuration(d.length)}
                className={`p-4 rounded-2xl border text-start transition-all cursor-pointer flex flex-col justify-between ${
                  isDisabled
                    ? 'opacity-40 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent'
                    : isSelected
                    ? 'bg-foreground glass-surface border-primary ring-1 ring-primary shadow-xs'
                    : 'glass-card border-border hover:bg-foreground/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-display text-base font-medium text-foreground">
                      {isEn ? d.label : d.arabicLabel}
                    </span>
                    <span className={`text-xs font-semibold ${mode === 'trial' || packageEntitlementId ? 'text-primary' : 'text-muted-foreground'}`}>
                      {displayPrice}
                    </span>
                  </div>
                  <p className="text-[11px] text-foreground/65 dark:text-border/70 leading-relaxed">
                    {isEn ? d.note : d.arabicNote}
                  </p>
                </div>

                {isDisabled && (
                  <div className="mt-2 text-[10px] text-amber-700 dark:text-amber-400">
                    {isEn ? 'Max trial length is 45 min' : 'الحد الأقصى للتجربة ٤٥ دقيقة'}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Package Entitlement Credit Redemption (When Active Entitlements Exist) */}
      {mode === 'regular' && hasActiveCredits && (
        <div className="pt-4 border-t border-border space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70">
            {isEn ? 'Use an existing lesson credit' : 'استخدم رصيد درس موجود'}
          </label>

          <div className="grid grid-cols-1 gap-3">
            {/* Active Entitlements */}
            {eligibleEntitlements.map((ent) => {
              const isSelected = packageEntitlementId === ent.id;

              return (
                <motion.div
                  key={ent.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    onSelectPackageEntitlement?.(ent.id);
                    onSelectPackage?.(undefined);
                  }}
                  className={`p-4 sm:p-5 rounded-2xl border text-start transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-foreground glass-surface border-primary ring-2 ring-primary/30 shadow-xs'
                      : 'glass-card border-border hover:bg-foreground/30'
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
                        <span className="text-xs text-primary font-semibold">
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

                  <p className="text-xs text-foreground/70 dark:text-border/80 mt-2 leading-relaxed">
                    {isEn
                      ? 'This lesson will be linked to your prepaid package. No payment is required today. One credit will be deducted only after your lesson is completed.'
                      : 'سيتم ربط هذا الدرس بباقاتك مسبقة الدفع دون الحاجة لأي دفع اليوم، وسيتم خصم الرصيد فقط بعد إتمام الدرس مع الأستاذ.'}
                  </p>
                </motion.div>
              );
            })}

            {/* Standalone Pay per lesson option */}
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => {
                onSelectPackageEntitlement?.(undefined);
                onSelectPackage?.(undefined);
              }}
              className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                !packageEntitlementId
                  ? 'bg-foreground glass-surface border-muted-foreground ring-2 ring-muted-foreground/30 shadow-xs'
                  : 'glass-card border-border opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="font-display font-medium text-foreground">
                    {isEn ? 'Pay for this single lesson' : 'دفع مباشر لهذا الدرس بشكل مستقل'}
                  </h4>
                  <p className="text-xs text-foreground/65 dark:text-border/70 mt-1">
                    {isEn
                      ? `Standard standalone booking for one session ($${calculateLessonFee(serviceId, duration, false)} USD).`
                      : `حجز مستقل لدرس واحد ($${calculateLessonFee(serviceId, duration, false)} دولار أمريكي).`}
                  </p>
                </div>
                <div className="text-end">
                  <span className="font-medium text-muted-foreground">
                    ${calculateLessonFee(serviceId, duration, false)}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      )}

      {/* Package Catalog Selection (When No Active Entitlements Exist) */}
      {!hidePackagePurchase && !hasActiveCredits && !loadingPackages && packages.length > 0 && mode === 'regular' && (
        <div className="pt-4 border-t border-border">
          <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70 mb-2.5">
            {isEn ? 'Purchase Option (Optional)' : 'خيار الشراء (اختياري)'}
          </label>
          <div className="grid grid-cols-1 gap-3">
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => onSelectPackage?.(undefined)}
              className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                !selectedPackageId
                  ? 'bg-foreground glass-surface border-primary ring-2 ring-primary/30'
                  : 'glass-card border-border opacity-75'
              }`}
            >
              <h4 className="font-display font-medium text-foreground">
                {isEn ? 'Single Lesson (Pay as you go)' : 'درس واحد (دفع عند الحجز)'}
              </h4>
              <p className="text-xs text-foreground/65 dark:text-border/70 mt-1">
                {isEn ? 'Standard booking for one session.' : 'حجز قياسي لجلسة واحدة.'}
              </p>
            </motion.div>

            {packages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <motion.div
                  key={pkg.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onSelectPackage?.(pkg.id)}
                  className={`p-4 rounded-xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-foreground glass-surface border-primary ring-2 ring-primary/30'
                      : 'glass-card border-border opacity-75'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-display font-medium text-foreground">
                        {pkg.name}
                      </h4>
                      <p className="text-xs text-foreground/65 dark:text-border/70 mt-1">
                        {isEn
                          ? `${pkg.lesson_count} lessons • Prepaid ${pkg.package_type} package`
                          : `${pkg.lesson_count} دروس • باقة ${pkg.package_type} مدفوعة مسبقاً`}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-primary">${pkg.price_amount}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Manual Request for Sessions > 60 min note */}
      <div className="p-3.5 rounded-xl glass-card border-none text-xs text-foreground/70 dark:text-border/70 flex items-start gap-2.5">
        <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <span>
            {isEn
              ? '60 minutes is the standard maximum duration to protect focus and vocal clarity. If you need intensive multi-hour sessions or family blocks, please '
              : '٦٠ دقيقة هي الحد الأقصى للجلسات العادية حفاظاً على جودة التركيز والصوت. إذا كنت بحاجة لجلسات مكثفة أطول أو ترتيب عائلي، يرجى '}
          </span>
          <a
            href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I would like to request an extended lesson session (longer than 60 minutes).')}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground font-medium underline hover:text-primary"
          >
            {isEn ? 'request an extended session directly with Mahmoud' : 'مراسلة محمود مباشرة لترتيبها'}
          </a>
          .
        </div>
      </div>

      {/* Controls */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-foreground/80 dark:text-border/80 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Student Details' : 'الرجوع للبيانات'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-muted-foreground hover:bg-muted text-white text-sm font-medium shadow-xs transition-all cursor-pointer"
        >
          <span>{isEn ? 'Next: Pick Date & Time' : 'التالي: اختيار التاريخ والوقت'}</span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
};

