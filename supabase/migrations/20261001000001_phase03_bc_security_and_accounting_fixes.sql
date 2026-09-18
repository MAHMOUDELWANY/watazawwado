-- ====================================================================
-- Migration: Phase 03-B/C Security and Accounting Fixes
-- Purpose:
-- 1. Restrict activate_package_entitlement_atomic to service_role only.
-- 2. Fix package_credit_ledger grant accounting (delta_credits = 1 constraints).
-- 3. Restrict create_package_entitlement_atomic to authenticated only.
-- 4. Harden create_booking_atomic package ownership boundaries.
-- 5. Harden teacher_record_lesson_outcome authorization.
-- ====================================================================

-- 1. Correct activate_package_entitlement_atomic
-- Revoke all to reset privileges
REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) FROM authenticated;

CREATE OR REPLACE FUNCTION public.activate_package_entitlement_atomic(
    p_entitlement_id UUID,
    p_payment_reference TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_entitlement record;
    i INT;
BEGIN
    SELECT * INTO v_entitlement
    FROM public.package_entitlements
    WHERE id = p_entitlement_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Entitlement not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_entitlement.status = 'active' THEN
        RETURN jsonb_build_object('success', true, 'isIdempotent', true, 'message', 'Entitlement already active');
    END IF;

    IF v_entitlement.status != 'pending_payment' THEN
        RAISE EXCEPTION 'Cannot activate entitlement from status: %', v_entitlement.status USING ERRCODE = 'P0004';
    END IF;

    UPDATE public.package_entitlements
    SET status = 'active',
        remaining_credits = purchased_quantity,
        payment_reference = COALESCE(p_payment_reference, payment_reference),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_entitlement_id;

    -- The ledger check constraint strictly enforces delta_credits = ANY (ARRAY['-1', 0, '1'])
    -- Therefore, we must insert purchased_quantity individual records to correctly account for the grant.
    FOR i IN 1..v_entitlement.purchased_quantity LOOP
        INSERT INTO public.package_credit_ledger (
            package_entitlement_id,
            learner_student_id,
            activity_type,
            delta_credits,
            idempotency_key
        ) VALUES (
            p_entitlement_id,
            v_entitlement.learner_student_id,
            'grant',
            1,
            'grant_' || p_entitlement_id::text || '_' || i::text
        ) ON CONFLICT DO NOTHING;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'entitlementId', p_entitlement_id,
        'status', 'active',
        'creditsGranted', v_entitlement.purchased_quantity
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.activate_package_entitlement_atomic(UUID, TEXT) TO service_role;


-- 2. Restrict create_package_entitlement_atomic
REVOKE ALL ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.create_package_entitlement_atomic(UUID, UUID) TO authenticated;


-- 3. Harden create_booking_atomic package ownership boundaries
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

    v_auth_email TEXT;
    v_requested_student_id UUID;
    v_assigned_teacher_id UUID;

    v_package_entitlement_id UUID := NULL;
    v_entitlement record;
BEGIN
    v_contact_name := trim(p_booking->>'contact_name');
    v_contact_email := lower(trim(p_booking->>'contact_email'));
    v_contact_whatsapp := trim(p_booking->>'contact_whatsapp');
    v_parent_name := trim(p_booking->>'parent_name');
    v_audience := p_booking->>'audience';
    v_service_id := p_booking->>'service_id';
    v_booking_type := p_booking->>'booking_type';
    v_duration := (p_booking->>'duration_minutes')::INT;
    v_scheduled_start := (p_booking->>'scheduled_start')::TIMESTAMPTZ;
    v_scheduled_end := (p_booking->>'scheduled_end')::TIMESTAMPTZ;
    v_timezone := trim(p_booking->>'student_timezone');
    v_cairo_time_display := trim(p_booking->>'cairo_time_display');
    v_goal := trim(p_booking->>'goal');
    v_notes := trim(p_booking->>'notes');

    IF p_booking ? 'package_entitlement_id' AND (p_booking->>'package_entitlement_id') IS NOT NULL AND trim(p_booking->>'package_entitlement_id') <> '' THEN
        v_package_entitlement_id := (p_booking->>'package_entitlement_id')::UUID;
    END IF;

    IF v_contact_name = '' OR v_contact_email = '' OR v_service_id = '' OR v_duration IS NULL OR v_scheduled_start IS NULL OR v_scheduled_end IS NULL THEN
        RAISE EXCEPTION 'Missing required booking fields.' USING ERRCODE = 'P0001';
    END IF;

    IF v_audience = 'child' AND (v_parent_name IS NULL OR v_parent_name = '') THEN
        RAISE EXCEPTION 'Parent name is required for child learners.' USING ERRCODE = 'P0001';
    END IF;

    IF v_scheduled_start <= timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Booking start time must be in the future.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_service
    FROM public.services
    WHERE id = v_service_id AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected service is not available.' USING ERRCODE = 'P0001';
    END IF;

    IF NOT (v_duration = ANY(v_service.supported_durations)) THEN
        RAISE EXCEPTION 'The selected duration is not supported for this service.' USING ERRCODE = 'P0001';
    END IF;

    IF v_booking_type = 'trial' AND NOT COALESCE(v_service.trial_allowed, false) THEN
        RAISE EXCEPTION 'The selected service is not eligible for a free trial.' USING ERRCODE = 'P0001';
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

        IF p_booking ? 'teacher_id' AND (p_booking->>'teacher_id') IS NOT NULL AND trim(p_booking->>'teacher_id') <> '' THEN
            IF lower(trim(p_booking->>'teacher_id')) <> lower(v_teacher_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Teachers cannot override teacher ownership.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

        IF p_booking ? 'student_id' AND (p_booking->>'student_id') IS NOT NULL AND trim(p_booking->>'student_id') <> '' THEN
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
        SELECT id, lower(email) INTO v_student_id, v_auth_email
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.' USING ERRCODE = 'P0003';
        END IF;

        IF p_booking ? 'student_id' AND (p_booking->>'student_id') IS NOT NULL AND trim(p_booking->>'student_id') <> '' THEN
            v_requested_student_id := (p_booking->>'student_id')::UUID;
            IF v_requested_student_id <> v_student_id THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.guardians
                    WHERE student_id = v_requested_student_id
                    AND lower(parent_email) = v_auth_email
                ) THEN
                    RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of an unauthorized student.' USING ERRCODE = 'P0003';
                END IF;
                v_student_id := v_requested_student_id;
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

        IF p_booking ? 'teacher_id' AND (p_booking->>'teacher_id') IS NOT NULL AND trim(p_booking->>'teacher_id') <> '' THEN
            IF lower(trim(p_booking->>'teacher_id')) <> lower(v_teacher_id::text) THEN
                RAISE EXCEPTION 'Forbidden. Cannot override booking teacher ownership.' USING ERRCODE = 'P0003';
            END IF;
        END IF;

    ELSE
        IF p_booking ? 'student_id' AND (p_booking->>'student_id') IS NOT NULL AND trim(p_booking->>'student_id') <> '' THEN
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

    -- Entitlement validation and fee calculation
    IF v_package_entitlement_id IS NOT NULL THEN
        -- Prevent unauthenticated guests from using entitlements
        IF auth.uid() IS NULL THEN
            RAISE EXCEPTION 'Unauthenticated users cannot use package entitlements.' USING ERRCODE = 'P0003';
        END IF;

        SELECT * INTO v_entitlement
        FROM public.package_entitlements
        WHERE id = v_package_entitlement_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Package entitlement not found.' USING ERRCODE = 'P0002';
        END IF;

        IF v_entitlement.status != 'active' THEN
            RAISE EXCEPTION 'Package entitlement is not active.' USING ERRCODE = 'P0003';
        END IF;

        IF v_entitlement.remaining_credits <= 0 THEN
            RAISE EXCEPTION 'Package entitlement has no remaining credits.' USING ERRCODE = 'P0003';
        END IF;

        -- Strictly enforce cross-account usage boundaries
        IF v_entitlement.purchaser_account_id != auth.uid() AND v_is_teacher = false THEN
            RAISE EXCEPTION 'Forbidden. Cannot use a package entitlement belonging to another account.' USING ERRCODE = 'P0003';
        END IF;

        -- If an entitlement is explicitly bound to a learner, enforce it matches the booking learner
        IF v_entitlement.learner_student_id IS NOT NULL AND v_entitlement.learner_student_id != v_student_id THEN
             RAISE EXCEPTION 'Package entitlement belongs to a different student.' USING ERRCODE = 'P0003';
        END IF;

        -- We do not decrement credits here! That happens on lesson completion.
        v_calculated_fee := 0.00;
    ELSE
        IF v_booking_type = 'trial' THEN
            v_calculated_fee := 0.00;
        ELSE
            v_calculated_fee := round((v_service.hourly_rate_usd * (v_duration::numeric / 60.0)), 2);
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
            integration_status, sync_metadata, package_entitlement_id
        ) VALUES (
            v_ref_code, v_management_token, v_management_token_hash, v_student_id, v_teacher_id, v_lead_id, v_service.id, v_booking_type, v_duration,
            v_scheduled_start, v_scheduled_end, v_timezone, v_cairo_time_display,
            'confirmed', v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), NULLIF(v_parent_name, ''),
            v_calculated_fee, 'pending', v_notes,
            'pending', '{}'::jsonb, v_package_entitlement_id
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
        'status', 'confirmed',
        'packageEntitlementId', v_package_entitlement_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;


-- 4. Harden teacher_record_lesson_outcome authorization
REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) FROM anon;

CREATE OR REPLACE FUNCTION public.teacher_record_lesson_outcome(
    p_booking_id UUID,
    p_teacher_id UUID,
    p_outcome TEXT,
    p_notes TEXT DEFAULT NULL,
    p_covered_material TEXT DEFAULT NULL,
    p_consume_package_credit BOOLEAN DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking record;
    v_session_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
    v_entitlement record;
    v_activity_type TEXT;
BEGIN
    -- Authorization Check First
    IF auth.role() = 'authenticated' AND auth.uid() != p_teacher_id THEN
        RAISE EXCEPTION 'Unauthorized: authenticated users cannot impersonate teacher outcomes.' USING ERRCODE = 'P0003';
    END IF;

    -- 1. Input Validation
    IF p_outcome NOT IN ('completed', 'no_show') THEN
        RAISE EXCEPTION 'Invalid outcome: must be completed or no_show.' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Lock the booking to prevent concurrent conflicting transitions
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Authorization Check
    IF v_booking.teacher_id IS NULL OR v_booking.teacher_id != p_teacher_id THEN
        RAISE EXCEPTION 'Not authorized to manage this booking.' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Idempotency Check
    IF v_booking.status = p_outcome THEN
        RETURN jsonb_build_object(
            'success', true,
            'isIdempotent', true,
            'message', 'Booking already marked as ' || p_outcome,
            'booking', row_to_json(v_booking)
        );
    END IF;

    -- 5. Transition Rule Validation
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot change status of a cancelled booking.' USING ERRCODE = 'P0004';
    END IF;

    IF (v_booking.status = 'completed' AND p_outcome = 'no_show') OR
       (v_booking.status = 'no_show' AND p_outcome = 'completed') THEN
        RAISE EXCEPTION 'Cannot transition directly from % to %.', v_booking.status, p_outcome USING ERRCODE = 'P0004';
    END IF;

    -- 6. Future Lesson Protection
    IF p_outcome = 'completed' AND v_booking.scheduled_start > (v_now + interval '15 minutes') THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as completed before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    IF p_outcome = 'no_show' AND v_booking.scheduled_start > v_now THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as no-show before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    -- X. Package Credit Consumption
    IF v_booking.package_entitlement_id IS NOT NULL THEN
        SELECT * INTO v_entitlement
        FROM public.package_entitlements
        WHERE id = v_booking.package_entitlement_id
        FOR UPDATE;

        IF p_outcome = 'completed' THEN
            IF v_entitlement.remaining_credits <= 0 THEN
                RAISE EXCEPTION 'Cannot complete: Package entitlement has no remaining credits.' USING ERRCODE = 'P0003';
            END IF;

            UPDATE public.package_entitlements
            SET remaining_credits = remaining_credits - 1,
                used_credits = used_credits + 1,
                updated_at = v_now
            WHERE id = v_entitlement.id;

            INSERT INTO public.package_credit_ledger (
                package_entitlement_id,
                booking_id,
                learner_student_id,
                activity_type,
                delta_credits,
                idempotency_key
            ) VALUES (
                v_entitlement.id,
                v_booking.id,
                v_booking.student_id,
                'completed_consumed',
                -1,
                'complete_' || v_booking.id::text
            ) ON CONFLICT DO NOTHING;

        ELSIF p_outcome = 'no_show' THEN
            IF p_consume_package_credit = true THEN
                IF v_entitlement.remaining_credits <= 0 THEN
                    RAISE EXCEPTION 'Cannot consume credit for no-show: Package entitlement has no remaining credits.' USING ERRCODE = 'P0003';
                END IF;

                UPDATE public.package_entitlements
                SET remaining_credits = remaining_credits - 1,
                    used_credits = used_credits + 1,
                    updated_at = v_now
                WHERE id = v_entitlement.id;

                INSERT INTO public.package_credit_ledger (
                    package_entitlement_id,
                    booking_id,
                    learner_student_id,
                    activity_type,
                    delta_credits,
                    idempotency_key
                ) VALUES (
                    v_entitlement.id,
                    v_booking.id,
                    v_booking.student_id,
                    'no_show_used',
                    -1,
                    'noshow_used_' || v_booking.id::text
                ) ON CONFLICT DO NOTHING;
            ELSE
                INSERT INTO public.package_credit_ledger (
                    package_entitlement_id,
                    booking_id,
                    learner_student_id,
                    activity_type,
                    delta_credits,
                    idempotency_key
                ) VALUES (
                    v_entitlement.id,
                    v_booking.id,
                    v_booking.student_id,
                    'no_show_returned',
                    0,
                    'noshow_ret_' || v_booking.id::text
                ) ON CONFLICT DO NOTHING;
            END IF;
        END IF;
    END IF;

    -- 7. Update Booking
    UPDATE public.bookings
    SET status = p_outcome,
        notes = COALESCE(p_notes, notes),
        updated_at = v_now
    WHERE id = p_booking_id;

    -- 8. Upsert Lesson Session (if student is linked)
    IF v_booking.student_id IS NOT NULL THEN
        SELECT id INTO v_session_id
        FROM public.lesson_sessions
        WHERE booking_id = p_booking_id;

        IF v_session_id IS NULL THEN
            INSERT INTO public.lesson_sessions (
                booking_id,
                student_id,
                lesson_date,
                attendance,
                completion_status,
                covered_material,
                teacher_observations
            ) VALUES (
                p_booking_id,
                v_booking.student_id,
                COALESCE(v_booking.scheduled_start, v_now),
                CASE WHEN p_outcome = 'completed' THEN 'attended' ELSE 'student_no_show' END,
                CASE WHEN p_outcome = 'completed' THEN 'completed' ELSE 'cancelled' END,
                p_covered_material,
                COALESCE(p_notes, CASE WHEN p_outcome = 'no_show' THEN 'Student did not attend scheduled lesson' ELSE NULL END)
            );
        ELSE
            UPDATE public.lesson_sessions
            SET attendance = CASE WHEN p_outcome = 'completed' THEN 'attended' ELSE 'student_no_show' END,
                completion_status = CASE WHEN p_outcome = 'completed' THEN 'completed' ELSE 'cancelled' END,
                covered_material = COALESCE(p_covered_material, covered_material),
                teacher_observations = COALESCE(p_notes, teacher_observations),
                updated_at = v_now
            WHERE id = v_session_id;
        END IF;
    END IF;

    -- Fetch updated booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'isIdempotent', false,
        'message', 'Booking marked as ' || p_outcome,
        'booking', row_to_json(v_booking)
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN) TO authenticated, service_role;
