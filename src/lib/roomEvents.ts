/** Pure shapes and checks for the lesson room channel, shared by the browser and the server (no React, no Supabase). */
import type { Layer, LinkStats, Side } from '../classroom/engine/types';
import { TOOL_EVENT_KEYS, type ToolEvent } from './roomTools';

/** What travels in the lesson room (NX-12): which lesson is open, where the teacher is, and the teacher's ink. Nothing else. */
export interface RoomState { track: string; number: number; page: number; step: number; /** The series opening is playing. */ opening?: boolean;
  /** Saved only (never published): the teacher drew on this page, so the report draft counts it as taught (3.3). */ inked?: boolean }
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
    && [v.number, v.page, v.step].every((n) => Number.isInteger(n) && n >= 0 && n < 1000)
    && (v.opening === undefined || typeof v.opening === 'boolean')
    && (v.inked === undefined || v.inked === true);
}

/**
 * Classroom timeline (Release 1, Task 7): every typed event that travels on the room channel (event name 'ev').
 * `board.learnerDraw` is set by the teacher; a learner's board is kept only while the teacher allows drawing.
 * `board.surface`: which page the scene belongs to (`boardSurface`); none is the whiteboard.
 * `board.page`: the whiteboard page the teacher shows (2.7); the learner follows it.
 * `talk`: each side's speaking time in ms (2.8), saved by the teacher once per join, for the after-lesson report.
 */
export type RoomEvent =
  | { t: 'session'; side: Side; sessionId: string }
  | { t: 'slide'; state: RoomState }
  | { t: 'ink'; ink: RoomInk }
  | { t: 'board'; sceneVersion: number; elements: unknown[]; learnerDraw?: boolean; surface?: string; page?: number }
  | { t: 'pdf'; fileId: string; page: number }
  | { t: 'pointer'; x: number; y: number }
  | { t: 'reaction'; kind: 'hand' | 'confused' | 'slower' | 'repeat' | 'thinking' }
  | { t: 'focus'; away: boolean; at: number }
  | { t: 'focus_warning_off'; off: boolean }
  | { t: 'quality'; side: Side; layer: Layer; link: 'good' | 'weak' | 'poor'; stats?: LinkStats }
  | { t: 'observer'; kind: 'guardian'; present: boolean }
  | { t: 'layout'; mode: 'conversation' | 'content' | 'screen'; pane?: 'lesson' | 'board' | 'pdf' }
  /** Teacher's recitation mode, applied on both sides (live only). */
  | { t: 'recitation'; on: boolean }
  | { t: 'talk'; teacherMs: number; learnerMs: number }
  /** Teaching and practice tools (2.10, 2.11): see roomTools.ts. */
  | ToolEvent
  | { t: 'end' };

export const MAX_EVENT_BYTES = 16_384; // lesson_timeline_events.payload limit
export const MAX_BOARD_BYTES = 200_000;
/** The notes layer of one file page: each PDF page (or picture) keeps its own scene. */
export const boardSurface = (fileId: string, page: number) => `${fileId}#${page}`;
const SIDES = ['teacher', 'student'];
const oneOf = (list: readonly unknown[]) => (v: unknown) => list.includes(v);
const bool = (v: unknown) => typeof v === 'boolean';
const coord = (v: unknown) => Number.isFinite(v) && Math.abs(v as number) < 10000;
const idStr = (max: number) => (v: unknown) => typeof v === 'string' && v.length > 0 && v.length <= max;
const num = (v: unknown) => Number.isFinite(v) && Math.abs(v as number) < 1e7;
const STAT_KEYS = ['outLossPct', 'inLossPct', 'availableInKbps', 'availableOutKbps', 'rttMs'];
const OPTIONAL_STAT_KEYS = ['outFps', 'inFps', 'jitterMs'];
const isStats = (v: any) => Boolean(v) && typeof v === 'object' && STAT_KEYS.every((k) => num(v[k]))
  && Object.keys(v).every((k) => STAT_KEYS.includes(k) || (OPTIONAL_STAT_KEYS.includes(k) && num(v[k])));
const DAY_MS = 86_400_000;
const intIn = (max: number) => (v: unknown) => Number.isInteger(v) && (v as number) >= 0 && (v as number) < max;
// One checker per key; an event with a missing, wrong or extra key is refused.
const EVENT_KEYS: Record<RoomEvent['t'], Record<string, (v: any) => boolean>> = {
  session: { side: oneOf(SIDES), sessionId: idStr(100) },
  slide: { state: isRoomState },
  ink: { ink: isRoomInk },
  board: { sceneVersion: intIn(Number.MAX_SAFE_INTEGER), elements: (v) => Array.isArray(v) && v.length <= 5000, learnerDraw: (v) => v === undefined || bool(v), surface: (v) => v === undefined || idStr(220)(v), page: (v) => v === undefined || (intIn(100)(v) && v >= 1) },
  pdf: { fileId: idStr(200), page: intIn(10000) },
  pointer: { x: coord, y: coord },
  reaction: { kind: oneOf(['hand', 'confused', 'slower', 'repeat', 'thinking']) },
  focus: { away: bool, at: (v) => Number.isFinite(v) && v >= 0 },
  focus_warning_off: { off: bool },
  quality: { side: oneOf(SIDES), layer: oneOf(['a', 'b', 'c', 'audio_only']), link: oneOf(['good', 'weak', 'poor']), stats: (v) => v === undefined || isStats(v) },
  observer: { kind: oneOf(['guardian']), present: bool },
  layout: { mode: oneOf(['conversation', 'content', 'screen']), pane: (v) => v === undefined || oneOf(['lesson', 'board', 'pdf'])(v) },
  recitation: { on: bool },
  talk: { teacherMs: intIn(DAY_MS), learnerMs: intIn(DAY_MS) },
  ...TOOL_EVENT_KEYS,
  end: {},
};

export function isRoomEvent(v: any): v is RoomEvent {
  if (!v || typeof v !== 'object' || !Object.hasOwn(EVENT_KEYS, v.t)) return false;
  const keys = EVENT_KEYS[v.t as RoomEvent['t']];
  if (!Object.keys(v).every((k) => k === 't' || k in keys) || !Object.entries(keys).every(([k, ok]) => ok(v[k]))) return false;
  const bytes = JSON.stringify(v).length;
  return bytes <= (v.t === 'board' ? MAX_BOARD_BYTES : MAX_EVENT_BYTES);
}
