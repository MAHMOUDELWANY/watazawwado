import fs from 'fs';

let code = fs.readFileSync('api/index.ts', 'utf8');

const startStr = "app.patch('/api/dashboard/bookings/:id', verifyTeacherAuth, async (req, res) => {";
const endStr = "// 16d. DASHBOARD: Fetch all payments with status/unmatched filtering";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx === -1 || endIdx === -1) {
  console.error("Could not find the bounds to replace");
  process.exit(1);
}

const replacement = `app.patch('/api/dashboard/bookings/:id', verifyTeacherAuth, async (req, res) => {
  try {
    const supabase = getSupabaseAdminClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Database integration is not properly configured.' });
    }

    const { id } = req.params;
    const { 
      status, 
      cancellation_reason, 
      notes, 
      scheduled_start, 
      scheduled_end, 
      cairo_time_display,
      covered_material
    } = req.body;

    const { data: existingBooking, error: fetchErr } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchErr || !existingBooking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    // 1. Transactional Cancellation Path
    if (status === 'cancelled') {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('teacher_cancel_booking', {
        p_booking_id: id,
        p_reason: cancellation_reason || 'Cancelled by teacher',
        p_notes: notes || null
      });

      if (rpcErr) {
        console.error('[Teacher Cancel RPC Error]', rpcErr);
        return res.status(500).json({ error: rpcErr.message || 'Failed to cancel booking.' });
      }

      // Best-effort fast path worker trigger AFTER commit
      processIntegrationJobs().catch(err => console.error('[Teacher Cancel job process error]', err));

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking });
    }

    // 2. Transactional Reschedule Path
    if (scheduled_start && scheduled_end) {
      const { data: rpcData, error: rpcErr } = await supabase.rpc('teacher_reschedule_booking', {
        p_booking_id: id,
        p_new_start: scheduled_start,
        p_new_end: scheduled_end,
        p_cairo_time_display: cairo_time_display || null,
        p_notes: notes || null
      });

      if (rpcErr) {
        console.error('[Teacher Reschedule RPC Error]', rpcErr);
        return res.status(500).json({ error: rpcErr.message || 'Failed to reschedule booking.' });
      }

      // Best-effort fast path worker trigger AFTER commit
      processIntegrationJobs().catch(err => console.error('[Teacher Reschedule job process error]', err));

      const { data: updatedBooking } = await supabase.from('bookings').select('*').eq('id', id).single();
      return res.json({ success: true, booking: updatedBooking });
    }

    // 3. Fallback standard update path (for non-lifecycle updates like notes, completion)
    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (notes !== undefined) {
      updatePayload.notes = notes;
    }

    if (status && status !== existingBooking.status) {
      const validStatuses = ['pending', 'confirmed', 'completed', 'no_show'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: \`Invalid status: \${status}\` });
      }
      updatePayload.status = status;

      if (status === 'completed' && existingBooking.student_id) {
        const { data: existingSession } = await supabase
          .from('lesson_sessions')
          .select('id')
          .eq('booking_id', id)
          .maybeSingle();

        if (!existingSession) {
          await supabase.from('lesson_sessions').insert({
            booking_id: id,
            student_id: existingBooking.student_id,
            lesson_date: existingBooking.scheduled_start,
            attendance: 'attended',
            completion_status: 'completed',
            covered_material: covered_material || null
          });
        }
      }
    }

    const { data: updatedBooking, error: updateErr } = await supabase
      .from('bookings')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();

    if (updateErr) {
      console.error('[Update Booking Error]', updateErr);
      return res.status(500).json({ error: updateErr.message || 'Failed to update booking.' });
    }

    res.json({ success: true, booking: updatedBooking });
  } catch (err) {
    console.error('[Dashboard Update Booking Error]', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('api/index.ts', code, 'utf8');
console.log("Successfully patched api/index.ts");
