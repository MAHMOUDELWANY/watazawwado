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
  UserPlus,
  Globe
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardLesson, DashboardSummary, MissingNoteLesson } from '../types';
import { LessonDetailModal } from '../components/LessonDetailModal';
import { TeacherChecklist } from '../components/TeacherChecklist';
import { Link } from 'react-router-dom';
import { dashboardFetch, openZoomAsHost } from '../lib/dashboardApi';

import { getActiveWorkingTimezone } from '../../lib/countryTimezones';
import { useT } from '../../lib/language';
import { DASH_CARD } from '../components/DashboardCards';
import { InstallAppEntry } from '../../components/pwa/InstallApp';
import { TeacherRatingNote } from '../components/LessonFeedbackPanels';

type T = (en: string, ar: string) => string;

export default function TodayPage() {
  const { t, isAr } = useT();
  const locale = isAr ? 'ar' : 'en';
  const { teacherRole } = useTeacherAuth();
  const isSuperAdmin = teacherRole === 'super_admin';
  const [activeTz, setActiveTz] = useState<string>(() => getActiveWorkingTimezone('Africa/Cairo'));
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [missingNotes, setMissingNotes] = useState<MissingNoteLesson[]>([]);
  // The next 7 days (not today), so an empty day still shows what is coming.
  const [upcoming, setUpcoming] = useState<DashboardLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<DashboardLesson | null>(null);
  const [openSummaryEditor, setOpenSummaryEditor] = useState(false);
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
      // Coming days load beside today; if they fail, today still shows.
      const upcomingReq = dashboardFetch('/api/dashboard/upcoming?days=7').catch(() => null);
      const data = await dashboardFetch('/api/dashboard/today');
      const ahead = await upcomingReq;
      const todayKey = DateTime.now().setZone(activeTz).toFormat('yyyy-MM-dd');
      setUpcoming(((ahead?.lessons || []) as DashboardLesson[])
        .filter((l) => l.status !== 'cancelled' && DateTime.fromISO(l.scheduled_start).setZone(activeTz).toFormat('yyyy-MM-dd') > todayKey)
        .sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start)));
      setLessons(data.lessons || []);
      setSummary(data.summary || null);
      setMissingNotes(data.missing_notes || []);
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

  const activeToday = summary?.active_today ?? lessons.filter(l => l.status !== 'cancelled').length;
  const trialsToday = summary?.trials_today ?? lessons.filter(l => l.is_free_trial && l.status !== 'cancelled').length;
  const completedToday = summary?.completed_today ?? 0;
  const nextBooked = upcoming[0] || null;

  return (
    <div className="pb-12">
      {/* Header: the day, the time zone, one quiet refresh */}
      <header className="flex items-end justify-between gap-4 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl sm:text-4xl font-editorial font-bold text-foreground leading-tight">
            {isAr ? 'اليوم' : 'Today'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold text-foreground/80">{nowActive.toFormat('cccc d LLLL')}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{nowActive.toFormat('h:mm a')}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal/10 text-teal" dir="ltr">
              <Globe className="w-3 h-3" aria-hidden="true" />{activeTz}
            </span>
          </p>
        </div>
        <button
          onClick={() => fetchTodayLessons(true)}
          disabled={refreshing || loading}
          className="shrink-0 w-11 h-11 grid place-items-center rounded-full glass-2 text-foreground hover:text-teal transition-colors cursor-pointer disabled:opacity-60 focus-ring"
          aria-label={isAr ? 'تحديث الجدول' : 'Refresh schedule'}
          title={isAr ? 'تحديث' : 'Refresh'}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-teal' : ''}`} aria-hidden="true" />
        </button>
      </header>

      {loading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start animate-pulse" aria-hidden="true">
          <div className="space-y-4">
            <div className={`h-20 ${DASH_CARD}`} />
            <div className={`h-40 ${DASH_CARD}`} />
            <div className={`h-56 ${DASH_CARD}`} />
          </div>
          <div className="space-y-4">
            <div className={`h-36 ${DASH_CARD}`} />
            <div className={`h-40 ${DASH_CARD}`} />
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">
            {t("Your schedule couldn't be loaded", 'تعذر تحميل جدول اليوم')}
          </h2>
          <p className="text-sm text-muted-foreground mb-4 max-w-md">{error}</p>
          <button
            onClick={() => fetchTodayLessons(true)}
            className="px-5 py-2.5 glass-card hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
          >
            {isAr ? 'إعادة المحاولة' : 'Retry Loading'}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          <TeacherChecklist />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
            <div className="space-y-6 min-w-0">
              {/* TE-01: the next lesson leads the page. */}
              {summary?.next_lesson && (
                <NextLessonSpotlight
                  lesson={summary.next_lesson}
                  context={summary.next_lesson_context || null}
                  onSelect={() => setSelectedLesson(summary.next_lesson)}
                  activeTz={activeTz}
                  t={t}
                  locale={locale}
                />
              )}

              {/* Summary Row */}
              {/* The day in four numbers, one card (not four boxes) */}
              <dl className={`${DASH_CARD} grid grid-cols-4 divide-x rtl:divide-x-reverse divide-border/60 py-3.5`}>
                {[
                  { label: t('Lessons', 'الحصص'), value: activeToday, tone: 'text-foreground' },
                  { label: t('Trials', 'تجريبية'), value: trialsToday, tone: 'text-[#8B4935] dark:text-[#E5A93C]' },
                  { label: t('Done', 'خلصت'), value: completedToday, tone: 'text-success' },
                  { label: t('Follow up', 'متابعة'), value: attentionLessons.length, tone: attentionLessons.length > 0 ? 'text-crimson' : 'text-foreground' },
                ].map((s) => (
                  <div key={s.label} className="px-2 sm:px-4 text-center sm:text-start min-w-0">
                    <dt className="text-[11px] sm:text-xs font-semibold text-muted-foreground truncate">{s.label}</dt>
                    <dd className={`mt-0.5 text-2xl sm:text-[1.75rem] font-bold tabular-nums leading-none ${s.tone}`}>{s.value}</dd>
                  </div>
                ))}
              </dl>

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


              <section aria-labelledby="today-lessons-heading">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 id="today-lessons-heading" className="text-lg font-display font-semibold text-foreground">
                    {t("Today's lessons", 'حصص النهارده')}
                  </h2>
                  {lessons.length > 0 && (
                    <span className="text-sm text-muted-foreground">{t(`${lessons.length} in total`, `${lessons.length} إجمالي`)}</span>
                  )}
                </div>

                {lessons.length === 0 ? (
                  <div className={`${DASH_CARD} p-4 sm:p-5 flex items-center gap-4`}>
                    <span className="grid place-items-center w-12 h-12 rounded-2xl bg-teal/10 text-teal shrink-0">
                      <CalendarIcon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground">{t('No lessons today', 'مفيش حصص النهارده')}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {nextBooked
                          ? t(
                              `Next: ${nextBooked.learner_name || 'a student'}, ${DateTime.fromISO(nextBooked.scheduled_start).setZone(activeTz).setLocale(locale).toFormat('ccc d LLL, h:mm a')}`,
                              `الجاية: ${nextBooked.learner_name || 'طالب'}، ${DateTime.fromISO(nextBooked.scheduled_start).setZone(activeTz).setLocale(locale).toFormat('ccc d LLL، h:mm a')}`
                            )
                          : t('Nothing booked in the next 7 days yet.', 'مفيش حجوزات في الأسبوع الجاي لسه.')}
                      </p>
                    </div>
                    <Link
                      to="/dashboard/upcoming"
                      className="shrink-0 hidden sm:inline-flex items-center gap-1.5 h-10 px-4 rounded-full bg-surface-subtle hover:bg-muted/60 text-sm font-semibold text-foreground transition-colors focus-ring"
                    >
                      {t('Schedule', 'الجدول')}
                      <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" aria-hidden="true" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lessons.map(lesson => (
                      <TodayLessonRow
                        key={lesson.id}
                        lesson={lesson}
                        timeContext={getLessonTimeContext(lesson)}
                        onSelect={() => {
                          setOpenSummaryEditor(false);
                          setSelectedLesson(lesson);
                        }}
                        onOpenSummary={() => {
                          setOpenSummaryEditor(true);
                          setSelectedLesson(lesson);
                        }}
                        activeTz={activeTz}
                        t={t}
                        locale={locale}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* The coming days, so an empty today still shows what is ahead */}
              <section aria-labelledby="coming-up-heading">
                <div className="flex items-baseline justify-between mb-3">
                  <h2 id="coming-up-heading" className="text-lg font-display font-semibold text-foreground">
                    {t('Coming up this week', 'الأيام الجاية')}
                  </h2>
                  <Link to="/dashboard/upcoming" className="text-sm font-semibold text-teal hover:underline">
                    {t('Full schedule', 'الجدول كامل')}
                  </Link>
                </div>
                {upcoming.length === 0 ? (
                  <p className={`${DASH_CARD} p-4 text-sm text-muted-foreground`}>
                    {t('No lessons in the next 7 days. New bookings show up here and in your notifications.', 'مفيش حصص في الـ ٧ أيام الجاية. الحجوزات الجديدة هتظهر هنا وفي الإشعارات.')}
                  </p>
                ) : (
                  <ul className={`${DASH_CARD} divide-y divide-border/60 overflow-hidden`}>
                    {upcoming.slice(0, 6).map((l) => {
                      const start = DateTime.fromISO(l.scheduled_start).setZone(activeTz).setLocale(locale);
                      return (
                        <li key={l.id}>
                          <button
                            type="button"
                            onClick={() => { setOpenSummaryEditor(false); setSelectedLesson(l); }}
                            className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 text-start hover:bg-surface-subtle/70 transition-colors cursor-pointer focus-visible:outline-none focus-visible:bg-surface-subtle"
                          >
                            <span className="w-14 shrink-0 text-center rounded-xl bg-surface-subtle py-1.5">
                              <span className="block text-[10px] font-bold uppercase text-muted-foreground leading-none truncate px-1">{start.toFormat('ccc')}</span>
                              <span className="block text-lg font-bold text-foreground leading-tight tabular-nums">{start.toFormat('d')}</span>
                            </span>
                            <span className="flex-1 min-w-0">
                              <span className="block text-sm font-semibold text-foreground truncate">{l.learner_name || t('Student', 'طالب')}</span>
                              <span className="block text-xs text-muted-foreground truncate">{l.service_name} · {l.duration_minutes} {t('min', 'دقيقة')}</span>
                            </span>
                            {l.is_free_trial && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#E5A93C]/15 text-[#8B4935] dark:text-[#E5A93C]">{t('Trial', 'تجريبية')}</span>
                            )}
                            <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">{start.toFormat('h:mm a')}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* TE-01: past lessons whose family summary is still missing (PR-06). */}
              {missingNotes.length > 0 && (
                <section aria-labelledby="missing-notes-heading" className="space-y-2">
                  <h2 id="missing-notes-heading" className="text-lg font-display font-semibold text-foreground">
                    {t(`Summaries still to write (${missingNotes.length})`, `ملخصات لسه محتاجة تتكتب (${missingNotes.length})`)}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t('The family sees what you write on their progress page.', 'الأسرة بتشوف اللي تكتبه في صفحة التقدم بتاعتها.')}</p>
                  <div className="space-y-2">
                    {missingNotes.map((m) => (
                      <Link
                        key={m.id}
                        to={m.student_id ? `/dashboard/students/${m.student_id}` : '/dashboard/bookings'}
                        className="flex items-center justify-between gap-3 p-3 rounded-xl glass-card border border-border hover:border-primary/40 transition-colors"
                      >
                        <span className="text-sm font-semibold text-foreground">{m.learner_name || t('Student', 'طالب')}</span>
                        <span className="text-xs text-muted-foreground">
                          {DateTime.fromISO(m.scheduled_start).setZone(activeTz).setLocale(locale).toLocaleString(DateTime.DATE_MED)} · {t('Write summary', 'اكتب الملخص')}
                        </span>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              <TeacherRatingNote />
            </div>

            <aside className="space-y-4" aria-label={t('At a glance', 'نظرة سريعة')}>
              <WeekStrip lessons={[...lessons.filter(l => l.status !== 'cancelled'), ...upcoming]} activeTz={activeTz} locale={locale} t={t} />
              <InstallAppEntry variant="card" isAr={isAr} />
              {/* Places that are not in the top tabs (Schedule and Messages already are) */}
              <nav aria-label={t('Shortcuts', 'اختصارات')} className={`${DASH_CARD} p-1.5`}>
                {[
                  { to: '/dashboard/trials', Icon: Sparkles, tone: 'bg-[#E5A93C]/15 text-[#8B4935] dark:text-[#E5A93C]', title: t('Free trials', 'الحصص التجريبية'), text: t('Assess new students and suggest a plan', 'قيّم الطلاب الجداد واقترح خطة') },
                  { to: '/dashboard/availability', Icon: Clock, tone: 'bg-teal/10 text-teal', title: t('My hours', 'مواعيدي'), text: t('The weekly times families can book', 'المواعيد اللي الأسر تقدر تحجز فيها') },
                  ...(isSuperAdmin ? [{ to: '/dashboard/leads', Icon: UserPlus, tone: 'bg-crimson/10 text-crimson', title: t('Interested students', 'الطلاب المهتمين'), text: t('From first question to first lessons', 'من أول سؤال لحد أول حصص') }] : []),
                ].map(({ to, Icon, tone, title, text }) => (
                  <Link key={to} to={to} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-subtle transition-colors group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <span className={`w-10 h-10 rounded-full grid place-items-center shrink-0 ${tone}`}><Icon className="w-4.5 h-4.5" aria-hidden="true" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-semibold text-foreground">{title}</span>
                      <span className="block text-xs text-muted-foreground truncate">{text}</span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" aria-hidden="true" />
                  </Link>
                ))}
              </nav>
            </aside>
          </div>
        </div>
      )}

      {/* Lesson Details Modal */}
      {selectedLesson && (
        <LessonDetailModal
          lesson={selectedLesson}
          openSummaryEditor={openSummaryEditor}
          onClose={() => {
            setSelectedLesson(null);
            setOpenSummaryEditor(false);
          }}
          onBookingUpdated={() => fetchTodayLessons(true)}
        />
      )}
    </div>
  );
}

/** The next seven days with a dot per lesson; today marked. Tapping opens the full schedule. */
function WeekStrip({ lessons, activeTz, locale, t }: { lessons: DashboardLesson[]; activeTz: string; locale: string; t: T }) {
  const today = DateTime.now().setZone(activeTz).setLocale(locale).startOf('day');
  const days = Array.from({ length: 7 }, (_, i) => today.plus({ days: i }));
  const counts = new Map<string, number>();
  for (const l of lessons) {
    const key = DateTime.fromISO(l.scheduled_start).setZone(activeTz).toFormat('yyyy-MM-dd');
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  const total = days.reduce((n, d) => n + (counts.get(d.toFormat('yyyy-MM-dd')) || 0), 0);
  return (
    <Link to="/dashboard/upcoming" className={`${DASH_CARD} block p-4 hover:border-teal/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-display font-semibold text-foreground flex items-center gap-2">
          <CalendarIcon className="w-4 h-4 text-teal" aria-hidden="true" />
          {t('Your week', 'أسبوعك')}
        </span>
        <span className="text-xs font-semibold text-muted-foreground">{t(`${total} lessons`, `${total} حصة`)}</span>
      </div>
      <ol className="grid grid-cols-7 gap-1 text-center">
        {days.map((d, i) => {
          const n = counts.get(d.toFormat('yyyy-MM-dd')) || 0;
          return (
            <li key={i} aria-label={`${d.toFormat('cccc d')}: ${n}`} className={`rounded-xl py-2 ${i === 0 ? 'bg-teal text-white shadow-sm shadow-teal/30' : 'bg-surface-subtle/70 text-foreground'}`}>
              <span className={`block text-[10px] font-semibold ${i === 0 ? 'text-white/80' : 'text-muted-foreground'}`}>{d.toFormat(locale === 'ar' ? 'ccccc' : 'ccc')}</span>
              <span className="block text-sm font-bold tabular-nums">{d.toFormat('d')}</span>
              <span className="mt-1 flex justify-center gap-0.5 h-1.5" aria-hidden="true">
                {Array.from({ length: Math.min(n, 3) }, (_, k) => (
                  <span key={k} className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-white' : 'bg-crimson'}`} />
                ))}
              </span>
            </li>
          );
        })}
      </ol>
    </Link>
  );
}

// Next Lesson Spotlight Card
function NextLessonSpotlight({
  lesson,
  context,
  onSelect,
  activeTz = 'Africa/Cairo',
  t,
  locale
}: {
  lesson: DashboardLesson;
  context?: DashboardSummary['next_lesson_context'];
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
    <div className="relative overflow-hidden bg-secondary/20 dark:bg-secondary/30 border border-secondary/60 rounded-[1.5rem] p-6 shadow-xs">
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
              {context?.age != null && <> • {t(`${context.age} years old`, `${context.age} سنة`)}</>}
              {context?.level && <> • <span className="capitalize">{context.level}</span></>}
            </p>
          </div>
          {(context?.lastFamilySummary || context?.lastNextSteps) && (
            <div className="mt-2 p-3 rounded-xl glass-surface border border-border-subtle text-sm space-y-1">
              {context.lastFamilySummary && (
                <p><span className="font-semibold text-foreground">{t('Last time (to the family): ', 'آخر مرة (للأسرة): ')}</span><span className="text-muted-foreground">{context.lastFamilySummary}</span></p>
              )}
              {context.lastNextSteps && (
                <p><span className="font-semibold text-foreground">{t('Next steps: ', 'الخطوات الجاية: ')}</span><span className="text-muted-foreground">{context.lastNextSteps}</span></p>
              )}
            </div>
          )}
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
  onOpenSummary,
  activeTz = 'Africa/Cairo',
  t,
  locale
}: {
  key?: React.Key;
  lesson: DashboardLesson;
  timeContext: { type: string; label: string };
  onSelect: () => void;
  onOpenSummary?: () => void;
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

        {(isCompleted || isNeedsOutcome || isInProgress) &&
          (lesson.student_id || lesson.studentId) &&
          onOpenSummary && (
            <button
              type="button"
              data-testid="today-record-summary-btn"
              onClick={onOpenSummary}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary/40 hover:bg-secondary/60 text-primary border border-secondary/60 text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t('Record summary', 'سجّل الملخص')}</span>
            </button>
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
