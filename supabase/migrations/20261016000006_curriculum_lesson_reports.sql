-- ====================================================================
-- Migration: Curriculum lesson reports
-- File: supabase/migrations/20261016000006_curriculum_lesson_reports.sql
--
-- Purpose:
-- 1. After each class the teacher saves a report: subject, lesson, the
--    pages covered (from/to), what the learner is strong at, what to
--    reinforce, a short note and the game checkpoint result
--    (docs/curriculum/PLAN.md §4.1).
-- 2. The student's map and puzzle are built from these rows; covered
--    pages unlock for review in the student portal.
-- 3. Server-only table: the API reads and writes it with the service
--    role after checking teacher/student ownership. No anon or
--    authenticated access.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.curriculum_lesson_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL CHECK (subject ~ '^[a-z0-9-]{1,40}$'),
  lesson_number INTEGER NOT NULL CHECK (lesson_number BETWEEN 1 AND 500),
  from_page INTEGER NOT NULL CHECK (from_page >= 1),
  to_page INTEGER NOT NULL CHECK (to_page >= from_page AND to_page <= 200),
  strengths TEXT[] NOT NULL DEFAULT '{}',
  to_reinforce TEXT[] NOT NULL DEFAULT '{}',
  note TEXT CHECK (note IS NULL OR char_length(note) <= 2000),
  game_result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_curriculum_reports_student
  ON public.curriculum_lesson_reports(student_id, subject, lesson_number, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_curriculum_reports_teacher
  ON public.curriculum_lesson_reports(teacher_id, created_at DESC);

ALTER TABLE public.curriculum_lesson_reports ENABLE ROW LEVEL SECURITY;

-- No policies on purpose: only the service role (API) can read or write.
REVOKE ALL ON TABLE public.curriculum_lesson_reports FROM PUBLIC;
REVOKE ALL ON TABLE public.curriculum_lesson_reports FROM anon;
REVOKE ALL ON TABLE public.curriculum_lesson_reports FROM authenticated;
GRANT SELECT, INSERT ON TABLE public.curriculum_lesson_reports TO service_role;
