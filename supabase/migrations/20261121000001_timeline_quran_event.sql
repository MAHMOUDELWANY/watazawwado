-- ====================================================================
-- Migration: Mushaf page timeline event (classroom 4.2 rejoin)
-- File: supabase/migrations/20261121000001_timeline_quran_event.sql
--
-- Purpose:
-- 1. Allow type 'quran' in lesson_timeline_events: the mushaf page the teacher shows in the room. The events route also
--    keeps the latest page (and the open tab) in lesson_room_state.snapshot, so a rejoin or a late learner opens at the
--    teacher's page. The list keeps every earlier type, including the teaching-tool types of
--    20261120200000_classroom_teaching_tools.sql (cls/tools), which sorts before this file.
-- ====================================================================

ALTER TABLE public.lesson_timeline_events DROP CONSTRAINT IF EXISTS lesson_timeline_events_type_check;
ALTER TABLE public.lesson_timeline_events ADD CONSTRAINT lesson_timeline_events_type_check CHECK (type IN (
    'slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'talk', 'end',
    'correction', 'check', 'check_answer', 'stage', 'media', 'practice', 'shadow',
    'quran'
));
