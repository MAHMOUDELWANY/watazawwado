-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 5D FINAL CLOSURE
-- Migration: Student Management, Notes Security & Performance Indexes
-- ====================================================================

-- 1. Ensure performance indexes on students table for fast search and filtering
CREATE INDEX IF NOT EXISTS idx_students_status ON public.students(status);
CREATE INDEX IF NOT EXISTS idx_students_email ON public.students(email);
CREATE INDEX IF NOT EXISTS idx_students_lead_id ON public.students(lead_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON public.students(created_at DESC);

-- 2. Performance indexes on bookings for student history lookups
CREATE INDEX IF NOT EXISTS idx_bookings_student_id ON public.bookings(student_id);
CREATE INDEX IF NOT EXISTS idx_bookings_contact_email ON public.bookings(contact_email);

-- 3. Performance indexes on private lesson/student notes
CREATE INDEX IF NOT EXISTS idx_lesson_notes_student_id ON public.lesson_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_lesson_notes_created_at ON public.lesson_notes(created_at DESC);

-- 4. Harden RLS on lesson_notes:
-- Drop existing wide policy and restrict access exclusively to verified teachers in teacher_accounts.
-- Authenticated student users or anonymous clients have zero read or write access.
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Teacher full access to lesson_notes" ON public.lesson_notes;
DROP POLICY IF EXISTS "Teacher allowlist access to lesson_notes" ON public.lesson_notes;

CREATE POLICY "Teacher allowlist access to lesson_notes"
    ON public.lesson_notes FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.teacher_accounts 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.teacher_accounts 
            WHERE email = auth.jwt() ->> 'email' 
            AND is_active = true
        )
    );
