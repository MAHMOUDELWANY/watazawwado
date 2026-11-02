-- ====================================================================
-- Migration: Sponsor a learner, one general sadaqah fund (NX-07)
-- File: supabase/migrations/20261102000003_sponsorship_fund.sql
--
-- Purpose (owner decisions 2026-11-02):
-- 1. sponsorship_donations: sadaqah given to one general fund (by a number of lessons or any amount), paid by Stripe.
--    Only 'confirmed' rows count; the server confirms them from the Stripe session it created.
-- 2. sponsorship_requests: a family asks for lessons for one of its learners, with a short reason only the super admin
--    reads. One open request per learner.
-- 3. sponsorship_grants: the academy gives a learner one catalog package from the fund (also without a request).
--    The fund pays the package's normal price; the family pays nothing.
-- 4. grant_sponsorship_atomic: locks the fund, checks the balance, creates the active package with its credits and
--    records the grant in one transaction, so two grants can never spend the same money.
-- 5. Server only (service_role). No names are shown to anyone but the super admin.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.sponsorship_donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    donor_email TEXT,
    amount_usd NUMERIC(10, 2) NOT NULL CHECK (amount_usd >= 1 AND amount_usd <= 10000),
    lessons SMALLINT CHECK (lessons IS NULL OR lessons BETWEEN 1 AND 200),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded')),
    stripe_session_id TEXT UNIQUE,
    payment_reference TEXT,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS sponsorship_donations_status_idx ON public.sponsorship_donations (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.sponsorship_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learner_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    lessons_requested SMALLINT NOT NULL CHECK (lessons_requested IN (4, 8, 12)),
    reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 10 AND 1000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
    admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 1000),
    decided_by TEXT,
    decided_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS sponsorship_requests_one_open ON public.sponsorship_requests (learner_student_id) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS public.sponsorship_grants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    account_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    request_id UUID REFERENCES public.sponsorship_requests(id) ON DELETE SET NULL,
    package_catalog_id UUID NOT NULL REFERENCES public.package_catalog(id) ON DELETE RESTRICT,
    entitlement_id UUID REFERENCES public.package_entitlements(id) ON DELETE SET NULL,
    lessons SMALLINT NOT NULL CHECK (lessons > 0),
    fund_cost_usd NUMERIC(10, 2) NOT NULL CHECK (fund_cost_usd >= 0),
    granted_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS sponsorship_grants_created_idx ON public.sponsorship_grants (created_at DESC);

ALTER TABLE public.sponsorship_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsorship_grants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages sponsorship donations" ON public.sponsorship_donations;
CREATE POLICY "Service role manages sponsorship donations" ON public.sponsorship_donations FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role manages sponsorship requests" ON public.sponsorship_requests;
CREATE POLICY "Service role manages sponsorship requests" ON public.sponsorship_requests FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role manages sponsorship grants" ON public.sponsorship_grants;
CREATE POLICY "Service role manages sponsorship grants" ON public.sponsorship_grants FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.sponsorship_donations FROM anon, authenticated;
REVOKE ALL ON public.sponsorship_requests FROM anon, authenticated;
REVOKE ALL ON public.sponsorship_grants FROM anon, authenticated;

-- What the fund holds now: confirmed sadaqah minus what grants have spent.
CREATE OR REPLACE FUNCTION public.sponsorship_fund_balance()
RETURNS NUMERIC LANGUAGE sql STABLE
SET search_path = public, pg_temp
AS $$
    SELECT COALESCE((SELECT sum(amount_usd) FROM public.sponsorship_donations WHERE status = 'confirmed'), 0)
         - COALESCE((SELECT sum(fund_cost_usd) FROM public.sponsorship_grants), 0);
$$;

REVOKE ALL ON FUNCTION public.sponsorship_fund_balance() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sponsorship_fund_balance() FROM anon;
REVOKE ALL ON FUNCTION public.sponsorship_fund_balance() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.sponsorship_fund_balance() TO service_role;

CREATE OR REPLACE FUNCTION public.grant_sponsorship_atomic(
    p_account_user_id UUID,
    p_learner_student_id UUID,
    p_package_catalog_id UUID,
    p_request_id UUID,
    p_granted_by TEXT
)
RETURNS JSONB LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_cat RECORD;
    v_balance NUMERIC;
    v_entitlement_id UUID;
    v_grant_id UUID;
BEGIN
    -- One grant at a time, so the balance check below cannot race.
    PERFORM pg_advisory_xact_lock(hashtext('sponsorship_fund'));

    SELECT id, lesson_count, price_amount, is_active INTO v_cat FROM public.package_catalog WHERE id = p_package_catalog_id;
    IF v_cat.id IS NULL OR NOT v_cat.is_active THEN
        RAISE EXCEPTION 'PACKAGE_NOT_AVAILABLE';
    END IF;

    IF p_request_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM public.sponsorship_requests
        WHERE id = p_request_id AND status = 'pending' AND learner_student_id = p_learner_student_id AND account_user_id = p_account_user_id
    ) THEN
        RAISE EXCEPTION 'REQUEST_NOT_OPEN';
    END IF;

    v_balance := public.sponsorship_fund_balance();
    IF v_balance < v_cat.price_amount THEN
        RAISE EXCEPTION 'FUND_TOO_LOW';
    END IF;

    INSERT INTO public.package_entitlements (purchaser_account_id, learner_student_id, package_catalog_id, purchased_quantity,
        price_paid, status, remaining_credits, metadata)
    VALUES (p_account_user_id, p_learner_student_id, p_package_catalog_id, v_cat.lesson_count, 0, 'active', v_cat.lesson_count,
        jsonb_build_object('sponsorship', true, 'fund_cost_usd', v_cat.price_amount))
    RETURNING id INTO v_entitlement_id;

    FOR i IN 1..v_cat.lesson_count LOOP
        INSERT INTO public.package_credit_ledger (package_entitlement_id, learner_student_id, activity_type, delta_credits, idempotency_key)
        VALUES (v_entitlement_id, p_learner_student_id, 'grant', 1, 'sponsorship_' || v_entitlement_id::text || '_' || i::text);
    END LOOP;

    INSERT INTO public.sponsorship_grants (learner_student_id, account_user_id, request_id, package_catalog_id, entitlement_id,
        lessons, fund_cost_usd, granted_by)
    VALUES (p_learner_student_id, p_account_user_id, p_request_id, p_package_catalog_id, v_entitlement_id,
        v_cat.lesson_count, v_cat.price_amount, p_granted_by)
    RETURNING id INTO v_grant_id;

    IF p_request_id IS NOT NULL THEN
        UPDATE public.sponsorship_requests
        SET status = 'approved', decided_by = p_granted_by, decided_at = timezone('utc'::text, now())
        WHERE id = p_request_id;
    END IF;

    RETURN jsonb_build_object('grant_id', v_grant_id, 'entitlement_id', v_entitlement_id,
        'lessons', v_cat.lesson_count, 'fund_cost_usd', v_cat.price_amount, 'balance_after', v_balance - v_cat.price_amount);
END;
$$;

REVOKE ALL ON FUNCTION public.grant_sponsorship_atomic(UUID, UUID, UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.grant_sponsorship_atomic(UUID, UUID, UUID, UUID, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.grant_sponsorship_atomic(UUID, UUID, UUID, UUID, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.grant_sponsorship_atomic(UUID, UUID, UUID, UUID, TEXT) TO service_role;
