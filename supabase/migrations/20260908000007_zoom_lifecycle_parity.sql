-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — ZOOM LIFECYCLE PARITY (Task 0.53)
-- Migration: 20260908000007_zoom_lifecycle_parity.sql
-- ====================================================================

-- 1. Redefine cancel_booking_by_management to insert 'booking_cancel' job
CREATE OR REPLACE FUNCTION public.cancel_booking_by_management(
    p_reference_code TEXT,
    p_management_token TEXT,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_ref TEXT;
    v_clean_token TEXT;
    v_booking RECORD;
BEGIN
    v_clean_ref := upper(trim(COALESCE(p_reference_code, '')));
    v_clean_token := trim(COALESCE(p_management_token, ''));

    IF v_clean_ref = '' OR v_clean_token = '' THEN
        RAISE EXCEPTION 'Unauthorized: Both reference code and management token are required.';
    END IF;

    SELECT *
    INTO v_booking
    FROM public.bookings
    WHERE upper(reference_code) = v_clean_ref
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.management_token_hash IS NULL OR extensions.crypt(v_clean_token, v_booking.management_token_hash) <> v_booking.management_token_hash THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    UPDATE public.bookings
    SET status = 'cancelled',
        notes = (COALESCE(notes, '') || E'\n\n[Cancellation]: ' || COALESCE(p_reason, 'No reason provided.')),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_booking.id;

    -- Insert durable integration job for cancellation
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking.id, 'booking_cancel', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 2. Redefine reschedule_booking_by_management to insert 'booking_reschedule' job
CREATE OR REPLACE FUNCTION public.reschedule_booking_by_management(
    p_reference_code TEXT,
    p_management_token TEXT,
    p_new_start TIMESTAMPTZ,
    p_new_end TIMESTAMPTZ,
    p_cairo_time_display TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_ref TEXT;
    v_clean_token TEXT;
    v_booking RECORD;
BEGIN
    v_clean_ref := upper(trim(COALESCE(p_reference_code, '')));
    v_clean_token := trim(COALESCE(p_management_token, ''));

    IF v_clean_ref = '' OR v_clean_token = '' THEN
        RAISE EXCEPTION 'Unauthorized: Both reference code and management token are required.';
    END IF;

    SELECT *
    INTO v_booking
    FROM public.bookings
    WHERE upper(reference_code) = v_clean_ref
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.';
    END IF;

    IF v_booking.management_token_hash IS NULL OR extensions.crypt(v_clean_token, v_booking.management_token_hash) <> v_booking.management_token_hash THEN
        RAISE EXCEPTION 'Unauthorized.';
    END IF;

    UPDATE public.bookings
    SET scheduled_start = p_new_start,
        scheduled_end = p_new_end,
        cairo_time_display = COALESCE(p_cairo_time_display, cairo_time_display),
        status = 'rescheduled',
        updated_at = timezone('utc'::text, now())
    WHERE id = v_booking.id;

    -- Insert durable integration job for rescheduling
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking.id, 'booking_reschedule', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;
