import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookMarked, BookOpen, EyeOff, FileUp, Hourglass, Mic, MicOff, MonitorX, PenLine, RefreshCw, ShieldCheck, Video, VideoOff, WifiOff } from 'lucide-react';
import { useT } from '../lib/language';
import { cn } from '../lib/utils';
import { useLessonRoom } from '../lib/lessonRoom';
import { boardSurface, type RoomEvent } from '../lib/roomEvents';
import { lessonEndMs } from '../lib/lessonWindow';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { WaitingRoom, type WaitingRoomReady } from './WaitingRoom';
import { ZadRigSvg } from '../components/zad/ZadRig';
import { createEngine } from './engine/cloudflareEngine';
import { blameSide, classifyLink, createLayerPicker } from './engine/quality';
import { sideOf, type Layer, type LinkClass, type LinkStats, type MediaEngine, type Side } from './engine/types';
import { createTimelineBatcher, restoreState, type RoomSnapshot } from './timeline';
import { Board, keepScene, type BoardSync } from './board/Board';
import { PdfPages } from './board/PdfPages';
import { uploadClassroomFile } from './board/upload';
import type { Portal, RoomEntry } from './ClassroomGate';
import { RemoteAudio, VideoTile, useSpeaking } from './parts/VideoTiles';
import { TalkRatio, useTalkTime } from './parts/TalkTime';
import { CornerPip } from './parts/CornerPip';
import { Khatam } from './parts/Khatam';
import { NoticeSlot, type RoomNotice } from './parts/NoticeSlot';
import { Toolbar, type LayoutMode } from './parts/Toolbar';
import { Timer } from './parts/Timer';
import { REACTION_SHOW_MS, ReactionStream, type ReactionKind } from './parts/Reactions';
import { RemotePointer, usePointerSender } from './parts/Pointer';
import { mmss, teacherAwayMs, useLearnerFocus } from './parts/FocusNotice';
import { NetworkBadge, weakLinkText } from './parts/NetworkBadge';
import { ScreenShareButton, canShareScreen } from './parts/ScreenShare';
import { LearnerCurriculum, TeacherCurriculum } from './parts/Curriculum';
import { FallbackNotice } from './parts/FallbackNotice';
import { ObserverNotes } from './parts/ObserverNotes';
import { createFallbackDetector, iceHistoryFor } from './engine/fallbackDetector';
import { addQualityStep, clockOffsetMs, readRoomAnswer, subscribeRetryMs, type EndReason, type QualityTotals } from './roomWiring';
import { LessonFeedbackCard } from '../student/components/LessonFeedbackCard';
import { QuranPane, lastRoomQuranPage } from './parts/QuranPane';

type Pane = 'lesson' | 'board' | 'pdf' | 'quran';
/** 4.2: lessons that get the synced mushaf (Quran tracks, Islamic studies, Fusha; a lesson without a subject too). */
const QURAN_LESSON = /quran|tajweed|hifz|memori|revision|zad|seerah|fusha|standard-arabic/i;
type Over = EndReason | 'superseded' | 'failed';
type BoardScene = NonNullable<RoomSnapshot['board']>;

const STATS_EVERY_MS = 3000;
const QUALITY_EVERY_MS = 60_000;
/** M6: how often the page asks the server whether the room is still open (and for its clock). */
const STATE_EVERY_MS = 30_000;
const ANNOUNCE_EVERY_MS = 15_000;
/** The guardian's tab says "still here" with each announce; a closed tab drops the chip after this. */
const GUARDIAN_STALE_MS = 40_000;
const other = (s: Side): Side => (s === 'teacher' ? 'student' : 'teacher');
const isTyping = (el: EventTarget | null) => el instanceof HTMLElement
  && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));

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
  const teacherName = entry.teacherName || t('Your teacher', 'معلمك');
  const learnerName = entry.learnerName || t('Learner', 'الطالب');
  const subject = entry.subjectLabel ? t(entry.subjectLabel.en, entry.subjectLabel.ar) : null;
  // Child mode (DESIGN-BRIEF 3.3): the kid app, or a child learner on the family's device.
  const kid = role === 'learner' && (portal === 'kid' || entry.learnerType === 'child');
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
  const [myLayer, setMyLayer] = useState<Layer>('b');
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
  const [quranPage, setQuranPage] = useState(() => (isTeacher ? lastRoomQuranPage(bookingId) : 1));
  const [restored, setRestored] = useState<RoomSnapshot | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [endReason, setEndReason] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  // Task 12: this side's Zoom link, only after the room failed on our side.
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  // View only: hide my own picture on my screen, observers' sound, when the other side last said it is in the room.
  const [selfHidden, setSelfHidden] = useState(false);
  const [soundOff, setSoundOff] = useState(false);
  const [otherSeen, setOtherSeen] = useState(0);
  const [reconnectedAt, setReconnectedAt] = useState(0);
  const [reconnectingSince, setReconnectingSince] = useState(0);
  // M5: server clock minus this device's clock, from /state.
  const [skew, setSkew] = useState(0);
  // H4/L3: a lost or recovered camera or mic, and which remote videos wait for media.
  const [device, setDevice] = useState<{ kind: 'audio' | 'video'; ok: boolean; at: number } | null>(null);
  const [remoteWaiting, setRemoteWaiting] = useState<Record<Side, boolean>>({ teacher: false, student: false });
  const [notesOpen, setNotesOpen] = useState(false);
  const [ending, setEnding] = useState(false);
  const [endError, setEndError] = useState('');

  const engineRef = useRef<MediaEngine | null>(null);
  const batcher = useRef<ReturnType<typeof createTimelineBatcher> | null>(null);
  const subscribed = useRef<Record<Side, string>>({ teacher: '', student: '' });
  const wanted = useRef<Record<Side, string>>({ teacher: '', student: '' });
  const inFlight = useRef<Record<Side, boolean>>({ teacher: false, student: false });
  const remoteStats = useRef<LinkStats | null>(null);
  // M4: the layer the other side last said it receives of me.
  const remoteLayer = useRef<Layer | null>(null);
  const retries = useRef<Record<Side, { n: number; timer: number | null }>>({ teacher: { n: 0, timer: null }, student: { n: 0, timer: null } });
  const detectorRef = useRef<ReturnType<typeof createFallbackDetector> | null>(null);
  const overRef = useRef<Over | null>(null);
  overRef.current = over;
  // What the teacher shows now, read by the answers to hello and new sessions (M7).
  const shown = useRef<{ layout: LayoutMode; pane: Pane; pdf: { fileId: string; page: number } | null; quran: number }>({ layout: 'conversation', pane: 'lesson', pdf: null, quran: 1 });
  shown.current = { layout, pane, pdf: pdf ? { fileId: pdf.fileId, page: pdf.page } : null, quran: quranPage };
  const heardLayout = useRef(false);
  // The latest scene of each surface ('' is the whiteboard, else boardSurface(fileId, page)) and the room's drawing switch.
  const scenes = useRef<Record<string, Omit<BoardScene, 'learnerDraw'>>>({});
  const learnerDraw = useRef(false);
  const recitationRef = useRef(false);
  const layoutBeforeShare = useRef<LayoutMode>('content');
  const reactionId = useRef(0);
  // Task 11: this side's running totals, sent every 60 s and on leave.
  const totals = useRef<QualityTotals>({ degradedSeconds: 0, audioOnlySeconds: 0, reconnects: 0, minHeight: null });
  const flushQuality = useRef<() => Promise<unknown>>(async () => {});

  const startMs = Date.parse(entry.startsAt);
  const endMs = lessonEndMs(entry.startsAt, null, entry.durationMinutes);
  const hardCloseMs = Date.parse(entry.hardCloseAt);
  const serverNow = now + skew;

  /** Live on the channel, and saved when the server keeps that type. */
  const save = useCallback((e: RoomEvent) => batcher.current?.push(e), []);
  const send = useCallback((e: RoomEvent) => { publishEvent(e); save(e); }, [publishEvent, save]);
  const keepBoard = useCallback((e: Extract<RoomEvent, { t: 'board' }>) => {
    const key = e.surface ?? '';
    scenes.current[key] = keepScene(scenes.current[key], e);
    if (e.learnerDraw !== undefined) learnerDraw.current = e.learnerDraw;
  }, []);

  // ---- clock, hard close -------------------------------------------------------------------------------------
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  useEffect(() => { if (serverNow >= hardCloseMs && !over) setOver('closed'); }, [serverNow, hardCloseMs, over]);

  // L1: a page restored from the back/forward cache holds a dead room; load it fresh.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => { if (e.persisted) window.location.reload(); };
    window.addEventListener('pageshow', onShow);
    return () => window.removeEventListener('pageshow', onShow);
  }, []);

  /** Any classroom answer can say the room is over (M6) or that a newer device took the seat (B1). */
  const roomCall = useCallback(async (path: string, init: RequestInit = {}) => {
    const res = await fetch(`/api/classroom/${encodeURIComponent(bookingId)}/${path}`, {
      ...init, headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
    });
    const r = readRoomAnswer(res.status, await res.json().catch(() => ({})));
    if (r.kind === 'superseded') setOver((o) => o ?? 'superseded');
    else if (r.kind === 'over') setOver((o) => o ?? r.reason);
    return r;
  }, [bookingId, ticket]);

  /** M5/M6: is the room still open, and the server's clock. */
  const checkState = useCallback(async () => {
    if (overRef.current) return;
    const sentAt = Date.now();
    try {
      const r = await roomCall('state');
      if (r.kind === 'open' && r.serverNow != null) setSkew(clockOffsetMs(r.serverNow, sentAt, Date.now()));
    } catch { /* offline: the next check asks again */ }
  }, [roomCall]);

  // ---- joining ----------------------------------------------------------------------------------------------
  const onReady = useCallback((stream: MediaStream, opts: WaitingRoomReady) => {
    setLocal(stream);
    setReady(opts);
    setMuted(!!opts.micOff);
    setCameraOff(!!opts.cameraOff);
    setRecitation(isTeacher && opts.recitationMode);
    recitationRef.current = isTeacher && opts.recitationMode;
    setPhase('room');
  }, [isTeacher]);

  // H2: retried with backoff until the wanted session is pulled; an id that arrives mid-subscribe is pulled after it.
  const subscribeSide = useCallback(async function pull(side: Side) {
    const engine = engineRef.current;
    const sessionId = wanted.current[side];
    const retry = retries.current[side];
    if (!engine || !sessionId || overRef.current || inFlight.current[side] || subscribed.current[side] === sessionId) return;
    if (retry.timer != null) { window.clearTimeout(retry.timer); retry.timer = null; }
    inFlight.current[side] = true;
    detectorRef.current?.arm();
    let ok = false;
    try {
      const stream = await engine.subscribe({ sessionId, trackNames: [`${side}-audio`, `${side}-video`] });
      if (engineRef.current !== engine) return;
      subscribed.current[side] = sessionId;
      setRemotes((r) => ({ ...r, [side]: stream }));
      retry.n = 0;
      ok = true;
    } catch {
      // Usually "not sending yet": tried again below.
    } finally {
      inFlight.current[side] = false;
    }
    if (engineRef.current !== engine || overRef.current || wanted.current[side] === subscribed.current[side]) return;
    retry.timer = window.setTimeout(() => { retry.timer = null; void pull(side); }, ok ? 0 : subscribeRetryMs(retry.n++));
  }, []);

  useEffect(() => {
    if (phase !== 'room' || !local) return;
    const engine = createEngine();
    engineRef.current = engine;
    let live = true;
    const detector = createFallbackDetector({
      side: mySide,
      history: iceHistoryFor(bookingId),
      report: (kind, detail) => {
        void fetch(`/api/classroom/${encodeURIComponent(bookingId)}/incident`, {
          method: 'POST', keepalive: true,
          headers: { 'Content-Type': 'application/json', 'x-room-ticket': ticket },
          body: JSON.stringify({ kind, detail }),
        }).then((r) => r.json()).then((b) => { if (live && typeof b?.fallback?.url === 'string') setFallbackUrl(b.fallback.url); }, () => {});
      },
    });
    detectorRef.current = detector;
    let told = false;
    const offError = engine.on('error', (e) => { if (live) detector.onError(e); });
    const offDevice = engine.on('device', (d) => {
      if (!live) return;
      // The engine already sends the new track; swap it into the self-view's stream, keeping mute and camera-off.
      if (d.ok && d.track) {
        const old = d.kind === 'audio' ? local.getAudioTracks() : local.getVideoTracks();
        d.track.enabled = old[0]?.enabled ?? true;
        old.forEach((tr) => local.removeTrack(tr));
        local.addTrack(d.track);
      }
      setDevice({ kind: d.kind, ok: d.ok, at: Date.now() });
    });
    const offMute = engine.on('remote-mute', (m) => { if (live && m.kind === 'video') setRemoteWaiting((w) => ({ ...w, [m.side]: m.muted })); });
    const offState = engine.on('state', (s) => {
      if (!live) return;
      detector.onState(s);
      // M2: this side joined when its media first connects, once per join.
      if (s === 'connected' && !told && !observer) { told = true; void roomCall('connected', { method: 'POST' }).catch(() => {}); }
      setReconnecting(s === 'reconnecting');
      if (s === 'reconnecting') totals.current.reconnects += 1;
      if (s === 'superseded') setOver('superseded');
      else if (s === 'ended') void checkState().finally(() => setOver((o) => o ?? 'closed'));
      else if (s === 'failed') setOver('failed');
    });
    if (!observer) batcher.current = createTimelineBatcher(bookingId, () => ticket);
    (async () => {
      const snap = await restoreState(bookingId, ticket);
      if (!live) return;
      if (snap) {
        const s = snap.snapshot;
        // The teacher's answer to hello may have come first and is newer (M7). The teacher's own share ended with the
        // old tab; a learner keeps 'screen' while the teacher still shares.
        if (!heardLayout.current) {
          if (s.layout) setLayout(s.layout === 'screen' && isTeacher ? 'content' : s.layout);
          setPane(s.pdf ? 'pdf' : s.slide ? 'lesson' : s.board ? 'board' : 'lesson');
        }
        if (s.board) scenes.current[''] = s.board;
        Object.assign(scenes.current, s.boards);
        learnerDraw.current = s.learnerDraw ?? s.board?.learnerDraw ?? false;
        if (s.pdf) setPdf({ ...s.pdf, url: null });
      }
      setRestored(snap?.snapshot ?? {});
      try {
        await engine.join({ bookingId, ticket, iceServers: entry.iceServers, role });
        // M3: the connect clock starts with the first publish or subscribe, not with the join.
        if (!observer && local.getTracks().length) { detector.arm(); await engine.publishCamera(local); }
        if (recitationRef.current) await engine.setRecitationMode(true);
        if (!live) return;
        setJoined(true);
        watchSides.forEach((s) => void subscribeSide(s));
      } catch (e: any) {
        // Task 12: a join or publish that fails on our side (network blocked, media service down) never reaches the
        // connect clock, so report it here: the incident alerts the admins and brings this side's Zoom link.
        if (live) detector.onError({ code: typeof e?.code === 'string' ? e.code : 'join_failed', message: String(e?.message || e) });
        if (live && engine.state !== 'superseded' && engine.state !== 'ended') setOver('failed');
      }
    })();
    const onHide = () => { void engine.leave(); };
    window.addEventListener('pagehide', onHide);
    return () => {
      live = false;
      detector.stop();
      detectorRef.current = null;
      offError();
      offState();
      offDevice();
      offMute();
      for (const r of Object.values(retries.current)) { if (r.timer != null) window.clearTimeout(r.timer); r.timer = null; r.n = 0; }
      window.removeEventListener('pagehide', onHide);
      if (role === 'guardian_observer') publishEvent({ t: 'observer', kind: 'guardian', present: false });
      saveTalk();
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
    for (const r of Object.values(retries.current)) { if (r.timer != null) window.clearTimeout(r.timer); r.timer = null; }
    saveTalk();
    void batcher.current?.stop();
    batcher.current = null;
    void engineRef.current?.leave();
    local?.getTracks().forEach((tr) => tr.stop());
  }, [over, local]);

  // Tell the other side (and observers) which session to pull; repeat so late joiners find us.
  useEffect(() => {
    if (!joined || !room.connected || over) return;
    const announce = () => {
      const id = engineRef.current?.sessionId;
      if (mySide && id) publishEvent({ t: 'session', side: mySide, sessionId: id });
      if (role === 'guardian_observer') publishEvent({ t: 'observer', kind: 'guardian', present: true });
      if (isTeacher && recitationRef.current) publishEvent({ t: 'recitation', on: true });
    };
    announce();
    const id = window.setInterval(announce, ANNOUNCE_EVERY_MS);
    return () => window.clearInterval(id);
  }, [joined, room.connected, over, mySide, role, isTeacher, publishEvent]);

  // M5/M6: ask the server every 30 s, when the tab comes back and after a reconnect.
  useEffect(() => {
    if (phase !== 'room' || over) return;
    void checkState();
    const id = window.setInterval(() => void checkState(), STATE_EVERY_MS);
    const onVisible = () => { if (document.visibilityState === 'visible') void checkState(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { window.clearInterval(id); document.removeEventListener('visibilitychange', onVisible); };
  }, [phase, over, checkState]);

  // M7: the teacher tells a late joiner or a rejoiner what is on screen now. The board comes from the saved snapshot.
  const shareShown = useCallback(() => {
    if (!isTeacher || overRef.current) return;
    const s = shown.current;
    publishEvent({ t: 'layout', mode: s.layout, ...(s.layout === 'content' ? { pane: s.pane } : {}) });
    if (s.pdf) publishEvent({ t: 'pdf', fileId: s.pdf.fileId, page: s.pdf.page });
    if (s.pane === 'quran') publishEvent({ t: 'quran', page: s.quran });
  }, [isTeacher, publishEvent]);
  const { onHello } = room;
  useEffect(() => onHello(shareShown), [onHello, shareShown]);

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
        if (overRef.current) return;
        // B1: another device of my side. The server knows which join holds the seat; the older one ends on its answer.
        if (mySide && e.side === mySide) {
          if (e.sessionId !== engineRef.current?.sessionId) void checkState();
          return;
        }
        if (!watchSides.includes(e.side) || wanted.current[e.side] === e.sessionId) return;
        wanted.current[e.side] = e.sessionId;
        retries.current[e.side].n = 0;
        void subscribeSide(e.side);
        // Answer a new session at once, so a rejoin does not wait for our next announce, and show it the screen.
        const id = engineRef.current?.sessionId;
        if (mySide && id) publishEvent({ t: 'session', side: mySide, sessionId: id });
        shareShown();
        return;
      }
      case 'quality':
        if (e.side === mySide) return;
        setLinks((l) => ({ ...l, [e.side]: e.link }));
        if (e.stats) remoteStats.current = e.stats;
        remoteLayer.current = e.layer;
        return;
      case 'board':
        keepBoard(e);
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
        heardLayout.current = true;
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
      case 'quran':
        if (!isTeacher) setQuranPage(e.page);
        return;
      case 'end':
        // H3/L4: anyone with the room key can send this; the server says whether the lesson really ended.
        if (!isTeacher) void checkState();
        return;
      default:
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [onEvent, subscribeSide, publishEvent, isTeacher, mySide, checkState, shareShown]);

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
    if (!joined || over) return;
    const picker = createLayerPicker();
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
      const blame = blameSide(s, remoteStats.current);
      setBlame(blame);
      // M4: my weak uplink shows in what the other side receives of me, so their reported layer lands on my record.
      if (blame === 'me') addQualityStep(totals.current, remoteLayer.current, STATS_EVERY_MS / 1000);
      if (!mySide) return;
      setLinks((l) => (l[mySide] === link ? l : { ...l, [mySide]: link }));
      const e: RoomEvent = { t: 'quality', side: mySide, layer, link, stats: s };
      if (++tick % 2 === 0) publishEvent(e);
      // Saved only when it changes: the quality record needs the moments, not every reading.
      if (`${link}:${layer}` !== lastSaved) { lastSaved = `${link}:${layer}`; save(e); }
    }, STATS_EVERY_MS);
    return () => window.clearInterval(id);
  }, [joined, over, mySide, publishEvent, save]);

  useEffect(() => {
    if (!joined || observer || over) return;
    const send = () => {
      // M1: a room that is over sends nothing more (the server refuses it anyway).
      if (overRef.current) return Promise.resolve();
      return roomCall('quality', { method: 'POST', keepalive: true, body: JSON.stringify(totals.current) })
        .catch(() => { /* the next send carries the same totals */ });
    };
    flushQuality.current = send;
    const id = window.setInterval(send, QUALITY_EVERY_MS);
    window.addEventListener('pagehide', send);
    return () => { window.clearInterval(id); window.removeEventListener('pagehide', send); send(); };
  }, [joined, observer, over, roomCall]);

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
    detectorRef.current?.arm();
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
      if (e.code === 'KeyM' && !observer) { e.preventDefault(); toggleMute(); }
      if (!isTeacher) return;
      const mode = ({ Digit1: 'conversation', Digit2: 'content', Digit3: 'screen', Numpad1: 'conversation', Numpad2: 'content', Numpad3: 'screen' } as Record<string, LayoutMode>)[e.code];
      if (mode && (mode !== 'screen' || sharing)) changeLayout(mode);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, observer, isTeacher, sharing, toggleMute, changeLayout]);

  // H3: the server ends the lesson first (200, or 423 'ended' on a repeat), then the learner is told, then we leave.
  const endLesson = async () => {
    setEnding(true);
    setEndError('');
    await flushQuality.current();
    const r = await roomCall('end', { method: 'POST', body: JSON.stringify({ reason: endReason.trim() }) }).catch(() => ({ kind: 'unknown' as const }));
    if (r.kind === 'superseded') return;
    if (r.kind !== 'open' && !(r.kind === 'over' && r.reason === 'ended')) {
      setEnding(false);
      if (r.kind === 'unknown') setEndError(t('The lesson did not end. Check your internet and try again.', 'الحصة ما خلصتش. اتأكد من النت وجرّب تاني.'));
      return;
    }
    overRef.current = 'ended'; // the heartbeat and the announce stop while we leave
    saveTalk();
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

  // 2.8 talk time: the teacher's page counts both sides (own mic, silent while muted; the learner's audio) and saves
  // one 'talk' event per join, before the batcher's last flush (end, leave, hard close, closing the tab).
  const talk = useTalkTime(isTeacher && joined && !over, selfSpeaking, studentSpeaking);
  const talkSaved = useRef(false);
  const saveTalk = useCallback(() => {
    if (!isTeacher || talkSaved.current || !batcher.current) return;
    const totals = talk.read();
    if (!totals.teacherMs && !totals.learnerMs) return;
    talkSaved.current = true;
    save({ t: 'talk', ...totals });
  }, [isTeacher, talk.read, save]);
  useEffect(() => {
    if (!isTeacher) return;
    const onHide = () => { saveTalk(); void batcher.current?.flush(true); };
    window.addEventListener('pagehide', onHide);
    return () => window.removeEventListener('pagehide', onHide);
  }, [isTeacher, saveTalk]);

  // Learner: reports leaving the lesson screen and says "welcome back" (FocusNotice).
  const welcomeBack = useLearnerFocus(role === 'learner', send, warningOff);

  // "Your teacher is here" before joining: the other side's session announce arrives every 15 s on the channel.
  useEffect(() => onEvent((e) => {
    if (e.t === 'session' && mySide && e.side !== mySide) setOtherSeen(Date.now());
    if (e.t === 'session' && !mySide) setOtherSeen(Date.now());
  }), [onEvent, mySide]);

  // Reconnecting: after 20 s the notice says to check the internet; once back, "Back." for 2 s.
  const wasReconnecting = useRef(false);
  useEffect(() => {
    if (reconnecting) { wasReconnecting.current = true; setReconnectingSince(Date.now()); return; }
    if (!wasReconnecting.current) return;
    wasReconnecting.current = false;
    setReconnectingSince(0);
    setReconnectedAt(Date.now());
    void checkState();
  }, [reconnecting, checkState]);

  const board = useMemo<BoardSync>(() => ({
    publishEvent: (e) => { if (e.t === 'board') keepBoard(e); publishEvent(e); },
    onEvent,
    save,
    initial: (surface = '') => {
      const scene = scenes.current[surface];
      return { sceneVersion: scene?.sceneVersion ?? -1, elements: scene?.elements ?? [], learnerDraw: learnerDraw.current, page: scene?.page };
    },
  }), [publishEvent, onEvent, save, keepBoard]);
  const sendPointer = usePointerSender(publishEvent);

  // ---- over -----------------------------------------------------------------------------------------------------
  if (over) {
    const copy: Record<Over, { title: string; body: string }> = {
      ended: kid
        ? { title: t('Well done today!', 'برافو عليك النهارده!'), body: t('See you next lesson.', 'نشوفك الحصة الجاية.') }
        : { title: t('The lesson has ended', 'الحصة خلصت'), body: t('Well done today. See you next lesson.', 'برافو عليك النهارده. نشوفك الحصة الجاية.') },
      closed: { title: t('The room has closed', 'الغرفة اتقفلت'), body: t('The lesson time is over, so the room closed for everyone.', 'وقت الحصة خلص، فالغرفة اتقفلت للكل.') },
      cancelled: { title: t('This lesson was cancelled', 'الحصة دي اتلغت'), body: t('Your lessons page shows what comes next.', 'صفحة حصصك فيها اللي جاي.') },
      moved: { title: t('This lesson was moved', 'الحصة دي اتنقلت لميعاد تاني'), body: t('Your lessons page shows the new time.', 'الميعاد الجديد في صفحة حصصك.') },
      reassigned: { title: t('This lesson changed hands', 'الحصة دي اتغيرت'), body: t('It is now with another teacher or learner. Your lessons page has the details.', 'بقت مع معلم أو طالب تاني. التفاصيل في صفحة حصصك.') },
      superseded: { title: t('This lesson is open on another device', 'الحصة مفتوحة على جهاز تاني'), body: t('You joined from another tab or device, so it stopped here.', 'دخلت من تاب أو جهاز تاني، فوقفت هنا.') },
      failed: { title: t('We lost the connection to the room', 'الاتصال بالغرفة اتقطع'), body: t('Check your internet, then try again. The lesson, the board and the time come back as they were.', 'اتأكد من النت وجرّب تاني. الدرس والسبورة والوقت هيرجعوا زي ما كانوا.') },
    };
    const again = over === 'superseded' || over === 'failed';
    const zoomFirst = over === 'failed' && !!fallbackUrl;
    return (
      <Shell paper>
        <div className="grid min-h-full place-items-center px-4 py-10">
          <div className="glass-2 arch-top room-rise grid w-full max-w-md justify-items-center gap-4 px-6 pb-8 pt-14 text-center">
            {over === 'ended' && kid ? <EndZad /> : <Khatam size={52} />}
            <h1 className={cn('font-editorial text-[1.75rem] leading-tight text-foreground text-balance', isAr ? 'font-bold' : 'font-medium tracking-tight')}>{copy[over].title}</h1>
            <p className="max-w-xs text-[0.95rem] leading-relaxed text-muted-foreground">{copy[over].body}</p>
            {zoomFirst && <FallbackNotice url={fallbackUrl!} teacher={isTeacher} variant="screen" />}
            {/* 3.4: an adult learner rates the lesson here; a child's lesson is rated by the parent from the lessons page. */}
            {(over === 'ended' || over === 'closed') && role === 'learner' && !kid && <div className="w-full text-start"><LessonFeedbackCard isAr={isAr} timezone={Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'} /></div>}
            <div className="flex flex-wrap justify-center gap-2">
              {again && (
                <Button variant={zoomFirst ? 'outline' : 'primary'} onClick={onRejoin}>
                  <RefreshCw className="me-2 h-4 w-4" aria-hidden="true" />{over === 'superseded' ? t('Use this device', 'كمّل من هنا') : t('Try again', 'جرّب تاني')}
                </Button>
              )}
              <Link to={home} className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-teal underline underline-offset-4 focus-ring">{isTeacher ? t('Back to today', 'رجوع للنهارده') : t('My lessons', 'حصصي')}</Link>
            </div>
          </div>
        </div>
      </Shell>
    );
  }

  // ---- waiting room -----------------------------------------------------------------------------------------
  if (phase === 'waiting') {
    const otherHere = otherSeen > 0 && now - otherSeen < GUARDIAN_STALE_MS;
    const named = entry.teacherName || null;
    const title = isTeacher
      ? (subject ? t(`${subject} with ${learnerName}`, `${subject} مع ${learnerName}`) : t(`Lesson with ${learnerName}`, `حصة ${learnerName}`))
      : observer
        ? (entry.learnerName ? t(`${learnerName}'s lesson`, `حصة ${learnerName}`) : t('Watch the lesson', 'متابعة الحصة'))
        : named ? (subject ? t(`${subject} with ${named}`, `${subject} مع ${named}`) : t(`Your lesson with ${named}`, `حصتك مع ${named}`))
          : t('Your lesson', 'حصتك');
    const here = !otherHere ? null
      : isTeacher ? t(`${learnerName} is here`, `${learnerName} موجود`)
        : observer ? t('The lesson has started', 'الحصة بدأت')
          : t('Your teacher is here', 'معلمك موجود');
    return (
      <Shell paper>
        <WaitingRoom role={role} ticket={ticket} bookingId={bookingId} onReady={onReady} kid={kid}
          info={{ title, when: <WhenLine startMs={startMs} now={serverNow} />, here }} />
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
  const face = watchSides[0];
  const myLink = mySide ? links[mySide] : null;
  const awayMs = isTeacher ? teacherAwayMs(awayAt, now, warningOff) : null;
  const showSelf = !observer && !selfHidden;

  const reactionOverlay = isTeacher && reactions.length > 0 ? <ReactionStream items={reactions} name={learnerName} /> : undefined;
  const remoteTile = (s: Side, o: { compact?: boolean; arch?: boolean; fit?: 'cover' | 'contain'; overlay?: boolean; className?: string } = {}) => (
    <VideoTile key={s} stream={remotes[s]} name={nameOf(s)} speaking={speakingOf(s)} link={observer ? null : links[s]} compact={o.compact}
      arch={o.arch} fit={o.fit} dim={reconnecting} connecting={!joined} className={o.className}
      overlay={o.overlay && s === 'student' ? reactionOverlay : undefined}
      note={!joined ? (o.compact ? undefined : t('Opening the room…', 'بنفتح الغرفة…'))
        : !remotes[s] ? (s === 'teacher' ? t('Your teacher will be here soon.', 'المعلم جاي حالاً.') : t(`Waiting for ${learnerName}…`, `مستنيين ${learnerName}…`))
          : audioOnly ? t('Video paused to keep the sound clear', 'الفيديو واقف علشان الصوت يفضل واضح')
            : remoteWaiting[s] ? t('Waiting for video…', 'مستنيين الفيديو…') : undefined} />
  );
  const selfTile = (className?: string) => showSelf && (
    <VideoTile stream={local} name={t('You', 'إنت')} self compact speaking={selfSpeaking} micOff={muted} videoOff={cameraOff} link={myLink} className={className} />
  );

  // ---- notices: one at a time, by priority (DESIGN-BRIEF 3.4) -----------------------------------------------------
  const notices: RoomNotice[] = [];
  if (fallbackUrl) notices.push({ key: 'fallback', priority: 1, text: null, custom: <FallbackNotice url={fallbackUrl} teacher={isTeacher} variant="banner" /> });
  if (reconnecting) {
    notices.push({ key: 'reconnecting', priority: 3, icon: <Khatam size={20} breathe />,
      text: reconnectingSince && now - reconnectingSince > 20_000 ? t('Still trying. Check your internet.', 'لسه بنحاول. اتأكد من النت.') : t('Reconnecting… The lesson is safe.', 'بنرجّع الاتصال… الحصة محفوظة.') });
  } else if (reconnectedAt && now - reconnectedAt < 2500) {
    notices.push({ key: 'back', priority: 3, icon: <Khatam size={20} />, text: t('Back.', 'رجعنا.') });
  }
  if (device && (!device.ok || now - device.at < 4000)) {
    const mic = device.kind === 'audio';
    notices.push({ key: `device-${device.kind}-${device.ok}`, priority: 2,
      icon: mic ? (device.ok ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />) : (device.ok ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />),
      text: device.ok
        ? (mic ? t('Your microphone reconnected.', 'المايك رجع اشتغل.') : t('Your camera reconnected.', 'الكاميرا رجعت اشتغلت.'))
        : (mic ? t('Microphone lost. Check it.', 'المايك وقف. اتأكد منه.') : t('Camera lost. Check it.', 'الكاميرا وقفت. اتأكد منها.')) });
  }
  if (talkingMuted) {
    notices.push({ key: 'talking-muted', priority: 4, icon: <MicOff className="h-4 w-4" />,
      text: kid ? t("You're muted. Tap the mic to talk.", 'المايك مقفول. دوس على المايك علشان تتكلم.') : t("You're talking while muted.", 'إنت بتتكلم والمايك مقفول.'),
      action: <NoticeAction onClick={toggleMute}>{t('Unmute', 'افتح المايك')}</NoticeAction> });
  }
  if (!observer && blame !== 'unknown') notices.push({ key: `weak-${blame}`, priority: 5, icon: <WifiOff className="h-4 w-4" />, text: weakLinkText(blame, isTeacher, t) });
  if (awayMs != null) {
    notices.push({ key: 'away', priority: 6, icon: <EyeOff className="h-4 w-4" />,
      text: <>{t('Not on the lesson screen', 'مش على شاشة الحصة')} · <bdi dir="ltr" className="tabular-nums">{mmss(awayMs)}</bdi></>,
      action: <NoticeAction onClick={() => { setWarningOff(true); publishEvent({ t: 'focus_warning_off', off: true }); }}>{t('I asked them to; stop warning', 'أنا اللي طلبت؛ وقّف التنبيه')}</NoticeAction> });
  }
  if (welcomeBack) {
    notices.push({ key: 'welcome', priority: 7, icon: <Hourglass className="h-4 w-4" />,
      text: kid ? t('Welcome back!', 'أهلاً بيك تاني!') : t('Welcome back. Your teacher is waiting for you.', 'أهلاً بيك تاني. المعلم مستنيك.') });
  }

  const content = (
    <div className="relative h-full min-h-0" onPointerMove={isTeacher && contentBox ? sendPointer : undefined}>
      {layout === 'screen' ? (
        <div className="grid h-full place-items-center overflow-hidden rounded-[var(--r-3)] bg-[#1C1714]">
          {isTeacher ? (
            <div className="grid justify-items-center gap-3 p-6 text-center text-[#D8C6AE]">
              <span className="arch-tile grid h-14 w-12 place-items-center bg-teal/15 text-[#5CC9DB]"><MonitorX className="h-6 w-6" aria-hidden="true" /></span>
              <p className="text-sm">{t('Your screen is being shared. The learner sees it here.', 'شاشتك متشاركة دلوقتي. الطالب شايفها هنا.')}</p>
            </div>
          ) : (
            <VideoTile stream={remoteScreen} name={t('Shared screen', 'الشاشة المشتركة')} fit="contain" className="h-full w-full" note={remoteScreen ? undefined : t('Opening the shared screen…', 'بنفتح الشاشة المشتركة…')} />
          )}
        </div>
      ) : pane === 'lesson' ? (
        isTeacher
          ? restored && <TeacherCurriculum initial={restored.slide} start={{ serviceId: entry.serviceId ?? null, learnerType: entry.learnerType ?? null, lastReport: entry.lastReport ?? null }} publish={room.publish} publishInk={room.publishInk} save={(s) => save({ t: 'slide', state: s })} />
          : <LearnerCurriculum state={room.state} ink={room.ink} />
      ) : pane === 'quran' ? (
        <QuranPane bookingId={bookingId} page={quranPage} teacher={isTeacher} staff={portal === 'teacher'}
          onPage={isTeacher ? (p) => { setQuranPage(p); publishEvent({ t: 'quran', page: p }); } : undefined} />
      ) : pane === 'board' ? (
        <div className="h-full overflow-hidden">
          {restored && <Board role={role} sync={board} />}
        </div>
      ) : (
        <div className="h-full overflow-hidden">
          {pdf?.url ? (
            /\.pdf$/i.test(pdf.fileId) ? (
              <PdfPages fileUrl={pdf.url} page={pdf.page}
                onPage={isTeacher ? (p) => { setPdf({ ...pdf, page: p }); send({ t: 'pdf', fileId: pdf.fileId, page: p }); } : undefined}>
                {restored && <Board key={boardSurface(pdf.fileId, pdf.page)} surface={boardSurface(pdf.fileId, pdf.page)} role={role} sync={board} transparent />}
              </PdfPages>
            ) : (
              restored && <Board key={boardSurface(pdf.fileId, 1)} surface={boardSurface(pdf.fileId, 1)} role={role} sync={board} image={pdf.url} />
            )
          ) : isTeacher ? (
            <label
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void onUpload(e.dataTransfer.files?.[0]); }}
              className={cn('m-4 grid h-[calc(100%-2rem)] cursor-pointer place-items-center rounded-[var(--r-3)] border-2 border-dashed border-border p-6 text-center hover:bg-surface-subtle focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]', uploading && 'pointer-events-none opacity-60')}>
              <span className="grid justify-items-center gap-3">
                <span className="arch-tile grid h-14 w-12 place-items-center bg-sand-light text-accent ring-1 ring-sand-border"><FileUp className="h-6 w-6" aria-hidden="true" /></span>
                <span className="text-base font-semibold text-foreground">{uploading ? t('Adding…', 'بنضيف…') : t('Add a PDF or a picture', 'ضيف PDF أو صورة')}</span>
                <span className="text-sm text-muted-foreground">{t('Drop it here, or click to choose. Both of you can write on it.', 'اسحبه هنا، أو دوس واختار. تقدروا تكتبوا عليه انتو الاتنين.')}</span>
              </span>
              <input type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => { void onUpload(e.target.files?.[0]); e.target.value = ''; }} />
            </label>
          ) : (
            <div className="grid h-full place-items-center p-6 text-center text-sm text-muted-foreground">{t('Your teacher has not opened a file yet.', 'المعلم لسه ما فتحش ملف.')}</div>
          )}
        </div>
      )}
      {!isTeacher && contentBox && <RemotePointer point={pointer} name={teacherName} />}
    </div>
  );

  const quranLesson = !entry.serviceId || QURAN_LESSON.test(entry.serviceId);
  const paneTabs = isTeacher && layout === 'content' && (
    <div className="room-ink flex shrink-0 flex-wrap items-center gap-2">
      <div role="tablist" aria-label={t('What to show', 'تعرض إيه')} className="glass-1 flex items-center gap-0.5 rounded-[var(--r-pill)] p-1">
        {([['lesson', BookOpen, t('Lesson', 'الدرس')], ['board', PenLine, t('Board', 'السبورة')], ['pdf', FileUp, t('File', 'ملف')], ...(quranLesson ? [['quran', BookMarked, t('Mushaf', 'المصحف')]] as const : [])] as const).map(([p, Icon, label]) => (
          <button key={p} type="button" role="tab" aria-selected={pane === p} onClick={() => { changeLayout('content', p); if (p === 'quran') publishEvent({ t: 'quran', page: quranPage }); }}
            className={cn('room-press flex min-h-10 items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-medium focus-ring',
              pane === p ? 'bg-[#3A332D] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]' : 'text-muted-foreground hover:text-foreground')}>
            <Icon className={cn('h-4 w-4', pane === p && 'text-[#F0B54A]')} aria-hidden="true" />{label}
          </button>
        ))}
      </div>
      {pane === 'pdf' && pdf?.url && (
        <label className={cn('room-press ms-auto flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--r-pill)] px-4 text-sm font-medium text-[#5CC9DB] hover:bg-white/[0.08] focus-within:outline focus-within:outline-2 focus-within:outline-[var(--focus)]', uploading && 'pointer-events-none opacity-60')}>
          <FileUp className="h-4 w-4" aria-hidden="true" />
          {uploading ? t('Adding…', 'بنضيف…') : t('Add another file', 'ضيف ملف تاني')}
          <input type="file" accept="application/pdf,image/png,image/jpeg" className="sr-only" onChange={(e) => { void onUpload(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      )}
      {uploadError && <p role="alert" className="w-full text-sm text-destructive">{uploadError}</p>}
    </div>
  );

  const minutesLeft = Math.round((endMs - serverNow) / 60_000);
  // Same rule as the server (EARLY_END_GRACE_MIN = 2): ending earlier asks why.
  const earlyEnd = Math.floor((endMs - serverNow) / 60_000) >= 2;
  const capsuleName = isTeacher ? learnerName : role === 'guardian_observer' ? t(`Watching · ${learnerName}'s lesson`, `متابعة · حصة ${learnerName}`)
    : role === 'admin_observer' ? t('Watching quietly · nobody in the lesson can see you', 'متابعة بهدوء · محدش في الحصة شايفك')
      : entry.teacherName || t('Your lesson', 'حصتك');

  return (
    <Shell>
      <div className="room-ink relative z-10 flex h-full flex-col">
        {/* Top capsule: who you are with, your line, the time. */}
        <header className="relative z-20 flex shrink-0 items-start gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5 sm:pt-4">
          <div className="room-fade flex min-w-0 flex-1 flex-wrap items-center gap-2">
            <div className="glass-1 flex min-h-11 min-w-0 max-w-full items-center gap-2 rounded-[var(--r-pill)] py-1 pe-1.5 ps-4">
              <h1 className={cn('min-w-0 truncate text-[0.95rem] text-foreground', isAr ? 'font-bold' : 'font-semibold')}>{capsuleName}</h1>
              {subject && !observer && <span className="hidden shrink-0 text-sm text-muted-foreground sm:inline">{subject}</span>}
              {myLink && <span className="shrink-0"><NetworkBadge link={myLink} onDark /></span>}
              {(isTeacher || observer) && <Timer startMs={startMs} endMs={endMs} now={serverNow} mode={isTeacher ? 'teacher' : 'observer'} />}
              {isTeacher && <TalkRatio {...talk.totals} />}
            </div>
            {isTeacher && guardianHere && <GuardianChip />}
            {isTeacher && sharing && (
              <span className="glass-1 flex min-h-11 items-center gap-2 rounded-[var(--r-pill)] py-1 pe-1 ps-3 text-[0.82rem] font-medium text-foreground ring-1 ring-teal/50">
                <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#12A4BC]" />{t("You're sharing", 'بتشارك شاشتك')}
                <button type="button" onClick={stopShare} className="room-press min-h-9 rounded-[var(--r-pill)] bg-white/10 px-3 font-semibold hover:bg-white/15 focus-ring">{t('Stop', 'وقّف')}</button>
              </span>
            )}
          </div>
          {!isTeacher && !observer && <Timer startMs={startMs} endMs={endMs} now={serverNow} mode={kid ? 'kid' : 'learner'} />}
        </header>

        {/* Notices on wider screens: under the capsule, over the stage's top margin. */}
        <NoticeSlot notices={notices} className="absolute inset-x-0 top-[4.25rem] z-30 hidden sm:flex" />

        {/* Stage */}
        <main className={cn('relative min-h-0 flex-1 px-3 pb-2 pt-3 sm:px-5 sm:pt-5', role === 'admin_observer' && notesOpen && 'lg:ps-[24rem]', isTeacher && sharing && 'after:pointer-events-none after:absolute after:inset-1 after:rounded-[var(--r-4)] after:ring-2 after:ring-[#12A4BC]/70')}>
          {layout === 'conversation' ? (
            <div key="conversation" className="room-rise grid h-full place-items-center">
              {observer ? (
                <div className="grid w-full max-w-[min(64rem,calc((100svh-11rem)*1.65))] grid-rows-2 gap-3 sm:grid-cols-2 sm:grid-rows-1 h-full sm:h-auto">
                  {(['teacher', 'student'] as Side[]).map((s) => remoteTile(s, { arch: true, fit: 'contain', className: 'h-full w-full sm:h-auto sm:aspect-[4/5] [--arch-h:6rem] sm:[--arch-h:12rem]' }))}
                </div>
              ) : (
                <div className="relative h-full w-full sm:h-auto sm:max-h-full sm:max-w-[min(72rem,calc((100svh-11.5rem)*16/9))] sm:aspect-video">
                  {remoteTile(face, { arch: true, fit: 'contain', overlay: true, className: 'absolute inset-0 h-full w-full [--arch-h:10rem] sm:[--arch-h:19rem]' })}
                  {showSelf && (
                    <CornerPip label={t('Your picture. Drag it to another corner.', 'صورتك. اسحبها لأي ركن.')}>
                      {selfTile('h-32 w-24 shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)] sm:h-auto sm:w-56 sm:aspect-video')}
                    </CornerPip>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div key="content" className="room-fade flex h-full min-h-0 flex-col gap-3 lg:flex-row">
              {observer && (
                <div className="grid shrink-0 grid-cols-2 gap-2 lg:hidden" aria-label={t('People', 'الموجودين')}>
                  {(['teacher', 'student'] as Side[]).map((s) => remoteTile(s, { arch: true, compact: true, className: 'h-28 w-full [--arch-h:3.5rem]' }))}
                </div>
              )}
              <section className="relative flex min-h-0 min-w-0 flex-1 flex-col gap-2">
                {paneTabs}
                <div className="room-paper relative min-h-0 flex-1 overflow-hidden rounded-[var(--r-3)] bg-surface dark:bg-[#24201D] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-black/5">
                  {content}
                </div>
                {!observer && (
                  <div className="lg:hidden">
                    <CornerPip label={t('Picture of the other person. Drag it to another corner.', 'صورة الطرف التاني. اسحبها لأي ركن.')}>
                      {remoteTile(face, { arch: true, compact: true, className: 'h-28 w-[5.5rem] [--arch-h:3rem] shadow-[0_16px_40px_-16px_rgba(0,0,0,0.9)]' })}
                    </CornerPip>
                  </div>
                )}
              </section>
              <aside className="hidden w-72 shrink-0 flex-col gap-3 lg:flex" aria-label={t('People', 'الموجودين')}>
                {(observer ? (['teacher', 'student'] as Side[]) : [face]).map((s) => remoteTile(s, { arch: true, overlay: true, className: 'aspect-[4/5] w-full [--arch-h:8rem]' }))}
                {selfTile('aspect-video w-full')}
              </aside>
            </div>
          )}
          {isTeacher && layout !== 'conversation' && reactions.length > 0 && (
            <div className="absolute bottom-4 start-6 z-20 lg:hidden"><ReactionStream items={reactions} name={learnerName} /></div>
          )}
          {role === 'admin_observer' && <ObserverNotes bookingId={bookingId} ticket={ticket} startMs={startMs} onOpenChange={setNotesOpen} />}
        </main>

        <footer className="room-rise-sm relative z-20 shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 sm:px-5 sm:pb-4">
          {/* Notices on phones: just above the bar, in the thumb zone. */}
          <NoticeSlot notices={notices} className="mb-2 sm:hidden" />
          <Toolbar kind={isTeacher ? 'teacher' : observer ? 'observer' : kid ? 'kid' : 'learner'}
            muted={muted} cameraOff={cameraOff} hasCamera={hasCamera} onMute={toggleMute} onCamera={toggleCamera}
            recitation={recitation} onRecitation={isTeacher ? toggleRecitation : undefined}
            layout={layout} onLayout={isTeacher ? (m) => changeLayout(m) : undefined} sharing={sharing}
            shareSlot={isTeacher && shareSupported ? <ScreenShareButton sharing={sharing} onStart={startShare} onStop={stopShare} /> : undefined}
            onReact={role === 'learner' ? (kind) => send({ t: 'reaction', kind }) : undefined}
            selfHidden={selfHidden} onToggleSelf={!observer && !kid ? () => setSelfHidden((v) => !v) : undefined}
            soundOff={soundOff} onSound={observer ? () => setSoundOff((v) => !v) : undefined}
            onLeave={() => (isTeacher ? setConfirmEnd(true) : leave())}
            leaveLabel={isTeacher ? t('End lesson', 'إنهاء الحصة') : role === 'admin_observer' ? t('Leave quietly', 'اخرج بهدوء') : t('Leave', 'خروج')} />
        </footer>

        {remotes.teacher && !isTeacher && <RemoteAudio stream={remotes.teacher} speakerId={ready?.speakerId} label={tapLabel} initial={teacherName} muted={soundOff} />}
        {remotes.student && role !== 'learner' && <RemoteAudio stream={remotes.student} speakerId={ready?.speakerId} label={tapLabel} initial={learnerName} muted={soundOff} />}
        {remoteScreen?.getAudioTracks().length ? <RemoteAudio stream={remoteScreen} speakerId={ready?.speakerId} label={tapLabel} initial={teacherName} muted={soundOff} /> : null}
      </div>

      <Modal isOpen={confirmEnd} onClose={() => setConfirmEnd(false)} title={t('End the lesson for everyone?', 'تنهي الحصة للكل؟')} layerClassName="z-[80]"
        footer={(
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>{t('Keep teaching', 'كمّل الحصة')}</Button>
            <Button onClick={endLesson} disabled={ending || (earlyEnd && endReason.trim().length < 10)}>{ending ? t('Ending…', 'بننهي…') : t('End lesson', 'إنهاء الحصة')}</Button>
          </div>
        )}>
        <div className="grid gap-2 text-sm text-muted-foreground">
          {earlyEnd && (
            <>
              <p className="font-medium text-foreground">{t(`There are ${minutesLeft} minutes left. Why does the lesson end early?`, `فاضل ${minutesLeft} دقيقة. الحصة بتخلص بدري ليه؟`)}</p>
              <Textarea aria-label={t('Reason for ending early', 'سبب إنهاء الحصة بدري')} value={endReason} onChange={(e) => setEndReason(e.target.value)} rows={3}
                placeholder={t('For example: the learner had to leave.', 'مثلًا: الطالب اضطر يمشي.')} />
              <p className="text-xs">{t('At least 10 characters. The academy sees it.', 'على الأقل 10 حروف. الأكاديمية بتشوفه.')}</p>
            </>
          )}
          <p>{t('The room closes for the learner too. Next, you write the lesson report.', 'الغرفة هتتقفل عند الطالب كمان. بعدها هتكتب تقرير الحصة.')}</p>
          {endError && <p role="alert" className="text-destructive">{endError}</p>}
        </div>
      </Modal>
    </Shell>
  );
}

/**
 * The room takes the whole window, over the app's own chrome. Waiting room and over screens stay on paper with the
 * khatam field; the room itself dims to the espresso stage (it fades in over the paper: "the lights dim").
 */
function Shell({ children, paper = false }: { children: React.ReactNode; paper?: boolean }) {
  return (
    <div className={cn('fixed inset-0 z-[60] bg-background text-foreground', paper ? 'khatam-field brand-lights overflow-y-auto' : 'overflow-hidden')} data-testid="classroom">
      {!paper && <div className="room-stage-bg" aria-hidden="true" />}
      {children}
    </div>
  );
}

/** "Today 17:00 · starts in 2 min" for the waiting room. */
function WhenLine({ startMs, now }: { startMs: number; now: number }) {
  const { t, isAr } = useT();
  const time = new Date(startMs).toLocaleTimeString(isAr ? 'ar-EG-u-nu-latn' : 'en-GB', { hour: '2-digit', minute: '2-digit' });
  const mins = Math.round((startMs - now) / 60_000);
  const rel = mins > 0 ? t(`starts in ${mins} min`, `هتبدأ بعد ${mins} دقيقة`) : mins < 0 ? t(`started ${-mins} min ago`, `بدأت من ${-mins} دقيقة`) : t('starting now', 'بتبدأ دلوقتي');
  return <>{t('Today', 'النهارده')} <bdi>{time}</bdi> · {rel}</>;
}

/** Zad waves once on a child's end card, then stands still. */
function EndZad() {
  const [pose, setPose] = useState<'wave' | 'idle'>('wave');
  useEffect(() => { const id = window.setTimeout(() => setPose('idle'), 2600); return () => window.clearTimeout(id); }, []);
  return <ZadRigSvg pose={pose} size={120} glow={false} />;
}

function NoticeAction({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className="room-press min-h-9 whitespace-nowrap rounded-[var(--r-pill)] bg-white/10 px-3 text-[0.82rem] font-semibold text-foreground hover:bg-white/15 focus-ring">
      {children}
    </button>
  );
}

/** Teacher only: a guardian observer is in the room (spec §4). The learner never sees it. */
function GuardianChip() {
  const { t } = useT();
  return (
    <span className="room-fade glass-1 flex min-h-11 items-center gap-1.5 rounded-[var(--r-pill)] px-3.5 text-[0.82rem] font-medium text-foreground">
      <ShieldCheck className="h-4 w-4 text-[#5CC9DB]" aria-hidden="true" />{t('Guardian watching', 'ولي الأمر بيتابع')}
    </span>
  );
}
