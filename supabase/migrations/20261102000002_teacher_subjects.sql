-- ====================================================================
-- Migration: Watazawwado University, teacher subject licences and training (NX-15)
-- File: supabase/migrations/20261102000002_teacher_subjects.sql
--
-- Purpose:
-- 1. teacher_subjects: one row per teacher and subject. status 'licensed' means the teacher may teach it (the server
--    checks this on booking, on assigning a student and on moving a lesson); 'training' is the track towards it
--    (curriculum and guide ticked by the teacher, test and observed lesson recorded by the super admin).
-- 2. Every existing teacher keeps teaching what they teach today: all current teacher accounts are licensed for the
--    eight bookable subjects. The super admin then trims or grants per teacher.
-- 3. Server only (service_role).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.teacher_subjects (
    teacher_email TEXT NOT NULL REFERENCES public.teacher_accounts(email) ON DELETE CASCADE ON UPDATE CASCADE,
    subject TEXT NOT NULL CHECK (subject IN ('quran-reading', 'tajweed', 'quran-memorization', 'zad-essentials', 'seerah',
        'modern-standard-arabic', 'egyptian-arabic', 'english')),
    status TEXT NOT NULL DEFAULT 'training' CHECK (status IN ('training', 'licensed')),
    curriculum_done_at TIMESTAMPTZ,
    guide_done_at TIMESTAMPTZ,
    test_score SMALLINT CHECK (test_score IS NULL OR test_score BETWEEN 0 AND 100),
    test_passed_at TIMESTAMPTZ,
    observed_passed_at TIMESTAMPTZ,
    note TEXT CHECK (note IS NULL OR char_length(note) <= 1000),
    licensed_at TIMESTAMPTZ,
    licensed_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (teacher_email, subject)
);

CREATE INDEX IF NOT EXISTS teacher_subjects_subject_idx ON public.teacher_subjects (subject, status);

ALTER TABLE public.teacher_subjects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages teacher subjects" ON public.teacher_subjects;
CREATE POLICY "Service role manages teacher subjects"
    ON public.teacher_subjects FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.teacher_subjects FROM anon, authenticated;

-- Existing teachers keep every subject they could teach until now.
INSERT INTO public.teacher_subjects (teacher_email, subject, status, licensed_at, licensed_by, note)
SELECT t.email, s.subject, 'licensed', timezone('utc'::text, now()), 'migration', 'Teacher before Watazawwado University (2026-11-02)'
FROM public.teacher_accounts t
CROSS JOIN (VALUES ('quran-reading'), ('tajweed'), ('quran-memorization'), ('zad-essentials'), ('seerah'),
    ('modern-standard-arabic'), ('egyptian-arabic'), ('english')) AS s(subject)
ON CONFLICT (teacher_email, subject) DO NOTHING;
