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

    if (nowCairo > endCairo || lesson.status === 'completed') {
      return { type: 'past', label: 'Completed' };
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

  // Find attention items
  const attentionLessons = lessons.filter(l => {
    if (l.status === 'cancelled') return false;
    const isFailed = l.integration_status === 'failed' || l.integration_status === 'manual_action_required';
    const isMissingZoom = !l.zoom_host_url && !l.zoom_join_url;
    const startCairo = DateTime.fromISO(l.scheduled_start).setZone('Africa/Cairo');
    const isSoon = startCairo.diff(nowCairo, 'hours').hours < 2 && startCairo > nowCairo;
    return isFailed || (isMissingZoom && isSoon);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Operational Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
              Today
            </h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF0EB] text-[#6F907D] dark:bg-[#8FAE9B]/15 dark:text-[#8FAE9B]">
              Cairo Time (UTC+2/3)
            </span>
          </div>
          <p className="text-sm opacity-70 mt-1">
            {nowCairo.toFormat('EEEE, MMMM d, yyyy')} • {nowCairo.toFormat('hh:mm a')} • Your teaching schedule for today.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTodayLessons(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 hover:bg-[#F8F6F0] dark:hover:bg-[#3E3545]/30 rounded-xl text-xs font-medium transition-colors shadow-xs"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#6F907D]' : 'opacity-70'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />
            ))}
          </div>
          <div className="h-44 bg-white dark:bg-[#2A2431] rounded-2xl animate-pulse border border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-white dark:bg-[#2A2431] rounded-2xl animate-pulse border border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-base font-semibold text-red-900 dark:text-red-300 mb-1">
            Your schedule couldn't be loaded
          </h2>
          <p className="text-xs text-red-700 dark:text-red-400 mb-4 max-w-md">
            {error}
          </p>
          <button 
            onClick={() => fetchTodayLessons(true)}
            className="px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 rounded-xl text-sm font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : (
        <>
          {/* Summary Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-4 shadow-xs">
              <span className="text-xs opacity-70 font-medium">Lessons Today</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
                {summary?.active_today ?? lessons.filter(l => l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-4 shadow-xs">
              <span className="text-xs opacity-70 font-medium">Free Trials</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-[#6F907D] dark:text-[#8FAE9B]">
                {summary?.trials_today ?? lessons.filter(l => l.is_free_trial && l.status !== 'cancelled').length}
              </div>
            </div>

            <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-4 shadow-xs">
              <span className="text-xs opacity-70 font-medium">Completed</span>
              <div className="text-2xl font-semibold mt-1 tracking-tight text-gray-700 dark:text-gray-300">
                {summary?.completed_today ?? 0}
              </div>
            </div>

            <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-4 shadow-xs">
              <span className="text-xs opacity-70 font-medium">Needs Attention</span>
              <div className={`text-2xl font-semibold mt-1 tracking-tight ${attentionLessons.length > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {attentionLessons.length}
              </div>
            </div>
          </div>

          {/* Needs Attention Alert (if any real attention items exist) */}
          {attentionLessons.length > 0 && (
            <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-900/40 text-amber-900 dark:text-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold">
                    {attentionLessons.length === 1 ? '1 lesson requires your attention' : `${attentionLessons.length} lessons require attention`}
                  </h3>
                  <div className="mt-1 space-y-1">
                    {attentionLessons.map(l => (
                      <p key={l.id} className="text-xs opacity-90">
                        • <span className="font-medium">{l.learner_name || 'Learner'}</span> ({l.service_name} at {DateTime.fromISO(l.scheduled_start).setZone('Africa/Cairo').toFormat('hh:mm a')}): Zoom link missing or integration sync pending.
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
              <h2 className="text-lg font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
                Schedule Timeline
              </h2>
              <span className="text-xs opacity-60">
                {lessons.length} {lessons.length === 1 ? 'session' : 'sessions'} total
              </span>
            </div>

            {lessons.length === 0 ? (
              <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#EAF0EB] dark:bg-[#8FAE9B]/10 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center mb-3">
                  <CalendarIcon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold mb-1 text-[#362E3B] dark:text-[#F5E6D3]">
                  Your schedule is clear today
                </h3>
                <p className="text-xs opacity-70 mb-5 max-w-sm">
                  No lessons are booked for today. You can review your upcoming teaching schedule for the coming days.
                </p>
                <Link
                  to="/dashboard/upcoming"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#8FAE9B] hover:bg-[#6F907D] text-white rounded-xl text-xs font-medium transition-colors"
                >
                  <span>View Upcoming Schedule</span>
                  <ArrowRight className="w-3.5 h-3.5" />
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
              className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 hover:border-[#8FAE9B]/60 dark:hover:border-[#8FAE9B]/40 shadow-xs hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-medium text-sm text-[#362E3B] dark:text-[#F5E6D3]">
                    Free Trial Sessions
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[#362E3B]/65 dark:text-[#D5D0CA]/70">
                Evaluate prospective learners, record mini-lesson observations, and generate recommended learning plans.
              </p>
            </Link>

            <Link
              to="/dashboard/leads"
              className="p-5 rounded-2xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 hover:border-[#8FAE9B]/60 dark:hover:border-[#8FAE9B]/40 shadow-xs hover:shadow-md transition-all group block"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#EAF0EB] dark:bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B]">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-medium text-sm text-[#362E3B] dark:text-[#F5E6D3]">
                    Leads & Inquiries Pipeline
                  </h3>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-xs text-[#362E3B]/65 dark:text-[#D5D0CA]/70">
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
    <div className="relative overflow-hidden bg-gradient-to-br from-[#EAF0EB]/80 to-[#DDE8E0]/40 dark:from-[#8FAE9B]/15 dark:to-[#6F907D]/10 border border-[#8FAE9B]/30 dark:border-[#8FAE9B]/20 rounded-2xl p-6 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs uppercase tracking-wider font-bold text-[#6F907D] dark:text-[#8FAE9B] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Next Up
            </span>

            {isInProgress ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                In Progress
              </span>
            ) : diffMinutes <= 45 && diffMinutes > 0 ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200">
                Starts in {diffMinutes} min
              </span>
            ) : (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#8FAE9B]/20 text-[#6F907D] dark:text-[#8FAE9B]">
                {startCairo.toFormat('hh:mm a')}
              </span>
            )}

            {lesson.is_free_trial && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D8C49A]/30 text-[#30332F] dark:text-[#F5E6D3]">
                Free Trial
              </span>
            )}
          </div>

          <div>
            <h3 className="text-xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3] truncate">
              {lesson.learner_name || 'Learner name not recorded'}
            </h3>
            {lesson.parent_name && (
              <p className="text-xs opacity-75 font-medium">
                Parent/Guardian: {lesson.parent_name}
              </p>
            )}
            <p className="text-sm opacity-75 mt-0.5">
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
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <Video className="w-4 h-4" />
              <span>Start Lesson</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-70" />
            </a>
          ) : (
            <div className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-500 rounded-xl text-xs font-medium">
              <Clock className="w-3.5 h-3.5" />
              <span>Preparing Link</span>
            </div>
          )}

          <button
            onClick={onSelect}
            className="px-4 py-2.5 bg-white dark:bg-[#2A2431] hover:bg-[#F8F6F0] dark:hover:bg-[#3E3545]/40 text-[#362E3B] dark:text-[#F5E6D3] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 rounded-xl text-sm font-medium transition-colors"
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

  const isPast = timeContext.type === 'past';
  const isCancelled = timeContext.type === 'cancelled';
  const isInProgress = timeContext.type === 'in_progress';
  const isStartingSoon = timeContext.type === 'starting_soon';

  return (
    <div 
      className={`
        rounded-2xl p-4 sm:p-5 border transition-all duration-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4
        ${isPast 
          ? 'bg-white/60 dark:bg-[#2A2431]/50 border-[#D5D0CA]/20 dark:border-[#3E3545]/20 opacity-60' 
          : isCancelled
          ? 'bg-red-50/30 dark:bg-red-950/10 border-red-200/40 dark:border-red-900/30 opacity-70'
          : isInProgress
          ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 shadow-xs'
          : isStartingSoon
          ? 'bg-amber-50/50 dark:bg-amber-950/15 border-amber-300 dark:border-amber-800/50 shadow-xs'
          : 'bg-white dark:bg-[#2A2431] border-[#D5D0CA]/40 dark:border-[#3E3545]/40 shadow-xs hover:border-[#8FAE9B]/50'
        }
      `}
    >
      {/* Time & Badge Column */}
      <div className="flex items-center sm:block gap-3 shrink-0 sm:w-36">
        <div className="font-semibold text-lg tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
          {startCairo.toFormat('hh:mm a')}
        </div>
        <div className="text-xs opacity-70 flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min</span>
        </div>
      </div>

      {/* Lesson Details Column */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className={`text-base font-semibold truncate ${isCancelled ? 'line-through opacity-70' : 'text-[#362E3B] dark:text-[#F5E6D3]'}`}>
            {lesson.learner_name || 'Learner name not recorded'}
          </h4>

          {lesson.parent_name && (
            <span className="text-xs opacity-70 font-medium">
              (Parent: {lesson.parent_name})
            </span>
          )}

          {lesson.is_free_trial && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#8FAE9B]/15 text-[#6F907D] dark:text-[#8FAE9B]">
              Trial
            </span>
          )}

          {isInProgress && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-600 text-white">
              In Progress
            </span>
          )}

          {isStartingSoon && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
              {timeContext.label}
            </span>
          )}

          {isCancelled && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              Cancelled
            </span>
          )}

          {!isInProgress && !isStartingSoon && !isCancelled && (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              lesson.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
              lesson.status === 'rescheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
              lesson.status ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
              'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
            }`}>
              {lesson.status || 'Status unavailable'}
            </span>
          )}
        </div>

        <p className="text-xs opacity-75 truncate">
          {lesson.service_name}
          {lesson.student_timezone ? ` • Student in ${lesson.student_timezone}` : ''}
        </p>
      </div>

      {/* Action Buttons Column */}
      <div className="flex items-center gap-2 shrink-0 sm:pl-4 sm:border-l border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
        {!isPast && !isCancelled && hasStartLink && (
          <a
            href={startLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-medium transition-colors shadow-xs"
            title="Start lesson as host"
          >
            <Video className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start</span>
          </a>
        )}

        <button
          onClick={onSelect}
          className="inline-flex items-center gap-1 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-[#362E3B] dark:text-[#F5E6D3] rounded-xl text-xs font-medium transition-colors"
        >
          <span>Details</span>
          <ChevronRight className="w-3.5 h-3.5 opacity-60" />
        </button>
      </div>
    </div>
  );
}
