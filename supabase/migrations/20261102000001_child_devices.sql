-- ====================================================================
-- Migration: A child's own phone, linked to the parent's account (NX-16)
-- File: supabase/migrations/20261102000001_child_devices.sql
--
-- Purpose:
-- 1. child_devices: a phone the account holder linked to one of their learners with a one-time 6-digit code.
--    The child has no login of their own. Only hashes are stored: the code (valid 15 minutes, cleared once used)
--    and the long-lived device token. The parent can revoke a device at once (revoked_at).
-- 2. Server only (service_role).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.child_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learner_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
    code_hash TEXT,
    code_expires_at TIMESTAMPTZ,
    token_hash TEXT UNIQUE,
    paired_at TIMESTAMPTZ,
    last_seen_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS child_devices_owner_idx ON public.child_devices (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS child_devices_code_idx ON public.child_devices (code_hash) WHERE code_hash IS NOT NULL;

ALTER TABLE public.child_devices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages child devices" ON public.child_devices;
CREATE POLICY "Service role manages child devices"
    ON public.child_devices FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.child_devices FROM anon, authenticated;
