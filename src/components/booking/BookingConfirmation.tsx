import React, { useEffect, useRef, useState } from 'react';
import { humanDate, humanTime } from '../../lib/lessonDate';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Calendar,
  Clock,
  Globe,
  Video,
  MessageCircle,
  Download,
  Share2,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  BellRing,
  CreditCard
} from 'lucide-react';
import { BookingConfirmationData, Language } from '../../booking/types';
import { buildBookingWhatsAppUrl } from '../../lib/whatsapp';
import { reminderText } from '../../lib/lessonRules';

interface BookingConfirmationProps {
  confirmation: BookingConfirmationData;
  onDone: () => void;
  lang: Language;
  doneLabel?: string;
  /** The next useful step, e.g. "Book Yusuf's free trial" when a sibling has none yet (P4-009). */
  nextAction?: { label: string; onClick: () => void };
  /** Who teaches this lesson, named in the greeting (P4-009). */
  teacherName?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  confirmation,
  onDone,
  lang,
  doneLabel,
  nextAction,
  teacherName
}) => {
  const isEn = lang === 'en';
  // Open at the top with the heading focused, not at the scroll position of the review step (P4-009).
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.scrollIntoView({ block: 'center' });
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  const [downloadedIcs, setDownloadedIcs] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(!confirmation.isFreeTrial);

  const rawZoom = confirmation.zoomDetails?.meetingLinkPlaceholder?.trim() || '';
  const isValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));
  const zoomUrl = isValidZoomUrl ? rawZoom : '';

  // Generate downloadable .ics calendar file
  const handleDownloadIcs = () => {
    try {
      const [year, month, day] = confirmation.date.split('-');
      const cleanTime = confirmation.timeDisplay.replace(/[^0-9:]/g, '');
      const [rawH, rawM] = cleanTime.split(':').map(Number);
      const isPm = confirmation.timeDisplay.toUpperCase().includes('PM');
      const hour = isPm && rawH < 12 ? rawH + 12 : (!isPm && rawH === 12 ? 0 : rawH);

      const startDateFormatted = `${year}${month}${day}T${String(hour || 12).padStart(2, '0')}${String(rawM || 0).padStart(2, '0')}00Z`;

      const icsContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Watazawwado//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${confirmation.bookingReference}@watazawwado.academy`,
        `SUMMARY:Watazawwado 1-on-1 Lesson - ${confirmation.serviceName}`,
        `DESCRIPTION:1-on-1 personalized teaching session with Watazawwado.\\nLearner: ${confirmation.learnerName}\\nDuration: ${confirmation.durationMinutes} min\\nReference: ${confirmation.bookingReference}\\nZoom Classroom: ${zoomUrl}`,
        `LOCATION:Zoom Online Classroom: ${zoomUrl}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `watazawwado-lesson-${confirmation.bookingReference}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadedIcs(true);
    } catch {
      // Non-blocking
    }
  };

  // Generate Google Calendar Add URL
  const getGoogleCalendarUrl = () => {
    const title = encodeURIComponent(`Watazawwado 1-on-1 Lesson: ${confirmation.serviceName}`);
    const details = encodeURIComponent(
      `Learner: ${confirmation.learnerName}\nBooking Ref: ${confirmation.bookingReference}\nDuration: ${confirmation.durationMinutes} minutes\nZoom Link: ${zoomUrl}\n\nReminders: email 3 hours before; on the site 12 hours and 2 hours before.`
    );
    const location = encodeURIComponent(zoomUrl);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const copyClassroomLink = () => {
    navigator.clipboard.writeText(zoomUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const whatsappLink = buildBookingWhatsAppUrl({
    bookingRef: confirmation.bookingReference,
    serviceName: confirmation.serviceName,
    date: confirmation.date,
    timeDisplay: confirmation.timeDisplay,
    timezone: confirmation.timezone,
    isTrial: Boolean(confirmation.isFreeTrial),
    learnerName: confirmation.learnerName
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6 max-w-2xl mx-auto py-2"
    >
      {/* Top Banner Celebration */}
      <div className="text-center space-y-3 pb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 15, stiffness: 300, delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-secondary/40 text-accent flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold bg-surface-warm glass-surface text-muted-foreground border border-secondary/60">
          {isEn ? `Booking Reference: ${confirmation.bookingReference}` : `رقم الحجز المرجعي: ${confirmation.bookingReference}`}
        </span>

        <h2 ref={headingRef} tabIndex={-1} className="font-display text-3xl sm:text-4xl font-medium text-foreground focus:outline-none">
          {confirmation.isFreeTrial
            ? isEn ? 'Your Free Trial is Booked' : 'تم تأكيد حجز جلستك التجريبية'
            : isEn ? 'Your Lesson is Scheduled' : 'تأكّد حجز درسك'}
        </h2>

        <p className="text-sm text-foreground/80 dark:text-muted-foreground max-w-lg mx-auto leading-relaxed">
          {isEn
            ? `Assalamu alaikum ${confirmation.learnerName}. ${teacherName || 'Your teacher'} is looking forward to meeting you.`
            : `السلام عليكم ${confirmation.learnerName}. ${teacherName ? `${teacherName} في انتظارك` : 'معلمك في انتظارك'} في الموعد المحدد.`}
          {confirmation.integrationStatus === 'failed' && (
            <span className="block mt-2 text-amber-700 dark:text-amber-500 font-medium text-sm">
              {isEn ? 'Your booking is secured, but the lesson link is not ready yet. Please try again later or message us.' : 'حجزك مؤكد، ولكن رابط الدرس لم يتم تجهيزه بعد. يرجى المحاولة لاحقاً أو مراسلتنا.'}
            </span>
          )}
        </p>
      </div>

      {/* Appointment Detail Card */}
      <div className="p-5 sm:p-6 rounded-3xl glass-card border-none space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-surface-warm dark:bg-background text-primary">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-foreground/55 dark:text-muted-foreground/55 block">
                {isEn ? 'Date' : 'التاريخ'}
              </span>
              <span className="text-sm font-medium text-foreground">
                {humanDate(confirmation.date, !isEn)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-surface-warm dark:bg-background text-primary">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-foreground/55 dark:text-muted-foreground/55 block">
                {isEn ? 'Time (Your Local Time)' : 'الوقت (بتوقيتك المحلي)'}
              </span>
              <span className="text-sm font-medium text-foreground">
                {humanTime(confirmation.timeDisplay, !isEn)}
              </span>
              <span className="text-[11px] text-foreground/60 dark:text-muted-foreground/60 block">
                {confirmation.timezone} ({confirmation.durationMinutes} {isEn ? 'min' : 'دقيقة'})
              </span>
            </div>
          </div>
        </div>

        {confirmation.lessonEnded ? (
          <div className="p-3.5 rounded-2xl bg-surface-subtle border border-border text-sm text-foreground/80">
            {isEn
              ? 'This lesson time has ended. Your teacher writes the lesson report, and you will find it under Progress.'
              : 'وقت الحصة دي خلص. المعلم بيكتب تقرير الحصة، وهتلاقيه في صفحة التقدّم.'}
          </div>
        ) : (
        /* Zoom Classroom Room Box */
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-900 dark:text-blue-200">
              <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? 'Zoom Online Classroom' : 'غرفة زووم التعليمية المباشرة'}</span>
            </div>
            {zoomUrl ? (
              <button
                type="button"
                onClick={copyClassroomLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm bg-background border border-blue-300 dark:border-blue-800 hover:bg-blue-100 text-blue-800 dark:text-blue-300 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (isEn ? 'Copied' : 'تم النسخ') : (isEn ? 'Copy Link' : 'نسخ الرابط')}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[13px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {isEn ? 'Being prepared' : 'بيتجهز'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm pt-1">
            {zoomUrl ? (
              <>
                <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-mono truncate max-w-[280px]">
                  {zoomUrl}
                </span>
                <a
                  href={zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl btn-zoom font-medium text-sm"
                >
                  <span>{isEn ? 'Join Classroom' : 'دخول الدرس'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <p className="text-[11px] text-blue-900/70 dark:text-blue-200/70 leading-relaxed">
                {isEn
                  ? 'Your Zoom link is being prepared. It will be emailed to you, and you can open it any time from My Lessons. Your teacher opens the class; if you arrive first, you wait a moment in the waiting room.'
                  : 'يُجهَّز رابط Zoom الآن. سيصلك على البريد، ويمكنك فتحه في أي وقت من صفحة "الدروس". المعلم هو من يفتح الفصل، وإن دخلت قبله ستنتظر لحظات في غرفة الانتظار.'}
              </p>
            )}
          </div>
        </div>
        )}

        {/* Automated Reminders Note */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-surface-warm/50 dark:bg-background text-sm text-foreground/80 dark:text-muted-foreground/80">
          <BellRing className="w-4 h-4 text-accent shrink-0" />
          <span>
            {reminderText(!isEn)}
          </span>
        </div>
      </div>

      {/* Payment Verified & Confirmed Badge (For Paid Standalone Lessons) */}
      {!confirmation.isFreeTrial && !confirmation.packageEntitlementId && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="leading-relaxed">
              <strong className="block text-emerald-900 dark:text-emerald-200 font-bold mb-0.5">
                {isEn ? 'Payment Confirmed & Verified' : 'تم الدفع وتأكّد الحجز'}
              </strong>
              <span className="text-xs sm:text-sm text-emerald-700/80 dark:text-emerald-300/80">
                {isEn
                  ? 'Your payment has been received and verified. Your classroom link and calendar invite are active.'
                  : 'وصلنا دفعك وتأكّد. رابط الحصة وموعدها في التقويم جاهزان الآن.'}
              </span>
            </div>
          </div>
          {confirmation.feeAmountUsd && (
            <div className="shrink-0 text-start sm:text-end bg-emerald-500/15 px-3 py-1.5 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                {isEn ? 'Amount Paid' : 'المبلغ المدفوع'}
              </span>
              <span className="text-base font-extrabold text-emerald-900 dark:text-emerald-100 font-display">
                ${confirmation.feeAmountUsd.toFixed(2)} USD
              </span>
            </div>
          )}
        </div>
      )}

      {/* Package Credit Confirmed Banner (For Lessons Booked via Package) */}
      {!confirmation.isFreeTrial && confirmation.packageEntitlementId && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3 text-sm text-emerald-800 dark:text-emerald-300">
          <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div className="leading-relaxed">
            <strong className="block text-emerald-900 dark:text-emerald-200 font-semibold mb-0.5">
              {isEn ? 'Prepaid Lesson Package' : 'باقة دروس مسبقة الدفع'}
            </strong>
            <span>
              {isEn
                ? 'This lesson is covered by your active package credit. No additional payment is required for this session.'
                : 'تمت تغطية هذا الدرس برصيد باقتك النشطة. لا يلزم أي دفع إضافي لهذه الجلسة.'}
            </span>
          </div>
        </div>
      )}

      {/* Philosophy Reassurance / Post-Trial Human Expectation */}
      <div className="p-5 rounded-3xl bg-surface-warm glass-card border-none space-y-2">
        <div className="flex items-center gap-2 font-display text-sm font-medium text-foreground">
          <Sparkles className="w-4 h-4 text-accent" />
          <span>
            {confirmation.isFreeTrial
              ? isEn ? 'What to Expect in Your Free Trial' : 'ماذا ينتظرك في الجلسة التجريبية؟'
              : isEn ? 'What to Expect Next' : 'الخطوات القادمة'}
          </span>
        </div>

        <p className="text-sm text-foreground/80 dark:text-muted-foreground/80 leading-relaxed">
          {confirmation.isFreeTrial
            ? isEn
              ? 'The trial is a relaxed chance for us to meet, assess where you or your child currently stand, and demonstrate the teaching method through a brief sample lesson. If it feels like a natural fit, your teacher will share an honest learning roadmap. There is zero obligation to commit.'
              : 'الحصة التجريبية فرصة هادئة للتعارف ومعرفة مستواك الفعلي وتجربة أسلوب التدريس في درس قصير. وإن ارتحت، يقترح عليك معلمك خطة مناسبة دون أي التزام.'
            : isEn
              ? 'Please have your Mushaf or learning materials ready.'
              : 'يرجى تحضير المصحف أو كراس الملاحظات.'}
        </p>
      </div>

      {/* Actions: Add to Calendar (Google + iCal), WhatsApp Confirmation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-whatsapp-solid px-4 py-3 rounded-2xl text-sm font-bold shadow-md"
        >
          <MessageCircle className="w-4 h-4 fill-current shrink-0" />
          <span>{isEn ? 'WhatsApp us' : 'مراسلة واتساب'}</span>
        </a>

        <a
          href={getGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass-card border-none text-sm font-semibold text-foreground hover:bg-surface-warm dark:hover:bg-background transition-colors"
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{isEn ? 'Google Calendar' : 'تقويم جوجل'}</span>
        </a>

        <button
          type="button"
          onClick={handleDownloadIcs}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl glass-card border-none text-sm font-semibold text-foreground hover:bg-surface-warm dark:hover:bg-background transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-accent" />
          <span>{downloadedIcs ? (isEn ? 'Downloaded' : 'تم التنزيل') : (isEn ? 'Apple/Outlook (.ics)' : 'تنزيل .ics')}</span>
        </button>
      </div>

      {/* Policy Foundation: Reschedule or Cancel Link */}
      <div className="pt-2 text-center">
        <Link
          to="/student/lessons"
          className="text-sm text-muted-foreground hover:underline font-medium"
        >
          {isEn
            ? 'Need to reschedule or cancel? Manage it from My Lessons.'
            : 'تحتاج تغيير الموعد أو الإلغاء؟ من صفحة دروسي.'}
        </Link>
      </div>

      {/* Return to Site */}
      <div className="pt-3 flex flex-col items-center gap-2">
        {nextAction && (
          <button
            type="button"
            onClick={nextAction.onClick}
            className="min-h-11 px-6 py-2.5 rounded-xl btn-primary-material text-primary-foreground text-sm font-bold cursor-pointer"
          >
            {nextAction.label}
          </button>
        )}
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl text-sm font-medium text-foreground/70 dark:text-muted-foreground/70 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          {doneLabel || (isEn ? 'Done & Return to Homepage' : 'تم والعودة للموقع')}
        </button>
      </div>
    </motion.div>
  );
};
