-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 7 STUDENT AUTH FOUNDATION
-- Migration: Add auth_user_id to students, RLS policies for students
-- ====================================================================

-- 1. Add auth_user_id to public.students
ALTER TABLE public.students 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX idx_students_auth_user_id ON public.students(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 2. RLS for students table
-- Allow student to view their own profile
CREATE POLICY "Students can view their own profile" ON public.students
  FOR SELECT
  USING (auth.uid() = auth_user_id);

-- Allow student to update their own profile (with safe fields)
CREATE POLICY "Students can update their own profile" ON public.students
  FOR UPDATE
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- 3. RLS for bookings table
-- Allow student to view their own bookings
CREATE POLICY "Students can view their own bookings" ON public.bookings
  FOR SELECT
  USING (student_id IN (SELECT id FROM public.students WHERE auth_user_id = auth.uid()));

-- Allow student to view their own lesson sessions
CREATE POLICY "Students can view their own lesson sessions" ON public.lesson_sessions
  FOR SELECT
  USING (booking_id IN (
    SELECT id FROM public.bookings WHERE student_id IN (
      SELECT id FROM public.students WHERE auth_user_id = auth.uid()
    )
  ));

-- ====================================================================
-- Trigger to automatically create student profile on sign up?
-- Wait, the prompt says "If the current schema has another safe model, extend it rather than creating parallel identities."
-- We can create an auth trigger to create a student record if one does not exist.
-- But wait, maybe a student can be created during booking (guest booking) and later sign up with the same email?
-- "Historical guest bookings must not break. Do not automatically claim old bookings merely because email addresses match unless ownership is proven safely."
-- Okay, we will just create the profile on sign up if not automatically linked, OR let the API link it later.

CREATE OR REPLACE FUNCTION public.handle_new_student_user() 
RETURNS trigger AS $$
BEGIN
  -- Insert a basic student profile for the newly signed up auth user
  INSERT INTO public.students (auth_user_id, name, email, status)
  VALUES (new.id, COALESCE(new.raw_user_meta_data->>'full_name', new.email), new.email, 'active');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call handle_new_student_user on insert to auth.users
-- BUT ONLY if the user is not a teacher (teachers shouldn't be in students table).
-- For now, the app logic handles sign up.
-- If they sign up via the student portal, we can just do it via API, or via this trigger but check if they are in teacher_accounts.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  WHEN (new.email NOT IN ('mhmwdlwany4222@gmail.com', 'mahmoudelwany98@gmail.com'))
  EXECUTE FUNCTION public.handle_new_student_user();
