-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — INTEGRATION JOB STALE-LOCK RECOVERY
-- Migration: 20260911000001_integration_job_stale_lock_recovery.sql
-- Role:
-- 1. Fix claim_integration_jobs() to reclaim stale 'processing' jobs
--    whose locked_at timestamp is older than 5 minutes (e.g. worker interrupted).
-- 2. Preserve concurrency safety using FOR UPDATE SKIP LOCKED.
-- 3. Maintain strict service_role execution isolation (RLS & Grants).
-- 4. Preserve existing attempt counts and retry history upon stale reclamation.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.claim_integration_jobs(p_batch_size INT DEFAULT 5)
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
            -- Case A & B: Pending or failed jobs due for execution (respecting backoff and lock safety)
            (status IN ('pending', 'failed')
             AND next_attempt_at <= timezone('utc'::text, now())
             AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes'))
            OR
            -- Case C: Stale processing jobs whose worker interrupted or timed out
            (status = 'processing'
             AND locked_at IS NOT NULL
             AND locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')
        )
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;

-- Ensure execution permissions are strictly restricted to service_role
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM anon;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT) TO service_role;
