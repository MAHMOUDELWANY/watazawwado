import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DateTime } from 'luxon';
import { Modal } from '../../../components/ui/Modal';
import { AchievementEmblem, badgeSrc } from './AchievementEmblems';
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

  const pct = items.length ? Math.round((earned / items.length) * 100) : 0;

  // A display case: espresso in both themes so gold reads as gold; earned badges stand lit on their shelf,
  // the rest are dark silhouettes of the same badge (docs/design/PROGRESS.md).
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="badge-case rounded-[28px] p-4 sm:p-6 grid gap-6 shadow-[var(--shadow-2)] ring-1 ring-[#E5A93C]/25 scroll-mt-24" data-testid="achievements-shelf">
      <header className="grid gap-3">
        <div className="flex items-end justify-between gap-3">
          <div className="grid gap-0.5">
            <h2 id={`${id}-title`} className="font-display text-xl sm:text-2xl font-bold text-[#F4EEE6]">{title}</h2>
            <p className="text-sm text-[#CDBFAE]">{isAr ? 'اضغط أي وسام لتراه عن قرب.' : 'Tap any badge to see it up close.'}</p>
          </div>
          <span className="shrink-0 rounded-full bg-[#E5A93C]/15 ring-1 ring-[#E5A93C]/40 px-3 py-1 text-sm font-bold tabular-nums text-[#F6D58E]" data-testid="shelf-count">
            {isAr ? `${digits(earned, true)} من ${digits(items.length, true)}` : `${earned} of ${items.length}`}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden" role="progressbar" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={earned} aria-label={isAr ? 'الأوسمة المكتسبة' : 'Badges earned'}>
          <div className="h-full rounded-full bg-gradient-to-r rtl:bg-gradient-to-l from-[#C51F24] via-[#E0672E] to-[#E5A93C]" style={{ width: `${pct}%` }} />
        </div>
      </header>

      {ORDER.map((fam) => {
        const group = items.filter((i) => i.family === fam);
        if (!group.length) return null;
        const got = group.filter((i) => i.earned).length;
        return (
          <div key={fam} className="grid gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-sm font-bold text-[#F6D58E]">{pick(FAMILY_TITLE[fam])}</h3>
              <span className="text-xs tabular-nums text-[#A8998A]">{isAr ? `${digits(got, true)} من ${digits(group.length, true)}` : `${got} of ${group.length}`}</span>
            </div>
            <ul className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-x-1 gap-y-2 pt-1">
              {group.map((item) => {
                const isNew = Boolean(highlight) && item.emblem === highlight && item.earned;
                return (
                  <li key={item.emblem} data-testid={item.earned ? 'shelf-earned' : 'shelf-locked'}>
                    <button
                      type="button"
                      onClick={() => setOpen(item)}
                      aria-label={`${pick(item.title)}${item.earned ? '' : isAr ? '، لم يُكسب بعد' : ', not earned yet'}`}
                      className="group relative w-full grid justify-items-center gap-1 rounded-2xl px-1 pt-1 pb-1.5 text-center cursor-pointer transition-transform active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-[#F6D58E] focus-visible:outline-offset-2"
                    >
                      <span className="relative grid place-items-center w-full max-w-[92px] lg:max-w-[120px] aspect-square">
                        {item.earned && <span className="badge-spot absolute inset-[-14%]" aria-hidden="true" />}
                        <img
                          src={badgeSrc(item.emblem, isAr)} alt="" aria-hidden="true" width={180} height={180} loading="lazy" decoding="async" draggable={false}
                          className={`relative w-full h-full object-contain transition-transform duration-200 group-hover:-translate-y-1 ${item.earned ? 'drop-shadow-[0_10px_14px_rgba(0,0,0,0.55)]' : 'badge-silhouette'}`}
                        />
                        {item.earned && (item.count || 0) > 1 && (
                          <span className="absolute top-0 start-0 rounded-full bg-[#F6D58E] text-[#1F1A17] text-[11px] font-bold px-1.5 leading-5 tabular-nums shadow" data-testid="shelf-repeat">
                            ×{digits(item.count!, isAr)}
                          </span>
                        )}
                        {isNew && <span className="absolute -top-1 end-0 rounded-full bg-[#C51F24] text-white text-[10px] font-bold px-1.5 leading-5">{isAr ? 'جديد' : 'New'}</span>}
                      </span>
                      <span className={`text-[12px] leading-tight font-semibold ${item.earned ? 'text-[#F4EEE6]' : 'text-[#8F8173]'}`}>{pick(item.title)}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="badge-ledge -mt-1" aria-hidden="true" />
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
