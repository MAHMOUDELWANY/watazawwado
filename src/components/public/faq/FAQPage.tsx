import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, PublicButton, PageHero } from '../PublicDesignSystem';
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
          
          <PageHero
            title={isEn ? <>Questions, <span className="text-ribbon">answered simply.</span></> : <>أسئلتك، <span className="text-ribbon">بإجابات بسيطة.</span></>}
            intro={isEn
              ? 'Booking, lessons, payment and Zoom. If something is missing, ask us on WhatsApp.'
              : 'الحجز والدروس والدفع وZoom. ولو سؤالك مش موجود، اسألنا على واتساب.'}
          />

          <div className="pt-2 space-y-8">
            {FAQS.map((faq, index) => (
              <div key={index} className="space-y-2.5 border-t border-border-subtle pt-8">
                <h2 className="font-editorial text-xl sm:text-2xl text-foreground font-bold">
                  {isEn ? faq.question : (faq.arabicQuestion || faq.question)}
                </h2>
                <p className="text-muted-foreground leading-relaxed text-base">
                  {isEn ? faq.answer : (faq.arabicAnswer || faq.answer)}
                </p>
              </div>
            ))}
          </div>

          <section className="band-deep relative overflow-hidden rounded-[2rem] px-6 py-12 sm:px-12 text-center mt-16">
            <h2 className="font-editorial text-3xl sm:text-4xl font-bold leading-tight">
              {isEn ? 'Still have a question?' : 'لسه عندك سؤال؟'}
            </h2>
            <p className="mt-3 text-base sm:text-lg leading-relaxed max-w-md mx-auto text-[#FAF7F2]/80">
              {isEn
                ? 'The easiest way is to book the free lesson and ask your teacher, or message us on WhatsApp.'
                : 'أسهل طريقة إنك تحجز الحصة المجانية وتسأل معلمك، أو تكلّمنا على واتساب.'}
            </p>
            <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
              <PublicButton variant="primary" size="lg" onClick={() => onOpenTrialModal()} className="w-full sm:w-auto">
                {isEn ? 'Book your free trial lesson' : 'احجز حصتك التجريبية المجانية'}
              </PublicButton>
              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu alaikum, I read the FAQ on Watazawwado and still have a question.' : 'السلام عليكم، قريت الأسئلة الشائعة على وتزودوا ولسه عندي سؤال.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full sm:w-auto items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold bg-[#25D366] text-[#07361F] hover:bg-[#20BD5A] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05363F] focus-visible:ring-[#25D366]"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Ask us on WhatsApp' : 'اسألنا على واتساب'}</span>
              </a>
            </div>
            <p className="mt-6 text-sm text-[#FAF7F2]/75 flex flex-wrap justify-center gap-x-5 gap-y-2">
              <Link to="/how-it-works" className="underline hover:text-[#FAF7F2]">{isEn ? 'How it works' : 'كيف نعمل'}</Link>
              <Link to="/learning" className="underline hover:text-[#FAF7F2]">{isEn ? 'The subjects' : 'المواد'}</Link>
              <Link to="/pricing" className="underline hover:text-[#FAF7F2]">{isEn ? 'Prices' : 'الأسعار'}</Link>
            </p>
          </section>

        </div>
      </PublicSection>
    </main>
  );
}
