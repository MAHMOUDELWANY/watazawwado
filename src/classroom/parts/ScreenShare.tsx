import React, { useState } from 'react';
import { MonitorUp, MonitorX } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import FocusTrap from '../../components/FocusTrap';

/** Mobile browsers have no getDisplayMedia: the button is not shown there at all. */
export const canShareScreen = () => typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function';

/**
 * Teacher: share a screen or a tab, with its sound when the browser offers it. The first time, a short note asks
 * them to tick "Share tab audio" in the browser's picker. `onStart` hands the stream to the engine.
 */
export function ScreenShareButton({ sharing, onStart, onStop, className }: {
  sharing: boolean;
  onStart: (stream: MediaStream) => Promise<void>;
  onStop: () => void;
  className?: string;
}) {
  const { t } = useT();
  const [note, setNote] = useState(false);
  const [error, setError] = useState('');
  if (!canShareScreen()) return null;

  const start = async () => {
    setError('');
    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      // The browser's own "Stop sharing" bar ends the track; follow it.
      stream.getVideoTracks()[0]?.addEventListener('ended', onStop, { once: true });
      await onStart(stream);
    } catch (e: any) {
      stream?.getTracks().forEach((tr) => tr.stop());
      if (e?.name !== 'NotAllowedError') setError(t('The screen could not be shared. Try again.', 'مقدرناش نشارك الشاشة. جرّب تاني.'));
    }
    setNote(false);
  };

  const label = sharing ? t('Stop sharing', 'وقّف المشاركة') : t('Share screen', 'شارك الشاشة');
  return (
    <div className="relative">
      <button type="button" aria-label={label} title={label} aria-pressed={sharing}
        onClick={() => (sharing ? onStop() : setNote(true))}
        className={cn('room-press grid h-12 w-12 place-items-center rounded-full focus-ring',
          sharing ? 'bg-teal text-teal-foreground' : 'text-foreground hover:bg-white/[0.08]', className)}>
        {sharing ? <MonitorX className="h-5 w-5" aria-hidden="true" /> : <MonitorUp className="h-5 w-5" aria-hidden="true" />}
      </button>
      {(note || error) && (
        <FocusTrap onEscape={() => { setNote(false); setError(''); }}>
        <div role="dialog" aria-label={label} className="room-sheet glass-3 absolute bottom-16 start-1/2 z-30 grid w-72 -translate-x-1/2 rtl:translate-x-1/2 gap-3 rounded-[var(--r-4)] p-4 text-sm leading-relaxed text-foreground">
          {error ? <p role="alert" className="text-destructive">{error}</p> : (
            <p>{t('To share sound too, pick a browser tab and tick "Share tab audio" in the next window.', 'علشان الصوت يوصل كمان، اختار تاب في المتصفح وعلّم على "Share tab audio" في الشاشة الجاية.')}</p>
          )}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setNote(false); setError(''); }} className="room-press min-h-11 rounded-[var(--r-pill)] px-4 hover:bg-white/[0.08] focus-ring">{t('Cancel', 'إلغاء')}</button>
            {!error && <button type="button" onClick={start} className="room-press min-h-11 rounded-[var(--r-pill)] bg-teal px-4 font-semibold text-teal-foreground focus-ring">{t('Choose what to share', 'اختار هتشارك إيه')}</button>}
          </div>
        </div>
        </FocusTrap>
      )}
    </div>
  );
}
