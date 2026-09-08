const fs = require('fs');

// 1. Fix syncEngine.ts
let syncEngine = fs.readFileSync('server/integrations/syncEngine.ts', 'utf8');

// check deleteZoomMeeting import
if (!syncEngine.includes('deleteZoomMeeting')) {
    syncEngine = syncEngine.replace("import { updateZoomMeeting } from './zoom.js';", "import { updateZoomMeeting, deleteZoomMeeting } from './zoom.js';");
}
if (!syncEngine.includes('deleteZoomMeeting')) {
    syncEngine = syncEngine.replace("import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from './googleCalendar.js';", "import { createGoogleCalendarEvent, deleteGoogleCalendarEvent, updateGoogleCalendarEvent } from './googleCalendar.js';\nimport { updateZoomMeeting, deleteZoomMeeting } from './zoom.js';");
}

fs.writeFileSync('server/integrations/syncEngine.ts', syncEngine);

// 2. Fix worker.ts selects
let worker = fs.readFileSync('server/integrations/worker.ts', 'utf8');

worker = worker.replace(
  "select('reference_code, status, scheduled_start, student_timezone, service_name, student_name, contact_name, contact_email, contact_whatsapp')",
  "select('id, reference_code, status, scheduled_start, student_timezone, service_name, student_name, contact_name, contact_email, contact_whatsapp')"
);

worker = worker.replace(
  "select('reference_code, status, scheduled_start, scheduled_end, cairo_time_display')",
  "select('id, reference_code, status, scheduled_start, scheduled_end, student_timezone, service_name, student_name, contact_name, contact_email, contact_whatsapp, cairo_time_display')"
);

fs.writeFileSync('server/integrations/worker.ts', worker);

