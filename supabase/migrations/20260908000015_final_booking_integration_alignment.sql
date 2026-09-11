-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — CANONICAL INTEGRATION ALIGNMENT
-- Migration: 20260908000015_final_booking_integration_alignment.sql
-- Role:
-- 1. Safely add missing integration columns to public.bookings
-- 2. Drop flawed triggers and speculative functions
-- 3. Establish deterministic fail-closed teacher assignment trigger
-- 4. Establish durable integration_jobs outbox and compatible unique index
-- 5. Secure claim_integration_jobs RPC with REVOKE from public
-- 6. Canonical create_booking_atomic() RPC with atomic outbox enqueue
-- 7. Reconcile existing legacy bookings with teacher_id and outbox enqueue
-- 8. Correct calendar_connections RLS for tenant isolation
-- ====================================================================

-- 1. Safely add missing columns to public.bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS integration_status TEXT DEFAULT 'pending' CHECK (integration_status IN ('pending', 'synced', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}'::jsonb;

-- 2. Drop any flawed triggers or speculative functions from previous iterations
DROP TRIGGER IF EXISTS trg_assign_primary_teacher ON public.bookings;
DROP FUNCTION IF EXISTS public.assign_primary_teacher_to_booking();
DROP TRIGGER IF EXISTS trg_assign_safe_teacher ON public.bookings;
DROP FUNCTION IF EXISTS public.assign_safe_teacher_to_booking();
DROP TRIGGER IF EXISTS trg_assign_authoritative_teacher ON public.bookings;
DROP FUNCTION IF EXISTS public.assign_authoritative_teacher_to_booking();

-- 3. Create a deterministic, fail-closed teacher assignment trigger
-- Rules:
-- 1) If teacher_id is already assigned (e.g. by create_booking_atomic or authenticated teacher), keep it.
-- 2) For guest or student bookings where teacher_id was not explicitly set:
--    Assign teacher_id ONLY IF there is exactly ONE active 'google_calendar' connection.
--    If count is 0 or >1, leave teacher_id NULL (fail closed, never guess).
CREATE OR REPLACE FUNCTION public.assign_authoritative_teacher_to_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_active_connections_count INT;
    v_deterministic_teacher_id UUID;
BEGIN
    IF NEW.teacher_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
    FROM public.calendar_connections
    WHERE is_active = true AND provider = 'google_calendar';

    IF v_active_connections_count = 1 THEN
        NEW.teacher_id := v_deterministic_teacher_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_authoritative_teacher
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.assign_authoritative_teacher_to_booking();

-- 4. Reconcile existing bookings without teacher_id
-- Assign ONLY IF there is exactly ONE active google_calendar connection
DO $$
DECLARE
    v_active_connections_count INT;
    v_deterministic_teacher_id UUID;
BEGIN
    SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
    FROM public.calendar_connections
    WHERE is_active = true AND provider = 'google_calendar';

    IF v_active_connections_count = 1 THEN
        UPDATE public.bookings
        SET teacher_id = v_deterministic_teacher_id
        WHERE teacher_id IS NULL AND status IN ('confirmed', 'rescheduled');
    END IF;
END $$;

-- 5. Create durable integration_jobs outbox table
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    completed_at TIMESTAMPTZ
);

-- Ensure completed_at exists if table was created previously
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'integration_jobs' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE public.integration_jobs ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- Idempotency index: Drop conflicting or full indexes and create partial active uniqueness index
-- mathematically matching: ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
DROP INDEX IF EXISTS public.idx_integration_jobs_booking_type;
DROP INDEX IF EXISTS public.idx_integration_jobs_active_unique;

CREATE UNIQUE INDEX idx_integration_jobs_active_unique 
ON public.integration_jobs(booking_id, job_type) 
WHERE status IN ('pending', 'processing', 'failed');

-- Enable RLS on integration_jobs
ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public cannot read integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot write integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot update integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot delete integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Teacher can manage integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.integration_jobs;
DROP POLICY IF EXISTS "Allow full access to integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Teachers can view integration_jobs" ON public.integration_jobs;

CREATE POLICY "Teachers can view integration_jobs"
ON public.integration_jobs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt()->>'email')
          AND is_active = true
    )
);

-- 6. Claim jobs RPC for durable background worker concurrency
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

-- Secure claim_integration_jobs: Revoke public execution
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;

-- 7. Authoritative create_booking_atomic() RPC with Atomic Outbox Enqueue
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
    v_teacher_id UUID := NULL;
    v_is_teacher BOOLEAN := false;
    v_active_connections_count INT;
    v_deterministic_teacher_id UUID;
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
        IF trim(p_booking->>'duration_minutes') !~ '^[0-9]+$' THEN
            RAISE EXCEPTION 'Invalid lesson duration.' USING ERRCODE = 'P0001';
        END IF;

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

    -- Canonical Email Hardening
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

    -- 5. Service Resolution and Hardening
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

    -- 7. Identity & Ownership Resolution
    -- Check if authenticated user is an active authorized Teacher
    IF auth.uid() IS NOT NULL THEN
        SELECT EXISTS (
            SELECT 1 FROM public.teacher_accounts ta
            WHERE lower(ta.email) = lower(COALESCE(
                auth.jwt() ->> 'email',
                (SELECT email FROM auth.users WHERE id = auth.uid()),
                (SELECT email FROM public.profiles WHERE id = auth.uid())
            ))
            AND ta.is_active = true
        ) INTO v_is_teacher;
    END IF;

    IF v_is_teacher IS TRUE THEN
        -- Caller is an authenticated authorized Teacher
        v_teacher_id := auth.uid();

        -- Teacher may optionally supply a valid student ID
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            BEGIN
                SELECT id INTO v_student_id
                FROM public.students
                WHERE id = (trim(p_booking->>'student_id'))::UUID;
            EXCEPTION WHEN OTHERS THEN
                v_student_id := NULL;
            END;
        ELSE
            v_student_id := NULL;
        END IF;

    ELSIF auth.uid() IS NOT NULL THEN
        -- Caller is an authenticated Student (not a Teacher)
        -- Student ownership resolved strictly via students.auth_user_id = auth.uid()
        SELECT id INTO v_student_id
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003';
        END IF;

        -- Anti-impersonation check: student cannot supply another student's ID
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            IF lower(trim(p_booking->>'student_id')) <> lower(v_student_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of another student.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

        -- Teacher resolution: assign ONLY IF there is exactly ONE active google_calendar connection
        SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
        FROM public.calendar_connections
        WHERE is_active = true AND provider = 'google_calendar';

        IF v_active_connections_count = 1 THEN
            v_teacher_id := v_deterministic_teacher_id;
        ELSE
            v_teacher_id := NULL;
        END IF;

    ELSE
        -- Guest booking (auth.uid() IS NULL)
        -- Unauthenticated guests can never specify a student ID
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            RAISE EXCEPTION 'Unauthenticated guests cannot specify a student ID.' USING ERRCODE = 'P0003';
        END IF;
        v_student_id := NULL;

        -- Teacher resolution: assign ONLY IF there is exactly ONE active google_calendar connection
        SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
        FROM public.calendar_connections
        WHERE is_active = true AND provider = 'google_calendar';

        IF v_active_connections_count = 1 THEN
            v_teacher_id := v_deterministic_teacher_id;
        ELSE
            v_teacher_id := NULL;
        END IF;
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

    -- 11. Insert Booking Record with authoritatively resolved student_id and teacher_id
    BEGIN
        INSERT INTO public.bookings (
            reference_code, management_token, management_token_hash, student_id, teacher_id, lead_id, service_id, booking_type, duration_minutes,
            scheduled_start, scheduled_end, student_timezone, cairo_time_display,
            status, contact_name, contact_email, contact_whatsapp, parent_name,
            fee_amount_usd, zoom_meeting_link, notes,
            integration_status, sync_metadata
        ) VALUES (
            v_ref_code, v_management_token, v_management_token_hash, v_student_id, v_teacher_id, v_lead_id, v_service.id, v_booking_type, v_duration,
            v_scheduled_start, v_scheduled_end, v_timezone, v_cairo_time_display,
            'confirmed', v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), NULLIF(v_parent_name, ''),
            v_calculated_fee, 'pending', v_notes,
            'pending', '{}'::jsonb
        )
        RETURNING id INTO v_booking_id;
    EXCEPTION
        WHEN exclusion_violation THEN
            RAISE EXCEPTION 'The selected time slot is no longer available. Please select another time.' USING ERRCODE = 'P0001';
        WHEN unique_violation THEN
            DECLARE
                v_constraint_name TEXT;
            BEGIN
                GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
                IF v_constraint_name = 'idx_bookings_one_trial' OR SQLERRM LIKE '%idx_bookings_one_trial%' THEN
                    RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.' USING ERRCODE = 'P0001';
                ELSE
                    RAISE EXCEPTION 'Booking conflict detected. Please retry or choose another slot.' USING ERRCODE = 'P0001';
                END IF;
            END;
    END;

    -- 11.5. Atomic Outbox Enqueue (Same Transaction)
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
        'studentId', v_student_id,
        'teacherId', v_teacher_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;

-- 8. Enqueue legacy bookings needing calendar/zoom sync
INSERT INTO public.integration_jobs (booking_id, job_type, status)
SELECT id, 'booking_sync', 'pending'
FROM public.bookings
WHERE status IN ('confirmed', 'rescheduled')
  AND google_calendar_event_id IS NULL
  AND (integration_status IS NULL OR integration_status IN ('pending', 'processing', 'failed'))
  AND teacher_id IS NOT NULL
ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

-- 9. Correct calendar_connections RLS (Teacher Tenant Isolation)
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher full access to calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher full access to own calendar_connections" ON public.calendar_connections;

CREATE POLICY "Teacher full access to own calendar_connections"
ON public.calendar_connections
FOR ALL TO authenticated
USING (
    teacher_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM public.teacher_accounts 
        WHERE lower(email) = lower(auth.jwt()->>'email') 
          AND is_active = true
    )
)
WITH CHECK (
    teacher_id = auth.uid() 
    AND EXISTS (
        SELECT 1 FROM public.teacher_accounts 
        WHERE lower(email) = lower(auth.jwt()->>'email') 
          AND is_active = true
    )
);
