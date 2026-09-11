-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PRODUCTION BOOKING LIFECYCLE & SCOPED WORKER AUDIT (Task 0.55.5)
-- Migration: 20260911000002_production_lifecycle_and_scoped_worker_audit.sql
--
-- Scope:
-- 1. Overload/Update claim_integration_jobs() to support optional p_booking_id parameter.
--    Allows client fast-paths to claim and process ONLY jobs belonging to the authenticated booking.
-- 2. Update cancel_booking_by_management() to enforce:
--    - Rejection of already cancelled bookings.
--    - Server-side Master Spec 3-Hour Cancellation Rule (P0004).
--    - Returns bookingId in jsonb response.
-- 3. Update reschedule_booking_by_management() to enforce:
--    - Rejection of cancelled bookings.
--    - Server-side Master Spec 3-Hour Rescheduling Rule (P0004).
--    - Minimum 10-minute lead time on new start time (P0001).
--    - Valid start < end interval (P0001).
--    - Returns bookingId in jsonb response.
-- 4. Update get_booking_management() to include bookingId in jsonb response.
-- ====================================================================

-- 1. Scoped Integration Job Claim RPC
CREATE OR REPLACE FUNCTION public.claim_integration_jobs(
    p_batch_size INT DEFAULT 5,
    p_booking_id UUID DEFAULT NULL
)
RETURNS SETOF public.integration_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.integration_jobs
    SET status = 'processing',
        locked_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id IN (
        SELECT id FROM public.integration_jobs
        WHERE (
            -- If p_booking_id is provided, strictly isolate to that booking
            (p_booking_id IS NULL OR booking_id = p_booking_id)
            AND
            (
                -- Case A & B: Pending or failed jobs due for execution (respecting backoff and lock safety)
                (status IN ('pending', 'failed')
                 AND next_attempt_at <= timezone('utc'::text, now())
                 AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'))
                OR
                -- Case C: Stale processing jobs whose worker interrupted or timed out
                (status = 'processing'
                 AND locked_at IS NOT NULL
                 AND locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')
            )
        )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT, UUID) TO service_role;

-- 2. Server-Enforced 3-Hour Cancellation RPC
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

    -- Guard against duplicate cancellation
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Booking is already cancelled.';
    END IF;

    -- Master Spec Section 29: 3-Hour Self-Service Cancellation Rule
    IF v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours') THEN
        RAISE EXCEPTION 'Self-service cancellation is closed within 3 hours of the lesson. Please contact Mahmoud directly.' USING ERRCODE = 'P0004';
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

    RETURN jsonb_build_object('success', true, 'bookingId', v_booking.id, 'referenceCode', v_booking.reference_code);
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 3. Server-Enforced 3-Hour Rescheduling RPC
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

    -- Guard against rescheduling a cancelled booking
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cancelled bookings cannot be rescheduled.';
    END IF;

    -- Master Spec Section 29: 3-Hour Self-Service Reschedule Rule
    IF v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours') THEN
        RAISE EXCEPTION 'Self-service rescheduling is closed within 3 hours of the lesson. Please contact Mahmoud directly.' USING ERRCODE = 'P0004';
    END IF;

    -- Minimum lead time check (10 minutes in advance)
    IF p_new_start < (timezone('utc'::text, now()) + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'New lesson time must be scheduled at least 10 minutes in advance.' USING ERRCODE = 'P0001';
    END IF;

    -- Valid interval check
    IF p_new_end <= p_new_start THEN
        RAISE EXCEPTION 'Invalid lesson interval: end time must be after start time.' USING ERRCODE = 'P0001';
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

    RETURN jsonb_build_object('success', true, 'bookingId', v_booking.id, 'referenceCode', v_booking.reference_code);
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO anon, authenticated, service_role;

-- 4. Update get_booking_management to include bookingId
CREATE OR REPLACE FUNCTION public.get_booking_management(
    p_reference_code TEXT,
    p_management_token TEXT
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
    v_service RECORD;
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
        RAISE EXCEPTION 'No matching booking found for the provided management credentials.';
    END IF;

    IF v_booking.management_token_hash IS NULL OR extensions.crypt(v_clean_token, v_booking.management_token_hash) <> v_booking.management_token_hash THEN
        RAISE EXCEPTION 'No matching booking found for the provided management credentials.';
    END IF;

    SELECT s.title, s.arabic_title
    INTO v_service
    FROM public.services s
    WHERE s.id = v_booking.service_id;

    RETURN jsonb_build_object(
        'bookingId', v_booking.id,
        'reference', v_booking.reference_code,
        'serviceId', v_booking.service_id,
        'serviceName', COALESCE(v_service.title, '1-on-1 Lesson'),
        'serviceArabicName', COALESCE(v_service.arabic_title, 'درس فردي'),
        'learnerName', v_booking.contact_name,
        'parentName', v_booking.parent_name,
        'scheduledIsoDatetime', v_booking.scheduled_start,
        'scheduledEndIsoDatetime', v_booking.scheduled_end,
        'durationMinutes', v_booking.duration_minutes,
        'timezone', v_booking.student_timezone,
        'cairoTimeDisplay', v_booking.cairo_time_display,
        'mode', v_booking.booking_type,
        'status', v_booking.status,
        'feeAmountUsd', v_booking.fee_amount_usd,
        'zoomMeetingLink', v_booking.zoom_meeting_link,
        'zoomMeetingId', v_booking.zoom_meeting_id,
        'googleCalendarEventId', v_booking.google_calendar_event_id,
        'integrationStatus', COALESCE(v_booking.integration_status, 'pending')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_booking_management(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_management(TEXT, TEXT) TO anon, authenticated, service_role;
