import React from 'react';
import { motion } from 'motion/react';
import {
  Check,
  ArrowLeft,
  Calendar,
  Clock,
  Globe,
  User,
  Mail,
  Phone,
  BookOpen,
  Target,
  ShieldCheck,
  Edit2,
  Lock,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { BookingFormData, Language } from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee, MAJOR_TIMEZONES } from '../../booking/mockData';

interface StepReviewSummaryProps {
  formData: BookingFormData;
  onGoToStep: (step: number) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
  lang: Language;
  scheduleStep?: number;
  pendingBookingReference?: string;
  onOpenCheckout?: () => void;
}

export const StepReviewSummary: React.FC<StepReviewSummaryProps> = ({
  formData,
  onGoToStep,
  onSubmit,
  onBack,
  isSubmitting,
  lang,
  scheduleStep = 5,
  pendingBookingReference,
  onOpenCheckout
}) => {
  const isEn = lang === 'en';
  const service = BOOKING_SERVICES.find((s) => s.id === formData.serviceId) || BOOKING_SERVICES[0];
  const isChild = formData.audience === 'child';
  const isTrial = formData.mode === 'trial';
  const isPackageCredit = Boolean(formData.packageEntitlementId);
  const fee = isTrial || isPackageCredit ? 0 : calculateLessonFee(formData.serviceId, formData.duration, false);

  const [packageDetails, setPackageDetails] = React.useState<any>(null);
  React.useEffect(() => {
    if (formData.selectedPackageId) {
      fetch('/api/packages')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data) {
            const pkg = data.data.find((p: any) => p.id === formData.selectedPackageId);
            if (pkg) setPackageDetails(pkg);
          }
        })
        .catch(console.error);
    }
  }, [formData.selectedPackageId]);

  const matchedTz = MAJOR_TIMEZONES.find((t) => t.value === formData.timezone);
  const tzName = matchedTz ? matchedTz.label : formData.timezone;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-foreground/80 dark:text-accent/90 leading-relaxed max-w-2xl">
          {isEn
            ? 'Please take a moment to review your lesson details before confirming. You can adjust any section by clicking the edit icon.'
            : 'يرجى مراجعة تفاصيل درسك بعناية قبل التأكيد النهائي. يمكنك تعديل أي قسم بالنقر على زر التعديل.'}
        </p>
      </div>

      {/* Main Review Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border-none space-y-5">
        {/* Service & Goal */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <BookOpen className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'Selected Discipline' : 'المادة المختارة'}</span>
            </div>
            <h3 className="font-display text-lg font-medium text-foreground">
              {isEn ? service.name : service.arabicName}
            </h3>
            <div className="text-sm text-foreground/80 dark:text-accent/80">
              <span className="font-medium text-foreground dark:text-white">
                {isEn ? 'Goal: ' : 'الهدف: '}
              </span>
              <span>{formData.goal || formData.customGoalText}</span>
            </div>
            {formData.customGoalText && formData.goal && (
              <p className="text-sm italic bg-foreground/40 dark:bg-background p-2 rounded-lg text-foreground/75 dark:text-accent/80 mt-1">
                “{formData.customGoalText}”
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onGoToStep(1)}
            className="p-1.5 rounded-lg text-foreground/60 dark:text-accent/90/60 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Edit Subject' : 'تعديل المادة'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Schedule & Timezone */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'Scheduled Date & Time' : 'الموعد والتوقيت'}</span>
            </div>
            <div className="text-base font-display font-medium text-foreground flex flex-wrap items-center gap-2">
              <span>{formData.date}</span>
              <span>•</span>
              <span className="text-primary font-semibold">{formData.timeSlot?.timeDisplay}</span>
            </div>
            <div className="text-sm text-foreground/80 dark:text-accent/90 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" />
                {tzName}
              </span>
              <span>•</span>
              <span>
                {isEn ? `Duration: ${formData.duration} Minutes` : `المدة: ${formData.duration} دقيقة`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onGoToStep(scheduleStep)}
            className="p-1.5 rounded-lg text-foreground/60 dark:text-accent/90/60 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Edit Schedule' : 'تعديل الموعد'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Learner Details & Communication */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-border">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              <User className="w-3.5 h-3.5 text-accent" />
              <span>{isEn ? 'Student & Contact' : 'بيانات الطالب والتواصل'}</span>
            </div>

            <div className="text-sm font-medium text-foreground">
              {isChild ? (
                <span>
                  {formData.childName}{' '}
                  <span className="text-sm text-foreground/60 dark:text-accent/90/60">
                    ({isEn ? `Child, Age ${formData.childAge}` : `طفل، العمر ${formData.childAge}`} • Parent: {formData.parentName})
                  </span>
                </span>
              ) : (
                <span>
                  {formData.studentName}{' '}
                  <span className="text-sm text-foreground/60 dark:text-accent/90/60">
                    ({isEn ? `Adult, Age ${formData.ageGroup}` : `بالغ، الفئة ${formData.ageGroup}`})
                  </span>
                </span>
              )}
            </div>

            <div className="text-sm text-foreground/80 dark:text-accent/90 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Mail className="w-3 h-3 text-accent" />
                {isChild ? formData.parentEmail : formData.email}
              </span>
              {(isChild ? formData.parentWhatsapp : formData.whatsapp) && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-accent" />
                  {isChild ? formData.parentWhatsapp : formData.whatsapp}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => onGoToStep(3)}
            className="p-1.5 rounded-lg text-foreground/60 dark:text-accent/90/60 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer shrink-0"
            title={isEn ? 'Edit Student Details' : 'تعديل البيانات'}
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </div>

        {/* Investment / Fee Structure */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-sm font-semibold uppercase tracking-wider text-foreground/60 dark:text-accent/90/60 block">
              {isEn ? 'Session Investment' : 'رسوم الجلسة'}
            </span>
            <span className="text-sm text-foreground/60 dark:text-accent/90/60">
              {isTrial
                ? isEn ? 'Free introductory assessment session' : 'جلسة تعارف وتقييم مجانية تماماً'
                : isPackageCredit
                ? isEn ? 'Prepaid package credit • 1 credit linked' : 'رصيد باقة مدفوعة مسبقاً • تم ربط رصيد درس واحد'
                : isEn ? 'Pay per lesson / no lock-in' : 'دفع لكل درس دون التزام مقيد'}
            </span>
          </div>

          <div className="text-end">
            <span className="font-display text-2xl font-bold text-primary dark:text-primary">
              {isTrial
                ? (isEn ? 'FREE ($0.00)' : 'مجاناً ($٠.٠٠)')
                : isPackageCredit
                ? (isEn ? '$0.00 USD (Covered by Package)' : '٠.٠٠$ (مغطى بالباقة)')
                : `$${fee.toFixed(2)} USD`}
            </span>
          </div>
        </div>

        {/* Transparent Pricing Explanation for Paid Sessions */}
        {!isTrial && !isPackageCredit && (
          <div className="pt-3 border-t border-border/60">
            <div className="p-3.5 rounded-2xl glass-surface border border-secondary/40 text-xs sm:text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold text-primary">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>{isEn ? 'Transparent Rate Policy ($9 - $13/hr)' : 'شفافية تسعير الدروس الفردية (٩$ - ١٣$ / ساعة)'}</span>
              </div>
              <p className="leading-relaxed text-muted-foreground text-xs sm:text-sm">
                {isEn
                  ? 'Base lessons start from $9/hr for foundational tracks and up to $13/hr for specialized tracks (Modern Standard Arabic, English IELTS, Egyptian Dialect, and Advanced Fiqh). Rates may be adjusted by Super Admin if your specific requested curriculum requires custom specialized materials.'
                  : 'يبدأ سعر الساعة من ٩$ للمسارات الأساسية ويصل إلى ١٣$ للمسارات المتقدمة والتخصصية (كالفصحى وقواعد النحو، والإنجليزية، واللهجة المصرية، والفقه التخصصي). قد يتم ضبط السعر من الإدارة حسب المواصفات والمتطلبات الخاصة التي تطلبها.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Automated Payment Integration Notice for Paid Lessons */}
      {!isTrial && !isPackageCredit && (
        <div className="p-4 rounded-2xl glass-card border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-secondary shrink-0" />
            <span className="font-semibold text-foreground">
              {isEn ? 'Automated Checkout via PayPal Live & Stripe' : 'دفع إلكتروني آمن ومؤتمت عبر PayPal Live و Stripe'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-secondary/30 text-accent">
              Cards • Apple Pay • PayPal
            </span>
          </div>
        </div>
      )}

      {/* Cancellation / Rescheduling Policy Notice (Master Spec Section 21) */}
      <div className="p-4 rounded-2xl glass-card border border-teal-500/30 bg-teal-500/5 flex items-start gap-3 text-sm text-foreground">
        <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-foreground block mb-0.5 font-bold">
            {isEn ? 'Cancellation & Rescheduling Policy' : 'سياسة الإلغاء وتغيير الموعد'}
          </strong>
          <span className="text-muted-foreground text-xs sm:text-sm">
            {isEn
              ? 'You can easily reschedule or cancel anytime up to 3 hours before your lesson. For requests within the 3-hour window, please contact Mahmoud directly on WhatsApp.'
              : 'يمكنك تعديل الموعد أو الإلغاء بكل سهولة حتى ٣ ساعات قبل بدء الدرس. في حال رغبتك بالتعديل خلال الساعات الثلاث السابقة للدرس، يُرجى مراسلة محمود مباشرة على واتساب.'}
          </span>
        </div>
      </div>

      {/* Pending Booking Reservation Banner */}
      {pendingBookingReference && (
        <div className="p-4 rounded-2xl glass-card border border-amber-500/40 bg-amber-500/10 flex items-start gap-3 text-sm text-foreground">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="text-foreground block mb-0.5 font-bold">
              {isEn ? `Reservation Created: ${pendingBookingReference}` : `تم تسجيل حجزك مبدئياً: ${pendingBookingReference}`}
            </strong>
            <span className="text-muted-foreground text-xs sm:text-sm">
              {isEn
                ? 'Your selected time is on hold. Please complete payment to confirm your booking and receive classroom access.'
                : 'تم حجز موعدك مؤقتاً. يرجى إتمام عملية الدفع لتأكيد الموعد واستلام رابط الفصل الدراسي عبر زووم.'}
            </span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Schedule' : 'الرجوع للموعد'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={pendingBookingReference && onOpenCheckout ? onOpenCheckout : onSubmit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl btn-primary-material text-white text-sm sm:text-base font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>{isEn ? 'Securing Your Booking...' : 'جارٍ حجز موعدك...'}</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4" />
              <span>
                {isTrial
                  ? isEn ? 'Confirm Free Trial' : 'تأكيد حجز الجلسة المجانية'
                  : isPackageCredit
                  ? isEn ? 'Confirm with Package Credit' : 'تأكيد الحجز برصيد الباقة'
                  : pendingBookingReference
                  ? isEn ? `Proceed to Payment ($${fee.toFixed(2)})` : `المتابعة إلى الدفع والتأكيد (${fee.toFixed(2)}$)`
                  : isEn ? `Confirm & Pay ($${fee.toFixed(2)})` : `تأكيد وحجز الدرس (${fee.toFixed(2)}$)`}
              </span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
};
