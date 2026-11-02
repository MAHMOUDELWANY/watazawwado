-- ====================================================================
-- Migration: Community, the later part (CM-04): family achievements, automatic suggestions, photos
-- File: supabase/migrations/20261102000004_community_later.sql
--
-- Purpose (owner 2026-11-02: all three; design docs/superpowers/specs/2026-10-20-milestone-celebration-design.md):
-- 1. family_achievements: a family's lessons together (100 / 250 / 500), put forward by the super admin from a
--    suggestion; the account holder chooses whether it shows on the Hall of Honor and under which family name.
-- 2. learner_milestones.auto_key: a rhythm milestone the system suggested (100 / 200 lessons, a year of weekly lessons)
--    is recorded once per learner.
-- 3. Photos on Hall of Honor entries: only for a published entry, with a second consent from the family and the super
--    admin's review before it shows; a private bucket; the family removes it any time.
-- 4. Server only (service_role).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.family_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    auto_key TEXT NOT NULL CHECK (auto_key IN ('family_lessons_100', 'family_lessons_250', 'family_lessons_500')),
    lessons INTEGER NOT NULL CHECK (lessons > 0),
    title_en TEXT NOT NULL CHECK (char_length(title_en) <= 200),
    title_ar TEXT NOT NULL CHECK (char_length(title_ar) <= 200),
    status TEXT NOT NULL DEFAULT 'awaiting_consent' CHECK (status IN ('awaiting_consent', 'published', 'declined', 'withdrawn', 'removed')),
    display_name TEXT CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 1 AND 40),
    nominated_by UUID,
    decided_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (account_user_id, auto_key),
    CHECK (status <> 'published' OR (display_name IS NOT NULL AND published_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS family_achievements_published_idx ON public.family_achievements (published_at DESC) WHERE status = 'published';

ALTER TABLE public.family_achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages family achievements" ON public.family_achievements;
CREATE POLICY "Service role manages family achievements" ON public.family_achievements FOR ALL TO service_role USING (true) WITH CHECK (true);
REVOKE ALL ON public.family_achievements FROM anon, authenticated;

ALTER TABLE public.learner_milestones ADD COLUMN IF NOT EXISTS auto_key TEXT
    CHECK (auto_key IS NULL OR auto_key IN ('lessons_100', 'lessons_200', 'weekly_year'));
CREATE UNIQUE INDEX IF NOT EXISTS learner_milestones_auto_key ON public.learner_milestones (student_id, auto_key) WHERE auto_key IS NOT NULL;

ALTER TABLE public.honor_entries ADD COLUMN IF NOT EXISTS photo_path TEXT CHECK (photo_path IS NULL OR char_length(photo_path) <= 200);
ALTER TABLE public.honor_entries ADD COLUMN IF NOT EXISTS photo_status TEXT CHECK (photo_status IS NULL OR photo_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.honor_entries ADD COLUMN IF NOT EXISTS photo_consent_at TIMESTAMPTZ;
ALTER TABLE public.honor_entries ADD COLUMN IF NOT EXISTS photo_consent_by UUID;

-- Photos: images only, 2 MB. No storage policies: the server hands out short signed links after its own checks.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('honor-photos', 'honor-photos', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
