-- ====================================================================
-- Migration: Add the Zad Essentials (أول الزاد) subject
-- File: supabase/migrations/20261017000000_service_zad_essentials.sql
--
-- Purpose:
-- 1. Add the curriculum's foundations subject (docs/curriculum/PLAN.md §1a) to public.services so it
--    can be chosen at onboarding, booked and priced. Islamic studies band: $9 / hour (RULES.md §3).
-- ====================================================================

INSERT INTO public.services (
    id, category, title, arabic_title, short_description, arabic_description,
    display_order, is_active, hourly_rate_usd, supported_durations, trial_allowed
) VALUES (
    'zad-essentials', 'islamic_studies', 'Zad Essentials', 'أول الزاد',
    'For learners starting from zero: belief, purity, prayer and good manners, with the reason and the evidence behind each.',
    'لمن يبدأ من الصفر: العقيدة والطهارة والصلاة والأخلاق، مع الحكمة والدليل.',
    5, true, 9.00, '{30, 45, 60}', true
)
ON CONFLICT (id) DO UPDATE SET
    category = EXCLUDED.category,
    title = EXCLUDED.title,
    arabic_title = EXCLUDED.arabic_title,
    short_description = EXCLUDED.short_description,
    arabic_description = EXCLUDED.arabic_description,
    is_active = true,
    hourly_rate_usd = EXCLUDED.hourly_rate_usd,
    supported_durations = EXCLUDED.supported_durations,
    trial_allowed = EXCLUDED.trial_allowed,
    updated_at = timezone('utc'::text, now());
