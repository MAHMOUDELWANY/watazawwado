-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — STUDENT TEACHER ASSIGNMENT & GENDER PREFERENCE
-- Migration: 20261005000000_student_teacher_assignment_and_gender_preference.sql
-- Role:
-- 1. Add preferred_teacher_gender to public.students.
-- 2. Add display_name and gender to public.teacher_accounts.
-- 3. Seed canonical display names and genders for authorized teachers.
-- ====================================================================

-- 1. Add preferred_teacher_gender to public.students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS preferred_teacher_gender TEXT NOT NULL DEFAULT 'any'
CHECK (preferred_teacher_gender IN ('male', 'female', 'any'));

CREATE INDEX IF NOT EXISTS idx_students_preferred_teacher_gender
ON public.students(preferred_teacher_gender);

-- 2. Add display_name and gender to public.teacher_accounts
ALTER TABLE public.teacher_accounts
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'male'
CHECK (gender IN ('male', 'female'));

-- 3. Set display_name and gender for canonical authorized teachers
UPDATE public.teacher_accounts
SET display_name = 'Ustadh Mahmoud Elwany',
    gender = 'male',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mahmoudelwany98@gmail.com';

UPDATE public.teacher_accounts
SET display_name = 'Ustadh Mahmoud (Staff)',
    gender = 'male',
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mhmwdlwany4222@gmail.com';

-- 4. Ensure students can update their own preferred_teacher_gender
-- (Note: assigned_teacher_id modification is already protected by trg_enforce_student_teacher_assignment)
