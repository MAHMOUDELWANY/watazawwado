-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — TASK 0.54.1: CALENDAR CONNECTIONS SECURITY HARDENING
-- Migration: 20260908000010_calendar_connections_security_hardening.sql
-- Role: Enforces strict teacher ownership, revokes broad access, and hardens RLS.
-- ====================================================================

-- 1. DROP OBSOLETE & OVERLY BROAD POLICIES
DROP POLICY IF EXISTS "Public cannot read calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can view and manage calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher full access to calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Deny anon access to calendar_connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Strict teacher own calendar connection access" ON public.calendar_connections;

-- 2. REVOKE BROAD DIRECT PERMISSIONS
REVOKE ALL ON public.calendar_connections FROM PUBLIC;
REVOKE ALL ON public.calendar_connections FROM anon;
REVOKE ALL ON public.calendar_connections FROM authenticated;

-- Grant DML exclusively to service_role for backend Express APIs
GRANT ALL ON public.calendar_connections TO service_role;

-- 3. ENABLE AND ENFORCE STRICT ROW LEVEL SECURITY
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- Deny all anon access completely
CREATE POLICY "Deny anon access to calendar_connections"
ON public.calendar_connections
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Restrict authenticated access exclusively to verified teachers in teacher_accounts for their OWN rows
CREATE POLICY "Strict teacher own calendar connection access"
ON public.calendar_connections
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND is_active = true
    )
    AND (
        teacher_id = auth.uid()
        OR teacher_id IN (
            SELECT id FROM public.profiles 
            WHERE lower(email) = lower(auth.jwt() ->> 'email')
        )
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND is_active = true
    )
    AND (
        teacher_id = auth.uid()
        OR teacher_id IN (
            SELECT id FROM public.profiles 
            WHERE lower(email) = lower(auth.jwt() ->> 'email')
        )
    )
);

-- 4. PERFORMANCE & OWNERSHIP INDEXING
CREATE INDEX IF NOT EXISTS idx_calendar_connections_teacher_provider 
ON public.calendar_connections(teacher_id, provider, is_active);
