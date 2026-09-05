-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 6 MICRO CLOSURE MIGRATION
-- File: supabase/migrations/20260907000011_phase6_micro_closure.sql
-- Role: Durable claim ownership, tokenized finalization, lease timestamps,
--       and atomic claim/finalize RPCs for notifications and reminders.
-- ====================================================================

-- 1. NOTIFICATION EVENTS: Add durable claim token
ALTER TABLE public.notification_events 
    ADD COLUMN IF NOT EXISTS claim_token TEXT;

-- 2. REMINDERS: Add processing lease timestamp and durable claim token
ALTER TABLE public.reminders 
    ADD COLUMN IF NOT EXISTS processing_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS claim_token TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now());

-- Update status constraint on reminders to explicitly include 'processing'
DO $$
BEGIN
    ALTER TABLE public.reminders DROP CONSTRAINT IF EXISTS reminders_status_check;
    ALTER TABLE public.reminders ADD CONSTRAINT reminders_status_check 
        CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. NOTIFICATION CLAIM RPC: Tokenized Atomic Claim with Lease Expiration
DROP FUNCTION IF EXISTS public.claim_notification_event(TEXT, TEXT);
DROP FUNCTION IF EXISTS claim_notification_event(TEXT, TEXT);

CREATE OR REPLACE FUNCTION claim_notification_event(p_key TEXT, p_type TEXT)
RETURNS JSONB AS $$
DECLARE
  v_token TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_stale_threshold TIMESTAMPTZ := v_now - interval '5 minutes';
  v_updated_token TEXT;
BEGIN
  v_token := gen_random_uuid()::text;

  -- Attempt insert for new event or reclaim failed / stale sending event
  INSERT INTO public.notification_events (idempotency_key, event_type, status, claim_token, sending_at, updated_at)
  VALUES (p_key, p_type, 'sending', v_token, v_now, v_now)
  ON CONFLICT (idempotency_key) DO UPDATE
  SET status = 'sending',
      claim_token = v_token,
      sending_at = v_now,
      updated_at = v_now
  WHERE public.notification_events.status = 'failed'
     OR (public.notification_events.status = 'sending' AND (public.notification_events.sending_at IS NULL OR public.notification_events.sending_at < v_stale_threshold))
  RETURNING claim_token INTO v_updated_token;

  IF FOUND AND v_updated_token = v_token THEN
    RETURN jsonb_build_object('claimed', true, 'claim_token', v_token);
  END IF;

  RETURN jsonb_build_object('claimed', false, 'claim_token', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. NOTIFICATION FINALIZE RPC: Token-verified finalization
CREATE OR REPLACE FUNCTION finalize_notification_event(
  p_key TEXT,
  p_token TEXT,
  p_status TEXT,
  p_message_id TEXT DEFAULT NULL,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_rows INT;
BEGIN
  IF p_status NOT IN ('sent', 'failed') THEN
    RAISE EXCEPTION 'Invalid finalization status: %', p_status;
  END IF;

  IF p_token IS NULL OR p_token = '' THEN
    RETURN FALSE;
  END IF;

  IF p_status = 'sent' THEN
    UPDATE public.notification_events
    SET status = 'sent',
        message_id = COALESCE(p_message_id, message_id),
        error_details = NULL,
        sending_at = NULL,
        claim_token = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE idempotency_key = p_key
      AND claim_token = p_token
      AND status = 'sending';
  ELSE
    UPDATE public.notification_events
    SET status = 'failed',
        error_details = p_error,
        sending_at = NULL,
        claim_token = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE idempotency_key = p_key
      AND claim_token = p_token
      AND status = 'sending';
  END IF;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. REMINDER CLAIM RPC: Tokenized Atomic Claim with Lease Expiration
DROP FUNCTION IF EXISTS public.claim_reminder(UUID);
DROP FUNCTION IF EXISTS claim_reminder(UUID);

CREATE OR REPLACE FUNCTION claim_reminder(p_reminder_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_token TEXT;
  v_now TIMESTAMPTZ := timezone('utc'::text, now());
  v_stale_threshold TIMESTAMPTZ := v_now - interval '5 minutes';
  v_updated_token TEXT;
BEGIN
  v_token := gen_random_uuid()::text;

  UPDATE public.reminders
  SET status = 'processing',
      processing_at = v_now,
      claim_token = v_token,
      updated_at = v_now
  WHERE id = p_reminder_id
    AND (
      status = 'pending'
      OR (status = 'processing' AND (processing_at IS NULL OR processing_at < v_stale_threshold))
    )
  RETURNING claim_token INTO v_updated_token;

  IF FOUND AND v_updated_token = v_token THEN
    RETURN jsonb_build_object('claimed', true, 'claim_token', v_token);
  END IF;

  RETURN jsonb_build_object('claimed', false, 'claim_token', null);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. REMINDER FINALIZE RPC: Token-verified reminder finalization
CREATE OR REPLACE FUNCTION finalize_reminder(
  p_reminder_id UUID,
  p_token TEXT,
  p_status TEXT,
  p_error TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated_rows INT;
BEGIN
  IF p_status NOT IN ('sent', 'failed', 'cancelled') THEN
    RAISE EXCEPTION 'Invalid reminder finalization status: %', p_status;
  END IF;

  IF p_status = 'sent' THEN
    UPDATE public.reminders
    SET status = 'sent',
        sent_at = timezone('utc'::text, now()),
        error_info = NULL,
        processing_at = NULL,
        claim_token = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_reminder_id
      AND claim_token = p_token
      AND status = 'processing';
  ELSIF p_status = 'failed' THEN
    UPDATE public.reminders
    SET status = 'failed',
        error_info = p_error,
        processing_at = NULL,
        claim_token = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_reminder_id
      AND claim_token = p_token
      AND status = 'processing';
  ELSIF p_status = 'cancelled' THEN
    UPDATE public.reminders
    SET status = 'cancelled',
        processing_at = NULL,
        claim_token = NULL,
        updated_at = timezone('utc'::text, now())
    WHERE id = p_reminder_id
      AND (claim_token = p_token OR p_token IS NULL OR status = 'pending');
  END IF;

  GET DIAGNOSTICS v_updated_rows = ROW_COUNT;
  RETURN v_updated_rows > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
