import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../../lib/language';
import { SUBJECTS, findLesson } from '../../curriculum/catalog';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { Select } from '../../components/ui/Select';
import { BrandLoader } from '../../components/ui/BrandLoader';
import type { RoomInk, RoomState } from '../../lib/roomEvents';

/**
 * The NX-12 slide player inside the room's content layout. Teacher: pick a lesson and teach it; every page and build
 * step goes out on the channel (and is saved as a `slide` event for rejoin). `initial` is the slide from /state.
 */
export function TeacherCurriculum({ initial, publish, publishInk, save }: {
  initial?: RoomState;
  publish: (s: RoomState) => void;
  publishInk: (i: RoomInk) => void;
  save: (s: RoomState) => void;
}) {
  const { t, isAr } = useT();
  const tracks = useMemo(() => SUBJECTS.filter((s) => Object.keys(s.lessons).length > 0), []);
  const [track, setTrack] = useState(initial?.track && tracks.some((s) => s.id === initial.track) ? initial.track : tracks[0]?.id || '');
  const subject = SUBJECTS.find((s) => s.id === track);
  const numbers = useMemo(() => Object.keys(subject?.lessons || {}).map(Number).sort((a, b) => a - b), [subject]);
  const [number, setNumber] = useState(initial?.number ?? 1);
  const [page, setPage] = useState(0);
  // Rejoin: the player opens on the saved page once, then the teacher leads again.
  const [resume] = useState(() => (initial ? { page: initial.page, step: initial.step } : null));
  const lesson = findLesson(track, number);

  useEffect(() => { if (numbers.length && !numbers.includes(number)) setNumber(numbers[0]); }, [numbers, number]);

  const onPosition = useCallback((p: number, step: number) => {
    setPage(p);
    const s = { track, number, page: p, step };
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
            follow={resume && initial?.track === track && initial?.number === number ? resume : null} />
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
      <LessonPlayer key={`${state.track}-${state.number}`} lesson={lesson} lang={isAr ? 'ar' : 'en'} follow={{ page: state.page, step: state.step }} remoteInk={remoteInk} />
    </div>
  );
}
