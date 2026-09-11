-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — INTEGRATION CLAIM RPC SIGNATURE & PRIVILEGE CLOSURE
-- Migration: 20260911000004_claim_integration_jobs_signature_and_privilege_closure.sql
--
-- Task: 0.55.5-B
-- Objective:
-- Eliminate overload/signature ambiguity on public.claim_integration_jobs
-- by explicitly dropping the legacy 1-argument function (integer) and
-- establishing the single canonical scoped function (integer, uuid) with
-- strict service_role-only execution privileges.
--
-- 1. DROP legacy public.claim_integration_jobs(integer) overload:
--    - Eliminates PostgreSQL overload ambiguity where calls with defaults
--      cannot distinguish between (integer) and (integer, uuid).
--    - Eliminates legacy un-scoped execution paths.
--
-- 2. CANONICAL public.claim_integration_jobs(integer, uuid):
--    - p_batch_size integer DEFAULT 5
--    - p_booking_id uuid DEFAULT NULL
--    - Preserves Task 0.55.4-K stale-lock recovery (> 5 minutes).
--    - Preserves Task 0.55.5 scoped worker claiming when p_booking_id is provided.
--    - Preserves global claiming when p_booking_id IS NULL.
--    - Preserves FOR UPDATE SKIP LOCKED concurrency isolation.
--    - Declares SECURITY DEFINER and SET search_path = public, pg_temp.
--
-- 3. STRICT PRIVILEGE CLOSURE:
--    - REVOKE ALL from PUBLIC, anon, authenticated.
--    - GRANT EXECUTE exclusively to service_role.
--
-- 4. TABLE-LEVEL ACCESS & RLS CLOSURE:
--    - ENABLE & FORCE ROW LEVEL SECURITY on public.integration_jobs.
--    - REVOKE ALL on public.integration_jobs from PUBLIC, anon, authenticated.
--    - GRANT ALL on public.integration_jobs exclusively to service_role.
-- ====================================================================

-- 1. Explicitly drop legacy one-argument overload
DROP FUNCTION IF EXISTS public.claim_integration_jobs(integer);

-- 2. Define the single authoritative canonical claim function
CREATE OR REPLACE FUNCTION public.claim_integration_jobs(
    p_batch_size integer DEFAULT 5,
    p_booking_id uuid DEFAULT NULL
)
RETURNS SETOF public.integration_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.integration_jobs
    SET status = 'processing',
        locked_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id IN (
        SELECT id FROM public.integration_jobs
        WHERE (
            -- Scoped worker filter: when p_booking_id is provided, strictly claim jobs for that booking
            (p_booking_id IS NULL OR booking_id = p_booking_id)
            AND
            (
                -- Case A & B: Pending or failed jobs due for execution (respecting backoff and lock safety)
                (status IN ('pending', 'failed')
                 AND next_attempt_at <= timezone('utc'::text, now())
                 AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'))
                OR
                -- Case C: Stale processing jobs whose worker interrupted or timed out (> 5 minutes)
                (status = 'processing'
                 AND locked_at IS NOT NULL
                 AND locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')
            )
        )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;

-- 3. Lock down execution of canonical function exclusively to service_role
REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM anon;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(integer, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(integer, uuid) TO service_role;

-- 4. Re-assert table-level RLS and permissions on public.integration_jobs
ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_jobs FORCE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.integration_jobs FROM PUBLIC;
REVOKE ALL ON TABLE public.integration_jobs FROM anon;
REVOKE ALL ON TABLE public.integration_jobs FROM authenticated;
GRANT ALL ON TABLE public.integration_jobs TO service_role;
