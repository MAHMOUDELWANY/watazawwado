-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PRODUCTION PRIVILEGE HARDENING RECORD
-- Migration: 20260919000001_production_privilege_hardening_record.sql
-- Purpose: Record the already-applied Production privilege hardening in the
--          repository so migration history is reproducible. This SQL mirrors
--          the live Production change without modifying function bodies or
--          runtime behavior.
-- ====================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_student_user() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_student_user() TO service_role;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;
