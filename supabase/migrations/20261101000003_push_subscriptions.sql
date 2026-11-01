-- ====================================================================
-- Migration: Web push subscriptions (NX-09)
-- File: supabase/migrations/20261101000003_push_subscriptions.sql
--
-- Purpose:
-- 1. push_subscriptions: one row per browser/phone where a signed-in account turned on notifications (opt-in).
--    The server sends lesson reminders there; a subscription the push service reports gone (404/410) is deleted.
-- 2. Server only (service_role).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE CHECK (char_length(endpoint) <= 1000),
    p256dh TEXT NOT NULL CHECK (char_length(p256dh) <= 200),
    auth TEXT NOT NULL CHECK (char_length(auth) <= 100),
    user_agent TEXT CHECK (user_agent IS NULL OR char_length(user_agent) <= 300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS push_subscriptions_user_idx ON public.push_subscriptions (user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Service role manages push subscriptions"
    ON public.push_subscriptions FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.push_subscriptions FROM anon, authenticated;
