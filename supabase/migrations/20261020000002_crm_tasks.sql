-- ====================================================================
-- Migration: CRM follow-up tasks (CRM-04)
-- File: supabase/migrations/20261020000002_crm_tasks.sql
--
-- Purpose:
-- 1. crm_tasks: the super admin's follow-ups per family with a due date. Created by hand or automatically
--    (one after every attended free trial). dedupe_key makes automatic tasks one per event.
-- Server-only (service_role) behind requireSuperAdmin.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.crm_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 300),
    due_at TIMESTAMPTZ NOT NULL,
    done_at TIMESTAMPTZ,
    created_by UUID,
    source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'trial_followup', 'quiet_learner', 'low_balance')),
    dedupe_key TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_crm_tasks_open_due ON public.crm_tasks(due_at) WHERE done_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_crm_tasks_account ON public.crm_tasks(account_student_id);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages crm tasks"
    ON public.crm_tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
