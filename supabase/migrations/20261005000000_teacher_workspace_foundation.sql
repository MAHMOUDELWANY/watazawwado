-- ====================================================================
-- WATAZAWWADO — TEACHER WORKSPACE FOUNDATION & DATA CONTRACT CANONICALIZATION
-- Migration: 20261005000000_teacher_workspace_foundation.sql
-- 
-- 1. Student Gender & Teacher Gender Preference fields on public.students
-- 2. Teacher Metadata (display_name, gender) on public.teacher_accounts
-- 3. Scoped RLS policies for students and bookings (super_admin vs teacher)
-- 4. Authoritative indexes for query acceleration and assignment model
-- ====================================================================

-- 1. Add gender and teacher_gender_preference to public.students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'undisclosed';

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS teacher_gender_preference TEXT DEFAULT 'no_preference';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_gender_check'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_gender_check CHECK (gender IN ('male', 'female', 'undisclosed'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_teacher_gender_pref_check'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_teacher_gender_pref_check CHECK (teacher_gender_preference IN ('no_preference', 'male_teacher', 'female_teacher'));
    END IF;
END $$;

-- 2. Add teacher metadata columns (display_name, gender) to public.teacher_accounts
ALTER TABLE public.teacher_accounts
ADD COLUMN IF NOT EXISTS display_name TEXT DEFAULT 'Ustadh Mahmoud';

ALTER TABLE public.teacher_accounts
ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'male';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'teacher_accounts_gender_check'
    ) THEN
        ALTER TABLE public.teacher_accounts
        ADD CONSTRAINT teacher_accounts_gender_check CHECK (gender IN ('male', 'female'));
    END IF;
END $$;

-- 3. Canonicalize display_name and gender for seeded authorized accounts
UPDATE public.teacher_accounts
SET display_name = 'Ustadh Mahmoud (Super Admin)',
    gender = 'male',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mahmoudelwany98@gmail.com';

UPDATE public.teacher_accounts
SET display_name = 'Ustadh Mahmoud',
    gender = 'male',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mhmwdlwany4222@gmail.com';

-- 4. Authoritative Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_assigned_teacher_id
ON public.students(assigned_teacher_id);

CREATE INDEX IF NOT EXISTS idx_bookings_teacher_id
ON public.bookings(teacher_id);

CREATE INDEX IF NOT EXISTS idx_students_gender
ON public.students(gender);

CREATE INDEX IF NOT EXISTS idx_students_teacher_gender_pref
ON public.students(teacher_gender_preference);

CREATE INDEX IF NOT EXISTS idx_teacher_accounts_role_active
ON public.teacher_accounts(role, is_active);

-- 5. Additive Scoped RLS: Allow active super_admin full platform read/write,
-- while normal teacher is scoped to assigned records.
-- Preserves all student self-access policies and existing permissions.

DROP POLICY IF EXISTS "Teacher allowlist access to students" ON public.students;
DROP POLICY IF EXISTS "Teacher scoped access to students" ON public.students;
DROP POLICY IF EXISTS "Super admin platform access to students" ON public.students;

-- Super Admin full platform access to students
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

-- Teacher scoped access: ONLY assigned students (assigned_teacher_id = auth.users.id)
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
