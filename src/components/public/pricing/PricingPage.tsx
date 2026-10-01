import React, { useState, useEffect } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, MarginNote, PublicButton } from '../PublicDesignSystem';
import { InteractivePocketCard, PricingPlan } from './InteractivePocketCard';
import { Clock, ShieldCheck, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  // Initially closed on desktop; auto-revealed on scroll for touch devices
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Auto-expand card on mobile as the user scrolls to it
  useEffect(() => {
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;

    const cards = document.querySelectorAll('[data-pricing-plan-id]');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const planId = entry.target.getAttribute('data-pricing-plan-id');
            if (planId) {
              setExpandedCardId(planId);
            }
          }
        });
      },
      {
        rootMargin: '-20% 0px -20% 0px',
        threshold: 0.35,
      }
    );

    cards.forEach((card) => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  // Exactly 3 clean plans with expert psychological pricing framing
  const monthlyPlans: PricingPlan[] = [
    {
      id: 'pkg-4',
      name: 'Starter Pace',
      arabicName: 'باقة التأسيس والبداية',
      subtitle: '1 private session per week for a calm, sustainable habit.',
      arabicSubtitle: 'حصة واحدة أسبوعياً لتأسيس سليم وثابت دون أي ضغط على جدولك.',
      lessonsCount: 4,
      durationMin: 60,
      price: 30,
      perLessonPrice: 7.5,
      badge: 'Starter',
      arabicBadge: 'بداية ميسرة',
      psychologicalHook: '✨ Ideal for beginners & busy schedules',
      arabicPsychologicalHook: '✨ الأنسب للمبتدئين وأصحاب الجداول المزدحمة',
      unitComparison: 'Equivalent to $7.50 / week',
      arabicUnitComparison: 'استثمار أسبوعي رمزي يعادل $7.5 فقط',
      features: [
        '4 private 1-on-1 Zoom sessions (60 min)',
        'Direct WhatsApp voice notes & recitation checks',
        'Free rescheduling up to 3 hours before session'
      ],
      arabicFeatures: [
        '٤ حصص فردية خاصة عبر زووم (٦٠ دقيقة)',
        'متابعة وتصحيح صوتي مباشر بين الحصص',
        'إمكانية إعادة الجدولة مجاناً حتى ٣ ساعات قبل الدرس'
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
      price: 58,
      perLessonPrice: 7.25,
      badge: 'Most Popular',
      arabicBadge: 'الأكثر طلباً واختياراً',
      isPopular: true,
      savingBadge: 'Best Value',
      arabicSavingBadge: 'الخيار الذهبي الموصى به',
      psychologicalHook: '⭐️ Chosen by 85% of active students for true retention',
      arabicPsychologicalHook: '⭐️ يختارها ٨٥٪ من الطلاب لضمان رسوخ الحفظ وعدم النسيان',
      unitComparison: 'Just $7.25 per full 60-min private lesson',
      arabicUnitComparison: 'فقط $7.25 للحصة الخاصة الكاملة (أقل من ثمن وجبة خفيفة)',
      features: [
        '8 private 1-on-1 Zoom sessions (60 min)',
        'Priority daily WhatsApp homework feedback',
        'Shareable with 1 child under the same family account'
      ],
      arabicFeatures: [
        '٨ حصص فردية خاصة عبر زووم (٦٠ دقيقة)',
        'أولوية المتابعة اليومية وتصحيح الحفظ والتجويد',
        'إمكانية مشاركة رصيد الحصص مع أحد الأبناء'
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
      price: 84,
      perLessonPrice: 7.0,
      badge: 'Maximum Progress',
      arabicBadge: 'أعلى وتيرة إنجاز',
      savingBadge: 'Lowest Per-Lesson Rate',
      arabicSavingBadge: 'أقل سعر للحصة ($7.00)',
      psychologicalHook: '🚀 Maximum results with lowest cost per lesson',
      arabicPsychologicalHook: '🚀 أقصى سرعة إنجاز مع أعلى وفر في تكلفة الحصة',
      unitComparison: 'Lowest rate: only $7.00 per hour',
      arabicUnitComparison: 'أقل سعر للحصة: فقط $7.00 للساعة الكاملة',
      features: [
        '12 private 1-on-1 Zoom sessions (60 min)',
        'Deep grammar & Tajweed drills with progress reports',
        'Allocatable between 2 siblings in family profile'
      ],
      arabicFeatures: [
        '١٢ حصة فردية مكثفة عبر زووم (٦٠ دقيقة)',
        'تدريبات لغوية وتجويدية متقدمة وتقارير إنجاز دورية',
        'إمكانية توزيع الرصيد بين طالبين من العائلة'
      ]
    }
  ];

  const handleSelectPlan = (_plan: PricingPlan) => {
    // Single clear flow: trial session first to verify level with Ustadh Mahmoud
    onOpenTrialModal();
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
                ? 'Prepaid monthly lesson bundles with full schedule flexibility and no surprise auto-debits.'
                : 'باقات شهرية مسبقة الدفع تحدد مواعيدها بحرية كاملة، بدون أي تجديد تلقائي أو خصومات مفاجئة.'}
            </p>

            {/* Interactive hint */}
            <p className="text-xs text-muted-foreground font-medium pt-2 pb-4">
              {isEn 
                ? '👆 Tap or hover on any package envelope to reveal pricing breakdown.' 
                : '👆 اسحب أو مرر الفأرة فوق أي ظرف لكشف تفاصيل السعر ومزايا الباقة.'}
            </p>
          </div>

          {/* Interactive Pocket Cards (Uniform Height & Clear Spacing) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 lg:gap-8 pt-2 pb-14">
            {monthlyPlans.map((plan) => {
              const isCardExpanded = expandedCardId === plan.id;
              return (
                <InteractivePocketCard
                  key={plan.id}
                  plan={plan}
                  lang={lang}
                  isExpanded={isCardExpanded}
                  onToggle={() => {
                    setExpandedCardId(expandedCardId === plan.id ? null : plan.id);
                  }}
                  onSelectPlan={handleSelectPlan}
                />
              );
            })}
          </div>

          {/* 3 Calm Trust Points */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl glass-card border border-border/80 text-xs sm:text-sm mt-8">
            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
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
              <span className="p-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-foreground">
                  {isEn ? 'Zero Automatic Debits' : 'لا يوجد سحب آلي'}
                </h5>
                <p className="text-muted-foreground text-xs">
                  {isEn ? 'Prepaid credit, you decide when to renew' : 'أنت من يقرر متى يجدد رصيده'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="p-2 rounded-xl bg-teal-500/15 text-teal-700 dark:text-teal-300 shrink-0">
                <HeartHandshake className="w-4 h-4" />
              </span>
              <div>
                <h5 className="font-bold text-foreground">
                  {isEn ? 'Direct Personal Guidance' : 'متابعة مباشرة مع المعلم'}
                </h5>
                <p className="text-muted-foreground text-xs">
                  {isEn ? 'Direct teacher communication on WhatsApp' : 'تواصل وتصحيح صوتي مع محمود'}
                </p>
              </div>
            </div>
          </div>

          {/* Single Focused Page Action */}
          <div className="text-center pt-4 max-w-xl mx-auto space-y-4">
            <p className="text-sm text-muted-foreground">
              {isEn 
                ? 'Want to experience the teaching style first? Book a complimentary 30-minute introductory lesson.'
                : 'هل تفضل تجربة أسلوب الشرح أولاً؟ احجز جلسة تعارف مجانية مدتها ٣٠ دقيقة بدون أي مقابل.'}
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
