import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  CalendarClock,
  Calendar,
  Clock,
  Video,
  RotateCcw,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  MessageCircle,
  Plus,
  Loader2,
  HelpCircle,
  CreditCard,
  Globe,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { BrandLoader } from '../../components/ui/BrandLoader';
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { StudentPageBack } from '../components/StudentPageBack';
import { LessonSelfServicePanel } from '../components/LessonSelfServicePanel';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getBookingPaymentSummary } from '../../lib/paymentStatus';
import {
  categorizeLessons,
  getLessonDisplayStatus,
  isCoordinationAllowed,
  type LessonFilter
} from '../lessonsPresentation';
import { getActiveWorkingTimezone } from '../../lib/countryTimezones';
import { useActiveLearner } from '../activeLearner';

export interface StudentLessonsPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

export default function StudentLessonsPage({ lang = 'en' }: StudentLessonsPageProps) {
  const { session } = useTeacherAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LessonFilter>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modals state
  const [paymentModalBooking, setPaymentModalBooking] = useState<any | null>(null);
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<any | null>(null);
  // ?manage=<bookingId> (from the home page) opens the reschedule/cancel window for that lesson.
  const [searchParams, setSearchParams] = useSearchParams();
  const manageId = searchParams.get('manage');
  useEffect(() => {
    if (!manageId || bookings.length === 0) return;
    const target = bookings.find((b) => b.id === manageId);
    if (target) setRescheduleModalBooking(target);
    setSearchParams((prev) => {
      prev.delete('manage');
      return prev;
    }, { replace: true });
  }, [manageId, bookings, setSearchParams]);

  const isAr = lang === 'ar';

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      if (!token) {
        throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'No active session token found');
      }

      const headers = { Authorization: `Bearer ${token}` };
      const [bookingsRes, paymentsRes] = await Promise.all([
        fetch('/api/student/bookings', { headers }),
        fetch('/api/student/payments', { headers })
      ]);

      if (!bookingsRes.ok) {
        throw new Error(isAr ? 'فشل تحميل مواعيد الدروس' : 'Failed to load lessons');
      }

      const bookingsData = await bookingsRes.json();
      setBookings(Array.isArray(bookingsData) ? bookingsData : []);

      if (paymentsRes.ok) {
        const pJson = await paymentsRes.json();
        setPayments(Array.isArray(pJson.payments) ? pJson.payments : []);
      }
    } catch (err: any) {
      console.error('[StudentLessonsPage Fetch Error]', err);
      setError(err.message || (isAr ? 'تعذر تحميل بيانات الدروس' : 'Unable to load lessons'));
    } finally {
      setLoading(false);
    }
  }, [session, isAr]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopyRef = (refCode: string) => {
    navigator.clipboard.writeText(refCode);
    setCopiedRef(refCode);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Lifecycle categorization (pure, tested helper).
  // UPCOMING: confirmed / pending / rescheduled whose scheduled_start >= now - 60 minutes
  // HISTORY: cancelled / no_show, plus past-but-unfinalised in-flight lessons
  // COMPLETED: ONLY bookings whose backend status is genuinely 'completed'
  // PA-01: the header's child switcher narrows the list to one learner.
  const { activeId, learners } = useActiveLearner();
  const learnerBookings = useMemo(
    () => (activeId ? bookings.filter((b: any) => b.studentId === activeId) : bookings),
    [bookings, activeId]
  );
  const categorizedBookings = useMemo(() => categorizeLessons(learnerBookings), [learnerBookings]);

  const displayedBookings = categorizedBookings[activeFilter];

  const counts = {
    all: bookings.length,
    upcoming: categorizedBookings.upcoming.length,
    completed: categorizedBookings.completed.length,
    cancelled: categorizedBookings.cancelled.length
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-start max-w-5xl">
      {/* 0. Page-Level Back Affordance */}
      <div>
        <StudentPageBack
          to="/student"
          label="Return to Student Portal"
          labelAr="العودة لبوابة الطالب"
          lang={lang}
        />
      </div>

      {/* 1. Header & Primary CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold  text-foreground">
            {isAr ? 'جدول دروسي ومواعيدي' : 'My Lessons & Schedule'}
          </h1>
          <p className="text-sm sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'متابعة كافة جلساتك التعليمية المباشرة مع معلمك، الروابط، وحالة التأكيد.'
              : 'Your 1-on-1 sessions with your teacher, room access, and lesson history.'}
          </p>
        </div>

        <Link
          to="/student/book"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'حجز موعد جديد' : 'Book a Lesson'}</span>
        </Link>
      </div>

      {/* 2. Compact Cancellation / Rescheduling Policy Notice */}
      <div className="p-3.5 sm:p-4 rounded-xl glass-surface border border-border-subtle flex items-start gap-3 text-sm leading-relaxed text-muted-foreground">
        <HelpCircle className="w-4 h-4 text-accent shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground block mb-0.5">
            {isAr ? 'سياسة الجدولة والإلغاء المعتمدة' : 'Cancellation & Rescheduling Policy'}
          </span>
          <span>
            {isAr
              ? 'يمكنك إعادة جدولة أو إلغاء موعدك قبل موعد الدرس بـ ٣ ساعات على الأقل. في حال كان المتبقي أقل من ٣ ساعات، يرجى التنسيق معنا مباشرة عبر واتساب.'
              : 'You may reschedule or cancel any session at least 3 hours in advance. For changes within 3 hours of start time, please message us directly on WhatsApp.'}
          </span>
        </div>
      </div>

      {/* 3. Filter Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(tabKey => {
          const isActive = activeFilter === tabKey;
          const labels = {
            all: isAr ? 'جميع الدروس' : 'All Lessons',
            upcoming: isAr ? 'الدروس القادمة' : 'Upcoming',
            completed: isAr ? 'المكتملة' : 'Completed',
            cancelled: isAr ? 'الملغاة / السابقة' : 'Cancelled & Past'
          };
          const count = counts[tabKey];

          return (
            <button
              key={tabKey}
              type="button"
              onClick={() => setActiveFilter(tabKey)}
              className={`
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm sm:text-sm transition-all whitespace-nowrap cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'glass-card hover:bg-surface-subtle text-muted-foreground hover:text-foreground border border-border font-medium'
                }
              `}
            >
              <span>{labels[tabKey]}</span>
              {!loading && !error && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[13px] font-mono leading-none ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Main Content Area */}
      {loading ? (
        <div className="glass-card border-none rounded-2xl overflow-hidden shadow-xs">
          <BrandLoader 
            size="lg" 
            text={isAr ? 'جارٍ تحضير قائمة الدروس والمواعيد...' : 'Loading your scheduled sessions...'} 
            subtext={isAr ? 'لحظات وسيكون جدولك وروابط الحصص جاهزة' : 'Retrieving your lesson calendar and classroom links'}
          />
        </div>
      ) : error ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-6 sm:p-8 glass-card border border-destructive/20 rounded-2xl text-center space-y-3"
        >
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">
            {isAr ? 'تعذر تحميل قائمة الدروس' : 'Could not load your lessons'}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center px-4 py-2 btn-primary-material text-primary-foreground text-sm rounded-xl font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </motion.div>
      ) : displayedBookings.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="text-center py-16 px-4 glass-card border-none rounded-2xl space-y-4"
        >
          <div className="w-12 h-12 rounded-2xl bg-secondary/30 text-accent flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-display font-semibold text-foreground">
              {activeFilter === 'upcoming'
                ? (isAr ? 'لا توجد دروس قادمة مجدولة' : 'No upcoming lessons scheduled')
                : activeFilter === 'completed'
                ? (isAr ? 'لا توجد دروس مكتملة مسجلة بعد' : 'No completed lessons yet')
                : activeFilter === 'cancelled'
                ? (isAr ? 'لا توجد دروس ملغاة أو منتهية' : 'No cancelled or past records')
                : (isAr ? 'لا توجد مواعيد مسجلة حتى الآن' : 'No lessons found')}
            </h3>
            <p className="text-sm sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              {activeFilter === 'upcoming'
                ? (isAr
                    ? 'ليس لديك أي مواعيد قادمة مجدولة حالياً. يمكنك اختيار موضوع وجلسة مع معلمك الآن.'
                    : 'You do not have any upcoming sessions on your calendar. Ready to book your next lesson?')
                : activeFilter === 'completed'
                ? (isAr
                    ? 'سوف تظهر سجلات الجلسات المنتهية هنا فور اكتمالها.'
                    : 'Records of finished sessions will appear here once held.')
                : activeFilter === 'cancelled'
                ? (isAr
                    ? 'لا توجد أي جلسات ملغاة في سجلك التعليمي.'
                    : 'There are no cancelled sessions in your lesson history.')
                : (isAr
                    ? 'ابدأ رحلتك التعليمية بحجز أول موعد مع معلمك.'
                    : 'Start your learning journey by booking your first session with your teacher.')}
            </p>
          </div>
          {(activeFilter === 'upcoming' || activeFilter === 'all') && (
            <Link
              to="/student/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'حجز موعد الآن' : 'Schedule a Lesson'}</span>
            </Link>
          )}
        </motion.div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {displayedBookings.map((b, index) => {
              const rawZoom = (b.zoomMeetingLink || b.zoom_join_url || '').trim();
              const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));
              
              const rawStart = b.scheduledStart || b.scheduled_start || b.lesson_date;
              const studentTz = getActiveWorkingTimezone(b.studentTimezone || 'UTC');
              
              // Format time accurately in student's timezone using Luxon
              const dateObj = rawStart
                ? DateTime.fromISO(rawStart, { setZone: true }).setZone(studentTz)
                : null;

              // Reconcile payment status authoritatively using payments list
              const paymentSummary = getBookingPaymentSummary(b, payments);
              const isPendingPayment = paymentSummary.isPendingPayment;
              const isCancelled = b.status === 'cancelled';
              const isCompleted = b.status === 'completed';
              const isNoShow = b.status === 'no_show';
              // WhatsApp-only coordination entry point: eligible only for genuinely
              // changeable, not-yet-started lessons. No mutation is performed here.
              const canCoordinate = isCoordinationAllowed(b);
              const displayStatus = getLessonDisplayStatus(b, paymentSummary, isAr);

              return (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{
                    duration: 0.38,
                    delay: Math.min(index * 0.05, 0.3),
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                >
                  <Card className="border-border hover:border-secondary/60 transition-all duration-300 glass-card shadow-2xs hover:shadow-md">
                    <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Service Title + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                          {isAr && b.serviceArabicTitle ? b.serviceArabicTitle : b.serviceTitle}
                        </h3>
                        {learners.length > 0 && !activeId && b.learnerName && (
                          <Badge variant="outline" className="text-[13px] border-secondary/60">
                            {isAr ? `لـ ${b.learnerName}` : `For ${b.learnerName}`}
                          </Badge>
                        )}
                        {b.bookingType === 'trial' && (
                          <Badge variant="outline" className="text-[13px] text-primary border-secondary/60">
                            {isAr ? 'تجريبي مجاني' : 'Free Trial'}
                          </Badge>
                        )}
                        {(b.packageEntitlementId || b.isPackageBooking) && (
                          <Badge variant="secondary" className="text-[13px] font-normal bg-secondary/30 text-primary border-secondary/50">
                            {isAr ? 'باقة مسبقة الدفع' : 'Prepaid Package'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span className="font-medium text-foreground">
                            {dateObj && dateObj.isValid
                              ? dateObj.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
                              : ''}
                          </span>
                        </div>
                        {(b.durationMinutes || b.duration) && (
                          <span>• {b.durationMinutes || b.duration} {isAr ? 'دقيقة' : 'min'}</span>
                        )}
                        {studentTz && (
                          <span className="flex items-center gap-1">
                            • <Globe className="w-3 h-3 opacity-70 shrink-0" />
                            <span>{studentTz}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="self-start sm:self-center shrink-0 flex items-center gap-2">
                      {/* Package coverage is stated on the title row (Prepaid Package badge). */}
                      {/* Payment state is surfaced truthfully here, and never overstates a booking as
                          "Confirmed"/"Paid" while verification/collection is still outstanding. */}
                      {paymentSummary.isPaidOrTrial && b.bookingType !== 'trial' && !paymentSummary.isPendingPayment && (
                        <Badge variant="success" className="px-2.5 py-1 text-sm font-medium">
                          {isAr ? 'مدفوع ومفعل' : 'Paid'}
                        </Badge>
                      )}

                      <Badge variant={displayStatus.variant} className="px-2.5 py-1 text-sm font-medium">
                        {displayStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle: Details & Reference Bar */}
                  <div className="p-3 sm:p-3.5 rounded-xl glass-surface border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3 opacity-70 shrink-0" />
                        <span>{isAr ? 'الرقم المرجعي:' : 'Booking Ref:'}</span>
                      </span>
                      <span className="font-mono font-bold text-foreground tracking-wider">{b.referenceCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(b.referenceCode)}
                        className="tap-44 relative p-1 rounded-md text-muted-foreground hover:text-foreground glass-hover hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        title={isAr ? 'نسخ الرقم المرجعي' : 'Copy reference code'}
                        aria-label={isAr ? `نسخ الرقم المرجعي ${b.referenceCode}` : `Copy reference code ${b.referenceCode}`}
                      >
                        {copiedRef === b.referenceCode ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      {copiedRef === b.referenceCode && (
                        <span className="text-[13px] text-success font-medium">
                          {isAr ? 'تم النسخ' : 'Copied'}
                        </span>
                      )}
                    </div>

                    {isPendingPayment && (
                      <div className="flex items-center gap-1.5 text-warning font-medium">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {paymentSummary.isAwaitingVerification
                            ? (isAr ? 'تم إرسال إثبات الدفع، وبانتظار اعتماد الأستاذ' : 'Payment submitted, awaiting teacher verification')
                            : (isAr ? 'لم يتم تأكيد الدفع بعد' : 'Payment not yet confirmed')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-border-subtle/50">
                    {/* Zoom State */}
                    <div className="flex-1">
                      {isCancelled ? (
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg glass-surface border border-border-subtle">
                          <span>{isAr ? 'تم إلغاء هذا الدرس' : 'This lesson has been cancelled.'}</span>
                        </div>
                      ) : hasValidZoomUrl ? (
                        <a
                          href={rawZoom}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-zoom rounded-xl text-sm font-semibold min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                        >
                          <Video className="w-4 h-4 shrink-0" />
                          <span>{isAr ? 'دخول الفصل الافتراضي (زووم)' : 'Join Zoom Classroom'}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 ms-0.5" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg glass-surface border border-border-subtle">
                          <Clock className="w-3.5 h-3.5 text-accent shrink-0" />
                          <span>
                            {isAr
                              ? 'رابط زووم بيتجهز، وهيوصلك على الإيميل ويظهر هنا. المعلم بيفتح الفصل وانت بتستنى لحظات في غرفة الانتظار.'
                              : 'Your Zoom link is being prepared; it will be emailed and shown here. Your teacher opens the class; you wait a moment in the waiting room.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Pay & Confirm Lesson */}
                      {isPendingPayment && (
                        <button
                          type="button"
                          onClick={() => setPaymentModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 btn-primary-material rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus shadow-xs"
                        >
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAr ? 'الدفع وتأكيد الحجز' : 'Pay & Confirm Booking'}</span>
                        </button>
                      )}

                      {/* Reschedule / cancel on the site (LessonSelfServicePanel) */}
                      {canCoordinate && (
                        <button
                          type="button"
                          onClick={() => setRescheduleModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-medium transition-colors cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <CalendarClock className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAr ? 'تغيير الميعاد أو إلغاء' : 'Reschedule or cancel'}</span>
                        </button>
                      )}

                      {/* Rebook / Repeat Topic for completed or cancelled lessons */}
                      {(isCompleted || isCancelled || isNoShow) && (
                        <Link
                          to={`/student/book?repeat=${b.id}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 glass-card hover:bg-surface-subtle text-primary border border-border rounded-xl text-sm font-medium transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                          title={isAr ? 'حجز درس جديد في نفس الموضوع' : 'Book another session on this topic'}
                        >
                          <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAr ? 'تكرار الموضوع' : 'Repeat Topic'}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  )}

      {/* 5. Payment Claim Modal (reusing production component) */}
      {paymentModalBooking && (
        <StudentPaymentClaimModal
          isOpen={Boolean(paymentModalBooking)}
          onClose={() => setPaymentModalBooking(null)}
          bookingReference={paymentModalBooking.referenceCode}
          itemTitle={paymentModalBooking.serviceTitle}
          amount={paymentModalBooking.feeAmountUsd}
          lang={lang}
          sessionToken={session?.access_token}
          onClaimSuccess={() => {
            fetchData();
          }}
        />
      )}

      {/* 6. Reschedule / Cancellation Coordinator Modal */}
      {rescheduleModalBooking && (
        <Modal
          isOpen={Boolean(rescheduleModalBooking)}
          onClose={() => setRescheduleModalBooking(null)}
          title={
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-secondary/30 text-primary">
                <Calendar className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-base font-display font-bold text-foreground">
                  {isAr ? 'تغيير الميعاد أو إلغاء الحصة' : 'Reschedule or cancel'}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  Ref: {rescheduleModalBooking.referenceCode}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-start text-sm text-foreground">
            {/* Self-service move/cancel (RULES.md §2); the server enforces every time limit. */}
            <LessonSelfServicePanel
              booking={rescheduleModalBooking}
              lang={lang}
              timezone={getActiveWorkingTimezone(rescheduleModalBooking.studentTimezone || 'UTC')}
              onChanged={() => {
                fetchData();
              }}
            />
            <p className="text-xs text-muted-foreground">
              {isAr ? 'ظرف طارئ في آخر لحظة؟ ' : 'A real emergency at the last minute? '}
              <a
                href={buildWhatsAppUrl(`${isAr ? 'ظرف طارئ بخصوص حصتي' : 'Emergency about my lesson'} [${rescheduleModalBooking.referenceCode}]`)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-primary"
              >
                {isAr ? 'كلّمنا على واتساب' : 'Message us on WhatsApp'}
              </a>
            </p>
            <button
              type="button"
              onClick={() => setRescheduleModalBooking(null)}
              className="w-full px-4 py-2.5 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-medium transition-colors cursor-pointer"
            >
              {isAr ? 'إغلاق' : 'Close'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
