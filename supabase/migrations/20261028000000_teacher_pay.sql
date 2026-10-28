-- ====================================================================
-- Migration: Teacher pay (launch plan D, owner decisions D2, D5-D7, S1-S4)
-- File: supabase/migrations/20261028000000_teacher_pay.sql
--
-- Purpose:
-- 1. teacher_pay_rates: one fixed hourly rate and pay currency per teacher (set by the super admin).
-- 2. teacher_pay_adjustments: a bonus or deduction for a teacher's month, always with a reason.
-- 3. teacher_payouts: the transfer the admin records for a month (method, reference, the statement lines
--    as they were when paid). One per teacher per month. The money moves outside the site.
-- 4. bookings.not_held_reason: a lesson that did not happen because the teacher was absent or because
--    of a technical problem on our side. The teacher is not paid for it; the student gets the lesson back.
-- 5. record_lesson_not_held(): marks such a lesson and, for a paid single lesson, gives a lesson credit
--    the same way an in-time student cancellation does. Package lessons need nothing back: a package
--    credit is only used when a lesson is completed.
-- All new tables are service-role only (RLS on, no policies): the API checks who may read or write.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.teacher_pay_rates (
    teacher_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    hourly_rate NUMERIC(10, 2) NOT NULL CHECK (hourly_rate >= 0 AND hourly_rate <= 100000),
    currency TEXT NOT NULL DEFAULT 'USD' CHECK (currency ~ '^[A-Z]{3}$'),
    updated_by UUID,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.teacher_pay_rates ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teacher_pay_adjustments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount <> 0),
    reason TEXT NOT NULL CHECK (char_length(trim(reason)) BETWEEN 3 AND 500),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS teacher_pay_adjustments_teacher_month_idx ON public.teacher_pay_adjustments (teacher_user_id, month);
ALTER TABLE public.teacher_pay_adjustments ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.teacher_payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month DATE NOT NULL CHECK (EXTRACT(DAY FROM month) = 1),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
    currency TEXT NOT NULL CHECK (currency ~ '^[A-Z]{3}$'),
    method TEXT NOT NULL CHECK (char_length(trim(method)) BETWEEN 2 AND 60),
    reference TEXT CHECK (reference IS NULL OR char_length(reference) <= 200),
    statement JSONB NOT NULL DEFAULT '{}'::jsonb,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    recorded_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (teacher_user_id, month)
);
ALTER TABLE public.teacher_payouts ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.bookings
    ADD COLUMN IF NOT EXISTS not_held_reason TEXT;
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_not_held_reason_check') THEN
        ALTER TABLE public.bookings
            ADD CONSTRAINT bookings_not_held_reason_check CHECK (not_held_reason IS NULL OR not_held_reason IN ('teacher_absent', 'technical'));
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.record_lesson_not_held(
    p_booking_id UUID,
    p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_payment RECORD;
    v_purchaser UUID;
    v_rate NUMERIC;
    v_catalog_id UUID;
    v_entitlement_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    IF p_reason NOT IN ('teacher_absent', 'technical') THEN
        RAISE EXCEPTION 'Unknown reason.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;
    IF v_booking.status NOT IN ('confirmed', 'rescheduled') THEN
        RAISE EXCEPTION 'Only a booked lesson can be marked as not held.' USING ERRCODE = 'P0001';
    END IF;
    IF p_reason = 'technical' AND v_booking.scheduled_start > v_now + interval '15 minutes' THEN
        RAISE EXCEPTION 'A technical problem can be recorded from the lesson time on.' USING ERRCODE = 'P0005';
    END IF;

    UPDATE public.bookings
       SET status = 'cancelled',
           not_held_reason = p_reason,
           cancellation_reason = CASE p_reason
               WHEN 'teacher_absent' THEN 'Not held: the teacher could not attend (lesson credit to the student)'
               ELSE 'Not held: technical problem on our side (lesson credit to the student)'
           END,
           updated_at = v_now
     WHERE id = p_booking_id;

    UPDATE public.reminders SET status = 'cancelled', updated_at = v_now
     WHERE booking_id = p_booking_id AND status = 'pending';

    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (p_booking_id, 'booking_cancel', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
    DO NOTHING;

    -- A paid single lesson comes back as a lesson credit (trials, package lessons and unpaid pay-later lessons need nothing).
    IF v_booking.booking_type <> 'trial' AND v_booking.package_entitlement_id IS NULL THEN
        SELECT * INTO v_payment FROM public.payments
         WHERE booking_id = p_booking_id AND status = 'confirmed'
         ORDER BY confirmed_at DESC NULLS LAST
         LIMIT 1;
        IF FOUND THEN
            -- The learner's own account, else (a child) the parent's account found by the guardian email.
            SELECT coalesce(
                       s.auth_user_id,
                       (SELECT u.id FROM public.guardians g
                          JOIN auth.users u ON lower(u.email) = lower(g.parent_email)
                         WHERE g.student_id = s.id
                         LIMIT 1)
                   ) INTO v_purchaser
              FROM public.students s WHERE s.id = v_booking.student_id;
            IF v_purchaser IS NULL THEN
                RAISE EXCEPTION 'This lesson has no student account to hold the credit.' USING ERRCODE = 'P0001';
            END IF;
            SELECT hourly_rate_usd INTO v_rate FROM public.services WHERE id = v_booking.service_id;
            SELECT id INTO v_catalog_id FROM public.package_catalog WHERE package_type = 'credit' LIMIT 1;

            INSERT INTO public.package_entitlements (
                purchaser_account_id, learner_student_id, package_catalog_id,
                purchased_quantity, price_paid, currency, status,
                remaining_credits, used_credits, payment_reference, metadata
            ) VALUES (
                v_purchaser, v_booking.student_id, v_catalog_id,
                1, v_payment.amount, v_payment.currency, 'active',
                1, 0, v_payment.payment_reference,
                jsonb_build_object(
                    'source', 'cancellation_credit',
                    'not_held_reason', p_reason,
                    'source_booking_id', v_booking.id,
                    'source_payment_id', v_payment.id,
                    'hourly_rate', v_rate,
                    'duration_minutes', v_booking.duration_minutes
                )
            )
            RETURNING id INTO v_entitlement_id;

            INSERT INTO public.package_credit_ledger (package_entitlement_id, learner_student_id, activity_type, delta_credits, idempotency_key, booking_id, reference_code)
            VALUES (v_entitlement_id, v_booking.student_id, 'grant', 1, 'credit_grant_' || v_booking.id::text, v_booking.id, v_booking.reference_code)
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;

    RETURN jsonb_build_object('success', true, 'creditId', v_entitlement_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_lesson_not_held(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_lesson_not_held(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.record_lesson_not_held(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_lesson_not_held(UUID, TEXT) TO service_role;
