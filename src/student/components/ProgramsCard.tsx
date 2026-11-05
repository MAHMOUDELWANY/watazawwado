import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { CalendarHeart, Check } from 'lucide-react';
import { authedJson } from '../../lib/authedJson';
import { Button } from '../../components/ui/Button';
import { useActiveLearner } from '../activeLearner';

type Program = {
  id: string; title_en: string; title_ar: string; description_en: string | null; description_ar: string | null;
  starts_on: string; ends_on: string; joined: string[];
};

/** NX-08: open seasonal programs on the student home; the family signs each learner up (or leaves) with one tap. */
export function ProgramsCard({ isAr }: { isAr: boolean }) {
  const { activeId } = useActiveLearner();
  const [data, setData] = useState<{ programs: Program[]; learners: Array<{ id: string; name: string }> } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    authedJson<{ programs: Program[]; learners: Array<{ id: string; name: string }> }>('/api/student/programs')
      .then((d) => { if (!cancelled) setData(d); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  if (!data || data.programs.length === 0 || data.learners.length === 0) return null;
  const learners = activeId ? data.learners.filter((l) => l.id === activeId) : data.learners;
  const day = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toFormat('d LLLL');

  const toggle = async (p: Program, learnerId: string) => {
    const leave = p.joined.includes(learnerId);
    setBusy(`${p.id}:${learnerId}`); setError('');
    try {
      await authedJson(`/api/student/programs/${p.id}/join`, { method: 'POST', body: JSON.stringify({ learnerStudentId: learnerId, leave }) });
      setData((d) => d && { ...d, programs: d.programs.map((x) => x.id !== p.id ? x : { ...x, joined: leave ? x.joined.filter((j) => j !== learnerId) : [...x.joined, learnerId] }) });
    } catch (e: any) {
      setError(isAr ? 'تعذّر الحفظ، حاول مرة أخرى.' : e?.message || 'Could not save.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section data-testid="programs-card" className="p-4 rounded-2xl glass-card border border-border space-y-3" aria-labelledby="programs-card-title">
      <h2 id="programs-card-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
        <CalendarHeart className="w-4 h-4 text-accent" aria-hidden="true" />{isAr ? 'برامج الموسم' : 'Season programs'}
      </h2>
      <ul className="space-y-3">
        {data.programs.map((p) => (
          <li key={p.id} className="rounded-xl bg-surface-subtle p-3 space-y-2">
            <div>
              <p className="text-sm font-semibold text-foreground">{isAr ? p.title_ar : p.title_en}</p>
              <p className="text-xs text-muted-foreground">{isAr ? `من ${day(p.starts_on)} لـ ${day(p.ends_on)}` : `${day(p.starts_on)} to ${day(p.ends_on)}`}</p>
            </div>
            {(isAr ? p.description_ar : p.description_en) && <p className="text-sm text-foreground whitespace-pre-line">{isAr ? p.description_ar : p.description_en}</p>}
            <div className="flex flex-wrap gap-2">
              {learners.map((l) => {
                const joined = p.joined.includes(l.id);
                const label = learners.length > 1 ? l.name : (isAr ? 'سجّلني' : 'Join');
                return (
                  <Button key={l.id} size="sm" variant={joined ? 'outline' : 'primary'} aria-pressed={joined}
                    isLoading={busy === `${p.id}:${l.id}`} onClick={() => toggle(p, l.id)}>
                    {joined && <Check className="w-4 h-4 me-1" aria-hidden="true" />}
                    {joined ? (learners.length > 1 ? l.name : (isAr ? 'مسجَّل، المس للانسحاب' : 'Joined, tap to leave')) : label}
                  </Button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    </section>
  );
}
