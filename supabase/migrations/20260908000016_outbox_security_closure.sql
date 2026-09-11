-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — OUTBOX SECURITY CLOSURE
-- Migration: 20260908000016_outbox_security_closure.sql
-- Role:
-- 1. Eliminate all client-facing policies on public.integration_jobs
-- 2. Enforce server-only isolation for integration_jobs (RLS enabled + forced)
-- 3. Revoke all table-level access from PUBLIC, anon, and authenticated roles
-- 4. Grant table-level access exclusively to service_role (server backend)
-- 5. Revoke execution of claim_integration_jobs() from PUBLIC, anon, authenticated
-- 6. Grant execution of claim_integration_jobs() strictly to service_role
-- 7. Ensure safe search_path and SECURITY DEFINER on all outbox functions
-- ====================================================================

-- 1. Enable and Force Row Level Security on integration_jobs
ALTER TABLE public.integration_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_jobs FORCE ROW LEVEL SECURITY;

-- 2. Drop all client policies on public.integration_jobs
-- No SELECT, INSERT, UPDATE, or DELETE policies exist for client roles (Student, Guest, Teacher browser)
DROP POLICY IF EXISTS "Teachers can view integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Teacher can manage integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Allow all authenticated users" ON public.integration_jobs;
DROP POLICY IF EXISTS "Allow full access to integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot read integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot write integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot update integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Public cannot delete integration_jobs" ON public.integration_jobs;
DROP POLICY IF EXISTS "Students cannot read integration_jobs" ON public.integration_jobs;

-- 3. Revoke table-level privileges from all public and client roles
REVOKE ALL ON TABLE public.integration_jobs FROM PUBLIC;
REVOKE ALL ON TABLE public.integration_jobs FROM anon;
REVOKE ALL ON TABLE public.integration_jobs FROM authenticated;

-- 4. Grant full management access exclusively to server-side service_role
GRANT ALL ON TABLE public.integration_jobs TO service_role;

-- 5. Hardened claim_integration_jobs function with safe search_path
CREATE OR REPLACE FUNCTION public.claim_integration_jobs(p_batch_size INT DEFAULT 5)
RETURNS SETOF public.integration_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.integration_jobs
    SET status = 'processing',
        locked_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    WHERE id IN (
        SELECT id FROM public.integration_jobs
        WHERE status IN ('pending', 'failed')
          AND next_attempt_at <= timezone('utc'::text, now())
          AND (locked_at IS NULL OR locked_at < timezone('utc'::text, now()) - INTERVAL '5 minutes')
        ORDER BY created_at ASC
        FOR UPDATE SKIP LOCKED
        LIMIT p_batch_size
    )
    RETURNING *;
END;
$$;

-- 6. Lock down execution of claim_integration_jobs exclusively to service_role
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM anon;
REVOKE ALL ON FUNCTION public.claim_integration_jobs(INT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_integration_jobs(INT) TO service_role;

-- 7. Ensure safe search_path and permissions on authoritative teacher assignment trigger function
CREATE OR REPLACE FUNCTION public.assign_authoritative_teacher_to_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_active_connections_count INT;
    v_deterministic_teacher_id UUID;
BEGIN
    IF NEW.teacher_id IS NOT NULL THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*), MIN(teacher_id) INTO v_active_connections_count, v_deterministic_teacher_id
    FROM public.calendar_connections
    WHERE is_active = true AND provider = 'google_calendar';

    IF v_active_connections_count = 1 THEN
        NEW.teacher_id := v_deterministic_teacher_id;
    END IF;

    RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_authoritative_teacher_to_booking() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.assign_authoritative_teacher_to_booking() FROM anon;
REVOKE ALL ON FUNCTION public.assign_authoritative_teacher_to_booking() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.assign_authoritative_teacher_to_booking() TO service_role;
