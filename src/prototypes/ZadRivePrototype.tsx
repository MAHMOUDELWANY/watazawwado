import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { RuntimeLoader, useRive, useViewModelInstanceNumber } from '@rive-app/react-canvas-lite';
import riveWasmUrl from '@rive-app/canvas-lite/rive.wasm?url';
import { Button } from '../components/ui/Button';
import type { ZadPose } from '../components/zad/ZadRig';

/**
 * Test page (owner, 2026-11-21): the flat Rive Zad on a stage where he hops across, jumps in and out and dances,
 * plus the old side-by-side with the 3D Zad to compare weight on a real phone. Hidden from search and linked from
 * nowhere. Source of the .riv: rive/zad (Rive CLI project).
 */

// Serve the Rive engine from our own domain; by default the library fetches it from a public CDN.
RuntimeLoader.setWasmUrl(riveWasmUrl);

const ZadLive = lazy(() => import('../components/mascots/ZadLive'));
const RIV = '/prototypes/zad-rive/zad.riv';
const RATIO = 560 / 520; // the artboard
// The number the Rive file's `pose` property takes for each move: the order of POSES in rive/zad/tools/add_motion.py.
const MOVES = ['idle', 'wave', 'cheer', 'point', 'thanks', 'sad', 'peek', 'wow', 'think', 'love', 'sleepy', 'shy', 'excited',
  'proud', 'dua', 'clap', 'hop', 'enter', 'exit', 'dance', 'spin', 'fly', 'yes', 'oops', 'giggle'] as const;
type Move = (typeof MOVES)[number];
const OLD_POSES = MOVES.slice(0, 16) as readonly ZadPose[];
// one-shot moves: how long they run (frames at 60 a second), then he goes back to idle
const ONE_SHOT: Partial<Record<Move, number>> = { enter: 84, exit: 46, yes: 76, oops: 92, giggle: 56 };
const HOP_PX_PER_S = 150; // one hop (38 frames) carries him about 95px

function RiveZad({ width, move }: { width: number; move: Move }) {
  const { rive, RiveComponent } = useRive({ src: RIV, stateMachine: 'Zad', autoplay: true, autoBind: true });
  const { setValue } = useViewModelInstanceNumber('pose', rive?.viewModelInstance);
  useEffect(() => { setValue(MOVES.indexOf(move)); }, [move, setValue]);
  return <RiveComponent aria-hidden="true" style={{ width, height: width * RATIO }} />;
}

/** Frames per second and the slowest frame over the last two seconds, measured on this device. */
function useFrameStats() {
  const [stats, setStats] = useState({ fps: 0, worst: 0, slow: 0 });
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let since = last;
    let frames = 0, worst = 0, slow = 0;
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      frames++;
      if (dt > worst) worst = dt;
      if (dt > 34) slow++; // a frame that took two or more screen refreshes at 60Hz
      if (now - since >= 2000) {
        setStats({ fps: Math.round((frames * 1000) / (now - since)), worst: Math.round(worst), slow });
        since = now; frames = 0; worst = 0; slow = 0;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return stats;
}

/** The stage: one big Zad. While he hops, the page carries him across and turns him round at the edges. */
function Stage({ move, onDone }: { move: Move; onDone: (next: Move) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const actor = useRef<HTMLDivElement>(null);
  const width = 230;

  useEffect(() => {
    const frames = ONE_SHOT[move];
    if (!frames) return;
    const t = setTimeout(() => onDone(move === 'exit' ? 'enter' : 'idle'), (frames / 60) * 1000 + (move === 'exit' ? 700 : 0));
    return () => clearTimeout(t);
  }, [move, onDone]);

  useEffect(() => {
    const el = actor.current, stage = box.current;
    if (!el || !stage) return;
    if (move !== 'hop') {
      el.style.transform = `translateX(${(stage.clientWidth - width) / 2}px)`;
      return;
    }
    let x = (stage.clientWidth - width) / 2, dir = 1, last = performance.now(), raf = 0;
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      x += dir * HOP_PX_PER_S * dt;
      const max = stage.clientWidth - width;
      if (x > max) { x = max; dir = -1; }
      if (x < 0) { x = 0; dir = 1; }
      el.style.transform = `translateX(${x}px) scaleX(${dir})`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [move]);

  return (
    <div ref={box} className="relative mt-4 overflow-hidden rounded-2xl border border-border bg-surface-warm" style={{ height: width * RATIO }}>
      <div ref={actor} className="absolute left-0 top-0" style={{ width, willChange: 'transform' }}>
        <RiveZad width={width} move={move} />
      </div>
    </div>
  );
}

const COUNTS = [1, 4, 8];
const SIZES = [72, 130, 200];

export default function ZadRivePrototype() {
  const [mode, setMode] = useState<'rive' | '3d'>('rive');
  const [count, setCount] = useState(1);
  const [move, setMove] = useState<Move>('enter');
  const stats = useFrameStats();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  const pill = (active: boolean) => (active ? 'primary' : 'outline') as 'primary' | 'outline';
  const pose3d: ZadPose = (OLD_POSES as readonly string[]).includes(move) ? (move as ZadPose) : 'idle';
  return (
    <main dir="ltr" className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl">Zad in Rive</h1>
        <p className="mt-1 text-base opacity-70">Test page. Tap a move. “hop” carries him across the stage; “enter”, “exit”, “yes”, “oops” and “giggle” play once.</p>

        <div className="sticky top-2 z-10 mt-4 rounded-2xl border border-border bg-surface-warm p-3 shadow-sm">
          <div className="flex flex-wrap gap-1.5">
            {MOVES.map((name) => (
              <Button key={name} size="sm" variant={pill(move === name)} onClick={() => setMove(name)}>{name}</Button>
            ))}
          </div>
          <div className="mt-2 font-mono text-base" data-testid="frame-stats">
            {stats.fps} fps · slowest frame {stats.worst} ms · slow frames {stats.slow} / 2s
          </div>
        </div>

        <Stage move={move} onDone={setMove} />

        <h2 className="mt-10 font-display text-xl">Weight check: Rive vs 3D</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button size="sm" variant={pill(mode === 'rive')} onClick={() => setMode('rive')}>Rive (flat)</Button>
          <Button size="sm" variant={pill(mode === '3d')} onClick={() => setMode('3d')}>3D (current)</Button>
          <span className="mx-1 h-6 w-px bg-border" />
          {COUNTS.map((n) => (
            <Button key={n} size="sm" variant={pill(count === n)} onClick={() => setCount(n)}>×{n}</Button>
          ))}
        </div>
        <div className="mt-4 grid gap-8">
          {Array.from({ length: count }, (_, i) => (
            <section key={`${mode}-${i}`} className="flex flex-wrap items-end justify-around gap-6 rounded-2xl border border-border p-4">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  {mode === 'rive' ? (
                    <RiveZad width={size * 1.3} move={move === 'exit' || move === 'enter' || move === 'hop' ? 'idle' : move} />
                  ) : (
                    <Suspense fallback={<span style={{ width: size, height: size }} />}>
                      <ZadLive pose={pose3d} size={size} still={false} noBubble />
                    </Suspense>
                  )}
                  <span className="font-mono text-base opacity-60">{size}px</span>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="h-[40vh]" />
      </div>
    </main>
  );
}
