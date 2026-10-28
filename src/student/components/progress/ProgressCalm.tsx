import React from 'react';
import type { SubjectProgressModel } from '../../pages/StudentProgressPage';
import { MilestoneEmblemByKind } from '../../pages/StudentProgressPage';
import { TeacherNote, NextLessonAction, rhythmText, formatDay } from './progressShared';

/**
 * Progress for adults and parents (look B, owner 2026-10-28): one sentence on where the learner is,
 * the level bar, three numbers, the teacher's latest note and one action. Readable in five seconds.
 */
export function ProgressCalm({ subject, learnerName, isSelf, tz, isAr }: {
  subject: SubjectProgressModel;
  learnerName: string;
  isSelf: boolean;
  tz: string;
  isAr: boolean;
}) {
  const levels = subject.levels.length ? subject.levels : [subject.currentLevel];
  const idx = Math.min(subject.currentLevelIndex, levels.length - 1);
  const levelName = isAr ? subject.currentLevel.ar : subject.currentLevel.en;
  const subjectName = isAr ? subject.subjectMeta.ar : subject.subjectMeta.en;
  const who = isSelf ? (isAr ? 'انت' : 'You are') : isAr ? learnerName : `${learnerName} is`;
  const milestones = [...subject.milestones].sort((a, b) => b.reached_at.localeCompare(a.reached_at)).slice(0, 3);

  const stats = [
    { value: subject.lessonsAttended.total, label: isAr ? 'حصة لحد دلوقتي' : 'lessons so far' },
    { value: subject.lessonsAttended.thisMonth, label: isAr ? 'الشهر ده' : 'this month' },
    subject.weeklyRhythm.current > 0
      ? { value: subject.weeklyRhythm.current, label: isAr ? 'أسابيع ورا بعض' : 'weeks in a row' }
      : { value: 0, label: rhythmText(0, subject.weeklyRhythm.longest, isAr), raw: true },
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)] lg:items-start" data-testid="progress-calm">
      <div className="grid gap-4 min-w-0">
        <section className="rounded-2xl bg-surface border border-border p-5 grid gap-4" aria-label={isAr ? 'المستوى' : 'Level'}>
          <p className="font-display text-2xl leading-snug text-foreground text-balance" data-testid="progress-headline">
            {isAr
              ? <>{who} في <span className="text-teal">{levelName}</span> من {levels.length.toLocaleString('ar-EG')} في {subjectName}.</>
              : <>{who} on <span className="text-teal">{levelName}</span> of {levels.length} in {subjectName}.</>}
          </p>
          {(isAr ? subject.currentLevel.descAr : subject.currentLevel.descEn) && (
            <p className="text-sm text-muted-foreground">{isAr ? subject.currentLevel.descAr : subject.currentLevel.descEn}</p>
          )}
          <div className="grid gap-1.5">
            <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))` }}>
              {levels.map((lvl, i) => (
                <span
                  key={lvl.id}
                  data-level-state={i < idx ? 'completed' : i === idx ? 'current' : 'future'}
                  className={`h-2.5 rounded-full ${i < idx ? 'bg-teal' : i === idx ? 'bg-teal/35 ring-2 ring-teal' : 'bg-border'}`}
                />
              ))}
            </div>
            <div className="grid gap-1.5 text-xs text-muted-foreground" style={{ gridTemplateColumns: `repeat(${levels.length}, minmax(0, 1fr))` }}>
              {levels.map((lvl, i) => (
                <span key={lvl.id} className={`truncate ${i === idx ? 'font-semibold text-foreground' : ''}`}>{isAr ? lvl.ar : lvl.en}</span>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-3 gap-2" data-testid="progress-stats">
          {stats.map((s, i) => (
            <div key={i} className="rounded-2xl bg-surface-subtle p-3 grid gap-0.5 content-start">
              {s.raw
                ? <span className="text-sm font-semibold text-foreground leading-snug">{s.label}</span>
                : <>
                    <span className="font-display text-2xl text-foreground tabular-nums">{isAr ? s.value.toLocaleString('ar-EG') : s.value}</span>
                    <span className="text-xs text-muted-foreground">{s.label}</span>
                  </>}
            </div>
          ))}
        </div>

        <TeacherNote note={subject.familySummaries[0]} tz={tz} isAr={isAr} />
      </div>

      <div className="grid gap-4 min-w-0">
        <NextLessonAction subject={subject} tz={tz} isAr={isAr} />
        {milestones.length > 0 && (
          <section className="rounded-2xl bg-surface border border-border p-4 grid gap-3" aria-label={isAr ? 'آخر المحطات' : 'Latest milestones'}>
            <h3 className="text-sm font-semibold text-foreground">{isAr ? 'آخر المحطات' : 'Latest milestones'}</h3>
            <ul className="grid gap-2.5">
              {milestones.map((m) => (
                <li key={m.id} className="flex items-center gap-3" data-testid="path-milestone-emblem">
                  <MilestoneEmblemByKind kind={m.kind} className="w-8 h-8 shrink-0" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">{isAr ? m.title_ar : m.title_en}</span>
                    <span className="block text-xs text-muted-foreground">{formatDay(m.reached_at, tz, isAr)}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
