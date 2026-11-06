-- ====================================================================
-- Migration: Lesson attendance events
-- File: supabase/migrations/20261106000001_lesson_attendance_events.sql
--
-- Purpose:
-- 1. Keep a per-lesson record of who opened the lesson link on our site and when, plus what Zoom reports
--    (meeting started/ended, teacher or student joined/left, student in the waiting room), so the academy can
--    see real attendance times for each lesson.
-- 2. Server-only table: RLS on with no policies, so only the service role reads or writes it.
-- 3. dedupe_key is unique so a Zoom webhook retry never writes the same event twice.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_attendance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    source TEXT NOT NULL CHECK (source IN ('site', 'zoom')),
    event TEXT NOT NULL CHECK (event IN (
        'link_opened', 'meeting_started', 'meeting_ended', 'joined', 'left', 'waiting_room_joined'
    )),
    role TEXT NOT NULL DEFAULT 'unknown' CHECK (role IN ('teacher', 'student', 'unknown')),
    participant_name TEXT CHECK (participant_name IS NULL OR length(participant_name) <= 200),
    occurred_at TIMESTAMPTZ NOT NULL,
    dedupe_key TEXT NOT NULL CHECK (length(dedupe_key) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS lesson_attendance_events_dedupe_key ON public.lesson_attendance_events (dedupe_key);
CREATE INDEX IF NOT EXISTS lesson_attendance_events_booking_idx ON public.lesson_attendance_events (booking_id, occurred_at);

ALTER TABLE public.lesson_attendance_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_attendance_events FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_attendance_events TO service_role;
