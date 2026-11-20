-- ====================================================================
-- Migration: Lesson file names and the parent PIN email reset
-- File: supabase/migrations/20261120100001_classroom_file_names_pin_reset.sql
--
-- Purpose:
-- 1. lesson_files: the original name of every file of a lesson, prepared before it (source 'prep') or added in
--    the room (source 'room'). The files live in the classroom-files bucket under the booking's folder; this keeps
--    their names for the room's file list and the after-lesson report. Service-role only. It replaces the
--    lesson_prep.files column from 20261120100000, which is dropped here (nothing was stored in it yet).
-- 2. parent_pins reset columns: a one-time 6-digit code emailed to the account (sha256 hash), valid 15 minutes,
--    single use, with a send time (one email a minute) and a try counter (5 tries per code).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_files (
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL CHECK (char_length(file_id) <= 100),
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 120),
    source TEXT NOT NULL CHECK (source IN ('prep', 'room')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (booking_id, file_id)
);

ALTER TABLE public.lesson_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_files FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_files TO service_role;

ALTER TABLE public.lesson_prep DROP COLUMN IF EXISTS files;

ALTER TABLE public.parent_pins ADD COLUMN IF NOT EXISTS reset_code_hash TEXT CHECK (reset_code_hash IS NULL OR char_length(reset_code_hash) <= 200);
ALTER TABLE public.parent_pins ADD COLUMN IF NOT EXISTS reset_expires_at TIMESTAMPTZ;
ALTER TABLE public.parent_pins ADD COLUMN IF NOT EXISTS reset_sent_at TIMESTAMPTZ;
ALTER TABLE public.parent_pins ADD COLUMN IF NOT EXISTS reset_attempts INTEGER NOT NULL DEFAULT 0 CHECK (reset_attempts >= 0);
