-- ====================================================================
-- Migration: Settle checkout redemptions by the target's real state
-- File: supabase/migrations/20261022000001_settle_checkout_redemptions_fix.sql
--
-- Purpose:
-- 1. settle_checkout_redemptions() released a reserved code/balance for any package that was no longer
--    pending_payment unless it was exactly active/exhausted/expired. Package statuses are open-ended, so now
--    only an abandoned checkout is released (cancelled/refunded target, or an expired hold / an old unpaid
--    package) and every other move away from "awaiting payment" counts as paid (redeemed).
-- ====================================================================

CREATE OR REPLACE FUNCTION public.settle_checkout_redemptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r record;
    v_count integer := 0;
BEGIN
    FOR r IN
        SELECT d.id, d.target_type, b.status AS b_status, b.hold_expires_at, b.payment_plan,
               e.status AS e_status, d.created_at
        FROM public.discount_redemptions d
        LEFT JOIN public.bookings b ON d.target_type = 'booking' AND b.id = d.target_id
        LEFT JOIN public.package_entitlements e ON d.target_type = 'package' AND e.id = d.target_id
        WHERE d.status = 'reserved'
    LOOP
        -- Abandoned: the checkout was cancelled, or its hold ran out (a Stripe session lives 31 minutes).
        IF (r.target_type = 'booking' AND (r.b_status IS NULL OR r.b_status = 'cancelled'
                  OR (r.b_status = 'pending' AND r.payment_plan = 'pay_now' AND r.hold_expires_at IS NOT NULL
                      AND r.hold_expires_at < timezone('utc'::text, now()) - interval '5 minutes')))
           OR (r.target_type = 'package' AND (r.e_status IS NULL OR r.e_status IN ('cancelled', 'refunded')
                  OR (r.e_status = 'pending_payment' AND r.created_at < timezone('utc'::text, now()) - interval '2 hours'))) THEN
            PERFORM public._undo_checkout_redemption(r.id, 'released', true);
            v_count := v_count + 1;
        -- Paid: the booking or package moved on from waiting for payment.
        ELSIF (r.target_type = 'booking' AND r.b_status <> 'pending')
           OR (r.target_type = 'package' AND r.e_status <> 'pending_payment') THEN
            UPDATE public.discount_redemptions SET status = 'redeemed', updated_at = timezone('utc'::text, now()) WHERE id = r.id;
            v_count := v_count + 1;
        END IF;
    END LOOP;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_checkout_redemptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_checkout_redemptions() TO service_role;
