-- ====================================================================
-- Migration: Teachers set their weekly hours in their own time zone
-- File: supabase/migrations/20261015000002_teacher_availability_timezone.sql
--
-- Purpose (RULES.md §1, decided 2026-10-15): a teacher outside Egypt enters hours in
-- their local time. update_teacher_availability takes the zone chosen on the
-- "My hours" page (validated by the API); without one it keeps the previous
-- behaviour (profile time zone, then Africa/Cairo). The availability engine reads
-- availability.timezone.
-- ====================================================================

DROP FUNCTION IF EXISTS public.update_teacher_availability(uuid, jsonb);

CREATE OR REPLACE FUNCTION public.update_teacher_availability(p_teacher_id uuid, p_schedule jsonb, p_timezone text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    v_interval jsonb;
    v_timezone text := nullif(trim(p_timezone), '');
BEGIN
    IF v_timezone IS NULL THEN
        SELECT timezone INTO v_timezone FROM public.profiles WHERE id = p_teacher_id;
    END IF;
    v_timezone := coalesce(v_timezone, 'Africa/Cairo');

    DELETE FROM public.availability WHERE teacher_id = p_teacher_id;

    IF jsonb_typeof(p_schedule) = 'array' THEN
        FOR v_interval IN SELECT * FROM jsonb_array_elements(p_schedule)
        LOOP
            INSERT INTO public.availability (teacher_id, weekday, start_time, end_time, is_active, timezone)
            VALUES (
                p_teacher_id,
                (v_interval->>'weekday')::smallint,
                (v_interval->>'start_time')::time,
                (v_interval->>'end_time')::time,
                COALESCE((v_interval->>'is_active')::boolean, true),
                v_timezone
            );
        END LOOP;
    END IF;
END;
$function$;

REVOKE ALL ON FUNCTION public.update_teacher_availability(uuid, jsonb, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_teacher_availability(uuid, jsonb, text) TO service_role;
