import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Volume2, VolumeX } from 'lucide-react';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicButton } from '../PublicDesignSystem';
import { TrialCtaLabel } from '../TrialCtaLabel';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { FAQS } from '../../../data/content';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { useWelcomeAudio } from '../../../lib/welcomeAudio';
import { HomeHero } from './HomeHero';
import { Promises } from './Promises';
import { Tracks } from './Tracks';
import { PackYourZaad } from './PackYourZaad';
import { StartRoad } from './StartRoad';
import { FamilyVoices } from './FamilyVoices';
import { useReveal, rv } from './useReveal';

/**
 * The homepage, redesigned 2026-11-18 around one idea: the zaad, the provision for a journey our name comes from
 * (﴿وتزودوا فإن خير الزاد التقوى﴾). It opens on the bag, tells what we promise and can prove, lets the visitor pack
 * their own bag, shows the road in, and closes on footsteps in the sand with "Pack your zaad." No person is at the
 * centre: every teacher is one teacher of the academy (RULES.md §6b).
 */

const VERSE = '﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾';
const MISSION_VERSE = '﴿ وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ ﴾';
// Thmanyah has no ornate Quranic brackets, so the verses use Amiri Quran, loaded for these letters only.
function useVerseFont() {
  React.useEffect(() => {
    if (document.getElementById('verse-font')) return;
    const link = document.createElement('link');
    link.id = 'verse-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap&text=' + encodeURIComponent(Array.from(new Set(VERSE + MISSION_VERSE)).join(''));
    document.head.appendChild(link);
  }, []);
}

// The questions a family asks first that the page has not answered yet (the teacher staying is answered above).
const HOME_FAQ = [2, 3, 8, 9];

function NameVerse({ isEn }: { isEn: boolean }) {
  const ref = useReveal<HTMLElement>(0.3);
  const audio = useWelcomeAudio();
  return (
    <section ref={ref} className="relative" aria-labelledby="home-verse">
      <div className="public-container py-20 sm:py-28 lg:py-32 text-center">
        <h2 id="home-verse" {...rv(0)} className="rv text-base sm:text-lg font-semibold text-muted-foreground">
          {isEn ? 'Our name comes from one verse' : 'اسمنا من آية'}
        </h2>
        <p
          {...rv(1)}
          lang="ar"
          dir="rtl"
          className="rv mt-6 text-[1.75rem] min-[400px]:text-[2rem] leading-[1.85] sm:text-6xl sm:leading-[1.7] lg:text-[5rem] text-ribbon mx-auto max-w-5xl"
          style={{ ...rv(1).style, fontFamily: "'Amiri Quran', var(--font-serif)" }}
        >
          {VERSE}
        </p>
        <p {...rv(2)} className="rv mt-6 text-lg sm:text-xl text-foreground max-w-2xl mx-auto leading-relaxed">
          {isEn
            ? '“And take provisions, but indeed, the best provision is fear of Allah.” Every lesson is zaad: something you carry for the rest of the road.'
            : 'كل حصة زاد: شيء تحمله معك بقية الطريق، وخير الزاد التقوى.'}
        </p>
        <p {...rv(3)} className="rv mt-2 text-sm text-muted-foreground">
          {isEn ? 'Al-Baqarah 2:197, Saheeh International' : 'البقرة ١٩٧'}
        </p>
        <button
          type="button"
          id="verse-sound-btn"
          onClick={() => (audio.playing ? audio.stop() : void audio.play())}
          aria-pressed={audio.playing}
          className="btn-glass is-pill mt-8"
        >
          {audio.playing ? <VolumeX className="w-4 h-4 text-[#C51F24]" aria-hidden="true" /> : <Volume2 className="w-4 h-4 text-[#087D91]" aria-hidden="true" />}
          {audio.playing ? (isEn ? 'Stop the recitation' : 'إيقاف التلاوة') : (isEn ? 'Listen to the recitation' : 'استمع للتلاوة')}
        </button>
      </div>
    </section>
  );
}

function HomeFaq({ isEn }: { isEn: boolean }) {
  const ref = useReveal<HTMLElement>(0.15);
  return (
    <section ref={ref} aria-labelledby="home-faq">
      <div className="public-container py-20 sm:py-28 lg:py-32 grid gap-10 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <h2 id="home-faq" {...rv(0)} className={`rv home-display text-foreground text-[2.4rem] sm:text-5xl lg:text-[3.6rem] ${isEn ? 'font-medium' : ''}`}>
            {isEn ? 'What families ask first' : 'أول ما تسأل عنه الأسر'}
          </h2>
          <Link {...rv(1)} to="/faq" className="rv inline-flex items-center min-h-11 mt-6 font-bold text-foreground underline decoration-[var(--gold)] decoration-2 underline-offset-[6px] hover:decoration-[var(--crimson)] focus-ring rounded-md">
            {isEn ? 'All questions and answers' : 'كل الأسئلة والإجابات'}
          </Link>
        </div>
        <div className="lg:col-span-7 space-y-3">
          {HOME_FAQ.map((i, k) => FAQS[i]).filter(Boolean).map((f, k) => (
            <details key={f.question} {...rv(k + 2)} className="rv group rounded-[var(--r-3)] bg-surface-warm/70 dark:bg-surface-subtle px-5 sm:px-7 open:pb-6 transition-colors">
              <summary className="flex items-center justify-between gap-4 min-h-[4.25rem] py-4 cursor-pointer list-none text-lg sm:text-xl font-bold text-foreground focus-ring rounded-[var(--r-2)]">
                {isEn ? f.question : f.arabicQuestion}
                <span aria-hidden="true" className="grid place-items-center w-9 h-9 shrink-0 rounded-full bg-background text-xl leading-none text-foreground transition-transform duration-300 group-open:rotate-45">+</span>
              </summary>
              <p className="text-lg leading-relaxed text-foreground max-w-[60ch]">{isEn ? f.answer : f.arabicAnswer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// Where the lamp's flame sits in public/home/road.webp (2:1) and road-900.webp (1:1).
const LAMP_WIDE = { x: 72.5, y: 33 };
const LAMP_SQUARE = { x: 72.5, y: 22.5 };

function Closing({ isEn, onTrial }: { isEn: boolean; onTrial: () => void }) {
  const ref = useReveal<HTMLElement>(0.25);
  const lamp = (p: { x: number; y: number }) => (
    <span
      className="home-flame absolute w-[22%] aspect-square rounded-full"
      style={{ left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -50%)', background: 'radial-gradient(closest-side, rgba(255,214,140,0.5), rgba(229,169,60,0.18) 45%, transparent 72%)' }}
    />
  );
  return (
    <section ref={ref} id="contact" className="relative overflow-hidden bg-[#1C1411] text-[#FAF7F2]" aria-labelledby="home-close">
      {/* Footsteps in the sand, a closed book, a lamp still lit: the road goes on. */}
      <div className="absolute inset-0" style={{ containerType: 'size' }} aria-hidden="true">
        <div className="hidden sm:block absolute top-1/2 right-0 -translate-y-1/2" style={{ width: 'max(100cqw, 200cqh)', aspectRatio: '2 / 1' }}>
          <img src="/home/road.webp" alt="" width={2000} height={1000} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
          {lamp(LAMP_WIDE)}
        </div>
        <div className="sm:hidden absolute inset-x-0 top-0 aspect-square">
          <img src="/home/road-900.webp" alt="" width={900} height={900} loading="lazy" decoding="async" className="absolute inset-0 w-full h-full object-cover" />
          {lamp(LAMP_SQUARE)}
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_25%,rgba(28,20,17,0.92)_62%)] sm:bg-[linear-gradient(90deg,rgba(28,20,17,0.92)_0%,rgba(28,20,17,0.7)_38%,transparent_70%)] sm:rtl:bg-[linear-gradient(270deg,rgba(28,20,17,0.92)_0%,rgba(28,20,17,0.7)_38%,transparent_70%)]" />
      </div>

      <div className="public-container relative pt-[78vw] pb-16 sm:py-32 lg:py-44 sm:min-h-[min(90svh,52rem)] flex flex-col justify-center">
        <h2 id="home-close" {...rv(0)} className={`rv home-display text-[3.4rem] sm:text-7xl lg:text-[7rem] ${isEn ? 'font-medium' : ''}`}>
          {isEn ? 'Pack your zaad.' : 'جهّز زادك.'}
        </h2>
        <p {...rv(1)} className="rv mt-5 text-lg sm:text-xl leading-relaxed text-[#FAF7F2]/90 max-w-md">
          {isEn
            ? 'The first lesson is free: thirty minutes to meet, listen, and find your way.'
            : 'والحصة الأولى مجانًا: ٣٠ دقيقة نتعرّف فيها، ونسمعك، ونلاقي طريقك.'}
        </p>
        <div {...rv(2)} className="rv mt-9 flex flex-col sm:flex-row gap-3 sm:items-center">
          <PublicButton variant="primary" size="lg" onClick={onTrial} className="liquid-cta !rounded-full w-full sm:w-auto px-8">
            <TrialCtaLabel isEn={isEn} />
          </PublicButton>
          <a
            href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 min-h-[3.25rem] px-6 rounded-full font-bold bg-[#FAF7F2]/10 text-[#FAF7F2] hover:bg-[#FAF7F2]/20 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F6D58E]"
          >
            <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#F6D58E]" />
            <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  useVerseFont();
  const trial = () => onOpenTrialModal();

  return (
    <main id="main-content" className="pt-16 sm:pt-20">
      {/* Welcome recitation: first visit of a session (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />

      <HomeHero isEn={isEn} onTrial={trial} />
      <NameVerse isEn={isEn} />
      <Promises isEn={isEn} />
      <Tracks isEn={isEn} />
      <PackYourZaad isEn={isEn} onTrial={(id) => onOpenTrialModal(id)} />
      <StartRoad isEn={isEn} />
      <FamilyVoices isEn={isEn} />
      <HomeFaq isEn={isEn} />
      <Closing isEn={isEn} onTrial={trial} />
    </main>
  );
}
