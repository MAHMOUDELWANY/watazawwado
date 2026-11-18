import React from 'react';
import { AudioWaveform, LogOut, Mic, MicOff, MonitorPlay, PhoneOff, Presentation, Users, Video, VideoOff } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';

export type LayoutMode = 'conversation' | 'content' | 'screen';

const round = 'grid h-12 w-12 place-items-center rounded-full focus-ring active:scale-[0.97] transition-[transform,background-color,color] duration-[var(--dur-tap)]';

export function ToolButton({ label, active = false, alert = false, onClick, children }: {
  label: string;
  active?: boolean;
  /** Mic or camera off: shown in crimson so it is never missed. */
  alert?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button type="button" aria-label={label} title={label} aria-pressed={active || alert} onClick={onClick}
      className={cn(round, alert ? 'bg-crimson text-white' : active ? 'bg-teal text-white' : 'text-foreground hover:bg-surface-subtle')}>
      {children}
    </button>
  );
}

/** Teacher: the three layouts as one segmented control (keys 1, 2, 3). */
export function LayoutSwitch({ mode, onChange, screenAvailable }: { mode: LayoutMode; onChange: (m: LayoutMode) => void; screenAvailable: boolean }) {
  const { t } = useT();
  const items: Array<{ m: LayoutMode; Icon: typeof Users; label: string; key: string }> = [
    { m: 'conversation', Icon: Users, label: t('Conversation', 'محادثة'), key: '1' },
    { m: 'content', Icon: Presentation, label: t('Lesson content', 'محتوى الدرس'), key: '2' },
    { m: 'screen', Icon: MonitorPlay, label: t('Shared screen', 'الشاشة المشتركة'), key: '3' },
  ];
  return (
    <div role="radiogroup" aria-label={t('Layout', 'الشكل')} className="flex items-center gap-0.5 rounded-full bg-surface-subtle/80 p-0.5">
      {items.map(({ m, Icon, label, key }) => {
        const disabled = m === 'screen' && !screenAvailable;
        return (
          <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={disabled}
            aria-keyshortcuts={key} title={`${label} (${key})`} aria-label={label} onClick={() => onChange(m)}
            className={cn('grid h-11 w-11 place-items-center rounded-full focus-ring transition-colors duration-[var(--dur-ui)] disabled:opacity-40',
              mode === m ? 'bg-surface text-teal shadow-[var(--shadow-1)]' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

/**
 * The floating control bar. Mic and camera always; the rest arrives as slots so each role gets only its own controls.
 * Leave/End sits at the far end, apart from the rest, in crimson (the one main action of the room).
 */
export function Toolbar({ observer, muted, cameraOff, hasCamera, onMute, onCamera, recitation, onRecitation, middle, onLeave, leaveLabel, endsLesson }: {
  observer: boolean;
  muted: boolean;
  cameraOff: boolean;
  hasCamera: boolean;
  onMute: () => void;
  onCamera: () => void;
  /** Teacher only. */
  recitation?: boolean;
  onRecitation?: () => void;
  middle?: React.ReactNode;
  onLeave: () => void;
  leaveLabel: string;
  endsLesson: boolean;
}) {
  const { t } = useT();
  return (
    <nav aria-label={t('Lesson controls', 'أدوات الحصة')}
      className="glass-3 mx-auto flex max-w-full items-center gap-1 overflow-x-auto rounded-[var(--r-pill)] p-1.5 [scrollbar-width:none]">
      {!observer && (
        <>
          <ToolButton label={muted ? t('Turn mic on (M)', 'افتح المايك (M)') : t('Mute (M)', 'اقفل المايك (M)')} alert={muted} onClick={onMute}>
            {muted ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
          </ToolButton>
          {hasCamera && (
            <ToolButton label={cameraOff ? t('Turn camera on', 'افتح الكاميرا') : t('Turn camera off', 'اقفل الكاميرا')} alert={cameraOff} onClick={onCamera}>
              {cameraOff ? <VideoOff className="h-5 w-5" aria-hidden="true" /> : <Video className="h-5 w-5" aria-hidden="true" />}
            </ToolButton>
          )}
          {onRecitation && (
            <ToolButton label={recitation ? t('Recitation mode is on', 'وضع التلاوة شغّال') : t('Recitation mode', 'وضع التلاوة')} active={recitation} onClick={onRecitation}>
              <AudioWaveform className="h-5 w-5" aria-hidden="true" />
            </ToolButton>
          )}
        </>
      )}
      {middle}
      <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-border" />
      <button type="button" onClick={onLeave}
        className={cn('flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold focus-ring active:scale-[0.98] transition-transform',
          endsLesson ? 'bg-crimson text-white' : 'text-crimson hover:bg-crimson/10')}>
        {endsLesson ? <PhoneOff className="h-5 w-5" aria-hidden="true" /> : <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />}
        <span className="hidden sm:inline">{leaveLabel}</span>
        <span className="sr-only sm:hidden">{leaveLabel}</span>
      </button>
    </nav>
  );
}
