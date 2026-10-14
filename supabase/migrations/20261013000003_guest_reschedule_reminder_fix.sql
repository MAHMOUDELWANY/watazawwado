-- ====================================================================
-- Migration: Guest Reschedule Reminder Fix
-- File: supabase/migrations/20261013000003_guest_reschedule_reminder_fix.sql
--
-- Purpose (verified against production, 2026-10-13):
-- 1. reminders has a full UNIQUE (booking_id, reminder_type) index (unique_booking_reminder)
--    in addition to the partial pending-only index. reschedule_booking_by_management cancelled
--    the old reminder rows and then INSERTed new ones with ON CONFLICT ... WHERE status='pending',
--    which does not cover the full index, so every reschedule of a booking that already had
--    reminders failed with a unique violation and rolled back.
--    Fix: re-arm the existing reminder rows via ON CONFLICT (booking_id, reminder_type) DO UPDATE.
--    Everything else in the function is unchanged; CREATE OR REPLACE keeps existing grants.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.reschedule_booking_by_management(p_reference_code text, p_management_token text, p_new_start timestamp with time zone, p_new_end timestamp with time zone, p_cairo_time_display text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
    v_clean_ref text;
    v_clean_token text;
    v_booking record;
    v_rem_24h timestamptz;
    v_rem_1h timestamptz;
BEGIN
    v_clean_ref := upper(trim(coalesce(p_reference_code, '')));
    v_clean_token := trim(coalesce(p_management_token, ''));
    IF v_clean_ref = '' OR v_clean_token = '' THEN
        RAISE EXCEPTION 'Unauthorized: Valid management token required.';
    END IF;

    SELECT * INTO v_booking
      FROM public.bookings
     WHERE upper(reference_code) = v_clean_ref;

    IF NOT FOUND OR v_booking.management_token_hash IS NULL
       OR extensions.crypt(v_clean_token, v_booking.management_token_hash) <> v_booking.management_token_hash THEN
        RAISE EXCEPTION 'No matching booking found for the provided management credentials.';
    END IF;

    IF v_booking.status = 'cancelled' THEN
        RAISE EXCEPTION 'Cannot reschedule a cancelled booking. Please create a new booking.';
    END IF;

    IF v_booking.scheduled_start - interval '3 hours' <= now() THEN
        RAISE EXCEPTION 'Rescheduling must be done at least 3 hours before the current scheduled lesson time.';
    END IF;

    IF p_new_start < now() + interval '10 minutes' THEN
        RAISE EXCEPTION 'New scheduled time must be at least 10 minutes in the future.';
    END IF;

    IF p_new_end <> (p_new_start + (v_booking.duration_minutes || ' minutes')::interval) THEN
        RAISE EXCEPTION 'Scheduled end timestamp must match scheduled start plus exact original duration.';
    END IF;

    BEGIN
        UPDATE public.bookings
           SET scheduled_start = p_new_start,
               scheduled_end = p_new_end,
               cairo_time_display = to_char(p_new_start AT TIME ZONE 'Africa/Cairo', 'DD Mon YYYY, HH12:MI AM'),
               status = CASE WHEN status = 'pending' THEN 'pending' ELSE 'rescheduled' END,
               updated_at = timezone('utc', now())
         WHERE id = v_booking.id;
    EXCEPTION WHEN exclusion_violation THEN
        RAISE EXCEPTION 'The new time slot is not available. Please select another time.';
    END;

    -- Reminders whose new time has already passed stay cancelled.
    UPDATE public.reminders
       SET status = 'cancelled', updated_at = timezone('utc', now())
     WHERE booking_id = v_booking.id
       AND status = 'pending';

    v_rem_24h := p_new_start - interval '24 hours';
    v_rem_1h := p_new_start - interval '1 hour';

    IF v_rem_24h > now() THEN
        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking.id, '24h_before', v_rem_24h, 'pending')
        ON CONFLICT (booking_id, reminder_type) DO UPDATE
           SET scheduled_for = EXCLUDED.scheduled_for,
               status = 'pending',
               sent_at = NULL,
               error_info = NULL,
               claim_token = NULL,
               processing_at = NULL,
               updated_at = timezone('utc', now());
    END IF;

    IF v_rem_1h > now() THEN
        INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
        VALUES (v_booking.id, '1h_before', v_rem_1h, 'pending')
        ON CONFLICT (booking_id, reminder_type) DO UPDATE
           SET scheduled_for = EXCLUDED.scheduled_for,
               status = 'pending',
               sent_at = NULL,
               error_info = NULL,
               claim_token = NULL,
               processing_at = NULL,
               updated_at = timezone('utc', now());
    END IF;

    INSERT INTO public.integration_jobs (booking_id, job_type, status)
    VALUES (v_booking.id, 'booking_reschedule', 'pending')
    ON CONFLICT (booking_id, job_type)
      WHERE status IN ('pending', 'processing', 'failed')
    DO NOTHING;

    RETURN jsonb_build_object('success', true, 'message', 'Booking successfully rescheduled.');
END;
$function$;
