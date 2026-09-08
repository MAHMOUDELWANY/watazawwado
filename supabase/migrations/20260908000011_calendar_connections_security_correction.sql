-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — CALENDAR CONNECTIONS RLS CORRECTION
-- Migration: 20260908000011_calendar_connections_security_correction.sql
-- Role: Correct RLS policies on calendar_connections against actual schema
-- ====================================================================

-- 1. Ensure RLS is enabled on calendar_connections
ALTER TABLE IF EXISTS public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- 2. Revoke public and anonymous access
REVOKE ALL ON public.calendar_connections FROM PUBLIC;
REVOKE ALL ON public.calendar_connections FROM anon;

-- 3. Drop all previous/flawed policies on calendar_connections
DROP POLICY IF EXISTS "Public cannot read calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can view and manage calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher full access to calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can view own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can insert own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can update own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can delete own calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Allow authenticated teachers full access to calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Strict teacher own calendar connection access" ON public.calendar_connections;

-- 4. Create strictly scoped policy matching the ACTUAL schema:
--    - calendar_connections.teacher_id is UUID REFERENCES public.profiles(id)
--    - public.profiles.id is auth.users(id) (i.e. auth.uid())
--    - public.teacher_accounts has primary key `email` (TEXT) and `is_active` (BOOLEAN)
--    - An authenticated teacher can only access calendar_connections where:
--      (a) teacher_id = auth.uid()
--      (b) their profile email matches an active teacher in teacher_accounts
CREATE POLICY "Strict teacher own calendar connection access"
ON public.calendar_connections
FOR ALL
TO authenticated
USING (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM public.teacher_accounts ta
    JOIN public.profiles p ON lower(p.email) = lower(ta.email)
    WHERE p.id = auth.uid()
      AND ta.is_active = true
  )
)
WITH CHECK (
  teacher_id = auth.uid()
  AND EXISTS (
    SELECT 1 
    FROM public.teacher_accounts ta
    JOIN public.profiles p ON lower(p.email) = lower(ta.email)
    WHERE p.id = auth.uid()
      AND ta.is_active = true
  )
);

-- 5. Explicitly grant required permissions to service_role (used by server backend)
GRANT ALL ON public.calendar_connections TO service_role;
