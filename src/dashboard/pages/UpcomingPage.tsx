import React, { useEffect, useState, useCallback } from 'react';
import { DateTime } from 'luxon';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  Video, 
  ChevronRight, 
  Globe,
  ExternalLink
} from 'lucide-react';
import { useTeacherAuth } from '../../lib/auth';
import { DashboardLesson } from '../types';
import { LessonDetailModal } from '../components/LessonDetailModal';
import { dashboardFetch } from '../lib/dashboardApi';

export default function UpcomingPage() {
  const { session } = useTeacherAuth();
  const [lessons, setLessons] = useState<DashboardLesson[]>([]);
  const [rangeDays, setRangeDays] = useState<number>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<DashboardLesson | null>(null);

  const fetchUpcomingLessons = useCallback(async (isManual = false) => {
    if (isManual) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await dashboardFetch(`/api/dashboard/upcoming?days=${rangeDays}`);
      setLessons(data.lessons || []);
    } catch (err: any) {
      setError(err.message || "Upcoming schedule couldn't be loaded right now.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [rangeDays]);

  useEffect(() => {
    fetchUpcomingLessons();
  }, [fetchUpcomingLessons]);

  const nowCairo = DateTime.now().setZone('Africa/Cairo');

  // Group lessons by Cairo Date
  const groupedLessons = lessons.reduce((acc, lesson) => {
    const startCairo = DateTime.fromISO(lesson.scheduled_start).setZone('Africa/Cairo');
    const dateKey = startCairo.toFormat('yyyy-MM-dd');
    if (!acc[dateKey]) {
      acc[dateKey] = {
        date: startCairo,
        lessons: []
      };
    }
    acc[dateKey].lessons.push(lesson);
    return acc;
  }, {} as Record<string, { date: DateTime; lessons: DashboardLesson[] }>);

  // Sort groups chronologically
  const sortedDateKeys = Object.keys(groupedLessons).sort();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0CA]/30 dark:border-[#3E3545]/30 pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
            Upcoming Schedule
          </h1>
          <p className="text-sm opacity-70 mt-1">
            Confirmed and scheduled 1-on-1 teaching sessions for upcoming days
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 p-1 text-xs font-medium">
            {[
              { label: '7 Days', value: 7 },
              { label: '14 Days', value: 14 },
              { label: '30 Days', value: 30 }
            ].map(tab => (
              <button
                key={tab.value}
                onClick={() => setRangeDays(tab.value)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  rangeDays === tab.value 
                    ? 'bg-[#8FAE9B] text-white' 
                    : 'text-[#362E3B]/70 dark:text-[#F5E6D3]/70 hover:bg-[#F8F6F0] dark:hover:bg-[#3E3545]/30'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchUpcomingLessons(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 hover:bg-[#F8F6F0] dark:hover:bg-[#3E3545]/30 rounded-xl text-xs font-medium transition-colors shadow-xs"
            title="Refresh upcoming schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#6F907D]' : 'opacity-70'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(group => (
            <div key={group} className="space-y-3">
              <div className="h-6 w-48 bg-white dark:bg-[#2A2431] rounded-lg" />
              <div className="h-20 bg-white dark:bg-[#2A2431] rounded-2xl border border-[#D5D0CA]/30 dark:border-[#3E3545]/30" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
          <h2 className="text-base font-semibold text-red-900 dark:text-red-300 mb-1">
            Upcoming schedule couldn't be loaded
          </h2>
          <p className="text-xs text-red-700 dark:text-red-400 mb-4 max-w-md">
            {error}
          </p>
          <button 
            onClick={() => fetchUpcomingLessons(true)}
            className="px-5 py-2.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-800 dark:text-red-200 rounded-xl text-sm font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : sortedDateKeys.length === 0 ? (
        <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/30 dark:border-[#3E3545]/30 rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="w-12 h-12 rounded-2xl bg-[#EAF0EB] dark:bg-[#8FAE9B]/10 text-[#6F907D] dark:text-[#8FAE9B] flex items-center justify-center mb-3">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold mb-1 text-[#362E3B] dark:text-[#F5E6D3]">
            No upcoming lessons scheduled
          </h3>
          <p className="text-xs opacity-70 max-w-sm">
            You currently have no bookings scheduled for the next {rangeDays} days. Future bookings from students will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedDateKeys.map(dateKey => {
            const group = groupedLessons[dateKey];
            const isTomorrow = group.date.hasSame(nowCairo.plus({ days: 1 }), 'day');
            
            return (
              <section key={dateKey} className="space-y-3">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
                      {isTomorrow ? 'Tomorrow' : group.date.toFormat('EEEE, MMMM d, yyyy')}
                    </h2>
                    {isTomorrow && (
                      <span className="text-xs opacity-60">
                        • {group.date.toFormat('MMMM d')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs opacity-60 font-medium">
                    {group.lessons.length} {group.lessons.length === 1 ? 'lesson' : 'lessons'}
                  </span>
                </div>

                {/* Lessons in this date */}
                <div className="space-y-2.5">
                  {group.lessons.map(lesson => (
                    <UpcomingLessonRow 
                      key={lesson.id} 
                      lesson={lesson} 
                      onSelect={() => setSelectedLesson(lesson)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLesson && (
        <LessonDetailModal 
          lesson={selectedLesson} 
          onClose={() => setSelectedLesson(null)} 
        />
      )}
    </div>
  );
}

function UpcomingLessonRow({ 
  lesson, 
  onSelect 
}: { 
  key?: React.Key;
  lesson: DashboardLesson; 
  onSelect: () => void;
}) {
  const startCairo = DateTime.fromISO(lesson.scheduled_start).setZone('Africa/Cairo');
  const hasStartLink = Boolean(lesson.zoom_host_url || lesson.zoom_meeting_link);

  return (
    <div className="bg-white dark:bg-[#2A2431] border border-[#D5D0CA]/40 dark:border-[#3E3545]/40 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-[#8FAE9B]/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Time & Duration */}
      <div className="flex items-center sm:block gap-3 shrink-0 sm:w-36">
        <div className="font-semibold text-lg tracking-tight text-[#362E3B] dark:text-[#F5E6D3]">
          {startCairo.toFormat('hh:mm a')}
        </div>
        <div className="text-xs opacity-70 flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min duration</span>
        </div>
      </div>

      {/* Student & Service */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="text-base font-semibold text-[#362E3B] dark:text-[#F5E6D3] truncate">
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

          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            lesson.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300' :
            lesson.status === 'rescheduled' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
            lesson.status ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
            'bg-amber-50 text-amber-800 dark:bg-amber-900/20 dark:text-amber-300'
          }`}>
            {lesson.status || 'Status unavailable'}
          </span>
        </div>

        <p className="text-xs opacity-75 truncate">
          {lesson.service_name}
          {lesson.student_timezone ? ` • Student in ${lesson.student_timezone}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:pl-4 sm:border-l border-[#D5D0CA]/30 dark:border-[#3E3545]/30">
        {hasStartLink ? (
          <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40 hidden sm:inline-flex items-center gap-1">
            <Video className="w-3 h-3" />
            Zoom Ready
          </span>
        ) : (
          <span className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-lg border border-amber-200/50 dark:border-amber-800/40 hidden sm:inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Link Pending
          </span>
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
