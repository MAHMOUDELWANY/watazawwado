import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton } from '../PublicDesignSystem';
import {
  Check,
  BookOpen,
  User,
  Users,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX
} from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { TeacherDuo } from './TeacherDuo';
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

const EXPLORE: Array<{ to: string; icon: typeof User; title: L; body: L }> = [
  {
    to: '/learning', icon: BookOpen,
    title: { en: 'Lessons and subjects', ar: 'الدروس والمواد' },
    body: { en: '13 tracks in Quran, Tajweed, Arabic, Islamic studies and English.', ar: '١٣ مساراً في القرآن والتجويد والعربية والعلوم الشرعية والإنجليزية.' }
  },
  {
    to: '/how-it-works', icon: CalendarCheck,
    title: { en: 'How it works', ar: 'كيف نعمل' },
    body: { en: 'From the free trial to your weekly lessons on Zoom.', ar: 'من الحصة التجريبية المجانية لحد دروسك الأسبوعية على Zoom.' }
  },
  {
    to: '/about', icon: ShieldCheck,
    title: { en: 'About the teachers', ar: 'عن المعلمين' },
    body: { en: 'Balanced, moderate teaching on the way of Ahl al-Sunnah.', ar: 'تعليم وسطي معتدل على منهج أهل السنة والجماعة.' }
  },
  {
    to: '/pricing', icon: CreditCard,
    title: { en: 'Prices and packages', ar: 'الأسعار والباقات' },
    body: { en: 'From $9 an hour for Quran and Islamic studies, from $13 for Arabic and English.', ar: 'من 9$ للساعة للقرآن والعلوم الشرعية، ومن 13$ للعربية والإنجليزية.' }
  },
  {
    to: '/faq', icon: HelpCircle,
    title: { en: 'Questions and answers', ar: 'الأسئلة الشائعة' },
    body: { en: 'Times, cancelling, payment and Zoom, answered simply.', ar: 'المواعيد والإلغاء والدفع وZoom، بإجابات بسيطة.' }
  },
  {
    to: '/student', icon: User,
    title: { en: 'Your account', ar: 'حسابك' },
    body: { en: 'Your lessons, Zoom links, packages and chat with your teacher.', ar: 'دروسك وروابط Zoom وباقاتك والمحادثة مع معلمك.' }
  }
];

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';
  const t = (l: L) => (isEn ? l.en : l.ar);
  const audio = useWelcomeAudio();
  useVerseFont();
  const Chevron = isEn ? ChevronRight : ChevronLeft;

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
                <>Quran and Arabic, one-on-one, <span className="text-ribbon">with a teacher who knows you by name.</span></>
              ) : (
                <>القرآن والعربية، حصة فردية <span className="text-ribbon">مع معلّم يعرفك باسمك.</span></>
              )}
            </h1>

            <div className="[grid-area:duo]">
              <TeacherDuo isEn={isEn} />
            </div>

            <div className="[grid-area:body] self-start space-y-6 animate-fade-in-up">
              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
                {isEn
                  ? 'Live Zoom lessons in Quran, Tajweed, Arabic, Islamic studies and English, for adults and children, with Ustadh Mahmoud or Ustadha Afnan.'
                  : 'دروس مباشرة على Zoom في القرآن والتجويد والعربية والعلوم الشرعية والإنجليزية، للكبار والصغار، مع الأستاذ محمود أو الأستاذة أفنان.'}
              </p>

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
                  className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-foreground border border-border bg-surface/60 backdrop-blur-sm hover:border-[#087D91]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {isEn ? 'Meet the teachers' : 'تعرّف على المعلمين'}
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
              ? '“And take provisions, but indeed the best provision is God-consciousness.” Al-Baqarah 2:197'
              : 'سورة البقرة، الآية ١٩٧. ومنها جاء اسم الأكاديمية: نتزوّد بالعلم، وخير الزاد التقوى.'}
          </p>
          <button
            type="button"
            onClick={() => (audio.playing ? audio.stop() : void audio.play())}
            aria-pressed={audio.playing}
            className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#087D91]/40 bg-surface text-sm font-semibold text-foreground hover:bg-[#087D91]/10 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087D91]"
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
              {isEn ? 'One account, for you or your whole family.' : 'حساب واحد، ليك أو لعيلتك كلها.'}
            </h2>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mt-4">
              {isEn
                ? 'Learn on your own, or manage your children’s lessons from the same place.'
                : 'اتعلّم لوحدك، أو تابع دروس أولادك من نفس المكان.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {PATHS.map(({ icon: Icon, tone, title, body, note }) => (
              <article key={title.en} className={`arch-top relative overflow-hidden border bg-gradient-to-b ${tone} bg-surface px-7 pt-14 pb-8 sm:px-10 text-center`}>
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

      {/* ─── 4. WHERE TO GO NEXT ─── */}
      <PublicSection className="pt-0 md:pt-0 lg:pt-0">
        <div className="max-w-5xl mx-auto">
          <h2 className="editorial-heading font-editorial text-2xl sm:text-3xl text-foreground mb-8">
            {isEn ? 'Find what you need' : 'لاقي اللي محتاجه'}
          </h2>
          <nav aria-label={isEn ? 'Site sections' : 'أقسام الموقع'} className="rounded-3xl border border-border bg-surface overflow-hidden">
            <ul className="grid sm:grid-cols-2">
              {EXPLORE.map(({ to, icon: Icon, title, body }, i) => (
                <li
                  key={to}
                  className={`border-border ${i < EXPLORE.length - 1 ? 'border-b' : ''} ${i === EXPLORE.length - 2 ? 'sm:border-b-0' : ''} ${i % 2 === 0 ? 'sm:border-e' : ''}`}
                >
                  <Link
                    to={to}
                    className="group flex items-center gap-4 px-5 py-5 sm:px-6 hover:bg-surface-subtle transition-colors focus-visible:outline-none focus-visible:bg-surface-subtle"
                  >
                    <span className="arch-tile shrink-0 w-11 h-12 flex items-center justify-center bg-[#087D91]/10 text-[#087D91] dark:text-[#12A4BC] group-hover:bg-[#C51F24]/10 group-hover:text-[#C51F24] transition-colors">
                      <Icon className="w-5 h-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-bold text-foreground">{t(title)}</span>
                      <span className="block text-sm text-muted-foreground leading-relaxed">{t(body)}</span>
                    </span>
                    <Chevron className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" aria-hidden="true" />
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
            {isEn ? 'Start with one free lesson.' : 'ابدأ بحصة واحدة مجاناً.'}
          </h2>
          <p className="relative mt-4 text-base sm:text-lg leading-relaxed max-w-xl mx-auto text-[#FAF7F2]/80">
            {isEn
              ? 'Thirty minutes on Zoom. Your teacher gets to know your level and goal, then suggests a plan that fits your week.'
              : '٣٠ دقيقة على Zoom. معلمك يتعرّف على مستواك وهدفك، ويقترح خطة تناسب أسبوعك.'}
          </p>
          <div className="relative mt-8 flex flex-col sm:flex-row justify-center gap-3">
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
              {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
            </PublicButton>
            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-semibold border border-[#FAF7F2]/30 text-[#FAF7F2] hover:bg-[#FAF7F2]/10 transition-colors"
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
