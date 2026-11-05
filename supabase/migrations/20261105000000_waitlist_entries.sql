-- ====================================================================
-- Migration: Waitlist entries ("Pack your zaad")
-- File: supabase/migrations/20261105000000_waitlist_entries.sql
--
-- Purpose:
-- 1. Store the "Pack your zaad" waitlist: one row per email with the chosen track, who it is for, an honest
--    place in line (by created_at), the optional "what was missing before" answers, and the invitation state.
-- 2. Server-only table: RLS on with no policies, so only the service role reads or writes it.
-- See docs/superpowers/specs/2026-11-05-pack-your-zaad-waitlist-design.md and RULES.md §2 "Launch in waves".
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL CHECK (email = lower(email) AND length(email) BETWEEN 3 AND 254),
    track TEXT NOT NULL CHECK (track IN ('quran', 'zad', 'arabic', 'english')),
    who TEXT NOT NULL CHECK (who IN ('me', 'child')),
    lang TEXT NOT NULL DEFAULT 'en' CHECK (lang IN ('en', 'ar')),
    source TEXT CHECK (source IS NULL OR length(source) <= 80),
    pains TEXT[] NOT NULL DEFAULT '{}',
    note TEXT CHECK (note IS NULL OR length(note) <= 500),
    wave INTEGER NOT NULL DEFAULT 1 CHECK (wave >= 1),
    secret TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE UNIQUE INDEX IF NOT EXISTS waitlist_entries_email_key ON public.waitlist_entries (email);
CREATE INDEX IF NOT EXISTS waitlist_entries_created_at_idx ON public.waitlist_entries (created_at);

ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: anon and authenticated have no access; the API uses the service role.
REVOKE ALL ON public.waitlist_entries FROM anon;
REVOKE ALL ON public.waitlist_entries FROM authenticated;
