-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5D FIX
-- Migration: 20260907000005_phase5d_guardian_email_nullable.sql
-- Purpose: Make parent_email nullable in public.guardians and clean up dummy values
-- ====================================================================

-- 1. Clean up any dummy fallback values previously stored
UPDATE public.guardians 
SET parent_email = NULL 
WHERE parent_email = 'parent@guardian.local' OR parent_email = '';

-- 2. Alter column to drop NOT NULL constraint
ALTER TABLE public.guardians 
ALTER COLUMN parent_email DROP NOT NULL;

-- 3. Ensure index exists for looking up guardians by parent_email if queried
CREATE INDEX IF NOT EXISTS idx_guardians_parent_email ON public.guardians(parent_email) WHERE parent_email IS NOT NULL;
