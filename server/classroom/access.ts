import crypto from 'node:crypto';
import { roomJoinState, type LessonTimes } from '../../src/lib/roomWindow.js';

/**
 * Classroom Release 1: who may enter our own lesson room, and the short-lived ticket that proves it to the media proxy.
 * Pure: no database, no network.
 */
export type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
export type Requester = { userId: string; role: 'teacher' | 'super_admin' | 'student' | 'parent' };
export type RoomBooking = LessonTimes & { id: string; student_id: string | null; teacher_id: string | null; status: string };
export type RoomAccess = { ok: true; role: RoomRole } | { ok: false; status: 403 | 404 | 409 | 423; reason: string };

const OPEN_STATUSES = ['confirmed', 'rescheduled'];

export function decideRoomAccess(input: {
  booking: RoomBooking;
  requester: Requester;
  learners: { id: string; isChild: boolean }[];
  wantObserver: boolean;
  now: number;
}): RoomAccess {
  const { booking, requester, learners, wantObserver, now } = input;
  let role: RoomRole;
  if (requester.role === 'teacher' || requester.role === 'super_admin') {
    if (!wantObserver && booking.teacher_id === requester.userId) role = 'teacher';
    else if (wantObserver && requester.role === 'super_admin') role = 'admin_observer';
    else return { ok: false, status: 403, reason: 'This is not your lesson.' };
  } else {
    const learner = learners.find((l) => l.id === booking.student_id);
    // 404, not 403: a family must not learn that someone else's lesson exists.
    if (!learner) return { ok: false, status: 404, reason: 'Lesson not found.' };
    if (!wantObserver) role = 'learner';
    else if (requester.role === 'parent' && learner.isChild) role = 'guardian_observer';
    else return { ok: false, status: 403, reason: 'Watching is for a guardian of a child learner.' };
  }
  if (!OPEN_STATUSES.includes(booking.status)) return { ok: false, status: 409, reason: 'This lesson is not active.' };
  if (roomJoinState(booking, now) !== 'open') return { ok: false, status: 423, reason: 'The room is not open now.' };
  return { ok: true, role };
}

export type TicketPayload = { bookingId: string; role: RoomRole; userId: string; exp: number; joinId?: string; studentId?: string | null };

const mac = (body: string, secret: string) => crypto.createHmac('sha256', secret).update(`room-ticket:${body}`).digest();

/** `exp` is ms since epoch; the caller caps it at the room's hard close. */
export function signTicket(payload: TicketPayload, secret: string): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${body}.${mac(body, secret).toString('base64url')}`;
}

export function verifyTicket(token: string, secret: string, now: number = Date.now()): TicketPayload | null {
  if (!secret || typeof token !== 'string') return null;
  const [body, sig, extra] = token.split('.');
  if (!body || !sig || extra !== undefined) return null;
  const given = Buffer.from(sig, 'base64url');
  const expected = mac(body, secret);
  if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (typeof p?.bookingId !== 'string' || typeof p.role !== 'string' || typeof p.userId !== 'string' || typeof p.exp !== 'number') return null;
    return now < p.exp ? p : null;
  } catch {
    return null;
  }
}
