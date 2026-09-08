const fs = require('fs');

const file = 'api/index.ts';
let code = fs.readFileSync(file, 'utf8');

const startIdx = code.indexOf("app.post('/api/integrations/sync-booking'");
const endIdx = code.indexOf("});\n\n// 8. INTEGRATIONS: RESCHEDULE EVENT SYNC");

if (startIdx !== -1 && endIdx !== -1) {
    const replacementStr = `app.post('/api/integrations/sync-booking', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking || !booking.referenceCode || !booking.managementToken) {
      return res.status(400).json({ error: 'Invalid booking data for synchronization.' });
    }

    const isAuth = await verifyManagementToken(booking.referenceCode, booking.managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Option B: Fast-path. Trigger the outbox worker immediately for faster UI feedback
    await processIntegrationJobs(2); // Process small batch to return quickly

    // Fetch the updated booking to return the latest zoom link
    const supabase = getSupabaseAdminClient();
    if (supabase) {
        const { data: b } = await supabase.from('bookings').select('zoom_meeting_link, google_calendar_event_id, integration_status').eq('reference_code', booking.referenceCode).maybeSingle();
        if (b) {
            return res.json({
                zoomMeetingLink: b.zoom_meeting_link,
                googleEventId: b.google_calendar_event_id,
                integrationStatus: b.integration_status
            });
        }
    }

    res.json({ integrationStatus: 'pending' });
  } catch (error: any) {
    console.error('Sync booking fast-path error:', error);
    res.json({ integrationStatus: 'pending' });
  }
});`;
    
    code = code.substring(0, startIdx) + replacementStr + code.substring(endIdx + 3);
    fs.writeFileSync(file, code, 'utf8');
    console.log('Replaced successfully');
} else {
    console.log('Not found: ', startIdx, endIdx);
}
