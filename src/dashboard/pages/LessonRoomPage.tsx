import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Radio } from 'lucide-react';
import { useT } from '../../lib/language';
import { dashboardFetch } from '../lib/dashboardApi';
import { SUBJECTS, findLesson } from '../../curriculum/catalog';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { useLessonRoom } from '../../lib/lessonRoom';
import { Select } from '../../components/ui/Select';
import { Badge } from '../../components/ui/Badge';

/** NX-12, teacher: pick a lesson, teach it; the learner's screen follows every page and build step. */
export default function LessonRoomPage() {
  const { t, isAr } = useT();
  const { id = '' } = useParams();
  const [room, setRoom] = useState<{ roomKey: string; learnerName: string | null } | null>(null);
  const [failed, setFailed] = useState('');
  const tracks = useMemo(() => SUBJECTS.filter((s) => Object.keys(s.lessons).length > 0), []);
  const [track, setTrack] = useState(tracks[0]?.id || '');
  const numbers = useMemo(() => Object.keys(SUBJECTS.find((s) => s.id === track)?.lessons || {}).map(Number).sort((a, b) => a - b), [track]);
  const [number, setNumber] = useState(1);
  const lesson = findLesson(track, number);
  const { connected, publish } = useLessonRoom(room?.roomKey || null, 'teacher');

  useEffect(() => {
    dashboardFetch<{ roomKey: string; learnerName: string | null }>(`/api/dashboard/lesson-room/${id}`).then(setRoom).catch((e) => setFailed(e?.message || 'error'));
  }, [id]);
  useEffect(() => { if (!numbers.includes(number)) setNumber(numbers[0] || 1); }, [numbers, number]);

  const onPosition = useCallback((page: number, step: number) => publish({ track, number, page, step }), [publish, track, number]);

  if (failed) return <p role="alert" className="text-sm text-destructive">{t('This lesson room is not available.', 'غرفة الحصة دي مش متاحة.')} {failed}</p>;

  return (
    <div className="space-y-4" data-testid="lesson-room-teacher">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">{t('Lesson room', 'غرفة الحصة')}{room?.learnerName ? ` · ${room.learnerName}` : ''}</h1>
          <p className="text-sm text-muted-foreground">{t('The learner sees what you show. Video stays on Zoom.', 'الطالب بيشوف اللي بتعرضه. الفيديو زي ما هو على زووم.')}</p>
        </div>
        <Badge variant={connected ? 'success' : 'warning'} className="gap-1"><Radio className="w-3.5 h-3.5" aria-hidden="true" />{connected ? t('Live', 'متصل') : t('Connecting…', 'بيتصل…')}</Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 max-w-xl">
        <Select aria-label={t('Curriculum', 'المنهج')} value={track} onChange={(e) => setTrack(e.target.value)}>
          {tracks.map((s) => <option key={s.id} value={s.id}>{isAr ? `${s.titleAr} · ${s.versionAr}` : `${s.title} · ${s.version}`}</option>)}
        </Select>
        <Select aria-label={t('Lesson', 'الدرس')} value={number} onChange={(e) => setNumber(Number(e.target.value))}>
          {numbers.map((n) => <option key={n} value={n}>{t(`Lesson ${n}`, `الدرس ${n}`)}{SUBJECTS.find((s) => s.id === track)?.lessons[n]?.title ? ` · ${isAr ? SUBJECTS.find((s) => s.id === track)!.lessons[n].titleAr : SUBJECTS.find((s) => s.id === track)!.lessons[n].title}` : ''}</option>)}
        </Select>
      </div>
      {lesson && <LessonPlayer key={`${track}-${number}`} lesson={lesson} lang={isAr ? 'ar' : 'en'} teacher onPosition={onPosition} />}
      <Link to="/dashboard" className="text-sm text-teal underline underline-offset-4">{t('Back', 'رجوع')}</Link>
    </div>
  );
}
