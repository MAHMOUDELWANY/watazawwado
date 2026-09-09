-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — BOOKING TEACHER OWNERSHIP & RECONCILIATION
-- Migration: 20260908000013_booking_teacher_ownership.sql
-- Role: 
-- 1. Add teacher_id to bookings to definitively establish ownership.
-- 2. Create an insertion trigger to dynamically assign the canonical platform teacher.
-- 3. Populate teacher_id for all existing bookings.
-- 4. Enqueue integration jobs for legacy bookings.
-- ====================================================================

-- 1. Add teacher_id to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. Dynamic Teacher Assignment Trigger
CREATE OR REPLACE FUNCTION public.assign_primary_teacher_to_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_primary_teacher_id UUID;
BEGIN
    IF NEW.teacher_id IS NULL THEN
        SELECT au.id INTO v_primary_teacher_id
        FROM public.teacher_accounts ta
        JOIN auth.users au ON lower(au.email) = lower(ta.email)
        WHERE ta.is_active = true AND ta.role = 'super_admin'
        ORDER BY ta.created_at ASC
        LIMIT 1;
        
        IF v_primary_teacher_id IS NOT NULL THEN
            NEW.teacher_id := v_primary_teacher_id;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_primary_teacher ON public.bookings;
CREATE TRIGGER trg_assign_primary_teacher
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.assign_primary_teacher_to_booking();

-- 3. Populate existing bookings with the primary teacher's UUID
DO $$
DECLARE
    v_primary_teacher_id UUID;
BEGIN
    SELECT au.id INTO v_primary_teacher_id
    FROM public.teacher_accounts ta
    JOIN auth.users au ON lower(au.email) = lower(ta.email)
    WHERE ta.is_active = true AND ta.role = 'super_admin'
    ORDER BY ta.created_at ASC
    LIMIT 1;

    IF v_primary_teacher_id IS NOT NULL THEN
        UPDATE public.bookings
        SET teacher_id = v_primary_teacher_id
        WHERE teacher_id IS NULL;
    END IF;
END $$;

-- 4. Reconcile missing integration jobs for confirmed/rescheduled bookings that lack calendar events
-- This ensures MHM-51148D and similar pre-outbox bookings get picked up by the integration worker.
INSERT INTO public.integration_jobs (booking_id, job_type, status)
SELECT id, 'booking_sync', 'pending'
FROM public.bookings
WHERE status IN ('confirmed', 'rescheduled')
  AND google_calendar_event_id IS NULL
  AND integration_status IN ('pending', 'processing', 'failed')
ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;
