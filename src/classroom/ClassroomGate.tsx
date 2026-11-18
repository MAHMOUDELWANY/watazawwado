import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useT } from '../lib/language';
import { dashboardFetch } from '../dashboard/lib/dashboardApi';
import { authedJson } from '../lib/authedJson';
import { BrandLoader } from '../components/ui/BrandLoader';
import { Card } from '../components/ui/Card';
import type { RoomRole } from './engine/types';
import { FallbackNotice } from './parts/FallbackNotice';

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
};

const HOME: Record<Portal, string> = { teacher: '/dashboard', student: '/student/lessons', kid: '/kid/lessons' };

/**
 * `/room/:id` in the three apps. Asks the server for a room pass; with one, the classroom opens. When the classroom is
 * not set up on this server (503), the NX-12 slides page shows instead. Task 13 replaces the 503 check with the
 * rollout flag.
 */
export function ClassroomGate({ portal, fallback }: { portal: Portal; fallback: React.ReactNode }) {
  const { t } = useT();
  const { id = '' } = useParams();
  const [search] = useSearchParams();
  // Only parent mode may watch: a child's own app never asks to observe.
  const observe = portal === 'student' && search.get('observe') === '1';
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
        if (e?.status === 503) setResult({ fallback: true });
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
      <Card className="mx-auto mt-10 grid max-w-md gap-3 p-6 text-center">
        <p role="alert" className="text-base font-semibold text-foreground">{result.error}</p>
        {result.zoomUrl && <FallbackNotice url={result.zoomUrl} teacher={portal === 'teacher'} variant="screen" />}
        <Link to={HOME[portal]} className="text-sm text-teal underline underline-offset-4">{t('Back to my lessons', 'رجوع لحصصي')}</Link>
      </Card>
    );
  }
  return (
    <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><BrandLoader size="md" /></div>}>
      <ClassroomPage key={attempt} bookingId={id} portal={portal} entry={result.entry} home={HOME[portal]} onRejoin={() => setAttempt((n) => n + 1)} />
    </Suspense>
  );
}
