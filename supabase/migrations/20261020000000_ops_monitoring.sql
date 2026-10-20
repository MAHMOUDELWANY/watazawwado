-- ====================================================================
-- Migration: Launch operations monitoring (OPS-01, OPS-02, OPS-03)
-- File: supabase/migrations/20261020000000_ops_monitoring.sql
--
-- Purpose:
-- 1. app_errors: front-end errors and API 5xx, one row per distinct error (fingerprint) with a
--    count and last-seen time, so a flood of the same error only bumps a counter.
-- 2. record_app_error(): the single write path for app_errors (server only).
-- 3. ops_heartbeats: last time a background process ran (reminder cron, Stripe webhook), read by
--    the admin health page.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.app_errors (
    fingerprint TEXT PRIMARY KEY,
    source TEXT NOT NULL CHECK (source IN ('client', 'api')),
    message TEXT NOT NULL,
    path TEXT,
    stack TEXT,
    last_account_id UUID,
    occurrences INT NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_app_errors_last_seen ON public.app_errors(last_seen DESC);

ALTER TABLE public.app_errors ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies: only the server (service_role) reads and writes.
DROP POLICY IF EXISTS "Service role manages app errors" ON public.app_errors;
CREATE POLICY "Service role manages app errors"
    ON public.app_errors FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.record_app_error(
    p_source TEXT,
    p_message TEXT,
    p_path TEXT,
    p_stack TEXT,
    p_account_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_message TEXT := left(coalesce(nullif(trim(p_message), ''), 'Unknown error'), 500);
    v_path TEXT := left(p_path, 300);
BEGIN
    INSERT INTO public.app_errors AS e (fingerprint, source, message, path, stack, last_account_id)
    VALUES (md5(p_source || '|' || v_message), p_source, v_message, v_path, left(p_stack, 4000), p_account_id)
    ON CONFLICT (fingerprint) DO UPDATE
        SET occurrences = e.occurrences + 1,
            last_seen = timezone('utc'::text, now()),
            path = coalesce(EXCLUDED.path, e.path),
            stack = coalesce(EXCLUDED.stack, e.stack),
            last_account_id = coalesce(EXCLUDED.last_account_id, e.last_account_id);
END;
$$;

REVOKE ALL ON FUNCTION public.record_app_error(TEXT, TEXT, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_app_error(TEXT, TEXT, TEXT, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.record_app_error(TEXT, TEXT, TEXT, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_app_error(TEXT, TEXT, TEXT, TEXT, UUID) TO service_role;

CREATE TABLE IF NOT EXISTS public.ops_heartbeats (
    key TEXT PRIMARY KEY,
    last_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    detail JSONB NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.ops_heartbeats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages ops heartbeats" ON public.ops_heartbeats;
CREATE POLICY "Service role manages ops heartbeats"
    ON public.ops_heartbeats FOR ALL TO service_role USING (true) WITH CHECK (true);
