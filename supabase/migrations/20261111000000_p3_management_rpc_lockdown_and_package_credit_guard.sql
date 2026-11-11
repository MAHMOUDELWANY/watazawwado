-- ====================================================================
-- Migration: P3 management RPC lockdown and package credit guard
-- File: supabase/migrations/20261111000000_p3_management_rpc_lockdown_and_package_credit_guard.sql
--
-- Purpose:
-- 1. P3-004: reschedule_booking_by_management and cancel_booking_by_management were written for guest
--    bookings and are still executable by the browser roles. Every booking now belongs to a signed-in
--    account (RULES.md §2) and is moved or cancelled through the server, which checks the rules these
--    functions do not: never the same day, only inside the teacher's working hours, a trial only once,
--    never onto the learner's other lesson, and a paid lesson cancelled in time becomes a lesson credit.
--    With the management token from their own booking a family could call them directly and skip all of
--    that. Nothing in the app calls them, so the browser roles lose EXECUTE. get_booking_management
--    (read only) is unchanged.
-- 2. P3-007: two bookings sent in the same instant could both spend a package's last credit, because the
--    server counts the booked lessons and then inserts. The count now happens in the database under a
--    lock on the package row.
-- ====================================================================

REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(text, text, timestamptz, timestamptz, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(text, text, timestamptz, timestamptz, text) FROM anon;
REVOKE ALL ON FUNCTION public.reschedule_booking_by_management(text, text, timestamptz, timestamptz, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.reschedule_booking_by_management(text, text, timestamptz, timestamptz, text) TO service_role;

REVOKE ALL ON FUNCTION public.cancel_booking_by_management(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_booking_by_management(text, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.cancel_booking_by_management(text, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking_by_management(text, text, text) TO service_role;

-- A lesson booked with a package must fit inside the package's remaining credits. Credits are taken when the
-- lesson is completed, so "remaining" covers every lesson still booked (pending, confirmed or moved).
CREATE OR REPLACE FUNCTION public.enforce_package_credit_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_remaining integer;
    v_booked integer;
BEGIN
    IF NEW.package_entitlement_id IS NULL OR NEW.status NOT IN ('pending', 'confirmed', 'rescheduled') THEN
        RETURN NEW;
    END IF;

    -- The row lock makes two bookings for the same package wait for each other.
    SELECT remaining_credits INTO v_remaining
      FROM public.package_entitlements
     WHERE id = NEW.package_entitlement_id AND status = 'active'
       FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'PACKAGE_NOT_ACTIVE' USING ERRCODE = 'P0001';
    END IF;

    SELECT count(*) INTO v_booked
      FROM public.bookings
     WHERE package_entitlement_id = NEW.package_entitlement_id
       AND status IN ('pending', 'confirmed', 'rescheduled');
    IF v_booked >= v_remaining THEN
        RAISE EXCEPTION 'PACKAGE_CREDITS_BOOKED' USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_package_credit_on_booking() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.enforce_package_credit_on_booking() FROM anon;
REVOKE ALL ON FUNCTION public.enforce_package_credit_on_booking() FROM authenticated;

DROP TRIGGER IF EXISTS trg_enforce_package_credit ON public.bookings;
CREATE TRIGGER trg_enforce_package_credit
    BEFORE INSERT ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_package_credit_on_booking();
