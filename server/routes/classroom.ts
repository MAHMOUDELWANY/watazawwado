import express from 'express';
import crypto from 'node:crypto';
import { decideRoomAccess, signTicket, verifyTicket, type Requester, type RoomBooking, type RoomRole, type TicketPayload } from '../classroom/access.js';
import { roomKey, roomSecret } from './lessonRoom.js';
import { isUuid } from './progress.js';
import { ROOM_CLOSE_GRACE_MIN, remainingMs, roomHardCloseMs, roomJoinState } from '../../src/lib/roomWindow.js';
import { isRoomEvent, type RoomEvent } from '../../src/lib/roomEvents.js';
import { recordTeacherLateness } from '../classroom/lateness.js';
import { alertTeacherIfNeeded, lessonFailedForSide } from '../classroom/qualityAlerts.js';
import { CLIENT_INCIDENT_KINDS, recordIncident, type IncidentKind } from '../classroom/incidents.js';
import { CloudflareRealtimeError, type createCloudflareRealtime } from '../integrations/cloudflareRealtime.js';
import { classroomEnabledFor } from '../classroom/mode.js';

/**
 * Classroom Release 1 (Task 4): the door to our own lesson room and the Cloudflare media proxy behind it.
 * `enter` decides the role and hands out a short-lived ticket; every media call carries that ticket, and the server
 * holds the Cloudflare secrets. Newest join wins: each enter replaces its role's entry in
 * lesson_room_state.snapshot.sessions, and calls from an older join are refused with 409.
 */
type Middleware = (req: any, res: any, next: any) => any;
type Cloudflare = ReturnType<typeof createCloudflareRealtime>;
type SessionEntry = { joinId: string; userId: string; at: string; sessionId?: string };

const BOOKING_COLS = 'id, student_id, teacher_id, status, scheduled_start, scheduled_end, duration_minutes, contact_name';
const MAX_TRACKS = 64;
const isObserver = (r: RoomRole) => r === 'guardian_observer' || r === 'admin_observer';
// Teacher and learner have one seat each (two devices replace each other); every observer has their own.
const seatOf = (t: TicketPayload) => (isObserver(t.role) ? `${t.role}:${t.userId}` : t.role);
const attendanceRole = (r: RoomRole) => (r === 'teacher' ? 'teacher' : 'student');
/** A pass from before the lesson was given to another teacher or learner no longer belongs to this lesson. */
const notYours = (booking: RoomBooking, t: TicketPayload) =>
  t.role === 'teacher' ? booking.teacher_id !== t.userId : t.role !== 'admin_observer' && booking.student_id !== t.studentId;
const MAX_EVENTS = 50;
const MAX_EVENTS_BODY = 256 * 1024;
const EVENT_SKEW_MS = 10 * 60_000;
/** Quality totals above this (6 h) are cut: no lesson is longer. */
const MAX_QUALITY_SECONDS = 6 * 3600;
const MAX_INCIDENT_DETAIL = 2000;
const MAX_OBSERVER_NOTES = 4000;

// Task 8: files the teacher shows in the room. Private bucket; links are signed and end by the hard close.
export const CLASSROOM_FILES_BUCKET = 'classroom-files';
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
const FILE_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' };
const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg)$/;

/** The real type from the first bytes; the Content-Type header alone is never trusted. */
export function detectFileType(b: Buffer): 'application/pdf' | 'image/png' | 'image/jpeg' | null {
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  return null;
}

/** Reads only the first `n` bytes of a stored object as a stream, then stops, so a 20 MB file never sits in memory. */
async function firstBytes(bucket: any, path: string, n: number): Promise<Buffer | null> {
  const { data, error } = await bucket.download(path).asStream();
  if (error || !data) return null;
  const reader = (data as ReadableStream<Uint8Array>).getReader();
  const parts: Buffer[] = [];
  let got = 0;
  try {
    while (got < n) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(Buffer.from(value));
      got += value.length;
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(parts).subarray(0, n);
}

/**
 * Who may persist which timeline type (Task 7). Observers persist nothing. Everything else on the channel (session,
 * ink, pointer, focus_warning_off, observer) is live only. Board: the teacher always; the learner only while the
 * teacher's latest board in the snapshot has learnerDraw = true (a learner can never change that flag).
 */
function mayPersist(e: RoomEvent, role: RoomRole, snapshot: any): boolean {
  switch (e.t) {
    case 'slide': case 'pdf': case 'layout': case 'end': return role === 'teacher';
    case 'reaction': case 'focus': return role === 'learner';
    case 'quality': return e.side === attendanceRole(role);
    case 'board': return role === 'teacher' || (role === 'learner' && snapshot.board?.learnerDraw === true);
    default: return false;
  }
}

export function registerClassroomRoutes(app: express.Express, deps: {
  getClient: () => any;
  cloudflare: () => Cloudflare | null;
  verifyTeacherAuth: Middleware;
  verifyStudentAuth: Middleware;
  getLearners: (client: any, req: any) => Promise<Array<{ id: string; name: string; learnerType?: string }>>;
  rateLimit: Middleware;
  /** Runs after the ticket check and keys on req.roomTicket: WebRTC setup and layer changes need many calls. */
  roomRateLimit: Middleware;
  secret?: () => string;
  now?: () => number;
  /** Task 13: the rollout switch for this lesson's teacher (CLASSROOM_MODE by default). */
  classroomEnabled?: (teacherId: string) => boolean;
}) {
  const now = deps.now ?? Date.now;
  const classroomEnabled = deps.classroomEnabled ?? ((teacherId: string) => classroomEnabledFor(teacherId));
  const secret = deps.secret ?? roomSecret;

  const loadBooking = async (client: any, id: string): Promise<(RoomBooking & { contact_name?: string | null }) | null> => {
    const { data } = await client.from('bookings').select(BOOKING_COLS).eq('id', id).maybeSingle();
    return data || null;
  };
  const loadSnapshot = async (client: any, id: string): Promise<any> => {
    const { data } = await client.from('lesson_room_state').select('snapshot').eq('booking_id', id).maybeSingle();
    return data?.snapshot && typeof data.snapshot === 'object' ? data.snapshot : {};
  };
  // shortcut: read-modify-write of the jsonb snapshot; two joins in the same instant can race. Move to an RPC if seen.
  const saveSeat = async (client: any, id: string, snapshot: any, seat: string, entry: SessionEntry) => {
    const next = { ...snapshot, sessions: { ...(snapshot.sessions || {}), [seat]: entry } };
    const { error } = await client.from('lesson_room_state').upsert({ booking_id: id, snapshot: next, updated_at: new Date(now()).toISOString() }, { onConflict: 'booking_id' });
    if (error) throw new Error(`lesson_room_state: ${error.message}`);
  };

  const fail = (res: any, err: unknown, where: string, extra: object = {}) => {
    if (err instanceof CloudflareRealtimeError) {
      console.error(`[classroom ${where}] Cloudflare`, err.status, err.errorCode);
      // Never forward the provider message: only our wording and its error code.
      return res.status(502).json({ error: 'The media service did not answer. Please try again.', code: err.errorCode, ...extra });
    }
    console.error(`[classroom ${where}]`, err);
    return res.status(500).json({ error: 'The lesson room is not available right now.' });
  };

  /** Task 12: a Cloudflare error on our side is an incident for the caller's side (observers have none). */
  const providerIncident = async (client: any, err: unknown, bookingId: string, role: RoomRole | null) => {
    if (!(err instanceof CloudflareRealtimeError) || !role || isObserver(role) || !client) return {};
    try {
      return await recordIncident(client, { bookingId, kind: 'provider_error', side: attendanceRole(role), detail: { code: err.errorCode, status: err.status } }, now());
    } catch (e) {
      console.error('[classroom] provider incident', e);
      return {};
    }
  };

  const enter = (portal: 'teacher' | 'student') => async (req: any, res: any) => {
    let incidentRole: RoomRole | null = null;
    let client: any = null;
    try {
      client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const id = String(req.params.id || '');
      if (!isUuid(id)) return res.status(404).json({ error: 'Lesson not found.' });
      const booking = await loadBooking(client, id);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      // Task 13: switched off for this teacher, every role stays on the NX-12 page and Zoom, as before.
      if (!classroomEnabled(booking.teacher_id)) return res.status(409).json({ classroom: false });
      const cf = deps.cloudflare();
      const key = secret();
      if (!cf?.configured || !key) return res.status(503).json({ error: 'The lesson room is not available.' });

      let requester: Requester;
      let family: Array<{ id: string; name: string; learnerType?: string }> = [];
      if (portal === 'teacher') {
        requester = { userId: req.teacherUser?.id, role: req.teacherUser?.role === 'super_admin' ? 'super_admin' : 'teacher' };
      } else {
        family = await deps.getLearners(client, req);
        // A child's own phone (NX-16) is the learner, never a guardian.
        requester = { userId: req.studentUser?.auth_id, role: req.childDevice ? 'student' : 'parent' };
      }
      if (!requester.userId) return res.status(401).json({ error: 'Please sign in again.' });

      const access = decideRoomAccess({
        booking,
        requester,
        learners: family.map((l) => ({ id: l.id, isChild: l.learnerType === 'child' })),
        wantObserver: req.query.observe === '1',
        now: now(),
      });
      if (access.ok === false) return res.status(access.status).json({ error: access.reason });

      const role = access.role;
      incidentRole = role;
      const hardClose = roomHardCloseMs(booking);
      // Task 12: asked before anything is written, so a media service that is down stores no join (Review Focus 5).
      const iceServers = await cf.iceServers(Math.max(60, Math.ceil((hardClose - now()) / 1000)));
      const ticketPayload: TicketPayload = { bookingId: id, role, userId: requester.userId, exp: hardClose, joinId: crypto.randomUUID(), studentId: booking.student_id };
      const at = new Date(now()).toISOString();
      await saveSeat(client, id, await loadSnapshot(client, id), seatOf(ticketPayload), { joinId: ticketPayload.joinId!, userId: requester.userId, at });

      if (!isObserver(role)) {
        // A side joins when it is not already in: a second device while in writes nothing (Review Focus 2), a rejoin
        // after room_left is a new join so the time after it counts. The first keeps the fixed key lateness reads.
        const r = attendanceRole(role);
        const { data: last, error: lastErr } = await client.from('lesson_attendance_events').select('event')
          .eq('booking_id', id).eq('source', 'room').eq('role', r).order('occurred_at', { ascending: false }).limit(1).maybeSingle();
        let error = lastErr;
        if (!lastErr && (!last || last.event === 'room_left')) {
          ({ error } = await client.from('lesson_attendance_events').upsert(
            { booking_id: id, source: 'room', event: 'room_joined', role: r, occurred_at: at, dedupe_key: last ? `room:${id}:${r}:joined:${ticketPayload.joinId}` : `room:${id}:${r}:joined` },
            { onConflict: 'dedupe_key', ignoreDuplicates: true },
          ));
        }
        if (error) console.error('[classroom enter] room_joined', error.message);
        // Task 10: judged on the stored first join, so rejoins change nothing. Never blocks the teacher's entry.
        else if (role === 'teacher') await recordTeacherLateness(client, booking).catch((err) => console.error('[classroom enter] lateness', err));
      } else if (role === 'admin_observer') {
        const { error } = await client.from('admin_observations').insert({ booking_id: id, admin_user_id: requester.userId, started_at: at });
        if (error) throw new Error(`admin_observations: ${error.message}`);
      }

      const start = new Date(booking.scheduled_start).getTime();
      return res.json({
        classroom: true,
        role,
        ticket: signTicket(ticketPayload, key),
        roomKey: roomKey(id, key),
        iceServers,
        startsAt: booking.scheduled_start,
        hardCloseAt: new Date(hardClose).toISOString(),
        durationMinutes: Math.round((hardClose - ROOM_CLOSE_GRACE_MIN * 60_000 - start) / 60_000),
        learnerName: family.find((l) => l.id === booking.student_id)?.name || booking.contact_name || null,
      });
    } catch (err) {
      return fail(res, err, 'enter', await providerIncident(client, err, String(req.params.id || ''), incidentRole));
    }
  };

  app.get('/api/dashboard/classroom/:id/enter', deps.rateLimit, deps.verifyTeacherAuth, enter('teacher'));
  app.get('/api/student/classroom/:id/enter', deps.rateLimit, deps.verifyStudentAuth, enter('student'));

  const withTicket: Middleware = (req, res, next) => {
    const t = verifyTicket(String(req.headers['x-room-ticket'] || ''), secret(), now());
    if (!t) return res.status(401).json({ error: 'Your room pass has ended. Please enter again.' });
    if (t.bookingId !== req.params.id) return res.status(403).json({ error: 'This pass is for another lesson.' });
    req.roomTicket = t;
    next();
  };

  /**
   * Re-checks the booking and the caller's seat, so a moved, cancelled or reassigned lesson stops the room and an
   * older device is refused. Sends the error and returns null when the call must stop.
   */
  const liveSeat = async (client: any, t: TicketPayload, res: any): Promise<{ snapshot: any; mine: SessionEntry } | null> => {
    const stop = (status: number, body: object) => { res.status(status).json(body); return null; };
    const booking = await loadBooking(client, t.bookingId);
    if (!booking) return stop(404, { error: 'Lesson not found.' });
    if (!['confirmed', 'rescheduled'].includes(booking.status)) return stop(409, { error: 'This lesson is not active.', ended: true });
    if (roomJoinState(booking, now()) !== 'open') return stop(423, { error: 'The room is closed.', ended: true });
    if (t.role === 'teacher' && booking.teacher_id !== t.userId) return stop(403, { error: 'This is not your lesson.', ended: true });
    // A lesson moved to another learner ends the old family's pass, as a reassigned teacher's does.
    if ((t.role === 'learner' || t.role === 'guardian_observer') && booking.student_id !== t.studentId) return stop(403, { error: 'This is not your lesson.', ended: true });
    const snapshot = await loadSnapshot(client, t.bookingId);
    const mine: SessionEntry | undefined = snapshot.sessions?.[seatOf(t)];
    if (!mine || mine.joinId !== t.joinId) return stop(409, { error: 'The room was opened on another device.', superseded: true });
    return { snapshot, mine };
  };

  /** Media calls re-check the booking and seat every time (liveSeat). */
  const rtc = (action: 'session' | 'tracks' | 'renegotiate' | 'update' | 'close') => async (req: any, res: any) => {
    const client = deps.getClient();
    try {
      const cf = deps.cloudflare();
      if (!client || !cf?.configured) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const { snapshot, mine } = live;
      const seat = seatOf(t);

      if (action === 'session') {
        const { sessionId } = await cf.newSession();
        await saveSeat(client, t.bookingId, snapshot, seat, { ...mine, sessionId });
        return res.json({ sessionId });
      }

      const body = req.body || {};
      if (!mine.sessionId || body.sessionId !== mine.sessionId) return res.status(403).json({ error: 'This media session is not yours.' });

      if (action === 'renegotiate') {
        if (typeof body.sdp !== 'string' || !body.sdp) return res.status(400).json({ error: 'sdp is required.' });
        return res.json(await cf.renegotiate(mine.sessionId, body.sdp));
      }

      const tracks = body.tracks;
      if (!Array.isArray(tracks) || tracks.length > MAX_TRACKS || tracks.some((x: any) => !x || typeof x !== 'object')) {
        return res.status(400).json({ error: 'tracks must be a list.' });
      }
      // Observers are receive-only: nothing they send may publish.
      if (isObserver(t.role) && tracks.some((x: any) => (action === 'close' ? x.location === 'local' : x.location !== 'remote'))) {
        return res.status(403).json({ error: 'Observers can only watch.' });
      }
      // Pulls may only come from sessions of this lesson's room.
      const roomSessions = new Set(Object.values(snapshot.sessions || {}).map((s: any) => s?.sessionId).filter(Boolean));
      if (tracks.some((x: any) => x.location === 'remote' && (action === 'tracks' || x.sessionId != null) && !roomSessions.has(x.sessionId))) {
        return res.status(403).json({ error: 'That track is not in this lesson.' });
      }
      const sd = body.sessionDescription;
      const sessionDescription = sd && (sd.type === 'offer' || sd.type === 'answer') && typeof sd.sdp === 'string' ? { type: sd.type, sdp: sd.sdp } : undefined;

      // Per-track errorCode values come back inside a 200 and are returned as they are; the client handles them.
      if (action === 'tracks') return res.json(await cf.tracksNew(mine.sessionId, { sessionDescription, tracks }));
      if (action === 'update') return res.json(await cf.tracksUpdate(mine.sessionId, { tracks }));
      return res.json(await cf.tracksClose(mine.sessionId, { tracks, sessionDescription, force: body.force === true }));
    } catch (err) {
      await providerIncident(client, err, req.roomTicket.bookingId, req.roomTicket.role);
      return fail(res, err, `rtc/${action}`);
    }
  };

  for (const action of ['session', 'tracks', 'renegotiate', 'update', 'close'] as const) {
    app.post(`/api/classroom/:id/rtc/${action}`, withTicket, deps.roomRateLimit, rtc(action));
  }

  // Task 7: the lesson timeline. The client batches persisted events every 30 s and on pagehide.
  app.post('/api/classroom/:id/events', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      const size = req.rawBody?.length ?? JSON.stringify(req.body ?? {}).length;
      if (size > MAX_EVENTS_BODY) return res.status(413).json({ error: 'Too much at once.' });
      const items = req.body?.events;
      if (!Array.isArray(items) || items.length > MAX_EVENTS || !items.every((x: any) => x && isRoomEvent(x.event))) {
        return res.status(400).json({ error: `events must be a list of up to ${MAX_EVENTS} room events.` });
      }
      if (isObserver(t.role)) return res.status(204).end();
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const live = await liveSeat(client, t, res);
      if (!live) return;

      const snapshot = { ...live.snapshot };
      const rows: any[] = [];
      let merged = false;
      for (const { at, event: e } of items as Array<{ at: unknown; event: RoomEvent }>) {
        if (!mayPersist(e, t.role, snapshot)) continue;
        merged ||= e.t === 'board' || e.t === 'slide' || e.t === 'pdf' || e.t === 'layout';
        if (e.t === 'board') {
          // Latest board only, in the snapshot (no timeline row); an older scene never replaces a newer one.
          if (e.sceneVersion < (snapshot.board?.sceneVersion ?? -1)) {
            // The teacher's permission always lands, even when a learner pushed the version ahead.
            if (t.role === 'teacher' && snapshot.board) snapshot.board = { ...snapshot.board, learnerDraw: e.learnerDraw === true };
            continue;
          }
          snapshot.board = { sceneVersion: e.sceneVersion, elements: e.elements, learnerDraw: t.role === 'teacher' ? e.learnerDraw === true : true };
          continue;
        }
        const { t: type, ...payload } = e;
        const ms = typeof at === 'number' && at <= now() && at >= now() - EVENT_SKEW_MS ? at : now();
        rows.push({ booking_id: t.bookingId, type, actor_role: attendanceRole(t.role), payload, occurred_at: new Date(ms).toISOString() });
        if (e.t === 'slide') snapshot.slide = e.state;
        if (e.t === 'pdf') snapshot.pdf = { fileId: e.fileId, page: e.page };
        if (e.t === 'layout') snapshot.layout = e.mode;
      }
      if (rows.length) {
        const { error } = await client.from('lesson_timeline_events').insert(rows);
        if (error) throw new Error(`lesson_timeline_events: ${error.message}`);
      }
      if (merged) {
        // Same read-modify-write shortcut as saveSeat; sessions are the ones read a moment ago in liveSeat.
        const { error } = await client.from('lesson_room_state').upsert({ booking_id: t.bookingId, snapshot, updated_at: new Date(now()).toISOString() }, { onConflict: 'booking_id' });
        if (error) throw new Error(`lesson_room_state: ${error.message}`);
      }
      return res.json({ stored: rows.length });
    } catch (err) {
      return fail(res, err, 'events');
    }
  });

  /** A signed link to a stored room file that ends no later than the room's hard close. */
  const fileLink = async (client: any, booking: RoomBooking, fileId: string) => {
    const seconds = Math.floor((roomHardCloseMs(booking) - now()) / 1000);
    if (seconds < 1) return null;
    const { data, error } = await client.storage.from(CLASSROOM_FILES_BUCKET).createSignedUrl(`${booking.id}/${fileId}`, seconds);
    if (error || !data?.signedUrl) throw new Error(`signed url: ${error?.message || 'none'}`);
    return data.signedUrl as string;
  };

  // Task 8: the teacher adds a PDF or image in two steps, because a Vercel function body is capped near 4.5 MB:
  // upload-url hands out a one-path signed upload, the browser sends the file straight to Storage, confirm checks it.
  const teacherOnly = (req: any, res: any, next: any) => (req.roomTicket.role === 'teacher' ? next() : res.status(403).json({ error: 'Only the teacher can add files.' }));

  app.post('/api/classroom/:id/files/upload-url', withTicket, deps.roomRateLimit, teacherOnly, async (req: any, res: any) => {
    try {
      const contentType = String(req.body?.contentType || '').toLowerCase();
      const size = Number(req.body?.size);
      if (!FILE_EXT[contentType]) return res.status(415).json({ error: 'Use a PDF, PNG or JPEG file.' });
      if (!Number.isInteger(size) || size < 1) return res.status(400).json({ error: 'size must be the file size in bytes.' });
      if (size > MAX_FILE_BYTES) return res.status(413).json({ error: 'The file is larger than 20 MB.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      if (!(await liveSeat(client, t, res))) return;
      const booking = await loadBooking(client, t.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      if (roomHardCloseMs(booking) <= now()) return res.status(423).json({ error: 'The room is closed.', ended: true });
      const fileId = `${crypto.randomUUID()}.${FILE_EXT[contentType]}`;
      const path = `${t.bookingId}/${fileId}`;
      const { data, error } = await client.storage.from(CLASSROOM_FILES_BUCKET).createSignedUploadUrl(path);
      if (error || !data?.token) throw new Error(`signed upload: ${error?.message || 'none'}`);
      return res.json({ fileId, path, token: data.token, signedUrl: data.signedUrl });
    } catch (err) {
      return fail(res, err, 'files/upload-url');
    }
  });

  // The upload went around us, so nothing about it is trusted until here: real size and the first bytes.
  app.post('/api/classroom/:id/files/:fileId/confirm', withTicket, deps.roomRateLimit, teacherOnly, async (req: any, res: any) => {
    try {
      const fileId = String(req.params.fileId || '');
      if (!FILE_ID.test(fileId)) return res.status(404).json({ error: 'File not found.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      if (!(await liveSeat(client, t, res))) return;
      const booking = await loadBooking(client, t.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      const bucket = client.storage.from(CLASSROOM_FILES_BUCKET);
      const path = `${t.bookingId}/${fileId}`;
      const info = await bucket.info(path);
      if (info.error || !info.data) return res.status(404).json({ error: 'The file did not arrive.' });
      const drop = async () => { const { error } = await bucket.remove([path]); if (error) console.error('[classroom] files/remove', error.message); };
      if (!(Number(info.data.size) <= MAX_FILE_BYTES)) { await drop(); return res.status(413).json({ error: 'The file is larger than 20 MB.' }); }
      const head = await firstBytes(bucket, path, 16);
      const declared = Object.keys(FILE_EXT).find((k) => fileId.endsWith(`.${FILE_EXT[k]}`));
      if (!head || detectFileType(head) !== declared) { await drop(); return res.status(415).json({ error: 'Use a PDF, PNG or JPEG file.' }); }
      const url = await fileLink(client, booking, fileId);
      if (!url) return res.status(423).json({ error: 'The room is closed.', ended: true });
      return res.json({ fileId, url });
    } catch (err) {
      return fail(res, err, 'files/confirm');
    }
  });

  // Any pass of this lesson (learner and observers too) gets a fresh link, e.g. after a pdf event or a rejoin.
  app.get('/api/classroom/:id/files/:fileId', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const fileId = String(req.params.fileId || '');
      if (!FILE_ID.test(fileId)) return res.status(404).json({ error: 'File not found.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const booking = await loadBooking(client, req.roomTicket.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      if (notYours(booking, req.roomTicket)) return res.status(403).json({ error: 'This is not your lesson.', ended: true });
      const url = await fileLink(client, booking, fileId);
      if (!url) return res.status(423).json({ error: 'The room is closed.', ended: true });
      return res.json({ url });
    } catch (err) {
      return fail(res, err, 'files/get');
    }
  });

  // Rejoin (Review Focus 4): the latest slide, board, pdf and layout, and the time left to the hard close. Seats stay private.
  app.get('/api/classroom/:id/state', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      const booking = await loadBooking(client, t.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      if (notYours(booking, t)) return res.status(403).json({ error: 'This is not your lesson.', ended: true });
      const { sessions: _seats, ...snapshot } = await loadSnapshot(client, t.bookingId);
      return res.json({ snapshot, remainingMs: remainingMs(booking, now()) });
    } catch (err) {
      return fail(res, err, 'state');
    }
  });

  // Task 6: the waiting room's 720p result for the caller's side. One call per join, so the shared IP limiter
  // (before the ticket check, like leave) is enough. Observers have no camera: accepted, nothing stored.
  app.post('/api/classroom/:id/precheck', deps.rateLimit, withTicket, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      const { precheck720, startHeight } = req.body || {};
      const heightOk = startHeight === null || (Number.isInteger(startHeight) && startHeight >= 0 && startHeight <= 4320);
      if (typeof precheck720 !== 'boolean' || !heightOk) return res.status(400).json({ error: 'precheck720 and startHeight are required.' });
      if (isObserver(t.role)) return res.status(204).end();
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const { error } = await client.from('lesson_quality').upsert(
        { booking_id: t.bookingId, side: attendanceRole(t.role), precheck_720: precheck720, start_height: startHeight, updated_at: new Date(now()).toISOString() },
        { onConflict: 'booking_id,side' },
      );
      if (error) throw new Error(`lesson_quality: ${error.message}`);
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'precheck');
    }
  });

  // Task 12: the client detector says the room failed for this side. The answer carries the side's Zoom link while
  // its Zoom window is open. Observers get nothing and store nothing.
  app.post('/api/classroom/:id/incident', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      const kind = req.body?.kind as IncidentKind;
      if (!CLIENT_INCIDENT_KINDS.includes(kind)) return res.status(400).json({ error: 'kind must be connect_timeout, ice_failed or engine_error.' });
      const raw = req.body?.detail;
      const detail = raw && typeof raw === 'object' && !Array.isArray(raw) && JSON.stringify(raw).length <= MAX_INCIDENT_DETAIL ? raw : {};
      if (isObserver(t.role)) return res.json({ fallback: null });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const booking = await loadBooking(client, t.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      if (!['confirmed', 'rescheduled'].includes(booking.status)) return res.status(409).json({ error: 'This lesson is not active.', ended: true });
      // Same checks as liveSeat, but a superseded or failed device may still report: it is the one that failed.
      if (notYours(booking, t)) return res.status(403).json({ error: 'This is not your lesson.', ended: true });
      return res.json(await recordIncident(client, { bookingId: t.bookingId, kind, side: attendanceRole(t.role), detail }, now()));
    } catch (err) {
      return fail(res, err, 'incident');
    }
  });

  // Task 11: running totals for the caller's side, every 60 s and on leave. A total never goes down (max merge), and
  // min_height keeps the lowest seen. Observers send nothing worth keeping.
  app.post('/api/classroom/:id/quality', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      const b = req.body || {};
      const count = (v: unknown, cap: number) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.min(Math.round(v), cap) : null);
      const degraded = count(b.degradedSeconds, MAX_QUALITY_SECONDS);
      const audioOnly = count(b.audioOnlySeconds, MAX_QUALITY_SECONDS);
      const reconnects = count(b.reconnects, 1000);
      const focusAway = b.focusAwaySeconds == null ? 0 : count(b.focusAwaySeconds, MAX_QUALITY_SECONDS);
      const minHeight = b.minHeight == null ? null : count(b.minHeight, 4320);
      if (degraded == null || audioOnly == null || reconnects == null || focusAway == null || (b.minHeight != null && minHeight == null)) {
        return res.status(400).json({ error: 'degradedSeconds, audioOnlySeconds and reconnects must be numbers of 0 or more.' });
      }
      if (isObserver(t.role)) return res.status(204).end();
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const booking = await loadBooking(client, t.bookingId);
      if (!booking || notYours(booking, t)) return res.status(403).json({ error: 'This is not your lesson.', ended: true });
      const side = attendanceRole(t.role);
      const { data: was, error: readErr } = await client.from('lesson_quality')
        .select('min_height, degraded_seconds, audio_only_seconds, reconnects, focus_away_seconds').eq('booking_id', t.bookingId).eq('side', side).maybeSingle();
      if (readErr) throw new Error(`lesson_quality: ${readErr.message}`);
      const lowest = [was?.min_height, minHeight].filter((h): h is number => typeof h === 'number');
      const { error } = await client.from('lesson_quality').upsert({
        booking_id: t.bookingId,
        side,
        min_height: lowest.length ? Math.min(...lowest) : null,
        degraded_seconds: Math.max(was?.degraded_seconds ?? 0, degraded),
        audio_only_seconds: Math.max(was?.audio_only_seconds ?? 0, audioOnly),
        reconnects: Math.max(was?.reconnects ?? 0, reconnects),
        focus_away_seconds: Math.max(was?.focus_away_seconds ?? 0, focusAway),
        updated_at: new Date(now()).toISOString(),
      }, { onConflict: 'booking_id,side' });
      if (error) throw new Error(`lesson_quality: ${error.message}`);
      // The teacher's user id is the booking's teacher_id (enter checked it). The alert never fails the write.
      if (side === 'teacher') await alertTeacherIfNeeded(client, t.userId, now()).catch((err) => console.error('[classroom quality] alert', err));
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'quality');
    }
  });

  // Task 11: the super admin's monthly connection view for one teacher: every room lesson that month with both sides.
  app.get('/api/admin/teachers/:teacherId/connection', deps.rateLimit, deps.verifyTeacherAuth, async (req: any, res: any) => {
    try {
      if ((req.teacherUser?.appRole || req.teacherUser?.role) !== 'super_admin') return res.status(403).json({ error: 'Super admins only.' });
      const teacherId = String(req.params.teacherId || '');
      const month = String(req.query.month || '');
      if (!isUuid(teacherId)) return res.status(404).json({ error: 'Teacher not found.' });
      const m = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month);
      if (!m) return res.status(400).json({ error: 'month must look like 2026-11.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'Database integration is not configured.' });
      const from = new Date(Date.UTC(+m[1], +m[2] - 1, 1)).toISOString();
      const to = new Date(Date.UTC(+m[1], +m[2], 1)).toISOString();
      const { data: lessons, error } = await client.from('bookings').select('id, scheduled_start, contact_name, status')
        .eq('teacher_id', teacherId).gte('scheduled_start', from).lt('scheduled_start', to);
      if (error) throw new Error(`bookings: ${error.message}`);
      const ids = (lessons || []).map((l: any) => l.id);
      const { data: rows, error: qErr } = ids.length
        ? await client.from('lesson_quality').select('booking_id, side, precheck_720, start_height, min_height, degraded_seconds, audio_only_seconds, reconnects, focus_away_seconds').in('booking_id', ids)
        : { data: [], error: null };
      if (qErr) throw new Error(`lesson_quality: ${qErr.message}`);
      const pick = (id: string, side: string) => {
        const r = (rows || []).find((x: any) => x.booking_id === id && x.side === side);
        if (!r) return null;
        const { booking_id: _b, side: _s, ...numbers } = r;
        return numbers;
      };
      const out = (lessons || [])
        .map((l: any) => ({ bookingId: l.id, scheduledStart: l.scheduled_start, learner: l.contact_name || null, status: l.status, teacher: pick(l.id, 'teacher'), student: pick(l.id, 'student') }))
        .filter((l: any) => l.teacher || l.student)
        .map((l: any) => ({ ...l, teacherFailed: l.teacher ? lessonFailedForSide(l.teacher) : false }))
        .sort((a: any, b: any) => String(a.scheduledStart).localeCompare(String(b.scheduledStart)));
      return res.json({ month, lessons: out });
    } catch (err) {
      return fail(res, err, 'admin/connection');
    }
  });

  // Task 13: the super admin's private notes on the visit open now. Never shown to the teacher or the family.
  app.patch('/api/classroom/:id/observation', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      if (t.role !== 'admin_observer') return res.status(403).json({ error: 'Only the admin observer keeps notes.' });
      const notes = req.body?.notes;
      if (typeof notes !== 'string' || notes.length > MAX_OBSERVER_NOTES) return res.status(400).json({ error: `notes must be text of up to ${MAX_OBSERVER_NOTES} characters.` });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const { error } = await client.from('admin_observations').update({ notes })
        .eq('booking_id', t.bookingId).eq('admin_user_id', t.userId).is('ended_at', null);
      if (error) throw new Error(`admin_observations: ${error.message}`);
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'observation');
    }
  });

  app.post('/api/classroom/:id/leave', deps.rateLimit, withTicket, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      const at = new Date(now()).toISOString();
      if (t.role === 'admin_observer') {
        const { error } = await client.from('admin_observations').update({ ended_at: at })
          .eq('booking_id', t.bookingId).eq('admin_user_id', t.userId).is('ended_at', null);
        if (error) throw new Error(`admin_observations: ${error.message}`);
      } else if (!isObserver(t.role)) {
        // A device that was replaced by a newer join leaves silently; the newer one is still in the room.
        const mine = (await loadSnapshot(client, t.bookingId)).sessions?.[seatOf(t)];
        if (mine?.joinId === t.joinId) {
          const r = attendanceRole(t.role);
          const { error } = await client.from('lesson_attendance_events').upsert(
            { booking_id: t.bookingId, source: 'room', event: 'room_left', role: r, occurred_at: at, dedupe_key: `room:${t.bookingId}:${r}:left:${t.joinId}` },
            { onConflict: 'dedupe_key', ignoreDuplicates: true },
          );
          if (error) throw new Error(`room_left: ${error.message}`);
        }
      }
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'leave');
    }
  });
}
