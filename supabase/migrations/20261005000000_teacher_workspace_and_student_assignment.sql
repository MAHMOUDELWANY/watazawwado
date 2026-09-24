-- ====================================================================
-- WATAZAWWADO — ROLE-SCOPED TEACHER WORKSPACE & STUDENT ASSIGNMENT FOUNDATION
-- Migration: 20261005000000_teacher_workspace_and_student_assignment.sql
-- 
-- 1. Student Gender & Teacher Gender Preference fields on public.students
-- 2. Teacher Metadata (name, gender) on public.teacher_accounts
-- 3. Scoped RLS policies for students and bookings (super_admin vs teacher)
-- 4. Authoritative indexes for query acceleration
-- ====================================================================

-- 1. Add gender and teacher_gender_preference to public.students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'undisclosed' CHECK (gender IN ('male', 'female', 'undisclosed'));

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS teacher_gender_preference TEXT DEFAULT 'no_preference' CHECK (teacher_gender_preference IN ('no_preference', 'male_teacher', 'female_teacher'));

-- 2. Add teacher metadata columns to public.teacher_accounts
ALTER TABLE public.teacher_accounts
ADD COLUMN IF NOT EXISTS name TEXT DEFAULT 'Ustadh Mahmoud';

ALTER TABLE public.teacher_accounts
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male' CHECK (gender IN ('male', 'female'));

-- 3. Update canonical accounts with name and gender
UPDATE public.teacher_accounts
SET name = 'Ustadh Mahmoud',
    gender = 'male',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) IN ('mahmoudelwany98@gmail.com', 'mhmwdlwany4222@gmail.com');

-- 4. Ensure performance indexes exist
CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher_id
ON public.students(assigned_teacher_id);

CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id
ON public.bookings(teacher_id);

CREATE INDEX IF NOT EXISTS idx_students_gender
ON public.students(gender);

CREATE INDEX IF NOT EXISTS idx_students_teacher_gender_pref
ON public.students(teacher_gender_preference);

-- 5. Scoped RLS: Allow active super_admin full read/write, while normal teacher is scoped to assigned records
-- Drop previous blanket teacher policy on students
DROP POLICY IF EXISTS "Teacher allowlist access to students" ON public.students;
DROP POLICY IF EXISTS "Teacher scoped access to students" ON public.students;
DROP POLICY IF EXISTS "Super admin platform access to students" ON public.students;

-- Super Admin full platform access
CREATE POLICY "Super admin platform access to students" ON public.students
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND is_active = true
    )
);

-- Teacher scoped access: ONLY assigned students
CREATE POLICY "Teacher scoped access to students" ON public.students
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email)
        WHERE u.id = students.assigned_teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email)
        WHERE u.id = students.assigned_teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    )
);

-- Scoped RLS for bookings: super_admin full access, teacher scoped to teacher_id
DROP POLICY IF EXISTS "Teacher allowlist access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Teacher scoped access to bookings" ON public.bookings;
DROP POLICY IF EXISTS "Super admin platform access to bookings" ON public.bookings;

CREATE POLICY "Super admin platform access to bookings" ON public.bookings
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts
        WHERE lower(email) = lower(auth.jwt() ->> 'email')
          AND role = 'super_admin'
          AND is_active = true
    )
);

CREATE POLICY "Teacher scoped access to bookings" ON public.bookings
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email)
        WHERE u.id = bookings.teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.teacher_accounts ta
        JOIN auth.users u ON lower(ta.email) = lower(u.email)
        WHERE u.id = bookings.teacher_id
          AND lower(ta.email) = lower(auth.jwt() ->> 'email')
          AND ta.role = 'teacher'
          AND ta.is_active = true
    )
);
