import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../lib/language';
import { dashboardFetch } from '../dashboard/lib/dashboardApi';
import { authedJson } from '../lib/authedJson';
import { BrandLoader } from '../components/ui/BrandLoader';
import type { RoomRole } from './engine/types';
import { FallbackNotice } from './parts/FallbackNotice';
import { Khatam } from './parts/Khatam';

// The room (engine, board, player) is its own chunk; this gate stays tiny inside each app.
const ClassroomPage = lazy(() => import('./ClassroomPage'));

export type Portal = 'teacher' | 'student' | 'kid';
export type RoomEntry = {
  role: RoomRole;
  ticket: string;
  roomKey: string;
  iceServers: RTCIceServer[];
  startsAt: string;
  hardCloseAt: string;
  durationMinutes: number;
  learnerName: string | null;
  /** Coming from the enter endpoints (optional until the server sends them): the learner sees who teaches. */
  teacherName?: string | null;
  /** The lesson's subject in both languages, e.g. { en: 'Quran', ar: 'القرآن' }. */
  subjectLabel?: { en: string; ar: string } | null;
  /** students.learner_type: 'child' turns on child mode in the room. */
  learnerType?: 'child' | 'adult' | null;
  /** The booking's service and, for the teacher, where this learner stopped in the curriculum (slides open there). */
  serviceId?: string | null;
  lastReport?: { track: string; number: number; page: number } | null;
};

const HOME: Record<Portal, string> = { teacher: '/dashboard', student: '/student/lessons', kid: '/kid/lessons' };

/**
 * `/room/:id` in the three apps. Asks the server for a room pass; with one, the classroom opens. When the rollout
 * switch is off for this lesson's teacher (409 classroom:false), the NX-12 slides page and Zoom show as before.
 */
export function ClassroomGate({ portal, fallback }: { portal: Portal; fallback: React.ReactNode }) {
  const { t } = useT();
  const { id = '' } = useParams();
  const [search] = useSearchParams();
  // Parent mode (guardian) and the dashboard (super admin) may watch; a child's own app never asks to observe.
  const observe = portal !== 'kid' && search.get('observe') === '1';
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ entry: RoomEntry } | { fallback: true } | { error: string; zoomUrl?: string } | null>(null);

  useEffect(() => {
    let live = true;
    setResult(null);
    const path = `/api/${portal === 'teacher' ? 'dashboard' : 'student'}/classroom/${encodeURIComponent(id)}/enter${observe ? '?observe=1' : ''}`;
    (portal === 'teacher' ? dashboardFetch<RoomEntry>(path) : authedJson<RoomEntry>(path))
      .then((entry) => live && setResult({ entry }))
      .catch((e: any) => {
        if (!live) return;
        if (e?.status === 409 && (e?.data ?? e)?.classroom === false) setResult({ fallback: true });
        else {
          // Task 12: the media service failed on our side; the server sent this side's Zoom link when it is open.
          const zoomUrl = (e?.data?.fallback ?? e?.fallback)?.url;
          setResult({ error: e?.message || t('The lesson room could not open.', 'غرفة الحصة ما فتحتش.'), ...(typeof zoomUrl === 'string' ? { zoomUrl } : {}) });
        }
      });
    return () => { live = false; };
  }, [id, portal, observe, attempt]);

  if (!result) return <div className="grid min-h-[60vh] place-items-center"><BrandLoader size="md" /></div>;
  if ('fallback' in result) return <>{fallback}</>;
  if ('error' in result) {
    return (
      <div className="glass-2 arch-top mx-auto mt-10 grid max-w-md justify-items-center gap-3 px-6 pb-8 pt-14 text-center">
        <Khatam size={44} />
        <p role="alert" className="text-base font-semibold text-foreground">{result.error}</p>
        {result.zoomUrl && <FallbackNotice url={result.zoomUrl} teacher={portal === 'teacher'} variant="screen" />}
        <Link to={HOME[portal]} className="inline-flex min-h-11 items-center text-sm text-teal underline underline-offset-4 focus-ring">{t('Back to my lessons', 'رجوع لحصصي')}</Link>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><BrandLoader size="md" /></div>}>
      <ClassroomPage key={attempt} bookingId={id} portal={portal} entry={result.entry} home={HOME[portal]} onRejoin={() => setAttempt((n) => n + 1)} />
    </Suspense>
  );
}
