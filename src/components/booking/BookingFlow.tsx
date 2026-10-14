import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import {
  BookingFormData,
  BookingConfirmationData,
  BookingMode,
  Language,
  LearnerAudience,
  ProficiencyLevel,
  PackageEntitlementEntry,
  PackageCatalogEntry
} from '../../booking/types';
import { BOOKING_SERVICES, calculateLessonFee } from '../../booking/mockData';
import { bookingService } from '../../booking/bookingService';
import { validateStep } from '../../booking/validation';
import { BookingHeader } from './BookingHeader';
import { StepServiceSelect } from './StepServiceSelect';
import { StepGoalSelect } from './StepGoalSelect';
import { StepStudentDetails } from './StepStudentDetails';
import { StepLessonType } from './StepLessonType';
import { StepPackageQuantity } from './StepPackageQuantity';
import { StepDateTime } from './StepDateTime';
import { StepReviewSummary } from './StepReviewSummary';
import { BookingConfirmation } from './BookingConfirmation';
import { ManageBookingModal } from './ManageBookingModal';
import { MultiLessonPlan, SelectedLesson } from './MultiLessonPlan';
import { PaymentInstructionsCard } from './PaymentInstructionsCard';
import { InstantCheckoutModal } from '../payment/InstantCheckoutModal';
import { getFreshAccessToken } from '../../lib/auth';

interface BookingFlowProps {
  initialServiceId?: string;
  initialMode?: BookingMode;
  initialData?: Partial<BookingFormData>;
  initialStep?: number;
  trialDisabled?: boolean;
  trialDisabledReason?: string;
  cardClassName?: string;
  doneLabel?: string;
  onDone?: () => void;
  lang: Language;
  onClose?: () => void;
  isModalView?: boolean;
  linkedChildren?: any[];
  isAuthenticatedStudent?: boolean;
  bookingPreference?: 'self' | 'child';
  canBookForChild?: boolean;
  studentName?: string;
  studentEmail?: string;
  teacherId?: string;
  activeEntitlements?: PackageEntitlementEntry[];
  catalog?: PackageCatalogEntry[];
  accessToken?: string;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({
  initialServiceId,
  initialMode = 'trial',
  initialData,
  initialStep = 1,
  trialDisabled = false,
  trialDisabledReason,
  cardClassName,
  doneLabel,
  onDone,
  lang,
  onClose,
  isModalView = false,
  linkedChildren = [],
  isAuthenticatedStudent = false,
  bookingPreference = 'self',
  canBookForChild = false,
  studentName,
  studentEmail,
  teacherId,
  activeEntitlements = [],
  catalog = [],
  accessToken
}) => {
  const isEn = lang === 'en';
  const isAr = lang === 'ar';

  const [step, setStep] = useState<number>(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const isCancelled = params.get('payment_cancelled');
      const saved = sessionStorage.getItem('watazawwado_pending_booking_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (isCancelled && parsed?.step) {
          return parsed.step;
        }
        if (parsed?.pendingBooking && parsed?.step) {
          return parsed.step;
        }
      }
    } catch {}
    return initialStep && initialStep >= 1 && initialStep <= 7 ? initialStep : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  // Packages are bought on the packages page now (RULES.md §4), so the flow books one lesson at a time.
  const [lessonCount, setLessonCount] = useState<number>(1);
  const [selectedLessons, setSelectedLessons] = useState<SelectedLesson[]>(() => {
    try {
      const saved = sessionStorage.getItem('watazawwado_pending_booking_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed?.selectedLessons)) return parsed.selectedLessons;
      }
    } catch {}
    return [];
  });
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);
  const [manageRefCode, setManageRefCode] = useState<string>('');
  const [multiConfirming, setMultiConfirming] = useState(false);
  const [multiPlanCreated, setMultiPlanCreated] = useState(false);
  const [multiPlanData, setMultiPlanData] = useState<any>(null);
  const [pendingBooking, setPendingBooking] = useState<BookingConfirmationData | null>(() => {
    try {
      const saved = sessionStorage.getItem('watazawwado_pending_booking_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.pendingBooking) return parsed.pendingBooking;
      }
    } catch {}
    return null;
  });
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [payLaterEligible, setPayLaterEligible] = useState(false);
  const [payLaterBusy, setPayLaterBusy] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);

  // Progressive Form State
  const [formData, setFormData] = useState<BookingFormData>(() => {
    try {
      const saved = sessionStorage.getItem('watazawwado_pending_booking_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.formData && typeof parsed.formData === 'object') {
          return {
            ...parsed.formData,
            ...(studentEmail && !parsed.formData.email ? { email: studentEmail } : {}),
            ...(studentName && !parsed.formData.studentName ? { studentName } : {})
          };
        }
      }
    } catch {}

    let userTz = 'America/New_York';
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) userTz = detected;
    } catch {
      // Fallback
    }

    const effectiveMode = (trialDisabled && initialMode === 'trial') ? 'regular' : (initialMode || 'trial');

    const isChildAuthorized = Boolean(isAuthenticatedStudent && canBookForChild && linkedChildren && linkedChildren.length > 0);
    const preferChild = Boolean(isChildAuthorized && (bookingPreference === 'child' || initialData?.audience === 'child'));
    const singleChild = isChildAuthorized && linkedChildren && linkedChildren.length === 1 ? linkedChildren[0] : null;

    const resolvedAudience: LearnerAudience = preferChild
      ? 'child'
      : (initialData?.audience || (isAuthenticatedStudent ? 'adult' : 'adult'));

    let resolvedStudentId = initialData?.studentId;
    let resolvedChildName = initialData?.childName || '';
    let resolvedChildLevel: ProficiencyLevel = initialData?.childLevel || 'beginner';

    if (resolvedAudience === 'child') {
      if (singleChild) {
        resolvedStudentId = resolvedStudentId || singleChild.id;
        resolvedChildName = resolvedChildName || singleChild.name || '';
        resolvedChildLevel = (singleChild.current_level || singleChild.currentLevel || resolvedChildLevel) as ProficiencyLevel;
      } else if (isChildAuthorized && linkedChildren && linkedChildren.length > 1 && !resolvedStudentId) {
        resolvedStudentId = '';
        resolvedChildName = '';
      }
    }

    return {
      mode: effectiveMode,
      serviceId: initialServiceId || initialData?.serviceId || 'quran-reading',
      goal: initialData?.goal || '',
      customGoalText: initialData?.customGoalText || '',
      audience: resolvedAudience,
      studentName: initialData?.studentName || studentName || '',
      email: initialData?.email || studentEmail || '',
      whatsapp: initialData?.whatsapp || '',
      ageGroup: initialData?.ageGroup || '18-29',
      currentLevel: initialData?.currentLevel || 'beginner',
      notes: initialData?.notes || '',
      childName: resolvedChildName,
      childAge: initialData?.childAge || '8-11',
      parentName: initialData?.parentName || (resolvedAudience === 'child' ? (studentName || '') : ''),
      parentEmail: initialData?.parentEmail || (resolvedAudience === 'child' ? (studentEmail || '') : ''),
      parentWhatsapp: initialData?.parentWhatsapp || '',
      childLevel: resolvedChildLevel,
      parentNotes: initialData?.parentNotes || '',
      duration: effectiveMode === 'trial' ? 30 : (initialData?.duration || 45),
      date: initialData?.date || '',
      timeSlot: initialData?.timeSlot || null,
      timezone: initialData?.timezone || userTz,
      studentId: resolvedStudentId,
      teacherId: initialData?.teacherId || teacherId,
      selectedPackageId: initialData?.selectedPackageId,
      packageEntitlementId: initialData?.packageEntitlementId
    };
  });

  // Determines whether this is a 7-step regular package flow or 6-step trial/credit flow
  const isMultiStepFlow = formData.mode === 'regular' && !formData.packageEntitlementId;
  const totalSteps = isMultiStepFlow ? 7 : 6;

  // Persist draft to sessionStorage whenever user makes changes or holds a pending booking
  useEffect(() => {
    try {
      if (step > 1 || pendingBooking) {
        sessionStorage.setItem(
          'watazawwado_pending_booking_state',
          JSON.stringify({
            formData,
            step,
            pendingBooking,
            lessonCount,
            selectedLessons
          })
        );
      }
    } catch {}
  }, [formData, step, pendingBooking, lessonCount, selectedLessons]);

  // Handle returning from Stripe Checkout (session_id + gateway=stripe in URL).
  // Guarded so the verify call runs once per return, even when formData changes or StrictMode re-runs effects.
  const stripeReturnHandledRef = useRef(false);
  useEffect(() => {
    if (stripeReturnHandledRef.current) return;
    const params = new URLSearchParams(window.location.search);
    const sessionId = params.get('session_id');
    const gateway = params.get('gateway');
    const targetId = params.get('target_id') || params.get('booking_reference');
    const paymentCancelled = params.get('payment_cancelled');

    if (paymentCancelled) {
      setValidationError(
        isAr
          ? 'تم إلغاء عملية الدفع، وبيانات حجزك محفوظة بالكامل. يمكنك استكمال الدفع الآن لتأكيد الموعد.'
          : 'Payment was cancelled. Your booking details are preserved. You can resume payment to confirm your booking.'
      );
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('payment_cancelled');
      window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
      setStep(isMultiStepFlow ? 7 : 6);
      return;
    }

    if (sessionId && gateway === 'stripe') {
      stripeReturnHandledRef.current = true;
      setIsVerifyingPayment(true);
      setValidationError(null);

      fetch('/api/payments/stripe/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId })
      })
        .then(res => res.json())
        .then(async (data) => {
          if (data.success && data.status === 'confirmed') {
            const refCode = data.referenceCode || targetId;
            let confirmedRecord: any = null;
            if (refCode) {
              try {
                confirmedRecord = await bookingService.lookupBooking(refCode, pendingBooking?.managementToken);
              } catch {}
            }

            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete('session_id');
            cleanUrl.searchParams.delete('gateway');
            cleanUrl.searchParams.delete('payment_status');
            cleanUrl.searchParams.delete('target_id');
            cleanUrl.searchParams.delete('target_type');
            cleanUrl.searchParams.delete('booking_reference');
            window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));

            try {
              sessionStorage.removeItem('watazawwado_pending_booking_state');
            } catch {}

            if (confirmedRecord) {
              setConfirmation({
                bookingReference: confirmedRecord.reference,
                managementToken: confirmedRecord.managementToken || pendingBooking?.managementToken,
                createdAt: new Date().toISOString(),
                mode: confirmedRecord.mode,
                serviceName: confirmedRecord.serviceName,
                learnerName: confirmedRecord.learnerName,
                parentName: confirmedRecord.parentName,
                contactEmail: confirmedRecord.email || '',
                contactWhatsapp: confirmedRecord.whatsapp || '',
                date: (confirmedRecord.scheduledIsoDatetime || '').split('T')[0] || formData.date,
                timeDisplay: confirmedRecord.cairoTimeDisplay || '',
                timezone: confirmedRecord.timezone || 'UTC',
                durationMinutes: confirmedRecord.durationMinutes || formData.duration,
                cairoTimeDisplay: confirmedRecord.cairoTimeDisplay || '',
                feeAmountUsd: confirmedRecord.feeAmountUsd || 0,
                isFreeTrial: false,
                integrationStatus: confirmedRecord.integrationStatus || 'synced',
                zoomDetails: {
                  platform: 'Zoom',
                  meetingLinkPlaceholder: confirmedRecord.zoomMeetingLink || '',
                  instructions: [
                    'Please ensure your microphone and camera are working before joining.',
                    'Try to join a few minutes early to settle in.',
                    'Find a quiet, well-lit place if possible.'
                  ]
                }
              });
            } else {
              setConfirmation({
                bookingReference: refCode || 'CONFIRMED',
                managementToken: pendingBooking?.managementToken,
                createdAt: new Date().toISOString(),
                mode: 'regular',
                serviceName: data.serviceName || '1-on-1 Lesson',
                learnerName: formData.studentName || 'Learner',
                contactEmail: formData.email,
                contactWhatsapp: formData.whatsapp,
                date: formData.date,
                timeDisplay: formData.timeSlot?.timeDisplay || '',
                timezone: formData.timezone,
                durationMinutes: formData.duration,
                cairoTimeDisplay: '',
                feeAmountUsd: calculateLessonFee(formData.serviceId, formData.duration, false),
                isFreeTrial: false,
                integrationStatus: 'synced',
                zoomDetails: {
                  platform: 'Zoom',
                  meetingLinkPlaceholder: '',
                  instructions: [
                    'Please ensure your microphone and camera are working before joining.',
                    'Try to join a few minutes early to settle in.'
                  ]
                }
              });
            }
          } else {
            setValidationError(data.error || (isAr ? 'تعذر التحقق من نجاح الدفع عبر Stripe.' : 'Failed to verify Stripe payment.'));
          }
        })
        .catch(err => {
          console.error('[Stripe verify client error]', err);
          setValidationError(isAr ? 'حدث خطأ أثناء تأكيد الدفع عبر Stripe.' : 'Error verifying Stripe payment.');
        })
        .finally(() => {
          setIsVerifyingPayment(false);
        });
    }
  }, [isAr, formData]);

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 7) {
      setStep(initialStep);
    }
  }, [initialStep]);

  useEffect(() => {
    if (initialServiceId) {
      setFormData((prev) => ({ ...prev, serviceId: initialServiceId }));
    }
  }, [initialServiceId]);

  useEffect(() => {
    if (initialMode) {
      setFormData((prev) => ({
        ...prev,
        mode: initialMode,
        duration: initialMode === 'trial' ? 30 : (prev.duration || 45)
      }));
    }
  }, [initialMode]);

  const updateFormData = (fields: Partial<BookingFormData>) => {
    if ('duration' in fields || 'serviceId' in fields || 'mode' in fields || 'timezone' in fields || 'teacherId' in fields) {
      setLessonCount(1);
      setSelectedLessons([]);
    }
    setFormData((prev) => ({ ...prev, ...fields }));
    setValidationError(null);
  };

  const currentService = BOOKING_SERVICES.find((s) => s.id === formData.serviceId);

  const handleNext = () => {
    setValidationError(null);

    // Validate standard step 1 to 4 fields
    if (step === 1 || step === 2 || step === 3 || step === 4) {
      const check = validateStep(step, formData, lang === 'ar');
      if (!check.isValid) {
        const firstError = Object.values(check.errors)[0];
        setValidationError(firstError);
        return;
      }
    } else if (isMultiStepFlow) {
      if (step === 5) {
        // Step 5: PackageQuantity — lessonCount is always valid (>= 1).
      } else if (step === 6) {
        if (lessonCount === 1) {
          const check = validateStep(5, formData, lang === 'ar');
          if (!check.isValid) {
            const firstError = Object.values(check.errors)[0];
            setValidationError(firstError);
            return;
          }
        } else {
          // multi-lesson schedule Next is handled inside MultiLessonPlan
          setStep(7);
          return;
        }
      }
    } else {
      // 6-step flow (Trial or Credit redemption)
      if (step === 5) {
        const check = validateStep(5, formData, lang === 'ar');
        if (!check.isValid) {
          const firstError = Object.values(check.errors)[0];
          setValidationError(firstError);
          return;
        }
      }
    }

    if (step < totalSteps) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setValidationError(null);
    if (step > 1) {
      setStep((prev) => prev - 1);
    }
  };

  const handleGoToStep = (targetStep: number) => {
    setValidationError(null);
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
    }
  };

  const handleConfirmMultiLesson = async () => {
    if (multiPlanCreated || formData.mode !== 'regular') return;
    let freshToken = accessToken;
    try {
      freshToken = (await getFreshAccessToken()) || accessToken;
    } catch {}

    if (!isAuthenticatedStudent || !freshToken) {
      setValidationError(isEn
        ? 'Your session has expired. Please sign in again to create this lesson plan.'
        : 'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى لإنشاء خطة الدروس.');
      return;
    }

    if (
      lessonCount <= 1 ||
      selectedLessons.length !== lessonCount ||
      new Set(selectedLessons.map(lesson => lesson.date)).size !== lessonCount ||
      selectedLessons.some(({ slot }) => !slot.utcStartIso || !slot.utcEndIso)
    ) return;

    const selectedCatalog = catalog.find(c => c.package_type === 'weekly' && c.lesson_count === lessonCount && c.is_active);
    if (!selectedCatalog) {
      setValidationError('This lesson plan is temporarily unavailable.');
      return;
    }

    setMultiConfirming(true);
    setValidationError(null);
    try {
      const result = await fetch('/api/student/multi-lesson-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${freshToken}` },
        body: JSON.stringify({
          serviceId: formData.serviceId,
          durationMinutes: formData.duration,
          studentTimezone: formData.timezone,
          catalogId: selectedCatalog.id,
          lessonCount,
          expectedTotalUsd: selectedCatalog.price_amount,
          currency: selectedCatalog.currency,
          lessons: selectedLessons.map(({ slot }) => ({
            scheduledStart: slot.utcStartIso,
            scheduledEnd: slot.utcEndIso
          })),
          contactName: studentName || formData.studentName || formData.childName || '',
          contactEmail: studentEmail || '',
          contactWhatsapp: formData.whatsapp || '',
          notes: formData.notes || ''
        })
      });
      const data = await result.json().catch(() => ({}));
      if (!result.ok || !data.success) {
        throw new Error(data.error || 'The selected times could not be secured. Please choose again.');
      }
      setMultiPlanData(data);
      setMultiPlanCreated(true);
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err?.message || (isAr ? 'تعذر تأكيد مواعيد الدروس في الوقت الحالي.' : 'The selected lesson times could not be secured.'));
    } finally {
      setMultiConfirming(false);
    }
  };

  const handleSubmitBooking = async () => {
    if (lessonCount !== 1) return; // single-lesson persistence contract only
    setIsSubmitting(true);
    setValidationError(null);
    try {
      const result = await bookingService.submitBooking(formData);
      const isFree = formData.mode === 'trial' || Boolean(formData.packageEntitlementId);
      if (isFree) {
        // Free trial or package entitlement -> directly confirmed
        setConfirmation(result);
      } else {
        // Regular paid lesson -> hold as pending, gate with instant checkout!
        setPendingBooking(result);
        setIsCheckoutModalOpen(true);
      }
    } catch (err: any) {
      setValidationError(
        err?.message ||
        (isEn
          ? 'Unable to finalize your booking right now. Please try again or contact Mahmoud on WhatsApp.'
          : 'تعذر استكمال الحجز في الوقت الحالي، يرجى إعادة المحاولة أو مراسلة محمود مباشرة.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      sessionStorage.removeItem('watazawwado_pending_booking_state');
    } catch {}
    setIsCheckoutModalOpen(false);
    if (pendingBooking) {
      try {
        await fetch('/api/integrations/sync-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking: {
              referenceCode: pendingBooking.bookingReference,
              managementToken: pendingBooking.managementToken
            }
          })
        });
      } catch {}

      setConfirmation(pendingBooking);
      setPendingBooking(null);
    }
  };

  // Must match PAYMENT_HOLD_MINUTES on the server (api/index.ts).
  const holdExpiresAt = pendingBooking?.createdAt
    ? new Date(new Date(pendingBooking.createdAt).getTime() + 35 * 60 * 1000).toISOString()
    : undefined;

  // Pay later is only offered to students with 12+ paid lessons (RULES.md §5); the server re-checks.
  useEffect(() => {
    if (!pendingBooking || !accessToken) {
      setPayLaterEligible(false);
      return;
    }
    let active = true;
    fetch('/api/student/pay-later', { headers: { Authorization: `Bearer ${accessToken}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (active) setPayLaterEligible(Boolean(data?.eligible)); })
      .catch(() => {});
    return () => { active = false; };
  }, [pendingBooking?.bookingReference, accessToken]);

  const handlePayLater = async () => {
    if (!pendingBooking) return;
    setPayLaterBusy(true);
    setValidationError(null);
    try {
      const token = (await getFreshAccessToken()) || accessToken;
      const res = await fetch(`/api/bookings/${encodeURIComponent(pendingBooking.bookingReference)}/pay-later`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.whatsappUrl) throw new Error(data.error);
      try { sessionStorage.removeItem('watazawwado_pending_booking_state'); } catch {}
      setPendingBooking(null);
      // RULES.md §5: the student must message the admin on WhatsApp to get the booking approved.
      window.location.href = data.whatsappUrl;
    } catch (err: any) {
      setValidationError(err?.message || (isEn ? 'Pay later is not available right now.' : 'الدفع لاحقاً غير متاح الآن.'));
    } finally {
      setPayLaterBusy(false);
    }
  };

  const handleChooseAnotherTime = () => {
    setPendingBooking(null);
    setIsCheckoutModalOpen(false);
    setStep(isMultiStepFlow ? 6 : 5);
  };

  const handleOpenManageModal = (refCode: string) => {
    setManageRefCode(refCode);
    setManageModalOpen(true);
  };

  const handleResetForNewBooking = () => {
    try {
      sessionStorage.removeItem('watazawwado_pending_booking_state');
    } catch {}
    setConfirmation(null);
    setPendingBooking(null);
    setIsCheckoutModalOpen(false);
    setMultiPlanCreated(false);
    setMultiPlanData(null);
    setStep(1);
    if (onDone) {
      onDone();
    } else if (onClose) {
      onClose();
    }
  };

  return (
    <div
      className={`w-full ${
        cardClassName || (isModalView
          ? 'glass-dialog text-foreground p-5 sm:p-8 rounded-3xl max-w-3xl mx-auto shadow-2xl border border-border/70 max-h-[92vh] overflow-y-auto'
          : 'glass-card text-foreground py-8 sm:py-12 px-4 sm:px-6 rounded-3xl max-w-3xl mx-auto shadow-xl border border-border/70')
      }`}
    >
      {/* 0. Payment Verification In Progress (Stripe Return) */}
      {isVerifyingPayment ? (
        <div className="py-16 text-center space-y-4">
          <div className="w-12 h-12 border-3 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
          <h3 className="font-display text-xl font-bold text-foreground">
            {isAr ? 'جارٍ التحقق من نجاح الدفع وتأكيد الحجز...' : 'Verifying your payment and securing booking...'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? 'لحظات ونقوم بتجهيز تفاصيل الحجز وتفعيل رابط الفصل الدراسي.' : 'Please wait while we finalize your lesson details and classroom link.'}
          </p>
        </div>
      ) : multiPlanCreated && multiPlanData ? (
        <div className="space-y-6 max-w-2xl mx-auto py-2 text-foreground">
          <div className="text-center space-y-3 pb-2">
            <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              {isAr ? 'تم تجهيز باقة دروسك بنجاح' : 'Lesson plan request created'}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              {isAr
                ? `تم حجز مواعيد الـ ${multiPlanData.lessonCount || lessonCount} حصص بنجاح. أتمم الدفع الفوري لتأكيد الجلسات وتفعيل روابط الفصول.`
                : `Your selected times were submitted. Payment is not confirmed by this screen; complete instant payment below to activate your package and classroom links.`}
            </p>
          </div>

          <PaymentInstructionsCard
            bookingReference={multiPlanData.entitlementId}
            targetType="package"
            serviceName={`${isAr ? currentService?.arabicName : currentService?.name} (${multiPlanData.lessonCount || lessonCount} ${isAr ? 'حصص' : 'lessons'})`}
            amount={multiPlanData.totalAmount || (lessonCount === 4 ? 34 : lessonCount === 8 ? 64 : 92)}
            currency={multiPlanData.currency || 'USD'}
            learnerName={studentName || formData.studentName}
            lang={lang}
          />

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleResetForNewBooking}
              className="px-6 py-2.5 rounded-xl border border-border text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle transition-all cursor-pointer"
            >
              {isAr ? 'العودة إلى لوحة تحكم الطالب' : 'Return to Student Dashboard'}
            </button>
          </div>
        </div>
      ) : confirmation ? (
        /* 2. Single Booking Confirmation State */
        <BookingConfirmation
          confirmation={confirmation}
          onOpenManageModal={handleOpenManageModal}
          onDone={handleResetForNewBooking}
          lang={lang}
          doneLabel={doneLabel}
        />
      ) : (
        /* 3. Progressive Multi-Step Booking Flow */
        <div>
          <BookingHeader
            step={step}
            totalSteps={totalSteps}
            mode={formData.mode}
            lang={lang}
            onBack={step > 1 ? handleBack : undefined}
            onClose={onClose}
            serviceName={isEn ? currentService?.name : currentService?.arabicName}
          />

          {/* Validation Notice if any */}
          {validationError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-800 dark:text-amber-300 flex items-center justify-between"
            >
              <span>{validationError}</span>
              <button
                type="button"
                onClick={() => setValidationError(null)}
                className="text-amber-700 dark:text-amber-400 font-bold ml-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Steps Presentation */}
          <AnimatePresence mode="wait" initial={false}>
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepServiceSelect
                  selectedServiceId={formData.serviceId}
                  onSelectService={(serviceId) => updateFormData({ serviceId })}
                  onNext={handleNext}
                  lang={lang}
                />
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepGoalSelect
                  serviceId={formData.serviceId}
                  selectedGoal={formData.goal}
                  customGoalText={formData.customGoalText}
                  onSelectGoal={(goal) => updateFormData({ goal })}
                  onChangeCustomGoal={(customGoalText) => updateFormData({ customGoalText })}
                  onNext={handleNext}
                  onBack={handleBack}
                  lang={lang}
                />
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepStudentDetails
                  formData={formData}
                  updateForm={updateFormData}
                  onNext={handleNext}
                  onBack={handleBack}
                  lang={lang}
                  linkedChildren={linkedChildren}
                  isAuthenticatedStudent={isAuthenticatedStudent}
                  bookingPreference={bookingPreference}
                  canBookForChild={canBookForChild}
                  studentName={studentName || formData.studentName}
                  studentEmail={studentEmail || formData.email}
                />
              </motion.div>
            )}

            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepLessonType
                  mode={formData.mode}
                  duration={formData.duration}
                  serviceId={formData.serviceId}
                  onChangeMode={(mode) => updateFormData({ mode })}
                  onChangeDuration={(duration) => updateFormData({ duration })}
                  selectedPackageId={formData.selectedPackageId}
                  hidePackagePurchase={isAuthenticatedStudent}
                  onSelectPackage={(selectedPackageId) => updateFormData({ selectedPackageId })}
                  activeEntitlements={activeEntitlements}
                  packageEntitlementId={formData.packageEntitlementId}
                  onSelectPackageEntitlement={(packageEntitlementId) => updateFormData({ packageEntitlementId })}
                  onNext={handleNext}
                  onBack={handleBack}
                  lang={lang}
                  trialDisabled={trialDisabled}
                  trialDisabledReason={trialDisabledReason}
                />
              </motion.div>
            )}

            {/* FLOW A: Dedicated Step 5 for Regular Packages / Lesson Quantity */}
            {isMultiStepFlow && step === 5 && (
              <motion.div
                key="step5-packages"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepPackageQuantity
                  serviceId={formData.serviceId}
                  duration={formData.duration}
                  lessonCount={lessonCount}
                  onChangeCount={(count) => {
                    setLessonCount(count);
                    setSelectedLessons([]);
                    if (count > 1) {
                      updateFormData({ packageEntitlementId: undefined, selectedPackageId: undefined });
                    }
                  }}
                  catalog={catalog}
                  lang={lang}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {/* FLOW A: Step 6 Date & Time / Multi-Lesson Schedule */}
            {isMultiStepFlow && step === 6 && (
              <motion.div
                key="step6-schedule"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {lessonCount > 1 ? (
                  <MultiLessonPlan
                    catalog={catalog}
                    serviceId={formData.serviceId}
                    duration={formData.duration}
                    timezone={formData.timezone}
                    teacherId={formData.teacherId}
                    count={lessonCount}
                    onCount={setLessonCount}
                    selected={selectedLessons}
                    onSelected={setSelectedLessons}
                    phase="schedule"
                    lang={lang}
                    onNext={() => setStep(7)}
                    onBack={handleBack}
                  />
                ) : (
                  <StepDateTime
                    mode={formData.mode}
                    duration={formData.duration}
                    teacherId={formData.teacherId}
                    selectedDate={formData.date}
                    selectedSlot={formData.timeSlot}
                    timezone={formData.timezone}
                    onSelectDate={(date) => updateFormData({ date })}
                    onSelectSlot={(timeSlot) => updateFormData({ timeSlot })}
                    onSelectTimezone={(timezone) => updateFormData({ timezone })}
                    onNext={handleNext}
                    onBack={handleBack}
                    lang={lang}
                  />
                )}
              </motion.div>
            )}

            {/* FLOW A: Step 7 Review & Confirmation */}
            {isMultiStepFlow && step === 7 && (
              <motion.div
                key="step7-review"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {lessonCount > 1 ? (
                  <MultiLessonPlan
                    catalog={catalog}
                    serviceId={formData.serviceId}
                    duration={formData.duration}
                    timezone={formData.timezone}
                    teacherId={formData.teacherId}
                    count={lessonCount}
                    onCount={setLessonCount}
                    selected={selectedLessons}
                    onSelected={setSelectedLessons}
                    phase="review"
                    lang={lang}
                    onBack={handleBack}
                    onConfirm={handleConfirmMultiLesson}
                    confirming={multiConfirming}
                  />
                ) : (
                  <StepReviewSummary
                    formData={formData}
                    onGoToStep={handleGoToStep}
                    onSubmit={handleSubmitBooking}
                    onAcceptTerms={(acceptedTerms) => updateFormData({ acceptedTerms })}
                    onBack={handleBack}
                    isSubmitting={isSubmitting}
                    lang={lang}
                    scheduleStep={6}
                    pendingBookingReference={pendingBooking?.bookingReference}
                    onOpenCheckout={() => setIsCheckoutModalOpen(true)}
                    holdExpiresAt={holdExpiresAt}
                    onChooseAnotherTime={handleChooseAnotherTime}
                    onPayLater={payLaterEligible ? handlePayLater : undefined}
                    payLaterBusy={payLaterBusy}
                  />
                )}
              </motion.div>
            )}

            {/* FLOW B: 6-step flow (Trial or Package Credit Redemption) */}
            {!isMultiStepFlow && step === 5 && (
              <motion.div
                key="step5-datetime-single"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepDateTime
                  mode={formData.mode}
                  duration={formData.duration}
                  teacherId={formData.teacherId}
                  selectedDate={formData.date}
                  selectedSlot={formData.timeSlot}
                  timezone={formData.timezone}
                  onSelectDate={(date) => updateFormData({ date })}
                  onSelectSlot={(timeSlot) => updateFormData({ timeSlot })}
                  onSelectTimezone={(timezone) => updateFormData({ timezone })}
                  onNext={handleNext}
                  onBack={handleBack}
                  lang={lang}
                />
              </motion.div>
            )}

            {!isMultiStepFlow && step === 6 && (
              <motion.div
                key="step6-review-single"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepReviewSummary
                  formData={formData}
                  onGoToStep={handleGoToStep}
                  onSubmit={handleSubmitBooking}
                  onAcceptTerms={(acceptedTerms) => updateFormData({ acceptedTerms })}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                  lang={lang}
                  scheduleStep={5}
                  pendingBookingReference={pendingBooking?.bookingReference}
                  onOpenCheckout={() => setIsCheckoutModalOpen(true)}
                  holdExpiresAt={holdExpiresAt}
                  onChooseAnotherTime={handleChooseAnotherTime}
                  onPayLater={payLaterEligible ? handlePayLater : undefined}
                  payLaterBusy={payLaterBusy}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Instant Checkout Modal for Pending Bookings */}
      {pendingBooking && (
        <InstantCheckoutModal
          isOpen={isCheckoutModalOpen}
          onClose={() => setIsCheckoutModalOpen(false)}
          targetType="booking"
          targetId={pendingBooking.bookingReference}
          itemTitle={pendingBooking.serviceName}
          amount={pendingBooking.feeAmountUsd}
          currency="USD"
          lang={isAr ? 'ar' : 'en'}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Cancellation / Rescheduling Policy Modal */}
      <ManageBookingModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        initialRefCode={manageRefCode}
        initialManagementToken={confirmation?.managementToken}
        lang={lang}
      />
    </div>
  );
};
