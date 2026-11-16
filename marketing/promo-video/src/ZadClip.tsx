import React from 'react';
import { useCurrentFrame, useVideoConfig } from 'remotion';
import { ThreeCanvas } from '@remotion/three';
import { ZadModel, EMOTE_LENGTH, type ZadEmote } from './zad3d/Zad3D';
import { StudioLights, toneRenderer } from './zad3d/Stage3D';
import { VT } from './zad3d/time';

/**
 * The site's 3D Zad (src/components/mascots/Zad3D.tsx, copied) played on the video clock, transparent, for pre-rendered
 * PNG sequences: `npx remotion render src/index.ts ZadClip out/zad/wave --sequence --image-format=png --concurrency=1
 * --props='{"emote":"wave"}'`. Concurrency 1 because the sparks and confetti integrate frame by frame.
 */
export type ZadClipProps = { emote: ZadEmote; lead?: number };

const Driver: React.FC<ZadClipProps> = ({ emote, lead = 0.25 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  VT.t = frame / fps;
  VT.dt = 1 / fps;
  return <ZadModel emote={VT.t >= lead ? emote : 'idle'} startedAt={lead} still={false} onDone={() => {}} />;
};

export const zadClipSeconds = (emote: ZadEmote, lead = 0.25) => lead + (EMOTE_LENGTH[emote] || 3) + 0.35;

export const ZadClip: React.FC<ZadClipProps> = (p) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} camera={{ position: [0, 0.82, 5.6], fov: 30 }} gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      onCreated={({ gl, camera }) => { toneRenderer(gl); camera.lookAt(0, 0.8, 0); }}>
      <StudioLights shadows={false} />
      <Driver {...p} />
    </ThreeCanvas>
  );
};
