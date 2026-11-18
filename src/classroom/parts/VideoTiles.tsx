import React, { useEffect, useRef, useState } from 'react';
import { MicOff, Volume2 } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import type { LinkClass } from '../engine/types';
import { NetworkBadge } from './NetworkBadge';

let sharedCtx: AudioContext | null = null;
/** One AudioContext for every level meter in the room (browsers cap how many can run). */
function audioCtx(): AudioContext | null {
  const Ctx = typeof window !== 'undefined' ? window.AudioContext || (window as any).webkitAudioContext : undefined;
  if (!Ctx) return null;
  sharedCtx ??= new Ctx();
  if (sharedCtx.state === 'suspended') sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

/**
 * True while the track's level is over the threshold (Web Audio AnalyserNode, read 10 times a second).
 * Re-renders only when the answer flips. Pass a clone for the local mic so it still hears you while muted.
 */
export function useSpeaking(track: MediaStreamTrack | null | undefined, threshold = 0.06): boolean {
  const [speaking, setSpeaking] = useState(false);
  useEffect(() => {
    const ctx = track ? audioCtx() : null;
    if (!track || !ctx) { setSpeaking(false); return; }
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(new MediaStream([track]));
    source.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    let on = false;
    let quietSince = 0;
    const id = window.setInterval(() => {
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const loud = Math.sqrt(sum / buf.length) > threshold;
      const now = performance.now();
      // Hold the ring 400 ms after the voice drops, so it does not flicker between words.
      if (loud) quietSince = 0;
      else if (!quietSince) quietSince = now;
      const next = loud || (on && now - quietSince < 400);
      if (next !== on) { on = next; setSpeaking(next); }
    }, 100);
    return () => { window.clearInterval(id); source.disconnect(); };
  }, [track, threshold]);
  return speaking;
}

/** Remote sound. Picks the speaker chosen in the waiting room, and asks for one tap when the browser blocks play(). */
export function RemoteAudio({ stream, speakerId, label }: { stream: MediaStream | null; speakerId?: string; label: string }) {
  const { t } = useT();
  const ref = useRef<HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (!stream) return;
    (async () => {
      if (speakerId && typeof (el as any).setSinkId === 'function') await (el as any).setSinkId(speakerId).catch(() => {});
      // iPhone Safari (Review Focus 1): sound needs a user tap before it may start.
      el.play().catch(() => setBlocked(true));
    })();
  }, [stream, speakerId]);

  const tap = () => {
    audioCtx();
    ref.current?.play().then(() => setBlocked(false), () => setBlocked(true));
  };

  return (
    <>
      <audio ref={ref} autoPlay playsInline />
      {blocked && (
        <button type="button" onClick={tap}
          className="fixed inset-x-4 top-1/3 z-[70] mx-auto flex max-w-sm items-center justify-center gap-3 rounded-[var(--r-4)] bg-crimson px-6 py-5 text-lg font-semibold text-white shadow-[var(--shadow-3)] focus-ring active:scale-[0.98] transition-transform">
          <Volume2 className="h-6 w-6 shrink-0" aria-hidden="true" />
          {/* "Tap to hear your teacher" / "Tap to hear the learner" */}
          {t(`Tap to hear ${label}`, `اضغط علشان تسمع ${label}`)}
        </button>
      )}
    </>
  );
}

/** A person in the room: video, or an arch with their initial when there is no picture. Video is always muted here; sound plays in RemoteAudio. */
export function VideoTile({ stream, name, self = false, speaking = false, micOff = false, videoOff = false, link, note, compact = false, className }: {
  stream: MediaStream | null;
  name: string;
  self?: boolean;
  speaking?: boolean;
  micOff?: boolean;
  videoOff?: boolean;
  link?: LinkClass | null;
  /** Shown instead of the picture, e.g. "video paused to keep the sound clear". */
  note?: string;
  compact?: boolean;
  className?: string;
}) {
  const { t } = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    const el = ref.current;
    const update = () => setHasVideo(!!stream?.getVideoTracks().some((tr) => tr.readyState === 'live'));
    update();
    if (!el) return;
    el.srcObject = stream;
    el.play().catch(() => {}); // muted video may always play; a refusal only means it is not on screen yet
    stream?.addEventListener('addtrack', update);
    stream?.addEventListener('removetrack', update);
    return () => { stream?.removeEventListener('addtrack', update); stream?.removeEventListener('removetrack', update); };
  }, [stream]);

  const showVideo = hasVideo && !videoOff && !note;
  return (
    <figure
      className={cn(
        'relative isolate overflow-hidden bg-[#1C1411] text-[#FAF7F2] outline outline-2 outline-offset-2 transition-[outline-color] duration-[var(--dur-ui)]',
        compact ? 'rounded-[var(--r-2)]' : 'rounded-[var(--r-3)]',
        speaking ? 'outline-teal' : 'outline-transparent',
        className,
      )}
      data-speaking={speaking || undefined}
    >
      <video ref={ref} autoPlay playsInline muted
        className={cn('absolute inset-0 h-full w-full object-cover', self && '-scale-x-100', !showVideo && 'invisible')} />
      {!showVideo && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(40rem_20rem_at_50%_0%,rgba(229,169,60,0.18),transparent_70%)] p-3">
          <div className="grid justify-items-center gap-2 text-center">
            <span aria-hidden="true"
              className={cn('arch-tile grid place-items-center bg-[#2E2824] font-editorial text-[#F6D58E] shadow-[inset_0_1px_0_rgba(246,213,142,0.25)]', compact ? 'h-12 w-10 text-xl' : 'h-24 w-20 text-4xl')}>
              {name.trim().charAt(0) || '·'}
            </span>
            {note && !compact && <span className="max-w-xs text-sm text-[#D8C6AE]">{note}</span>}
          </div>
        </div>
      )}
      <figcaption className="absolute bottom-2 start-2 flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-[var(--r-pill)] bg-black/45 px-2.5 py-1 text-xs font-medium backdrop-blur-sm">
        {micOff && <MicOff className="h-3.5 w-3.5 shrink-0 text-[#F6D58E]" aria-label={t('Mic off', 'المايك مقفول')} />}
        <span className="truncate">{self ? t('You', 'إنت') : name}</span>
        {link && <NetworkBadge link={link} onDark />}
      </figcaption>
    </figure>
  );
}
