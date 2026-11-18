import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Eye, FileUp, PenLine, RefreshCw, ShieldCheck } from 'lucide-react';
import { useT } from '../lib/language';
import { cn } from '../lib/utils';
import { useLessonRoom } from '../lib/lessonRoom';
import type { RoomEvent } from '../lib/roomEvents';
import { lessonEndMs } from '../lib/lessonWindow';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WaitingRoom, type WaitingRoomReady } from './WaitingRoom';
import { createEngine } from './engine/cloudflareEngine';
import { blameSide, classifyLink, createLayerPicker } from './engine/quality';
import { sideOf, type Layer, type LinkClass, type LinkStats, type MediaEngine, type Side } from './engine/types';
import { createTimelineBatcher, restoreState, type RoomSnapshot } from './timeline';
import { Board, type BoardSync } from './board/Board';
import { PdfPages } from './board/PdfPages';
import { uploadClassroomFile } from './board/upload';
import type { Portal, RoomEntry } from './ClassroomGate';
import { RemoteAudio, VideoTile, useSpeaking } from './parts/VideoTiles';
import { LayoutSwitch, Toolbar, type LayoutMode } from './parts/Toolbar';
import { Timer } from './parts/Timer';
import { REACTION_SHOW_MS, ReactionPicker, ReactionStream, type ReactionKind } from './parts/Reactions';
import { RemotePointer, usePointerSender } from './parts/Pointer';
import { LearnerFocus, TeacherFocus } from './parts/FocusNotice';
import { NetworkBadge, WeakLinkNotice } from './parts/NetworkBadge';
import { ScreenShareButton, canShareScreen } from './parts/ScreenShare';
import { LearnerCurriculum, TeacherCurriculum } from './parts/Curriculum';

type Pane = 'lesson' | 'board' | 'pdf';
type Over = 'ended' | 'closed' | 'superseded' | 'failed';
type BoardScene = NonNullable<RoomSnapshot['board']>;

const STATS_EVERY_MS = 3000;
const ANNOUNCE_EVERY_MS = 15_000;
/** The guardian's tab says "still here" with each announce; a closed tab drops the chip after this. */
const GUARDIAN_STALE_MS = 40_000;
const other = (s: Side): Side => (s === 'teacher' ? 'student' : 'teacher');
const isTyping = (el: EventTarget | null) => el instanceof HTMLElement
  && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || !!el.closest('.excalidraw'));

/**
 * Classroom Release 1, Task 9: the lesson room. Waiting room first, then video, curriculum, board and files over one
 * Cloudflare session and the NX-12 live channel. Observers watch and listen only.
 */
export default function ClassroomPage({ bookingId, portal, entry, home, onRejoin }: {
  bookingId: string;
  portal: Portal;
  entry: RoomEntry;
  home: string;
  onRejoin: () => void;
}) {
  const { t, isAr } = useT();
  const navigate = useNavigate();
  const { role, ticket } = entry;
  const isTeacher = role === 'teacher';
  const observer = role === 'guardian_observer' || role === 'admin_observer';
  const mySide = sideOf(role);
  const watchSides: Side[] = mySide ? [other(mySide)] : ['teacher', 'student'];
  const teacherName = t('Teacher', 'المعلم');
  const learnerName = entry.learnerName || t('Learner', 'الطالب');
  const nameOf = (s: Side) => (s === 'teacher' ? teacherName : learnerName);

  const room = useLessonRoom(entry.roomKey, isTeacher ? 'teacher' : 'learner');
  const { publishEvent, onEvent } = room;

  const [phase, setPhase] = useState<'waiting' | 'room'>('waiting');
  const [over, setOver] = useState<Over | null>(null);
  const [local, setLocal] = useState<MediaStream | null>(null);
  const [ready, setReady] = useState<WaitingRoomReady | null>(null);
  const [joined, setJoined] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [remotes, setRemotes] = useState<Record<Side, MediaStream | null>>({ teacher: null, student: null });
  const [remoteScreen, setRemoteScreen] = useState<MediaStream | null>(null);
  const [links, setLinks] = useState<Record<Side, LinkClass | null>>({ teacher: null, student: null });
  const [myLayer, setMyLayer] = useState<Layer>('h');
  const [blame, setBlame] = useState<'me' | 'them' | 'unknown'>('unknown');
  const [layout, setLayout] = useState<LayoutMode>('conversation');
  const [pane, setPane] = useState<Pane>('lesson');
  const [recitation, setRecitation] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [awayAt, setAwayAt] = useState<number | null>(null);
  const [warningOff, setWarningOff] = useState(false);
  const [guardianSeen, setGuardianSeen] = useState(0);
  const [reactions, setReactions] = useState<Array<{ id: number; kind: ReactionKind }>>([]);
  const [pointer, setPointer] = useState<{ x: number; y: number; at: number } | null>(null);
  const [pdf, setPdf] = useState<{ fileId: string; page: number; url: string | null } | null>(null);
  const [restored, setRestored] = useState<RoomSnapshot | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const engineRef = useRef<MediaEngine | null>(null);
  const batcher = useRef<ReturnType<typeof createTimelineBatcher> | null>(null);
  const subscribed = useRef<Record<Side, string>>({ teacher: '', student: '' });
  const wanted = useRef<Record<Side, string>>({ teacher: '', student: '' });
  const inFlight = useRef<Record<Side, boolean>>({ teacher: false, student: false });
  const remoteStats = useRef<LinkStats | null>(null);
  const latestBoard = useRef<BoardScene | undefined>(undefined);
  const recitationRef = useRef(false);
  const layoutBeforeShare = useRef<LayoutMode>('content');
  const reactionId = useRef(0);

  const startMs = Date.parse(entry.startsAt);
  const endMs = lessonEndMs(entry.startsAt, null, entry.durationMinutes);
  const hardCloseMs = Date.parse(entry.hardCloseAt);

  /** Live on the channel, and saved when the server keeps that type. */
  const save = useCallback((e: RoomEvent) => batcher.current?.push(e), []);
  const send = useCallback((e: RoomEvent) => { publishEvent(e); save(e); }, [publishEvent, save]);

  // ---- clock, hard close -------------------------------------------------------------------------------------
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { if (now >= hardCloseMs && !over) setOver('closed'); }, [now, hardCloseMs, over]);

  // ---- joining ----------------------------------------------------------------------------------------------
  const onReady = useCallback((stream: MediaStream, opts: WaitingRoomReady) => {
    setLocal(stream);
    setReady(opts);
    setRecitation(isTeacher && opts.recitationMode);
    recitationRef.current = isTeacher && opts.recitationMode;
    setPhase('room');
  }, [isTeacher]);

  const subscribeSide = useCallback(async (side: Side) => {
    const engine = engineRef.current;
    const sessionId = wanted.current[side];
    if (!engine || !sessionId || inFlight.current[side] || subscribed.current[side] === sessionId) return;
    inFlight.current[side] = true;
    try {
      const stream = await engine.subscribe({ sessionId, trackNames: [`${side}-audio`, `${side}-video`] });
      subscribed.current[side] = sessionId;
      setRemotes((r) => ({ ...r, [side]: stream }));
    } catch {
      // Usually "not sending yet": their next announce tries again.
    } finally {
      inFlight.current[side] = false;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'room' || !local) return;
    const engine = createEngine();
    engineRef.current = engine;
    let live = true;
    const offState = engine.on('state', (s) => {
      if (!live) return;
      setReconnecting(s === 'reconnecting');
      if (s === 'superseded') setOver('superseded');
      else if (s === 'ended') setOver('closed');
      else if (s === 'failed') setOver('failed');
    });
    if (!observer) batcher.current = createTimelineBatcher(bookingId, () => ticket);
    (async () => {
      const snap = await restoreState(bookingId, ticket);
      if (!live) return;
      if (snap) {
        const s = snap.snapshot;
        if (s.layout) setLayout(s.layout === 'screen' ? 'content' : s.layout);
        setPane(s.pdf ? 'pdf' : s.slide ? 'lesson' : s.board ? 'board' : 'lesson');
        if (s.board) latestBoard.current = s.board;
        if (s.pdf) setPdf({ ...s.pdf, url: null });
      }
      setRestored(snap?.snapshot ?? {});
      try {
        await engine.join({ bookingId, ticket, iceServers: entry.iceServers, role });
        if (!observer && local.getTracks().length) await engine.publishCamera(local);
        if (recitationRef.current) await engine.setRecitationMode(true);
        if (!live) return;
        setJoined(true);
        watchSides.forEach((s) => void subscribeSide(s));
      } catch {
        if (live && engine.state !== 'superseded' && engine.state !== 'ended') setOver('failed');
      }
    })();
    const onHide = () => { void engine.leave(); };
    window.addEventListener('pagehide', onHide);
    return () => {
      live = false;
      offState();
      window.removeEventListener('pagehide', onHide);
      if (role === 'guardian_observer') publishEvent({ t: 'observer', kind: 'guardian', present: false });
      void batcher.current?.stop(); // flushes what is left
      batcher.current = null;
      void engine.leave();
      engineRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, local]);

  // Stop the camera and mic whenever the room is over or the page goes away.
  useEffect(() => () => { local?.getTracks().forEach((tr) => tr.stop()); }, [local]);
  useEffect(() => {
    if (!over) return;
    void batcher.current?.stop();
    batcher.current = null;
    void engineRef.current?.leave();
    local?.getTracks().forEach((tr) => tr.stop());
  }, [over, local]);

  // Tell the other side (and observers) which session to pull; repeat so late joiners find us.
  useEffect(() => {
    if (!joined || !room.connected) return;
    const announce = () => {
      const id = engineRef.current?.sessionId;
      if (mySide && id) publishEvent({ t: 'session', side: mySide, sessionId: id });
      if (role === 'guardian_observer') publishEvent({ t: 'observer', kind: 'guardian', present: true });
      if (isTeacher && recitationRef.current) publishEvent({ t: 'recitation', on: true });
    };
    announce();
    const id = window.setInterval(announce, ANNOUNCE_EVERY_MS);
    return () => window.clearInterval(id);
  }, [joined, room.connected, mySide, role, isTeacher, publishEvent]);

  // ---- events from the room ----------------------------------------------------------------------------------
  const loadPdfUrl = useCallback(async (fileId: string) => {
    try {
      const res = await fetch(`/api/classroom/${encodeURIComponent(bookingId)}/files/${encodeURIComponent(fileId)}`, { headers: { 'x-room-ticket': ticket } });
      const body = await res.json().catch(() => ({}));
      if (res.ok && typeof body.url === 'string') setPdf((p) => (p && p.fileId === fileId ? { ...p, url: body.url } : p));
    } catch { /* the next pdf event retries */ }
  }, [bookingId, ticket]);

  useEffect(() => { if (pdf && !pdf.url) void loadPdfUrl(pdf.fileId); }, [pdf?.fileId, pdf?.url, loadPdfUrl]);

  useEffect(() => onEvent((e) => {
    switch (e.t) {
      case 'session': {
        if (!watchSides.includes(e.side) || wanted.current[e.side] === e.sessionId) return;
        wanted.current[e.side] = e.sessionId;
        void subscribeSide(e.side);
        // Answer a new session at once, so a rejoin does not wait for our next announce.
        const id = engineRef.current?.sessionId;
        if (mySide && id) publishEvent({ t: 'session', side: mySide, sessionId: id });
        return;
      }
      case 'quality':
        if (e.side === mySide) return;
        setLinks((l) => ({ ...l, [e.side]: e.link }));
        if (e.stats) remoteStats.current = e.stats;
        return;
      case 'board':
        latestBoard.current = { sceneVersion: e.sceneVersion, elements: e.elements, learnerDraw: e.learnerDraw ?? latestBoard.current?.learnerDraw ?? false };
        return;
      case 'reaction': {
        if (!isTeacher) return;
        const id = ++reactionId.current;
        setReactions((r) => [...r.slice(-3), { id, kind: e.kind }]);
        window.setTimeout(() => setReactions((r) => r.filter((x) => x.id !== id)), REACTION_SHOW_MS);
        return;
      }
      case 'focus':
        // The teacher's own clock times the absence: the learner's clock may be off.
        if (isTeacher) setAwayAt(e.away ? (Date.now()) : null);
        return;
      case 'focus_warning_off':
        if (!isTeacher) setWarningOff(e.off);
        return;
      case 'observer':
        if (isTeacher) setGuardianSeen(e.present ? Date.now() : 0);
        return;
      case 'layout':
        if (isTeacher) return;
        setLayout(e.mode);
        if (e.pane) setPane(e.pane);
        return;
      case 'pointer':
        if (!isTeacher) setPointer({ x: e.x, y: e.y, at: Date.now() });
        return;
      case 'pdf':
        if (isTeacher) return;
        setPdf((p) => (p?.fileId === e.fileId ? { ...p, page: e.page } : { fileId: e.fileId, page: e.page, url: null }));
        return;
      case 'recitation':
        if (!isTeacher) void engineRef.current?.setRecitationMode(e.on).catch(() => {});
        return;
      case 'end':
        if (!isTeacher) setOver('ended');
        return;
      default:
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [onEvent, subscribeSide, publishEvent, isTeacher, mySide]);

  // The teacher's shared screen: pulled while the layout is "screen".
  useEffect(() => {
    if (isTeacher || !joined) return;
    if (layout !== 'screen') { setRemoteScreen(null); return; }
    const sessionId = wanted.current.teacher;
    if (!sessionId || !engineRef.current) return;
    let live = true;
    // shortcut: tracks of an earlier share stay pulled (ended) until the teacher's session changes; fine for a lesson's few shares.
    engineRef.current.subscribe({ sessionId, trackNames: ['teacher-screen', 'teacher-screen-audio'] })
      .then((s) => live && setRemoteScreen(s), () => {});
    return () => { live = false; };
  }, [layout, joined, isTeacher, remotes.teacher]);

  // ---- link quality ------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!joined) return;
    const picker = createLayerPicker('h');
    let tick = 0;
    let lastSaved = '';
    const id = window.setInterval(async () => {
      const engine = engineRef.current;
      if (!engine) return;
      const s = await engine.getStats().catch(() => null);
      if (!s) return;
      const link = classifyLink(s);
      const layer = picker(s);
      void engine.setPreferredLayer(layer).catch(() => {});
      setMyLayer(layer);
      setBlame(blameSide(s, remoteStats.current));
      if (!mySide) return;
      setLinks((l) => (l[mySide] === link ? l : { ...l, [mySide]: link }));
      const e: RoomEvent = { t: 'quality', side: mySide, layer, link, stats: s };
      if (++tick % 2 === 0) publishEvent(e);
      // Saved only when it changes: the quality record needs the moments, not every reading.
      if (`${link}:${layer}` !== lastSaved) { lastSaved = `${link}:${layer}`; save(e); }
    }, STATS_EVERY_MS);
    return () => window.clearInterval(id);
  }, [joined, mySide, publishEvent, save]);

  // ---- controls ---------------------------------------------------------------------------------------------
  const toggleMute = useCallback(() => {
    const track = local?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setMuted(!track.enabled);
  }, [local]);
  const toggleCamera = () => {
    const track = local?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setCameraOff(!track.enabled);
  };
  const toggleRecitation = () => {
    const on = !recitationRef.current;
    recitationRef.current = on;
    setRecitation(on);
    void engineRef.current?.setRecitationMode(on).catch(() => {});
    publishEvent({ t: 'recitation', on });
  };
  const changeLayout = useCallback((mode: LayoutMode, nextPane: Pane = pane) => {
    setLayout(mode);
    setPane(nextPane);
    send({ t: 'layout', mode, ...(mode === 'content' ? { pane: nextPane } : {}) });
  }, [pane, send]);

  const startShare = async (stream: MediaStream) => {
    if (!engineRef.current) throw new Error('not joined');
    await engineRef.current.publishScreen(stream);
    setSharing(true);
    layoutBeforeShare.current = layout === 'screen' ? 'content' : layout;
    changeLayout('screen');
  };
  const stopShare = useCallback(() => {
    setSharing(false);
    void engineRef.current?.stopScreen().catch(() => {});
    changeLayout(layoutBeforeShare.current);
  }, [changeLayout]);

  // Keys: M mutes (everyone who speaks); 1, 2, 3 switch layouts (teacher). Never while typing or drawing.
  useEffect(() => {
    if (phase !== 'room') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      if ((e.key === 'm' || e.key === 'M') && !observer) { e.preventDefault(); toggleMute(); }
      if (!isTeacher) return;
      const mode = ({ 1: 'conversation', 2: 'content', 3: 'screen' } as Record<string, LayoutMode>)[e.key];
      if (mode && (mode !== 'screen' || sharing)) changeLayout(mode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, observer, isTeacher, sharing, toggleMute, changeLayout]);

  const endLesson = async () => {
    send({ t: 'end' });
    await batcher.current?.stop();
    batcher.current = null;
    await engineRef.current?.leave();
    local?.getTracks().forEach((tr) => tr.stop());
    navigate(home); // Today shows the after-lesson report for this lesson
  };
  const leave = () => {
    local?.getTracks().forEach((tr) => tr.stop());
    navigate(home);
  };

  const onUpload = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadError('');
    try {
      const { fileId, url } = await uploadClassroomFile(bookingId, ticket, file);
      setPdf({ fileId, page: 1, url });
      send({ t: 'pdf', fileId, page: 1 });
      changeLayout('content', 'pdf');
    } catch (e: any) {
      setUploadError(e?.message || t('The file could not be added.', 'الملف ما اتضافش.'));
    } finally {
      setUploading(false);
    }
  };

  // ---- speaking rings and the muted hint ---------------------------------------------------------------------
  const micTrack = local?.getAudioTracks()[0];
  // A clone keeps hearing the mic while the real track is muted, for "you're talking while muted".
  const micClone = useMemo(() => micTrack?.clone() ?? null, [micTrack]);
  useEffect(() => () => micClone?.stop(), [micClone]);
  const selfSpeaking = useSpeaking(phase === 'room' && !muted ? micTrack : null);
  const talkingMuted = useSpeaking(phase === 'room' && muted ? micClone : null, 0.08);
  const teacherSpeaking = useSpeaking(remotes.teacher?.getAudioTracks()[0]);
  const studentSpeaking = useSpeaking(remotes.student?.getAudioTracks()[0]);
  const speakingOf = (s: Side) => (s === 'teacher' ? teacherSpeaking : studentSpeaking);

  const board = useMemo<BoardSync>(() => ({
    publishEvent: (e) => { if (e.t === 'board') latestBoard.current = { sceneVersion: e.sceneVersion, elements: e.elements, learnerDraw: e.learnerDraw ?? false }; publishEvent(e); },
    onEvent,
    save,
    get initial() { return latestBoard.current; },
  }), [publishEvent, onEvent, save]);
  const sendPointer = usePointerSender(publishEvent);

  // ---- over -----------------------------------------------------------------------------------------------------
  if (over) {
    const copy: Record<Over, { title: string; body: string }> = {
      ended: { title: t('The lesson has ended', 'الحصة خلصت'), body: t('Well done today. See you next lesson.', 'برافو عليك النهارده. نشوفك الحصة الجاية.') },
      closed: { title: t('The room has closed', 'الغرفة اتقفلت'), body: t('The lesson time is over, so the room closed for everyone.', 'وقت الحصة خلص، فالغرفة اتقفلت للكل.') },
      superseded: { title: t('The lesson is open somewhere else', 'الحصة مفتوحة في مكان تاني'), body: t('You joined from another tab or device, so it stopped here.', 'دخلت من تاب أو جهاز تاني، فوقفت هنا.') },
      failed: { title: t('We lost the connection to the room', 'الاتصال بالغرفة اتقطع'), body: t('Check your internet, then try again. The lesson, the board and the time come back as they were.', 'اتأكد من النت وجرّب تاني. الدرس والسبورة والوقت هيرجعوا زي ما كانوا.') },
    };
    const again = over === 'superseded' || over === 'failed';
    return (
      <Shell>
        <div className="grid min-h-full place-items-center p-4">
          <div className="glass-2 arch-top grid w-full max-w-md justify-items-center gap-4 px-6 pb-8 pt-16 text-center">
            <h1 className={cn('font-editorial text-2xl text-foreground', isAr ? 'font-bold' : 'font-medium tracking-tight')}>{copy[over].title}</h1>
            <p className="text-sm text-muted-foreground">{copy[over].body}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {again && <Button onClick={onRejoin}><RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />{over === 'superseded' ? t('Use this device', 'كمّل من هنا') : t('Try again', 'جرّب تاني')}</Button>}
              <Link to={home} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-teal underline underline-offset-4 focus-ring">{isTeacher ? t('Back to today', 'رجوع للنهارده') : t('My lessons', 'حصصي')}</Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- waiting room -----------------------------------------------------------------------------------------
  if (phase === 'waiting') {
    return (
      <Shell>
        <div className="mx-auto grid w-full max-w-3xl gap-4 px-4 py-6 sm:py-10">
          <header className="grid gap-1">
            <h1 className={cn('font-editorial text-2xl text-foreground sm:text-3xl', isAr ? 'font-bold' : 'font-medium tracking-tight')}>
              {isTeacher ? t(`Lesson with ${learnerName}`, `حصة ${learnerName}`) : observer ? t('Watch the lesson', 'متابعة الحصة') : t('Your lesson', 'حصتك')}
            </h1>
            <p className="text-sm text-muted-foreground">{t('Check your camera and sound, then join.', 'اتأكد من الكاميرا والصوت، وبعدين ادخل.')}</p>
          </header>
          <WaitingRoom role={role} ticket={ticket} bookingId={bookingId} onReady={onReady} />
        </div>
      </Shell>
    );
  }

  // ---- the room ---------------------------------------------------------------------------------------------
  const guardianHere = guardianSeen > 0 && now - guardianSeen < GUARDIAN_STALE_MS;
  const audioOnly = myLayer === 'audio_only';
  const hasCamera = !!local?.getVideoTracks().length;
  const tapLabel = isTeacher ? t('the learner', 'الطالب') : observer ? t('the lesson', 'الحصة') : t('your teacher', 'المعلم');
  const shareSupported = canShareScreen();
  const contentBox = layout !== 'conversation';

  const remoteTile = (s: Side, compact = false, className?: string) => (
    <VideoTile key={s} stream={remotes[s]} name={nameOf(s)} speaking={speakingOf(s)} link={links[s]} compact={compact} className={className}
      note={!remotes[s] ? (s === 'teacher' ? t('Waiting for your teacher…', 'مستنيين المعلم…') : t(`Waiting for ${learnerName}…`, `مستنيين ${learnerName}…`))
        : audioOnly ? t('Video paused to keep the sound clear', 'الفيديو واقف علشان الصوت يفضل واضح') : undefined} />
  );
  const selfTile = (compact = false, className?: string) => !observer && (
    <VideoTile stream={local} name={t('You', 'إنت')} self speaking={selfSpeaking} micOff={muted} videoOff={cameraOff} link={mySide ? links[mySide] : null} compact={compact} className={className} />
  );

  const content = (
    <div className="relative h-full min-h-0" onPointerMove={isTeacher && contentBox ? sendPointer : undefined}>
      {layout === 'screen' ? (
        <div className="grid h-full place-items-center overflow-hidden rounded-[var(--r-3)] bg-[#1C1411]">
          {isTeacher ? (
            <p className="p-6 text-center text-sm text-[#D8C6AE]">{t('Your screen is being shared.', 'شاشتك متشاركة دلوقتي.')}</p>
          ) : (
            <VideoTile stream={remoteScreen} name={t('Shared screen', 'الشاشة المشتركة')} className="h-full w-full" note={remoteScreen ? undefined : t('Opening the shared screen…', 'بنفتح الشاشة المشتركة…')} />
          )}
        </div>
      ) : pane === 'lesson' ? (
        isTeacher
          ? restored && <TeacherCurriculum initial={restored.slide} publish={room.publish} publishInk={room.publishInk} save={(s) => save({ t: 'slide', state: s })} />
          : <LearnerCurriculum state={room.state} ink={room.ink} />
      ) : pane === 'board' ? (
        <div className="h-full overflow-hidden rounded-[var(--r-3)] border border-border bg-surface">
          {restored && <Board role={role} sync={board} />}
        </div>
      ) : (
        <div className="h-full overflow-hidden rounded-[var(--r-3)] border border-border bg-surface">
          {pdf?.url ? (
            /\.pdf$/i.test(pdf.fileId) ? (
              <PdfPages fileUrl={pdf.url} page={pdf.page}
                onPage={isTeacher ? (p) => { setPdf({ ...pdf, page: p }); send({ t: 'pdf', fileId: pdf.fileId, page: p }); } : undefined}>
                {restored && <Board role={role} sync={board} transparent />}
              </PdfPages>
            ) : (
              <div className="relative h-full">
                <img src={pdf.url} alt="" className="h-full w-full object-contain" />
                <div className="absolute inset-0">{restored && <Board role={role} sync={board} transparent />}</div>
              </div>
            )
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">
              {isTeacher ? t('Add a PDF or a picture to show it here.', 'ضيف PDF أو صورة علشان تظهر هنا.') : t('Your teacher has not opened a file yet.', 'المعلم لسه ما فتحش ملف.')}
            </div>
          )}
        </div>
      )}
      {!isTeacher && contentBox && <RemotePointer point={pointer} name={teacherName} />}
    </div>
  );

  const paneTabs = isTeacher && layout === 'content' && (
    <div role="tablist" aria-label={t('What to show', 'تعرض إيه')} className="flex shrink-0 flex-wrap items-center gap-1">
      {([['lesson', BookOpen, t('Lesson', 'الدرس')], ['board', PenLine, t('Board', 'السبورة')], ['pdf', FileUp, t('File', 'ملف')]] as const).map(([p, Icon, label]) => (
        <button key={p} type="button" role="tab" aria-selected={pane === p} onClick={() => changeLayout('content', p)}
          className={cn('flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-medium focus-ring transition-colors duration-[var(--dur-ui)]',
            pane === p ? 'glass-1 text-teal' : 'text-muted-foreground hover:text-foreground')}>
          <Icon className="h-4 w-4" aria-hidden="true" />{label}
        </button>
      ))}
      {pane === 'pdf' && (
        <label className={cn('ms-auto flex min-h-11 cursor-pointer items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-medium text-teal hover:bg-surface-subtle focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]', uploading && 'pointer-events-none opacity-60')}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          {uploading ? t('Adding…', 'بنضيف…') : t('Add a PDF or picture', 'ضيف PDF أو صورة')}
          <input type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => { void onUpload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      )}
      {uploadError && <p role="alert" className="w-full text-sm text-destructive">{uploadError}</p>}
    </div>
  );

  return (
    <Shell>
      <div className="flex h-full flex-col">
        {/* Top bar: who, how the line is, the time. */}
        <header className="flex shrink-0 flex-wrap items-center gap-2 px-3 pt-3 sm:px-5">
          <h1 className={cn('me-auto min-w-0 truncate text-base text-foreground sm:text-lg', isAr ? 'font-bold' : 'font-medium tracking-tight')}>
            {isTeacher ? learnerName : observer ? t('Lesson', 'الحصة') : t('Your lesson', 'حصتك')}
          </h1>
          {isTeacher && guardianHere && <GuardianChip />}
          {role === 'admin_observer' && <Chip icon={<Eye className="h-4 w-4" aria-hidden="true" />}>{t('Watching quietly', 'متابعة بهدوء')}</Chip>}
          {role === 'guardian_observer' && <Chip icon={<Eye className="h-4 w-4" aria-hidden="true" />}>{t('Watching only. Camera and mic are off.', 'متابعة بس. الكاميرا والمايك مقفولين.')}</Chip>}
          {mySide && links[mySide] && <span className="glass-1 rounded-[var(--r-pill)] px-3 py-1.5"><NetworkBadge link={links[mySide]!} /></span>}
          <Timer startMs={startMs} endMs={endMs} now={now} teacher={isTeacher} />
        </header>

        {/* Notices, one line each, never covering the faces. */}
        <div className="pointer-events-none absolute inset-x-0 top-16 z-30 flex flex-col items-center gap-2 px-3 [&>*]:pointer-events-auto">
          {reconnecting && <p role="status" className="glass-3 rounded-[var(--r-pill)] px-4 py-2 text-sm text-foreground">{t('Reconnecting…', 'بنرجّع الاتصال…')}</p>}
          {blame !== 'unknown' && <WeakLinkNotice who={blame} teacher={isTeacher} />}
          {talkingMuted && <p role="status" className="glass-3 rounded-[var(--r-pill)] px-4 py-2 text-sm font-medium text-foreground">{t("You're talking while muted. Press M to unmute.", 'إنت بتتكلم والمايك مقفول. دوس M علشان تفتحه.')}</p>}
          {isTeacher && <TeacherFocus awayAt={awayAt} now={now} warningOff={warningOff}
            onTurnOff={() => { setWarningOff(true); publishEvent({ t: 'focus_warning_off', off: true }); }} />}
          {role === 'learner' && <LearnerFocus send={send} warningOff={warningOff} />}
        </div>

        {/* Stage */}
        <main className="relative min-h-0 flex-1 p-3 sm:p-5">
          {layout === 'conversation' ? (
            <div className="relative mx-auto grid h-full max-w-6xl place-items-center">
              {observer ? (
                <div className="grid h-full w-full content-center gap-3 sm:grid-cols-2">
                  {(['teacher', 'student'] as Side[]).map((s) => remoteTile(s, false, 'aspect-video w-full'))}
                </div>
              ) : (
                <>
                  {remoteTile(watchSides[0], false, 'h-full max-h-full w-full sm:aspect-video sm:h-auto')}
                  {selfTile(true, 'absolute bottom-3 end-3 aspect-[3/4] w-24 shadow-[var(--shadow-3)] sm:aspect-video sm:w-56')}
                </>
              )}
            </div>
          ) : (
            <div className="flex h-full min-h-0 flex-col gap-3 lg:flex-row-reverse">
              <aside className="flex shrink-0 gap-2 lg:w-64 lg:flex-col" aria-label={t('People', 'الموجودين')}>
                {watchSides.map((s) => remoteTile(s, true, 'aspect-video h-20 sm:h-28 lg:h-auto lg:w-full'))}
                {selfTile(true, 'aspect-video h-20 sm:h-28 lg:h-auto lg:w-full')}
              </aside>
              <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                {paneTabs}
                <div className="min-h-0 flex-1">{content}</div>
              </section>
            </div>
          )}
          {isTeacher && <div className="absolute bottom-4 start-4 z-20"><ReactionStream items={reactions} name={learnerName} /></div>}
        </main>

        <footer className="shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-5">
          <Toolbar observer={observer} muted={muted} cameraOff={cameraOff} hasCamera={hasCamera}
            onMute={toggleMute} onCamera={toggleCamera}
            recitation={recitation} onRecitation={isTeacher ? toggleRecitation : undefined}
            middle={(
              <>
                {isTeacher && <LayoutSwitch mode={layout} onChange={(m) => changeLayout(m)} screenAvailable={sharing} />}
                {isTeacher && shareSupported && <ScreenShareButton sharing={sharing} onStart={startShare} onStop={stopShare} />}
                {role === 'learner' && <ReactionPicker onSend={(kind) => send({ t: 'reaction', kind })} />}
              </>
            )}
            onLeave={() => (isTeacher ? setConfirmEnd(true) : leave())}
            leaveLabel={isTeacher ? t('End lesson', 'إنهاء الحصة') : t('Leave', 'خروج')}
            endsLesson={isTeacher} />
        </footer>
      </div>

      {remotes.teacher && !isTeacher && <RemoteAudio stream={remotes.teacher} speakerId={ready?.speakerId} label={tapLabel} />}
      {remotes.student && role !== 'learner' && <RemoteAudio stream={remotes.student} speakerId={ready?.speakerId} label={tapLabel} />}
      {remoteScreen?.getAudioTracks().length ? <RemoteAudio stream={remoteScreen} speakerId={ready?.speakerId} label={tapLabel} /> : null}

      <Modal isOpen={confirmEnd} onClose={() => setConfirmEnd(false)} title={t('End the lesson for everyone?', 'تنهي الحصة للكل؟')} layerClassName="z-[80]"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>{t('Keep teaching', 'كمّل الحصة')}</Button>
            <Button onClick={endLesson}>{t('End lesson', 'إنهاء الحصة')}</Button>
          </div>
        )}>
        <p className="text-sm text-muted-foreground">{t('The room closes for the learner too. Next, you write the lesson report.', 'الغرفة هتتقفل عند الطالب كمان. بعدها هتكتب تقرير الحصة.')}</p>
      </Modal>
    </Shell>
  );
}

/** The room takes the whole window, over the app's own chrome, on paper with the khatam field. */
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="khatam-field brand-lights fixed inset-0 z-[60] overflow-hidden bg-background text-foreground" data-testid="classroom">
      {children}
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <span className="glass-1 flex items-center gap-1.5 rounded-[var(--r-pill)] px-3 py-1.5 text-[0.78rem] font-medium text-foreground">{icon}{children}</span>;
}

/** Teacher only: a guardian observer is in the room (spec §4). The learner never sees it. */
function GuardianChip() {
  const { t } = useT();
  return <Chip icon={<ShieldCheck className="h-4 w-4 text-teal" aria-hidden="true" />}>{t('Guardian is watching', 'ولي الأمر بيتابع')}</Chip>;
}
