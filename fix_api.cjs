const fs = require('fs');

let api = fs.readFileSync('api/index.ts', 'utf8');

api = api.replace(
/app\.post\('\/api\/integrations\/cancel', async \(req, res\) => \{[\s\S]*?res\.status\(500\)\.json\(\{ error: 'Failed to sync cancelled event.', code: 'CANCEL_SYNC_FAILED' \}\);\n  \}\n\}\);/m,
`app.post('/api/integrations/cancel', async (req, res) => {
  try {
    const { referenceCode, managementToken } = req.body;
    if (!referenceCode || !managementToken) {
      return res.status(400).json({ error: 'Missing reference code or token.' });
    }

    const isAuth = await verifyManagementToken(referenceCode, managementToken);
    if (!isAuth) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Trigger worker asynchronously to process the job
    processIntegrationJobs().catch(err => console.error('[Fast-path cancel error]', err));

    return res.status(202).json({ success: true, message: 'Cancellation job queued for background processing.' });
  } catch (error: any) {
    console.error('Cancel sync error:', error);
    res.status(500).json({ error: 'Failed to queue cancelled event.', code: 'CANCEL_QUEUE_FAILED' });
  }
});`
);

// Fix the dashboard patch routes
api = api.replace(
/      \/\/ Handle cancellation: safe external sync\n      if \(status === 'cancelled'\) \{\n        updatePayload\.cancellation_reason = cancellation_reason \|\| 'Cancelled by teacher';\n        \/\/ Remove Google Calendar event if synced\n        if \(existingBooking\.reference_code\) \{\n          try \{\n            await syncCancelledBooking\(existingBooking\.reference_code\);\n          \} catch \(syncErr\) \{\n            console\.warn\('\[Sync Cancel Warning\]', syncErr\);\n          \}\n        \}\n      \}/m,
`      // Handle cancellation: safe external sync
      if (status === 'cancelled') {
        updatePayload.cancellation_reason = cancellation_reason || 'Cancelled by teacher';
        // Add durable integration job
        const { error: jobErr } = await supabase.from('integration_jobs').upsert({
          booking_id: id,
          job_type: 'booking_cancel',
          status: 'pending'
        }, { onConflict: 'booking_id,job_type' });
        if (jobErr) console.warn('[Cancel Job Warning]', jobErr);
        
        processIntegrationJobs().catch(err => console.error('[Teacher Cancel job process error]', err));
      }`
);

api = api.replace(
/      \/\/ Sync reschedule with Google Calendar\n      if \(existingBooking\.reference_code\) \{\n        try \{\n          await syncRescheduledBooking\(\n            existingBooking\.reference_code,\n            scheduled_start,\n            scheduled_end,\n            cairo_time_display \|\| existingBooking\.cairo_time_display\n          \);\n        \} catch \(syncErr\) \{\n          console\.warn\('\[Sync Reschedule Warning\]', syncErr\);\n        \}\n      \}/m,
`      // Add durable integration job for reschedule
      const { error: jobErr } = await supabase.from('integration_jobs').upsert({
        booking_id: id,
        job_type: 'booking_reschedule',
        status: 'pending'
      }, { onConflict: 'booking_id,job_type' });
      if (jobErr) console.warn('[Reschedule Job Warning]', jobErr);

      processIntegrationJobs().catch(err => console.error('[Teacher Reschedule job process error]', err));`
);

fs.writeFileSync('api/index.ts', api);
