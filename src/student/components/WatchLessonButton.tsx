import React from 'react';
import { Link } from 'react-router-dom';
import { Eye } from 'lucide-react';
import { roomJoinState } from '../../lib/roomWindow';

type WatchableLesson = {
  id: string;
  scheduledStart?: string;
  scheduled_start?: string;
  scheduledEnd?: string | null;
  scheduled_end?: string | null;
  durationMinutes?: number | null;
  duration_minutes?: number | null;
  status?: string | null;
  classroom?: boolean;
  learnerType?: string | null;
};

/**
 * Classroom spec §4: a guardian may watch a child's lesson from parent mode, while our room is open. The server
 * checks the same again (child learner, not a child device) before it hands out an observer pass.
 */
export function canWatchLesson(b: WatchableLesson, now: number = Date.now()): boolean {
  if (!b.classroom || b.learnerType !== 'child') return false;
  const scheduled_start = b.scheduledStart || b.scheduled_start;
  if (!scheduled_start) return false;
  return roomJoinState({ scheduled_start, scheduled_end: b.scheduledEnd ?? b.scheduled_end, duration_minutes: b.durationMinutes ?? b.duration_minutes, status: b.status }, now) === 'open';
}

/** Parent mode only (`/student`). Never rendered by the kid app. */
export function WatchLessonButton({ booking, isAr, now }: { booking: WatchableLesson; isAr: boolean; now?: number }) {
  if (!canWatchLesson(booking, now)) return null;
  return (
    <Link
      to={`/student/room/${encodeURIComponent(booking.id)}?observe=1`}
      className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-surface-subtle min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
    >
      <Eye className="w-4 h-4 text-accent" aria-hidden="true" />
      {isAr ? 'تابع الحصة' : 'Watch the lesson'}
    </Link>
  );
}
