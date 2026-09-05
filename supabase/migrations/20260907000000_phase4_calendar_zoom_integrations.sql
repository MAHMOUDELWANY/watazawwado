-- ====================================================================
-- MAHMOUD TEACHING PLATFORM — PHASE 4: CALENDAR & ZOOM INTEGRATIONS
-- Migration: 20260907000000_phase4_calendar_zoom_integrations.sql
-- ====================================================================

-- 1. ADD INTEGRATION COLUMNS TO BOOKINGS
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS google_calendar_event_id TEXT,
ADD COLUMN IF NOT EXISTS zoom_meeting_id TEXT,
ADD COLUMN IF NOT EXISTS integration_status TEXT DEFAULT 'pending' CHECK (integration_status IN ('pending', 'synced', 'failed', 'cancelled')),
ADD COLUMN IF NOT EXISTS sync_metadata JSONB DEFAULT '{}'::jsonb;

-- Create index on external event id for rapid webhook/event reconciliation
CREATE INDEX IF NOT EXISTS idx_bookings_gcal_event ON public.bookings(google_calendar_event_id) WHERE google_calendar_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bookings_integration_status ON public.bookings(integration_status);

-- 2. ENSURE CALENDAR CONNECTIONS TABLE CONTAINS PROVIDER METADATA
CREATE TABLE IF NOT EXISTS public.calendar_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL DEFAULT 'google_calendar',
    account_email TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Index on provider & active status
CREATE INDEX IF NOT EXISTS idx_calendar_connections_active ON public.calendar_connections(provider, is_active);

-- Enable RLS on calendar_connections
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

-- 3. RLS POLICIES FOR CALENDAR CONNECTIONS
DROP POLICY IF EXISTS "Public cannot read calendar connections" ON public.calendar_connections;
DROP POLICY IF EXISTS "Teacher can view and manage calendar connections" ON public.calendar_connections;

-- Deny all public anon queries
CREATE POLICY "Public cannot read calendar connections"
ON public.calendar_connections
FOR SELECT
TO anon
USING (false);

-- Teacher authenticated full access
CREATE POLICY "Teacher can view and manage calendar connections"
ON public.calendar_connections
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. UPDATE ATOMIC BOOKING FUNCTION TO RETURN INTEGRATION FIELDS
CREATE OR REPLACE FUNCTION public.get_booking_management(
    p_reference_code TEXT,
    p_management_token TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_ref TEXT;
    v_clean_token TEXT;
    v_booking RECORD;
    v_service RECORD;
BEGIN
    v_clean_ref := upper(trim(COALESCE(p_reference_code, '')));
    v_clean_token := trim(COALESCE(p_management_token, ''));

    IF v_clean_ref = '' AND v_clean_token = '' THEN
        RAISE EXCEPTION 'A reference code or management token is required.';
    END IF;

    -- Lookup booking
    SELECT *
    INTO v_booking
    FROM public.bookings
    WHERE (v_clean_token <> '' AND management_token = v_clean_token)
       OR (v_clean_token = '' AND upper(reference_code) = v_clean_ref)
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'No matching booking found for the provided management credentials.';
    END IF;

    -- Lookup service title
    SELECT s.title, s.arabic_title
    INTO v_service
    FROM public.services s
    WHERE s.id = v_booking.service_id;

    -- Return strictly sanitized data including integration details
    RETURN jsonb_build_object(
        'reference', v_booking.reference_code,
        'managementToken', v_booking.management_token,
        'serviceId', v_booking.service_id,
        'serviceName', COALESCE(v_service.title, '1-on-1 Lesson'),
        'serviceArabicName', COALESCE(v_service.arabic_title, 'درس فردي'),
        'learnerName', v_booking.contact_name,
        'parentName', v_booking.parent_name,
        'scheduledIsoDatetime', v_booking.scheduled_start,
        'scheduledEndIsoDatetime', v_booking.scheduled_end,
        'durationMinutes', v_booking.duration_minutes,
        'timezone', v_booking.student_timezone,
        'cairoTimeDisplay', v_booking.cairo_time_display,
        'mode', v_booking.booking_type,
        'status', v_booking.status,
        'feeAmountUsd', v_booking.fee_amount_usd,
        'zoomMeetingLink', v_booking.zoom_meeting_link,
        'zoomMeetingId', v_booking.zoom_meeting_id,
        'googleCalendarEventId', v_booking.google_calendar_event_id,
        'integrationStatus', COALESCE(v_booking.integration_status, 'pending')
    );
END;
$$;

-- 5. RPC FUNCTION TO UPDATE BOOKING INTEGRATION SYNC STATUS
CREATE OR REPLACE FUNCTION public.update_booking_integration_status(
    p_reference_code TEXT,
    p_google_event_id TEXT DEFAULT NULL,
    p_zoom_meeting_id TEXT DEFAULT NULL,
    p_zoom_meeting_link TEXT DEFAULT NULL,
    p_integration_status TEXT DEFAULT 'synced',
    p_sync_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_clean_ref TEXT;
    v_booking RECORD;
BEGIN
    v_clean_ref := upper(trim(COALESCE(p_reference_code, '')));
    
    SELECT *
    INTO v_booking
    FROM public.bookings
    WHERE upper(reference_code) = v_clean_ref
    LIMIT 1;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Booking not found with reference: %', v_clean_ref;
    END IF;

    UPDATE public.bookings
    SET google_calendar_event_id = COALESCE(p_google_event_id, google_calendar_event_id),
        zoom_meeting_id = COALESCE(p_zoom_meeting_id, zoom_meeting_id),
        zoom_meeting_link = COALESCE(p_zoom_meeting_link, zoom_meeting_link),
        integration_status = COALESCE(p_integration_status, integration_status),
        sync_metadata = v_booking.sync_metadata || COALESCE(p_sync_metadata, '{}'::jsonb),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_booking.id;

    RETURN jsonb_build_object(
        'success', true,
        'reference', v_booking.reference_code,
        'integrationStatus', p_integration_status,
        'googleEventId', COALESCE(p_google_event_id, v_booking.google_calendar_event_id),
        'zoomMeetingLink', COALESCE(p_zoom_meeting_link, v_booking.zoom_meeting_link)
    );
END;
$$;
