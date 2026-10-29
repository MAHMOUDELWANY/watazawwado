import React, { useEffect, useState } from 'react';
import { dashboardFetch } from '../lib/dashboardApi';
import { useT } from '../../lib/language';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { effortLine } from '../../student/components/community/effortText';

/**
 * Teacher: the class board (plan: docs/superpowers/plans/2026-10-29-community-honor.md). Each group is the same
 * age group (and for teens and adults the same gender). The teacher sees every learner's effort; learners see only
 * those whose family joined, and only once three have.
 */

type Learner = { id: string; name: string; boardName: string | null; lessonsThisMonth: number; rhythm: number };
type Group = { key: string; ageGroup: 'kids' | 'teens' | 'adults'; gender: 'male' | 'female' | null; learners: Learner[]; onBoard: number; boardVisible: boolean };

const AGE = { kids: { en: 'Kids', ar: 'الأطفال' }, teens: { en: 'Teens', ar: 'الشباب' }, adults: { en: 'Adults', ar: 'الكبار' } };

export default function ClassBoardPage() {
  const { isAr } = useT();
  const [groups, setGroups] = useState<Group[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    dashboardFetch<{ groups: Group[] }>('/api/dashboard/class-board').then((d) => setGroups(d.groups)).catch((e) => setError(e.message));
  }, []);
  const n = (v: number) => (isAr ? v.toLocaleString('ar-EG') : String(v));
  const label = (g: Group) => {
    const age = isAr ? AGE[g.ageGroup].ar : AGE[g.ageGroup].en;
    if (!g.gender) return age;
    return `${age} · ${g.gender === 'male' ? (isAr ? 'بنين' : 'boys and men') : (isAr ? 'بنات' : 'girls and women')}`;
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl" data-testid="class-board-page">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'لوحة الحلقة' : 'Class board'}</h1>
        <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
          {isAr
            ? 'مجهود طلابك الشهر ده: الحصص والأسابيع ورا بعض. الطالب بيشوف بس اللي أسرهم وافقت، ومن غير ترتيب، ولما يبقوا ٣ على الأقل.'
            : 'Your learners’ effort this month: lessons and weeks in a row. A learner sees only those whose family agreed, with no ranks, once there are at least 3.'}
        </p>
      </div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {!groups && !error && <p className="text-sm text-muted-foreground">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}
      {groups && groups.length === 0 && <p className="text-sm text-muted-foreground">{isAr ? 'مفيش طلاب نشطين معاك دلوقتي.' : 'No active learners with you right now.'}</p>}
      {groups?.map((g) => (
        <Card key={g.key} className="p-4 sm:p-5 grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold text-foreground">{label(g)}</h2>
            <Badge variant={g.boardVisible ? 'success' : 'outline'} className="text-xs">
              {g.boardVisible
                ? (isAr ? `اللوحة ظاهرة (${n(g.onBoard)} منضمين)` : `Board visible (${g.onBoard} joined)`)
                : (isAr ? `${n(g.onBoard)} من ٣ منضمين` : `${g.onBoard} of 3 joined`)}
            </Badge>
          </div>
          <ul className="grid gap-1.5">
            {g.learners.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-surface-subtle px-3 py-2">
                <span className="min-w-0">
                  <span className="font-semibold text-foreground">{l.name}</span>
                  {l.boardName && <span className="text-xs text-muted-foreground">{isAr ? ` · في اللوحة باسم «${l.boardName}»` : ` · on the board as “${l.boardName}”`}</span>}
                </span>
                <span className="text-xs text-muted-foreground">{effortLine(l.lessonsThisMonth, l.rhythm, isAr)}</span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
