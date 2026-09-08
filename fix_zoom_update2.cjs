const fs = require('fs');
let engine = fs.readFileSync('server/integrations/syncEngine.ts', 'utf8');

engine = engine.replace(
/        await updateZoomMeeting\(booking\.zoom_meeting_id, \{\n          start_time: newStartUtc,\n          duration: booking\.duration_minutes\n        \}\);/m,
`        await updateZoomMeeting(booking.zoom_meeting_id, {
          scheduledStartUtc: newStartUtc,
          durationMinutes: booking.duration_minutes || 60
        });`
);

fs.writeFileSync('server/integrations/syncEngine.ts', engine);
