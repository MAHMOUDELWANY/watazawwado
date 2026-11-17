/**
 * When our own lesson room is open (classroom spec, 2026-11-17): from 10 minutes before the start, for teacher and
 * learner alike, until a hard close 15 minutes after the booked end, for every length and lesson type.
 * The Zoom fallback keeps its own rule in lessonWindow.ts. Shared by the server (tickets) and the room screen.
 */
import { lessonEndMs, type JoinState } from './lessonWindow.js';

export const ROOM_OPENS_MIN = 10;
export const ROOM_CLOSE_GRACE_MIN = 15;
export const TEACHER_LATE_GRACE_MIN = 2;

export type LessonTimes = {
  scheduled_start: string;
  scheduled_end?: string | null;
  duration_minutes?: number | null;
  status?: string | null;
};

export function roomHardCloseMs(lesson: LessonTimes): number {
  return lessonEndMs(lesson.scheduled_start, lesson.scheduled_end, lesson.duration_minutes) + ROOM_CLOSE_GRACE_MIN * 60_000;
}

export function roomJoinState(lesson: LessonTimes, now: number = Date.now()): JoinState {
  if (lesson.status === 'cancelled') return 'ended';
  const start = new Date(lesson.scheduled_start).getTime();
  if (!Number.isFinite(start)) return 'early';
  if (now >= roomHardCloseMs(lesson)) return 'ended';
  return now >= start - ROOM_OPENS_MIN * 60_000 ? 'open' : 'early';
}

export function remainingMs(lesson: LessonTimes, now: number): number {
  return Math.max(0, roomHardCloseMs(lesson) - now);
}

/** Whole minutes late (floor); 0 within the grace, when early, or when the teacher never joined. */
export function teacherLateMinutes(lesson: LessonTimes, firstTeacherJoinIso: string | null): number {
  if (!firstTeacherJoinIso) return 0;
  const late = Math.floor((new Date(firstTeacherJoinIso).getTime() - new Date(lesson.scheduled_start).getTime()) / 60_000);
  return late > TEACHER_LATE_GRACE_MIN ? late : 0;
}
