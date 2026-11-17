-- ====================================================================
-- Migration: Classroom files bucket
-- File: supabase/migrations/20261118000000_classroom_files_bucket.sql
--
-- Purpose:
-- 1. Classroom Release 1, Task 8: the teacher adds a PDF or image to a live lesson.
--    Files sit in the private `classroom-files` bucket at <booking id>/<uuid>.<ext>.
--    The server (service role) uploads them after checking the file's first bytes and
--    hands both sides signed links that end by the room's hard close. No storage
--    policies are added, so signed-in users cannot list or read the bucket directly.
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('classroom-files', 'classroom-files', false, 20971520, ARRAY['application/pdf', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;
