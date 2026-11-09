import express from 'express';
import crypto from 'node:crypto';
import { lessonJoinState } from '../../src/lib/lessonWindow.js';
import { handleLiveLessonEvent } from '../notifications/lessonLive.js';

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
// shortcut: user-agent list catches the common scanners, not ones posing as a browser; Zoom's join time stays the reliable record.
export const LINK_SCANNER_UA = /bot|crawl|spider|preview|scan|safelinks|proofpoint|mimecast|barracuda|slurp|facebookexternalhit|whatsapp|telegram|slack|discord|skype|curl|wget|python|go-http|java\//i;

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

export type AttendanceSummary = {
  teacher: boolean;
  student: boolean;
  /** In the Zoom room right now (last Zoom event for that side is a join). */
  teacherIn?: boolean;
  studentIn?: boolean;
  held?: boolean;
  togetherMinutes?: number;
  unstable?: 'teacher' | 'student' | 'both' | null;
};

/** Who is in the Zoom room now: the last Zoom join/leave of each side. */
export function inRoomNow(events: Array<{ event: string; role: string; occurred_at?: string }>): { teacherIn: boolean; studentIn: boolean } {
  const last: Record<string, string> = {};
  const sorted = [...events].sort((a, b) => new Date(a.occurred_at || 0).getTime() - new Date(b.occurred_at || 0).getTime());
  for (const e of sorted) {
    if (e.event === 'joined' || e.event === 'left') last[e.role] = e.event;
    if (e.event === 'meeting_ended') { last.teacher = 'left'; last.student = 'left'; }
  }
  return { teacherIn: last.teacher === 'joined', studentIn: last.student === 'joined' };
}

/**
 * Owner review 2026-11-07: who showed up, from what we know (the teacher pressing "Start", the student opening
 * the link, and Zoom's join events when Zoom sends them). It is a sign, not proof: the teacher still records it.
 */
export function summarizeAttendance(events: Array<{ event: string; role: string }>): AttendanceSummary {
  const sum: AttendanceSummary = { teacher: false, student: false };
  for (const e of events) {
    if (e.event === 'meeting_started') sum.teacher = true;
    if (!['link_opened', 'joined', 'waiting_room_joined'].includes(e.event)) continue;
    if (e.role === 'teacher') sum.teacher = true;
    else if (e.role === 'student') sum.student = true;
  }
  return sum;
}

/**
 * Owner review 2026-11-09: when a lesson counts as held, from Zoom's join/leave times. A 30-minute lesson needs the
 * teacher and the student together for 20 minutes; a 45- or 60-minute lesson for 30. Held lessons can't be moved,
 * marked as a no-show or as "not held" by the teacher (the super admin still can).
 */
export const requiredTogetherMinutes = (durationMin: number | null | undefined) => ((Number(durationMin) || 30) <= 30 ? 20 : 30);
/** Joining this many times in one lesson (3+ drops) means the connection is not stable: we ask both sides. */
export const UNSTABLE_JOINS = 4;

export type AttendanceAnalysis = {
  teacherFirstJoin: string | null;
  studentFirstJoin: string | null;
  togetherMinutes: number;
  requiredMinutes: number;
  held: boolean;
  joins: { teacher: number; student: number };
  unstable: 'teacher' | 'student' | 'both' | null;
};

type Ev = { event: string; role: string; occurred_at: string; participant_name?: string | null };

/** Time spans each side was in the Zoom room, cut to the lesson time. */
function presence(events: Ev[], role: 'teacher' | 'student', from: number, to: number): Array<[number, number]> {
  const spans: Array<[number, number]> = [];
  let open: number | null = null;
  for (const e of events) {
    if (e.role !== role) continue;
    const t = new Date(e.occurred_at).getTime();
    if (e.event === 'joined' && open === null) open = t;
    else if (e.event === 'left' && open !== null) { spans.push([open, t]); open = null; }
  }
  if (open !== null) spans.push([open, Math.min(Date.now(), to)]);
  return spans.map(([a, b]) => [Math.max(a, from), Math.min(b, to)] as [number, number]).filter(([a, b]) => b > a);
}

export function analyzeAttendance(
  rawEvents: Ev[],
  lesson: { scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null },
): AttendanceAnalysis {
  const events = [...rawEvents].sort((a, b) => new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime());
  const from = new Date(lesson.scheduled_start).getTime() - 10 * 60_000;
  const to = lesson.scheduled_end ? new Date(lesson.scheduled_end).getTime() : new Date(lesson.scheduled_start).getTime() + (Number(lesson.duration_minutes) || 60) * 60_000;
  const teacher = presence(events, 'teacher', from, to);
  const student = presence(events, 'student', from, to);
  let together = 0;
  for (const [a1, b1] of teacher) for (const [a2, b2] of student) together += Math.max(0, Math.min(b1, b2) - Math.max(a1, a2));
  const joins = { teacher: 0, student: 0 };
  for (const e of events) {
    const t = new Date(e.occurred_at).getTime();
    if (e.event === 'joined' && t >= from && t <= to && (e.role === 'teacher' || e.role === 'student')) joins[e.role] += 1;
  }
  const first = (role: string) => events.find((e) => e.role === role && (e.event === 'joined' || e.event === 'link_opened'))?.occurred_at || null;
  const togetherMinutes = Math.floor(together / 60_000);
  const requiredMinutes = requiredTogetherMinutes(lesson.duration_minutes);
  const tU = joins.teacher >= UNSTABLE_JOINS;
  const sU = joins.student >= UNSTABLE_JOINS;
  return {
    teacherFirstJoin: first('teacher'),
    studentFirstJoin: first('student'),
    togetherMinutes,
    requiredMinutes,
    held: togetherMinutes >= requiredMinutes,
    joins,
    unstable: tU && sU ? 'both' : tU ? 'teacher' : sU ? 'student' : null,
  };
}

/** Loads one lesson's events and analyses them. */
export async function loadAttendanceAnalysis(supabase: any, booking: { id: string; scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }): Promise<AttendanceAnalysis | null> {
  const { data, error } = await supabase.from('lesson_attendance_events').select('event, role, occurred_at').eq('booking_id', booking.id).order('occurred_at', { ascending: true }).limit(500);
  if (error) return null;
  return analyzeAttendance(data || [], booking);
}

/** Adds `attendance` to each lesson that has started (one query for all of them). */
export async function attachAttendance<T extends { id: string; scheduled_start: string; scheduled_end?: string | null; duration_minutes?: number | null }>(supabase: any, lessons: T[]): Promise<Array<T & { attendance?: AttendanceSummary }>> {
  const now = Date.now();
  const started = lessons.filter((l) => new Date(l.scheduled_start).getTime() - 10 * 60 * 1000 <= now).map((l) => l.id);
  if (!started.length) return lessons;
  const { data, error } = await supabase.from('lesson_attendance_events').select('booking_id, event, role, occurred_at').in('booking_id', started).limit(2000);
  if (error) return lessons;
  // Owner review 2026-11-09: joining after the lesson time does not count as attending it.
  const endOf = new Map(lessons.map((l) => [l.id, l.scheduled_end ? new Date(l.scheduled_end).getTime() : Infinity]));
  const byLesson = new Map<string, any[]>();
  for (const row of data || []) {
    if (new Date(row.occurred_at).getTime() > (endOf.get(row.booking_id) ?? Infinity)) continue;
    byLesson.set(row.booking_id, [...(byLesson.get(row.booking_id) || []), row]);
  }
  return lessons.map((l) => {
    if (!started.includes(l.id)) return l;
    const evs = byLesson.get(l.id) || [];
    const a = analyzeAttendance(evs, l);
    return { ...l, attendance: { ...summarizeAttendance(evs), ...inRoomNow(evs), held: a.held, togetherMinutes: a.togetherMinutes, unstable: a.unstable } };
  });
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
      const { data: booking } = await supabase.from('bookings')
        .select('id, student_id, teacher_id, scheduled_start, scheduled_end, duration_minutes, reference_code, contact_name')
        .eq('zoom_meeting_id', parsed.meetingId).maybeSingle();
      if (!booking) return res.json({ ok: true });
      const { error } = await supabase
        .from('lesson_attendance_events')
        .upsert({ ...parsed.row, booking_id: booking.id }, { onConflict: 'dedupe_key', ignoreDuplicates: true });
      if (error) throw error;
      await handleLiveLessonEvent(supabase, booking, parsed.row.event);
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
    const { data: booking } = await supabase.from('bookings').select('id, zoom_meeting_link, scheduled_start, scheduled_end, duration_minutes, status').eq('id', id).maybeSingle();
    const url = booking?.zoom_meeting_link;
    if (!booking || !isZoomUrl(url)) return res.redirect(302, '/student/lessons');
    // Owner review 2026-11-09: the link works only during the lesson (from 5 minutes before to its end).
    const state = booking.status === 'cancelled' ? 'ended' : lessonJoinState(booking, 'student');
    if (state !== 'open') return res.redirect(302, `/student/lessons?lesson=${booking.id}&join=${state}`);
    // Mail scanners and link previews open email links on their own; don't log those as the student.
    const ua = String(req.headers['user-agent'] || '');
    const automated = req.method === 'HEAD' || !ua || LINK_SCANNER_UA.test(ua);
    if (!automated) await recordLinkOpened(supabase, booking.id, 'student');
    res.redirect(302, String(url).trim());
  });

  app.get('/api/dashboard/bookings/:id/attendance', deps.verifyTeacherAuth, async (req: any, res: any) => {
    const supabase = deps.getClient();
    if (!supabase) return res.status(503).json({ error: 'Database service unavailable.' });
    const { data: booking } = await supabase.from('bookings').select('id, teacher_id, scheduled_start, scheduled_end, duration_minutes').eq('id', req.params.id).maybeSingle();
    if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
    const isAdmin = req.teacherUser?.role === 'super_admin';
    if (!isAdmin && booking.teacher_id !== req.teacherUser?.id) {
      return res.status(403).json({ error: 'This lesson is not yours.' });
    }
    const { data, error } = await supabase
      .from('lesson_attendance_events')
      .select('source, event, role, participant_name, occurred_at')
      .eq('booking_id', booking.id)
      .order('occurred_at', { ascending: true })
      .limit(200);
    if (error) return res.status(500).json({ error: 'Could not load attendance.' });
    const a = analyzeAttendance(data || [], booking);
    const summary = { ...summarizeAttendance(data || []), held: a.held, togetherMinutes: a.togetherMinutes, requiredMinutes: a.requiredMinutes, joins: a.joins, unstable: a.unstable };
    // Owner review 2026-11-09: exact click and join times are for the super admin; the teacher gets the summary only.
    res.json({ events: isAdmin ? data || [] : [], summary });
  });
}
