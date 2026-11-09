-- ====================================================================
-- Migration: Curriculum homework sets
-- File: supabase/migrations/20261109000000_homework_sets.sql
--
-- Purpose (owner review 2026-11-09):
-- 1. After each lesson the teacher marks the curriculum pages covered; the learner then gets a homework set made
--    only from those pages, at their age version (kids / teens / adults).
--    kind: 'part' (part of a lesson), 'lesson' (the lesson finished), 'review' (spaced review of an older lesson).
-- 2. Each set holds several variants of different questions on the same pages, so a retry never repeats the
--    same test. Answer keys live here only: the table is server-only (RLS on, no policies).
-- 3. status: preparing (questions being written) -> new -> submitted (below the pass mark, waits for the teacher)
--    or passed; the teacher's decision moves a submitted set to retry (next variant) or done.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.homework_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    teacher_id UUID,
    track TEXT NOT NULL CHECK (length(track) <= 40),
    lesson_number INTEGER NOT NULL CHECK (lesson_number BETWEEN 1 AND 500),
    from_page INTEGER NOT NULL CHECK (from_page >= 1),
    to_page INTEGER NOT NULL CHECK (to_page >= from_page),
    kind TEXT NOT NULL CHECK (kind IN ('part', 'lesson', 'review')),
    version TEXT CHECK (version IN ('kids', 'teens', 'adults')),
    title_en TEXT CHECK (title_en IS NULL OR length(title_en) <= 200),
    title_ar TEXT CHECK (title_ar IS NULL OR length(title_ar) <= 200),
    variants JSONB NOT NULL DEFAULT '[]'::jsonb,
    variant_index INTEGER NOT NULL DEFAULT 0 CHECK (variant_index >= 0),
    status TEXT NOT NULL DEFAULT 'preparing' CHECK (status IN ('preparing', 'new', 'submitted', 'passed', 'retry', 'done')),
    attempts JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INTEGER,
    total INTEGER,
    teacher_decision TEXT CHECK (teacher_decision IN ('retry', 'accept')),
    review_of UUID REFERENCES public.homework_sets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    submitted_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS homework_sets_student_idx ON public.homework_sets (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS homework_sets_status_idx ON public.homework_sets (status, created_at);
CREATE INDEX IF NOT EXISTS homework_sets_booking_idx ON public.homework_sets (booking_id);
CREATE INDEX IF NOT EXISTS homework_sets_review_of_idx ON public.homework_sets (review_of);

ALTER TABLE public.homework_sets ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.homework_sets FROM anon, authenticated;
GRANT ALL ON TABLE public.homework_sets TO service_role;
