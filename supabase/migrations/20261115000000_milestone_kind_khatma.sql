-- ====================================================================
-- Migration: Milestone kind "khatma"
-- File: supabase/migrations/20261115000000_milestone_kind_khatma.sql
--
-- Purpose:
-- 1. Let a teacher record a khatma (the whole Quran completed) as its own milestone, so the learner earns the
--    khatma badge of the new badge set (docs/superpowers/specs/2026-11-14-achievement-badges-design.md).
--    Only widens the allowed kinds; existing rows are untouched.
-- ====================================================================

ALTER TABLE public.learner_milestones DROP CONSTRAINT IF EXISTS learner_milestones_kind_check;
ALTER TABLE public.learner_milestones ADD CONSTRAINT learner_milestones_kind_check CHECK (
  kind IN ('surah_memorized', 'juz_completed', 'khatma', 'level_completed', 'rule_mastered', 'book_completed', 'custom')
);
