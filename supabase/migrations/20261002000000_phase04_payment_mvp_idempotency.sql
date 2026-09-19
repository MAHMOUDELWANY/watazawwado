-- ====================================================================
-- Migration: Phase 04-A Payment MVP Idempotency
-- Purpose:
-- 1. Add entitlement_id foreign key to public.payments
-- 2. Add Exactly-One-Target constraint on payments (booking_id OR entitlement_id)
-- ====================================================================

ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS entitlement_id UUID REFERENCES public.package_entitlements(id) ON DELETE SET NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'payments_exactly_one_target_check'
    ) THEN
        ALTER TABLE public.payments
        ADD CONSTRAINT payments_exactly_one_target_check
        CHECK (
            (booking_id IS NOT NULL AND entitlement_id IS NULL) OR
            (entitlement_id IS NOT NULL AND booking_id IS NULL)
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payments_entitlement_id ON public.payments(entitlement_id);
