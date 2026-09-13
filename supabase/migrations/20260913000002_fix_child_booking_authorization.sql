-- Migration: 20260913000002_fix_child_booking_authorization.sql
-- Purpose: Allow guardians to book on behalf of their legitimately linked children.
-- Ensures that the requested student_id is either the authenticated user's own student_id,
-- or belongs to a child linked to the authenticated user via the guardians table.

CREATE OR REPLACE FUNCTION public.create_booking_atomic(p_booking jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
    v_ref_code TEXT;
    v_management_token TEXT;
    v_management_token_hash TEXT;
    v_booking_id UUID;
    v_student_id UUID;
    v_requested_student_id UUID;
    v_lead_id UUID;
    v_service RECORD;
    v_calculated_fee NUMERIC(6, 2);
    v_rem_24h TIMESTAMPTZ;
    v_rem_1h TIMESTAMPTZ;
    
    v_contact_name TEXT := trim(p_booking->>'contact_name');
    v_contact_email TEXT := lower(trim(p_booking->>'contact_email'));
    v_contact_whatsapp TEXT := trim(p_booking->>'contact_whatsapp');
    v_parent_name TEXT := trim(p_booking->>'parent_name');
    v_audience TEXT := trim(p_booking->>'audience');
    v_service_id TEXT := trim(p_booking->>'service_id');
    v_booking_type TEXT := trim(p_booking->>'booking_type');
    v_duration INTEGER := (p_booking->>'duration_minutes')::INTEGER;
    v_scheduled_start TIMESTAMPTZ := (p_booking->>'scheduled_start')::TIMESTAMPTZ;
    v_scheduled_end TIMESTAMPTZ := (p_booking->>'scheduled_end')::TIMESTAMPTZ;
    v_timezone TEXT := trim(p_booking->>'student_timezone');
    v_cairo_time_display TEXT := trim(p_booking->>'cairo_time_display');
    v_goal TEXT := trim(p_booking->>'goal');
    v_notes TEXT := trim(p_booking->>'notes');
    v_auth_email TEXT;
BEGIN
    -- 1. Hardened Type Validations
    IF v_duration IS NULL OR v_duration <= 0 THEN
        RAISE EXCEPTION 'A valid lesson duration is required.' USING ERRCODE = 'P0001';
    END IF;
    
    IF v_scheduled_start IS NULL OR v_scheduled_end IS NULL THEN
        RAISE EXCEPTION 'Valid start and end times are required.' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Validate Time Sequence & Interval
    IF v_scheduled_end <= v_scheduled_start THEN
        RAISE EXCEPTION 'Lesson end time must be after start time.' USING ERRCODE = 'P0001';
    END IF;

    IF v_scheduled_end <> (v_scheduled_start + (v_duration || ' minutes')::INTERVAL) THEN
        RAISE EXCEPTION 'Lesson end time must exactly match the start time plus duration.' USING ERRCODE = 'P0001';
    END IF;

    -- 3. Minimum Lead Time Validation (10 minutes)
    IF v_scheduled_start < (now() + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'Bookings must be scheduled at least 10 minutes in advance.' USING ERRCODE = 'P0001';
    END IF;

    -- 4. Basic Contact Validation
    IF v_contact_name = '' OR length(v_contact_name) < 2 THEN
        RAISE EXCEPTION 'Student name is required.' USING ERRCODE = 'P0001';
    END IF;

    IF v_contact_email = '' OR v_contact_email NOT LIKE '%@%.%' THEN
        RAISE EXCEPTION 'A valid email address is required.' USING ERRCODE = 'P0001';
    END IF;

    IF v_audience NOT IN ('adult', 'child') THEN
        v_audience := 'adult';
    END IF;

    IF v_audience = 'child' AND (v_parent_name = '' OR length(v_parent_name) < 2) THEN
        RAISE EXCEPTION 'Parent name is required for child learners.' USING ERRCODE = 'P0001';
    END IF;

    -- 5. Service & Pricing Authoritative Resolution
    IF v_service_id = '' THEN
        RAISE EXCEPTION 'A valid service must be selected.' USING ERRCODE = 'P0001';
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
    IF auth.uid() IS NOT NULL THEN
        -- Authenticated user: resolve strictly via auth_user_id
        SELECT id, lower(email) INTO v_student_id, v_auth_email
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003';
        END IF;

        IF p_booking ? 'student_id'
            AND (p_booking->>'student_id') IS NOT NULL
            AND trim(p_booking->>'student_id') <> ''
        THEN
            v_requested_student_id := (p_booking->>'student_id')::UUID;
            
            -- If it's not their own ID, verify it's a legitimately linked child
            IF v_requested_student_id <> v_student_id THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.guardians 
                    WHERE student_id = v_requested_student_id 
                    AND lower(parent_email) = v_auth_email
                ) THEN
                    RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of an unauthorized student.' USING ERRCODE = 'P0003';
                END IF;
                -- Authorization passed, use the child's ID for the booking
                v_student_id := v_requested_student_id;
            END IF;
        END IF;
    ELSE
        -- Guest booking (auth.uid() IS NULL)
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
                GET STACKED DIAGNOSTICS v_constraint_name = CONSTRAINT_NAME;
                IF v_constraint_name = 'idx_bookings_one_trial' OR SQLERRM LIKE '%idx_bookings_one_trial%' THEN
                    RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.' USING ERRCODE = 'P0001';
                ELSE
                    RAISE EXCEPTION 'Booking conflict detected. Please retry or choose another slot.' USING ERRCODE = 'P0001';
                END IF;
            END;
    END;

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
