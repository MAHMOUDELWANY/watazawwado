import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Modal } from '../../../components/ui/Modal';
import { AchievementEmblem } from './AchievementEmblems';
import type { BadgeFamily, BadgeTier, Bilingual, ShelfItem } from './achievements';

/**
 * The achievements shelf of the progress design system (docs/design/PROGRESS.md): the new 3D badges grouped by family,
 * earned in colour, the rest as a faint shadow of the same badge, a count on badges that repeat, a close-up on tap.
 * Effort only: no ranking, no points.
 */

const FAMILY_TITLE: Record<BadgeFamily, Bilingual> = {
  lessons: { en: 'Lessons', ar: 'الحصص' },
  rhythm: { en: 'Rhythm', ar: 'الإيقاع' },
  subject: { en: 'In your subjects', ar: 'في موادك' },
  teacher: { en: "From your teacher", ar: 'من معلمك' },
  homework: { en: 'Homework', ar: 'الواجب' },
};
const TIER: Record<BadgeTier, Bilingual> = { copper: { en: 'Copper', ar: 'نحاس' }, gold: { en: 'Gold', ar: 'ذهب' }, grand: { en: 'Gold and gem', ar: 'ذهب بجوهرة' } };
const TIER_DOT: Record<BadgeTier, string> = { copper: 'bg-[#B4693F]', gold: 'bg-[#D9A441]', grand: 'bg-crimson ring-2 ring-[#D9A441]' };
const ORDER: BadgeFamily[] = ['lessons', 'rhythm', 'subject', 'teacher', 'homework'];

const digits = (n: number, isAr: boolean) => (isAr ? n.toLocaleString('ar-EG') : String(n));

export function AchievementsShelf({ items, isAr, highlight, learnerName, isSelf = true, id = 'achievements-shelf' }: {
  items: ShelfItem[];
  isAr: boolean;
  highlight?: string | null;
  learnerName?: string;
  isSelf?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState<ShelfItem | null>(null);
  const pick = (b: Bilingual) => (isAr ? b.ar : b.en);
  const earned = items.filter((i) => i.earned).length;
  const title = isSelf ? (isAr ? 'أوسمتي' : 'My badges') : isAr ? `أوسمة ${learnerName || ''}` : `${learnerName || 'Learner'}'s badges`;

  return (
    <section id={id} aria-labelledby={`${id}-title`} className="rounded-[28px] border border-border bg-surface p-4 sm:p-6 grid gap-5 shadow-[var(--shadow-1)] scroll-mt-24" data-testid="achievements-shelf">
      <header className="flex items-end justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 id={`${id}-title`} className="font-display text-xl sm:text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{isAr ? 'اضغط أي وسام لتراه عن قرب.' : 'Tap any badge to see it up close.'}</p>
        </div>
        <span className="shrink-0 rounded-full bg-surface-subtle px-3 py-1 text-sm font-semibold tabular-nums text-foreground" data-testid="shelf-count">
          {isAr ? `${digits(earned, true)} من ${digits(items.length, true)}` : `${earned} of ${items.length}`}
        </span>
      </header>

      {ORDER.map((fam) => {
        const group = items.filter((i) => i.family === fam);
        if (!group.length) return null;
        return (
          <div key={fam} className="grid gap-2">
            <h3 className="text-xs font-bold text-muted-foreground">{pick(FAMILY_TITLE[fam])}</h3>
            <ul className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 gap-x-2 gap-y-3">
              {group.map((item) => {
                const isNew = Boolean(highlight) && item.emblem === highlight && item.earned;
                return (
                  <li key={item.emblem} data-testid={item.earned ? 'shelf-earned' : 'shelf-locked'}>
                    <button
                      type="button"
                      onClick={() => setOpen(item)}
                      aria-label={`${pick(item.title)}${item.earned ? '' : isAr ? '، لم يُكسب بعد' : ', not earned yet'}`}
                      className={`group relative w-full grid justify-items-center gap-1 rounded-2xl p-1.5 text-center cursor-pointer focus-ring transition-transform active:scale-[0.97] ${isNew ? 'bg-[#E5A93C]/10 ring-2 ring-[#E5A93C]/60' : 'hover:bg-surface-subtle'}`}
                    >
                      <AchievementEmblem id={item.emblem} earned={item.earned} isAr={isAr} className="w-full max-w-[84px] lg:max-w-[100px] aspect-square transition-transform duration-200 group-hover:-translate-y-0.5" />
                      {item.earned && (item.count || 0) > 1 && (
                        <span className="absolute top-1 start-1 rounded-full bg-foreground text-background text-[11px] font-bold px-1.5 leading-5 tabular-nums" data-testid="shelf-repeat">
                          ×{digits(item.count!, isAr)}
                        </span>
                      )}
                      <span className={`text-[12px] leading-tight font-semibold ${item.earned ? 'text-foreground' : 'text-muted-foreground'}`}>{pick(item.title)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}

      <BadgeSheet item={open} isAr={isAr} onClose={() => setOpen(null)} />
    </section>
  );
}

/** The close-up: the badge large, what it is for, when it was earned, every time it repeated, and the certificate. */
export function BadgeSheet({ item, isAr, onClose }: { item: ShelfItem | null; isAr: boolean; onClose: () => void }) {
  const pick = (b: Bilingual) => (isAr ? b.ar : b.en);
  const day = (iso: string) => DateTime.fromISO(iso).setLocale(isAr ? 'ar' : 'en').toLocaleString(DateTime.DATE_MED);
  return (
    <Modal isOpen={Boolean(item)} onClose={onClose} maxWidth="sm">
      {item && (
        <div className="grid justify-items-center gap-3 text-center pb-1" data-testid="badge-sheet">
          <div className="relative w-56 h-56 grid place-items-center">
            {item.earned && <div className="badge-rays absolute inset-0 rounded-full opacity-70" aria-hidden="true" />}
            <AchievementEmblem id={item.emblem} earned={item.earned} isAr={isAr} className="relative w-52 h-52 drop-shadow-[0_14px_28px_rgba(139,73,53,0.35)]" />
          </div>
          <h3 className="font-display text-2xl font-bold text-foreground text-balance">{pick(item.title)}</h3>
          <p className="text-muted-foreground">
            {item.earned
              ? item.earnedAt ? `${isAr ? 'حصلت عليه في' : 'Earned on'} ${day(item.earnedAt)}` : (isAr ? 'حصلت عليه' : 'Earned')
              : pick(item.earnBy)}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs text-foreground"><i className={`w-2 h-2 rounded-full ${TIER_DOT[item.tier]}`} />{pick(TIER[item.tier])}</span>
            {item.earned && (item.count || 0) > 1 && <span className="rounded-full bg-surface-subtle px-2.5 py-0.5 text-xs text-foreground tabular-nums">×{digits(item.count!, isAr)}</span>}
          </div>
          {item.entries && item.entries.length > 0 && (
            <ul className="w-full grid gap-1.5 text-start max-h-48 overflow-y-auto">
              {item.entries.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 rounded-xl bg-surface-subtle px-3 py-2 text-sm">
                  <span className="font-semibold text-foreground min-w-0">{isAr ? m.title_ar : m.title_en}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{day(m.reached_at)}</span>
                </li>
              ))}
            </ul>
          )}
          {item.earned && item.milestoneId && (
            <Link to={`/student/certificate/${item.milestoneId}`} className="inline-flex items-center min-h-11 px-4 rounded-full text-sm font-semibold text-teal underline underline-offset-4 focus-ring" data-testid="shelf-certificate">
              {isAr ? 'الشهادة' : 'Certificate'}
            </Link>
          )}
          {!item.earned && <p className="text-xs text-muted-foreground">{isAr ? 'سيظهر بألوانه حين تكسبه.' : 'It shows in full colour once you earn it.'}</p>}
        </div>
      )}
    </Modal>
  );
}
