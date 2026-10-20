import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  Calendar,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Clock,
  ShieldCheck,
  UserPlus,
  CreditCard,
  ArrowRight,
  RefreshCw,
  BookOpen
} from 'lucide-react';
import { SuperAdminOverviewMetrics } from '../types';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { CompactCalendar, InboxCard, DASH_CARD } from '../components/DashboardCards';
import { FollowUpsCard } from '../components/FollowUps';

export default function OverviewPage() {
  const { t } = useT();
  const [metrics, setMetrics] = useState<SuperAdminOverviewMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/overview-metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message || t("The overview couldn't be loaded.", 'تعذر تحميل النظرة العامة.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 animate-spin text-accent opacity-60" />
      </div>
    );
  }

  if (error || !metrics) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 text-center text-destructive">
        <AlertCircle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium text-sm">{error || t("The overview couldn't be loaded.", 'تعذر تحميل النظرة العامة.')}</p>
        <button
          onClick={() => fetchOverview(true)}
          className="mt-4 px-4 py-2 bg-destructive/20 hover:bg-destructive/30 rounded-xl text-sm font-semibold transition-colors"
        >
          {t('Try again', 'حاول تاني')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in text-start pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-secondary/30 text-primary border border-secondary/50">
              {t('Admin', 'المدير')}
            </span>
            <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-foreground">
              {t('Overview', 'نظرة عامة')}
            </h1>
          </div>
          <p className="text-sm sm:text-sm text-muted-foreground mt-1">
            {t('Students, teachers and lessons at a glance.', 'الطلاب والمعلمين والحصص في نظرة واحدة.')}
          </p>
        </div>
        <button
          onClick={() => fetchOverview(true)}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold glass-card hover:bg-surface-subtle border border-border text-foreground transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{t('Refresh', 'تحديث')}</span>
        </button>
      </div>

      <FollowUpsCard />

      {/* Action Alerts / Attention Banners */}
      {(metrics.unassigned_students > 0 || metrics.students_needing_attention > 0 || metrics.pending_payments > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {metrics.unassigned_students > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  {t(`${metrics.unassigned_students} student(s) without a teacher`, `${metrics.unassigned_students} طالب من غير معلم`)}
                </p>
                <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
                  {t('Give them a teacher so they can book.', 'اختار لهم معلم علشان يقدروا يحجزوا.')}
                </p>
                <Link
                  to="/dashboard/students"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 hover:underline mt-2"
                >
                  {t('Assign teachers', 'اختار معلمين')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {metrics.students_needing_attention > 0 && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {t(`${metrics.students_needing_attention} item(s) need attention`, `${metrics.students_needing_attention} حاجة محتاجة متابعة`)}
                </p>
                <p className="text-[11px] text-red-700/80 dark:text-red-300/80 mt-0.5">
                  {t('Lessons without an outcome or a missing Zoom link.', 'حصص من غير نتيجة أو من غير رابط Zoom.')}
                </p>
                <Link
                  to="/dashboard/today"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-800 dark:text-red-300 hover:underline mt-2"
                >
                  {t('Review', 'راجع')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}

          {metrics.pending_payments > 0 && (
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                  {t(`${metrics.pending_payments} payment(s) to check`, `${metrics.pending_payments} دفع محتاج مراجعة`)}
                </p>
                <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 mt-0.5">
                  {t('Students reported a payment; please confirm it.', 'طلاب بلّغوا إنهم دفعوا؛ أكّد الدفع.')}
                </p>
                <Link
                  to="/dashboard/bookings"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-800 dark:text-blue-300 hover:underline mt-2"
                >
                  {t('Check payments', 'راجع المدفوعات')} <ArrowRight className="w-3 h-3 rtl:rotate-180" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Core Platform KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-teal/10 dark:bg-teal/15 rounded-[1.25rem] p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider">{t('Active students', 'طلاب نشطين')}</span>
            <Users className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {metrics.active_students}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">+{metrics.new_students_30d}</span>
            <span>{t('new in the last 30 days', 'جداد في آخر 30 يوم')}</span>
          </div>
        </div>
        <div className="bg-[#8B4935]/10 dark:bg-[#DA7960]/15 rounded-[1.25rem] p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider">{t('Active teachers', 'معلمين نشطين')}</span>
            <ShieldCheck className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {metrics.active_teachers}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <Link to="/dashboard/teachers" className="text-primary hover:underline font-medium">
              {t('Manage teachers', 'إدارة المعلمين')} →
            </Link>
          </div>
        </div>
        <div className="bg-crimson/10 dark:bg-crimson/15 rounded-[1.25rem] p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider">{t('Lessons today', 'حصص النهارده')}</span>
            <Clock className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {metrics.lessons_today}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span>{t(`${metrics.lessons_this_week} this week`, `${metrics.lessons_this_week} الأسبوع ده`)}</span>
          </div>
        </div>
        <div className="bg-[#E5A93C]/15 rounded-[1.25rem] p-5">
          <div className="flex items-center justify-between text-muted-foreground mb-3">
            <span className="text-sm font-semibold uppercase tracking-wider">{t('Upcoming trials', 'تجارب جاية')}</span>
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {metrics.trials_upcoming}
          </p>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <span>{t(`${metrics.trials_total} trials in total`, `${metrics.trials_total} تجربة إجمالي`)}</span>
          </div>
      </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] items-start">
      {/* Teacher Capacity & Assignment Distribution */}
      <div className={`${DASH_CARD} p-6 space-y-4 min-w-0`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-display font-semibold text-foreground">
              {t('Teachers & their students', 'المعلمين وطلابهم')}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('How many students and lessons each teacher has.', 'كل معلم معاه كام طالب وكام حصة.')}
            </p>
          </div>
          <Link
            to="/dashboard/teachers"
            className="text-sm font-semibold text-primary hover:underline"
          >
            {t('All teachers', 'كل المعلمين')} →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-start text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[13px]">
                <th className="py-2.5 px-3">{t('Teacher', 'المعلم')}</th>
                <th className="py-2.5 px-3">{t('Role', 'الدور')}</th>
                <th className="py-2.5 px-3 text-center">{t('Active students', 'طلاب نشطين')}</th>
                <th className="py-2.5 px-3 text-center">{t('Lessons this week', 'حصص الأسبوع ده')}</th>
                <th className="py-2.5 px-3 text-end"><span className="sr-only">{t('Actions', 'إجراءات')}</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {metrics.teacher_capacity.map((tc) => (
                <tr key={tc.email} className="hover:bg-surface-subtle transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-foreground">{tc.name}</div>
                    <div className="text-[11px] text-muted-foreground" dir="ltr">{tc.email}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded text-[13px] font-semibold uppercase tracking-wider ${
                      tc.role === 'super_admin' ? 'bg-secondary/30 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {tc.role === 'super_admin' ? t('Admin', 'مدير') : t('Teacher', 'معلم')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-foreground">
                    {tc.active_students}
                  </td>
                  <td className="py-3 px-3 text-center font-semibold text-foreground">
                    {tc.lessons_this_week}
                  </td>
                  <td className="py-3 px-3 text-end">
                    <Link
                      to={`/dashboard/students?teacher=${encodeURIComponent(tc.email)}`}
                      className="text-sm font-semibold text-primary hover:underline"
                    >
                      {t('Students', 'الطلاب')}
                    </Link>
                  </td>
                </tr>
              ))}
              {metrics.teacher_capacity.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-muted-foreground">
                    {t('No active teachers yet.', 'لسه مفيش معلمين نشطين.')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="space-y-4" aria-label={t('At a glance', 'نظرة سريعة')}>
        <CompactCalendar />
        <InboxCard />
      </aside>
      </div>
    </div>
  );
}
