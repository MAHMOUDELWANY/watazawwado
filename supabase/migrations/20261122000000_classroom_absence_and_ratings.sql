-- ====================================================================
-- Migration: Missed-lesson appeals, teacher ratings, platform ratings
-- File: supabase/migrations/20261122000000_classroom_absence_and_ratings.sql
--
-- Purpose:
-- 1. lesson_absence_cases: a room lesson nobody came to is recorded as "teacher absent", provisionally. The teacher
--    confirms or appeals (reason 10+ characters) within 48 hours; no answer makes it final. An appeal goes to the
--    super admin, who accepts it (and picks the right outcome) or rejects it. The booking changes only when the case
--    becomes final, through the existing functions (record_lesson_not_held, teacher_record_lesson_outcome), so pay
--    and credits follow the existing rules and nothing has to be reversed.
-- 2. teacher_ratings: the family's questionnaire about a teacher (1-5 on four questions + optional note) after the
--    learner's 4th completed lesson with that teacher, then every 8 lessons. A row with no scores is a "later today"
--    snooze (allowed once per milestone).
-- 3. platform_ratings: the short survey (0-10 recommend, what you like, what to improve) after a curriculum part or a
--    whole track; one row per learner and milestone, answered or dismissed.
-- All three are service-role only, like the other classroom tables: RLS on, no policies for browser roles.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_absence_cases (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    teacher_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'appealed', 'final')),
    resolution TEXT CHECK (resolution IS NULL OR resolution IN ('confirmed', 'expired', 'appeal_accepted', 'appeal_rejected')),
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('teacher_absent', 'learner_no_show', 'completed', 'no_fault')),
    appeal_reason TEXT CHECK (appeal_reason IS NULL OR char_length(appeal_reason) BETWEEN 10 AND 2000),
    admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 400),
    deadline_at TIMESTAMPTZ NOT NULL,
    appealed_at TIMESTAMPTZ,
    decided_by UUID,
    decided_at TIMESTAMPTZ,
    applied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);
CREATE INDEX IF NOT EXISTS lesson_absence_cases_open_idx ON public.lesson_absence_cases (status, deadline_at);
CREATE INDEX IF NOT EXISTS lesson_absence_cases_teacher_idx ON public.lesson_absence_cases (teacher_user_id, status);

ALTER TABLE public.lesson_absence_cases ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_absence_cases FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_absence_cases TO service_role;

CREATE TABLE IF NOT EXISTS public.teacher_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_count INTEGER NOT NULL CHECK (lesson_count BETWEEN 1 AND 10000),
    explains SMALLINT CHECK (explains IS NULL OR explains BETWEEN 1 AND 5),
    patient SMALLINT CHECK (patient IS NULL OR patient BETWEEN 1 AND 5),
    on_time SMALLINT CHECK (on_time IS NULL OR on_time BETWEEN 1 AND 5),
    enjoys SMALLINT CHECK (enjoys IS NULL OR enjoys BETWEEN 1 AND 5),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 1000),
    snoozed_until TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (student_id, teacher_id, lesson_count),
    CHECK (
        (explains IS NOT NULL AND patient IS NOT NULL AND on_time IS NOT NULL AND enjoys IS NOT NULL AND submitted_at IS NOT NULL)
        OR (explains IS NULL AND patient IS NULL AND on_time IS NULL AND enjoys IS NULL AND submitted_at IS NULL AND snoozed_until IS NOT NULL)
    )
);
CREATE INDEX IF NOT EXISTS teacher_ratings_teacher_idx ON public.teacher_ratings (teacher_id, submitted_at);

ALTER TABLE public.teacher_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.teacher_ratings FROM anon, authenticated;
GRANT ALL ON TABLE public.teacher_ratings TO service_role;

CREATE TABLE IF NOT EXISTS public.platform_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    milestone TEXT NOT NULL CHECK (milestone ~ '^(part:[a-z0-9-]{1,40}:[0-9]{1,3}|track:[a-z0-9-]{1,40})$'),
    recommend SMALLINT CHECK (recommend IS NULL OR recommend BETWEEN 0 AND 10),
    liked TEXT CHECK (liked IS NULL OR char_length(liked) <= 1000),
    improve TEXT CHECK (improve IS NULL OR char_length(improve) <= 1000),
    dismissed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (student_id, milestone)
);
CREATE INDEX IF NOT EXISTS platform_ratings_created_idx ON public.platform_ratings (created_at DESC);

ALTER TABLE public.platform_ratings ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.platform_ratings FROM anon, authenticated;
GRANT ALL ON TABLE public.platform_ratings TO service_role;
