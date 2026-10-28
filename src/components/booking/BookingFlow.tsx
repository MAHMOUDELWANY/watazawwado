import React, { useState, useEffect, useRef } from 'react';
import { bookingErrorText } from './bookingErrors';
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
import { InstantCheckoutModal } from '../payment/InstantCheckoutModal';
import { getFreshAccessToken } from '../../lib/auth';
import { authedJson } from '../../lib/authedJson';

const DRAFT_KEY = 'watazawwado_pending_booking_state';
// A draft older than this starts fresh (its time slot is likely gone anyway).
const DRAFT_MAX_AGE_MS = 3 * 60 * 60 * 1000;

/** The booking in progress, kept in this tab so leaving (terms, packages, Stripe) never loses it. */
function readBookingDraft(): { formData?: BookingFormData; step?: number; pendingBooking?: BookingConfirmationData | null; savedAt?: number } | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw);
    if (!draft || typeof draft.savedAt !== 'number' || Date.now() - draft.savedAt > DRAFT_MAX_AGE_MS) return null;
    return draft;
  } catch {
    return null;
  }
}

export function hasBookingDraft(): boolean {
  const draft = readBookingDraft();
  return Boolean(draft && ((draft.step || 0) > 1 || draft.pendingBooking));
}

export function clearBookingDraft(): void {
  try {
    sessionStorage.removeItem(DRAFT_KEY);
  } catch {}
}

/** Runs fn when value changes after mount (not on mount, so a restored draft isn't overwritten). */
function useOnPropChange<T>(value: T, fn: (value: T) => void) {
  const prev = useRef(value);
  useEffect(() => {
    if (prev.current === value) return;
    prev.current = value;
    fn(value);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
}

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
  /** Subject chosen at onboarding: step 1 asks to confirm it instead of showing every subject. */
  profileServiceId?: string;
  /** Shown under the confirmation (e.g. the placement test after a free trial). */
  renderConfirmationExtra?: (confirmation: BookingConfirmationData) => React.ReactNode;
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
  accessToken,
  profileServiceId,
  renderConfirmationExtra
}) => {
  const isEn = lang === 'en';
  const isAr = lang === 'ar';

  const [draft] = useState(readBookingDraft);
  // Coming back from the packages page with a new package: keep the draft and use the credit.
  const entitlementFromProps = initialData?.packageEntitlementId;
  const [step, setStep] = useState<number>(() => {
    if (draft?.step && draft.step >= 1 && draft.step <= 7) {
      return entitlementFromProps && !draft.pendingBooking ? Math.min(draft.step, 4) : draft.step;
    }
    return initialStep && initialStep >= 1 && initialStep <= 7 ? initialStep : 1;
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const submittingRef = useRef(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [pendingBooking, setPendingBooking] = useState<BookingConfirmationData | null>(() => draft?.pendingBooking || null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState<boolean>(false);
  const [payLaterEligible, setPayLaterEligible] = useState(false);
  const [payLaterBusy, setPayLaterBusy] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState<boolean>(false);
  const [packagePaidNote, setPackagePaidNote] = useState(false);

  // Progressive Form State
  const [formData, setFormData] = useState<BookingFormData>(() => {
    if (draft?.formData && typeof draft.formData === 'object') {
      return {
        ...draft.formData,
        ...(studentEmail && !draft.formData.email ? { email: studentEmail } : {}),
        ...(studentName && !draft.formData.studentName ? { studentName } : {}),
        ...(entitlementFromProps && !draft.pendingBooking ? { packageEntitlementId: entitlementFromProps, mode: 'regular' as BookingMode } : {})
      };
    }

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
  // Four screens over the internal steps (owner D4): what (subject, goal, learner), length & plan, time, review & pay.
  const screens: number[][] = isMultiStepFlow ? [[1, 2, 3], [4, 5], [6], [7]] : [[1, 2, 3], [4], [5], [6]];
  const totalSteps = isMultiStepFlow ? 7 : 6;

  // Persist draft to sessionStorage whenever user makes changes or holds a pending booking
  useEffect(() => {
    if (confirmation) {
      clearBookingDraft();
      return;
    }
    try {
      if (step > 1 || pendingBooking) {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ formData, step, pendingBooking, savedAt: Date.now() }));
      }
    } catch {}
  }, [formData, step, pendingBooking, confirmation]);

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
      // A package checkout returns to the plan screen; a lesson checkout to the review.
      setStep(formData.buyPackageCatalogId ? 4 : (isMultiStepFlow ? 7 : 6));
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
          if (data.success && data.status === 'confirmed' && params.get('target_type') === 'package') {
            const cleanUrl = new URL(window.location.href);
            ['session_id', 'gateway', 'payment_status', 'target_id', 'target_type'].forEach((k) => cleanUrl.searchParams.delete(k));
            window.history.replaceState({}, document.title, cleanUrl.pathname + cleanUrl.search);
            applyPaidPackage(data.targetId || targetId);
            setPackagePaidNote(true);
            return;
          }
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
                date: formData.date || (confirmedRecord.scheduledIsoDatetime || '').split('T')[0],
                timeDisplay: formData.timeSlot?.timeDisplay || '',
                timezone: formData.timezone || confirmedRecord.timezone || 'UTC',
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

  useOnPropChange(initialStep, (next) => {
    if (next && next >= 1 && next <= 7) setStep(next);
  });

  useOnPropChange(initialServiceId, (next) => {
    if (next) setFormData((prev) => ({ ...prev, serviceId: next }));
  });

  useOnPropChange(initialMode, (next) => {
    if (next) {
      setFormData((prev) => ({
        ...prev,
        mode: next,
        duration: next === 'trial' ? 30 : (prev.duration || 45)
      }));
    }
  });

  const updateFormData = (fields: Partial<BookingFormData>) => {
    setFormData((prev) => ({ ...prev, ...fields }));
    setValidationError(null);
  };

  const currentService = BOOKING_SERVICES.find((s) => s.id === formData.serviceId);

  const screenIndex = Math.max(0, screens.findIndex((g) => g.includes(step)));
  const showStep = (n: number) => screens[screenIndex].includes(n);

  const handleNext = () => {
    setValidationError(null);
    // Check every step on this screen; validateStep(5) is the date/time check in both flows.
    for (const n of screens[screenIndex]) {
      const rule = n <= 4 ? n : (isMultiStepFlow ? (n === 6 ? 5 : 0) : (n === 5 ? 5 : 0));
      if (!rule) continue;
      const check = validateStep(rule, formData, lang === 'ar');
      if (!check.isValid) {
        setValidationError(Object.values(check.errors)[0] as string);
        return;
      }
    }
    // A package chosen on this screen is bought now; its first lesson is then booked from it (owner D4).
    if (isMultiStepFlow && screens[screenIndex].includes(5) && formData.buyPackageCatalogId) {
      void startPackagePurchase();
      return;
    }
    const next = screens[screenIndex + 1];
    if (next) setStep(next[0]);
  };

  const [packageCheckout, setPackageCheckout] = useState<{ entitlementId: string; title: string; amount: number } | null>(null);
  const [buyingPackage, setBuyingPackage] = useState(false);

  const startPackagePurchase = async () => {
    if (!formData.acceptedTerms || !formData.acceptedEarlyStart) {
      setValidationError(isAr ? 'وافق على الشروط وعلى بدء الحصص الأول.' : 'Please tick both boxes under the package first.');
      return;
    }
    const pkg = catalog.find((c) => c.id === formData.buyPackageCatalogId);
    setBuyingPackage(true);
    try {
      const json = await authedJson<any>('/api/student/packages/select', {
        method: 'POST',
        body: JSON.stringify({
          packageCatalogId: formData.buyPackageCatalogId,
          acceptedTerms: true,
          acceptedEarlyStart: true,
          ...(formData.studentId ? { learnerStudentId: formData.studentId } : {})
        })
      });
      setPackageCheckout({
        entitlementId: json.entitlement?.id,
        title: pkg?.name || (isAr ? 'باقة حصص' : 'Lesson package'),
        // The server may apply the family discount, so show what it actually charges.
        amount: Number(json.entitlement?.price_paid ?? pkg?.price_amount ?? 0)
      });
    } catch (err: any) {
      setValidationError(err?.message || (isAr ? 'معرفناش نجهز الباقة، جرّب تاني.' : 'Could not start the package, please try again.'));
    } finally {
      setBuyingPackage(false);
    }
  };

  /** The package is paid: book the first lesson from it (screen 3, pick a time). */
  const applyPaidPackage = (entitlementId: string) => {
    setPackageCheckout(null);
    setFormData((prev) => ({ ...prev, packageEntitlementId: entitlementId, buyPackageCatalogId: undefined }));
    setStep(5);
  };

  const handleBack = () => {
    setValidationError(null);
    const prev = screens[screenIndex - 1];
    if (prev) setStep(prev[0]);
  };

  const handleGoToStep = (targetStep: number) => {
    setValidationError(null);
    if (targetStep >= 1 && targetStep <= totalSteps) {
      setStep(targetStep);
    }
  };

  const handleSubmitBooking = async () => {
    // Two quick taps run before React re-renders the disabled button; the ref stops the second one.
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    setValidationError(null);
    try {
      const result = await bookingService.submitBooking(formData);
      const isFree = formData.mode === 'trial' || Boolean(formData.packageEntitlementId);
      if (isFree) {
        clearBookingDraft();
        // Free trial or package entitlement -> directly confirmed
        setConfirmation(result);
      } else {
        // Regular paid lesson -> hold as pending, gate with instant checkout!
        setPendingBooking(result);
        setIsCheckoutModalOpen(true);
      }
    } catch (err: any) {
      setValidationError(bookingErrorText(err?.message, isEn));
    } finally {
      submittingRef.current = false;
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

  const handleResetForNewBooking = () => {
    try {
      sessionStorage.removeItem('watazawwado_pending_booking_state');
    } catch {}
    setConfirmation(null);
    setPendingBooking(null);
    setIsCheckoutModalOpen(false);
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
      ) : confirmation ? (
        /* 2. Single Booking Confirmation State */
        <>
          <BookingConfirmation
            confirmation={confirmation}
            onDone={handleResetForNewBooking}
            lang={lang}
            doneLabel={doneLabel}
          />
          {renderConfirmationExtra?.(confirmation)}
        </>
      ) : (
        /* 3. Progressive Multi-Step Booking Flow */
        <div>
          <BookingHeader
            step={screenIndex + 1}
            totalSteps={screens.length}
            mode={formData.mode}
            lang={lang}
            onBack={screenIndex > 0 ? handleBack : undefined}
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
                className="text-amber-700 dark:text-amber-400 font-bold ms-2 cursor-pointer"
              >
                ✕
              </button>
            </motion.div>
          )}

          {/* Steps Presentation */}
          <AnimatePresence initial={false}>
            {showStep(1) && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepServiceSelect
                  hideNav
                  suggestedServiceId={profileServiceId}
                  suggestedLevel={formData.audience === 'child' ? formData.childLevel : formData.currentLevel}
                  selectedServiceId={formData.serviceId}
                  onSelectService={(serviceId) => updateFormData({ serviceId })}
                  onNext={handleNext}
                  lang={lang}
                />
              </motion.div>
            )}

            {showStep(2) && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepGoalSelect
                  hideNav
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

            {showStep(3) && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepStudentDetails
                  hideNav
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

            {showStep(4) && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepLessonType
                  hideNav
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
            {isMultiStepFlow && showStep(5) && (
              <motion.div
                key="step5-packages"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepPackageQuantity
                  hideNav
                  serviceId={formData.serviceId}
                  duration={formData.duration}
                  catalog={catalog}
                  lang={lang}
                  selectedCatalogId={formData.buyPackageCatalogId}
                  onSelect={(buyPackageCatalogId) => updateFormData({ buyPackageCatalogId })}
                  acceptedTerms={formData.acceptedTerms}
                  acceptedEarlyStart={formData.acceptedEarlyStart}
                  onAcceptTerms={(acceptedTerms) => updateFormData({ acceptedTerms })}
                  onAcceptEarlyStart={(acceptedEarlyStart) => updateFormData({ acceptedEarlyStart })}
                  onNext={handleNext}
                  onBack={handleBack}
                />
              </motion.div>
            )}

            {/* FLOW A: Step 6 Date & Time / Multi-Lesson Schedule */}
            {isMultiStepFlow && showStep(6) && (
              <motion.div
                key="step6-schedule"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                  <StepDateTime
                  hideNav
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

            {/* FLOW A: Step 7 Review & Confirmation */}
            {isMultiStepFlow && showStep(7) && (
              <motion.div
                key="step7-review"
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
                    onAcceptEarlyStart={(acceptedEarlyStart) => updateFormData({ acceptedEarlyStart })}
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
              </motion.div>
            )}

            {packagePaidNote && !isMultiStepFlow && showStep(5) && (
              <div role="status" className="mb-4 rounded-2xl bg-secondary/10 border border-secondary/30 p-4 text-sm text-foreground" data-testid="booking-package-paid">
                {isAr ? 'تم دفع الباقة. اختار ميعاد أول حصة، ومش هتدفع حاجة تاني.' : 'Your package is paid. Pick the time of your first lesson; there is nothing more to pay.'}
              </div>
            )}

            {/* FLOW B: 6-step flow (Trial or Package Credit Redemption) */}
            {!isMultiStepFlow && showStep(5) && (
              <motion.div
                key="step5-datetime-single"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <StepDateTime
                  hideNav
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

            {!isMultiStepFlow && showStep(6) && (
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
                  onAcceptEarlyStart={(acceptedEarlyStart) => updateFormData({ acceptedEarlyStart })}
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

          {/* One Back / Continue per screen (the review screen has its own confirm and pay). */}
          {screenIndex < screens.length - 1 && (
            <div className="mt-6 pt-4 border-t border-border flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
              {screenIndex > 0 ? (
                <button type="button" onClick={handleBack} className="min-h-11 px-4 rounded-xl text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer focus-ring">
                  {isAr ? 'رجوع' : 'Back'}
                </button>
              ) : <span />}
              <button
                type="button"
                onClick={handleNext}
                disabled={buyingPackage}
                data-testid="booking-continue"
                className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-[#0A2E35] text-white text-sm font-semibold cursor-pointer focus-ring"
              >
                {isMultiStepFlow && screenIndex === 1 && formData.buyPackageCatalogId
                  ? (buyingPackage ? (isAr ? 'لحظة…' : 'One moment…') : (isAr ? 'ادفع الباقة' : 'Pay for the package'))
                  : [isAr ? 'كمّل: المدة والخطة' : 'Continue: length and plan', isAr ? 'كمّل: اختار الميعاد' : 'Continue: pick a time', isAr ? 'كمّل: راجع وادفع' : 'Continue: review and pay'][screenIndex]}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Package bought inside the flow (screen 2). */}
      {packageCheckout && (
        <InstantCheckoutModal
          isOpen
          onClose={() => setPackageCheckout(null)}
          targetType="package"
          targetId={packageCheckout.entitlementId}
          itemTitle={packageCheckout.title}
          amount={packageCheckout.amount}
          currency="USD"
          lang={isAr ? 'ar' : 'en'}
          onSuccess={() => applyPaidPackage(packageCheckout.entitlementId)}
        />
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
    </div>
  );
};
