-- Phase 6: Atomic Notification Claim & Reminders Reliability

-- Ensure uniqueness for reminders to prevent duplicate scheduling
ALTER TABLE public.reminders ADD CONSTRAINT unique_booking_reminder UNIQUE (booking_id, reminder_type);

-- Phase 6: Atomic Notification Claim
CREATE OR REPLACE FUNCTION claim_notification_event(p_key TEXT, p_type TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
  v_sending_at TIMESTAMPTZ;
BEGIN
  -- Attempt to insert
  INSERT INTO public.notification_events (idempotency_key, event_type, status, sending_at)
  VALUES (p_key, p_type, 'sending', now())
  ON CONFLICT (idempotency_key) DO UPDATE
  SET status = 'sending', sending_at = now()
  WHERE public.notification_events.status = 'failed' 
     OR (public.notification_events.status = 'sending' AND public.notification_events.sending_at < now() - interval '5 minutes')
  RETURNING status INTO v_status;

  IF FOUND THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Phase 6: Atomic Reminder Processing Claim
CREATE OR REPLACE FUNCTION claim_reminder(p_reminder_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status TEXT;
BEGIN
  UPDATE public.reminders
  SET status = 'processing', created_at = now() -- We use created_at roughly as lease timestamp for this lock if needed, but not strictly required
  WHERE id = p_reminder_id AND status = 'pending'
  RETURNING status INTO v_status;
  
  IF FOUND THEN
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
