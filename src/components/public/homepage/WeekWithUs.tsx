import React, { useEffect, useRef, useState } from 'react';
import { Check, Mic, Mail, Play } from 'lucide-react';

type L = { en: string; ar: string };

// What a family actually gets around the lesson, in the order a week goes. Each line is a feature that exists today
// (lesson room, homework, today's review, recitations, weekly email, progress and certificates); keep it that way.
// `why` is what it changes for someone who does not know us yet.
const STEPS: Array<{ when: L; title: L; body: L; why: L }> = [
  {
    when: { en: 'In the lesson', ar: 'في الحصة' },
    title: { en: 'One teacher, one learner, live', ar: 'معلم واحد وطالب واحد، مباشر' },
    body: { en: 'On Zoom, with our lesson slides on your screen. They move as the teacher teaches.', ar: 'على Zoom، وشرائح الدرس قدامك على الشاشة، بتتحرك مع شرح المعلم.' },
    why: { en: 'The whole lesson is about one learner: their pace, their mistakes.', ar: 'الحصة كلها لطالب واحد: على قد سرعته، وبتصحّح غلطه هو.' },
  },
  {
    when: { en: 'After the lesson', ar: 'بعد الحصة' },
    title: { en: 'Homework, short and clear', ar: 'واجب قصير وواضح' },
    body: { en: 'One to three small tasks from the teacher. You tick them off at home, and the teacher sees it.', ar: 'من مهمة لتلات مهام صغيرة من المعلم. بتعلّم عليها في البيت، والمعلم بيشوفها.' },
    why: { en: 'You always know what to do before the next lesson.', ar: 'دايمًا عارف تعمل إيه قبل الحصة الجاية.' },
  },
  {
    when: { en: 'Every day', ar: 'كل يوم' },
    title: { en: 'Five minutes of review', ar: 'خمس دقايق مراجعة' },
    body: { en: 'What you memorized comes back on a growing gap, so it stays with you.', ar: 'اللي حفظته بيرجعلك على مسافات بتكبر، عشان يفضل معاك.' },
    why: { en: 'What you memorize does not fade between lessons.', ar: 'اللي بتحفظه ما بيضيعش بين الحصة والتانية.' },
  },
  {
    when: { en: 'Between lessons', ar: 'بين الحصص' },
    title: { en: 'Recite, and hear back', ar: 'سمّع، وخد الرد' },
    // Recording lives in recitation homework (RecitationRecorder in HomeworkCard), not in the chat.
    body: { en: 'When the homework is a recitation, record it on your phone. Your teacher listens and replies.', ar: 'لما يكون الواجب تسميع، سجّل تلاوتك من الموبايل، والمعلم بيسمعها ويرد عليك.' },
    why: { en: 'A mistake gets corrected before it settles in.', ar: 'الغلطة بتتصحّح قبل ما تثبت.' },
  },
  {
    when: { en: 'Every week', ar: 'كل أسبوع' },
    title: { en: 'A note for parents', ar: 'رسالة للأهل' },
    body: { en: 'The week’s lessons, the teacher’s words and the homework, in one email.', ar: 'حصص الأسبوع وكلام المعلم والواجب، في إيميل واحد.' },
    why: { en: 'Parents know how the week went without having to ask.', ar: 'الأهل عارفين الأسبوع مشي إزاي من غير ما يسألوا.' },
  },
  {
    when: { en: 'At each milestone', ar: 'عند كل إنجاز' },
    title: { en: 'Progress you can see', ar: 'تقدّم تشوفه' },
    body: { en: 'A progress page for every learner, and a certificate when a milestone is reached.', ar: 'صفحة تقدّم لكل طالب، وشهادة لما يوصل لإنجاز.' },
    why: { en: 'You see where you are, and what comes next.', ar: 'بتشوف إنت فين، وإيه اللي جاي.' },
  },
];

const N = STEPS.length;
// Scroll distance per card, in svh: enough to read a card, short enough that the section stays brief.
const PER_STEP = 42;

/**
 * Homepage: the week around the lesson. The section pins to the screen while you scroll through it, and the scroll
 * turns a 3D ring of six phone screens (the owner's mix of the card stack, phone and ring prototypes, 2026-11-04):
 * the card in front plays its screen, the one that leaves lifts away like a dealt card, and the caption says what the
 * step is and why it matters. Every screen is a labelled example: no real names or results.
 */
export function WeekWithUs({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const track = useRef<HTMLDivElement>(null);
  const cards = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    // The next card comes from the reading side: the right in English, the left in Arabic.
    const dir = isEn ? 1 : -1;
    let raf = 0;
    const render = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - window.innerHeight)));
      let f = p * (N - 1);
      if (reduce.matches) f = Math.round(f);
      const radius = (cards.current[0]?.offsetWidth ?? 240) * 0.95;
      cards.current.forEach((c, i) => {
        if (!c) return;
        const d = i - f;
        const cos = Math.cos((d * Math.PI) / 3);
        // A card that has just passed lifts and tilts away, like the top card of a stack.
        const gone = Math.max(-1, Math.min(0, d));
        c.style.transform = `rotateY(${d * 60 * dir}deg) translateZ(${radius}px) translateY(${gone * 28}px) rotateZ(${gone * -5 * dir}deg) scale(${0.86 + 0.14 * Math.max(0, cos)})`;
        c.style.opacity = String(Math.max(0, Math.min(1, (cos + 0.35) / 1.1)));
        c.style.zIndex = String(Math.round(cos * 10) + 10);
      });
      setActive(Math.round(f));
      setStarted(p > 0.02);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(render); };
    render();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [isEn]);

  const goTo = (i: number) => {
    const el = track.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: top + (i / (N - 1)) * (el.offsetHeight - window.innerHeight) + 2, behavior: smooth ? 'smooth' : 'auto' });
  };

  const s = STEPS[active];

  return (
    <section className="pt-16 lg:pt-24" aria-labelledby="week-with-us">
      <div className="public-container">
        <div className="max-w-[54rem] mx-auto">
          <h2 id="week-with-us" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
            {isEn ? 'A week with Watazawwado' : 'أسبوع مع وتزودوا'}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4 max-w-2xl">
            {isEn ? 'The lesson is the heart of it. This is what happens around it.' : 'الحصة هي القلب. وده اللي بيحصل حواليها.'}
          </p>
        </div>
      </div>

      {/* For screen readers the week is a plain list; the ring below is decoration. */}
      <ol className="sr-only">
        {STEPS.map((x) => <li key={x.title.en}>{t(x.when)}: {t(x.title)}. {t(x.body)} {t(x.why)}</li>)}
      </ol>

      <div ref={track} className="relative" style={{ height: `calc(${N * PER_STEP}svh + 100svh)` }}>
        <div className="week-stage sticky top-0 h-[100svh] flex flex-col justify-center pt-14 pb-4" aria-hidden="true">
          <div className="public-container w-full max-w-[64rem] mx-auto lg:grid lg:grid-cols-2 lg:items-center lg:gap-12">
            <div className="week-ring relative mx-auto lg:order-2">
              <span className="week-glow pointer-events-none absolute -inset-10 -z-10 rounded-full" style={{ '--week-glow': GLOW[active] } as React.CSSProperties} />
              {STEPS.map((x, i) => (
                <div
                  key={x.title.en}
                  ref={(el) => { cards.current[i] = el; }}
                  className={`week-card absolute inset-0 rounded-[2rem] p-[6px] bg-[#101B22] shadow-[0_30px_60px_-30px_rgba(16,27,34,0.7)] ${i === active ? 'is-on' : ''}`}
                >
                  <div className="h-full w-full overflow-hidden rounded-[1.65rem] bg-background">
                    <div className="flex items-center justify-between px-4 pt-3 text-[11px] font-semibold text-muted-foreground" dir="ltr">
                      <span className="tabular-nums">{String(i + 1).padStart(2, '0')}/{String(N).padStart(2, '0')}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[#7A4E09] dark:text-[#F6D58E]">
                        <Khatam className="w-3 h-3" />
                        <span className="tabular-nums">{COUNT[i]}</span>
                        <span>{isEn ? 'ayat' : 'آية'}</span>
                      </span>
                    </div>
                    <div className="px-3.5 pt-3"><Screen step={i} isEn={isEn} /></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-7 lg:mt-0 lg:order-1 text-center lg:text-start">
              <div key={active} className="week-caption min-h-[8.5rem] sm:min-h-[7.5rem] max-w-md mx-auto lg:mx-0">
                <p className="text-sm font-semibold text-[#087D91] dark:text-[#12A4BC]">{t(s.when)}</p>
                <h3 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">{t(s.title)}</h3>
                <p className="mt-1.5 text-[15px] text-muted-foreground leading-relaxed">{t(s.body)}</p>
                <p className="mt-2 inline-flex items-start gap-1.5 text-[15px] font-semibold text-foreground text-start">
                  <Check className="w-4 h-4 mt-1 shrink-0 text-[#087D91] dark:text-[#12A4BC]" strokeWidth={3} />
                  {t(s.why)}
                </p>
              </div>
              <div className="mt-4 flex items-center justify-center lg:justify-start gap-2">
                {STEPS.map((x, i) => (
                  <button
                    key={x.title.en}
                    type="button"
                    tabIndex={-1}
                    onClick={() => goTo(i)}
                    className="week-pip h-2 rounded-full"
                    data-on={i === active || undefined}
                    data-done={i < active || undefined}
                  />
                ))}
              </div>
              <p className={`week-hint mt-3 text-xs text-muted-foreground ${started ? 'is-gone' : ''}`}>
                {isEn ? 'Keep scrolling: each scroll turns to the next card' : 'كمّل سكرول: كل سكرول يقلب للبطاقة اللي بعدها'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// The phone's counter: ayat reviewed so far this week, rising as the week goes (an example, like the screens).
const COUNT = [0, 0, 12, 12, 20, 27];
// The light behind the ring follows the ribbon: teal, gold, crimson.
const GLOW = ['#087D91', '#087D91', '#E5A93C', '#E5A93C', '#C51F24', '#E5A93C'];

function Khatam({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="5" y="5" width="10" height="10" rx="1" />
        <rect x="5" y="5" width="10" height="10" rx="1" transform="rotate(45 10 10)" />
      </g>
    </svg>
  );
}

function Example({ isEn }: { isEn: boolean }) {
  return (
    <span className="ms-auto rounded-full bg-[var(--gold)]/20 px-2 py-0.5 text-[10px] font-bold text-[#7A4E09] dark:text-[#F6D58E]">
      {isEn ? 'EXAMPLE' : 'مثال'}
    </span>
  );
}

/** One small screen per step, drawn with the portal's own surfaces and colours. */
function Screen({ step, isEn }: { step: number; isEn: boolean }) {
  const tr = (en: string, ar: string) => (isEn ? en : ar);
  const title = (text: string) => (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-sm font-bold text-foreground">{text}</span>
      <Example isEn={isEn} />
    </div>
  );

  if (step === 0) return (
    <div>
      {title(tr('Live lesson', 'الحصة المباشرة'))}
      <div className="relative rounded-2xl bg-[#101B22] p-4 text-center text-white">
        <span className="absolute top-2.5 start-2.5 inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-bold tracking-wider">
          <span className="week-live w-1.5 h-1.5 rounded-full bg-[#E82C32]" />{tr('LIVE', 'مباشر')}
        </span>
        <p className="text-3xl leading-loose" lang="ar" dir="rtl">بِسْمِ ٱللَّهِ</p>
        <p className="text-[11px] text-white/60 mt-1">{tr('Slide 3 of 12', 'شريحة ٣ من ١٢')}</p>
        <div className="mt-3 h-1 rounded-full bg-white/15 overflow-hidden"><div className="week-grow h-full w-1/4 rounded-full bg-[var(--gold)]" /></div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="week-rise aspect-video rounded-xl bg-[var(--teal)]/15 grid place-items-center text-[11px] font-semibold text-[var(--teal)]">{tr('Teacher', 'المعلم')}</div>
        <div className="week-rise aspect-video rounded-xl bg-primary/10 grid place-items-center text-[11px] font-semibold text-primary">{tr('You', 'إنت')}</div>
      </div>
    </div>
  );

  if (step === 1) return (
    <div>
      {title(tr("This week's homework", 'واجب الأسبوع'))}
      <ul className="space-y-2">
        {[tr('Read Al-Mulk 1–5 twice', 'اقرا الملك ١–٥ مرتين'), tr('Write 3 new words', 'اكتب ٣ كلمات جديدة'), tr('Record your recitation', 'سجّل تلاوتك')].map((x, i) => (
          <li key={x} className="flex items-center gap-2.5 rounded-xl bg-surface-subtle p-2.5 text-[13px] text-foreground">
            <span className={`week-tick grid place-items-center w-5 h-5 rounded-full shrink-0 ${i < 2 ? 'bg-[var(--teal)] text-white' : 'border-2 border-border'}`} style={{ animationDelay: `${0.15 + i * 0.2}s` }}>
              {i < 2 && <Check className="w-3 h-3" strokeWidth={3} />}
            </span>
            <span className={i < 2 ? 'line-through text-muted-foreground' : ''}>{x}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  if (step === 2) return (
    <div>
      {title(tr("Today's review", 'مراجعة النهارده'))}
      <div className="flex flex-col items-center py-2">
        <div className="relative w-28 h-28">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="var(--border)" strokeWidth="8" />
            <circle className="week-ring-arc" cx="50" cy="50" r="42" fill="none" stroke="var(--teal)" strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="0.35" />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-center">
            <span>
              <span className="block text-2xl font-bold text-foreground tabular-nums" dir="ltr">3:15</span>
              <span className="block text-[10px] text-muted-foreground">{tr('of 5 min', 'من ٥ دقايق')}</span>
            </span>
          </span>
        </div>
        <p className="mt-3 text-[13px] font-semibold text-foreground">{tr('Al-Mulk · ayat 1–12', 'الملك · الآيات ١–١٢')}</p>
        <p className="text-[11px] text-muted-foreground">{tr('Back again in 3 days', 'هترجعلك بعد ٣ أيام')}</p>
      </div>
    </div>
  );

  if (step === 3) return (
    <div>
      {title(tr('Your recitation', 'تلاوتك'))}
      <div className="flex items-center gap-3 rounded-2xl bg-surface-subtle p-3">
        <span className="grid place-items-center w-10 h-10 rounded-full bg-primary text-primary-foreground shrink-0"><Mic className="w-4 h-4" /></span>
        <span className="flex items-end gap-[3px] h-8 flex-1" dir="ltr">
          {[5, 9, 14, 8, 18, 12, 22, 10, 16, 7, 13, 19, 9, 6, 12].map((h, i) => (
            <span key={i} className="week-bar w-[3px] rounded-full bg-primary/70" style={{ height: h + 6, animationDelay: `${i * 0.05}s` }} />
          ))}
        </span>
      </div>
      <div className="week-rise mt-3 rounded-2xl rounded-ss-sm bg-[var(--teal)]/12 p-3" style={{ animationDelay: '0.5s' }}>
        <p className="text-[11px] font-bold text-[var(--teal)]">{tr("Teacher's reply", 'رد المعلم')}</p>
        <p className="text-[13px] text-foreground mt-1">{tr('Lovely. Hold the madd in ayah 3 a little longer.', 'تلاوة جميلة. خلّي بالك من المد في آية ٣.')}</p>
        <div className="mt-2 flex items-center gap-2 text-muted-foreground" dir="ltr">
          <Play className="w-3.5 h-3.5" /><span className="h-1 flex-1 rounded-full bg-border" /><span className="text-[10px] tabular-nums">0:24</span>
        </div>
      </div>
    </div>
  );

  if (step === 4) return (
    <div>
      {title(tr('Weekly email', 'إيميل الأسبوع'))}
      <div className="week-drop rounded-2xl border border-border overflow-hidden">
        <div className="flex items-center gap-2 bg-surface-subtle px-3 py-2">
          <Mail className="w-4 h-4 text-primary" />
          <span className="text-[12px] font-semibold text-foreground">{tr('Your week at Watazawwado', 'أسبوعكم في وتزودوا')}</span>
        </div>
        <div className="p-3 space-y-2.5 text-[12px]">
          <p className="text-muted-foreground">{tr('2 lessons · homework done 3/3', 'حصتين · الواجب ٣/٣')}</p>
          <p className="rounded-xl bg-[var(--gold)]/12 p-2.5 text-foreground">{tr('“Steady progress in the madd rules this week.”', '«تقدّم ثابت في أحكام المد الأسبوع ده.»')}</p>
          <div className="space-y-1.5">
            <span className="block h-1.5 w-full rounded-full bg-border" />
            <span className="block h-1.5 w-4/5 rounded-full bg-border" />
            <span className="block h-1.5 w-3/5 rounded-full bg-border" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      {title(tr('Progress', 'التقدّم'))}
      <ol className="space-y-2">
        {[tr('Letters and sounds', 'الحروف ومخارجها'), tr('Noon and meem rules', 'أحكام النون والميم'), tr('The madd', 'المدود')].map((x, i) => (
          <li key={x} style={{ animationDelay: `${i * 0.12}s` }} className={`week-rise flex items-center gap-2.5 rounded-xl p-2.5 text-[13px] ${i === 1 ? 'bg-[var(--teal)]/12 font-semibold text-foreground' : 'bg-surface-subtle text-muted-foreground'}`}>
            <span className={`grid place-items-center w-5 h-5 rounded-full text-[10px] font-bold shrink-0 ${i === 0 ? 'bg-[var(--teal)] text-white' : 'border-2 border-border'}`}>
              {i === 0 ? <Check className="w-3 h-3" strokeWidth={3} /> : i + 1}
            </span>
            {x}
          </li>
        ))}
      </ol>
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 p-3">
        <span className="week-seal grid place-items-center w-10 h-10 rounded-full bg-[var(--gold)]/25 text-[#8B4935] dark:text-[#F6D58E] shrink-0"><Khatam className="w-6 h-6" /></span>
        <span className="text-[12px] leading-snug text-foreground"><b className="block">{tr('Certificate', 'شهادة')}</b>{tr('Level 1 complete', 'خلّصت المستوى الأول')}</span>
      </div>
    </div>
  );
}
