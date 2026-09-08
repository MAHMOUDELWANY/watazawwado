-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — RELIABLE SERVER-SIDE ORCHESTRATION
-- Migration: 20260908000006_reliable_orchestration.sql
-- ====================================================================

-- 1. Create durable integration jobs outbox table
CREATE TABLE IF NOT EXISTS public.integration_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL DEFAULT 'booking_sync',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
    attempts INT NOT NULL DEFAULT 0,
    last_error TEXT,
    locked_at TIMESTAMPTZ,
    next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Ensure idempotency for booking sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_integration_jobs_booking_type 
ON public.integration_jobs(booking_id, job_type) 
WHERE status IN ('pending', 'processing', 'failed');

-- Enable RLS
ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;

-- Block public access
CREATE POLICY "Public cannot read integration_jobs"
ON public.integration_jobs FOR SELECT TO anon USING (false);

CREATE POLICY "Public cannot write integration_jobs"
ON public.integration_jobs FOR INSERT TO anon WITH CHECK (false);

CREATE POLICY "Public cannot update integration_jobs"
ON public.integration_jobs FOR UPDATE TO anon USING (false);

CREATE POLICY "Public cannot delete integration_jobs"
ON public.integration_jobs FOR DELETE TO anon USING (false);

-- Allow authenticated teacher
CREATE POLICY "Teacher can manage integration_jobs"
ON public.integration_jobs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Claim jobs RPC for worker concurrency
CREATE OR REPLACE FUNCTION public.claim_integration_jobs(p_batch_size INT DEFAULT 5)
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
        WHERE status IN ('pending', 'failed')
          AND next_attempt_at <= timezone('utc'::text, now())
          AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;

-- File: supabase/migrations/20260908000006_reliable_orchestration.sql
-- ====================================================================

CREATE OR REPLACE FUNCTION public.create_booking_atomic(
    p_booking jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_contact_name TEXT;
    v_contact_email TEXT;
    v_contact_whatsapp TEXT;
    v_parent_name TEXT;
    v_audience TEXT;
    v_service_id TEXT;
    v_booking_type TEXT;
    v_duration INT;
    v_scheduled_start TIMESTAMPTZ;
    v_scheduled_end TIMESTAMPTZ;
    v_timezone TEXT;
    v_cairo_time_display TEXT;
    v_goal TEXT;
    v_notes TEXT;

    v_service RECORD;
    v_calculated_fee NUMERIC(10, 2);
    v_student_id UUID := NULL;
    v_lead_id UUID := NULL;
    v_booking_id UUID;
    v_ref_code TEXT;
    v_management_token TEXT;
    v_management_token_hash TEXT;
    v_rem_24h TIMESTAMPTZ;
    v_rem_1h TIMESTAMPTZ;
BEGIN
    -- Extract and normalize string inputs
    v_contact_name := trim(COALESCE(p_booking->>'contact_name', ''));
    v_contact_email := lower(trim(COALESCE(p_booking->>'contact_email', '')));
    v_contact_whatsapp := trim(COALESCE(p_booking->>'contact_whatsapp', ''));
    v_parent_name := trim(COALESCE(p_booking->>'parent_name', ''));
    v_audience := lower(trim(COALESCE(p_booking->>'audience', 'adult')));
    v_service_id := trim(COALESCE(p_booking->>'service_id', ''));
    v_booking_type := lower(trim(COALESCE(p_booking->>'booking_type', 'trial')));
    v_cairo_time_display := trim(COALESCE(p_booking->>'cairo_time_display', ''));
    v_goal := trim(COALESCE(p_booking->>'goal', ''));
    v_notes := trim(COALESCE(p_booking->>'notes', ''));

    -- 1. Duration Hardening: strictly numeric integer parsing without leaking raw cast errors or integer overflows
    IF p_booking ? 'duration_minutes'
        AND (p_booking->>'duration_minutes') IS NOT NULL
        AND trim(p_booking->>'duration_minutes') <> ''
    THEN
        -- Must be strictly digits only without signs (+/-), decimals, scientific notation, or non-digits
        IF trim(p_booking->>'duration_minutes') !~ '^[0-9]+$' THEN
            RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';
        END IF;

        -- Guard against 32-bit integer overflow before casting (valid durations are strictly <= 2 digits)
        IF length(trim(p_booking->>'duration_minutes')) > 2 THEN
            RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';
        END IF;

        BEGIN
            v_duration := (trim(p_booking->>'duration_minutes'))::INT;
        EXCEPTION WHEN OTHERS THEN
            RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';
        END;
    ELSE
        v_duration := 30;
    END IF;

    -- 2. Timestamp Parsing Hardening: trap malformed dates into controlled P0001
    IF NOT (p_booking ? 'scheduled_start')
        OR (p_booking->>'scheduled_start') IS NULL
        OR trim(p_booking->>'scheduled_start') = ''
    THEN
        RAISE EXCEPTION 'Scheduled start time is required.' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
        v_scheduled_start := (p_booking->>'scheduled_start')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid scheduled start timestamp format.' USING ERRCODE = 'P0001';
    END;

    IF NOT (p_booking ? 'scheduled_end')
        OR (p_booking->>'scheduled_end') IS NULL
        OR trim(p_booking->>'scheduled_end') = ''
    THEN
        RAISE EXCEPTION 'Scheduled end time is required.' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
        v_scheduled_end := (p_booking->>'scheduled_end')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid scheduled end timestamp format.' USING ERRCODE = 'P0001';
    END;

    -- 3. Timezone Validation
    v_timezone := trim(COALESCE(p_booking->>'student_timezone', 'UTC'));
    IF v_timezone = '' THEN
        v_timezone := 'UTC';
    END IF;

    BEGIN
        PERFORM now() AT TIME ZONE v_timezone;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid student timezone.' USING ERRCODE = 'P0001';
    END;

    -- 4. Basic Contact & Audience Validation
    IF v_contact_name = '' OR length(v_contact_name) < 2 THEN
        RAISE EXCEPTION 'Student name is required.' USING ERRCODE = 'P0001';
    END IF;

    -- Email Hardening: practical application-level validation rejecting obviously malformed values
    IF v_contact_email = '' OR v_contact_email !~ '^[a-z0-9]+([._%+-][a-z0-9]+)*@[a-z0-9]+([.-][a-z0-9]+)*\.[a-z]{2,}$' THEN
        RAISE EXCEPTION 'A valid email address is required.' USING ERRCODE = 'P0001';
    END IF;

    IF v_audience NOT IN ('adult', 'child') THEN
        RAISE EXCEPTION 'Invalid learner audience.' USING ERRCODE = 'P0001';
    END IF;

    IF v_audience = 'child' AND (v_parent_name = '' OR length(v_parent_name) < 2) THEN
        RAISE EXCEPTION 'Parent name is required for child learners.' USING ERRCODE = 'P0001';
    END IF;

    IF v_booking_type NOT IN ('trial', 'regular') THEN
        RAISE EXCEPTION 'Invalid booking type.' USING ERRCODE = 'P0001';
    END IF;

    IF v_duration NOT IN (30, 45, 60) THEN
        RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';
    END IF;

    IF v_scheduled_end <= v_scheduled_start THEN
        RAISE EXCEPTION 'Invalid scheduled time interval.' USING ERRCODE = 'P0001';
    END IF;

    IF v_scheduled_end <> (v_scheduled_start + (v_duration || ' minutes')::INTERVAL) THEN
        RAISE EXCEPTION 'Scheduled time interval does not match lesson duration.' USING ERRCODE = 'P0001';
    END IF;

    IF v_scheduled_start < (now() + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'Bookings must be scheduled at least 10 minutes in advance.' USING ERRCODE = 'P0001';
    END IF;

    -- Trial Duration Rule: default 30 min, maximum 45 min
    IF v_booking_type = 'trial' AND v_duration > 45 THEN
        RAISE EXCEPTION 'Free trial duration cannot exceed 45 minutes.' USING ERRCODE = 'P0001';
    END IF;

    -- 5. Service Resolution and Hardening (Canonical Schema: hourly_rate_usd, trial_allowed, supported_durations, is_active)
    IF v_service_id = '' THEN
        RAISE EXCEPTION 'Service ID is required.' USING ERRCODE = 'P0001';
    END IF;

    SELECT id, title, hourly_rate_usd, trial_allowed, supported_durations, is_active
    INTO v_service
    FROM public.services
    WHERE id = v_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected service does not exist.' USING ERRCODE = 'P0002';
    END IF;

    IF v_service.is_active IS FALSE THEN
        RAISE EXCEPTION 'The selected service is currently inactive.' USING ERRCODE = 'P0001';
    END IF;

    IF v_service.supported_durations IS NOT NULL AND NOT (v_duration = ANY(v_service.supported_durations)) THEN
        RAISE EXCEPTION 'The selected duration is not supported for this service.' USING ERRCODE = 'P0001';
    END IF;

    IF v_booking_type = 'trial' AND NOT COALESCE(v_service.trial_allowed, false) THEN
        RAISE EXCEPTION 'The selected service is not eligible for a free trial.' USING ERRCODE = 'P0001';
    END IF;

    -- Calculate fee server-side
    IF v_booking_type = 'trial' THEN
        v_calculated_fee := 0.00;
    ELSE
        v_calculated_fee := round((v_service.hourly_rate_usd * (v_duration::numeric / 60.0)), 2);
    END IF;

    -- 6. One Free Trial Rule: Atomic Pre-Verification
    IF v_booking_type = 'trial' THEN
        IF EXISTS (
            SELECT 1 FROM public.bookings
            WHERE booking_type = 'trial'
              AND status IN ('pending', 'confirmed', 'completed')
              AND (
                  lower(contact_email) = v_contact_email
                  OR (v_contact_whatsapp <> '' AND contact_whatsapp = v_contact_whatsapp)
              )
        ) THEN
            RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.' USING ERRCODE = 'P0001';
        END IF;
    END IF;

    -- 7. Authoritative Student Identity & Ownership Resolution
    -- A browser-supplied student_id must NEVER be treated as proof of ownership.
    IF auth.uid() IS NOT NULL THEN
        -- Authenticated user: resolve strictly via auth_user_id
        SELECT id INTO v_student_id
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003';
        END IF;

        -- If client provided a student_id, ensure it does not attempt to impersonate another student
        -- Compare textual representations safely without casting arbitrary client string to UUID
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            IF lower(trim(p_booking->>'student_id')) <> lower(v_student_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of another student.' USING ERRCODE = 'P0003';
            END IF;
        END IF;
    ELSE
        -- Guest booking (auth.uid() IS NULL)
        -- Unauthenticated guests can never specify a student_id
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            RAISE EXCEPTION 'Unauthenticated guests cannot specify a student ID.' USING ERRCODE = 'P0003';
        END IF;
        v_student_id := NULL;
    END IF;

    -- 8. Cryptographic Codes Generation
    LOOP
        v_ref_code := 'MHM-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE reference_code = v_ref_code);
    END LOOP;

    v_management_token := encode(extensions.gen_random_bytes(24), 'hex');
    v_management_token_hash := extensions.crypt(v_management_token, extensions.gen_salt('bf'));

    -- 9. Derived Cairo Display Time
    IF v_cairo_time_display = '' THEN
        v_cairo_time_display := to_char(v_scheduled_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM');
    END IF;

    -- 10. Leads Deterministic Upsert
    INSERT INTO public.leads (
        name, email, whatsapp, learner_type, service_interest_id,
        goal, source, status, notes
    ) VALUES (
        v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), v_audience, v_service.id,
        v_goal, 'web_booking_modal',
        CASE WHEN v_booking_type = 'trial' THEN 'trial_booked' ELSE 'lead' END,
        CASE WHEN v_audience = 'child' THEN 'Parent: ' || v_parent_name ELSE v_notes END
    )
    ON CONFLICT (lower(email)) DO UPDATE SET
        name = EXCLUDED.name,
        whatsapp = COALESCE(EXCLUDED.whatsapp, public.leads.whatsapp),
        status = CASE WHEN v_booking_type = 'trial' THEN 'trial_booked' ELSE public.leads.status END,
        updated_at = timezone('utc'::text, now())
    RETURNING id INTO v_lead_id;

    -- 11. Insert Booking Record with authoritatively resolved student_id
    BEGIN
        INSERT INTO public.bookings (
            reference_code, management_token, management_token_hash, student_id, lead_id, service_id, booking_type, duration_minutes,
            scheduled_start, scheduled_end, student_timezone, cairo_time_display,
            status, contact_name, contact_email, contact_whatsapp, parent_name,
            fee_amount_usd, zoom_meeting_link, notes
        ) VALUES (
            v_ref_code, v_management_token, v_management_token_hash, v_student_id, v_lead_id, v_service.id, v_booking_type, v_duration,
            v_scheduled_start, v_scheduled_end, v_timezone, v_cairo_time_display,
            'confirmed', v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), NULLIF(v_parent_name, ''),
            v_calculated_fee, 'pending', v_notes
        )
        RETURNING id INTO v_booking_id;
    EXCEPTION
        WHEN exclusion_violation THEN
            RAISE EXCEPTION 'The selected time slot is no longer available. Please select another time.' USING ERRCODE = 'P0001';
        WHEN unique_violation THEN
            DECLARE
                v_constraint_name TEXT;
            BEGIN
                -- Primary: Structured PostgreSQL diagnostic inspection
                GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
                -- Secondary: Textual fallback retained for environments/proxies where index name is omitted in CONSTRAINT_NAME
                IF v_constraint_name = 'idx_bookings_one_trial' OR SQLERRM LIKE '%idx_bookings_one_trial%' THEN
                    RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.' USING ERRCODE = 'P0001';
                ELSE
                    RAISE EXCEPTION 'Booking conflict detected. Please retry or choose another slot.' USING ERRCODE = 'P0001';
                END IF;
            END;
    END;

    -- 11.5. Schedule Durable Integration Job
    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking_id, 'booking_sync', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

    -- 12. Schedule Automated Reminders (24h and 1h before start)
    v_rem_24h := v_scheduled_start - INTERVAL '24 hours';
    v_rem_1h := v_scheduled_start - INTERVAL '1 hour';

    IF v_rem_24h > now() THEN

        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking_id, '24h_before', v_rem_24h, 'pending')
        ON CONFLICT (booking_id, reminder_type) WHERE status = 'pending' DO NOTHING;
    END IF;

    IF v_rem_1h > now() THEN

        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking_id, '1h_before', v_rem_1h, 'pending')
        ON CONFLICT (booking_id, reminder_type) WHERE status = 'pending' DO NOTHING;
    END IF;

    -- Return confirmed booking payload including private management token ONLY ONCE
    RETURN jsonb_build_object(
        'success', true,
        'bookingId', v_booking_id,
        'referenceCode', v_ref_code,
        'managementToken', v_management_token,
        'serviceName', COALESCE(v_service.title, '1-on-1 Lesson'),
        'feeAmountUsd', v_calculated_fee,
        'zoomMeetingLink', 'pending',
        'studentId', v_student_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;
