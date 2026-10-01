import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, MarginNote, PublicButton } from '../PublicDesignSystem';
import { FAQS } from '../../../data/content';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

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
                <span className="absolute left-0 md:left-auto md:-left-12 rtl:left-auto rtl:right-0 rtl:md:-right-12 top-0 md:top-12 text-sm font-editorial text-accent select-none font-bold">
                  {(index + 1).toString().padStart(2, '0')}
                </span>
                <h3 className="font-editorial text-xl sm:text-2xl text-foreground font-semibold">
                  {isEn ? faq.question : (faq.arabicQuestion || faq.question)}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {isEn ? faq.answer : (faq.arabicAnswer || faq.answer)}
                </p>
              </div>
            ))}
          </div>

          <div className="glass-card p-8 sm:p-12 rounded-2xl border border-border-subtle text-center mt-16">
            <EditorialHeading noAccent className="mx-auto flex flex-col items-center">
              {isEn ? 'Still have questions?' : 'لا زال لديك أسئلة؟'}
            </EditorialHeading>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto mt-4">
              {isEn 
                ? 'The best way to get answers is to book a free trial, or contact Ustadh Mahmoud directly on WhatsApp.'
                : 'أفضل طريقة للحصول على إجابات هي حجز جلسة تجريبية مجانية، أو التواصل مع الأستاذ محمود مباشرة عبر واتساب.'}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PublicButton size="lg" onClick={() => onOpenTrialModal()}>
                {isEn ? 'Book Free Trial' : 'احجز جلستك المجانية'}
              </PublicButton>

              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I have a question after reading the FAQ page.' : 'السلام عليكم أستاذ محمود، لدي استفسار بعد قراءة صفحة الأسئلة الشائعة.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-solid py-3 px-6 rounded-xl text-sm font-bold shadow-xs hover:scale-105 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Ask Mahmoud on WhatsApp' : 'اسأل محمود على واتساب'}</span>
              </a>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <Link to="/how-it-works" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'How It Works (Process)' : 'كيف نعمل (خطوات التعلم)'}
              </Link>
              <span>•</span>
              <Link to="/learning" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'Study Tracks' : 'مسارات التعلم'}
              </Link>
              <span>•</span>
              <Link to="/pricing" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'Pricing & Packages' : 'الأسعار والباقات'}
              </Link>
            </div>
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
