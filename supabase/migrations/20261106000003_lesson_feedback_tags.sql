-- ====================================================================
-- Migration: Quick words on lesson feedback (teacher badges)
-- File: supabase/migrations/20261106000003_lesson_feedback_tags.sql
--
-- Purpose:
-- 1. After a good lesson a family can tap up to 3 quick words ("Patient", "Explains clearly"...). A word shows
--    as a badge on the teacher's card only once 3 different learners chose it (src/lib/teacherBadges.ts).
--    Written only by the server (service role); RLS on lesson_feedback is unchanged.
-- ====================================================================

ALTER TABLE public.lesson_feedback ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.lesson_feedback DROP CONSTRAINT IF EXISTS lesson_feedback_tags_max;
ALTER TABLE public.lesson_feedback ADD CONSTRAINT lesson_feedback_tags_max CHECK (coalesce(array_length(tags, 1), 0) <= 3);
