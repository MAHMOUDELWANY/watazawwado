import React, { useState } from 'react';
import { motion } from 'motion/react';
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
import { PaymentInstructionsCard } from './PaymentInstructionsCard';

interface BookingConfirmationProps {
  confirmation: BookingConfirmationData;
  onOpenManageModal?: (refCode: string) => void;
  onDone: () => void;
  lang: Language;
  doneLabel?: string;
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
  confirmation,
  onOpenManageModal,
  onDone,
  lang,
  doneLabel
}) => {
  const isEn = lang === 'en';
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
        'PRODID:-//Mahmoud Teaching Platform//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${confirmation.bookingReference}@mahmoud-teaching.com`,
        `SUMMARY:1-on-1 Lesson with Mahmoud - ${confirmation.serviceName}`,
        `DESCRIPTION:1-on-1 personalized teaching session with Mahmoud.\\nLearner: ${confirmation.learnerName}\\nDuration: ${confirmation.durationMinutes} min\\nReference: ${confirmation.bookingReference}\\nZoom Classroom: ${zoomUrl}`,
        `LOCATION:Zoom Online Classroom: ${zoomUrl}`,
        `STATUS:CONFIRMED`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.setAttribute('download', `lesson-with-mahmoud-${confirmation.bookingReference}.ics`);
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
    const title = encodeURIComponent(`1-on-1 Lesson with Mahmoud: ${confirmation.serviceName}`);
    const details = encodeURIComponent(
      `Learner: ${confirmation.learnerName}\nBooking Ref: ${confirmation.bookingReference}\nDuration: ${confirmation.durationMinutes} minutes\nZoom Link: ${zoomUrl}\n\nAutomated reminders will be delivered 24h and 1h prior.`
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
          className="w-16 h-16 rounded-full bg-[#87A878]/20 text-[#87A878] flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="w-10 h-10" />
        </motion.div>

        <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#EDE3D4] dark:bg-[#29232F] text-[#6B5B73] dark:text-[#B8A9C9] border border-[#87A878]/30">
          {isEn ? `Booking Reference: ${confirmation.bookingReference}` : `رقم الحجز المرجعي: ${confirmation.bookingReference}`}
        </span>

        <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#362E3B] dark:text-[#F5E6D3]">
          {confirmation.isFreeTrial
            ? isEn ? 'Your Free Trial is Booked' : 'تم تأكيد حجز جلستك التجريبية'
            : isEn ? 'Your Lesson is Scheduled' : 'تم تأكيد حجز درسك بنجاح'}
        </h2>

        <p className="text-sm text-[#362E3B]/80 dark:text-[#D5D0CA] max-w-lg mx-auto leading-relaxed">
          {isEn
            ? `Assalamu Alaikum ${confirmation.learnerName}. Mahmoud is looking forward to meeting you. A confirmation summary has been logged for your local schedule.`
            : `السلام عليكم ${confirmation.learnerName}. يتطلع الأستاذ محمود للقائك في الموعد المحدد.`}
          {confirmation.integrationStatus === 'failed' && (
            <span className="block mt-2 text-amber-700 dark:text-amber-500 font-medium text-xs">
              {isEn ? 'Your booking is secured, but the lesson link is not ready yet. Please try again later or contact Mahmoud.' : 'حجزك مؤكد، ولكن رابط الدرس لم يتم تجهيزه بعد. يرجى المحاولة لاحقاً أو التواصل مع الأستاذ محمود.'}
            </span>
          )}
        </p>
      </div>

      {/* Appointment Detail Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#231D28] border border-[#87A878]/30 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-[#D5D0CA] dark:border-[#3E3545]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#EDE3D4] dark:bg-[#1E1923] text-[#87A878]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#362E3B]/55 dark:text-[#D5D0CA]/55 block">
                {isEn ? 'Date' : 'التاريخ'}
              </span>
              <span className="text-sm font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                {confirmation.date}
              </span>
              <span className="text-[11px] text-[#87A878] block">
                {confirmation.cairoTimeDisplay ? `(${confirmation.cairoTimeDisplay})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#EDE3D4] dark:bg-[#1E1923] text-[#87A878]">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] uppercase font-semibold text-[#362E3B]/55 dark:text-[#D5D0CA]/55 block">
                {isEn ? 'Time (Your Local Time)' : 'الوقت (بتوقيتك المحلي)'}
              </span>
              <span className="text-sm font-medium text-[#362E3B] dark:text-[#F5E6D3]">
                {confirmation.timeDisplay}
              </span>
              <span className="text-[11px] text-[#362E3B]/60 dark:text-[#D5D0CA]/60 block">
                {confirmation.timezone} ({confirmation.durationMinutes} min)
              </span>
            </div>
          </div>
        </div>

        {/* Zoom Classroom Room Box */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
              <Video className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{isEn ? 'Zoom Online Classroom' : 'غرفة زووم التعليمية المباشرة'}</span>
            </div>
            {zoomUrl ? (
              <button
                type="button"
                onClick={copyClassroomLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-white dark:bg-[#1E1923] border border-blue-300 dark:border-blue-800 hover:bg-blue-100 text-blue-800 dark:text-blue-300 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? (isEn ? 'Copied' : 'تم النسخ') : (isEn ? 'Copy Link' : 'نسخ الرابط')}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                {isEn ? 'Link Pending' : 'قيد التجهيز'}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between text-xs pt-1">
            {zoomUrl ? (
              <>
                <span className="text-[11px] text-blue-800/80 dark:text-blue-300/80 font-mono truncate max-w-[280px]">
                  {zoomUrl}
                </span>
                <a
                  href={zoomUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-xs"
                >
                  <span>{isEn ? 'Join Classroom' : 'دخول الدرس'}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </>
            ) : (
              <p className="text-[11px] text-blue-900/70 dark:text-blue-200/70 leading-relaxed">
                {isEn
                  ? 'Your personalized lesson link is being finalized and will be delivered to your email and WhatsApp before class.'
                  : 'جاري تجهيز رابط الدرس المخصص وسيرسل إلى بريدك الإلكتروني والواتساب قبل موعد الجلسة.'}
              </p>
            )}
          </div>
        </div>

        {/* Automated Reminders Note */}
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#EDE3D4]/50 dark:bg-[#1E1923] text-xs text-[#362E3B]/80 dark:text-[#D5D0CA]/80">
          <BellRing className="w-4 h-4 text-[#87A878] shrink-0" />
          <span>
            {isEn
              ? 'Automated lesson reminders will be delivered 24 hours and 1 hour before your scheduled session.'
              : 'ستصلك تذكيرات بموعد الدرس قبل الجلسة بـ ٢٤ ساعة وساعة واحدة.'}
          </span>
        </div>
      </div>

      {/* Payment Instructions & 1-Click Copy (For Paid Lessons) */}
      {!confirmation.isFreeTrial && (
        <PaymentInstructionsCard
          bookingReference={confirmation.bookingReference}
          serviceName={confirmation.serviceName}
          amount={confirmation.feeAmount || undefined}
          currency={confirmation.currency || 'USD'}
          learnerName={confirmation.learnerName}
          lang={lang}
        />
      )}

      {/* Philosophy Reassurance / Post-Trial Human Expectation */}
      <div className="p-5 rounded-3xl bg-[#EDE3D4] dark:bg-[#231D28] border border-[#87A878]/30 space-y-2">
        <div className="flex items-center gap-2 font-serif text-sm font-medium text-[#362E3B] dark:text-[#F5E6D3]">
          <Sparkles className="w-4 h-4 text-[#87A878]" />
          <span>
            {confirmation.isFreeTrial
              ? isEn ? 'What to Expect in Your Free Trial' : 'ماذا ينتظرك في الجلسة التجريبية؟'
              : isEn ? 'What to Expect Next' : 'الخطوات القادمة'}
          </span>
        </div>

        <p className="text-xs text-[#362E3B]/80 dark:text-[#D5D0CA]/80 leading-relaxed">
          {confirmation.isFreeTrial
            ? isEn
              ? 'The trial is a relaxed chance for us to meet, assess where you or your child currently stand, and demonstrate the teaching method through a brief sample lesson. If it feels like a natural fit, Mahmoud will share an honest learning roadmap. There is zero obligation to commit.'
              : 'الجلسة التجريبية فرصة هادئة للتعارف وتحديد المستوى الفعلي وتجربة أسلوب التدريس في درس مصغر. إذا شعرت بالارتياح، سيقترح محمود خطة دراسية مناسبة دون أي إلزام مسبق.'
            : isEn
              ? 'Please have your Mushaf or learning materials ready. Mahmoud will send a polite reminder 24 hours and 1 hour before your scheduled lesson.'
              : 'يرجى تحضير المصحف أو كراس الملاحظات. سيصلك تذكير قبل موعد الدرس بـ ٢٤ ساعة وساعة واحدة.'}
        </p>
      </div>

      {/* Actions: Add to Calendar (Google + iCal), WhatsApp Confirmation */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <a
          href={whatsappLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#87A878] hover:bg-[#6F907D] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>{isEn ? 'WhatsApp Mahmoud' : 'مراسلة واتساب'}</span>
        </a>

        <a
          href={getGoogleCalendarUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#231D28] border border-[#D5D0CA] dark:border-[#3E3545] text-xs font-semibold text-[#362E3B] dark:text-[#F5E6D3] hover:bg-[#EDE3D4] dark:hover:bg-[#1E1923] transition-colors"
        >
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>{isEn ? 'Google Calendar' : 'تقويم جوجل'}</span>
        </a>

        <button
          type="button"
          onClick={handleDownloadIcs}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white dark:bg-[#231D28] border border-[#D5D0CA] dark:border-[#3E3545] text-xs font-semibold text-[#362E3B] dark:text-[#F5E6D3] hover:bg-[#EDE3D4] dark:hover:bg-[#1E1923] transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4 text-[#87A878]" />
          <span>{downloadedIcs ? (isEn ? 'Downloaded' : 'تم التنزيل') : (isEn ? 'Apple/Outlook (.ics)' : 'تنزيل .ics')}</span>
        </button>
      </div>

      {/* Policy Foundation: Reschedule or Cancel Link */}
      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => onOpenManageModal && onOpenManageModal(confirmation.bookingReference)}
          className="text-xs text-[#6B5B73] dark:text-[#B8A9C9] hover:underline font-medium cursor-pointer"
        >
          {isEn
            ? 'Need to reschedule or check cancellation eligibility? Manage here.'
            : 'هل تحتاج لتعديل الموعد أو مراجعة الحجز؟ انقر هنا للإدارة.'}
        </button>
      </div>

      {/* Return to Site */}
      <div className="pt-3 flex justify-center">
        <button
          type="button"
          onClick={onDone}
          className="px-6 py-2.5 rounded-xl text-xs font-medium text-[#362E3B]/70 dark:text-[#D5D0CA]/70 hover:bg-[#EDE3D4] dark:hover:bg-[#29232F] transition-colors cursor-pointer"
        >
          {doneLabel || (isEn ? 'Done & Return to Homepage' : 'تم والعودة للموقع')}
        </button>
      </div>
    </motion.div>
  );
};
