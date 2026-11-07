-- ====================================================================
-- Migration: Teacher photo and ID card uploads
-- File: supabase/migrations/20261107000000_teacher_photo_and_id_card.sql
--
-- Purpose:
-- 1. Teachers upload their own photo (shown on their card, so a public bucket) and ID card
--    (seen only by the super admin, so a private bucket) from Settings, instead of sending
--    them in Messages (owner review 2026-11-07, item 18).
-- 2. teacher_accounts records where the ID card is and when it arrived.
-- Uploads go through short signed upload links made by the server (service role); no
-- storage policies are added, so signed-in users cannot list or read the private bucket.
-- ====================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('teacher-photos', 'teacher-photos', true, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('teacher-documents', 'teacher-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.teacher_accounts ADD COLUMN IF NOT EXISTS id_card_path text;
ALTER TABLE public.teacher_accounts ADD COLUMN IF NOT EXISTS id_card_uploaded_at timestamptz;
