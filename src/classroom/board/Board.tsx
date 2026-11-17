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
 * Classroom Task 8: the shared whiteboard. The teacher always draws; the learner draws only while the teacher has
 * "learner can draw" on; observers watch. Changes go out on the room channel, debounced, and as the saved board.
 * `transparent` lets it sit over a PDF page as the annotation layer.
 */
export function Board({ role, sync, transparent = false }: { role: RoomRole; sync: BoardSync; transparent?: boolean }) {
  const { t, isAr } = useT();
  const teacher = role === 'teacher';
  const [learnerDraw, setLearnerDraw] = useState(sync.initial?.learnerDraw ?? false);
  const api = useRef<ExcalidrawImperativeAPI | null>(null);
  const lastVersion = useRef(sync.initial?.sceneVersion ?? -1);
  const timer = useRef<number | null>(null);
  const canDraw = teacher || (role === 'learner' && learnerDraw);

  const send = useCallback((elements: readonly El[], draw: boolean) => {
    const e: RoomEvent = { t: 'board', sceneVersion: versionOf(elements), elements: [...elements], ...(teacher ? { learnerDraw: draw } : {}) };
    // shortcut: a board past the size cap is not sent (the server would refuse it); add a "board is full" notice if teachers hit it.
    if (JSON.stringify(e).length > MAX_BOARD_BYTES) return;
    sync.publishEvent(e);
    sync.save?.(e);
  }, [sync, teacher]);

  // Remote scenes: merge, never echo back.
  useEffect(() => sync.onEvent((e) => {
    if (e.t !== 'board') return;
    if (e.learnerDraw !== undefined && !teacher) setLearnerDraw(e.learnerDraw);
    const a = api.current;
    if (!a) return;
    const merged = mergeElements(a.getSceneElementsIncludingDeleted() as readonly El[], e.elements as El[]);
    lastVersion.current = versionOf(merged);
    a.updateScene({ elements: merged as any });
  }), [sync, teacher]);

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
        <Suspense fallback={<div className="grid h-full place-items-center"><BrandSpinner /></div>}>
          <Excalidraw
            excalidrawAPI={(a) => { api.current = a; }}
            initialData={{
              elements: (sync.initial?.elements ?? []) as any,
              appState: transparent ? { viewBackgroundColor: 'transparent' } : undefined,
            }}
            onChange={(els) => onChange(els as readonly El[])}
            viewModeEnabled={!canDraw}
            // The UI follows the site language; Arabic text on the canvas is laid out right to left by Excalidraw itself.
            langCode={isAr ? 'ar-SA' : 'en'}
            UIOptions={{ canvasActions: { loadScene: false, saveToActiveFile: false, export: false, saveAsImage: false } }}
          />
        </Suspense>
      </div>
    </div>
  );
}
