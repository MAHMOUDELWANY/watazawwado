/**
 * Classroom board (2.7): our own whiteboard, built on the slide pen. Pure: the element model, the sync payloads,
 * hit-testing for the eraser and select, undo, and the send pump. No React, no DOM, so node tests cover it.
 *
 * Every element lives in board units: the board is BOARD_W wide and as tall as its aspect says, so a mark stays on the
 * same words of a PDF page or picture whatever the screen size. `pts` is a flat [x, y, x, y, ...] list of whole units.
 */
import { MAX_BOARD_BYTES } from '../../lib/roomEvents';

export const BOARD_W = 1000;
/** The whiteboard is a 16:9 page; PDF pages and pictures use their own shape. */
export const WHITEBOARD_ASPECT = 16 / 9;
/** Our palette only (no green): ink black, crimson, teal, copper, gold, sand. */
export const BOARD_COLORS = ['#1E1410', '#C51F24', '#087D91', '#8B4935', '#E5A93C', '#D9B984'] as const;
export const PEN_W = 4;
export const MARKER_W = 22;
export const ERASE_R = 12;
export const TEXT_SIZE = 32;
/** At most one live message per this many ms per side (H6: Supabase Realtime allows 100 a second per project). */
export const SEND_EVERY_MS = 150;
/** A laser trail fades this long after its last update. */
export const LASER_MS = 800;

export type Tool = 'select' | 'pen' | 'marker' | 'eraser' | 'line' | 'arrow' | 'rect' | 'ellipse' | 'text' | 'laser';
export type ShapeKind = 'line' | 'arrow' | 'rect' | 'ellipse';
type Base = { id: string; version: number; isDeleted?: boolean; /** Whiteboard page, 1 when absent. */ page?: number };
export type StrokeEl = Base & { type: 'stroke'; tool: 'pen' | 'marker'; color: string; pts: number[] };
export type ShapeEl = Base & { type: ShapeKind; color: string; pts: number[] };
export type TextEl = Base & { type: 'text'; color: string; pts: number[]; text: string; size: number };
/** Live only: rides the same throttled messages as the drawing and is never saved. */
export type LaserEl = Base & { type: 'laser'; pts: number[] };
export type BoardEl = StrokeEl | ShapeEl | TextEl | LaserEl;
/** What the sync needs of any element (older saved scenes may hold other shapes; they are kept but not drawn). */
export type El = { id: string; version: number; isDeleted?: boolean; type?: string; page?: number };

export const newId = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
const live = (e: El) => !e.isDeleted && e.type !== 'laser';
const versionOf = (els: readonly El[]) => els.reduce((s, e) => s + e.version, 0);

// ---- sync ----------------------------------------------------------------------------------------------------

/** Both sides may draw (when allowed): keep the newer copy of each element, deletions included. */
export function mergeElements<T extends El>(local: readonly T[], remote: readonly T[]): T[] {
  const byId = new Map(local.map((e) => [e.id, e]));
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l || r.version > l.version) byId.set(r.id, r);
  }
  return [...byId.values()];
}

/** The page keeps every surface's latest scene from the deltas (its own and the other side's), deletions and lasers pruned. */
export function keepScene(prev: { sceneVersion: number; elements: unknown[]; page?: number } | undefined, e: { sceneVersion: number; elements: unknown[]; page?: number }) {
  const elements = mergeElements((prev?.elements ?? []) as El[], e.elements as El[]).filter(live);
  const page = e.page ?? prev?.page;
  return { sceneVersion: Math.max(prev?.sceneVersion ?? -1, e.sceneVersion), elements, ...(page ? { page } : {}) };
}

/**
 * What one send carries. `delta` (live channel): elements whose version changed since `sent`, a deletion only once.
 * `scene` (saved board): every live element, deleted ones and lasers pruned. `sceneVersion` only grows, because
 * pruning lowers the version sum and the server refuses an older scene. `full`: the saved scene would pass the cap.
 */
export function boardPayload<T extends El>(all: readonly T[], sent: ReadonlyMap<string, number>, prevSceneVersion: number) {
  const delta = all.filter((e) => sent.get(e.id) !== e.version && !(e.isDeleted && !sent.has(e.id)));
  const scene = all.filter(live);
  const sceneVersion = Math.max(versionOf(all), prevSceneVersion + 1);
  const full = JSON.stringify(scene).length > MAX_BOARD_BYTES - 1_000 || JSON.stringify(delta).length > MAX_BOARD_BYTES - 1_000;
  return { delta, scene, sceneVersion, full };
}

/**
 * At most one send per `ms`: the first change goes at once, changes inside the window go together at its end (so the
 * last one always goes). `flush` sends a waiting change now.
 */
export function createPump(ms: number, send: () => void, clock: { now: () => number; set: (fn: () => void, ms: number) => unknown; clear: (id: unknown) => void } = {
  now: () => Date.now(), set: (fn, t) => setTimeout(fn, t), clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>),
}) {
  let last = -Infinity;
  let timer: unknown = null;
  const fire = () => { timer = null; last = clock.now(); send(); };
  return {
    kick() {
      if (timer !== null) return;
      const wait = last + ms - clock.now();
      if (wait <= 0) fire();
      else timer = clock.set(fire, wait);
    },
    flush() { if (timer !== null) { clock.clear(timer); fire(); } },
    stop() { if (timer !== null) clock.clear(timer); timer = null; },
  };
}

// ---- geometry ------------------------------------------------------------------------------------------------

/** The largest box of this aspect that fits the container, centred. */
export function fitRect(w: number, h: number, aspect: number) {
  if (w <= 0 || h <= 0) return { x: 0, y: 0, w: 0, h: 0 };
  const fw = Math.min(w, h * aspect);
  const fh = fw / aspect;
  return { x: (w - fw) / 2, y: (h - fh) / 2, w: fw, h: fh };
}

/** Fewer points for the same line (Ramer-Douglas-Peucker), so strokes stay small on the wire and in the save. */
export function simplify(pts: number[], tol = 1): number[] {
  const n = pts.length / 2;
  if (n <= 2) return pts.slice();
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack: Array<[number, number]> = [[0, n - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let far = -1;
    let max = tol;
    for (let i = a + 1; i < b; i++) {
      const d = distToSeg(pts[2 * i], pts[2 * i + 1], pts[2 * a], pts[2 * a + 1], pts[2 * b], pts[2 * b + 1]);
      if (d > max) { max = d; far = i; }
    }
    if (far >= 0) { keep[far] = 1; stack.push([a, far], [far, b]); }
  }
  const out: number[] = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[2 * i], pts[2 * i + 1]);
  return out;
}

export function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax;
  const dy = by - ay;
  const len = dx * dx + dy * dy;
  const t = len ? Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len)) : 0;
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const ARABIC = /[֐-ࣿיִ-﷿ﹰ-﻿]/;
/** Text that starts with an Arabic (or Hebrew) letter is laid out right to left from where it was placed. */
export const isRtl = (text: string) => {
  const m = /[A-Za-zÀ-ɏ֐-ࣿיִ-﷿ﹰ-﻿]/.exec(text);
  return Boolean(m && ARABIC.test(m[0]));
};

/** Estimated text box (canvas measures the real width when it draws; 0.55 em per letter is close enough to pick it). */
export function textBox(e: TextEl, measure?: (line: string) => number) {
  const lines = e.text.split('\n');
  const w = Math.max(...lines.map((l) => (measure ? measure(l) : l.length * e.size * 0.55)), e.size * 0.5);
  const h = lines.length * e.size * 1.3;
  const [x, y] = e.pts;
  return { x: isRtl(e.text) ? x - w : x, y, w, h };
}

/** The box around an element in board units. */
export function bounds(e: BoardEl) {
  if (e.type === 'text') return textBox(e);
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (let i = 0; i < e.pts.length; i += 2) {
    x1 = Math.min(x1, e.pts[i]); x2 = Math.max(x2, e.pts[i]);
    y1 = Math.min(y1, e.pts[i + 1]); y2 = Math.max(y2, e.pts[i + 1]);
  }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

const ellipsePts = (x1: number, y1: number, x2: number, y2: number, n = 48) => {
  const cx = (x1 + x2) / 2, cy = (y1 + y2) / 2, rx = Math.abs(x2 - x1) / 2, ry = Math.abs(y2 - y1) / 2;
  const out: number[] = [];
  for (let i = 0; i <= n; i++) out.push(cx + rx * Math.cos((i / n) * 2 * Math.PI), cy + ry * Math.sin((i / n) * 2 * Math.PI));
  return out;
};

/** The outline of an element as a polyline (strokes and lines as drawn, rectangles and ellipses around their edge). */
export function outline(e: BoardEl): number[] {
  if (e.type === 'rect') {
    const [x1, y1, x2, y2] = e.pts;
    return [x1, y1, x2, y1, x2, y2, x1, y2, x1, y1];
  }
  if (e.type === 'ellipse') return ellipsePts(e.pts[0], e.pts[1], e.pts[2], e.pts[3]);
  return e.pts;
}

const half = (e: BoardEl) => (e.type === 'stroke' ? (e.tool === 'marker' ? MARKER_W : PEN_W) : PEN_W) / 2;

/** Does a circle of radius `r` at (x, y) touch the element? Text is hit anywhere in its box. */
export function hits(e: BoardEl, x: number, y: number, r: number): boolean {
  if (e.type === 'laser') return false;
  if (e.type === 'text') {
    const b = textBox(e);
    return x >= b.x - r && x <= b.x + b.w + r && y >= b.y - r && y <= b.y + b.h + r;
  }
  const p = outline(e);
  const reach = r + half(e);
  if (p.length === 2) return Math.hypot(x - p[0], y - p[1]) <= reach;
  for (let i = 0; i + 3 < p.length; i += 2) if (distToSeg(x, y, p[i], p[i + 1], p[i + 2], p[i + 3]) <= reach) return true;
  return false;
}

/** The topmost live element on this page under the point. */
export function topHit(els: readonly BoardEl[], page: number, x: number, y: number, r: number): BoardEl | undefined {
  for (let i = els.length - 1; i >= 0; i--) {
    const e = els[i];
    if (!e.isDeleted && (e.page ?? 1) === page && hits(e, x, y, r)) return e;
  }
  return undefined;
}

/** A moved copy (the caller sets the version). */
export const translate = <T extends BoardEl>(e: T, dx: number, dy: number): T =>
  ({ ...e, pts: e.pts.map((v, i) => Math.round(v + (i % 2 ? dy : dx))) });

// ---- undo ----------------------------------------------------------------------------------------------------

/** One user action: each element before (null when it was created) and after. */
export type Change = { before: BoardEl | null; after: BoardEl };

/** The target as a newer version than what the board holds now, so it wins on both sides. */
export const revise = (current: El | undefined, target: BoardEl): BoardEl =>
  ({ ...target, version: Math.max(current?.version ?? 0, target.version) + 1 });

/** Undo and redo of this side's own actions; each step comes back as new versions to apply and send. */
export function createHistory(limit = 100) {
  const done: Change[][] = [];
  const undone: Change[][] = [];
  return {
    record(c: Change[]) {
      if (!c.length) return;
      done.push(c);
      if (done.length > limit) done.shift();
      undone.length = 0;
    },
    undo(get: (id: string) => El | undefined): BoardEl[] {
      const c = done.pop();
      if (!c) return [];
      undone.push(c);
      return c.map(({ before, after }) => revise(get(after.id), before ?? { ...after, isDeleted: true }));
    },
    redo(get: (id: string) => El | undefined): BoardEl[] {
      const c = undone.pop();
      if (!c) return [];
      done.push(c);
      return c.map(({ after }) => revise(get(after.id), after));
    },
    get canUndo() { return done.length > 0; },
    get canRedo() { return undone.length > 0; },
  };
}
