-- ====================================================================
-- Migration: The Quran tab (classroom BUILD-LIST 4.2, 4.4, 4.5)
-- File: supabase/migrations/20261121000000_quran_tab.sql
--
-- Purpose:
-- 1. quran_marks: the words a teacher marked in a lesson's synced mushaf (4.2), one row per word per lesson, keyed by
--    learner, booking and surah:ayah:word. Types: wrong_word, missed, added, tajweed (a tajweed note). The learner reads
--    them only after the teacher sent that lesson's report (checked by the server). This is the Quran side of the one
--    mistake bank; a merged bank can read it by student_id.
-- 2. quran_detector_runs: the in-browser detector's word flags for a recording the learner sent to the teacher (4.4),
--    and the teacher's own marks on that recording (4.5). The super admin page compares the two; tajweed hints stay off
--    until 100 reviewed recordings agree 90% or more. recording_id is set null when the 30-day recording purge runs,
--    so the agreement history survives.
-- 3. Both are service-role only, like the other classroom tables: RLS on, no policies, no grants to anon/authenticated.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.quran_marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    teacher_id UUID,
    verse_key TEXT NOT NULL CHECK (verse_key ~ '^[0-9]{1,3}:[0-9]{1,3}$'),
    word_position SMALLINT NOT NULL CHECK (word_position BETWEEN 1 AND 200),
    type TEXT NOT NULL CHECK (type IN ('wrong_word', 'missed', 'added', 'tajweed')),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 300),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (booking_id, verse_key, word_position)
);

CREATE INDEX IF NOT EXISTS quran_marks_student_idx ON public.quran_marks (student_id, created_at DESC);

ALTER TABLE public.quran_marks ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.quran_marks FROM anon, authenticated;
GRANT ALL ON TABLE public.quran_marks TO service_role;

CREATE TABLE IF NOT EXISTS public.quran_detector_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    recording_id UUID UNIQUE REFERENCES public.recitation_recordings(id) ON DELETE SET NULL,
    surah SMALLINT NOT NULL CHECK (surah BETWEEN 1 AND 114),
    ayah_from SMALLINT NOT NULL CHECK (ayah_from >= 1),
    ayah_to SMALLINT NOT NULL CHECK (ayah_to >= ayah_from),
    model TEXT NOT NULL CHECK (char_length(model) <= 200),
    flags JSONB NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(flags) = 'array' AND octet_length(flags::text) <= 32768),
    teacher_marks JSONB CHECK (teacher_marks IS NULL OR (jsonb_typeof(teacher_marks) = 'array' AND octet_length(teacher_marks::text) <= 32768)),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS quran_detector_runs_reviewed_idx ON public.quran_detector_runs (reviewed_at DESC);

ALTER TABLE public.quran_detector_runs ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.quran_detector_runs FROM anon, authenticated;
GRANT ALL ON TABLE public.quran_detector_runs TO service_role;
