import React from 'react';
import { useOutletContext, Link, useNavigate } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, MarginNote, PublicButton, PageHero } from '../PublicDesignSystem';
import { InteractivePocketCard, PricingPlan } from './InteractivePocketCard';
import { Clock, ShieldCheck, HeartHandshake, Sparkles, CheckCircle2, Info, CreditCard } from 'lucide-react';

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const navigate = useNavigate();

  // Approved $9/hour group packages (RULES.md §4, docs/pricing/packages.md). Display only:
  // the server catalog charges the real price. Honest wording only, no invented social proof.
  const monthlyPlans: PricingPlan[] = [
    {
      id: 'pkg-4',
      name: 'Steady Start',
      arabicName: 'بداية ثابتة',
      subtitle: '1 lesson a week: a calm, steady habit.',
      arabicSubtitle: 'حصة كل أسبوع: عادة هادية وثابتة.',
      lessonsCount: 4,
      durationMin: 60,
      price: 34,
      perLessonPrice: 8.5,
      badge: 'Starter',
      arabicBadge: 'بداية',
      psychologicalHook: 'You save $2 compared with single lessons',
      arabicPsychologicalHook: 'بتوفّر 2$ مقارنة بالحصص الفردية',
      unitComparison: '$8.50 per 60-minute lesson',
      arabicUnitComparison: '8.50$ للحصة (60 دقيقة)',
      features: [
        '4 private 1-on-1 lessons (60 min)',
        'Book each lesson whenever it suits you',
        'Cancel up to 3 hours before, move up to 1 hour before',
        'A plan that fits your level and pace'
      ],
      arabicFeatures: [
        '4 حصص فردية خاصة (60 دقيقة)',
        'احجز كل حصة في الوقت اللي يناسبك',
        'إلغاء حتى 3 ساعات قبل الحصة، وتغيير الموعد حتى ساعة قبلها',
        'خطة على قد مستواك وسرعتك'
      ]
    },
    {
      id: 'pkg-8',
      name: 'Committed Learner',
      arabicName: 'طالب ملتزم',
      subtitle: '2 lessons a week: steady progress you can feel.',
      arabicSubtitle: 'حصتين كل أسبوع: تقدّم ثابت تحس بيه.',
      lessonsCount: 8,
      durationMin: 60,
      price: 66,
      perLessonPrice: 8.25,
      badge: 'Balanced',
      arabicBadge: 'متوازنة',
      isPopular: true,
      savingBadge: 'You save $6',
      arabicSavingBadge: 'بتوفّر 6$',
      psychologicalHook: 'A good rhythm for memorization and revision',
      arabicPsychologicalHook: 'وتيرة مناسبة للحفظ والمراجعة',
      unitComparison: '$8.25 per 60-minute lesson',
      arabicUnitComparison: '8.25$ للحصة (60 دقيقة)',
      features: [
        '8 private 1-on-1 lessons (60 min)',
        'Book each lesson whenever it suits you',
        'Cancel up to 3 hours before, move up to 1 hour before',
        'Family care: 5% off for a second child'
      ],
      arabicFeatures: [
        '8 حصص فردية خاصة (60 دقيقة)',
        'احجز كل حصة في الوقت اللي يناسبك',
        'إلغاء حتى 3 ساعات قبل الحصة، وتغيير الموعد حتى ساعة قبلها',
        'رعاية الأسرة: خصم 5% للطفل التاني'
      ]
    },
    {
      id: 'pkg-12',
      name: 'Fast Progress',
      arabicName: 'تقدّم أسرع',
      subtitle: '3 lessons a week for faster memorization or study.',
      arabicSubtitle: '3 حصص كل أسبوع لحفظ أو دراسة أسرع.',
      lessonsCount: 12,
      durationMin: 60,
      price: 96,
      perLessonPrice: 8.0,
      badge: 'Best price per lesson',
      arabicBadge: 'أقل سعر للحصة',
      savingBadge: 'You save $12',
      arabicSavingBadge: 'بتوفّر 12$',
      psychologicalHook: 'The lowest price per lesson',
      arabicPsychologicalHook: 'أقل سعر للحصة',
      unitComparison: '$8.00 per 60-minute lesson',
      arabicUnitComparison: '8$ للحصة (60 دقيقة)',
      features: [
        '12 private 1-on-1 lessons (60 min)',
        'Book each lesson whenever it suits you',
        'Cancel up to 3 hours before, move up to 1 hour before',
        'Family care: 5% off for a second child'
      ],
      arabicFeatures: [
        '12 حصة فردية خاصة (60 دقيقة)',
        'احجز كل حصة في الوقت اللي يناسبك',
        'إلغاء حتى 3 ساعات قبل الحصة، وتغيير الموعد حتى ساعة قبلها',
        'رعاية الأسرة: خصم 5% للطفل التاني'
      ]
    }
  ];

  const handleSelectPlan = (_plan: PricingPlan) => {
    onOpenTrialModal();
  };

  // Packages are bought from the student portal, which creates a real entitlement to pay for.
  const handleInstantCheckout = (_plan: PricingPlan) => {
    navigate('/student/packages');
  };

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-12">
          
          <PageHero
            title={isEn ? <>Clear prices, <span className="text-ribbon">at your own pace.</span></> : <>أسعار واضحة، <span className="text-ribbon">وبالوتيرة اللي تناسبك.</span></>}
            intro={isEn
              ? 'Packages of 4, 8 or 12 lessons at a lower price per lesson. Book the times yourself and pay once, securely, with Stripe. No subscription and nothing renews automatically.'
              : 'باقات من ٤ أو ٨ أو ١٢ حصة بسعر أقل للحصة. تحجز مواعيدك بنفسك وتدفع مرة واحدة بأمان عبر Stripe. مفيش اشتراك ولا تجديد تلقائي.'}
          />

          {/* Pricing Cards Grid (Always Visible, Responsive, No Envelope Jumping) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 lg:gap-8 pt-2 pb-6">
            {monthlyPlans.map((plan) => (
              <InteractivePocketCard
                key={plan.id}
                plan={plan}
                lang={lang}
                onSelectPlan={handleSelectPlan}
                onInstantCheckout={handleInstantCheckout}
              />
            ))}
          </div>

          {/* Transparent Rate Policy Banner ($9 - $13 Structure) */}
          <div className="p-5 sm:p-6 rounded-3xl glass-card border border-border/80 flex items-start gap-3.5 text-xs sm:text-sm">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <strong className="text-foreground font-semibold block">
                {isEn ? 'Transparent Rate Policy & Specialized Tracks:' : 'سياسة الأسعار الواضحة والمسارات التخصصية:'}
              </strong>
              <p className="text-muted-foreground">
                {isEn 
                  ? 'Quran, Tajweed and all Islamic studies are $9 per hour. Arabic (MSA and Egyptian) and English start from $13 per hour. Shorter lessons cost the same rate per minute (30 minutes = half). Advanced, specialized or intensive learning, including advanced Fiqh, can cost more: your teacher sets that price after an assessment, and you always see it before you pay. The packages above are for the $9 group; Arabic and English packages are on the packages page after you sign in.'
                  : 'القرآن والتجويد وكل العلوم الشرعية بـ 9$ للساعة. العربية (الفصحى والمصرية) والإنجليزية تبدأ من 13$ للساعة. الحصص الأقصر بنفس السعر للدقيقة (30 دقيقة = النص). التعليم المتقدم أو المتخصص أو المكثف، ومنه الفقه المتقدم، ممكن يكون سعره أعلى: المعلم بيحدده بعد تقييم المستوى، ودايماً بتشوفه قبل ما تدفع. الباقات اللي فوق لمجموعة 9$، وباقات العربي والإنجليزي موجودة في صفحة الباقات بعد تسجيل الدخول.'}
              </p>
            </div>
          </div>

          {/* 3 Calm Trust Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl glass-card border border-border/80 text-xs sm:text-sm">
            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Clock className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-foreground">
                  {isEn ? 'Flexible 3-Hour Notice' : 'مرونة الإلغاء والتعديل'}
                </h5>
                <p className="text-muted-foreground text-xs">
                  {isEn ? 'Reschedule free up to 1 hour before' : 'تغيير الموعد مجاناً حتى ساعة قبل الدرس'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-foreground">
                  {isEn ? 'Automated & Encrypted' : 'دفع مشفر وتأكيد فوري'}
                </h5>
                <p className="text-muted-foreground text-xs">
                  {isEn ? 'Secure Stripe checkout (cards, Apple Pay, PayPal)' : 'دفع آمن عبر Stripe (بطاقات، Apple Pay، PayPal)'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-foreground">
                  {isEn ? 'Direct Personal Guidance' : 'متابعة مباشرة مع المعلم'}
                </h5>
                <p className="text-muted-foreground text-xs">
                  {isEn ? 'Direct teacher communication on WhatsApp' : 'تواصل وتصحيح صوتي مباشر مع المعلم'}
                </p>
              </div>
            </div>
          </div>

          {/* Single Focused Page Action */}
          <div className="text-center pt-4 max-w-xl mx-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEn 
                ? 'Want to experience the teaching style first? Book a complimentary 30-minute introductory lesson.'
                : 'هل تفضل تجربة أسلوب الشرح أولاً؟ احجز جلسة تعارف مجانية مدتها ٣٠ دقيقة بدون أي مقابل مسبق.'}
            </p>

            <div>
              <PublicButton size="lg" onClick={() => onOpenTrialModal()} className="px-8 py-3.5 shadow-md">
                {isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك المجانية الآن'}
              </PublicButton>
            </div>

            {/* Subtle Cross-links preserving language */}
            <div className="pt-4 flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/how-it-works" className="hover:text-foreground font-medium underline transition-colors">
                {isEn ? 'How It Works' : 'كيف نعمل'}
              </Link>
              <span>•</span>
              <Link to="/learning" className="hover:text-foreground font-medium underline transition-colors">
                {isEn ? 'Curriculum' : 'مجالات الدراسة'}
              </Link>
              <span>•</span>
              <Link to="/faq" className="hover:text-foreground font-medium underline transition-colors">
                {isEn ? 'FAQ' : 'الأسئلة الشائعة'}
              </Link>
            </div>
          </div>

        </div>
      </PublicSection>

    </main>
  );
}
