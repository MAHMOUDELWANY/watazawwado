import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../../lib/utils';

type Corner = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
const GAP = 12;
const DRAG_FROM = 6; // px of movement before a press becomes a drag, so taps and double taps still work
// Apple's projection (Designing Fluid Interfaces): where a flick would come to rest, to pick the corner it is thrown to.
const project = (v: number, d = 0.996) => ((v / 1000) * d) / (1 - d);

/**
 * A small picture that lives in a corner of its parent (FaceTime): drag it anywhere and it settles in the nearest
 * corner, following the flick. Moves with transform only. The parent must be positioned.
 */
export function CornerPip({ children, initial = 'bottom-end', className, label }: {
  children: React.ReactNode;
  initial?: Corner;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [corner, setCorner] = useState<Corner>(initial);
  const drag = useRef<{ id: number; x0: number; y0: number; ox: number; oy: number; moved: boolean; hist: Array<[number, number, number]> } | null>(null);

  const spot = useCallback((c: Corner) => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent) return { x: 0, y: 0 };
    const rtl = getComputedStyle(el).direction === 'rtl';
    const startLeft = !rtl;
    const left = c.endsWith('start') ? startLeft : !startLeft;
    const x = left ? GAP : parent.clientWidth - el.offsetWidth - GAP;
    const y = c.startsWith('top') ? GAP : parent.clientHeight - el.offsetHeight - GAP;
    return { x, y };
  }, []);

  const place = useCallback((c: Corner, animate: boolean) => {
    const el = ref.current;
    if (!el) return;
    const { x, y } = spot(c);
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.style.transition = animate && !calm ? 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1)' : 'none';
    el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }, [spot]);

  const animateNext = useRef(false);
  useLayoutEffect(() => { place(corner, animateNext.current); animateNext.current = false; }, [corner, place]);
  useEffect(() => {
    const el = ref.current;
    const parent = el?.offsetParent as HTMLElement | null;
    if (!el || !parent || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => { if (!drag.current) place(corner, false); });
    ro.observe(parent);
    ro.observe(el);
    return () => ro.disconnect();
  }, [corner, place]);

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const { x, y } = spot(corner);
    drag.current = { id: e.pointerId, x0: e.clientX, y0: e.clientY, ox: x, oy: y, moved: false, hist: [[e.clientX, e.clientY, e.timeStamp]] };
  };
  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    if (!d || !el || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x0;
    const dy = e.clientY - d.y0;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < DRAG_FROM) return;
      d.moved = true;
      el.setPointerCapture(e.pointerId);
      el.style.transition = 'none';
    }
    d.hist = [...d.hist.slice(-4), [e.clientX, e.clientY, e.timeStamp]];
    el.style.transform = `translate3d(${d.ox + dx}px, ${d.oy + dy}px, 0)`;
  };
  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = ref.current;
    drag.current = null;
    if (!d || !el || !d.moved) return;
    const parent = el.offsetParent as HTMLElement | null;
    if (!parent) return;
    const [x1, y1, t1] = d.hist[0];
    const [x2, y2, t2] = d.hist[d.hist.length - 1];
    const dt = Math.max(1, t2 - t1);
    const vx = ((x2 - x1) / dt) * 1000;
    const vy = ((y2 - y1) / dt) * 1000;
    const cx = d.ox + (e.clientX - d.x0) + el.offsetWidth / 2 + project(vx);
    const cy = d.oy + (e.clientY - d.y0) + el.offsetHeight / 2 + project(vy);
    const left = cx < parent.clientWidth / 2;
    const top = cy < parent.clientHeight / 2;
    const rtl = getComputedStyle(el).direction === 'rtl';
    const next = `${top ? 'top' : 'bottom'}-${left !== rtl ? 'start' : 'end'}` as Corner;
    if (next === corner) place(next, true);
    else { animateNext.current = true; setCorner(next); }
  };

  return (
    <div ref={ref} role="group" aria-label={label}
      onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}
      className={cn('absolute left-0 top-0 z-10 cursor-grab touch-none select-none will-change-transform active:cursor-grabbing', className)}>
      {children}
    </div>
  );
}
