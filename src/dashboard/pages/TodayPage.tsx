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
import { dashboardFetch } from '../lib/dashboardApi';

export default function TodayPage() {
  const { session } = useTeacherAuth();
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<DashboardLesson | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<DateTime>(DateTime.now().setZone('Africa/Cairo'));

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
      setLastRefreshed(DateTime.now().setZone('Africa/Cairo'));
    } catch (err: any) {
      setError(err.message || "Your lessons couldn't be loaded right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const nowCairo = DateTime.now().setZone('Africa/Cairo');

  // Helper to determine time context for a lesson
  const getLessonTimeContext = (lesson: DashboardLesson) => {
    const startCairo = DateTime.fromISO(lesson.scheduled_start).setZone('Africa/Cairo');
    const endCairo = lesson.scheduled_end 
      ? DateTime.fromISO(lesson.scheduled_end).setZone('Africa/Cairo')
      : startCairo.plus({ minutes: lesson.duration_minutes });

    if (lesson.status === 'cancelled') {
      return { type: 'cancelled', label: 'Cancelled' };
    }

    if (lesson.status === 'completed') {
      return { type: 'completed', label: 'Completed' };
    }

    if (lesson.status === 'no_show') {
      return { type: 'no_show', label: 'No-Show' };
    }

    if (nowCairo > endCairo) {
      return { type: 'needs_outcome', label: 'Needs Outcome' };
    }

    if (nowCairo >= startCairo && nowCairo <= endCairo) {
      return { type: 'in_progress', label: 'In Progress' };
    }

    const diffMinutes = Math.round(startCairo.diff(nowCairo, 'minutes').minutes);
    if (diffMinutes <= 30 && diffMinutes > 0) {
      return { type: 'starting_soon', label: `Starts in ${diffMinutes} min` };
    }

    return { type: 'upcoming', label: startCairo.toFormat('hh:mm a') };
  };

  // Find attention items: failed integrations, upcoming missing zoom, or past lessons awaiting outcome
  const attentionLessons = lessons.filter(l => {
    if (l.status === 'cancelled' || l.status === 'completed' || l.status === 'no_show') return false;
    const isFailed = l.integration_status === 'failed' || l.integration_status === 'manual_action_required';
    const isMissingZoom = !l.zoom_host_url && !l.zoom_join_url;
    const startCairo = DateTime.fromISO(l.scheduled_start).setZone('Africa/Cairo');
    const endCairo = l.scheduled_end 
      ? DateTime.fromISO(l.scheduled_end).setZone('Africa/Cairo')
      : startCairo.plus({ minutes: l.duration_minutes });
    const isSoon = startCairo.diff(nowCairo, 'hours').hours < 2 && startCairo > nowCairo;
    const isPastUnresolved = endCairo < nowCairo && l.status === 'confirmed';
    return isFailed || (isMissingZoom && isSoon) || isPastUnresolved;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Operational Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
              Today
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/15 text-primary">
              <Clock className="w-3 h-3" />
              <span>Cairo Time (UTC+2/3)</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {nowCairo.toFormat('EEEE, MMMM d, yyyy')} • {nowCairo.toFormat('hh:mm a')} • Ustadh Mahmoud's teaching schedule for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTodayLessons(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-xs font-medium transition-colors shadow-2xs"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : 'opacity-70'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-surface rounded-2xl border border-border" />
            ))}
          </div>
          <div className="h-44 bg-surface rounded-2xl animate-pulse border border-border" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-surface rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">
            Your schedule couldn't be loaded
          </h2>
          <p className="text-xs text-muted-foreground mb-4 max-w-md">
            {error}
          </p>
          <button 
            onClick={() => fetchTodayLessons(true)}
            className="px-5 py-2.5 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">Lessons Today</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-foreground">
                {summary?.active_today ?? lessons.filter(l => l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">Free Trials</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-primary">
                {summary?.trials_today ?? lessons.filter(l => l.is_free_trial && l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">Completed</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-foreground">
                {summary?.completed_today ?? 0}
              </div>
            </div>

            <div className="bg-surface border border-border rounded-2xl p-4 shadow-2xs">
              <span className="text-xs text-muted-foreground font-medium">Needs Attention</span>
              <div className={`text-2xl font-semibold mt-1 tracking-tight ${attentionLessons.length > 0 ? 'text-warning' : 'text-success'}`}>
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
                    {attentionLessons.length === 1 ? '1 lesson requires your attention' : `${attentionLessons.length} lessons require attention`}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {attentionLessons.map(l => (
                      <p key={l.id} className="text-xs text-muted-foreground">
                        • <span className="font-medium text-foreground">{l.learner_name || 'Learner'}</span> ({l.service_name} at {DateTime.fromISO(l.scheduled_start).setZone('Africa/Cairo').toFormat('hh:mm a')}): Zoom link missing or integration sync pending.
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
            />
          )}

          {/* Today Timeline Header */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-serif font-semibold tracking-tight text-foreground">
                Schedule Timeline
              </h2>
              <span className="text-xs text-muted-foreground">
                {lessons.length} {lessons.length === 1 ? 'session' : 'sessions'} total
              </span>
            </div>

            {lessons.length === 0 ? (
              <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-serif font-semibold mb-1 text-foreground">
                  Your schedule is clear today
                </h3>
                <p className="text-xs text-muted-foreground mb-5 max-w-sm">
                  No lessons are booked for today. You can review your upcoming teaching schedule for the coming days.
                </p>
                <Link
                  to="/dashboard/upcoming"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-medium transition-colors"
                >
                  <span>View Upcoming Schedule</span>
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
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick Workspaces Section */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              to="/dashboard/trials"
              className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-warning/10 text-warning">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-medium text-sm text-foreground">
                    Free Trial Sessions
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                Evaluate prospective learners, record mini-lesson observations, and generate recommended learning plans.
              </p>
            </Link>

            <Link
              to="/dashboard/leads"
              className="p-5 rounded-2xl bg-surface border border-border hover:border-primary/50 shadow-2xs hover:shadow-xs transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-medium text-sm text-foreground">
                    Leads & Inquiries Pipeline
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-muted-foreground">
                Track prospective students from initial inquiry through trial booking and active enrollment.
              </p>
            </Link>
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
  onSelect 
}: { 
  lesson: DashboardLesson; 
  onSelect: () => void;
}) {
  const startCairo = DateTime.fromISO(lesson.scheduled_start).setZone('Africa/Cairo');
  const nowCairo = DateTime.now().setZone('Africa/Cairo');
  const endCairo = lesson.scheduled_end 
    ? DateTime.fromISO(lesson.scheduled_end).setZone('Africa/Cairo')
    : startCairo.plus({ minutes: lesson.duration_minutes });

  const isInProgress = nowCairo >= startCairo && nowCairo <= endCairo;
  const diffMinutes = Math.round(startCairo.diff(nowCairo, 'minutes').minutes);

  const hasStartLink = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);
  const startLink = lesson.zoom_host_url || lesson.zoom_meeting_link || '';

  return (
    <div className="relative overflow-hidden bg-primary/5 dark:bg-primary/10 border border-primary/30 rounded-2xl p-6 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-semibold text-primary flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Next Up
            </span>

            {isInProgress ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success text-success-foreground animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                In Progress
              </span>
            ) : diffMinutes <= 45 && diffMinutes > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-warning/15 text-warning-foreground border border-warning/30">
                Starts in {diffMinutes} min
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface-subtle border border-border-subtle text-foreground">
                {startCairo.toFormat('hh:mm a')}
              </span>
            )}

            {lesson.is_free_trial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-secondary text-secondary-foreground">
                Free Trial
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-serif font-semibold tracking-tight text-foreground truncate">
              {lesson.learner_name || 'Learner name not recorded'}
            </h3>
            {lesson.parent_name && (
              <p className="text-xs text-muted-foreground font-medium">
                Parent/Guardian: {lesson.parent_name}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-0.5">
              {lesson.service_name} • {lesson.duration_minutes} minutes
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          {hasStartLink ? (
            <a
              href={startLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-sm font-semibold transition-all duration-base shadow-xs"
            >
              <Video className="w-4 h-4" />
              <span>Start Lesson</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-subtle text-muted-foreground rounded-xl text-xs font-medium border border-border-subtle">
              <Clock className="w-3.5 h-3.5" />
              <span>Preparing Link</span>
            </div>
          )}

          <button
            onClick={onSelect}
            className="px-4 py-2.5 bg-surface hover:bg-surface-subtle text-foreground border border-border rounded-xl text-sm font-medium transition-colors"
          >
            View Details
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
  onSelect 
}: { 
  key?: React.Key;
  lesson: DashboardLesson; 
  timeContext: { type: string; label: string };
  onSelect: () => void;
}) {
  const startCairo = DateTime.fromISO(lesson.scheduled_start).setZone('Africa/Cairo');
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
          ? 'bg-surface/70 border-border-subtle opacity-80'
          : isNoShow
          ? 'bg-warning/5 border-warning/30 opacity-80'
          : isNeedsOutcome
          ? 'bg-warning/10 border-warning/40 shadow-2xs'
          : isPast 
          ? 'bg-surface/50 border-border-subtle opacity-60' 
          : isCancelled
          ? 'bg-destructive/5 border-destructive/20 opacity-70'
          : isInProgress
          ? 'bg-success/10 border-success/40 shadow-2xs'
          : isStartingSoon
          ? 'bg-warning/10 border-warning/30 shadow-2xs'
          : 'bg-surface border-border shadow-2xs hover:border-primary/50'
        }
      `}
    >
      {/* Time & Badge Column */}
      <div className="flex items-center sm:block gap-3 shrink-0 sm:w-36">
        <div className="font-semibold text-lg tracking-tight text-foreground">
          {startCairo.toFormat('hh:mm a')}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min</span>
        </div>
      </div>

      {/* Lesson Details Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className={`text-base font-semibold truncate ${isCancelled ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {lesson.learner_name || 'Learner name not recorded'}
          </h4>

          {lesson.parent_name && (
            <span className="text-xs text-muted-foreground font-medium">
              (Parent: {lesson.parent_name})
            </span>
          )}

          {lesson.is_free_trial && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary">
              Trial
            </span>
          )}

          {isInProgress && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-success text-success-foreground">
              In Progress
            </span>
          )}

          {isStartingSoon && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-warning/15 text-warning-foreground border border-warning/30">
              {timeContext.label}
            </span>
          )}

          {isCompleted && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-surface-subtle text-muted-foreground border border-border-subtle">
              Completed
            </span>
          )}

          {isNoShow && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/10 text-warning-foreground border border-warning/30">
              No-Show
            </span>
          )}

          {isNeedsOutcome && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-warning/15 text-warning-foreground border border-warning/40">
              Needs Outcome
            </span>
          )}

          {isCancelled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/15 text-destructive border border-destructive/20">
              Cancelled
            </span>
          )}

          {!isInProgress && !isStartingSoon && !isCancelled && !isCompleted && !isNoShow && !isNeedsOutcome && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              lesson.status === 'confirmed' ? 'bg-success/15 text-success border border-success/30' :
              lesson.status === 'rescheduled' ? 'bg-primary/10 text-primary border border-primary/20' :
              'bg-surface-subtle text-muted-foreground border border-border-subtle'
            }`}>
              {lesson.status || 'Status unavailable'}
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {lesson.service_name}
          {lesson.student_timezone ? ` • Student in ${lesson.student_timezone}` : ''}
        </p>
      </div>

      {/* Action Buttons Column */}
      <div className="flex items-center gap-2 shrink-0 sm:ps-4 sm:border-s border-border-subtle">
        {!isPast && !isCancelled && hasStartLink && (
          <a
            href={startLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl text-xs font-medium transition-colors shadow-2xs"
            title="Start lesson as host"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start</span>
          </a>
        )}

        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1 px-3.5 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-xs font-medium transition-colors"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60 rtl:rotate-180" />
        </button>
      </div>
    </div>
  );
}
