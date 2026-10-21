import React from 'react';
import { DateTime } from 'luxon';
import { Card } from '../../../components/ui/Card';
import { AchievementEmblem } from './AchievementEmblems';
import type { ShelfItem } from './achievements';

/** PR-04: earned emblems in colour, the next ones in outline with what earns them. Effort only, no ranking. */
export function AchievementsShelf({ items, isAr, highlight }: { items: ShelfItem[]; isAr: boolean; highlight?: string | null }) {
  const earned = items.filter((i) => i.earned).length;
  const pick = (b: { en: string; ar: string }) => (isAr ? b.ar : b.en);
  return (
    <Card className="p-5 sm:p-6" data-testid="achievements-shelf">
      <section aria-labelledby="achievements-shelf-title">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <h2 id="achievements-shelf-title" className="font-display text-lg sm:text-xl font-bold text-foreground">
            {isAr ? 'رف الأوسمة' : 'Achievements shelf'}
          </h2>
          <span className="text-xs text-muted-foreground">
            {isAr ? `${earned.toLocaleString('ar-EG')} من ${items.length.toLocaleString('ar-EG')}` : `${earned} of ${items.length}`}
          </span>
        </div>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item, i) => {
            const isNew = Boolean(highlight) && item.emblem === highlight && item.earned;
            return (
              <li
                key={`${item.emblem}-${i}`}
                data-testid={item.earned ? 'shelf-earned' : 'shelf-locked'}
                className={`flex flex-col items-center text-center gap-1.5 rounded-2xl border p-3 transition-shadow ${
                  item.earned
                    ? 'border-[#E5A93C]/40 bg-[#E5A93C]/5 hover:shadow-[0_0_0_3px_rgba(229,169,60,0.18)]'
                    : 'border-border-subtle border-dashed'
                } ${isNew ? 'ring-2 ring-[#E5A93C]/60' : ''}`}
              >
                <AchievementEmblem id={item.emblem} earned={item.earned} className="w-14 h-14" />
                <span className={`text-sm font-semibold leading-snug ${item.earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {pick(item.title)}
                </span>
                <span className="text-xs text-muted-foreground leading-snug">
                  {item.earned
                    ? item.detail
                      ? pick(item.detail)
                      : item.earnedAt
                        ? DateTime.fromISO(item.earnedAt).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED)
                        : isAr ? 'اتحقق' : 'Earned'
                    : pick(item.earnBy)}
                </span>
                <span className="sr-only">{item.earned ? (isAr ? 'وسام محقَّق' : 'Earned') : (isAr ? 'لسه قدّامك' : 'Not earned yet')}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </Card>
  );
}
