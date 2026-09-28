import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { Language } from '../../../types';
import { ARABIC_TRANSLATIONS, AUTHENTIC_TESTIMONIALS, FAQS, VERIFIED_PROOF_POINTS } from '../../../data/content';
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
import { Check, ArrowRight, ArrowLeft, Clock, BookOpen, User, Users, GraduationCap, Sparkles } from 'lucide-react';

export function PublicHomepage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-20 lg:pt-24">
      
      {/* 1. HERO SECTION */}
      <PublicSection className="relative overflow-hidden pb-12 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 animate-fade-in-up">
            <MarginNote className="mb-4 inline-block">
              {isEn ? 'Private 1-on-1 Learning' : 'تعليم فردي مباشر'}
            </MarginNote>
            
            <h1 className={`font-editorial text-4xl sm:text-5xl lg:text-6xl text-foreground font-medium tracking-tight leading-tight ${isEn ? '' : 'font-bold'}`}>
              {isEn ? (
                <>Learn for yourself.<br />Learn for your family.</>
              ) : (
                <>تعلّم لك.<br />وتعلّم لعائلتك.</>
              )}
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-2xl font-light">
              {isEn 
                ? 'Your private space for learning and growth. Direct 1-on-1 lessons in Quran, Arabic, and Islamic Studies with Ustadh Mahmoud.'
                : 'مساحتك الخاصة للتعلّم والنمو. دروس فردية مباشرة في القرآن الكريم، واللغة العربية، والعلوم الإسلامية مع الأستاذ محمود.'
              }
            </p>
            
            <div className="pt-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <PublicButton size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
                {isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك الأولى (مجانًا)'}
              </PublicButton>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Check className="w-4 h-4 text-primary" />
                <span>{isEn ? 'No credit card required' : 'بدون بطاقة بنكية'}</span>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative animate-fade-in-up mt-8 lg:mt-0" style={{ animationDelay: '150ms' }}>
            <div className="absolute -inset-4 bg-surface-warm/50 rounded-2xl -z-10 transform rotate-3" />
            <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" maxWidth={500} className="mx-auto" />
            <div className="absolute -bottom-6 -left-6 rtl:-left-auto rtl:-right-6 bg-surface p-4 rounded-lg shadow-sm border border-border-subtle max-w-[200px]">
              <StudyLine variant="accent" className="my-2" />
              <p className="text-xs text-muted-foreground">
                {isEn ? '3+ years experience, teaching students across Canada, US, UK, and Australia.' : 'خبرة +٣ سنوات في تدريس الطلاب في أمريكا، كندا، بريطانيا، وأستراليا.'}
              </p>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* 2. WHAT CAN I LEARN? */}
      <PublicSection id="services" variant="transition-warm">
        <EditorialHeading eyebrow={isEn ? 'Areas of Study' : 'مسارات التعلم'} className="text-center lg:text-start">
          {isEn ? 'What do you want to learn?' : 'ماذا تريد أن تتعلم؟'}
        </EditorialHeading>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
          <LearningAreaItem 
            areaClass="learning-area-quran"
            title={isEn ? 'Quran & Tajweed' : 'القرآن الكريم والتجويد'}
            description={isEn ? 'From learning the alphabet to fluent recitation and structured memorization.' : 'من الحروف الأولى إلى التلاوة الصحيحة والحفظ المتقن.'}
            onClick={() => onOpenTrialModal('quran')}
          />
          <LearningAreaItem 
            areaClass="learning-area-islamic"
            title={isEn ? 'Islamic Studies' : 'العلوم الإسلامية'}
            description={isEn ? 'Clear, authentic grounding in Aqeedah, Fiqh, and the Seerah of the Prophet ﷺ.' : 'تأصيل علمي واضح في العقيدة، الفقه، والسيرة النبوية.'}
            onClick={() => onOpenTrialModal('islamic_studies')}
          />
          <LearningAreaItem 
            areaClass="learning-area-msa"
            title={isEn ? 'Modern Standard Arabic' : 'العربية الفصحى'}
            description={isEn ? 'Master reading, writing, and formal grammar (Nahw and Sarf).' : 'إتقان القراءة والكتابة والنحو والصرف بشكل هيكلي.'}
            onClick={() => onOpenTrialModal('modern-standard-arabic')}
          />
          <LearningAreaItem 
            areaClass="learning-area-egyptian"
            title={isEn ? 'Egyptian Arabic' : 'العربية المصرية'}
            description={isEn ? 'Learn the warm, expressive dialect for travel and conversation.' : 'تحدث اللهجة المصرية بطلاقة وثقة في الحياة اليومية.'}
            onClick={() => onOpenTrialModal('egyptian-arabic')}
          />
          <LearningAreaItem 
            areaClass="learning-area-english"
            title={isEn ? 'English Language' : 'اللغة الإنجليزية'}
            description={isEn ? 'Coaching for Arabic speakers seeking fluency and professional confidence.' : 'تطوير المحادثة واللغة الإنجليزية للناطقين بالعربية.'}
            onClick={() => onOpenTrialModal('english')}
          />
        </div>
      </PublicSection>

      {/* 3. FOR YOU / FOR YOUR FAMILY */}
      <PublicSection variant="warm">
        <div className="max-w-4xl mx-auto">
          <EditorialHeading className="text-center mb-16">
            {isEn ? 'One space. Two paths.' : 'مساحة واحدة. مساران للتعلّم.'}
          </EditorialHeading>

          <div className="grid md:grid-cols-2 gap-12 relative">
            {/* Divider line for desktop */}
            <div className="hidden md:block absolute top-0 bottom-0 left-1/2 w-px bg-border-subtle" />

            <EditorialBlock className="text-center md:text-start md:pe-8">
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-sm border border-border-subtle">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-2xl font-editorial font-medium mb-4 text-foreground">
                {isEn ? 'Learn for yourself' : 'تعلّم لنفسك'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'Your personal account. Manage your lessons, schedule, and progress all in one place with direct access to your teacher.'
                  : 'حساب شخصي، دروسك، مواعيدك، وتقدمك في مكان واحد.'}
              </p>
            </EditorialBlock>

            <EditorialBlock className="text-center md:text-start md:ps-8">
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto md:mx-0 mb-6 shadow-sm border border-border-subtle">
                <Users className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-2xl font-editorial font-medium mb-4 text-foreground">
                {isEn ? 'Learn for your family' : 'تعلّم لعائلتك'}
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {isEn 
                  ? 'Manage your children’s education from your account. Book for them or for yourself whenever you need, with complete visibility.'
                  : 'أدِر تعلّم أبنائك من حسابك، واحجز لهم أو لنفسك عندما تريد.'}
              </p>
            </EditorialBlock>
          </div>
        </div>
      </PublicSection>

      {/* 4. HOW IT WORKS */}
      <PublicSection id="approach" variant="transition-neutral">
        <div className="max-w-3xl mx-auto">
          <div>
            <EditorialHeading eyebrow={isEn ? 'The Journey' : 'رحلة التعلم'}>
              {isEn ? 'How learning works' : 'كيف تبدأ رحلتك'}
            </EditorialHeading>
            <StudyLine />
            <div className="space-y-8 mt-10">
              <div className="flex gap-4">
                <span className="text-sm font-bold text-accent font-editorial pt-1">01</span>
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-1">{isEn ? 'Book a Free Trial' : 'احجز جلسة تجريبية'}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{isEn ? 'Choose a time in your local timezone. No payment required.' : 'اختر الوقت المناسب لك. بدون أي التزامات مالية.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-sm font-bold text-accent font-editorial pt-1">02</span>
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-1">{isEn ? 'Meet & Discover' : 'التقِ وحدد مستواك'}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{isEn ? 'Discuss your goals and experience a real mini-lesson to see the teaching style.' : 'نتعرف على أهدافك ونحدد مستواك من خلال درس مصغر.'}</p>
                </div>
              </div>
              <div className="flex gap-4">
                <span className="text-sm font-bold text-accent font-editorial pt-1">03</span>
                <div>
                  <h4 className="text-lg font-medium text-foreground mb-1">{isEn ? 'Learn 1-on-1' : 'تعلم بمرونة تامة'}</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">{isEn ? 'Receive a custom plan and attend private Zoom lessons with flexible rescheduling.' : 'استلم خطتك الخاصة وابدأ دروسك المباشرة عبر زووم بمرونة عالية.'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* 5. MEET USTADH MAHMOUD */}
      <PublicSection id="about">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-12 gap-10 items-start">
            <div className="md:col-span-4">
              <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" className="w-full max-w-sm mx-auto" />
            </div>
            <div className="md:col-span-8 space-y-6">
              <EditorialHeading eyebrow={isEn ? 'Your Teacher' : 'المعلم'} noAccent>
                {isEn ? 'Ustadh Mahmoud' : 'الأستاذ محمود'}
              </EditorialHeading>
              
              <div className="prose prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p>
                  {isEn 
                    ? 'Peace be upon you. I am Mahmoud, an independent teacher of the Quran, Arabic, and Islamic Studies. I am dedicated to providing direct, patient, and personalized 1-on-1 education for international students and families.'
                    : 'السلام عليكم ورحمة الله وبركاته. أنا محمود، أعمل كمعلم مستقل للقرآن الكريم، وأحكام التجويد، واللغة العربية، والدراسات الإسلامية للطلاب الدوليين والعائلات المسلمة.'}
                </p>
                <p>
                  {isEn
                    ? 'My education at Al-Azhar in Egypt provided me with a deep, classical grounding in Islamic sciences and the Arabic language. My proficiency in English (IELTS C1) allows me to explain complex grammar and precise pronunciation naturally to English speakers.'
                    : 'دراستي في الأزهر الشريف منحتني تأصيلاً علمياً عميقاً، وإتقاني للغة الإنجليزية بمستوى (IELTS C1) يمكنني من شرح أدق المسائل اللغوية بأسلوب سهل وطبيعي للمسلمين الناطقين بالإنجليزية.'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 border-t border-border-subtle mt-8">
                <div>
                  <p className="text-2xl font-editorial text-foreground">3+</p>
                  <p className="text-xs text-muted-foreground mt-1">{isEn ? 'Years Teaching' : 'سنوات خبرة'}</p>
                </div>
                <div>
                  <p className="text-2xl font-editorial text-foreground">Al-Azhar</p>
                  <p className="text-xs text-muted-foreground mt-1">{isEn ? 'Background' : 'خريج الأزهر'}</p>
                </div>
                <div>
                  <p className="text-2xl font-editorial text-foreground">IELTS C1</p>
                  <p className="text-xs text-muted-foreground mt-1">{isEn ? 'English Fluency' : 'إتقان الإنجليزية'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PublicSection>

      {/* 6. WHAT STUDENTS SAY */}
      <PublicSection id="testimonials" variant="warm">
        <EditorialHeading className="text-center mb-16">
          {isEn ? 'What students say' : 'آراء الطلاب'}
        </EditorialHeading>
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
          {AUTHENTIC_TESTIMONIALS.slice(0, 4).map((testimonial) => (
            <TestimonialQuote 
              key={testimonial.id}
              quote={testimonial.quote}
              name={testimonial.author}
              detail={`${testimonial.role} • ${testimonial.subject}`}
            />
          ))}
        </div>
      </PublicSection>

      {/* 7. PRICING PREVIEW */}
      <PublicSection>
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <EditorialHeading eyebrow={isEn ? 'Clear Pricing' : 'أسعار واضحة'} noAccent className="mx-auto flex flex-col items-center">
            {isEn ? 'Simple, transparent packages' : 'باقات بسيطة وشفافة'}
          </EditorialHeading>
          <p className="text-lg text-muted-foreground">
            {isEn 
              ? 'Lessons start from $4 per 30-minute session. Choose 30, 45, or 60-minute durations based on your stamina and schedule. No subscription traps, just prepaid packages you can use flexibly.'
              : 'تبدأ الدروس من ٤ دولارات للجلسة (٣٠ دقيقة). يمكنك اختيار ٣٠، ٤٥، أو ٦٠ دقيقة للدرس حسب ما يناسب وقتك وقدرتك.'}
          </p>
          <div className="pt-4">
            <PublicButton variant="secondary" onClick={() => onOpenTrialModal()}>
              {isEn ? 'View Pricing & Book Trial' : 'احجز جلسة تجريبية الآن'}
            </PublicButton>
          </div>
        </div>
      </PublicSection>

      {/* 8. FAQ & FINAL CTA */}
      <PublicSection id="contact" variant="transition-warm" className="border-t border-border-subtle">
        <div className="grid lg:grid-cols-12 gap-16">
          <div className="lg:col-span-5 space-y-6">
            <EditorialHeading noAccent>
              {isEn ? 'Ready to begin?' : 'هل أنت مستعد للبدء؟'}
            </EditorialHeading>
            <p className="text-muted-foreground leading-relaxed">
              {isEn 
                ? 'Take the first step with a free, no-obligation 30-minute trial. We’ll discuss your goals and create a plan.'
                : 'ابدأ بجلسة تجريبية مجانية للتعارف وتحديد المستوى بدون أي التزامات.'}
            </p>
            <PublicButton size="lg" onClick={() => onOpenTrialModal()} className="mt-4 w-full sm:w-auto">
              {isEn ? 'Book Free Trial' : 'احجز جلستك المجانية'}
            </PublicButton>
            <StudyLine className="my-8" />
            <MarginNote>
              {isEn ? 'Have questions? Contact directly on WhatsApp.' : 'لديك استفسار؟ تواصل مباشرة عبر واتساب.'}
            </MarginNote>
          </div>
          
          <div className="lg:col-span-7 space-y-8">
            <h3 className="font-editorial text-2xl text-foreground mb-6">
              {isEn ? 'Common Questions' : 'أسئلة شائعة'}
            </h3>
            {FAQS.slice(0, 4).map((faq, i) => (
              <div key={i} className="space-y-2">
                <h4 className="font-medium text-foreground">{faq.question}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </PublicSection>

    </main>
  );
}
