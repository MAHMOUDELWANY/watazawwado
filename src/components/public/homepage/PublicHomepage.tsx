import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import {
  PublicSection,
  PublicButton
} from '../PublicDesignSystem';
import {
  Check,
  BookOpen,
  User,
  Users,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { WelcomeRecitation } from '../WelcomeRecitation';
import { TeacherDuo } from './TeacherDuo';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-20 lg:pt-24">
      {/* Welcome recitation: plays once per session on the first click or tap (homepage only). */}
      <WelcomeRecitation isAr={!isEn} />

      {/* ─── 1. HERO: who teaches, what, and the free trial ──────────────────── */}
      <PublicSection className="relative overflow-hidden pb-12 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-6 space-y-6 animate-fade-in-up">
            <h1 className={`font-editorial text-4xl sm:text-5xl lg:text-[3.6rem] text-foreground leading-[1.15] ${isEn ? 'font-medium' : 'font-bold'}`}>
              {isEn
                ? 'Quran and Arabic, one-on-one, with a teacher who knows you by name.'
                : 'القرآن والعربية، حصة فردية مع معلّم يعرفك باسمك.'}
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-xl">
              {isEn
                ? 'Live Zoom lessons in Quran, Tajweed, Arabic, Islamic studies and English, for adults and children, with Ustadh Mahmoud or Ustadha Afnan.'
                : 'دروس مباشرة على Zoom في القرآن والتجويد والعربية والعلوم الشرعية والإنجليزية، للكبار والصغار، مع الأستاذ محمود أو الأستاذة أفنان.'}
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <PublicButton
                variant="primary"
                size="lg"
                id="hero-get-started-btn"
                data-tour="header-get-started-cta"
                onClick={() => onOpenTrialModal()}
                className="w-full sm:w-auto shadow-lg shadow-primary/20"
              >
                {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
              </PublicButton>
              <Link
                to="/about"
                className="inline-flex items-center justify-center px-5 py-3 rounded-xl text-sm font-semibold text-foreground border border-border hover:border-teal-500/60 hover:bg-surface-subtle transition-colors"
              >
                {isEn ? 'Meet the teachers' : 'تعرّف على المعلمين'}
              </Link>
            </div>

            <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-sm text-muted-foreground">
              {[
                isEn ? '30 minutes, free' : '٣٠ دقيقة مجاناً',
                isEn ? 'No card needed' : 'بدون بطاقة بنكية',
                isEn ? 'Choose a male or female teacher' : 'تختار معلّم أو معلّمة',
              ].map((point) => (
                <li key={point} className="flex items-center gap-1.5 font-medium">
                  <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6 order-first lg:order-none">
            <TeacherDuo isEn={isEn} />
          </div>
        </div>
      </PublicSection>

      {/* ─── 2. CORE PLATFORM ADVANTAGE: FOR YOU / FOR YOUR FAMILY ────────────── */}
      <PublicSection variant="warm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Flexible Account' : 'مرونة الحساب'}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-semibold">
              {isEn ? 'One space. Two paths.' : 'مساحة واحدة. مساران للتعلّم.'}
            </h2>
            <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto mt-2">
              {isEn
                ? 'Whether you are learning individually or managing lessons for your children, everything is organized in one dedicated space.'
                : 'سواء كنت تتعلم بشكل فردي ومستقل، أو تدير تعليم أبنائك وبناتك، فكل شيء ميسر وموثق في مكان واحد.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Card 1: For Yourself */}
            <div className="bg-surface p-8 rounded-2xl border border-teal-500/30 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden text-center md:text-start">
              <div className="w-14 h-14 rounded-2xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xs border border-teal-500/25">
                <User className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-editorial font-bold mb-3 text-foreground">
                {isEn ? 'Learn for yourself' : 'تعلّم لنفسك'}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {isEn
                  ? 'Your own account: book lessons at times that suit you, follow your progress, and talk to your teacher in the on-site chat.'
                  : 'حسابك الخاص: احجز دروسك في المواعيد اللي تناسبك، وتابع تقدمك، وكلّم معلمك في المحادثة داخل الموقع.'}
              </p>
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-teal-700 dark:text-teal-300">
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Direct teacher feedback' : 'متابعة مباشرة من المعلم'}</span>
              </div>
            </div>

            {/* Card 2: For Your Family */}
            <div className="bg-surface p-8 rounded-2xl border border-terracotta/30 hover:border-terracotta/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden text-center md:text-start">
              <div className="w-14 h-14 rounded-2xl bg-terracotta/10 text-accent flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-xs border border-terracotta/25">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-editorial font-bold mb-3 text-foreground">
                {isEn ? 'Learn for your family' : 'تعلّم لعائلتك'}
              </h3>
              <p className="text-muted-foreground leading-relaxed text-sm sm:text-base">
                {isEn
                  ? 'One parent account for every child. Each child gets their own teacher, and girls can learn with Ustadha Afnan. A second child’s package is 5% off.'
                  : 'حساب واحد لولي الأمر لكل الأولاد. لكل طفل معلمه، والبنات يقدروا يتعلموا مع الأستاذة أفنان، وباقة الطفل التاني عليها خصم 5%.'}
              </p>
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-accent">
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Family discount on packages' : 'خصم العائلة على الباقات'}</span>
              </div>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* ─── 3. PLATFORM DIRECTORY: DEDICATED SECTIONS HUB ────────────────────── */}
      <PublicSection variant="transition-neutral">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="font-editorial text-2xl sm:text-3xl text-foreground font-semibold">
              {isEn ? 'Explore Dedicated Sections' : 'استكشف صفحات وأقسام المنصة'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto mt-2">
              {isEn
                ? 'Each area of our platform has its own dedicated page with comprehensive details.'
                : 'لكل قسم في منصتنا صفحته المستقلة بكافة التفاصيل والمعلومات.'}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
            {/* Link 1: Lessons */}
            <Link
              to="/learning"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'Lessons & Syllabus' : 'الدروس والمناهج'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? 'Explore 13 specialized tracks in Quran, Tajweed, Arabic, and Islamic Studies.'
                    : 'استكشف ١٣ مساراً تعليمياً في القرآن، التجويد، الفصحى، والعامية المصرية.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                <span>{isEn ? 'View Syllabus' : 'استعراض المناهج'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>

            {/* Link 2: How It Works */}
            <Link
              to="/how-it-works"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'How Learning Works' : 'كيف نعمل والمنهجية'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? 'Our patient 4-step methodology from trial assessment to live Zoom sessions.'
                    : 'منهجيتنا التعليمية الهادئة من الجلسة التجريبية حتى الدروس الفردية عبر زووم.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-primary">
                <span>{isEn ? 'Explore Methodology' : 'تعرف على الطريقة'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>

            {/* Link 3: About the teachers */}
            <Link
              to="/about"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-accent flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'About our teachers' : 'عن المعلمين والمنصة'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? "Meet Ustadh Mahmoud and Ustadha Afnan: balanced, moderate teaching on the way of Ahl al-Sunnah, for students who grew up abroad."
                    : 'تعرّف على الأستاذ محمود والأستاذة أفنان: تعليم وسطي معتدل على منهج أهل السنة، لطلاب المهجر.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-accent">
                <span>{isEn ? 'Meet the teachers' : 'تعرّف على المعلمين'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>

            {/* Link 4: Pricing */}
            <Link
              to="/pricing"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center mb-3">
                  <CreditCard className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'Pricing & Packages' : 'الأسعار والباقات'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? 'Clear prices from $9 per hour (Quran & Islamic studies) and from $13 per hour (Arabic & English), with money-saving packages.'
                    : 'أسعار واضحة: من 9$ للساعة (القرآن والعلوم الشرعية) ومن 13$ للساعة (العربية والإنجليزية)، مع باقات بتوفّر لك.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-teal-700 dark:text-teal-300">
                <span>{isEn ? 'Calculate Pricing' : 'استعراض الأسعار'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>

            {/* Link 5: FAQ */}
            <Link
              to="/faq"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-accent flex items-center justify-center mb-3">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'Frequently Asked Questions' : 'الأسئلة الشائعة'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? 'Clear answers regarding scheduling, cancellation policy, Zoom setup, and payment options.'
                    : 'إجابات شاملة ومفصلة حول المواعيد، سياسة الإلغاء، طريقة الدفع، واستخدام برنامج زووم.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-accent">
                <span>{isEn ? 'Browse All FAQs' : 'تصفح كل الأسئلة'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>

            {/* Link 6: Student Portal */}
            <Link
              to="/student"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'Student Portal' : 'بوابة ومساحة الطالب'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn
                    ? 'Your lessons, Zoom links, packages and chat with your teacher, in one place.'
                    : 'دروسك وروابط Zoom وباقاتك والمحادثة مع معلمك، في مكان واحد.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-primary">
                <span>{isEn ? 'Enter Portal' : 'دخول البوابة'}</span>
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
              </div>
            </Link>
          </div>
        </div>
      </PublicSection>

      {/* ─── 4. FINAL CALL TO ACTION ─────────────────────────────────────────── */}
      <PublicSection id="contact" variant="transition-warm" className="border-t border-border">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider">
            <span>{isEn ? 'Get Started' : 'ابدأ اليوم'}</span>
          </div>

          <h3 className="font-editorial text-3xl sm:text-4xl text-foreground font-bold leading-tight">
            {isEn ? 'Ready to begin your journey?' : 'هل أنت مستعد لبدء رحلتك؟'}
          </h3>

          <p className="text-muted-foreground leading-relaxed text-base max-w-xl mx-auto">
            {isEn
              ? 'Start with a free 30-minute trial. Your teacher gets to know your level and goal, then suggests a plan that fits your week.'
              : 'ابدأ بحصة تجريبية مجانية ٣٠ دقيقة. معلمك يتعرّف على مستواك وهدفك، ويقترح خطة تناسب أسبوعك.'}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3.5">
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
              {isEn ? 'Book Free Trial Now' : 'احجز جلستك المجانية الآن'}
            </PublicButton>

            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum, I visited the Watazawwado website and would like to ask about lessons.' : 'السلام عليكم، زرت موقع وتزودوا وحابب أستفسر عن الدروس.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-solid py-3 px-6 rounded-xl text-sm font-semibold shadow-xs flex items-center justify-center gap-2"
            >
              <WhatsAppIcon className="w-4 h-4 shrink-0" />
              <span>{isEn ? 'Message on WhatsApp' : 'تواصل عبر واتساب'}</span>
            </a>
          </div>
        </div>
      </PublicSection>

    </main>
  );
}
