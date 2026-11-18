import React, { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import { useT } from '../../lib/language';
import { MAX_BOARD_BYTES, type RoomEvent } from '../../lib/roomEvents';
import { Switch } from '../../components/ui/Switch';
import { BrandSpinner } from '../../components/ui/BrandLoader';

type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
type El = { id: string; version: number; isDeleted?: boolean };

/** How the board talks to the room: the channel (useLessonRoom) and, for saved events, the timeline batcher. */
export type BoardSync = {
  publishEvent: (e: RoomEvent) => void;
  onEvent: (fn: (e: RoomEvent) => void) => () => void;
  /** Timeline batcher push (Task 7); the server keeps only the latest board. */
  save?: (e: RoomEvent) => void;
  /** The board from /state on rejoin. */
  initial?: { sceneVersion: number; elements: unknown[]; learnerDraw: boolean };
};

// Excalidraw (and its CSS) load only when a board is shown, so it stays out of every other chunk.
const Excalidraw = lazy(async () => {
  const [m] = await Promise.all([import('@excalidraw/excalidraw'), import('@excalidraw/excalidraw/index.css')]);
  return { default: m.Excalidraw };
});

const PUBLISH_DEBOUNCE_MS = 150;
const versionOf = (els: readonly El[]) => els.reduce((s, e) => s + e.version, 0);

/** Both sides may draw (when allowed): keep the newer copy of each element, deletions included. */
export function mergeElements(local: readonly El[], remote: readonly El[]): El[] {
  const byId = new Map(local.map((e) => [e.id, e]));
  for (const r of remote) {
    const l = byId.get(r.id);
    if (!l || r.version > l.version) byId.set(r.id, r);
  }
  return [...byId.values()];
}

/**
 * What one send carries. `delta` (live channel): elements whose version changed since `sent`, a deletion only once.
 * `scene` (saved board): every live element, deleted ones pruned. `sceneVersion` only grows, because pruning lowers
 * the version sum and the server refuses an older scene. `full`: the saved scene would pass the cap; send nothing.
 */
export function boardPayload(all: readonly El[], sent: ReadonlyMap<string, number>, prevSceneVersion: number) {
  const delta = all.filter((e) => sent.get(e.id) !== e.version && !(e.isDeleted && !sent.has(e.id)));
  const scene = all.filter((e) => !e.isDeleted);
  const sceneVersion = Math.max(versionOf(all), prevSceneVersion + 1);
  const full = JSON.stringify(scene).length > MAX_BOARD_BYTES - 1_000 || JSON.stringify(delta).length > MAX_BOARD_BYTES - 1_000;
  return { delta, scene, sceneVersion, full };
}

/**
 * Classroom Task 8: the shared whiteboard. The teacher always draws; the learner draws only while the teacher has
 * "learner can draw" on; observers watch. Changes go out on the room channel, debounced, and as the saved board.
 * `transparent` lets it sit over a PDF page as the annotation layer.
 */
export function Board({ role, sync, transparent = false }: { role: RoomRole; sync: BoardSync; transparent?: boolean }) {
  const { t, isAr } = useT();
  const teacher = role === 'teacher';
  const [learnerDraw, setLearnerDraw] = useState(sync.initial?.learnerDraw ?? false);
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const initialEls = (sync.initial?.elements ?? []) as El[];
  const lastVersion = useRef(versionOf(initialEls));
  const sceneVersion = useRef(sync.initial?.sceneVersion ?? -1);
  /** Version of each element as last sent or received: only newer ones go out. */
  const sent = useRef(new Map(initialEls.map((e) => [e.id, e.version])));
  const timer = useRef<number | null>(null);
  const [full, setFull] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const canDraw = teacher || (role === 'learner' && learnerDraw);

  const send = useCallback((elements: readonly El[], draw: boolean) => {
    const p = boardPayload(elements, sent.current, sceneVersion.current);
    // Never stop silently: over the cap nothing is sent and the board says so until it is cleared below the cap.
    setFull(p.full);
    if (p.full) {
      // The drawing switch still reaches the learner live (the saved board keeps its last good scene).
      if (teacher) sync.publishEvent({ t: 'board', sceneVersion: sceneVersion.current, elements: [], learnerDraw: draw });
      return;
    }
    sceneVersion.current = p.sceneVersion;
    for (const e of p.delta) sent.current.set(e.id, e.version);
    const flag = teacher ? { learnerDraw: draw } : {};
    sync.publishEvent({ t: 'board', sceneVersion: p.sceneVersion, elements: p.delta, ...flag });
    // The saved board (rejoin snapshot) is always the whole live scene.
    sync.save?.({ t: 'board', sceneVersion: p.sceneVersion, elements: p.scene, ...flag });
  }, [sync, teacher]);

  // Remote changes: merge, never echo back.
  useEffect(() => sync.onEvent((e) => {
    if (e.t !== 'board') return;
    if (e.learnerDraw !== undefined && !teacher) setLearnerDraw(e.learnerDraw);
    sceneVersion.current = Math.max(sceneVersion.current, e.sceneVersion);
    const a = api.current;
    if (!a) return;
    const merged = mergeElements(a.getSceneElementsIncludingDeleted() as readonly El[], e.elements as El[]);
    for (const el of merged) if ((sent.current.get(el.id) ?? -1) < el.version) sent.current.set(el.id, el.version);
    lastVersion.current = versionOf(merged);
    a.updateScene({ elements: merged as any });
  }), [sync, teacher]);

  // R1 has no image sync (excalidraw `files` would blow the cap): the image tool is off, which also makes Excalidraw
  // refuse pasted or dropped image files; pasted board elements that carry images are refused here. Pictures go through "Add file".
  const onPaste = useCallback((data: { elements?: readonly { type: string }[]; files?: object }) => {
    if (!data.elements?.some((e) => e.type === 'image') && !(data.files && Object.keys(data.files).length)) return true;
    setNotice(t('Pictures cannot go on the board yet. Use "Add file" to show a picture.', 'لسه مينفعش نحط صور على السبورة. استخدم "إضافة ملف" عشان تعرض صورة.'));
    return false;
  }, [t]);

  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const onChange = useCallback((elements: readonly El[]) => {
    if (!canDraw) return;
    const v = versionOf(elements);
    if (v === lastVersion.current) return; // selection, scroll and remote updates do not change versions
    lastVersion.current = v;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      send(api.current?.getSceneElementsIncludingDeleted() as readonly El[] ?? elements, learnerDraw);
    }, PUBLISH_DEBOUNCE_MS);
  }, [canDraw, send, learnerDraw]);

  useEffect(() => {
    if (!notice) return;
    const id = window.setTimeout(() => setNotice(null), 6000);
    return () => window.clearTimeout(id);
  }, [notice]);

  const toggleLearnerDraw = (next: boolean) => {
    setLearnerDraw(next);
    send((api.current?.getSceneElementsIncludingDeleted() ?? []) as readonly El[], next);
  };

  return (
    <div className="relative flex h-full w-full flex-col">
      {teacher && (
        <Switch checked={learnerDraw} onChange={toggleLearnerDraw} className="px-3 border-b border-border bg-surface">
          {t('Learner can draw', 'الطالب يقدر يرسم')}
        </Switch>
      )}
      <div className="relative min-h-0 flex-1" dir={isAr ? 'rtl' : 'ltr'}>
        {(full || notice) && (
          <p role="status" className="absolute inset-x-3 top-3 z-10 rounded-md border border-border bg-surface px-3 py-2 text-sm text-foreground shadow-sm">
            {full ? t('The board is full. Clear some of it to keep sharing.', 'السبورة اتملت. امسح جزء منها عشان نكمل المشاركة.') : notice}
          </p>
        )}
        <Suspense fallback={<div className="grid h-full place-items-center"><BrandSpinner /></div>}>
          <Excalidraw
            excalidrawAPI={(a) => { api.current = a; }}
            initialData={{
              elements: (sync.initial?.elements ?? []) as any,
              appState: transparent ? { viewBackgroundColor: 'transparent' } : undefined,
            }}
            onChange={(els) => onChange(els as readonly El[])}
            onPaste={onPaste}
            viewModeEnabled={!canDraw}
            // The UI follows the site language; Arabic text on the canvas is laid out right to left by Excalidraw itself.
            langCode={isAr ? 'ar-SA' : 'en'}
            UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false }, tools: { image: false } }}
          />
        </Suspense>
      </div>
    </div>
  );
}
