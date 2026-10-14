-- ====================================================================
-- Migration: Revoke direct client access to unused package RPCs
-- File: supabase/migrations/20261014000004_revoke_unused_package_rpcs.sql
--
-- Purpose (security advisor, 2026-10-14): signed-in users could call these SECURITY DEFINER
-- functions straight through /rest/v1/rpc. The app never does:
-- - create_package_entitlement_atomic: unused; packages are created by the API (server prices).
-- - create_multi_lesson_booking_plan: the booking flow no longer sells multi-lesson plans
--   (packages are bought on the packages page, RULES.md §4), and its overlap check ignores teachers.
-- Only the server (service_role) keeps access.
-- ====================================================================

REVOKE EXECUTE ON FUNCTION public.create_package_entitlement_atomic(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_multi_lesson_booking_plan(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_package_entitlement_atomic(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_multi_lesson_booking_plan(jsonb) TO service_role;
