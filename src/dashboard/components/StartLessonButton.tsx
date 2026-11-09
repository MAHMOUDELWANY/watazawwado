import React from 'react';
import { Clock, ExternalLink, TimerOff, Video } from 'lucide-react';
import { openZoomAsHost } from '../lib/dashboardApi';
import { lessonJoinState, JOIN_OPENS_MIN } from '../../lib/lessonWindow';
import { useNowTick } from '../../student/components/LessonDayCard';

type Lesson = {
  id: string;
  scheduled_start: string;
  scheduled_end?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
  zoom_host_url?: string | null;
  zoom_meeting_link?: string | null;
};

/**
 * The teacher's Start button (owner review 2026-11-09): it works only during the lesson, from 10 minutes before
 * to the end. Before that it says when it opens; after, "Lesson time is over". The server enforces the same rule.
 */
export function StartLessonButton({ lesson, t, label, compact = false }: {
  lesson: Lesson;
  t: (en: string, ar: string) => string;
  label?: string;
  compact?: boolean;
}) {
  const now = useNowTick(20_000).getTime();
  const link = lesson.zoom_host_url || lesson.zoom_meeting_link || '';
  const state = lesson.status === 'cancelled' ? 'ended' : lessonJoinState(lesson, 'teacher', now);
  const pad = compact ? 'px-3.5 py-2' : 'px-5 py-2.5';

  if (state === 'open' && link) {
    return (
      <a
        href={link}
        onClick={(e) => openZoomAsHost(e, lesson.id, link)}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center justify-center gap-2 ${pad} btn-primary-material text-primary-foreground rounded-xl text-sm font-semibold transition-all duration-base shadow-xs min-h-[40px]`}
      >
        <Video className="w-4 h-4" />
        <span>{label || t('Start lesson', 'ابدأ الحصة')}</span>
        <ExternalLink className="w-3.5 h-3.5 opacity-70" />
      </a>
    );
  }

  const chip = `inline-flex items-center justify-center gap-2 ${pad} glass-surface text-muted-foreground rounded-xl text-sm font-medium border border-border-subtle min-h-[40px]`;
  if (state === 'ended') {
    return (
      <span className={chip} title={t('The link works only during the lesson.', 'الرابط بيشتغل أثناء الحصة بس.')}>
        <TimerOff className="w-3.5 h-3.5" aria-hidden="true" />
        <span>{t('Lesson time is over', 'وقت الحصة خلص')}</span>
      </span>
    );
  }
  return (
    <span className={chip}>
      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
      <span>
        {link
          ? t(`Opens ${JOIN_OPENS_MIN.teacher} min before`, `بيفتح قبل الحصة بـ${JOIN_OPENS_MIN.teacher} دقايق`)
          : t('Link on the way', 'الرابط بيتجهز')}
      </span>
    </span>
  );
}
