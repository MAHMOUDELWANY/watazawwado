-- ====================================================================
-- Migration: Phase 05 — AI Intake, Service Assessment & Pricing Recommendation
-- File: supabase/migrations/20261003000000_phase05_ai_intake_and_pricing.sql
--
-- Purpose:
--   Introduce the MINIMUM new entities required for the AI intake +
--   intelligent pricing feature, on top of the existing package /
--   entitlement / booking foundation. This migration does NOT touch the
--   package_catalog / package_entitlements / package_credit_ledger tables.
--
-- Design notes:
--   * Three tables only:
--       1. student_intakes        — intake conversation + structured profile
--                                    + service assessment + pricing recommendation
--                                    (immutable snapshot per intake).
--       2. learning_offers        — the AUTHORITATIVE teacher-approved offer,
--                                    separate from the AI recommendation.
--       3. intake_review_events   — append-only audit of teacher review actions.
--   * The AI recommendation is stored as a snapshot separate from the approved
--     offer, so authority is never ambiguous and remains auditable.
--   * All WRITES occur via server-side (service_role) endpoints. RLS grants
--     SELECT-only to the owning student; teacher allowlist gets access.
--   * Foreign keys reference only tables whose DDL is confirmed present:
--     auth.users, public.students, public.services.
-- ====================================================================

-- --------------------------------------------------------------------
-- 1. STUDENT INTAKES
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.student_intakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Ownership follows the existing Watazawwado identity model:
    --   auth.uid() -> students.auth_user_id -> students.id
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learner_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'awaiting_teacher_review', 'offer_ready', 'closed')),

    -- Natural conversation transcript (role/content pairs). Contains no
    -- sensitive data beyond what the student voluntarily shared.
    conversation JSONB NOT NULL DEFAULT '[]'::jsonb,

    -- Structured Student Learning Profile (student-stated + inferred, with
    -- explicit uncertainty flags). Only information actually known.
    learning_profile JSONB DEFAULT NULL,

    -- Structured categorical Service Assessment (NO monetary fields).
    assessment JSONB DEFAULT NULL,

    -- Deterministic Pricing Recommendation snapshot produced by the server
    -- pricing engine. Immutable record of what the AI/RULES recommended.
    pricing_recommendation JSONB DEFAULT NULL,

    -- Denormalised convenience flags (kept in sync by the server).
    service_category TEXT CHECK (service_category IN ('quran', 'islamic_studies', 'arabic', 'english')),
    teacher_review_required BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_student_intakes_auth_user ON public.student_intakes(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_student_intakes_learner ON public.student_intakes(learner_student_id);
CREATE INDEX IF NOT EXISTS idx_student_intakes_status ON public.student_intakes(status);

-- --------------------------------------------------------------------
-- 2. LEARNING OFFERS (Authoritative teacher-approved offer)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.learning_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES public.student_intakes(id) ON DELETE CASCADE,

    -- Denormalised ownership for RLS/perf (mirrors the intake owner).
    auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    learner_student_id UUID REFERENCES public.students(id) ON DELETE SET NULL,

    service_category TEXT NOT NULL CHECK (service_category IN ('quran', 'islamic_studies', 'arabic', 'english')),
    service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
    duration_minutes INTEGER NOT NULL CHECK (duration_minutes IN (30, 45, 60)),

    -- The AI/rule recommendation snapshot (for auditability). NEVER authoritative.
    recommended_price_usd NUMERIC(10, 2),
    recommended_tier TEXT,

    -- The approved price. This is the AUTHORITATIVE amount.
    approved_price_usd NUMERIC(10, 2) NOT NULL CHECK (approved_price_usd >= 0),
    -- True when the teacher changed the price away from the recommendation.
    teacher_adjusted BOOLEAN NOT NULL DEFAULT false,

    -- Legitimate, transparent offer/discount (optional). Null when none.
    offer JSONB DEFAULT NULL,

    status TEXT NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'offered', 'accepted', 'declined', 'withdrawn')),

    -- Private teacher rationale/notes. Never exposed to the student.
    teacher_notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    offered_at TIMESTAMPTZ,
    decided_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_learning_offers_intake ON public.learning_offers(intake_id);
CREATE INDEX IF NOT EXISTS idx_learning_offers_auth_user ON public.learning_offers(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_learning_offers_status ON public.learning_offers(status);

-- --------------------------------------------------------------------
-- 3. INTAKE REVIEW EVENTS (append-only teacher audit trail)
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.intake_review_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intake_id UUID NOT NULL REFERENCES public.student_intakes(id) ON DELETE CASCADE,
    offer_id UUID REFERENCES public.learning_offers(id) ON DELETE SET NULL,
    teacher_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('approve', 'adjust', 'request_more_info')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_intake_review_events_intake ON public.intake_review_events(intake_id);

-- --------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY
-- --------------------------------------------------------------------
ALTER TABLE public.student_intakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_review_events ENABLE ROW LEVEL SECURITY;

-- Helper predicate: is the current auth user an active teacher (allowlist)?
-- Expressed inline to match the existing phase-5g pattern (no new functions).

-- 4a. student_intakes: owner may read their own intake.
DROP POLICY IF EXISTS "Students read own intakes" ON public.student_intakes;
CREATE POLICY "Students read own intakes"
    ON public.student_intakes FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid());

-- 4a. student_intakes: teacher allowlist full access.
DROP POLICY IF EXISTS "Teacher allowlist access to student_intakes" ON public.student_intakes;
CREATE POLICY "Teacher allowlist access to student_intakes"
    ON public.student_intakes FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));

-- No direct browser INSERT/UPDATE/DELETE by students. All writes are
-- server-authoritative (service_role) through validated endpoints.

-- 4b. learning_offers: student may read only offers already presented to them.
DROP POLICY IF EXISTS "Students read own presented offers" ON public.learning_offers;
CREATE POLICY "Students read own presented offers"
    ON public.learning_offers FOR SELECT
    TO authenticated
    USING (auth_user_id = auth.uid() AND status IN ('offered', 'accepted'));

-- 4b. learning_offers: teacher allowlist full access.
DROP POLICY IF EXISTS "Teacher allowlist access to learning_offers" ON public.learning_offers;
CREATE POLICY "Teacher allowlist access to learning_offers"
    ON public.learning_offers FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));

-- 4c. intake_review_events: teacher-private. No student policy at all.
DROP POLICY IF EXISTS "Teacher allowlist access to intake_review_events" ON public.intake_review_events;
CREATE POLICY "Teacher allowlist access to intake_review_events"
    ON public.intake_review_events FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true))
    WITH CHECK (EXISTS (SELECT 1 FROM public.teacher_accounts WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true));

-- --------------------------------------------------------------------
-- 5. updated_at triggers (reuse existing pattern if present)
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_student_intakes_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_student_intakes_updated_at ON public.student_intakes;
CREATE TRIGGER trg_student_intakes_updated_at
    BEFORE UPDATE ON public.student_intakes
    FOR EACH ROW EXECUTE FUNCTION public.touch_student_intakes_updated_at();

CREATE OR REPLACE FUNCTION public.touch_learning_offers_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at := timezone('utc'::text, now());
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_learning_offers_updated_at ON public.learning_offers;
CREATE TRIGGER trg_learning_offers_updated_at
    BEFORE UPDATE ON public.learning_offers
    FOR EACH ROW EXECUTE FUNCTION public.touch_learning_offers_updated_at();
