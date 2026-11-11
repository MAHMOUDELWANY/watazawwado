-- ====================================================================
-- Migration: P3 intake and offer tables are read through the API only
-- File: supabase/migrations/20261111000001_p3_private_columns_api_only.sql
--
-- Purpose:
-- 1. P3-012: a signed-in family can select its own rows of student_intakes and learning_offers straight
--    from the database with the key that ships in the browser bundle. Those rows carry the academy's own
--    working notes: student_intakes.assessment and pricing_recommendation, learning_offers.teacher_notes,
--    recommended_price_usd and recommended_tier. The portal never reads these tables directly; it calls
--    /api/intake/:id and /api/student/offers, which leave those fields out. The browser roles lose SELECT,
--    so the API is the only door. The server (service_role) is unaffected, and the super admin's pages go
--    through the API as well.
-- ====================================================================

REVOKE SELECT ON public.student_intakes FROM anon, authenticated;
REVOKE SELECT ON public.learning_offers FROM anon, authenticated;
REVOKE SELECT ON public.intake_review_events FROM anon, authenticated;
