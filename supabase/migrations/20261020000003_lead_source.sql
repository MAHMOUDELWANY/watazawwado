-- ====================================================================
-- Migration: Lead source on the account (marketing measurement)
-- File: supabase/migrations/20261020000003_lead_source.sql
--
-- Purpose:
-- 1. students.lead_source: first-touch UTM tags + referrer host + landing path captured in the
--    browser before sign-up and saved at onboarding (no personal data). Written once by the
--    server (service role); later onboardings never overwrite it.
-- 2. students.heard_about: the optional "How did you hear about us?" answer at onboarding.
-- RLS: students already has RLS (own row, assigned teacher, super admin); no new policy is needed.
-- ====================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS lead_source jsonb;
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS heard_about text;

ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_heard_about_check;
ALTER TABLE public.students ADD CONSTRAINT students_heard_about_check CHECK (
  heard_about IS NULL OR heard_about IN ('youtube', 'instagram', 'tiktok', 'facebook', 'telegram_whatsapp', 'search', 'friend_family', 'other')
);

COMMENT ON COLUMN public.students.lead_source IS 'First-touch attribution {utm_source, utm_medium, utm_campaign, utm_content, referrer (host only), landing_path, at}.';
COMMENT ON COLUMN public.students.heard_about IS 'Optional onboarding answer: how the family heard about us.';
