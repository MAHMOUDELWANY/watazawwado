import React, { useEffect, useMemo, useState } from 'react';
import { islamicSeasonFor, type IslamicSeason } from '../../../lib/islamicSeason';
import { MilestoneCelebration } from './MilestoneCelebration';
import {
  ageGroupFor, buildShelf, pickCelebration, praiseFor,
  type AchievementInput, type Audience, type CelebrationItem, type MilestoneInput, type ShelfItem
} from './achievements';

export interface AchievementsSource {
  learner: { id: string; name: string; learnerType: string; timezone?: string | null; age?: number | null; gender?: string | null } | null;
  learners?: Array<{ id: string; isPrimary?: boolean }>;
  isGuardianAccount?: boolean;
  currentIslamicSeason?: IslamicSeason;
  overall: { lessonsAttended: { total: number }; weeklyRhythm: { longest: number } };
  subjects: Array<{ milestones: MilestoneInput[] }>;
}

function safeStorage(): Storage | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const probe = '__wz_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return null;
  }
}

/** PR-04: the shelf for the learner on screen, and at most one celebration per visit for something new. */
export function useProgressAchievements(data: AchievementsSource | null, isAr: boolean): { shelf: ShelfItem[]; celebration: React.ReactNode; highlight: string | null } {
  const input = useMemo<AchievementInput | null>(() => {
    if (!data?.learner) return null;
    const byId = new Map<string, MilestoneInput>();
    for (const s of data.subjects || []) for (const m of s.milestones || []) if (m?.id) byId.set(m.id, m);
    return {
      lessonsTotal: data.overall?.lessonsAttended?.total || 0,
      longestRhythm: data.overall?.weeklyRhythm?.longest || 0,
      milestones: [...byId.values()]
    };
  }, [data]);

  const shelf = useMemo(() => (input ? buildShelf(input) : []), [input]);
  const [current, setCurrent] = useState<{ item: CelebrationItem; alsoNew: number; markSeen: () => void } | null>(null);
  // The emblem just celebrated stays outlined on the shelf after the overlay closes.
  const [highlight, setHighlight] = useState<string | null>(null);

  const learnerId = data?.learner?.id || '';
  useEffect(() => {
    setCurrent(null);
    setHighlight(null);
    if (!learnerId || !input) return;
    const pick = pickCelebration(learnerId, input, safeStorage());
    if (pick.celebrate) {
      setCurrent({ item: pick.celebrate, alsoNew: pick.alsoNew, markSeen: pick.markSeen });
      setHighlight(pick.celebrate.emblem);
    }
    // Only when the learner on screen changes: a refetch of the same learner must not replay it.
  }, [learnerId, input?.lessonsTotal, input?.longestRhythm, input?.milestones.length]);

  // Seen as soon as it shows, so a reload mid-celebration does not play it again.
  useEffect(() => { current?.markSeen(); }, [current]);

  let celebration: React.ReactNode = null;
  if (current && data?.learner) {
    const entry = data.learners?.find((l) => l.id === data.learner!.id);
    const audience: Audience = data.isGuardianAccount && entry && !entry.isPrimary ? 'guardian' : 'learner';
    const ageGroup = audience === 'guardian' ? 'adults' : ageGroupFor(data.learner.age, data.learner.learnerType);
    const season = data.currentIslamicSeason || islamicSeasonFor(new Date(), data.learner.timezone || 'UTC');
    const words = praiseFor({ ageGroup: audience === 'guardian' ? 'adults' : ageGroup, gender: data.learner.gender, audience, name: data.learner.name, season });
    celebration = (
      <MilestoneCelebration
        item={current.item}
        headline={words.headline}
        seasonLine={words.season}
        season={season}
        ageGroup={ageGroup}
        alsoNew={current.alsoNew}
        isAr={isAr}
        onClose={() => setCurrent(null)}
      />
    );
  }
  return { shelf, celebration, highlight };
}
