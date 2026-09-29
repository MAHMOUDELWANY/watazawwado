import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { 
  PublicSection, 
  StudyLine, 
  PortraitFrame, 
  PublicButton 
} from '../PublicDesignSystem';
import { 
  Check, 
  Sparkles, 
  Award,
  BookOpen,
  User,
  Users,
  MessageSquare,
  ShieldCheck,
  CalendarCheck,
  CreditCard,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-20 lg:pt-24">
      
      {/* ─── 1. HERO SECTION ─────────────────────────────────────────────────── */}
      <PublicSection className="relative overflow-hidden pb-12 lg:pb-20">
        {/* Subtle architectural ambient background glow */}
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-teal-500/10 dark:bg-teal-500/15 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-28 right-10 w-80 h-80 bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
            
            {/* Islamic Heritage Jewel Badge in Vibrant Teal */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/10 dark:bg-teal-500/20 text-teal-800 dark:text-teal-200 border border-teal-500/35 text-xs sm:text-sm font-semibold tracking-wide shadow-2xs">
              <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-pulse" />
              <span>{isEn ? 'Private 1-on-1 Instruction • Authentic Heritage' : 'تعليم فردي مباشر • تأصيل علمي راسخ'}</span>
            </div>
            
            <h1 className={`font-editorial text-4xl sm:text-5xl lg:text-6xl text-foreground font-medium leading-tight ${isEn ? '' : 'font-bold'}`}>
              {isEn ? (
                <>Learn for <span className="text-brand-gradient">yourself</span>.<br />Learn for your <span className="text-brand-gradient">family</span>.</>
              ) : (
                <>تعلّم <span className="text-brand-gradient">لنفسك</span>.<br />وتعلّم <span className="text-brand-gradient">لعائلتك</span>.</>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              {isEn 
                ? 'Your private space for learning and spiritual growth. Direct 1-on-1 lessons in Quran recitation, Tajweed, Arabic language, and Islamic Studies.'
                : 'مساحتك الخاصة للتعلّم والارتقاء. دروس فردية مباشرة في تلاوة القرآن الكريم وأحكام التجويد، واللغة العربية، والعلوم الإسلامية.'
              }
            </p>
            
            {/* Direct CTAs */}
            <div className="pt-2 flex flex-col sm:flex-row gap-3.5 items-stretch sm:items-center">
              <PublicButton 
                variant="primary" 
                size="lg" 
                id="hero-get-started-btn"
                data-tour="header-get-started-cta"
                onClick={() => onOpenTrialModal()} 
                className="w-full sm:w-auto shadow-lg shadow-primary/20"
              >
                <span>{isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك الأولى (مجانًا)'}</span>
                <span className="rtl:rotate-180 text-sm">→</span>
              </PublicButton>

              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I visited your website and would like to ask a question.' : 'السلام عليكم أستاذ محمود، زرت موقعكم الكريم وأود الاستفسار عن الدروس')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-solid py-3 px-5 rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 fill-current shrink-0" />
                <span>{isEn ? 'Chat on WhatsApp' : 'تواصل عبر واتساب'}</span>
              </a>
            </div>

            {/* Proof Points */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isEn ? 'No credit card required' : 'بدون بطاقة بنكية'}</span>
              </div>
              <span className="hidden sm:inline text-border">•</span>
              <div className="flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4 text-teal-600 dark:text-teal-400 shrink-0" />
                <span>{isEn ? 'Personal diagnostic assessment' : 'تقييم فردي وتحديد للمستوى'}</span>
              </div>
            </div>
          </div>
          
          {/* Portrait with 4-Color Architectural Edge */}
          <div className="lg:col-span-5 relative animate-fade-in-up mt-8 lg:mt-0" style={{ animationDelay: '150ms' }}>
            <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/20 via-primary/15 to-terracotta/20 rounded-3xl -z-10 blur-xl transform rotate-2" />
            <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" maxWidth={500} className="mx-auto shadow-2xl" />
            
            {/* Floating Credential Card */}
            <div className="hidden sm:block absolute -bottom-6 -left-6 rtl:-left-auto rtl:-right-6 bg-surface p-4 rounded-2xl shadow-xl border border-border max-w-[240px]">
              <div className="flex items-center gap-2 mb-1.5">
                <Award className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                  {isEn ? 'Al-Azhar Grounding' : 'تأصيل أزهري'}
                </span>
              </div>
              <StudyLine variant="teal" className="my-1.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isEn ? '3+ years experience, teaching students across Canada, US, UK, and Australia.' : 'خبرة +٣ سنوات في تدريس الطلاب في أمريكا، كندا، بريطانيا، وأستراليا.'}
              </p>
            </div>
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
                  ? 'Your personal student sanctuary. Manage your lessons, schedule, and learning milestones all in one place with direct teacher access.'
                  : 'حسابك الشخصي المستقل. جدول دروسك، وتابع تقدمك مع خطة تعليمية فردية مصممة خصيصاً لمستواك وأوقاتك.'}
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
                  ? 'Manage your children’s Islamic and Arabic education from your unified account. Book for them or for yourself whenever you need, with complete visibility.'
                  : 'أدِر تعلّم أبنائك وبناتك من حساب موحد. احجز لهم أو لنفسك بمرونة تامة مع متابعة دورية وتقارير مستمرة.'}
              </p>
              <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-center md:justify-start gap-2 text-xs font-bold text-accent">
                <Check className="w-4 h-4" />
                <span>{isEn ? 'Shared packages across family' : 'باقات مشتركة بين أفراد العائلة'}</span>
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

            {/* Link 3: About Ustadh Mahmoud */}
            <Link
              to="/about"
              className="p-5 rounded-2xl bg-surface border border-border/80 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all group flex flex-col justify-between h-full"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 text-accent flex items-center justify-center mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors">
                  {isEn ? 'About Ustadh Mahmoud' : 'عن المعلم والمنصة'}
                </h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                  {isEn 
                    ? 'Al-Azhar grounding, IELTS C1 English fluency, and 3+ years teaching international students.' 
                    : 'التأصيل الأزهري وإتقان الإنجليزية C1 وخبرة ٣+ سنوات مع طلاب المهجر.'}
                </p>
              </div>
              <div className="pt-3 mt-3 border-t border-border/40 flex items-center gap-1 text-xs font-bold text-accent">
                <span>{isEn ? 'Read Teacher Bio' : 'سيرة المعلم'}</span>
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
                    ? 'Transparent pricing starting at $4 per session. Choose 30, 45, or 60 min durations.' 
                    : 'أسعار واضحة تبدأ من ٤$ للجلسة مع حاسبة باقات تفاعلية وخيارات مرنة.'}
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
                    ? 'Your private sanctuary to manage lessons, schedule sessions, and track milestones with the teacher.' 
                    : 'مساحتك الخاصة لمتابعة الدروس، إدارة جدول المواعيد، وتقارير التقدم مع المعلم.'}
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
              ? 'Take the first step with a free, no-obligation 30-minute trial. We’ll assess your level and build a tailored study roadmap.'
              : 'ابدأ جلستك الأولى مجاناً للتعارف وتحديد المستوى وبناء خطتك المناسبة بدون أي التزام مالي.'}
          </p>
          
          <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3.5">
            <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
              {isEn ? 'Book Free Trial Now' : 'احجز جلستك المجانية الآن'}
            </PublicButton>

            <a
              href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I visited your website and would like to ask a question.' : 'السلام عليكم أستاذ محمود، زرت موقعكم الكريم وأود الاستفسار عن الدروس')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp-solid py-3 px-6 rounded-xl text-sm font-semibold shadow-md flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4 fill-current shrink-0" />
              <span>{isEn ? 'Message on WhatsApp' : 'تواصل عبر واتساب'}</span>
            </a>
          </div>
        </div>
      </PublicSection>

    </main>
  );
}
