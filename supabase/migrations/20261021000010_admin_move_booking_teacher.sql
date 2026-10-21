-- ====================================================================
-- Migration: Super admin moves a booked lesson to another teacher (AD-02b)
-- File: supabase/migrations/20261021000010_admin_move_booking_teacher.sql
--
-- Purpose:
-- 1. booking_teacher_moves: one row each time the super admin moves an upcoming lesson to another teacher
--    (RULES.md §1: booked lessons stay with their teacher until the admin moves or cancels them), with the
--    reason and what happened to the old teacher's calendar event. Server only (service_role).
-- 2. admin_move_booking_teacher(): the move itself, in one transaction. It locks the lesson, accepts only
--    upcoming pending/confirmed/rescheduled lessons, changes teacher_id and nothing else about the lesson:
--    same time, same price, same payment, same Zoom meeting (one academy Zoom account; the lesson's teacher
--    starts it as host). The per-teacher exclusion constraint (bookings_no_overlap_excl) refuses a new teacher
--    who already has a lesson at that time. For a lesson whose calendar was already synced (confirmed or
--    rescheduled) it clears the old Google event id and queues the usual booking_sync job, which creates the
--    event on the new teacher's calendar. A pending (unpaid) lesson gets no job: it is synced when its payment
--    is verified, as before, now under the new teacher.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.booking_teacher_moves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES public.bookings(id) ON DELETE CASCADE,
    from_teacher_id UUID,
    to_teacher_id UUID NOT NULL,
    moved_by UUID,
    reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 3 AND 500),
    old_google_event_id TEXT,
    -- none: there was no old event; done: removed from the old teacher's calendar; failed: left there, admin told.
    calendar_cleanup TEXT NOT NULL DEFAULT 'pending' CHECK (calendar_cleanup IN ('pending', 'none', 'done', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS booking_teacher_moves_booking_idx ON public.booking_teacher_moves (booking_id, created_at DESC);

ALTER TABLE public.booking_teacher_moves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role manages booking teacher moves" ON public.booking_teacher_moves;
CREATE POLICY "Service role manages booking teacher moves"
    ON public.booking_teacher_moves FOR ALL TO service_role USING (true) WITH CHECK (true);

REVOKE ALL ON public.booking_teacher_moves FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.admin_move_booking_teacher(
    p_booking_id UUID,
    p_new_teacher_id UUID,
    p_reason TEXT,
    p_moved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking RECORD;
    v_reason TEXT := btrim(COALESCE(p_reason, ''));
    v_resync BOOLEAN;
    v_move_id UUID;
BEGIN
    IF p_new_teacher_id IS NULL THEN
        RAISE EXCEPTION 'Choose the teacher to move the lesson to.' USING ERRCODE = 'P0001';
    END IF;
    IF char_length(v_reason) < 3 OR char_length(v_reason) > 500 THEN
        RAISE EXCEPTION 'Write a short reason (3 to 500 characters).' USING ERRCODE = 'P0001';
    END IF;

    SELECT id, teacher_id, status, scheduled_start, google_calendar_event_id
      INTO v_booking
      FROM public.bookings
     WHERE id = p_booking_id
     FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Lesson not found.' USING ERRCODE = 'P0002';
    END IF;

    IF v_booking.status NOT IN ('pending', 'confirmed', 'rescheduled') OR v_booking.scheduled_start <= timezone('utc'::text, now()) THEN
        RAISE EXCEPTION 'Only upcoming lessons that are not cancelled or finished can be moved.' USING ERRCODE = 'P0003';
    END IF;
    IF v_booking.teacher_id IS NOT DISTINCT FROM p_new_teacher_id THEN
        RAISE EXCEPTION 'This lesson is already with that teacher.' USING ERRCODE = 'P0004';
    END IF;
    -- A calendar/Zoom job running right now still works with the old teacher; let it finish first.
    IF EXISTS (SELECT 1 FROM public.integration_jobs WHERE booking_id = p_booking_id AND status = 'processing') THEN
        RAISE EXCEPTION 'The calendar for this lesson is being updated. Try again in a minute.' USING ERRCODE = 'P0005';
    END IF;

    v_resync := v_booking.status IN ('confirmed', 'rescheduled');

    -- Only the teacher changes (and, for a synced lesson, the old teacher's calendar event id).
    -- bookings_no_overlap_excl raises 23P01 here if the new teacher already has a lesson at this time.
    UPDATE public.bookings
       SET teacher_id = p_new_teacher_id,
           google_calendar_event_id = CASE WHEN v_resync THEN NULL ELSE google_calendar_event_id END,
           integration_status = CASE WHEN v_resync THEN 'pending' ELSE integration_status END,
           updated_at = timezone('utc'::text, now())
     WHERE id = p_booking_id;

    INSERT INTO public.booking_teacher_moves (booking_id, from_teacher_id, to_teacher_id, moved_by, reason, old_google_event_id, calendar_cleanup)
    VALUES (p_booking_id, v_booking.teacher_id, p_new_teacher_id, p_moved_by, v_reason,
            v_booking.google_calendar_event_id,
            CASE WHEN v_booking.google_calendar_event_id IS NULL THEN 'none' ELSE 'pending' END)
    RETURNING id INTO v_move_id;

    IF v_resync THEN
        INSERT INTO public.integration_jobs (booking_id, job_type, status)
        VALUES (p_booking_id, 'booking_sync', 'pending')
        ON CONFLICT (booking_id, job_type) WHERE status IN ('pending', 'processing', 'failed') DO NOTHING;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'move_id', v_move_id,
        'from_teacher_id', v_booking.teacher_id,
        'old_google_event_id', v_booking.google_calendar_event_id,
        'sync_queued', v_resync
    );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_move_booking_teacher(UUID, UUID, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_move_booking_teacher(UUID, UUID, TEXT, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.admin_move_booking_teacher(UUID, UUID, TEXT, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.admin_move_booking_teacher(UUID, UUID, TEXT, UUID) TO service_role;
