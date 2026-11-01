import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authedJson } from '../../lib/authedJson';
import { findLesson } from '../../curriculum/catalog';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { useLessonRoom } from '../../lib/lessonRoom';
import { BrandLoader } from '../../components/ui/BrandLoader';

/** NX-12, learner: the slides the teacher is showing, following each page live. */
export default function StudentLessonRoomPage({ lang = 'ar' }: { lang?: 'en' | 'ar' }) {
  const isAr = lang === 'ar';
  const { id = '' } = useParams();
  const [roomKey, setRoomKey] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const { connected, state } = useLessonRoom(roomKey, 'learner');
  const lesson = state ? findLesson(state.track, state.number) : undefined;

  useEffect(() => {
    authedJson<{ roomKey: string }>(`/api/student/lesson-room/${encodeURIComponent(id)}`).then((d) => setRoomKey(d.roomKey)).catch(() => setFailed(true));
  }, [id]);

  if (failed) {
    return <p role="alert" className="text-sm text-destructive">{isAr ? 'غرفة الحصة دي مش متاحة.' : 'This lesson room is not available.'}</p>;
  }
  return (
    <div className="space-y-4" data-testid="lesson-room-learner" data-room-page={state ? `${state.page}:${state.step}` : ''} dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-display font-bold text-foreground">{isAr ? 'غرفة الحصة' : 'Lesson room'}</h1>
        <span className={`text-xs font-semibold ${connected ? 'text-teal' : 'text-muted-foreground'}`} role="status">
          {connected ? (isAr ? 'متصل بالمعلم' : 'Connected to your teacher') : (isAr ? 'بيتصل…' : 'Connecting…')}
        </span>
      </div>
      {lesson && state ? (
        <LessonPlayer key={`${state.track}-${state.number}`} lesson={lesson} lang={lang} follow={{ page: state.page, step: state.step }} />
      ) : (
        <div className="py-16 grid justify-items-center gap-3 text-center">
          <BrandLoader size="md" />
          <p className="text-sm text-muted-foreground">{isAr ? 'أول ما المعلم يفتح الدرس هيظهر هنا. الفيديو زي ما هو على زووم.' : 'The lesson shows here as soon as your teacher opens it. Video stays on Zoom.'}</p>
        </div>
      )}
      <Link to="/student/lessons" className="text-sm text-teal underline underline-offset-4">{isAr ? 'حصصي' : 'My lessons'}</Link>
    </div>
  );
}
