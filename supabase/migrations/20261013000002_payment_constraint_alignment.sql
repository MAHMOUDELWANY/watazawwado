-- ====================================================================
-- Migration: Payment Constraint Alignment
-- File: supabase/migrations/20261013000002_payment_constraint_alignment.sql
--
-- Purpose (found by reading pg_constraint on production, 2026-10-13):
-- 1. payments_payment_method_check did not allow 'stripe', so every automated
--    Stripe payment failed to insert after the customer was charged and the
--    booking/package was never confirmed.
-- 2. payments_status_check did not allow 'rejected', so the dashboard "reject"
--    action could only annotate notes and the payment stayed 'pending'.
-- ====================================================================

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_payment_method_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_payment_method_check
    CHECK (payment_method = ANY (ARRAY['international_bank_iban', 'ach_routing', 'payoneer', 'paypal', 'stripe', 'wise', 'other']));

ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check
    CHECK (status = ANY (ARRAY['pending', 'confirmed', 'rejected', 'refunded']));
