import React from 'react';
import { Link } from '../LangLink';
import { PublicButton } from '../PublicDesignSystem';
import { TrialCtaLabel } from '../TrialCtaLabel';

/**
 * Homepage hero (owner, 2026-11-18: no person at the centre, simple words with weight, visually striking).
 * The academy is named after ﴿وتزودوا﴾, "take provision for the journey", so the first thing you see is the zaad
 * itself: our painting of a traveller's bag, water skin, dates and a lit lantern. The words carry the brand line
 * ("Not just lessons. A mentor who stays.", docs/marketing/BRAND.md §1). Motion: the words rise into place, a gold
 * line draws under "stays", the candle flickers and dust drifts in its light. All of it is still for reduced motion,
 * and the prerendered HTML shows the finished hero.
 */

type Line = { words: string[]; mark?: number };

const H1: Record<'en' | 'ar', Line[]> = {
  en: [{ words: ['Not', 'just', 'lessons.'] }, { words: ['A', 'mentor', 'who', 'stays.'], mark: 3 }],
  ar: [{ words: ['مش', 'مجرد', 'حصص.'] }, { words: ['معلّمٌ', 'يبقى', 'معك.'], mark: 1 }],
};

// Where the candle flame sits in public/home/zaad-bag.webp (a 4:5 crop of the Zad Essentials banner).
const FLAME = { x: 82.5, y: 50.5 };
const MOTES = [
  { x: 78, y: 58, dx: -26, d: 9, delay: 0 }, { x: 86, y: 62, dx: 14, d: 11, delay: 2.2 },
  { x: 81, y: 66, dx: -10, d: 8, delay: 4.1 }, { x: 89, y: 55, dx: -30, d: 12, delay: 5.6 },
  { x: 75, y: 63, dx: 18, d: 10, delay: 7.3 }, { x: 84, y: 70, dx: -16, d: 9.5, delay: 3.3 },
];

/** The painting, cropped like object-fit: cover from the end side, with the flame and motes pinned to it. */
function Painting({ live, priority }: { live: boolean; priority?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#1C1411]" style={{ containerType: 'size' }} aria-hidden="true">
      <div
        // Anchored to the physical right in both directions: the lantern is on the painting's right.
        className="absolute top-1/2 right-0 -translate-y-1/2"
        style={{ width: 'max(100cqw, 80cqh)', aspectRatio: '4 / 5' }}
      >
        <div className={`absolute inset-0 ${live ? 'home-kenburns' : ''}`}>
          <img
            src="/home/zaad-bag.webp"
            srcSet="/home/zaad-bag-640.webp 640w, /home/zaad-bag.webp 1200w"
            sizes="(min-width: 1024px) 46vw, 100vw"
            width={1200}
            height={1500}
            alt=""
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <span
            className={`absolute w-[38%] aspect-square rounded-full ${live ? 'home-flame' : 'opacity-60'}`}
            style={{ left: `${FLAME.x}%`, top: `${FLAME.y}%`, transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(255,214,140,0.55), rgba(229,169,60,0.22) 45%, transparent 72%)' }}
          />
          {live && MOTES.map((m, i) => (
            <span key={i} className="home-mote" style={{ left: `${m.x}%`, top: `${m.y}%`, '--dx': `${m.dx}px`, '--d': `${m.d}s`, '--delay': `${m.delay}s` } as React.CSSProperties} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HomeHero({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const ref = React.useRef<HTMLElement>(null);
  const [live, setLive] = React.useState(false);
  const lines = H1[isEn ? 'en' : 'ar'];

  React.useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    ref.current?.classList.add('home-hero-ready');
    setLive(true);
  }, []);

  let w = 0;
  return (
    <section ref={ref} className="relative overflow-hidden" aria-labelledby="home-title">
      {/* Phones and tablets: the painting first, as a wide band. */}
      <div className="relative lg:hidden aspect-[16/11] sm:aspect-[16/9]">
        <Painting live={live} priority />
      </div>

      {/* Wide screens: the painting fills the end half, edge to edge. */}
      <div className="hidden lg:block absolute inset-y-0 end-0 w-[46vw]">
        <Painting live={live} />
      </div>

      <div className="public-container relative">
        <div className="lg:min-h-[calc(100svh-5rem)] lg:max-h-[56rem] flex flex-col justify-center py-10 sm:py-14 lg:py-20 lg:w-[calc(54vw-5rem)] lg:max-w-[44rem]">
          <h1
            id="home-title"
            className={`home-display text-foreground ${isEn ? 'text-[2.15rem] min-[400px]:text-[2.4rem] sm:text-[3.6rem] lg:text-[clamp(3rem,4.3vw,4.2rem)] font-medium' : 'text-[2.7rem] sm:text-[3.9rem] lg:text-[clamp(3.6rem,5vw,5.2rem)]'}`}
          >
            {lines.map((line, li) => (
              <span key={li} className="block lg:whitespace-nowrap">
                {line.words.map((word, wi) => {
                  const i = w++;
                  const marked = line.mark === wi;
                  return (
                    <React.Fragment key={wi}>
                      <span className={`home-word ${marked ? 'relative !overflow-visible' : ''}`}>
                        <span style={{ '--w': i } as React.CSSProperties} className={marked ? 'text-[var(--crimson)]' : undefined}>{word}</span>
                        {marked && (
                          <svg className="home-underline absolute inset-x-[-4%] -bottom-[0.12em] w-[108%] h-[0.32em] overflow-visible pointer-events-none" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
                            <path d="M3 13 C 40 5, 92 4, 132 8 S 186 15, 197 7" pathLength={1} fill="none" stroke="var(--gold)" strokeWidth="6" strokeLinecap="round" />
                          </svg>
                        )}
                      </span>
                      {wi < line.words.length - 1 && ' '}
                    </React.Fragment>
                  );
                })}
              </span>
            ))}
          </h1>

          <p className="mt-6 sm:mt-8 text-lg sm:text-xl leading-relaxed text-foreground max-w-[34rem]">
            {isEn
              ? 'Quran, Tajweed, the Zad Path, Arabic and English, one to one. Your teacher gets to know you, and stays with you, lesson after lesson.'
              : 'القرآن والتجويد، ومسار الأثر، والعربية والإنجليزية، حصص فردية. معلّمك يتعرّف عليك، ويبقى معك حصة بعد حصة.'}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
            <PublicButton
              variant="primary"
              size="lg"
              id="hero-get-started-btn"
              data-tour="header-get-started-cta"
              onClick={onTrial}
              className="liquid-cta !rounded-full w-full sm:w-auto px-8 shadow-lg shadow-primary/20"
            >
              <TrialCtaLabel isEn={isEn} />
            </PublicButton>
            <a href="#home-tracks" className="group inline-flex items-center justify-center gap-2 min-h-11 px-2 font-bold text-foreground underline decoration-[var(--gold)] decoration-2 underline-offset-[6px] hover:decoration-[var(--crimson)] transition-colors focus-ring rounded-md">
              {isEn ? 'See what you can learn' : 'شوف ماذا تتعلّم'}
            </a>
          </div>

          <p className="mt-6 text-base text-muted-foreground max-w-[34rem]">
            {isEn
              ? 'The first lesson is free: 30 minutes, no card. Choose a male or female teacher.'
              : 'الحصة الأولى مجانًا: ٣٠ دقيقة، بدون بطاقة. وتختار معلّمًا أو معلّمة.'}{' '}
            <Link to="/safety" className="font-semibold text-foreground underline underline-offset-4 decoration-[var(--teal)]/50 hover:decoration-[var(--teal)]">
              {isEn ? 'How we keep children safe' : 'كيف نحافظ على الأطفال'}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
