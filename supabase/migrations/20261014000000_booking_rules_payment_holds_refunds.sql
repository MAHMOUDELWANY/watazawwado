-- ====================================================================
-- Migration: Booking Rules — Payment Holds, Pay Later, Reschedule Count, Refunds
-- File: supabase/migrations/20261014000000_booking_rules_payment_holds_refunds.sql
--
-- Purpose (RULES.md §2 and §5, decided 2026-10-14):
-- 1. bookings.hold_expires_at: an unpaid regular booking only holds its slot until
--    this time; expired holds are cancelled so the slot is free again.
-- 2. bookings.payment_plan: 'pay_now' (default) or 'pay_later' (trusted students,
--    awaiting super-admin approval; never auto-expired).
-- 3. bookings.reschedule_count: enforces "a free trial can be rescheduled once".
-- 4. refund_payment_atomic(uuid): marks a confirmed payment refunded and reverses its
--    effect (cancels the booking and its reminders, or cancels the package entitlement)
--    in one transaction. service_role only.
-- ====================================================================

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS payment_plan TEXT NOT NULL DEFAULT 'pay_now';
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_count INT NOT NULL DEFAULT 0;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_plan_check') THEN
        ALTER TABLE public.bookings ADD CONSTRAINT bookings_payment_plan_check
            CHECK (payment_plan IN ('pay_now', 'pay_later'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_bookings_pending_holds
    ON public.bookings (hold_expires_at)
    WHERE status = 'pending' AND payment_plan = 'pay_now';

-- Releases every expired unpaid hold; returns how many were released.
CREATE OR REPLACE FUNCTION public.release_expired_payment_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_count INT;
BEGIN
    WITH released AS (
        UPDATE public.bookings
           SET status = 'cancelled',
               cancellation_reason = 'Payment was not completed in time; the slot was released.',
               updated_at = timezone('utc'::text, now())
         WHERE status = 'pending'
           AND payment_plan = 'pay_now'
           AND hold_expires_at IS NOT NULL
           AND hold_expires_at < timezone('utc'::text, now())
        RETURNING id
    )
    SELECT count(*) INTO v_count FROM released;

    UPDATE public.reminders r
       SET status = 'cancelled', updated_at = timezone('utc'::text, now())
      FROM public.bookings b
     WHERE r.booking_id = b.id
       AND b.status = 'cancelled'
       AND r.status = 'pending'
       AND b.cancellation_reason = 'Payment was not completed in time; the slot was released.';

    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.release_expired_payment_holds() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.release_expired_payment_holds() FROM anon;
REVOKE ALL ON FUNCTION public.release_expired_payment_holds() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.release_expired_payment_holds() TO service_role;

CREATE OR REPLACE FUNCTION public.refund_payment_atomic(p_payment_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment RECORD;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_payment FROM public.payments WHERE id = p_payment_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found.' USING ERRCODE = 'P0002';
    END IF;
    IF v_payment.status = 'refunded' THEN
        RETURN jsonb_build_object('success', true, 'idempotent', true);
    END IF;
    IF v_payment.status <> 'confirmed' THEN
        RAISE EXCEPTION 'Only confirmed payments can be refunded.' USING ERRCODE = 'P0001';
    END IF;

    UPDATE public.payments
       SET status = 'refunded',
           notes = trim(both ' ' from concat('[REFUNDED', CASE WHEN p_reason IS NOT NULL AND p_reason <> '' THEN ': ' || p_reason END, '] ', coalesce(notes, ''))),
           updated_at = v_now
     WHERE id = v_payment.id;

    IF v_payment.booking_id IS NOT NULL THEN
        UPDATE public.bookings
           SET status = 'cancelled',
               cancellation_reason = coalesce(nullif(p_reason, ''), 'Refunded'),
               updated_at = v_now
         WHERE id = v_payment.booking_id
           AND status IN ('pending', 'confirmed', 'rescheduled');

        UPDATE public.reminders
           SET status = 'cancelled', updated_at = v_now
         WHERE booking_id = v_payment.booking_id
           AND status = 'pending';

        INSERT INTO public.integration_jobs (booking_id, job_type, status)
        VALUES (v_payment.booking_id, 'booking_cancel', 'pending')
        ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
        DO NOTHING;
    END IF;

    IF v_payment.entitlement_id IS NOT NULL THEN
        UPDATE public.package_entitlements
           SET status = 'cancelled',
               remaining_credits = 0,
               updated_at = v_now
         WHERE id = v_payment.entitlement_id;

        -- Upcoming lessons booked with the refunded package are cancelled too.
        UPDATE public.reminders r
           SET status = 'cancelled', updated_at = v_now
          FROM public.bookings b
         WHERE r.booking_id = b.id
           AND b.package_entitlement_id = v_payment.entitlement_id
           AND b.status IN ('pending', 'confirmed', 'rescheduled')
           AND b.scheduled_start > v_now
           AND r.status = 'pending';

        INSERT INTO public.integration_jobs (booking_id, job_type, status)
        SELECT b.id, 'booking_cancel', 'pending'
          FROM public.bookings b
         WHERE b.package_entitlement_id = v_payment.entitlement_id
           AND b.status IN ('pending', 'confirmed', 'rescheduled')
           AND b.scheduled_start > v_now
        ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
        DO NOTHING;

        UPDATE public.bookings
           SET status = 'cancelled',
               cancellation_reason = coalesce(nullif(p_reason, ''), 'Package refunded'),
               updated_at = v_now
         WHERE package_entitlement_id = v_payment.entitlement_id
           AND status IN ('pending', 'confirmed', 'rescheduled')
           AND scheduled_start > v_now;
    END IF;

    RETURN jsonb_build_object('success', true, 'idempotent', false);
END;
$$;

REVOKE ALL ON FUNCTION public.refund_payment_atomic(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.refund_payment_atomic(UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.refund_payment_atomic(UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.refund_payment_atomic(UUID, TEXT) TO service_role;
