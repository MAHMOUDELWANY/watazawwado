import React, { useState } from 'react';
import type { Clip } from '../types';
import { clipUrl, playClip } from './clip';

let current: HTMLAudioElement | null = null;

/** Tap to hear: wraps a letter, word or line on the stage and plays its clip. One clip plays at a time. */
export function Say({ subject, lesson, clip, children, style }: { subject: string; lesson: number; clip: Clip; children: React.ReactNode; style?: React.CSSProperties }) {
  const [missing, setMissing] = useState(false);
  const [playing, setPlaying] = useState(false);
  const hear = async (e: React.MouseEvent) => {
    e.stopPropagation(); // a tap on a clip must not advance the build step
    current?.pause();
    const audio = new Audio(clipUrl(subject, lesson, clip));
    current = audio;
    audio.onended = () => setPlaying(false);
    setPlaying(true);
    const r = await playClip(audio);
    if (r === 'missing') { setPlaying(false); setMissing(true); }
  };
  return (
    <button type="button" onClick={hear} aria-label={`Play: ${clip.text}`} title={missing ? 'Recording coming' : undefined}
      className="relative cursor-pointer select-none" style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', ...style }}>
      <span style={{ display: 'inline-block', transform: playing ? 'scale(1.06)' : undefined, transition: 'transform 180ms ease-out' }}>{children}</span>
      {missing && <span className="absolute font-sans" style={{ right: -6, top: -6, fontSize: 11, padding: '1px 6px', borderRadius: 8, background: 'rgba(0,0,0,0.55)', color: '#fff' }}>recording coming</span>}
    </button>
  );
}
