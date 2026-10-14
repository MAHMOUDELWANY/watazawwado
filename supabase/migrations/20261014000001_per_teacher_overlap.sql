-- ====================================================================
-- Migration: Per-Teacher Booking Overlap
-- File: supabase/migrations/20261014000001_per_teacher_overlap.sql
--
-- Purpose (RULES.md §1, decided 2026-10-14 — multi-teacher platform):
-- 1. bookings_no_overlap_excl blocked overlapping lessons across ALL teachers, so two
--    teachers could never teach at the same time. Overlap is now checked per teacher.
--    Bookings without a teacher share one bucket (the all-zero uuid) so they still
--    can't overlap each other. The new constraint is strictly looser, so existing
--    rows always satisfy it.
-- ====================================================================

ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_no_overlap_excl;

ALTER TABLE public.bookings ADD CONSTRAINT bookings_no_overlap_excl
    EXCLUDE USING gist (
        (COALESCE(teacher_id, '00000000-0000-0000-0000-000000000000'::uuid)) WITH =,
        tstzrange(scheduled_start, scheduled_end, '[)') WITH &&
    )
    WHERE (status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'rescheduled'::text]));
