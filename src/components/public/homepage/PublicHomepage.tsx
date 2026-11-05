import { TrialCtaLabel } from "../TrialCtaLabel";
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton } from '../PublicDesignSystem';
import { Check, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { TeacherDuo } from './TeacherDuo';
import { HeroSubjects } from './HeroSubjects';
import { MushafEmblem, PathEmblem, TeachersEmblem, EnvelopeEmblem, LanternEmblem, DoorAjarEmblem } from '../emblems/DoorEmblems';
import { WeekWithUs } from './WeekWithUs';
import { FamilyVoices } from './FamilyVoices';
import { TwoWays } from './TwoWays';
import { FAQS } from '../../../data/content';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { useWelcomeAudio } from '../../../lib/welcomeAudio';

type L = { en: string; ar: string };

const VERSE = '﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾';
const MISSION_VERSE = '﴿ وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ ﴾';
// Thmanyah has no ornate Quranic brackets, so the verse uses Amiri Quran, loaded for these letters only.
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

// Each door's portal: [top, bottom] of its deep gradient. Teal, copper and crimson take turns.
type Door = { to: string; emblem: React.ComponentType<{ className?: string }>; tone: [string, string]; title: L; body: L; cta: L };

const EXPLORE: Door[] = [
  {
    to: '/learning', emblem: MushafEmblem, tone: ['#0B7486', '#04323A'],
    title: { en: 'Lessons and subjects', ar: 'الدروس والمواد' },
    body: { en: '8 subjects, your own teacher.', ar: '٨ مواد، ومعلم ليك إنت.' },
    cta: { en: 'See subjects', ar: 'شوف المواد' }
  },
  {
    to: '/how-it-works', emblem: PathEmblem, tone: ['#8B4935', '#33190F'],
    title: { en: 'How it works', ar: 'كيف نعمل' },
    body: { en: 'Four calm steps.', ar: 'أربع خطوات هادية.' },
    cta: { en: 'See the steps', ar: 'شوف الخطوات' }
  },
  {
    to: '/about', emblem: TeachersEmblem, tone: ['#A3271F', '#3F0E10'],
    title: { en: 'About us', ar: 'من نحن' },
    body: { en: 'Who we are, who teaches.', ar: 'إحنا مين، ومين هيعلّمك.' },
    cta: { en: 'Meet us', ar: 'اتعرّف علينا' }
  },
  {
    to: '/pricing', emblem: EnvelopeEmblem, tone: ['#0A5866', '#05262D'],
    title: { en: 'Prices and packages', ar: 'الأسعار والباقات' },
    body: { en: 'From $9 an hour.', ar: 'من 9$ للساعة.' },
    cta: { en: 'See prices', ar: 'شوف الأسعار' }
  },
  {
    to: '/articles', emblem: LanternEmblem, tone: ['#6E3324', '#241008'],
    title: { en: 'Articles', ar: 'مقالات' },
    body: { en: 'Practical reading for families.', ar: 'قراية عملية للأسرة.' },
    cta: { en: 'Read', ar: 'اقرا' }
  },
  {
    to: '/community', emblem: DoorAjarEmblem, tone: ['#8E1F1C', '#2E0B0C'],
    title: { en: 'Our community', ar: 'مجتمعنا' },
    body: { en: 'Hall of Honor and class board.', ar: 'لوحة الشرف ولوحة الحلقة.' },
    cta: { en: 'Step inside', ar: 'ادخل' }
  }
];

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);
  const audio = useWelcomeAudio();
  useVerseFont();

  return (
    <main id="main-content" className="pt-16 sm:pt-20">
      {/* Welcome recitation: first visit of a session (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />

      {/* ─── 1. HERO ─── phones: headline, teachers, then the rest; wide screens: text beside the teachers */}
      <section className="khatam-field brand-lights relative overflow-hidden">
        <div className="public-container pt-8 pb-14 lg:pt-14 lg:pb-24">
          <div className="grid gap-8 lg:gap-x-14 lg:grid-cols-2 [grid-template-areas:'title'_'duo'_'body'] lg:[grid-template-areas:'title_duo'_'body_duo'] items-center">
            <h1
              className={`[grid-area:title] self-end font-editorial text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-[4rem] text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}
            >
              {/* Plain words families search for, above the brand line (SEO: the headline said no subject). */}
              <span className="block mb-4 font-sans text-sm sm:text-base font-semibold tracking-normal text-[#087D91] dark:text-[#12A4BC]">
                {isEn ? 'Online 1-on-1 classes: Quran, Tajweed, the Zad Path, Arabic & English' : 'حصص فردية أونلاين: قرآن، وتجويد، ومسار الأثر، وعربي، وإنجليزي'}
              </span>
              {isEn ? (
                <>Provision that lasts,<br /><span className="text-ribbon">for you and your family.</span></>
              ) : (
                <>زادٌ يبقى،<br /><span className="text-ribbon whitespace-nowrap">لك ولأهل بيتك.</span></>
              )}
            </h1>

            <div className="[grid-area:duo]">
              <TeacherDuo isEn={isEn} />
            </div>

            <div className="[grid-area:body] self-start space-y-6 animate-fade-in-up">
              {/* The brand line (docs/marketing/BRAND.md §1, approved 2026-11-05) and who it is for. */}
              <p className="font-editorial text-xl sm:text-2xl text-foreground leading-snug max-w-xl">
                {isEn ? 'Not just lessons. A mentor who stays.' : 'ليست حصصًا فقط، بل معلّم يبقى معك.'}
                <span className="block mt-1 font-sans text-base text-muted-foreground">
                  {isEn ? 'For Muslim families and adults learning in English.' : 'للأسر المسلمة وللكبار الذين يتعلّمون بالإنجليزية.'}
                </span>
              </p>
              <HeroSubjects isEn={isEn} className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl" />

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <PublicButton
                  variant="primary"
                  size="lg"
                  id="hero-get-started-btn"
                  data-tour="header-get-started-cta"
                  onClick={() => onOpenTrialModal()}
                  className="liquid-cta w-full sm:w-auto shadow-lg shadow-primary/25"
                >
                  <TrialCtaLabel isEn={isEn} />
                </PublicButton>
                <Link
                  to="/about"
                  className="btn-glass px-6 py-3 rounded-xl"
                >
                  {isEn ? 'Get to know us' : 'اتعرّف علينا'}
                </Link>
              </div>

              <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {[
                  { en: '30 minutes, free', ar: '٣٠ دقيقة مجاناً' },
                  { en: 'No card needed', ar: 'بدون بطاقة بنكية' },
                  { en: 'Choose a male or female teacher', ar: 'تختار معلّم أو معلّمة' },
                  { en: 'You can sit in on any lesson', ar: 'تقدر تحضر أي حصة' }
                ].map((point) => (
                  <li key={point.en} className="flex items-center gap-1.5 font-medium">
                    <Check className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" aria-hidden="true" />
                    <span>{t(point)}</span>
                  </li>
                ))}
              </ul>
              <Link to="/safety" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-foreground underline underline-offset-4 decoration-[#087D91]/50 hover:decoration-[#087D91]">
                <ShieldCheck className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" aria-hidden="true" />
                {isEn ? 'How we keep children safe: the teacher opens the room, nothing is recorded' : 'إزاي بنحافظ على الأطفال: المعلم هو اللي بيفتح الغرفة، ومفيش تسجيل'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 2. THE VERSE THE ACADEMY IS NAMED AFTER ─── */}
      <section className="relative border-y border-border/70 bg-surface-warm/60">
        <div className="public-container py-14 lg:py-20 text-center">
          <p
            lang="ar"
            dir="rtl"
            className="text-[2.4rem] leading-[1.9] sm:text-6xl sm:leading-[1.7] text-ribbon mx-auto max-w-4xl"
            style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}
          >
            {VERSE}
          </p>
          <p className="mt-4 text-sm sm:text-base text-muted-foreground">
            {isEn
              ? '“And take provisions, but indeed, the best provision is fear of Allah.” Al-Baqarah 2:197, Saheeh International'
              : 'البقرة ١٩٧. ومنها اسمنا: نتزوّد بالعلم، وخير الزاد التقوى.'}
          </p>
          <button
            type="button"
            id="verse-sound-btn"
            onClick={() => (audio.playing ? audio.stop() : void audio.play())}
            aria-pressed={audio.playing}
            className="btn-glass is-pill mt-6"
          >
            {audio.playing ? <VolumeX className="w-4 h-4 text-[#C51F24]" aria-hidden="true" /> : <Volume2 className="w-4 h-4 text-[#087D91]" aria-hidden="true" />}
            {audio.playing ? (isEn ? 'Stop the recitation' : 'إيقاف التلاوة') : (isEn ? 'Listen to the recitation' : 'استمع للتلاوة')}
          </button>
        </div>
      </section>

      {/* ─── 3a. SOUND FAMILIAR? ─── the pain and what families tried before (CLOSER review 2026-11-05). */}
      <section className="public-container py-14 lg:py-20" aria-labelledby="home-familiar">
        <h2 id="home-familiar" className={`font-editorial text-3xl sm:text-4xl text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}>
          {isEn ? 'Sound familiar?' : 'هل يبدو هذا مألوفًا؟'}
        </h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 max-w-3xl">
          {(isEn ? [
            'The teacher keeps changing, and every new one starts from zero.',
            'Lessons happen, but nobody can tell you the plan.',
            'Your child loved it for a month, then lost interest.',
            'The times never fit your week.',
          ] : [
            'المعلّم يتغيّر كل فترة، وكل معلّم جديد يبدأ من الصفر.',
            'الحصص مستمرة، لكن لا أحد يخبرك بالخطة.',
            'أحبّ طفلك الدروس شهرًا، ثم فقد حماسه.',
            'المواعيد لا تناسب أسبوعك أبدًا.',
          ]).map((line) => (
            <li key={line} className="rounded-2xl border border-border/70 bg-surface-warm/50 px-5 py-4 text-base leading-relaxed text-foreground">{line}</li>
          ))}
        </ul>
        <p className="mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-muted-foreground">
          {isEn
            ? 'YouTube, a weekend class, an academy that swaps teachers: families tell us they tried it all. Here, your teacher stays.'
            : 'يوتيوب، وفصل نهاية الأسبوع، وأكاديمية تبدّل المعلّمين: تخبرنا الأسر أنها جرّبت كل ذلك. هنا يبقى معلّمك معك.'}
        </p>
      </section>

      {/* ─── 3. TWO WAYS TO LEARN ─── */}
      <PublicSection>
        <div className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-10 lg:mb-14">
            <h2 className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
              {isEn ? 'One home, for you and everyone you love.' : 'بيت واحد، ليك ولكل اللي بتحبهم.'}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4">
              {isEn
                ? 'Learn on your own, or walk alongside your children, from the same place.'
                : 'اتعلّم لوحدك، أو امشِ جنب أولادك في رحلتهم، من نفس المكان.'}
            </p>
          </div>

          <TwoWays isEn={isEn} />
        </div>
      </PublicSection>

      {/* ─── 3b. THE WEEK AROUND THE LESSON, AND WHAT FAMILIES SAY ─── */}
      <WeekWithUs isEn={isEn} />
      <FamilyVoices isEn={isEn} />

      {/* ─── 4. WHY WE EXIST ─── */}
      <section className="khatam-field relative">
        <div className="public-container py-16 lg:py-24 text-center">
          <p
            lang="ar"
            dir="rtl"
            className="text-[2.1rem] leading-[1.9] sm:text-5xl sm:leading-[1.8] text-ribbon mx-auto max-w-4xl"
            style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}
          >
            {MISSION_VERSE}
          </p>
          {isEn ? (
            <p className="mt-3 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
              “But as for that which benefits the people, it remains on the earth.”
              <span className="block mt-1 text-sm">Ar-Ra‘d 13:17, Saheeh International</span>
            </p>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">الرعد ١٧</p>
          )}
          <p className="mt-6 font-editorial text-xl sm:text-2xl text-foreground max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? 'We measure our work by what stays: a word said right, a verse kept, a good habit that lives on at home.'
              : 'بنقيس شغلنا باللي بيفضل: كلمة اتقالت صح، وآية اتحفظت، وعادة طيبة فضلت في البيت.'}
          </p>
        </div>
      </section>

      {/* ─── 5. DOORS INTO THE SITE ─── */}
      {/* Six arched glass doors, each holding a deep portal with its own lit emblem. */}
      <PublicSection className="khatam-field brand-lights pt-4 md:pt-6 lg:pt-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground mb-10">
            {isEn ? 'Come in through any door' : 'ادخل من أي باب'}
          </h2>
          <nav aria-label={isEn ? 'Site sections' : 'أقسام الموقع'}>
            <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-5">
              {EXPLORE.map(({ to, emblem: Emblem, tone, title, body, cta }) => (
                <li key={to} className="door-slot">
                  <Link
                    to={to}
                    className="door-card"
                    style={{ '--door-a': tone[0], '--door-b': tone[1] } as React.CSSProperties}
                  >
                    <span className="door-portal khatam-window" aria-hidden="true">
                      <span className="door-glow" />
                      <Emblem className="door-emblem" />
                    </span>
                    <span className="door-title">{t(title)}</span>
                    <span className="door-tagline">{t(body)}</span>
                    <span className="door-enter" aria-hidden="true">
                      {t(cta)}
                      <svg viewBox="0 0 16 16" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h9.5M8.5 4l4 4-4 4" />
                      </svg>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </PublicSection>

      {/* ─── 5b. THE FIRST QUESTIONS FAMILIES ASK ─── */}
      <section className="public-container pb-16 lg:pb-20" aria-labelledby="home-faq">
        <div className="max-w-3xl mx-auto">
          <h2 id="home-faq" className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground">
            {isEn ? 'Questions families ask first' : 'أول أسئلة بتسألها العيلات'}
          </h2>
          <div className="mt-6 divide-y divide-border border-y border-border">
            {FAQS.slice(0, 3).map((f) => (
              <details key={f.question} className="group py-3">
                <summary className="flex items-center justify-between gap-4 min-h-11 cursor-pointer list-none font-bold text-foreground">
                  {isEn ? f.question : f.arabicQuestion}
                  <span aria-hidden="true" className="text-xl leading-none text-muted-foreground transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-2 text-muted-foreground leading-relaxed max-w-[70ch]">{isEn ? f.answer : f.arabicAnswer}</p>
              </details>
            ))}
          </div>
          <Link to="/faq" className="inline-flex items-center min-h-11 mt-2 text-sm font-semibold text-foreground underline underline-offset-4">
            {isEn ? 'All questions and answers' : 'كل الأسئلة والإجابات'}
          </Link>
        </div>
      </section>

      {/* ─── 5. CLOSING CALL TO ACTION ─── */}
      <section id="contact" className="public-container pb-16 lg:pb-24">
        <div className="band-deep relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 lg:py-20 text-center">
          <svg aria-hidden="true" viewBox="0 0 800 200" className="absolute inset-x-0 bottom-0 w-full h-auto opacity-40" preserveAspectRatio="none">
            <path d="M0 170 C 160 90, 300 210, 420 130 S 660 40, 800 90" fill="none" stroke="#E5A93C" strokeWidth="2" />
          </svg>
          <h2 className="relative font-editorial text-3xl sm:text-5xl font-bold leading-tight">
            {isEn ? 'Every journey starts with one lesson.' : 'كل رحلة بتبدأ بحصة.'}
          </h2>
          <p className="relative mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
            {isEn
              ? 'The first one is free: thirty minutes to meet, listen, and find your way.'
              : 'والأولى مجاناً: ٣٠ دقيقة نتعرّف فيها، ونسمعك، ونلاقي طريقك.'}
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="liquid-cta w-full sm:w-auto">
              <TrialCtaLabel isEn={isEn} />
            </PublicButton>
            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border border-[#FAF7F2]/35 bg-[#FAF7F2]/10 text-[#FAF7F2] hover:bg-[#FAF7F2]/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05363F] focus-visible:ring-[#F6D58E]"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#25D366]" />
              <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
}
