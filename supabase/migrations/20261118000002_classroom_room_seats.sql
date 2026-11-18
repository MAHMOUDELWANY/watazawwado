-- ====================================================================
-- Migration: Classroom seats and the enforced end
-- File: supabase/migrations/20261118000002_classroom_room_seats.sql
--
-- Purpose:
-- 1. lesson_room_seats: one row per seat (teacher, learner, each observer) holding its newest join and media
--    session. Single-row writes replace the read-modify-write of lesson_room_state.snapshot.sessions, where two
--    overlapping requests could lose a seat or a session id (classroom review H1). Service-role only, like the
--    other room tables.
-- 2. lesson_room_state.ended_at: when the teacher ended the lesson. From then the server refuses entry, media,
--    events, files and heartbeats (review H3, L4, M1).
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.lesson_room_seats (
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    seat TEXT NOT NULL CHECK (char_length(seat) <= 200),
    join_id UUID NOT NULL,
    user_id TEXT NOT NULL CHECK (char_length(user_id) <= 200),
    session_id TEXT CHECK (session_id IS NULL OR char_length(session_id) <= 200),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (booking_id, seat)
);

ALTER TABLE public.lesson_room_seats ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_room_seats FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_room_seats TO service_role;

ALTER TABLE public.lesson_room_state ADD COLUMN IF NOT EXISTS ended_at TIMESTAMPTZ;
