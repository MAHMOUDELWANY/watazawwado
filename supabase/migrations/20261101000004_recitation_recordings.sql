-- ====================================================================
-- Migration: Recitation recordings with teacher feedback (NX-03)
-- File: supabase/migrations/20261101000004_recitation_recordings.sql
--
-- Purpose:
-- 1. A private Storage bucket "recitations" (audio only, 5 MB max). No storage policies: browsers never read or
--    write it directly; the server hands out short-lived signed upload and play links after its own checks.
-- 2. recitation_recordings: one row per recording a learner sent (optionally for a homework task), with the
--    teacher's written reply. Recordings older than 90 days are deleted by the server (children's audio).
-- 3. Server only (service_role).
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('recitations', 'recitations', false, 5242880, ARRAY['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/aac', 'audio/x-m4a'])
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.recitation_recordings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    homework_id UUID REFERENCES public.lesson_homework(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL UNIQUE CHECK (char_length(storage_path) <= 200),
    duration_sec SMALLINT CHECK (duration_sec IS NULL OR duration_sec BETWEEN 1 AND 600),
    sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    teacher_reply TEXT CHECK (teacher_reply IS NULL OR char_length(teacher_reply) <= 1000),
    replied_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS recitation_recordings_student_idx ON public.recitation_recordings (student_id, created_at DESC);
CREATE INDEX IF NOT EXISTS recitation_recordings_created_idx ON public.recitation_recordings (created_at);

ALTER TABLE public.recitation_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages recitation recordings" ON public.recitation_recordings;
CREATE POLICY "Service role manages recitation recordings"
    ON public.recitation_recordings FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.recitation_recordings FROM anon, authenticated;
