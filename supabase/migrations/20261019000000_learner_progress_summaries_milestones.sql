-- ====================================================================
-- Migration: Learner progress summaries and milestones (PR-01)
-- File: supabase/migrations/20261019000000_learner_progress_summaries_milestones.sql
--
-- Purpose:
-- 1. Add nullable family_summary (text) and achievements (jsonb) to
--    public.lesson_notes so teachers can share what was covered with
--    the family while keeping private_notes strictly teacher-only.
-- 2. Scope lesson_notes RLS so a teacher can only read or write notes
--    for their own assigned students (super_admin retains full access,
--    and students/guardians have zero direct table access so
--    private_notes never reaches a family).
-- 3. Create public.learner_milestones for tracking learner milestones
--    per subject (surah_memorized, juz_completed, level_completed,
--    rule_mastered, book_completed, custom).
-- 4. Enforce strict RLS on public.learner_milestones:
--    - Student or guardian of that student can read (SELECT).
--    - Assigned teacher and super admin can read, insert and update.
--    - Nobody can delete except super admin.
-- ====================================================================

-- 1. Additive columns on public.lesson_notes for family-safe summaries
ALTER TABLE public.lesson_notes
  ADD COLUMN IF NOT EXISTS family_summary TEXT
    CHECK (family_summary IS NULL OR char_length(family_summary) <= 4000),
  ADD COLUMN IF NOT EXISTS achievements JSONB;

-- 2. Scope lesson_notes RLS to assigned teacher + super_admin only
--    (Students and guardians never get direct SELECT on lesson_notes because
--    private_notes lives on the same row; family_summary is served via the API.)
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher full access to lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Teacher allowlist access to lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Active teachers manage lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Super admin manages lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Assigned teachers manage lesson_notes" ON public.lesson_notes;

CREATE POLICY "Super admin manages lesson_notes" ON public.lesson_notes
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "Assigned teachers manage lesson_notes" ON public.lesson_notes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = lesson_notes.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = lesson_notes.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  );

-- 3. Create public.learner_milestones
CREATE TABLE IF NOT EXISTS public.learner_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  subject TEXT NOT NULL CHECK (subject ~ '^[a-z0-9-]{1,60}$'),
  kind TEXT NOT NULL CHECK (
    kind IN (
      'surah_memorized',
      'juz_completed',
      'level_completed',
      'rule_mastered',
      'book_completed',
      'custom'
    )
  ),
  title_ar TEXT NOT NULL CHECK (char_length(trim(title_ar)) BETWEEN 1 AND 300),
  title_en TEXT NOT NULL CHECK (char_length(trim(title_en)) BETWEEN 1 AND 300),
  reached_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lesson_session_id UUID REFERENCES public.lesson_sessions(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_learner_milestones_student_reached
  ON public.learner_milestones(student_id, reached_at DESC);

CREATE INDEX IF NOT EXISTS idx_learner_milestones_student_subject
  ON public.learner_milestones(student_id, subject);

-- 4. RLS on public.learner_milestones
ALTER TABLE public.learner_milestones ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.learner_milestones FROM PUBLIC;
REVOKE ALL ON TABLE public.learner_milestones FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.learner_milestones TO authenticated;
GRANT ALL ON TABLE public.learner_milestones TO service_role;

-- 4a. Student or guardian of that student can read (SELECT only)
DROP POLICY IF EXISTS "Students and guardians read own learner_milestones" ON public.learner_milestones;
CREATE POLICY "Students and guardians read own learner_milestones"
  ON public.learner_milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      WHERE s.id = learner_milestones.student_id
        AND s.auth_user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.guardians g
      WHERE g.student_id = learner_milestones.student_id
        AND lower(trim(g.parent_email)) = lower(trim(auth.jwt() ->> 'email'))
    )
  );

-- 4b. Assigned teacher can read, insert, and update (never delete)
DROP POLICY IF EXISTS "Assigned teachers read learner_milestones" ON public.learner_milestones;
CREATE POLICY "Assigned teachers read learner_milestones"
  ON public.learner_milestones
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = learner_milestones.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  );

DROP POLICY IF EXISTS "Assigned teachers insert learner_milestones" ON public.learner_milestones;
CREATE POLICY "Assigned teachers insert learner_milestones"
  ON public.learner_milestones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = learner_milestones.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  );

DROP POLICY IF EXISTS "Assigned teachers update learner_milestones" ON public.learner_milestones;
CREATE POLICY "Assigned teachers update learner_milestones"
  ON public.learner_milestones
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = learner_milestones.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.students s
      JOIN public.teacher_accounts ta
        ON lower(trim(ta.email)) = lower(trim(auth.jwt() ->> 'email'))
      WHERE s.id = learner_milestones.student_id
        AND s.assigned_teacher_id = auth.uid()
        AND ta.role = 'teacher'
        AND ta.is_active = true
    )
  );

-- 4c. Super admin has full access (SELECT, INSERT, UPDATE, and the only role allowed to DELETE)
DROP POLICY IF EXISTS "Super admin manages learner_milestones" ON public.learner_milestones;
CREATE POLICY "Super admin manages learner_milestones"
  ON public.learner_milestones
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());
