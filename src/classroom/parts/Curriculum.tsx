import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../lib/language';
import { SUBJECTS, findLesson } from '../../curriculum/catalog';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { Select } from '../../components/ui/Select';
import { BrandLoader } from '../../components/ui/BrandLoader';
import type { RoomInk, RoomState } from '../../lib/roomEvents';

/** Booking service -> curriculum group in the catalog. Services with no curriculum yet map to nothing. */
const SERVICE_GROUP: Record<string, string> = {
  'quran-reading': 'quran', tajweed: 'quran', 'quran-memorization': 'quran', 'quran-revision': 'quran',
  'zad-essentials': 'zad-essentials', seerah: 'seerah', 'modern-standard-arabic': 'fusha', 'egyptian-arabic': 'egyptian',
  english: 'english', 'arabic-foundations': 'literacy',
};

export type CurriculumStart = { serviceId: string | null; learnerType: 'child' | 'adult' | null; lastReport: { track: string; number: number; page: number } | null };

/**
 * Where the teacher's slides open: a rejoin's saved slide; else where this learner stopped (last lesson report);
 * else lesson 1 of the booked subject, in the kids version for a child and a grown-up version otherwise.
 */
export function startingLesson(tracks: { id: string; group: string; lessons: Record<number, unknown> }[], initial: RoomState | undefined, start: CurriculumStart | undefined): { track: string; number: number; page: number } | null {
  const has = (id: string | undefined) => !!id && tracks.some((t) => t.id === id);
  if (initial && has(initial.track)) return { track: initial.track, number: initial.number, page: initial.page };
  const last = start?.lastReport;
  if (last && has(last.track)) return { track: last.track, number: last.number, page: last.page };
  const group = start?.serviceId ? SERVICE_GROUP[start.serviceId] : undefined;
  const inGroup = tracks.filter((t) => t.group === group);
  if (!inGroup.length) return null;
  const kid = start?.learnerType === 'child';
  const pick = inGroup.find((t) => /kids/.test(t.id) === kid) || inGroup[0];
  const first = Object.keys(pick.lessons).map(Number).sort((a, b) => a - b)[0] ?? 1;
  return { track: pick.id, number: first, page: 0 };
}

/**
 * The NX-12 slide player inside the room's content layout. Teacher: pick a lesson and teach it; every page and build
 * step goes out on the channel (and is saved as a `slide` event for rejoin). `initial` is the slide from /state.
 */
export function TeacherCurriculum({ initial, start, publish, publishInk, save }: {
  initial?: RoomState;
  start?: CurriculumStart;
  publish: (s: RoomState) => void;
  publishInk: (i: RoomInk) => void;
  save: (s: RoomState) => void;
}) {
  const { t, isAr } = useT();
  const tracks = useMemo(() => SUBJECTS.filter((s) => Object.keys(s.lessons).length > 0), []);
  const [opening] = useState(() => startingLesson(tracks, initial, start));
  const [track, setTrack] = useState(opening?.track || tracks[0]?.id || '');
  const subject = SUBJECTS.find((s) => s.id === track);
  const numbers = useMemo(() => Object.keys(subject?.lessons || {}).map(Number).sort((a, b) => a - b), [subject]);
  const [number, setNumber] = useState(opening?.number ?? 1);
  const [page, setPage] = useState(0);
  // Rejoin or the learner's last report: the player opens on that page once, then the teacher leads again.
  const [resume] = useState(() => (opening ? { page: opening.page, step: initial && initial.track === opening.track ? initial.step : 0 } : null));
  const lesson = findLesson(track, number);

  useEffect(() => { if (numbers.length && !numbers.includes(number)) setNumber(numbers[0]); }, [numbers, number]);

  const onPosition = useCallback((p: number, step: number, opening: boolean) => {
    setPage(p);
    // The opening goes out too, so the learner meets the characters with the teacher.
    const s = { track, number, page: p, step, ...(opening ? { opening } : {}) };
    publish(s);
    save(s);
  }, [publish, save, track, number]);
  const onInk = useCallback((ink: { strokes: any[]; laser: [number, number][] }) => publishInk({ track, number, page, ...ink }), [publishInk, track, number, page]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="grid shrink-0 gap-2 sm:grid-cols-2">
        <Select aria-label={t('Curriculum', 'المنهج')} value={track} onChange={(e) => setTrack(e.target.value)}>
          {tracks.map((s) => <option key={s.id} value={s.id}>{isAr ? `${s.titleAr} · ${s.versionAr}` : `${s.title} · ${s.version}`}</option>)}
        </Select>
        <Select aria-label={t('Lesson', 'الدرس')} value={number} onChange={(e) => setNumber(Number(e.target.value))}>
          {numbers.map((n) => {
            const l = subject?.lessons[n];
            return <option key={n} value={n}>{t(`Lesson ${n}`, `الدرس ${n}`)}{l?.title ? ` · ${isAr ? l.titleAr : l.title}` : ''}</option>;
          })}
        </Select>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        {lesson && (
          <LessonPlayer key={`${track}-${number}`} lesson={lesson} lang={isAr ? 'ar' : 'en'} teacher onPosition={onPosition} onInk={onInk}
            follow={resume && opening?.track === track && opening?.number === number ? resume : null} />
        )}
      </div>
    </div>
  );
}

/** Learner (and observers): the slides the teacher shows, following each page live. */
export function LearnerCurriculum({ state, ink }: { state: RoomState | null; ink: RoomInk | null }) {
  const { t, isAr } = useT();
  const lesson = state ? findLesson(state.track, state.number) : undefined;
  // Ink belongs to one page; drop it the moment the teacher's position moves elsewhere.
  const remoteInk = ink && state && ink.track === state.track && ink.number === state.number && ink.page === state.page ? ink : null;
  if (!lesson || !state) {
    return (
      <div className="grid h-full place-items-center p-6 text-center">
        <div className="grid justify-items-center gap-3">
          <BrandLoader size="md" />
          <p className="max-w-xs text-sm text-muted-foreground">{t('The lesson shows here as soon as your teacher opens it.', 'الدرس هيظهر هنا أول ما المعلم يفتحه.')}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full min-h-0 overflow-auto" data-room-page={`${state.page}:${state.step}`}>
      <LessonPlayer key={`${state.track}-${state.number}`} lesson={lesson} lang={isAr ? 'ar' : 'en'} follow={{ page: state.page, step: state.step, opening: state.opening }} remoteInk={remoteInk} />
    </div>
  );
}
