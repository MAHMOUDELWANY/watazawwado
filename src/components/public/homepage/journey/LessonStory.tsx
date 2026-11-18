import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { EXPO, num, type L } from './Journey';

/**
 * Station "the lesson, and after" (owner, 2026-11-18: show the real site, not examples): a pinned phone with real
 * screens of the student portal (public/media/portal, captured from /student/progress?preview=active, its sample
 * learner), changing as you scroll. The teacher's note → the level → the milestones the teacher records → the badges.
 * Over each screen one real piece lifts out of the phone (a 3D badge render from public/badges/shelf).
 * Reduced motion gets the four screens as a plain grid.
 */

type Step = { key: 'note' | 'level' | 'milestones' | 'badges'; title: L; body: L };
const STEPS: Step[] = [
  { key: 'note', title: { en: 'The teacher writes to you', ar: 'المعلّم يكتب لك' }, body: { en: 'What went well, the homework, and the next step. After every lesson.', ar: 'اتقنت إيه، والواجب، والخطوة الجاية. بعد كل حصة.' } },
  { key: 'level', title: { en: 'You see where you are', ar: 'تشوف أنت فين' }, body: { en: 'Level by level. Each one you finish becomes a badge.', ar: 'مستوى بمستوى. وكل مستوى تخلّصه يبقى وسام.' } },
  { key: 'milestones', title: { en: 'Milestones, kept', ar: 'محطاتك محفوظة' }, body: { en: 'A surah memorised, a rule mastered: your teacher records it, with a certificate.', ar: 'سورة حفظتها، حكم أتقنته: المعلّم يسجّلها، ولها شهادة.' } },
  { key: 'badges', title: { en: 'Badges for effort', ar: 'أوسمة على المجهود' }, body: { en: 'For coming, for homework, for steady weeks. No rankings: only you against yesterday.', ar: 'على الحضور والواجب والانتظام. من غير ترتيب: أنت وبس، أحسن من امبارح.' } },
];

// The piece that lifts out of the phone on each screen.
const LIFT: Record<Step['key'], string[]> = {
  note: ['homework-first'],
  level: ['quran-level'],
  milestones: ['surah', 'tajweed'],
  badges: ['lessons-10', 'rhythm-4', 'surah'],
};

const shot = (key: Step['key'], isEn: boolean) => `/media/portal/${isEn ? 'en' : 'ar'}-${key}.webp`;

function Phone({ step, isEn, still }: { step: Step; isEn: boolean; still?: boolean }) {
  return (
    <div className="relative w-[230px] sm:w-[290px]">
      {/* Titanium frame, side keys, the island. */}
      <div className="relative aspect-[390/844] rounded-[2.9rem] p-[7px] bg-[linear-gradient(145deg,#5A4A42,#1C1411_40%,#3B2E28_70%,#120C09)] shadow-[0_60px_120px_-40px_rgba(28,20,17,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
        <span aria-hidden="true" className="absolute -end-[3px] top-[22%] h-16 w-[3px] rounded-e bg-[#2A201B]" />
        <span aria-hidden="true" className="absolute -start-[3px] top-[18%] h-10 w-[3px] rounded-s bg-[#2A201B]" />
        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[#FAF7F2]">
          <AnimatePresence initial={false} mode="popLayout">
            <motion.img
              key={step.key + (isEn ? 'en' : 'ar')}
              src={shot(step.key, isEn)}
              alt={isEn ? `The student portal: ${step.title.en}` : `بوابة الطالب: ${step.title.ar}`}
              width={780}
              height={1688}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover object-top select-none"
              initial={still ? false : { opacity: 0, scale: 1.06, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -20, transition: { duration: 0.25 } }}
              transition={{ duration: 0.7, ease: EXPO }}
            />
          </AnimatePresence>
          {/* Glass glare. */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,rgba(255,255,255,0.22),transparent_32%,transparent_70%,rgba(255,255,255,0.06))]" />
          <span aria-hidden="true" className="absolute top-2.5 left-1/2 -translate-x-1/2 h-[22px] w-[34%] rounded-full bg-[#0B0806]" />
        </div>
      </div>
      {/* Real 3D badges lift out of the screen. */}
      {!still && (
        <AnimatePresence>
          {LIFT[step.key].map((id, k, all) => {
            const spread = all.length === 1 ? 0 : (k - (all.length - 1) / 2) * 34;
            return (
              <motion.img
                key={`${step.key}-${id}`}
                src={`/badges/shelf/${id}${!isEn && /\d/.test(id) ? '-ar' : ''}.webp`}
                alt=""
                aria-hidden="true"
                width={180}
                height={180}
                className="pointer-events-none absolute w-[92px] sm:w-[118px] drop-shadow-[0_24px_30px_rgba(28,20,17,0.45)]"
                style={{ insetInlineEnd: '-16%', top: `${54 + k * 2}%` }}
                initial={{ opacity: 0, scale: 0.3, y: 60, x: 0, rotate: -25 }}
                animate={{ opacity: 1, scale: 1, y: -k * 8, x: `${spread}%`, rotate: spread / 3 }}
                exit={{ opacity: 0, scale: 0.6, y: -30, transition: { duration: 0.2 } }}
                transition={{ type: 'spring', stiffness: 170, damping: 15, delay: 0.35 + k * 0.12 }}
              />
            );
          })}
        </AnimatePresence>
      )}
    </div>
  );
}

export function LessonStory({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const ref = React.useRef<HTMLDivElement>(null);
  const [i, setI] = React.useState(0);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  useMotionValueEvent(scrollYProgress, 'change', (v) => setI(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length * 0.999)))));
  const t = (l: L) => (isEn ? l.en : l.ar);
  const caption = (
    <p className="mt-6 text-center text-xs text-muted-foreground">
      {isEn ? 'Real screens from the student portal, with sample data.' : 'شاشات حقيقية من بوابة الطالب، ببيانات توضيحية.'}
    </p>
  );

  // Warm the next screen so the swap never flashes.
  React.useEffect(() => {
    const next = STEPS[i + 1];
    if (next) { const im = new Image(); im.src = shot(next.key, isEn); }
  }, [i, isEn]);

  if (reduce) return (
    <div className="max-w-5xl mx-auto py-16">
      <div className="grid gap-12 sm:grid-cols-2">
        {STEPS.map((s) => (
          <div key={s.key} className="flex flex-col items-center text-center gap-4">
            <Phone step={s} isEn={isEn} still />
            <h3 className="font-editorial font-bold text-2xl text-foreground">{t(s.title)}</h3>
            <p className="text-muted-foreground max-w-xs">{t(s.body)}</p>
          </div>
        ))}
      </div>
      {caption}
    </div>
  );

  return (
    <div ref={ref} className="relative h-[360vh]">
      <div className="sticky top-0 h-[100svh] flex items-center">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-4 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 flex flex-col items-center">
            <Phone step={STEPS[i]} isEn={isEn} />
            <p className="mt-4 text-[11px] sm:text-xs text-muted-foreground text-center">
              {isEn ? 'Real screens, sample learner' : 'شاشات حقيقية، طالب توضيحي'}
            </p>
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-start pt-24 lg:pt-0">
            <div className="flex justify-center lg:justify-start gap-2" aria-hidden="true">
              {STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-10 bg-[#C51F24]' : k < i ? 'w-4 bg-[#E5A93C]' : 'w-4 bg-border'}`} />)}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={i} initial={{ opacity: 0, y: 24, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -14, transition: { duration: 0.18 } }} transition={{ duration: 0.55, ease: EXPO }} aria-live="polite">
                <p className="mt-4 font-editorial text-base sm:text-lg text-[#B4552F] dark:text-[#E5A93C] tabular-nums">{num(i + 1, isEn)} / {num(STEPS.length, isEn)}</p>
                <h3 className="mt-1 font-editorial font-bold text-[1.7rem] sm:text-5xl leading-tight text-foreground">{t(STEPS[i].title)}</h3>
                <p className="mt-3 text-sm sm:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">{t(STEPS[i].body)}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
