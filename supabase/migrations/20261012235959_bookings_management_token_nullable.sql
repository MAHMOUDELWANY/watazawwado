-- ====================================================================
-- Migration: Make bookings.management_token Nullable
-- File: supabase/migrations/20261012235959_bookings_management_token_nullable.sql
--
-- Purpose:
-- 1. Production has NOT NULL on bookings.management_token. The plaintext token is
--    no longer stored (only management_token_hash is verified), so the column must
--    accept NULL before 20261013000000 clears existing plaintext values and before
--    the API stops writing it.
-- ====================================================================

ALTER TABLE public.bookings ALTER COLUMN management_token DROP NOT NULL;
