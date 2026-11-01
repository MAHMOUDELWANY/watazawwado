-- ====================================================================
-- Migration: Homework between lessons (NX-02)
-- File: supabase/migrations/20261101000000_lesson_homework.sql
--
-- Purpose:
-- 1. lesson_homework: 1-3 tasks a teacher sets after a lesson (recite a surah range, review a curriculum lesson, or a
--    free task). The family ticks a task done; at the next lesson the teacher marks it mastered or needs_review
--    (needs_review creates the same task again, linked by carried_from).
-- 2. Server only (service_role), like lesson_feedback: the server checks the teacher, the family and the learner.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_homework (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    lesson_note_id UUID REFERENCES public.lesson_notes(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    subject TEXT,
    kind TEXT NOT NULL CHECK (kind IN ('recite', 'review', 'task')),
    surah SMALLINT CHECK (surah IS NULL OR surah BETWEEN 1 AND 114),
    ayah_from SMALLINT CHECK (ayah_from IS NULL OR ayah_from >= 1),
    ayah_to SMALLINT CHECK (ayah_to IS NULL OR ayah_to >= 1),
    body TEXT CHECK (body IS NULL OR char_length(body) <= 500),
    done_at TIMESTAMPTZ,
    done_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    review TEXT CHECK (review IS NULL OR review IN ('mastered', 'needs_review')),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    carried_from UUID REFERENCES public.lesson_homework(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (kind <> 'recite' OR (surah IS NOT NULL AND ayah_from IS NOT NULL AND ayah_to IS NOT NULL AND ayah_to >= ayah_from)),
    CHECK (kind = 'recite' OR (body IS NOT NULL AND char_length(btrim(body)) > 0))
);

CREATE INDEX IF NOT EXISTS lesson_homework_student_idx ON public.lesson_homework (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS lesson_homework_open_idx ON public.lesson_homework (student_id) WHERE review IS NULL;

ALTER TABLE public.lesson_homework ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages lesson homework" ON public.lesson_homework;
CREATE POLICY "Service role manages lesson homework"
    ON public.lesson_homework FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.lesson_homework FROM anon, authenticated;
