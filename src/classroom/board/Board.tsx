import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ArrowUpRight, ChevronLeft, ChevronRight, Circle, Eraser, Highlighter, Keyboard, Minus, MousePointer2, Move, PenLine,
  Plus, Redo2, Square, Trash2, Type, Undo2,
} from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import type { RoomEvent } from '../../lib/roomEvents';
import { Switch } from '../../components/ui/Switch';
import { Button } from '../../components/ui/Button';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { ArabicKeyboard } from './ArabicKeyboard';
import {
  BOARD_COLORS, BOARD_W, ERASE_R, LASER_MS, SEND_EVERY_MS, TEXT_SIZE, WHITEBOARD_ASPECT, boardPayload, createHistory,
  createPump, fitRect, hits, isRtl, newId, simplify, topHit, translate, type BoardEl, type Change, type Tool,
} from './model';
import { BOARD_FONT, drawEl, drawEraser, drawLaser, drawSelection } from './render';

export { boardPayload, keepScene, mergeElements } from './model';

type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';

/** How the board talks to the room: the channel (useLessonRoom) and, for saved events, the timeline batcher. */
export type BoardSync = {
  publishEvent: (e: RoomEvent) => void;
  onEvent: (fn: (e: RoomEvent) => void) => () => void;
  /** Timeline batcher push (Task 7); the server keeps only the latest board. */
  save?: (e: RoomEvent) => void;
  /** The latest scene of a surface (from /state on rejoin, then kept live), with the room's drawing permission. */
  initial?: (surface?: string) => { sceneVersion: number; elements: unknown[]; learnerDraw: boolean; page?: number } | undefined;
};

type Editing = { id: string | null; x: number; y: number; text: string; color: string; /** Anchored at its right edge. */ rtl: boolean };
type Active = { id: string; orig?: BoardEl; start?: [number, number]; erased?: BoardEl[] };

const DRAW_TOOLS: Array<[Tool, typeof PenLine, string, string]> = [
  ['select', Move, 'Select and move', 'تحديد وتحريك'],
  ['pen', PenLine, 'Pen', 'قلم'],
  ['marker', Highlighter, 'Highlighter', 'تظليل'],
  ['eraser', Eraser, 'Eraser', 'أستيكة'],
  ['line', Minus, 'Line', 'خط'],
  ['arrow', ArrowUpRight, 'Arrow', 'سهم'],
  ['rect', Square, 'Rectangle', 'مستطيل'],
  ['ellipse', Circle, 'Circle', 'دايرة'],
  ['text', Type, 'Text', 'كتابة'],
  ['laser', MousePointer2, 'Laser pointer', 'مؤشر ليزر'],
];
const COLOR_NAMES: Record<string, [string, string]> = {
  '#1E1410': ['Black', 'أسود'], '#C51F24': ['Crimson', 'أحمر'], '#087D91': ['Teal', 'تركواز'],
  '#8B4935': ['Copper', 'نحاسي'], '#E5A93C': ['Gold', 'دهبي'], '#D9B984': ['Sand', 'رملي'],
};

/**
 * Classroom 2.7: our own board, built on the slide pen (no third-party board). Pen, highlighter, stroke eraser, line,
 * arrow, rectangle, circle, Arabic text with the tashkeel keyboard, laser, select and move, undo and redo, clear page,
 * and whiteboard pages. The teacher always draws; the learner only while the teacher has "learner can draw" on;
 * observers watch. Marks are in board units (see model.ts), so on a PDF page or picture they stay on the words.
 * Drawing runs on two canvases redrawn in requestAnimationFrame; pointer moves never re-render React.
 * Changes go out on the room channel at most every SEND_EVERY_MS (H6) and as the saved board (H5, rejoin).
 */
export function Board({ role, sync, transparent = false, surface, image }: {
  role: RoomRole; sync: BoardSync;
  /** Sits over a PDF page as its notes layer, filling the page exactly. */
  transparent?: boolean;
  /** Which page these notes belong to (`boardSurface`); none is the whiteboard. Mount one Board per surface (key). */
  surface?: string;
  /** A picture to write on: the board takes its shape and draws over it. */
  image?: string;
}) {
  const { t, isAr } = useT();
  const teacher = role === 'teacher';
  const whiteboard = !surface;
  const [initial] = useState(() => sync.initial?.(surface));
  const [learnerDraw, setLearnerDraw] = useState(initial?.learnerDraw ?? false);
  const canDraw = teacher || (role === 'learner' && learnerDraw);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState<string>(BOARD_COLORS[0]);
  const [page, setPage] = useState(whiteboard ? Math.max(1, initial?.page ?? 1) : 1);
  const [full, setFull] = useState(false);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [keyboard, setKeyboard] = useState(false);
  const [imgAspect, setImgAspect] = useState<number | null>(null);
  const [fit, setFit] = useState({ x: 0, y: 0, w: 0, h: 0, boxW: 0 });
  const [, setRev] = useState(0);
  const rerender = useCallback(() => setRev((r) => r + 1), []);

  const initialEls = (initial?.elements ?? []) as BoardEl[];
  const els = useRef(new Map(initialEls.map((e) => [e.id, e])));
  /** Version of each element as last sent or received: only newer ones go out. */
  const sent = useRef(new Map(initialEls.map((e) => [e.id, e.version])));
  const sceneVersion = useRef(initial?.sceneVersion ?? -1);
  const history = useRef(createHistory());
  const wrap = useRef<HTMLDivElement>(null);
  const sceneCv = useRef<HTMLCanvasElement>(null);
  const liveCv = useRef<HTMLCanvasElement>(null);
  const textArea = useRef<HTMLTextAreaElement>(null);
  const view = useRef({ scale: 1, h: BOARD_W / WHITEBOARD_ASPECT });
  const active = useRef<Active | null>(null);
  const selected = useRef<string | null>(null);
  const lasers = useRef(new Map<string, number>());
  const cursor = useRef<[number, number] | null>(null);
  const dirty = useRef({ scene: true, live: true });
  const frame = useRef(0);
  const skipCommit = useRef(false);
  // Pointer listeners are attached once; they read the latest settings here.
  const now = useRef({ tool, color, page, canDraw, learnerDraw, editing });
  now.current = { tool, color, page, canDraw, learnerDraw, editing };

  const list = () => [...els.current.values()];
  const onPage = (e: BoardEl) => (e.page ?? 1) === now.current.page;

  // ---- paint ---------------------------------------------------------------------------------------------------
  const paint = useCallback(() => {
    frame.current = 0;
    const dpr = window.devicePixelRatio || 1;
    const k = dpr * view.current.scale;
    const editingId = now.current.editing?.id;
    const scene = sceneCv.current?.getContext('2d');
    if (scene && dirty.current.scene) {
      dirty.current.scene = false;
      scene.setTransform(1, 0, 0, 1, 0, 0);
      scene.clearRect(0, 0, scene.canvas.width, scene.canvas.height);
      scene.setTransform(k, 0, 0, k, 0, 0);
      for (const e of els.current.values()) if (onPage(e) && e.id !== active.current?.id && e.id !== editingId) drawEl(scene, e);
    }
    const live = liveCv.current?.getContext('2d');
    let again = false;
    if (live && dirty.current.live) {
      dirty.current.live = false;
      live.setTransform(1, 0, 0, 1, 0, 0);
      live.clearRect(0, 0, live.canvas.width, live.canvas.height);
      live.setTransform(k, 0, 0, k, 0, 0);
      const a = active.current && els.current.get(active.current.id);
      if (a) drawEl(live, a);
      const sel = selected.current && els.current.get(selected.current);
      if (sel && !sel.isDeleted && onPage(sel)) drawSelection(live, sel);
      const t0 = performance.now();
      for (const [id, at] of lasers.current) {
        const l = els.current.get(id);
        const age = t0 - at;
        if (!l || age > LASER_MS) { lasers.current.delete(id); if (l?.type === 'laser') els.current.delete(id); continue; }
        if (onPage(l)) drawLaser(live, l.pts, age);
        again = true;
      }
      if (now.current.tool === 'eraser' && cursor.current && now.current.canDraw) drawEraser(live, cursor.current[0], cursor.current[1], ERASE_R);
    }
    if (again) { dirty.current.live = true; frame.current = requestAnimationFrame(paint); }
  }, []);
  const schedule = useCallback((scene = true) => {
    if (scene) dirty.current.scene = true;
    dirty.current.live = true;
    if (!frame.current) frame.current = requestAnimationFrame(paint);
  }, [paint]);
  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => { selected.current = null; schedule(); }, [page, editing, tool, schedule]);

  // ---- send ----------------------------------------------------------------------------------------------------
  const fullNow = useRef(false);
  const on = surface ? { surface } : {};
  const sendNow = useRef(() => {});
  sendNow.current = () => {
    const p = boardPayload(list(), sent.current, sceneVersion.current);
    // Never stop silently: over the cap nothing is sent and the board says so until it is cleared below the cap.
    if (p.full !== fullNow.current) { fullNow.current = p.full; setFull(p.full); }
    const flag = { ...(teacher ? { learnerDraw: now.current.learnerDraw } : {}), ...(teacher && whiteboard ? { page: now.current.page } : {}), ...on };
    if (p.full) {
      // The drawing switch and the page still reach the learner live (the saved board keeps its last good scene).
      if (teacher) sync.publishEvent({ t: 'board', sceneVersion: sceneVersion.current, elements: [], ...flag });
      return;
    }
    sceneVersion.current = p.sceneVersion;
    for (const e of p.delta) sent.current.set(e.id, e.version);
    sync.publishEvent({ t: 'board', sceneVersion: p.sceneVersion, elements: p.delta, ...flag });
    // The saved board (rejoin snapshot) is always the whole live scene; the batcher keeps only the latest per page.
    sync.save?.({ t: 'board', sceneVersion: p.sceneVersion, elements: p.scene, ...flag });
  };
  const [pump] = useState(() => createPump(SEND_EVERY_MS, () => sendNow.current()));
  // Leaving this page (or the room) sends what is still waiting.
  useEffect(() => () => pump.flush(), [pump]);

  /** Every local change is a newer version of the element, then goes out with the next send. */
  const put = useCallback((e: BoardEl) => {
    const next = { ...e, version: (els.current.get(e.id)?.version ?? 0) + 1 } as BoardEl;
    els.current.set(e.id, next);
    pump.kick();
    return next;
  }, [pump]);
  const apply = useCallback((changed: BoardEl[]) => {
    for (const e of changed) els.current.set(e.id, e);
    if (changed.length) { pump.kick(); schedule(); rerender(); }
  }, [pump, schedule, rerender]);
  const record = useCallback((c: Change[]) => { history.current.record(c); rerender(); }, [rerender]);

  // ---- remote --------------------------------------------------------------------------------------------------
  useEffect(() => sync.onEvent((e) => {
    if (e.t !== 'board') return;
    if (e.learnerDraw !== undefined && !teacher) setLearnerDraw(e.learnerDraw);
    // Another page's notes never land on this one.
    if (e.surface !== surface) return;
    if (!teacher && whiteboard && e.page) setPage(e.page);
    sceneVersion.current = Math.max(sceneVersion.current, e.sceneVersion);
    const t0 = performance.now();
    for (const r of e.elements as BoardEl[]) {
      const l = els.current.get(r.id);
      if ((l && r.version <= l.version) || r.id === active.current?.id) continue;
      els.current.set(r.id, r);
      if ((sent.current.get(r.id) ?? -1) < r.version) sent.current.set(r.id, r.version);
      if (r.type === 'laser') lasers.current.set(r.id, t0);
    }
    schedule();
    rerender();
  }), [sync, teacher, surface, whiteboard, schedule, rerender]);

  // ---- size ----------------------------------------------------------------------------------------------------
  const aspect = image ? imgAspect : transparent ? null : WHITEBOARD_ASPECT;
  useLayoutEffect(() => {
    const box = wrap.current;
    if (!box) return;
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = box;
      const f = aspect ? fitRect(w, h, aspect) : { x: 0, y: 0, w, h };
      if (!f.w || !f.h) return;
      view.current = { scale: f.w / BOARD_W, h: (BOARD_W * f.h) / f.w };
      const dpr = window.devicePixelRatio || 1;
      for (const cv of [sceneCv.current, liveCv.current]) if (cv) { cv.width = Math.round(f.w * dpr); cv.height = Math.round(f.h * dpr); }
      setFit((o) => (o.x === f.x && o.y === f.y && o.w === f.w && o.h === f.h && o.boxW === w ? o : { ...f, boxW: w }));
      schedule();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(box);
    return () => ro.disconnect();
  }, [aspect, schedule]);

  // ---- pointer -------------------------------------------------------------------------------------------------
  useEffect(() => {
    const cv = liveCv.current;
    if (!cv) return;
    const toBoard = (ev: { clientX: number; clientY: number }): [number, number] => {
      const r = cv.getBoundingClientRect();
      return [Math.round(((ev.clientX - r.left) / r.width) * BOARD_W), Math.round(((ev.clientY - r.top) / r.height) * view.current.h)];
    };
    const erase = (a: Active, x: number, y: number) => {
      for (const e of els.current.values()) {
        if (e.isDeleted || e.type === 'laser' || !onPage(e) || !hits(e, x, y, ERASE_R)) continue;
        a.erased!.push(e);
        put({ ...e, isDeleted: true });
      }
    };
    const down = (ev: PointerEvent) => {
      const s = now.current;
      if (!s.canDraw || ev.button > 0) return;
      ev.preventDefault();
      // A click away from the text being typed finishes it.
      if (s.editing) { textArea.current?.blur(); return; }
      const [x, y] = toBoard(ev);
      const pg = whiteboard ? { page: s.page } : {};
      if (s.tool === 'text') {
        const hit = topHit(list(), s.page, x, y, 4);
        if (hit?.type === 'text') setEditing({ id: hit.id, x: hit.pts[0], y: hit.pts[1], text: hit.text, color: hit.color, rtl: isRtl(hit.text) });
        else setEditing({ id: null, x, y, text: '', color: s.color, rtl: isAr });
        return;
      }
      cv.setPointerCapture?.(ev.pointerId);
      if (s.tool === 'select') {
        const hit = topHit(list(), s.page, x, y, 6);
        selected.current = hit?.id ?? null;
        if (hit) active.current = { id: hit.id, orig: hit, start: [x, y] };
      } else if (s.tool === 'eraser') {
        active.current = { id: '', erased: [] };
        erase(active.current, x, y);
      } else if (s.tool === 'laser') {
        const id = newId();
        active.current = { id };
        put({ id, version: 0, type: 'laser', pts: [x, y], ...pg });
        lasers.current.set(id, performance.now());
      } else {
        const id = newId();
        active.current = { id };
        put(s.tool === 'pen' || s.tool === 'marker'
          ? { id, version: 0, type: 'stroke', tool: s.tool, color: s.color, pts: [x, y], ...pg }
          : { id, version: 0, type: s.tool as 'line', color: s.color, pts: [x, y, x, y], ...pg });
      }
      schedule();
    };
    const move = (ev: PointerEvent) => {
      const s = now.current;
      if (!s.canDraw) return;
      cursor.current = toBoard(ev);
      const a = active.current;
      if (!a) { if (s.tool === 'eraser') schedule(false); return; }
      // H6: while a mark is being drawn it is already live, so the room's own pointer message is not sent as well.
      ev.stopPropagation();
      const coalesced = ev.getCoalescedEvents?.() ?? [];
      const pts = (coalesced.length ? coalesced : [ev]).map(toBoard);
      if (s.tool === 'eraser') { for (const [x, y] of pts) erase(a, x, y); schedule(); return; }
      const el = els.current.get(a.id);
      if (!el) return;
      const [x, y] = pts[pts.length - 1];
      if (a.orig && a.start) {
        put(translate(a.orig, x - a.start[0], y - a.start[1]));
      } else if (el.type === 'stroke' || el.type === 'laser') {
        const p = el.pts.slice();
        for (const [px, py] of pts) if (Math.hypot(px - p[p.length - 2], py - p[p.length - 1]) >= 1.5) p.push(px, py);
        put({ ...el, pts: el.type === 'laser' ? p.slice(-32) : p });
        if (el.type === 'laser') lasers.current.set(el.id, performance.now());
      } else if (el.type !== 'text') {
        put({ ...el, pts: [el.pts[0], el.pts[1], x, y] });
      }
      schedule(false);
    };
    const up = () => {
      const a = active.current;
      active.current = null;
      if (!a) return;
      if (a.erased) {
        if (a.erased.length) record(a.erased.map((before) => ({ before, after: els.current.get(before.id)! })));
      } else {
        const el = els.current.get(a.id);
        if (el && el.type !== 'laser') {
          if (a.orig) {
            if (el.version !== a.orig.version) record([{ before: a.orig, after: el }]);
          } else if (el.type === 'stroke') {
            record([{ before: null, after: put({ ...el, pts: simplify(el.pts) }) }]);
          } else {
            const [x1, y1, x2, y2] = el.pts;
            // A click without a drag leaves no dot of a shape; if it already went out, it goes as deleted.
            if (Math.hypot(x2 - x1, y2 - y1) < 3) { if (sent.current.has(el.id)) put({ ...el, isDeleted: true }); else els.current.delete(el.id); }
            else record([{ before: null, after: el }]);
          }
        }
      }
      schedule();
    };
    const leave = () => { cursor.current = null; schedule(false); };
    cv.addEventListener('pointerdown', down);
    cv.addEventListener('pointermove', move);
    cv.addEventListener('pointerup', up);
    cv.addEventListener('pointercancel', up);
    cv.addEventListener('pointerleave', leave);
    return () => {
      cv.removeEventListener('pointerdown', down);
      cv.removeEventListener('pointermove', move);
      cv.removeEventListener('pointerup', up);
      cv.removeEventListener('pointercancel', up);
      cv.removeEventListener('pointerleave', leave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [put, record, schedule, whiteboard, isAr]);

  // ---- text ----------------------------------------------------------------------------------------------------
  useEffect(() => { if (editing) textArea.current?.focus(); }, [editing]);
  const commitText = () => {
    const ed = editing;
    const ta = textArea.current;
    setEditing(null);
    if (!ed || !ta || skipCommit.current) { skipCommit.current = false; return; }
    const text = ta.value.replace(/\s+$/, '');
    const prev = ed.id ? els.current.get(ed.id) : undefined;
    if (!text) {
      if (prev && !prev.isDeleted) record([{ before: prev, after: put({ ...prev, isDeleted: true }) }]);
      schedule();
      return;
    }
    // The text is drawn from its start edge: the right one for Arabic, the left one otherwise.
    const w = ta.offsetWidth / view.current.scale;
    const x = isRtl(text) === ed.rtl ? ed.x : ed.rtl ? ed.x - w : ed.x + w;
    const base = prev?.type === 'text' ? prev : { id: newId(), version: 0, type: 'text' as const, ...(whiteboard ? { page } : {}) };
    const after = put({ ...base, color: ed.color, pts: [Math.round(x), ed.y], text, size: TEXT_SIZE });
    record([{ before: prev ?? null, after }]);
    schedule();
  };

  // ---- actions -------------------------------------------------------------------------------------------------
  const get = (id: string) => els.current.get(id);
  const undo = () => apply(history.current.undo(get));
  const redo = () => apply(history.current.redo(get));
  const removeSelected = () => {
    const e = selected.current && els.current.get(selected.current);
    if (!e || e.isDeleted) return;
    selected.current = null;
    record([{ before: e, after: put({ ...e, isDeleted: true }) }]);
    schedule();
  };
  const clearPage = () => {
    const gone = list().filter((e) => !e.isDeleted && e.type !== 'laser' && onPage(e));
    if (!gone.length) return;
    record(gone.map((before) => ({ before, after: put({ ...before, isDeleted: true }) })));
    schedule();
  };
  const goPage = (n: number) => {
    now.current.page = n;
    setPage(n);
    pump.kick();
  };
  const toggleLearnerDraw = (next: boolean) => {
    now.current.learnerDraw = next;
    setLearnerDraw(next);
    pump.kick();
    pump.flush();
  };
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLTextAreaElement) {
      if (e.key === 'Escape') { skipCommit.current = true; textArea.current?.blur(); }
      else if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); textArea.current?.blur(); }
      e.stopPropagation(); // the room's own shortcuts (mute, camera) must not fire while typing
      return;
    }
    if (!canDraw) return;
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    else if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selected.current) { e.preventDefault(); removeSelected(); }
  };

  const pages = whiteboard ? Math.max(page, ...list().filter((e) => !e.isDeleted).map((e) => e.page ?? 1)) : 1;
  const tools = DRAW_TOOLS.filter(([k]) => teacher || k !== 'laser');
  const scale = view.current.scale;
  // Prev/next arrows point the reading way.
  const Prev = isAr ? ChevronRight : ChevronLeft;
  const Next = isAr ? ChevronLeft : ChevronRight;
  const iconBtn = (pressed?: boolean) => cn('h-9 w-9 rounded-lg', pressed && 'bg-sand-light text-accent ring-1 ring-sand-border');

  const toolbar = canDraw && (
    <div role="toolbar" aria-label={t('Board tools', 'أدوات السبورة')} dir={isAr ? 'rtl' : 'ltr'}
      className={cn('flex flex-wrap items-center gap-1 bg-surface px-2 py-1',
        transparent ? 'pointer-events-auto sticky top-2 z-20 mx-2 mt-2 w-fit max-w-[calc(100%-1rem)] rounded-xl border border-border shadow-sm' : 'border-b border-border')}>
      {tools.map(([k, Icon, en, ar]) => (
        <Button key={k} variant="ghost" size="icon" className={iconBtn(tool === k)} aria-pressed={tool === k} aria-label={t(en, ar)} title={t(en, ar)} onClick={() => setTool(k)}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </Button>
      ))}
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      {BOARD_COLORS.map((c) => (
        <button key={c} type="button" onClick={() => setColor(c)} aria-pressed={color === c} aria-label={t(COLOR_NAMES[c][0], COLOR_NAMES[c][1])} title={t(COLOR_NAMES[c][0], COLOR_NAMES[c][1])}
          className="inline-flex h-9 w-7 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-primary">
          <span className={cn('block h-5 w-5 rounded-full ring-2 ring-offset-2 ring-offset-surface', color === c ? 'ring-foreground' : 'ring-transparent')} style={{ background: c }} />
        </button>
      ))}
      <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
      <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('Undo', 'تراجع')} title={t('Undo', 'تراجع')} disabled={!history.current.canUndo} onClick={undo}><Undo2 className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" /></Button>
      <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('Redo', 'إعادة')} title={t('Redo', 'إعادة')} disabled={!history.current.canRedo} onClick={redo}><Redo2 className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" /></Button>
      {teacher && <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('Clear this page', 'امسح الصفحة دي')} title={t('Clear this page', 'امسح الصفحة دي')} onClick={clearPage}><Trash2 className="h-5 w-5" aria-hidden="true" /></Button>}
      {tool === 'text' && (
        // Keeps the caret in the text being typed (no focus change on press).
        <Button variant="ghost" size="icon" className={iconBtn(keyboard)} aria-pressed={keyboard} aria-label={t('Arabic keyboard', 'كيبورد عربي')} title={t('Arabic keyboard', 'كيبورد عربي')}
          onMouseDown={(e) => e.preventDefault()} onClick={() => setKeyboard((k) => !k)}><Keyboard className="h-5 w-5" aria-hidden="true" /></Button>
      )}
      {teacher && whiteboard && (
        <span className="ms-auto inline-flex items-center gap-1 text-sm text-muted-foreground">
          <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('Previous page', 'الصفحة اللي فاتت')} disabled={page <= 1} onClick={() => goPage(page - 1)}><Prev className="h-5 w-5" aria-hidden="true" /></Button>
          <span className="tabular-nums">{page} / {pages}</span>
          <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('Next page', 'الصفحة اللي بعدها')} disabled={page >= pages} onClick={() => goPage(page + 1)}><Next className="h-5 w-5" aria-hidden="true" /></Button>
          <Button variant="ghost" size="icon" className={iconBtn()} aria-label={t('New page', 'صفحة جديدة')} title={t('New page', 'صفحة جديدة')} onClick={() => goPage(pages + 1)}><Plus className="h-5 w-5" aria-hidden="true" /></Button>
        </span>
      )}
      {teacher && (
        <Switch checked={learnerDraw} onChange={toggleLearnerDraw} className={cn('px-2', !whiteboard && 'ms-auto')}>
          {t('Learner can draw', 'الطالب يقدر يرسم')}
        </Switch>
      )}
    </div>
  );

  const cursorStyle = !canDraw ? 'default' : tool === 'text' ? 'text' : tool === 'select' ? 'default' : tool === 'eraser' || tool === 'laser' ? 'none' : 'crosshair';
  const canvasBox = { left: fit.x, top: fit.y, width: fit.w, height: fit.h };
  return (
    <div className={cn('room-board relative flex h-full w-full flex-col', transparent && 'pointer-events-none')} onKeyDown={onKeyDown}>
      {/* Over a PDF page the tools float and stay in view while the page scrolls; the board itself covers the page. */}
      {toolbar}
      {!transparent && !canDraw && whiteboard && pages > 1 && (
        <p className="border-b border-border bg-surface px-3 py-1 text-xs text-muted-foreground">{t(`Page ${page} of ${pages}`, `صفحة ${page} من ${pages}`)}</p>
      )}
      <div ref={wrap} className={cn(transparent ? 'absolute inset-0' : 'relative min-h-0 flex-1 bg-surface-subtle')}>
        {full && (
          <p role="status" className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm">
            {t('The board is full. Clear some of it to keep sharing.', 'السبورة اتملت. امسح جزء منها عشان نكمل المشاركة.')}
          </p>
        )}
        {!transparent && (
          image
            ? <img src={image} alt="" onLoad={(e) => setImgAspect(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight || 1)}
                className="absolute object-contain" style={imgAspect ? canvasBox : { inset: 0, width: '100%', height: '100%' }} />
            : <div className="absolute rounded-md bg-[#FFFDF7] shadow-sm ring-1 ring-border" style={canvasBox} aria-hidden="true" />
        )}
        {image && !imgAspect && <div className="absolute inset-0 grid place-items-center"><BrandSpinner /></div>}
        <canvas ref={sceneCv} data-board="scene" className="pointer-events-none absolute" style={canvasBox} aria-hidden="true" />
        <canvas ref={liveCv} data-board="live" className={cn('absolute', canDraw ? 'pointer-events-auto' : 'pointer-events-none')}
          style={{ ...canvasBox, cursor: cursorStyle, touchAction: canDraw ? 'none' : 'auto' }}
          role="img" aria-label={t('Whiteboard', 'السبورة')} />
        {editing && (
          <textarea ref={textArea} dir="auto" lang={editing.rtl ? 'ar' : undefined} defaultValue={editing.text} onBlur={commitText} rows={1}
            aria-label={t('Text on the board', 'كتابة على السبورة')}
            className="pointer-events-auto absolute z-20 resize-none overflow-hidden rounded border border-dashed border-teal bg-transparent p-0 outline-none"
            style={{
              top: fit.y + editing.y * scale,
              ...(editing.rtl ? { right: fit.boxW - (fit.x + editing.x * scale) } : { left: fit.x + editing.x * scale }),
              color: editing.color, font: `${TEXT_SIZE * scale}px/1.3 ${BOARD_FONT}`, minWidth: '4em', maxWidth: fit.w,
              fieldSizing: 'content',
            } as React.CSSProperties} />
        )}
        {editing && keyboard && (
          <div className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 mx-auto max-w-xl"><ArabicKeyboard /></div>
        )}
      </div>
    </div>
  );
}
