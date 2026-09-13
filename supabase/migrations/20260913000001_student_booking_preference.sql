-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — STUDENT BOOKING PREFERENCES
-- Migration: 20260913000001_student_booking_preference.sql
-- Adds booking_preference column to students table
-- Value constrained to: 'self' | 'child'
-- Default value: 'self'
-- ====================================================================

ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS booking_preference TEXT NOT NULL DEFAULT 'self'
CHECK (booking_preference IN ('self', 'child'));
