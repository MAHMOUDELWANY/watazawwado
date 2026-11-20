import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, Volume2, X, Youtube } from 'lucide-react';
import { useT } from '../../lib/language';
import { mediaPosition, type MediaState } from '../../lib/roomTools';
import type { RoomEvent } from '../../lib/roomEvents';
import { duckedVolume, MEDIA_HEARTBEAT_MS, needsSeek } from './media';
import { useRoomFileUrl } from './useRoomFile';

type YTPlayer = {
  loadVideoById(o: { videoId: string; startSeconds?: number }): void;
  cueVideoById(o: { videoId: string; startSeconds?: number }): void;
  playVideo(): void; pauseVideo(): void; seekTo(s: number, allow: boolean): void;
  getCurrentTime(): number; getPlayerState(): number; setVolume(v: number): void; destroy(): void;
  getVideoData?(): { video_id?: string };
};
type YTNamespace = { Player: new (el: HTMLElement, o: any) => YTPlayer; PlayerState: { PLAYING: number; PAUSED: number; ENDED: number } };

let ytReady: Promise<YTNamespace> | null = null;
/** Loads the YouTube IFrame API once, only when a video is shared. */
function loadYouTube(): Promise<YTNamespace> {
  const w = window as unknown as { YT?: YTNamespace & { loaded?: number }; onYouTubeIframeAPIReady?: () => void };
  if (w.YT?.Player) return Promise.resolve(w.YT);
  ytReady ??= new Promise((resolve, reject) => {
    const prev = w.onYouTubeIframeAPIReady;
    w.onYouTubeIframeAPIReady = () => { prev?.(); resolve(w.YT!); };
    const s = document.createElement('script');
    s.src = 'https://www.youtube.com/iframe_api';
    s.async = true;
    s.onerror = () => { ytReady = null; reject(new Error('youtube')); };
    document.head.appendChild(s);
  });
  return ytReady;
}

/**
 * The shared audio file or YouTube video (BUILD-LIST 2.10). The teacher plays, pauses and seeks; each change is sent
 * (saved, so a rejoin finds it) and, while playing, the position is repeated every 5 s (live only). The learner follows
 * and seeks when more than 1.5 s off. Both hear it locally, ducked to a quarter while the teacher speaks.
 */
export function SharedMedia({ media, teacher, duck, bookingId, ticket, send, publish, nowRef, onClose }: {
  media: MediaState;
  teacher: boolean;
  /** The teacher is speaking (the own mic on the teacher's side, the teacher's audio on the learner's). */
  duck: boolean;
  bookingId: string;
  ticket: string;
  /** Saved and live. */
  send: (e: RoomEvent) => void;
  /** Live only (the heartbeat). */
  publish: (e: RoomEvent) => void;
  /** The teacher's page reads the current position from here to answer a rejoin. */
  nowRef: React.MutableRefObject<(() => MediaState | null) | null>;
  onClose: () => void;
}) {
  const { t } = useT();
  const [blocked, setBlocked] = useState(false);
  const audio = useRef<HTMLAudioElement | null>(null);
  const holder = useRef<HTMLDivElement | null>(null);
  const yt = useRef<YTPlayer | null>(null);
  const [ytOk, setYtOk] = useState<boolean | null>(null);
  const audioUrl = useRoomFileUrl(bookingId, ticket, media.kind === 'audio' ? media.src : null);

  const position = () => (media.kind === 'youtube' ? yt.current?.getCurrentTime() ?? 0 : audio.current?.currentTime ?? 0);
  const playing = () => (media.kind === 'youtube' ? yt.current?.getPlayerState() === 1 : !!audio.current && !audio.current.paused);
  const current = useCallback((): MediaState => ({ kind: media.kind, src: media.src, playing: playing(), pos: Math.max(0, position()) }), [media.kind, media.src]); // eslint-disable-line react-hooks/exhaustive-deps
  const tell = useCallback((save: boolean) => {
    const m = current();
    const e: RoomEvent = { t: 'media', kind: m.kind, src: m.src, playing: m.playing, pos: Math.min(86_399, Math.round(m.pos * 10) / 10) };
    if (save) send(e); else publish(e);
  }, [current, send, publish]);

  useEffect(() => {
    if (!teacher) return;
    nowRef.current = () => current();
    return () => { nowRef.current = null; };
  }, [teacher, nowRef, current]);

  // ---- YouTube ----
  useEffect(() => {
    if (media.kind !== 'youtube' || !holder.current) return;
    let live = true;
    const el = document.createElement('div');
    holder.current.replaceChildren(el);
    loadYouTube().then((YT) => {
      if (!live) return;
      yt.current = new YT.Player(el, {
        host: 'https://www.youtube-nocookie.com',
        videoId: media.src,
        width: '100%', height: '100%',
        playerVars: { controls: teacher ? 1 : 0, disablekb: teacher ? 0 : 1, rel: 0, playsinline: 1, modestbranding: 1, start: Math.floor(media.pos) },
        events: {
          onReady: () => { if (live) setYtOk(true); }, // the follow effect below then moves it into place
          // The teacher's play and pause are saved; the learner's own clicks are not possible (no controls).
          onStateChange: (e: { data: number }) => { if (teacher && (e.data === 1 || e.data === 2)) tell(true); },
          onError: () => live && setYtOk(false),
        },
      });
    }, () => live && setYtOk(false));
    return () => { live = false; yt.current?.destroy(); yt.current = null; setYtOk(null); };
    // A new video makes a new player; position changes are handled by follow().
  }, [media.kind, media.src]); // eslint-disable-line react-hooks/exhaustive-deps

  /** The learner (and a teacher who rejoined) goes where the shared state says. */
  const follow = useCallback(() => {
    const target = mediaPosition(media, Date.now());
    if (media.kind === 'youtube' && yt.current) {
      const p = yt.current;
      if (needsSeek(p.getCurrentTime(), target)) p.seekTo(target, true);
      if (media.playing && p.getPlayerState() !== 1) p.playVideo();
      if (!media.playing && p.getPlayerState() === 1) p.pauseVideo();
    }
    if (media.kind === 'audio' && audio.current && audioUrl) {
      const a = audio.current;
      if (needsSeek(a.currentTime, target)) a.currentTime = target;
      if (media.playing && a.paused) a.play().then(() => setBlocked(false), (e) => { if (e?.name === 'NotAllowedError') setBlocked(true); });
      if (!media.playing && !a.paused) a.pause();
    }
  }, [media, audioUrl]);

  // The learner follows every change; the teacher only once, after a rejoin (the teacher's own player is the truth).
  const followed = useRef(false);
  useEffect(() => {
    if (teacher && followed.current) return;
    if (media.kind === 'youtube' && !ytOk) return;
    if (media.kind === 'audio' && !audioUrl) return;
    followed.current = true;
    follow();
  }, [teacher, follow, media, ytOk, audioUrl]);

  // Teacher heartbeat while playing (H6: one message every 5 s), and a seek while paused is sent too.
  useEffect(() => {
    if (!teacher) return;
    let lastPos = -1;
    const id = window.setInterval(() => {
      if (playing()) { tell(false); lastPos = -1; return; }
      const p = position();
      if (lastPos >= 0 && needsSeek(lastPos, p)) tell(true);
      lastPos = p;
    }, MEDIA_HEARTBEAT_MS);
    return () => window.clearInterval(id);
  }, [teacher, tell]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ducking under the teacher's voice.
  useEffect(() => {
    const v = duckedVolume(duck);
    if (audio.current) audio.current.volume = v;
    yt.current?.setVolume(Math.round(v * 100));
  }, [duck, ytOk, audioUrl]);

  const isYt = media.kind === 'youtube';
  return (
    <section aria-label={isYt ? t('Shared video', 'فيديو مشترك') : t('Shared audio', 'صوت مشترك')}
      className="glass-2 pointer-events-auto w-[min(34rem,100%)] overflow-hidden rounded-[var(--r-3)] text-foreground shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
      <header className="flex items-center gap-2 px-3 py-2 text-sm">
        {isYt ? <Youtube className="h-4 w-4 text-[#F0B54A]" aria-hidden="true" /> : <Music2 className="h-4 w-4 text-[#F0B54A]" aria-hidden="true" />}
        <span className="flex-1 font-semibold">{isYt ? t('Video for both of you', 'فيديو ليكم انتو الاتنين') : t('Audio for both of you', 'صوت ليكم انتو الاتنين')}</span>
        {duck && <span className="flex items-center gap-1 text-[0.78rem] text-muted-foreground"><Volume2 className="h-3.5 w-3.5" aria-hidden="true" />{t('lowered while the teacher speaks', 'بيوطى لما المعلم يتكلم')}</span>}
        {teacher && (
          <button type="button" onClick={onClose} aria-label={t('Stop sharing', 'وقّف المشاركة')}
            className="room-press grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
        )}
      </header>
      {isYt ? (
        <div className="relative aspect-video w-full bg-black">
          <div ref={holder} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
          {/* The learner cannot drive the video: the teacher does. */}
          {!teacher && <div className="absolute inset-0" aria-hidden="true" />}
          {ytOk === false && <p className="absolute inset-0 grid place-items-center p-4 text-center text-sm">{t('This video cannot be played here.', 'الفيديو ده مش هيشتغل هنا.')}</p>}
        </div>
      ) : (
        <div className="px-3 pb-3">
          {audioUrl ? (
            <audio ref={audio} src={audioUrl} preload="auto" controls={teacher} className="w-full"
              onPlay={() => teacher && tell(true)} onPause={() => teacher && tell(true)} onSeeked={() => teacher && tell(true)} />
          ) : <p className="text-sm text-muted-foreground">{t('Loading the audio…', 'بنحمّل الصوت…')}</p>}
          {!teacher && media.playing && <p className="mt-1 text-[0.82rem] text-muted-foreground">{t('Your teacher is playing this for you.', 'المعلم مشغّل ده ليك.')}</p>}
        </div>
      )}
      {blocked && !teacher && (
        <button type="button" onClick={() => { setBlocked(false); follow(); }}
          className="room-press m-3 mt-0 min-h-11 w-[calc(100%-1.5rem)] rounded-[var(--r-pill)] bg-teal px-4 text-sm font-semibold text-white focus-ring">
          {t('Tap to hear', 'دوس علشان تسمع')}
        </button>
      )}
    </section>
  );
}
