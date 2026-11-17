import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Headphones, Info, Mic, Video, VideoOff, Volume2 } from 'lucide-react';
import { useT } from '../lib/language';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Switch } from '../components/ui/Switch';

type RoomRole = 'teacher' | 'learner' | 'guardian_observer' | 'admin_observer';
type Problem = 'denied' | 'no_camera' | 'no_devices' | 'other' | null;
export type WaitingRoomReady = { recitationMode: boolean; speakerId?: string };

// Same values as the engine's audioConstraints (Task 5); recitation keeps the full voice, so no noise suppression.
const audioFor = (recitation: boolean, deviceId?: string): MediaTrackConstraints => ({
  echoCancellation: true, autoGainControl: true, noiseSuppression: !recitation, ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
});
const videoFor = (deviceId?: string): MediaTrackConstraints => ({
  width: { ideal: 1280 }, height: { ideal: 720 }, ...(deviceId ? { deviceId: { exact: deviceId } } : {}),
});
const canPickSpeaker = typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
const isObserver = (r: RoomRole) => r === 'guardian_observer' || r === 'admin_observer';

/**
 * Classroom Task 6: the waiting room. Camera preview, live mic meter, device pickers and the 720p check.
 * Nothing here blocks entry: a weak camera gets advice, a missing one still lets the person join by voice.
 */
export function WaitingRoom({ role, ticket, bookingId, onReady }: {
  role: RoomRole;
  ticket: string;
  bookingId: string;
  onReady: (stream: MediaStream, opts: WaitingRoomReady) => void;
}) {
  const { t } = useT();
  const teacher = role === 'teacher';
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [problem, setProblem] = useState<Problem>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraId, setCameraId] = useState('');
  const [micId, setMicId] = useState('');
  const [speakerId, setSpeakerId] = useState('');
  const [recitation, setRecitation] = useState(false);
  const [loading, setLoading] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const meterRef = useRef<HTMLDivElement>(null);
  const handedOff = useRef(false);

  const height = stream?.getVideoTracks()[0]?.getSettings().height ?? null;
  const passed720 = height != null && height >= 720;

  const refreshDevices = useCallback(async () => {
    try { setDevices(await navigator.mediaDevices.enumerateDevices()); } catch { /* not supported */ }
  }, []);

  // (Re)open the camera and mic whenever a picker changes. Recitation mode is applied by the room, not here.
  useEffect(() => {
    if (isObserver(role)) { setLoading(false); return; }
    let cancelled = false;
    let opened: MediaStream | null = null;
    (async () => {
      setLoading(true);
      if (!navigator.mediaDevices?.getUserMedia) { setProblem('other'); setLoading(false); return; }
      try {
        opened = await navigator.mediaDevices.getUserMedia({ video: videoFor(cameraId), audio: audioFor(false, micId) });
        setProblem(null);
      } catch (err: any) {
        const name = err?.name;
        if (name === 'NotAllowedError' || name === 'SecurityError') { if (!cancelled) setProblem('denied'); }
        else {
          // No camera (or it is busy in another app): carry on with the mic alone.
          try { opened = await navigator.mediaDevices.getUserMedia({ audio: audioFor(false, micId) }); if (!cancelled) setProblem('no_camera'); }
          catch (e: any) { if (!cancelled) setProblem(e?.name === 'NotAllowedError' ? 'denied' : 'no_devices'); }
        }
      }
      if (cancelled) { opened?.getTracks().forEach((tr) => tr.stop()); return; }
      setStream(opened);
      setLoading(false);
      refreshDevices();
    })();
    return () => {
      cancelled = true;
      if (!handedOff.current) opened?.getTracks().forEach((tr) => tr.stop());
    };
  }, [role, cameraId, micId, refreshDevices]);

  useEffect(() => {
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
  }, [refreshDevices]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);

  // Live mic level: an AnalyserNode drives the bar's width straight on the DOM (no re-render per frame).
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
    // Reduced motion: the bar still shows the level, but updates five times a second instead of every frame.
    const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const tick = (ts: number) => {
      raf = requestAnimationFrame(tick);
      if (calm && ts - last < 200) return;
      last = ts;
      analyser.getByteTimeDomainData(buf);
      let sum = 0;
      for (const v of buf) sum += ((v - 128) / 128) ** 2;
      const level = Math.min(1, Math.sqrt(sum / buf.length) * 4);
      if (meterRef.current) meterRef.current.style.transform = `scaleX(${level.toFixed(3)})`;
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
  };

  const join = () => {
    const s = stream ?? new MediaStream();
    if (!isObserver(role)) {
      // Best effort: the quality record must never hold up the lesson.
      fetch(`/api/classroom/${bookingId}/precheck`, {
        method: 'POST',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
        body: JSON.stringify({ precheck720: passed720, startHeight: height }),
      }).catch(() => {});
    }
    handedOff.current = true;
    onReady(s, { recitationMode: teacher && recitation, ...(speakerId ? { speakerId } : {}) });
  };

  if (isObserver(role)) {
    return (
      <Card className="mx-auto w-full max-w-md p-5 sm:p-6 grid gap-4 text-center">
        <p className="text-base font-semibold text-foreground">{t('You will join quietly', 'هتدخل بهدوء')}</p>
        <p className="text-sm text-muted-foreground">
          {t('Your camera and mic stay off. You can watch and listen only.', 'الكاميرا والمايك هيفضلوا مقفولين. هتتفرج وتسمع بس.')}
        </p>
        <Button onClick={join}>{t('Join', 'ادخل')}</Button>
      </Card>
    );
  }

  const cams = devices.filter((d) => d.kind === 'videoinput' && d.deviceId);
  const mics = devices.filter((d) => d.kind === 'audioinput' && d.deviceId);
  const speakers = devices.filter((d) => d.kind === 'audiooutput' && d.deviceId);
  const label = (d: MediaDeviceInfo, i: number, fallback: string) => d.label || `${fallback} ${i + 1}`;
  const hasVideo = !!stream?.getVideoTracks().length;

  return (
    <Card className="mx-auto w-full max-w-3xl p-4 sm:p-6 grid gap-5 md:grid-cols-2">
      <div className="grid gap-3 content-start">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-muted">
          {hasVideo ? (
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover -scale-x-100" />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
              <VideoOff className="h-8 w-8" aria-hidden="true" />
              <span className="text-sm">{loading ? t('Opening your camera…', 'بنفتح الكاميرا…') : t('No camera', 'مفيش كاميرا')}</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2" aria-label={t('Microphone level', 'مستوى صوت المايك')}>
          <Mic className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-border">
            <div ref={meterRef} className="h-full w-full origin-left rtl:origin-right rounded-full bg-teal" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('Say something. The bar should move.', 'قول أي كلمة، والشريط لازم يتحرك.')}</p>
      </div>

      <div className="grid gap-4 content-start">
        {problem === 'denied' && (
          <Notice tone="error">
            {t(
              'Your browser is blocking the camera and mic. Click the lock icon next to the address, allow both, then reload this page.',
              'المتصفح مانع الكاميرا والمايك. دوس على علامة القفل جنب العنوان، واسمح بالاتنين، وبعدين اعمل تحديث للصفحة.',
            )}
          </Notice>
        )}
        {problem === 'no_camera' && (
          <Notice tone="warn">
            {t('We could not find a camera, or another app is using it. You can still join with your voice.', 'ملقيناش كاميرا، أو في برنامج تاني شغّالها. تقدر تدخل بصوتك عادي.')}
          </Notice>
        )}
        {(problem === 'no_devices' || problem === 'other') && (
          <Notice tone="error">
            {t('We could not open a camera or mic on this device. Try another browser or device, or join and listen.', 'مقدرناش نفتح كاميرا أو مايك على الجهاز ده. جرّب متصفح أو جهاز تاني، أو ادخل واسمع.')}
          </Notice>
        )}

        {hasVideo && (passed720 ? (
          <p className="flex items-center gap-2 text-sm text-teal">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            {t('Your camera is ready in HD (720p).', 'الكاميرا جاهزة بجودة عالية (720p).')}
          </p>
        ) : (
          <Notice tone="warn">
            {t(
              `Your camera is sending ${height ?? '?'}p. Lessons look best at 720p. Try closing other apps that use the camera, sitting near light, or picking another camera. You can still join.`,
              `الكاميرا بتبعت ${height ?? '?'}p. الحصة بتبقى أوضح على 720p. جرّب تقفل البرامج التانية اللي بتستخدم الكاميرا، أو تقعد قريب من النور، أو تختار كاميرا تانية. تقدر تدخل عادي.`,
            )}
          </Notice>
        ))}

        {cams.length > 1 && (
          <Picker icon={<Video className="h-4 w-4" />} label={t('Camera', 'الكاميرا')} value={cameraId} onChange={setCameraId}
            options={cams.map((d, i) => [d.deviceId, label(d, i, t('Camera', 'كاميرا'))])} defaultLabel={t('Default camera', 'الكاميرا الأساسية')} />
        )}
        {mics.length > 1 && (
          <Picker icon={<Mic className="h-4 w-4" />} label={t('Microphone', 'المايك')} value={micId} onChange={setMicId}
            options={mics.map((d, i) => [d.deviceId, label(d, i, t('Microphone', 'مايك'))])} defaultLabel={t('Default microphone', 'المايك الأساسي')} />
        )}
        <div className="grid gap-2">
          {canPickSpeaker && speakers.length > 1 && (
            <Picker icon={<Volume2 className="h-4 w-4" />} label={t('Speaker', 'السماعة')} value={speakerId} onChange={setSpeakerId}
              options={speakers.map((d, i) => [d.deviceId, label(d, i, t('Speaker', 'سماعة'))])} defaultLabel={t('Default speaker', 'السماعة الأساسية')} />
          )}
          <Button variant="outline" size="sm" onClick={testSpeaker} className="justify-self-start">
            <Volume2 className="h-4 w-4 me-2" aria-hidden="true" />
            {t('Play a test sound', 'شغّل صوت تجربة')}
          </Button>
        </div>

        {teacher && (
          <>
            <p className="flex items-start gap-2 rounded-xl bg-sand-light p-3 text-sm text-sand-foreground">
              <Headphones className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              {t('Please wear your headset. It stops echo and lets you hear every letter clearly.', 'من فضلك البس السماعة. بتمنع الصدى وبتخليك تسمع كل حرف بوضوح.')}
            </p>
            <Switch checked={recitation} onChange={setRecitation}
              hint={t('Keeps the full voice for Quran recitation. Turn it off for normal talk.', 'بيحافظ على الصوت كامل وقت التلاوة. اقفله في الكلام العادي.')}>
              {t('Recitation mode', 'وضع التلاوة')}
            </Switch>
          </>
        )}

        <Button size="lg" onClick={join} isLoading={loading} disabled={loading}>
          {t('Join the lesson', 'ادخل الحصة')}
        </Button>
      </div>
    </Card>
  );
}

function Notice({ tone, children }: { tone: 'warn' | 'error'; children: React.ReactNode }) {
  const cls = tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-sand-light text-sand-foreground';
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`flex items-start gap-2 rounded-xl p-3 text-sm ${cls}`}>
      <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </p>
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
