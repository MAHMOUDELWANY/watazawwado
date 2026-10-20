-- ====================================================================
-- Migration: CRM notes and tags per family (CRM-03)
-- File: supabase/migrations/20261020000001_crm_notes_tags.sql
--
-- Purpose:
-- 1. crm_notes: the super admin's private notes about a family (account student) and optionally one child.
-- 2. crm_tags: short labels per family ("sibling likely", "prefers female teacher", ...).
-- Both are read and written only by the server (service_role) behind requireSuperAdmin; families and teachers
-- never see them.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    child_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,
    body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 4000),
    author_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_crm_notes_account ON public.crm_notes(account_student_id, created_at DESC);

ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages crm notes"
    ON public.crm_notes FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.crm_tags (
    account_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    tag TEXT NOT NULL CHECK (char_length(tag) BETWEEN 1 AND 60),
    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (account_student_id, tag)
);

ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages crm tags"
    ON public.crm_tags FOR ALL TO service_role USING (true) WITH CHECK (true);
