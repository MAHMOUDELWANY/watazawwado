import React, { useEffect, useState } from 'react';
import { Aperture, AudioWaveform, Check, ChevronRight, Globe, Keyboard, Mic, Palette, Play, RotateCw, Type, Video, VideoOff, Volume2, Wifi, EyeOff } from 'lucide-react';
import { useT } from '../../lib/language';
import { cn } from '../../lib/utils';
import FocusTrap from '../../components/FocusTrap';
import { REACTIONS, type ReactionKind } from './Reactions';
import type { Comfort } from '../tools/comfort';
import type { LinkClass } from '../engine/types';

export type DeviceKind = 'audio' | 'video' | 'speaker';
type Page = 'main' | 'devices' | 'help' | 'keys';

// Tints from our palette only (no green): teal, copper, gold, brick, sand, espresso.
const TINT = { teal: '#087D91', copper: '#B4683F', gold: '#C98A1E', brick: '#8B4935', sand: '#7A6A57', espresso: '#5B4636' } as const;
const NEED_TINT = [TINT.teal, TINT.copper, TINT.gold, TINT.brick];
const canPickSpeaker = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;

/** A short tone through the chosen speaker, so the learner hears it and the other side does not. */
export async function playTestTone(speakerId?: string) {
  const Ctx = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctx) return;
  const ctx: AudioContext = new Ctx();
  try { if (speakerId && 'setSinkId' in ctx) await (ctx as any).setSinkId(speakerId); } catch { /* default output */ }
  const osc = ctx.createOscillator(), gain = ctx.createGain();
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
  osc.connect(gain).connect(ctx.destination);
  osc.start(); osc.stop(ctx.currentTime + 0.95);
  osc.onended = () => void ctx.close();
}

function Tint({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className="room-tint" style={{ background: color }} aria-hidden="true">{children}</span>;
}

/** One grouped-list row: tinted icon, title, one line under it, then a value, switch or chevron. */
function Row({ icon, title, sub, end, onClick, pressed, className }: {
  icon: React.ReactNode; title: React.ReactNode; sub?: React.ReactNode; end?: React.ReactNode; onClick?: () => void; pressed?: boolean; className?: string;
}) {
  const body = (
    <>
      {icon}
      <span className="grid min-w-0 flex-1 gap-0.5 text-start">
        <span className="text-[0.92rem] font-medium leading-snug text-foreground">{title}</span>
        {sub && <span className="text-[0.76rem] leading-snug text-[#BFB3A3]">{sub}</span>}
      </span>
      {end}
    </>
  );
  const cls = cn('relative flex min-h-[3.25rem] w-full items-center gap-3 px-3 py-2', className);
  return onClick
    ? <button type="button" onClick={onClick} aria-pressed={pressed} className={cn(cls, 'room-press hover:bg-white/[0.06] focus-ring')}>{body}</button>
    : <div className={cls}>{body}</div>;
}

function Chevron({ text }: { text?: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1.5 text-[0.84rem] text-[#BFB3A3]">
      {text && <span className="max-w-[9rem] truncate">{text}</span>}
      <ChevronRight className="h-4 w-4 rtl:-scale-x-100" aria-hidden="true" />
    </span>
  );
}

function Switch({ on, label, onChange, disabled }: { on: boolean; label: string; onChange: () => void; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} disabled={disabled} onClick={onChange}
      className={cn('relative h-[1.65rem] w-11 shrink-0 rounded-full transition-colors duration-200 focus-ring disabled:opacity-50', on ? 'bg-[#087D91]' : 'bg-white/20')}>
      <span className={cn('absolute top-[3px] h-5 w-5 rounded-full bg-[#FAF7F2] shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] start-[3px]',
        on && 'translate-x-[1.1rem] rtl:-translate-x-[1.1rem]')} />
    </button>
  );
}

function Segmented<V extends string | number>({ label, value, options, onChange }: { label: string; value: V; options: Array<[V, React.ReactNode]>; onChange: (v: V) => void }) {
  return (
    <span role="group" aria-label={label} className="flex shrink-0 rounded-[0.65rem] bg-white/10 p-0.5">
      {options.map(([v, text]) => (
        <button key={String(v)} type="button" aria-pressed={value === v} onClick={() => onChange(v)}
          className={cn('h-7 rounded-[0.5rem] px-2.5 text-[0.8rem] transition-colors duration-200 focus-ring',
            value === v ? 'bg-white/90 font-bold text-[#1B1816] shadow-[0_2px_6px_rgba(0,0,0,0.3)]' : 'text-[#E9E1D6]')}>{text}</button>
      ))}
    </span>
  );
}

function Header({ title, onBack }: { title: string; onBack: () => void }) {
  const { t } = useT();
  return (
    <div className="relative flex h-11 items-center px-1 pb-1">
      <button type="button" onClick={onBack} className="room-press relative z-[1] flex h-9 items-center gap-1 rounded-full bg-white/[0.12] pe-3 ps-2 text-[0.88rem] text-foreground focus-ring">
        <ChevronRight className="h-4 w-4 -scale-x-100 rtl:scale-x-100" aria-hidden="true" />{t('Back', 'رجوع')}
      </button>
      <h2 className="absolute inset-x-0 text-center text-base font-bold text-foreground">{title}</h2>
    </div>
  );
}

const SectionTitle = ({ children }: { children: React.ReactNode }) => <p className="px-3.5 pb-1.5 pt-3 text-[0.78rem] text-[#BFB3A3]">{children}</p>;

export type MoreMenuProps = {
  kind: 'teacher' | 'learner';
  onClose: () => void;
  link: LinkClass | null;
  peerLink?: LinkClass | null;
  peerName?: string;
  /** Learner: the teaching signals (raise hand stays on the bar). */
  onNeed?: (kind: ReactionKind) => void;
  comfort?: Comfort;
  onComfort?: (c: Comfort) => void;
  selfHidden: boolean;
  onToggleSelf?: () => void;
  recitation?: boolean;
  onRecitation?: () => void;
  /** Teacher on a phone: the layout switch, which does not fit on the bar there. */
  layoutSlot?: React.ReactNode;
  blur?: { on: boolean; busy: boolean; toggle: () => void } | null;
  current: Partial<Record<DeviceKind, string>>;
  onPickDevice: (kind: DeviceKind, id: string) => void;
  hasCamera: boolean;
  muted: boolean;
  onUnmute: () => void;
  cameraOff: boolean;
  onCameraOff: () => void;
  onRejoin: () => void;
  /** Teacher: "Problem on our side? Continue on Zoom". */
  onZoom?: () => void;
  zoomUrl?: string | null;
  onToast: (text: string) => void;
  /** Phone: the bar's own controls at the top of the sheet. */
  barSlot?: React.ReactNode;
};

/**
 * The room's More menu (owner-approved design, 2026-11-21): floating glass, a short main page, and pushed pages for
 * devices, fixes and keys. A popover over the bar from `sm` up; a floating bottom sheet on phones.
 */
export function MoreMenu(p: MoreMenuProps) {
  const { t, isAr, setLanguage } = useT();
  const [page, setPage] = useState<Page>('main');
  const [back, setBack] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const teacher = p.kind === 'teacher';
  const go = (pg: Page) => { setBack(false); setPage(pg); };
  const home = () => { setBack(true); setPage('main'); };

  useEffect(() => {
    if (page !== 'devices' || !navigator.mediaDevices?.enumerateDevices) return;
    let live = true;
    navigator.mediaDevices.enumerateDevices().then((d) => { if (live) setDevices(d.filter((x) => x.deviceId && x.deviceId !== 'communications')); }, () => {});
    return () => { live = false; };
  }, [page]);

  const linkWord = (l: LinkClass | null | undefined) => (l === 'weak' ? t('Weak', 'ضعيف') : l === 'poor' ? t('Poor', 'سيئ') : t('Great', 'ممتاز'));
  const linkColor = (l: LinkClass | null | undefined) => (l === 'weak' ? TINT.gold : l === 'poor' ? '#B5191F' : TINT.teal);
  const allGood = (p.link ?? 'good') === 'good' && (p.peerLink ?? 'good') === 'good';
  const test = () => { void playTestTone(p.current.speaker); p.onToast(t('Playing a test sound. If you hear it, you are set.', 'بنشغّل صوت تجربة. لو سمعته يبقى تمام.')); };
  const named = (k: MediaDeviceKind) => devices.filter((d) => d.kind === k);
  const nameOf = (k: MediaDeviceKind, id?: string) => devices.find((d) => d.kind === k && d.deviceId === id)?.label;

  const main = (
    <div className={back ? 'room-push' : undefined}>
      {p.barSlot}
      {p.onNeed && (
        <>
          <SectionTitle>{t('Tell your teacher in one tap', 'قول للأستاذ بضغطة')}</SectionTitle>
          <div className="room-group grid grid-cols-4 px-1 pb-3 pt-3.5">
            {REACTIONS.filter((r) => r.kind !== 'hand').map(({ kind, Icon, en, ar }, i) => (
              <button key={kind} type="button" onClick={() => { p.onNeed!(kind); p.onToast(t(`Sent to your teacher: ${en}`, `وصلت للأستاذ: ${ar}`)); p.onClose(); }}
                className="room-press grid justify-items-center gap-1.5 rounded-[var(--r-2)] px-1 text-center text-[0.74rem] leading-tight text-foreground focus-ring">
                <span className="grid h-12 w-12 place-items-center rounded-full shadow-[inset_0_1px_0_rgba(255,255,255,0.22)]" style={{ background: NEED_TINT[i] }}>
                  <Icon className="h-[1.35rem] w-[1.35rem] text-white" aria-hidden="true" />
                </span>{t(en, ar)}
              </button>
            ))}
          </div>
        </>
      )}

      <div className="room-group mt-2.5">
        <Row onClick={() => go('help')}
          icon={<Tint color={allGood ? TINT.teal : linkColor(p.link === 'good' ? p.peerLink : p.link)}><Wifi className="h-[1.1rem] w-[1.1rem]" /></Tint>}
          title={allGood ? (teacher ? t(`Great connection for you and ${p.peerName ?? ''}`, `الاتصال ممتاز عندك وعند ${p.peerName ?? ''}`) : t('Connection is great', 'الاتصال ممتاز'))
            : t(`Connection: ${linkWord(p.link)}`, `الاتصال: ${linkWord(p.link)}`)}
          sub={allGood ? t('Sound and picture are clear', 'الصوت والصورة واضحين') : t('We keep the sound clear first', 'إحنا بنحافظ على الصوت الأول')}
          end={<Chevron text={t('A problem?', 'في مشكلة؟')} />} />
      </div>

      <SectionTitle>{teacher ? t('Lesson', 'الحصة') : t('Sound and picture', 'الصوت والصورة')}</SectionTitle>
      <div className="room-group">
        {teacher && p.onRecitation && (
          <Row icon={<Tint color={TINT.gold}><AudioWaveform className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Recitation mode', 'وضع التلاوة')}
            sub={t('Turns off noise cleaning so recitation arrives as it is', 'بيقفل تنقية الصوت عشان التلاوة توصل زي ما هي')}
            end={<Switch on={!!p.recitation} label={t('Recitation mode', 'وضع التلاوة')} onChange={p.onRecitation} />} />
        )}
        <Row onClick={() => go('devices')} icon={<Tint color={TINT.copper}><Mic className="h-[1.1rem] w-[1.1rem]" /></Tint>}
          title={t('Devices', 'الأجهزة')} sub={t('Microphone, speaker and camera', 'المايك والسماعة والكاميرا')} end={<Chevron />} />
        <Row onClick={test} icon={<Tint color={TINT.gold}><Play className="h-4 w-4 fill-current" /></Tint>}
          title={t('Test sound', 'اختبر الصوت')} sub={t('A short sound only you hear', 'صوت قصير تسمعه أنت بس')} />
        {p.blur && (
          <Row icon={<Tint color={TINT.sand}><Aperture className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Blur my background', 'غبّش الخلفية')}
            sub={p.blur.busy ? t('Starting…', 'بيبدأ…') : t('Done on this device', 'بيتعمل على جهازك')}
            end={<Switch on={p.blur.on} disabled={p.blur.busy} label={t('Blur my background', 'غبّش الخلفية')} onChange={p.blur.toggle} />} />
        )}
      </div>

      <SectionTitle>{t('Display', 'الشاشة')}</SectionTitle>
      <div className="room-group">
        {p.layoutSlot && <div className="relative px-2 py-2 sm:hidden">{p.layoutSlot}</div>}
        {p.comfort && p.onComfort && (
          <>
            <Row icon={<Tint color={TINT.gold}><Type className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Text size', 'حجم الكلام')}
              end={<Segmented label={t('Text size', 'حجم الكلام')} value={p.comfort.size} onChange={(size) => p.onComfort!({ ...p.comfort!, size })}
                options={[[0, <span key="0" style={{ fontSize: '0.8rem' }}>{t('A', 'أ')}</span>], [1, <span key="1" style={{ fontSize: '0.95rem' }}>{t('A', 'أ')}</span>], [2, <span key="2" style={{ fontSize: '1.1rem' }}>{t('A', 'أ')}</span>]]} />} />
            <Row icon={<Tint color={TINT.copper}><Palette className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Page', 'الصفحة')} sub={t('Only on your screen', 'عندك إنت بس')}
              end={<Segmented label={t('Page', 'الصفحة')} value={p.comfort.tone} onChange={(tone) => p.onComfort!({ ...p.comfort!, tone })}
                options={[['default', t('Normal', 'عادي')], ['warm', t('Warm', 'دافي')], ['dark', t('Dark', 'غامق')]]} />} />
          </>
        )}
        {p.onToggleSelf && (
          <Row icon={<Tint color={TINT.sand}><EyeOff className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Hide my picture', 'اخفي صورتي')}
            sub={teacher ? t(`${p.peerName ?? 'The learner'} still sees you`, `${p.peerName ?? 'الطالب'} لسه شايفك`) : t('Your teacher still sees you', 'الأستاذ لسه شايفك')}
            end={<Switch on={p.selfHidden} label={t('Hide my picture', 'اخفي صورتي')} onChange={p.onToggleSelf} />} />
        )}
        <Row icon={<Tint color={TINT.espresso}><Globe className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('Language', 'اللغة')}
          end={<Segmented label={t('Language', 'اللغة')} value={isAr ? 'ar' : 'en'} onChange={(l) => setLanguage(l)} options={[['ar', 'عربي'], ['en', 'English']]} />} />
        {teacher && (
          <Row onClick={() => go('keys')} className="max-sm:hidden" icon={<Tint color={TINT.brick}><Keyboard className="h-[1.1rem] w-[1.1rem]" /></Tint>}
            title={t('Keyboard shortcuts', 'اختصارات الكيبورد')} end={<Chevron text="M · 1 2 3" />} />
        )}
      </div>
    </div>
  );

  const devGroup = (k: MediaDeviceKind, dk: DeviceKind, title: string, icon: React.ReactNode, color: string) => {
    const list = named(k);
    if (!list.length) return null;
    return (
      <React.Fragment key={k}>
        <SectionTitle>{title}</SectionTitle>
        <div className="room-group">
          {list.map((d, i) => {
            const on = p.current[dk] ? p.current[dk] === d.deviceId : i === 0;
            return (
              <Row key={d.deviceId} pressed={on} onClick={() => p.onPickDevice(dk, d.deviceId)} icon={<Tint color={color}>{icon}</Tint>}
                title={d.label || t(`Device ${i + 1}`, `جهاز ${i + 1}`)}
                end={on ? <Check className="h-5 w-5 shrink-0 text-[#F0B54A]" strokeWidth={2.6} aria-hidden="true" /> : undefined} />
            );
          })}
        </div>
      </React.Fragment>
    );
  };

  const devicesPage = (
    <div className="room-push">
      <Header title={t('Devices', 'الأجهزة')} onBack={home} />
      {devGroup('audioinput', 'audio', t('Microphone', 'المايك'), <Mic className="h-[1.1rem] w-[1.1rem]" />, TINT.copper)}
      {canPickSpeaker && devGroup('audiooutput', 'speaker', t('Sound plays from', 'الصوت طالع من'), <Volume2 className="h-[1.1rem] w-[1.1rem]" />, TINT.copper)}
      {p.hasCamera && devGroup('videoinput', 'video', t('Camera', 'الكاميرا'), <Video className="h-[1.1rem] w-[1.1rem]" />, TINT.teal)}
      {!devices.length && <p className="px-4 py-6 text-center text-sm text-[#BFB3A3]">{t('Looking for your devices…', 'بندوّر على أجهزتك…')}</p>}
      <div className="room-group mt-3 flex items-center gap-3 px-3.5 py-3">
        <span className="shrink-0 text-[0.8rem] text-[#BFB3A3]">{p.muted ? t('Your mic is off', 'المايك مقفول') : t('Your voice is coming through', 'صوتك واصل')}</span>
        <span aria-hidden="true" className="flex h-4 flex-1 items-center gap-[3px]">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} className="room-level" style={{ animationDelay: `${-i * 70}ms`, background: p.muted ? 'rgba(255,255,255,0.15)' : i < 11 ? '#12A4BC' : '#F0B54A', animationPlayState: p.muted ? 'paused' : undefined }} />
          ))}
        </span>
      </div>
      <button type="button" onClick={test}
        className="room-press mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[linear-gradient(180deg,#F6D58E,#E5A93C)] text-[0.95rem] font-bold text-[#2A1A10] focus-ring">
        <Play className="h-4 w-4 fill-current" aria-hidden="true" />{t('Test sound', 'اختبر الصوت')}
      </button>
      {(nameOf('audioinput', p.current.audio) || nameOf('videoinput', p.current.video)) && (
        <p className="mt-2 text-center text-[0.74rem] text-[#BFB3A3]">{[nameOf('audioinput', p.current.audio), nameOf('videoinput', p.current.video)].filter(Boolean).join(' · ')}</p>
      )}
    </div>
  );

  const fix = (icon: React.ReactNode, color: string, title: string, tip: string, btn: string, act: () => void) => (
    <div className="relative flex items-start gap-3 px-3 py-3">
      <Tint color={color}>{icon}</Tint>
      <span className="grid min-w-0 flex-1 gap-0.5">
        <span className="text-[0.92rem] font-medium text-foreground">{title}</span>
        <span className="text-[0.76rem] leading-snug text-[#BFB3A3]">{tip}</span>
      </span>
      <button type="button" onClick={act} className="room-press h-8 shrink-0 self-center rounded-full bg-[#F0B54A]/20 px-3 text-[0.8rem] font-medium text-[#F6D58E] focus-ring">{btn}</button>
    </div>
  );
  const peer = p.peerName ?? t('the learner', 'الطالب');
  const helpPage = (
    <div className="room-push">
      <Header title={t("Let's fix it", 'نحلها سوا')} onBack={home} />
      <p className="px-2 pb-1 text-center text-[0.8rem] text-[#BFB3A3]">{t('Quick fixes while the lesson keeps going', 'حلول سريعة، والحصة شغالة')}</p>
      <div className="room-group mt-2">
        <Row icon={<Tint color={linkColor(p.link)}><Wifi className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={t('You', 'إنت')} end={<span className="text-[0.84rem]" style={{ color: linkColor(p.link) === TINT.teal ? '#22BBD4' : '#F6D58E' }}>{linkWord(p.link)}</span>} />
        {p.peerLink !== undefined && (
          <Row icon={<Tint color={linkColor(p.peerLink)}><Wifi className="h-[1.1rem] w-[1.1rem]" /></Tint>} title={teacher ? peer : t('Your teacher', 'الأستاذ')}
            end={<span className="text-[0.84rem]" style={{ color: linkColor(p.peerLink) === TINT.teal ? '#22BBD4' : '#F6D58E' }}>{linkWord(p.peerLink)}</span>} />
        )}
      </div>
      <SectionTitle>{t('Sound', 'الصوت')}</SectionTitle>
      <div className="room-group">
        {fix(<Volume2 className="h-[1.1rem] w-[1.1rem]" />, TINT.copper, teacher ? t(`${peer} can't hear you`, `${peer} مش سامعك`) : t("I can't hear my teacher", 'مش سامع الأستاذ'),
          t('Turn the volume up and check the speaker in Devices.', 'علّي الصوت واتأكد من السماعة في الأجهزة.'), t('Try', 'جرّب'), test)}
        {fix(<Mic className="h-[1.1rem] w-[1.1rem]" />, TINT.teal, teacher ? t(`I can't hear ${peer}`, `مش سامع ${peer}`) : t("My teacher can't hear me", 'الأستاذ مش سامعني'),
          teacher ? t('Ask them to check their mic, or to rejoin.', 'اطلب منه يتأكد من المايك أو يدخل تاني.') : t('Allow the mic in your browser settings, then turn it on here.', 'اسمح للموقع بالمايك من إعدادات المتصفح، وافتحه من هنا.'),
          p.muted ? t('Turn mic on', 'افتح المايك') : t('Devices', 'الأجهزة'), () => (p.muted ? p.onUnmute() : go('devices')))}
      </div>
      <SectionTitle>{t('Picture and connection', 'الصورة والاتصال')}</SectionTitle>
      <div className="room-group">
        {p.hasCamera && !p.cameraOff && fix(<VideoOff className="h-[1.1rem] w-[1.1rem]" />, TINT.brick, t('The video keeps freezing', 'الصورة بتقطّع'),
          t('Move closer to the router, or turn your camera off for a while. Sound comes first.', 'قرّب من الراوتر، أو اقفل الكاميرا شوية. الصوت أولوية.'), t('Camera off', 'اقفل الكاميرا'), () => { p.onCameraOff(); p.onClose(); })}
        {fix(<RotateCw className="h-[1.1rem] w-[1.1rem]" />, TINT.sand, t('Still not right', 'لسه مش ظابطة'),
          t('Rejoin: the lesson comes back exactly as it was.', 'ادخل تاني: الحصة بترجع زي ما هي بالظبط.'), t('Rejoin', 'ادخل تاني'), p.onRejoin)}
      </div>
      {teacher && (p.zoomUrl || p.onZoom) && (
        p.zoomUrl ? (
          <a href={p.zoomUrl} target="_blank" rel="noopener noreferrer"
            className="room-press mt-3 grid min-h-14 w-full content-center justify-items-center gap-0.5 rounded-[1.25rem] bg-[#087D91]/30 px-4 py-2 text-center text-[0.95rem] font-bold text-[#CDEFF4] ring-1 ring-[#12A4BC]/45 focus-ring">
            {t('Open the Zoom link', 'افتح رابط زووم')}<span className="text-[0.74rem] font-normal text-[#9EC9D0]">{t(`${peer} has the same link`, `${peer} وصله نفس الرابط`)}</span>
          </a>
        ) : (
          <button type="button" onClick={p.onZoom}
            className="room-press mt-3 grid min-h-14 w-full content-center justify-items-center gap-0.5 rounded-[1.25rem] bg-[#087D91]/30 px-4 py-2 text-[0.95rem] font-bold text-[#CDEFF4] ring-1 ring-[#12A4BC]/45 focus-ring">
            {t('Problem on our side? Continue on Zoom', 'في مشكلة عندنا؟ كمّل على زووم')}
            <span className="text-[0.74rem] font-normal text-[#9EC9D0]">{t(`The admin is told at once and ${peer} gets the same link`, `الإدارة بتعرف على طول، و${peer} بيوصله نفس الرابط`)}</span>
          </button>
        )
      )}
    </div>
  );

  const keys: Array<[string, string]> = [[t('Mic', 'المايك'), 'M'], [t('Conversation, lesson, shared screen', 'محادثة، درس، الشاشة المشتركة'), '1 · 2 · 3'], [t('Close this menu', 'اقفل القايمة دي'), 'Esc']];
  const keysPage = (
    <div className="room-push">
      <Header title={t('Keyboard shortcuts', 'اختصارات الكيبورد')} onBack={home} />
      <div className="room-group mt-2">
        {keys.map(([label, key]) => (
          <Row key={key} icon={null} title={label} className="ps-4" end={<kbd className="shrink-0 rounded-md bg-white/[0.12] px-2 py-0.5 font-mono text-[0.78rem] text-foreground">{key}</kbd>} />
        ))}
      </div>
    </div>
  );

  return (
    <FocusTrap onEscape={p.onClose}>
      <button type="button" aria-label={t('Close', 'اقفل')} onClick={p.onClose} className="fixed inset-0 z-[29] cursor-default bg-[rgba(8,6,5,0.3)] sm:bg-transparent" />
      <div role="dialog" aria-label={t('More', 'المزيد')}
        className={cn('room-glass z-30 overflow-y-auto overscroll-contain p-2.5 text-foreground',
          'room-more max-sm:fixed max-sm:inset-x-2 max-sm:bottom-2 max-sm:max-h-[calc(100dvh-5rem)] max-sm:rounded-[2.6rem] max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]',
          'sm:absolute sm:bottom-full sm:end-0 sm:mb-3 sm:max-h-[min(44rem,calc(100dvh-8rem))] sm:w-[24.5rem] sm:rounded-[2rem]')}>
        <div aria-hidden="true" className="mx-auto mb-2.5 mt-0.5 h-[5px] w-[38px] rounded-full bg-white/35 sm:hidden" />
        {page === 'main' && main}
        {page === 'devices' && devicesPage}
        {page === 'help' && helpPage}
        {page === 'keys' && keysPage}
        <span className="sr-only" aria-live="polite">{page === 'main' ? '' : page}</span>
      </div>
    </FocusTrap>
  );
}

