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
      // Explicit session state — never let a missing/expired session silently
      // look like an empty package balance.
      if (!token) {
        setPackagesError(
          isAr ? 'جلسة الدخول غير متاحة أو منتهية' : 'Your session is unavailable or has expired'
        );
        return;
      }

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
      // Explicit session state — never let a missing/expired session silently
      // look like an empty payment history.
      if (!token) {
        setPaymentsError(
          isAr ? 'جلسة الدخول غير متاحة أو منتهية' : 'Your session is unavailable or has expired'
        );
        return;
      }

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
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
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

  // Authoritative "verified/paid" signal, derived ONLY from the existing
  // reconciliation contract. NOTE: the canonical server payment status enum is
  // 'pending' | 'confirmed' | 'rejected' | 'refunded' (api/index.ts) — there is
  // NO 'verified' value, so we never test for one. Booking-linked payments reuse
  // getBookingPaymentSummary; package/unlinked payments use the real server
  // status 'confirmed'.
  const hasVerifiedPayment =
    bookings.some(b => getBookingPaymentSummary(b, paymentsData || []).payment_status === 'paid') ||
    (paymentsData || []).some(p => p.status === 'confirmed');

  return (
    <div className="space-y-8 animate-fade-in text-start pb-12">
      {/* ========================================================================= */}
      {/* 1. OVERVIEW HEADER (Only place where greeting lives) */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-heading-xl text-foreground">
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
        
                  </div>
                </div>
              </div>
            ) : (
              /* Compact purposeful empty state (NO giant empty rectangle!) */
              <div className="rounded-2xl border border-border bg-surface p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
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
              <h2 id="recent-lessons-heading" className="text-base sm:text-lg font-display font-bold text-foreground">
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary/30 hover:bg-primary text-primary hover:text-primary-foreground text-xs font-semibold transition-all cursor-pointer"
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
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'ملخص التعلم' : 'Learning Snapshot'}
              </span>
              <Award className="w-4 h-4 text-accent" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-start">
              <div className="py-2 border-b border-border/50">
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'دروس مكتملة' : 'completed lessons'}
                </span>
                <span className="text-heading-md text-foreground">
                  {completedLessonsCount}
                </span>
              </div>

              <div className="py-2 border-b border-border/50">
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'دروس قادمة' : 'upcoming lessons'}
                </span>
                <span className="text-heading-md text-primary">
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
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'رصيد الباقات' : 'Package Credits'}
              </span>
              <Package className="w-4 h-4 text-accent" />
            </div>

            {packagesLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
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
                  <span className="text-heading-lg text-primary">
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

                
              </div>
            )}
          </div>

          {/* 3. PAYMENT STATUS SNAPSHOT (Independent loading/error/factual payment state) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {isAr ? 'حالة المدفوعات' : 'Payment Status'}
              </span>
              <CreditCard className="w-4 h-4 text-accent" />
            </div>

            {paymentsLoading ? (
              <div className="py-4 flex items-center justify-center gap-2 text-muted-foreground text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-accent" />
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
            ) : hasVerifiedPayment ? (
              /* Verified payments state (derived from authoritative reconciliation) */
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
          <div className="rounded-2xl border border-secondary/50 bg-secondary/20 p-5 space-y-3 text-start">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-secondary/30 text-accent flex items-center justify-center font-bold text-sm">
                {profile?.assignedTeacherName ? profile.assignedTeacherName.charAt(0) : 'و'}
              </div>
              <div>
                <span className="text-xs font-semibold text-foreground block">
                  {profile?.assignedTeacherName || (isAr ? 'جارٍ تعيين المعلم' : 'Teacher assignment pending')}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {isAr ? 'معلمك الخاص' : 'Your 1-on-1 Mentor'}
                </span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {isAr
                ? 'هل لديك استفسار حول خطتك التعليمية أو تحتاج لمراجعة تقدمك؟ تواصل مباشرة عبر واتساب.'
                : 'Need to coordinate your lesson plan or have questions about what to prepare? You can message Ustadh Mahmoud directly on WhatsApp.'}
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
