-- ====================================================================
-- Migration: Classroom after the lesson (attendance verdict, files in the report)
-- File: supabase/migrations/20261120000010_classroom_after_lesson.sql
--
-- Purpose:
-- 1. lesson_attendance_verdicts: one automatic attendance verdict per room lesson (BUILD-LIST 3.2), written once
--    when the teacher ends the room or by the cron sweep after the hard close. The row is the claim that keeps the
--    verdict idempotent; it also feeds the admin lesson view (3.5). 'review' means the server did not decide and
--    the super admin was told.
-- 2. lesson_shared_files: the room files (classroom-files bucket, `<booking_id>/<file_id>`) the teacher attached to
--    the lesson report (3.3). The learner's account reads them through the server with signed links.
-- 3. Both are service-role only, like the other room tables: RLS on, no policies, no grants to anon/authenticated.
-- The lesson rating (3.4) reuses public.lesson_feedback (20261021000004); no new table.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_attendance_verdicts (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    verdict TEXT NOT NULL CHECK (verdict IN ('completed', 'learner_no_show', 'teacher_no_show', 'review')),
    reason TEXT NOT NULL CHECK (char_length(reason) <= 100),
    trigger TEXT NOT NULL CHECK (trigger IN ('end', 'sweep')),
    applied BOOLEAN NOT NULL DEFAULT false,
    detail JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(detail::text) <= 16384),
    decided_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lesson_attendance_verdicts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_attendance_verdicts FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_attendance_verdicts TO service_role;

CREATE TABLE IF NOT EXISTS public.lesson_shared_files (
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL CHECK (file_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg)$'),
    added_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (booking_id, file_id)
);

ALTER TABLE public.lesson_shared_files ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_shared_files FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_shared_files TO service_role;
