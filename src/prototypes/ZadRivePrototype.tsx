import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { RuntimeLoader, useRive, useViewModelInstanceNumber } from '@rive-app/react-canvas-lite';
import riveWasmUrl from '@rive-app/canvas-lite/rive.wasm?url';
import { Button } from '../components/ui/Button';
import type { ZadPose } from '../components/zad/ZadRig';

/**
 * Test page (owner, 2026-11-21): the flat Rive Zad next to the 3D Zad, to see on a real phone which one is lighter
 * and sharper. Hidden from search and linked from nowhere. Source of the .riv: rive/zad (Rive CLI project).
 */

// Serve the Rive engine from our own domain; by default the library fetches it from a public CDN.
RuntimeLoader.setWasmUrl(riveWasmUrl);

const ZadLive = lazy(() => import('../components/mascots/ZadLive'));
const RIV = '/prototypes/zad-rive/zad.riv';
const RATIO = 400 / 480; // the artboard
// The number the Rive file's `pose` property takes for each pose: the order of POSES in rive/zad/tools/add_motion.py.
const POSES: ZadPose[] = ['idle', 'wave', 'cheer', 'point', 'thanks', 'sad', 'peek', 'wow', 'think', 'love', 'sleepy', 'shy', 'excited', 'proud', 'dua', 'clap'];

function RiveZad({ width, pose }: { width: number; pose: ZadPose }) {
  const { rive, RiveComponent } = useRive({ src: RIV, stateMachine: 'Zad', autoplay: true, autoBind: true });
  const { setValue } = useViewModelInstanceNumber('pose', rive?.viewModelInstance);
  useEffect(() => { setValue(POSES.indexOf(pose)); }, [pose, setValue]);
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

const COUNTS = [1, 4, 8];
const SIZES = [72, 130, 200];

export default function ZadRivePrototype() {
  const [mode, setMode] = useState<'rive' | '3d'>('rive');
  const [count, setCount] = useState(1);
  const [pose, setPose] = useState<ZadPose>('idle');
  const stats = useFrameStats();
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { meta.remove(); };
  }, []);

  const pill = (active: boolean) => (active ? 'primary' : 'outline') as 'primary' | 'outline';
  return (
    <main dir="ltr" className="min-h-screen bg-background px-4 py-6 text-foreground">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl">Zad: Rive vs 3D</h1>
        <p className="mt-1 text-base opacity-70">Test page. Switch the engine, raise the count, scroll, and watch the numbers.</p>

        <div className="sticky top-2 z-10 mt-4 rounded-2xl border border-border bg-surface-warm p-3 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant={pill(mode === 'rive')} onClick={() => setMode('rive')}>Rive (flat)</Button>
            <Button size="sm" variant={pill(mode === '3d')} onClick={() => setMode('3d')}>3D (current)</Button>
            <span className="mx-1 h-6 w-px bg-border" />
            {COUNTS.map((n) => (
              <Button key={n} size="sm" variant={pill(count === n)} onClick={() => setCount(n)}>×{n}</Button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {POSES.map((name) => (
              <Button key={name} size="sm" variant={pill(pose === name)} onClick={() => setPose(name)}>{name}</Button>
            ))}
          </div>
          <div className="mt-2 font-mono text-base" data-testid="frame-stats">
            {stats.fps} fps · slowest frame {stats.worst} ms · slow frames {stats.slow} / 2s
          </div>
        </div>

        <div ref={scroller} className="mt-6 grid gap-8">
          {Array.from({ length: count }, (_, i) => (
            <section key={`${mode}-${i}`} className="flex flex-wrap items-end justify-around gap-6 rounded-2xl border border-border p-4">
              {SIZES.map((size) => (
                <div key={size} className="flex flex-col items-center gap-1">
                  {mode === 'rive' ? (
                    <RiveZad width={size * 1.3} pose={pose} />
                  ) : (
                    <Suspense fallback={<span style={{ width: size, height: size }} />}>
                      <ZadLive pose={pose} size={size} still={false} noBubble />
                    </Suspense>
                  )}
                  <span className="font-mono text-base opacity-60">{size}px</span>
                </div>
              ))}
            </section>
          ))}
        </div>
        <div className="h-[60vh]" />
      </div>
    </main>
  );
}
