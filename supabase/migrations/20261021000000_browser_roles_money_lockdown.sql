-- ====================================================================
-- Migration: Browser roles cannot read money or write bookings, payments, packages
-- File: supabase/migrations/20261021000000_browser_roles_money_lockdown.sql
--
-- Purpose (security review 2026-10-21, read from production pg_policies and grants):
-- 1. RULES.md (2026-10-15): "Teachers never see money". The policy "Active teachers read payments"
--    (2026-10-13, before that decision) let any active teacher read every payment row straight from
--    Supabase REST with their own session token, bypassing the API. Now super admin only.
-- 2. "Teachers read only package entitlements for their assigned book" exposed price_paid. Teachers
--    get package data only through the API, which strips money for non-admins. The policy now matches nothing.
-- 3. bookings: the teacher policy is FOR ALL, so a teacher's token could UPDATE their bookings directly
--    (e.g. status = 'confirmed' on an unpaid booking, skipping "payments gate bookings") and read
--    fee_amount_usd and the management token. Every app write goes through the API (service_role), and
--    no browser code reads these tables, so browser roles lose all writes here and the money/token
--    columns. Column-level SELECT means a column added later stays hidden until granted (fail closed).
-- service_role (the API) and SECURITY DEFINER RPCs are unaffected.
-- ====================================================================

-- 1. payments: reads become super admin only.
ALTER POLICY "Active teachers read payments" ON public.payments
    USING (public.is_super_admin());
ALTER POLICY "Active teachers read payments" ON public.payments
    RENAME TO "Super admin reads payments";

-- 2. package_entitlements: no teacher read path through REST.
ALTER POLICY "Teachers read only package entitlements for their assigned book" ON public.package_entitlements
    USING (false);
ALTER POLICY "Teachers read only package entitlements for their assigned book" ON public.package_entitlements
    RENAME TO "Teachers read package entitlements through the API only";

-- 3. No direct writes from the browser to money and booking tables.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.bookings FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.package_entitlements FROM anon, authenticated;

-- 4. bookings: browser roles read every column except the fee and the management token.
REVOKE SELECT ON public.bookings FROM anon, authenticated;
GRANT SELECT (
    id, reference_code, student_id, lead_id, service_id, booking_type, duration_minutes, scheduled_start,
    scheduled_end, student_timezone, cairo_time_display, status, contact_name, contact_email, contact_whatsapp,
    parent_name, cancellation_reason, notes, zoom_meeting_link, created_at, updated_at, teacher_id,
    google_calendar_event_id, zoom_meeting_id, integration_status, sync_metadata, package_entitlement_id,
    hold_expires_at, payment_plan, reschedule_count, terms_version, terms_accepted_at, reschedule_requested_at,
    reschedule_request_note
) ON public.bookings TO authenticated;
