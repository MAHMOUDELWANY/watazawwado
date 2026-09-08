-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — TEACHER LIFECYCLE RPC SECURITY HARDENING (Task 0.53.3)
-- Migration: 20260908000009_teacher_lifecycle_security_hardening.sql
-- ====================================================================

-- The teacher_cancel_booking and teacher_reschedule_booking RPCs 
-- are SECURITY DEFINER but implicitly have EXECUTE granted to PUBLIC by default in PostgreSQL.
-- Since the Node.js API server (with verifyTeacherAuth middleware) calls these 
-- using the service_role key, we must revoke execution from public/anon/authenticated 
-- to prevent direct privileged invocation from unauthorized Supabase clients.

-- 1. Harden teacher_cancel_booking
REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_cancel_booking(UUID, TEXT, TEXT) TO service_role;

-- 2. Harden teacher_reschedule_booking
REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.teacher_reschedule_booking(UUID, TIMESTAMPTZ, TIMESTAMPTZ, TEXT, TEXT) TO service_role;
