import { lessonJoinState } from '../../src/lib/lessonWindow.js';
import { studentJoinPath } from '../routes/attendance.js';
import { notifySuperAdmins } from '../notifications/inbox.js';

/**
 * Classroom Task 12: an incident on our side (the room could not start or keep the lesson). Every incident is stored
 * (Task 10 reads it to excuse lateness), the super admins hear about the first one per side per lesson, and the side
 * gets its Zoom link while the Zoom window for that side is open (src/lib/lessonWindow.ts, unchanged).
 */
export type IncidentKind = 'connect_timeout' | 'ice_failed' | 'engine_error' | 'provider_error';
export const CLIENT_INCIDENT_KINDS: readonly IncidentKind[] = ['connect_timeout', 'ice_failed', 'engine_error'];
export type IncidentSide = 'teacher' | 'student';

export async function recordIncident(
  client: any,
  input: { bookingId: string; kind: IncidentKind; side: IncidentSide; detail: Record<string, unknown> },
  now: number = Date.now(),
): Promise<{ fallback: { url: string } | null }> {
  const { bookingId, kind, side, detail } = input;
  const { data: booking, error } = await client.from('bookings')
    .select('id, scheduled_start, scheduled_end, duration_minutes, contact_name, sync_metadata, zoom_meeting_link').eq('id', bookingId).maybeSingle();
  if (error) throw new Error(`bookings: ${error.message}`);
  if (!booking) return { fallback: null };

  const { data: earlier, error: prevErr } = await client.from('classroom_incidents').select('id')
    .eq('booking_id', bookingId).eq('side', side).limit(1).maybeSingle();
  if (prevErr) throw new Error(`classroom_incidents: ${prevErr.message}`);
  // created_at is set here (not left to the default) so it is the same clock Task 10 compares the first join with.
  const { error: insErr } = await client.from('classroom_incidents').insert({ booking_id: bookingId, kind, side, detail, created_at: new Date(now).toISOString() });
  if (insErr) throw new Error(`classroom_incidents: ${insErr.message}`);

  // The host link is not a column: the Zoom sync keeps it in sync_metadata (as api/index.ts reads it).
  const hostUrl: string | null = booking.sync_metadata?.zoomStartUrl || null;
  const noZoom = !booking.zoom_meeting_link && !hostUrl;
  if (!earlier) {
    const who = side === 'teacher' ? { en: 'the teacher', ar: 'المعلم' } : { en: 'the learner', ar: 'الطالب' };
    const when = String(booking.scheduled_start).slice(0, 16).replace('T', ' ');
    const facts = `${kind}${typeof detail.code === 'string' ? ` (${detail.code})` : ''} · ${booking.contact_name || bookingId} · ${when} UTC`;
    await notifySuperAdmins(client, noZoom ? {
      kind: 'classroom_incident',
      title: { en: 'Urgent: the lesson room failed and there is no Zoom link', ar: 'عاجل: غرفة الحصة وقعت ومفيش لينك زووم' },
      body: { en: `The room failed for ${who.en} and this lesson has no Zoom meeting to fall back to. ${facts}`, ar: `الغرفة وقعت عند ${who.ar} والحصة دي مالهاش اجتماع زووم بديل. ${facts}` },
      link: '/dashboard',
    } : {
      kind: 'classroom_incident',
      title: { en: 'The lesson room failed; Zoom was offered', ar: 'غرفة الحصة وقعت، وظهر زرار زووم' },
      body: { en: `The room failed for ${who.en}, so the Zoom button was shown. ${facts}`, ar: `الغرفة وقعت عند ${who.ar}، فظهر زرار زووم. ${facts}` },
      link: '/dashboard',
    });
  }

  // ?zoom=1: with the classroom on, /api/join/:id leads to the room; the fallback must reach Zoom (Task 14).
  const learner = studentJoinPath(bookingId, booking.zoom_meeting_link);
  const url = side === 'teacher' ? (hostUrl || booking.zoom_meeting_link || null) : learner?.includes('/api/join/') ? `${learner}?zoom=1` : learner;
  const open = lessonJoinState(booking, side, now) === 'open';
  return { fallback: url && open ? { url } : null };
}
