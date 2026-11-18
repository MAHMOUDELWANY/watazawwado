import React, { useEffect, useRef, useState } from 'react';
import { MicOff } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import type { LinkClass } from '../engine/types';
import { NetworkBadge } from './NetworkBadge';
import { Khatam } from './Khatam';

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

/**
 * Remote sound. Picks the speaker chosen in the waiting room, and asks for one tap when the browser blocks play().
 * The tap is drawn as an arch with the other person's initial: it blocks the lesson, so it may be the one loud thing.
 */
export function RemoteAudio({ stream, speakerId, label, initial = '', muted = false }: {
  stream: MediaStream | null;
  speakerId?: string;
  label: string;
  initial?: string;
  /** Observers can turn the room's sound off on their own device. */
  muted?: boolean;
}) {
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

  useEffect(() => { if (ref.current) ref.current.muted = muted; }, [muted]);

  const tap = () => {
    audioCtx();
    ref.current?.play().then(() => setBlocked(false), () => setBlocked(true));
  };

  return (
    <>
      <audio ref={ref} autoPlay playsInline />
      {blocked && (
        <div className="room-fade fixed inset-0 z-[70] grid place-items-center bg-[rgba(17,15,14,0.6)] p-6">
          <button type="button" onClick={tap}
            className="room-press arch-face grid w-full max-w-[17rem] justify-items-center gap-4 bg-[#2E2824] px-6 pb-7 pt-12 text-center text-[#FAF7F2] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.9)] ring-1 ring-[rgba(246,213,142,0.35)] focus-ring [--arch-h:7.5rem]">
            <span aria-hidden="true" className="arch-tile grid h-20 w-16 place-items-center bg-[#3B2219] font-editorial text-4xl text-[#F6D58E] shadow-[inset_0_1px_0_rgba(246,213,142,0.3)]">
              {initial.trim().charAt(0) || '·'}
            </span>
            {/* "Tap to hear your teacher" / "Tap to hear the learner" */}
            <span className="text-lg font-semibold leading-snug">{t(`Tap to hear ${label}`, `اضغط علشان تسمع ${label}`)}</span>
            <span aria-hidden="true" className="rounded-[var(--r-pill)] bg-[#C51F24] px-5 py-2.5 text-sm font-semibold text-white">{t('Turn the sound on', 'شغّل الصوت')}</span>
          </button>
        </div>
      )}
    </>
  );
}

/**
 * A person in the room: video, or their initial under an arch when there is no picture. Video is always muted here;
 * sound plays in RemoteAudio. `arch` is for the person you face (never your own tile). `fit="contain"` keeps a held-up
 * mushaf or board whole on a portrait phone; a double tap fills the frame instead.
 */
export function VideoTile({ stream, name, self = false, speaking = false, micOff = false, videoOff = false, link, note, compact = false,
  arch = false, fit = 'cover', dim = false, connecting = false, overlay, className }: {
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
  arch?: boolean;
  fit?: 'cover' | 'contain';
  /** Reconnecting: the last frame stays, dimmed. */
  dim?: boolean;
  /** The room is still opening: the khatam breathes where the person will be. */
  connecting?: boolean;
  /** Chips that belong to this person (a raised hand), drawn on the tile's lower edge. */
  overlay?: React.ReactNode;
  className?: string;
}) {
  const { t } = useT();
  const ref = useRef<HTMLVideoElement>(null);
  const [hasVideo, setHasVideo] = useState(false);
  const [filled, setFilled] = useState(false);

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
  const contain = fit === 'contain' && !filled;
  return (
    <figure
      className={cn(
        'relative isolate overflow-hidden bg-[#1C1714] text-[#FAF7F2] shadow-[0_18px_50px_-24px_rgba(0,0,0,0.85)] ring-1 ring-[rgba(250,247,242,0.07)]',
        arch ? 'arch-face' : compact ? 'rounded-[var(--r-2)]' : 'rounded-[var(--r-3)]',
        dim && 'face-dim',
        className,
      )}
      data-speaking={speaking || undefined}
      onDoubleClick={fit === 'contain' ? () => setFilled((f) => !f) : undefined}
    >
      <video ref={ref} autoPlay playsInline muted
        className={cn('absolute inset-0 h-full w-full', contain ? 'object-contain' : 'object-cover', self && '-scale-x-100', !showVideo && 'invisible')} />
      {!showVideo && (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(28rem_18rem_at_50%_0%,rgba(229,169,60,0.16),transparent_70%)] p-3">
          <div className="grid justify-items-center gap-3 text-center">
            {connecting ? <Khatam size={compact ? 32 : 56} breathe /> : (
              <span aria-hidden="true"
                className={cn('arch-tile grid place-items-center bg-[#2E2824] font-editorial text-[#F6D58E] shadow-[inset_0_1px_0_rgba(246,213,142,0.25),0_10px_30px_-12px_rgba(229,169,60,0.4)]',
                  compact ? 'h-11 w-9 text-lg' : 'h-24 w-20 text-4xl')}>
                {name.trim().charAt(0) || '·'}
              </span>
            )}
            {note && !compact && <span className="max-w-[16rem] text-sm leading-relaxed text-[#D8C6AE]">{note}</span>}
          </div>
        </div>
      )}
      <span className="face-glow" aria-hidden="true" />
      <figcaption className={cn('face-scrim absolute bottom-2 start-2 z-[3] flex max-w-[calc(100%-1rem)] items-center gap-1.5 rounded-[var(--r-pill)] font-medium',
        compact ? 'px-2 py-0.5 text-[0.78rem]' : 'px-3 py-1 text-[0.82rem]')}>
        {micOff && <MicOff className="h-3.5 w-3.5 shrink-0 text-[#F6D58E]" aria-label={t('Mic off', 'المايك مقفول')} />}
        <span className="truncate">{self ? t('You', 'إنت') : name}</span>
        {link && <NetworkBadge link={link} onDark />}
      </figcaption>
      {overlay && <div className="absolute inset-x-2 bottom-11 z-[3] flex flex-col items-start gap-1.5">{overlay}</div>}
    </figure>
  );
}
