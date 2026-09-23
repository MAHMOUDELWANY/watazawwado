import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
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
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { StudentPageBack } from '../components/StudentPageBack';
import { buildWhatsAppUrl } from '../../lib/whatsapp';
import { getBookingPaymentSummary } from '../../lib/paymentStatus';
import {
  categorizeLessons,
  getLessonDisplayStatus,
  isCoordinationAllowed,
  type LessonFilter
} from '../lessonsPresentation';

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
  const categorizedBookings = useMemo(() => categorizeLessons(bookings), [bookings]);

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
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            {isAr ? 'جدول دروسي ومواعيدي' : 'My Lessons & Schedule'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'متابعة كافة جلساتك التعليمية المباشرة مع الأستاذ محمود، الروابط، وحالة التأكيد.'
              : 'Direct 1-on-1 scheduled sessions with Ustadh Mahmoud, room access, and lesson history.'}
          </p>
        </div>

        <Link
          to="/student/book"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
        >
          <Plus className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'حجز موعد جديد' : 'Book a Lesson'}</span>
        </Link>
      </div>

      {/* 2. Compact Cancellation / Rescheduling Policy Notice */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
        <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-foreground block mb-0.5">
            {isAr ? 'سياسة الجدولة والإلغاء المعتمدة' : 'Cancellation & Rescheduling Policy'}
          </span>
          <span>
            {isAr
              ? 'يمكنك إعادة جدولة أو إلغاء موعدك قبل موعد الدرس بـ ٣ ساعات على الأقل. في حال كان المتبقي أقل من ٣ ساعات، يرجى التنسيق المباشر مع الأستاذ محمود عبر واتساب.'
              : 'You may reschedule or cancel any session at least 3 hours in advance. For changes within 3 hours of start time, please message Ustadh Mahmoud directly on WhatsApp.'}
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
                inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm transition-all whitespace-nowrap cursor-pointer min-h-[40px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-surface hover:bg-surface-subtle text-muted-foreground hover:text-foreground border border-border font-medium'
                }
              `}
            >
              <span>{labels[tabKey]}</span>
              {!loading && !error && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none ${
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
        <div className="flex flex-col items-center justify-center py-16 gap-3 bg-surface border border-border rounded-2xl">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isAr ? 'جارٍ تحميل الدروس...' : 'Loading your scheduled sessions...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 sm:p-8 bg-surface border border-destructive/20 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">
            {isAr ? 'تعذر تحميل قائمة الدروس' : 'Could not load your lessons'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">{error}</p>
          <button
            type="button"
            onClick={fetchData}
            className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground text-xs rounded-xl font-medium cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface border border-border rounded-2xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
              {activeFilter === 'upcoming'
                ? (isAr ? 'لا توجد دروس قادمة مجدولة' : 'No upcoming lessons scheduled')
                : activeFilter === 'completed'
                ? (isAr ? 'لا توجد دروس مكتملة مسجلة بعد' : 'No completed lessons yet')
                : activeFilter === 'cancelled'
                ? (isAr ? 'لا توجد دروس ملغاة أو منتهية' : 'No cancelled or past records')
                : (isAr ? 'لا توجد مواعيد مسجلة حتى الآن' : 'No lessons found')}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              {activeFilter === 'upcoming'
                ? (isAr
                    ? 'ليس لديك أي مواعيد قادمة مجدولة حالياً. يمكنك اختيار موضوع وجلسة مع الأستاذ محمود الآن.'
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
                    ? 'ابدأ رحلتك التعليمية بحجز أول موعد مع الأستاذ محمود.'
                    : 'Start your learning journey by booking your first session with Ustadh Mahmoud.')}
            </p>
          </div>
          {(activeFilter === 'upcoming' || activeFilter === 'all') && (
            <Link
              to="/student/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span>{isAr ? 'حجز موعد الآن' : 'Schedule a Lesson'}</span>
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {displayedBookings.map(b => {
            const rawZoom = (b.zoomMeetingLink || b.zoom_join_url || '').trim();
            const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));
            
            const rawStart = b.scheduledStart || b.scheduled_start || b.lesson_date;
            const studentTz = b.studentTimezone || 'UTC';
            
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
              <Card key={b.id} className="border-border hover:border-primary/30 transition-colors bg-surface">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Service Title + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-foreground">
                          {isAr && b.serviceArabicTitle ? b.serviceArabicTitle : b.serviceTitle}
                        </h3>
                        {b.bookingType === 'trial' && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            {isAr ? 'تجريبي مجاني' : 'Free Trial'}
                          </Badge>
                        )}
                        {(b.packageEntitlementId || b.isPackageBooking) && (
                          <Badge variant="secondary" className="text-[10px] font-normal bg-primary/10 text-primary border-primary/20">
                            {isAr ? 'باقة مسبقة الدفع' : 'Prepaid Package'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="font-medium text-foreground">
                            {dateObj && dateObj.isValid
                              ? dateObj.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
                              : ''}
                          </span>
                        </div>
                        {(b.durationMinutes || b.duration) && (
                          <span>• {b.durationMinutes || b.duration} {isAr ? 'دقيقة' : 'min'}</span>
                        )}
                        {b.studentTimezone && (
                          <span className="flex items-center gap-1">
                            • <Globe className="w-3 h-3 opacity-70 shrink-0" />
                            <span>{b.studentTimezone}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="self-start sm:self-center shrink-0 flex items-center gap-2">
                      {/* Package coverage is stated on the title row (Prepaid Package badge). */}
                      {/* Payment state is surfaced truthfully here, and never overstates a booking as
                          "Confirmed"/"Paid" while verification/collection is still outstanding. */}
                      {paymentSummary.isPaidOrTrial && b.bookingType !== 'trial' && !paymentSummary.isPendingPayment && (
                        <Badge variant="success" className="px-2.5 py-1 text-xs font-medium">
                          {isAr ? 'مدفوع ومفعل' : 'Paid'}
                        </Badge>
                      )}

                      <Badge variant={displayStatus.variant} className="px-2.5 py-1 text-xs font-medium">
                        {displayStatus.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle: Details & Reference Bar */}
                  <div className="p-3 sm:p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Tag className="w-3 h-3 opacity-70 shrink-0" />
                        <span>{isAr ? 'الرقم المرجعي:' : 'Booking Ref:'}</span>
                      </span>
                      <span className="font-mono font-bold text-foreground tracking-wider">{b.referenceCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(b.referenceCode)}
                        className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
                        <span className="text-[10px] text-success font-medium">
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
                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-surface-subtle border border-border-subtle">
                          <span>{isAr ? 'تم إلغاء هذا الدرس' : 'This lesson has been cancelled.'}</span>
                        </div>
                      ) : hasValidZoomUrl ? (
                        <a
                          href={rawZoom}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs min-h-[42px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                        >
                          <Video className="w-4 h-4 shrink-0" />
                          <span>{isAr ? 'دخول الفصل الافتراضي (زووم)' : 'Join Zoom Classroom'}</span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0 ms-0.5" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-surface-subtle border border-border-subtle">
                          <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>
                            {isAr
                              ? 'رابط زووم سيتوفر هنا مباشرة قبل موعد الجلسة.'
                              : 'Zoom meeting room activates prior to the lesson.'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {/* Submit Payment Claim */}
                      {isPendingPayment && (
                        <button
                          type="button"
                          onClick={() => setPaymentModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <CreditCard className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAr ? 'إرسال إثبات الدفع' : 'Submit Payment Claim'}</span>
                        </button>
                      )}

                      {/* Reschedule / Cancel coordination (WhatsApp only — no in-app mutation) */}
                      {canCoordinate && (
                        <button
                          type="button"
                          onClick={() => setRescheduleModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs font-medium transition-colors cursor-pointer min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                        >
                          <MessageCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{isAr ? 'تنسيق التعديل عبر واتساب' : 'Request Change via WhatsApp'}</span>
                        </button>
                      )}

                      {/* Rebook / Repeat Topic for completed or cancelled lessons */}
                      {(isCompleted || isCancelled || isNoShow) && (
                        <Link
                          to={`/student/book?repeat=true${b.serviceId ? `&service=${b.serviceId}` : ''}`}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-subtle text-primary border border-border rounded-xl text-xs font-medium transition-colors min-h-[38px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
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
            );
          })}
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
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="w-5 h-5 shrink-0" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-foreground">
                  {isAr ? 'طلب تعديل أو إلغاء الدرس' : 'Request a Lesson Change'}
                </h3>
                <p className="text-xs text-muted-foreground font-mono">
                  Ref: {rescheduleModalBooking.referenceCode}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-start text-xs sm:text-sm text-foreground">
            {(() => {
              const startObj = DateTime.fromISO(
                rescheduleModalBooking.scheduledStart || rescheduleModalBooking.scheduled_start || rescheduleModalBooking.lesson_date || ''
              );
              const hrs = startObj.isValid ? startObj.diffNow().as('hours') : 0;
              const isEligible = hrs >= 3;

              const serviceTitle = isAr && rescheduleModalBooking.serviceArabicTitle
                ? rescheduleModalBooking.serviceArabicTitle
                : (rescheduleModalBooking.serviceTitle || 'Lesson');

              const scheduledDateFormatted = startObj.isValid
                ? (isAr ? startObj.setLocale('ar').toFormat('dd MMMM yyyy - hh:mm a') : startObj.setLocale('en').toFormat('dd LLL yyyy, h:mm a'))
                : '';

              const waMessage = isAr
                ? (isEligible
                    ? `السلام عليكم أستاذ محمود،\nأود طلب إعادة جدولة أو إلغاء لموعد درسي (${serviceTitle}) برمز الحجز [${rescheduleModalBooking.referenceCode}] المقرر في (${scheduledDateFormatted}).`
                    : `السلام عليكم أستاذ محمود،\nبخصوص درسي (${serviceTitle}) برمز الحجز [${rescheduleModalBooking.referenceCode}] المقرر في (${scheduledDateFormatted})، متبقي أقل من ٣ ساعات وأود التنسيق معكم بخصوص هذا التعديل.`)
                : (isEligible
                    ? `Assalamu Alaikum Ustadh Mahmoud,\nRegarding my booking [${rescheduleModalBooking.referenceCode}] (${serviceTitle}) scheduled for ${scheduledDateFormatted}, I would like to request a reschedule/cancellation.`
                    : `Assalamu Alaikum Ustadh Mahmoud,\nRegarding booking [${rescheduleModalBooking.referenceCode}] (${serviceTitle}) scheduled for ${scheduledDateFormatted}, my lesson starts in less than 3 hours and I would like to coordinate regarding this short-notice adjustment.`);

              const waUrl = buildWhatsAppUrl(waMessage);

              return (
                <>
                  <div
                    className={`p-4 rounded-xl border ${
                      isEligible
                        ? 'bg-surface-subtle border-border-subtle'
                        : 'bg-warning/10 border-warning/25 text-foreground'
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">
                      {isEligible
                        ? (isAr ? 'يمكنك طلب التعديل الآن' : 'You can request a change now')
                        : (isAr ? 'تنبيه: متبقي أقل من ٣ ساعات' : 'Notice: Less than 3 hours remaining')}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isEligible
                        ? (isAr
                            ? 'موعد درسك يبدأ بعد أكثر من ٣ ساعات. لطلب إعادة الجدولة أو الإلغاء، يرجى التنسيق مباشرة مع الأستاذ محمود عبر واتساب. لن يتم تعديل الموعد من داخل التطبيق.'
                            : 'Your lesson is scheduled more than 3 hours from now. To request a reschedule or cancellation, coordinate directly with Ustadh Mahmoud on WhatsApp. The booking is not changed by the app itself.')
                        : (isAr
                            ? 'نظراً لأن موعد الدرس خلال أقل من ٣ ساعات، يتطلب طلب الإلغاء أو التعديل تواصلاً مباشراً مع الأستاذ محمود عبر واتساب. لن يتم تعديل الموعد من داخل التطبيق.'
                            : 'Because your session starts in less than 3 hours, requesting an adjustment requires direct coordination with Ustadh Mahmoud on WhatsApp. The booking is not changed by the app itself.')}
                    </p>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>
                        {isAr
                          ? 'التواصل عبر واتساب للتنسيق'
                          : 'Message Ustadh Mahmoud on WhatsApp'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0 ms-0.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setRescheduleModalBooking(null)}
                      className="w-full px-4 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                    >
                      {isAr ? 'إغلاق' : 'Close'}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </Modal>
      )}
    </div>
  );
}
