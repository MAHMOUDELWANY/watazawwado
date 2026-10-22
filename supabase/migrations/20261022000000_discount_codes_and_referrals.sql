-- ====================================================================
-- Migration: Discount codes, account balance and referrals
-- File: supabase/migrations/20261022000000_discount_codes_and_referrals.sql
--
-- Purpose (owner decisions 2026-10-22, RULES.md §4):
-- 1. discount_codes: codes the super admin creates (percent or fixed amount, scope, limits, dates).
--    A "gift" code may go past the total-savings cap and may cover the whole price.
-- 2. discount_redemptions: one row each time a code and/or account balance is applied to a checkout.
--    The server computes the numbers (server/pricing/discounts.ts); this file only stores them atomically
--    and rewrites the stored price, because payment verification demands the stored price exactly.
-- 3. account_credit_ledger: the account balance (USD). Balance = sum of rows. Referral rewards add to it;
--    checkout use takes from it; a released or refunded checkout gives it back.
-- 4. referral_codes / referrals: each account's personal invite code, and who invited whom. The friend
--    gets welcome credit when they join; the inviter's credit comes only after the friend's first paid
--    lesson is completed (qualify_referral).
-- All tables are server only (service_role). All functions are service_role only.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.discount_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9_-]{3,32}$'),
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
    value NUMERIC(8,2) NOT NULL CHECK (value > 0),
    applies_to TEXT NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'lessons', 'packages')),
    first_purchase_only BOOLEAN NOT NULL DEFAULT false,
    min_amount_usd NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (min_amount_usd >= 0),
    max_redemptions INTEGER CHECK (max_redemptions IS NULL OR max_redemptions > 0),
    max_per_account INTEGER NOT NULL DEFAULT 1 CHECK (max_per_account > 0),
    starts_at TIMESTAMPTZ,
    ends_at TIMESTAMPTZ,
    is_gift BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (discount_type <> 'percent' OR value <= 100),
    CHECK (starts_at IS NULL OR ends_at IS NULL OR ends_at > starts_at)
);

CREATE TABLE IF NOT EXISTS public.discount_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_id UUID REFERENCES public.discount_codes(id) ON DELETE RESTRICT,
    account_user_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('booking', 'package')),
    target_id UUID NOT NULL,
    list_amount NUMERIC(10,2) NOT NULL,
    base_amount NUMERIC(10,2) NOT NULL,
    discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    credit_used NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (credit_used >= 0),
    final_amount NUMERIC(10,2) NOT NULL CHECK (final_amount >= 0),
    status TEXT NOT NULL DEFAULT 'reserved' CHECK (status IN ('reserved', 'redeemed', 'released', 'reversed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS discount_redemptions_one_live_per_target
    ON public.discount_redemptions (target_type, target_id) WHERE status IN ('reserved', 'redeemed');
CREATE INDEX IF NOT EXISTS discount_redemptions_code_idx ON public.discount_redemptions (code_id, status);
CREATE INDEX IF NOT EXISTS discount_redemptions_account_idx ON public.discount_redemptions (account_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.account_credit_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_user_id UUID NOT NULL,
    amount_usd NUMERIC(10,2) NOT NULL CHECK (amount_usd <> 0),
    reason TEXT NOT NULL CHECK (reason IN ('referral_welcome', 'referral_reward', 'checkout_use', 'checkout_release', 'refund_return', 'admin_adjust')),
    redemption_id UUID REFERENCES public.discount_redemptions(id) ON DELETE SET NULL,
    referral_id UUID,
    note TEXT,
    created_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS account_credit_ledger_account_idx ON public.account_credit_ledger (account_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.referral_codes (
    owner_user_id UUID PRIMARY KEY,
    code TEXT NOT NULL UNIQUE CHECK (code ~ '^[A-Z0-9]{4,20}$'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_user_id UUID NOT NULL,
    referred_user_id UUID NOT NULL UNIQUE,
    referred_name TEXT,
    status TEXT NOT NULL DEFAULT 'signed_up' CHECK (status IN ('signed_up', 'rewarded', 'not_rewarded', 'void')),
    welcome_credit_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    reward_credit_usd NUMERIC(10,2) NOT NULL DEFAULT 0,
    qualifying_booking_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    qualified_at TIMESTAMPTZ,
    CHECK (referrer_user_id <> referred_user_id)
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx ON public.referrals (referrer_user_id, created_at DESC);

DO $$
DECLARE t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['discount_codes', 'discount_redemptions', 'account_credit_ledger', 'referral_codes', 'referrals'] LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
        EXECUTE format('DROP POLICY IF EXISTS "Service role manages %s" ON public.%I', t, t);
        EXECUTE format('CREATE POLICY "Service role manages %s" ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', t, t);
        EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t);
    END LOOP;
END $$;

-- Program settings (super admin edits them on the Discounts page). Amounts in USD.
INSERT INTO public.settings (key, value, category, description)
VALUES ('growth_program', jsonb_build_object(
    'referral_enabled', true,
    'friend_credit_usd', 5,
    'referrer_credit_usd', 5,
    'savings_cap_percent', 25,
    'max_rewards_per_year', 10
), 'Growth', 'Referral rewards and the total-savings cap for discount codes')
ON CONFLICT (key) DO NOTHING;

-- --------------------------------------------------------------------
-- Internal: give back what a live redemption took (price and balance).
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public._undo_checkout_redemption(p_redemption_id UUID, p_new_status TEXT, p_restore_price BOOLEAN)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    r record;
BEGIN
    SELECT * INTO r FROM public.discount_redemptions WHERE id = p_redemption_id FOR UPDATE;
    IF NOT FOUND OR r.status NOT IN ('reserved', 'redeemed') THEN
        RETURN;
    END IF;

    IF p_restore_price THEN
        IF r.target_type = 'booking' THEN
            UPDATE public.bookings SET fee_amount_usd = r.base_amount, updated_at = timezone('utc'::text, now())
            WHERE id = r.target_id AND status = 'pending';
        ELSE
            UPDATE public.package_entitlements SET price_paid = r.base_amount, updated_at = timezone('utc'::text, now())
            WHERE id = r.target_id AND status = 'pending_payment';
        END IF;
    END IF;

    IF r.credit_used > 0 THEN
        INSERT INTO public.account_credit_ledger (account_user_id, amount_usd, reason, redemption_id)
        VALUES (r.account_user_id, r.credit_used,
                CASE WHEN p_new_status = 'reversed' THEN 'refund_return' ELSE 'checkout_release' END, r.id);
    END IF;

    UPDATE public.discount_redemptions SET status = p_new_status, updated_at = timezone('utc'::text, now()) WHERE id = r.id;
END;
$$;

REVOKE ALL ON FUNCTION public._undo_checkout_redemption(UUID, TEXT, BOOLEAN) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._undo_checkout_redemption(UUID, TEXT, BOOLEAN) TO service_role;

-- --------------------------------------------------------------------
-- Settle reserved redemptions whose checkout ended: paid ones become redeemed, abandoned ones are released.
-- --------------------------------------------------------------------
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
        IF (r.target_type = 'booking' AND r.b_status IN ('confirmed', 'completed', 'no_show', 'rescheduled'))
           OR (r.target_type = 'package' AND r.e_status IN ('active', 'exhausted', 'expired')) THEN
            UPDATE public.discount_redemptions SET status = 'redeemed', updated_at = timezone('utc'::text, now()) WHERE id = r.id;
            v_count := v_count + 1;
        ELSIF (r.target_type = 'booking' AND (r.b_status IS NULL OR r.b_status NOT IN ('pending')
                  OR (r.payment_plan = 'pay_now' AND r.hold_expires_at IS NOT NULL AND r.hold_expires_at < timezone('utc'::text, now()) - interval '5 minutes')))
           OR (r.target_type = 'package' AND (r.e_status IS NULL OR r.e_status <> 'pending_payment'
                  OR r.created_at < timezone('utc'::text, now()) - interval '2 hours')) THEN
            PERFORM public._undo_checkout_redemption(r.id, 'released', true);
            v_count := v_count + 1;
        END IF;
    END LOOP;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.settle_checkout_redemptions() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_checkout_redemptions() TO service_role;

-- --------------------------------------------------------------------
-- Apply a code and/or account balance to a checkout (or remove them when both are absent).
-- The numbers come from server/pricing/discounts.ts; this function re-checks limits under lock.
-- A final amount of 0 confirms the booking / activates the package right away (no payment needed).
-- --------------------------------------------------------------------
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

-- --------------------------------------------------------------------
-- A refunded checkout: the code use is reversed and any balance used goes back to the account.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reverse_checkout_discount(p_target_type TEXT, p_target_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM public.discount_redemptions
    WHERE target_type = p_target_type AND target_id = p_target_id AND status IN ('reserved', 'redeemed');
    IF v_id IS NULL THEN RETURN false; END IF;
    PERFORM public._undo_checkout_redemption(v_id, 'reversed', false);
    RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.reverse_checkout_discount(TEXT, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reverse_checkout_discount(TEXT, UUID) TO service_role;

-- --------------------------------------------------------------------
-- A friend joins with an invite code: one referral per account, never yourself; welcome credit once.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.attach_referral(p_referred_user_id UUID, p_code TEXT, p_referred_name TEXT, p_welcome NUMERIC)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_owner UUID;
    v_id UUID;
BEGIN
    SELECT owner_user_id INTO v_owner FROM public.referral_codes WHERE code = upper(trim(p_code));
    IF v_owner IS NULL THEN RETURN jsonb_build_object('attached', false, 'reason', 'UNKNOWN_CODE'); END IF;
    IF v_owner = p_referred_user_id THEN RETURN jsonb_build_object('attached', false, 'reason', 'SELF'); END IF;
    IF EXISTS (SELECT 1 FROM public.referrals WHERE referred_user_id = p_referred_user_id) THEN
        RETURN jsonb_build_object('attached', false, 'reason', 'ALREADY_REFERRED');
    END IF;

    INSERT INTO public.referrals (referrer_user_id, referred_user_id, referred_name, welcome_credit_usd)
    VALUES (v_owner, p_referred_user_id, left(p_referred_name, 80), GREATEST(COALESCE(p_welcome, 0), 0))
    ON CONFLICT (referred_user_id) DO NOTHING
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN RETURN jsonb_build_object('attached', false, 'reason', 'ALREADY_REFERRED'); END IF;

    IF COALESCE(p_welcome, 0) > 0 THEN
        INSERT INTO public.account_credit_ledger (account_user_id, amount_usd, reason, referral_id)
        VALUES (p_referred_user_id, round(p_welcome, 2), 'referral_welcome', v_id);
    END IF;
    RETURN jsonb_build_object('attached', true, 'referral_id', v_id, 'referrer_user_id', v_owner);
END;
$$;

REVOKE ALL ON FUNCTION public.attach_referral(UUID, TEXT, TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.attach_referral(UUID, TEXT, TEXT, NUMERIC) TO service_role;

-- --------------------------------------------------------------------
-- The friend's first paid lesson is completed: the inviter gets credit, once, within the yearly limit.
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.qualify_referral(p_referred_user_id UUID, p_booking_id UUID, p_reward NUMERIC, p_max_per_year INTEGER)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ref record;
    v_count integer;
    v_rewarded boolean;
BEGIN
    SELECT * INTO v_ref FROM public.referrals WHERE referred_user_id = p_referred_user_id AND status = 'signed_up' FOR UPDATE;
    IF NOT FOUND THEN RETURN jsonb_build_object('qualified', false); END IF;

    SELECT count(*) INTO v_count FROM public.referrals
    WHERE referrer_user_id = v_ref.referrer_user_id AND status = 'rewarded'
      AND qualified_at > timezone('utc'::text, now()) - interval '365 days';
    v_rewarded := COALESCE(p_reward, 0) > 0 AND v_count < GREATEST(COALESCE(p_max_per_year, 0), 0);

    UPDATE public.referrals
    SET status = CASE WHEN v_rewarded THEN 'rewarded' ELSE 'not_rewarded' END,
        reward_credit_usd = CASE WHEN v_rewarded THEN round(p_reward, 2) ELSE 0 END,
        qualifying_booking_id = p_booking_id,
        qualified_at = timezone('utc'::text, now())
    WHERE id = v_ref.id;

    IF v_rewarded THEN
        INSERT INTO public.account_credit_ledger (account_user_id, amount_usd, reason, referral_id)
        VALUES (v_ref.referrer_user_id, round(p_reward, 2), 'referral_reward', v_ref.id);
    END IF;

    RETURN jsonb_build_object('qualified', true, 'rewarded', v_rewarded, 'referrer_user_id', v_ref.referrer_user_id,
                              'referred_name', v_ref.referred_name, 'reward', CASE WHEN v_rewarded THEN round(p_reward, 2) ELSE 0 END);
END;
$$;

REVOKE ALL ON FUNCTION public.qualify_referral(UUID, UUID, NUMERIC, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.qualify_referral(UUID, UUID, NUMERIC, INTEGER) TO service_role;
