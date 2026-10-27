import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';

/** Shape returned by the API (server/curriculum/reports.ts buildStudentMap). */
export interface MapLesson {
  number: number;
  title: string;
  totalPages: number;
  coveredPages: number[];
  complete: boolean;
  available: boolean;
  strengths: string[];
  toReinforce: string[];
  lastNote: string | null;
  lastReportAt: string | null;
}
export interface MapSubject {
  id: string;
  title: string;
  titleAr: string;
  lessons: MapLesson[];
  coveredLessons: number;
}

interface Props {
  subject: MapSubject;
  lang: 'ar' | 'en';
  /** Link for a lesson the learner can review; omit to show the map without links (teacher view). */
  lessonHref?: (lesson: MapLesson) => string | null;
  /** false: only the strengths and notes, under a road map that already shows the lessons (student portal). */
  puzzle?: boolean;
}

/** The puzzle: one piece per planned lesson, filled by the pages the teacher reported (PLAN §4.1). */
export function StudentMap({ subject, lang, lessonHref, puzzle = true }: Props) {
  const ar = lang === 'ar';
  const L = (en: string, arText: string) => (ar ? arText : en);
  const started = subject.lessons.filter((l) => l.coveredPages.length > 0);
  const strengths = [...new Set(started.flatMap((l) => l.strengths))];
  const reinforce = [...new Set(started.flatMap((l) => l.toReinforce))].filter((o) => !strengths.includes(o));
  const done = subject.lessons.filter((l) => l.complete).length;

  if (!puzzle && started.length === 0) return null;
  return (
    <section className="glass-2 rounded-[var(--r-3,20px)] p-5 space-y-5">
      {puzzle && <>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold text-foreground">{ar ? subject.titleAr : subject.title}</h2>
        <p className="text-sm text-muted-foreground">
          {L(`${done} of ${subject.lessons.length} pieces complete`, `${done} من ${subject.lessons.length} قطعة اكتملت`)}
        </p>
      </div>

      <ol className="grid grid-cols-5 sm:grid-cols-8 lg:grid-cols-10 gap-1.5" aria-label={L('Curriculum puzzle', 'بازل المنهج')}>
        {subject.lessons.map((lesson) => {
          const share = lesson.totalPages ? lesson.coveredPages.length / lesson.totalPages : 0;
          const href = lessonHref?.(lesson) ?? null;
          const label = `${lesson.number}. ${lesson.title}: ${Math.round(share * 100)}%`;
          const piece = (
            <span className={`relative block aspect-square rounded-xl overflow-hidden border ${lesson.complete ? 'border-[var(--gold)]' : 'border-border'} bg-surface-subtle`}>
              <motion.span
                className={`absolute inset-x-0 bottom-0 ${lesson.complete ? 'bg-[var(--gold)]' : 'bg-teal/70'}`}
                initial={{ height: 0 }}
                animate={{ height: `${share * 100}%` }}
                transition={{ duration: 0.8, delay: lesson.number * 0.02 }}
              />
              <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${share > 0.5 ? 'text-white' : 'text-muted-foreground'}`}>
                {lesson.number}
              </span>
            </span>
          );
          return (
            <li key={lesson.number} title={label}>
              {href ? (
                <Link to={href} aria-label={label} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary hover:-translate-y-0.5 transition-transform">
                  {piece}
                </Link>
              ) : (
                <span aria-label={label}>{piece}</span>
              )}
            </li>
          );
        })}
      </ol>
      </>}

      {started.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {L('The puzzle fills up after each class, as your teacher adds the pages you covered.', 'البازل بيتملي بعد كل حصة، لما المعلم يضيف الصفحات اللي اتاخدت.')}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-2xl bg-teal/10 border border-teal/30 p-4">
            <h3 className="font-bold text-foreground mb-2">{L('Strong at', 'شاطر في')}</h3>
            {strengths.length ? (
              <ul dir="ltr" className="space-y-1 text-sm text-foreground list-disc ps-5">{strengths.map((s) => <li key={s}>{s}</li>)}</ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <div className="rounded-2xl bg-[var(--gold)]/10 border border-[var(--gold)]/40 p-4">
            <h3 className="font-bold text-foreground mb-2">{L('Let’s practise more', 'محتاجين نأكد على')}</h3>
            {reinforce.length ? (
              <ul dir="ltr" className="space-y-1 text-sm text-foreground list-disc ps-5">{reinforce.map((s) => <li key={s}>{s}</li>)}</ul>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
        </div>
      )}

      {started.length > 0 && (
        <ul className="space-y-2">
          {started.map((lesson) => {
            const href = lessonHref?.(lesson) ?? null;
            return (
              <li key={lesson.number} className="flex flex-wrap items-center gap-3 glass-1 rounded-2xl px-4 py-3">
                <span className="font-semibold text-foreground" dir="ltr">
                  {lesson.number}. {lesson.title}
                </span>
                <span className="text-sm text-muted-foreground">
                  {L(`${lesson.coveredPages.length}/${lesson.totalPages} pages`, `${lesson.coveredPages.length}/${lesson.totalPages} صفحة`)}
                </span>
                {lesson.lastNote && <span className="w-full text-sm text-muted-foreground" dir="auto">“{lesson.lastNote}”</span>}
                {href ? (
                  <Link to={href} className="ms-auto text-sm font-bold text-teal hover:underline">{L('Review', 'راجع')}</Link>
                ) : lessonHref && !lesson.available ? (
                  <span className="ms-auto inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3.5 h-3.5" /> {L('Being reviewed', 'تحت المراجعة')}
                  </span>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
