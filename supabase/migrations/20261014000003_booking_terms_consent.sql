-- ====================================================================
-- Migration: Record terms consent on bookings
-- File: supabase/migrations/20261014000003_booking_terms_consent.sql
--
-- Purpose (RULES.md §5, decided 2026-10-14): the student accepts the terms and the
-- cancellation & refund policy before booking. Each new booking stores which version
-- of the terms was accepted and when, as proof of consent. Packages store the same
-- pair in package_entitlements.metadata.
-- ====================================================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;
