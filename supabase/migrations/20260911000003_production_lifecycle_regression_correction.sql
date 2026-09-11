-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PRODUCTION LIFECYCLE REGRESSION CORRECTION (Task 0.55.5-A)
-- Migration: 20260911000003_production_lifecycle_regression_correction.sql
--
-- Objective:
-- Corrects regressions introduced in Task 0.55.5 while preserving all
-- scoped worker, server-side 3-hour policy, and lifecycle enhancements:
--
-- 1. claim_integration_jobs(p_batch_size, p_booking_id):
--    - Retains scoped worker claiming (p_booking_id UUID DEFAULT NULL).
--    - Retains stale-lock recovery (> 5 min) and SKIP LOCKED concurrency safety.
--    - Service_role execution only.
--
-- 2. cancel_booking_by_management(p_reference_code, p_management_token, p_reason):
--    - Preserves server-side 3-hour self-service cancellation window (P0004).
--    - Rejects already cancelled bookings.
--    - Atomically updates status = 'cancelled'.
--    - REGRESSION A FIX: Preserves and updates cancellation_reason column.
--    - REGRESSION B FIX: Atomically cancels pending reminders in public.reminders.
--    - Enqueues 'booking_cancel' job into public.integration_jobs.
--    - Returns jsonb including bookingId, referenceCode, and success confirmation.
--
-- 3. reschedule_booking_by_management(p_reference_code, p_management_token, p_new_start, p_new_end, p_cairo_time_display):
--    - Preserves server-side 3-hour self-service rescheduling window (P0004).
--    - Enforces >= 10 minutes future lead time (P0001).
--    - REGRESSION C FIX: Enforces original booking duration server-side.
--      Derives new_end = new_start + (duration_minutes || ' minutes')::INTERVAL.
--      Rejects client tamper attempts (e.g. 30min -> 2 hours) with P0001.
--    - REGRESSION D FIX: Server-side derives cairo_time_display from new_start
--      AT TIME ZONE 'Africa/Cairo', ignoring any client-supplied string.
--    - REGRESSION B FIX: Atomically cancels pending reminders and recalculates/inserts
--      new 24h_before and 1h_before reminders for the new start timestamp.
--    - Enqueues 'booking_reschedule' job into public.integration_jobs.
--    - Returns jsonb including bookingId, referenceCode, and success confirmation.
--
-- 4. get_booking_management(p_reference_code, p_management_token):
--    - Includes bookingId and cancellationReason in jsonb output.
-- ====================================================================

-- 1. Scoped Integration Job Claim RPC (Preserving Stale-Lock Recovery & Scoped Worker)
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
            -- Scoped worker filter: when p_booking_id is provided, strictly claim jobs for that booking
            (p_booking_id IS NULL OR booking_id = p_booking_id)
            AND
            (
                -- Case A & B: Pending or failed jobs due for execution (respecting backoff and lock safety)
                (status IN ('pending', 'failed')
                 AND next_attempt_at <= timezone('utc'::text, now())
                 AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'))
                OR
                -- Case C: Stale processing jobs whose worker interrupted or timed out (> 5 minutes)
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

-- 2. Fully Hardened & Corrected Cancellation RPC
CREATE OR REPLACE FUNCTION public.cancel_booking_by_management(
    p_reference_code TEXT,
    p_management_token TEXT,
    p_reason TEXT DEFAULT 'Cancelled by student through portal'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_ref TEXT;
    v_clean_token TEXT;
    v_clean_reason TEXT;
    v_booking RECORD;
BEGIN
    v_clean_ref := upper(trim(COALESCE(p_reference_code, '')));
    v_clean_token := trim(COALESCE(p_management_token, ''));
    v_clean_reason := COALESCE(NULLIF(trim(p_reason), ''), 'Cancelled by student through portal');

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

    -- Update booking status, cancellation reason (Regression A fix), and notes
    UPDATE public.bookings
    SET status = 'cancelled',
        cancellation_reason = v_clean_reason,
        notes = (COALESCE(notes, '') || E'\n\n[Cancellation]: ' || v_clean_reason),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_booking.id;

    -- Atomically clean up pending reminders (Regression B fix)
    UPDATE public.reminders
    SET status = 'cancelled',
        updated_at = timezone('utc'::text, now())
    WHERE booking_id = v_booking.id AND status = 'pending';

    -- Insert durable integration job for cancellation
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking.id, 'booking_cancel', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'bookingId', v_booking.id,
        'referenceCode', v_booking.reference_code,
        'message', 'Booking successfully cancelled.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_management(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;

-- 3. Fully Hardened & Corrected Rescheduling RPC
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
    v_authoritative_end TIMESTAMPTZ;
    v_derived_cairo_display TEXT;
    v_rem_24h TIMESTAMPTZ;
    v_rem_1h TIMESTAMPTZ;
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

    -- Master Spec Section 29: 3-Hour Self-Service Reschedule Rule on current start time
    IF v_booking.scheduled_start < (timezone('utc'::text, now()) + INTERVAL '3 hours') THEN
        RAISE EXCEPTION 'Self-service rescheduling is closed within 3 hours of the lesson. Please contact Mahmoud directly.' USING ERRCODE = 'P0004';
    END IF;

    -- Minimum lead time check (10 minutes in advance)
    IF p_new_start < (timezone('utc'::text, now()) + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'New lesson time must be scheduled at least 10 minutes in advance.' USING ERRCODE = 'P0001';
    END IF;

    -- REGRESSION C FIX: Server strictly enforces original duration.
    -- Derive authoritative end timestamp server-side from original booking duration_minutes.
    v_authoritative_end := p_new_start + (v_booking.duration_minutes || ' minutes')::INTERVAL;

    -- If client supplied an end timestamp that violates the authoritative duration, reject it
    IF p_new_end IS NOT NULL AND p_new_end <> v_authoritative_end THEN
        RAISE EXCEPTION 'Scheduled end timestamp must match scheduled start plus exact original duration (% minutes).' , v_booking.duration_minutes USING ERRCODE = 'P0001';
    END IF;

    -- REGRESSION D FIX: Server-side derive cairo_time_display in Africa/Cairo timezone
    v_derived_cairo_display := to_char(p_new_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM');

    -- Atomically update booking with server-authoritative timestamps
    BEGIN
        UPDATE public.bookings
        SET scheduled_start = p_new_start,
            scheduled_end = v_authoritative_end,
            cairo_time_display = v_derived_cairo_display,
            status = CASE WHEN status = 'pending' THEN 'pending' ELSE 'rescheduled' END,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_booking.id;
    EXCEPTION
        WHEN exclusion_violation THEN
            RAISE EXCEPTION 'The new time slot is not available. Please select another time.' USING ERRCODE = 'P0001';
    END;

    -- REGRESSION B FIX: Atomically recalculate reminders
    -- 1. Cancel previous pending reminders
    UPDATE public.reminders
    SET status = 'cancelled',
        updated_at = timezone('utc'::text, now())
    WHERE booking_id = v_booking.id AND status = 'pending';

    -- 2. Recalculate 24h and 1h reminders for the new start timestamp
    v_rem_24h := p_new_start - INTERVAL '24 hours';
    v_rem_1h := p_new_start - INTERVAL '1 hour';

    IF v_rem_24h > timezone('utc'::text, now()) THEN
        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking.id, '24h_before', v_rem_24h, 'pending')
        ON CONFLICT (booking_id, reminder_type) WHERE status = 'pending' DO NOTHING;
    END IF;

    IF v_rem_1h > timezone('utc'::text, now()) THEN
        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking.id, '1h_before', v_rem_1h, 'pending')
        ON CONFLICT (booking_id, reminder_type) WHERE status = 'pending' DO NOTHING;
    END IF;

    -- Enqueue durable integration job for rescheduling
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking.id, 'booking_reschedule', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    RETURN jsonb_build_object(
        'success', true,
        'bookingId', v_booking.id,
        'referenceCode', v_booking.reference_code,
        'message', 'Booking successfully rescheduled.'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_management(TEXT, TEXT, TIMESTAMPTZ, TIMESTAMPTZ, TEXT) TO anon, authenticated, service_role;

-- 4. Management Lookup RPC (Includes cancellationReason and bookingId)
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
        'cancellationReason', v_booking.cancellation_reason,
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
