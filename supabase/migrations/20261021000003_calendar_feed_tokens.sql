-- ====================================================================
-- Migration: Family calendar feed tokens (PA-03)
-- File: supabase/migrations/20261021000003_calendar_feed_tokens.sql
--
-- Purpose:
-- 1. calendar_feed_tokens: one secret calendar-subscription link per account. Only a SHA-256 hash of the token is
--    stored; the token itself is shown once to the account. Regenerating replaces the hash, which revokes the old link.
--    The feed lists lesson times with subject and the learner's first name; never Zoom links.
-- 2. Server only (service_role).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.calendar_feed_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE CHECK (char_length(token_hash) = 64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.calendar_feed_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages calendar feed tokens"
    ON public.calendar_feed_tokens FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.calendar_feed_tokens FROM anon, authenticated;
