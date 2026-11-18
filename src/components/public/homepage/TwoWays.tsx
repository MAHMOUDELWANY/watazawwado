import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useInView, useReducedMotion } from 'motion/react';
import { Check, User, Users, CalendarClock } from 'lucide-react';

type L = { en: string; ar: string };

// Example children for the family card (no real learners). Each has their own subject, teacher and next lesson.
const KIDS: Array<{ initial: L; name: L; subject: L; teacher: L; next: L; tone: string }> = [
  { initial: { en: 'Y', ar: 'ي' }, name: { en: 'Yusuf, 9', ar: 'يوسف، ٩ سنين' }, subject: { en: 'Quran memorization', ar: 'حفظ القرآن' }, teacher: { en: 'with Ustadh', ar: 'مع أستاذ' }, next: { en: 'Tue 5:00 pm', ar: 'التلات ٥:٠٠ م' }, tone: '#087D91' },
  { initial: { en: 'M', ar: 'م' }, name: { en: 'Maryam, 12', ar: 'مريم، ١٢ سنة' }, subject: { en: 'The Zad Path · Teens', ar: 'مسار الأثر · الشباب' }, teacher: { en: 'with Ustadha', ar: 'مع أستاذة' }, next: { en: 'Wed 6:30 pm', ar: 'الأربع ٦:٣٠ م' }, tone: '#C51F24' },
  { initial: { en: 'A', ar: 'آ' }, name: { en: 'Adam, 6', ar: 'آدم، ٦ سنين' }, subject: { en: 'Arabic letters', ar: 'الحروف العربية' }, teacher: { en: 'with Ustadha', ar: 'مع أستاذة' }, next: { en: 'Sat 10:00 am', ar: 'السبت ١٠:٠٠ ص' }, tone: '#8B4935' },
];

function ExampleTag({ isEn }: { isEn: boolean }) {
  return <span className="rounded-full bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] font-bold text-[#7A4E09] dark:text-[#F6D58E]">{isEn ? 'EXAMPLE' : 'مثال'}</span>;
}

/** "For yourself": your next lesson, your progress filling, and a note from your teacher arriving. */
function SelfWindow({ isEn, play }: { isEn: boolean; play: boolean }) {
  const tr = (en: string, ar: string) => (isEn ? en : ar);
  return (
    <div className="rounded-[1.4rem] border border-border bg-background/80 p-4 text-start shadow-[0_18px_40px_-30px_rgba(18,16,14,0.5)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{tr('Your account', 'حسابك')}</span>
        <ExampleTag isEn={isEn} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="relative w-14 h-14 shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="10" />
            <motion.circle
              cx="50" cy="50" r="42" fill="none" stroke="#087D91" strokeWidth="10" strokeLinecap="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: play ? 0.64 : 0 }} transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-[11px] font-bold text-foreground tabular-nums" dir="ltr">64%</span>
        </div>
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{tr('Tajweed · level 2', 'التجويد · المستوى التاني')}</p>
          <p className="mt-0.5 inline-flex items-center gap-1.5 rounded-full bg-[#087D91]/10 px-2.5 py-1 text-[12px] font-semibold text-[#087D91] dark:text-[#12A4BC]">
            <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />{tr('Next: Thu 8:00 pm', 'الجاية: الخميس ٨:٠٠ م')}
          </p>
        </div>
      </div>
      <div className="mt-3 min-h-[3.25rem]">
        <AnimatePresence mode="wait">
          {play ? (
            <motion.p
              key="msg"
              initial={{ opacity: 0, y: 8, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 1.2, type: 'spring', bounce: 0.25, duration: 0.5 }}
              className="rounded-2xl rounded-ss-sm bg-surface-subtle px-3 py-2 text-[12.5px] leading-snug text-foreground"
            >
              <b className="block text-[10px] text-[#087D91] dark:text-[#12A4BC]">{tr('Your teacher', 'معلمك')}</b>
              {tr('Well done today. Next time we start the qalqalah.', 'أحسنت النهارده. الحصة الجاية نبدأ القلقلة.')}
            </motion.p>
          ) : <span key="empty" />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/** "For your family": one parent account, each child with their own teacher and plan; it moves from child to child. */
function FamilyWindow({ isEn, play }: { isEn: boolean; play: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const [kid, setKid] = useState(0);
  useEffect(() => {
    if (!play) return;
    const id = window.setInterval(() => setKid((k) => (k + 1) % KIDS.length), 2600);
    return () => window.clearInterval(id);
  }, [play]);
  const k = KIDS[kid];
  return (
    <div className="rounded-[1.4rem] border border-border bg-background/80 p-4 text-start shadow-[0_18px_40px_-30px_rgba(18,16,14,0.5)]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-foreground">{isEn ? 'Family account' : 'حساب العيلة'}</span>
        <ExampleTag isEn={isEn} />
      </div>
      <div className="mt-3 flex items-center gap-2" role="tablist" aria-label={isEn ? 'Children' : 'الأولاد'}>
        {KIDS.map((c, i) => (
          <button
            key={c.initial.en}
            type="button"
            role="tab"
            aria-selected={i === kid}
            onClick={() => setKid(i)}
            className="relative grid place-items-center w-9 h-9 rounded-full text-[13px] font-bold text-white cursor-pointer focus-ring"
            style={{ background: c.tone }}
          >
            {i === kid && <motion.span layoutId="kid-ring" className="absolute -inset-1 rounded-full border-2" style={{ borderColor: c.tone }} transition={{ type: 'spring', bounce: 0.3, duration: 0.5 }} />}
            {t(c.initial)}
          </button>
        ))}
        <span className="ms-auto text-[11px] text-muted-foreground">{isEn ? '3 learners' : '٣ طلاب'}</span>
      </div>
      <div className="mt-3 min-h-[4.75rem] overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={kid}
            initial={{ opacity: 0, x: isEn ? 18 : -18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: isEn ? -18 : 18 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="rounded-2xl bg-surface-subtle p-3"
          >
            <p className="text-[13px] font-bold text-foreground">{t(k.name)}</p>
            <p className="text-[12px] text-muted-foreground mt-0.5">{t(k.subject)} · {t(k.teacher)}</p>
            <p className="mt-1.5 inline-flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: k.tone }}>
              <CalendarClock className="w-3.5 h-3.5" aria-hidden="true" />{t(k.next)}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

const CARDS = [
  {
    key: 'self',
    icon: User,
    tone: 'from-[#087D91]/14 to-transparent border-[#087D91]/30 text-[#087D91] dark:text-[#12A4BC]',
    title: { en: 'Learn for yourself', ar: 'تعلّم لنفسك' },
    // MK-04: one line for young adults who drifted away.
    lead: { en: 'Drifted? Start where you are. No lectures.', ar: 'بعدت شوية؟ ابدأ من مكانك. من غير محاضرات.' },
    body: {
      en: 'Your own account: book lessons at times that suit you, follow your progress, and talk to your teacher in the on-site chat.',
      ar: 'حسابك الخاص: احجز دروسك في المواعيد التي تناسبك، وتابع تقدّمك، وراسل معلمك في المحادثة داخل الموقع.'
    },
    note: { en: 'Direct feedback from your teacher', ar: 'متابعة مباشرة من معلمك' },
  },
  {
    key: 'family',
    icon: Users,
    tone: 'from-[#8B4935]/14 to-transparent border-[#8B4935]/30 text-[#8B4935] dark:text-[#DA7960]',
    title: { en: 'Learn for your family', ar: 'تعلّم لعائلتك' },
    lead: null,
    body: {
      en: 'One parent account for every child. Each child has their own teacher and plan, and you see every lesson and note.',
      ar: 'حساب واحد لولي الأمر لكل الأولاد. لكل طفل معلمه وخطته، وإنت شايف كل حصة وكل ملاحظة.'
    },
    note: { en: '5% off a second child’s package', ar: 'خصم 5% على باقة الطفل التاني' },
  },
] as const;

/** Homepage: the two ways to learn, each arch card holding a small moving example of that account. */
export function TwoWays({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { amount: 0.35 });
  const reduce = useReducedMotion();
  // The prerendered HTML knows nothing of the visitor's motion setting: show the finished example only after mounting,
  // or reduced-motion visitors get a page that differs from the server's and React throws it away (error #418).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const play = inView || (mounted && Boolean(reduce));

  return (
    <div ref={ref} className="grid md:grid-cols-2 gap-6 lg:gap-8">
      {CARDS.map(({ key, icon: Icon, tone, title, lead, body, note }, i) => (
        <motion.article
          key={key}
          initial={reduce ? false : { opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{ duration: 0.6, delay: i * 0.12, ease: [0.2, 0.8, 0.2, 1] }}
          className={`arch-top relative overflow-hidden border bg-gradient-to-b ${tone} bg-surface shadow-[var(--shadow-2)] px-6 pt-12 pb-8 sm:px-9 text-center`}
        >
          <div className="arch-tile mx-auto mb-5 w-14 h-16 flex items-center justify-center bg-current/10 border border-current/25">
            <Icon className="w-7 h-7" aria-hidden="true" />
          </div>
          <h3 className="font-editorial text-2xl font-bold text-foreground mb-3">{t(title)}</h3>
          {lead && <p className="font-semibold text-foreground mb-2">{t(lead)}</p>}
          <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{t(body)}</p>
          <div className="mt-6 max-w-[21rem] mx-auto" aria-hidden={key === 'self' ? 'true' : undefined}>
            {key === 'self' ? <SelfWindow isEn={isEn} play={play} /> : <FamilyWindow isEn={isEn} play={inView && !reduce} />}
          </div>
          <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold">
            <Check className="w-4 h-4" aria-hidden="true" />
            <span>{t(note)}</span>
          </p>
        </motion.article>
      ))}
    </div>
  );
}
