-- ====================================================================
-- Migration: RLS Policy Hardening (live audit 2026-10-13)
-- File: supabase/migrations/20261013000001_rls_policy_hardening.sql
--
-- Purpose (found by reading pg_policies on production):
-- 1. lesson_notes had "Teacher full access" FOR ALL TO authenticated USING (true):
--    any signed-in account (including any student) could read/edit/delete every
--    teacher's private notes. Restrict to active teachers.
-- 2. settings had FOR ALL TO authenticated USING (true): any signed-in account
--    could rewrite payment instructions / contact details. Restrict to super_admin.
--    (The app reads/writes settings only through the API with service_role.)
-- 3. payments and services gave every active teacher FOR ALL, bypassing the API's
--    super-admin gate. Teachers keep read access; writes become super_admin only.
-- ====================================================================

-- Super admin check shared by the policies below.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_accounts
    WHERE lower(trim(email)) = lower(trim(auth.jwt() ->> 'email'))
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_super_admin() FROM anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;

-- 1. LESSON NOTES: active teachers only
DROP POLICY IF EXISTS "Teacher full access to lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Active teachers manage lesson_notes" ON public.lesson_notes;
CREATE POLICY "Active teachers manage lesson_notes" ON public.lesson_notes
    FOR ALL TO authenticated
    USING (public.is_active_teacher())
    WITH CHECK (public.is_active_teacher());

-- 2. SETTINGS: super admin only
DROP POLICY IF EXISTS "Teacher full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Super admin manages settings" ON public.settings;
CREATE POLICY "Super admin manages settings" ON public.settings
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 3. PAYMENTS: teachers read, super admin writes
DROP POLICY IF EXISTS "Teacher allowlist access to payments" ON public.payments;
DROP POLICY IF EXISTS "Active teachers read payments" ON public.payments;
DROP POLICY IF EXISTS "Super admin manages payments" ON public.payments;
CREATE POLICY "Active teachers read payments" ON public.payments
    FOR SELECT TO authenticated
    USING (public.is_active_teacher());
CREATE POLICY "Super admin manages payments" ON public.payments
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 4. SERVICES: public reads active rows (existing policy), teachers read all, super admin writes
DROP POLICY IF EXISTS "Teacher allowlist access to services" ON public.services;
DROP POLICY IF EXISTS "Active teachers read services" ON public.services;
DROP POLICY IF EXISTS "Super admin manages services" ON public.services;
CREATE POLICY "Active teachers read services" ON public.services
    FOR SELECT TO authenticated
    USING (public.is_active_teacher());
CREATE POLICY "Super admin manages services" ON public.services
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());
