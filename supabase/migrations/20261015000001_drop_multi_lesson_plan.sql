-- ====================================================================
-- Migration: Drop the retired multi-lesson booking plan
-- File: supabase/migrations/20261015000001_drop_multi_lesson_plan.sql
--
-- Purpose (RULES.md §4, 2026-10-15): packages are bought on the packages page and each
-- lesson is booked with a credit. The multi-lesson plan RPC and its 'weekly' catalog rows
-- are no longer used (its overlap check also ignored teachers). The weekly rows stay
-- inactive for history; no entitlement references them.
-- ====================================================================

DROP FUNCTION IF EXISTS public.create_multi_lesson_booking_plan(jsonb);
