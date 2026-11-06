-- ====================================================================
-- Migration: delete_family_account, narrower scope
-- File: supabase/migrations/20261106000002_delete_family_account_scope.sql
--
-- Purpose:
-- 1. Security review: bookings and packages are taken only for this account's own learners (or when they have
--    no learner at all), so a child shared with another guardian keeps its lessons and packages.
-- 2. A package this account bought for a shared child stops the deletion with a clear error (P0003) instead of
--    being deleted; the team settles that rare case by hand.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.delete_family_account(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_learners uuid[];
  v_bookings uuid[];
  v_entitlements uuid[];
  v_homework uuid[];
  v_sessions uuid[];
  v_intakes uuid[];
  v_offers uuid[];
  v_leads uuid[];
  v_payments int;
BEGIN
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = p_user_id;
  IF v_email IS NULL THEN RAISE EXCEPTION 'account not found' USING ERRCODE = 'P0002'; END IF;
  IF EXISTS (SELECT 1 FROM teacher_accounts WHERE lower(email) = v_email) THEN
    RAISE EXCEPTION 'staff accounts are not deleted here' USING ERRCODE = '42501';
  END IF;

  -- The account's own learner row, and children whose only guardian is this account.
  SELECT coalesce(array_agg(DISTINCT id), '{}') INTO v_learners FROM (
    SELECT id FROM students WHERE auth_user_id = p_user_id
    UNION
    SELECT g.student_id FROM guardians g
     WHERE lower(g.parent_email) = v_email
       AND NOT EXISTS (SELECT 1 FROM guardians o WHERE o.student_id = g.student_id AND lower(o.parent_email) <> v_email)
  ) x;

  -- Only this account's learners, or records with no learner at all: a child shared with another guardian
  -- keeps its lessons and packages.
  SELECT coalesce(array_agg(id), '{}') INTO v_bookings FROM bookings
   WHERE student_id = ANY(v_learners) OR (student_id IS NULL AND lower(contact_email) = v_email);
  SELECT coalesce(array_agg(id), '{}') INTO v_entitlements FROM package_entitlements
   WHERE learner_student_id = ANY(v_learners) OR (learner_student_id IS NULL AND purchaser_account_id = p_user_id);
  -- A package this account bought for a shared child must not be lost; the team settles that case by hand.
  IF EXISTS (SELECT 1 FROM package_entitlements WHERE purchaser_account_id = p_user_id AND NOT (id = ANY(v_entitlements))) THEN
    RAISE EXCEPTION 'this account bought a package for a child shared with another guardian' USING ERRCODE = 'P0003';
  END IF;
  SELECT coalesce(array_agg(id), '{}') INTO v_homework FROM lesson_homework
   WHERE student_id = ANY(v_learners) OR booking_id = ANY(v_bookings);
  SELECT coalesce(array_agg(id), '{}') INTO v_sessions FROM lesson_sessions
   WHERE student_id = ANY(v_learners) OR booking_id = ANY(v_bookings);
  SELECT coalesce(array_agg(id), '{}') INTO v_intakes FROM student_intakes
   WHERE auth_user_id = p_user_id OR learner_student_id = ANY(v_learners);
  SELECT coalesce(array_agg(id), '{}') INTO v_offers FROM learning_offers
   WHERE auth_user_id = p_user_id OR learner_student_id = ANY(v_learners) OR intake_id = ANY(v_intakes);
  SELECT coalesce(array_agg(DISTINCT id), '{}') INTO v_leads FROM (
    SELECT lead_id AS id FROM students WHERE id = ANY(v_learners) AND lead_id IS NOT NULL
    UNION SELECT lead_id FROM bookings WHERE id = ANY(v_bookings) AND lead_id IS NOT NULL
    UNION SELECT id FROM leads WHERE lower(email) = v_email
  ) x;

  -- Payments stay for the tax record, with no link to a person.
  UPDATE payments
     SET student_id = NULL, booking_id = NULL, entitlement_id = NULL,
         notes = trim(coalesce(notes, '') || ' [account deleted ' || to_char(now(), 'YYYY-MM-DD') || ']'),
         updated_at = now()
   WHERE student_id = ANY(v_learners) OR booking_id = ANY(v_bookings) OR entitlement_id = ANY(v_entitlements);
  GET DIAGNOSTICS v_payments = ROW_COUNT;

  DELETE FROM account_credit_ledger WHERE account_user_id = p_user_id;
  DELETE FROM discount_redemptions WHERE account_user_id = p_user_id;
  DELETE FROM intake_review_events WHERE intake_id = ANY(v_intakes) OR offer_id = ANY(v_offers);
  DELETE FROM learning_offers WHERE id = ANY(v_offers);
  DELETE FROM student_intakes WHERE id = ANY(v_intakes);

  UPDATE lesson_homework SET carried_from = NULL WHERE carried_from = ANY(v_homework) AND NOT (id = ANY(v_homework));
  DELETE FROM review_cards WHERE student_id = ANY(v_learners) OR homework_id = ANY(v_homework);
  DELETE FROM recitation_recordings WHERE student_id = ANY(v_learners) OR homework_id = ANY(v_homework);
  DELETE FROM lesson_homework WHERE id = ANY(v_homework);
  DELETE FROM honor_entries WHERE student_id = ANY(v_learners)
     OR milestone_id IN (SELECT id FROM learner_milestones WHERE student_id = ANY(v_learners) OR lesson_session_id = ANY(v_sessions));
  DELETE FROM learner_milestones WHERE student_id = ANY(v_learners) OR lesson_session_id = ANY(v_sessions);
  DELETE FROM lesson_notes WHERE student_id = ANY(v_learners) OR session_id = ANY(v_sessions);
  DELETE FROM lesson_sessions WHERE id = ANY(v_sessions);
  DELETE FROM lesson_feedback WHERE student_id = ANY(v_learners) OR booking_id = ANY(v_bookings) OR submitted_by = p_user_id;
  DELETE FROM reminders WHERE booking_id = ANY(v_bookings);
  DELETE FROM integration_jobs WHERE booking_id = ANY(v_bookings);
  DELETE FROM booking_teacher_moves WHERE booking_id = ANY(v_bookings);
  DELETE FROM teacher_lesson_moves WHERE booking_id = ANY(v_bookings);

  DELETE FROM package_credit_ledger WHERE booking_id = ANY(v_bookings) OR learner_student_id = ANY(v_learners) OR package_entitlement_id = ANY(v_entitlements);
  DELETE FROM sponsorship_grants WHERE account_user_id = p_user_id OR learner_student_id = ANY(v_learners) OR entitlement_id = ANY(v_entitlements);
  DELETE FROM sponsorship_requests WHERE account_user_id = p_user_id OR learner_student_id = ANY(v_learners);
  DELETE FROM sponsorship_donations WHERE donor_user_id = p_user_id;
  DELETE FROM bookings WHERE id = ANY(v_bookings);
  DELETE FROM package_entitlements WHERE id = ANY(v_entitlements);

  DELETE FROM curriculum_lesson_reports WHERE student_id = ANY(v_learners);
  DELETE FROM placement_tests WHERE auth_user_id = p_user_id OR learner_student_id = ANY(v_learners);
  DELETE FROM program_signups WHERE account_user_id = p_user_id OR student_id = ANY(v_learners);
  DELETE FROM student_goals WHERE student_id = ANY(v_learners);
  DELETE FROM student_progress WHERE student_id = ANY(v_learners);
  DELETE FROM guardians WHERE student_id = ANY(v_learners) OR lower(parent_email) = v_email;
  DELETE FROM child_devices WHERE owner_user_id = p_user_id OR learner_id = ANY(v_learners);
  DELETE FROM class_board_members WHERE student_id = ANY(v_learners);
  DELETE FROM crm_notes WHERE account_student_id = ANY(v_learners) OR child_student_id = ANY(v_learners);
  DELETE FROM crm_tags WHERE account_student_id = ANY(v_learners);
  DELETE FROM crm_tasks WHERE account_student_id = ANY(v_learners);
  DELETE FROM family_achievements WHERE account_user_id = p_user_id;
  DELETE FROM family_reviews WHERE account_user_id = p_user_id;
  DELETE FROM referrals WHERE referrer_user_id = p_user_id OR referred_user_id = p_user_id;
  DELETE FROM referral_codes WHERE owner_user_id = p_user_id;
  DELETE FROM chat_threads WHERE owner_user_id = p_user_id;
  DELETE FROM user_notifications WHERE recipient_user_id = p_user_id;
  DELETE FROM waitlist_entries WHERE lower(email) = v_email;
  DELETE FROM students WHERE id = ANY(v_learners);
  DELETE FROM leads l WHERE l.id = ANY(v_leads)
     AND NOT EXISTS (SELECT 1 FROM students s WHERE s.lead_id = l.id)
     AND NOT EXISTS (SELECT 1 FROM bookings b WHERE b.lead_id = l.id);
  -- Sign-in account last; its preferences, push subscriptions and the request itself go with it.
  DELETE FROM auth.users WHERE id = p_user_id;

  RETURN jsonb_build_object('learners', coalesce(array_length(v_learners, 1), 0),
                            'bookings', coalesce(array_length(v_bookings, 1), 0),
                            'paymentsKept', v_payments);
END;
$$;

REVOKE ALL ON FUNCTION public.delete_family_account(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_family_account(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.delete_family_account(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.delete_family_account(uuid) TO service_role;
