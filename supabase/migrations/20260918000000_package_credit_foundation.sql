-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PACKAGE CREDIT FOUNDATION
-- Migration: 20260918000000_package_credit_foundation.sql
-- Role: Safe package catalog, entitlement, and credit-ledger foundation
-- Scope: This phase intentionally excludes purchase/activation grants.
--        Package entitlements remain server-authoritative and are not
--        directly grantable by browser clients. Future payment confirmation
--        will be added in a separate migration.
-- ====================================================================

DROP FUNCTION IF EXISTS public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.teacher_record_lesson_outcome_v2(UUID, UUID, TEXT, TEXT, TEXT, TEXT);

CREATE TABLE IF NOT EXISTS public.package_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_type TEXT NOT NULL CHECK (package_type IN ('weekly', 'monthly')),
    name TEXT NOT NULL,
    lesson_count INTEGER NOT NULL CHECK (lesson_count > 0),
    price_amount NUMERIC(10, 2) NOT NULL CHECK (price_amount >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    eligibility_rules JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.package_entitlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchaser_account_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
    learner_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    package_catalog_id UUID NOT NULL REFERENCES public.package_catalog(id) ON DELETE RESTRICT,
    purchased_quantity INTEGER NOT NULL CHECK (purchased_quantity > 0),
    price_paid NUMERIC(10, 2) NOT NULL CHECK (price_paid >= 0),
    currency TEXT NOT NULL DEFAULT 'USD',
    acquired_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status TEXT NOT NULL DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'active', 'cancelled', 'expired')),
    remaining_credits INTEGER NOT NULL DEFAULT 0 CHECK (remaining_credits >= 0),
    used_credits INTEGER NOT NULL DEFAULT 0 CHECK (used_credits >= 0),
    payment_reference TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS package_entitlement_id UUID REFERENCES public.package_entitlements(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.package_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    package_entitlement_id UUID NOT NULL REFERENCES public.package_entitlements(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    learner_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('grant', 'completed_consumed', 'no_show_used', 'no_show_returned')),
    delta_credits INTEGER NOT NULL CHECK (delta_credits IN (-1, 0, 1)),
    idempotency_key TEXT NOT NULL,
    reference_code TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_package_credit_ledger_idempotency
ON public.package_credit_ledger(idempotency_key);

CREATE UNIQUE INDEX IF NOT EXISTS idx_package_credit_ledger_booking_activity
ON public.package_credit_ledger(booking_id, activity_type)
WHERE booking_id IS NOT NULL;

ALTER TABLE public.package_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_credit_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Package catalog is public" ON public.package_catalog;
CREATE POLICY "Package catalog is public"
ON public.package_catalog
FOR SELECT
TO anon, authenticated
USING (is_active = true);

DROP POLICY IF EXISTS "Users read package entitlements they own" ON public.package_entitlements;
CREATE POLICY "Users read package entitlements they own"
ON public.package_entitlements
FOR SELECT
TO authenticated
USING (purchaser_account_id = auth.uid());

CREATE POLICY "Teachers read only package entitlements for their assigned bookings"
ON public.package_entitlements
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.package_entitlement_id = package_entitlements.id
          AND b.teacher_id = auth.uid()
    )
);

CREATE POLICY "No direct browser mutation of package entitlements"
ON public.package_entitlements
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Users read own credit ledger entries"
ON public.package_credit_ledger
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.package_entitlements pe
        WHERE pe.id = package_credit_ledger.package_entitlement_id
          AND pe.purchaser_account_id = auth.uid()
    )
    OR EXISTS (
        SELECT 1
        FROM public.bookings b
        WHERE b.package_entitlement_id = package_credit_ledger.package_entitlement_id
          AND b.teacher_id = auth.uid()
    )
);

CREATE POLICY "No direct browser mutation of ledger"
ON public.package_credit_ledger
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.apply_package_credit_event(
    p_booking_id UUID,
    p_teacher_id UUID,
    p_outcome TEXT,
    p_no_show_credit_decision TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_entitlement RECORD;
    v_has_credit BOOLEAN := false;
    v_idempotency_key TEXT;
    v_existing_ledger_count INTEGER;
BEGIN
    IF p_outcome NOT IN ('completed', 'no_show') THEN
        RAISE EXCEPTION 'Invalid outcome: must be completed or no_show.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_booking.teacher_id IS NULL OR v_booking.teacher_id != p_teacher_id THEN
        RAISE EXCEPTION 'Not authorized to manage this booking.' USING ERRCODE = 'P0003';
    END IF;

    IF v_booking.package_entitlement_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', true,
            'package_credit_applied', false,
            'reason', 'booking_has_no_package_entitlement'
        );
    END IF;

    SELECT * INTO v_entitlement
    FROM public.package_entitlements
    WHERE id = v_booking.package_entitlement_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Package entitlement not found.' USING ERRCODE = 'P0006';
    END IF;

    IF v_entitlement.status <> 'active' THEN
        RETURN jsonb_build_object(
            'success', true,
            'package_credit_applied', false,
            'reason', 'package_entitlement_not_active'
        );
    END IF;

    IF p_outcome = 'completed' THEN
        v_idempotency_key := 'booking:' || p_booking_id || ':completed_consumed';

        SELECT COUNT(*) INTO v_existing_ledger_count
        FROM public.package_credit_ledger
        WHERE booking_id = p_booking_id
          AND activity_type = 'completed_consumed';

        IF v_existing_ledger_count > 0 THEN
            RETURN jsonb_build_object(
                'success', true,
                'package_credit_applied', true,
                'activity_type', 'completed_consumed',
                'remaining_credits', (
                    SELECT remaining_credits FROM public.package_entitlements WHERE id = v_entitlement.id
                )
            );
        END IF;

        IF v_entitlement.remaining_credits <= 0 THEN
            RAISE EXCEPTION 'No package credit available to consume for completed lesson.' USING ERRCODE = 'P0008';
        END IF;

        INSERT INTO public.package_credit_ledger (
            package_entitlement_id,
            booking_id,
            learner_student_id,
            activity_type,
            delta_credits,
            idempotency_key,
            reference_code
        ) VALUES (
            v_entitlement.id,
            p_booking_id,
            v_booking.student_id,
            'completed_consumed',
            -1,
            v_idempotency_key,
            v_booking.reference_code
        );

        UPDATE public.package_entitlements
        SET remaining_credits = remaining_credits - 1,
            used_credits = used_credits + 1,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_entitlement.id;

        RETURN jsonb_build_object(
            'success', true,
            'package_credit_applied', true,
            'activity_type', 'completed_consumed',
            'remaining_credits', (
                SELECT remaining_credits FROM public.package_entitlements WHERE id = v_entitlement.id
            )
        );
    END IF;

    IF p_no_show_credit_decision IS NULL OR p_no_show_credit_decision NOT IN ('credit_used', 'credit_returned') THEN
        RAISE EXCEPTION 'Explicit no-show credit decision is required: credit_used or credit_returned.' USING ERRCODE = 'P0007';
    END IF;

    IF p_no_show_credit_decision = 'credit_used' THEN
        v_idempotency_key := 'booking:' || p_booking_id || ':no_show_used';

        SELECT COUNT(*) INTO v_existing_ledger_count
        FROM public.package_credit_ledger
        WHERE booking_id = p_booking_id
          AND activity_type = 'no_show_used';

        IF v_existing_ledger_count > 0 THEN
            RETURN jsonb_build_object(
                'success', true,
                'package_credit_applied', true,
                'activity_type', 'no_show_used',
                'remaining_credits', (
                    SELECT remaining_credits FROM public.package_entitlements WHERE id = v_entitlement.id
                )
            );
        END IF;

        IF v_entitlement.remaining_credits <= 0 THEN
            RAISE EXCEPTION 'No package credit available to consume for no-show lesson.' USING ERRCODE = 'P0008';
        END IF;

        INSERT INTO public.package_credit_ledger (
            package_entitlement_id,
            booking_id,
            learner_student_id,
            activity_type,
            delta_credits,
            idempotency_key,
            reference_code
        ) VALUES (
            v_entitlement.id,
            p_booking_id,
            v_booking.student_id,
            'no_show_used',
            -1,
            v_idempotency_key,
            v_booking.reference_code
        );

        UPDATE public.package_entitlements
        SET remaining_credits = remaining_credits - 1,
            used_credits = used_credits + 1,
            updated_at = timezone('utc'::text, now())
        WHERE id = v_entitlement.id;

        RETURN jsonb_build_object(
            'success', true,
            'package_credit_applied', true,
            'activity_type', 'no_show_used',
            'remaining_credits', (
                SELECT remaining_credits FROM public.package_entitlements WHERE id = v_entitlement.id
            )
        );
    END IF;

    v_idempotency_key := 'booking:' || p_booking_id || ':no_show_returned';

    SELECT COUNT(*) INTO v_existing_ledger_count
    FROM public.package_credit_ledger
    WHERE booking_id = p_booking_id
      AND activity_type = 'no_show_returned';

    IF v_existing_ledger_count = 0 THEN
        INSERT INTO public.package_credit_ledger (
            package_entitlement_id,
            booking_id,
            learner_student_id,
            activity_type,
            delta_credits,
            idempotency_key,
            reference_code
        ) VALUES (
            v_entitlement.id,
            p_booking_id,
            v_booking.student_id,
            'no_show_returned',
            0,
            v_idempotency_key,
            v_booking.reference_code
        );
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'package_credit_applied', false,
        'activity_type', 'no_show_returned',
        'remaining_credits', (
            SELECT remaining_credits FROM public.package_entitlements WHERE id = v_entitlement.id
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.apply_package_credit_event(UUID, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.apply_package_credit_event(UUID, UUID, TEXT, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.teacher_record_lesson_outcome(
    p_booking_id UUID,
    p_teacher_id UUID,
    p_outcome TEXT,
    p_notes TEXT DEFAULT NULL,
    p_covered_material TEXT DEFAULT NULL,
    p_no_show_credit_decision TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_session_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF p_outcome NOT IN ('completed', 'no_show') THEN
        RAISE EXCEPTION 'Invalid outcome: must be completed or no_show.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_booking.teacher_id IS NULL OR v_booking.teacher_id != p_teacher_id THEN
        RAISE EXCEPTION 'Not authorized to manage this booking.' USING ERRCODE = 'P0003';
    END IF;

    IF v_booking.status = p_outcome THEN
        RETURN jsonb_build_object(
            'success', true,
            'isIdempotent', true,
            'message', 'Booking already marked as ' || p_outcome,
            'booking', row_to_json(v_booking)
        );
    END IF;

    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot change status of a cancelled booking.' USING ERRCODE = 'P0004';
    END IF;

    IF (v_booking.status = 'completed' AND p_outcome = 'no_show') OR
       (v_booking.status = 'no_show' AND p_outcome = 'completed') THEN
        RAISE EXCEPTION 'Cannot transition directly from % to %.', v_booking.status, p_outcome USING ERRCODE = 'P0004';
    END IF;

    IF p_outcome = 'completed' AND v_booking.scheduled_start > (v_now + interval '15 minutes') THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as completed before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    IF p_outcome = 'no_show' AND v_booking.scheduled_start > v_now THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as no-show before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    IF p_outcome = 'no_show' AND (p_no_show_credit_decision IS NULL OR p_no_show_credit_decision NOT IN ('credit_used', 'credit_returned')) THEN
        RAISE EXCEPTION 'Explicit no-show credit decision is required: credit_used or credit_returned.' USING ERRCODE = 'P0007';
    END IF;

    UPDATE public.bookings
    SET status = p_outcome,
        notes = COALESCE(p_notes, notes),
        updated_at = v_now
    WHERE id = p_booking_id;

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

    IF p_outcome = 'completed' OR p_outcome = 'no_show' THEN
        PERFORM public.apply_package_credit_event(
            p_booking_id,
            p_teacher_id,
            p_outcome,
            p_no_show_credit_decision
        );
    END IF;

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

CREATE OR REPLACE FUNCTION public.teacher_record_lesson_outcome_legacy(
    p_booking_id UUID,
    p_teacher_id UUID,
    p_outcome TEXT,
    p_notes TEXT DEFAULT NULL,
    p_covered_material TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_outcome = 'no_show' THEN
        RAISE EXCEPTION 'Explicit no-show credit decision is required: credit_used or credit_returned.' USING ERRCODE = 'P0007';
    END IF;

    RETURN public.teacher_record_lesson_outcome(
        p_booking_id,
        p_teacher_id,
        p_outcome,
        p_notes,
        p_covered_material,
        NULL
    );
END;
$$;

REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome_legacy(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teacher_record_lesson_outcome_legacy(UUID, UUID, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome_legacy(UUID, UUID, TEXT, TEXT, TEXT) TO service_role;
