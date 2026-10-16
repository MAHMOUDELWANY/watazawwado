-- ====================================================================
-- Migration: Teacher public card (photo and Arabic name)
-- File: supabase/migrations/20261016000005_teacher_public_card.sql
--
-- Purpose:
-- 1. The onboarding teacher picker now lists the real active teachers
--    (GET /api/student/teachers) instead of two hard-coded cards, so every
--    teacher the super admin adds can be chosen. Each teacher gets an
--    optional photo and an Arabic display name for that card.
-- 2. Seed the two current teachers. teacher_accounts stays server-only
--    (RLS on, no policies); the API returns only id, names, gender, photo.
-- ====================================================================

ALTER TABLE public.teacher_accounts
  ADD COLUMN IF NOT EXISTS photo_url text,
  ADD COLUMN IF NOT EXISTS display_name_ar text;

UPDATE public.teacher_accounts
SET photo_url = COALESCE(photo_url, '/teacher-mahmoud-avatar.jpg'),
    display_name_ar = COALESCE(display_name_ar, 'أستاذ محمود'),
    updated_at = timezone('utc'::text, now())
WHERE gender = 'male' AND display_name ILIKE 'Ustadh Mahmoud%';

UPDATE public.teacher_accounts
SET photo_url = COALESCE(photo_url, '/teacher-afnan-avatar.jpg'),
    display_name_ar = COALESCE(display_name_ar, 'أستاذة أفنان'),
    updated_at = timezone('utc'::text, now())
WHERE gender = 'female' AND display_name ILIKE 'Ustadha Afnan%';
