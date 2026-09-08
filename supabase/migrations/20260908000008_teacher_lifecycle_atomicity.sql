-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — TEACHER DASHBOARD LIFECYCLE ATOMICITY (Task 0.53.2)
-- Migration: 20260908000008_teacher_lifecycle_atomicity.sql
-- ====================================================================

-- 1. Create a secure RPC for Teacher Dashboard to cancel a booking atomically
CREATE OR REPLACE FUNCTION public.teacher_cancel_booking(
    p_booking_id UUID,
    p_reason TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    -- Authorization is assumed to be handled by the backend before calling this RPC
    -- Since we use the service role key from the backend to call this, it bypasses RLS.
    -- However, we still ensure the booking exists.
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Update booking
    UPDATE public.bookings
    SET status = 'cancelled',
        cancellation_reason = COALESCE(p_reason, 'Cancelled by teacher'),
        notes = COALESCE(p_notes, notes),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_booking_id;

    -- Insert durable integration job
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (p_booking_id, 'booking_cancel', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Create a secure RPC for Teacher Dashboard to reschedule a booking atomically
CREATE OR REPLACE FUNCTION public.teacher_reschedule_booking(
    p_booking_id UUID,
    p_new_start TIMESTAMPTZ,
    p_new_end TIMESTAMPTZ,
    p_cairo_time_display TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id LIMIT 1;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    -- Update booking
    UPDATE public.bookings
    SET status = 'rescheduled',
        scheduled_start = p_new_start,
        scheduled_end = p_new_end,
        cairo_time_display = COALESCE(p_cairo_time_display, cairo_time_display),
        notes = COALESCE(p_notes, notes),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_booking_id;

    -- Insert durable integration job
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (p_booking_id, 'booking_reschedule', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;
