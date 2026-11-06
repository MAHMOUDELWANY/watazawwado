-- ====================================================================
-- Migration: Production audit fixes (grants, analytics inserts, FK indexes)
-- File: supabase/migrations/20261106000000_audit_grants_analytics_fk_indexes.sql
--
-- Purpose:
-- 1. The browser never reads or writes teacher pay or teacher accounts; the server uses the service role.
--    RLS already blocks these, but the broad table grants were a second door left open. Close it.
--    authenticated keeps SELECT on teacher_accounts because other tables' RLS policies look it up inline.
-- 2. analytics_events accepted any insert from anyone. Keep anonymous logging, but cap the sizes and
--    require a current timestamp so the table cannot be flooded with huge or backdated rows.
-- 3. Index every single-column foreign key that had none (Supabase performance advisor), so joins and
--    cascading deletes on bookings, payments, notes and the rest stay fast as the tables grow.
-- ====================================================================

REVOKE ALL ON public.teacher_pay_rates, public.teacher_payouts, public.teacher_accounts FROM anon;
REVOKE ALL ON public.teacher_pay_rates, public.teacher_payouts FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER ON public.teacher_accounts FROM authenticated;
REVOKE SELECT ON public.payments FROM anon;

DROP POLICY IF EXISTS "Public can log analytics events" ON public.analytics_events;
CREATE POLICY "Public can log analytics events" ON public.analytics_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(event_name) BETWEEN 1 AND 80
    AND char_length(coalesce(page_path, '')) <= 500
    AND char_length(coalesce(source, '')) <= 80
    AND char_length(coalesce(service_id, '')) <= 120
    AND char_length(coalesce(booking_type, '')) <= 80
    AND char_length(coalesce(session_id, '')) <= 120
    AND pg_column_size(metadata) <= 4096
    AND created_at BETWEEN now() - interval '10 minutes' AND now() + interval '10 minutes'
  );

CREATE INDEX IF NOT EXISTS idx_account_credit_ledger_redemption_id ON public.account_credit_ledger (redemption_id);
CREATE INDEX IF NOT EXISTS idx_availability_teacher_id ON public.availability (teacher_id);
CREATE INDEX IF NOT EXISTS idx_bookings_lead_id ON public.bookings (lead_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_entitlement_id ON public.bookings (package_entitlement_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings (student_id);
CREATE INDEX IF NOT EXISTS idx_child_devices_learner_id ON public.child_devices (learner_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_child_student_id ON public.crm_notes (child_student_id);
CREATE INDEX IF NOT EXISTS idx_family_reviews_reviewed_by ON public.family_reviews (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_guardians_student_id ON public.guardians (student_id);
CREATE INDEX IF NOT EXISTS idx_intake_review_events_offer_id ON public.intake_review_events (offer_id);
CREATE INDEX IF NOT EXISTS idx_intake_review_events_teacher_id ON public.intake_review_events (teacher_id);
CREATE INDEX IF NOT EXISTS idx_leads_service_interest_id ON public.leads (service_interest_id);
CREATE INDEX IF NOT EXISTS idx_learner_milestones_created_by ON public.learner_milestones (created_by);
CREATE INDEX IF NOT EXISTS idx_learner_milestones_lesson_session_id ON public.learner_milestones (lesson_session_id);
CREATE INDEX IF NOT EXISTS idx_learning_offers_learner_student_id ON public.learning_offers (learner_student_id);
CREATE INDEX IF NOT EXISTS idx_learning_offers_service_id ON public.learning_offers (service_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_student_id ON public.lesson_feedback (student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_feedback_submitted_by ON public.lesson_feedback (submitted_by);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_booking_id ON public.lesson_homework (booking_id);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_carried_from ON public.lesson_homework (carried_from);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_done_by ON public.lesson_homework (done_by);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_lesson_note_id ON public.lesson_homework (lesson_note_id);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_reviewed_by ON public.lesson_homework (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_lesson_homework_teacher_id ON public.lesson_homework (teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_session_id ON public.lesson_notes (session_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_id ON public.lesson_notes (student_id);
CREATE INDEX IF NOT EXISTS idx_package_credit_ledger_learner_student_id ON public.package_credit_ledger (learner_student_id);
CREATE INDEX IF NOT EXISTS idx_package_credit_ledger_package_entitlement_id ON public.package_credit_ledger (package_entitlement_id);
CREATE INDEX IF NOT EXISTS idx_package_entitlements_learner_student_id ON public.package_entitlements (learner_student_id);
CREATE INDEX IF NOT EXISTS idx_package_entitlements_package_catalog_id ON public.package_entitlements (package_catalog_id);
CREATE INDEX IF NOT EXISTS idx_package_entitlements_purchaser_account_id ON public.package_entitlements (purchaser_account_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments (booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments (student_id);
CREATE INDEX IF NOT EXISTS idx_placement_tests_learner_student_id ON public.placement_tests (learner_student_id);
CREATE INDEX IF NOT EXISTS idx_program_signups_account_user_id ON public.program_signups (account_user_id);
CREATE INDEX IF NOT EXISTS idx_recitation_recordings_homework_id ON public.recitation_recordings (homework_id);
CREATE INDEX IF NOT EXISTS idx_recitation_recordings_replied_by ON public.recitation_recordings (replied_by);
CREATE INDEX IF NOT EXISTS idx_recitation_recordings_sent_by ON public.recitation_recordings (sent_by);
CREATE INDEX IF NOT EXISTS idx_review_invites_created_by ON public.review_invites (created_by);
CREATE INDEX IF NOT EXISTS idx_review_proofs_created_by ON public.review_proofs (created_by);
CREATE INDEX IF NOT EXISTS idx_seasonal_programs_created_by ON public.seasonal_programs (created_by);
CREATE INDEX IF NOT EXISTS idx_sponsorship_donations_donor_user_id ON public.sponsorship_donations (donor_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_grants_account_user_id ON public.sponsorship_grants (account_user_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_grants_entitlement_id ON public.sponsorship_grants (entitlement_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_grants_learner_student_id ON public.sponsorship_grants (learner_student_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_grants_package_catalog_id ON public.sponsorship_grants (package_catalog_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_grants_request_id ON public.sponsorship_grants (request_id);
CREATE INDEX IF NOT EXISTS idx_sponsorship_requests_account_user_id ON public.sponsorship_requests (account_user_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_service_id ON public.student_goals (service_id);
CREATE INDEX IF NOT EXISTS idx_student_goals_student_id ON public.student_goals (student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_student_id ON public.student_progress (student_id);
CREATE INDEX IF NOT EXISTS idx_students_lead_id ON public.students (lead_id);
CREATE INDEX IF NOT EXISTS idx_teacher_lesson_moves_booking_id ON public.teacher_lesson_moves (booking_id);
