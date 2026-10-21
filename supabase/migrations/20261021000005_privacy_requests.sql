-- ====================================================================
-- Migration: Self-service privacy requests (ST-06)
-- File: supabase/migrations/20261021000005_privacy_requests.sql
--
-- Purpose:
-- 1. privacy_requests: an account asks for its data to be deleted. The request is recorded for the super admin, who
--    handles it by hand within one month (privacy policy). Nothing is deleted automatically.
-- 2. One open request per account. Server only (service_role); browser roles have no access.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.privacy_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL DEFAULT 'deletion' CHECK (kind IN ('deletion')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'withdrawn')),
    reason TEXT CHECK (reason IS NULL OR char_length(reason) <= 1000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS privacy_requests_one_open_idx ON public.privacy_requests (user_id) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS privacy_requests_created_idx ON public.privacy_requests (created_at DESC);

ALTER TABLE public.privacy_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages privacy requests"
    ON public.privacy_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.privacy_requests FROM anon, authenticated;
