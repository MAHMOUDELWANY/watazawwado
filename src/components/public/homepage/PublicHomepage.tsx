import { TeacherStays } from './TeacherStays';
import { TrialCtaLabel } from "../TrialCtaLabel";
import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicButton } from '../PublicDesignSystem';
import { ArrowLeft, ArrowRight, Check, Volume2, VolumeX, ShieldCheck, Lock, EyeOff, Eye } from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { IntroFilm } from './IntroFilm';
import { JourneyNav, NextDoor, Reveal, MaskLine, StationHead, EXPO, num, type Station } from './journey/Journey';
import { LessonStory } from './journey/LessonStory';
import { OwnCurriculum } from './journey/OwnCurriculum';
import { Struggles } from './journey/Struggles';
import { HeroStage, Medal } from './journey/HeroStage';
import { ZadGuide, type GuideStop } from './journey/ZadGuide';
import { TeacherMatch } from './journey/TeacherMatch';
import { Bezel, Tilt } from './journey/Premium';
import { HeroSubjects } from './HeroSubjects';
import { FamilyVoices } from './FamilyVoices';
import { NewToIslamDoor } from '../NewToIslamDoor';
import { FAQS } from '../../../data/content';
import { SUBJECT_PAGES_PATH } from '../../../data/subjectPages';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';
import { useWelcomeAudio } from '../../../lib/welcomeAudio';

type L = { en: string; ar: string };

const VERSE = '﴿ وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَىٰ ﴾';
const MISSION_VERSE = '﴿ فَأَمَّا الزَّبَدُ فَيَذْهَبُ جُفَاءً ۖ وَأَمَّا مَا يَنفَعُ النَّاسَ فَيَمْكُثُ فِي الْأَرْضِ ﴾';
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

// What we teach (RULES.md §2b), four equal doors (owner, 2026-11-18: Arabic and English apart, no prices), each with the academy's own 3D medal and its subject pages.
type Track = { medal: string; chip?: string; tone: [string, string]; title: L; body: L; links: { slug: string; label: L }[] };
const TRACKS: Track[] = [
  {
    medal: 'surah', tone: ['#0B7486', '#04323A'],
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
    medal: 'zad-level', tone: ['#A3271F', '#3F0E10'],
    title: { en: 'The Zad Path', ar: 'منهج زاد' },
    body: { en: 'Our own curriculum: the essentials and the Seerah.', ar: 'منهجنا الخاص: الأساسيات والسيرة.' },
    links: [{ slug: 'islamic-classes-for-kids', label: { en: 'For kids', ar: 'للأطفال' } }],
  },
  {
    medal: 'language-level', chip: 'ع', tone: ['#8B4935', '#33190F'],
    title: { en: 'Arabic', ar: 'العربية' },
    body: { en: 'Fusha for the Quran and books, or Egyptian for everyday talk.', ar: 'الفصحى للقرآن والكتب، أو المصري للكلام اليومي.' },
    links: [
      { slug: 'learn-arabic-online', label: { en: 'Fusha', ar: 'الفصحى' } },
      { slug: 'learn-egyptian-arabic-online', label: { en: 'Egyptian', ar: 'المصري' } },
    ],
  },
  {
    medal: 'language-level', chip: 'Aa', tone: ['#0A5866', '#05262D'],
    title: { en: 'English', ar: 'الإنجليزية' },
    body: { en: 'Speaking with confidence, at school and at work.', ar: 'كلام بثقة، في المدرسة والشغل.' },
    links: [{ slug: 'online-english-classes', label: { en: 'English', ar: 'الإنجليزي' } }],
  },
];

// The offer: four promises, said once, next to three small steps.
const OFFER: L[] = [
  { en: 'First lesson free, no card', ar: 'أول حصة مجانًا، بدون بطاقة' },
  { en: 'The same teacher, every lesson', ar: 'نفس المعلّم، كل حصة' },
  { en: 'Not the right fit? We switch, free', ar: 'مش مرتاح؟ نغيّر المعلّم مجانًا' },
  { en: 'A note after every lesson', ar: 'تقرير بعد كل حصة' },
];

const STEPS: { title: L; body: L; medal: string }[] = [
  { medal: 'first-lesson', title: { en: 'Book 30 free minutes', ar: 'احجز ٣٠ دقيقة مجانًا' }, body: { en: 'Pick a time.', ar: 'اختار ميعاد.' } },
  { medal: 'teacher', title: { en: 'The teacher listens', ar: 'المعلّم يسمعك' }, body: { en: 'Finds your level and a plan.', ar: 'يحدد مستواك وخطتك.' } },
  { medal: 'quran-level', title: { en: 'Then decide', ar: 'وبعدين قرّر' }, body: { en: 'Continue only if it felt right.', ar: 'تكمّل بس لو ارتحت.' } },
];

const STATIONS: Station[] = [
  { id: 'st-familiar', label: { en: 'Sound familiar?', ar: 'مألوف؟' } },
  { id: 'st-provisions', label: { en: 'The provisions', ar: 'الزاد' } },
  { id: 'st-guide', label: { en: 'Your teacher', ar: 'معلّمك' } },
  { id: 'st-lesson', label: { en: 'The lesson, and after', ar: 'الحصة وبعدها' } },
  { id: 'st-stay', label: { en: 'The teacher stays', ar: 'المعلّم يبقى' } },
  { id: 'st-plan', label: { en: 'Start small', ar: 'ابدأ صغير' } },
];
const ARRIVAL = { id: 'arrival', label: { en: 'In their words', ar: 'بكلماتهم' } };

// Zad walks the page with the visitor: one pose and one short line per station (ZadGuide).
const GUIDE: GuideStop[] = [
  { pose: 'think', side: 'start', y: 30, say: { en: 'Sound familiar? You are not alone.', ar: 'مألوف؟ مش لوحدك.' } },
  { pose: 'point', side: 'end', y: 26, say: { en: 'Pick what goes in your bag.', ar: 'اختار زادك من هنا.' } },
  { pose: 'wave', side: 'start', y: 52, say: { en: 'You choose the teacher.', ar: 'المعلّم تختاره أنت.' } },
  { pose: 'excited', side: 'end', y: 58, say: { en: 'These are our real screens!', ar: 'دي شاشاتنا الحقيقية!' } },
  { pose: 'proud', side: 'start', y: 40, hide: true, say: { en: 'And the same teacher stays.', ar: 'ونفس المعلّم يكمّل معاك.' } },
  { pose: 'cheer', side: 'end', y: 50, say: { en: 'The first lesson is on us! Tap me to ask.', ar: 'أول حصة علينا! اضغط عليّا واسأل.' } },
];

/** The first questions as an accordion: one open at a time, with a smooth height animation. */
function FaqAccordion({ isEn }: { isEn: boolean }) {
  const [open, setOpen] = React.useState<number | null>(0);
  const reduce = useReducedMotion();
  return (
    <div className="mt-10 space-y-3">
      {FAQS.slice(0, 4).map((f, k) => {
        const on = open === k;
        return (
          <Reveal key={f.question} delay={k * 0.05} y={14}>
            <div className={`rounded-2xl border bg-card px-5 transition-[box-shadow,border-color] duration-300 ${on ? 'border-[#E5A93C]/50 shadow-[0_14px_30px_-24px_rgba(28,20,17,0.5)]' : 'border-border'}`}>
              <h3>
                <button type="button" aria-expanded={on} aria-controls={`faq-${k}`} onClick={() => setOpen(on ? null : k)} className="flex w-full items-center justify-between gap-4 min-h-14 text-start font-bold text-foreground rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]">
                  {isEn ? f.question : f.arabicQuestion}
                  <motion.span aria-hidden="true" animate={{ rotate: on ? 45 : 0 }} transition={{ type: 'spring', stiffness: 400, damping: 24 }} className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-[#E5A93C]/15 text-[#B4552F] text-xl leading-none">+</motion.span>
                </button>
              </h3>
              <AnimatePresence initial={false}>
                {on && (
                  <motion.div id={`faq-${k}`} key="a" initial={reduce ? false : { height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.35, ease: EXPO }} className="overflow-hidden">
                    <p className="pb-5 text-muted-foreground leading-relaxed max-w-[70ch]">{isEn ? f.answer : f.arabicAnswer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        );
      })}
    </div>
  );
}

/** Slow light drifting inside dark bands, so the background is never frozen. */
function DriftLight() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <motion.div
      aria-hidden="true"
      className="absolute -inset-1/4 pointer-events-none"
      style={{ background: 'radial-gradient(30rem 22rem at 30% 30%, rgba(229,169,60,0.22), transparent 60%), radial-gradient(26rem 20rem at 75% 70%, rgba(197,31,36,0.18), transparent 60%)' }}
      animate={{ x: ['0%', '6%', '-4%', '0%'], y: ['0%', '-5%', '4%', '0%'] }}
      transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  const audio = useWelcomeAudio();
  const reduce = useReducedMotion();
  useVerseFont();
  const total = STATIONS.length;
  const trial = () => onOpenTrialModal();

  return (
    <main id="main-content" className="pt-16 sm:pt-20">
      {/* Welcome recitation: first visit of a session (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />
      <JourneyNav stations={STATIONS} isEn={isEn} />
      <ZadGuide
        stations={STATIONS}
        stops={GUIDE}
        isEn={isEn}
        dockId="zad-dock"
        intro={{
          targetId: 'intro-film',
          stop: { pose: 'point', side: 'end', y: 55, say: { en: 'Sound on, then press play!', ar: 'علّي الصوت، واضغط تشغيل!' } },
          onTap: () => document.getElementById('intro-film-play')?.click(),
        }}
      />

      {/* ─── HERO ─── editorial split: the brand line and one action beside Zad's stage; the film below in a bezel. */}
      <section className="khatam-field brand-lights relative overflow-hidden">
        <div className="public-container pt-8 pb-16 lg:pt-14 lg:pb-24">
          <div className="grid items-center gap-6 lg:gap-10 lg:grid-cols-[1.1fr_1fr]">
            <div className="text-center lg:text-start animate-fade-in-up">
              {/* MK-04: no kicker above the brand line. Phones: the line is written around Zad (HeroStage ringText), the h1 stays for readers. */}
              <h1 className={`max-lg:sr-only font-editorial text-[2.7rem] leading-[1.08] sm:text-6xl lg:text-[5.2rem] text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}>
                {isEn ? (
                  <>Provision that lasts,<br /><span className="text-ribbon">for you and your family.</span></>
                ) : (
                  <>زادٌ يبقى،<br /><span className="text-ribbon whitespace-nowrap">لك ولأهل بيتك.</span></>
                )}
              </h1>
              {/* The thread of the journey starts here and draws itself once. */}
              <svg aria-hidden="true" viewBox="0 0 300 20" className="max-lg:hidden mx-auto lg:mx-0 mt-4 w-48 sm:w-72 h-4 overflow-visible">
                <motion.path d="M2 12 C 70 2, 120 20, 170 10 S 260 4, 298 12" fill="none" stroke="#E5A93C" strokeWidth="2.5" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EXPO, delay: 0.3 }} />
              </svg>
              <HeroSubjects isEn={isEn} className="mt-2 lg:mt-6 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0" />

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start items-stretch sm:items-center">
                <PublicButton
                  variant="primary"
                  size="lg"
                  id="hero-get-started-btn"
                  data-tour="header-get-started-cta"
                  onClick={trial}
                  className="group liquid-cta w-full sm:w-auto !rounded-full px-8 shadow-[0_18px_40px_-14px_rgba(197,31,36,0.6)] active:scale-[0.98] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
                >
                  <TrialCtaLabel isEn={isEn} />
                </PublicButton>
                <a href="#st-familiar" className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 min-h-12 font-bold text-foreground ring-1 ring-border bg-background/60 hover:ring-[#E5A93C] transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]">
                  {isEn ? 'Start the journey' : 'ابدأ الرحلة'}
                </a>
              </div>
              <ul className="mt-6 flex flex-wrap justify-center lg:justify-start items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
                {[
                  { en: '30 minutes, free', ar: '٣٠ دقيقة مجاناً' },
                  { en: 'No card needed', ar: 'بدون بطاقة بنكية' },
                  { en: 'Choose a male or female teacher', ar: 'تختار معلّم أو معلّمة' },
                ].map((point) => (
                  <li key={point.en} className="flex items-center gap-1.5 font-medium">
                    <Check className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC] shrink-0" strokeWidth={1.75} aria-hidden="true" />
                    <span>{t(point)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="order-first lg:order-none -mt-2 lg:mt-0">
              <HeroStage isEn={isEn} ringText />
            </div>
          </div>

          <Reveal className="mt-14 lg:mt-20 max-w-5xl mx-auto" y={60}>
            <div id="intro-film" className="scroll-mt-28" />
            <Bezel radius="2.6rem" core="overflow-hidden">
              <IntroFilm isEn={isEn} />
            </Bezel>
          </Reveal>
          <NextDoor to="st-familiar" label={STATIONS[0].label} isEn={isEn} />
        </div>
      </section>

      {/* ─── 01 SOUND FAMILIAR? ─── recognition first: four moments, each turned by what we do. */}
      <section id="st-familiar" className="public-container pt-20 lg:pt-28" aria-labelledby="st-familiar-h">
        <StationHead
          id="st-familiar-h" n={1} total={total} label={STATIONS[0].label} isEn={isEn}
          title={isEn ? 'If this sounds familiar, ' : 'لو ده مألوف، '}
          ribbon={isEn ? 'you are not alone.' : 'انت مش لوحدك.'}
        />
        <div className="mt-12"><Struggles isEn={isEn} /></div>
        {/* MK-04: one line for young adults who drifted away. */}
        <p className="mt-10 text-center font-editorial text-lg sm:text-xl text-foreground">
          {isEn ? 'Drifted? Start where you are. No lectures.' : 'بعدت شوية؟ ابدأ من مكانك. من غير محاضرات.'}
        </p>
        <NextDoor to="st-provisions" label={STATIONS[1].label} isEn={isEn} />
      </section>

      {/* ─── 02 THE PROVISIONS ─── three doors, each with its medal, opening the subject pages. */}
      <section id="st-provisions" className="public-container py-20 lg:py-28" aria-labelledby="st-provisions-h">
        <StationHead
          id="st-provisions-h" n={2} total={total} label={STATIONS[1].label} isEn={isEn}
          title={isEn ? 'What goes ' : 'إيه اللي '}
          ribbon={isEn ? 'in the bag.' : 'في الشنطة.'}
          sub={isEn ? '8 subjects, your own teacher.' : '٨ مواد، ومعلم لك أنت.'}
        />
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {TRACKS.map((tr, k) => (
            <Reveal as="li" key={tr.title.en} delay={k * 0.08} className="list-none">
              <Tilt className="h-full" max={5}>
                <Bezel radius="2rem" className="h-full" core="group flex h-full flex-col overflow-hidden">
                  <div className="relative grid place-items-center overflow-hidden h-52" style={{ background: `radial-gradient(70% 80% at 50% 35%, ${tr.tone[0]}, ${tr.tone[1]})` }}>
                    <span aria-hidden="true" className="absolute inset-0 m-auto w-36 h-36 rounded-full bg-[#F6D58E]/25 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                    <span aria-hidden="true" className="relative block transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-110 group-hover:-rotate-6">
                      <Medal id={tr.medal} className="w-36 h-36" />
                      {tr.chip && <span lang={tr.chip === 'ع' ? 'ar' : 'en'} className="absolute -bottom-1 -end-1 grid place-items-center w-11 h-11 rounded-full bg-[linear-gradient(145deg,#FFF1C9,#E5A93C_55%,#B4552F)] text-[#3F0E10] font-editorial font-bold text-lg shadow-[0_8px_18px_-6px_rgba(0,0,0,0.6)] ring-2 ring-[#1C1411]/40">{tr.chip}</span>}
                    </span>
                    {/* Light sweep across the window on hover. */}
                    <span aria-hidden="true" className="absolute inset-y-0 -start-1/2 w-1/3 bg-gradient-to-r from-transparent via-[#FFF1C9]/25 to-transparent skew-x-[-18deg] transition-transform duration-[1200ms] ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-[400%] rtl:group-hover:-translate-x-[400%]" />
                  </div>
                  <div className="flex flex-1 flex-col p-5 sm:p-6">
                    <h3 className="font-editorial font-bold text-2xl text-foreground">{t(tr.title)}</h3>
                    <p className="mt-2 text-muted-foreground leading-relaxed">{t(tr.body)}</p>
                    <ul className="mt-auto pt-4 flex flex-wrap gap-2">
                      {tr.links.map((l) => (
                        <li key={l.slug}>
                          <Link to={`${SUBJECT_PAGES_PATH}/${l.slug}`} className="inline-flex items-center gap-1 min-h-11 rounded-full border border-border px-3.5 text-sm font-semibold text-foreground hover:border-[#087D91]/60 hover:text-[#087D91] transition-colors">
                            {t(l.label)}<Arrow className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </Bezel>
              </Tilt>
            </Reveal>
          ))}
        </ul>
        <OwnCurriculum isEn={isEn} />
        <div className="max-w-6xl mx-auto">
          <NewToIslamDoor isEn={isEn} />
        </div>
        <NextDoor to="st-guide" label={STATIONS[2].label} isEn={isEn} />
      </section>

      {/* ─── 03 YOUR TEACHER ─── no profiles here (they grow with the team): what you choose, and the safety facts. */}
      <section id="st-guide" className="public-container pb-20 lg:pb-28" aria-labelledby="st-guide-h">
        <StationHead
          id="st-guide-h" n={3} total={total} label={STATIONS[2].label} isEn={isEn}
          title={isEn ? 'A teacher ' : 'معلّم '}
          ribbon={isEn ? 'you choose.' : 'تختاره أنت.'}
        />
        <Reveal className="mt-12 max-w-5xl mx-auto">
          <Bezel radius="2.5rem" core="relative overflow-hidden p-6 sm:p-10 bg-[radial-gradient(40rem_22rem_at_85%_0%,rgba(229,169,60,0.22),transparent_60%),radial-gradient(30rem_20rem_at_0%_100%,rgba(197,31,36,0.08),transparent_60%),linear-gradient(160deg,#FBF6EC,#F3E7D2)] dark:bg-none dark:bg-[#1C1411]">
            <TeacherMatch isEn={isEn} onTrial={trial} />
          </Bezel>
        </Reveal>
        <ul className="mt-5 max-w-5xl mx-auto grid gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, en: 'Only the teacher opens the room', ar: 'المعلّم بس هو اللي يفتح الغرفة' },
            { icon: EyeOff, en: 'Nothing is recorded', ar: 'مفيش تسجيل للحصص' },
            { icon: Eye, en: 'Parents can sit in on any lesson', ar: 'الأهل يقدروا يحضروا أي حصة' },
          ].map((f, k) => (
            <Reveal as="li" key={f.en} delay={0.1 + k * 0.08} className="h-full flex items-center gap-3 rounded-2xl ring-1 ring-[#087D91]/15 bg-[#087D91]/[0.05] p-4">
              <span className="grid place-items-center w-10 h-10 shrink-0 rounded-xl bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC]"><f.icon className="w-5 h-5" strokeWidth={1.75} aria-hidden="true" /></span>
              <span className="font-bold text-sm text-foreground">{t(f)}</span>
            </Reveal>
          ))}
        </ul>
        <p className="mt-3 text-center">
          <Link to="/safety" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-foreground underline underline-offset-4 decoration-[#087D91]/50 hover:decoration-[#087D91]">
            <ShieldCheck className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC]" aria-hidden="true" />{isEn ? 'How we keep learners safe' : 'إزاي بنحافظ على الطلاب'}
          </Link>
        </p>
        <NextDoor to="st-lesson" label={STATIONS[3].label} isEn={isEn} />
      </section>

      {/* ─── 04 THE LESSON, AND AFTER ─── the real portal, screen by screen, and the badges. */}
      <section id="st-lesson" className="relative bg-surface-warm/60 border-y border-border/70" aria-labelledby="st-lesson-h">
        <div className="public-container pt-20 lg:pt-28">
          <StationHead
            id="st-lesson-h" n={4} total={total} label={STATIONS[3].label} isEn={isEn}
            title={isEn ? 'After the lesson, ' : 'بعد الحصة، '}
            ribbon={isEn ? 'open your phone.' : 'افتح موبايلك.'}
          />
        </div>
        <div className="public-container"><LessonStory isEn={isEn} /></div>
        <div className="public-container pb-20 text-center">
          <Link to="/badges" className="inline-flex items-center gap-1.5 min-h-11 rounded-full px-5 font-semibold text-foreground ring-1 ring-border bg-background hover:ring-[#E5A93C] transition-[box-shadow] duration-500">
            {isEn ? 'See all the badges' : 'شوف كل الأوسمة'}<Arrow className="w-4 h-4" aria-hidden="true" />
          </Link>
          <NextDoor to="st-stay" label={STATIONS[4].label} isEn={isEn} />
        </div>
      </section>

      {/* ─── 05 THE TEACHER STAYS ─── the flying carpet (owner's idea, 2026-11-05). */}
      <div id="st-stay">
        <TeacherStays isEn={isEn} />
      </div>

      {/* ─── 06 START SMALL ─── the plan (StoryBrand): three small steps and what you risk (nothing), right before the ask.
          Light, so it never looks like the dark closing band. */}
      <section id="st-plan" className="public-container py-20 lg:py-28" aria-labelledby="st-plan-h">
        <div className="relative overflow-hidden rounded-[2.5rem] px-6 py-14 sm:px-12 lg:px-16 lg:py-20 max-w-6xl mx-auto bg-surface-warm/70 ring-1 ring-border">
          <div className="relative">
            <StationHead
              id="st-plan-h" n={6} total={total} label={STATIONS[5].label} isEn={isEn}
              title={isEn ? 'Nothing to lose. ' : 'مفيش حاجة تخسرها. '}
              ribbon={isEn ? 'Start small.' : 'ابدأ صغير.'}
            />
            <ol className="relative mt-14 grid gap-10 md:grid-cols-3 md:gap-6">
              {/* The gold line the steps sit on draws itself in. */}
              <span aria-hidden="true" className="hidden md:block absolute top-[4.5rem] inset-x-[16%] h-px bg-[#E5A93C]/20" />
              <motion.span aria-hidden="true" className="hidden md:block absolute top-[4.5rem] inset-x-[16%] h-px bg-[#E5A93C] origin-[0%] rtl:origin-[100%]" initial={reduce ? false : { scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.6, ease: EXPO, delay: 0.3 }} />
              {STEPS.map((s, i) => (
                <Reveal as="li" key={s.title.en} delay={0.2 + i * 0.18} className="relative flex flex-col items-center text-center">
                  <span className="relative">
                    <Medal id={s.medal} className="w-36 h-36" />
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 grid place-items-center w-9 h-9 rounded-full bg-[#C51F24] text-[#FAF7F2] font-editorial font-bold ring-4 ring-background tabular-nums">{num(i + 1, isEn).replace(/^[0٠]/, '')}</span>
                  </span>
                  <h3 className="mt-5 font-editorial font-bold text-2xl text-foreground">{t(s.title)}</h3>
                  <p className="mt-1 text-muted-foreground">{t(s.body)}</p>
                </Reveal>
              ))}
            </ol>
            <ul className="mt-12 flex flex-wrap justify-center gap-2.5">
              {OFFER.map((o, k) => (
                <Reveal as="li" key={o.en} delay={0.6 + k * 0.06} y={10} className="inline-flex items-center gap-2 rounded-full bg-background ring-1 ring-border px-4 py-2 text-sm font-semibold text-foreground">
                  <Check className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC]" aria-hidden="true" />{t(o)}
                </Reveal>
              ))}
            </ul>
            <div className="mt-10 flex justify-center">
              <PublicButton variant="primary" size="lg" onClick={trial} className="group liquid-cta w-full sm:w-auto !rounded-full px-8 shadow-[0_18px_40px_-14px_rgba(197,31,36,0.7)] active:scale-[0.98] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                <TrialCtaLabel isEn={isEn} />
              </PublicButton>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ARRIVAL ─── families, questions, the verse and the first lesson. */}
      <div id={ARRIVAL.id}>
        <FamilyVoices isEn={isEn} />
      </div>

      <section className="public-container pt-8 pb-16 lg:pb-20" aria-labelledby="home-faq">
        <div className="max-w-3xl mx-auto">
          <SectionHead id="home-faq" eyebrow={isEn ? 'Good to know' : 'قبل أن تبدأ'} before={isEn ? 'Questions families ' : 'أول ما '} ribbon={isEn ? 'ask first' : 'تسأل عنه الأسر'} />
          <FaqAccordion isEn={isEn} />
          <p className="mt-4 text-center">
            <Link to="/faq" className="inline-flex items-center min-h-11 text-sm font-semibold text-foreground underline underline-offset-4">
              {isEn ? 'All questions and answers' : 'كل الأسئلة والإجابات'}
            </Link>
          </p>
        </div>
      </section>

      {/* ─── OUR VISION ─── what we measure our work by (owner, 2026-11-19: bring this verse back). */}
      <section id="vision" className="public-container pb-16 lg:pb-24" aria-labelledby="vision-h">
        <Reveal className="relative max-w-4xl mx-auto text-center">
          <h2 id="vision-h" className="font-editorial text-base sm:text-lg text-[#B4552F] dark:text-[#E5A93C]">{isEn ? 'Our vision' : 'رؤيتنا'}</h2>
          <p lang="ar" dir="rtl" className="mt-4 text-[2.1rem] leading-[1.9] sm:text-5xl sm:leading-[1.8] text-ribbon mx-auto" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>
            {MISSION_VERSE}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {isEn ? '“As for the foam, it vanishes, cast off; but as for that which benefits the people, it remains on the earth.” Ar-Ra‘d 13:17, Saheeh International' : 'الرعد ١٧'}
          </p>
          <p className="mt-6 font-editorial text-xl sm:text-2xl text-foreground max-w-2xl mx-auto leading-relaxed">
            {isEn
              ? 'We don’t count lessons. We count what stays: a verse kept by heart, a word said right, a good habit that lives on at home.'
              : 'لا نعدّ الحصص، بل نعدّ ما يبقى: آيةٌ تُحفظ، وكلمةٌ تُقال صحيحة، وعادةٌ طيبة تبقى في البيت.'}
          </p>
        </Reveal>
      </section>

      {/* ─── CLOSING ─── the verse we are named after, the three reminders, the first lesson. */}
      <section id="contact" className="public-container pb-16 lg:pb-24">
        <div className="relative overflow-hidden rounded-[2.25rem] px-6 py-14 sm:px-12 lg:py-20 text-center ring-1 ring-[#E5A93C]/25 bg-[radial-gradient(50rem_26rem_at_80%_0%,rgba(229,169,60,0.2),transparent_60%),radial-gradient(36rem_22rem_at_0%_100%,rgba(197,31,36,0.08),transparent_60%),linear-gradient(160deg,#FBF6EC,#F3E7D2)] dark:bg-none dark:bg-card">
          <DriftLight />
                    {/* Zad lands here at the end of his tour (ZadGuide dockId): one Zad on the page, not a second, static one. */}
          <div id="zad-dock" className="relative mx-auto w-[130px] h-[130px] sm:w-[150px] sm:h-[150px]" />
          {/* The verse we are named after, as the centrepiece: in the site ribbon (crimson to gold to teal), as it was first (owner, 2026-11-19). */}
          <div aria-hidden="true" className="relative mt-4 flex items-center justify-center gap-4">
            <span className="h-px w-16 sm:w-24 bg-gradient-to-l from-[#E5A93C] to-transparent" />
            <span className="text-[#E5A93C] text-xl">۞</span>
            <span className="h-px w-16 sm:w-24 bg-gradient-to-r from-[#E5A93C] to-transparent" />
          </div>
          <p lang="ar" dir="rtl" className="relative mt-3 text-[2.2rem] leading-[1.9] sm:text-6xl sm:leading-[1.6] text-ribbon mx-auto max-w-4xl" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>
            {VERSE}
          </p>
          <p className="relative mt-2 text-sm text-muted-foreground">
            {isEn ? '“And take provisions, but indeed, the best provision is fear of Allah.” Al-Baqarah 2:197, Saheeh International' : 'البقرة ١٩٧. ومنها اسمنا: نتزوّد بالعلم، وخير الزاد التقوى.'}
          </p>
          <button
            type="button"
            id="verse-sound-btn"
            onClick={() => (audio.playing ? audio.stop() : void audio.play())}
            aria-pressed={audio.playing}
            className="relative mt-4 inline-flex items-center gap-2 min-h-11 rounded-full px-4 text-sm font-semibold text-foreground border border-[#087D91]/40 bg-white/60 dark:bg-transparent hover:bg-[#087D91]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F6D58E]"
          >
            {audio.playing ? <VolumeX className="w-4 h-4 text-[#C51F24]" aria-hidden="true" /> : <Volume2 className="w-4 h-4 text-[#087D91]" aria-hidden="true" />}
            {audio.playing ? (isEn ? 'Stop the recitation' : 'إيقاف التلاوة') : (isEn ? 'Listen to the recitation' : 'استمع للتلاوة')}
          </button>
          <h2 className="relative mt-10 font-editorial text-3xl sm:text-5xl font-bold leading-tight text-foreground">
            <MaskLine>{isEn ? 'Every journey starts with one lesson.' : 'كل رحلة تبدأ بحصة.'}</MaskLine>
          </h2>
          <p className="relative mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-muted-foreground">
            {isEn
              ? 'The first one is free: thirty minutes to meet, listen, and find your way.'
              : 'والأولى مجاناً: ٣٠ دقيقة نتعرّف فيها، ونسمعك، ونلاقي طريقك.'}
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <PublicButton variant="primary" size="lg" onClick={trial} className="liquid-cta w-full sm:w-auto">
              <TrialCtaLabel isEn={isEn} />
            </PublicButton>
            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold border border-border bg-white/70 dark:bg-transparent text-foreground hover:bg-[#087D91]/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#087D91]"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#087D91]" />
              <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
