import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Circle, Headphones, Mic, Play, Square, X } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { useRoomFileUrl } from './useRoomFile';

/** A shadowing line is short: the recorder stops by itself after this. */
export const SHADOW_MAX_MS = 15_000;

/** Records the microphone (a copy, so it works while the room mic is muted) up to SHADOW_MAX_MS. */
export function useRecorder(mic: MediaStreamTrack | undefined) {
  const [recording, setRecording] = useState(false);
  const [clip, setClip] = useState<{ blob: Blob; url: string } | null>(null);
  const rec = useRef<MediaRecorder | null>(null);
  const timer = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (timer.current != null) window.clearTimeout(timer.current);
    timer.current = null;
    if (rec.current?.state === 'recording') rec.current.stop();
  }, []);

  const start = useCallback(() => {
    if (!mic || typeof MediaRecorder === 'undefined') return false;
    const copy = mic.clone();
    copy.enabled = true;
    const r = new MediaRecorder(new MediaStream([copy]));
    const parts: Blob[] = [];
    r.ondataavailable = (e) => { if (e.data.size) parts.push(e.data); };
    r.onstop = () => {
      copy.stop();
      setRecording(false);
      const blob = new Blob(parts, { type: r.mimeType || 'audio/webm' });
      setClip((old) => { if (old) URL.revokeObjectURL(old.url); return { blob, url: URL.createObjectURL(blob) }; });
    };
    rec.current = r;
    r.start();
    setRecording(true);
    timer.current = window.setTimeout(stop, SHADOW_MAX_MS);
    return true;
  }, [mic, stop]);

  useEffect(() => () => { stop(); }, [stop]);
  useEffect(() => () => { if (clip) URL.revokeObjectURL(clip.url); }, [clip]);
  return { recording, clip, start, stop, clear: () => setClip(null) };
}

/** Plays one url and resolves when it ends (or fails). */
function playUrl(el: HTMLAudioElement, url: string): Promise<void> {
  return new Promise((resolve) => {
    el.src = url;
    el.onended = () => resolve();
    el.onerror = () => resolve();
    el.play().catch(() => resolve());
  });
}

/**
 * Shadowing (BUILD-LIST 2.10), the learner's card: hear the teacher's line, record a repeat, then compare the two
 * (one after the other, or each alone). The learner's recording stays on this device.
 */
export function LearnerShadow({ fileId, bookingId, ticket, mic, onClose, kid }: {
  fileId: string; bookingId: string; ticket: string; mic: MediaStreamTrack | undefined; onClose: () => void; kid?: boolean;
}) {
  const { t } = useT();
  const teacherUrl = useRoomFileUrl(bookingId, ticket, fileId);
  const { recording, clip, start, stop } = useRecorder(mic);
  const player = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState<'teacher' | 'mine' | 'both' | null>(null);

  const play = async (which: 'teacher' | 'mine' | 'both') => {
    const el = player.current;
    if (!el) return;
    setPlaying(which);
    if ((which === 'teacher' || which === 'both') && teacherUrl) await playUrl(el, teacherUrl);
    if ((which === 'mine' || which === 'both') && clip) await playUrl(el, clip.url);
    setPlaying(null);
  };

  return (
    <section aria-label={t('Shadowing', 'كرّر ورايا')} className="glass-2 pointer-events-auto grid w-[min(26rem,100%)] gap-3 rounded-[var(--r-3)] p-3 text-foreground shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)]">
      <header className="flex items-center gap-2">
        <Headphones className="h-4 w-4 text-[#F0B54A]" aria-hidden="true" />
        <h2 className="flex-1 text-sm font-semibold">{kid ? t('Say it like your teacher!', 'قولها زي المعلم!') : t('Listen, repeat, compare', 'اسمع، كرّر، قارن')}</h2>
        <button type="button" onClick={onClose} aria-label={t('Close', 'اقفل')} className="room-press grid h-9 w-9 place-items-center rounded-full hover:bg-white/10 focus-ring"><X className="h-4 w-4" aria-hidden="true" /></button>
      </header>
      <audio ref={player} className="hidden" />
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="glass" disabled={!teacherUrl || !!playing} onClick={() => void play('teacher')}>
          <Play className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Teacher', 'المعلم')}
        </Button>
        {recording ? (
          <Button size="sm" onClick={stop}><Square className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Stop', 'وقّف')}</Button>
        ) : (
          <Button size="sm" variant="glass" disabled={!mic || !!playing} onClick={() => start()}>
            <Mic className="me-1.5 h-4 w-4" aria-hidden="true" />{clip ? t('Record again', 'سجّل تاني') : t('Record my try', 'سجّل محاولتي')}
          </Button>
        )}
        <Button size="sm" variant="glass" disabled={!clip || !!playing} onClick={() => void play('mine')}>
          <Play className="me-1.5 h-4 w-4" aria-hidden="true" />{t('Mine', 'بتاعي')}
        </Button>
        <Button size="sm" variant="glass" disabled={!clip || !teacherUrl || !!playing} onClick={() => void play('both')}>
          {t('Compare both', 'قارن الاتنين')}
        </Button>
      </div>
      <p className={cn('text-[0.82rem] text-muted-foreground', recording && 'text-foreground')} role="status">
        {recording ? <><Circle className="me-1 inline h-3 w-3 fill-crimson text-crimson" aria-hidden="true" />{t('Recording… (up to 15 seconds)', 'بنسجّل… (لحد 15 ثانية)')}</>
          : playing === 'both' ? t('Teacher first, then you.', 'المعلم الأول، وبعدين إنت.')
            : t('Your recording stays on this device.', 'تسجيلك بيفضل على جهازك.')}
      </p>
    </section>
  );
}
