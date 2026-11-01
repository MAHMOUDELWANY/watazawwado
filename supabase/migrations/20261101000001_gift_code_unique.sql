-- ====================================================================
-- Migration: Gift codes are unique (NX-06)
-- File: supabase/migrations/20261101000001_gift_code_unique.sql
--
-- Purpose:
-- 1. A gift package keeps its code in package_entitlements.metadata->'gift'->>'code'. This unique index makes a
--    duplicate code impossible and lets the redeem lookup use an index instead of scanning every package.
-- ====================================================================

CREATE UNIQUE INDEX IF NOT EXISTS package_entitlements_gift_code_key
    ON public.package_entitlements ((metadata->'gift'->>'code'))
    WHERE metadata ? 'gift';
