-- ====================================================================
-- Migration: Classroom release 1
-- File: supabase/migrations/20261117000000_classroom_release_1.sql
--
-- Purpose:
-- 1. Widen lesson_attendance_events so our own lesson room can record attendance: source 'room', events
--    'room_joined' / 'room_left' / 'room_ended', and role 'observer' (guardian or super admin watching).
-- 2. New tables for the room: last restorable state, lesson timeline, connection quality per side, teacher late
--    reasons, room incidents (for the Zoom fallback), and super admin observation visits.
-- 3. All new tables are service-role only: RLS on with no policies, and no grants to anon or authenticated.
-- ====================================================================

-- 1. Attendance checks (inline constraints from 20261106000001 got Postgres' default names).
ALTER TABLE public.lesson_attendance_events DROP CONSTRAINT IF EXISTS lesson_attendance_events_source_check;
ALTER TABLE public.lesson_attendance_events ADD CONSTRAINT lesson_attendance_events_source_check CHECK (source IN ('site', 'zoom', 'room'));

ALTER TABLE public.lesson_attendance_events DROP CONSTRAINT IF EXISTS lesson_attendance_events_event_check;
ALTER TABLE public.lesson_attendance_events ADD CONSTRAINT lesson_attendance_events_event_check CHECK (event IN (
    'link_opened', 'meeting_started', 'meeting_ended', 'joined', 'left', 'waiting_room_joined',
    'room_joined', 'room_left', 'room_ended'
));

ALTER TABLE public.lesson_attendance_events DROP CONSTRAINT IF EXISTS lesson_attendance_events_role_check;
ALTER TABLE public.lesson_attendance_events ADD CONSTRAINT lesson_attendance_events_role_check CHECK (role IN ('teacher', 'student', 'unknown', 'observer'));

-- 2. Last restorable room state (slide, board, timer) for rejoin.
CREATE TABLE IF NOT EXISTS public.lesson_room_state (
    booking_id UUID PRIMARY KEY REFERENCES public.bookings(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.lesson_room_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_room_state FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_room_state TO service_role;

-- 3. Lesson timeline.
CREATE TABLE IF NOT EXISTS public.lesson_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('slide', 'board', 'pdf', 'reaction', 'focus', 'quality', 'layout', 'end')),
    actor_role TEXT NOT NULL CHECK (actor_role IN ('teacher', 'student', 'observer', 'system')),
    payload JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(payload::text) <= 16384),
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS lesson_timeline_events_booking_idx ON public.lesson_timeline_events (booking_id, occurred_at);

ALTER TABLE public.lesson_timeline_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_timeline_events FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_timeline_events TO service_role;

-- 4. Connection quality, one row per side per lesson.
CREATE TABLE IF NOT EXISTS public.lesson_quality (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    side TEXT NOT NULL CHECK (side IN ('teacher', 'student')),
    precheck_720 BOOLEAN,
    start_height INT,
    min_height INT,
    degraded_seconds INT NOT NULL DEFAULT 0 CHECK (degraded_seconds >= 0),
    audio_only_seconds INT NOT NULL DEFAULT 0 CHECK (audio_only_seconds >= 0),
    reconnects INT NOT NULL DEFAULT 0 CHECK (reconnects >= 0),
    focus_away_seconds INT NOT NULL DEFAULT 0 CHECK (focus_away_seconds >= 0),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    UNIQUE (booking_id, side)
);

ALTER TABLE public.lesson_quality ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.lesson_quality FROM anon, authenticated;
GRANT ALL ON TABLE public.lesson_quality TO service_role;

-- 5. Teacher late reasons (reason stays null until the teacher sends it).
CREATE TABLE IF NOT EXISTS public.teacher_late_reasons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
    teacher_user_id UUID NOT NULL,
    late_minutes INT NOT NULL CHECK (late_minutes >= 0),
    reason TEXT CHECK (reason IS NULL OR char_length(reason) BETWEEN 10 AND 2000),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'excused', 'deducted')),
    admin_note TEXT CHECK (admin_note IS NULL OR char_length(admin_note) <= 2000),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS teacher_late_reasons_teacher_idx ON public.teacher_late_reasons (teacher_user_id, created_at);

ALTER TABLE public.teacher_late_reasons ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.teacher_late_reasons FROM anon, authenticated;
GRANT ALL ON TABLE public.teacher_late_reasons TO service_role;

-- 6. Room incidents on our side (drive the Zoom fallback and excuse lateness).
CREATE TABLE IF NOT EXISTS public.classroom_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    kind TEXT NOT NULL CHECK (kind IN ('connect_timeout', 'ice_failed', 'engine_error', 'provider_error')),
    side TEXT NOT NULL CHECK (side IN ('teacher', 'student')),
    detail JSONB NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(detail::text) <= 16384),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS classroom_incidents_booking_idx ON public.classroom_incidents (booking_id, created_at);

ALTER TABLE public.classroom_incidents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.classroom_incidents FROM anon, authenticated;
GRANT ALL ON TABLE public.classroom_incidents TO service_role;

-- 7. Super admin observation visits (each visit is logged).
CREATE TABLE IF NOT EXISTS public.admin_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
    admin_user_id UUID NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 4000)
);

CREATE INDEX IF NOT EXISTS admin_observations_booking_idx ON public.admin_observations (booking_id, started_at);

ALTER TABLE public.admin_observations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_observations FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_observations TO service_role;
