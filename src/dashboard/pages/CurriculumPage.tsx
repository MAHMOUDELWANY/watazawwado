import React, { useCallback, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ChevronRight, Lock, PlayCircle } from 'lucide-react';
import { useAppLanguage } from '../../lib/language';
import { SUBJECTS, GROUPS, tracksOf, groupOf, findLesson } from '../../curriculum/catalog';
import { LessonPlayer, type GameResult } from '../../curriculum/LessonPlayer';
import { Badge } from '../../components/ui/Badge';
import { CurriculumReportPanel } from '../components/CurriculumReportPanel';
import { Door, DOORS } from '../../curriculum/Door';

/* Teacher workspace: subjects, then their age versions, then the lessons by part, as arched doors (the homepage's door
   design), so a growing catalogue never becomes one long list (owner, 2026-10-22). The player is CurriculumLessonPage. */

const base = '/dashboard/curriculum';

function useL() {
  const { lang } = useAppLanguage();
  const ar = lang === 'ar';
  return { ar, L: (en: string, arText: string) => (ar ? arText : en) };
}

/** Where we are, as links back up the tree. */
function Crumbs({ items }: { items: { label: string; to?: string }[] }) {
  const { L } = useL();
  return (
    <nav aria-label={L('Breadcrumb', 'مسار التنقل')} className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground rtl:rotate-180" aria-hidden="true" />}
          {it.to ? (
            <Link to={it.to} className="text-teal hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{it.label}</Link>
          ) : (
            <span className="text-foreground" aria-current="page">{it.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

function PageHeader({ title, sub }: { title: string; sub: string }) {
  return (
    <header>
      <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{sub}</p>
    </header>
  );
}


/** Level 1: the subjects. */
export default function CurriculumPage() {
  const { ar, L } = useL();
  return (
    <div className="space-y-6">
      <PageHeader title={L('Curriculum', 'المنهج')} sub={L('Pick a subject, then the version for your learner\'s age.', 'اختار المادة، وبعدها النسخة اللي تناسب سن الطالب.')} />
      <ul className={DOORS}>
        {GROUPS.map((g, i) => {
          const tracks = tracksOf(g.id);
          const lessons = tracks.reduce((n, t) => n + t.plan.length, 0);
          const live = tracks.length > 0;
          return (
            <Door
              key={g.id} index={i} to={live ? `${base}/${g.id}` : undefined} art={g.art}
              title={ar ? g.titleAr : g.title} tagline={ar ? g.taglineAr : g.tagline}
              facts={live ? [L(`${tracks.length} versions`, `${tracks.length} نسخ`), L(`${lessons} lessons`, `${lessons} درس`)] : [L(`${g.planned.length} versions planned`, `${g.planned.length} نسخ في الخطة`)]}
              enter={L('Open', 'ادخل')} soon={live ? undefined : L('Coming soon', 'قريباً')}
            />
          );
        })}
      </ul>
    </div>
  );
}

/** Level 2: one subject's age versions, and the planned ones as coming-soon doors. */
export function CurriculumGroupPage() {
  const { group } = useParams();
  const { ar, L } = useL();
  const g = GROUPS.find((x) => x.id === group);
  const tracks = tracksOf(group);
  if (!g || !tracks.length) return <Navigate to={base} replace />;
  return (
    <div className="space-y-6">
      <Crumbs items={[{ label: L('Curriculum', 'المنهج'), to: base }, { label: ar ? g.titleAr : g.title }]} />
      <PageHeader title={ar ? g.titleAr : g.title} sub={ar ? g.taglineAr : g.tagline} />
      <ul className={DOORS}>
        {tracks.map((t, i) => (
          <Door
            key={t.id} index={i} to={`${base}/${g.id}/${t.id}`} art={t.art}
            title={ar ? t.versionAr : t.version} tagline={L(`Ages ${t.audience}`, `من ${t.audience} سنة`)}
            facts={[L(`${t.plan.length} lessons`, `${t.plan.length} درس`), L(`${t.parts.length} parts`, `${t.parts.length} أجزاء`), L(`${Object.keys(t.lessons).length} ready`, `${Object.keys(t.lessons).length} جاهز`)]}
            enter={L('Open', 'ادخل')}
          />
        ))}
        {g.planned.map((p, i) => (
          <Door key={p.version} index={tracks.length + i} title={ar ? p.versionAr : p.version}
            tagline={L(`Ages ${p.audience}`, `من ${p.audience} سنة`)} facts={[]} enter="" soon={L('Coming soon', 'قريباً')} />
        ))}
      </ul>
    </div>
  );
}

/** Level 3: one version's lessons, grouped by part. An old two-part lesson address (/curriculum/zad-kids/1) redirects. */
export function CurriculumTrackPage() {
  const { group, track } = useParams();
  const { ar, L } = useL();
  if (/^\d+$/.test(track ?? '')) {
    const g = groupOf(group);
    return <Navigate to={g ? `${base}/${g.id}/${group}/${track}` : base} replace />;
  }
  const g = GROUPS.find((x) => x.id === group);
  const t = SUBJECTS.find((x) => x.id === track && x.group === group);
  if (!g || !t) return <Navigate to={base} replace />;
  const ready = Object.keys(t.lessons).length;
  return (
    <div className="space-y-8">
      <Crumbs items={[{ label: L('Curriculum', 'المنهج'), to: base }, { label: ar ? g.titleAr : g.title, to: `${base}/${g.id}` }, { label: ar ? t.versionAr : t.version }]} />
      <header className="band-deep relative overflow-hidden rounded-[var(--r-3,20px)] p-6 sm:p-8">
        <img src={t.art} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="pointer-events-none absolute inset-y-0 end-0 h-full w-2/3 object-cover opacity-50 [mask-image:linear-gradient(to_left,#000_35%,transparent)] rtl:[mask-image:linear-gradient(to_right,#000_35%,transparent)]" />
        <div className="relative max-w-xl space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#F6D58E]">{ar ? g.titleAr : g.title} · {L(`Ages ${t.audience}`, `من ${t.audience} سنة`)}</p>
          <h1 className="font-display text-3xl sm:text-4xl font-bold">{ar ? t.titleAr : t.title}</h1>
          <p className="text-sm text-white/80">{L(`${t.plan.length} lessons in ${t.parts.length} parts · ${ready} ready to teach`, `${t.plan.length} درس في ${t.parts.length} أجزاء · ${ready} جاهز للشرح`)}</p>
          <div className="mt-3 h-2 w-full max-w-sm overflow-hidden rounded-full bg-white/15" role="progressbar" aria-valuemin={0} aria-valuemax={t.plan.length} aria-valuenow={ready} aria-label={L('Lessons ready', 'الدروس الجاهزة')}>
            <div className="h-full rounded-full bg-[#E5A93C]" style={{ width: `${Math.max(2, (ready / t.plan.length) * 100)}%` }} />
          </div>
        </div>
      </header>
      {t.parts.map((part, pi) => {
        const last = (t.parts[pi + 1]?.from ?? t.plan.length + 1) - 1;
        const numbers = Array.from({ length: last - part.from + 1 }, (_, k) => part.from + k);
        return (
          <section key={part.from} className="space-y-3" aria-labelledby={`part-${pi}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="arch-tile flex h-10 w-9 shrink-0 items-center justify-center bg-teal text-sm font-bold text-white">{pi + 1}</span>
              <h2 id={`part-${pi}`} className="font-display text-lg sm:text-xl font-bold text-foreground">{ar ? part.titleAr : part.title}</h2>
              <span className="text-xs font-semibold text-muted-foreground">{L(`Lessons ${part.from}–${last}`, `الدروس ${part.from}–${last}`)}</span>
            </div>
            <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {numbers.map((n) => {
                const lesson = t.lessons[n];
                const card = (
                  <>
                    <span className={`arch-tile flex h-12 w-11 shrink-0 items-center justify-center text-base font-bold ${lesson ? 'bg-crimson text-white' : 'bg-surface-subtle text-muted-foreground'}`}>{n}</span>
                    <span className="min-w-0 flex-1">
                      <span dir="ltr" className="block text-start font-semibold leading-snug text-foreground line-clamp-2">{t.plan[n - 1]}</span>
                      {lesson ? (
                        <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] font-bold ${lesson.reviewed ? 'bg-teal/15 text-teal' : 'bg-[#E5A93C]/20 text-[#8B4935]'}`}>
                          {lesson.reviewed ? L('Ready', 'جاهز') : L('Draft', 'مسودة')}
                        </span>
                      ) : (
                        <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground"><Lock className="h-3 w-3" aria-hidden="true" />{L('Coming soon', 'قريباً')}</span>
                      )}
                    </span>
                    {lesson && <PlayCircle className="h-6 w-6 shrink-0 text-teal transition-transform group-hover:scale-110" aria-hidden="true" />}
                  </>
                );
                return (
                  <li key={n}>
                    {lesson ? (
                      <Link to={`${base}/${g.id}/${t.id}/${n}`} className="group glass-1 flex min-h-[76px] items-center gap-3 rounded-2xl px-3 py-3 transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5 hover:ring-2 hover:ring-teal/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{card}</Link>
                    ) : (
                      <div className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-dashed border-border px-3 py-3 opacity-75">{card}</div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}
    </div>
  );
}

export function CurriculumLessonPage() {
  const { group, track, number } = useParams();
  const { ar, L } = useL();
  const lesson = findLesson(track, Number(number));
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [visited, setVisited] = useState<{ first: number; last: number }>({ first: 1, last: 1 });
  const onPageChange = useCallback((i: number) => setVisited((v) => ({ first: Math.min(v.first, i + 1), last: Math.max(v.last, i + 1) })), []);

  if (!lesson) return <Navigate to={base} replace />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Link to={`${base}/${group}/${track}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-teal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" /> {L('All lessons', 'كل الدروس')}
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
