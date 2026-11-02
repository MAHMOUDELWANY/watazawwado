import React, { useEffect, useRef, useState } from 'react';
import { Check, Mic, Mail, Play } from 'lucide-react';

type L = { en: string; ar: string };

// What a family actually gets around the lesson, in the order a week goes. Each line is a feature that exists today
// (lesson room, homework, today's review, recitations, weekly email, progress and certificates); keep it that way.
const STEPS: Array<{ when: L; title: L; body: L }> = [
  {
    when: { en: 'In the lesson', ar: 'في الحصة' },
    title: { en: 'One teacher, one learner, live', ar: 'معلم واحد وطالب واحد، مباشر' },
    body: { en: 'On Zoom, with our lesson slides on your screen. They move as the teacher teaches.', ar: 'على Zoom، وشرائح الدرس قدامك على الشاشة، بتتحرك مع شرح المعلم.' },
  },
  {
    when: { en: 'After the lesson', ar: 'بعد الحصة' },
    title: { en: 'Homework, short and clear', ar: 'واجب قصير وواضح' },
    body: { en: 'One to three small tasks from the teacher. You tick them off at home, and the teacher sees it.', ar: 'من مهمة لتلات مهام صغيرة من المعلم. بتعلّم عليها في البيت، والمعلم بيشوفها.' },
  },
  {
    when: { en: 'Every day', ar: 'كل يوم' },
    title: { en: 'Five minutes of review', ar: 'خمس دقايق مراجعة' },
    body: { en: 'What you memorized comes back on a growing gap, so it stays with you.', ar: 'اللي حفظته بيرجعلك على مسافات بتكبر، عشان يفضل معاك.' },
  },
  {
    when: { en: 'Between lessons', ar: 'بين الحصص' },
    title: { en: 'Recite, and hear back', ar: 'سمّع، وخد الرد' },
    // Recording lives in recitation homework (RecitationRecorder in HomeworkCard), not in the chat.
    body: { en: 'When the homework is a recitation, record it on your phone. Your teacher listens and replies.', ar: 'لما يكون الواجب تسميع، سجّل تلاوتك من الموبايل، والمعلم بيسمعها ويرد عليك.' },
  },
  {
    when: { en: 'Every week', ar: 'كل أسبوع' },
    title: { en: 'A note for parents', ar: 'رسالة للأهل' },
    body: { en: 'The week’s lessons, the teacher’s words and the homework, in one email.', ar: 'حصص الأسبوع وكلام المعلم والواجب، في إيميل واحد.' },
  },
  {
    when: { en: 'At each milestone', ar: 'عند كل إنجاز' },
    title: { en: 'Progress you can see', ar: 'تقدّم تشوفه' },
    body: { en: 'A progress page for every learner, and a certificate when a milestone is reached.', ar: 'صفحة تقدّم لكل طالب، وشهادة لما يوصل لإنجاز.' },
  },
];

/**
 * Homepage: the week around the lesson, told as you scroll (after the "Sparkle scroll story" reference in
 * docs/design/INSPIRATION.md, our colours only). On wide screens a phone stays beside the steps and its screen changes
 * as each step reaches the middle of the view, while a small counter of ayat reviewed rises; on phones each step
 * carries its own small screen. Every screen is a labelled example: no real names or results.
 */
export function WeekWithUs({ isEn }: { isEn: boolean }) {
  const t = (l: L) => (isEn ? l.en : l.ar);
  const [active, setActive] = useState(0);
  const items = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.step)); }),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    items.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section className="public-container py-16 lg:py-24" aria-labelledby="week-with-us">
      <div className="max-w-[54rem] mx-auto">
        <div className="max-w-3xl">
          <h2 id="week-with-us" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
            {isEn ? 'A week with Watazawwado' : 'أسبوع مع وتزودوا'}
          </h2>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4 max-w-2xl">
            {isEn ? 'The lesson is the heart of it. This is what happens around it.' : 'الحصة هي القلب. وده اللي بيحصل حواليها.'}
          </p>
        </div>
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:gap-20 mt-10">
          <ol className="week-line relative space-y-10 lg:space-y-0 ps-10" style={{ '--week-fill': active / (STEPS.length - 1) } as React.CSSProperties}>
            {STEPS.map((s, i) => (
              <li
                key={s.title.en}
                ref={(el) => { items.current[i] = el; }}
                data-step={i}
                className={`week-step relative lg:min-h-[46vh] lg:flex lg:flex-col lg:justify-center ${i === active ? 'is-active' : ''}`}
              >
                <span aria-hidden="true" className="week-dot absolute -start-10 top-1 lg:top-auto w-5 h-5 rounded-full border-2 border-[var(--background)]" />
                <span className="text-xs font-bold tracking-[0.14em] text-muted-foreground tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="font-editorial text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1">{t(s.title)}</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed max-w-[52ch]">
                  <span className="font-semibold text-[#087D91] dark:text-[#12A4BC]">{t(s.when)}</span>
                  <span aria-hidden="true"> · </span>
                  {t(s.body)}
                </p>
                <div className={`week-mini lg:hidden mt-5 max-w-[19rem] ${i === active ? 'is-on' : ''}`} aria-hidden="true">
                  <div className="rounded-[1.6rem] border border-border bg-surface p-4 shadow-[0_18px_40px_-28px_rgba(18,16,14,0.45)]">
                    <Screen step={i} isEn={isEn} />
                  </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="hidden lg:block" aria-hidden="true">
            <div className="sticky top-[18vh] isolate">
              <span className="week-glow pointer-events-none absolute -inset-10 -z-10 rounded-full" style={{ '--week-glow': GLOW[active] } as React.CSSProperties} />
              <div
                className="week-phone relative mx-auto w-[270px] aspect-[9/16.5] rounded-[2.6rem] p-[9px] bg-[#101B22] ring-1 ring-black/5 dark:ring-white/15 shadow-[0_40px_80px_-40px_rgba(16,27,34,0.7)]"
                style={{ '--week-tilt': `${active % 2 ? 1.6 : -1.6}deg`, '--week-lift': `${active % 2 ? -6 : 0}px` } as React.CSSProperties}
              >
                <div className="relative h-full w-full overflow-hidden rounded-[2.1rem] bg-background">
                  <div className="flex items-center justify-between px-5 pt-4 text-[11px] font-semibold text-muted-foreground" dir="ltr">
                    <span className="tabular-nums">9:41</span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold)]/15 px-2 py-0.5 text-[#7A4E09] dark:text-[#F6D58E]">
                      <Khatam className="w-3 h-3" />
                      <span className="week-count tabular-nums" key={COUNT[active]}>{COUNT[active]}</span>
                      <span>{isEn ? 'ayat' : 'آية'}</span>
                    </span>
                  </div>
                  {STEPS.map((s, i) => (
                    <div key={s.title.en} className={`week-screen absolute inset-x-0 top-11 bottom-0 px-4 pt-3 ${i === active ? 'is-on' : ''}`}>
                      <Screen step={i} isEn={isEn} />
                    </div>
                  ))}
                </div>
              </div>
              <p className="mt-4 text-center text-xs text-muted-foreground">{isEn ? 'Example screens' : 'شاشات للتوضيح'}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// The phone's counter: ayat reviewed so far this week, rising as the week goes (an example, like the screens).
const COUNT = [0, 0, 12, 12, 20, 27];
// The light behind the phone follows the ribbon: teal, gold, crimson.
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
            <circle className="week-ring" cx="50" cy="50" r="42" fill="none" stroke="var(--teal)" strokeWidth="8" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset="0.35" />
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
