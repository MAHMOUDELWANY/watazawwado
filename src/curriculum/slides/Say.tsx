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

/** The page's clips, so a graphic can make any word on the stage playable by id (`<Hear id="fatiha-1">`). */
export const ClipContext = React.createContext<{ subject: string; lesson: number; clips: Clip[] }>({ subject: '', lesson: 0, clips: [] });

export function Hear({ id, children, style }: { id: string; children: React.ReactNode; style?: React.CSSProperties }) {
  const { subject, lesson, clips } = React.useContext(ClipContext);
  const clip = clips.find((c) => c.id === id);
  if (!clip) return <>{children}</>;
  return <Say subject={subject} lesson={lesson} clip={clip} style={{ pointerEvents: 'auto', ...style }}>{children}</Say>;
}

let quranFont = false;
/** Amiri Quran (OFL, Google Fonts) for Uthmani text: Thmanyah has no glyphs for the Mushaf's small marks. */
export const QURAN_FONT = "'Amiri Quran', 'Amiri', serif";
export function useQuranFont() {
  React.useEffect(() => {
    if (quranFont) return;
    quranFont = true;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap';
    document.head.appendChild(link);
  }, []);
}
