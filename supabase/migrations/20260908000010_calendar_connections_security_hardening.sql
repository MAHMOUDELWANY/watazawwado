-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — CALENDAR CONNECTIONS SECURITY HARDENING
-- Migration: 20260908000010_calendar_connections_security_hardening.sql
-- Role: Enforce RLS and strict ownership isolation on calendar_connections
-- ====================================================================

-- 1. Enable RLS on calendar_connections
ALTER TABLE IF EXISTS public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- 2. Revoke all public / anonymous permissions on calendar_connections
REVOKE ALL ON public.calendar_connections FROM PUBLIC;
REVOKE ALL ON public.calendar_connections FROM anon;

-- 3. Drop existing permissive or ambiguous policies on calendar_connections
DROP POLICY IF EXISTS "Teacher can view own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can insert own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can update own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can delete own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Allow authenticated teachers full access to calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Strict teacher own calendar connection access" ON public.calendar_connections;

-- 4. Create strictly scoped policy: Only the authenticated teacher owning the row can access it
CREATE POLICY "Strict teacher own calendar connection access"
ON public.calendar_connections
FOR ALL
TO authenticated
USING (
  teacher_id IN (
    SELECT ta.id 
    FROM public.teacher_accounts ta
    JOIN public.profiles p ON p.id = ta.profile_id
    WHERE p.auth_user_id = auth.uid()
       OR ta.email = (auth.jwt() ->> 'email')
  )
)
WITH CHECK (
  teacher_id IN (
    SELECT ta.id 
    FROM public.teacher_accounts ta
    JOIN public.profiles p ON p.id = ta.profile_id
    WHERE p.auth_user_id = auth.uid()
       OR ta.email = (auth.jwt() ->> 'email')
  )
);
