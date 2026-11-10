-- ====================================================================
-- Migration: Teacher public profiles and teacher change requests
-- File: supabase/migrations/20261110000000_teacher_profiles_and_change_requests.sql
--
-- Purpose (owner review 2026-11-10, docs/policies/TEACHER-CHANGE.md):
-- 1. teacher_accounts.public_profile: what families read in the "About this teacher" popup at onboarding and on the
--    About page (full introduction, studies, certificates and ijazahs, years of experience, teaching languages),
--    in Arabic and English. Edited by the teacher in Settings or by the super admin.
-- 2. teacher_change_requests: a learner/family asks to change teacher, or a teacher asks to hand a learner over;
--    only the super admin decides. The reason is never shown to the previous teacher.
-- 3. chat_threads.closed_at: after a move, the family's chat with the previous teacher becomes read-only.
-- ====================================================================

ALTER TABLE public.teacher_accounts
  ADD COLUMN IF NOT EXISTS public_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE public.chat_threads
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.teacher_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- The learner whose teacher changes (an adult learner's own row, or a child's row).
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  -- The family / learner account (auth user id) that holds the learner, for notices and credits.
  account_user_id uuid,
  from_teacher_id uuid,
  preferred_teacher_id uuid,
  -- The teacher the admin chose on approval.
  to_teacher_id uuid,
  initiator text NOT NULL CHECK (initiator IN ('family', 'teacher', 'admin')),
  initiator_user_id uuid,
  reason_type text NOT NULL CHECK (reason_type IN (
    'times', 'teacher_gender', 'level_subject', 'siblings', 'teacher_reasons', 'language',
    'fit', 'quality', 'learner_attendance', 'respect', 'safety', 'other'
  )),
  -- Admin-only: never sent to the previous teacher.
  note text,
  -- From a handing-over teacher to the next teacher (optional).
  handover_note text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'talk', 'waitlist', 'approved', 'declined', 'withdrawn')),
  -- Shown to the family when the request is declined or waitlisted.
  admin_message text,
  decided_by uuid,
  decided_at timestamptz,
  -- What the move did to booked lessons, for the audit trail.
  outcome jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);

-- One open request per learner at a time.
CREATE UNIQUE INDEX IF NOT EXISTS teacher_change_requests_one_open
  ON public.teacher_change_requests (student_id) WHERE status IN ('open', 'talk', 'waitlist');
CREATE INDEX IF NOT EXISTS teacher_change_requests_status_idx ON public.teacher_change_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS teacher_change_requests_from_idx ON public.teacher_change_requests (from_teacher_id);

-- Served only through the API with the service role, which checks who may see what.
ALTER TABLE public.teacher_change_requests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS teacher_change_requests_no_browser ON public.teacher_change_requests;
CREATE POLICY teacher_change_requests_no_browser ON public.teacher_change_requests FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
REVOKE ALL ON public.teacher_change_requests FROM anon, authenticated;
GRANT ALL ON public.teacher_change_requests TO service_role;
