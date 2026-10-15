-- ====================================================================
-- Migration: Revoke public access to check_trial_eligibility
-- File: supabase/migrations/20261016000003_revoke_trial_eligibility_rpc.sql
--
-- Purpose:
-- 1. check_trial_eligibility(email, whatsapp) let anyone probe whether an email
--    or phone already used free trials. Trial rules are enforced by the server
--    (POST /api/bookings), so only service_role keeps EXECUTE.
--    The *_by_management RPCs stay callable: they check the booking's secret
--    management token and are used by the payment-return and manage-booking pages.
-- ====================================================================

REVOKE ALL ON FUNCTION public.check_trial_eligibility(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_trial_eligibility(text, text) FROM anon;
REVOKE ALL ON FUNCTION public.check_trial_eligibility(text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_trial_eligibility(text, text) TO service_role;
