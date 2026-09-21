import React, { useEffect, useState } from 'react';
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
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Plus,
  Loader2,
  HelpCircle,
  CreditCard,
  XCircle,
  Search
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';

export interface StudentLessonsPageProps {
  lang?: 'en' | 'ar';
  session?: any;
}

type LessonFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

export default function StudentLessonsPage({ lang = 'en' }: StudentLessonsPageProps) {
  const { session, user } = useTeacherAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<LessonFilter>('all');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Modals state
  const [paymentModalBooking, setPaymentModalBooking] = useState<any | null>(null);
  const [rescheduleModalBooking, setRescheduleModalBooking] = useState<any | null>(null);

  const isAr = lang === 'ar';

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = session?.access_token;
      if (!token) {
        throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'No active session token found');
      }

      const res = await fetch('/api/student/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'فشل تحميل مواعيد الدروس' : 'Failed to load lessons');
      }

      const data = await res.json();
      setBookings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('[StudentLessonsPage Fetch Error]', err);
      setError(err.message || (isAr ? 'تعذر تحميل بيانات الدروس' : 'Unable to load lessons'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [session, isAr]);

  const handleCopyRef = (refCode: string) => {
    navigator.clipboard.writeText(refCode);
    setCopiedRef(refCode);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Filter lessons
  const filteredBookings = bookings.filter(b => {
    const dateStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
    const start = dateStr ? DateTime.fromISO(dateStr) : null;
    const isUpcomingTime = start && start.isValid && start.diffNow().as('minutes') > -60;

    if (activeFilter === 'upcoming') {
      const isUpcomingStatus = b.status === 'confirmed' || b.status === 'pending' || b.status === 'rescheduled';
      return isUpcomingStatus && isUpcomingTime;
    }
    if (activeFilter === 'completed') {
      return b.status === 'completed' || (!isUpcomingTime && b.status === 'confirmed');
    }
    if (activeFilter === 'cancelled') {
      return b.status === 'cancelled' || b.status === 'no_show';
    }
    return true;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'success';
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'cancelled':
        return 'destructive';
      case 'rescheduled':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return isAr ? 'مؤكد ومجدول' : 'Confirmed';
      case 'completed':
        return isAr ? 'مكتمل' : 'Completed';
      case 'pending':
        return isAr ? 'في انتظار الدفع' : 'Pending Payment';
      case 'cancelled':
        return isAr ? 'ملغى' : 'Cancelled';
      case 'rescheduled':
        return isAr ? 'تمت إعادة الجدولة' : 'Rescheduled';
      case 'no_show':
        return isAr ? 'لم يحضر' : 'No Show';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in text-start">
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
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
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'حجز موعد جديد' : 'Book a Lesson'}</span>
        </Link>
      </div>

      {/* 2. Cancellation / Rescheduling Policy Banner */}
      <div className="p-4 rounded-2xl bg-surface-subtle border border-border-subtle flex items-start gap-3 text-xs leading-relaxed text-muted-foreground">
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
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {(['all', 'upcoming', 'completed', 'cancelled'] as const).map(tabKey => {
          const isActive = activeFilter === tabKey;
          const labels = {
            all: isAr ? 'جميع الدروس' : 'All Lessons',
            upcoming: isAr ? 'الدروس القادمة' : 'Upcoming',
            completed: isAr ? 'المكتملة' : 'Completed',
            cancelled: isAr ? 'الملغاة / السابقة' : 'Cancelled & Past'
          };

          return (
            <button
              key={tabKey}
              onClick={() => setActiveFilter(tabKey)}
              className={`
                px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer min-h-[38px]
                ${isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-semibold'
                  : 'bg-surface hover:bg-surface-subtle text-muted-foreground hover:text-foreground border border-border'
                }
              `}
            >
              {labels[tabKey]}
            </button>
          );
        })}
      </div>

      {/* 4. Lessons List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isAr ? 'جارٍ تحميل الدروس...' : 'Loading your scheduled sessions...'}
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-surface border border-destructive/20 rounded-2xl text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">
            {isAr ? 'تعذر تحميل قائمة الدروس' : 'Could not load your lessons'}
          </h3>
          <p className="text-xs text-muted-foreground">{error}</p>
          <button
            onClick={fetchBookings}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs rounded-xl font-medium cursor-pointer"
          >
            {isAr ? 'إعادة المحاولة' : 'Try Again'}
          </button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-16 px-4 bg-surface border border-border rounded-3xl space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
              {isAr ? 'لا توجد جلسات تطابق هذا الاختيار' : 'No lessons found in this section'}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
              {activeFilter === 'upcoming'
                ? (isAr
                    ? 'ليس لديك أي مواعيد قادمة مجدولة حالياً. هل ترغب في حجز درسك القادم الآن؟'
                    : 'You do not have any upcoming lessons scheduled right now. Ready to book your next session?')
                : (isAr
                    ? 'لا توجد سجلات مسجلة ضمن هذه الفئة حالياً.'
                    : 'There are no lesson records matching this category.')}
            </p>
          </div>
          <Link
            to="/student/book"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? 'حجز موعد الآن' : 'Schedule a Lesson'}</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(b => {
            const rawZoom = (b.zoomMeetingLink || b.zoom_join_url || '').trim();
            const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));
            const dateObj = DateTime.fromISO(b.scheduledStart || b.scheduled_start || b.lesson_date);
            const hoursUntil = dateObj.isValid ? dateObj.diffNow().as('hours') : 0;
            const canSelfChange = hoursUntil >= 3;
            const isPendingPayment = b.status === 'pending';

            return (
              <Card key={b.id} className="border-border hover:border-primary/30 transition-colors">
                <CardContent className="p-5 sm:p-6 space-y-4">
                  {/* Top Bar: Service Title + Status */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif font-bold text-base sm:text-lg text-foreground">
                          {isAr && b.serviceArabicTitle ? b.serviceArabicTitle : b.serviceTitle}
                        </h3>
                        {b.bookingType === 'trial' && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                            {isAr ? 'تجريبي مجاني' : 'Free Trial'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {dateObj.isValid
                              ? dateObj.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)
                              : ''}
                          </span>
                        </div>
                        {(b.durationMinutes || b.duration) && (
                          <span>• {b.durationMinutes || b.duration} {isAr ? 'دقيقة' : 'minutes'}</span>
                        )}
                        {b.studentTimezone && (
                          <span className="hidden sm:inline-block">• {b.studentTimezone}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      <Badge variant={getStatusBadgeVariant(b.status)} className="px-2.5 py-1 text-xs">
                        {getStatusLabel(b.status)}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle: Details & Reference */}
                  <div className="p-3.5 rounded-xl bg-surface-subtle border border-border-subtle flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">{isAr ? 'الرقم المرجعي:' : 'Booking Ref:'}</span>
                      <span className="font-mono font-bold text-foreground">{b.referenceCode}</span>
                      <button
                        type="button"
                        onClick={() => handleCopyRef(b.referenceCode)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        title={isAr ? 'نسخ الرقم المرجعي' : 'Copy reference code'}
                      >
                        {copiedRef === b.referenceCode ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {isPendingPayment && (
                      <div className="flex items-center gap-2 text-warning font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>
                          {isAr ? 'في انتظار تأكيد الحوالة' : 'Awaiting payment verification'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Zoom Classroom & Actions Row */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                    {/* Zoom State */}
                    <div className="flex-1">
                      {hasValidZoomUrl ? (
                        <a
                          href={rawZoom}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs min-h-[42px]"
                        >
                          <Video className="w-4 h-4" />
                          <span>{isAr ? 'دخول الفصل الافتراضي (زووم)' : 'Join Zoom Classroom'}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-lg bg-surface-subtle border border-border-subtle">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          <span>
                            {isAr
                              ? 'رابط زووم سيتوفر هنا مباشرة قبل موعد الجلسة'
                              : 'Zoom meeting link will activate here prior to lesson start'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Secondary Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      {isPendingPayment && (
                        <button
                          type="button"
                          onClick={() => setPaymentModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl text-xs font-semibold transition-colors cursor-pointer min-h-[38px]"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إرسال إثبات الدفع' : 'Submit Payment Claim'}</span>
                        </button>
                      )}

                      {/* Reschedule / Policy Coordinator */}
                      {(b.status === 'confirmed' || b.status === 'pending' || b.status === 'rescheduled') && (
                        <button
                          type="button"
                          onClick={() => setRescheduleModalBooking(b)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs font-medium transition-colors cursor-pointer min-h-[38px]"
                        >
                          <span>{isAr ? 'تعديل / إلغاء' : 'Reschedule / Cancel'}</span>
                        </button>
                      )}

                      {/* Repeat Topic */}
                      <Link
                        to={`/student/book?repeat=true${b.serviceId ? `&service=${b.serviceId}` : ''}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-surface hover:bg-surface-subtle text-primary border border-border rounded-xl text-xs font-medium transition-colors min-h-[38px]"
                        title={isAr ? 'حجز درس جديد في نفس الموضوع' : 'Book another session on this topic'}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'تكرار الموضوع' : 'Repeat Topic'}</span>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* 5. Payment Claim Modal */}
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
            fetchBookings();
          }}
        />
      )}

      {/* 6. Reschedule / Cancellation Dialog */}
      {rescheduleModalBooking && (
        <Modal
          isOpen={Boolean(rescheduleModalBooking)}
          onClose={() => setRescheduleModalBooking(null)}
          title={
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-serif font-bold text-foreground">
                  {isAr ? 'إعادة جدولة أو إلغاء الدرس' : 'Reschedule or Cancel Lesson'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Ref: {rescheduleModalBooking.referenceCode}
                </p>
              </div>
            </div>
          }
        >
          <div className="space-y-4 text-start text-xs sm:text-sm text-foreground">
            {(() => {
              const startObj = DateTime.fromISO(
                rescheduleModalBooking.scheduledStart || rescheduleModalBooking.scheduled_start
              );
              const hrs = startObj.isValid ? startObj.diffNow().as('hours') : 0;
              const isEligible = hrs >= 3;
              const waText = encodeURIComponent(
                `Assalamu Alaikum Ustadh Mahmoud,\nRegarding booking ${rescheduleModalBooking.referenceCode} (${rescheduleModalBooking.serviceTitle}), I would like to request a reschedule/cancellation.`
              );
              const waUrl = `https://wa.me/201026042456?text=${waText}`;

              return (
                <>
                  <div
                    className={`p-4 rounded-2xl border ${
                      isEligible
                        ? 'bg-surface-subtle border-border-subtle'
                        : 'bg-warning/10 border-warning/25 text-foreground'
                    }`}
                  >
                    <div className="font-semibold text-foreground mb-1">
                      {isEligible
                        ? (isAr ? 'مسموح بإعادة الجدولة والإلغاء' : 'Eligible for Rescheduling')
                        : (isAr ? 'تنبيه: متبقي أقل من ٣ ساعات' : 'Notice: Less than 3 hours remaining')}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isEligible
                        ? (isAr
                            ? 'موعد درسك يبدأ بعد أكثر من ٣ ساعات، مما يتيح لك إعادة الجدولة أو الإلغاء بالتنسيق مع الأستاذ محمود.'
                            : 'Your lesson is scheduled more than 3 hours from now. You may coordinate a convenient new slot directly with Ustadh Mahmoud.')
                        : (isAr
                            ? 'نظراً لأن موعد الدرس خلال أقل من ٣ ساعات، يتطلب الإلغاء أو التعديل إشعاراً مباشراً للأستاذ محمود عبر واتساب لترتيب جدول الدروس.'
                            : 'Because your session starts in less than 3 hours, short-notice adjustments require direct coordination with Ustadh Mahmoud via WhatsApp.')}
                    </p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>
                        {isAr
                          ? 'التواصل عبر واتساب لترتيب الموعد الجديد'
                          : 'Message Ustadh Mahmoud on WhatsApp'}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setRescheduleModalBooking(null)}
                      className="w-full px-4 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
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
