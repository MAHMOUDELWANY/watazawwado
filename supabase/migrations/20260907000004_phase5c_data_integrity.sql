-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5C FINAL CLOSURE
-- Migration: Student Data Integrity & Nullable Unknown Facts
-- ====================================================================

-- 1. Remove NOT NULL and defaults from students table so unknown facts
-- (timezone, learner_type, current_level) are never fabricated with default values.
ALTER TABLE public.students 
    ALTER COLUMN timezone DROP NOT NULL,
    ALTER COLUMN timezone DROP DEFAULT,
    ALTER COLUMN learner_type DROP NOT NULL,
    ALTER COLUMN learner_type DROP DEFAULT,
    ALTER COLUMN current_level DROP DEFAULT;
