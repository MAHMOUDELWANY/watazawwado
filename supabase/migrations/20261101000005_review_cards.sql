-- ====================================================================
-- Migration: Daily review cards (NX-01)
-- File: supabase/migrations/20261101000005_review_cards.sql
--
-- Purpose:
-- 1. review_cards: one card per ayat range the teacher marked "mastered" in homework (lesson_homework kind 'recite').
--    The learner reviews due cards from memory and grades them; the next due date grows with each smooth review
--    (box 0-5 -> 1, 3, 7, 14, 30, 60 days). No streaks.
-- 2. Server only (service_role), like lesson_homework: the server checks the family and the learner.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.review_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    homework_id UUID NOT NULL UNIQUE REFERENCES public.lesson_homework(id) ON DELETE CASCADE,
    surah SMALLINT NOT NULL CHECK (surah BETWEEN 1 AND 114),
    ayah_from SMALLINT NOT NULL CHECK (ayah_from >= 1),
    ayah_to SMALLINT NOT NULL CHECK (ayah_to >= ayah_from),
    box SMALLINT NOT NULL DEFAULT 0 CHECK (box BETWEEN 0 AND 5),
    due_on DATE NOT NULL,
    last_grade TEXT CHECK (last_grade IS NULL OR last_grade IN ('smooth', 'slips', 'mushaf')),
    last_reviewed_at TIMESTAMPTZ,
    reviews SMALLINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS review_cards_due_idx ON public.review_cards (student_id, due_on);

ALTER TABLE public.review_cards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages review cards" ON public.review_cards;
CREATE POLICY "Service role manages review cards"
    ON public.review_cards FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.review_cards FROM anon, authenticated;
