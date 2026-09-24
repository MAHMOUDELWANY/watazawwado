-- ====================================================================
-- WATAZAWWADO — TEACHER ROLE MODEL FINALIZATION
-- Migration: 20261004000000_teacher_role_model_finalization.sql
-- Canonical Roles:
-- 1. mahmoudelwany98@gmail.com => super_admin (Super Admin)
-- 2. mhmwdlwany4222@gmail.com  => teacher     (Teaching Staff)
-- ====================================================================

-- 1. Ensure table public.teacher_accounts exists with canonical schema
CREATE TABLE IF NOT EXISTS public.teacher_accounts (
    email TEXT PRIMARY KEY,
    role TEXT NOT NULL DEFAULT 'teacher' CHECK (role IN ('teacher', 'super_admin')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Ensure RLS is enabled on teacher_accounts (service role only; no public/anon access)
ALTER TABLE public.teacher_accounts ENABLE ROW LEVEL SECURITY;

-- 3. Upsert canonical super_admin account: mahmoudelwany98@gmail.com
INSERT INTO public.teacher_accounts (email, role, is_active, updated_at)
VALUES ('mahmoudelwany98@gmail.com', 'super_admin', true, timezone('utc'::text, now()))
ON CONFLICT (email) DO UPDATE
SET role = 'super_admin',
    is_active = true,
    updated_at = timezone('utc'::text, now());

-- 4. Upsert canonical teacher account: mhmwdlwany4222@gmail.com
INSERT INTO public.teacher_accounts (email, role, is_active, updated_at)
VALUES ('mhmwdlwany4222@gmail.com', 'teacher', true, timezone('utc'::text, now()))
ON CONFLICT (email) DO UPDATE
SET role = 'teacher',
    is_active = true,
    updated_at = timezone('utc'::text, now());

-- 5. Guarantee that exactly one account is super_admin and mhmwdlwany4222@gmail.com is teacher
UPDATE public.teacher_accounts
SET role = 'teacher',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mhmwdlwany4222@gmail.com';

UPDATE public.teacher_accounts
SET role = 'super_admin',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mahmoudelwany98@gmail.com';

-- 6. Demote any other unexpected accounts that may have had super_admin role
UPDATE public.teacher_accounts
SET role = 'teacher',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) NOT IN ('mahmoudelwany98@gmail.com') AND role = 'super_admin';
