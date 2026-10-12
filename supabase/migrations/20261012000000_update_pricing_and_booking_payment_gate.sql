-- ====================================================================
-- Migration: Update Services Pricing Baseline and Gate Paid Booking Confirmation
-- File: supabase/migrations/20261012000000_update_pricing_and_booking_payment_gate.sql
-- 
-- Purpose:
-- 1. Update services hourly rates to match approved baselines:
--    - Religious/Quran/Islamic Studies: $9/hr baseline ($5 for 30m, $7 for 45m, $9 for 60m)
--    - Arabic (Fusha, Egyptian) & English: $13/hr ($7 for 30m, $10 for 45m, $13 for 60m)
-- 2. Update package_catalog weekly/monthly baseline rates.
-- 3. Update create_booking_atomic so that regular paid bookings default to status = 'pending'
--    until verified by payment (verify_payment_atomic), while free trials and package credit
--    redemptions are confirmed immediately.
-- ====================================================================

-- 1. UPDATE SERVICES HOURLY RATES
UPDATE public.services
SET hourly_rate_usd = 9.00,
    updated_at = timezone('utc'::text, now())
WHERE id IN (
    'quran-reading',
    'tajweed',
    'quran-memorization',
    'quran-revision',
    'islamic-studies',
    'fiqh',
    'aqeedah',
    'seerah',
    'arabic-foundations'
) OR category IN ('quran', 'islamic_studies');

UPDATE public.services
SET hourly_rate_usd = 13.00,
    updated_at = timezone('utc'::text, now())
WHERE id IN (
    'arabic-conversation',
    'modern-standard-arabic',
    'egyptian-arabic',
    'english'
) OR category IN ('arabic', 'english') AND id != 'arabic-foundations';

-- 2. UPDATE PACKAGE CATALOG (if present)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'package_catalog') THEN
        -- 1 lesson weekly baseline = $9.00
        UPDATE public.package_catalog
        SET price_amount = 9.00,
            updated_at = timezone('utc'::text, now())
        WHERE lesson_count = 1 AND currency = 'USD' AND package_type = 'weekly';

        -- 4 lessons bundle = $36.00 (or $34 with discount)
        UPDATE public.package_catalog
        SET price_amount = 34.00,
            updated_at = timezone('utc'::text, now())
        WHERE lesson_count = 4 AND currency = 'USD' AND package_type = 'weekly';

        -- 8 lessons bundle = $68.00 (or $64 with discount)
        UPDATE public.package_catalog
        SET price_amount = 64.00,
            updated_at = timezone('utc'::text, now())
        WHERE lesson_count = 8 AND currency = 'USD' AND package_type = 'weekly';

        -- 12 lessons bundle = $96.00 (or $92 with discount)
        UPDATE public.package_catalog
        SET price_amount = 92.00,
            updated_at = timezone('utc'::text, now())
        WHERE lesson_count = 12 AND currency = 'USD' AND package_type = 'weekly';
    END IF;
END $$;

-- 3. UPDATE create_booking_atomic RPC
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
    v_booking_status TEXT;
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
            SELECT id INTO v_student_id
            FROM public.students
            WHERE lower(email) = v_contact_email
            LIMIT 1;
        END IF;

        IF p_booking ? 'student_id' AND (p_booking->>'student_id') IS NOT NULL AND trim(p_booking->>'student_id') <> '' THEN
            BEGIN
                v_requested_student_id := (trim(p_booking->>'student_id'))::UUID;
            EXCEPTION WHEN OTHERS THEN
                RAISE EXCEPTION 'Invalid student identifier.' USING ERRCODE = 'P0001';
            END;

            IF v_requested_student_id != v_student_id THEN
                IF NOT EXISTS (
                    SELECT 1 FROM public.students
                    WHERE id = v_requested_student_id
                      AND guardian_account_id = auth.uid()
                ) THEN
                    RAISE EXCEPTION 'Forbidden. You do not have permission to book for this student.' USING ERRCODE = 'P0003';
                END IF;
                v_student_id := v_requested_student_id;
            END IF;
        END IF;

        SELECT assigned_teacher_id INTO v_assigned_teacher_id
        FROM public.students
        WHERE id = v_student_id;

        IF v_assigned_teacher_id IS NULL THEN
            SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
            FROM public.calendar_connections
            WHERE is_active = true AND provider = 'google_calendar';

            IF v_active_connections_count = 1 THEN
                v_assigned_teacher_id := v_deterministic_teacher_id;
            ELSE
                v_assigned_teacher_id := NULL;
            END IF;
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

        IF v_entitlement.purchaser_account_id != auth.uid() AND v_is_teacher = false THEN
            RAISE EXCEPTION 'Forbidden. Cannot use a package entitlement belonging to another account.' USING ERRCODE = 'P0003';
        END IF;

        IF v_entitlement.learner_student_id IS NOT NULL AND v_entitlement.learner_student_id != v_student_id THEN
             RAISE EXCEPTION 'Package entitlement belongs to a different student.' USING ERRCODE = 'P0003';
        END IF;

        v_calculated_fee := 0.00;
        v_booking_status := 'confirmed';
    ELSE
        IF v_booking_type = 'trial' THEN
            v_calculated_fee := 0.00;
            v_booking_status := 'confirmed';
        ELSE
            -- Precise fee calculation matching approved baselines:
            -- 30 min: $5 (for $9/hr) or $7 (for $13/hr)
            -- 45 min: $7 (for $9/hr) or $10 (for $13/hr)
            -- 60 min: $9 (for $9/hr) or $13 (for $13/hr)
            IF v_duration = 30 THEN
                IF v_service.hourly_rate_usd = 9.00 THEN
                    v_calculated_fee := 5.00;
                ELSIF v_service.hourly_rate_usd = 13.00 THEN
                    v_calculated_fee := 7.00;
                ELSE
                    v_calculated_fee := round(v_service.hourly_rate_usd * 0.56, 2);
                END IF;
            ELSIF v_duration = 45 THEN
                IF v_service.hourly_rate_usd = 9.00 THEN
                    v_calculated_fee := 7.00;
                ELSIF v_service.hourly_rate_usd = 13.00 THEN
                    v_calculated_fee := 10.00;
                ELSE
                    v_calculated_fee := round(v_service.hourly_rate_usd * 0.78, 2);
                END IF;
            ELSE
                v_calculated_fee := v_service.hourly_rate_usd;
            END IF;

            -- Paid bookings are 'pending' until automated live payment completes!
            v_booking_status := 'pending';
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
            v_booking_status, v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), NULLIF(v_parent_name, ''),
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
                    RAISE EXCEPTION 'A booking conflict occurred. Please select another time.' USING ERRCODE = 'P0001';
                END IF;
            END;
    END;

    INSERT INTO public.outbox_integration_jobs (
        booking_id, job_type, payload, status
    ) VALUES (
        v_booking_id,
        'create_booking',
        jsonb_build_object(
            'bookingId', v_booking_id,
            'referenceCode', v_ref_code,
            'learnerName', v_contact_name,
            'parentName', v_parent_name,
            'serviceName', v_service.title,
            'mode', v_booking_type,
            'scheduledStart', v_scheduled_start,
            'scheduledEnd', v_scheduled_end,
            'studentTimezone', v_timezone,
            'cairoTimeDisplay', v_cairo_time_display,
            'durationMinutes', v_duration,
            'contactEmail', v_contact_email,
            'contactWhatsapp', v_contact_whatsapp,
            'notes', v_notes
        ),
        'pending'
    )
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
        'status', v_booking_status,
        'packageEntitlementId', v_package_entitlement_id
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO authenticated;
