-- ====================================================================
-- Migration: Learner age, on-site inbox, chat and placement tests
-- File: supabase/migrations/20261016000000_age_inbox_chat_placement.sql
--
-- Purpose:
-- 1. students.age: onboarding asks for the learner's exact age (self or each child).
-- 2. user_notifications: on-site messages for any account (refunds, admin requests, test results).
-- 3. chat_threads / chat_messages: text-only chat. 'support' = an account with the super admin
--    (pinned for everyone); 'lesson' = a student account with their teacher (admin can read).
-- 4. placement_tests: AI-generated placement test per learner, reviewed by the super admin.
-- All tables are server-only (the API uses the service role); RLS is on with no client policies.
-- ====================================================================

ALTER TABLE public.students ADD COLUMN IF NOT EXISTS age smallint;
ALTER TABLE public.students DROP CONSTRAINT IF EXISTS students_age_range;
ALTER TABLE public.students ADD CONSTRAINT students_age_range CHECK (age IS NULL OR (age BETWEEN 3 AND 100));

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_user_id uuid NOT NULL,
  kind text NOT NULL,
  title_en text NOT NULL,
  title_ar text NOT NULL,
  body_en text,
  body_ar text,
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS user_notifications_recipient_idx ON public.user_notifications (recipient_user_id, created_at DESC);
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('support', 'lesson')),
  -- The non-admin side: a student/parent account or a teacher account (auth user id).
  owner_user_id uuid NOT NULL,
  owner_role text NOT NULL CHECK (owner_role IN ('student', 'teacher')),
  -- For 'lesson' threads: the teacher (teacher_accounts.id).
  teacher_id uuid,
  owner_last_read_at timestamptz,
  staff_last_read_at timestamptz,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE UNIQUE INDEX IF NOT EXISTS chat_threads_support_unique ON public.chat_threads (owner_user_id) WHERE kind = 'support';
CREATE UNIQUE INDEX IF NOT EXISTS chat_threads_lesson_unique ON public.chat_threads (owner_user_id, teacher_id) WHERE kind = 'lesson';
CREATE INDEX IF NOT EXISTS chat_threads_teacher_idx ON public.chat_threads (teacher_id) WHERE kind = 'lesson';
ALTER TABLE public.chat_threads ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.chat_threads(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('student', 'teacher', 'admin')),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS chat_messages_thread_idx ON public.chat_messages (thread_id, created_at);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.placement_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL,
  learner_student_id uuid REFERENCES public.students(id) ON DELETE CASCADE,
  learner_name text,
  service_id text NOT NULL,
  stated_level text,
  language text NOT NULL DEFAULT 'en',
  -- Questions include the correct answers; the API never sends those to the browser.
  questions jsonb NOT NULL,
  answers jsonb,
  score smallint,
  max_score smallint,
  ai_summary text,
  suggested_level text,
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'reviewed')),
  admin_reply text,
  admin_level text,
  reviewed_by uuid,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS placement_tests_user_idx ON public.placement_tests (auth_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS placement_tests_status_idx ON public.placement_tests (status, submitted_at DESC);
ALTER TABLE public.placement_tests ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_notifications, public.chat_threads, public.chat_messages, public.placement_tests FROM anon, authenticated;
GRANT ALL ON public.user_notifications, public.chat_threads, public.chat_messages, public.placement_tests TO service_role;
