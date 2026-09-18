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
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
            Upcoming Schedule
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Confirmed and scheduled 1-on-1 teaching sessions for upcoming days.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe Selector */}
          <div className="flex items-center rounded-xl bg-surface border border-border p-1 text-xs font-medium shadow-2xs">
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
                    ? 'bg-primary text-primary-foreground font-semibold shadow-2xs' 
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-subtle'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => fetchUpcomingLessons(true)}
            disabled={refreshing || loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-xs font-medium transition-colors shadow-2xs"
            title="Refresh upcoming schedule"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-primary' : 'opacity-70'}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      {loading ? (
        <div className="space-y-6 animate-pulse">
          {[1, 2, 3].map(group => (
            <div key={group} className="space-y-3">
              <div className="h-6 w-48 bg-surface rounded-lg" />
              <div className="h-20 bg-surface rounded-2xl border border-border" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <AlertCircle className="w-10 h-10 text-destructive mb-3" />
          <h2 className="text-base font-semibold text-foreground mb-1">
            Upcoming schedule couldn't be loaded
          </h2>
          <p className="text-xs text-muted-foreground mb-4 max-w-md">
            {error}
          </p>
          <button 
            onClick={() => fetchUpcomingLessons(true)}
            className="px-5 py-2.5 bg-surface hover:bg-surface-subtle border border-border text-foreground rounded-xl text-sm font-medium transition-colors"
          >
            Retry Loading
          </button>
        </div>
      ) : sortedDateKeys.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-serif font-semibold mb-1 text-foreground">
            No upcoming lessons scheduled
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm">
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
                    <h2 className="text-sm font-serif font-semibold tracking-tight text-foreground">
                      {isTomorrow ? 'Tomorrow' : group.date.toFormat('EEEE, MMMM d, yyyy')}
                    </h2>
                    {isTomorrow && (
                      <span className="text-xs text-muted-foreground">
                        • {group.date.toFormat('MMMM d')}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground font-medium">
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
          onBookingUpdated={() => fetchUpcomingLessons(true)}
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
    <div className="bg-surface border border-border rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-primary/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      {/* Time & Duration */}
      <div className="flex items-center sm:block gap-3 shrink-0 sm:w-36">
        <div className="font-semibold text-lg tracking-tight text-foreground">
          {startCairo.toFormat('hh:mm a')}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
          <Clock className="w-3.5 h-3.5" />
          <span>{lesson.duration_minutes} min duration</span>
        </div>
      </div>

      {/* Student & Service */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="text-base font-semibold text-foreground truncate">
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

          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
            lesson.status === 'confirmed' ? 'bg-success/15 text-success border border-success/30' :
            lesson.status === 'rescheduled' ? 'bg-primary/10 text-primary border border-primary/20' :
            'bg-surface-subtle text-muted-foreground border border-border-subtle'
          }`}>
            {lesson.status || 'Status unavailable'}
          </span>
        </div>

        <p className="text-xs text-muted-foreground truncate">
          {lesson.service_name}
          {lesson.student_timezone ? ` • Student in ${lesson.student_timezone}` : ''}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0 sm:ps-4 sm:border-s border-border-subtle">
        {hasStartLink ? (
          <span className="text-xs font-medium text-success bg-success/10 px-2.5 py-1 rounded-lg border border-success/30 hidden sm:inline-flex items-center gap-1">
            <Video className="w-3 h-3" />
            Zoom Ready
          </span>
        ) : (
          <span className="text-xs text-warning bg-warning/10 px-2.5 py-1 rounded-lg border border-warning/30 hidden sm:inline-flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Link Pending
          </span>
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
