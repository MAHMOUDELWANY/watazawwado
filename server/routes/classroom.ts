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
import { roomSideIn } from './attendance.js';
import { lessonEndMs } from '../../src/lib/lessonWindow.js';
import { verifyParentProof } from './parentPin.js';

/**
 * Classroom Release 1 (Task 4): the door to our own lesson room and the Cloudflare media proxy behind it.
 * `enter` decides the role and hands out a short-lived ticket; every media call carries that ticket, and the server
 * holds the Cloudflare secrets. Newest join wins: each enter replaces its seat's row in lesson_room_seats, and calls
 * from an older join are refused with 409. Review 2026-11-18: seats live in their own rows (H1), the teacher's end is
 * stored and enforced (H3), and a side joins when its media connects, not when the page opens (M2).
 */
type Middleware = (req: any, res: any, next: any) => any;
type Cloudflare = ReturnType<typeof createCloudflareRealtime>;
type Seat = { join_id: string; user_id: string; session_id: string | null };
/** Why a pass can no longer be used, for the client's message (review M6). */
type EndReason = 'cancelled' | 'moved' | 'reassigned' | 'closed' | 'ended';

/** Ending this many minutes or more before the booked end asks the teacher why. */
export const EARLY_END_GRACE_MIN = 2;
const BOOKING_COLS = 'id, student_id, teacher_id, status, scheduled_start, scheduled_end, duration_minutes, contact_name, service_id';
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
export const FILE_EXT: Record<string, string> = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg' };
export const FILE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(pdf|png|jpg)$/;

/** A file's original name, safe to show: no control characters, at most 120 characters. */
export const cleanFileName = (v: unknown) => (typeof v === 'string' ? v.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 120) : '') || 'File';

/** The real type from the first bytes; the Content-Type header alone is never trusted. */
export function detectFileType(b: Buffer): 'application/pdf' | 'image/png' | 'image/jpeg' | null {
  if (b.length >= 5 && b.subarray(0, 5).toString('latin1') === '%PDF-') return 'application/pdf';
  if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return 'image/jpeg';
  return null;
}

// BUILD-LIST 1.5: the waiting room's device and network results, kept with the 720p check. Unknown keys are dropped.
const DEVICE_STATES = ['ok', 'denied', 'missing', 'error'];
const DETAIL_ENUMS: Record<string, string[]> = {
  camera: DEVICE_STATES, mic: DEVICE_STATES, relay: ['ok', 'failed', 'skipped'],
  network: ['good', 'fair', 'poor', 'unknown'], browser: ['chrome', 'edge', 'safari', 'firefox', 'other'],
};
const DETAIL_NUMBERS: Record<string, number> = { latencyMs: 60_000, downKbps: 10_000_000 };
const DETAIL_FLAGS = ['speakerTested', 'mobile'];
/** The cleaned detail, or null when a field has a wrong value (400). */
export function cleanPrecheckDetail(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (k in DETAIL_ENUMS) { if (typeof v !== 'string' || !DETAIL_ENUMS[k].includes(v)) return null; out[k] = v; }
    else if (k in DETAIL_NUMBERS) {
      if (v !== null && !(Number.isInteger(v) && (v as number) >= 0 && (v as number) <= DETAIL_NUMBERS[k])) return null;
      out[k] = v;
    } else if (DETAIL_FLAGS.includes(k)) { if (typeof v !== 'boolean') return null; out[k] = v; }
  }
  return out;
}
/** The network test's download is capped here (kilobytes). */
export const NETTEST_MAX_KB = 512;

/** Reads only the first `n` bytes of a stored object as a stream, then stops, so a 20 MB file never sits in memory. */
export async function firstBytes(bucket: any, path: string, n: number): Promise<Buffer | null> {
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
/** File pages that keep their own saved notes (each up to MAX_BOARD_BYTES). */
const MAX_BOARD_PAGES = 30;

function mayPersist(e: RoomEvent, role: RoomRole, snapshot: any): boolean {
  switch (e.t) {
    // talk: the teacher's page measures both sides (2.8).
    case 'slide': case 'pdf': case 'layout': case 'talk': case 'end': return role === 'teacher';
    case 'reaction': case 'focus': return role === 'learner';
    case 'quality': return e.side === attendanceRole(role);
    case 'board': return role === 'teacher' || (role === 'learner' && (snapshot.learnerDraw ?? snapshot.board?.learnerDraw) === true);
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
  requireSuperAdmin: Middleware;
  secret?: () => string;
  now?: () => number;
  /** Task 13: the rollout switch for this lesson's teacher (CLASSROOM_MODE by default). */
  classroomEnabled?: (teacherId: string) => boolean;
  /** BUILD-LIST 3.2: runs once the teacher ended the room (the automatic attendance verdict). Never fails the end. */
  onLessonEnded?: (client: any, bookingId: string) => Promise<unknown>;
}) {
  const now = deps.now ?? Date.now;
  const classroomEnabled = deps.classroomEnabled ?? ((teacherId: string) => classroomEnabledFor(teacherId));
  const secret = deps.secret ?? roomSecret;

  const iso = () => new Date(now()).toISOString();
  const loadBooking = async (client: any, id: string): Promise<(RoomBooking & { contact_name?: string | null; service_id?: string | null }) | null> => {
    const { data } = await client.from('bookings').select(BOOKING_COLS).eq('id', id).maybeSingle();
    return data || null;
  };
  /** The board/slide/pdf/layout snapshot and the teacher's end time. */
  const loadRoom = async (client: any, id: string): Promise<{ snapshot: any; endedAt: string | null }> => {
    const { data, error } = await client.from('lesson_room_state').select('snapshot, ended_at').eq('booking_id', id).maybeSingle();
    if (error) throw new Error(`lesson_room_state: ${error.message}`);
    return { snapshot: data?.snapshot && typeof data.snapshot === 'object' ? data.snapshot : {}, endedAt: data?.ended_at ?? null };
  };
  // Leaves ended_at alone: an upsert only sets the columns it names.
  const writeSnapshot = async (client: any, id: string, snapshot: any) => {
    const { error } = await client.from('lesson_room_state').upsert({ booking_id: id, snapshot, updated_at: iso() }, { onConflict: 'booking_id' });
    if (error) throw new Error(`lesson_room_state: ${error.message}`);
  };
  const loadSeat = async (client: any, id: string, seat: string): Promise<Seat | null> => {
    const { data, error } = await client.from('lesson_room_seats').select('join_id, user_id, session_id').eq('booking_id', id).eq('seat', seat).maybeSingle();
    if (error) throw new Error(`lesson_room_seats: ${error.message}`);
    return data || null;
  };

  /**
   * H3: the teacher ended the lesson. ended_at is stored and room_ended is written once; from then enter, media,
   * events, files and heartbeats are refused. Two ends at once only move ended_at by a few milliseconds.
   */
  /** Whole minutes left before the booked end (negative after it). */
  const earlyMinutes = (b: any) => Math.floor((lessonEndMs(b.scheduled_start, b.scheduled_end, b.duration_minutes) - now()) / 60_000);
  const endRoom = async (client: any, id: string) => {
    const at = iso();
    const { error } = await client.from('lesson_room_state').upsert({ booking_id: id, ended_at: at }, { onConflict: 'booking_id' });
    if (error) throw new Error(`lesson_room_state: ${error.message}`);
    const { error: evErr } = await client.from('lesson_attendance_events').upsert(
      { booking_id: id, source: 'room', event: 'room_ended', role: 'teacher', occurred_at: at, dedupe_key: `room:${id}:ended` },
      { onConflict: 'dedupe_key', ignoreDuplicates: true },
    );
    if (evErr) console.error('[classroom end] room_ended', evErr.message);
    if (deps.onLessonEnded) await deps.onLessonEnded(client, id).catch((err) => console.error('[classroom end] verdict', err));
  };

  /**
   * Is this lesson's room over for this pass, and why (M6). A booking moved to another time closes the window
   * ('moved'); the ticket's exp is the hard close it was given for, so a changed hard close is a move too.
   */
  const roomOver = (booking: RoomBooking, t: TicketPayload, endedAt: string | null): { status: number; body: { error: string; ended: true; reason: EndReason } } | null => {
    const stop = (status: number, reason: EndReason, error: string) => ({ status, body: { error, ended: true as const, reason } });
    if (booking.status === 'cancelled') return stop(409, 'cancelled', 'This lesson was cancelled.');
    if (!['confirmed', 'rescheduled'].includes(booking.status)) return stop(409, 'closed', 'This lesson is not active.');
    const w = roomJoinState(booking, now());
    if (w !== 'open') return stop(423, w === 'early' || roomHardCloseMs(booking) !== t.exp ? 'moved' : 'closed', 'The room is closed.');
    // A lesson given to another teacher or learner ends the old pass.
    if (notYours(booking, t)) return stop(403, 'reassigned', 'This is not your lesson.');
    if (endedAt) return stop(423, 'ended', 'The lesson has ended.');
    return null;
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
      // Task 13: switched off for this teacher, every role stays on the NX-12 page and Zoom, as before. Asked only
      // after access, so a stranger learns nothing about the teacher's rollout.
      if (!classroomEnabled(booking.teacher_id)) return res.status(409).json({ classroom: false });
      // BUILD-LIST 1.6: watching needs the parent PIN, so a child on the parent's signed-in device cannot watch by URL.
      if (access.role === 'guardian_observer' && !verifyParentProof(req.headers['x-parent-proof'], requester.userId, secret(), now())) {
        return res.status(403).json({ error: 'Enter the parent PIN to watch.', needsPin: true });
      }
      const cf = deps.cloudflare();
      const key = secret();
      if (!cf?.configured || !key) return res.status(503).json({ error: 'The lesson room is not available.' });
      // H3: once the teacher ended the lesson, nobody comes back in.
      if ((await loadRoom(client, id)).endedAt) return res.status(423).json({ error: 'The lesson has ended.', ended: true, reason: 'ended' });

      const role = access.role;
      incidentRole = role;
      const hardClose = roomHardCloseMs(booking);
      // Task 12: asked before anything is written, so a media service that is down stores no seat (Review Focus 5).
      const iceServers = await cf.iceServers(Math.max(60, Math.ceil((hardClose - now()) / 1000)));
      const ticketPayload: TicketPayload = { bookingId: id, role, userId: requester.userId, exp: hardClose, joinId: crypto.randomUUID(), studentId: booking.student_id };
      const at = iso();
      // H1: newest join wins with one single-row write; the session id is cleared until this join asks for one.
      const { error: seatErr } = await client.from('lesson_room_seats').upsert(
        { booking_id: id, seat: seatOf(ticketPayload), join_id: ticketPayload.joinId, user_id: requester.userId, session_id: null, updated_at: at },
        { onConflict: 'booking_id,seat' },
      );
      if (seatErr) throw new Error(`lesson_room_seats: ${seatErr.message}`);
      // M2: the join and lateness are counted by POST /connected, when media connects, not here.
      if (role === 'admin_observer') {
        const { error } = await client.from('admin_observations').insert({ booking_id: id, admin_user_id: requester.userId, started_at: at });
        if (error) throw new Error(`admin_observations: ${error.message}`);
      }

      // Names for the room's header; a failed lookup only leaves them out.
      const [teacherRow, serviceRow, learnerRow, lastReportRow, prepRow] = await Promise.all([
        client.from('profiles').select('display_name').eq('id', booking.teacher_id).maybeSingle(),
        booking.service_id ? client.from('services').select('title, arabic_title').eq('id', booking.service_id).maybeSingle() : { data: null },
        portal === 'teacher' && booking.student_id ? client.from('students').select('learner_type').eq('id', booking.student_id).maybeSingle() : { data: null },
        // Where this learner stopped in the curriculum, so the teacher's slides open there (teacher only).
        role === 'teacher' && booking.student_id
          ? client.from('curriculum_lesson_reports').select('subject, lesson_number, to_page').eq('student_id', booking.student_id).order('created_at', { ascending: false }).limit(1).maybeSingle()
          : { data: null },
        // BUILD-LIST 1.4: what the teacher prepared (teacher only); a failed lookup only leaves it out.
        role === 'teacher' ? client.from('lesson_prep').select('notes, slide').eq('booking_id', id).maybeSingle() : { data: null },
      ]);
      const prepared = prepRow?.data?.slide && typeof prepRow.data.slide === 'object' ? prepRow.data.slide : null;
      const type = portal === 'teacher' ? learnerRow?.data?.learner_type : family.find((l) => l.id === booking.student_id)?.learnerType;
      const service = serviceRow?.data;

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
        teacherName: teacherRow?.data?.display_name || null,
        subjectLabel: service?.title ? { en: service.title, ar: service.arabic_title || service.title } : null,
        learnerType: type === 'child' || type === 'adult' ? type : null,
        serviceId: booking.service_id || null,
        // The prepared slide wins over the last report; a rejoin snapshot still wins over both (startingLesson).
        lastReport: prepared ? { track: prepared.track, number: prepared.number, page: prepared.page ?? 0 }
          : lastReportRow?.data ? { track: lastReportRow.data.subject, number: lastReportRow.data.lesson_number, page: lastReportRow.data.to_page ?? 0 } : null,
        ...(role === 'teacher' ? { prepNotes: prepRow?.data?.notes || '' } : {}),
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
  const liveSeat = async (client: any, t: TicketPayload, res: any): Promise<{ booking: RoomBooking; mine: Seat } | null> => {
    const stop = (status: number, body: object) => { res.status(status).json(body); return null; };
    const booking = await loadBooking(client, t.bookingId);
    if (!booking) return stop(404, { error: 'Lesson not found.' });
    const over = roomOver(booking, t, (await loadRoom(client, t.bookingId)).endedAt);
    if (over) return stop(over.status, over.body);
    const mine = await loadSeat(client, t.bookingId, seatOf(t));
    if (!mine || mine.join_id !== t.joinId) return stop(409, { error: 'The room was opened on another device.', superseded: true });
    return { booking, mine };
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
      const { mine } = live;

      if (action === 'session') {
        const { sessionId } = await cf.newSession();
        // Only while this join still holds the seat: a newer device that took it meanwhile is never overwritten.
        const { data, error } = await client.from('lesson_room_seats').update({ session_id: sessionId, updated_at: iso() })
          .eq('booking_id', t.bookingId).eq('seat', seatOf(t)).eq('join_id', t.joinId).select('seat');
        if (error) throw new Error(`lesson_room_seats: ${error.message}`);
        if (!data?.length) return res.status(409).json({ error: 'The room was opened on another device.', superseded: true });
        return res.json({ sessionId });
      }

      const body = req.body || {};
      const sessionId = mine.session_id;
      if (!sessionId || body.sessionId !== sessionId) return res.status(403).json({ error: 'This media session is not yours.' });

      if (action === 'renegotiate') {
        if (typeof body.sdp !== 'string' || !body.sdp) return res.status(400).json({ error: 'sdp is required.' });
        return res.json(await cf.renegotiate(sessionId, body.sdp));
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
      const pulls = tracks.filter((x: any) => x.location === 'remote' && (action === 'tracks' || x.sessionId != null));
      if (pulls.length) {
        const { data: seats, error } = await client.from('lesson_room_seats').select('session_id').eq('booking_id', t.bookingId);
        if (error) throw new Error(`lesson_room_seats: ${error.message}`);
        const roomSessions = new Set((seats || []).map((s: any) => s.session_id).filter(Boolean));
        if (pulls.some((x: any) => !roomSessions.has(x.sessionId))) return res.status(403).json({ error: 'That track is not in this lesson.' });
      }
      const sd = body.sessionDescription;
      const sessionDescription = sd && (sd.type === 'offer' || sd.type === 'answer') && typeof sd.sdp === 'string' ? { type: sd.type, sdp: sd.sdp } : undefined;

      // Per-track errorCode values come back inside a 200 and are returned as they are; the client handles them.
      if (action === 'tracks') return res.json(await cf.tracksNew(sessionId, { sessionDescription, tracks }));
      if (action === 'update') return res.json(await cf.tracksUpdate(sessionId, { tracks }));
      return res.json(await cf.tracksClose(sessionId, { tracks, sessionDescription, force: body.force === true }));
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

      const rows: any[] = [];
      const boards: Array<Extract<RoomEvent, { t: 'board' }>> = [];
      const patch: { slide?: unknown; pdf?: unknown; layout?: unknown } = {};
      for (const { at, event: e } of items as Array<{ at: unknown; event: RoomEvent }>) {
        // Board permission is checked later, against the fresh board; nothing else reads the snapshot.
        if (e.t === 'board') { if (t.role === 'teacher' || t.role === 'learner') boards.push(e); continue; }
        if (!mayPersist(e, t.role, {})) continue;
        // An early end needs a reason, so only POST /end may record it; here it is dropped.
        if (e.t === 'end' && earlyMinutes(live.booking) >= EARLY_END_GRACE_MIN) continue;
        const { t: type, ...payload } = e;
        const ms = typeof at === 'number' && at <= now() && at >= now() - EVENT_SKEW_MS ? at : now();
        rows.push({ booking_id: t.bookingId, type, actor_role: attendanceRole(t.role), payload, occurred_at: new Date(ms).toISOString() });
        if (e.t === 'slide') patch.slide = e.state;
        if (e.t === 'pdf') patch.pdf = { fileId: e.fileId, page: e.page };
        if (e.t === 'layout') patch.layout = e.mode;
      }
      if (rows.length) {
        const { error } = await client.from('lesson_timeline_events').insert(rows);
        if (error) throw new Error(`lesson_timeline_events: ${error.message}`);
      }
      if (boards.length || Object.keys(patch).length) {
        // The only writer of the snapshot (seats have their own rows): re-read right before the write and change
        // only board/slide/pdf/layout.
        const { snapshot: fresh } = await loadRoom(client, t.bookingId);
        let changed = Object.keys(patch).length > 0;
        for (const e of boards) {
          if (!mayPersist(e, t.role, fresh)) continue;
          changed = true;
          // The drawing permission is one for the room, whichever page the teacher switched it on.
          if (t.role === 'teacher') {
            fresh.learnerDraw = e.learnerDraw === true;
            if (fresh.board) fresh.board = { ...fresh.board, learnerDraw: fresh.learnerDraw };
          }
          // Latest scene per surface (whiteboard, or one file page), in the snapshot (no timeline row); an older scene
          // never replaces a newer one.
          const pages: Record<string, unknown> = fresh.boards ?? {};
          const current = e.surface ? (pages[e.surface] as { sceneVersion?: number } | undefined) : fresh.board;
          if (e.sceneVersion < (current?.sceneVersion ?? -1)) continue;
          // shortcut: notes on more than MAX_BOARD_PAGES pages are not saved (live only), raise it if teachers hit it.
          if (e.surface && !current && Object.keys(pages).length >= MAX_BOARD_PAGES) continue;
          // The whiteboard keeps the teacher's page; a learner's save keeps the one already there.
          const page = e.surface ? undefined : t.role === 'teacher' ? e.page : (current as { page?: number } | undefined)?.page;
          const scene = { sceneVersion: e.sceneVersion, elements: e.elements, learnerDraw: t.role === 'teacher' ? e.learnerDraw === true : true, ...(page ? { page } : {}) };
          if (e.surface) fresh.boards = { ...pages, [e.surface]: scene };
          else fresh.board = scene;
        }
        if (changed) await writeSnapshot(client, t.bookingId, { ...fresh, ...patch });
      }
      // H3/L4: only the teacher's end is persisted (mayPersist), and it ends the room on the server too. An early end
      // never goes this way: it needs a reason, so only POST /end (which checks it) may end the room before time.
      if (rows.some((r) => r.type === 'end')) await endRoom(client, t.bookingId);
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
      const live = await liveSeat(client, t, res);
      if (!live) return;
      if (roomHardCloseMs(live.booking) <= now()) return res.status(423).json({ error: 'The room is closed.', ended: true });
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
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const { booking } = live;
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

  // BUILD-LIST 1.4: the teacher's list of this lesson's files: prepared before the lesson (with their names) and added
  // in the room, oldest first.
  app.get('/api/classroom/:id/files', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      if (t.role !== 'teacher') return res.status(403).json({ error: 'Only the teacher sees the file list.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const [{ data: stored, error }, { data: named }] = await Promise.all([
        client.storage.from(CLASSROOM_FILES_BUCKET).list(t.bookingId, { limit: 100, sortBy: { column: 'created_at', order: 'asc' } }),
        client.from('lesson_files').select('file_id, name, source').eq('booking_id', t.bookingId),
      ]);
      if (error) throw new Error(`files/list: ${error.message}`);
      const names = new Map<string, { name: string; source: string }>((named || []).map((f: any) => [String(f.file_id), f]));
      const files = (stored || []).map((o: any) => String(o.name)).filter((n: string) => FILE_ID.test(n))
        .map((fileId: string) => ({ fileId, name: names.get(fileId)?.name || null, prepared: names.get(fileId)?.source === 'prep' }));
      return res.json({ files });
    } catch (err) {
      return fail(res, err, 'files/list');
    }
  });

  // The original name of a file the teacher just added in the room (after confirm), for the list and the report.
  app.post('/api/classroom/:id/files/:fileId/name', withTicket, deps.roomRateLimit, teacherOnly, async (req: any, res: any) => {
    try {
      const fileId = String(req.params.fileId || '');
      if (!FILE_ID.test(fileId)) return res.status(404).json({ error: 'File not found.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const info = await client.storage.from(CLASSROOM_FILES_BUCKET).info(`${t.bookingId}/${fileId}`);
      if (info.error || !info.data) return res.status(404).json({ error: 'File not found.' });
      const name = cleanFileName(req.body?.name);
      // A prepared file keeps its prep record; only a room upload is named here.
      const { error } = await client.from('lesson_files').upsert(
        { booking_id: t.bookingId, file_id: fileId, name, source: 'room', created_at: iso() },
        { onConflict: 'booking_id,file_id', ignoreDuplicates: true },
      );
      if (error) throw new Error(`lesson_files: ${error.message}`);
      return res.json({ fileId, name });
    } catch (err) {
      return fail(res, err, 'files/name');
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
      const over = roomOver(booking, req.roomTicket, (await loadRoom(client, booking.id)).endedAt);
      if (over) return res.status(over.status).json(over.body);
      const url = await fileLink(client, booking, fileId);
      if (!url) return res.status(423).json({ error: 'The room is closed.', ended: true });
      return res.json({ url });
    } catch (err) {
      return fail(res, err, 'files/get');
    }
  });

  // Rejoin (Review Focus 4): the latest slide, board, pdf and layout, and the time left to the hard close. M6: polled
  // every ~30 s, it also says when the room is over and why ({ ended, reason }), or that a newer device took the
  // seat (409 superseded). serverNow lets the client correct its clock (M5).
  app.get('/api/classroom/:id/state', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const t: TicketPayload = req.roomTicket;
      const live = await liveSeat(client, t, res);
      if (!live) return;
      // Rows written before the seats table may still carry sessions: never sent.
      const { sessions: _seats, ...snapshot } = (await loadRoom(client, t.bookingId)).snapshot;
      return res.json({ snapshot, remainingMs: remainingMs(live.booking, now()), serverNow: now() });
    } catch (err) {
      return fail(res, err, 'state');
    }
  });

  // Task 6: the waiting room's 720p result for the caller's side. One call per join, so the shared IP limiter
  // (before the ticket check, like leave) is enough. Observers have no camera: accepted, nothing stored.
  app.post('/api/classroom/:id/precheck', deps.rateLimit, withTicket, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      const { precheck720, startHeight, detail: rawDetail } = req.body || {};
      const heightOk = startHeight === null || (Number.isInteger(startHeight) && startHeight >= 0 && startHeight <= 4320);
      if (typeof precheck720 !== 'boolean' || !heightOk) return res.status(400).json({ error: 'precheck720 and startHeight are required.' });
      const detail = rawDetail === undefined ? undefined : cleanPrecheckDetail(rawDetail);
      if (detail === null) return res.status(400).json({ error: 'detail has a wrong value.' });
      if (isObserver(t.role)) return res.status(204).end();
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const booking = await loadBooking(client, t.bookingId);
      if (!booking) return res.status(404).json({ error: 'Lesson not found.' });
      if (notYours(booking, t)) return res.status(403).json({ error: 'This is not your lesson.', ended: true });
      const { error } = await client.from('lesson_quality').upsert(
        { booking_id: t.bookingId, side: attendanceRole(t.role), precheck_720: precheck720, start_height: startHeight, ...(detail ? { precheck_detail: detail } : {}), updated_at: new Date(now()).toISOString() },
        { onConflict: 'booking_id,side' },
      );
      if (error) throw new Error(`lesson_quality: ${error.message}`);
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'precheck');
    }
  });

  // BUILD-LIST 1.5: the waiting room's network test against our own API: kb=0 answers at once (latency), kb=N sends N
  // random kilobytes (rough download speed). Only the signed pass is checked, so it stays fast; capped per join.
  app.get('/api/classroom/:id/nettest', withTicket, deps.roomRateLimit, (req: any, res: any) => {
    const kb = Math.min(NETTEST_MAX_KB, Math.max(0, Math.floor(Number(req.query.kb) || 0)));
    res.set('Cache-Control', 'no-store');
    res.type('application/octet-stream');
    return res.send(kb ? crypto.randomBytes(kb * 1024) : Buffer.alloc(0));
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
      // M1: only the join that holds the seat, while the room is open and not ended, counts (409/423 otherwise).
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const side = attendanceRole(t.role);
      const { data: was, error: readErr } = await client.from('lesson_quality')
        .select('min_height, degraded_seconds, audio_only_seconds, reconnects, focus_away_seconds').eq('booking_id', t.bookingId).eq('side', side).maybeSingle();
      if (readErr) throw new Error(`lesson_quality: ${readErr.message}`);
      const lowest = [was?.min_height, minHeight].filter((h): h is number => typeof h === 'number');
      const merged = {
        min_height: lowest.length ? Math.min(...lowest) : null,
        degraded_seconds: Math.max(was?.degraded_seconds ?? 0, degraded),
        audio_only_seconds: Math.max(was?.audio_only_seconds ?? 0, audioOnly),
        reconnects: Math.max(was?.reconnects ?? 0, reconnects),
        focus_away_seconds: Math.max(was?.focus_away_seconds ?? 0, focusAway),
      };
      const { error } = await client.from('lesson_quality').upsert(
        { booking_id: t.bookingId, side, ...merged, updated_at: new Date(now()).toISOString() },
        { onConflict: 'booking_id,side' },
      );
      if (error) throw new Error(`lesson_quality: ${error.message}`);
      // The heartbeat for attendance: one row per join, moved forward, so a side whose tab dies stops counting 90 s
      // after it (attendance.ts ROOM_BEAT_GRACE_MS). Logged, never failing the quality write.
      const { error: beatErr } = await client.from('lesson_attendance_events').upsert(
        { booking_id: t.bookingId, source: 'room', event: 'room_heartbeat', role: side, occurred_at: new Date(now()).toISOString(), dedupe_key: `room:${t.bookingId}:${side}:hb:${t.joinId}` },
        { onConflict: 'dedupe_key' },
      );
      if (beatErr) console.error('[classroom quality] heartbeat', beatErr.message);
      // Only a failed teacher row can tip the alert, so healthy heartbeats skip its queries. The teacher's user id is
      // the booking's teacher_id (notYours checked it). The alert never fails the write.
      if (side === 'teacher' && lessonFailedForSide(merged)) await alertTeacherIfNeeded(client, t.userId, now()).catch((err) => console.error('[classroom quality] alert', err));
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'quality');
    }
  });

  // Task 11: the super admin's monthly connection view for one teacher: every room lesson that month with both sides.
  app.get('/api/admin/teachers/:teacherId/connection', deps.rateLimit, deps.verifyTeacherAuth, deps.requireSuperAdmin, async (req: any, res: any) => {
    try {
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

  // H3/L4: the teacher's "End lesson", enforced here; the end event in an events batch does the same. A repeat answers
  // 423 { reason: 'ended' }, which the client treats as done.
  app.post('/api/classroom/:id/end', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      if (t.role !== 'teacher') return res.status(403).json({ error: 'Only the teacher can end the lesson.' });
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const live = await liveSeat(client, t, res);
      if (!live) return;
      // Owner 2026-11-20: ending more than EARLY_END_GRACE_MIN before the booked end needs a written reason, kept on
      // the timeline for the admin.
      const minutesEarly = earlyMinutes(live.booking);
      const reason = typeof req.body?.reason === 'string' ? req.body.reason.trim().slice(0, 1000) : '';
      if (minutesEarly >= EARLY_END_GRACE_MIN) {
        if (reason.length < 10) return res.status(400).json({ error: 'Write why the lesson ends early (at least 10 characters).', needsReason: true, minutesEarly });
        const { error } = await client.from('lesson_timeline_events').insert({ booking_id: t.bookingId, type: 'end', actor_role: 'teacher', payload: { early: true, minutesEarly, reason }, occurred_at: iso() });
        if (error) throw new Error(`lesson_timeline_events: ${error.message}`);
      }
      await endRoom(client, t.bookingId);
      return res.json({ ended: true });
    } catch (err) {
      return fail(res, err, 'end');
    }
  });

  // M2: a side joins when its media connects. Idempotent per join: a side already in (this join again, or a second
  // device while the first is in) writes nothing; a rejoin after room_left or a crash (no heartbeat for 90 s) is a new
  // join, so the time after it counts. The first join keeps the fixed key lateness reads.
  app.post('/api/classroom/:id/connected', withTicket, deps.roomRateLimit, async (req: any, res: any) => {
    try {
      const t: TicketPayload = req.roomTicket;
      if (isObserver(t.role)) return res.status(204).end();
      const client = deps.getClient();
      if (!client) return res.status(503).json({ error: 'The lesson room is not available.' });
      const live = await liveSeat(client, t, res);
      if (!live) return;
      const id = t.bookingId;
      const r = attendanceRole(t.role);
      const { data: roomRows, error: readErr } = await client.from('lesson_attendance_events').select('event, role, occurred_at')
        .eq('booking_id', id).eq('source', 'room').order('occurred_at', { ascending: true }).limit(200);
      if (readErr) throw new Error(`lesson_attendance_events: ${readErr.message}`);
      if (!roomSideIn(roomRows || [], r, now())) {
        const before = (roomRows || []).some((e: any) => e.role === r && e.event === 'room_joined');
        const { error } = await client.from('lesson_attendance_events').upsert(
          { booking_id: id, source: 'room', event: 'room_joined', role: r, occurred_at: iso(), dedupe_key: before ? `room:${id}:${r}:joined:${t.joinId}` : `room:${id}:${r}:joined` },
          { onConflict: 'dedupe_key', ignoreDuplicates: true },
        );
        if (error) throw new Error(`room_joined: ${error.message}`);
      }
      // Task 10: judged on the stored first join, so rejoins change nothing. Never fails the call.
      if (t.role === 'teacher') await recordTeacherLateness(client, live.booking as any).catch((err) => console.error('[classroom connected] lateness', err));
      return res.json({ ok: true });
    } catch (err) {
      return fail(res, err, 'connected');
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
        const mine = await loadSeat(client, t.bookingId, seatOf(t));
        if (mine?.join_id === t.joinId) {
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
