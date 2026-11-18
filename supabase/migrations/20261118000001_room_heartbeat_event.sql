-- ====================================================================
-- Migration: Room heartbeat attendance event
-- File: supabase/migrations/20261118000001_room_heartbeat_event.sql
--
-- Purpose:
-- 1. Allow event 'room_heartbeat' in lesson_attendance_events. The room's quality call (every 60 s) keeps one
--    heartbeat row per join, moved forward on each call, so a side whose tab crashed or whose phone died stops
--    counting as present 90 s after its last heartbeat instead of at the end of the lesson (teacher pay).
-- ====================================================================

ALTER TABLE public.lesson_attendance_events DROP CONSTRAINT IF EXISTS lesson_attendance_events_event_check;
ALTER TABLE public.lesson_attendance_events ADD CONSTRAINT lesson_attendance_events_event_check CHECK (event IN (
    'link_opened', 'meeting_started', 'meeting_ended', 'joined', 'left', 'waiting_room_joined',
    'room_joined', 'room_left', 'room_ended', 'room_heartbeat'
));
