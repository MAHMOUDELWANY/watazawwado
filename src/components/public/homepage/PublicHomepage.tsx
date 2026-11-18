import { TeacherStays } from './TeacherStays';
import { TrialCtaLabel } from "../TrialCtaLabel";
import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicButton } from '../PublicDesignSystem';
import { ArrowLeft, ArrowRight, Check, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { IntroFilm } from './IntroFilm';
import { PathFinder } from './PathFinder';
import { HeroSubjects } from './HeroSubjects';
import { MushafEmblem, PathEmblem, TeachersEmblem, EnvelopeEmblem, LanternEmblem } from '../emblems/DoorEmblems';
import { FamilyVoices } from './FamilyVoices';
import { NewToIslamDoor } from '../NewToIslamDoor';
import { FAQS } from '../../../data/content';
import { findSubjectPage, SUBJECT_PAGES_PATH } from '../../../data/subjectPages';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { useWelcomeAudio } from '../../../lib/welcomeAudio';

type L = { en: string; ar: string };

const VERSE = '﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾';
// Thmanyah has no ornate Quranic brackets, so the verse uses Amiri Quran, loaded for these letters only.
function useVerseFont() {
  React.useEffect(() => {
    if (document.getElementById('verse-font')) return;
    const link = document.createElement('link');
    link.id = 'verse-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap&text=' + encodeURIComponent(Array.from(new Set(VERSE)).join(''));
    document.head.appendChild(link);
  }, []);
}

/**
 * One rhythm for every section (owner, 2026-11-17: the page felt scattered): a small gold eyebrow, one big heading
 * with one word in the brand ribbon, one short line. Inspired by how calm competitor pages read, in our identity.
 */
function SectionHead({ id, eyebrow, before, ribbon, after = '', sub, dark }: { id: string; eyebrow: string; before: string; ribbon: string; after?: string; sub?: string; dark?: boolean }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <p className={`inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide ${dark ? 'text-[#F6D58E]' : 'text-[#B4552F] dark:text-[#E5A93C]'}`}>
        <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />{eyebrow}<span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />
      </p>
      <h2 id={id} className={`mt-3 font-editorial font-bold text-[2rem] leading-[1.2] sm:text-5xl ${dark ? 'text-[#FAF7F2]' : 'text-foreground'}`}>
        {before}<span className={dark ? 'text-[#F6D58E]' : 'text-ribbon'}>{ribbon}</span>{after}
      </h2>
      {sub && <p className={`mt-4 text-base sm:text-lg leading-relaxed ${dark ? 'text-[#FAF7F2]/75' : 'text-muted-foreground'}`}>{sub}</p>}
    </div>
  );
}

// What we teach: four tracks (RULES.md §2b), each opening its subject pages.
type Track = { emblem: React.ReactNode; tone: [string, string]; title: L; body: L; links: { slug: string; label: L }[] };
const GLYPH = 'font-editorial font-bold text-[#F6D58E] leading-none drop-shadow-[0_0_14px_rgba(229,169,60,0.5)]';
const TRACKS: Track[] = [
  {
    emblem: <MushafEmblem className="w-20 h-20" />, tone: ['#0B7486', '#04323A'],
    title: { en: 'The Quran', ar: 'القرآن الكريم' },
    body: { en: 'Reading, Tajweed, memorisation and revision.', ar: 'تلاوة وتجويد، وحفظ ومراجعة.' },
    links: [
      { slug: 'online-quran-classes-for-kids', label: { en: 'For kids', ar: 'للأطفال' } },
      { slug: 'online-quran-classes-for-adults', label: { en: 'For adults', ar: 'للكبار' } },
      { slug: 'online-tajweed-classes', label: { en: 'Tajweed', ar: 'التجويد' } },
      { slug: 'online-quran-memorization', label: { en: 'Hifz', ar: 'الحفظ' } },
    ],
  },
  {
    emblem: <PathEmblem className="w-20 h-20" />, tone: ['#A3271F', '#3F0E10'],
    title: { en: 'The Zad Path', ar: 'منهج زاد' },
    body: { en: 'Our own curriculum: Zad Essentials and the Seerah, for kids, teens and adults.', ar: 'منهجنا الخاص: أساسيات الزاد والسيرة، للأطفال والمراهقين والكبار.' },
    links: [{ slug: 'islamic-classes-for-kids', label: { en: 'For kids', ar: 'للأطفال' } }],
  },
  {
    emblem: <span lang="ar" className={`${GLYPH} text-6xl`}>ض</span>, tone: ['#8B4935', '#33190F'],
    title: { en: 'Arabic', ar: 'العربية' },
    body: { en: 'Fusha for the Quran and books, or Egyptian for everyday talk.', ar: 'الفصحى للقرآن والكتب، أو المصرية للكلام اليومي.' },
    links: [
      { slug: 'learn-arabic-online', label: { en: 'Fusha', ar: 'الفصحى' } },
      { slug: 'learn-egyptian-arabic-online', label: { en: 'Egyptian', ar: 'المصرية' } },
    ],
  },
  {
    emblem: <span lang="en" className={`${GLYPH} text-5xl`}>Aa</span>, tone: ['#0A5866', '#05262D'],
    title: { en: 'English', ar: 'الإنجليزية' },
    body: { en: 'Speaking and confidence, at school and at work.', ar: 'محادثة وثقة، في المدرسة والعمل.' },
    links: [{ slug: 'online-english-classes', label: { en: 'English classes', ar: 'حصص الإنجليزي' } }],
  },
];

const PROMISES: { emblem: React.ComponentType<{ className?: string }>; title: L; body: L }[] = [
  { emblem: TeachersEmblem, title: { en: 'Your teacher stays', ar: 'معلّمك يبقى معك' }, body: { en: 'The same teacher, lesson after lesson, who knows where you stopped.', ar: 'نفس المعلّم حصة بعد حصة، يعرف أين توقّفت.' } },
  { emblem: EnvelopeEmblem, title: { en: 'A note after every lesson', ar: 'تقرير بعد كل حصة' }, body: { en: 'What was learned and what to practise, before you have to ask.', ar: 'ماذا تعلّم وماذا يراجع، قبل أن تسأل.' } },
  { emblem: LanternEmblem, title: { en: 'Children kept safe', ar: 'أمان أطفالك أولًا' }, body: { en: 'The teacher opens the room, nothing is recorded, and you can sit in on any lesson.', ar: 'المعلّم يفتح الغرفة، ولا يوجد تسجيل، وتقدر تحضر أي حصة.' } },
];

const STEPS: { title: L; body: L }[] = [
  { title: { en: 'Book a free lesson', ar: 'احجز حصة مجانية' }, body: { en: '30 minutes. No card needed.', ar: '٣٠ دقيقة، بدون بطاقة بنكية.' } },
  { title: { en: 'Meet and find your level', ar: 'نتعرّف ونحدّد المستوى' }, body: { en: 'Your teacher listens and sets a plan with you.', ar: 'المعلّم يسمعك ويضع معك خطة.' } },
  { title: { en: 'Start, and follow along', ar: 'ابدأ وتابع' }, body: { en: 'A note after every lesson. Book at times that suit you.', ar: 'تقرير بعد كل حصة، ومواعيد تناسبك.' } },
];

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  const audio = useWelcomeAudio();
  useVerseFont();

  return (
    <main id="main-content" className="pt-16 sm:pt-20">
      {/* Welcome recitation: first visit of a session (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />

      {/* ─── 1. HERO ─── one centred promise, one action, then the film. */}
      <section className="khatam-field brand-lights relative overflow-hidden">
        <div className="public-container pt-10 pb-16 lg:pt-16 lg:pb-24">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className={`font-editorial text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-7xl text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}>
              {/* MK-04: no kicker above the brand line; the subjects live in <title>, the meta description and the line below. */}
              {isEn ? (
                <>Provision that lasts,<br /><span className="text-ribbon">for you and your family.</span></>
              ) : (
                <>زادٌ يبقى،<br /><span className="text-ribbon whitespace-nowrap">لك ولأهل بيتك.</span></>
              )}
            </h1>
            <p className="mt-6 font-editorial text-xl sm:text-2xl leading-snug text-foreground max-w-2xl mx-auto">
              {isEn
                ? 'Pick your teacher from real profiles. After every class, we tell you how it went, before you have to ask.'
                : 'اختار معلّمك من ملفات حقيقية. وبعد كل حصة، نبلّغك كيف كانت قبل ما تسأل.'}
            </p>
            <HeroSubjects isEn={isEn} className="mt-3 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto" />

            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-stretch sm:items-center">
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
              <a href="#path-finder" className="btn-glass px-6 py-3 rounded-xl">
                {isEn ? 'Who is the learning for?' : 'لمن التعلّم؟'}
              </a>
            </div>

            <ul className="mt-6 flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {[
                { en: '30 minutes, free', ar: '٣٠ دقيقة مجاناً' },
                { en: 'No card needed', ar: 'بدون بطاقة بنكية' },
                { en: 'Choose a male or female teacher', ar: 'تختار معلّم أو معلّمة' },
              ].map((point) => (
                <li key={point.en} className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" aria-hidden="true" />
                  <span>{t(point)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 lg:mt-16">
            <IntroFilm isEn={isEn} onTrial={() => onOpenTrialModal()} />
          </div>
        </div>
      </section>

      {/* ─── 2. WHAT WE TEACH ─── four tracks, each opening its subject pages. */}
      <section className="public-container py-16 lg:py-24" aria-labelledby="home-tracks">
        <SectionHead
          id="home-tracks"
          eyebrow={isEn ? 'Our subjects' : 'موادّنا'}
          before={isEn ? 'What will you ' : 'ماذا '}
          ribbon={isEn ? 'learn with us?' : 'تتعلّم معنا؟'}
          sub={isEn ? '8 subjects, your own teacher.' : '٨ مواد، ومعلم لك أنت.'}
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto">
          {TRACKS.map((tr) => {
            const rate = Math.min(...tr.links.map((l) => findSubjectPage(l.slug)?.rateUsd ?? 99));
            return (
              <li key={tr.title.en} className="group flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_18px_40px_-28px_rgba(28,20,17,0.45)] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_28px_50px_-28px_rgba(28,20,17,0.55)]">
                <div className="khatam-window relative grid place-items-center h-40" style={{ background: `radial-gradient(70% 80% at 50% 30%, ${tr.tone[0]}, ${tr.tone[1]})` }}>
                  <span aria-hidden="true" className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-[#F6D58E]/20 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-70" />
                  <span className="relative transition-transform duration-300 group-hover:scale-105" aria-hidden="true">{tr.emblem}</span>
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <h3 className="font-editorial font-bold text-2xl text-foreground">{t(tr.title)}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed">{t(tr.body)}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {tr.links.map((l) => (
                      <li key={l.slug}>
                        <Link to={`${SUBJECT_PAGES_PATH}/${l.slug}`} className="inline-flex items-center gap-1 min-h-11 rounded-full border border-border px-3.5 text-sm font-semibold text-foreground hover:border-[#087D91]/60 hover:text-[#087D91] transition-colors">
                          {t(l.label)}<Arrow className="w-3.5 h-3.5" aria-hidden="true" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-auto pt-5 text-sm text-muted-foreground">
                    {isEn ? <>From <b className="text-foreground">${rate}</b> an hour</> : <>من <b className="text-foreground">{rate}$</b> للساعة</>}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <div className="max-w-6xl mx-auto">
          <NewToIslamDoor isEn={isEn} />
        </div>
      </section>

      {/* ─── 3. WHO IS THE LEARNING FOR? ─── two taps to the right subject page. */}
      <PathFinder isEn={isEn} onTrial={() => onOpenTrialModal()} />

      {/* ─── 4. WHY US ─── three promises. */}
      <section className="public-container py-16 lg:py-24" aria-labelledby="home-why">
        <SectionHead
          id="home-why"
          eyebrow={isEn ? 'Why Watazawwado' : 'لماذا وتزوّدوا'}
          before={isEn ? 'Learning that ' : 'تعليمٌ '}
          ribbon={isEn ? 'knows you' : 'يعرفك'}
          after={isEn ? ' by name.' : ' باسمك.'}
        />
        <ul className="mt-12 grid gap-10 sm:gap-6 md:grid-cols-3 max-w-5xl mx-auto text-center">
          {PROMISES.map(({ emblem: Emblem, title, body }) => (
            <li key={title.en} className="flex flex-col items-center">
              <span className="khatam-window grid place-items-center w-28 h-32 rounded-t-full rounded-b-3xl band-espresso shadow-[0_20px_40px_-24px_rgba(28,20,17,0.7)]">
                <Emblem className="w-20 h-20" />
              </span>
              <h3 className="mt-5 font-editorial font-bold text-2xl text-foreground">{t(title)}</h3>
              <p className="mt-2 max-w-xs text-muted-foreground leading-relaxed">{t(body)}</p>
            </li>
          ))}
        </ul>
        <p className="mt-10 text-center">
          <Link to="/safety" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-foreground underline underline-offset-4 decoration-[#087D91]/50 hover:decoration-[#087D91]">
            <ShieldCheck className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" aria-hidden="true" />
            {isEn ? 'How we keep children safe' : 'كيف نحافظ على الأطفال'}
          </Link>
        </p>
      </section>

      {/* ─── 5. THE TEACHER STAYS ─── the flying carpet (owner's idea, 2026-11-05). */}
      <TeacherStays isEn={isEn} />

      {/* ─── 6. HOW TO START ─── three stops on a gold line. */}
      <section className="public-container py-16 lg:py-24" aria-labelledby="home-start">
        <div className="band-espresso relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 lg:px-16 lg:py-16 max-w-6xl mx-auto grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
          <div className="text-center lg:text-start">
            <p className="inline-flex items-center gap-3 text-xs sm:text-sm font-bold tracking-wide text-[#F6D58E]">
              <span aria-hidden="true" className="h-px w-8 bg-current opacity-60" />{isEn ? 'How to start' : 'كيف تبدأ'}
            </p>
            <h2 id="home-start" className="mt-3 font-editorial font-bold text-[2rem] leading-[1.2] sm:text-5xl text-[#FAF7F2]">
              {isEn ? <>The first step is <span className="text-[#F6D58E]">on us.</span></> : <>الخطوة الأولى <span className="text-[#F6D58E]">علينا.</span></>}
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-[#FAF7F2]/75 max-w-md mx-auto lg:mx-0">
              {isEn ? 'Not sure which subject or level? That is what the free lesson is for.' : 'مش متأكد من المادة أو المستوى؟ الحصة المجانية لهذا بالضبط.'}
            </p>
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="liquid-cta mt-8 w-full sm:w-auto">
              <TrialCtaLabel isEn={isEn} />
            </PublicButton>
          </div>
          <ol className="relative space-y-8 ps-14 before:absolute before:top-4 before:bottom-4 before:start-[1.2rem] before:w-px before:bg-gradient-to-b before:from-[#E5A93C] before:to-[#E5A93C]/20">
            {STEPS.map((s, i) => (
              <li key={s.title.en} className="relative">
                <span aria-hidden="true" className="absolute -start-14 top-0 grid place-items-center w-10 h-10 rounded-full bg-[#E5A93C] text-[#1C1411] font-bold tabular-nums shadow-[0_0_0_6px_rgba(229,169,60,0.18)]">{i + 1}</span>
                <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#FAF7F2]">{t(s.title)}</h3>
                <p className="mt-1 text-[#FAF7F2]/70 leading-relaxed">{t(s.body)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── 7. WHAT FAMILIES SAY ─── */}
      <FamilyVoices isEn={isEn} />

      {/* ─── 8. THE FIRST QUESTIONS FAMILIES ASK ─── */}
      <section className="public-container pb-16 lg:pb-20" aria-labelledby="home-faq">
        <div className="max-w-3xl mx-auto">
          <SectionHead id="home-faq" eyebrow={isEn ? 'Good to know' : 'قبل أن تبدأ'} before={isEn ? 'Questions families ' : 'أول ما '} ribbon={isEn ? 'ask first' : 'تسأل عنه الأسر'} />
          <div className="mt-10 space-y-3">
            {FAQS.slice(0, 4).map((f) => (
              <details key={f.question} className="group rounded-2xl border border-border bg-card px-5 open:shadow-[0_14px_30px_-24px_rgba(28,20,17,0.5)]">
                <summary className="flex items-center justify-between gap-4 min-h-14 cursor-pointer list-none font-bold text-foreground">
                  {isEn ? f.question : f.arabicQuestion}
                  <span aria-hidden="true" className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-[#E5A93C]/15 text-[#B4552F] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-5 text-muted-foreground leading-relaxed max-w-[70ch]">{isEn ? f.answer : f.arabicAnswer}</p>
              </details>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link to="/faq" className="inline-flex items-center min-h-11 text-sm font-semibold text-foreground underline underline-offset-4">
              {isEn ? 'All questions and answers' : 'كل الأسئلة والإجابات'}
            </Link>
          </p>
        </div>
      </section>

      {/* ─── 9. CLOSING ─── the verse we are named after, then the first lesson. */}
      <section id="contact" className="public-container pb-16 lg:pb-24">
        <div className="band-espresso relative overflow-hidden rounded-[2rem] px-6 py-14 sm:px-12 lg:py-20 text-center">
          <svg aria-hidden="true" viewBox="0 0 800 200" className="absolute inset-x-0 bottom-0 w-full h-auto opacity-40" preserveAspectRatio="none">
            <path d="M0 170 C 160 90, 300 210, 420 130 S 660 40, 800 90" fill="none" stroke="#E5A93C" strokeWidth="2" />
          </svg>
          <p lang="ar" dir="rtl" className="relative text-[2rem] leading-[1.9] sm:text-5xl sm:leading-[1.7] text-[#F6D58E]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>
            {VERSE}
          </p>
          <p className="relative mt-2 text-sm text-[#FAF7F2]/60">
            {isEn ? '“And take provisions, but indeed, the best provision is fear of Allah.” Al-Baqarah 2:197, Saheeh International' : 'البقرة ١٩٧. ومنها اسمنا: نتزوّد بالعلم، وخير الزاد التقوى.'}
          </p>
          <button
            type="button"
            id="verse-sound-btn"
            onClick={() => (audio.playing ? audio.stop() : void audio.play())}
            aria-pressed={audio.playing}
            className="relative mt-4 inline-flex items-center gap-2 min-h-11 rounded-full px-4 text-sm font-semibold text-[#FAF7F2]/85 border border-[#FAF7F2]/25 hover:bg-[#FAF7F2]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6D58E]"
          >
            {audio.playing ? <VolumeX className="w-4 h-4 text-[#F0656A]" aria-hidden="true" /> : <Volume2 className="w-4 h-4 text-[#12A4BC]" aria-hidden="true" />}
            {audio.playing ? (isEn ? 'Stop the recitation' : 'إيقاف التلاوة') : (isEn ? 'Listen to the recitation' : 'استمع للتلاوة')}
          </button>
          <h2 className="relative mt-10 font-editorial text-3xl sm:text-5xl font-bold leading-tight text-[#FAF7F2]">
            {isEn ? 'Every journey starts with one lesson.' : 'كل رحلة تبدأ بحصة.'}
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
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#12A4BC]" />
              <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
