-- ====================================================================
-- Migration: Teacher agreement acceptance
-- File: supabase/migrations/20261016000002_teacher_agreement.sql
--
-- Purpose:
-- 1. Record which version of the teacher agreement each teacher accepted and when.
--    A teacher must accept the current version before using the dashboard
--    (enforced in verifyTeacherAuth). teacher_accounts stays server-only (RLS, no policies).
-- ====================================================================

ALTER TABLE public.teacher_accounts
  ADD COLUMN IF NOT EXISTS agreement_version text,
  ADD COLUMN IF NOT EXISTS agreement_accepted_at timestamptz;
