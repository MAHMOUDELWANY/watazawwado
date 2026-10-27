import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton } from '../PublicDesignSystem';
import { Check, User, Users, Volume2, VolumeX, Eye, DoorClosed, VideoOff, ArrowRight } from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { TeacherDuo } from './TeacherDuo';
import { HeroSubjects } from './HeroSubjects';
import { MushafEmblem, PathEmblem, TeachersEmblem, EnvelopeEmblem, LanternEmblem, DoorAjarEmblem } from '../emblems/DoorEmblems';
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

const PATHS: Array<{ icon: typeof User; tone: string; title: L; body: L; note: L }> = [
  {
    icon: User,
    tone: 'from-[#087D91]/14 to-transparent border-[#087D91]/30 text-[#087D91] dark:text-[#12A4BC]',
    title: { en: 'Learn for yourself', ar: 'تعلّم لنفسك' },
    body: {
      en: 'Your own account: book lessons at times that suit you, follow your progress, and talk to your teacher in the on-site chat.',
      ar: 'حسابك الخاص: احجز دروسك في المواعيد اللي تناسبك، وتابع تقدمك، وكلّم معلمك في المحادثة داخل الموقع.'
    },
    note: { en: 'Direct feedback from your teacher', ar: 'متابعة مباشرة من معلمك' }
  },
  {
    icon: Users,
    tone: 'from-[#8B4935]/14 to-transparent border-[#8B4935]/30 text-[#8B4935] dark:text-[#DA7960]',
    title: { en: 'Learn for your family', ar: 'تعلّم لعائلتك' },
    body: {
      en: 'One parent account for every child. Each child has their own teacher and plan, and you see every lesson and note.',
      ar: 'حساب واحد لولي الأمر لكل الأولاد. لكل طفل معلمه وخطته، وإنت شايف كل حصة وكل ملاحظة.'
    },
    note: { en: '5% off a second child’s package', ar: 'خصم 5% على باقة الطفل التاني' }
  }
];

// What we teach (RULES.md §2b and §3): three families, their subjects and the "from" hourly price.
const FAMILIES: Array<{ tone: [string, string]; title: L; price: L; note: L; subjects: L[] }> = [
  {
    tone: ['#0B7486', '#04323A'],
    title: { en: 'The Quran', ar: 'القرآن' },
    price: { en: '$9 an hour', ar: '9$ للساعة' },
    note: { en: 'From the first letter to the Mushaf.', ar: 'من أول حرف لحد المصحف.' },
    subjects: [
      { en: 'Quran Reading', ar: 'قراءة القرآن' },
      { en: 'Tajweed', ar: 'التجويد' },
      { en: 'Memorization & Revision', ar: 'الحفظ والمراجعة' },
    ],
  },
  {
    tone: ['#8B4935', '#33190F'],
    title: { en: 'The Zad Path', ar: 'مسار الأثر' },
    price: { en: '$9 an hour', ar: '9$ للساعة' },
    note: { en: 'Our own curriculum, in three versions by age.', ar: 'منهجنا إحنا، بتلات نسخ حسب السن.' },
    subjects: [
      { en: 'Zad Essentials', ar: 'أول الزاد' },
      { en: 'Seerah', ar: 'السيرة' },
    ],
  },
  {
    tone: ['#A3271F', '#3F0E10'],
    title: { en: 'Languages', ar: 'اللغات' },
    price: { en: 'from $13 an hour', ar: 'من 13$ للساعة' },
    note: { en: 'For kids, teens and adults.', ar: 'للأطفال والناشئة والكبار.' },
    subjects: [
      { en: 'Fusha Arabic', ar: 'العربية الفصحى' },
      { en: 'Egyptian Arabic', ar: 'العامية المصرية' },
      { en: 'English', ar: 'الإنجليزية' },
    ],
  },
];

// Restates /safety in three lines, for the parents reading the homepage.
const PEACE: Array<{ icon: typeof Eye; text: L }> = [
  { icon: Eye, text: { en: 'You can sit in on any lesson.', ar: 'تقدر تحضر أي حصة مع ابنك.' } },
  { icon: DoorClosed, text: { en: 'The teacher opens the Zoom room; your child waits until let in.', ar: 'المعلم بيفتح أوضة Zoom، وابنك بيستنى لحد ما يدخّله.' } },
  { icon: VideoOff, text: { en: 'Lessons are not recorded.', ar: 'الحصص مش بتتسجّل.' } },
];

// Each door's portal: [top, bottom] of its deep gradient. Teal, copper and crimson take turns.
type Door = { to: string; emblem: React.ComponentType<{ className?: string }>; tone: [string, string]; title: L; body: L };

const EXPLORE: Door[] = [
  {
    to: '/learning', emblem: MushafEmblem, tone: ['#0B7486', '#04323A'],
    title: { en: 'Lessons and subjects', ar: 'الدروس والمواد' },
    body: { en: '8 subjects, your own teacher.', ar: '٨ مواد، ومعلم ليك إنت.' }
  },
  {
    to: '/how-it-works', emblem: PathEmblem, tone: ['#8B4935', '#33190F'],
    title: { en: 'How it works', ar: 'كيف نعمل' },
    body: { en: 'Four calm steps.', ar: 'أربع خطوات هادية.' }
  },
  {
    to: '/about', emblem: TeachersEmblem, tone: ['#A3271F', '#3F0E10'],
    title: { en: 'About us', ar: 'من نحن' },
    body: { en: 'Who we are, who teaches.', ar: 'إحنا مين، ومين هيعلّمك.' }
  },
  {
    to: '/pricing', emblem: EnvelopeEmblem, tone: ['#0A5866', '#05262D'],
    title: { en: 'Prices and packages', ar: 'الأسعار والباقات' },
    body: { en: 'From $9 an hour.', ar: 'من 9$ للساعة.' }
  },
  {
    to: '/faq', emblem: LanternEmblem, tone: ['#6E3324', '#241008'],
    title: { en: 'Questions and answers', ar: 'الأسئلة الشائعة' },
    body: { en: 'Short, honest answers.', ar: 'إجابات قصيرة وصادقة.' }
  },
  {
    to: '/student', emblem: DoorAjarEmblem, tone: ['#8E1F1C', '#2E0B0C'],
    title: { en: 'Your account', ar: 'حسابك' },
    body: { en: 'Your corner of the academy.', ar: 'ركنك في الأكاديمية.' }
  }
];

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);
  const audio = useWelcomeAudio();
  useVerseFont();

  return (
    <main id="main-content" className="pt-20 lg:pt-24">
      {/* Welcome recitation: first visit of a session (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />

      {/* ─── 1. HERO ─── phones: headline, teachers, then the rest; wide screens: text beside the teachers */}
      <section className="khatam-field brand-lights relative overflow-hidden">
        <div className="public-container pt-8 pb-14 lg:pt-14 lg:pb-24">
          <div className="grid gap-8 lg:gap-x-14 lg:grid-cols-2 [grid-template-areas:'title'_'duo'_'body'] lg:[grid-template-areas:'title_duo'_'body_duo'] items-center">
            <h1
              className={`[grid-area:title] self-end font-editorial text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-[4rem] text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}
            >
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
              <HeroSubjects isEn={isEn} className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl" />

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <PublicButton
                  variant="primary"
                  size="lg"
                  id="hero-get-started-btn"
                  data-tour="header-get-started-cta"
                  onClick={() => onOpenTrialModal()}
                  className="w-full sm:w-auto shadow-lg shadow-primary/25"
                >
                  {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
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
                  { en: 'Choose a male or female teacher', ar: 'تختار معلّم أو معلّمة' }
                ].map((point) => (
                  <li key={point.en} className="flex items-center gap-1.5 font-medium">
                    <Check className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" aria-hidden="true" />
                    <span>{t(point)}</span>
                  </li>
                ))}
              </ul>
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

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {PATHS.map(({ icon: Icon, tone, title, body, note }) => (
              <article key={title.en} className={`arch-top relative overflow-hidden border bg-gradient-to-b ${tone} bg-surface shadow-[var(--shadow-2)] px-7 pt-14 pb-8 sm:px-10 text-center`}>
                <div className="arch-tile mx-auto mb-6 w-14 h-16 flex items-center justify-center bg-current/10 border border-current/25">
                  <Icon className="w-7 h-7" aria-hidden="true" />
                </div>
                <h3 className="font-editorial text-2xl font-bold text-foreground mb-3">{t(title)}</h3>
                <p className="text-muted-foreground leading-relaxed max-w-sm mx-auto">{t(body)}</p>
                <p className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold">
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>{t(note)}</span>
                </p>
              </article>
            ))}
          </div>
        </div>
      </PublicSection>

      {/* ─── 3b. WHAT WE TEACH ─── three mihrab-shaped shelves, each with its subjects and its hourly price */}
      <section className="teach-band relative overflow-hidden" aria-labelledby="teach-title">
        <div className="public-container py-16 lg:py-24">
          <div className="max-w-2xl mb-10 lg:mb-14">
            <h2 id="teach-title" className="editorial-heading font-editorial text-3xl sm:text-4xl text-foreground">
              {isEn ? 'What we teach' : 'بنعلّم إيه'}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4">
              {isEn
                ? 'Eight subjects in three families. Every lesson is one-on-one, 30, 45 or 60 minutes.'
                : 'تمان مواد في تلات عائلات. وكل حصة فردية، ٣٠ أو ٤٥ أو ٦٠ دقيقة.'}
            </p>
          </div>

          <ul className="grid gap-6 md:grid-cols-3 lg:gap-8">
            {FAMILIES.map((f) => (
              <li key={f.title.en} className="teach-slot">
                <Link to="/learning" className="teach-arch group" style={{ '--door-a': f.tone[0], '--door-b': f.tone[1] } as React.CSSProperties}>
                  <span className="teach-crown khatam-window" aria-hidden="true">
                    <svg viewBox="0 0 80 80" className="teach-star" fill="none">
                      <rect x="20" y="20" width="40" height="40" />
                      <rect x="20" y="20" width="40" height="40" transform="rotate(45 40 40)" />
                      <circle cx="40" cy="40" r="11" />
                    </svg>
                  </span>
                  <span className="teach-body">
                    <span className="block font-editorial text-2xl font-bold text-foreground">{t(f.title)}</span>
                    <span className="teach-price">{t(f.price)}</span>
                    <span className="block mt-3 text-sm text-muted-foreground leading-relaxed">{t(f.note)}</span>
                    <ul className="teach-list">
                      {f.subjects.map((s) => <li key={s.en}>{t(s)}</li>)}
                    </ul>
                    <span className="teach-more">
                      {isEn ? 'See the subjects' : 'شوف المواد'}
                      <ArrowRight className="w-4 h-4 rtl:-scale-x-100 transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5" aria-hidden="true" />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-muted-foreground">
            {isEn
              ? 'Shorter lessons cost the same per minute. Packages bring the price down; advanced or intensive study may cost more, and you always see it before you pay.'
              : 'الحصص الأقصر بنفس السعر للدقيقة. والباقات بتنزّل السعر، والدراسة المتقدمة أو المكثفة ممكن تكون أعلى، ودايماً بتشوف السعر قبل ما تدفع.'}{' '}
            <Link to="/pricing" className="font-semibold text-[var(--teal)] underline underline-offset-4">{isEn ? 'Prices and packages' : 'الأسعار والباقات'}</Link>
          </p>
        </div>
      </section>

      {/* ─── 3c. FOR PARENTS ─── three lines from /safety */}
      <section className="public-container pb-4" aria-labelledby="peace-title">
        <div className="peace-strip">
          <h2 id="peace-title" className="font-editorial text-xl sm:text-2xl font-bold text-foreground">
            {isEn ? 'For parents' : 'لأولياء الأمور'}
          </h2>
          <ul className="peace-list">
            {PEACE.map(({ icon: Icon, text }) => (
              <li key={text.en}>
                <span className="peace-icon"><Icon className="w-4 h-4" aria-hidden="true" /></span>
                <span>{t(text)}</span>
              </li>
            ))}
          </ul>
          <Link to="/safety" className="peace-link">
            {isEn ? 'How lessons with children work' : 'إزاي بتمشي حصص الأطفال'}
            <ArrowRight className="w-4 h-4 rtl:-scale-x-100" aria-hidden="true" />
          </Link>
        </div>
      </section>

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
              {EXPLORE.map(({ to, emblem: Emblem, tone, title, body }) => (
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
                      {isEn ? 'Step in' : 'ادخل'}
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
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
              {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
            </PublicButton>
            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-[#25D366] text-[#07361F] hover:bg-[#20BD5A] shadow-[0_10px_24px_-12px_rgba(37,211,102,0.9)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05363F] focus-visible:ring-[#25D366]"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
