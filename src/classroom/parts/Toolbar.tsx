import React, { useState } from 'react';
import { AudioWaveform, Ellipsis, Hand, LogOut, Mic, MicOff, MonitorPlay, PhoneOff, Presentation, Users, Video, VideoOff, Volume2, VolumeX, X } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import FocusTrap from '../../components/FocusTrap';
import { ReactionSheet, type ReactionKind } from './Reactions';

export type LayoutMode = 'conversation' | 'content' | 'screen';
export type BarKind = 'teacher' | 'learner' | 'kid' | 'observer';

type Tone = 'idle' | 'off' | 'on';
const TONE: Record<Tone, string> = {
  idle: 'text-foreground hover:bg-white/[0.08]',
  // Mic or camera off: copper on dark sand with a slash glyph and a word, so only Leave/End is crimson.
  off: 'bg-[#3D2A20] text-[#F2B39F] ring-1 ring-[#DA7960]/30',
  on: 'bg-teal text-teal-foreground',
};

/** One control. Kid mode: 56px with the word under the icon. Otherwise a 48px circle (the word in its name). */
export function BarButton({ label, word, tone = 'idle', kid = false, onClick, children, className, ...rest }: {
  label: string;
  /** Shown beside the icon from `sm` up, e.g. "Muted". */
  word?: string;
  tone?: Tone;
  kid?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick' | 'children'>) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick} {...rest}
      className={cn('room-press shrink-0 focus-ring',
        kid ? 'grid h-16 min-w-[4.25rem] content-center justify-items-center gap-1 rounded-[var(--r-3)] px-2 text-[0.78rem] font-semibold'
          : cn('flex h-12 min-w-12 items-center justify-center gap-2 rounded-full', word ? 'px-3 sm:px-4' : 'w-12'),
        TONE[tone], className)}>
      {children}
      {kid ? <span aria-hidden="true" className="max-w-[5rem] truncate">{word ?? label}</span>
        : word && <span aria-hidden="true" className="hidden text-sm font-semibold sm:inline">{word}</span>}
    </button>
  );
}

/** Teacher: the three layouts as one segmented control (keys 1, 2, 3). */
export function LayoutSwitch({ mode, onChange, screenAvailable, wide = false }: { mode: LayoutMode; onChange: (m: LayoutMode) => void; screenAvailable: boolean; wide?: boolean }) {
  const { t } = useT();
  const items: Array<{ m: LayoutMode; Icon: typeof Users; label: string; key: string }> = [
    { m: 'conversation', Icon: Users, label: t('Conversation', 'محادثة'), key: '1' },
    { m: 'content', Icon: Presentation, label: t('Lesson content', 'محتوى الدرس'), key: '2' },
    { m: 'screen', Icon: MonitorPlay, label: t('Shared screen', 'الشاشة المشتركة'), key: '3' },
  ];
  return (
    <div role="radiogroup" aria-label={t('Layout', 'الشكل')} className={cn('flex items-center gap-0.5 rounded-full bg-white/[0.06] p-1', wide && 'w-full')}>
      {items.map(({ m, Icon, label, key }) => {
        const disabled = m === 'screen' && !screenAvailable;
        return (
          <button key={m} type="button" role="radio" aria-checked={mode === m} disabled={disabled}
            aria-keyshortcuts={key} title={`${label} (${key})`} aria-label={label} onClick={() => onChange(m)}
            className={cn('room-press flex h-10 items-center justify-center gap-2 rounded-full focus-ring disabled:opacity-35',
              wide ? 'flex-1 px-2 text-[0.78rem] font-medium' : 'w-11',
              mode === m ? 'bg-[#3A332D] text-[#5CC9DB] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
            {wide && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}

/**
 * The floating control bar (DESIGN-BRIEF 3.3). From the start edge: mic, camera, the role's tools, More, then Leave or
 * End alone after a hairline. It never scrolls sideways: what does not fit on a phone moves into More. Child mode has
 * four big labelled controls; observers get sound and a quiet Leave.
 */
export function Toolbar({ kind, muted, cameraOff, hasCamera, onMute, onCamera, recitation = false, onRecitation, layout, onLayout,
  sharing = false, shareSlot, toolsSlot, moreItems, onReact, selfHidden = false, onToggleSelf, soundOff = false, onSound, onLeave, leaveLabel }: {
  kind: BarKind;
  muted: boolean;
  cameraOff: boolean;
  hasCamera: boolean;
  onMute: () => void;
  onCamera: () => void;
  recitation?: boolean;
  onRecitation?: () => void;
  layout?: LayoutMode;
  onLayout?: (m: LayoutMode) => void;
  sharing?: boolean;
  /** The screen-share button (desktop browsers only). */
  shareSlot?: React.ReactNode;
  /** 2.10: the teacher's tools button, or the learner's text-size and colours button (shown on every screen size). */
  toolsSlot?: React.ReactNode;
  /** 2.12: extra rows in the "More" sheet (background blur). */
  moreItems?: React.ReactNode;
  onReact?: (kind: ReactionKind) => void;
  selfHidden?: boolean;
  onToggleSelf?: () => void;
  soundOff?: boolean;
  onSound?: () => void;
  onLeave: () => void;
  leaveLabel: string;
}) {
  const { t } = useT();
  const [sheet, setSheet] = useState<'more' | 'react' | null>(null);
  const kid = kind === 'kid';
  const observer = kind === 'observer';
  const teacher = kind === 'teacher';
  const close = () => setSheet(null);

  const mic = (
    <BarButton kid={kid} tone={muted ? 'off' : 'idle'} aria-pressed={muted} aria-keyshortcuts="M" onClick={onMute}
      label={muted ? t('Turn mic on (M)', 'افتح المايك (M)') : t('Mute (M)', 'اقفل المايك (M)')}
      word={muted ? t('Muted', 'المايك مقفول') : kid ? t('Mic', 'المايك') : undefined}>
      {muted ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
    </BarButton>
  );
  const cam = hasCamera && (
    <BarButton kid={kid} tone={cameraOff ? 'off' : 'idle'} aria-pressed={cameraOff} onClick={onCamera}
      label={cameraOff ? t('Turn camera on', 'افتح الكاميرا') : t('Turn camera off', 'اقفل الكاميرا')}
      word={kid ? (cameraOff ? t('Camera off', 'الكاميرا مقفولة') : t('Camera', 'الكاميرا')) : undefined}>
      {cameraOff ? <VideoOff className="h-5 w-5" aria-hidden="true" /> : <Video className="h-5 w-5" aria-hidden="true" />}
    </BarButton>
  );
  const recite = onRecitation && (
    <BarButton tone={recitation ? 'on' : 'idle'} aria-pressed={recitation} onClick={onRecitation}
      label={recitation ? t('Recitation mode is on', 'وضع التلاوة شغّال') : t('Recitation mode', 'وضع التلاوة')}>
      <AudioWaveform className="h-5 w-5" aria-hidden="true" />
    </BarButton>
  );
  const more = (
    <BarButton aria-expanded={sheet === 'more'} aria-haspopup="dialog" tone={sheet === 'more' ? 'on' : 'idle'}
      label={t('More', 'المزيد')} onClick={() => setSheet((s) => (s === 'more' ? null : 'more'))}>
      {sheet === 'more' ? <X className="h-5 w-5" aria-hidden="true" /> : <Ellipsis className="h-5 w-5" aria-hidden="true" />}
    </BarButton>
  );

  return (
    <div className="relative mx-auto w-full max-w-max">
      {sheet && (
        <FocusTrap onEscape={close}>
          <div role="dialog" aria-label={sheet === 'more' ? t('More', 'المزيد') : kid ? t('I need…', 'محتاج…') : t('Reactions', 'تفاعل')}
            className={cn('room-sheet glass-3 absolute bottom-full start-1/2 z-30 mb-3 -translate-x-1/2 rtl:translate-x-1/2 rounded-[var(--r-4)] p-2',
              kid ? 'w-[min(26rem,calc(100vw-1.5rem))]' : 'w-[min(20rem,calc(100vw-1.5rem))]')}>
            {sheet === 'react' && onReact && <ReactionSheet kid={kid} onSend={(k) => { onReact(k); close(); }} />}
            {sheet === 'more' && (
              <div className="grid gap-1 text-sm text-foreground">
                {teacher && onLayout && layout && (
                  <div className="grid gap-2 p-1 sm:hidden">
                    <LayoutSwitch mode={layout} onChange={(m) => { onLayout(m); close(); }} screenAvailable={sharing} wide />
                  </div>
                )}
                {teacher && onRecitation && (
                  <button type="button" role="switch" aria-checked={recitation} onClick={onRecitation}
                    className="room-press flex min-h-12 items-center gap-3 rounded-[var(--r-2)] px-3 text-start hover:bg-white/[0.08] focus-ring sm:hidden">
                    <AudioWaveform className="h-5 w-5 shrink-0 text-[#F0B54A]" aria-hidden="true" />
                    <span className="flex-1 font-medium">{t('Recitation mode', 'وضع التلاوة')}</span>
                    <span className={cn('text-[0.78rem] font-semibold', recitation ? 'text-teal' : 'text-muted-foreground')}>{recitation ? t('On', 'شغّال') : t('Off', 'مقفول')}</span>
                  </button>
                )}
                {onToggleSelf && (
                  <button type="button" role="switch" aria-checked={selfHidden} onClick={() => { onToggleSelf(); close(); }}
                    className="room-press flex min-h-12 items-center gap-3 rounded-[var(--r-2)] px-3 text-start hover:bg-white/[0.08] focus-ring">
                    <Users className="h-5 w-5 shrink-0 text-[#F0B54A]" aria-hidden="true" />
                    <span className="grid flex-1">
                      <span className="font-medium">{selfHidden ? t('Show my picture', 'اظهر صورتي') : t('Hide my picture', 'اخفي صورتي')}</span>
                      <span className="text-[0.78rem] text-muted-foreground">{t('Only on your screen. The others still see you.', 'عندك إنت بس. الباقيين لسه شايفينك.')}</span>
                    </span>
                  </button>
                )}
                {moreItems}
                {teacher && (
                  <p className="hidden px-3 py-2 text-[0.78rem] leading-relaxed text-muted-foreground sm:block">
                    {t('Keys: M mutes. 1, 2 and 3 switch the layout.', 'الأزرار: M يقفل المايك. 1 و2 و3 يغيّروا الشكل.')}
                  </p>
                )}
              </div>
            )}
          </div>
        </FocusTrap>
      )}

      <nav aria-label={t('Lesson controls', 'أدوات الحصة')}
        className={cn('glass-3 flex items-center rounded-[var(--r-pill)]', kid ? 'gap-1 rounded-[1.75rem] p-1.5' : 'gap-1 p-1.5')}>
        {observer ? (
          onSound && (
            <BarButton tone={soundOff ? 'off' : 'idle'} aria-pressed={soundOff} onClick={onSound}
              label={soundOff ? t('Turn the sound on', 'شغّل الصوت') : t('Turn the sound off', 'اقفل الصوت')}
              word={soundOff ? t('Sound off', 'الصوت مقفول') : t('Sound on', 'الصوت شغّال')}>
              {soundOff ? <VolumeX className="h-5 w-5" aria-hidden="true" /> : <Volume2 className="h-5 w-5" aria-hidden="true" />}
            </BarButton>
          )
        ) : (
          <>
            {mic}
            {cam}
            {toolsSlot}
            {teacher && (
              <span className="hidden items-center gap-1 sm:flex">
                {recite}
                {onLayout && layout && <LayoutSwitch mode={layout} onChange={onLayout} screenAvailable={sharing} />}
                {shareSlot}
              </span>
            )}
            {onReact && (
              <BarButton kid={kid} aria-expanded={sheet === 'react'} aria-haspopup="dialog" tone={sheet === 'react' ? 'on' : 'idle'}
                label={kid ? t('I need…', 'محتاج…') : t('Reactions', 'تفاعل')} word={kid ? t('I need…', 'محتاج…') : undefined}
                onClick={() => setSheet((s) => (s === 'react' ? null : 'react'))}>
                <Hand className="h-5 w-5" aria-hidden="true" />
              </BarButton>
            )}
            {!kid && more}
          </>
        )}
        <span aria-hidden="true" className="mx-1 h-7 w-px shrink-0 bg-white/15" />
        {observer ? (
          <button type="button" onClick={onLeave}
            className="room-press flex h-12 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-semibold text-foreground hover:bg-white/[0.08] focus-ring">
            <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />{leaveLabel}
          </button>
        ) : kid ? (
          <BarButton kid label={leaveLabel} word={leaveLabel} onClick={onLeave} className="bg-crimson text-white hover:bg-crimson">
            <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />
          </BarButton>
        ) : (
          <button type="button" onClick={onLeave}
            className="room-press flex h-12 shrink-0 items-center gap-2 rounded-full bg-crimson px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgba(232,44,50,0.8)] focus-ring">
            {teacher ? <PhoneOff className="h-5 w-5" aria-hidden="true" /> : <LogOut className="h-5 w-5 rtl:-scale-x-100" aria-hidden="true" />}
            <span className="hidden sm:inline">{leaveLabel}</span>
            <span className="sr-only sm:hidden">{leaveLabel}</span>
          </button>
        )}
      </nav>
    </div>
  );
}
