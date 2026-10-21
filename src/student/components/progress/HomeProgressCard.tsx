import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { authedJson } from '../../../lib/authedJson';
import { useActiveLearner } from '../../activeLearner';
import { RhythmLanternEmblem, MilestoneEmblemByKind, type ProgressApiResponse } from '../../pages/StudentProgressPage';

/** PR-10: a compact view of progress on the home page (rhythm, current level, newest milestone) that opens the page. */
export function HomeProgressCard({ isAr }: { isAr: boolean }) {
  const { activeId } = useActiveLearner();
  const [data, setData] = useState<ProgressApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    const q = activeId ? `?learnerId=${encodeURIComponent(activeId)}` : '';
    authedJson<ProgressApiResponse>(`/api/student/progress${q}`)
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => { if (!cancelled) setData(null); }); // the card simply stays away; the page has its own error state
    return () => { cancelled = true; };
  }, [activeId]);

  if (!data?.learner) return null;
  const subject = data.subjects?.[0] || null;
  const newest = (data.subjects || []).flatMap((s) => s.milestones || []).sort((a, b) => b.reached_at.localeCompare(a.reached_at))[0] || null;
  const weeks = data.overall.weeklyRhythm.current;
  const isChild = data.learner.learnerType === 'child';
  const href = `/student/progress${activeId ? `?learnerId=${encodeURIComponent(activeId)}` : ''}`;

  return (
    <Link
      to={href}
      data-testid="home-progress-card"
      className="group flex items-center gap-4 p-4 rounded-2xl glass-card border border-border hover:border-primary/40 transition-colors focus-ring"
    >
      <RhythmLanternEmblem active={weeks > 0} isChild={isChild} className="w-14 h-14 shrink-0" />
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          {isAr ? `مسيرة ${data.learner.name}` : `${data.learner.name}'s progress`}
        </p>
        <p className="text-sm font-semibold text-foreground">
          {weeks > 0
            ? isAr ? `${weeks === 1 ? 'أسبوع واحد' : weeks === 2 ? 'أسبوعين' : `${weeks.toLocaleString('ar-EG')} ${weeks <= 10 ? 'أسابيع' : 'أسبوع'}`} على نفس الإيقاع` : `${weeks} ${weeks === 1 ? 'week' : 'weeks'} in rhythm`
            : isAr ? 'إيقاع جديد بيبدأ بحصة الأسبوع ده' : 'A new rhythm starts with a lesson this week'}
        </p>
        {subject && (
          <p className="text-xs text-muted-foreground truncate">
            {isAr ? `${subject.subjectMeta.ar}: ${subject.currentLevel.ar}` : `${subject.subjectMeta.en}: ${subject.currentLevel.en}`}
          </p>
        )}
        {newest && (
          <p className="text-xs text-foreground/80 truncate flex items-center gap-1.5">
            <MilestoneEmblemByKind kind={newest.kind} className="w-4 h-4 shrink-0" />
            <span className="truncate">{isAr ? newest.title_ar : newest.title_en}</span>
          </p>
        )}
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary shrink-0 rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}
