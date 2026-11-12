-- ====================================================================
-- Migration: Retire the legacy create_booking_atomic RPC
-- File: supabase/migrations/20261112000001_retire_legacy_create_booking_atomic.sql
--
-- Purpose:
-- 1. create_booking_atomic(jsonb) still carries $9-era fee constants (20261012000000) and would misprice a $10
--    lesson ($5.60 for 30 minutes). Nothing calls it: bookings are created in api/index.ts with the fee from
--    server/pricing. Remove every remaining execute grant so it cannot be called by mistake.
-- ====================================================================

DO $$
BEGIN
    IF to_regprocedure('public.create_booking_atomic(jsonb)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC, anon, authenticated, service_role;
    END IF;
END $$;
