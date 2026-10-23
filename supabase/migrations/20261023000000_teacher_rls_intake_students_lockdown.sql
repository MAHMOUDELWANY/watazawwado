-- ====================================================================
-- Migration: Lock intake/offer rows to super admins; no browser student create/delete
-- File: supabase/migrations/20261023000000_teacher_rls_intake_students_lockdown.sql
--
-- Purpose:
-- 1. student_intakes, learning_offers and intake_review_events let every active teacher read and write
--    every row through PostgREST, while the API keeps their review routes super-admin only. The teacher
--    policies now require public.is_super_admin(); students keep their own read policies.
-- 2. The "Teacher scoped access to students" policy was FOR ALL, so a teacher could insert students or
--    delete an assigned student (cascading their history) straight from the browser. It is split into
--    SELECT and UPDATE (UPDATE stays limited to the profile columns granted in 20261013000000).
-- 3. The browser roles lose the table privileges nothing uses: anon gets none on these four tables,
--    authenticated keeps SELECT (and the column UPDATE on students). The API uses service_role and is
--    unaffected.
-- ====================================================================

-- 1. INTAKE / OFFER / REVIEW ROWS: super admin only
DROP POLICY IF EXISTS "Teacher allowlist access to student_intakes" ON public.student_intakes;
DROP POLICY IF EXISTS "Super admin manages student_intakes" ON public.student_intakes;
CREATE POLICY "Super admin manages student_intakes" ON public.student_intakes
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Teacher allowlist access to learning_offers" ON public.learning_offers;
DROP POLICY IF EXISTS "Super admin manages learning_offers" ON public.learning_offers;
CREATE POLICY "Super admin manages learning_offers" ON public.learning_offers
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Teacher allowlist access to intake_review_events" ON public.intake_review_events;
DROP POLICY IF EXISTS "Super admin manages intake_review_events" ON public.intake_review_events;
CREATE POLICY "Super admin manages intake_review_events" ON public.intake_review_events
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 2. STUDENTS: teachers read and edit their assigned students, never create or delete them
DROP POLICY IF EXISTS "Teacher scoped access to students" ON public.students;
DROP POLICY IF EXISTS "Teacher reads assigned students" ON public.students;
DROP POLICY IF EXISTS "Teacher updates assigned students" ON public.students;
CREATE POLICY "Teacher reads assigned students" ON public.students
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email::text)
        WHERE u.id = students.assigned_teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    ));
CREATE POLICY "Teacher updates assigned students" ON public.students
    FOR UPDATE TO authenticated
    USING (EXISTS (
        SELECT 1
        FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email::text)
        WHERE u.id = students.assigned_teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    ))
    WITH CHECK (EXISTS (
        SELECT 1
        FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email::text)
        WHERE u.id = students.assigned_teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    ));

-- 3. BROWSER TABLE PRIVILEGES
REVOKE ALL ON public.student_intakes, public.learning_offers, public.intake_review_events, public.students FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON public.student_intakes, public.learning_offers, public.intake_review_events FROM authenticated;
REVOKE INSERT, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.students FROM authenticated;
