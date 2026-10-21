-- ====================================================================
-- Migration: Notification preferences (RN-07)
-- File: supabase/migrations/20261021000002_notification_preferences.sql
--
-- Purpose:
-- 1. notification_preferences: per account (auth user), which optional emails it wants. All on by default (no row =
--    everything on). Transactional emails (booking confirmations, reminders, payments) are not listed and always go.
--    progress_emails   → monthly progress email (PR-09)
--    renewal_reminders → low package balance (RN-02)
--    follow_ups        → trial follow-up (RN-05) and "we miss you" (RN-06)
--    A switch only stops the email; the on-site notice still appears.
-- 2. Read and written only by the server (service_role) behind verifyStudentAuth.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    progress_emails BOOLEAN NOT NULL DEFAULT true,
    renewal_reminders BOOLEAN NOT NULL DEFAULT true,
    follow_ups BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages notification preferences"
    ON public.notification_preferences FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.notification_preferences FROM anon, authenticated;
