import React, { useCallback, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, PlayCircle } from 'lucide-react';
import { useAppLanguage } from '../../lib/language';
import { SUBJECTS, findLesson } from '../../curriculum/catalog';
import { LessonPlayer, type GameResult } from '../../curriculum/LessonPlayer';
import { Badge } from '../../components/ui/Badge';
import { CurriculumReportPanel } from '../components/CurriculumReportPanel';

/** Teacher workspace: the curriculum map and the lesson player in present mode (docs/curriculum/PLAN.md §7, B1–B2). */
export default function CurriculumPage() {
  const { lang } = useAppLanguage();
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{L('Curriculum', 'المنهج')}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {L('Open a lesson and present it in class.', 'افتح الدرس واعرضه في الحصة.')}
        </p>
      </header>
      {SUBJECTS.map((subject) => (
        <section key={subject.id} className="glass-2 rounded-[var(--r-3,20px)] p-5 space-y-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h2 className="font-display text-xl font-bold text-foreground">{ar ? subject.titleAr : subject.title}</h2>
            <span className="text-sm text-muted-foreground">
              {L(`Ages ${subject.audience} · ${subject.plan.length} lessons`, `من ${subject.audience} سنة · ${subject.plan.length} درس`)}
            </span>
          </div>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {subject.plan.map((title, i) => {
              const lesson = subject.lessons[i + 1];
              const body = (
                <>
                  <span className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${lesson ? 'bg-teal text-white' : 'bg-surface-subtle text-muted-foreground'}`}>{i + 1}</span>
                  <span dir="ltr" className="flex-1 min-w-0 truncate text-start">{title}</span>
                  {lesson ? <PlayCircle className="w-5 h-5 text-teal shrink-0" aria-hidden="true" /> : <Lock className="w-4 h-4 text-muted-foreground shrink-0" aria-label={L('Coming soon', 'قريباً')} />}
                </>
              );
              return (
                <li key={title}>
                  {lesson ? (
                    <Link to={`/dashboard/curriculum/${subject.id}/${i + 1}`} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 min-h-[44px] glass-1 hover:ring-2 hover:ring-teal/40 font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 min-h-[44px] text-muted-foreground">{body}</div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </div>
  );
}

export function CurriculumLessonPage() {
  const { subject, number } = useParams();
  const { lang } = useAppLanguage();
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const lesson = findLesson(subject, Number(number));
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [visited, setVisited] = useState<{ first: number; last: number }>({ first: 1, last: 1 });
  const onPageChange = useCallback((i: number) => setVisited((v) => ({ first: Math.min(v.first, i + 1), last: Math.max(v.last, i + 1) })), []);

  if (!lesson) return <Navigate to="/dashboard/curriculum" replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/dashboard/curriculum" className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {L('Curriculum', 'المنهج')}
        </Link>
        {!lesson.reviewed && <Badge variant="warning">{L('Draft · awaiting review', 'مسودة · مستنية المراجعة')}</Badge>}
      </div>
      <div dir="ltr" className="text-start">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">
          {lesson.subjectTitle} · Lesson {lesson.number} · {lesson.part}
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{lesson.title}</h1>
      </div>
      <LessonPlayer lesson={lesson} lang={ar ? 'ar' : 'en'} teacher onPageChange={onPageChange} onGameResult={(_page, r) => setGameResult(r)} />
      <CurriculumReportPanel lesson={lesson} lang={ar ? 'ar' : 'en'} firstPage={visited.first} lastPage={visited.last} gameResult={gameResult} />
    </div>
  );
}
