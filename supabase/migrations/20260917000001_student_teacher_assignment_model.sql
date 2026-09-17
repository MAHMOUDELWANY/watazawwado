-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — STUDENT → TEACHER ASSIGNMENT MODEL
-- Migration: 20260917000001_student_teacher_assignment_model.sql
-- Role:
-- 1. Add the authoritative students.assigned_teacher_id field.
-- 2. Protect it from browser self-assignment and non-teacher ownership.
-- 3. Resolve authenticated Student bookings from assigned teacher ownership.
-- 4. Remove Google Calendar count inference from the authenticated Student path.
-- ====================================================================

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS assigned_teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher_id
ON public.students(assigned_teacher_id);

CREATE OR REPLACE FUNCTION public.enforce_student_teacher_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- Only trusted server-side updates may assign a teacher.
    IF TG_OP = 'INSERT' THEN
        IF NEW.assigned_teacher_id IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1
                FROM public.teacher_accounts ta
                WHERE lower(ta.email) = lower((SELECT email FROM auth.users WHERE id = NEW.assigned_teacher_id))
                  AND ta.is_active = true
            ) THEN
                RAISE EXCEPTION 'Assigned teacher is not an active authorized teacher.' USING ERRCODE = 'P0003';
            END IF;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.assigned_teacher_id IS DISTINCT FROM OLD.assigned_teacher_id THEN
            IF auth.uid() IS NOT NULL AND auth.uid() = OLD.auth_user_id THEN
                RAISE EXCEPTION 'Students cannot modify assigned_teacher_id.' USING ERRCODE = 'P0003';
            END IF;

            IF NEW.assigned_teacher_id IS NOT NULL THEN
                IF NOT EXISTS (
                    SELECT 1
                    FROM public.teacher_accounts ta
                    WHERE lower(ta.email) = lower((SELECT email FROM auth.users WHERE id = NEW.assigned_teacher_id))
                      AND ta.is_active = true
                ) THEN
                    RAISE EXCEPTION 'Assigned teacher is not an active authorized teacher.' USING ERRCODE = 'P0003';
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_student_teacher_assignment ON public.students;
CREATE TRIGGER trg_enforce_student_teacher_assignment
BEFORE INSERT OR UPDATE OF assigned_teacher_id ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.enforce_student_teacher_assignment();

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
    v_assigned_teacher_id UUID := NULL;
BEGIN
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

    IF p_booking ? 'duration_minutes' AND (p_booking->>'duration_minutes') IS NOT NULL AND trim(p_booking->>'duration_minutes') <> '' THEN
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

    IF NOT (p_booking ? 'scheduled_start') OR (p_booking->>'scheduled_start') IS NULL OR trim(p_booking->>'scheduled_start') = '' THEN
        RAISE EXCEPTION 'Scheduled start time is required.' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
        v_scheduled_start := (p_booking->>'scheduled_start')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid scheduled start timestamp format.' USING ERRCODE = 'P0001';
    END;

    IF NOT (p_booking ? 'scheduled_end') OR (p_booking->>'scheduled_end') IS NULL OR trim(p_booking->>'scheduled_end') = '' THEN
        RAISE EXCEPTION 'Scheduled end time is required.' USING ERRCODE = 'P0001';
    END IF;

    BEGIN
        v_scheduled_end := (p_booking->>'scheduled_end')::TIMESTAMPTZ;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid scheduled end timestamp format.' USING ERRCODE = 'P0001';
    END;

    v_timezone := trim(COALESCE(p_booking->>'student_timezone', 'UTC'));
    IF v_timezone = '' THEN
        v_timezone := 'UTC';
    END IF;

    BEGIN
        PERFORM now() AT TIME ZONE v_timezone;
    EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Invalid student timezone.' USING ERRCODE = 'P0001';
    END;

    IF v_contact_name = '' OR length(v_contact_name) < 2 THEN
        RAISE EXCEPTION 'Student name is required.' USING ERRCODE = 'P0001';
    END IF;

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

    IF v_booking_type = 'trial' THEN
        v_calculated_fee := 0.00;
    ELSE
        v_calculated_fee := round((v_service.hourly_rate_usd * (v_duration::numeric / 60.0)), 2);
    END IF;

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
        v_teacher_id := auth.uid();

        IF p_booking ? 'teacher_id'
            AND (p_booking->>'teacher_id') IS NOT NULL
            AND trim(p_booking->>'teacher_id') <> ''
        THEN
            IF lower(trim(p_booking->>'teacher_id')) <> lower(v_teacher_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Teachers cannot override teacher ownership.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

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
        SELECT id INTO v_student_id
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003';
        END IF;

        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            IF lower(trim(p_booking->>'student_id')) <> lower(v_student_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of another student.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

        SELECT assigned_teacher_id INTO v_assigned_teacher_id
        FROM public.students
        WHERE id = v_student_id;

        IF v_assigned_teacher_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student is not assigned to a teacher.' USING ERRCODE = 'P0003';
        END IF;

        IF NOT EXISTS (
            SELECT 1
            FROM public.teacher_accounts ta
            WHERE lower(ta.email) = lower((SELECT email FROM auth.users WHERE id = v_assigned_teacher_id))
              AND ta.is_active = true
        ) THEN
            RAISE EXCEPTION 'Assigned teacher is not active or authorized.' USING ERRCODE = 'P0003';
        END IF;

        v_teacher_id := v_assigned_teacher_id;

        IF p_booking ? 'teacher_id'
            AND (p_booking->>'teacher_id') IS NOT NULL
            AND trim(p_booking->>'teacher_id') <> ''
        THEN
            IF lower(trim(p_booking->>'teacher_id')) <> lower(v_teacher_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Cannot override booking teacher ownership.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

    ELSE
        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            RAISE EXCEPTION 'Unauthenticated guests cannot specify a student ID.' USING ERRCODE = 'P0003';
        END IF;
        v_student_id := NULL;

        SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
        FROM public.calendar_connections
        WHERE is_active = true AND provider = 'google_calendar';

        IF v_active_connections_count = 1 THEN
            v_teacher_id := v_deterministic_teacher_id;
        ELSE
            v_teacher_id := NULL;
        END IF;
    END IF;

    LOOP
        v_ref_code := 'MHM-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE reference_code = v_ref_code);
    END LOOP;

    v_management_token := encode(extensions.gen_random_bytes(24), 'hex');
    v_management_token_hash := extensions.crypt(v_management_token, extensions.gen_salt('bf'));

    IF v_cairo_time_display = '' THEN
        v_cairo_time_display := to_char(v_scheduled_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM');
    END IF;

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

    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking_id, 'booking_sync', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;

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

    RETURN jsonb_build_object(
        'success', true,
        'bookingId', v_booking_id,
        'referenceCode', v_ref_code,
        'managementToken', v_management_token,
        'serviceName', COALESCE(v_service.title, '1-on-1 Lesson'),
        'feeAmountUsd', v_calculated_fee,
        'zoomMeetingLink', 'pending',
        'studentId', v_student_id,
        'teacherId', v_teacher_id,
        'status', 'confirmed'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;
