import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, ChevronDown, Copy, Gauge, Headphones, Info, Lock, Mic, MicOff, RefreshCw, Video, VideoOff, Volume2 } from 'lucide-react';
import { useT } from '../lib/language';
import { cn } from '../lib/utils';
import { detectPlatform } from '../lib/pwaInstall';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';
import { ZadRigSvg } from '../components/zad/ZadRig';
import { Khatam } from './parts/Khatam';
import { detectBrowser, deviceState, permissionSteps, runNetworkTest, type DeviceState, type NetResult } from './deviceCheck';

type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
export type WaitingRoomReady = { recitationMode: boolean; speakerId?: string; micOff?: boolean; cameraOff?: boolean };
export type WaitingInfo = {
  /** "Quran with Ustadha Afnan" */
  title: string;
  /** "Today 17:00 · starts in 2 min" */
  when: React.ReactNode;
  /** "Your teacher is here", from the room channel, or null. */
  here: string | null;
};

// Same values as the engine's audioConstraints (Task 5); recitation keeps the full voice, so no noise suppression.
const audioFor = (recitation: boolean, deviceId?: string): MediaTrackConstraints => ({
  echoCancellation: true, autoGainControl: true, noiseSuppression: !recitation, ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
});
const videoFor = (deviceId?: string): MediaTrackConstraints => ({
  width: { ideal: 1280 }, height: { ideal: 720 }, ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
});
const canPickSpeaker = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
const isObserver = (r: RoomRole) => r === 'guardian_observer' || r === 'admin_observer';
const BARS = [0.35, 0.6, 0.85, 1, 0.85, 0.6, 0.35];

/**
 * Classroom Task 6, redesigned (DESIGN-BRIEF 4.1): you stand at the door. Your camera in an arch with the mic and
 * camera switches on it, who the lesson is with, whether they are already in, and one Join. Device pickers wait behind
 * a disclosure and open by themselves when something is wrong. Nothing here blocks entry: a weak camera gets advice,
 * a missing one still lets the person join by voice.
 */
export function WaitingRoom({ role, ticket, bookingId, onReady, info, kid = false, iceServers = [] }: {
  role: RoomRole;
  ticket: string;
  bookingId: string;
  /** From enter: used by the network test to check the TURN relay answers. */
  iceServers?: RTCIceServer[];
  onReady: (stream: MediaStream, opts: WaitingRoomReady) => void;
  info: WaitingInfo;
  kid?: boolean;
}) {
  const { t, isAr } = useT();
  const teacher = role === 'teacher';
  const [stream, setStream] = useState<MediaStream | null>(null);
  // BUILD-LIST 1.5: camera and mic are asked one by one, so a blocked or missing camera still lets the mic work.
  const [cam, setCam] = useState<DeviceState | null>(null);
  const [mic, setMic] = useState<DeviceState | null>(null);
  const [net, setNet] = useState<NetResult | null>(null);
  const [netRun, setNetRun] = useState(0);
  const [speakerTested, setSpeakerTested] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [speakerId, setSpeakerId] = useState('');
  const [recitation, setRecitation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [slow, setSlow] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [micOff, setMicOff] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [heard, setHeard] = useState(false);
  const [devicesOpen, setDevicesOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zadPose, setZadPose] = useState<'wave' | 'idle'>('wave');
  const videoRef = useRef<HTMLVideoElement>(null);
  const barsRef = useRef<HTMLSpanElement>(null);
  const handedOff = useRef(false);
  const inApp = typeof navigator !== 'undefined' && detectPlatform(navigator.userAgent) === 'in-app';
  const who = detectBrowser(typeof navigator !== 'undefined' ? navigator.userAgent : '');

  const height = stream?.getVideoTracks()[0]?.getSettings().height ?? null;
  const passed720 = height != null && height >= 720;

  const refreshDevices = useCallback(async () => {
    try { setDevices(await navigator.mediaDevices.enumerateDevices()); } catch { /* not supported */ }
  }, []);

  // (Re)open the camera and mic whenever a picker changes or "Try again" is pressed. Recitation mode is applied by the room.
  // Each device is asked on its own: a refusal or a missing camera never takes the mic with it, and the other way round.
  useEffect(() => {
    if (isObserver(role)) { setLoading(false); return; }
    let cancelled = false;
    let opened: MediaStream | null = null;
    (async () => {
      setLoading(true);
      if (!navigator.mediaDevices?.getUserMedia) { setCam('error'); setMic('error'); setLoading(false); return; }
      const tracks: MediaStreamTrack[] = [];
      const ask = async (c: MediaStreamConstraints): Promise<DeviceState> => {
        try { tracks.push(...(await navigator.mediaDevices.getUserMedia(c)).getTracks()); return 'ok'; }
        catch (err) { return deviceState(err); }
      };
      const micState = await ask({ audio: audioFor(false, micId) });
      const camState = await ask({ video: videoFor(cameraId) });
      opened = tracks.length ? new MediaStream(tracks) : null;
      if (cancelled) { opened?.getTracks().forEach((tr) => tr.stop()); return; }
      setMic(micState);
      setCam(camState);
      setStream(opened);
      setLoading(false);
      refreshDevices();
    })();
    return () => {
      cancelled = true;
      if (!handedOff.current) opened?.getTracks().forEach((tr) => tr.stop());
    };
  }, [role, cameraId, micId, attempt, refreshDevices]);

  // Allowing the camera or mic in the browser's site settings retries by itself where the browser tells us.
  useEffect(() => {
    if (isObserver(role) || !navigator.permissions?.query) return;
    const watched: PermissionStatus[] = [];
    const retry = () => setAttempt((n) => n + 1);
    for (const name of ['camera', 'microphone']) {
      navigator.permissions.query({ name: name as PermissionName }).then((p) => { p.addEventListener('change', retry); watched.push(p); }).catch(() => { /* not supported (Firefox, older Safari) */ });
    }
    return () => watched.forEach((p) => p.removeEventListener('change', retry));
  }, [role]);

  // The network test runs once by itself, and again on "Test again". Never blocks Join.
  useEffect(() => {
    if (isObserver(role)) return;
    let live = true;
    setNet(null);
    runNetworkTest(bookingId, ticket, iceServers).then((r) => { if (live) setNet(r); }).catch(() => { if (live) setNet({ latencyMs: null, downKbps: null, relay: 'skipped', network: 'unknown' }); });
    return () => { live = false; };
  }, [role, bookingId, ticket, netRun]);

  // Below 300 ms nothing shows; after that, the khatam breathes in the arch.
  useEffect(() => {
    if (!loading) { setSlow(false); return; }
    const id = window.setTimeout(() => setSlow(true), 300);
    return () => window.clearTimeout(id);
  }, [loading]);

  useEffect(() => {
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, [stream]);
  // The switches on the preview act on the tracks themselves; the room starts with the same state.
  useEffect(() => { stream?.getAudioTracks().forEach((tr) => { tr.enabled = !micOff; }); }, [stream, micOff]);
  useEffect(() => { stream?.getVideoTracks().forEach((tr) => { tr.enabled = !camOff; }); }, [stream, camOff]);
  // Problems open the device list by themselves.
  useEffect(() => { if (cam === 'missing' || cam === 'error') setDevicesOpen(true); }, [cam]);
  // Zad waves once, then stands still.
  useEffect(() => { const id = window.setTimeout(() => setZadPose('idle'), 2600); return () => window.clearTimeout(id); }, []);

  // Live mic level: an AnalyserNode drives the bars straight on the DOM (no re-render per frame).
  useEffect(() => {
    const track = stream?.getAudioTracks()[0];
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!track || !Ctx) return;
    const ctx: AudioContext = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const source = ctx.createMediaStreamSource(new MediaStream([track]));
    source.connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    let raf = 0;
    let last = 0;
    // Reduced motion: the bars still show the level, but update five times a second instead of every frame.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (calm && ts - last < 200) return;
      last = ts;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
      if (level > 0.25) setHeard(true);
      const bars = barsRef.current?.children;
      if (bars) for (let i = 0; i < bars.length; i++) (bars[i] as HTMLElement).style.transform = `scaleY(${Math.max(0.12, level * BARS[i]).toFixed(3)})`;
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); source.disconnect(); ctx.close().catch(() => {}); };
  }, [stream]);

  const testSpeaker = async () => {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx: AudioContext = new Ctx();
    try { if (speakerId && 'setSinkId' in ctx) await (ctx as any).setSinkId(speakerId); } catch { /* default output */ }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.frequency.value = 523;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.6);
    osc.onended = () => { ctx.close().catch(() => {}); };
    setSpeakerTested(true);
  };

  const join = () => {
    const s = stream ?? new MediaStream();
    if (!isObserver(role)) {
      // Best effort: the quality record must never hold up the lesson.
      fetch(`/api/classroom/${bookingId}/precheck`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
        body: JSON.stringify({
          precheck720: passed720, startHeight: height,
          detail: {
            ...(cam ? { camera: cam } : {}), ...(mic ? { mic } : {}), speakerTested, browser: who.browser, mobile: who.mobile,
            ...(net ? { latencyMs: net.latencyMs, downKbps: net.downKbps, relay: net.relay, network: net.network } : {}),
          },
        }),
      }).catch(() => {});
    }
    handedOff.current = true;
    onReady(s, { recitationMode: teacher && recitation, ...(speakerId ? { speakerId } : {}), micOff, cameraOff: camOff });
  };

  const heading = cn('font-editorial text-[1.75rem] leading-tight text-foreground sm:text-4xl text-balance', isAr ? 'font-bold' : 'font-medium tracking-tight');
  const presence = info.here && (
    <p className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-teal/10 px-3 py-1.5 text-sm font-medium text-teal">
      <span className="relative grid h-2.5 w-2.5 place-items-center"><span className="h-2.5 w-2.5 rounded-full bg-teal" /></span>
      {info.here}
    </p>
  );

  if (isObserver(role)) {
    const admin = role === 'admin_observer';
    return (
      <div className="mx-auto grid min-h-full w-full max-w-md content-center px-4 py-10">
        <div className="glass-2 arch-top grid justify-items-center gap-4 px-6 pb-8 pt-14 text-center">
          <Khatam size={44} />
          <h1 className={heading}>{info.title}</h1>
          <p className="text-sm text-muted-foreground">{info.when}</p>
          {presence}
          <div className="grid gap-2 text-[0.95rem] leading-relaxed text-foreground">
            <p>{t("You'll watch quietly. Your camera and mic stay off.", 'هتتابع بهدوء. الكاميرا والمايك هيفضلوا مقفولين.')}</p>
            <p className="text-muted-foreground">
              {admin
                ? t('Nobody in the lesson can see you.', 'محدش في الحصة هيشوف إنك موجود.')
                : t("The teacher sees that a guardian is watching. Your child doesn't.", 'المعلم هيعرف إن ولي الأمر بيتابع، وابنك مش هيعرف.')}
            </p>
          </div>
          <Button size="lg" onClick={join} className="mt-2 w-full">{t('Join quietly', 'ادخل بهدوء')}</Button>
        </div>
      </div>
    );
  }

  const cams = devices.filter((d) => d.kind === 'videoinput' && d.deviceId);
  const mics = devices.filter((d) => d.kind === 'audioinput' && d.deviceId);
  const speakers = devices.filter((d) => d.kind === 'audiooutput' && d.deviceId);
  const label = (d: MediaDeviceInfo, i: number, fallback: string) => d.label || `${fallback} ${i + 1}`;
  const hasVideo = !!stream?.getVideoTracks().length;
  const hasMic = !!stream?.getAudioTracks().length;
  const blocked = cam === 'denied' || mic === 'denied';

  const preview = (
    <div className="relative mx-auto w-full max-w-[22rem] sm:max-w-[26rem]">
      <div className="arch-face relative aspect-[4/5] w-full overflow-hidden bg-[#1C1714] text-[#FAF7F2] shadow-[0_30px_70px_-34px_rgba(59,34,25,0.7)] ring-1 ring-[rgba(229,169,60,0.28)] [--arch-h:11rem]">
        {hasVideo && <video ref={videoRef} autoPlay playsInline muted className={cn('absolute inset-0 h-full w-full -scale-x-100 object-cover', camOff && 'invisible')} />}
        {(!hasVideo || camOff) && (
          <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(26rem_18rem_at_50%_0%,rgba(229,169,60,0.2),transparent_70%)] p-6 text-center">
            {loading ? (slow && (
              <div className="grid justify-items-center gap-3"><Khatam size={56} breathe /><p className="text-sm text-[#D8C6AE]">{t('Opening your camera…', 'بنفتح الكاميرا…')}</p></div>
            )) : cam === 'denied' && !camOff ? (
              <div className="grid justify-items-center gap-3">
                <span className="arch-tile grid h-16 w-14 place-items-center bg-[#3B2219] text-[#F6D58E]"><Lock className="h-6 w-6" aria-hidden="true" /></span>
                <p className="max-w-[16rem] text-[0.95rem] font-semibold">{t('Your browser is blocking the camera', 'المتصفح مانع الكاميرا')}</p>
                <p className="max-w-[16rem] text-sm leading-relaxed text-[#D8C6AE]">{t('The steps to allow it are next to this. You can still join with your voice.', 'خطوات السماح بيها جنبك. وتقدر تدخل بصوتك برضه.')}</p>
              </div>
            ) : (
              <div className="grid justify-items-center gap-3">
                <span aria-hidden="true" className="arch-tile grid h-24 w-20 place-items-center bg-[#2E2824] font-editorial text-4xl text-[#F6D58E]">
                  {camOff ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
                </span>
                <p className="max-w-[16rem] text-sm leading-relaxed text-[#D8C6AE]">
                  {camOff ? t('Your camera is off. Turn it on whenever you like.', 'الكاميرا مقفولة. افتحها وقت ما تحب.')
                    : hasMic ? t("We can't find a camera, or another app is using it. You can join with your voice.", 'ملقيناش كاميرا، أو في برنامج تاني شغّالها. تقدر تدخل بصوتك.')
                      : t("This device can't open a camera or mic. Try another browser, or join to listen.", 'الجهاز ده مش قادر يفتح كاميرا أو مايك. جرّب متصفح تاني، أو ادخل واسمع.')}
                </p>
              </div>
            )}
          </div>
        )}
        {(hasVideo || hasMic) && (
          <div className="absolute inset-x-0 bottom-4 z-[2] flex justify-center gap-3">
            {hasMic && (
              <button type="button" onClick={() => setMicOff((v) => !v)} aria-pressed={micOff}
                aria-label={micOff ? t('Turn mic on', 'افتح المايك') : t('Mute', 'اقفل المايك')}
                className={cn('room-press grid h-12 w-12 place-items-center rounded-full focus-ring', micOff ? 'bg-[#3D2A20] text-[#F2B39F] ring-1 ring-[#DA7960]/40' : 'face-scrim hover:bg-[rgba(17,15,14,0.78)]')}>
                {micOff ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
            {hasVideo && (
              <button type="button" onClick={() => setCamOff((v) => !v)} aria-pressed={camOff}
                aria-label={camOff ? t('Turn camera on', 'افتح الكاميرا') : t('Turn camera off', 'اقفل الكاميرا')}
                className={cn('room-press grid h-12 w-12 place-items-center rounded-full focus-ring', camOff ? 'bg-[#3D2A20] text-[#F2B39F] ring-1 ring-[#DA7960]/40' : 'face-scrim hover:bg-[rgba(17,15,14,0.78)]')}>
                {camOff ? <VideoOff className="h-5 w-5" aria-hidden="true" /> : <Video className="h-5 w-5" aria-hidden="true" />}
              </button>
            )}
          </div>
        )}
      </div>
      {kid && (
        <div className="pointer-events-none absolute -bottom-3 -end-5 sm:-end-10">
          <ZadRigSvg pose={zadPose} size={96} glow={false} />
        </div>
      )}
    </div>
  );

  const meter = hasMic && (
    <div className="flex items-center justify-center gap-3" aria-label={t('Microphone level', 'مستوى صوت المايك')}>
      <span ref={barsRef} aria-hidden="true" className="flex h-7 items-center gap-1">
        {BARS.map((_, i) => <span key={i} className="block h-7 w-1.5 origin-center rounded-full bg-teal" style={{ transform: 'scaleY(0.12)' }} />)}
      </span>
      <span className="text-sm text-muted-foreground">
        {micOff ? t('Your mic is off.', 'المايك مقفول.') : t('Say salam. The bars should move.', 'قول السلام عليكم، والخطوط هتتحرك.')}
      </span>
    </div>
  );

  const check = (ok: boolean, text: string) => (
    <span className={cn('inline-flex items-center gap-1.5 rounded-[var(--r-pill)] px-3 py-1.5 text-sm font-medium', ok ? 'bg-teal/10 text-teal' : 'bg-sand-light text-muted-foreground ring-1 ring-sand-border')}>
      {ok ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <Info className="h-4 w-4" aria-hidden="true" />}{text}
    </span>
  );

  const pickers = (
    <div className="grid gap-3 rounded-[var(--r-3)] bg-surface p-4 shadow-[var(--shadow-1)] ring-1 ring-border-subtle">
      {cams.length > 1 && (
        <Picker icon={<Video className="h-4 w-4" />} label={t('Camera', 'الكاميرا')} value={cameraId} onChange={setCameraId}
          options={cams.map((d, i) => [d.deviceId, label(d, i, t('Camera', 'كاميرا'))])} defaultLabel={t('Default camera', 'الكاميرا الأساسية')} />
      )}
      {mics.length > 1 && (
        <Picker icon={<Mic className="h-4 w-4" />} label={t('Microphone', 'المايك')} value={micId} onChange={setMicId}
          options={mics.map((d, i) => [d.deviceId, label(d, i, t('Microphone', 'مايك'))])} defaultLabel={t('Default microphone', 'المايك الأساسي')} />
      )}
      {canPickSpeaker && speakers.length > 1 && (
        <Picker icon={<Volume2 className="h-4 w-4" />} label={t('Speaker', 'السماعة')} value={speakerId} onChange={setSpeakerId}
          options={speakers.map((d, i) => [d.deviceId, label(d, i, t('Speaker', 'سماعة'))])} defaultLabel={t('Default speaker', 'السماعة الأساسية')} />
      )}
      <button type="button" onClick={testSpeaker} className="room-press inline-flex min-h-11 items-center gap-2 justify-self-start rounded-[var(--r-pill)] px-1 text-sm font-medium text-teal focus-ring">
        <Volume2 className="h-4 w-4" aria-hidden="true" />{t('Play a test sound', 'شغّل صوت تجربة')}
      </button>
      <div className="grid gap-1 border-t border-border-subtle pt-3 text-sm text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground"><Gauge className="h-4 w-4" aria-hidden="true" />{t('Internet test', 'اختبار النت')}</p>
        {net ? (
          <p dir="ltr" className="tabular-nums">
            {net.latencyMs != null ? `${net.latencyMs} ms` : '–'} · {net.downKbps != null ? `${(net.downKbps / 1000).toFixed(1)} Mbps` : '–'} · {t('relay', 'السيرفر الاحتياطي')} {net.relay === 'ok' ? '✓' : net.relay === 'failed' ? '✗' : '–'}
          </p>
        ) : <p>{t('Testing…', 'بنختبر…')}</p>}
        <button type="button" disabled={!net} onClick={() => setNetRun((n) => n + 1)} className="room-press inline-flex min-h-11 items-center gap-2 justify-self-start rounded-[var(--r-pill)] px-1 text-sm font-medium text-teal focus-ring disabled:opacity-50">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />{t('Test again', 'اختبر تاني')}
        </button>
      </div>
      {kid && <p className="text-sm leading-relaxed text-muted-foreground">{t('For grown-ups: if the picture or sound is missing, check the browser lets this page use the camera and mic, then pick them here.', 'لولي الأمر: لو الصورة أو الصوت مش شغّالين، اتأكد إن المتصفح سامح للصفحة بالكاميرا والمايك، واختارهم من هنا.')}</p>}
    </div>
  );

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 pt-6 sm:pt-10 lg:min-h-full lg:content-center lg:grid-cols-[26rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-6 lg:pb-14 lg:pt-16">
      <header className="grid justify-items-start gap-2 lg:col-start-2 lg:row-start-1 lg:self-end">
        <h1 className={heading}>{info.title}</h1>
        <p className="text-[0.95rem] text-muted-foreground">{info.when}</p>
        {kid && <p className="text-base text-foreground">{t('Ready? Your teacher can see you when you join.', 'جاهز؟ معلمك هيشوفك أول ما تدخل.')}</p>}
        {presence}
      </header>

      <div className="grid gap-4 lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">
        {preview}
        {meter}
      </div>

      <div className="grid content-start gap-4 lg:col-start-2 lg:row-start-2">
        {inApp && (
          <div role="status" className="grid gap-2 rounded-[var(--r-3)] bg-sand-light p-4 text-sm text-foreground ring-1 ring-sand-border">
            <p>{t('Open this page in Safari or Chrome to use your camera.', 'افتح الصفحة دي في Safari أو Chrome علشان الكاميرا تشتغل.')}</p>
            <button type="button" onClick={() => { navigator.clipboard?.writeText(location.href).then(() => setCopied(true), () => {}); }}
              className="room-press inline-flex min-h-11 items-center gap-2 justify-self-start rounded-[var(--r-pill)] bg-surface px-4 font-semibold text-teal ring-1 ring-border focus-ring">
              <Copy className="h-4 w-4" aria-hidden="true" />{copied ? t('Link copied', 'اتنسخ اللينك') : t('Copy the link', 'انسخ اللينك')}
            </button>
          </div>
        )}

        {!loading && blocked && (
          <div role="alert" className="grid gap-3 rounded-[var(--r-3)] bg-sand-light p-4 ring-1 ring-sand-border">
            <p className="flex items-start gap-2 text-[0.95rem] font-semibold text-foreground">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {cam === 'denied' && mic === 'denied' ? t('Your browser is blocking the camera and mic', 'المتصفح مانع الكاميرا والمايك')
                : cam === 'denied' ? t('Your browser is blocking the camera', 'المتصفح مانع الكاميرا') : t('Your browser is blocking the mic', 'المتصفح مانع المايك')}
            </p>
            <ol className="grid list-decimal gap-1.5 ps-5 text-sm leading-relaxed text-sand-foreground">
              {permissionSteps(who, t).map((step) => <li key={step}>{step}</li>)}
            </ol>
            <Button variant="outline" size="sm" className="justify-self-start" onClick={() => setAttempt((n) => n + 1)}>
              <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />{t('Try again', 'جرّب تاني')}
            </Button>
          </div>
        )}

        {!loading && (
          <div className="flex flex-wrap gap-2">
            {check(hasVideo, hasVideo ? t('Camera ready', 'الكاميرا جاهزة') : t('No camera', 'مفيش كاميرا'))}
            {check(hasMic && (heard || micOff), hasMic ? (heard ? t('Sound ready', 'الصوت جاهز') : t('Say something to test', 'اتكلم علشان نجرب')) : t('No mic', 'مفيش مايك'))}
            {net && check(net.network === 'good', net.network === 'good' ? t('Internet good', 'النت كويس') : net.network === 'fair' ? t('Internet OK', 'النت مقبول') : net.network === 'poor' ? t('Internet weak', 'النت ضعيف') : t('Internet not checked', 'ما قدرناش نختبر النت'))}
          </div>
        )}
        {net && net.network !== 'good' && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {net.network === 'poor'
              ? t('Your internet is weak right now. Sit closer to the router, or close videos and downloads on this network. The lesson keeps your voice first.', 'النت ضعيف دلوقتي. اقعد قريب من الراوتر، أو اقفل الفيديوهات والتحميلات على نفس الشبكة. الحصة بتحافظ على الصوت الأول.')
              : net.network === 'fair' ? t('Your internet is fine for the lesson; the picture may be a little softer.', 'النت كويس للحصة؛ الصورة ممكن تبقى أقل وضوحًا شوية.')
                : t('We could not test your internet. You can still join.', 'ما قدرناش نختبر النت. تقدر تدخل عادي.')}
          </p>
        )}
        {hasVideo && height != null && !passed720 && !kid && (
          <p className="text-sm leading-relaxed text-muted-foreground">
            {t('Your camera looks a bit blurry. Sitting facing a window helps, and so does closing other apps that use the camera.', 'الكاميرا شكلها مش واضحة أوي. اقعد قصاد شباك، واقفل البرامج التانية اللي بتستخدم الكاميرا.')}
          </p>
        )}

        {teacher && (
          <div className="grid gap-1 rounded-[var(--r-3)] bg-sand-light p-4 ring-1 ring-sand-border">
            <p className="flex items-start gap-2 text-sm leading-relaxed text-sand-foreground">
              <Headphones className="mt-0.5 h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              {t('Please wear your headset. It stops echo and lets you hear every letter clearly.', 'من فضلك البس السماعة. بتمنع الصدى وبتخليك تسمع كل حرف بوضوح.')}
            </p>
            <Switch checked={recitation} onChange={setRecitation}
              hint={t('Keeps the full voice for Quran recitation. Turn it off for normal talk.', 'بيحافظ على الصوت كامل وقت التلاوة. اقفله في الكلام العادي.')}>
              {t('Recitation mode', 'وضع التلاوة')}
            </Switch>
          </div>
        )}

        <div className="grid gap-3">
          <button type="button" aria-expanded={devicesOpen} onClick={() => setDevicesOpen((o) => !o)}
            className="room-press inline-flex min-h-11 items-center gap-1.5 justify-self-start rounded-[var(--r-pill)] text-sm font-medium text-teal focus-ring">
            {kid ? t('Need help?', 'محتاج مساعدة؟') : t('Change camera, mic or speaker', 'غيّر الكاميرا أو المايك أو السماعة')}
            <ChevronDown className={cn('h-4 w-4 transition-transform duration-[var(--dur-ui)]', devicesOpen && 'rotate-180')} aria-hidden="true" />
          </button>
          {devicesOpen && <div className="room-fade">{pickers}</div>}
        </div>

        <div className="sticky bottom-0 -mx-4 bg-[linear-gradient(to_top,var(--background)_70%,transparent)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 lg:static lg:mx-0 lg:bg-none lg:p-0">
          <Button size="lg" onClick={join} isLoading={loading} disabled={loading} className="w-full lg:w-auto lg:min-w-[16rem]">
            {t('Join the lesson', 'ادخل الحصة')}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Picker({ icon, label, value, onChange, options, defaultLabel }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<[string, string]>;
  defaultLabel: string;
}) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-foreground">
      <span className="flex items-center gap-2 text-muted-foreground">{icon}{label}</span>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{defaultLabel}</option>
        {options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </Select>
    </label>
  );
}
