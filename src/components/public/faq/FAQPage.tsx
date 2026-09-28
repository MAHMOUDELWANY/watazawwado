import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote, PublicButton } from '../PublicDesignSystem';
import { FAQS } from '../../../data/content';

export function FAQPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-3xl mx-auto space-y-12">
          
          <div className="text-center space-y-6">
            <MarginNote className="mx-auto">
              {isEn ? 'Practical Questions' : 'أسئلة عملية'}
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground">
              {isEn ? 'Frequently Asked Questions' : 'الأسئلة الشائعة'}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {isEn 
                ? 'Everything you need to know about booking, learning, and the Watazawwado experience.'
                : 'كل ما تحتاج لمعرفته حول الحجز، والتعلم، وتجربة وتزودوا.'}
            </p>
          </div>

          <div className="pt-12 space-y-12">
            {FAQS.map((faq, index) => (
              <div key={index} className="space-y-3 relative ps-6 md:ps-0 md:border-t border-border-subtle md:pt-12">
                <span className="absolute left-0 md:left-auto md:-left-12 rtl:left-auto rtl:right-0 rtl:md:-right-12 top-0 md:top-12 text-sm font-editorial text-accent select-none">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl text-foreground">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-surface-warm p-8 sm:p-12 rounded-2xl border border-border-subtle text-center mt-16">
            <EditorialHeading noAccent className="mx-auto flex flex-col items-center">
              {isEn ? 'Still have questions?' : 'لا زال لديك أسئلة؟'}
            </EditorialHeading>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto mt-4">
              {isEn 
                ? 'The best way to get answers is to book a free trial, or contact Ustadh Mahmoud directly on WhatsApp.'
                : 'أفضل طريقة للحصول على إجابات هي حجز جلسة تجريبية مجانية، أو التواصل مع الأستاذ محمود مباشرة عبر واتساب.'}
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
