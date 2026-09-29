import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { Language } from '../../../types';
import { ARABIC_TRANSLATIONS, AUTHENTIC_TESTIMONIALS, FAQS } from '../../../data/content';
import { 
  PublicSection, 
  EditorialHeading, 
  StudyLine, 
  MarginNote, 
  PortraitFrame, 
  PublicButton, 
  EditorialBlock, 
  TestimonialQuote, 
  LearningAreaItem 
} from '../PublicDesignSystem';
import { BrandGlassCard } from '../../ui/BrandGlassCard';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  BookOpen, 
  User, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Languages, 
  MessageSquare, 
  Globe, 
  Award,
  CalendarCheck,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-20 lg:pt-24">
      
      {/* 1. HERO SECTION (Harmonious 4-Color Islamic Architectural Heritage) */}
      <PublicSection className="relative overflow-hidden pb-12 lg:pb-24">
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
            
            {/* Interactive CTAs with clear color hierarchy */}
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
                href="#services"
                id="hero-learn-more-btn"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-teal-600/30 text-teal-800 dark:text-teal-200 hover:bg-teal-500/10 font-semibold text-sm transition-all"
              >
                <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <span>{isEn ? 'Explore Tracks' : 'استكشف المسارات'}</span>
              </a>
            </div>

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
            <div className="hidden sm:block absolute -bottom-6 -left-6 rtl:-left-auto rtl:-right-6 glass-card p-4 rounded-2xl shadow-xl border border-border max-w-[240px]">
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

      {/* 2. WHAT CAN I LEARN? (Distinct Architectural Color Taxonomy) */}
      <PublicSection id="services" variant="transition-warm">
        <div className="flex flex-col items-center lg:items-start mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isEn ? 'Areas of Study' : 'مسارات التعلم'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-semibold text-center lg:text-start">
            {isEn ? 'What do you want to learn?' : 'ماذا تريد أن تتعلم؟'}
          </h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl text-center lg:text-start mt-2">
            {isEn ? 'Select any track to discuss your goals and build a personalized study syllabus in your trial lesson.' : 'اختر أي مسار لمناقشة أهدافك وبناء خطتك التعليمية في جلستك الأولى.'}
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10">
          <LearningAreaItem 
            areaClass="learning-area-quran"
            icon={<BookOpen className="w-5 h-5" />}
            badge={isEn ? 'Tajweed & Hifz' : 'تجويد وحفظ'}
            title={isEn ? 'Quran & Tajweed' : 'القرآن الكريم والتجويد'}
            description={isEn ? 'From learning the alphabet and pronunciation rules to fluent recitation and structured memorization.' : 'من الحروف الأولى وأحكام التجويد إلى التلاوة السليمة والحفظ المتقن.'}
            onClick={() => onOpenTrialModal('quran')}
          />
          <LearningAreaItem 
            areaClass="learning-area-islamic"
            icon={<GraduationCap className="w-5 h-5" />}
            badge={isEn ? 'Foundations' : 'عقيدة وفقه'}
            title={isEn ? 'Islamic Studies' : 'العلوم الإسلامية'}
            description={isEn ? 'Clear, authentic grounding in Aqeedah, Fiqh of worship, and the inspiring Seerah of the Prophet ﷺ.' : 'تأصيل علمي ميسر في العقيدة، فقه العبادات، والسيرة النبوية العطرة.'}
            onClick={() => onOpenTrialModal('islamic_studies')}
          />
          <LearningAreaItem 
            areaClass="learning-area-msa"
            icon={<Languages className="w-5 h-5" />}
            badge={isEn ? 'Classical' : 'نحو وصرف'}
            title={isEn ? 'Modern Standard Arabic' : 'العربية الفصحى'}
            description={isEn ? 'Master reading, writing, comprehension, and formal grammar (Nahw and Sarf) structurally.' : 'إتقان القراءة والكتابة والنحو والصرف بشكل منهجي لفهم نصوص التراث.'}
            onClick={() => onOpenTrialModal('modern-standard-arabic')}
          />
          <LearningAreaItem 
            areaClass="learning-area-egyptian"
            icon={<MessageSquare className="w-5 h-5" />}
            badge={isEn ? 'Spoken Dialect' : 'لهجة حية'}
            title={isEn ? 'Egyptian Arabic' : 'العربية المصرية'}
            description={isEn ? 'Learn the warm, expressive dialect widely understood across the Arab world for daily conversation.' : 'تحدث اللهجة المصرية الأكثر انتشاراً وفهماً في العالم العربي بطلاقة وثقة.'}
            onClick={() => onOpenTrialModal('egyptian-arabic')}
          />
          <LearningAreaItem 
            areaClass="learning-area-english"
            icon={<Globe className="w-5 h-5" />}
            badge={isEn ? 'Fluency' : 'محادثة وتواصل'}
            title={isEn ? 'English Language' : 'اللغة الإنجليزية'}
            description={isEn ? 'Coaching for Arabic speakers seeking speaking fluency, IELTS preparation, and professional confidence.' : 'تطوير مهارات التحدث بالإنجليزية للناطقين بالعربية واجتياز اختبارات الكفاءة.'}
            onClick={() => onOpenTrialModal('english')}
          />
        </div>
      </PublicSection>

      {/* 3. FOR YOU / FOR YOUR FAMILY (Balanced Teal & Terracotta Paths) */}
      <PublicSection variant="warm">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/15 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider mb-2">
              <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'Flexible Account' : 'مرونة الحساب'}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-semibold">
              {isEn ? 'One space. Two paths.' : 'مساحة واحدة. مساران للتعلّم.'}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 relative">
            {/* Card 1: For Yourself (Teal Focus) */}
            <div className="glass-card p-8 rounded-2xl border border-teal-500/30 hover:border-teal-500/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden text-center md:text-start">
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

            {/* Card 2: For Your Family (Terracotta & Amber Focus) */}
            <div className="glass-card p-8 rounded-2xl border border-terracotta/30 hover:border-terracotta/60 shadow-xs hover:shadow-md transition-all relative overflow-hidden text-center md:text-start">
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

      {/* 4. HOW IT WORKS (Gradient Step Progression) */}
      <PublicSection id="approach" variant="transition-neutral">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider mb-2">
              <CalendarCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{isEn ? 'The Journey' : 'رحلة التعلم'}</span>
            </div>
            <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-semibold">
              {isEn ? 'How learning works' : 'كيف تبدأ رحلتك'}
            </h2>
          </div>
          
          <StudyLine variant="gradient" />

          <div className="space-y-8 mt-10">
            {/* Step 1: Teal */}
            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/35 font-bold font-editorial flex items-center justify-center shrink-0 text-sm shadow-xs">
                01
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-foreground">{isEn ? 'Book a Free Trial' : 'احجز جلستك التجريبية المجانية'}</h4>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {isEn ? 'Choose a time in your local timezone. No payment required, no commitments.' : 'اختر الموعد المناسب لجدولك في منطقتك الزمنية. بدون أي التزامات مالية أو دفع مسبق.'}
                </p>
              </div>
            </div>

            {/* Step 2: Crimson */}
            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-primary/15 text-primary border border-primary/35 font-bold font-editorial flex items-center justify-center shrink-0 text-sm shadow-xs">
                02
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-foreground">{isEn ? 'Meet & Discover' : 'التقِ بالمعلم وحدد مستواك'}</h4>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {isEn ? 'Discuss your personal goals and experience a real mini-lesson to see the patient teaching style.' : 'نتعرف على أهدافك ونقيّم مستواك ونخوض درساً مصغراً للتعرف على طريقة الشرح والتفاعل.'}
                </p>
              </div>
            </div>

            {/* Step 3: Terracotta */}
            <div className="flex gap-5 items-start">
              <div className="w-10 h-10 rounded-full bg-terracotta/15 text-accent border border-terracotta/35 font-bold font-editorial flex items-center justify-center shrink-0 text-sm shadow-xs">
                03
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-bold text-foreground">{isEn ? 'Learn 1-on-1 with Flexibility' : 'تعلم بمرونة وتابع تقدمك'}</h4>
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {isEn ? 'Receive your customized learning plan and attend private live Zoom lessons with flexible rescheduling.' : 'استلم خطتك التعليمية الخاصة وابدأ دروسك عبر زووم مع سهولة إعادة الجدولة حسب ظروفك.'}
                </p>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300 hover:underline cursor-pointer"
              >
                <span>{isEn ? 'Explore our complete 4-step methodology' : 'تعرف أكثر على خطوات ومنهجية العمل بالتفصيل'}</span>
                <span className="rtl:rotate-180">→</span>
              </Link>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* 5. MEET USTADH MAHMOUD (High Contrast Background & Heritage Proof Points) */}
      <PublicSection id="about">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-5 relative">
              <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" className="w-full max-w-sm mx-auto shadow-xl" />
              <div className="absolute -bottom-4 -right-4 rtl:-right-auto rtl:-left-4 bg-surface p-3.5 rounded-2xl shadow-lg border border-border hidden sm:flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                <span className="text-xs font-bold text-foreground">
                  {isEn ? 'Verified Independent Teacher' : 'معلم مستقل معتمد'}
                </span>
              </div>
            </div>
            
            <div className="md:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider">
                <span>{isEn ? 'Your Teacher' : 'المعلم'}</span>
              </div>

              <h3 className="font-editorial text-3xl sm:text-4xl text-foreground font-bold">
                {isEn ? 'Ustadh Mahmoud' : 'الأستاذ محمود'}
              </h3>
              
              <div className="prose prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none text-base">
                <p>
                  {isEn 
                    ? 'Peace be upon you. I am Mahmoud, an independent teacher of the Quran, Arabic, and Islamic Studies. I am dedicated to providing direct, patient, and personalized 1-on-1 education for international students and families.'
                    : 'السلام عليكم ورحمة الله وبركاته. أنا محمود، أعمل كمعلم مستقل للقرآن الكريم، وأحكام التجويد، واللغة العربية، والدراسات الإسلامية للطلاب الدوليين والعائلات المسلمة حول العالم.'}
                </p>
                <p>
                  {isEn
                    ? 'My education at Al-Azhar in Egypt provided me with a deep, classical grounding in Islamic sciences and the Arabic language. My proficiency in English (IELTS C1) allows me to explain complex grammar and precise pronunciation naturally to English speakers.'
                    : 'دراستي في الأزهر الشريف منحتني تأصيلاً علمياً عميقاً، وإتقاني للغة الإنجليزية بمستوى (IELTS C1) يمكنني من شرح أدق المسائل اللغوية ومخارج الحروف بأسلوب سهل وطبيعي للناطقين بالإنجليزية.'}
                </p>
              </div>

              {/* 3 Pillars with the 3 Distinct Architectural Colors */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border mt-8">
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/25 text-center sm:text-start">
                  <p className="text-2xl font-bold font-editorial text-teal-700 dark:text-teal-300">3+</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isEn ? 'Years Teaching' : 'سنوات خبرة'}</p>
                </div>
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/25 text-center sm:text-start">
                  <p className="text-2xl font-bold font-editorial text-primary">Al-Azhar</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isEn ? 'Azharite Graduate' : 'خريج الأزهر'}</p>
                </div>
                <div className="p-3 rounded-xl bg-terracotta/10 border border-terracotta/25 text-center sm:text-start">
                  <p className="text-2xl font-bold font-editorial text-accent">IELTS C1</p>
                  <p className="text-xs font-semibold text-muted-foreground mt-0.5">{isEn ? 'English Fluency' : 'إتقان الإنجليزية'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* 6. WHAT STUDENTS SAY */}
      <PublicSection id="testimonials" variant="warm">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider mb-2">
            <span>{isEn ? 'Verified Reviews' : 'تجارب حقيقية'}</span>
          </div>
          <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-semibold">
            {isEn ? 'What students and parents say' : 'آراء الطلاب وأولياء الأمور'}
          </h2>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {AUTHENTIC_TESTIMONIALS.slice(0, 4).map((testimonial) => (
            <TestimonialQuote 
              key={testimonial.id}
              quote={isEn ? testimonial.quote : (testimonial.arabicQuote || testimonial.quote)}
              name={isEn ? testimonial.author : (testimonial.arabicAuthor || testimonial.author)}
              detail={isEn ? `${testimonial.role} • ${testimonial.subject}` : `${testimonial.arabicRole || testimonial.role} • ${testimonial.arabicSubject || testimonial.subject}`}
              className="glass-card p-6 rounded-2xl border border-border shadow-xs hover:border-teal-500/30 transition-colors"
            />
          ))}
        </div>
      </PublicSection>

      {/* 7. PRICING PREVIEW (High Contrast & 4-Color Gradient Glass Border) */}
      <PublicSection>
        <div className="max-w-4xl mx-auto">
          <BrandGlassCard intensity="high" className="p-8 sm:p-12 rounded-3xl text-center space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/15 text-teal-800 dark:text-teal-200 border border-teal-500/30 text-xs font-bold uppercase tracking-wider">
              <span>{isEn ? 'Transparent Pricing' : 'أسعار شفافة'}</span>
            </div>
            
            <h3 className="font-editorial text-3xl sm:text-4xl text-foreground font-bold">
              {isEn ? 'Simple, flexible packages' : 'باقات ميسرة وبدون اشتراكات إجبارية'}
            </h3>
            
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {isEn 
                ? 'Lessons start from $4 per 30-minute session. Choose 30, 45, or 60-minute durations based on your stamina and schedule. No subscription traps, just prepaid packages you can use flexibly.'
                : 'تبدأ الدروس من ٤ دولارات فقط للجلسة (٣٠ دقيقة). يمكنك اختيار المدة التي تناسب تركيزك ووقتك (٣٠، ٤٥، أو ٦٠ دقيقة). باقات مسبقة الدفع مرنة تستخدمها متى شئت.'}
            </p>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <span className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground">
                {isEn ? '30 Min: from $4' : '٣٠ دقيقة: تبدأ من ٤$'}
              </span>
              <span className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground">
                {isEn ? '45 Min: from $6' : '٤٥ دقيقة: تبدأ من ٦$'}
              </span>
              <span className="px-4 py-2 rounded-xl bg-surface border border-teal-500/40 text-sm font-bold text-teal-700 dark:text-teal-300">
                {isEn ? '60 Min: from $8' : '٦٠ دقيقة: تبدأ من ٨$'}
              </span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row justify-center gap-4">
              <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()}>
                {isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك التجريبية المجانية'}
              </PublicButton>
              <Link 
                to="/pricing" 
                className="inline-flex items-center justify-center px-6 py-3 rounded-xl border border-border hover:bg-surface text-sm font-semibold text-foreground transition-colors cursor-pointer"
              >
                {isEn ? 'View All Packages' : 'تفاصيل جميع الباقات'}
              </Link>
            </div>
          </BrandGlassCard>
        </div>
      </PublicSection>

      {/* 8. FAQ & FINAL CTA */}
      <PublicSection id="contact" variant="transition-warm" className="border-t border-border">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-5 space-y-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25 text-xs font-bold uppercase tracking-wider">
              <span>{isEn ? 'Get Started' : 'ابدأ اليوم'}</span>
            </div>

            <h3 className="font-editorial text-3xl sm:text-4xl text-foreground font-bold leading-tight">
              {isEn ? 'Ready to begin your journey?' : 'هل أنت مستعد لبدء رحلتك؟'}
            </h3>
            
            <p className="text-muted-foreground leading-relaxed text-base">
              {isEn 
                ? 'Take the first step with a free, no-obligation 30-minute trial. We’ll assess your level and build a tailored roadmap.'
                : 'ابدأ جلستك الأولى مجاناً للتعارف وتحديد المستوى وبناء خطتك المناسبة بدون أي التزام مالي.'}
            </p>
            
            <div className="pt-2 flex flex-col gap-3">
              <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
                {isEn ? 'Book Free Trial Now' : 'احجز جلستك المجانية الآن'}
              </PublicButton>

              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I visited your website and would like to ask a question.' : 'السلام عليكم أستاذ محمود، زرت موقعكم الكريم وأود الاستفسار عن الدروس')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-solid py-3 px-5 rounded-xl text-sm font-semibold shadow-md"
              >
                <MessageSquare className="w-4 h-4 fill-current shrink-0" />
                <span>{isEn ? 'Message on WhatsApp' : 'تواصل عبر واتساب'}</span>
              </a>
            </div>
          </div>
          
          <div className="lg:col-span-7 space-y-4">
            <h4 className="font-editorial text-2xl text-foreground mb-6 font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 dark:bg-teal-400 inline-block" />
              <span>{isEn ? 'Frequently Asked Questions' : 'الأسئلة الأكثر شيوعاً وإجاباتها'}</span>
            </h4>
            {FAQS.slice(0, 4).map((faq, i) => (
              <div key={i} className="glass-card p-5 rounded-2xl border border-border/80 shadow-2xs space-y-2 hover:border-teal-500/40 transition-colors">
                <h5 className="font-bold text-foreground text-base">
                  {isEn ? faq.question : (faq.arabicQuestion || faq.question)}
                </h5>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {isEn ? faq.answer : (faq.arabicAnswer || faq.answer)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

    </main>
  );
}
