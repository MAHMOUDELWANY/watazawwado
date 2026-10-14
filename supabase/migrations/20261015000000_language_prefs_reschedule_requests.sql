-- ====================================================================
-- Migration: Language preferences and teacher reschedule requests
-- File: supabase/migrations/20261015000000_language_prefs_reschedule_requests.sql
--
-- Purpose (RULES.md §6, decided 2026-10-15):
-- 1. user_language_preferences: the language a signed-in user explicitly chose on the
--    site (any role). Emails are English unless this says 'ar'. Looked up by email,
--    because emails are addressed by email (a parent receives a child's lesson emails).
--    Server-only table (RLS on, no policies): written through the API.
-- 2. bookings.reschedule_requested_at / reschedule_request_note: a teacher asks the
--    student to move a lesson; the student sees it as an on-site notification and the
--    request clears when the lesson is moved.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.user_language_preferences (
    user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    language text NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'ar')),
    updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS user_language_preferences_email_idx
    ON public.user_language_preferences (lower(email));

ALTER TABLE public.user_language_preferences ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_language_preferences FROM anon, authenticated;

ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_requested_at timestamptz;
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS reschedule_request_note text;
