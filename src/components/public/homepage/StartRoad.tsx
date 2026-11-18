import React from 'react';
import { Link } from '../LangLink';
import { useReveal, rv } from './useReveal';

/**
 * "How it starts": three stops on one road, drawn in gold as the section arrives. Wide screens: the road runs across
 * with the stops on it. Phones: it runs down the start edge. Order is carried by the list, not by numbers.
 */

type L = { en: string; ar: string };
const STOPS: { title: L; body: L }[] = [
  {
    title: { en: 'A free lesson', ar: 'حصة مجانية' },
    body: { en: 'Thirty minutes to meet, listen and find the right level. No card needed.', ar: '٣٠ دقيقة نتعرّف فيها، ونسمعك، ونعرف مستواك. بدون بطاقة.' },
  },
  {
    title: { en: 'Your teacher, your times', ar: 'معلّمك ومواعيدك' },
    body: { en: 'Pick your teacher from real profiles, a man or a woman, and the times that suit your week.', ar: 'تختار معلّمك من ملفات حقيقية، معلّمًا أو معلّمة، والمواعيد التي تناسب أسبوعك.' },
  },
  {
    title: { en: 'Then, the road', ar: 'ثم الطريق' },
    body: { en: 'One to one, a report after every class, and the same teacher beside you.', ar: 'حصص فردية، وتقرير بعد كل حصة، ونفس المعلّم بجانبك.' },
  },
];

function Stop() {
  return (
    <svg viewBox="0 0 40 40" className="w-10 h-10" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="var(--background)" />
      <g transform="translate(20 20)">
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill="var(--gold)" />
        <rect x="-9" y="-9" width="18" height="18" rx="3" fill="var(--gold)" transform="rotate(45)" />
        <circle r="4" fill="var(--crimson)" />
      </g>
    </svg>
  );
}

export function StartRoad({ isEn }: { isEn: boolean }) {
  const ref = useReveal<HTMLElement>(0.25);
  const t = (l: L) => (isEn ? l.en : l.ar);
  return (
    <section ref={ref} aria-labelledby="home-start">
      <div className="public-container py-20 sm:py-28 lg:py-36">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5">
          <h2 id="home-start" {...rv(0)} className={`rv home-display text-foreground text-[2.6rem] sm:text-6xl lg:text-[4.4rem] ${isEn ? 'font-medium' : ''}`}>
            {isEn ? 'How it starts' : 'كيف نبدأ'}
          </h2>
          <Link {...rv(1)} to="/how-it-works" className="rv inline-flex items-center min-h-11 font-bold text-foreground underline decoration-[var(--gold)] decoration-2 underline-offset-[6px] hover:decoration-[var(--crimson)] focus-ring rounded-md">
            {isEn ? 'The whole way, step by step' : 'الطريق كله، خطوة بخطوة'}
          </Link>
        </div>

        <div className="relative mt-14 sm:mt-20">
          {/* The road, across (wide screens). */}
          <svg className="hidden md:block absolute inset-x-0 top-0 w-full h-10 overflow-visible rtl:-scale-x-100" viewBox="0 0 1000 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M20 20 C 130 36, 240 36, 353 20 S 576 4, 687 20 S 900 36, 990 24" pathLength={1} className="road-line" fill="none" stroke="var(--gold)" strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
          </svg>
          {/* The road, down (phones). */}
          <svg className="md:hidden absolute top-5 bottom-5 start-[19px] w-1 h-[calc(100%-2.5rem)] overflow-visible" viewBox="0 0 4 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M2 0 V 100" pathLength={1} className="road-line" fill="none" stroke="var(--gold)" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>

          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
            {STOPS.map((s, i) => (
              <li key={s.title.en} {...rv(i + 2)} className="rv flex md:block gap-5">
                <div className="shrink-0 relative z-10"><Stop /></div>
                <div className="md:mt-8">
                  <h3 className={`home-display text-foreground text-[1.9rem] sm:text-[2.3rem] ${isEn ? 'font-medium' : ''}`}>{t(s.title)}</h3>
                  <p className="mt-3 text-lg leading-relaxed text-foreground max-w-[22rem]">{t(s.body)}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
