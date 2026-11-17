/** Pure shapes and checks for the lesson room channel, shared by the browser and the server (no React, no Supabase). */
import type { Layer, Side } from '../classroom/engine/types';

/** What travels in the lesson room (NX-12): which lesson is open, where the teacher is, and the teacher's ink. Nothing else. */
export interface RoomState { track: string; number: number; page: number; step: number }
type Pt = [number, number];
export interface RoomInk { track: string; number: number; page: number; strokes: { tool: 'pen' | 'marker'; color: string; points: Pt[] }[]; laser: Pt[] }

const isPts = (v: any, max: number) => Array.isArray(v) && v.length <= max
  && v.every((p: any) => Array.isArray(p) && p.length === 2 && p.every((n: any) => Number.isFinite(n) && Math.abs(n) < 10000));

export function isRoomInk(v: any): v is RoomInk {
  return Boolean(v) && typeof v.track === 'string' && v.track.length < 60
    && [v.number, v.page].every((n) => Number.isInteger(n) && n >= 0 && n < 1000)
    && isPts(v.laser, 30) && Array.isArray(v.strokes) && v.strokes.length <= 300
    && v.strokes.every((s: any) => s && (s.tool === 'pen' || s.tool === 'marker') && typeof s.color === 'string' && /^#[0-9a-f]{3,8}$/i.test(s.color) && isPts(s.points, 4000));
}


export function isRoomState(v: any): v is RoomState {
  return Boolean(v) && typeof v.track === 'string' && v.track.length < 60
    && [v.number, v.page, v.step].every((n) => Number.isInteger(n) && n >= 0 && n < 1000);
}

/**
 * Classroom timeline (Release 1, Task 7): every typed event that travels on the room channel (event name 'ev').
 * `board.learnerDraw` is set by the teacher; a learner's board is kept only while the teacher allows drawing.
 */
export type RoomEvent =
  | { t: 'session'; side: Side; sessionId: string }
  | { t: 'slide'; state: RoomState }
  | { t: 'ink'; ink: RoomInk }
  | { t: 'board'; sceneVersion: number; elements: unknown[]; learnerDraw?: boolean }
  | { t: 'pdf'; fileId: string; page: number }
  | { t: 'pointer'; x: number; y: number }
  | { t: 'reaction'; kind: 'hand' | 'confused' | 'slower' | 'repeat' | 'thinking' }
  | { t: 'focus'; away: boolean; at: number }
  | { t: 'focus_warning_off'; off: boolean }
  | { t: 'quality'; side: Side; layer: Layer; link: 'good' | 'weak' | 'poor' }
  | { t: 'observer'; kind: 'guardian'; present: boolean }
  | { t: 'layout'; mode: 'conversation' | 'content' | 'screen' }
  | { t: 'end' };

export const MAX_EVENT_BYTES = 16_384; // lesson_timeline_events.payload limit
export const MAX_BOARD_BYTES = 200_000;
const SIDES = ['teacher', 'student'];
const oneOf = (list: readonly unknown[]) => (v: unknown) => list.includes(v);
const bool = (v: unknown) => typeof v === 'boolean';
const coord = (v: unknown) => Number.isFinite(v) && Math.abs(v as number) < 10000;
const idStr = (max: number) => (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= max;
const intIn = (max: number) => (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < max;
// One checker per key; an event with a missing, wrong or extra key is refused.
const EVENT_KEYS: Record<RoomEvent['t'], Record<string, (v: any) => boolean>> = {
  session: { side: oneOf(SIDES), sessionId: idStr(100) },
  slide: { state: isRoomState },
  ink: { ink: isRoomInk },
  board: { sceneVersion: intIn(Number.MAX_SAFE_INTEGER), elements: (v) => Array.isArray(v) && v.length <= 5000, learnerDraw: (v) => v === undefined || bool(v) },
  pdf: { fileId: idStr(200), page: intIn(10000) },
  pointer: { x: coord, y: coord },
  reaction: { kind: oneOf(['hand', 'confused', 'slower', 'repeat', 'thinking']) },
  focus: { away: bool, at: (v) => Number.isFinite(v) && v >= 0 },
  focus_warning_off: { off: bool },
  quality: { side: oneOf(SIDES), layer: oneOf(['f', 'h', 'q', 'l', 'audio_only']), link: oneOf(['good', 'weak', 'poor']) },
  observer: { kind: oneOf(['guardian']), present: bool },
  layout: { mode: oneOf(['conversation', 'content', 'screen']) },
  end: {},
};

export function isRoomEvent(v: any): v is RoomEvent {
  if (!v || typeof v !== 'object' || !Object.hasOwn(EVENT_KEYS, v.t)) return false;
  const keys = EVENT_KEYS[v.t as RoomEvent['t']];
  if (!Object.keys(v).every((k) => k === 't' || k in keys) || !Object.entries(keys).every(([k, ok]) => ok(v[k]))) return false;
  const bytes = JSON.stringify(v).length;
  return bytes <= (v.t === 'board' ? MAX_BOARD_BYTES : MAX_EVENT_BYTES);
}
