-- ====================================================================
-- Migration: Community layer: Hall of Honor entries and class board members
-- File: supabase/migrations/20261029000000_community_honor_class_board.sql
--
-- Purpose (plan: docs/superpowers/plans/2026-10-29-community-honor.md, design approved 2026-10-20):
-- 1. honor_entries: a teacher-recorded milestone the admin put forward for the Hall of Honor, and the family's
--    decision. Nothing is public until the guardian (for a child) or the adult learner agrees, or the admin
--    records a consent the family gave elsewhere (with a note). The family can withdraw at any time.
-- 2. class_board_members: learners whose family chose to show them on their teacher's effort-based class board.
-- Both tables are service-role only (RLS on, no policies): the API decides who may read or write, and the public
-- Hall of Honor endpoint returns only published rows with the chosen display name.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.honor_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID NOT NULL UNIQUE REFERENCES public.learner_milestones(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'awaiting_consent' CHECK (
        status IN ('awaiting_consent', 'published', 'declined', 'withdrawn', 'removed')
    ),
    display_name TEXT CHECK (display_name IS NULL OR char_length(trim(display_name)) BETWEEN 1 AND 40),
    consent_kind TEXT CHECK (consent_kind IS NULL OR consent_kind IN ('guardian', 'learner', 'admin_recorded')),
    consent_note TEXT CHECK (consent_note IS NULL OR char_length(consent_note) <= 500),
    decided_by UUID,
    decided_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    nominated_by UUID,
    nominated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CHECK (status <> 'published' OR (display_name IS NOT NULL AND consent_kind IS NOT NULL AND published_at IS NOT NULL)),
    CHECK (consent_kind IS DISTINCT FROM 'admin_recorded' OR char_length(trim(coalesce(consent_note, ''))) >= 3)
);
CREATE INDEX IF NOT EXISTS honor_entries_student_idx ON public.honor_entries (student_id);
CREATE INDEX IF NOT EXISTS honor_entries_published_idx ON public.honor_entries (published_at DESC) WHERE status = 'published';
ALTER TABLE public.honor_entries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.class_board_members (
    student_id UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
    display_name TEXT NOT NULL CHECK (char_length(trim(display_name)) BETWEEN 1 AND 40),
    consent_kind TEXT NOT NULL CHECK (consent_kind IN ('guardian', 'learner')),
    consented_by UUID,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
ALTER TABLE public.class_board_members ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.honor_entries FROM PUBLIC, anon, authenticated;
REVOKE ALL ON TABLE public.class_board_members FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.honor_entries TO service_role;
GRANT ALL ON TABLE public.class_board_members TO service_role;
