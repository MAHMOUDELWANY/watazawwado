import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ZadModel, type ZadEmote } from './Zad3D';
import { StudioLights, isLiteDevice, toneRenderer } from './Stage3D';
import type { ZadPose } from '../zad/ZadRig';

/**
 * The 3D Zad in a page slot (owner, 2026-11-15: the new Zad everywhere the old one was). Pages keep asking for a pose
 * by name (ZadRig); each pose maps to the 3D move that fits it, played again after a short rest, as the site places him.
 * The canvas is larger than the slot so effects (hearts, confetti, the pointing arrow) can spill out of it; it never
 * takes clicks, so nothing under it stops working.
 */

const MOVE: Record<ZadPose, ZadEmote> = {
  idle: 'idle', wave: 'wave', cheer: 'cheer', point: 'point', thanks: 'bow', sad: 'oops', peek: 'search', wow: 'cheer',
  think: 'think', love: 'love', sleepy: 'sleep', shy: 'bow', excited: 'spin', proud: 'proud', dua: 'dua', clap: 'clap',
};
// how long Zad rests between two plays of the same move (seconds)
const REST: Partial<Record<ZadEmote, number>> = { think: 1.2, read: 1, sleep: 0.4, dua: 1, love: 1.8 };
/** How much bigger than the slot the canvas is. */
const BLEED = 1.7;

function Player({ pose, still }: { pose: ZadPose; still: boolean }) {
  const clock = useThree((s) => s.clock);
  const target = MOVE[pose];
  const [emote, setEmote] = useState<ZadEmote>('idle');
  const [startedAt, setStartedAt] = useState(0);
  const restUntil = useRef(0.35); // a beat after mounting, then the first move

  // a new pose plays at once
  useEffect(() => { restUntil.current = clock.getElapsedTime() + 0.15; setEmote('idle'); }, [target, clock]);
  useFrame(({ clock: c }) => {
    if (still || target === 'idle' || emote !== 'idle') return;
    const t = c.getElapsedTime();
    if (t >= restUntil.current) { setEmote(target); setStartedAt(t); }
  });
  return (
    <ZadModel
      emote={still ? 'idle' : emote}
      startedAt={startedAt}
      still={still}
      onDone={() => { restUntil.current = clock.getElapsedTime() + (REST[target] ?? 1.4); setEmote('idle'); }}
    />
  );
}

export default function ZadLive({ pose, size, still }: { pose: ZadPose; size: number; still: boolean }) {
  const box = size * BLEED;
  // Draw only while on screen: an off-screen Zad kept rendering every frame and made scrolling heavy.
  const ref = React.useRef<HTMLSpanElement>(null);
  const [onScreen, setOnScreen] = React.useState(true);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { rootMargin: '120px' });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <span ref={ref} aria-hidden="true" className="relative inline-block shrink-0 align-middle" style={{ width: size, height: size }}>
      <span className="pointer-events-none absolute" style={{ width: box, height: box, left: (size - box) / 2, top: (size - box) / 2 }}>
        <Canvas
          frameloop={onScreen ? 'always' : 'never'}
          dpr={[1, isLiteDevice() ? 1.5 : 2]}
          camera={{ position: [0, 0.82, 5.6], fov: 30 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
          onCreated={({ gl, camera }) => { toneRenderer(gl); camera.lookAt(0, 0.8, 0); }}
          style={{ pointerEvents: 'none' }}
        >
          <StudioLights shadows={false} />
          <Player pose={pose} still={still} />
        </Canvas>
      </span>
    </span>
  );
}
