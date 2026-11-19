import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Award, FileUp, Flame, Keyboard, Medal as Medal3, Mic, MonitorUp, PenLine, Users } from 'lucide-react';
import { EXPO, num, type L } from './Journey';

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

type Point = { I: typeof Award; t: L; b: L };
const sample = { en: 'Sample names', ar: 'أسماء توضيحية' };

/** A browser-like window, so a mockup reads as a screen of the site. */
function Screen({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rounded-[1.6rem] bg-white dark:bg-[#1C1411] ring-1 ring-[#1C1411]/10 dark:ring-[#FAF7F2]/10 shadow-[0_40px_80px_-40px_rgba(92,52,30,0.6)] overflow-hidden" aria-hidden="true">
      <div className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[#1C1411]/[0.07] dark:border-[#FAF7F2]/10 bg-[#FAF7F2] dark:bg-[#24160F]">
        <span className="w-2.5 h-2.5 rounded-full bg-[#C51F24]/70" /><span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C]/80" /><span className="w-2.5 h-2.5 rounded-full bg-[#087D91]/70" />
        <span className="ms-3 rounded-full bg-white dark:bg-[#1C1411] px-3 py-0.5 text-[11px] font-semibold text-muted-foreground ring-1 ring-[#1C1411]/[0.06]">watazawwado.academy · {title}</span>
      </div>
      {children}
    </div>
  );
}

const HONOR = [
  { medal: 'surah', name: { en: 'Yusuf', ar: 'يوسف' }, what: { en: 'Memorised Surat Al-Mulk', ar: 'حفظ سورة الملك' }, sub: { en: 'Quran', ar: 'القرآن' } },
  { medal: 'tajweed', name: { en: 'Maryam', ar: 'مريم' }, what: { en: 'Mastered the rules of noon sakinah', ar: 'أتقنت أحكام النون الساكنة' }, sub: { en: 'Tajweed', ar: 'التجويد' } },
  { medal: 'language-level', name: { en: 'Adam', ar: 'آدم' }, what: { en: 'Finished Fusha level 1', ar: 'أنهى المستوى الأول في الفصحى' }, sub: { en: 'Arabic', ar: 'العربية' } },
];
const BOARD = [
  { name: { en: 'Yusuf', ar: 'يوسف' }, lessons: 8, weeks: 5 },
  { name: { en: 'Huda', ar: 'هدى' }, lessons: 6, weeks: 3 },
  { name: { en: 'Adam', ar: 'آدم' }, lessons: 7, weeks: 4 },
];

function CommunityScreen({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const n = (x: number) => num(x, isEn);
  return (
    <Screen title={isEn ? 'Our community' : 'مجتمعنا'}>
      <div className="p-4 sm:p-5 grid gap-4">
        <div className="flex items-center justify-between">
          <p className="font-editorial font-bold text-lg text-foreground">{isEn ? 'Hall of Honor · November' : 'لوحة الشرف · نوفمبر'}</p>
          <span className="rounded-full bg-[#F6D58E]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#7E1216]">{t(sample)}</span>
        </div>
        <ul className="grid gap-2.5">
          {HONOR.map((h, k) => (
            <motion.li key={h.name.en} className="flex items-center gap-3 rounded-2xl bg-[#FAF7F2] dark:bg-[#FAF7F2]/[0.05] ring-1 ring-[#E5A93C]/25 p-3"
              initial={{ opacity: 0, y: 16, scale: 0.96 }} whileInView={{ opacity: 1, y: 0, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.55, ease: EXPO, delay: 0.2 + k * 0.15 }}>
              <motion.img src={`/badges/shelf/${h.medal}.webp`} alt="" width={180} height={180} loading="lazy" className="w-12 h-12 shrink-0 drop-shadow-[0_8px_10px_rgba(28,20,17,0.3)]"
                initial={{ rotate: -30, scale: 0.4 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true }} transition={{ type: 'spring', stiffness: 220, damping: 12, delay: 0.35 + k * 0.15 }} />
              <div className="min-w-0">
                <p className="font-bold text-foreground leading-tight">{t(h.name)}</p>
                <p className="text-sm text-foreground/80 leading-snug">{t(h.what)}</p>
                <p className="text-[11px] text-muted-foreground">{t(h.sub)}</p>
              </div>
            </motion.li>
          ))}
        </ul>
        <div className="rounded-2xl ring-1 ring-[#1C1411]/[0.07] dark:ring-[#FAF7F2]/10 p-3.5">
          <p className="font-bold text-sm text-foreground">{isEn ? 'Class board · your teacher’s learners' : 'لوحة الحلقة · طلاب معلّمك'}</p>
          <ul className="mt-2.5 grid gap-2">
            {BOARD.map((b, k) => (
              <li key={b.name.en} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 text-sm">
                <span className="font-bold text-foreground truncate">{t(b.name)}</span>
                <span className="h-2.5 rounded-full bg-[#1C1411]/[0.06] dark:bg-[#FAF7F2]/10 overflow-hidden">
                  <motion.span className="block h-full rounded-full bg-[linear-gradient(90deg,#C51F24,#E5A93C,#087D91)]" initial={{ width: 0 }} whileInView={{ width: `${(b.lessons / 8) * 100}%` }} viewport={{ once: true }} transition={{ duration: 1.1, ease: EXPO, delay: 0.6 + k * 0.12 }} />
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-bold text-muted-foreground tabular-nums"><Flame className="w-3.5 h-3.5 text-[#C51F24]" />{n(b.weeks)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted-foreground">{isEn ? 'Lessons this month and weeks in a row. No rank, no score.' : 'حصص الشهر والأسابيع المتتالية. من غير ترتيب ولا درجات.'}</p>
        </div>
      </div>
    </Screen>
  );
}

function ClassroomScreen({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const draw = reduce ? {} : { initial: { pathLength: 0 }, whileInView: { pathLength: 1 }, viewport: { once: true } };
  return (
    <Screen title={isEn ? 'Classroom' : 'الفصل'}>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-2.5 p-3 bg-[#2A1A14]">
        {/* The shared board: the lesson page on one side, the teacher's pen and the learner's on the other. */}
        <div className="relative rounded-xl bg-[#FFFDF8] overflow-hidden min-h-[15rem] sm:min-h-[17rem] bg-[radial-gradient(circle,rgba(28,20,17,0.08)_1px,transparent_1px)] [background-size:14px_14px]">
          <div className="absolute top-2.5 start-2.5 w-[34%] max-w-[9rem] rounded-lg overflow-hidden ring-1 ring-[#1C1411]/10 shadow-md rotate-[-2deg]">
            <img src="/curriculum/banners/fusha-kids.webp" alt="" width={1000} height={1000} loading="lazy" className="block w-full aspect-[4/3] object-cover" />
            <p className="bg-white px-2 py-1 text-[10px] font-bold text-foreground/80">{isEn ? 'Lesson 4 · page 2' : 'الدرس ٤ · صفحة ٢'}</p>
          </div>
          <svg viewBox="0 0 300 200" className="absolute inset-0 w-full h-full">
            {/* the teacher writes the letter (crimson) */}
            <motion.path d="M250 70 C 250 110, 230 122, 200 122 L 140 122 C 120 122, 118 104, 124 94" fill="none" stroke="#C51F24" strokeWidth="7" strokeLinecap="round" {...draw} transition={{ duration: 1.3, ease: 'easeInOut', delay: 0.4 }} />
            <motion.circle cx="190" cy="142" r="6" fill="#C51F24" initial={reduce ? false : { scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ delay: 1.7 }} />
            {/* the learner traces it back (teal) */}
            <motion.path d="M250 150 C 250 182, 232 190, 206 190 L 150 190 C 132 190, 130 176, 135 168" fill="none" stroke="#087D91" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 0" {...draw} transition={{ duration: 1.4, ease: 'easeInOut', delay: 2.1 }} />
            <motion.path d="M118 60 l 20 -8" stroke="#E5A93C" strokeWidth="5" strokeLinecap="round" {...draw} transition={{ duration: 0.4, delay: 3.6 }} />
          </svg>
          <span className="absolute bottom-2 end-2 inline-flex items-center gap-1 rounded-full bg-[#087D91]/10 px-2 py-0.5 text-[10px] font-bold text-[#087D91]"><PenLine className="w-3 h-3" />{isEn ? 'Yusuf is writing' : 'يوسف بيكتب'}</span>
        </div>
        {/* Two people, shown as arches with initials (the room shows cameras; no faces on our site). */}
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-2.5 content-start">
          {[{ i: isEn ? 'T' : 'م', l: isEn ? 'Teacher' : 'المعلّم', c: '#C51F24' }, { i: isEn ? 'Y' : 'ي', l: isEn ? 'Yusuf' : 'يوسف', c: '#087D91' }].map((p) => (
            <div key={p.l} className="relative aspect-[16/9] sm:aspect-[4/5] rounded-xl bg-[#3B2219] grid place-items-center overflow-hidden">
              <span className="grid place-items-center w-12 h-14 rounded-t-full rounded-b-lg text-lg font-bold text-white" style={{ background: p.c }}>{p.i}</span>
              <span className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between text-[10px] font-bold text-[#FAF7F2]/90"><span>{p.l}</span><Mic className="w-3 h-3 text-[#F6D58E]" /></span>
            </div>
          ))}
        </div>
      </div>
      {/* The bar: pens, the Arabic keyboard, pages, screen share. */}
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2.5 bg-[#24160F]">
        {['#C51F24', '#087D91', '#E5A93C'].map((c) => <span key={c} className="w-5 h-5 rounded-full ring-2 ring-white/70" style={{ background: c }} />)}
        <span className="mx-1 h-5 w-px bg-white/15" />
        {[Keyboard, FileUp, MonitorUp].map((I, k) => <span key={k} className="grid place-items-center w-8 h-8 rounded-lg bg-white/10 text-[#FAF7F2]/90"><I className="w-4 h-4" /></span>)}
        <span className="ms-auto flex gap-1" dir="rtl">{['ا', 'ب', 'ت', 'ث', 'ج'].map((l) => <span key={l} className="grid place-items-center w-6 h-6 rounded-md bg-[#FAF7F2] text-xs font-bold text-[#1C1411]">{l}</span>)}</span>
      </div>
    </Screen>
  );
}

const PANELS: { key: 'community' | 'classroom'; kicker: L; title: L; lead: L; points: Point[] }[] = [
  {
    key: 'community',
    kicker: { en: 'Our community', ar: 'مجتمعنا' },
    title: { en: 'Effort that others see, and cheer.', ar: 'مجهود الكل بيشوفه، ويفرح بيه.' },
    lead: { en: 'A closed community, only for our families and students. Nothing about your child is shown unless you say yes.', ar: 'مجتمع مقفول على أسرنا وطلابنا بس. ومفيش حاجة عن ابنك بتظهر غير بموافقتك.' },
    points: [
      { I: Award, t: { en: 'The Hall of Honor', ar: 'لوحة الشرف' }, b: { en: 'Each month we celebrate what was finished: a surah memorised, a rule mastered, a level passed. Only the name you choose and the achievement.', ar: 'كل شهر بنحتفل باللي اتخلّص: سورة اتحفظت، حكم اتقن، مستوى اتعدّى. بالاسم اللي تختاره والإنجاز بس.' } },
      { I: Users, t: { en: 'The class board', ar: 'لوحة الحلقة' }, b: { en: 'Learners with the same teacher see each other’s effort: lessons this month, weeks in a row. A gentle push, never a rank.', ar: 'طلاب نفس المعلّم بيشوفوا مجهود بعض: حصص الشهر والأسابيع المتتالية. دفعة لطيفة، من غير ترتيب.' } },
      { I: Medal3, t: { en: 'Medals and a companion', ar: 'أوسمة ورفيق' }, b: { en: 'Every step earns a medal on their shelf, and their companion grows with them.', ar: 'كل خطوة ليها وسام على رفّهم، ورفيقهم بيكبر معاهم.' } },
    ],
  },
  {
    key: 'classroom',
    kicker: { en: 'Our own classroom', ar: 'فصلنا الخاص' },
    title: { en: 'One room, built for how we teach.', ar: 'فصل واحد، مبني على طريقة تعليمنا.' },
    lead: { en: 'Every subject, from the Quran and Tajweed to Arabic, English and the Zad Path, happens right here on our site. Nothing to install.', ar: 'كل المواد، من القرآن والتجويد للعربي والإنجليزي ومنهج زاد، بتحصل هنا على موقعنا. من غير ما تنزّل أي برنامج.' },
    points: [
      { I: PenLine, t: { en: 'A board you both write on', ar: 'سبّورة بتكتبوا عليها سوا' }, b: { en: 'The teacher writes in one colour, the learner answers in another, on the same board.', ar: 'المعلّم يكتب بلون، والطالب يرد بلون تاني، على نفس السبّورة.' } },
      { I: FileUp, t: { en: 'The lesson page in front of both of you', ar: 'صفحة الدرس قدامكم انتو الاتنين' }, b: { en: 'The teacher puts the page, a picture or the screen on the board, so you look at the same thing.', ar: 'المعلّم يحط الصفحة أو صورة أو شاشته على السبّورة، فتبصّوا على نفس الحاجة.' } },
      { I: Keyboard, t: { en: 'An Arabic keyboard', ar: 'كيبورد عربي' }, b: { en: 'Arabic letters on screen, even on a computer that has none.', ar: 'حروف عربي على الشاشة، حتى لو جهازك مفيهوش.' } },
    ],
  },
];

/** Around the lessons: the community and our own classroom, each with a screen that shows how it works. */
function Together({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <div className="max-w-6xl mx-auto mt-10 lg:mt-4 space-y-8">
      {PANELS.map((p, k) => (
        <motion.article
          key={p.key}
          className="relative overflow-hidden rounded-[2.25rem] ring-1 ring-[#E5A93C]/30 bg-[radial-gradient(40rem_22rem_at_90%_0%,rgba(229,169,60,0.18),transparent_60%),linear-gradient(160deg,#FFFFFF,#F7EEDD)] dark:bg-none dark:bg-card p-6 sm:p-8 lg:p-10 grid gap-8 lg:grid-cols-2 items-center"
          initial={reduce ? false : { opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.8, ease: EXPO }}
        >
          <div>
            <p className="font-editorial text-base text-[#B4552F] dark:text-[#E5A93C]">{t(p.kicker)}</p>
            <h3 className="mt-1 font-editorial font-bold text-2xl sm:text-4xl leading-tight text-foreground">{t(p.title)}</h3>
            <p className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed">{t(p.lead)}</p>
            <ul className="mt-6 space-y-5">
              {p.points.map(({ I, t: title, b }, j) => (
                <motion.li key={title.en} className="flex gap-4" initial={reduce ? false : { opacity: 0, x: isEn ? -16 : 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EXPO, delay: 0.2 + j * 0.12 }}>
                  <span className="grid place-items-center shrink-0 w-11 h-11 rounded-2xl bg-[linear-gradient(145deg,#E3343A,#951419)] text-[#FAF7F2] shadow-[0_10px_20px_-10px_rgba(197,31,36,0.8)]"><I className="w-5 h-5" aria-hidden="true" /></span>
                  <div>
                    <p className="font-bold text-foreground">{t(title)}</p>
                    <p className="mt-0.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">{t(b)}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
          <div className={k % 2 ? 'lg:order-first' : ''}>
            {p.key === 'community' ? <CommunityScreen isEn={isEn} /> : <ClassroomScreen isEn={isEn} />}
          </div>
        </motion.article>
      ))}
    </div>
  );
}
