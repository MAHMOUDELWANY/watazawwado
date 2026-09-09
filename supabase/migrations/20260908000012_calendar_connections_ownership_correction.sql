-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — CALENDAR CONNECTIONS OWNERSHIP CORRECTION
-- Migration: 20260908000012_calendar_connections_ownership_correction.sql
-- Role: Migrate teacher_id constraint from public.profiles(id) to auth.users(id)
-- ====================================================================

-- 1. Drop the incorrect foreign key constraint mapping teacher_id to profiles.id
ALTER TABLE IF EXISTS public.calendar_connections
DROP CONSTRAINT IF EXISTS calendar_connections_teacher_id_fkey;

-- 2. Add the correct foreign key mapping teacher_id to auth.users(id)
-- This enforces that teacher_id is the canonical Supabase Auth UUID
ALTER TABLE IF EXISTS public.calendar_connections
ADD CONSTRAINT calendar_connections_teacher_id_fkey
FOREIGN KEY (teacher_id)
REFERENCES auth.users(id)
ON DELETE CASCADE;

-- 3. Ensure a unique constraint exists for teacher_id + provider
-- A teacher should only have one active connection per provider.
-- We use a partial unique index where is_active is true.
DROP INDEX IF EXISTS idx_calendar_connections_active_provider_teacher;

CREATE UNIQUE INDEX idx_calendar_connections_active_provider_teacher
ON public.calendar_connections(teacher_id, provider)
WHERE is_active = true;
