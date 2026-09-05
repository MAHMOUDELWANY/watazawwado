-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 4.1.1: FINAL CLOSURE
-- Migration: Secure Integration Status Update
-- ====================================================================

-- 1. Ensure update_booking_integration_status is not publicly executable.
-- We revoke public access because it allows unauthenticated updates to integration fields by reference code alone.
REVOKE ALL ON FUNCTION public.update_booking_integration_status(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) FROM PUBLIC;

-- 2. Grant it strictly to the service_role for backend sync engine usage.
GRANT EXECUTE ON FUNCTION public.update_booking_integration_status(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB) TO service_role;
