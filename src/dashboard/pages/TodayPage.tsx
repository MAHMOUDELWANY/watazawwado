import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import {
  Video,
  Calendar as CalendarIcon,
  Clock,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Info,
  ExternalLink,
  ChevronRight,
  Sparkles,
  UserPlus
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardLesson, DashboardSummary } from '../types';
import { LessonDetailModal } from '../components/LessonDetailModal';
import { Link } from 'react-router-dom';
import { dashboardFetch, openZoomAsHost } from '../lib/dashboardApi';

import { getActiveWorkingTimezone } from '../../lib/countryTimezones';
import { useT } from '../../lib/language';

type T = (en: string, ar: string) => string;

export default function TodayPage() {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const [activeTz, setActiveTz] = useState<string>(() => getActiveWorkingTimezone('Africa/Cairo'));
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<DashboardLesson | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<DateTime>(() => DateTime.now().setZone(getActiveWorkingTimezone('Africa/Cairo')));

  // Listen to timezone change event from settings
  useEffect(() => {
    const handleTzChange = (e: any) => {
      const newTz = e?.detail?.timezone || getActiveWorkingTimezone('Africa/Cairo');
      setActiveTz(newTz);
    };
    window.addEventListener('watazawwado_timezone_change', handleTzChange);
    return () => window.removeEventListener('watazawwado_timezone_change', handleTzChange);
  }, []);

  const fetchTodayLessons = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardFetch('/api/dashboard/today');
      setLessons(data.lessons || []);
      setSummary(data.summary || null);
      setLastRefreshed(DateTime.now().setZone(activeTz));
    } catch (err: any) {
      setError(err.message || t("Your lessons couldn't be loaded right now.", 'تعذر تحميل حصصك دلوقتي.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTz]);

  useEffect(() => {
    fetchTodayLessons();
  }, [fetchTodayLessons]);

  // Safe conservative auto-refresh every 60 seconds when document is visible
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchTodayLessons(false);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchTodayLessons]);

  const nowActive = DateTime.now().setZone(activeTz).setLocale(locale);

  // Helper to determine time context for a lesson
  const getLessonTimeContext = (lesson: DashboardLesson) => {
    const startLesson = DateTime.fromISO(lesson.scheduled_start).setZone(activeTz);
    const endLesson = lesson.scheduled_end
      ? DateTime.fromISO(lesson.scheduled_end).setZone(activeTz)
      : startLesson.plus({ minutes: lesson.duration_minutes });

    if (lesson.status === 'cancelled') {
      return { type: 'cancelled', label: t('Cancelled', 'ملغاة') };
    }

    if (lesson.status === 'completed') {
      return { type: 'completed', label: t('Completed', 'تمت') };
    }

    if (lesson.status === 'no_show') {
      return { type: 'no_show', label: t('No-show', 'غياب') };
    }

    if (nowActive > endLesson) {
      return { type: 'needs_outcome', label: t('Needs outcome', 'محتاجة تسجيل نتيجة') };
    }

    if (nowActive >= startLesson && nowActive <= endLesson) {
      return { type: 'in_progress', label: t('In progress', 'شغالة دلوقتي') };
    }

    const diffMinutes = Math.round(startLesson.diff(nowActive, 'minutes').minutes);
    if (diffMinutes <= 30 && diffMinutes > 0) {
      return { type: 'starting_soon', label: t(`Starts in ${diffMinutes} min`, `تبدأ بعد ${diffMinutes} دقيقة`) };
    }

    return { type: 'upcoming', label: startLesson.setLocale(locale).toFormat('hh:mm a') };
  };

  // Find attention items: failed integrations, upcoming missing zoom, or past lessons awaiting outcome
  const attentionLessons = lessons.filter(l => {
    if (l.status === 'cancelled' || l.status === 'completed' || l.status === 'no_show') return false;
    const isFailed = l.integration_status === 'failed' || l.integration_status === 'manual_action_required';
    const isMissingZoom = !l.zoom_host_url && !l.zoom_join_url;
    const startLesson = DateTime.fromISO(l.scheduled_start).setZone(activeTz);
    const endLesson = l.scheduled_end
      ? DateTime.fromISO(l.scheduled_end).setZone(activeTz)
      : startLesson.plus({ minutes: l.duration_minutes });
    const isSoon = startLesson.diff(nowActive, 'hours').hours < 2 && startLesson > nowActive;
    const isPastUnresolved = endLesson < nowActive && l.status === 'confirmed';
    return isFailed || (isMissingZoom && isSoon) || isPastUnresolved;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Operational Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-display font-bold text-foreground">
              {isAr ? 'اليوم' : 'Today'}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border/60">
              <Clock className="w-3 h-3 text-secondary-foreground" />
              <span>{activeTz}</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {nowActive.toFormat('EEEE, MMMM d, yyyy')} • {nowActive.toFormat('hh:mm a')} • {t('Your teaching schedule for today.', 'جدول حصصك النهارده.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTodayLessons(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-semibold transition-colors shadow-2xs cursor-pointer"
            title={isAr ? 'تحديث الجدول' : 'Refresh schedule'}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : 'opacity-70'}`} />
            <span>{refreshing ? (isAr ? 'جارٍ التحديث...' : 'Refreshing...') : (isAr ? 'تحديث' : 'Refresh')}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 glass-card rounded-2xl border border-border" />
            ))}
          </div>
          <div className="h-44 glass-card rounded-2xl animate-pulse border border-border" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 glass-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">
            {t("Your schedule couldn't be loaded", 'تعذر تحميل جدول اليوم')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">
            {error}
          </p>
          <button
            onClick={() => fetchTodayLessons(true)}
            className="px-5 py-2.5 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry Loading'}
          </button>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass-card border border-border/60 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold">{isAr ? 'دروس اليوم' : 'Lessons Today'}</span>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {summary?.active_today ?? lessons.filter(l => l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="glass-card border border-border/60 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold">{isAr ? 'التجريبية' : 'Free Trials'}</span>
              <div className="text-2xl font-bold mt-1 text-primary">
                {summary?.trials_today ?? lessons.filter(l => l.is_free_trial && l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="glass-card border border-border/60 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold">{isAr ? 'المكتملة' : 'Completed'}</span>
              <div className="text-2xl font-bold mt-1 text-foreground">
                {summary?.completed_today ?? 0}
              </div>
            </div>

            <div className="glass-card border border-border/60 rounded-2xl p-4 shadow-2xs">
              <span className="text-xs sm:text-sm text-muted-foreground font-semibold">{isAr ? 'بحاجة لمتابعة' : 'Needs Attention'}</span>
              <div className={`text-2xl font-bold mt-1 ${attentionLessons.length > 0 ? 'text-warning' : 'text-success'}`}>
                {attentionLessons.length}
              </div>
            </div>
          </div>

          {/* Needs Attention Alert */}
          {attentionLessons.length > 0 && (
            <div className="p-4 rounded-2xl bg-warning/10 border border-warning/30 text-foreground">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">
                    {t(`${attentionLessons.length} lesson(s) need your attention`, `${attentionLessons.length} حصة محتاجة متابعة`)}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {attentionLessons.map(l => (
                      <p key={l.id} className="text-sm text-muted-foreground">
                        • <span className="font-medium text-foreground">{l.learner_name || t('Student', 'طالب')}</span> ({l.service_name} · {DateTime.fromISO(l.scheduled_start).setZone(activeTz).setLocale(locale).toFormat('hh:mm a')}): {t('the Zoom link is missing, or the lesson ended and needs an outcome.', 'رابط Zoom ناقص، أو الحصة خلصت ومحتاجة تسجيل نتيجة.')}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Next Lesson Spotlight */}
          {summary?.next_lesson && (
            <NextLessonSpotlight
              lesson={summary.next_lesson}
              onSelect={() => setSelectedLesson(summary.next_lesson)}
              activeTz={activeTz}
              t={t}
              locale={locale}
            />
          )}

          {/* Today Timeline Header */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-display font-semibold  text-foreground">
                {t("Today's lessons", 'حصص النهارده')}
              </h2>
              <span className="text-sm text-muted-foreground">
                {t(`${lessons.length} in total`, `${lessons.length} إجمالي`)}
              </span>
            </div>

            {lessons.length === 0 ? (
              <div className="glass-card border-none rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-secondary/30 text-accent flex items-center justify-center mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-display font-semibold mb-1 text-foreground">
                  {t('No lessons today', 'مفيش حصص النهارده')}
                </h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-sm">
                  {t('Nothing is booked for today. Have a look at the coming days.', 'مفيش حجوزات النهارده. ممكن تبص على الأيام الجاية.')}
                </p>
                <Link
                  to="/dashboard/upcoming"
                  className="inline-flex items-center gap-2 px-4 py-2 btn-primary-material text-primary-foreground rounded-xl text-sm font-medium transition-colors"
                >
                  <span>{t('See upcoming lessons', 'شوف الحصص الجاية')}</span>
                  <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {lessons.map(lesson => (
                  <TodayLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    timeContext={getLessonTimeContext(lesson)}
                    onSelect={() => setSelectedLesson(lesson)}
                    activeTz={activeTz}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Workspaces Section */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/dashboard/trials"
              className="p-5 rounded-2xl glass-card border-none hover:border-accent/40 shadow-2xs hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-warning/10 text-warning">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-medium text-sm text-foreground">
                    {t('Free trials', 'الحصص التجريبية')}
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('Assess new students, note what you saw and suggest a learning plan.', 'قيّم الطلاب الجداد، سجّل ملاحظاتك واقترح خطة تعلم.')}
              </p>
            </Link>

            {isSuperAdmin && <Link
              to="/dashboard/leads"
              className="p-5 rounded-2xl glass-card border-none hover:border-accent/40 shadow-2xs hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-secondary/30 text-primary">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-medium text-sm text-foreground">
                    {t('Interested students', 'الطلاب المهتمين')}
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t('Follow people from their first question to their trial and first lessons.', 'تابع المهتمين من أول سؤال لحد التجربة وأول حصص.')}
              </p>
            </Link>}
          </div>
        </>
      )}

      {/* Lesson Details Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          onClose={() => setSelectedLesson(null)}
          onBookingUpdated={() => fetchTodayLessons(true)}
        />
      )}
    </div>
  );
}

// Next Lesson Spotlight Card
function NextLessonSpotlight({
  lesson,
  onSelect,
  activeTz = 'Africa/Cairo',
  t,
  locale
}: {
  lesson: DashboardLesson;
  onSelect: () => void;
  activeTz?: string;
  t: T;
  locale: string;
}) {
  const startLesson = DateTime.fromISO(lesson.scheduled_start).setZone(activeTz).setLocale(locale);
  const nowLesson = DateTime.now().setZone(activeTz);
  const endLesson = lesson.scheduled_end
    ? DateTime.fromISO(lesson.scheduled_end).setZone(activeTz)
    : startLesson.plus({ minutes: lesson.duration_minutes });

  const isInProgress = nowLesson >= startLesson && nowLesson <= endLesson;
  const diffMinutes = Math.round(startLesson.diff(nowLesson, 'minutes').minutes);

  const hasStartLink = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);
  const startLink = lesson.zoom_host_url || lesson.zoom_meeting_link || '';

  return (
    <div className="relative overflow-hidden bg-secondary/20 dark:bg-secondary/30 border border-secondary/60 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              {t('Next up', 'الحصة الجاية')}
            </span>

            {isInProgress ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-bold bg-success text-success-foreground animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                {t('In progress', 'شغالة دلوقتي')}
              </span>
            ) : diffMinutes <= 45 && diffMinutes > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold bg-warning/15 text-warning-foreground border border-warning/30">
                {t(`Starts in ${diffMinutes} min`, `تبدأ بعد ${diffMinutes} دقيقة`)}
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium glass-surface border border-border-subtle text-foreground">
                {startLesson.toFormat('hh:mm a')}
              </span>
            )}

            {lesson.is_free_trial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
                {t('Free trial', 'تجربة مجانية')}
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-display font-semibold  text-foreground truncate">
              {lesson.learner_name || t('Name not recorded', 'الاسم مش متسجل')}
            </h3>
            {lesson.parent_name && (
              <p className="text-sm text-muted-foreground font-medium">
                {t('Parent / guardian', 'ولي الأمر')}: {lesson.parent_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {lesson.service_name} • {lesson.duration_minutes} {t('minutes', 'دقيقة')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {hasStartLink ? (
            <a
              href={startLink}
              onClick={(e) => openZoomAsHost(e, lesson.id, startLink)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 btn-primary-material text-primary-foreground rounded-xl text-sm font-semibold transition-all duration-base shadow-xs"
            >
              <Video className="w-4 h-4" />
              <span>{t('Start lesson', 'ابدأ الحصة')}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 glass-surface text-muted-foreground rounded-xl text-sm font-medium border border-border-subtle">
              <Clock className="w-3.5 h-3.5" />
              <span>{t('Link on the way', 'الرابط بيتجهز')}</span>
            </div>
          )}

          <button
            onClick={onSelect}
            className="px-4 py-2.5 glass-card hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-medium transition-colors"
          >
            {t('Details', 'التفاصيل')}
          </button>
        </div>
      </div>
    </div>
  );
}

// Today Individual Lesson Row
function TodayLessonRow({
  lesson,
  timeContext,
  onSelect,
  activeTz = 'Africa/Cairo',
  t,
  locale
}: {
  key?: React.Key;
  lesson: DashboardLesson;
  timeContext: { type: string; label: string };
  onSelect: () => void;
  activeTz?: string;
  t: T;
  locale: string;
}) {
  const startLesson = DateTime.fromISO(lesson.scheduled_start).setZone(activeTz).setLocale(locale);
  const hasStartLink = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);
  const startLink = lesson.zoom_host_url || lesson.zoom_meeting_link || '';

  const isCompleted = lesson.status === 'completed';
  const isNoShow = lesson.status === 'no_show';
  const isNeedsOutcome = timeContext.type === 'needs_outcome';
  const isPast = timeContext.type === 'past' || isCompleted;
  const isCancelled = timeContext.type === 'cancelled';
  const isInProgress = timeContext.type === 'in_progress';
  const isStartingSoon = timeContext.type === 'starting_soon';

  return (
    <div
      className={`
        rounded-2xl p-4 sm:p-5 border transition-all duration-base flex flex-col sm:flex-row sm:items-center justify-between gap-4
        ${isCompleted
          ? 'glass-card/70 border-border-subtle opacity-80'
          : isNoShow
          ? 'bg-warning/5 border-warning/30 opacity-80'
          : isNeedsOutcome
          ? 'bg-warning/10 border-warning/40 shadow-2xs'
          : isPast
          ? 'glass-card/50 border-border-subtle opacity-60'
          : isCancelled
          ? 'bg-destructive/5 border-destructive/20 opacity-70'
          : isInProgress
          ? 'bg-success/10 border-success/40 shadow-2xs'
          : isStartingSoon
          ? 'bg-warning/10 border-warning/30 shadow-2xs'
          : 'glass-card border-border shadow-2xs hover:border-accent/40'
        }
      `}
    >
      {/* Time & Badge Column */}
      <div className="flex items-center sm:block gap-3 shrink-0 sm:w-36">
        <div className="font-semibold text-lg  text-foreground">
          {startLesson.toFormat('hh:mm a')}
        </div>
        <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} {t('min', 'دقيقة')}</span>
        </div>
      </div>

      {/* Lesson Details Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className={`text-base font-semibold truncate ${isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {lesson.learner_name || t('Name not recorded', 'الاسم مش متسجل')}
          </h4>

          {lesson.parent_name && (
            <span className="text-sm text-muted-foreground font-medium">
              ({t('Parent', 'ولي الأمر')}: {lesson.parent_name})
            </span>
          )}

          {lesson.is_free_trial && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-secondary/30 text-accent">
              {t('Trial', 'تجربة')}
            </span>
          )}

          {isInProgress && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-bold uppercase bg-success text-success-foreground">
              {t('In progress', 'شغالة دلوقتي')}
            </span>
          )}

          {isStartingSoon && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[13px] font-bold uppercase bg-warning/15 text-warning-foreground border border-warning/30">
              {timeContext.label}
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider glass-surface text-muted-foreground border border-border-subtle">
              {t('Completed', 'تمت')}
            </span>
          )}

          {isNoShow && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-warning/10 text-warning-foreground border border-warning/30">
              {t('No-show', 'غياب')}
            </span>
          )}

          {isNeedsOutcome && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider bg-warning/15 text-warning-foreground border border-warning/40">
              {t('Needs outcome', 'محتاجة تسجيل نتيجة')}
            </span>
          )}

          {isCancelled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase bg-destructive/15 text-destructive border border-destructive/20">
              {t('Cancelled', 'ملغاة')}
            </span>
          )}

          {!isInProgress && !isStartingSoon && !isCancelled && !isCompleted && !isNoShow && !isNeedsOutcome && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[13px] font-bold uppercase tracking-wider ${
              lesson.status === 'confirmed' ? 'bg-success/15 text-success border border-success/30' :
              lesson.status === 'rescheduled' ? 'bg-secondary/30 text-primary border border-secondary/50' :
              'glass-surface text-muted-foreground border border-border-subtle'
            }`}>
              {lesson.status === 'confirmed' ? t('Confirmed', 'مؤكدة') : lesson.status === 'rescheduled' ? t('Moved', 'اتغيّر ميعادها') : (lesson.status || '—')}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground truncate">
          {lesson.service_name}
          {lesson.student_timezone ? ` • ${t('Student in', 'الطالب في')} ${lesson.student_timezone}` : ''}
        </p>
      </div>

      {/* Action Buttons Column */}
      <div className="flex items-center gap-2 shrink-0 sm:ps-4 sm:border-s border-border-subtle">
        {!isPast && !isCancelled && hasStartLink && (
          <a
            href={startLink}
            onClick={(e) => openZoomAsHost(e, lesson.id, startLink)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 btn-primary-material text-primary-foreground rounded-xl text-sm font-medium transition-colors shadow-2xs"
            title={t('Start lesson as host', 'ابدأ الحصة كمضيف')}
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('Start', 'ابدأ')}</span>
          </a>
        )}

        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1 px-3.5 py-2 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
        >
          <span>{t('Details', 'التفاصيل')}</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
