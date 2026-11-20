-- ====================================================================
-- Migration: Classroom before the lesson (prep mode, waiting-room checks, parent PIN)
-- File: supabase/migrations/20261120100000_classroom_before_lesson.sql
--
-- Purpose:
-- 1. lesson_prep: what the teacher prepared for one lesson before it starts (BUILD-LIST 1.4): the slide to open on,
--    private notes and the names of the files uploaded for it (the files live in the classroom-files bucket under
--    the booking's folder, like room uploads). Service-role only, like the other room tables.
-- 2. lesson_quality.precheck_detail: the waiting room's device and network results (BUILD-LIST 1.5): camera and
--    mic permission, speaker test, latency and rough throughput to our API, and whether the TURN relay answered.
-- 3. parent_pins: a parent's 4-digit PIN (BUILD-LIST 1.6), stored as a salted scrypt hash with a failure counter
--    and a lockout time. Asked before parent-only things like watching a child's lesson. Service-role only.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_prep (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    teacher_user_id TEXT NOT NULL CHECK (char_length(teacher_user_id) <= 200),
    notes TEXT NOT NULL DEFAULT '' CHECK (char_length(notes) <= 8000),
    slide JSONB,
    files JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lesson_prep ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_prep FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_prep TO service_role;

ALTER TABLE public.lesson_quality ADD COLUMN IF NOT EXISTS precheck_detail JSONB;

CREATE TABLE IF NOT EXISTS public.parent_pins (
    user_id UUID PRIMARY KEY,
    pin_hash TEXT NOT NULL CHECK (char_length(pin_hash) <= 300),
    failed_count INTEGER NOT NULL DEFAULT 0 CHECK (failed_count >= 0),
    locked_until TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.parent_pins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.parent_pins FROM anon, authenticated;
GRANT ALL ON TABLE public.parent_pins TO service_role;
