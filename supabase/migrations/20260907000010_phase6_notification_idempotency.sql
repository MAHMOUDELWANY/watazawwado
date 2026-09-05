-- Phase 6: Notification Idempotency

CREATE TABLE IF NOT EXISTS public.notification_events (
    idempotency_key TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sending', 'sent', 'failed')),
    message_id TEXT,
    error_details TEXT,
    sending_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.notification_events ENABLE ROW LEVEL SECURITY;

-- Only server-role can access this table
CREATE POLICY "Service role can manage notification events" 
    ON public.notification_events 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

