-- ====================================================================
-- Migration: New reminder schedule
-- File: supabase/migrations/20261016000004_reminder_schedule_email3h_site12h_site2h.sql
--
-- Purpose:
-- 1. RULES.md §2 (2026-10-15): the student gets an email when booking (unchanged) and 3 hours
--    before the lesson, plus on-site notices 12 hours and 2 hours before. Allow the new
--    reminder_type values. The old '24h_before' / '1h_before' stay valid so rows created by
--    older RPCs do not fail; the worker re-arms reminders with the new types.
-- ====================================================================

DO $$
DECLARE c text;
BEGIN
  FOR c IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'public.reminders'::regclass AND contype = 'c' AND pg_get_constraintdef(oid) ILIKE '%reminder_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.reminders DROP CONSTRAINT %I', c);
  END LOOP;
END $$;

ALTER TABLE public.reminders
  ADD CONSTRAINT reminders_reminder_type_check
  CHECK (reminder_type IN ('24h_before', '1h_before', 'email_3h', 'site_12h', 'site_2h'));

-- 2. Upcoming lessons move to the new schedule now; their pending legacy reminders are cancelled.
INSERT INTO public.reminders (booking_id, reminder_type, scheduled_for, status)
SELECT b.id, k.kind, b.scheduled_start - k.lead_time, 'pending'
FROM public.bookings b
CROSS JOIN (VALUES ('site_12h', interval '12 hours'), ('email_3h', interval '3 hours'), ('site_2h', interval '2 hours')) AS k(kind, lead_time)
WHERE b.status IN ('confirmed', 'rescheduled')
  AND b.scheduled_start - k.lead_time > timezone('utc'::text, now())
ON CONFLICT (booking_id, reminder_type) DO NOTHING;

UPDATE public.reminders
SET status = 'cancelled', updated_at = timezone('utc'::text, now())
WHERE status = 'pending' AND reminder_type IN ('24h_before', '1h_before');
