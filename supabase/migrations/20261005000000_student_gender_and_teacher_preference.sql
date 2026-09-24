-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — STUDENT GENDER & TEACHER PREFERENCE
-- Migration: 20261005000000_student_gender_and_teacher_preference.sql
-- Role:
-- 1. Add student gender field ('male', 'female', 'undisclosed').
-- 2. Add student teacher gender preference field ('no_preference', 'male_teacher', 'female_teacher').
-- ====================================================================

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS gender TEXT NOT NULL DEFAULT 'undisclosed'
CHECK (gender IN ('male', 'female', 'undisclosed'));

ALTER TABLE public.students
ADD COLUMN IF NOT EXISTS teacher_gender_preference TEXT NOT NULL DEFAULT 'no_preference'
CHECK (teacher_gender_preference IN ('no_preference', 'male_teacher', 'female_teacher'));
