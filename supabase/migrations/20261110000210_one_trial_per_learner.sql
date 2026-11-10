-- ====================================================================
-- Migration: One free trial per learner
-- File: supabase/migrations/20261110000210_one_trial_per_learner.sql
--
-- Purpose:
-- 1. RULES.md §2 (clarified 2026-11-07): every learner gets one free trial, so each child in a family
--    account has their own. The old indexes allowed one active or completed trial per contact email and per
--    WhatsApp number; every child's booking carries the parent's email, so the second child's trial failed
--    with a unique violation (finding P2-003).
-- 2. The race guard moves to the learner: one active or completed trial per student_id.
-- 3. Rows without a learner (old guest bookings) keep the per-email / per-WhatsApp guard.
-- ====================================================================

DROP INDEX IF EXISTS public.idx_bookings_one_trial_email;
DROP INDEX IF EXISTS public.idx_bookings_one_trial_whatsapp;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_trial_learner
ON public.bookings (student_id)
WHERE (booking_type = 'trial' AND status IN ('pending', 'confirmed', 'rescheduled', 'completed') AND student_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_trial_email
ON public.bookings (lower(contact_email))
WHERE (booking_type = 'trial' AND status IN ('pending', 'confirmed', 'rescheduled', 'completed') AND student_id IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_one_trial_whatsapp
ON public.bookings (contact_whatsapp)
WHERE (booking_type = 'trial' AND status IN ('pending', 'confirmed', 'rescheduled', 'completed') AND student_id IS NULL AND contact_whatsapp IS NOT NULL);
