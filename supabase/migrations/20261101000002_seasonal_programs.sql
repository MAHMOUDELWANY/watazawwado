-- ====================================================================
-- Migration: Seasonal programs (NX-08)
-- File: supabase/migrations/20261101000002_seasonal_programs.sql
--
-- Purpose:
-- 1. seasonal_programs: dated programs the super admin creates (Ramadan challenge, summer revision, a shared
--    khatma), each with a start, an end and a sign-up window that closes when the program ends.
-- 2. program_signups: one row per learner who joined (the family signs up a learner from the portal).
-- 3. Server only (service_role), like lesson_feedback: the server checks the admin, the family and the learner.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.seasonal_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title_en TEXT NOT NULL CHECK (char_length(title_en) BETWEEN 3 AND 120),
    title_ar TEXT NOT NULL CHECK (char_length(title_ar) BETWEEN 3 AND 120),
    description_en TEXT CHECK (description_en IS NULL OR char_length(description_en) <= 1500),
    description_ar TEXT CHECK (description_ar IS NULL OR char_length(description_ar) <= 1500),
    starts_on DATE NOT NULL,
    ends_on DATE NOT NULL,
    is_published BOOLEAN NOT NULL DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (ends_on >= starts_on)
);

CREATE TABLE IF NOT EXISTS public.program_signups (
    program_id UUID NOT NULL REFERENCES public.seasonal_programs(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    account_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (program_id, student_id)
);

CREATE INDEX IF NOT EXISTS program_signups_student_idx ON public.program_signups (student_id);

ALTER TABLE public.seasonal_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_signups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages seasonal programs" ON public.seasonal_programs;
CREATE POLICY "Service role manages seasonal programs"
    ON public.seasonal_programs FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role manages program signups" ON public.program_signups;
CREATE POLICY "Service role manages program signups"
    ON public.program_signups FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.seasonal_programs FROM anon, authenticated;
REVOKE ALL ON public.program_signups FROM anon, authenticated;
