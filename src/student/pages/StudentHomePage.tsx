import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
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
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { findLastEligibleBooking, formatLastBookingSummary } from './StudentBookingPage';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { StudentPaymentClaimModal } from '../components/StudentPaymentClaimModal';

export interface StudentHomePageProps {
  lang?: 'en' | 'ar';
}

export default function StudentHomePage({ lang = 'en' }: StudentHomePageProps) {
  const { session, user } = useTeacherAuth();
  const [profile, setProfile] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [packagesData, setPackagesData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick claim modal
  const [paymentClaimBooking, setPaymentClaimBooking] = useState<any | null>(null);

  const isAr = lang === 'ar';

  useEffect(() => {
    let isMounted = true;
    const fetchStudentData = async () => {
      try {
        setLoading(true);
        setError(null);

        const token = session?.access_token;
        if (!token) {
          throw new Error(isAr ? 'جلسة تسجيل الدخول منتهية' : 'No active session token found');
        }

        const headers = { Authorization: `Bearer ${token}` };

        const [profileRes, bookingsRes, packagesRes] = await Promise.all([
          fetch('/api/student/me', { headers }),
          fetch('/api/student/bookings', { headers }),
          fetch('/api/student/packages', { headers })
        ]);

        if (!profileRes.ok) {
          throw new Error(isAr ? 'فشل تحميل الملف الشخصي' : 'Failed to load profile');
        }

        const profileData = await profileRes.json();
        const bookingsData = bookingsRes.ok ? await bookingsRes.json() : [];
        const packData = packagesRes.ok ? await packagesRes.json() : null;

        if (isMounted) {
          setProfile(profileData);
          setBookings(Array.isArray(bookingsData) ? bookingsData : []);
          setPackagesData(packData);
        }
      } catch (err: any) {
        console.error('Error loading student dashboard data:', err);
        if (isMounted) {
          setError(err.message || (isAr ? 'تعذر تحميل بيانات الطالب' : 'Unable to load dashboard data'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStudentData();
    return () => {
      isMounted = false;
    };
  }, [session, isAr]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs sm:text-sm text-muted-foreground">
          {isAr ? 'جارٍ تحميل جدول دروسك...' : 'Loading your lesson schedule...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto my-8 p-6 bg-surface border border-destructive/20 rounded-2xl shadow-xs text-center">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-1">
          {isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Could not load your student dashboard'}
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-5 leading-relaxed">{error}</p>
        <button
          onClick={() => window.location.reload()}
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

  // Resolve the most recent completed booking for repeating
  const lastEligibleBooking = findLastEligibleBooking(bookings);
  const lastBookingSummary = lastEligibleBooking ? formatLastBookingSummary(lastEligibleBooking, profile) : null;

  // Validate zoom link using tested invariant
  const rawZoom = (nextBooking?.zoomMeetingLink || nextBooking?.zoom_join_url || '').trim();
  const hasValidZoomUrl = Boolean(rawZoom && (rawZoom.startsWith('https://') || rawZoom.startsWith('http://')));

  const studentFirstName = profile?.name ? profile.name.split(' ')[0] : '';

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* 1. Welcoming & Personal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-foreground">
            {isAr
              ? `أهلاً بك${studentFirstName ? ` يا ${studentFirstName}` : ''} في بوابتك التعليمية`
              : `Welcome back${studentFirstName ? `, ${studentFirstName}` : ''}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
            {isAr
              ? 'متابعة مواعيد جلساتك المباشرة مع الأستاذ محمود ومراجعة مسيرتك التعليمية.'
              : 'Direct 1-on-1 mentorship with Ustadh Mahmoud. Here is your current schedule and learning history.'}
          </p>
        </div>

        {/* Status Pill */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            {profile?.learnerType || (isAr ? 'طالب منتظم' : 'Active Learner')}
          </Badge>
          {profile?.timezone && (
            <span className="text-xs text-muted-foreground hidden sm:inline-block">
              {profile.timezone}
            </span>
          )}
        </div>
      </div>

      {/* 2. Quick Navigation Bento Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Card 1: My Lessons */}
        <Link
          to="/student/lessons"
          className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {isAr ? 'جدول الدروس' : 'My Lessons'}
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
              {bookings.length} {isAr ? 'درس' : 'sessions'}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {isAr ? 'عرض كافة المواعيد والروابط' : 'View schedule & Zoom links'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Calendar className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 2: Package Credits */}
        <Link
          to="/student/packages"
          className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {isAr ? 'رصيد الباقات' : 'Package Credits'}
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-primary">
              {packagesData?.creditSummary?.totalRemaining ?? 0} {isAr ? 'درس متاح' : 'available'}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {isAr ? 'باقات فردية مسبقة الدفع' : 'Manage prepaid lesson balance'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <Package className="w-5 h-5" />
          </div>
        </Link>

        {/* Card 3: Payments & Billing */}
        <Link
          to="/student/payments"
          className="p-4 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex items-center justify-between group cursor-pointer"
        >
          <div className="space-y-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              {isAr ? 'المدفوعات' : 'Payments & Billing'}
            </span>
            <div className="text-xl sm:text-2xl font-serif font-bold text-foreground group-hover:text-primary transition-colors">
              {isAr ? 'سجل التحويلات' : 'Billing & Claims'}
            </div>
            <span className="text-[11px] text-muted-foreground block">
              {isAr ? 'إرسال إثبات ومتابعة التحقق' : 'Submit reference & track status'}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all">
            <CreditCard className="w-5 h-5" />
          </div>
        </Link>
      </div>

      {/* 3. Main Dashboard Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Next Session Focus Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">
                      {isAr ? 'الدرس القادم المجدول' : 'Next Scheduled Session'}
                    </CardTitle>
                    <CardDescription>
                      {nextBooking
                        ? (isAr ? 'موعد درسك القادم المباشر' : 'Your upcoming 1-on-1 private lesson')
                        : (isAr ? 'لا يوجد درس مجدول حالياً' : 'No upcoming sessions scheduled right now')}
                    </CardDescription>
                  </div>
                </div>

                {nextBooking && (
                  <Badge variant={nextBooking.status === 'confirmed' ? 'success' : nextBooking.status === 'pending' ? 'warning' : 'secondary'}>
                    {nextBooking.status === 'pending' ? (isAr ? 'في انتظار الدفع' : 'Pending Payment') : nextBooking.status}
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent>
              {nextBooking ? (
                <div className="space-y-5 pt-2">
                  <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle border border-border-subtle">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <h3 className="font-serif font-bold text-lg sm:text-xl text-foreground">
                        {nextBooking.serviceTitle || nextBooking.services?.title || (isAr ? 'جلسة تعليمية' : 'Private Lesson')}
                      </h3>
                      {nextBooking.referenceCode && (
                        <span className="font-mono text-xs text-muted-foreground">
                          Ref: {nextBooking.referenceCode}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-y-2 gap-x-4 text-xs sm:text-sm text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>
                          {DateTime.fromISO(nextBooking.scheduledStart || nextBooking.scheduled_start || nextBooking.lesson_date)
                            .setLocale(isAr ? 'ar' : 'en')
                            .toLocaleString(DateTime.DATETIME_MED_WITH_WEEKDAY)}
                        </span>
                      </div>
                      {(nextBooking.durationMinutes || nextBooking.duration) && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium text-foreground">
                            {nextBooking.durationMinutes || nextBooking.duration} {isAr ? 'دقيقة' : 'minutes'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Pending payment callout */}
                    {nextBooking.status === 'pending' && (
                      <div className="mt-3 pt-3 border-t border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-warning">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>
                            {isAr
                              ? 'هذا الدرس في انتظار تأكيد الحوالة البنكية أو وسيلة الدفع'
                              : 'This lesson is awaiting bank transfer or payment verification'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentClaimBooking(nextBooking)}
                          className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg font-semibold transition-colors cursor-pointer text-xs shrink-0"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>{isAr ? 'إرسال إثبات الدفع' : 'Submit Claim'}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Zoom Action Block */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {hasValidZoomUrl ? (
                      <a
                        id="btn-join-zoom"
                        href={rawZoom}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl font-medium text-sm transition-all shadow-xs min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <Video className="w-4 h-4" />
                        <span>{isAr ? 'دخول الفصل الافتراضي (زووم)' : 'Join Zoom Classroom'}</span>
                        <ExternalLink className="w-4 h-4 ml-1" />
                      </a>
                    ) : (
                      <div className="p-4 rounded-xl bg-surface-subtle border border-border-subtle flex items-start gap-3 text-xs sm:text-sm text-muted-foreground flex-1">
                        <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <div>
                          <span className="font-medium text-foreground block">
                            {isAr ? 'رابط زووم قيد الإعداد' : 'Meeting link will appear soon'}
                          </span>
                          <span className="text-xs mt-0.5 block">
                            {isAr
                              ? 'سيتوفر الرابط المباشر هنا قبل موعد الدرس بوقت كافٍ، وسيتم إرساله أيضاً عبر وسيلة التواصل المحددة.'
                              : 'Ustadh Mahmoud prepares the Zoom room prior to the scheduled start. The direct join button will activate here.'}
                          </span>
                        </div>
                      </div>
                    )}

                    <Link
                      to="/student/lessons"
                      className="px-4 py-3 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors text-center min-h-[44px] flex items-center justify-center"
                    >
                      {isAr ? 'تفاصيل الموعد والخيارات' : 'Session Options & Details'}
                    </Link>
                  </div>

                  {/* Optional quick repeat link when upcoming booking exists */}
                  {lastEligibleBooking && (
                    <div className="pt-3 border-t border-border-subtle flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {isAr ? 'هل تريد تكرار درس سابق أيضاً؟' : 'Need another session on your previous topic?'}
                      </span>
                      <Link
                        id="link-home-repeat-lesson"
                        to="/student/book?repeat=true"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline py-1"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'حجز نفس موضوع الدرس السابق' : 'Repeat last topic'}</span>
                      </Link>
                    </div>
                  )}
                </div>
              ) : lastEligibleBooking ? (
                /* Prompt to repeat or schedule next session */
                <div className="py-3 space-y-4">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{isAr ? 'جاهز لدرسك القادم؟' : 'Ready for your next session'}</span>
                  </div>

                  <div>
                    <h3 className="font-serif font-semibold text-lg sm:text-xl text-foreground">
                      {lastBookingSummary?.serviceTitle || (isAr ? 'متابعة ما تم تعلمه' : 'Continue Your Learning')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      {lastBookingSummary?.summaryText
                        ? (isAr ? `آخر درس مكتمل: ${lastBookingSummary.summaryText}` : `Last completed session: ${lastBookingSummary.summaryText}`)
                        : (isAr ? 'تابع من حيث توقفت مع الأستاذ محمود.' : 'Continue right from where you left off with Ustadh Mahmoud.')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Link
                      id="btn-home-repeat-lesson"
                      to="/student/book?repeat=true"
                      className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs min-h-[44px]"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>{isAr ? 'تكرار الدرس السابق' : 'Repeat Last Lesson'}</span>
                    </Link>
                    <Link
                      id="btn-home-book-different"
                      to="/student/book"
                      className="inline-flex items-center justify-center py-3 px-5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-xs sm:text-sm font-medium transition-colors min-h-[44px]"
                    >
                      <span>{isAr ? 'استكشاف الموضوعات' : 'Explore Topics'}</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* First-time welcoming state */
                <div className="text-center py-8 px-4 space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-semibold text-foreground">
                      {isAr ? 'ابدأ أولى جلساتك مع الأستاذ محمود' : 'Start Your First Lesson'}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto mt-1 leading-relaxed">
                      {isAr
                        ? 'مرحباً بك في بوابتك التعليمية. يمكنك حجز جلستك التجريبية المجانية (٣٠ دقيقة) أو جدولة درسك الأول مباشرة.'
                        : 'Welcome to your student portal. Schedule your 30-minute introductory trial or choose your first subject.'}
                    </p>
                  </div>
                  <Link
                    to="/student/book"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-medium transition-colors shadow-xs min-h-[44px]"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAr ? 'حجز درس أو جلسة تجريبية' : 'Book a Lesson / Free Trial'}</span>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Booking Callout */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                {isAr ? 'إجراء سريع' : 'Quick Action'}
              </p>
              <h3 className="mt-1 text-base font-semibold text-foreground">
                {isAr ? 'جدولة موعد درس جديد' : 'Schedule Another Lesson'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isAr
                  ? 'اختر من بين علوم القرآن، التجويد، الحفظ، الدراسات الإسلامية، أو العربية.'
                  : 'Choose from Quran recitation, Tajweed, Hifz, Islamic Studies, or Arabic.'}
              </p>
            </div>
            <Link
              to="/student/book"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs sm:text-sm font-semibold transition-colors shadow-xs shrink-0 min-h-[44px]"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'حجز درس جديد' : 'Book New Lesson'}</span>
            </Link>
          </div>
        </div>

        {/* Right 1 Column: Learning History Card */}
        <div className="lg:col-span-1">
          <Card className="border-border h-full flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <BookOpen className="w-4 h-4" />
                </div>
                <CardTitle className="text-base sm:text-lg">
                  {isAr ? 'سجل الدروس السابقة' : 'Learning History'}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col">
              {bookings.length > 0 ? (
                <>
                  <ul 
                    className="space-y-2.5 overflow-y-auto max-h-[340px] pe-1"
                    aria-label={isAr ? 'قائمة الدروس السابقة' : 'Past lessons list'}
                  >
                    {bookings.slice(0, 6).map(b => {
                      const isRepeatable = b.status === 'completed' || b.status === 'confirmed';
                      const bServiceId = b.serviceId || b.service_id || '';
                      const dateObj = DateTime.fromISO(b.scheduledStart || b.scheduled_start || b.lesson_date);

                      return (
                        <li
                          key={b.id}
                          className="p-3 rounded-xl bg-surface-subtle border border-border-subtle flex items-center justify-between gap-3 text-start"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                              {b.serviceTitle || b.services?.title || (isAr ? 'درس فردي' : 'Private Lesson')}
                            </div>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {dateObj.isValid
                                ? dateObj.setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED)
                                : ''}
                              {(b.durationMinutes || b.duration) && ` • ${b.durationMinutes || b.duration} ${isAr ? 'د' : 'min'}`}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge 
                              variant={b.status === 'completed' ? 'success' : b.status === 'pending' ? 'warning' : 'secondary'}
                              className="text-[10px] uppercase font-medium px-2 py-0.5"
                            >
                              {b.status}
                            </Badge>
                            {isRepeatable && (
                              <Link
                                id={`btn-repeat-history-${b.id}`}
                                to={`/student/book?repeat=true${bServiceId ? `&service=${bServiceId}` : ''}`}
                                className="p-1.5 rounded-lg text-primary hover:bg-primary/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
                                title={isAr ? 'حجز نفس موضوع هذا الدرس' : 'Repeat this lesson topic'}
                                aria-label={isAr ? 'حجز نفس موضوع هذا الدرس' : 'Repeat this lesson topic'}
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="pt-3 mt-auto border-t border-border-subtle">
                    <Link
                      to="/student/lessons"
                      className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 bg-surface-subtle hover:bg-surface text-foreground border border-border rounded-xl text-xs font-semibold transition-colors"
                    >
                      <span>{isAr ? 'عرض جدول كافة الدروس' : 'View All Lessons'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="text-center py-10 px-4 my-auto">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {isAr
                      ? 'لا توجد دروس مكتملة مسجلة بعد. عند إتمام جلساتك مع الأستاذ محمود، ستظهر هنا تفاصيل سجل التعلم.'
                      : 'No past lessons recorded yet. Completed lessons with Ustadh Mahmoud will appear here.'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Payment Claim Modal */}
      {paymentClaimBooking && (
        <StudentPaymentClaimModal
          isOpen={Boolean(paymentClaimBooking)}
          onClose={() => setPaymentClaimBooking(null)}
          bookingReference={paymentClaimBooking.referenceCode}
          itemTitle={paymentClaimBooking.serviceTitle}
          amount={paymentClaimBooking.feeAmountUsd}
          lang={lang}
          sessionToken={session?.access_token}
          onClaimSuccess={() => {
            // refresh data
            fetch('/api/student/bookings', { headers: { Authorization: `Bearer ${session?.access_token}` } })
              .then(res => res.json())
              .then(data => setBookings(Array.isArray(data) ? data : []));
          }}
        />
      )}
    </div>
  );
}
