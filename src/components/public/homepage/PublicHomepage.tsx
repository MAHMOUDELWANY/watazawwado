import { TeacherStays } from './TeacherStays';
import { TrialCtaLabel } from "../TrialCtaLabel";
import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { useOutletContext } from 'react-router-dom';
import { Link } from '../LangLink';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicButton } from '../PublicDesignSystem';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { IntroFilm, GRAIN } from './IntroFilm';
import { JourneyNav, NextDoor, Reveal, MaskLine, StationHead, EXPO, num, type Station } from './journey/Journey';
import { LessonStory } from './journey/LessonStory';
import { Struggles } from './journey/Struggles';
import { ZadRigSvg } from '../../zad/ZadRig';
import { ParentQuestions } from './ParentQuestions';
import { HeroSubjects } from './HeroSubjects';
import { MushafEmblem, PathEmblem } from '../emblems/DoorEmblems';
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

// The offer, said once and plainly next to the button (risk reversal): everything a family gets.
const OFFER: L[] = [
  { en: 'A free first lesson, 30 minutes, no card', ar: 'أول حصة مجانية، ٣٠ دقيقة، بدون بطاقة' },
  { en: 'The same teacher, lesson after lesson', ar: 'نفس المعلّم، حصة بعد حصة' },
  { en: 'Not the right fit? We switch the teacher, free', ar: 'المعلّم مش مناسب؟ نغيّره مجانًا' },
  { en: 'A note after every lesson, before you ask', ar: 'تقرير بعد كل حصة، قبل ما تسأل' },
  { en: 'A male or female teacher, your choice', ar: 'معلّم أو معلّمة، انت تختار' },
  { en: 'Sit in on any lesson; nothing is recorded', ar: 'تحضر أي حصة، ومفيش تسجيل' },
];

const STEPS: { title: L; body: L }[] = [
  { title: { en: 'Book 30 free minutes', ar: 'احجز ٣٠ دقيقة مجانًا' }, body: { en: 'Pick a time. No card.', ar: 'اختار ميعاد. من غير بطاقة.' } },
  { title: { en: 'The teacher listens', ar: 'المعلّم يسمع' }, body: { en: 'Finds the level and sets a plan with you.', ar: 'يحدد المستوى ويحط معاك خطة.' } },
  { title: { en: 'Then decide', ar: 'وبعدين قرّر' }, body: { en: 'Continue only if it felt right.', ar: 'تكمّل بس لو ارتحت.' } },
];

// Proof over promise: the real teachers, with only checkable facts (AboutPage.tsx is the source of these lines).
const TEACHERS: { src: string; name: L; fact: L }[] = [
  { src: '/ustadh-mahmoud.jpg', name: { en: 'Ustadh Mahmoud', ar: 'الأستاذ محمود' }, fact: { en: "Ijazah in the Quran (Hafs 'an 'Asim). Quran, Tajweed, Arabic, the Zad Path.", ar: 'إجازة في القرآن برواية حفص عن عاصم. قرآن وتجويد وعربية ومنهج زاد.' } },
  { src: '/ustadha-afnan.jpg', name: { en: 'Ustadha Afnan', ar: 'الأستاذة أفنان' }, fact: { en: 'Quran, Tajweed, Arabic, the Zad Path and English. For families who prefer a female teacher.', ar: 'قرآن وتجويد وعربية ومنهج زاد وإنجليزي. للأسر اللي تفضّل معلّمة.' } },
];

const STATIONS: Station[] = [
  { id: 'st-child', label: { en: 'Your child', ar: 'طفلك' } },
  { id: 'st-guide', label: { en: 'Who walks with you', ar: 'مين معاكم' } },
  { id: 'st-lesson', label: { en: 'The lesson, and after', ar: 'الحصة وبعدها' } },
  { id: 'st-plan', label: { en: 'The plan', ar: 'الخطة' } },
  { id: 'st-provisions', label: { en: 'The provisions', ar: 'الزاد' } },
  { id: 'st-stay', label: { en: 'The teacher stays', ar: 'المعلّم يبقى' } },
];
const ARRIVAL = { id: 'arrival', label: { en: 'Families and questions', ar: 'الأهالي والأسئلة' } };

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

      {/* ─── HERO ─── the brand line, one action, then the film (hook in the first second). */}
      <section className="khatam-field brand-lights relative overflow-hidden">
        <div className="public-container pt-10 pb-16 lg:pt-16 lg:pb-20">
          <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
            <h1 className={`font-editorial text-[2.6rem] leading-[1.12] sm:text-6xl lg:text-7xl text-foreground ${isEn ? 'font-medium tracking-tight' : 'font-bold'}`}>
              {/* MK-04: no kicker above the brand line; the subjects live in <title>, the meta description and the line below. */}
              {isEn ? (
                <>Provision that lasts,<br /><span className="text-ribbon">for you and your family.</span></>
              ) : (
                <>زادٌ يبقى،<br /><span className="text-ribbon whitespace-nowrap">لك ولأهل بيتك.</span></>
              )}
            </h1>
            {/* The thread of the journey starts here and draws itself once. */}
            <svg aria-hidden="true" viewBox="0 0 300 20" className="mx-auto mt-3 w-48 sm:w-64 h-4 overflow-visible">
              <motion.path d="M2 12 C 70 2, 120 20, 170 10 S 260 4, 298 12" fill="none" stroke="#E5A93C" strokeWidth="2.5" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EXPO, delay: 0.3 }} />
            </svg>
            <p className="mt-5 font-editorial text-xl sm:text-2xl leading-snug text-foreground max-w-2xl mx-auto">
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
                onClick={trial}
                className="liquid-cta w-full sm:w-auto shadow-lg shadow-primary/25"
              >
                <TrialCtaLabel isEn={isEn} />
              </PublicButton>
              <a href="#st-child" className="btn-glass px-6 py-3 rounded-xl">
                {isEn ? 'Start the journey' : 'ابدأ الرحلة'}
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

          <Reveal className="mt-12 lg:mt-16" y={60}>
            <IntroFilm isEn={isEn} onTrial={trial} />
          </Reveal>
          <NextDoor to="st-child" label={STATIONS[0].label} isEn={isEn} />
        </div>
      </section>

      {/* ─── 01 YOUR CHILD ─── recognition, then the parent names the goal (self-persuasion). */}
      <section id="st-child" className="public-container pt-20 lg:pt-28" aria-labelledby="st-child-h">
        <StationHead
          id="st-child-h" n={1} total={total} label={STATIONS[0].label} isEn={isEn}
          title={isEn ? 'If this sounds like home, ' : 'لو ده بيتكم، '}
          ribbon={isEn ? 'you are not alone.' : 'انت مش لوحدك.'}
          sub={isEn ? 'What parents in the West tell us, in their words.' : 'اللي بيحكيه لنا الأهالي في الغرب، بكلامهم.'}
        />
        <div className="mt-12"><Struggles isEn={isEn} /></div>
      </section>
      <div className="mt-16">
        <ParentQuestions isEn={isEn} onTrial={trial} />
      </div>
      <div className="public-container"><NextDoor to="st-guide" label={STATIONS[1].label} isEn={isEn} /></div>

      {/* ─── 02 WHO WALKS WITH YOU ─── the guide: real teachers, checkable facts, the safety facts. */}
      <section id="st-guide" className="public-container py-20 lg:py-28" aria-labelledby="st-guide-h">
        <StationHead
          id="st-guide-h" n={2} total={total} label={STATIONS[1].label} isEn={isEn}
          title={isEn ? 'A teacher who ' : 'معلّم '}
          ribbon={isEn ? 'knows your child by name.' : 'يعرف طفلك باسمه.'}
          sub={isEn ? 'You pick from real profiles. They stay, lesson after lesson.' : 'بتختار من ملفات حقيقية. ويفضل معاكم، حصة بعد حصة.'}
        />
        <div className="mt-12 max-w-5xl mx-auto grid gap-5 sm:grid-cols-2">
          {TEACHERS.map((tc, k) => (
            <Reveal key={tc.src} delay={k * 0.08}>
              <div className="group h-full flex items-center gap-5 rounded-[1.75rem] border border-border bg-card p-4 sm:p-5 shadow-[0_18px_40px_-30px_rgba(28,20,17,0.45)] transition-transform duration-500 hover:-translate-y-1">
                <span className="relative shrink-0">
                  <span aria-hidden="true" className="absolute -inset-1.5 rounded-t-full rounded-b-3xl bg-[conic-gradient(from_180deg,#C51F24,#E5A93C,#087D91,#C51F24)] opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-100" />
                  <img src={tc.src} alt={t(tc.name)} loading="lazy" decoding="async" className="relative w-24 h-28 sm:w-28 sm:h-32 rounded-t-full rounded-b-2xl object-cover" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-editorial font-bold text-xl text-foreground">{t(tc.name)}<BadgeCheck className="w-4 h-4 text-[#087D91] dark:text-[#12A4BC]" aria-hidden="true" /></p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{t(tc.fact)}</p>
                  <Link to="/about" className="mt-2 inline-flex items-center gap-1 min-h-11 text-sm font-semibold text-primary">{isEn ? 'Full profile' : 'الملف كامل'}<Arrow className="w-3.5 h-3.5" aria-hidden="true" /></Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
        <ul className="mt-6 max-w-5xl mx-auto grid gap-3 sm:grid-cols-3">
          {[
            { en: 'The teacher opens the room; no one else can join', ar: 'المعلّم هو اللي يفتح الغرفة، ومحدش غيره يدخل' },
            { en: 'Nothing is recorded', ar: 'مفيش تسجيل للحصص' },
            { en: 'You can sit in on any lesson', ar: 'تقدر تحضر أي حصة' },
          ].map((f, k) => (
            <Reveal as="li" key={f.en} delay={0.1 + k * 0.07} className="h-full flex items-start gap-2.5 rounded-2xl border border-border bg-surface-warm/60 p-4 text-sm font-semibold text-foreground">
                <ShieldCheck className="w-5 h-5 shrink-0 text-[#087D91] dark:text-[#12A4BC]" aria-hidden="true" />{t(f)}
              </Reveal>
          ))}
        </ul>
        <p className="mt-4 text-center">
          <Link to="/safety" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-foreground underline underline-offset-4 decoration-[#087D91]/50 hover:decoration-[#087D91]">
            {isEn ? 'How we keep children safe' : 'كيف نحافظ على الأطفال'}
          </Link>
        </p>
        <NextDoor to="st-lesson" label={STATIONS[2].label} isEn={isEn} />
      </section>

      {/* ─── 03 THE LESSON, AND AFTER ─── success shown: the pinned phone story. */}
      <section id="st-lesson" className="relative bg-surface-warm/60 border-y border-border/70" aria-labelledby="st-lesson-h">
        <div className="public-container pt-20 lg:pt-28">
          <StationHead
            id="st-lesson-h" n={3} total={total} label={STATIONS[2].label} isEn={isEn}
            title={isEn ? 'What lands ' : 'اللي هيوصل '}
            ribbon={isEn ? 'on your phone.' : 'موبايلك.'}
            sub={isEn ? 'Scroll: one week with us, screen by screen.' : 'انزل لتحت: أسبوع معانا، شاشة بشاشة.'}
          />
        </div>
        <div className="public-container"><LessonStory isEn={isEn} /></div>
        <div className="public-container pb-20"><NextDoor to="st-plan" label={STATIONS[3].label} isEn={isEn} /></div>
      </section>

      {/* ─── 04 THE PLAN ─── everything a family gets, said once, next to three tiny steps. */}
      <section id="st-plan" className="public-container py-20 lg:py-28" aria-labelledby="st-plan-h">
        <div className="band-espresso relative overflow-hidden rounded-[2.25rem] px-6 py-14 sm:px-12 lg:px-16 lg:py-20 max-w-6xl mx-auto">
          <DriftLight />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
          <div className="relative">
            <StationHead
              id="st-plan-h" n={4} total={total} label={STATIONS[3].label} isEn={isEn} dark
              title={isEn ? 'Nothing to lose. ' : 'مفيش حاجة تخسرها. '}
              ribbon={isEn ? 'Start small.' : 'ابدأ صغير.'}
            />
            <div className="mt-12 grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start">
              <ul className="grid gap-3">
                {OFFER.map((o, k) => (
                  <Reveal as="li" key={o.en} delay={k * 0.06} y={18} className="flex items-start gap-3 text-[#FAF7F2] text-base sm:text-lg">
                      <span className="mt-0.5 grid place-items-center w-7 h-7 shrink-0 rounded-full bg-[#087D91] text-[#FAF7F2] shadow-[0_0_0_5px_rgba(8,125,145,0.2)]"><Check className="w-4 h-4" aria-hidden="true" /></span>
                      {t(o)}
                    </Reveal>
                ))}
              </ul>
              <Reveal delay={0.15}>
                <div className="rounded-[1.5rem] border border-[#F6D58E]/20 bg-[#FAF7F2]/[0.05] p-6 sm:p-8 backdrop-blur-sm">
                  <ol className="relative space-y-7 ps-14">
                    <span aria-hidden="true" className="absolute top-4 bottom-4 start-[1.2rem] w-px bg-[#E5A93C]/20" />
                    <motion.span aria-hidden="true" className="absolute top-4 bottom-4 start-[1.2rem] w-px bg-[#E5A93C] origin-top" initial={reduce ? false : { scaleY: 0 }} whileInView={{ scaleY: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 1.4, ease: EXPO }} />
                    {STEPS.map((s, i) => (
                      <li key={s.title.en} className="relative">
                        <span aria-hidden="true" className="absolute -start-14 top-0 grid place-items-center w-10 h-10 rounded-full bg-[#E5A93C] text-[#1C1411] font-bold tabular-nums shadow-[0_0_0_6px_rgba(229,169,60,0.18)]">{num(i + 1, isEn).replace(/^[0٠]/, '')}</span>
                        <h3 className="font-editorial font-bold text-xl sm:text-2xl text-[#FAF7F2]">{t(s.title)}</h3>
                        <p className="mt-1 text-[#FAF7F2]/70 leading-relaxed">{t(s.body)}</p>
                      </li>
                    ))}
                  </ol>
                  <PublicButton variant="primary" size="lg" onClick={trial} className="liquid-cta mt-8 w-full">
                    <TrialCtaLabel isEn={isEn} />
                  </PublicButton>
                </div>
              </Reveal>
            </div>
            <NextDoor to="st-provisions" label={STATIONS[4].label} isEn={isEn} dark />
          </div>
        </div>
      </section>

      {/* ─── 05 THE PROVISIONS ─── four tracks, each opening its subject pages. */}
      <section id="st-provisions" className="public-container pb-20 lg:pb-28" aria-labelledby="st-provisions-h">
        <StationHead
          id="st-provisions-h" n={5} total={total} label={STATIONS[4].label} isEn={isEn}
          title={isEn ? 'What goes ' : 'إيه اللي '}
          ribbon={isEn ? 'in the bag.' : 'في الشنطة.'}
          sub={isEn ? '8 subjects, your own teacher.' : '٨ مواد، ومعلم لك أنت.'}
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4 max-w-6xl mx-auto">
          {TRACKS.map((tr, k) => {
            const rate = Math.min(...tr.links.map((l) => findSubjectPage(l.slug)?.rateUsd ?? 99));
            return (
              <Reveal as="li" key={tr.title.en} delay={k * 0.08} className="h-full group h-full flex flex-col overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_18px_40px_-28px_rgba(28,20,17,0.45)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-28px_rgba(28,20,17,0.55)]">
                  <div className="khatam-window relative grid place-items-center h-40 overflow-hidden" style={{ background: `radial-gradient(70% 80% at 50% 30%, ${tr.tone[0]}, ${tr.tone[1]})` }}>
                    <span aria-hidden="true" className="absolute inset-0 m-auto w-28 h-28 rounded-full bg-[#F6D58E]/20 blur-2xl transition-transform duration-700 group-hover:scale-150" />
                    <span className="relative transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3" aria-hidden="true">{tr.emblem}</span>
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
                </Reveal>
            );
          })}
        </ul>
        <div className="max-w-6xl mx-auto">
          <NewToIslamDoor isEn={isEn} />
        </div>
        <NextDoor to="st-stay" label={STATIONS[5].label} isEn={isEn} />
      </section>

      {/* ─── 06 THE TEACHER STAYS ─── the flying carpet (owner's idea, 2026-11-05). */}
      <div id="st-stay">
        <TeacherStays isEn={isEn} />
      </div>

      {/* ─── ARRIVAL ─── families, questions, the verse and the first lesson. */}
      <div id={ARRIVAL.id}>
        <FamilyVoices isEn={isEn} />
      </div>

      <section className="public-container pt-8 pb-16 lg:pb-20" aria-labelledby="home-faq">
        <div className="max-w-3xl mx-auto">
          <SectionHead id="home-faq" eyebrow={isEn ? 'Good to know' : 'قبل أن تبدأ'} before={isEn ? 'Questions families ' : 'أول ما '} ribbon={isEn ? 'ask first' : 'تسأل عنه الأسر'} />
          <div className="mt-10 space-y-3">
            {FAQS.slice(0, 4).map((f, k) => (
              <Reveal key={f.question} delay={k * 0.05} y={14}>
                <details className="group rounded-2xl border border-border bg-card px-5 open:shadow-[0_14px_30px_-24px_rgba(28,20,17,0.5)]">
                  <summary className="flex items-center justify-between gap-4 min-h-14 cursor-pointer list-none font-bold text-foreground">
                    {isEn ? f.question : f.arabicQuestion}
                    <span aria-hidden="true" className="grid place-items-center w-8 h-8 shrink-0 rounded-full bg-[#E5A93C]/15 text-[#B4552F] text-xl leading-none transition-transform group-open:rotate-45">+</span>
                  </summary>
                  <p className="pb-5 text-muted-foreground leading-relaxed max-w-[70ch]">{isEn ? f.answer : f.arabicAnswer}</p>
                </details>
              </Reveal>
            ))}
          </div>
          <p className="mt-4 text-center">
            <Link to="/faq" className="inline-flex items-center min-h-11 text-sm font-semibold text-foreground underline underline-offset-4">
              {isEn ? 'All questions and answers' : 'كل الأسئلة والإجابات'}
            </Link>
          </p>
        </div>
      </section>

      {/* ─── CLOSING ─── the verse we are named after, the three reminders, the first lesson. */}
      <section id="contact" className="public-container pb-16 lg:pb-24">
        <div className="band-espresso relative overflow-hidden rounded-[2.25rem] px-6 py-14 sm:px-12 lg:py-20 text-center">
          <DriftLight />
          <div aria-hidden="true" className="absolute inset-0 pointer-events-none opacity-[0.08] mix-blend-overlay" style={{ backgroundImage: GRAIN }} />
          <svg aria-hidden="true" viewBox="0 0 800 200" className="absolute inset-x-0 bottom-0 w-full h-auto opacity-40" preserveAspectRatio="none">
            <motion.path d="M0 170 C 160 90, 300 210, 420 130 S 660 40, 800 90" fill="none" stroke="#E5A93C" strokeWidth="2" initial={reduce ? false : { pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 2, ease: EXPO }} />
          </svg>
          <div className="relative flex justify-center"><ZadRigSvg pose="cheer" size={110} /></div>
          <p lang="ar" dir="rtl" className="relative mt-2 text-[2rem] leading-[1.9] sm:text-5xl sm:leading-[1.7] text-[#F6D58E]" style={{ fontFamily: "'Amiri Quran', var(--font-serif)" }}>
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
            <MaskLine>{isEn ? 'Every journey starts with one lesson.' : 'كل رحلة تبدأ بحصة.'}</MaskLine>
          </h2>
          <p className="relative mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
            {isEn
              ? 'The first one is free: thirty minutes to meet, listen, and find your way.'
              : 'والأولى مجاناً: ٣٠ دقيقة نتعرّف فيها، ونسمعك، ونلاقي طريقك.'}
          </p>
          {/* Remind, don't teach: the three things that matter, one last time. */}
          <ul className="relative mt-6 flex flex-wrap justify-center gap-2">
            {[{ en: 'The same teacher', ar: 'نفس المعلّم' }, { en: 'A note after every lesson', ar: 'تقرير بعد كل حصة' }, { en: 'First lesson free', ar: 'أول حصة مجانًا' }].map((r) => (
              <li key={r.en} className="inline-flex items-center gap-1.5 rounded-full border border-[#F6D58E]/30 px-3.5 py-1.5 text-sm font-semibold text-[#F6D58E]">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />{t(r)}
              </li>
            ))}
          </ul>
          <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <PublicButton variant="primary" size="lg" onClick={trial} className="liquid-cta w-full sm:w-auto">
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
