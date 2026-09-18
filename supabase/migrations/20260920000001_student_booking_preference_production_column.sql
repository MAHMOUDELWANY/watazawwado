-- Migration: 20260920000001_student_booking_preference_production_column.sql
-- Adds the production booking_preference column to students with a constrained value set.
-- Backfills any legacy rows to 'self' before enforcing the non-null default.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS booking_preference TEXT;

UPDATE public.students
SET booking_preference = 'self'
WHERE booking_preference IS NULL;

ALTER TABLE public.students
  ALTER COLUMN booking_preference SET DEFAULT 'self';

ALTER TABLE public.students
  ADD CONSTRAINT students_booking_preference_check
  CHECK (booking_preference IN ('self', 'child'))
  NOT VALID;

ALTER TABLE public.students
  ALTER COLUMN booking_preference SET NOT NULL;
