import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, StudyLine, MarginNote, PublicButton } from '../PublicDesignSystem';
import { BrandGlassCard } from '../../ui/BrandGlassCard';

export function PricingPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-6">
            <MarginNote className="mx-auto">
              {isEn ? 'Clear Pricing' : 'أسعار واضحة'}
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground">
              {isEn ? 'Simple, transparent packages.' : 'باقات بسيطة وشفافة.'}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn 
                ? 'No subscription traps. No hidden fees. Just prepaid packages you can use flexibly for yourself or your family.'
                : 'لا توجد فخاخ اشتراكات ولا رسوم خفية. فقط باقات مسبقة الدفع يمكنك استخدامها بمرونة لنفسك أو لعائلتك.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-12">
            
            {/* Single Lessons */}
            <BrandGlassCard intensity="subtle" className="p-8">
              <h3 className="font-editorial text-2xl text-foreground mb-2">
                {isEn ? 'Single Lessons' : 'الدروس الفردية'}
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                {isEn ? 'Quran & Islamic Studies base rates.' : 'الأسعار الأساسية للقرآن والعلوم الإسلامية.'}
              </p>
              
              <ul className="space-y-4 font-medium text-foreground">
                <li className="flex justify-between items-center pb-4 border-b border-border-subtle/50">
                  <span>{isEn ? '30 minutes' : '٣٠ دقيقة'}</span>
                  <span>$4</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-border-subtle/50">
                  <span>{isEn ? '45 minutes' : '٤٥ دقيقة'}</span>
                  <span>$6</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>{isEn ? '60 minutes' : '٦٠ دقيقة'}</span>
                  <span>$8</span>
                </li>
              </ul>
              <div className="mt-6 pt-6 border-t border-border-subtle text-xs text-muted-foreground">
                {isEn 
                  ? '* Language lessons (Arabic/English) are priced differently ($6 / $9 / $12).'
                  : '* دروس اللغات (العربية/الإنلجيزية) تسعر بشكل مختلف (٦$ / ٩$ / ١٢$).'}
              </div>
            </div>

            {/* Monthly Packages */}
            <BrandGlassCard intensity="high" className="p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/20 rounded-bl-full -z-10" />
              <h3 className="font-editorial text-2xl text-foreground mb-2">
                {isEn ? 'Monthly Packages' : 'الباقات الشهرية'}
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                {isEn ? 'Prepaid bundles for consistent learning (60-min sessions).' : 'باقات مسبقة الدفع لتعلم مستمر (جلسات ٦٠ دقيقة).'}
              </p>
              
              <ul className="space-y-4 font-medium text-foreground">
                <li className="flex justify-between items-center pb-4 border-b border-border-subtle/50">
                  <span>{isEn ? '4 lessons' : '٤ دروس'}</span>
                  <span>$30</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-border-subtle/50">
                  <span>{isEn ? '8 lessons' : '٨ دروس'}</span>
                  <span>$58</span>
                </li>
                <li className="flex justify-between items-center pb-4 border-b border-border-subtle/50">
                  <span>{isEn ? '12 lessons' : '١٢ درس'}</span>
                  <span>$84</span>
                </li>
                <li className="flex justify-between items-center">
                  <span>{isEn ? '16 lessons' : '١٦ درس'}</span>
                  <span>$112</span>
                </li>
              </ul>
            </BrandGlassCard>

            {/* Weekly Packages */}
            <BrandGlassCard intensity="subtle" className="p-8 relative overflow-hidden lg:col-span-2">
              <h3 className="font-editorial text-2xl text-foreground mb-2">
                {isEn ? 'Weekly Packages' : 'الباقات الأسبوعية'}
              </h3>
              <p className="text-sm text-muted-foreground mb-8">
                {isEn ? 'Flexible weekly commitments.' : 'التزامات أسبوعية مرنة.'}
              </p>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { count: 1, price: 8 },
                  { count: 2, price: 15 },
                  { count: 3, price: 21 },
                  { count: 4, price: 28 },
                  { count: 5, price: 34 }
                ].map((pkg) => (
                  <div key={pkg.count} className="bg-background p-4 rounded-xl border border-border-subtle text-center">
                    <div className="text-sm text-muted-foreground mb-1">
                      {pkg.count} {isEn ? (pkg.count === 1 ? 'lesson' : 'lessons') : 'دروس'}
                    </div>
                    <div className="font-editorial text-2xl text-foreground">${pkg.price}</div>
                  </div>
                ))}
              </div>
            </BrandGlassCard>

          </div>

          <StudyLine className="my-16" />

          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <EditorialHeading noAccent eyebrow={isEn ? 'Family Management' : 'إدارة العائلة'}>
                {isEn ? 'Learn for your family' : 'تعلّم لعائلتك'}
              </EditorialHeading>
              <p className="text-muted-foreground leading-relaxed mt-4">
                {isEn 
                  ? 'A parent or account holder can manage learning for their children. You can purchase packages and allocate lessons to different family members under your account, providing complete visibility over their progress and schedule.'
                  : 'يمكن لولي الأمر أو صاحب الحساب إدارة تعلم أبنائه. يمكنك شراء الباقات وتخصيص الدروس لأفراد العائلة المختلفين تحت حسابك، مع توفير رؤية كاملة لتقدمهم وجدولهم.'}
              </p>
            </div>
            <div>
              <EditorialHeading noAccent eyebrow={isEn ? 'Flexibility' : 'المرونة'}>
                {isEn ? 'No recurring traps' : 'لا اشتراكات تلقائية'}
              </EditorialHeading>
              <p className="text-muted-foreground leading-relaxed mt-4">
                {isEn 
                  ? 'These are prepaid entitlements, not subscriptions. You will never be charged automatically. You buy a package and use the lessons according to the agreed schedule.'
                  : 'هذه استحقاقات مسبقة الدفع وليست اشتراكات. لن يتم الخصم منك تلقائياً أبداً. أنت تشتري باقة وتستخدم الدروس وفقاً للجدول المتفق عليه.'}
              </p>
            </div>
          </div>

          <div className="text-center pt-16">
            <h3 className="font-editorial text-2xl text-foreground mb-4">
              {isEn ? 'Ready to discuss your plan?' : 'مستعد لمناقشة خطتك؟'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isEn 
                ? 'We determine the right package and duration for you during the free trial.'
                : 'نحدد الباقة والمدة المناسبة لك خلال الجلسة التجريبية المجانية.'}
            </p>
            <PublicButton size="lg" onClick={() => onOpenTrialModal()}>
              {isEn ? 'Book Free Trial' : 'احجز جلستك المجانية'}
            </PublicButton>
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
