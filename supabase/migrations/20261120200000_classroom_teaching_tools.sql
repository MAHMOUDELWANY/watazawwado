-- ====================================================================
-- Migration: Classroom teaching tools
-- File: supabase/migrations/20261120200000_classroom_teaching_tools.sql
--
-- Purpose:
-- 1. Allow the teaching and practice tool events in lesson_timeline_events (classroom BUILD-LIST 2.10, 2.11):
--    correction (said X -> correct Y), check and check_answer (understanding check per lesson part), stage
--    (review, lesson, practice, close), media (shared audio file or YouTube video), practice (tashkeel, blanks,
--    unscramble, question wheel, word matching, role-play) and shadow (the teacher's recorded line). practice_answer
--    stays live only and is never stored.
-- 2. learner_mistakes: one mistake bank per learner. Every correction the teacher logs in the room is saved here; the
--    daily review (NX-01), the homework writer (NX-02) and the room's warm-up read the open ones. Server only
--    (service_role), like review_cards: the server checks the family and the teacher.
-- 3. The classroom-files bucket also takes audio (mp3, m4a, ogg, webm, wav): files played in the room and the
--    shadowing lines. The server still checks each file's first bytes before handing out a link.
-- ====================================================================

ALTER TABLE public.lesson_timeline_events DROP CONSTRAINT IF EXISTS lesson_timeline_events_type_check;
ALTER TABLE public.lesson_timeline_events ADD CONSTRAINT lesson_timeline_events_type_check CHECK (type IN (
    'slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'talk', 'end',
    'correction', 'check', 'check_answer', 'stage', 'media', 'practice', 'shadow'
));

CREATE TABLE IF NOT EXISTS public.learner_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    -- The correction's id inside the room, so a retried save is not stored twice.
    client_id TEXT NOT NULL CHECK (char_length(client_id) BETWEEN 1 AND 40),
    said TEXT NOT NULL CHECK (char_length(said) BETWEEN 1 AND 300),
    correct TEXT NOT NULL CHECK (char_length(correct) BETWEEN 1 AND 300),
    note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
    subject TEXT CHECK (subject IS NULL OR char_length(subject) <= 120),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (booking_id, client_id)
);

CREATE INDEX IF NOT EXISTS learner_mistakes_open_idx ON public.learner_mistakes (student_id, created_at DESC) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS learner_mistakes_teacher_idx ON public.learner_mistakes (teacher_id);

ALTER TABLE public.learner_mistakes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages learner mistakes" ON public.learner_mistakes;
CREATE POLICY "Service role manages learner mistakes"
    ON public.learner_mistakes FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.learner_mistakes FROM anon, authenticated;

UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
    'application/pdf', 'image/png', 'image/jpeg',
    'audio/mpeg', 'audio/mp4', 'audio/ogg', 'audio/webm', 'audio/wav'
]
WHERE id = 'classroom-files';
