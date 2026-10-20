-- ====================================================================
-- Migration: Teacher allowlist policies become super admin only
-- File: supabase/migrations/20261021000001_teacher_allowlist_to_super_admin.sql
--
-- Purpose (security review 2026-10-21, read from production pg_policies):
-- 1. Twelve tables had "Teacher allowlist access to <table>" FOR ALL USING (is_active_teacher()): any active
--    teacher's session token could read and change every row straight through Supabase REST: every parent's
--    contact details (guardians), every prospect (leads), other teachers' hours (availability), the AI chat's
--    facts (ai_knowledge) and public site content (blog_posts, testimonials). Teachers use the API, which
--    scopes them to their own students; no browser code reads these tables. The policies now admit only the
--    super admin. Other policies on these tables (public reads, a student's own rows) are unchanged.
-- ====================================================================

ALTER POLICY "Teacher allowlist access to ai_knowledge" ON public.ai_knowledge
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to ai_knowledge" ON public.ai_knowledge
    RENAME TO "Super admin access to ai_knowledge";

ALTER POLICY "Teacher allowlist access to analytics_events" ON public.analytics_events
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to analytics_events" ON public.analytics_events
    RENAME TO "Super admin access to analytics_events";

ALTER POLICY "Teacher allowlist access to availability" ON public.availability
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to availability" ON public.availability
    RENAME TO "Super admin access to availability";

ALTER POLICY "Teacher allowlist access to blog_posts" ON public.blog_posts
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to blog_posts" ON public.blog_posts
    RENAME TO "Super admin access to blog_posts";

ALTER POLICY "Teacher allowlist access to guardians" ON public.guardians
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to guardians" ON public.guardians
    RENAME TO "Super admin access to guardians";

ALTER POLICY "Teacher allowlist access to leads" ON public.leads
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to leads" ON public.leads
    RENAME TO "Super admin access to leads";

ALTER POLICY "Teacher allowlist access to lesson_sessions" ON public.lesson_sessions
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to lesson_sessions" ON public.lesson_sessions
    RENAME TO "Super admin access to lesson_sessions";

ALTER POLICY "Teacher allowlist access to profiles" ON public.profiles
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to profiles" ON public.profiles
    RENAME TO "Super admin access to profiles";

ALTER POLICY "Teacher allowlist access to reminders" ON public.reminders
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to reminders" ON public.reminders
    RENAME TO "Super admin access to reminders";

ALTER POLICY "Teacher allowlist access to student_goals" ON public.student_goals
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to student_goals" ON public.student_goals
    RENAME TO "Super admin access to student_goals";

ALTER POLICY "Teacher allowlist access to student_progress" ON public.student_progress
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to student_progress" ON public.student_progress
    RENAME TO "Super admin access to student_progress";

ALTER POLICY "Teacher allowlist access to testimonials" ON public.testimonials
    USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
ALTER POLICY "Teacher allowlist access to testimonials" ON public.testimonials
    RENAME TO "Super admin access to testimonials";

