-- ====================================================================
-- Migration: Security Audit Hardening
-- File: supabase/migrations/20261013000000_security_audit_hardening.sql
--
-- Purpose (findings from the 2026-10-13 security audit):
-- 1. Add hash_management_token(text) so the API stores bcrypt hashes that
--    get_booking_management / *_by_management can verify (the API was storing
--    SHA-256 hex, which never matches extensions.crypt()).
-- 2. Stop keeping plaintext management tokens at rest.
-- 3. Revoke anon/authenticated EXECUTE on update_booking_integration_status
--    (anyone with a reference code could rewrite a booking's Zoom link).
-- 4. Drop legacy *_by_reference RPCs that return PII / cancel / reschedule
--    without a management token.
-- 5. Drop the legacy 5-arg teacher_record_lesson_outcome overload that trusts
--    p_teacher_id and was never revoked from anon.
-- 6. Revoke anon/authenticated EXECUTE on create_booking_atomic: nothing in the
--    app calls it directly (bookings go through the API), and anon access allowed
--    unlimited pending bookings that block every slot.
-- 7. Enforce one payment row per gateway reference (prevents double-confirming a
--    single PayPal/Stripe capture under concurrent requests).
-- 8. Restrict which students columns a signed-in student may update directly.
--
-- Everything here is idempotent. Apply after reviewing; check the NOTICE output.
-- ====================================================================

-- 1. BCRYPT HASHING FOR MANAGEMENT TOKENS (service_role only)
CREATE OR REPLACE FUNCTION public.hash_management_token(p_token TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF p_token IS NULL OR length(p_token) < 16 THEN
        RAISE EXCEPTION 'Management token too short.' USING ERRCODE = '22023';
    END IF;
    RETURN extensions.crypt(p_token, extensions.gen_salt('bf'));
END;
$$;

REVOKE ALL ON FUNCTION public.hash_management_token(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.hash_management_token(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.hash_management_token(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.hash_management_token(TEXT) TO service_role;

-- 2. NO PLAINTEXT MANAGEMENT TOKENS AT REST
-- Nothing reads bookings.management_token; verification uses management_token_hash.
UPDATE public.bookings
SET management_token = NULL
WHERE management_token IS NOT NULL;

-- 3. ZOOM-LINK REWRITE RPC: service_role only
DO $$
BEGIN
    IF to_regprocedure('public.update_booking_integration_status(text,text,text,text,text,jsonb)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.update_booking_integration_status(text,text,text,text,text,jsonb) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.update_booking_integration_status(text,text,text,text,text,jsonb) TO service_role;
    END IF;
END $$;

-- 4. LEGACY TOKEN-LESS BOOKING RPCs (superseded by *_by_management)
DROP FUNCTION IF EXISTS public.get_booking_by_reference(text);
DROP FUNCTION IF EXISTS public.get_booking_by_reference(text, text);
DROP FUNCTION IF EXISTS public.cancel_booking_by_reference(text, text);
DROP FUNCTION IF EXISTS public.cancel_booking_by_reference(text, text, text);
DROP FUNCTION IF EXISTS public.reschedule_booking_by_reference(text, timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS public.reschedule_booking_by_reference(text, timestamptz, timestamptz, text, text);

-- 5. LEGACY LESSON-OUTCOME OVERLOAD (the API uses the 6-arg version)
DROP FUNCTION IF EXISTS public.teacher_record_lesson_outcome(uuid, uuid, text, text, text);

-- 6. DIRECT BOOKING CREATION: API (service_role) only
DO $$
BEGIN
    IF to_regprocedure('public.create_booking_atomic(jsonb)') IS NOT NULL THEN
        REVOKE ALL ON FUNCTION public.create_booking_atomic(jsonb) FROM PUBLIC, anon, authenticated;
        GRANT EXECUTE ON FUNCTION public.create_booking_atomic(jsonb) TO service_role;
    END IF;
END $$;

-- 7. ONE PAYMENT ROW PER GATEWAY REFERENCE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM public.payments
        WHERE payment_reference IS NOT NULL
          AND payment_method IN ('paypal', 'stripe')
        GROUP BY payment_method, payment_reference
        HAVING count(*) > 1
    ) THEN
        RAISE NOTICE 'Duplicate gateway payment references exist; unique index NOT created. Resolve duplicates in public.payments and re-run this block.';
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS payments_gateway_reference_unique
            ON public.payments (payment_method, payment_reference)
            WHERE payment_reference IS NOT NULL AND payment_method IN ('paypal', 'stripe');
    END IF;
END $$;

-- 8. STUDENTS MAY ONLY UPDATE THEIR OWN PROFILE FIELDS
-- The "update own row" RLS policy allowed every column (status, notes, email, lead_id...).
-- The API uses service_role and is unaffected.
REVOKE UPDATE ON public.students FROM authenticated;
GRANT UPDATE (name, whatsapp, timezone, country, gender, teacher_gender_preference, booking_preference)
    ON public.students TO authenticated;
