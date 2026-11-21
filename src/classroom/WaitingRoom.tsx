import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BookOpen, ChevronLeft, Copy, Headphones, Mic, MicOff, RefreshCw, Video, VideoOff, Volume2, Wifi } from 'lucide-react';
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
 * Classroom Task 6, owner-approved design 2026-11-21 (docs/classroom/ROOM-DESIGN.md): you stand at the homepage's door.
 * Your camera in its crimson portal with the mic and camera switches on it, who the lesson is with, whether they are
 * already in, a glass card of readiness rows (camera, mic, speaker, internet) and one crimson Join. Tapping a row pushes
 * Devices or the permission steps. Nothing here blocks entry: a weak camera gets advice, a missing one still lets the
 * person join by voice.
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
  // The setup card's pages (owner-approved 2026-11-21): main readiness rows, then Devices or the permission steps, each with Back.
  const [page, setPage] = useState<'main' | 'devices' | 'fix'>('main');
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
  useEffect(() => { if (cam === 'missing' || cam === 'error') setPage('devices'); }, [cam]);
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

  if (isObserver(role)) {
    const admin = role === 'admin_observer';
    return (
      <div className="mx-auto grid min-h-full w-full max-w-md content-center px-4 py-10">
        <div className="glass-2 arch-top grid justify-items-center gap-4 px-6 pb-8 pt-14 text-center">
          <Khatam size={44} />
          <h1 className={heading}>{info.title}</h1>
          <p className="text-sm text-muted-foreground">{info.when}</p>
          {info.here && (
            <p className="inline-flex items-center gap-2 rounded-[var(--r-pill)] bg-teal/10 px-3 py-1.5 text-sm font-medium text-teal">
              <span className="h-2.5 w-2.5 rounded-full bg-teal" />{info.here}
            </p>
          )}
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
  const noPicture = !hasVideo || camOff;
  const micName = stream?.getAudioTracks()[0]?.label || t('Default microphone', 'المايك الأساسي');
  const speakerName = speakers.find((d) => d.deviceId === speakerId)?.label || t('Default speaker', 'السماعة الأساسية');

  // One crimson action per view: the Join button. Problem pills use the light crimson tint.
  // The homepage door around your own camera. Without a picture, the crimson portal shows the khatam and a gold light.
  const preview = (
    <div className="wait-slot relative mx-auto w-full max-w-[15.5rem] sm:max-w-[25rem]">
      <div className="wait-door glass-2 grid gap-3 p-2 pb-3 sm:p-2.5 sm:pb-4">
        <div className={cn('wait-portal aspect-[4/5] w-full text-[#FAF7F2]', noPicture && 'khatam-window')}>
          {hasVideo && <video ref={videoRef} autoPlay playsInline muted className={cn('absolute inset-0 h-full w-full -scale-x-100 object-cover', camOff && 'invisible')} />}
          {noPicture && (
            <div className="absolute inset-0 grid place-items-center p-6 text-center">
              {!loading && <span className="door-glow" aria-hidden="true" />}
              {loading ? (slow && (
                <div className="relative grid justify-items-center gap-3"><Khatam size={56} breathe /><p className="text-sm text-[#F1E3D3]">{t('Opening your camera…', 'بنفتح الكاميرا…')}</p></div>
              )) : (
                <div className="relative grid justify-items-center gap-2.5">
                  <Khatam size={56} className="drop-shadow-[0_0_14px_rgba(229,169,60,0.45)]" />
                  <p className="max-w-[16rem] text-[0.95rem] font-bold sm:text-base">
                    {camOff ? t('Your camera is off', 'الكاميرا مقفولة')
                      : cam === 'denied' ? t('Your browser is blocking the camera', 'المتصفح مانع الكاميرا')
                        : hasMic ? t("We can't find a camera", 'ملقيناش كاميرا') : t("This device can't open a camera or mic", 'الجهاز ده مش قادر يفتح كاميرا أو مايك')}
                  </p>
                  <p className="max-w-[16rem] text-sm leading-relaxed text-[#F1E3D3]">
                    {camOff ? t('Turn it on with the button below whenever you like.', 'افتحها من الزرار اللي تحت وقت ما تحب.')
                      : cam === 'denied' ? t('Two steps and it works. You can still join with your voice.', 'خطوتين وتشتغل. وتقدر تدخل بصوتك برضه.')
                        : hasMic ? t('Another app may be using it. You can join with your voice.', 'ممكن برنامج تاني شغّالها. تقدر تدخل بصوتك.')
                          : t('Try another browser, or join to listen.', 'جرّب متصفح تاني، أو ادخل واسمع.')}
                  </p>
                </div>
              )}
            </div>
          )}
          {(hasVideo || hasMic) && (
            <div className="absolute inset-x-0 bottom-3 z-[2] flex justify-center gap-3 sm:bottom-5">
              {hasMic && (
                <button type="button" onClick={() => setMicOff((v) => !v)} aria-pressed={micOff}
                  aria-label={micOff ? t('Turn mic on', 'افتح المايك') : t('Mute', 'اقفل المايك')}
                  className={cn('room-press grid h-12 w-12 place-items-center rounded-full ring-1 focus-ring backdrop-blur-md', micOff ? 'bg-[#FAF7F2] text-[#C51F24] ring-transparent' : 'face-scrim ring-white/15 hover:bg-[rgba(17,15,14,0.78)]')}>
                  {micOff ? <MicOff className="h-5 w-5" aria-hidden="true" /> : <Mic className="h-5 w-5" aria-hidden="true" />}
                </button>
              )}
              {hasVideo && (
                <button type="button" onClick={() => setCamOff((v) => !v)} aria-pressed={camOff}
                  aria-label={camOff ? t('Turn camera on', 'افتح الكاميرا') : t('Turn camera off', 'اقفل الكاميرا')}
                  className={cn('room-press grid h-12 w-12 place-items-center rounded-full ring-1 focus-ring backdrop-blur-md', camOff ? 'bg-[#FAF7F2] text-[#C51F24] ring-transparent' : 'face-scrim ring-white/15 hover:bg-[rgba(17,15,14,0.78)]')}>
                  {camOff ? <VideoOff className="h-5 w-5" aria-hidden="true" /> : <Video className="h-5 w-5" aria-hidden="true" />}
                </button>
              )}
            </div>
          )}
        </div>
        {hasMic && (
          <div className="flex items-center justify-center gap-3 px-2" aria-label={t('Microphone level', 'مستوى صوت المايك')}>
            <span ref={barsRef} aria-hidden="true" className="flex h-6 items-center gap-1">
              {BARS.map((_, i) => <span key={i} className={cn('block h-6 w-1.5 origin-center rounded-full', micOff ? 'bg-sand-border' : 'bg-teal')} style={{ transform: 'scaleY(0.12)' }} />)}
            </span>
            <span className="text-sm text-muted-foreground">
              {micOff ? t('Your mic is off.', 'المايك مقفول.') : t('Say salam. The bars should move.', 'قول السلام عليكم، والخطوط هتتحرك.')}
            </span>
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

  // Readiness: iOS grouped rows, brand tints only (teal, copper, gold, sand; crimson marks a problem).
  type Row = { key: string; icon: React.ReactNode; tint: string; title: string; sub: string; end?: React.ReactNode; onClick?: () => void };
  const ok = (text: string) => <span className="font-bold text-teal">{text}</span>;
  const bad = (text: string) => <span className="font-bold text-crimson">{text}</span>;
  const pill = (text: string, fix = false) => (
    <span className={cn('inline-flex h-8 items-center rounded-[var(--r-pill)] px-3 text-[0.82rem] font-semibold', fix ? 'bg-crimson/10 text-crimson ring-1 ring-crimson/30' : 'bg-surface-subtle text-foreground ring-1 ring-border')}>{text}</span>
  );
  const chevron = <ChevronLeft className={cn('h-4 w-4 text-muted-foreground', !isAr && 'rotate-180')} aria-hidden="true" />;
  const toDevices = () => setPage('devices');
  const rows: Row[] = [
    cam === 'denied'
      ? { key: 'cam', icon: <VideoOff className="h-4 w-4" />, tint: 'bg-crimson', title: t('Camera', 'الكاميرا'), sub: t('Your browser is blocking it', 'المتصفح مانعها'), end: pill(t('Allow it', 'اسمح بيها'), true), onClick: () => setPage('fix') }
      : !hasVideo
        ? { key: 'cam', icon: <VideoOff className="h-4 w-4" />, tint: 'bg-[var(--gold-deep)]', title: t('Camera', 'الكاميرا'), sub: loading ? t('Opening…', 'بنفتحها…') : t('No camera found. You can join by voice', 'مفيش كاميرا. تقدر تدخل بصوتك'), end: chevron, onClick: toDevices }
        : { key: 'cam', icon: camOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />, tint: 'bg-teal', title: t('Camera', 'الكاميرا'),
            sub: camOff ? t('Off. Turn it on whenever you like', 'مقفولة. افتحها وقت ما تحب') : height != null && !passed720 && !kid ? t('A bit blurry: face a window', 'مش واضحة أوي: اقعد قصاد شباك') : t('Clear', 'واضحة'),
            end: <>{!camOff && ok(t('Ready', 'جاهزة'))}{chevron}</>, onClick: toDevices },
    mic === 'denied'
      ? { key: 'mic', icon: <MicOff className="h-4 w-4" />, tint: 'bg-crimson', title: t('Mic', 'المايك'), sub: t('Your browser is blocking it', 'المتصفح مانعه'), end: pill(t('Allow it', 'اسمح بيه'), true), onClick: () => setPage('fix') }
      : { key: 'mic', icon: micOff || !hasMic ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />, tint: 'bg-[var(--copper)]', title: t('Mic', 'المايك'),
          sub: !hasMic ? (loading ? t('Opening…', 'بنفتحه…') : t('No mic found', 'مفيش مايك')) : micOff ? t("Off. You'll join muted", 'مقفول. هتدخل وانت صامت') : micName,
          end: <>{hasMic && !micOff && (heard ? ok(t('Heard you', 'سمعناك')) : <span>{t('Say something', 'اتكلم')}</span>)}{chevron}</>, onClick: toDevices },
    { key: 'spk', icon: <Volume2 className="h-4 w-4" />, tint: 'bg-[var(--gold-deep)]', title: t('Speaker', 'السماعة'), sub: speakerName,
      end: speakerTested ? <>{ok(t('Played', 'اشتغلت'))}{pill(t('Again', 'تاني'))}</> : pill(t('Test', 'جرّب')), onClick: testSpeaker },
    { key: 'net', icon: <Wifi className="h-4 w-4" />, tint: net?.network === 'poor' ? 'bg-crimson' : 'bg-[color:var(--muted-foreground)]', title: t('Internet', 'النت'),
      sub: !net ? t('Testing…', 'بنختبر…')
        : net.network === 'poor' ? t('Sit closer to the router. The lesson keeps your voice first', 'اقعد قريب من الراوتر. الحصة بتحافظ على الصوت الأول')
          : net.network === 'unknown' ? t('We could not test it. You can still join', 'ما قدرناش نختبره. تقدر تدخل عادي')
            : `${net.latencyMs != null ? `${net.latencyMs} ms` : '–'} · ${net.downKbps != null ? `${(net.downKbps / 1000).toFixed(1)} Mbps` : '–'}`,
      end: !net ? undefined : net.network === 'good' ? ok(t('Good', 'كويس')) : net.network === 'fair' ? ok(t('OK', 'مقبول')) : net.network === 'poor' ? bad(t('Weak', 'ضعيف')) : pill(t('Test again', 'اختبر تاني')),
      onClick: net ? () => setNetRun((n) => n + 1) : undefined },
  ];

  const rowClass = 'flex min-h-14 w-full items-center gap-3 px-3.5 py-2.5 text-start text-[0.95rem] text-foreground';
  const back = (title: string) => (
    <div className="flex items-center gap-2 pb-3">
      <button type="button" onClick={() => setPage('main')} className="room-press inline-flex min-h-11 items-center gap-1 rounded-[var(--r-pill)] px-3 text-sm font-semibold text-foreground ring-1 ring-border focus-ring">
        <ChevronLeft className={cn('h-4 w-4', isAr && 'rotate-180')} aria-hidden="true" />{t('Back', 'رجوع')}
      </button>
      <h2 className="text-[0.95rem] font-bold">{title}</h2>
    </div>
  );

  const mainPage = (
    <div className="grid gap-3">
      <p className="px-1.5 text-[0.82rem] text-muted-foreground">{t('Your setup', 'جاهزيتك')}</p>
      <div className="wait-rows">
        {rows.map((r) => {
          const inner = (
            <>
              <span className={cn('wait-tint', r.tint)} aria-hidden="true">{r.icon}</span>
              <span className="grid min-w-0 gap-0.5"><span>{r.title}</span><span className="text-[0.8rem] leading-snug text-muted-foreground">{r.sub}</span></span>
              <span className="ms-auto flex shrink-0 items-center gap-1.5 text-[0.85rem] text-muted-foreground">{r.end}</span>
            </>
          );
          return r.onClick
            ? <button key={r.key} type="button" onClick={r.onClick} className={cn(rowClass, 'transition-colors hover:bg-surface-subtle focus-ring')}>{inner}</button>
            : <div key={r.key} className={rowClass}>{inner}</div>;
        })}
      </div>
      {teacher && (
        <div className="wait-rows">
          <div className={rowClass}>
            <span className="wait-tint bg-accent" aria-hidden="true"><BookOpen className="h-4 w-4" /></span>
            <span className="grid min-w-0 flex-1 gap-0.5">
              <Switch checked={recitation} onChange={setRecitation}
                hint={t('Keeps the full voice for Quran recitation. Turn it off for normal talk.', 'بيحافظ على الصوت كامل وقت التلاوة. اقفله في الكلام العادي.')}>
                {t('Recitation mode', 'وضع التلاوة')}
              </Switch>
            </span>
          </div>
          <div className={rowClass}>
            <span className="wait-tint bg-[color:var(--muted-foreground)]" aria-hidden="true"><Headphones className="h-4 w-4" /></span>
            <span className="grid min-w-0 gap-0.5"><span>{t('Wear your headset', 'البس السماعة')}</span><span className="text-[0.8rem] leading-snug text-muted-foreground">{t('It stops echo, and you hear every letter clearly.', 'بتمنع الصدى، وبتخليك تسمع كل حرف بوضوح.')}</span></span>
          </div>
        </div>
      )}
    </div>
  );

  const devicesPage = (
    <div className="room-push">
      {back(t('Devices', 'الأجهزة'))}
      <div className="grid gap-3 rounded-[1.1rem] bg-surface p-4 shadow-[var(--shadow-1)] ring-1 ring-border-subtle">
        {cams.length > 0 && (
          <Picker icon={<Video className="h-4 w-4" />} label={t('Camera', 'الكاميرا')} value={cameraId} onChange={setCameraId}
            options={cams.map((d, i) => [d.deviceId, label(d, i, t('Camera', 'كاميرا'))])} defaultLabel={t('Default camera', 'الكاميرا الأساسية')} />
        )}
        {mics.length > 0 && (
          <Picker icon={<Mic className="h-4 w-4" />} label={t('Microphone', 'المايك')} value={micId} onChange={setMicId}
            options={mics.map((d, i) => [d.deviceId, label(d, i, t('Microphone', 'مايك'))])} defaultLabel={t('Default microphone', 'المايك الأساسي')} />
        )}
        {canPickSpeaker && speakers.length > 1 && (
          <Picker icon={<Volume2 className="h-4 w-4" />} label={t('Speaker', 'السماعة')} value={speakerId} onChange={setSpeakerId}
            options={speakers.map((d, i) => [d.deviceId, label(d, i, t('Speaker', 'سماعة'))])} defaultLabel={t('Default speaker', 'السماعة الأساسية')} />
        )}
        {!cams.length && !mics.length && <p className="text-sm text-muted-foreground">{t('No camera or mic found on this device.', 'ملقيناش كاميرا أو مايك على الجهاز ده.')}</p>}
        <button type="button" onClick={testSpeaker} className="room-press inline-flex min-h-11 items-center gap-2 justify-self-start rounded-[var(--r-pill)] px-1 text-sm font-medium text-teal focus-ring">
          <Volume2 className="h-4 w-4" aria-hidden="true" />{t('Play a test sound', 'شغّل صوت تجربة')}
        </button>
        {net && (
          <p dir="ltr" className="border-t border-border-subtle pt-3 text-sm tabular-nums text-muted-foreground">
            {net.latencyMs != null ? `${net.latencyMs} ms` : '–'} · {net.downKbps != null ? `${(net.downKbps / 1000).toFixed(1)} Mbps` : '–'} · {t('relay', 'السيرفر الاحتياطي')} {net.relay === 'ok' ? '✓' : net.relay === 'failed' ? '✗' : '–'}
          </p>
        )}
        {kid && <p className="text-sm leading-relaxed text-muted-foreground">{t('For grown-ups: if the picture or sound is missing, check the browser lets this page use the camera and mic, then pick them here.', 'لولي الأمر: لو الصورة أو الصوت مش شغّالين، اتأكد إن المتصفح سامح للصفحة بالكاميرا والمايك، واختارهم من هنا.')}</p>}
      </div>
    </div>
  );

  const fixPage = (
    <div className="room-push grid gap-3">
      {back(cam === 'denied' && mic === 'denied' ? t('Allow the camera and mic', 'نسمح بالكاميرا والمايك') : cam === 'denied' ? t("Let's turn the camera on", 'نفتح الكاميرا') : t("Let's turn the mic on", 'نفتح المايك'))}
      <ol className="wait-rows py-1">
        {permissionSteps(who, t).map((step, i) => (
          <li key={step} className={cn(rowClass, 'min-h-12 text-[0.92rem] leading-relaxed')}>
            <span className="wait-tint bg-[var(--gold-deep)] text-[0.8rem] font-bold" aria-hidden="true">{i + 1}</span>{step}
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => { setPage('main'); setAttempt((n) => n + 1); }}>
          <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />{t('Try again', 'جرّب تاني')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setPage('main')}>{t("I'll join by voice", 'هدخل بصوتي')}</Button>
      </div>
    </div>
  );

  const presence = (
    <p className={cn('inline-flex min-h-11 items-center gap-2.5 justify-self-start rounded-[var(--r-pill)] px-4 text-sm font-medium', info.here ? 'bg-teal/10 text-teal' : 'bg-sand-light text-muted-foreground ring-1 ring-sand-border')}>
      <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', info.here ? 'wait-ping bg-teal' : 'bg-muted-foreground')} aria-hidden="true" />
      {info.here ?? (teacher ? t("Your student hasn't joined yet", 'الطالب لسه ما دخلش') : t("Your teacher hasn't joined yet", 'المعلم لسه ما دخلش'))}
    </p>
  );

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-5 px-4 pt-6 sm:pt-10 lg:min-h-full lg:content-center lg:grid-cols-[25rem_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-20 lg:gap-y-6 lg:pb-14 lg:pt-16">
      <header className="grid justify-items-start gap-2 lg:col-start-2 lg:row-start-1 lg:self-end">
        <p className="inline-flex items-center gap-2 text-[0.85rem] font-bold text-accent"><Khatam size={18} />{t('Waiting room', 'غرفة الانتظار')}</p>
        <h1 className={cn(heading, 'text-ribbon')}>{info.title}</h1>
        <p className="text-[0.95rem] text-muted-foreground">{info.when}</p>
        {kid && <p className="text-base text-foreground">{t('Ready? Your teacher can see you when you join.', 'جاهز؟ معلمك هيشوفك أول ما تدخل.')}</p>}
        <div className="mt-1">{presence}</div>
      </header>

      <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1 lg:self-center">{preview}</div>

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

        <div className="glass-2 rounded-[1.6rem] p-3" aria-live="polite">
          {page === 'devices' ? devicesPage : page === 'fix' && blocked ? fixPage : mainPage}
        </div>

        <div className="sticky bottom-0 -mx-4 grid gap-2 bg-[linear-gradient(to_top,var(--background)_70%,transparent)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-6 lg:static lg:mx-0 lg:bg-none lg:p-0">
          <Button size="lg" onClick={join} isLoading={loading} disabled={loading} className="w-full">
            {teacher ? t('Start the lesson', 'ابدأ الحصة') : !hasVideo && hasMic ? t('Join with your voice', 'ادخل بصوتك') : t('Join the lesson', 'ادخل الحصة')}
          </Button>
          <p className="hidden text-center text-[0.82rem] text-muted-foreground lg:block">{t('You can change any of this in the lesson, under More.', 'تقدر تغيّر أي حاجة دي جوه الحصة من «المزيد».')}</p>
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
