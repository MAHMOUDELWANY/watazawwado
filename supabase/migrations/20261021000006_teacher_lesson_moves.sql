-- ====================================================================
-- Migration: Log of lessons moved by teachers (CRM-08)
-- File: supabase/migrations/20261021000006_teacher_lesson_moves.sql
--
-- Purpose:
-- 1. teacher_lesson_moves: one row each time a teacher moves one of their lessons (RULES.md §1: with a required
--    reason), so the super admin can see moves per teacher. Written by the server after the move succeeds.
-- 2. Server only (service_role); browser roles have no access.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.teacher_lesson_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    old_start TIMESTAMPTZ,
    new_start TIMESTAMPTZ,
    reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 500),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS teacher_lesson_moves_teacher_idx ON public.teacher_lesson_moves (teacher_id, created_at DESC);

ALTER TABLE public.teacher_lesson_moves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages teacher lesson moves"
    ON public.teacher_lesson_moves FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.teacher_lesson_moves FROM anon, authenticated;
