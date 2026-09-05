-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5A FINAL CLOSURE
-- Migration: Teacher/Super Admin + Student Role Architecture
-- ====================================================================

-- 1. Create authoritative teacher allowlist
CREATE TABLE IF NOT EXISTS public.teacher_accounts (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Seed the approved teacher accounts (Normalized to lowercase)
INSERT INTO public.teacher_accounts (email, role)
VALUES 
    ('mhmwdlwany4222@gmail.com', 'super_admin'),
    ('mahmoudelwany98@gmail.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- 3. Enable RLS on teacher_accounts (service role only)
ALTER TABLE public.teacher_accounts ENABLE ROW LEVEL SECURITY;

-- Service role has implicit full access to all tables. No policies needed for public.

-- 4. Modify profiles table to support roles and general users (Student Foundation)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student', 'super_admin')),
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN display_name DROP DEFAULT,
ALTER COLUMN bio DROP DEFAULT,
ALTER COLUMN whatsapp DROP DEFAULT,
ALTER COLUMN credentials DROP DEFAULT;

-- Function to handle timestamp updates
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$;

-- Trigger for teacher_accounts
DROP TRIGGER IF EXISTS on_teacher_accounts_updated ON public.teacher_accounts;
CREATE TRIGGER on_teacher_accounts_updated
    BEFORE UPDATE ON public.teacher_accounts
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

