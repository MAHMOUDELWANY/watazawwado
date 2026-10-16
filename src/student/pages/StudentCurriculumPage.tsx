import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, CalendarPlus } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { Button } from '../../components/ui/Button';
import { StudentMap, type MapSubject } from '../../curriculum/StudentMap';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { SUBJECTS, findLesson } from '../../curriculum/catalog';

interface CurriculumData {
  booked: boolean;
  learners: Array<{ id: string; name: string; map: MapSubject[] }>;
}

function useCurriculum() {
  const [data, setData] = useState<CurriculumData | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    authedJson<CurriculumData>('/api/student/curriculum').then(setData).catch((e) => setError(e?.message || 'Error'));
  }, []);
  return { data, error };
}

/** My curriculum: the puzzle per learner. Locked until the family has a booking (PLAN §4.2). */
export default function StudentCurriculumPage({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const { data, error } = useCurriculum();

  if (error) return <p className="text-sm text-crimson" role="alert">{error}</p>;
  if (!data) return <div className="flex justify-center py-16"><BrandSpinner size={28} /></div>;

  if (!data.booked) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{L('My curriculum', 'منهجي')}</h1>
        <section className="relative overflow-hidden glass-2 rounded-[var(--r-4,28px)] p-6 sm:p-8 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-teal/15 text-teal flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">{L('Your curriculum opens with your first lesson', 'منهجك بيتفتح مع أول حصة')}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {L(
              'Animated lessons, a game at the end of each one, and a puzzle that fills up after every class. Book a lesson to unlock it.',
              'دروس متحركة، ولعبة في آخر كل درس، وبازل بيكمل بعد كل حصة. احجز حصتك علشان يتفتح.'
            )}
          </p>
          <ol className="grid grid-cols-5 sm:grid-cols-10 gap-1.5 max-w-lg mx-auto opacity-60" aria-hidden="true">
            {SUBJECTS[0].plan.slice(0, 10).map((t, i) => (
              <li key={t} className="aspect-square rounded-xl bg-surface-subtle border border-border flex items-center justify-center text-xs font-bold text-muted-foreground">{i + 1}</li>
            ))}
          </ol>
          <Link to="/student/book">
            <Button><CalendarPlus className="w-4 h-4 me-2" /> {L('Book a lesson', 'احجز حصة')}</Button>
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{L('My curriculum', 'منهجي')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {L('Every class adds new pieces. Tap a piece to review what you learned.', 'كل حصة بتضيف قطع جديدة. دوس على القطعة علشان تراجع اللي اتعلمته.')}
        </p>
      </header>
      {data.learners.map((learner) => (
        <div key={learner.id} className="space-y-3">
          {data.learners.length > 1 && <h2 className="font-display text-lg font-bold text-foreground">{learner.name}</h2>}
          {learner.map.length === 0 ? (
            <p className="glass-1 rounded-2xl p-4 text-sm text-muted-foreground">
              {L('Your teacher will add the first pieces after your next class.', 'المعلم هيضيف أول القطع بعد الحصة الجاية.')}
            </p>
          ) : (
            learner.map.map((subject) => (
              <StudentMap
                key={subject.id}
                subject={subject}
                lang={lang}
                lessonHref={(l) => (l.available && l.coveredPages.length > 0 ? `/student/curriculum/${learner.id}/${subject.id}/${l.number}` : null)}
              />
            ))
          )}
        </div>
      ))}
    </div>
  );
}

/** Review mode: only the pages the teacher covered, and only lessons the owner has approved. */
export function StudentCurriculumLessonPage({ lang }: { lang: 'ar' | 'en' }) {
  const { learner, subject, number } = useParams();
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const { data, error } = useCurriculum();
  const lesson = findLesson(subject, Number(number));

  const covered = useMemo(() => {
    const map = data?.learners.find((l) => l.id === learner)?.map.find((s) => s.id === subject);
    return map?.lessons.find((l) => l.number === Number(number))?.coveredPages || [];
  }, [data, learner, subject, number]);

  if (error) return <p className="text-sm text-crimson" role="alert">{error}</p>;
  if (!data) return <div className="flex justify-center py-16"><BrandSpinner size={28} /></div>;
  if (!data.booked || !lesson || !lesson.reviewed || covered.length === 0) return <Navigate to="/student/curriculum" replace />;

  const reviewLesson = { ...lesson, chapters: [], pages: lesson.pages.filter((_, i) => covered.includes(i + 1)) };
  return (
    <div className="space-y-4">
      <Link to="/student/curriculum" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline">
        <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {L('My curriculum', 'منهجي')}
      </Link>
      <h1 dir="ltr" className="font-display text-2xl font-bold text-foreground text-start">{lesson.number}. {lesson.title}</h1>
      <LessonPlayer lesson={reviewLesson} lang={lang} />
    </div>
  );
}
