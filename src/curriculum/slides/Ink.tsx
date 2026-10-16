import React, { useEffect, useRef, useState } from 'react';

export type InkTool = 'none' | 'pen' | 'marker' | 'laser';

interface Stroke {
  tool: 'pen' | 'marker';
  color: string;
  points: [number, number][];
}

/** Smooth path through points (quadratic midpoints): ink that looks drawn, not jagged. */
function pathOf(points: [number, number][]) {
  if (points.length < 2) return points.length ? `M${points[0][0]} ${points[0][1]} l0.1 0` : '';
  let d = `M${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const [nx, ny] = points[i + 1];
    d += ` Q${x} ${y} ${(x + nx) / 2} ${(y + ny) / 2}`;
  }
  const last = points[points.length - 1];
  return `${d} L${last[0]} ${last[1]}`;
}

interface Props {
  tool: InkTool;
  color: string;
  /** Strokes belong to a page; changing the key clears them. */
  pageKey: string;
  clearSignal: number;
  width: number;
  height: number;
}

/** Teacher drawing layer on top of the slide, in canvas coordinates. The laser leaves a fading trail. */
export function InkLayer({ tool, color, pageKey, clearSignal, width, height }: Props) {
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [laser, setLaser] = useState<{ x: number; y: number; t: number }[]>([]);
  const drawing = useRef<Stroke | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => setStrokes([]), [pageKey, clearSignal]);

  useEffect(() => {
    if (!laser.length) return;
    const id = window.setInterval(() => setLaser((l) => l.filter((p) => Date.now() - p.t < 600)), 60);
    return () => window.clearInterval(id);
  }, [laser.length]);

  const toCanvas = (e: React.PointerEvent): [number, number] => {
    const r = svgRef.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * width, ((e.clientY - r.top) / r.height) * height];
  };

  const active = tool !== 'none';

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="absolute inset-0 h-full w-full"
      style={{ pointerEvents: active ? 'auto' : 'none', cursor: tool === 'laser' ? 'none' : active ? 'crosshair' : undefined, touchAction: active ? 'none' : undefined }}
      onPointerDown={(e) => {
        if (tool !== 'pen' && tool !== 'marker') return;
        (e.target as Element).setPointerCapture?.(e.pointerId);
        drawing.current = { tool, color, points: [toCanvas(e)] };
        setStrokes((s) => [...s, drawing.current!]);
      }}
      onPointerMove={(e) => {
        if (tool === 'laser') {
          const [x, y] = toCanvas(e);
          setLaser((l) => [...l.slice(-14), { x, y, t: Date.now() }]);
          return;
        }
        if (!drawing.current) return;
        drawing.current.points.push(toCanvas(e));
        setStrokes((s) => [...s.slice(0, -1), { ...drawing.current! }]);
      }}
      onPointerUp={() => (drawing.current = null)}
      onPointerLeave={() => (drawing.current = null)}
      aria-hidden="true"
    >
      {strokes.map((s, i) => (
        <path
          key={i}
          d={pathOf(s.points)}
          fill="none"
          stroke={s.color}
          strokeWidth={s.tool === 'marker' ? 34 : 7}
          strokeOpacity={s.tool === 'marker' ? 0.32 : 1}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {laser.map((p, i) => (
        <circle key={p.t + '-' + i} cx={p.x} cy={p.y} r={4 + i * 0.9} fill="#FF2D2D" opacity={(i + 1) / laser.length * 0.8} />
      ))}
    </svg>
  );
}
