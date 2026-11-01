-- ====================================================================
-- Migration: Real reviews from families (NX-05, owner 2026-11-01)
-- File: supabase/migrations/20261101000006_family_reviews.sql
--
-- Purpose:
-- 1. review_invites: a one-time link the admin creates and sends to someone to write a review.
-- 2. family_reviews: reviews written through an invite link, or from a family account with an attended lesson
--    ("studied with us"). The admin publishes them; declining is only for spam, abuse or personal data
--    (docs/marketing/RULES.md §3.6: never hide or cherry-pick bad reviews, never reward a review).
-- 3. review_proofs: screenshots of messages from families, shared with their consent, shown once published.
-- 4. A private Storage bucket "review-proofs" (images, 3 MB max); the server hands out short signed links.
-- All tables are server only (service_role), like lesson_homework.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.review_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT NOT NULL UNIQUE CHECK (char_length(token) >= 32),
    label TEXT CHECK (label IS NULL OR char_length(label) <= 80),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.family_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL CHECK (source IN ('invite', 'portal')),
    invite_id UUID UNIQUE REFERENCES public.review_invites(id) ON DELETE SET NULL,
    account_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verified BOOLEAN NOT NULL DEFAULT false,
    rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    body TEXT NOT NULL CHECK (char_length(btrim(body)) BETWEEN 10 AND 1200),
    lang TEXT NOT NULL CHECK (lang IN ('ar', 'en')),
    display_name TEXT NOT NULL CHECK (char_length(btrim(display_name)) BETWEEN 1 AND 40),
    reviewer_role TEXT NOT NULL CHECK (reviewer_role IN ('parent', 'adult_learner')),
    country TEXT CHECK (country IS NULL OR char_length(country) <= 40),
    consent BOOLEAN NOT NULL CHECK (consent),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'declined')),
    decline_reason TEXT CHECK (decline_reason IS NULL OR decline_reason IN ('spam', 'abuse', 'personal_data', 'not_ours')),
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- One portal review per account (it can be edited later by the admin flow, not duplicated).
CREATE UNIQUE INDEX IF NOT EXISTS family_reviews_one_per_account ON public.family_reviews (account_user_id) WHERE source = 'portal';
CREATE INDEX IF NOT EXISTS family_reviews_published_idx ON public.family_reviews (status, created_at DESC);

CREATE TABLE IF NOT EXISTS public.review_proofs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    storage_path TEXT NOT NULL UNIQUE,
    caption_en TEXT CHECK (caption_en IS NULL OR char_length(caption_en) <= 160),
    caption_ar TEXT CHECK (caption_ar IS NULL OR char_length(caption_ar) <= 160),
    consent_note TEXT NOT NULL CHECK (char_length(btrim(consent_note)) BETWEEN 3 AND 200),
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.review_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_proofs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages review invites" ON public.review_invites;
CREATE POLICY "Service role manages review invites" ON public.review_invites FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role manages family reviews" ON public.family_reviews;
CREATE POLICY "Service role manages family reviews" ON public.family_reviews FOR ALL TO service_role USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Service role manages review proofs" ON public.review_proofs;
CREATE POLICY "Service role manages review proofs" ON public.review_proofs FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.review_invites FROM anon, authenticated;
REVOKE ALL ON public.family_reviews FROM anon, authenticated;
REVOKE ALL ON public.review_proofs FROM anon, authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('review-proofs', 'review-proofs', false, 3145728, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;
