import React, { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { Check, Flag } from 'lucide-react';
import type { SubjectProgressModel } from '../../pages/StudentProgressPage';
import { MilestoneEmblemByKind, KhatamStarMilestoneEmblem } from '../../pages/StudentProgressPage';
import { TeacherNote, NextLessonAction, rhythmText } from './progressShared';

/**
 * Progress for children (look A, owner 2026-10-28): a winding road from the start to the end of the subject.
 * Finished levels and milestones sit behind, a star marks "you are here", the next stops wait ahead.
 */

type Stop = {
  key: string;
  state: 'done' | 'now' | 'next' | 'goal';
  title: string;
  sub?: string;
  milestoneKind?: string;
  levelState?: 'completed' | 'current' | 'future';
};

const ROW = 84;

export function ProgressRoad({ subject, learnerName, tz, isAr }: {
  subject: SubjectProgressModel;
  learnerName: string;
  tz: string;
  isAr: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const nowRef = useRef<HTMLDivElement | null>(null);
  const levels = subject.levels.length ? subject.levels : [subject.currentLevel];
  const idx = Math.min(subject.currentLevelIndex, levels.length - 1);
  const name = (l: { ar: string; en: string }) => (isAr ? l.ar : l.en);

  const milestones = [...subject.milestones]
    .filter((m) => m.kind !== 'level_completed')
    .sort((a, b) => a.reached_at.localeCompare(b.reached_at))
    .slice(-4);

  const stops: Stop[] = [
    ...levels.slice(0, idx).map((l): Stop => ({ key: `lv-${l.id}`, state: 'done', title: name(l), sub: isAr ? 'خلص' : 'Finished', levelState: 'completed' })),
    ...milestones.map((m): Stop => ({ key: `ms-${m.id}`, state: 'done', title: isAr ? m.title_ar : m.title_en, milestoneKind: m.kind })),
    { key: `lv-${levels[idx].id}`, state: 'now', title: name(levels[idx]), sub: isAr ? 'انت هنا' : 'You are here', levelState: 'current' },
    ...levels.slice(idx + 1).map((l): Stop => ({ key: `lv-${l.id}`, state: 'next', title: name(l), levelState: 'future' })),
    { key: 'goal', state: 'goal', title: isAr ? `آخر ${subject.subjectMeta.ar}` : `End of ${subject.subjectMeta.en}` },
  ];
  const nowIndex = stops.findIndex((s) => s.state === 'now');

  // Alternate sides; x is a percentage from the inline start.
  const xOf = (i: number) => (i % 2 === 0 ? 24 : 76);
  const yOf = (i: number) => ROW / 2 + i * ROW;
  const height = stops.length * ROW;
  const segment = (from: number, to: number) =>
    Array.from({ length: to - from }, (_, k) => {
      const i = from + k;
      return `${k === 0 ? `M ${xOf(i)} ${yOf(i)} ` : ''}C ${xOf(i)} ${yOf(i) + ROW / 2}, ${xOf(i + 1)} ${yOf(i + 1) - ROW / 2}, ${xOf(i + 1)} ${yOf(i + 1)}`;
    }).join(' ');

  useEffect(() => {
    const t = window.setTimeout(() => nowRef.current?.scrollIntoView?.({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' }), 200);
    return () => window.clearTimeout(t);
  }, [subject.subject, reduceMotion]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start" data-testid="progress-road">
      <section className="rounded-3xl bg-surface border border-border p-4 sm:p-5 grid gap-3 min-w-0" aria-label={isAr ? 'طريقك' : 'Your road'}>
        <div className="grid gap-1">
          <p className="font-display text-2xl text-foreground text-balance">
            {isAr ? `طريق ${learnerName} في ${subject.subjectMeta.ar}` : `${learnerName}'s road in ${subject.subjectMeta.en}`}
          </p>
          <p className="text-sm text-muted-foreground">{isAr ? 'زادك الله علمًا ونورًا' : 'May Allah increase you in knowledge and light'}</p>
        </div>

        <div className="relative" style={{ height }} data-testid="learning-path-nodes">
          <svg className="absolute inset-0 w-full h-full rtl:-scale-x-100" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden="true">
            <path d={segment(0, stops.length - 1)} fill="none" stroke="var(--color-border)" strokeWidth="10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            {nowIndex > 0 && (
              <path d={segment(0, nowIndex)} fill="none" stroke="var(--color-teal)" strokeWidth="10" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            )}
          </svg>
          <ol className="absolute inset-0">
            {stops.map((s, i) => {
              const startSide = i % 2 === 0;
              return (
                <li
                  key={s.key}
                  ref={s.state === 'now' ? (nowRef as any) : undefined}
                  className="absolute inset-x-0"
                  style={{ top: i * ROW, height: ROW }}
                  data-level-state={s.levelState}
                  data-current-level={s.state === 'now' ? 'true' : undefined}
                  aria-current={s.state === 'now' ? 'step' : undefined}
                >
                  <span
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rtl:translate-x-1/2 grid place-items-center"
                    style={{ insetInlineStart: `${xOf(i)}%` }}
                  >
                    {s.state === 'done' && s.milestoneKind ? (
                      <span data-testid="path-milestone-emblem" className="grid place-items-center w-11 h-11 rounded-full bg-surface ring-2 ring-teal">
                        <MilestoneEmblemByKind kind={s.milestoneKind as any} className="w-8 h-8" />
                      </span>
                    ) : s.state === 'done' ? (
                      <span className="grid place-items-center w-10 h-10 rounded-full bg-teal text-white"><Check className="w-5 h-5" strokeWidth={3} aria-hidden="true" /></span>
                    ) : s.state === 'now' ? (
                      <span className={`grid place-items-center w-14 h-14 rounded-full bg-gold/25 ring-4 ring-gold ${reduceMotion ? '' : 'animate-pulse'}`}>
                        <KhatamStarMilestoneEmblem className="w-10 h-10" />
                      </span>
                    ) : s.state === 'goal' ? (
                      <span className="grid place-items-center w-11 h-11 rounded-full bg-[#0A2E35] text-white"><Flag className="w-5 h-5" aria-hidden="true" /></span>
                    ) : (
                      <span className="w-9 h-9 rounded-full bg-surface border-2 border-dashed border-border" />
                    )}
                  </span>
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 grid ${startSide ? 'text-start' : 'text-end'}`}
                    style={startSide ? { insetInlineStart: '40%', insetInlineEnd: 0 } : { insetInlineStart: 0, insetInlineEnd: '40%' }}
                  >
                    <span className={`text-sm leading-snug ${s.state === 'now' ? 'font-bold text-foreground' : s.state === 'next' ? 'text-muted-foreground' : 'font-semibold text-foreground'}`}>{s.title}</span>
                    {s.sub && <span className={`text-xs ${s.state === 'now' ? 'font-semibold text-[#B9782A] dark:text-gold' : 'text-muted-foreground'}`}>{s.sub}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <div className="grid gap-4 min-w-0">
        <div className="flex flex-wrap gap-2" data-testid="progress-stats">
          <span className="rounded-full bg-teal/10 text-teal px-3.5 py-1.5 text-sm font-semibold">
            {isAr ? `${subject.lessonsAttended.total.toLocaleString('ar-EG')} حصة` : `${subject.lessonsAttended.total} lessons`}
          </span>
          <span className="rounded-full bg-gold/20 text-foreground px-3.5 py-1.5 text-sm font-semibold">
            {rhythmText(subject.weeklyRhythm.current, subject.weeklyRhythm.longest, isAr)}
          </span>
        </div>
        <TeacherNote note={subject.familySummaries[0]} tz={tz} isAr={isAr} />
        <NextLessonAction subject={subject} tz={tz} isAr={isAr} />
      </div>
    </div>
  );
}
