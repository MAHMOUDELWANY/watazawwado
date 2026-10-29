import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PageHero } from '../PublicDesignSystem';
import { Card } from '../../ui/Card';
import { AchievementEmblem } from '../../../student/components/achievements/AchievementEmblems';
import { emblemForKind } from '../../../student/components/achievements/achievements';

/**
 * Public Hall of Honor (plan: docs/superpowers/plans/2026-10-29-community-honor.md). Every entry is there because the
 * guardian or the adult learner said yes, under the name they chose. No photos, countries or ages. Entries load in the
 * browser, so the prerendered page carries no learner names.
 */

interface Entry {
  id: string;
  name: string;
  titleEn: string;
  titleAr: string;
  kind: string;
  subject: { en: string; ar: string; color: string } | null;
  month: string;
}

export function HallOfHonorPage() {
  const { lang } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const [entries, setEntries] = useState<Entry[] | null>(null);

  useEffect(() => {
    let live = true;
    fetch('/api/public/hall-of-honor')
      .then((r) => (r.ok ? r.json() : { entries: [] }))
      .then((d) => { if (live) setEntries(Array.isArray(d?.entries) ? d.entries : []); })
      .catch(() => { if (live) setEntries([]); });
    return () => { live = false; };
  }, []);

  const monthLabel = (m: string) => {
    const d = new Date(`${m}-01T12:00:00Z`);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(isEn ? 'en-GB' : 'ar-EG', { month: 'long', year: 'numeric', timeZone: 'UTC' });
  };

  return (
    <main id="main-content" className="pt-16 sm:pt-20 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-10">
          <PageHero
            title={isEn ? <>Hall of <span className="text-ribbon">Honor</span></> : <>لوحة <span className="text-ribbon">الشرف</span></>}
            intro={isEn
              ? 'Milestones our students reached with their teachers. Each one is here because the family chose to share it.'
              : 'إنجازات وصل لها طلابنا مع معلميهم. كل إنجاز هنا لأن الأسرة اختارت تشاركه.'}
          />

          {entries === null && (
            <p className="text-center text-sm text-muted-foreground" aria-live="polite">{isEn ? 'Loading…' : 'بنحمّل…'}</p>
          )}

          {entries !== null && entries.length === 0 && (
            <Card className="p-6 sm:p-8 text-center grid gap-2 justify-items-center">
              <AchievementEmblem id="juz" earned={false} className="w-16 h-16" />
              <p className="font-display text-lg font-bold text-foreground">{isEn ? 'The first names are on their way' : 'أول الأسماء في الطريق'}</p>
              <p className="text-sm text-muted-foreground max-w-md">
                {isEn
                  ? 'When a student finishes a juz, a long surah, a level or a book, and their family agrees, we celebrate it here.'
                  : 'لما طالب يختم جزء أو سورة طويلة أو يخلّص مستوى أو كتاب، وأسرته توافق، بنحتفل بيه هنا.'}
              </p>
            </Card>
          )}

          {entries && entries.length > 0 && (
            <ul className="grid sm:grid-cols-2 gap-4" data-testid="honor-list">
              {entries.map((e, i) => (
                <li key={e.id}>
                  <Card className={`h-full p-5 flex gap-4 items-start ${i === 0 ? 'ring-1 ring-[#E5A93C]/50' : ''}`}>
                    <AchievementEmblem id={emblemForKind(e.kind)} className="w-14 h-14 shrink-0" />
                    <div className="min-w-0 grid gap-1">
                      <p className="font-display text-lg font-bold text-foreground break-words">{e.name}</p>
                      <p className="text-foreground leading-snug">{isEn ? e.titleEn : e.titleAr}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.subject ? `${isEn ? e.subject.en : e.subject.ar} · ` : ''}{monthLabel(e.month)}
                      </p>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}

          <p className="text-center text-sm text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {isEn
              ? 'May Allah accept from them and from all our students. Families choose the name shown and can take an entry down at any time from their account. '
              : 'اللهم تقبّل منهم ومن جميع طلابنا. الأسرة بتختار الاسم اللي يظهر وتقدر تشيل الإنجاز في أي وقت من حسابها. '}
            <Link to="/safety" className="underline underline-offset-2 text-foreground">{isEn ? 'How we keep children safe' : 'إزاي بنحافظ على أمان الأطفال'}</Link>
          </p>
        </div>
      </PublicSection>
    </main>
  );
}
