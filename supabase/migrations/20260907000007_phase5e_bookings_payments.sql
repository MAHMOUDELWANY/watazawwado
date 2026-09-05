-- ====================================================================
-- Phase 5E: Bookings & Payments Teacher Operations
-- ====================================================================

-- 1. Ensure payments check constraint supports 'rejected' status
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE public.payments ADD CONSTRAINT payments_status_check CHECK (status IN ('pending', 'confirmed', 'rejected', 'refunded'));

-- 2. Add performance indexes for bookings filtering and payments queries
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_start ON public.bookings(scheduled_start);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_bookings_reference_code ON public.bookings(reference_code);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_type ON public.bookings(booking_type);

CREATE INDEX IF NOT EXISTS idx_payments_booking_id ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON public.payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_confirmed_at ON public.payments(confirmed_at);
