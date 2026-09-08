const fs = require('fs');

const file = 'api/index.ts';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `app.post('/api/integrations/sync-booking', async (req, res) => {
  try {
    const { booking } = req.body;
    if (!booking || !booking.referenceCode || !booking.scheduledStart || !booking.managementToken) {
      return res.status(400).json({ error: 'Invalid booking data for synchronization.' });
    }

    const isAuth = await verifyManagementToken(booking.referenceCode, booking.managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const syncResult = await syncBookingIntegrations(booking);

    // Schedule idempotent 24h & 1h reminders and dispatch notification asynchronously
    try {
      const isTrial = booking.mode === 'trial' || booking.booking_type === 'trial';
      const scheduledStartIso = booking.scheduledStart;
      const scheduledEndIso = booking.scheduledEnd || (scheduledStartIso && booking.durationMinutes
        ? DateTime.fromISO(scheduledStartIso).plus({ minutes: booking.durationMinutes }).toISO()
        : scheduledStartIso);
      const studentTz = booking.studentTimezone || 'Africa/Cairo';
      const startLuxon = DateTime.fromISO(scheduledStartIso).setZone(studentTz);
      
      await scheduleBookingReminders({
        id: booking.id || booking.referenceCode,
        scheduledStartUtc: scheduledStartIso,
        referenceCode: booking.referenceCode
      });
      
      await dispatchNotification({
        eventType: isTrial ? 'TRIAL_BOOKED' : 'BOOKING_CONFIRMED',
        booking: {
          id: booking.id,
          referenceCode: booking.referenceCode,
          serviceName: booking.serviceName || (isTrial ? 'Free Trial Lesson' : '1-on-1 Lesson'),
          learnerName: booking.learnerName || booking.studentName || 'Student',
          contactEmail: booking.contactEmail,
          contactWhatsapp: booking.contactWhatsapp || null,
          date: startLuxon.toFormat('cccc, MMMM d, yyyy'),
          timeDisplay: startLuxon.toFormat('hh:mm a'),
          timezone: studentTz,
          durationMinutes: booking.durationMinutes || (isTrial ? 30 : 60),
          zoomLink: syncResult.zoomMeetingLink || booking.zoomMeetingLink || null,
          cairoTimeDisplay: booking.cairoTimeDisplay || null,
          isTrial
        }
      });
    } catch (notifErr) {
      console.error('[Notification/Reminder Setup Error]', notifErr);
    }

    res.json(syncResult);
  } catch (error: any) {
    console.error('Sync booking error:', error);
    res.status(500).json({ error: 'Failed to synchronize booking.', code: 'SYNC_FAILED' });
  }
});`;

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

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replacementStr);
  fs.writeFileSync(file, code, 'utf8');
  console.log('Replaced successfully');
} else {
  console.log('Target string not found');
}
