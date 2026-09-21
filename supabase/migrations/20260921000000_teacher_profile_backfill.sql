-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — ONE-TIME PRODUCTION REPAIR
-- Migration: Backfill missing teacher profiles
-- ====================================================================

-- Insert missing profiles for all active teachers currently found in auth.users
-- This repairs the invariant so that RPCs like update_teacher_availability
-- which depend on a valid foreign key in public.profiles do not fail.

INSERT INTO public.profiles (id, email, display_name, role, timezone, language_preference, onboarding_completed, created_at, updated_at)
SELECT
    au.id,
    au.email,
    COALESCE(NULLIF(trim(au.raw_user_meta_data->>'full_name'), ''), 'Ustadh Mahmoud'),
    ta.role,
    'Africa/Cairo',
    'en',
    false,
    au.created_at,
    timezone('utc'::text, now())
FROM auth.users au
JOIN public.teacher_accounts ta ON lower(trim(ta.email)) = lower(trim(au.email))
WHERE ta.is_active = true
ON CONFLICT (id) DO NOTHING;
