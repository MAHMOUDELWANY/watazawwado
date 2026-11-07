-- ====================================================================
-- Migration: Who set a learner's level, and when
-- File: supabase/migrations/20261107000001_student_level_set_by.sql
--
-- Purpose:
-- 1. Owner review 2026-11-07 (item 34): the teacher sees the placement result and sets the
--    learner's level; the student page shows that the teacher changed it and when.
-- ====================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS level_set_at timestamptz;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS level_set_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
