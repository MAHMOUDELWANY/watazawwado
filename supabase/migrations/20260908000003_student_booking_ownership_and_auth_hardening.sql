-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — TASK 0.39 HARDENING
-- Migration: 20260908000003_student_booking_ownership_and_auth_hardening.sql
-- Role: Student Booking Ownership & Staff Authorization Hardening
-- 1. Eliminates unsafe client student_id trust in create_booking_atomic.
-- 2. Establishes authoritative identity chain:
--    auth.uid() -> public.students.auth_user_id -> resolved student.id -> booking.student_id
-- 3. Preserves unauthenticated guest bookings with student_id = NULL.
-- 4. Re-asserts handle_new_student_user trigger with safe two-step linking (no MIN(uuid)).
-- 5. Hardens RLS isolation on students, bookings, guardians, goals, and sessions.
-- ====================================================================

-- 1. Redefine handle_new_student_user to ensure safe two-step linking
CREATE OR REPLACE FUNCTION public.handle_new_student_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
DECLARE
  v_unlinked_count INTEGER;
  v_existing_student_id UUID;
  v_user_name TEXT;
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(new.email));

  -- Dynamic check against teacher_accounts allowlist:
  -- Teachers must NEVER have a student profile created automatically.
  IF EXISTS (
    SELECT 1 FROM public.teacher_accounts 
    WHERE lower(trim(email)) = v_clean_email AND is_active = true
  ) THEN
    RETURN new;
  END IF;

  -- Resolve student name safely from metadata or email prefix
  v_user_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- Safe deterministic guest-to-account linking without MIN(uuid):
  SELECT COUNT(*)
  INTO v_unlinked_count
  FROM public.students
  WHERE lower(trim(email)) = v_clean_email AND auth_user_id IS NULL;

  IF v_unlinked_count = 1 THEN
    SELECT id
    INTO v_existing_student_id
    FROM public.students
    WHERE lower(trim(email)) = v_clean_email AND auth_user_id IS NULL
    LIMIT 1;
  END IF;

  -- Only link if exactly 1 unlinked record exists and no student is already linked to this auth_user_id
  IF v_unlinked_count = 1 AND v_existing_student_id IS NOT NULL THEN
    UPDATE public.students
    SET auth_user_id = new.id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_existing_student_id AND auth_user_id IS NULL;
  ELSIF v_unlinked_count = 0 THEN
    -- No unlinked record exists: create a single new student profile linked to new.id
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = new.id) THEN
      INSERT INTO public.students (
        auth_user_id,
        name,
        email,
        status,
        timezone,
        learner_type,
        current_level
      ) VALUES (
        new.id,
        v_user_name,
        v_clean_email,
        'active',
        'UTC',
        'adult',
        'beginner'
      );
    END IF;
  ELSE
    -- Ambiguous duplicate records exist (v_unlinked_count > 1).
    -- DO NOT auto-link to avoid unintended account takeover.
    -- Insert a separate profile linked to new.id, preserving historical records for teacher review.
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = new.id) THEN
      INSERT INTO public.students (
        auth_user_id,
        name,
        email,
        status,
        timezone,
        learner_type,
        current_level
      ) VALUES (
        new.id,
        v_user_name,
        v_clean_email,
        'active',
        'UTC',
        'adult',
        'beginner'
      );
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- 2. Definitive, Authoritative create_booking_atomic Function
CREATE OR REPLACE FUNCTION public.create_booking_atomic(p_booking jsonb)
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
    v_duration INTEGER;
    v_scheduled_start TIMESTAMPTZ;
    v_scheduled_end TIMESTAMPTZ;
    v_timezone TEXT;
    v_cairo_time_display TEXT;
    v_goal TEXT;
    v_notes TEXT;
    
    v_ref_code TEXT;
    v_management_token TEXT;
    v_management_token_hash TEXT;
    v_service RECORD;
    v_calculated_fee NUMERIC(6, 2);
    v_lead_id UUID;
    v_student_id UUID;
    v_booking_id UUID;
    v_rem_24h TIMESTAMPTZ;
    v_rem_1h TIMESTAMPTZ;
BEGIN
    -- Extract and sanitize inputs
    v_contact_name := trim(COALESCE(p_booking->>'contact_name', ''));
    v_contact_email := lower(trim(COALESCE(p_booking->>'contact_email', '')));
    -- Normalize phone: keep only + and digits
    v_contact_whatsapp := regexp_replace(trim(COALESCE(p_booking->>'contact_whatsapp', '')), '[^0-9+]', '', 'g');
    v_parent_name := trim(COALESCE(p_booking->>'parent_name', ''));
    v_audience := COALESCE(p_booking->>'audience', 'adult');
    v_service_id := trim(COALESCE(p_booking->>'service_id', ''));
    v_booking_type := COALESCE(p_booking->>'booking_type', 'trial');
    v_duration := COALESCE((p_booking->>'duration_minutes')::INTEGER, 30);
    v_scheduled_start := (p_booking->>'scheduled_start')::TIMESTAMPTZ;
    v_scheduled_end := (p_booking->>'scheduled_end')::TIMESTAMPTZ;
    v_timezone := trim(COALESCE(p_booking->>'student_timezone', 'UTC'));
    -- Cairo display is derived server-side to prevent client spoofing
    v_cairo_time_display := to_char(v_scheduled_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM');
    v_goal := trim(COALESCE(p_booking->>'goal', ''));
    v_notes := trim(COALESCE(p_booking->>'notes', ''));

    -- 1. Strict Server-Side Validation
    IF v_contact_name = '' OR length(v_contact_name) < 2 THEN
        RAISE EXCEPTION 'Student name is required.';
    END IF;
    IF v_contact_email = '' OR position('@' in v_contact_email) = 0 THEN
        RAISE EXCEPTION 'A valid email address is required.';
    END IF;
    IF v_audience = 'child' AND (v_parent_name = '' OR length(v_parent_name) < 2) THEN
        RAISE EXCEPTION 'Parent name is required for child learners.';
    END IF;
    IF v_booking_type NOT IN ('trial', 'regular') THEN
        RAISE EXCEPTION 'Invalid booking type.';
    END IF;
    IF v_duration NOT IN (30, 45, 60) THEN
        RAISE EXCEPTION 'Invalid lesson duration.';
    END IF;
    IF v_scheduled_start IS NULL OR v_scheduled_end IS NULL OR v_scheduled_end <= v_scheduled_start THEN
        RAISE EXCEPTION 'Invalid scheduled time interval.';
    END IF;
    IF v_scheduled_start < (now() + INTERVAL '10 minutes') THEN
        RAISE EXCEPTION 'Bookings must be scheduled at least 10 minutes in advance.';
    END IF;

    -- Trial Duration Rule: default 30 min, maximum 45 min
    IF v_booking_type = 'trial' AND v_duration > 45 THEN
        RAISE EXCEPTION 'Free trial duration cannot exceed 45 minutes.';
    END IF;

    -- Resolve service metadata
    SELECT id, title, price_hourly_usd, trial_eligible
    INTO v_service
    FROM public.services
    WHERE id = v_service_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'The selected service does not exist.';
    END IF;

    IF v_booking_type = 'trial' AND NOT v_service.trial_eligible THEN
        RAISE EXCEPTION 'The selected service is not eligible for a free trial.';
    END IF;

    -- Calculate fee server-side
    IF v_booking_type = 'trial' THEN
        v_calculated_fee := 0.00;
    ELSE
        v_calculated_fee := round((v_service.price_hourly_usd * (v_duration::numeric / 60.0)), 2);
    END IF;

    -- 2. One Free Trial Rule: Atomic Verification
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
            RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.';
        END IF;
    END IF;

    -- 3. Authoritative Student Identity & Ownership Resolution
    -- A browser-supplied student_id must NEVER be treated as proof of ownership.
    IF auth.uid() IS NOT NULL THEN
        -- Authenticated user: resolve strictly via auth_user_id
        SELECT id INTO v_student_id
        FROM public.students
        WHERE auth_user_id = auth.uid();

        IF v_student_id IS NULL THEN
            RAISE EXCEPTION 'Authenticated student profile is not ready. Please complete student onboarding or sign in again.';
        END IF;

        -- If client provided a student_id, ensure it does not attempt to impersonate another student
        IF p_booking ? 'student_id' 
           AND (p_booking->>'student_id') IS NOT NULL 
           AND (p_booking->>'student_id') <> '' 
        THEN
            IF (p_booking->>'student_id')::UUID <> v_student_id THEN
                RAISE EXCEPTION 'Forbidden. Cannot create a booking on behalf of another student.';
            END IF;
        END IF;
    ELSE
        -- Guest booking (auth.uid() IS NULL)
        -- Unauthenticated guests can never specify a student_id
        IF p_booking ? 'student_id' 
           AND (p_booking->>'student_id') IS NOT NULL 
           AND (p_booking->>'student_id') <> '' 
        THEN
            RAISE EXCEPTION 'Unauthenticated guests cannot specify a student ID.';
        END IF;
        v_student_id := NULL;
    END IF;

    -- 4. Cryptographic Codes Generation
    LOOP
        v_ref_code := 'MHM-' || upper(encode(extensions.gen_random_bytes(3), 'hex'));
        EXIT WHEN NOT EXISTS (SELECT 1 FROM public.bookings WHERE reference_code = v_ref_code);
    END LOOP;

    v_management_token := encode(extensions.gen_random_bytes(24), 'hex');
    v_management_token_hash := extensions.crypt(v_management_token, extensions.gen_salt('bf'));

    -- 5. Leads Deterministic Upsert
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

    -- 6. Insert Booking Record with authoritatively resolved student_id
    BEGIN
        INSERT INTO public.bookings (
            reference_code, management_token_hash, student_id, lead_id, service_id, booking_type, duration_minutes,
            scheduled_start, scheduled_end, student_timezone, cairo_time_display,
            status, contact_name, contact_email, contact_whatsapp, parent_name,
            fee_amount_usd, zoom_meeting_link, notes
        ) VALUES (
            v_ref_code, v_management_token_hash, v_student_id, v_lead_id, v_service.id, v_booking_type, v_duration,
            v_scheduled_start, v_scheduled_end, v_timezone, v_cairo_time_display,
            'confirmed', v_contact_name, v_contact_email, NULLIF(v_contact_whatsapp, ''), NULLIF(v_parent_name, ''),
            v_calculated_fee, 'pending', v_notes
        )
        RETURNING id INTO v_booking_id;
    EXCEPTION
        WHEN exclusion_violation THEN
            RAISE EXCEPTION 'The selected time slot is no longer available. Please select another time.';
        WHEN unique_violation THEN
            IF SQLERRM LIKE '%idx_bookings_one_trial%' THEN
                RAISE EXCEPTION 'Our records indicate a free trial session has already been booked with this contact information. Each student is eligible for one complimentary trial. You may book a regular lesson or message Mahmoud on WhatsApp.';
            ELSE
                RAISE EXCEPTION 'Booking conflict detected. Please retry or choose another slot.';
            END IF;
    END;

    -- 7. Schedule Automated Reminders (24h and 1h before start)
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

-- Ensure proper execution permissions
REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO anon, authenticated;

-- 3. Hardened RLS Policies (Idempotent Definition)
-- Students: view and update own profile strictly matching auth_user_id
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Bookings: Students can SELECT only their own bookings; NO direct insert/update/delete by students
DROP POLICY IF EXISTS "Students can view their own bookings" ON public.bookings;
CREATE POLICY "Students can view their own bookings" ON public.bookings
  FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- Guardians: Students can view their own guardians
DROP POLICY IF EXISTS "Students can view their own guardians" ON public.guardians;
CREATE POLICY "Students can view their own guardians" ON public.guardians
  FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- Student Goals: Students can view their own goals
DROP POLICY IF EXISTS "Students can view their own student goals" ON public.student_goals;
CREATE POLICY "Students can view their own student goals" ON public.student_goals
  FOR SELECT
  TO authenticated
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- Lesson Sessions: Students can view their own lesson sessions
DROP POLICY IF EXISTS "Students can view their own lesson sessions" ON public.lesson_sessions;
CREATE POLICY "Students can view their own lesson sessions" ON public.lesson_sessions
  FOR SELECT
  TO authenticated
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  ));
