import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, ArrowRight, Backpack, GraduationCap, User, Users } from 'lucide-react';
import { Link } from '../LangLink';
import { findSubjectPage, SUBJECT_PAGES_PATH } from '../../../data/subjectPages';

/**
 * "Who is the learning for?" One tap on a learner shows the subject pages that fit them, so a visitor reaches
 * the right page in two taps instead of reading every subject. Titles come from src/data/subjectPages.ts.
 */

type L = { en: string; ar: string };
type Who = { id: string; icon: React.ComponentType<{ className?: string }>; label: L; hint: L; pages: string[] };

const WHO: Who[] = [
  { id: 'child', icon: Backpack, label: { en: 'My child', ar: 'طفلي' }, hint: { en: 'ages 6 to 12', ar: 'من ٦ إلى ١٢ سنة' }, pages: ['online-quran-classes-for-kids', 'islamic-classes-for-kids', 'learn-arabic-online'] },
  { id: 'teen', icon: GraduationCap, label: { en: 'My teenager', ar: 'ابني المراهق' }, hint: { en: 'ages 13 to 17', ar: 'من ١٣ إلى ١٧ سنة' }, pages: ['online-quran-memorization', 'online-tajweed-classes', 'online-english-classes'] },
  { id: 'me', icon: User, label: { en: 'Me', ar: 'أنا' }, hint: { en: 'an adult learner', ar: 'متعلّم بالغ' }, pages: ['online-quran-classes-for-adults', 'online-tajweed-classes', 'learn-arabic-online', 'learn-egyptian-arabic-online'] },
  { id: 'family', icon: Users, label: { en: 'The whole family', ar: 'العائلة كلها' }, hint: { en: 'one account for all', ar: 'حساب واحد للجميع' }, pages: ['online-quran-classes-for-kids', 'online-quran-classes-for-adults', 'online-english-classes'] },
];

export function PathFinder({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const [picked, setPicked] = React.useState<string | null>(null);
  const reduce = useReducedMotion();
  const t = (l: L) => (isEn ? l.en : l.ar);
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  const who = WHO.find((w) => w.id === picked);

  return (
    <section className="public-container py-14 lg:py-20" aria-labelledby="path-finder">
      <div className="max-w-4xl mx-auto text-center">
        <h2 id="path-finder" className="font-editorial font-bold text-3xl sm:text-4xl text-foreground">
          {isEn ? 'Who is the learning for?' : 'لمن التعلّم؟'}
        </h2>
        <p className="mt-3 text-muted-foreground text-base sm:text-lg">
          {isEn ? 'Tap one, and we show you where to start.' : 'اختر واحدًا، ونريك من أين تبدأ.'}
        </p>

        <div role="group" aria-label={isEn ? 'Who is the learning for?' : 'لمن التعلّم؟'} className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {WHO.map(({ id, icon: Icon, label, hint }) => {
            const on = id === picked;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={on}
                onClick={() => setPicked(on ? null : id)}
                className={`glass-card flex flex-col items-center gap-2 rounded-[1.4rem] border px-3 py-5 min-h-11 transition-[transform,border-color,background-color] duration-200 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C] ${on ? 'border-[#E5A93C] bg-[#E5A93C]/10' : 'border-border hover:border-[#E5A93C]/50'}`}
              >
                <span className={`grid place-items-center w-12 h-12 rounded-2xl ${on ? 'bg-[#C51F24] text-[#FAF7F2]' : 'bg-[#C51F24]/10 text-[#C51F24] dark:text-[#F0656A]'}`}>
                  <Icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <span className="font-bold text-foreground">{t(label)}</span>
                <span className="text-xs text-muted-foreground">{t(hint)}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          {who && (
            <motion.div
              key={who.id}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="mt-6 text-start"
              aria-live="polite"
            >
              <ul className="grid gap-2 sm:grid-cols-2">
                {who.pages.map(findSubjectPage).filter((p) => p !== null).map((p) => (
                  <li key={p.slug}>
                    <Link
                      to={`${SUBJECT_PAGES_PATH}/${p.slug}`}
                      className="group flex items-center justify-between gap-3 rounded-2xl border border-border bg-background/70 px-4 py-3 min-h-11 font-semibold text-foreground hover:border-[#087D91]/50 transition-colors"
                    >
                      {isEn ? p.h1En : p.h1Ar}
                      <Arrow className="w-4 h-4 shrink-0 text-[#087D91] transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
                {isEn ? 'Not sure? ' : 'محتار؟ '}
                <button type="button" onClick={onTrial} className="font-bold text-foreground underline underline-offset-4 decoration-[#E5A93C] min-h-11">
                  {isEn ? 'The free first lesson finds the right level for you.' : 'الحصة الأولى المجانية تحدّد لك المستوى المناسب.'}
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
