import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, CalendarPlus, Sparkles } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { BrandSpinner } from '../../components/ui/BrandLoader';
import { Button } from '../../components/ui/Button';
import { ErrorState } from '../../components/ErrorState';
import { StudentMap, type MapSubject } from '../../curriculum/StudentMap';
import { LessonPlayer } from '../../curriculum/LessonPlayer';
import { SUBJECTS, findLesson, samples } from '../../curriculum/catalog';
import { Door, DOORS } from '../../curriculum/Door';

interface CurriculumData {
  booked: boolean;
  learners: Array<{ id: string; name: string; map: MapSubject[] }>;
}

function useCurriculum() {
  const [data, setData] = useState<CurriculumData | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setError('');
    authedJson<CurriculumData>('/api/student/curriculum').then(setData).catch((e) => setError(e?.message || 'Error'));
  }, [attempt]);
  return { data, error, retry: () => setAttempt((n) => n + 1) };
}

/** A taste of each version (Kids, Teens, Adults) as the curriculum's arched doors. A door opens the opening pages of
 *  Lesson 1; the sample stops behind a lock with a call to book (owner, 2026-10-23). */
function Samples({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const navigate = useNavigate();
  const list = samples();
  const [pick, setPick] = useState<number | null>(null);
  const current = pick === null ? undefined : list[pick];
  if (!list.length) return null;
  return (
    <section className="space-y-5" aria-labelledby="samples-title">
      <div className="text-center">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--copper)]">
          <Sparkles className="w-3.5 h-3.5" /> {L('Free samples', 'عيّنات مجانية')}
        </p>
        <h2 id="samples-title" className="font-display text-2xl sm:text-3xl font-bold text-foreground">{L('Step through a door', 'ادخل من باب')}</h2>
        <p className="text-sm text-muted-foreground mt-1 max-w-xl mx-auto">
          {L('The opening of the first Zad Essentials lesson, for each age. Watch it, then book to see the rest.', 'بداية أول درس من «أول الزاد» لكل سن. اتفرج، واحجز عشان تشوف الباقي.')}
        </p>
      </div>
      {current ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button type="button" onClick={() => setPick(null)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {L('All samples', 'كل العيّنات')}
            </button>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E5A93C]/15 px-3 py-1 text-xs font-bold text-[var(--copper)]">
              <Lock className="w-3.5 h-3.5" /> {L(`Sample · ${current.lesson.pages.length} of ${current.totalPages} pages`, `عيّنة · ${current.lesson.pages.length} من ${current.totalPages} صفحة`)}
            </span>
          </div>
          <h3 dir="ltr" className="font-display text-lg font-bold text-foreground text-start">{current.lesson.number}. {current.lesson.title}</h3>
          <LessonPlayer key={current.track.id} lesson={current.lesson} lang={lang}
            sample={{ totalPages: current.totalPages, teaser: ar ? current.teaserAr : current.teaser, onBook: () => navigate('/student/book') }} />
          <Link to="/student/book" className="block">
            <Button className="w-full"><CalendarPlus className="w-4 h-4 me-2" /> {L('Book a free trial to unlock the full lesson', 'احجز حصة تجريبية مجانية وافتح الدرس كله')}</Button>
          </Link>
        </div>
      ) : (
        <ul className={DOORS}>
          {list.map((s, i) => (
            <Door key={s.track.id} index={i} art={s.track.art} onOpen={() => setPick(i)}
              title={ar ? s.track.versionAr : s.track.version} tagline={L(`Ages ${s.track.audience}`, `من ${s.track.audience} سنة`)}
              facts={[ar ? s.teaserAr : s.teaser]} enter={L('Watch the sample', 'اتفرج على العيّنة')} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** My curriculum: the puzzle per learner. Locked until the family has a booking (PLAN §4.2). */
export default function StudentCurriculumPage({ lang }: { lang: 'ar' | 'en' }) {
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const { data, error, retry } = useCurriculum();

  if (error) return <ErrorState isAr={ar} message={L("Couldn't load your curriculum.", 'تعذر تحميل منهجك.')} onRetry={retry} />;
  if (!data) return <div className="flex justify-center py-16"><BrandSpinner size={28} /></div>;

  if (!data.booked) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{L('My curriculum', 'منهجي')}</h1>
        <Samples lang={lang} />
        <div className="glass-2 rounded-[var(--r-4,28px)] p-6 text-center space-y-3">
          <h3 className="font-display text-lg font-bold text-foreground">{L('Like what you saw?', 'عجبك اللي شفته؟')}</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            {L(
              'Book a free trial lesson and your teacher will finish the story with you, then play the game at the end.',
              'احجز حصة تجريبية مجانية، والمعلم هيكمل معاك القصة وتلعبوا لعبة آخر الدرس.'
            )}
          </p>
          <Link to="/student/book">
            <Button><CalendarPlus className="w-4 h-4 me-2" /> {L('Book a free trial', 'احجز حصة تجريبية مجانية')}</Button>
          </Link>
        </div>
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
      <Samples lang={lang} />
    </div>
  );
}

/** Review mode: only the pages the teacher covered, and only lessons the owner has approved. */
export function StudentCurriculumLessonPage({ lang }: { lang: 'ar' | 'en' }) {
  const { learner, subject, number } = useParams();
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const { data, error, retry } = useCurriculum();
  const lesson = findLesson(subject, Number(number));

  const covered = useMemo(() => {
    const map = data?.learners.find((l) => l.id === learner)?.map.find((s) => s.id === subject);
    return map?.lessons.find((l) => l.number === Number(number))?.coveredPages || [];
  }, [data, learner, subject, number]);

  if (error) return <ErrorState isAr={ar} message={L("Couldn't load this lesson.", 'تعذر تحميل الدرس ده.')} onRetry={retry} />;
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
