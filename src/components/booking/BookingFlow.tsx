import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingFormData, BookingConfirmationData, BookingMode, Language, LearnerAudience, ProficiencyLevel, PackageEntitlementEntry, PackageCatalogEntry } from '../../booking/types';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { bookingService } from '../../booking/bookingService';
import { validateStep } from '../../booking/validation';
import { BookingHeader } from './BookingHeader';
import { StepServiceSelect } from './StepServiceSelect';
import { StepGoalSelect } from './StepGoalSelect';
import { StepStudentDetails } from './StepStudentDetails';
import { StepLessonType } from './StepLessonType';
import { StepDateTime } from './StepDateTime';
import { StepReviewSummary } from './StepReviewSummary';
import { BookingConfirmation } from './BookingConfirmation';
import { ManageBookingModal } from './ManageBookingModal';
import { MultiLessonPlan, SelectedLesson } from './MultiLessonPlan';

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

  const [step, setStep] = useState<number>(initialStep && initialStep >= 1 && initialStep <= 6 ? initialStep : 1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [confirmation, setConfirmation] = useState<BookingConfirmationData | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [lessonCount, setLessonCount] = useState(1);
  const [selectedLessons, setSelectedLessons] = useState<SelectedLesson[]>([]);
  const [manageModalOpen, setManageModalOpen] = useState<boolean>(false);
  const [manageRefCode, setManageRefCode] = useState<string>('');
  const [multiConfirming, setMultiConfirming] = useState(false);
  const [multiPlanCreated, setMultiPlanCreated] = useState(false);

  // Progressive Form State
  const [formData, setFormData] = useState<BookingFormData>(() => {
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
        // Multiple children: explicit selection required, don't default to child 0
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

  useEffect(() => {
    if (initialStep && initialStep >= 1 && initialStep <= 6) {
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
    if (isAuthenticatedStudent && formData.mode === 'regular' && lessonCount > 1 && step === 5) {
      // Multi-lesson selection is gated inside MultiLessonPlan. Never submit these
      // slots through the single-booking RPC.
      setStep(6);
      return;
    }
    const check = validateStep(step, formData, lang === 'ar');
    if (!check.isValid) {
      const firstError = Object.values(check.errors)[0];
      setValidationError(firstError);
      return;
    }

    setValidationError(null);
    if (step < 6) {
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
    if (targetStep >= 1 && targetStep <= 6) {
      setStep(targetStep);
    }
  };

  const handleConfirmMultiLesson = async () => {
    if (multiPlanCreated || formData.mode !== 'regular') return;
    // A genuinely missing session must be clear and actionable — never a silent dead button.
    if (!isAuthenticatedStudent || !accessToken) {
      setValidationError(isEn
        ? 'Your session has expired. Please sign in again to create this lesson plan.'
        : 'انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى لإنشاء خطة الدروس.');
      return;
    }
    if (lessonCount <= 1 || selectedLessons.length !== lessonCount ||
        new Set(selectedLessons.map(lesson => lesson.date)).size !== lessonCount ||
        selectedLessons.some(({ slot }) => !slot.utcStartIso || !slot.utcEndIso)) return;
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
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
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
      setMultiPlanCreated(true);
      setValidationError(null);
    } catch (err: any) {
      setValidationError(err?.message || 'The selected lesson times could not be secured.');
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
      setConfirmation(result);
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

  const handleOpenManageModal = (refCode: string) => {
    setManageRefCode(refCode);
    setManageModalOpen(true);
  };

  const handleResetForNewBooking = () => {
    setConfirmation(null);
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
          ? 'bg-[#F5E6D3] dark:bg-[#231D28] text-[#362E3B] dark:text-[#D5D0CA] p-5 sm:p-8 rounded-3xl max-w-3xl mx-auto shadow-2xl border border-[#87A878]/30 max-h-[92vh] overflow-y-auto'
          : 'bg-[#F5E6D3] dark:bg-[#1E1923] text-[#362E3B] dark:text-[#D5D0CA] py-8 sm:py-12 px-4 sm:px-6')
      }`}
    >
      {/* Confirmation State */}
      {multiPlanCreated ? (
        <section role="status" className="space-y-4">
          <h2 className="font-serif text-xl">Lesson plan request created</h2>
          <p>Your selected times were submitted to the server. Payment is not confirmed by this screen; check your Payments and My Lessons pages for the current status.</p>
          <button type="button" onClick={handleResetForNewBooking} className="rounded-xl bg-primary p-3 text-primary-foreground">Return to student portal</button>
        </section>
      ) : confirmation ? (
        <BookingConfirmation
          confirmation={confirmation}
          onOpenManageModal={handleOpenManageModal}
          onDone={handleResetForNewBooking}
          lang={lang}
          doneLabel={doneLabel}
        />
      ) : (
        /* Multi-Step Flow */
        <div>
          <BookingHeader
            step={step}
            totalSteps={6}
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
              className="p-3.5 mb-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between"
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
          <AnimatePresence mode="wait">
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
                {isAuthenticatedStudent && formData.mode === 'regular' && (
                  <MultiLessonPlan catalog={catalog} serviceId={formData.serviceId} duration={formData.duration}
                    timezone={formData.timezone} teacherId={formData.teacherId} count={lessonCount}
                    onCount={(count) => { setLessonCount(count); setSelectedLessons([]); if (count > 1) updateFormData({ packageEntitlementId: undefined, selectedPackageId: undefined }); }}
                    selected={selectedLessons} onSelected={setSelectedLessons} phase="quantity" />
                )}
              </motion.div>
            )}

            {step === 5 && (
              <motion.div
                key="step5"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {isAuthenticatedStudent && formData.mode === 'regular' && lessonCount > 1 ? (
                  <MultiLessonPlan catalog={catalog} serviceId={formData.serviceId} duration={formData.duration}
                    timezone={formData.timezone} teacherId={formData.teacherId} count={lessonCount}
                    onCount={setLessonCount} selected={selectedLessons} onSelected={setSelectedLessons}
                    phase="schedule" onNext={handleNext} onBack={handleBack} />
                ) : <StepDateTime
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
                />}
              </motion.div>
            )}

            {step === 6 && (
              <motion.div
                key="step6"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                {isAuthenticatedStudent && formData.mode === 'regular' && lessonCount > 1 ? (
                  <MultiLessonPlan catalog={catalog} serviceId={formData.serviceId} duration={formData.duration}
                    timezone={formData.timezone} teacherId={formData.teacherId} count={lessonCount}
                    onCount={setLessonCount} selected={selectedLessons} onSelected={setSelectedLessons}
                    phase="review" onBack={handleBack} onConfirm={handleConfirmMultiLesson} confirming={multiConfirming} />
                ) : <StepReviewSummary
                  formData={formData}
                  onGoToStep={handleGoToStep}
                  onSubmit={handleSubmitBooking}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                  lang={lang}
                />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Cancellation / Rescheduling Policy Modal */}
      <ManageBookingModal
        isOpen={manageModalOpen}
        onClose={() => setManageModalOpen(false)}
        initialRefCode={manageRefCode}
        lang={lang}
      />
    </div>
  );
};
