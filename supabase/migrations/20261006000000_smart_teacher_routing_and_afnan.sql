-- ====================================================================
-- SMART ROUTING, TEACHER AFNAN & TEACHER ASSIGNMENT STATUS
-- Migration: 20261006000000_smart_teacher_routing_and_afnan.sql
-- ====================================================================

-- 1. Add teacher_assignment_status to public.students
ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS teacher_assignment_status TEXT DEFAULT 'pending_review';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'students_teacher_assignment_status_check'
    ) THEN
        ALTER TABLE public.students
        ADD CONSTRAINT students_teacher_assignment_status_check 
        CHECK (teacher_assignment_status IN ('pending_review', 'approved', 'reassigned'));
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_students_teacher_assignment_status
ON public.students(teacher_assignment_status);

-- 2. Female teacher registration placeholder (Pending official email from administration)
-- Female teacher will be registered dynamically via teacher_accounts when credentials are provided.

-- 3. Ensure Mahmoud is properly set with gender = 'male'
UPDATE public.teacher_accounts
SET display_name = 'الأستاذ محمود (Super Admin)',
    gender = 'male',
    role = 'super_admin',
    is_active = true,
    updated_at = timezone('utc'::text, now())
WHERE lower(email) = 'mahmoudelwany98@gmail.com';
