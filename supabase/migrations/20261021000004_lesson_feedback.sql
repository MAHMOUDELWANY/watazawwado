-- ====================================================================
-- Migration: Post-lesson feedback (ST-02)
-- File: supabase/migrations/20261021000004_lesson_feedback.sql
--
-- Purpose:
-- 1. lesson_feedback: one rating (1-5) and optional comment per finished lesson, written by the family account that
--    owns the lesson. Read by the super admin only (through the server); a teacher sees only their average once they
--    have 5 or more ratings, computed on the server.
-- 2. Server only (service_role); browser roles have no access.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_feedback (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (comment IS NULL OR char_length(comment) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS lesson_feedback_teacher_idx ON public.lesson_feedback (teacher_id);
CREATE INDEX IF NOT EXISTS lesson_feedback_created_idx ON public.lesson_feedback (created_at DESC);

ALTER TABLE public.lesson_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages lesson feedback"
    ON public.lesson_feedback FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.lesson_feedback FROM anon, authenticated;
