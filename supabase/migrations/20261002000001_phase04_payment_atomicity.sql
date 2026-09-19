-- ====================================================================
-- Migration: Phase 04-A Payment Atomicity
-- Purpose:
-- 1. Create a safe atomic RPC for payment verification
-- ====================================================================

CREATE OR REPLACE FUNCTION public.verify_payment_atomic(
    p_payment_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_payment record;
    v_entitlement record;
BEGIN
    SELECT * INTO v_payment
    FROM public.payments
    WHERE id = p_payment_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Payment not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_payment.status = 'confirmed' THEN
        RETURN jsonb_build_object('success', true, 'isIdempotent', true, 'message', 'Payment already confirmed');
    END IF;

    IF v_payment.status != 'pending' THEN
        RAISE EXCEPTION 'Cannot verify payment from status: %', v_payment.status USING ERRCODE = 'P0004';
    END IF;

    -- Update the payment
    UPDATE public.payments
    SET status = 'confirmed',
        confirmed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id = p_payment_id;

    -- Downstream: Booking
    IF v_payment.booking_id IS NOT NULL THEN
        UPDATE public.bookings
        SET status = 'confirmed',
            updated_at = timezone('utc'::text, now())
        WHERE id = v_payment.booking_id AND status = 'pending';
    END IF;

    -- Downstream: Package
    IF v_payment.entitlement_id IS NOT NULL THEN
        -- We will directly execute the logic of activate_package_entitlement_atomic to ensure it happens in the same transaction
        SELECT * INTO v_entitlement
        FROM public.package_entitlements
        WHERE id = v_payment.entitlement_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Entitlement not found.' USING ERRCODE = 'P0002';
        END IF;

        IF v_entitlement.status = 'pending_payment' THEN
            UPDATE public.package_entitlements
            SET status = 'active',
                remaining_credits = purchased_quantity,
                payment_reference = COALESCE(v_payment.payment_reference, payment_reference),
                updated_at = timezone('utc'::text, now())
            WHERE id = v_payment.entitlement_id;

            FOR i IN 1..v_entitlement.purchased_quantity LOOP
                INSERT INTO public.package_credit_ledger (
                    package_entitlement_id,
                    learner_student_id,
                    activity_type,
                    delta_credits,
                    idempotency_key
                ) VALUES (
                    v_payment.entitlement_id,
                    v_entitlement.learner_student_id,
                    'grant',
                    1,
                    'grant_' || v_payment.entitlement_id::text || '_' || i::text
                ) ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'payment_id', p_payment_id,
        'status', 'confirmed'
    );
END;
$$;

REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.verify_payment_atomic(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_payment_atomic(UUID) TO service_role;
