-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5F FINAL CLOSURE
-- Migration: Settings Database Security & Row Level Security Hardening
-- ====================================================================

-- 1. Enable RLS on settings table
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 2. Drop any previous wide policies
DROP POLICY IF EXISTS "Teacher full access to settings" ON public.settings;
DROP POLICY IF EXISTS "Teacher allowlist access to settings" ON public.settings;

-- 3. Create strict RLS policy: Only active teachers in teacher_accounts can read or modify settings
CREATE POLICY "Teacher allowlist access to settings"
    ON public.settings FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teacher_accounts 
            WHERE lower(email) = lower(auth.jwt() ->> 'email') 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teacher_accounts 
            WHERE lower(email) = lower(auth.jwt() ->> 'email') 
            AND is_active = true
        )
    );
