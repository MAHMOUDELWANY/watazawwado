import React from 'react';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react';
import { CalendarCheck, Check, Lock, Video } from 'lucide-react';
import { EXPO, num, type L } from './Journey';

/**
 * Station 03, success shown (not promised): a pinned phone whose screen changes as you scroll. Booked → the lesson is
 * live (the teacher opened the room) → the note arrives → the path moves on. Every screen is a labelled example.
 * Reduced motion and tiny screens without room get the four screens as a plain list.
 */

type Step = { title: L; body: L };
const STEPS: Step[] = [
  { title: { en: 'Booked, at your time', ar: 'اتحجزت، في ميعادك' }, body: { en: 'Pick a slot that fits your week. The same teacher every time.', ar: 'اختار ميعاد يناسب أسبوعك. ونفس المعلّم كل مرة.' } },
  { title: { en: 'The teacher opens the room', ar: 'المعلّم هو اللي يفتح الغرفة' }, body: { en: 'One teacher, your child, nobody else. Nothing is recorded, and you can sit in.', ar: 'معلّم واحد وطفلك، ومحدش غيرهم. مفيش تسجيل، وتقدر تحضر.' } },
  { title: { en: 'The note arrives', ar: 'التقرير يوصلك' }, body: { en: 'What was learned and what to practise, before you have to ask.', ar: 'اتعلّم إيه ويراجع إيه، قبل ما تسأل.' } },
  { title: { en: 'The path moves on', ar: 'والطريق بيكمّل' }, body: { en: 'Each level builds on the last. The teacher never starts from zero.', ar: 'كل مستوى مبني على اللي قبله. والمعلّم عمره ما يبدأ من الصفر.' } },
];

function Screen({ i, isEn }: { i: number; isEn: boolean }) {
  const t = (en: string, ar: string) => (isEn ? en : ar);
  const lines = (ws: number[], d = 0.2) => ws.map((w, k) => (
    <motion.div key={k} className="h-2 rounded-full bg-[#1C1411]/12" initial={{ width: 0 }} animate={{ width: `${w}%` }} transition={{ delay: d + k * 0.12, duration: 0.5, ease: EXPO }} />
  ));
  if (i === 0) return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#1C1411]/60">{t('Your lessons', 'حصصك')}</p>
      {[{ d: t('Mon', 'الإثنين'), h: '17:00', on: true }, { d: t('Wed', 'الأربعاء'), h: '17:00' }, { d: t('Sat', 'السبت'), h: '11:00' }].map((r, k) => (
        <motion.div key={k} className={`flex items-center gap-2.5 rounded-xl p-2.5 ${r.on ? 'bg-[#087D91] text-[#FAF7F2]' : 'bg-[#1C1411]/[0.05] text-[#1C1411]'}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + k * 0.1, duration: 0.5, ease: EXPO }}>
          <CalendarCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-xs font-bold">{r.d}</span>
          <span className="ms-auto text-xs tabular-nums">{r.h}</span>
        </motion.div>
      ))}
      <p className="text-[11px] text-[#1C1411]/60">{t('Quran · same teacher', 'قرآن · نفس المعلّم')}</p>
    </div>
  );
  if (i === 1) return (
    <div className="space-y-3">
      <div className="relative grid grid-cols-2 gap-2">
        {[t('Teacher', 'المعلّم'), t('Your child', 'طفلك')].map((n, k) => (
          <motion.div key={k} className="aspect-[3/4] rounded-xl bg-[linear-gradient(160deg,#3B2219,#1C1411)] grid place-items-center text-[#F6D58E]" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 + k * 0.15, duration: 0.5, ease: EXPO }}>
            <svg viewBox="0 0 48 48" className="w-10 h-10" aria-hidden="true"><circle cx="24" cy="17" r="7.5" fill="currentColor" /><path d="M8 46c0-10 7-15 16-15s16 5 16 15z" fill="currentColor" /></svg>
            <span className="absolute mt-24 text-[10px] font-bold text-[#FAF7F2]/80">{n}</span>
          </motion.div>
        ))}
      </div>
      <div className="flex items-center gap-2 rounded-xl bg-[#C51F24]/10 p-2 text-[11px] font-bold text-[#C51F24]">
        <motion.span className="w-2 h-2 rounded-full bg-[#C51F24]" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.2, repeat: Infinity }} />
        {t('Live · 1-on-1', 'مباشر · حصة فردية')}
        <Video className="w-3.5 h-3.5 ms-auto" aria-hidden="true" />
      </div>
      <p className="flex items-center gap-1.5 text-[11px] text-[#1C1411]/70"><Lock className="w-3.5 h-3.5" aria-hidden="true" />{t('Opened by the teacher · not recorded', 'المعلّم فتح الغرفة · بدون تسجيل')}</p>
    </div>
  );
  if (i === 2) return (
    <div className="space-y-3">
      <p className="text-[11px] font-bold text-[#1C1411]/60">{t('After the lesson', 'بعد الحصة')}</p>
      <div className="rounded-xl border-s-4 border-[#E5A93C] bg-[#FBF4E6] p-3 space-y-2">
        <p className="text-[10px] font-bold text-[#7A4E09]">{t("From the teacher's notes", 'من ملاحظات المعلّم')}</p>
        {lines([92, 78, 86, 54])}
      </div>
      <div className="flex gap-1.5">{lines([40], 0.8)}</div>
      <motion.p className="flex items-center gap-1.5 text-[11px] font-bold text-[#087D91]" initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 1, type: 'spring', stiffness: 320, damping: 16 }}>
        <span className="grid place-items-center w-5 h-5 rounded-full bg-[#087D91] text-[#FAF7F2]"><Check className="w-3 h-3" aria-hidden="true" /></span>{t('Sent to you', 'وصلك')}
      </motion.p>
    </div>
  );
  return (
    <div className="space-y-2.5">
      <p className="text-[11px] font-bold text-[#1C1411]/60">{t('The path · Tajweed', 'الطريق · التجويد')}</p>
      {[t('Level 1', 'المستوى الأول'), t('Level 2', 'المستوى الثاني'), t('Level 3', 'المستوى الثالث')].map((lv, k) => (
        <motion.div key={k} className="flex items-center gap-2.5" initial={{ opacity: 0, x: isEn ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + k * 0.12, duration: 0.5, ease: EXPO }}>
          <span className={`grid place-items-center w-6 h-6 shrink-0 rounded-full text-[10px] font-bold ${k === 0 ? 'bg-[#087D91] text-white' : k === 1 ? 'bg-[#E5A93C] text-[#2A1A04]' : 'bg-[#1C1411]/10 text-[#1C1411]/50'}`}>{k === 0 ? <Check className="w-3 h-3" aria-hidden="true" /> : k + 1}</span>
          <span className="flex-1">
            <span className="block text-xs font-bold text-[#1C1411]">{lv}</span>
            {k === 1 && <span className="mt-1 block h-1.5 rounded-full bg-[#1C1411]/10 overflow-hidden"><motion.span className="block h-full rounded-full bg-[linear-gradient(90deg,#C51F24,#E5A93C,#087D91)]" initial={{ width: '0%' }} animate={{ width: '55%' }} transition={{ delay: 0.5, duration: 1, ease: EXPO }} /></span>}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function Phone({ i, isEn }: { i: number; isEn: boolean }) {
  return (
    <div className="relative w-[190px] sm:w-[260px] aspect-[9/18.5] rounded-[2.4rem] border-[7px] border-[#1C1411] bg-[#FAF7F2] shadow-[0_50px_100px_-40px_rgba(28,20,17,0.8)] overflow-hidden">
      <span aria-hidden="true" className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-[#1C1411]" />
      <div className="px-4 pt-11 pb-4" dir={isEn ? 'ltr' : 'rtl'}>
        <div className="flex items-center justify-between">
          <span className="font-editorial font-bold text-sm text-[#1C1411]">{isEn ? 'Watazawwado' : 'وتزوّدوا'}</span>
          <span className="rounded-full bg-[#E5A93C]/25 px-2 py-0.5 text-[9px] font-bold text-[#7A4E09]">{isEn ? 'EXAMPLE' : 'مثال'}</span>
        </div>
        <div className="mt-4">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={i} initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }} animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: -10, filter: 'blur(6px)', transition: { duration: 0.18 } }} transition={{ duration: 0.45, ease: EXPO }}>
              <Screen i={i} isEn={isEn} />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
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

  if (reduce) return (
    <div className="grid gap-10 sm:grid-cols-2 max-w-5xl mx-auto">
      {STEPS.map((s, k) => (
        <div key={k} className="flex flex-col items-center text-center gap-4">
          <Phone i={k} isEn={isEn} />
          <h3 className="font-editorial font-bold text-2xl text-foreground">{t(s.title)}</h3>
          <p className="text-muted-foreground">{t(s.body)}</p>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="relative h-[340vh]">
      <div className="sticky top-0 h-[100svh] flex items-center">
        <div className="w-full max-w-5xl mx-auto grid lg:grid-cols-2 gap-6 lg:gap-16 items-center">
          <div className="order-2 lg:order-1 flex justify-center">
            <Phone i={i} isEn={isEn} />
          </div>
          <div className="order-1 lg:order-2 text-center lg:text-start pt-28 lg:pt-0">
            <div className="flex justify-center lg:justify-start gap-2" aria-hidden="true">
              {STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full transition-all duration-500 ${k === i ? 'w-10 bg-[#C51F24]' : k < i ? 'w-4 bg-[#E5A93C]' : 'w-4 bg-border'}`} />)}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={i} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14, transition: { duration: 0.18 } }} transition={{ duration: 0.55, ease: EXPO }} aria-live="polite">
                <p className="mt-5 font-editorial text-lg text-[#B4552F] dark:text-[#E5A93C] tabular-nums">{num(i + 1, isEn)} / {num(STEPS.length, isEn)}</p>
                <h3 className="mt-1 font-editorial font-bold text-[1.75rem] sm:text-5xl leading-tight text-foreground">{t(STEPS[i].title)}</h3>
                <p className="mt-3 text-sm sm:text-xl text-muted-foreground leading-relaxed max-w-md mx-auto lg:mx-0">{t(STEPS[i].body)}</p>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
