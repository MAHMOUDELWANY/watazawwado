-- ====================================================================
-- Migration: Approved packages, cancellation credits, refund policy
-- File: supabase/migrations/20261014000002_packages_credits_refund_policy.sql
--
-- Purpose (RULES.md §2, §4, §5 — decided 2026-10-14):
-- 1. Replace the old package catalog with the approved table (docs/pricing/packages.md):
--    two price bands ($9/h and $13/h) x 4/8/12 lessons x 30/45/60-minute lessons.
--    Old rows are deactivated, never deleted (no entitlements reference them).
-- 2. A paid single lesson cancelled >= 3 hours before it starts becomes a lesson credit
--    (a 1-lesson entitlement) — student_cancel_paid_lesson_to_credit.
-- 3. Refunding a payment also voids the credit it produced; a credit already used
--    cannot be refunded.
-- ====================================================================

-- 1. Catalog ------------------------------------------------------------
ALTER TABLE public.package_catalog DROP CONSTRAINT IF EXISTS package_catalog_package_type_check;
ALTER TABLE public.package_catalog ADD CONSTRAINT package_catalog_package_type_check
    CHECK (package_type = ANY (ARRAY['weekly'::text, 'monthly'::text, 'credit'::text]));

UPDATE public.package_catalog
   SET is_active = false, updated_at = timezone('utc'::text, now())
 WHERE is_active = true
   AND coalesce(eligibility_rules->>'pricing_model', '') <> 'hourly_band_v1';

INSERT INTO public.package_catalog (package_type, name, lesson_count, price_amount, currency, is_active, eligibility_rules)
SELECT 'monthly',
       b.label_en || ' · ' || t.n || ' × ' || d.m || ' min',
       t.n,
       round(t.per_hour * t.n * d.m / 60.0, 2),
       'USD',
       true,
       jsonb_build_object(
           'pricing_model', 'hourly_band_v1',
           'hourly_rate', b.rate,
           'duration_minutes', d.m,
           'per_hour_price', t.per_hour,
           'single_lesson_price_usd', round(b.rate * d.m / 60.0, 2),
           'name_ar', b.label_ar || ' · ' || t.n || ' حصص × ' || d.m || ' دقيقة'
       )
  FROM (VALUES (9::numeric, 'Quran & Islamic studies', 'القرآن والعلوم الشرعية'),
               (13::numeric, 'Arabic & English', 'العربية والإنجليزية')) AS b(rate, label_en, label_ar)
  JOIN (VALUES (9::numeric, 4, 8.50::numeric), (9, 8, 8.25), (9, 12, 8.00),
               (13, 4, 12.25), (13, 8, 12.00), (13, 12, 11.50)) AS t(rate, n, per_hour)
    ON t.rate = b.rate
 CROSS JOIN (VALUES (30), (45), (60)) AS d(m)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.package_catalog pc
      WHERE pc.eligibility_rules->>'pricing_model' = 'hourly_band_v1'
        AND (pc.eligibility_rules->>'hourly_rate')::numeric = b.rate
        AND (pc.eligibility_rules->>'duration_minutes')::int = d.m
        AND pc.lesson_count = t.n
 );

-- Hidden catalog row that cancellation credits point at (never sold).
INSERT INTO public.package_catalog (package_type, name, lesson_count, price_amount, currency, is_active, eligibility_rules)
SELECT 'credit', 'Lesson credit (cancelled lesson)', 1, 0, 'USD', false,
       jsonb_build_object('pricing_model', 'cancellation_credit')
 WHERE NOT EXISTS (SELECT 1 FROM public.package_catalog WHERE package_type = 'credit');

-- 2. Paid lesson cancelled in time -> lesson credit ----------------------
CREATE OR REPLACE FUNCTION public.student_cancel_paid_lesson_to_credit(
    p_booking_id uuid,
    p_purchaser_account_id uuid,
    p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_booking RECORD;
    v_payment RECORD;
    v_rate numeric;
    v_catalog_id uuid;
    v_entitlement_id uuid;
    v_now timestamptz := timezone('utc'::text, now());
BEGIN
    SELECT * INTO v_booking FROM public.bookings WHERE id = p_booking_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;
    IF v_booking.status NOT IN ('confirmed', 'rescheduled') THEN
        RAISE EXCEPTION 'This lesson cannot be cancelled.' USING ERRCODE = 'P0001';
    END IF;
    IF v_booking.booking_type = 'trial' OR v_booking.package_entitlement_id IS NOT NULL THEN
        RAISE EXCEPTION 'Not a paid single lesson.' USING ERRCODE = 'P0001';
    END IF;
    IF v_booking.scheduled_start - v_now < interval '3 hours' THEN
        RAISE EXCEPTION 'Lessons can be cancelled up to 3 hours before they start.' USING ERRCODE = 'P0001';
    END IF;

    SELECT * INTO v_payment FROM public.payments
     WHERE booking_id = p_booking_id AND status = 'confirmed'
     ORDER BY confirmed_at DESC NULLS LAST
     LIMIT 1
     FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'This lesson has no confirmed payment.' USING ERRCODE = 'P0001';
    END IF;

    SELECT hourly_rate_usd INTO v_rate FROM public.services WHERE id = v_booking.service_id;
    SELECT id INTO v_catalog_id FROM public.package_catalog WHERE package_type = 'credit' LIMIT 1;

    UPDATE public.bookings
       SET status = 'cancelled',
           cancellation_reason = coalesce(nullif(p_reason, ''), 'Cancelled by student (lesson credit)'),
           updated_at = v_now
     WHERE id = p_booking_id;

    UPDATE public.reminders SET status = 'cancelled', updated_at = v_now
     WHERE booking_id = p_booking_id AND status = 'pending';

    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (p_booking_id, 'booking_cancel', 'pending')
    ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
    DO NOTHING;

    INSERT INTO public.package_entitlements (
        purchaser_account_id, learner_student_id, package_catalog_id,
        purchased_quantity, price_paid, currency, status,
        remaining_credits, used_credits, payment_reference, metadata
    ) VALUES (
        p_purchaser_account_id, v_booking.student_id, v_catalog_id,
        1, v_payment.amount, v_payment.currency, 'active',
        1, 0, v_payment.payment_reference,
        jsonb_build_object(
            'source', 'cancellation_credit',
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

    RETURN jsonb_build_object('success', true, 'creditId', v_entitlement_id);
END;
$function$;

REVOKE ALL ON FUNCTION public.student_cancel_paid_lesson_to_credit(uuid, uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.student_cancel_paid_lesson_to_credit(uuid, uuid, text) TO service_role;

-- 3. Refund voids the credit a payment produced -------------------------
CREATE OR REPLACE FUNCTION public.refund_payment_atomic(p_payment_id uuid, p_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_payment RECORD;
    v_credit RECORD;
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

    -- A lesson credit made from this payment is refunded together with it.
    FOR v_credit IN
        SELECT * FROM public.package_entitlements
         WHERE metadata->>'source_payment_id' = p_payment_id::text
           AND status = 'active'
         FOR UPDATE
    LOOP
        IF v_credit.used_credits > 0 THEN
            RAISE EXCEPTION 'The lesson credit from this payment was already used.' USING ERRCODE = 'P0001';
        END IF;

        UPDATE public.reminders r
           SET status = 'cancelled', updated_at = v_now
          FROM public.bookings b
         WHERE r.booking_id = b.id
           AND b.package_entitlement_id = v_credit.id
           AND b.status IN ('pending', 'confirmed', 'rescheduled')
           AND r.status = 'pending';

        INSERT INTO public.integration_jobs (booking_id, job_type, status)
        SELECT b.id, 'booking_cancel', 'pending'
          FROM public.bookings b
         WHERE b.package_entitlement_id = v_credit.id
           AND b.status IN ('pending', 'confirmed', 'rescheduled')
        ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed')
        DO NOTHING;

        UPDATE public.bookings
           SET status = 'cancelled',
               cancellation_reason = coalesce(nullif(p_reason, ''), 'Lesson credit refunded'),
               updated_at = v_now
         WHERE package_entitlement_id = v_credit.id
           AND status IN ('pending', 'confirmed', 'rescheduled');

        UPDATE public.package_entitlements
           SET status = 'cancelled',
               remaining_credits = 0,
               metadata = metadata || jsonb_build_object('refunded', true, 'refunded_at', v_now),
               updated_at = v_now
         WHERE id = v_credit.id;
    END LOOP;

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
$function$;
