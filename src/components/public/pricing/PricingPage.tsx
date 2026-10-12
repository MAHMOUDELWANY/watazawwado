import React, { useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, MarginNote, PublicButton } from '../PublicDesignSystem';
import { InteractivePocketCard, PricingPlan } from './InteractivePocketCard';
import { InstantCheckoutModal } from '../../payment/InstantCheckoutModal';
import { Clock, ShieldCheck, HeartHandshake, Sparkles, CheckCircle2, Info, CreditCard } from 'lucide-react';

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);

  // Exactly 3 clean plans with updated rate baseline ($9 - $8/lesson)
  const monthlyPlans: PricingPlan[] = [
    {
      id: 'pkg-4',
      name: 'Starter Pace',
      arabicName: 'باقة التأسيس والبداية',
      subtitle: '1 private session per week for a calm, sustainable habit.',
      arabicSubtitle: 'حصة واحدة أسبوعياً لتأسيس سليم وثابت دون أي ضغط على جدولك.',
      lessonsCount: 4,
      durationMin: 60,
      price: 36,
      perLessonPrice: 9.0,
      badge: 'Starter',
      arabicBadge: 'بداية ميسرة',
      psychologicalHook: '✨ Ideal for beginners & busy schedules',
      arabicPsychologicalHook: '✨ الأنسب للمبتدئين وأصحاب الجداول المزدحمة',
      unitComparison: 'Equivalent to $9.00 / session',
      arabicUnitComparison: 'استثمار ميسر يعادل $9.00 فقط للحصة',
      features: [
        '4 private 1-on-1 Zoom sessions (60 min)',
        'Direct WhatsApp voice notes & recitation checks',
        'Free rescheduling up to 3 hours before session',
        'Personalized pace adapted to your level'
      ],
      arabicFeatures: [
        '٤ حصص فردية خاصة عبر زووم (٦٠ دقيقة)',
        'متابعة وتصحيح صوتي مباشر بين الحصص',
        'إمكانية إعادة الجدولة مجاناً حتى ٣ ساعات قبل الدرس',
        'منهج مخصص بالكامل يناسب سرعتك وهدفك'
      ]
    },
    {
      id: 'pkg-8',
      name: 'Consistent Growth',
      arabicName: 'باقة الاستمرار والانتظام',
      subtitle: '2 private sessions per week — the proven rhythm for Quran fluency.',
      arabicSubtitle: 'حصتان أسبوعياً — الوتيرة الذهبية المعتمدة للتقدم الملموس في التلاوة والتجويد.',
      lessonsCount: 8,
      durationMin: 60,
      price: 68,
      perLessonPrice: 8.5,
      badge: 'Most Popular',
      arabicBadge: 'الأكثر طلباً واختياراً',
      isPopular: true,
      savingBadge: 'Best Value',
      arabicSavingBadge: 'الخيار الذهبي الموصى به',
      psychologicalHook: '⭐️ Chosen by 85% of active students for true retention',
      arabicPsychologicalHook: '⭐️ يختارها ٨٥٪ من الطلاب لضمان رسوخ الحفظ وعدم النسيان',
      unitComparison: 'Just $8.50 per full 60-min private lesson',
      arabicUnitComparison: 'فقط $8.50 للحصة الخاصة الكاملة (وفر مميز)',
      features: [
        '8 private 1-on-1 Zoom sessions (60 min)',
        'Priority daily WhatsApp homework feedback',
        'Shareable with 1 child under the same family account',
        'Continuous Tajweed & Hifz progress tracking'
      ],
      arabicFeatures: [
        '٨ حصص فردية خاصة عبر زووم (٦٠ دقيقة)',
        'أولوية المتابعة اليومية وتصحيح الحفظ والتجويد',
        'إمكانية مشاركة رصيد الحصص مع أحد الأبناء',
        'تقارير دورية لمتابعة الإتقان ورسوخ الحفظ'
      ]
    },
    {
      id: 'pkg-12',
      name: 'Intensive Track',
      arabicName: 'باقة الإتقان والتثبيت',
      subtitle: '3 private sessions per week for rapid memorization or Arabic grammar.',
      arabicSubtitle: '٣ حصص أسبوعياً للحفظ المتقن السريع ودراسة قواعد النحو العربي.',
      lessonsCount: 12,
      durationMin: 60,
      price: 96,
      perLessonPrice: 8.0,
      badge: 'Maximum Progress',
      arabicBadge: 'أعلى وتيرة إنجاز',
      savingBadge: 'Lowest Per-Lesson Rate',
      arabicSavingBadge: 'أقل سعر للحصة ($8.00)',
      psychologicalHook: '🚀 Maximum results with lowest cost per lesson',
      arabicPsychologicalHook: '🚀 أقصى سرعة إنجاز مع أعلى وفر في تكلفة الحصة',
      unitComparison: 'Lowest rate: only $8.00 per hour',
      arabicUnitComparison: 'أقل سعر للحصة: فقط $8.00 للساعة الكاملة',
      features: [
        '12 private 1-on-1 Zoom sessions (60 min)',
        'Deep grammar & Tajweed drills with progress reports',
        'Allocatable between 2 siblings in family profile',
        'Direct priority messaging with Ustadh Mahmoud'
      ],
      arabicFeatures: [
        '١٢ حصة فردية مكثفة عبر زووم (٦٠ دقيقة)',
        'تدريبات لغوية وتجويدية متقدمة وتقارير إنجاز دورية',
        'إمكانية توزيع الرصيد بين طالبين من العائلة',
        'أولوية التواصل المباشر وتثبيت المراجعة'
      ]
    }
  ];

  const handleSelectPlan = (_plan: PricingPlan) => {
    onOpenTrialModal();
  };

  const handleInstantCheckout = (plan: PricingPlan) => {
    setCheckoutPlan(plan);
  };

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-12">
          
          {/* Header */}
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <MarginNote className="mx-auto">
              {isEn ? 'Transparent Prepaid Packages' : 'باقات مسبقة الدفع • أسعار شفافة وبسيطة'}
            </MarginNote>
            
            <h1 className="font-editorial text-3xl sm:text-4xl lg:text-5xl text-foreground font-bold tracking-tight">
              {isEn ? 'Choose the pace that fits your goal' : 'اختر الوتيرة المناسبة لهدفك ووقتك'}
            </h1>
            
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              {isEn 
                ? 'Prepaid monthly lesson bundles with full schedule flexibility, automated PayPal & Stripe checkout, and zero surprise auto-debits.'
                : 'باقات شهرية مسبقة الدفع تحدد مواعيدها بحرية كاملة، مع دفع إلكتروني مباشر وتأكيد فوري دون أي سحب آلي متكرر.'}
            </p>
          </div>

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
                  ? 'Standard Quran recitation, Noorani Qaida, and Islamic foundations start at $9/hour. Advanced specialized subjects—such as Modern Standard Arabic (Fusha grammar), Egyptian Colloquial Arabic, Advanced Fiqh, and Academic English—range up to $13/hour depending on specific curriculum requirements and custom teacher preparation.'
                  : 'المسارات التأسيسية وتلاوة القرآن والقاعدة النورانية تبدأ من ٩$ للساعة. المواد التخصصية المتقدمة — مثل قواعد النحو العربي والفصحى، اللهجة المصرية، الفقه المقارن المتقدم، واللغة الإنجليزية — تتراوح حتى ١٣$ للساعة بحسب الاحتياج الأكاديمي والتحضير الخاص المطلوب من المعلم.'}
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
                  {isEn ? 'Reschedule anytime up to 3h before session' : 'إعادة جدولة مجاناً حتى ٣ ساعات قبل الدرس'}
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
                  {isEn ? 'Direct Stripe & PayPal Live integration' : 'بوابات رسمية معتمدة عبر Stripe و PayPal'}
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

      {/* Instant Checkout Modal for Direct Package Purchase */}
      {checkoutPlan && (
        <InstantCheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          targetType="package"
          targetId={checkoutPlan.id}
          itemTitle={isEn ? checkoutPlan.name : checkoutPlan.arabicName}
          amount={checkoutPlan.price}
          currency="USD"
          lang={isEn ? 'en' : 'ar'}
          onSuccess={() => setCheckoutPlan(null)}
        />
      )}
    </main>
  );
}
