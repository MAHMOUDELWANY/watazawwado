-- ============================================================================
-- Migration: Teacher Lifecycle Outcome RPC
-- Description: Atomically transitions a booking to completed or no_show and 
--              manages the corresponding lesson_sessions record.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.teacher_record_lesson_outcome(
    p_booking_id UUID,
    p_teacher_id UUID,
    p_outcome TEXT, 
    p_notes TEXT DEFAULT NULL,
    p_covered_material TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_booking record;
    v_session_id UUID;
    v_now TIMESTAMPTZ := timezone('utc'::text, now());
BEGIN
    -- 1. Input Validation
    IF p_outcome NOT IN ('completed', 'no_show') THEN
        RAISE EXCEPTION 'Invalid outcome: must be completed or no_show.' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Lock the booking to prevent concurrent conflicting transitions
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found.' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Authorization Check
    IF v_booking.teacher_id IS NULL OR v_booking.teacher_id != p_teacher_id THEN
        RAISE EXCEPTION 'Not authorized to manage this booking.' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Idempotency Check
    IF v_booking.status = p_outcome THEN
        RETURN jsonb_build_object(
            'success', true,
            'isIdempotent', true,
            'message', 'Booking already marked as ' || p_outcome,
            'booking', row_to_json(v_booking)
        );
    END IF;

    -- 5. Transition Rule Validation
    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot change status of a cancelled booking.' USING ERRCODE = 'P0004';
    END IF;

    -- Additional transition rule: Cannot switch between completed and no_show arbitrarily without a reset (not allowed by this endpoint)
    IF (v_booking.status = 'completed' AND p_outcome = 'no_show') OR 
       (v_booking.status = 'no_show' AND p_outcome = 'completed') THEN
        RAISE EXCEPTION 'Cannot transition directly from % to %.', v_booking.status, p_outcome USING ERRCODE = 'P0004';
    END IF;

    -- 6. Future Lesson Protection
    IF p_outcome = 'completed' AND v_booking.scheduled_start > (v_now + interval '15 minutes') THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as completed before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    IF p_outcome = 'no_show' AND v_booking.scheduled_start > v_now THEN
        RAISE EXCEPTION 'Cannot mark a future lesson as no-show before its scheduled start time.' USING ERRCODE = 'P0005';
    END IF;

    -- 7. Update Booking
    UPDATE public.bookings
    SET status = p_outcome,
        notes = COALESCE(p_notes, notes),
        updated_at = v_now
    WHERE id = p_booking_id;

    -- 8. Upsert Lesson Session (if student is linked)
    IF v_booking.student_id IS NOT NULL THEN
        SELECT id INTO v_session_id
        FROM public.lesson_sessions
        WHERE booking_id = p_booking_id;

        IF v_session_id IS NULL THEN
            INSERT INTO public.lesson_sessions (
                booking_id,
                student_id,
                lesson_date,
                attendance,
                completion_status,
                covered_material,
                teacher_observations
            ) VALUES (
                p_booking_id,
                v_booking.student_id,
                COALESCE(v_booking.scheduled_start, v_now),
                CASE WHEN p_outcome = 'completed' THEN 'attended' ELSE 'student_no_show' END,
                CASE WHEN p_outcome = 'completed' THEN 'completed' ELSE 'cancelled' END,
                p_covered_material,
                COALESCE(p_notes, CASE WHEN p_outcome = 'no_show' THEN 'Student did not attend scheduled lesson' ELSE NULL END)
            );
        ELSE
            UPDATE public.lesson_sessions
            SET attendance = CASE WHEN p_outcome = 'completed' THEN 'attended' ELSE 'student_no_show' END,
                completion_status = CASE WHEN p_outcome = 'completed' THEN 'completed' ELSE 'cancelled' END,
                covered_material = COALESCE(p_covered_material, covered_material),
                teacher_observations = COALESCE(p_notes, teacher_observations),
                updated_at = v_now
            WHERE id = v_session_id;
        END IF;
    END IF;

    -- Fetch updated booking
    SELECT * INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id;

    RETURN jsonb_build_object(
        'success', true,
        'isIdempotent', false,
        'message', 'Booking marked as ' || p_outcome,
        'booking', row_to_json(v_booking)
    );
END;
$$;

-- Secure the RPC
REVOKE ALL ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_record_lesson_outcome(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated, service_role;
