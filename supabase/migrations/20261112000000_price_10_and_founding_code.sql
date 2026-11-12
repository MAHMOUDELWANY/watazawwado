-- ====================================================================
-- Migration: New list price $10/hour and codes for the first N families
-- File: supabase/migrations/20261112000000_price_10_and_founding_code.sql
--
-- Purpose (RULES.md §3 and §4, owner 2026-11-12; BACKLOG MK-01):
-- 1. Quran, Tajweed and Islamic studies go from $9 to $10 an hour (services.hourly_rate_usd). Arabic and English stay
--    $13. Bookings already made keep the fee stored on them.
-- 2. Packages for the new $10 band: $9.50 / $9.25 / $9.00 an hour for 4 / 8 / 12 lessons (same dollar savings as the
--    $9 band had). The $9 rows are switched off, not deleted. Credits that point at the $9 band move to $10 so they
--    stay usable for the same subjects (none existed when this was written).
-- 3. discount_codes.max_accounts: how many different families may use a code (null = no limit), checked under lock
--    in apply_checkout_discount_atomic. For the founding code (first 20 families, 15% for 12 months), which the
--    super admin creates at the wave opening (docs/launch-runbook.md). Uses per family may now go up to 1000.
-- ====================================================================

-- 1. List price ---------------------------------------------------------
UPDATE public.services SET hourly_rate_usd = 10.00 WHERE hourly_rate_usd = 9.00;

-- 2. Packages -------------------------------------------------------------
UPDATE public.package_catalog
   SET is_active = false, updated_at = timezone('utc'::text, now())
 WHERE eligibility_rules->>'pricing_model' = 'hourly_band_v1'
   AND (eligibility_rules->>'hourly_rate')::numeric = 9;

INSERT INTO public.package_catalog (package_type, name, lesson_count, price_amount, currency, is_active, eligibility_rules)
SELECT 'monthly',
       'Quran & Islamic studies · ' || t.n || ' × ' || d.m || ' min',
       t.n,
       round(t.per_hour * t.n * d.m / 60.0, 2),
       'USD',
       true,
       jsonb_build_object(
           'pricing_model', 'hourly_band_v1',
           'hourly_rate', 10,
           'duration_minutes', d.m,
           'per_hour_price', t.per_hour,
           'single_lesson_price_usd', round(10 * d.m / 60.0, 2),
           'name_ar', 'القرآن والعلوم الشرعية · ' || t.n || ' حصص × ' || d.m || ' دقيقة'
       )
  FROM (VALUES (4, 9.50::numeric), (8, 9.25), (12, 9.00)) AS t(n, per_hour)
 CROSS JOIN (VALUES (30), (45), (60)) AS d(m)
 WHERE NOT EXISTS (
     SELECT 1 FROM public.package_catalog pc
      WHERE pc.eligibility_rules->>'pricing_model' = 'hourly_band_v1'
        AND (pc.eligibility_rules->>'hourly_rate')::numeric = 10
        AND (pc.eligibility_rules->>'duration_minutes')::int = d.m
        AND pc.lesson_count = t.n
 );

UPDATE public.package_entitlements
   SET metadata = jsonb_set(metadata, '{hourly_rate}', '10'::jsonb), updated_at = timezone('utc'::text, now())
 WHERE (metadata->>'hourly_rate')::numeric = 9;

-- 3. Codes for the first N families -------------------------------------
ALTER TABLE public.discount_codes ADD COLUMN IF NOT EXISTS max_accounts integer;
ALTER TABLE public.discount_codes DROP CONSTRAINT IF EXISTS discount_codes_max_accounts_check;
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_max_accounts_check CHECK (max_accounts IS NULL OR max_accounts >= 1);
-- A year of weekly lessons is more than the old limit of 100 uses per family.
ALTER TABLE public.discount_codes DROP CONSTRAINT IF EXISTS discount_codes_max_per_account_check;
ALTER TABLE public.discount_codes ADD CONSTRAINT discount_codes_max_per_account_check CHECK (max_per_account >= 1 AND max_per_account <= 1000);

CREATE OR REPLACE FUNCTION public.apply_checkout_discount_atomic(
    p_target_type TEXT,
    p_target_id UUID,
    p_account_user_id UUID,
    p_code_id UUID,
    p_list_amount NUMERIC,
    p_base_amount NUMERIC,
    p_discount NUMERIC,
    p_credit NUMERIC,
    p_final NUMERIC
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking record;
    v_ent record;
    v_code record;
    v_live record;
    v_current NUMERIC;
    v_used integer;
    v_balance NUMERIC;
    v_redemption_id UUID;
BEGIN
    IF p_target_type NOT IN ('booking', 'package') THEN
        RAISE EXCEPTION 'Invalid target type.' USING ERRCODE = 'P0004';
    END IF;
    IF p_discount < 0 OR p_credit < 0 OR p_final < 0 OR round(p_base_amount - p_discount - p_credit, 2) <> round(p_final, 2) THEN
        RAISE EXCEPTION 'Checkout numbers do not add up.' USING ERRCODE = 'P0004';
    END IF;

    PERFORM public.settle_checkout_redemptions();

    -- 1. Lock the target and make sure it still waits for payment.
    IF p_target_type = 'booking' THEN
        SELECT * INTO v_booking FROM public.bookings WHERE id = p_target_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002'; END IF;
        IF v_booking.status <> 'pending' THEN RAISE EXCEPTION 'This booking is not awaiting payment.' USING ERRCODE = 'P0004'; END IF;
    ELSE
        SELECT * INTO v_ent FROM public.package_entitlements WHERE id = p_target_id FOR UPDATE;
        IF NOT FOUND THEN RAISE EXCEPTION 'Package not found.' USING ERRCODE = 'P0002'; END IF;
        IF v_ent.status <> 'pending_payment' THEN RAISE EXCEPTION 'This package is not awaiting payment.' USING ERRCODE = 'P0004'; END IF;
    END IF;

    -- 2. Undo any earlier code/balance on this checkout so re-applying is idempotent.
    SELECT * INTO v_live FROM public.discount_redemptions
    WHERE target_type = p_target_type AND target_id = p_target_id AND status = 'reserved' FOR UPDATE;
    IF FOUND THEN
        PERFORM public._undo_checkout_redemption(v_live.id, 'released', true);
    END IF;

    IF p_target_type = 'booking' THEN
        SELECT fee_amount_usd INTO v_current FROM public.bookings WHERE id = p_target_id;
    ELSE
        SELECT price_paid INTO v_current FROM public.package_entitlements WHERE id = p_target_id;
    END IF;
    IF round(COALESCE(v_current, 0), 2) <> round(p_base_amount, 2) THEN
        RAISE EXCEPTION 'The price changed. Please try again.' USING ERRCODE = 'P0004';
    END IF;

    -- Nothing to apply: the earlier one (if any) is removed, price is back to normal.
    IF p_code_id IS NULL AND p_credit = 0 THEN
        RETURN jsonb_build_object('applied', false, 'final_amount', p_base_amount, 'confirmed', false);
    END IF;

    -- 3. Code limits, under lock.
    IF p_code_id IS NOT NULL THEN
        SELECT * INTO v_code FROM public.discount_codes WHERE id = p_code_id FOR UPDATE;
        IF NOT FOUND OR NOT v_code.is_active
           OR (v_code.starts_at IS NOT NULL AND v_code.starts_at > timezone('utc'::text, now()))
           OR (v_code.ends_at IS NOT NULL AND v_code.ends_at <= timezone('utc'::text, now())) THEN
            RAISE EXCEPTION 'CODE_NOT_ACTIVE' USING ERRCODE = 'P0004';
        END IF;
        IF v_code.max_redemptions IS NOT NULL THEN
            SELECT count(*) INTO v_used FROM public.discount_redemptions WHERE code_id = p_code_id AND status IN ('reserved', 'redeemed');
            IF v_used >= v_code.max_redemptions THEN RAISE EXCEPTION 'CODE_USED_UP' USING ERRCODE = 'P0004'; END IF;
        END IF;
        SELECT count(*) INTO v_used FROM public.discount_redemptions
        WHERE code_id = p_code_id AND account_user_id = p_account_user_id AND status IN ('reserved', 'redeemed');
        IF v_used >= v_code.max_per_account THEN RAISE EXCEPTION 'CODE_ALREADY_USED' USING ERRCODE = 'P0004'; END IF;
        -- MK-01: a code for the first N families. A family that already used it keeps using it (up to max_per_account).
        IF v_code.max_accounts IS NOT NULL AND v_used = 0 THEN
            SELECT count(DISTINCT account_user_id) INTO v_used FROM public.discount_redemptions
            WHERE code_id = p_code_id AND status IN ('reserved', 'redeemed');
            IF v_used >= v_code.max_accounts THEN RAISE EXCEPTION 'CODE_USED_UP' USING ERRCODE = 'P0004'; END IF;
        END IF;
    END IF;

    -- 4. Balance, under a per-account lock.
    IF p_credit > 0 THEN
        PERFORM pg_advisory_xact_lock(hashtext('credit:' || p_account_user_id::text));
        SELECT COALESCE(sum(amount_usd), 0) INTO v_balance FROM public.account_credit_ledger WHERE account_user_id = p_account_user_id;
        IF v_balance < p_credit THEN RAISE EXCEPTION 'BALANCE_CHANGED' USING ERRCODE = 'P0004'; END IF;
    END IF;

    -- 5. Write it down and set the new price.
    INSERT INTO public.discount_redemptions (code_id, account_user_id, target_type, target_id, list_amount, base_amount,
                                             discount_amount, credit_used, final_amount, status)
    VALUES (p_code_id, p_account_user_id, p_target_type, p_target_id, p_list_amount, p_base_amount,
            round(p_discount, 2), round(p_credit, 2), round(p_final, 2), CASE WHEN p_final = 0 THEN 'redeemed' ELSE 'reserved' END)
    RETURNING id INTO v_redemption_id;

    IF p_credit > 0 THEN
        INSERT INTO public.account_credit_ledger (account_user_id, amount_usd, reason, redemption_id)
        VALUES (p_account_user_id, -round(p_credit, 2), 'checkout_use', v_redemption_id);
    END IF;

    IF p_target_type = 'booking' THEN
        UPDATE public.bookings
        SET fee_amount_usd = round(p_final, 2),
            status = CASE WHEN p_final = 0 THEN 'confirmed' ELSE status END,
            hold_expires_at = CASE WHEN p_final = 0 THEN NULL ELSE hold_expires_at END,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_target_id;
    ELSE
        UPDATE public.package_entitlements
        SET price_paid = round(p_final, 2),
            status = CASE WHEN p_final = 0 THEN 'active' ELSE status END,
            remaining_credits = CASE WHEN p_final = 0 THEN purchased_quantity ELSE remaining_credits END,
            updated_at = timezone('utc'::text, now())
        WHERE id = p_target_id;

        IF p_final = 0 THEN
            FOR i IN 1..v_ent.purchased_quantity LOOP
                INSERT INTO public.package_credit_ledger (package_entitlement_id, learner_student_id, activity_type, delta_credits, idempotency_key)
                VALUES (p_target_id, v_ent.learner_student_id, 'grant', 1, 'grant_' || p_target_id::text || '_' || i::text)
                ON CONFLICT DO NOTHING;
            END LOOP;
        END IF;
    END IF;

    RETURN jsonb_build_object('applied', true, 'redemption_id', v_redemption_id, 'final_amount', round(p_final, 2), 'confirmed', p_final = 0);
END;
$$;

REVOKE ALL ON FUNCTION public.apply_checkout_discount_atomic(TEXT, UUID, UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.apply_checkout_discount_atomic(TEXT, UUID, UUID, UUID, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC) TO service_role;
