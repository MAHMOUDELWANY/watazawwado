import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { Award, BookOpen, Keyboard, Medal as Medal3, PenLine, Users } from 'lucide-react';
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
const PANELS: { img: string; kicker: L; title: L; lead: L; points: Point[] }[] = [
  {
    img: '/media/home/honor.webp',
    kicker: { en: 'Our community', ar: 'مجتمعنا' },
    title: { en: 'Effort that others see, and cheer.', ar: 'مجهود الكل بيشوفه، ويفرح بيه.' },
    lead: { en: 'A closed community, only for our families and students. Nothing about your child is shown unless you say yes.', ar: 'مجتمع مقفول على أسرنا وطلابنا بس. ومفيش حاجة عن ابنك بتظهر غير بموافقتك.' },
    points: [
      { I: Award, t: { en: 'The Hall of Honor', ar: 'لوحة الشرف' }, b: { en: 'Each month we celebrate what was finished: a surah memorised, a level passed. Only the name you choose and the achievement.', ar: 'كل شهر بنحتفل باللي اتخلّص: سورة اتحفظت، مستوى اتعدّى. بالاسم اللي تختاره والإنجاز بس.' } },
      { I: Users, t: { en: 'The class board', ar: 'لوحة الحلقة' }, b: { en: 'Learners with the same teacher see each other’s effort: lessons this month, weeks in a row. A gentle push, never a rank or a score.', ar: 'طلاب نفس المعلّم بيشوفوا مجهود بعض: حصص الشهر والأسابيع المتتالية. دفعة لطيفة، من غير ترتيب ولا درجات.' } },
      { I: Medal3, t: { en: 'Medals and a companion', ar: 'أوسمة ورفيق' }, b: { en: 'Every step earns a medal on their shelf, and their companion grows with them.', ar: 'كل خطوة ليها وسام على رفّهم، ورفيقهم بيكبر معاهم.' } },
    ],
  },
  {
    img: '/media/home/class.webp',
    kicker: { en: 'Our own classroom', ar: 'فصلنا الخاص' },
    title: { en: 'A room built for the Quran and Arabic.', ar: 'فصل معمول للقرآن والعربي.' },
    lead: { en: 'Lessons happen right here on our site, in a classroom we built for how these subjects are taught. Nothing to install.', ar: 'الحصة بتحصل هنا على موقعنا، في فصل بنيناه على طريقة تعليم المواد دي. من غير ما تنزّل أي برنامج.' } ,
    points: [
      { I: PenLine, t: { en: 'A board you both write on', ar: 'سبّورة بتكتبوا عليها سوا' }, b: { en: 'The teacher draws a letter, the learner traces it back, on the same board.', ar: 'المعلّم يرسم الحرف، والطالب يكتبه وراه، على نفس السبّورة.' } },
      { I: Keyboard, t: { en: 'An Arabic keyboard', ar: 'كيبورد عربي' }, b: { en: 'Arabic letters on screen, even on a computer that has none.', ar: 'حروف عربي على الشاشة، حتى لو جهازك مفيهوش.' } },
      { I: BookOpen, t: { en: 'The page in front of both of you', ar: 'الصفحة قدامكم انتو الاتنين' }, b: { en: 'The teacher opens the lesson page or picture on the board, so you look at the same thing.', ar: 'المعلّم يفتح صفحة الدرس أو الصورة على السبّورة، فتبصّوا على نفس الحاجة.' } },
    ],
  },
];

/** Around the lessons: the community and our own classroom, each with its picture and what it means for you. */
function Together({ isEn }: { isEn: boolean }) {
  const reduce = useReducedMotion();
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <div className="max-w-6xl mx-auto mt-10 lg:mt-4 space-y-8">
      {PANELS.map((p, k) => (
        <motion.article
          key={p.img}
          className="relative overflow-hidden rounded-[2.25rem] ring-1 ring-[#E5A93C]/30 bg-[linear-gradient(160deg,#FFFFFF,#F7EEDD)] dark:bg-none dark:bg-card shadow-[0_40px_80px_-50px_rgba(92,52,30,0.55)] grid lg:grid-cols-2"
          initial={reduce ? false : { opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-12%' }}
          transition={{ duration: 0.8, ease: EXPO }}
        >
          {/* The picture: a slow push-in as it arrives. */}
          <div className={`relative min-h-[240px] sm:min-h-[320px] overflow-hidden ${k % 2 ? 'lg:order-2' : ''}`}>
            <motion.img
              src={p.img}
              alt=""
              width={1200}
              height={670}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              initial={reduce ? false : { scale: 1.15 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.8, ease: EXPO }}
            />
            <span aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(14,9,7,0.75))]" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="font-editorial text-sm sm:text-base text-[#F6D58E]">{t(p.kicker)}</p>
              <h3 className="mt-1 font-editorial font-bold text-2xl sm:text-4xl leading-tight text-[#FAF7F2]">{t(p.title)}</h3>
            </div>
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="text-base sm:text-lg text-foreground leading-relaxed">{t(p.lead)}</p>
            <ul className="mt-6 space-y-5">
              {p.points.map(({ I, t: title, b }, j) => (
                <motion.li key={title.en} className="flex gap-4" initial={reduce ? false : { opacity: 0, x: isEn ? -16 : 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6, ease: EXPO, delay: 0.2 + j * 0.12 }}>
                  <span className="grid place-items-center shrink-0 w-11 h-11 rounded-2xl bg-[linear-gradient(145deg,#FFF1C9,#E5A93C_60%,#B4552F)] text-[#5A0C0F] shadow-[0_10px_20px_-10px_rgba(180,85,47,0.8)]"><I className="w-5 h-5" aria-hidden="true" /></span>
                  <div>
                    <p className="font-bold text-foreground">{t(title)}</p>
                    <p className="mt-0.5 text-sm sm:text-[15px] text-muted-foreground leading-relaxed">{t(b)}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.article>
      ))}
    </div>
  );
}
