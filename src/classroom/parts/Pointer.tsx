import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { RoomEvent } from '../../lib/roomEvents';

/** Pointer positions travel as 0–1000 of the content box, so they land in the same place on any screen size. */
const SCALE = 1000;
/** About 5 messages a second per room: Supabase Realtime allows 100 a second per project, shared by every lesson. */
export const SEND_EVERY_MS = 180;
const HIDE_AFTER_MS = 3000;

/** Teacher: pointer moves inside the content box go out at most every 180 ms. Returns the handler for that box. */
export function usePointerSender(send: (e: RoomEvent) => void) {
  const last = useRef(0);
  return useCallback((e: React.PointerEvent<HTMLElement>) => {
    const now = performance.now();
    if (now - last.current < SEND_EVERY_MS || document.hidden) return;
    const r = e.currentTarget.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const x = Math.round(((e.clientX - r.left) / r.width) * SCALE);
    const y = Math.round(((e.clientY - r.top) / r.height) * SCALE);
    // Only while the pointer is over the content (captured drags report positions outside it).
    if (x < 0 || y < 0 || x > SCALE || y > SCALE) return;
    last.current = now;
    send({ t: 'pointer', x, y });
  }, [send]);
}

/** Learner: the teacher's pointer with their name, over the content. Hides after 3 s of stillness. */
export function RemotePointer({ point, name }: { point: { x: number; y: number; at: number } | null; name: string }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!point) return;
    setVisible(true);
    const id = window.setTimeout(() => setVisible(false), HIDE_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [point]);
  if (!point) return null;
  const left = `${Math.min(100, Math.max(0, point.x / 10))}%`;
  const top = `${Math.min(100, Math.max(0, point.y / 10))}%`;
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
      <div className="absolute transition-[left,top,opacity] duration-75 ease-linear motion-reduce:transition-none"
        style={{ left, top, opacity: visible ? 1 : 0 }}>
        <svg width="20" height="20" viewBox="0 0 20 20" className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">
          <path d="M2 2 L17 9 L10 11 L8 18 Z" fill="var(--crimson)" stroke="#FAF7F2" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
        <span className="absolute start-4 top-4 whitespace-nowrap rounded-[var(--r-pill)] bg-crimson px-2 py-0.5 text-[0.78rem] font-medium text-white">{name}</span>
      </div>
    </div>
  );
}
