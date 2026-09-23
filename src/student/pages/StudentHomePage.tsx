import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import {
  Calendar,
  Video,
  Clock,
  ArrowRight,
  Loader2,
  RotateCcw,
  AlertCircle,
  Plus,
  BookOpen,
  CheckCircle2,
  Package,
  CreditCard,
  ExternalLink,
  MessageCircle,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Award,
  RefreshCw
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { findLastEligibleBooking, formatLastBookingSummary } from './StudentBookingPage';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';
import { getBookingPaymentSummary } from '../../lib/paymentStatus';

export interface StudentHomePageProps {
  lang?: 'en' | 'ar';
}

export default function StudentHomePage({ lang = 'en' }: StudentHomePageProps) {
  const { session, user } = useTeacherAuth();
  const navigate = useNavigate();

  // Core profile & bookings
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [coreLoading, setCoreLoading] = useState(true);
  const [coreError, setCoreError] = useState<string | null>(null);

  // Independent package section state
  const [packagesData, setPackagesData] = useState<any>(null);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [packagesError, setPackagesError] = useState<string | null>(null);

  // Independent payments section state
  const [paymentsData, setPaymentsData] = useState<any[] | null>(null);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsError, setPaymentsError] = useState<string | null>(null);

  // Quick claim modal
  const [paymentClaimBooking, setPaymentClaimBooking] = useState<any | null>(null);

  const isAr = lang === 'ar';

  // Fetch core profile and bookings
  const fetchCoreData = useCallback(async () => {
    try {
      setCoreLoading(true);
      setCoreError(null);

      const token = session?.access_token;
      if (!token) {
        throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'No active session token found');
      }

      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, bookingsRes] = await Promise.all([
        fetch('/api/student/me', { headers }),
        fetch('/api/student/bookings', { headers })
      ]);

      if (!profileRes.ok) {
        throw new Error(isAr ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile');
      }

      const profileJson = await profileRes.json();
      const bookingsJson = bookingsRes.ok ? await bookingsRes.json() : [];

      setProfile(profileJson);
      setBookings(Array.isArray(bookingsJson) ? bookingsJson : []);
    } catch (err: any) {
      console.error('Error loading core student overview data:', err);
      setCoreError(err.message || (isAr ? 'تعذر تحميل بيانات الطالب' : 'Unable to load dashboard data'));
    } finally {
      setCoreLoading(false);
    }
  }, [session, isAr]);

  // Fetch packages independently
  const fetchPackagesData = useCallback(async () => {
    try {
      setPackagesLoading(true);
      setPackagesError(null);

      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/packages', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'تعذر تحميل بيانات الباقات' : 'Unable to load packages');
      }

      const json = await res.json();
      setPackagesData(json);
    } catch (err: any) {
      console.error('Error loading package snapshot:', err);
      setPackagesError(err.message || (isAr ? 'تعذر تحميل بيانات الباقات' : 'Unable to load packages'));
    } finally {
      setPackagesLoading(false);
    }
  }, [session, isAr]);

  // Fetch payments independently
  const fetchPaymentsData = useCallback(async () => {
    try {
      setPaymentsLoading(true);
      setPaymentsError(null);

      const token = session?.access_token;
      if (!token) return;

      const res = await fetch('/api/student/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        throw new Error(isAr ? 'تعذر تحميل بيانات المدفوعات' : 'Unable to load payments');
      }

      const json = await res.json();
      setPaymentsData(Array.isArray(json.payments) ? json.payments : []);
    } catch (err: any) {
      console.error('Error loading payment snapshot:', err);
      setPaymentsError(err.message || (isAr ? 'تعذر تحميل بيانات المدفوعات' : 'Unable to load payments'));
    } finally {
      setPaymentsLoading(false);
    }
  }, [session, isAr]);

  useEffect(() => {
    fetchCoreData();
    fetchPackagesData();
    fetchPaymentsData();
  }, [fetchCoreData, fetchPackagesData, fetchPaymentsData]);

  if (coreLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isAr ? 'جارٍ تحميل جدول دروسك...' : 'Loading your lesson schedule...'}
        </p>
      </div>
    );
  }

  if (coreError) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-surface border border-destructive/20 rounded-2xl shadow-xs text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">
          {isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Could not load your student dashboard'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">{coreError}</p>
        <button
          onClick={fetchCoreData}
          className="inline-flex items-center justify-center px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer"
        >
          {isAr ? 'إعادة المحاولة' : 'Try Again'}
        </button>
      </div>
    );
  }

  // Filter for next upcoming booking
  const upcomingBookings = bookings.filter(b => {
    const isUpcomingStatus = b.status === 'confirmed' || b.status === 'pending' || b.status === 'rescheduled';
    if (!isUpcomingStatus) return false;
    const dateStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
    if (!dateStr) return false;
    const start = DateTime.fromISO(dateStr);
    return start.isValid && start.diffNow().as('minutes') > -60;
  });

  const nextBooking = upcomingBookings.sort((a, b) => {
    const dateA = DateTime.fromISO(a.scheduledStart || a.scheduled_start || a.lesson_date).toMillis();
    const dateB = DateTime.fromISO(b.scheduledStart || b.scheduled_start || b.lesson_date).toMillis();
    return dateA - dateB;
  })[0];

  // Completed or past lessons for recent history
  const pastBookings = bookings
    .filter(b => {
      const isPastStatus = b.status === 'completed' || b.status === 'cancelled';
      const dateStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
      const start = dateStr ? DateTime.fromISO(dateStr) : null;
      const isPastTime = start && start.isValid && start.diffNow().as('minutes') <= -60;
      return isPastStatus || isPastTime;
    })
    .sort((a, b) => {
      const dateA = DateTime.fromISO(a.scheduledStart || a.scheduled_start || a.lesson_date).toMillis();
      const dateB = DateTime.fromISO(b.scheduledStart || b.scheduled_start || b.lesson_date).toMillis();
      return dateB - dateA;
    });

  const recentLessons = pastBookings.slice(0, 4);

  // Resolve the most recent completed booking for repeating
  const lastEligibleBooking = findLastEligibleBooking(bookings);
  const lastBookingSummary = lastEligibleBooking ? formatLastBookingSummary(lastEligibleBooking, profile) : null;

  // Validate zoom link using tested invariant
  const rawZoom = (nextBooking?.zoomMeetingLink || nextBooking?.zoom_join_url || '').trim();
  const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));

  const studentFirstName = profile?.name ? profile.name.split(' ')[0] : '';

  // Time-aware greeting
  const currentHour = DateTime.now().hour;
  const greetingWord = currentHour < 12 
    ? (isAr ? 'صباح الخير' : 'Good morning')
    : currentHour < 18
    ? (isAr ? 'مساء الخير' : 'Good afternoon')
    : (isAr ? 'مساء الخير' : 'Good evening');

  const creditsRemaining = packagesData?.creditSummary?.totalRemaining ?? 0;
  const completedLessonsCount = bookings.filter(b => b.status === 'completed').length;
  const pendingPaymentBookings = bookings.filter(b => {
    const summary = getBookingPaymentSummary(b, paymentsData || []);
    return summary.isPendingPayment;
  });

  return (
    <div className="space-y-8 animate-fade-in text-start pb-12">
      {/* ========================================================================= */}
      {/* 1. OVERVIEW HEADER (Only place where greeting lives) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            {greetingWord}{studentFirstName ? `, ${studentFirstName}` : ''}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {nextBooking
              ? (isAr
                  ? `لديك درس قادم في ${DateTime.fromISO(nextBooking.scheduledStart || nextBooking.scheduled_start || nextBooking.lesson_date).setLocale('ar').toRelative()} مع الأستاذ محمود.`
                  : `You have 1 lesson coming up with Ustadh Mahmoud.`)
              : (isAr
                  ? 'مساحتك التعليمية الخاصة مع الأستاذ محمود. تابع جدولك وتقدمك التعليمي.'
                  : 'Your private 1-on-1 learning space with Ustadh Mahmoud.')}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="secondary" className="px-3 py-1 text-xs font-medium">
            {profile?.learnerType || (isAr ? 'طالب منتظم' : 'Active Learner')}
          </Badge>
          {profile?.timezone && (
            <span className="text-xs text-muted-foreground hidden md:inline-block">
              {profile.timezone}
            </span>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. QUICK ACTIONS (Hierarchy: Primary 'Book a Lesson', Secondary others) */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Link
          to="/student/book"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary-hover transition-all shadow-xs group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold truncate">
              {isAr ? 'حجز درس جديد' : 'Book a Lesson'}
            </span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 opacity-80 group-hover:translate-x-0.5 transition-transform shrink-0 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </Link>

        <Link
          to="/student/book"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-surface border border-border hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-2xs group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <Package className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {creditsRemaining > 0
                ? (isAr ? `${creditsRemaining} رصيد درس متبقي` : `${creditsRemaining} lesson credits remaining`)
                : (isAr ? 'احجز درساً' : 'Book a lesson')}
            </span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </Link>

        <Link
          to="/student/lessons"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-surface border border-border hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-2xs group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <BookOpen className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {isAr ? 'جدول كافة الدروس' : 'View Lessons'}
            </span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </Link>

        <Link
          to="/student/payments"
          className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-surface border border-border hover:border-primary/40 text-foreground hover:text-primary transition-all shadow-2xs group cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <CreditCard className="w-4 h-4 text-primary shrink-0" />
            <span className="text-xs sm:text-sm font-medium truncate">
              {isAr ? 'المدفوعات والحوالات' : 'View Payments'}
            </span>
          </div>
          <ArrowRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 ${isAr ? 'rotate-180 group-hover:-translate-x-0.5' : ''}`} />
        </Link>
      </div>

      {/* ========================================================================= */}
      {/* 3. COMMAND CENTER: TWO-COLUMN BALANCED DESKTOP LAYOUT */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: 8 COLS (Next Lesson + Recent Lessons) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* PRIMARY: NEXT LESSON FOCUS */}
          <section className="space-y-3" aria-labelledby="next-lesson-heading">
            <div className="flex items-center justify-between">
              <h2 id="next-lesson-heading" className="text-base sm:text-lg font-serif font-bold text-foreground">
                {isAr ? 'الدرس القادم المجدول' : 'Next Scheduled Lesson'}
              </h2>
              {nextBooking && (
                <Link
                  to="/student/lessons"
                  className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                >
                  <span>{isAr ? 'كافة المواعيد' : 'All sessions'}</span>
                  <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
                </Link>
              )}
            </div>

            {nextBooking ? (
              <div className="rounded-2xl border border-primary/20 bg-surface p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {isAr ? 'جلسة فردية مباشرة' : '1-on-1 Private Session'}
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {isAr ? 'مع الأستاذ محمود' : 'with Ustadh Mahmoud'}
                      </span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-serif font-bold text-foreground">
                      {nextBooking.serviceTitle || nextBooking.services?.title || (isAr ? 'جلسة تعليمية' : 'Private Lesson')}
                    </h3>
                  </div>

                  <div className="shrink-0">
                    <Badge variant={nextBooking.status === 'confirmed' ? 'success' : nextBooking.status === 'pending' ? 'warning' : 'secondary'}>
                      {nextBooking.status === 'pending' ? (isAr ? 'بانتظار الدفع' : 'Payment Required') : nextBooking.status}
                    </Badge>
                  </div>
                </div>

                {/* Time & Duration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-subtle border border-border/60 text-xs sm:text-sm">
                  <div className="flex items-center gap-2.5 text-foreground">
                    <Clock className="w-4 h-4 text-primary shrink-0" />
                    <span>
                      {DateTime.fromISO(nextBooking.scheduledStart || nextBooking.scheduled_start || nextBooking.lesson_date)
                        .setLocale(isAr ? 'ar' : 'en')
                        .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-muted-foreground sm:justify-end">
                    <span>{nextBooking.durationMinutes || nextBooking.duration || 45} {isAr ? 'دقيقة' : 'minutes'}</span>
                    {nextBooking.referenceCode && (
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-surface border border-border">
                        {nextBooking.referenceCode}
                      </span>
                    )}
                  </div>
                </div>

                {/* Pending Payment Warning Notice - using reconciled payment status */}
                {(() => {
                  const summary = getBookingPaymentSummary(nextBooking, paymentsData || []);
                  if (!summary.isPendingPayment) return null;
                  return (
                    <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2 text-warning">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>
                          {summary.isAwaitingVerification
                            ? (isAr
                                ? 'إثبات الدفع قيد المراجعة والتحقق من الأستاذ محمود.'
                                : 'Payment proof under review by Ustadh Mahmoud.')
                            : (isAr
                                ? 'هذا الموعد معلق حتى تأكيد إثبات الدفع.'
                                : 'This booking is awaiting manual payment claim verification to guarantee your slot.')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPaymentClaimBooking(nextBooking)}
                        className="px-3 py-1.5 bg-warning hover:bg-warning/90 text-warning-foreground rounded-lg font-semibold transition-colors shrink-0 cursor-pointer self-start sm:self-center"
                      >
                        {isAr ? 'إرسال إثبات الدفع' : 'Submit Claim'}
                      </button>
                    </div>
                  );
                })()}

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {hasValidZoomUrl ? (
                    <a
                      href={rawZoom}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer min-h-[44px]"
                    >
                      <Video className="w-4 h-4" />
                      <span>{isAr ? 'دخول فصل زووم' : 'Join Zoom Classroom'}</span>
                      <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                    </a>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-subtle border border-border text-muted-foreground text-xs min-h-[44px]">
                      <Video className="w-4 h-4 text-muted-foreground/70" />
                      <span>
                        {isAr ? 'رابط زووم سيتوفر قبل موعد الدرس' : 'Meeting link will appear soon'}
                      </span>
                    </div>
                  )}

                  <Link
                    id="link-home-repeat-lesson"
                    to="/student/book?repeat=true"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-foreground text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-primary" />
                    <span>{isAr ? 'حجز درس مماثل' : 'Repeat Lesson'}</span>
                  </Link>

                  <Link
                    to="/student/lessons"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-foreground text-xs sm:text-sm font-medium transition-colors cursor-pointer min-h-[44px]"
                  >
                    <span>{isAr ? 'عرض تفاصيل الدرس' : 'View Lesson Details'}</span>
                  </Link>
                </div>
              </div>
            ) : lastEligibleBooking && lastBookingSummary ? (
              <div className="rounded-2xl border border-primary/20 bg-surface p-6 sm:p-7 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="w-4 h-4 text-primary" />
                      <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                        {isAr ? 'مواصلة مسارك التعليمي' : 'Ready for your next session?'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
                      {isAr ? 'حجز درس جديد بنفس التفضيلات السابقة' : 'Continue from where you left off'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                      {isAr
                        ? `آخر درس لك: ${lastBookingSummary.summaryText}. يمكنك الحجز بضغطة زر وتحديد الموعد.`
                        : `Your last lesson was: ${lastBookingSummary.summaryText}. Pick a date and time with the same details.`}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    <Link
                      id="btn-home-repeat-lesson"
                      to="/student/book?repeat=true"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs min-h-[44px]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isAr ? 'حجز الدرس السابق' : 'Book with same details'}</span>
                    </Link>
                    <Link
                      to="/student/book"
                      className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
                    >
                      <span>{isAr ? 'استكشاف المواد' : 'Explore Topics'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* Compact purposeful empty state (NO giant empty rectangle!) */
              <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-serif font-bold text-foreground">
                    {isAr ? 'لا يوجد درس مجدول حالياً' : 'No lesson scheduled yet'}
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md">
                    {isAr
                      ? 'احجز موعد جلستك الفردية القادمة مع الأستاذ محمود عندما تكون مستعداً.'
                      : 'Book your next private 1-on-1 lesson with Ustadh Mahmoud when you are ready.'}
                  </p>
                </div>

                <Link
                  to="/student/book"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px]"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAr ? 'حجز درس جديد' : 'Book a Lesson'}</span>
                </Link>
              </div>
            )}
          </section>

          {/* RECENT LESSONS SECTION (Clean flat list with subtle dividers — NO trapped scrollbar!) */}
          <section className="space-y-3" aria-labelledby="recent-lessons-heading">
            <div className="flex items-center justify-between">
              <h2 id="recent-lessons-heading" className="text-base sm:text-lg font-serif font-bold text-foreground">
                {isAr ? 'أحدث الدروس والجلسات' : 'Recent Lessons'}
              </h2>
              <Link
                to="/student/lessons"
                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                <span>{isAr ? 'عرض كامل السجل' : 'View all lessons'}</span>
                <ArrowRight className={`w-3 h-3 ${isAr ? 'rotate-180' : ''}`} />
              </Link>
            </div>

            {recentLessons.length === 0 ? (
              <div className="p-6 rounded-2xl border border-border bg-surface text-center">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {isAr
                    ? 'لم تكتمل أي دروس بعد. ستظهر جلساتك السابقة وملاحظات الأستاذ محمود هنا.'
                    : 'No past lessons recorded yet. Completed sessions and teacher feedback will appear here.'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border border border-border rounded-2xl bg-surface overflow-hidden">
                {recentLessons.map((b: any) => {
                  const dateStr = b.scheduledStart || b.scheduled_start || b.lesson_date;
                  const dt = dateStr ? DateTime.fromISO(dateStr) : null;
                  const title = b.serviceTitle || b.services?.title || (isAr ? 'جلسة تعليمية' : 'Private Lesson');
                  const bServiceId = b.serviceId || b.service_id;

                  return (
                    <div
                      key={b.id || b.referenceCode}
                      className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-subtle/50 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm sm:text-base text-foreground truncate">
                            {title}
                          </h4>
                          <Badge variant={b.status === 'completed' ? 'success' : b.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-[11px] px-2 py-0">
                            {b.status}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          {dt && dt.isValid && (
                            <span>{dt.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY)}</span>
                          )}
                          <span>•</span>
                          <span>{b.durationMinutes || b.duration || 45} {isAr ? 'دقيقة' : 'mins'}</span>
                          {b.referenceCode && (
                            <>
                              <span>•</span>
                              <span className="font-mono text-[11px]">{b.referenceCode}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <Link
                          to="/student/lessons"
                          className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface text-foreground text-xs font-medium transition-colors"
                        >
                          {isAr ? 'التفاصيل' : 'Details'}
                        </Link>

                        <Link
                          id={`btn-repeat-history-${b.id}`}
                          to={`/student/book?repeat=true${bServiceId ? `&service=${bServiceId}` : ''}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>{isAr ? 'حجز مجدداً' : 'Rebook'}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: 4 COLS (Learning Snapshot, Package Status, Billing Status, Teacher Connection) */}
        <aside className="lg:col-span-4 space-y-6">
          
          {/* 1. LEARNING SNAPSHOT (Explicit labels, factual metrics only) */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'ملخص التعلم' : 'Learning Snapshot'}
              </span>
              <Award className="w-4 h-4 text-primary" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-start">
              <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'دروس مكتملة' : 'completed lessons'}
                </span>
                <span className="text-xl font-serif font-bold text-foreground">
                  {completedLessonsCount}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-surface-subtle border border-border">
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'دروس قادمة' : 'upcoming lessons'}
                </span>
                <span className="text-xl font-serif font-bold text-primary">
                  {upcomingBookings.length}
                </span>
              </div>
            </div>

            <div className="space-y-1.5 pt-1 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{isAr ? 'المستوى التعليمي:' : 'Current Level:'}</span>
                <span className="font-semibold text-foreground capitalize">
                  {profile?.currentLevel || (isAr ? 'مبتدئ' : 'Beginner')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>{isAr ? 'نوع المتعلم:' : 'Learner Type:'}</span>
                <span className="font-semibold text-foreground capitalize">
                  {profile?.learnerType || (isAr ? 'طالب' : 'Student')}
                </span>
              </div>
            </div>
          </div>

          {/* 2. PACKAGE BALANCE SNAPSHOT (Independent loading/error/active state) */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'رصيد الباقات' : 'Package Credits'}
              </span>
              <Package className="w-4 h-4 text-primary" />
            </div>

            {packagesLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{isAr ? 'جاري تحميل الباقات...' : 'Loading packages...'}</span>
              </div>
            ) : packagesError ? (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-2">
                <p className="text-destructive font-medium">
                  {isAr ? 'تعذر تحميل بيانات الباقات' : 'Unable to load package details.'}
                </p>
                <button
                  type="button"
                  onClick={fetchPackagesData}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isAr ? 'إعادة المحاولة' : 'Try again'}</span>
                </button>
              </div>
            ) : creditsRemaining > 0 ? (
              /* Active package display */
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-serif font-bold text-primary">
                    {creditsRemaining}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isAr ? 'حصص متبقية' : 'credits remaining'}
                  </span>
                </div>

                {packagesData?.creditSummary && (
                  <div className="grid grid-cols-2 gap-2 text-xs p-2.5 rounded-lg bg-surface-subtle border border-border text-muted-foreground">
                    <div>
                      <span>{isAr ? 'المستخدم:' : 'Used:'} </span>
                      <span className="font-semibold text-foreground">
                        {packagesData.creditSummary.totalUsed ?? 0}
                      </span>
                    </div>
                    <div>
                      <span>{isAr ? 'الإجمالي:' : 'Total:'} </span>
                      <span className="font-semibold text-foreground">
                        {packagesData.creditSummary.totalPurchased ?? creditsRemaining}
                      </span>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isAr 
                    ? 'لديك حصص مدفوعة مسبقاً جاهزة للحجز مع الأستاذ محمود.' 
                    : 'You have active prepaid credits ready to use for upcoming lessons.'}
                </p>

                <Link
                  to="/student/book"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary/10 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <span>{isAr ? 'احجز باستخدام الرصيد' : 'Book using a lesson credit'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            ) : (
              /* No active package */
              <div className="space-y-3">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {isAr ? 'هل أنت مستعد لدرسك القادم؟' : 'Ready for your next lesson?'}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {isAr 
                      ? 'الباقات المدفوعة مسبقاً توفر تعليماً منظماً أسبوعياً أو شهرياً بأسعار مخفضة.' 
                      : 'Choose what to learn and find an available time with Ustadh Mahmoud.'}
                  </p>
                </div>

                <Link
                  to="/student/book"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface hover:bg-surface-subtle border border-border hover:border-primary/40 text-foreground hover:text-primary text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                >
                  <span>{isAr ? 'احجز درساً' : 'Book a lesson'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            )}
          </div>

          {/* 3. PAYMENT STATUS SNAPSHOT (Independent loading/error/factual payment state) */}
          <div className="rounded-2xl border border-border bg-surface p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'حالة المدفوعات' : 'Payment Status'}
              </span>
              <CreditCard className="w-4 h-4 text-primary" />
            </div>

            {paymentsLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>{isAr ? 'جاري تحميل المدفوعات...' : 'Loading payments...'}</span>
              </div>
            ) : paymentsError ? (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs space-y-2">
                <p className="text-destructive font-medium">
                  {isAr ? 'تعذر تحميل بيانات المدفوعات' : 'Unable to load payment status.'}
                </p>
                <button
                  type="button"
                  onClick={fetchPaymentsData}
                  className="inline-flex items-center gap-1.5 text-xs text-destructive hover:underline font-semibold cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{isAr ? 'إعادة المحاولة' : 'Try again'}</span>
                </button>
              </div>
            ) : pendingPaymentBookings.length > 0 || (paymentsData && paymentsData.some(p => p.status === 'pending')) ? (
              /* Pending verification state */
              <div className="p-3 rounded-xl bg-warning/10 border border-warning/25 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-warning">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? 'دفعة معلقة بانتظار التحقق' : 'Payment pending verification'}</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {isAr
                    ? 'أرسل تفاصيل الحوالة البنكية لتأكيد الحجز ومتابعة الدرس.'
                    : 'Submit your transfer reference so Ustadh Mahmoud can verify your slot.'}
                </p>
                <Link
                  to="/student/payments"
                  className="inline-block text-xs font-semibold text-primary hover:underline"
                >
                  {isAr ? 'عرض المدفوعات وإرسال الإثبات ←' : 'View payments & submit proof →'}
                </Link>
              </div>
            ) : paymentsData && paymentsData.some(p => p.status === 'verified') ? (
              /* Verified payments state */
              <div className="space-y-2">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="text-foreground font-medium">
                    {isAr ? 'تم التحقق من المدفوعات السابقة بنجاح.' : 'Payment verified.'}
                  </span>
                </div>
                <Link
                  to="/student/payments"
                  className="text-xs text-primary hover:underline font-medium block pt-1"
                >
                  {isAr ? 'عرض إيصالات المدفوعات ←' : 'View verified payment receipts →'}
                </Link>
              </div>
            ) : paymentsData && paymentsData.some(p => p.status === 'rejected') ? (
              /* Rejected payment state */
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-semibold text-destructive">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{isAr ? 'تم رفض إثبات الدفع' : 'Payment rejected'}</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {isAr
                    ? 'يرجى التحقق من تفاصيل الإيصال أو التواصل مع الأستاذ محمود.'
                    : 'Please review your transfer details or submit a corrected claim.'}
                </p>
                <Link
                  to="/student/payments"
                  className="inline-block text-xs font-semibold text-destructive hover:underline"
                >
                  {isAr ? 'مراجعة المدفوعات ←' : 'Review payments →'}
                </Link>
              </div>
            ) : (
              /* Factual No payment history yet */
              <div className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'لا يوجد سجل مدفوعات مسجل حتى الآن.' : 'No payment history yet.'}
                </p>
                <Link
                  to="/student/payments"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-surface hover:bg-surface-subtle border border-border text-foreground hover:text-primary text-xs font-medium transition-all shadow-2xs"
                >
                  <span>{isAr ? 'عرض صفحة المدفوعات' : 'View Payments'}</span>
                  <ArrowRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            )}
          </div>

          {/* 4. TEACHER RELATIONSHIP NOTE */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-3 text-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm">
                م
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  {isAr ? 'الأستاذ محمود العلواني' : 'Ustadh Mahmoud'}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'معلمك الخاص' : 'Your 1-on-1 Mentor'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? 'هل لديك استفسار حول خطتك التعليمية أو تحتاج لمراجعة تقدمك؟ تواصل مباشرة عبر واتساب.'
                : 'Need to coordinate your lesson plan or have questions about what to prepare? You can message Mahmoud directly on WhatsApp.'}
            </p>

            <a
              href="https://wa.me/201021464424"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-xs font-semibold text-primary hover:underline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{isAr ? 'محادثة مباشرة على واتساب' : 'Direct WhatsApp message'}</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </a>
          </div>

        </aside>
      </div>

      {/* Payment Claim Modal for quick actions */}
      {paymentClaimBooking && (
        <StudentPaymentClaimModal
          isOpen={Boolean(paymentClaimBooking)}
          onClose={() => setPaymentClaimBooking(null)}
          bookingReference={paymentClaimBooking.referenceCode || paymentClaimBooking.reference_code}
          itemTitle={paymentClaimBooking.serviceTitle || paymentClaimBooking.services?.title}
          amount={paymentClaimBooking.feeAmountUsd || paymentClaimBooking.fee_amount_usd}
          sessionToken={session?.access_token}
          lang={lang}
          onClaimSuccess={() => {
            setPaymentClaimBooking(null);
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}
