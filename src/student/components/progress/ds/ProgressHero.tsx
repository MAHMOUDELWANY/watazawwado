import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { LevelDial } from './LevelDial';
import { AchievementEmblem } from '../../achievements/AchievementEmblems';
import type { AgeGroup, EmblemId } from '../../achievements/achievements';
import type { SubjectProgressModel } from '../../../pages/StudentProgressPage';

/**
 * The top of the progress page (docs/design/PROGRESS.md): a mihrab arch on the khatam field holding the level dial,
 * one sentence on where the learner is, and three medallions (lessons, weeks in a row, badges) drawn from the badge art.
 * Words follow the viewer: a child is greeted by name, an adult reads it plainly, a parent reads it about the child.
 */
export function ProgressHero({ subject, learnerName, isSelf, ageGroup, isAr, lessonsTotal, rhythmCurrent, rhythmLongest, badgesEarned, badgesTotal, onBadges }: {
  subject: SubjectProgressModel | null;
  learnerName: string;
  isSelf: boolean;
  ageGroup: AgeGroup;
  isAr: boolean;
  lessonsTotal: number;
  rhythmCurrent: number;
  rhythmLongest: number;
  badgesEarned: number;
  badgesTotal: number;
  onBadges: () => void;
}) {
  const reduce = useReducedMotion();
  const num = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const levels = subject ? (subject.levels.length ? subject.levels : [subject.currentLevel]) : [];
  const idx = subject ? Math.min(subject.currentLevelIndex, Math.max(0, levels.length - 1)) : 0;
  const levelName = subject ? (isAr ? subject.currentLevel.ar : subject.currentLevel.en) : '';
  const subjectName = subject ? (isAr ? subject.subjectMeta.ar : subject.subjectMeta.en) : '';
  const kid = ageGroup === 'kids';

  const eyebrow = subjectName;
  const headline = !isSelf
    ? (isAr ? `${learnerName} في ${levelName}` : `${learnerName} is on ${levelName}`)
    : kid
      ? (isAr ? `أهلًا يا ${learnerName}!` : `Hello, ${learnerName}!`)
      : (isAr ? `أنت في ${levelName}` : `You are on ${levelName}`);
  const line = !isSelf
    ? (isAr ? `المستوى ${num(idx + 1)} من ${num(levels.length)}. كل مستوى يكتمل يصير وسامًا على رفّه.` : `Level ${idx + 1} of ${levels.length}. Each level finished becomes a badge on the shelf.`)
    : kid
      ? (isAr ? `أنت في ${levelName}. كل حصة تقرّبك من الوسام القادم.` : `You are on ${levelName}. Every lesson brings the next badge closer.`)
      : (isAr ? `المستوى ${num(idx + 1)} من ${num(levels.length)}. كل مستوى يكتمل يصير وسامًا على رفّك.` : `Level ${idx + 1} of ${levels.length}. Each level you finish becomes a badge on your shelf.`);

  const medals: Array<{ id: EmblemId; value: number; label: string; earned: boolean; onClick?: () => void; testid: string }> = [
    { id: 'lessons-25', value: lessonsTotal, label: isAr ? 'حصة' : lessonsTotal === 1 ? 'lesson' : 'lessons', earned: lessonsTotal > 0, testid: 'hero-lessons' },
    { id: 'rhythm-12', value: rhythmCurrent || rhythmLongest, label: rhythmCurrent ? (isAr ? 'أسابيع متتالية' : 'weeks in a row') : (isAr ? 'أطول إيقاع' : 'longest run'), earned: (rhythmCurrent || rhythmLongest) > 0, testid: 'hero-rhythm' },
    { id: 'juz', value: badgesEarned, label: isAr ? `وسامًا من ${num(badgesTotal)}` : `of ${badgesTotal} badges`, earned: badgesEarned > 0, onClick: onBadges, testid: 'hero-badges' },
  ];

  return (
    <section
      className="progress-arch khatam-field relative overflow-hidden border border-[#E5A93C]/30 bg-surface-warm px-5 pt-12 pb-6 sm:px-8 md:pt-8 shadow-[var(--shadow-2)]"
      aria-label={isAr ? 'أين أنت الآن' : 'Where you are now'}
      data-testid="progress-hero"
    >
      <div className="relative grid gap-6 md:grid-cols-[auto_minmax(0,1fr)] md:items-center md:gap-10">
        <div className="justify-self-center">
          <LevelDial total={levels.length || 1} current={idx} isAr={isAr} size={kid ? 210 : 190}
            label={isAr ? `المستوى ${num(idx + 1)} من ${num(levels.length || 1)}` : `Level ${idx + 1} of ${levels.length || 1}`} />
        </div>
        <div className="grid gap-4 min-w-0 text-center md:text-start">
          <div className="grid gap-1.5">
            {eyebrow && <p className="text-sm font-bold text-crimson">{eyebrow}</p>}
            <h2 className="font-display text-2xl sm:text-3xl font-bold leading-tight text-foreground text-balance" data-testid="progress-hero-headline">{headline}</h2>
            <p className="text-muted-foreground leading-relaxed max-w-prose md:mx-0 mx-auto">{line}</p>
          </div>
          <ul className="grid grid-cols-3 gap-2 sm:gap-3">
            {medals.map((m, i) => {
              const inner = (
                <>
                  <AchievementEmblem id={m.id} earned={m.earned} isAr={isAr} className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16" />
                  <span className="font-display text-xl sm:text-2xl font-bold leading-none tabular-nums text-foreground">{num(m.value)}</span>
                  <span className="text-[11px] sm:text-xs leading-tight text-muted-foreground">{m.label}</span>
                </>
              );
              const cls = 'w-full h-full grid justify-items-center content-start gap-1 rounded-2xl bg-surface/70 dark:bg-surface/50 border border-border/60 px-1.5 py-3';
              return (
                <motion.li key={m.testid} data-testid={m.testid}
                  initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42, delay: 0.25 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}>
                  {m.onClick
                    ? <button type="button" onClick={m.onClick} className={`${cls} cursor-pointer hover:border-[#E5A93C]/60 focus-ring`} aria-label={isAr ? `${num(m.value)} ${m.label}، اعرض الأوسمة` : `${m.value} ${m.label}, show the badges`}>{inner}</button>
                    : <div className={cls}>{inner}</div>}
                </motion.li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
