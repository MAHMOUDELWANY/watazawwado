const fs = require('fs');
let engine = fs.readFileSync('server/integrations/syncEngine.ts', 'utf8');

engine = engine.replace(
/    if \(booking\?\.google_calendar_event_id\) \{[\s\S]*?\}\n    \}\n\n    if \(zoomError && !zoomError\.message\.includes\('NOT_FOUND'\)\) throw zoomError;/m,
`    if (booking?.google_calendar_event_id) {
      const googleConn = await getActiveGoogleConnection();
      if (googleConn?.accessToken) {
        await updateGoogleCalendarEvent(
          googleConn.accessToken,
          booking.google_calendar_event_id,
          newStartUtc,
          newEndUtc,
          cairoTimeDisplay
        );
      }
    }

    if (booking?.zoom_meeting_id && !booking.zoom_meeting_id.startsWith('fallback-') && !booking.zoom_meeting_id.startsWith('room-')) {
      try {
        await updateZoomMeeting(booking.zoom_meeting_id, {
          start_time: newStartUtc,
          duration: booking.duration_minutes
        });
      } catch (zErr: any) {
        console.warn('[syncRescheduledBooking] Zoom update warning', zErr);
        zoomError = zErr;
      }
    }

    if (zoomError && !zoomError.message.includes('NOT_FOUND')) throw zoomError;`
);

fs.writeFileSync('server/integrations/syncEngine.ts', engine);
