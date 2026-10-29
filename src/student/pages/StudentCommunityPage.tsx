import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { authedJson } from '../../lib/authedJson';
import { useActiveLearner } from '../activeLearner';
import { AchievementEmblem } from '../components/achievements/AchievementEmblems';
import { emblemForKind } from '../components/achievements/achievements';
import { CommunityPanel } from '../components/community/CommunityPanel';

/**
 * Our community (owner 2026-10-29: a closed community, only for signed-in families and students).
 * The family's own choices (Hall of Honor answers, class board) first, then the academy's Hall of Honor.
 * Plan: docs/superpowers/plans/2026-10-29-community-honor.md.
 */

interface HallEntry {
  id: string;
  name: string;
  titleEn: string;
  titleAr: string;
  kind: string;
  subject: { en: string; ar: string; color: string } | null;
  month: string;
}

export default function StudentCommunityPage({ lang }: { lang: 'ar' | 'en' }) {
  const isAr = lang === 'ar';
  const [params] = useSearchParams();
  const { learners, activeId } = useActiveLearner();
  const [entries, setEntries] = useState<HallEntry[] | null>(null);
  const [failed, setFailed] = useState(false);

  const loadHall = useCallback(() => {
    authedJson<{ entries: HallEntry[] }>('/api/student/community/hall')
      .then((d) => { setEntries(Array.isArray(d.entries) ? d.entries : []); setFailed(false); })
      .catch(() => { setEntries([]); setFailed(true); });
  }, []);
  useEffect(loadHall, [loadHall]);

  // A notice links here with ?learnerId=; otherwise the header's child switcher decides, or the whole family.
  const linked = params.get('learnerId') || '';
  const panelIds: Array<string | undefined> = learners.length === 0
    ? [undefined]
    : linked && learners.some((l) => l.id === linked)
      ? [linked]
      : activeId ? [activeId] : learners.map((l) => l.id);

  const monthLabel = (m: string) => {
    const d = new Date(`${m}-01T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(isAr ? 'ar-EG' : 'en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <div className="space-y-6 pb-12 max-w-4xl" data-testid="student-community">
      <header className="grid gap-1">
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">{isAr ? 'مجتمعنا' : 'Our community'}</h1>
        <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
          {isAr
            ? 'المجتمع ده لأسر وطلاب وتزودوا بس، ومحدش من برّه بيشوفه. هنا بتختاروا إيه يظهر من إنجازاتكم، وبتشوفوا لوحة الشرف.'
            : 'This community is for Watazawwado families and students only; nobody outside can see it. Here you choose what to share of your achievements and see the Hall of Honor.'}
        </p>
      </header>

      {panelIds.map((id) => <CommunityPanel key={id || 'self'} learnerId={id} isAr={isAr} onChanged={loadHall} />)}

      <section id="hall" aria-labelledby="hall-title" className="grid gap-4 scroll-mt-24">
        <div className="grid gap-1">
          <h2 id="hall-title" className="font-display text-xl font-bold text-foreground">{isAr ? 'لوحة الشرف' : 'Hall of Honor'}</h2>
          <p className="text-sm text-muted-foreground">
            {isAr
              ? 'إنجازات وصل لها طلابنا مع معلميهم، وكل واحد هنا لأن الأسرة وافقت واختارت الاسم.'
              : 'Milestones our students reached with their teachers. Each one is here because the family agreed and chose the name.'}
          </p>
        </div>

        {entries === null && <p className="text-sm text-muted-foreground" aria-live="polite">{isAr ? 'بنحمّل…' : 'Loading…'}</p>}

        {entries !== null && entries.length === 0 && (
          <Card className="p-6 text-center grid gap-2 justify-items-center">
            <AchievementEmblem id="juz" earned={false} className="w-14 h-14" />
            <p className="font-display text-lg font-bold text-foreground">
              {failed ? (isAr ? 'مقدرناش نحمّل اللوحة دلوقتي' : 'We could not load the hall right now') : (isAr ? 'أول الأسماء في الطريق' : 'The first names are on their way')}
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              {failed
                ? (isAr ? 'جرّبوا تاني بعد شوية.' : 'Please try again in a little while.')
                : (isAr
                  ? 'لما طالب يختم جزء أو سورة طويلة أو يخلّص مستوى أو كتاب، بنسأل أسرته الأول، ولو وافقت بنحتفل بيه هنا.'
                  : 'When a student finishes a juz, a long surah, a level or a book, we ask the family first, and if they agree we celebrate it here.')}
            </p>
          </Card>
        )}

        {entries && entries.length > 0 && (
          <ul className="grid sm:grid-cols-2 gap-3" data-testid="honor-list">
            {entries.map((e) => (
              <li key={e.id}>
                <Card className="h-full p-4 flex gap-3 items-start">
                  <AchievementEmblem id={emblemForKind(e.kind)} className="w-12 h-12 shrink-0" />
                  <div className="min-w-0 grid gap-0.5">
                    <p className="font-display text-lg font-bold text-foreground break-words">{e.name}</p>
                    <p className="text-foreground leading-snug">{isAr ? e.titleAr : e.titleEn}</p>
                    <p className="text-xs text-muted-foreground">{e.subject ? `${isAr ? e.subject.ar : e.subject.en} · ` : ''}{monthLabel(e.month)}</p>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {isAr ? 'اللهم تقبّل منهم ومن جميع طلابنا.' : 'May Allah accept from them and from all our students.'}
        </p>
      </section>
    </div>
  );
}
