-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5G FINAL CLOSURE
-- Migration: Secure RLS Policies for Dashboard Tables
-- ====================================================================

-- Drop all overly permissive "Teacher full access to X" policies
DROP POLICY IF EXISTS "Teacher full access to profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teacher full access to services" ON public.services;
DROP POLICY IF EXISTS "Teacher full access to leads" ON public.leads;
DROP POLICY IF EXISTS "Teacher full access to students" ON public.students;
DROP POLICY IF EXISTS "Teacher full access to guardians" ON public.guardians;
DROP POLICY IF EXISTS "Teacher full access to student_goals" ON public.student_goals;
DROP POLICY IF EXISTS "Teacher full access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Teacher full access to lesson_sessions" ON public.lesson_sessions;
DROP POLICY IF EXISTS "Teacher full access to student_progress" ON public.student_progress;
DROP POLICY IF EXISTS "Teacher full access to availability" ON public.availability;
DROP POLICY IF EXISTS "Teacher full access to payments" ON public.payments;
DROP POLICY IF EXISTS "Teacher full access to reminders" ON public.reminders;
DROP POLICY IF EXISTS "Teacher full access to testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Teacher full access to blog_posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Teacher full access to ai_knowledge" ON public.ai_knowledge;
DROP POLICY IF EXISTS "Teacher full access to analytics_events" ON public.analytics_events;

-- Recreate strict teacher-only access policies for authenticated users
CREATE POLICY "Teacher allowlist access to profiles" ON public.profiles FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to services" ON public.services FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to leads" ON public.leads FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to students" ON public.students FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to guardians" ON public.guardians FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to student_goals" ON public.student_goals FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to bookings" ON public.bookings FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to lesson_sessions" ON public.lesson_sessions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to student_progress" ON public.student_progress FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to availability" ON public.availability FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to payments" ON public.payments FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to reminders" ON public.reminders FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to testimonials" ON public.testimonials FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to blog_posts" ON public.blog_posts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to ai_knowledge" ON public.ai_knowledge FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
CREATE POLICY "Teacher allowlist access to analytics_events" ON public.analytics_events FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));
