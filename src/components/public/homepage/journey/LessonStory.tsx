import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Check, Flame, Keyboard, Laptop, NotebookPen, PenLine } from 'lucide-react';
import { EXPO, num, type L } from './Journey';
import { Medal } from './HeroStage';

/**
 * Station "the lesson, and after" (owner, 2026-11-18: show the real site, not examples): a pinned phone with real
 * screens of the student portal (public/media/portal, captured from /student/progress?preview=active, its sample
 * learner), changing as you scroll. The teacher's note → the level → the milestones the teacher records → the badges.
 * Over each screen one real piece lifts out of the phone (a 3D badge render from public/badges/shelf).
 * After the phone (owner, 2026-11-19: gather them here): the community (Hall of Honor, class board) and our own classroom.
 * Reduced motion gets the four screens as a plain grid.
 */

type Step = { key: 'note' | 'level' | 'companion' | 'milestones' | 'badges'; title: L; body: L };
const STEPS: Step[] = [
  { key: 'note', title: { en: 'The teacher writes to you', ar: 'المعلّم يكتب لك' }, body: { en: 'What went well, the homework, and the next step. After every lesson.', ar: 'اتقنت إيه، والواجب، والخطوة الجاية. بعد كل حصة.' } },
  { key: 'level', title: { en: 'You see where you are', ar: 'تشوف أنت فين' }, body: { en: 'Level by level. Each one you finish becomes a badge.', ar: 'مستوى بمستوى. وكل مستوى تخلّصه يبقى وسام.' } },
  { key: 'companion', title: { en: 'A companion that grows', ar: 'رفيق بيكبر معاك' }, body: { en: 'Pick a hoopoe, a camel or a fennec. It hatches from an egg and grows with every lesson point.', ar: 'اختار هدهد أو جمل أو فنك. بيفقس من بيضة وبيكبر مع كل نقطة من حصصك.' } },
  { key: 'milestones', title: { en: 'Milestones, kept', ar: 'محطاتك محفوظة' }, body: { en: 'A surah memorised, a rule mastered: your teacher records it, with a certificate.', ar: 'سورة حفظتها، حكم أتقنته: المعلّم يسجّلها، ولها شهادة.' } },
  { key: 'badges', title: { en: 'Badges for effort', ar: 'أوسمة على المجهود' }, body: { en: 'For coming, for homework, for steady weeks. No rankings: only you against yesterday.', ar: 'على الحضور والواجب والانتظام. من غير ترتيب: أنت وبس، أحسن من امبارح.' } },
];

// The piece that lifts out of the phone on each screen.
const LIFT: Record<Step['key'], string[]> = {
  note: ['homework-first'],
  level: ['quran-level'],
  companion: [],
  milestones: ['surah', 'tajweed'],
  badges: ['lessons-10', 'rhythm-4', 'surah'],
};

const shot = (key: Step['key'], isEn: boolean) => `/media/portal/${isEn ? 'en' : 'ar'}-${key}.webp`;

function Phone({ step, isEn, still }: { step: Step; isEn: boolean; still?: boolean }) {
  return (
    <div className={`relative ${still ? 'w-[260px]' : 'h-[min(60svh,620px)] lg:h-[min(78svh,760px)] aspect-[390/844]'}`}>
      {/* Titanium frame, side keys, the island. */}
      <div className="relative h-full aspect-[390/844] rounded-[2.9rem] p-[7px] bg-[linear-gradient(145deg,#5A4A42,#1C1411_40%,#3B2E28_70%,#120C09)] shadow-[0_60px_120px_-40px_rgba(28,20,17,0.85),inset_0_1px_1px_rgba(255,255,255,0.25)]">
        <span aria-hidden="true" className="absolute -end-[3px] top-[22%] h-16 w-[3px] rounded-e bg-[#2A201B]" />
        <span aria-hidden="true" className="absolute -start-[3px] top-[18%] h-10 w-[3px] rounded-s bg-[#2A201B]" />
        <div className="relative h-full w-full overflow-hidden rounded-[2.4rem] bg-[#FAF7F2]">
          {/* All four screens stay mounted and crossfade inside the glass: nothing slides out of the phone. */}
          {(still ? [step] : STEPS).map((sc) => (
            <img
              key={sc.key + (isEn ? 'en' : 'ar')}
              src={shot(sc.key, isEn)}
              alt={sc.key === step.key ? (isEn ? `The student portal: ${sc.title.en}` : `بوابة الطالب: ${sc.title.ar}`) : ''}
              aria-hidden={sc.key === step.key ? undefined : true}
              width={780}
              height={1688}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="absolute inset-0 h-full w-full object-cover object-top select-none transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ opacity: sc.key === step.key ? 1 : 0, transform: sc.key === step.key ? 'none' : 'scale(1.03)' }}
            />
          ))}
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
      <Together isEn={isEn} />
    </div>
  );

  return (
    <>
    <div ref={ref} className="relative h-[440vh]">
      <div className="sticky top-0 h-[100svh] flex items-center">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-4 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 flex flex-col items-center">
            <Phone step={STEPS[i]} isEn={isEn} />
            <p className="mt-4 text-[11px] sm:text-xs text-muted-foreground text-center">
              {isEn ? 'Real screens, sample learner' : 'شاشات حقيقية، طالب توضيحي'}
            </p>
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-start pt-20 lg:pt-0">
            <div className="flex justify-center lg:justify-start gap-2" aria-hidden="true">
              {STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-10 bg-[#C51F24]' : k < i ? 'w-4 bg-[#E5A93C]' : 'w-4 bg-border'}`} />)}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14, transition: { duration: 0.18 } }} transition={{ duration: 0.55, ease: EXPO }} aria-live="polite">
                <p className="mt-4 font-editorial text-base sm:text-lg text-[#B4552F] dark:text-[#E5A93C] tabular-nums">{num(i + 1, isEn)} / {num(STEPS.length, isEn)}</p>
                <h3 className="mt-1 font-editorial font-bold text-[1.5rem] sm:text-5xl leading-tight text-foreground">{t(STEPS[i].title)}</h3>
                <p className="mt-2 text-sm sm:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">{t(STEPS[i].body)}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
    <Together isEn={isEn} />
    </>
  );
}

// Sample names on the class board: first names only, never a rank or a score (as in the portal).
const BOARD = [
  { name: { en: 'Yusuf', ar: 'يوسف' }, lessons: 8, weeks: 5 },
  { name: { en: 'Maryam', ar: 'مريم' }, lessons: 6, weeks: 3 },
  { name: { en: 'Adam', ar: 'آدم' }, lessons: 7, weeks: 4 },
];

/** Around the lessons: the community and our own classroom. */
function Together({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const n = (x: number) => num(x, isEn);
  const card = 'relative overflow-hidden rounded-[2rem] p-6 sm:p-8 ring-1 ring-[#E5A93C]/30 bg-[linear-gradient(160deg,#FFFFFF,#FAF3E6)] dark:bg-none dark:bg-card shadow-[0_30px_60px_-40px_rgba(92,52,30,0.45)]';
  const rise = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-15%' } };
  return (
    <div className="max-w-5xl mx-auto mt-10 lg:mt-0 grid gap-5 lg:grid-cols-2">
      <motion.div className={card} {...rise} transition={{ duration: 0.7, ease: EXPO }}>
        <h3 className="font-editorial font-bold text-2xl sm:text-3xl text-foreground">{isEn ? 'A community that cheers you on' : 'مجتمع يشجّعك'}</h3>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isEn
            ? 'The class board shows the effort of learners with the same teacher: lessons this month, weeks in a row. The Hall of Honor celebrates what you finish. Only our families see it, and only if you say yes.'
            : 'لوحة الحلقة بتوريك مجهود طلاب نفس المعلّم: حصص الشهر والأسابيع المتتالية. ولوحة الشرف بتحتفل باللي بتخلّصه. محدش يشوفها غير أسر الأكاديمية، وبموافقتك بس.'}
        </p>
        {/* The Hall of Honor ribbon, then the class board. */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-[linear-gradient(100deg,#C51F24,#951419)] px-4 py-3 text-[#FAF7F2] shadow-[0_14px_30px_-14px_rgba(197,31,36,0.8)]">
          <Medal id="khatma" className="w-12 h-12 shrink-0 drop-shadow-[0_6px_10px_rgba(0,0,0,0.35)]" />
          <div className="min-w-0">
            <p className="text-[11px] font-bold tracking-wide text-[#F6D58E]">{isEn ? 'HALL OF HONOR' : 'لوحة الشرف'}</p>
            <p className="font-bold leading-snug">{isEn ? 'Maryam finished Juz Amma' : 'مريم أتمّت جزء عمّ'}</p>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {BOARD.map((b, k) => (
            <motion.li key={b.name.en} className="flex items-center gap-3 rounded-2xl bg-white/80 dark:bg-[#FAF7F2]/[0.05] ring-1 ring-[#1C1411]/[0.06] px-3 py-2" initial={{ opacity: 0, x: isEn ? -20 : 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, ease: EXPO, delay: 0.25 + k * 0.12 }}>
              <span className="grid place-items-center w-9 h-9 rounded-full bg-[#F6D58E]/50 font-bold text-[#7E1216]">{t(b.name).slice(0, 1)}</span>
              <span className="font-bold text-foreground">{t(b.name)}</span>
              <span className="ms-auto inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><NotebookPen className="w-3.5 h-3.5 text-[#087D91]" aria-hidden="true" />{n(b.lessons)} {isEn ? 'lessons' : 'حصص'}</span>
              <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground"><Flame className="w-3.5 h-3.5 text-[#C51F24]" aria-hidden="true" />{n(b.weeks)} {isEn ? 'weeks' : 'أسابيع'}</span>
            </motion.li>
          ))}
        </ul>
        <p className="mt-3 text-[11px] text-muted-foreground">{isEn ? 'Sample names. No ranks, no scores.' : 'أسماء توضيحية. من غير ترتيب ولا درجات.'}</p>
      </motion.div>

      <motion.div className={card} {...rise} transition={{ duration: 0.7, ease: EXPO, delay: 0.12 }}>
        <h3 className="font-editorial font-bold text-2xl sm:text-3xl text-foreground">{isEn ? 'Our own classroom' : 'فصلنا الخاص'}</h3>
        <p className="mt-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {isEn ? 'Lessons happen right here on our site, in a room we built for teaching the Quran and Arabic. Nothing to install.' : 'الحصة بتحصل هنا على موقعنا، في فصل بنيناه لتعليم القرآن والعربي. من غير ما تنزّل أي برنامج.'}
        </p>
        {/* A sketch of the room: the shared board with the teacher writing, and the Arabic keyboard. */}
        <div className="mt-5 rounded-2xl ring-1 ring-[#1C1411]/10 bg-white dark:bg-[#FAF7F2]/[0.04] overflow-hidden" aria-hidden="true">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#1C1411]/[0.06]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C51F24]" /><span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]" /><span className="w-2.5 h-2.5 rounded-full bg-[#087D91]" />
            <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-[#087D91]/10 px-2 py-0.5 text-[10px] font-bold text-[#087D91]"><span className="w-1.5 h-1.5 rounded-full bg-[#087D91] animate-pulse" />{isEn ? 'In class' : 'في الحصة'}</span>
          </div>
          <div className="relative h-40 sm:h-44 bg-[radial-gradient(circle,rgba(28,20,17,0.07)_1px,transparent_1px)] [background-size:14px_14px]">
            <svg viewBox="0 0 320 150" className="absolute inset-0 w-full h-full">
              <motion.text x="160" y="88" textAnchor="middle" fontSize="56" fill="none" stroke="#C51F24" strokeWidth="1.4" style={{ fontFamily: "'Amiri Quran', serif", direction: 'rtl' }} initial={{ strokeDasharray: 600, strokeDashoffset: 600 }} whileInView={{ strokeDashoffset: 0 }} viewport={{ once: true }} transition={{ duration: 2.4, ease: 'easeInOut', delay: 0.4 }}>بِسْمِ اللَّهِ</motion.text>
              <motion.path d="M70 112 C 120 122, 200 122, 250 110" fill="none" stroke="#E5A93C" strokeWidth="3" strokeLinecap="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 2.4 }} />
            </svg>
            <span className="absolute top-3 end-3 grid place-items-center w-9 h-9 rounded-xl bg-[#1C1411]/[0.06] text-[#1C1411]/70 dark:text-[#FAF7F2]/70"><PenLine className="w-4 h-4" /></span>
          </div>
          <div className="flex flex-wrap justify-center gap-1 p-2 border-t border-[#1C1411]/[0.06]" dir="rtl">
            {['ا', 'ب', 'ت', 'ث', 'ج', 'ح', 'خ', 'د', 'ذ', 'ر'].map((l) => <span key={l} className="grid place-items-center min-w-7 h-7 rounded-md bg-[#FAF3E6] dark:bg-[#FAF7F2]/[0.06] text-sm font-bold text-foreground ring-1 ring-[#1C1411]/[0.06]">{l}</span>)}
          </div>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-foreground">
          {[
            { I: PenLine, en: 'A board we both write on', ar: 'سبّورة نكتب عليها سوا' },
            { I: Keyboard, en: 'An Arabic keyboard', ar: 'كيبورد عربي' },
            { I: Laptop, en: 'Pages and pictures on screen', ar: 'صفحات وصور على الشاشة' },
            { I: Check, en: 'Nothing to install', ar: 'من غير تحميل برامج' },
          ].map(({ I, en, ar }) => <li key={en} className="flex items-center gap-2"><I className="w-4 h-4 shrink-0 text-[#C51F24]" aria-hidden="true" />{isEn ? en : ar}</li>)}
        </ul>
      </motion.div>
    </div>
  );
}
