import express from 'express';
import crypto from 'node:crypto';

/**
 * Lesson attendance: what Zoom reports (meeting started/ended, who joined/left, waiting room) plus when the
 * teacher or student opened the lesson link on our site. All meetings live on the academy's one Zoom account
 * and the teacher always starts them as host, so the host is the teacher and anyone else is the student.
 */

type Middleware = (req: any, res: any, next: any) => any;
type AttendanceRow = {
  booking_id: string;
  source: 'site' | 'zoom';
  event: 'link_opened' | 'meeting_started' | 'meeting_ended' | 'joined' | 'left' | 'waiting_room_joined';
  role: 'teacher' | 'student' | 'unknown';
  participant_name?: string | null;
  occurred_at: string;
  dedupe_key: string;
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000;

const hmacHex = (secret: string, message: string) => crypto.createHmac('sha256', secret).update(message).digest('hex');

/** Zoom signs each call: x-zm-signature = "v0=" + HMAC-SHA256(secret, "v0:{timestamp}:{raw body}"). */
export function isValidZoomSignature(rawBody: Buffer | string | undefined, timestamp: unknown, signature: unknown, secret: string, nowMs = Date.now()): boolean {
  if (!rawBody || !secret || typeof timestamp !== 'string' || typeof signature !== 'string') return false;
  const tsMs = Number(timestamp) * 1000;
  if (!Number.isFinite(tsMs) || Math.abs(nowMs - tsMs) > MAX_CLOCK_SKEW_MS) return false;
  const expected = `v0=${hmacHex(secret, `v0:${timestamp}:${rawBody.toString()}`)}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Turns one Zoom webhook body into the meeting id and attendance fields, or null for events we don't keep. */
export function parseZoomAttendanceEvent(body: any): { meetingId: string; row: Omit<AttendanceRow, 'booking_id'> } | null {
  const obj = body?.payload?.object;
  if (!obj || obj.id == null) return null;
  const meetingId = String(obj.id);
  const meetingKey = String(obj.uuid || meetingId);
  const p = obj.participant || {};
  const role: AttendanceRow['role'] = obj.host_id && p.id && String(p.id) === String(obj.host_id) ? 'teacher' : 'student';
  const who = String(p.participant_uuid || p.user_id || p.id || p.user_name || 'unknown');
  const name = typeof p.user_name === 'string' ? p.user_name.slice(0, 200) : null;

  const build = (event: AttendanceRow['event'], time: unknown, withParticipant: boolean) => {
    const at = typeof time === 'string' ? new Date(time) : null;
    const occurredAt = at && !Number.isNaN(at.getTime()) ? at.toISOString() : new Date().toISOString();
    return {
      meetingId,
      row: {
        source: 'zoom' as const,
        event,
        role: withParticipant ? role : ('unknown' as const),
        participant_name: withParticipant ? name : null,
        occurred_at: occurredAt,
        dedupe_key: `zoom:${meetingKey}:${event}:${withParticipant ? who : ''}:${occurredAt}`.slice(0, 500),
      },
    };
  };

  switch (body?.event) {
    case 'meeting.started': return build('meeting_started', obj.start_time, false);
    case 'meeting.ended': return build('meeting_ended', obj.end_time, false);
    case 'meeting.participant_joined': return build('joined', p.join_time, true);
    case 'meeting.participant_left': return build('left', p.leave_time, true);
    case 'meeting.participant_joined_waiting_room': return build('waiting_room_joined', p.date_time, true);
    default: return null;
  }
}

/** Records that someone opened the lesson link on our site; repeat clicks within the same minute count once. */
export async function recordLinkOpened(supabase: any, bookingId: string, role: 'teacher' | 'student') {
  const now = new Date();
  const minute = now.toISOString().slice(0, 16);
  const { error } = await supabase.from('lesson_attendance_events').upsert(
    { booking_id: bookingId, source: 'site', event: 'link_opened', role, occurred_at: now.toISOString(), dedupe_key: `site:${bookingId}:${role}:${minute}` },
    { onConflict: 'dedupe_key', ignoreDuplicates: true },
  );
  if (error) console.error('[attendance] link_opened', error.message);
}

const siteOrigin = () => {
  try { return new URL(process.env.APP_URL || 'https://watazawwado.academy').origin; } catch { return 'https://watazawwado.academy'; }
};

/** The student-facing join link: goes through our site so we can log the click, then on to Zoom. */
export const studentJoinPath = (bookingId: string | null | undefined, zoomUrl: string | null | undefined) =>
  bookingId && typeof zoomUrl === 'string' && /^https:\/\//.test(zoomUrl.trim()) ? `${siteOrigin()}/api/join/${bookingId}` : zoomUrl || null;

const isZoomUrl = (value: unknown) => {
  try {
    const u = new URL(String(value).trim());
    return u.protocol === 'https:' && (u.hostname === 'zoom.us' || u.hostname.endsWith('.zoom.us'));
  } catch { return false; }
};

export function registerAttendanceRoutes(app: express.Express, deps: {
  getClient: () => any;
  verifyTeacherAuth: Middleware;
  rateLimit: Middleware;
}) {
  app.post('/api/zoom/webhook', async (req: any, res: any) => {
    const secret = (process.env.ZOOM_WEBHOOK_SECRET_TOKEN || '').trim();
    if (!secret) return res.status(503).json({ error: 'Webhook not configured.' });
    if (!isValidZoomSignature(req.rawBody, req.headers['x-zm-request-timestamp'], req.headers['x-zm-signature'], secret)) {
      return res.status(401).json({ error: 'Invalid signature.' });
    }
    if (req.body?.event === 'endpoint.url_validation') {
      const plainToken = String(req.body?.payload?.plainToken || '');
      return res.json({ plainToken, encryptedToken: hmacHex(secret, plainToken) });
    }
    const parsed = parseZoomAttendanceEvent(req.body);
    if (!parsed) return res.json({ ok: true });
    const supabase = deps.getClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    try {
      const { data: booking } = await supabase.from('bookings').select('id').eq('zoom_meeting_id', parsed.meetingId).maybeSingle();
      if (!booking) return res.json({ ok: true });
      const { error } = await supabase
        .from('lesson_attendance_events')
        .upsert({ ...parsed.row, booking_id: booking.id }, { onConflict: 'dedupe_key', ignoreDuplicates: true });
      if (error) throw error;
      res.json({ ok: true });
    } catch (err) {
      console.error('[POST /api/zoom/webhook]', err);
      res.status(500).json({ error: 'Could not record the event.' });
    }
  });

  app.get('/api/join/:id', deps.rateLimit, async (req: any, res: any) => {
    const id = String(req.params.id || '');
    const supabase = deps.getClient();
    if (!UUID_RE.test(id) || !supabase) return res.redirect(302, '/student/lessons');
    const { data: booking } = await supabase.from('bookings').select('id, zoom_meeting_link').eq('id', id).maybeSingle();
    const url = booking?.zoom_meeting_link;
    if (!booking || !isZoomUrl(url)) return res.redirect(302, '/student/lessons');
    await recordLinkOpened(supabase, booking.id, 'student');
    res.redirect(302, String(url).trim());
  });

  app.get('/api/dashboard/bookings/:id/attendance', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const supabase = deps.getClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data: booking } = await supabase.from('bookings').select('id, teacher_id').eq('id', req.params.id).maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
    if (req.teacherUser?.role !== 'super_admin' && booking.teacher_id !== req.teacherUser?.id) {
      return res.status(403).json({ error: 'This lesson is not yours.' });
    }
    const { data, error } = await supabase
      .from('lesson_attendance_events')
      .select('source, event, role, participant_name, occurred_at')
      .eq('booking_id', booking.id)
      .order('occurred_at', { ascending: true })
      .limit(200);
    if (error) return res.status(500).json({ error: 'Could not load attendance.' });
    res.json({ events: data || [] });
  });
}
