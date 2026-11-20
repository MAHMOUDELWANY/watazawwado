-- ====================================================================
-- Migration: Talk time timeline event
-- File: supabase/migrations/20261120000020_timeline_talk_event.sql
--
-- Purpose:
-- 1. Allow type 'talk' in lesson_timeline_events (classroom 2.8). The teacher's room page measures how long each side
--    spoke from the two microphones and saves one { teacherMs, learnerMs } row per join when the lesson ends, the
--    teacher leaves or the room hard-closes. The after-lesson report sums them.
-- ====================================================================

ALTER TABLE public.lesson_timeline_events DROP CONSTRAINT IF EXISTS lesson_timeline_events_type_check;
ALTER TABLE public.lesson_timeline_events ADD CONSTRAINT lesson_timeline_events_type_check CHECK (type IN (
    'slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'talk', 'end'
));
