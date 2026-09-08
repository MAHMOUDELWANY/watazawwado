-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 7 STUDENT AUTH STABILIZATION
-- Migration: 20260908000001_phase7_student_auth_stabilization.sql
-- Hardens handle_new_student_user trigger with explicit search path,
-- dynamic teacher allowlist check (no hardcoded emails),
-- deterministic duplicate-prevention linking, and complete Student RLS.
-- ====================================================================

-- 1. Ensure auth_user_id column and unique partial index exist on public.students
ALTER TABLE public.students 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_students_auth_user_id 
ON public.students(auth_user_id) 
WHERE auth_user_id IS NOT NULL;

-- 2. Hardened trigger function for new auth users
CREATE OR REPLACE FUNCTION public.handle_new_student_user() 
RETURNS trigger 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public, pg_temp
AS $$
DECLARE
  v_unlinked_count INTEGER;
  v_existing_student_id UUID;
  v_user_name TEXT;
  v_clean_email TEXT;
BEGIN
  v_clean_email := lower(trim(new.email));

  -- 2A. Dynamic check against teacher_accounts allowlist:
  -- Teachers must NEVER have a student profile created automatically.
  IF EXISTS (
    SELECT 1 FROM public.teacher_accounts 
    WHERE lower(trim(email)) = v_clean_email AND is_active = true
  ) THEN
    RETURN new;
  END IF;

  -- 2B. Resolve student name safely
  v_user_name := COALESCE(
    NULLIF(trim(new.raw_user_meta_data->>'full_name'), ''),
    NULLIF(trim(new.raw_user_meta_data->>'name'), ''),
    split_part(new.email, '@', 1)
  );

  -- 2C. Safe deterministic guest-to-account linking:
  -- Count how many existing unlinked student rows have this exact email
  SELECT COUNT(*)
  INTO v_unlinked_count
  FROM public.students
  WHERE lower(trim(email)) = v_clean_email AND auth_user_id IS NULL;

  IF v_unlinked_count = 1 THEN
    SELECT id
    INTO v_existing_student_id
    FROM public.students
    WHERE lower(trim(email)) = v_clean_email AND auth_user_id IS NULL
    LIMIT 1;
  END IF;

  -- Only link if exactly 1 unlinked record exists and no student is already linked to this auth_user_id
  IF v_unlinked_count = 1 AND v_existing_student_id IS NOT NULL THEN
    UPDATE public.students
    SET auth_user_id = new.id,
        updated_at = timezone('utc'::text, now())
    WHERE id = v_existing_student_id AND auth_user_id IS NULL;
  ELSIF v_unlinked_count = 0 THEN
    -- No unlinked record exists: create a single new student profile linked to new.id
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = new.id) THEN
      INSERT INTO public.students (
        auth_user_id,
        name,
        email,
        status,
        timezone,
        learner_type,
        current_level
      ) VALUES (
        new.id,
        v_user_name,
        v_clean_email,
        'active',
        'UTC',
        'adult',
        'beginner'
      );
    END IF;
  ELSE
    -- Ambiguous duplicate records exist (v_unlinked_count > 1).
    -- DO NOT auto-link to avoid unintended account takeover.
    -- Insert a separate profile linked to new.id, preserving historical records for teacher review.
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE auth_user_id = new.id) THEN
      INSERT INTO public.students (
        auth_user_id,
        name,
        email,
        status,
        timezone,
        learner_type,
        current_level
      ) VALUES (
        new.id,
        v_user_name,
        v_clean_email,
        'active',
        'UTC',
        'adult',
        'beginner'
      );
    END IF;
  END IF;

  RETURN new;
END;
$$;

-- 3. Replace trigger with clean dynamic trigger (no hardcoded email list in WHEN clause)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_student_user();

-- 4. RLS Policies for Students
-- Ensure Student Policies coexist safely with Teacher Allowlist policies
-- Dropping old versions if present to ensure clean idempotent state
DROP POLICY IF EXISTS "Students can view their own profile" ON public.students;
CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT
  USING (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Students can update their own profile" ON public.students;
CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

DROP POLICY IF EXISTS "Students can view their own bookings" ON public.bookings;
CREATE POLICY "Students can view their own bookings" ON public.bookings
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can view their own guardians" ON public.guardians;
CREATE POLICY "Students can view their own guardians" ON public.guardians
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can view their own student goals" ON public.student_goals;
CREATE POLICY "Students can view their own student goals" ON public.student_goals
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can view their own lesson sessions" ON public.lesson_sessions;
CREATE POLICY "Students can view their own lesson sessions" ON public.lesson_sessions
  FOR SELECT
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  ));
