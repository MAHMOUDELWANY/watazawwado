import React from 'react';
import { useOutletContext } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, StudyLine, MarginNote, PortraitFrame, PublicButton } from '../PublicDesignSystem';

export function AboutPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">
          
          <div className="text-center space-y-6">
            <MarginNote className="mx-auto">
              {isEn ? 'About the Teacher' : 'عن المعلم'}
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl text-foreground">
              {isEn ? 'A human connection to learning.' : 'علاقة إنسانية مع التعلم.'}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              {isEn 
                ? 'Watazawwado is not a marketplace or an agency. It is a dedicated, personal teaching practice where every lesson is a direct relationship between student and teacher.'
                : 'وتزودوا ليس منصة تجارية أو وسيطاً تعليمياً. إنها مساحة تعليمية شخصية حيث كل درس يمثل علاقة مباشرة بين المعلم والطالب.'}
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-12 items-center pt-12">
            <div className="md:col-span-5 relative">
              <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" className="w-full max-w-sm mx-auto md:mx-0" />
              <div className="absolute -bottom-6 -right-6 rtl:-right-auto rtl:-left-6 glass-card p-4 rounded-lg shadow-sm border border-border-subtle max-w-[200px] hidden sm:block">
                <StudyLine variant="accent" className="my-2" />
                <p className="text-xs text-muted-foreground">
                  {isEn ? 'Al-Azhar educated. IELTS C1 Certified.' : 'خريج الأزهر الشريف. معتمد بشهادة IELTS C1.'}
                </p>
              </div>
            </div>
            
            <div className="md:col-span-7 space-y-6">
              <EditorialHeading eyebrow={isEn ? 'Background' : 'خلفية المعلم'} noAccent>
                {isEn ? 'Ustadh Mahmoud' : 'الأستاذ محمود'}
              </EditorialHeading>
              
              <div className="prose prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p>
                  {isEn 
                    ? 'Peace be upon you. I am Mahmoud, an independent teacher of the Quran, Arabic, and Islamic Studies. For over 3 years, I have taught students 1-on-1 across Canada, the US, the UK, and Australia.'
                    : 'السلام عليكم ورحمة الله وبركاته. أنا محمود، معلم مستقل للقرآن الكريم واللغة العربية والدراسات الإسلامية. لأكثر من ٣ سنوات، أقوم بتدريس الطلاب بشكل فردي في كندا، أمريكا، بريطانيا، وأستراليا.'}
                </p>
                <p>
                  {isEn
                    ? 'Education is a deep responsibility. My classical grounding at Al-Azhar in Egypt provided me with the necessary foundation in Islamic sciences, while my English proficiency (IELTS C1) allows me to bridge the gap for international students, explaining precise pronunciation and complex grammar naturally.'
                    : 'التعليم مسؤولية عميقة. دراستي في الأزهر الشريف وفرت لي التأصيل العلمي اللازم، بينما مكنتني لغتي الإنجليزية (IELTS C1) من سد الفجوة للطلاب الدوليين لشرح أدق القواعد بطريقة طبيعية.'}
                </p>
              </div>
            </div>
          </div>

          <StudyLine className="my-16" />

          <div className="space-y-12">
            <EditorialHeading className="text-center" noAccent>
              {isEn ? 'Teaching Philosophy' : 'فلسفة التدريس'}
            </EditorialHeading>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-surface-warm p-8 rounded-xl border border-border-subtle">
                <h3 className="font-editorial text-xl text-foreground mb-3">
                  {isEn ? 'Start from where you are' : 'نبدأ من مستواك الفعلي'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn 
                    ? 'No student is behind. Whether you cannot read a single Arabic letter or have partial memorization that feels rusty, we begin without judgment and build a solid foundation.'
                    : 'لا يوجد طالب متأخر. سواء كنت لا تقرأ حرفاً واحداً، أو لديك حفظ قديم تحتاج لمراجعته، نبدأ معاً بدون أي أحكام لبناء أساس متين.'}
                </p>
              </div>
              <div className="bg-surface-warm p-8 rounded-xl border border-border-subtle">
                <h3 className="font-editorial text-xl text-foreground mb-3">
                  {isEn ? 'A safe space to make mistakes' : 'بيئة آمنة تخلو من الحرج'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn 
                    ? 'Reciting the Quran or speaking a new language can provoke anxiety. Lessons are calm, encouraging, and patient. Every correction is delivered with kindness.'
                    : 'تعلم لغة جديدة أو تلاوة القرآن قد يسبب التوتر. لذلك نحرص على أن تكون الدروس هادئة ومشجعة، وكل تصحيح يتم بصبر ولطف.'}
                </p>
              </div>
              <div className="bg-surface-warm p-8 rounded-xl border border-border-subtle">
                <h3 className="font-editorial text-xl text-foreground mb-3">
                  {isEn ? 'Continuity & Context' : 'الاستمرارية والفهم الشخصي'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn 
                    ? 'Because you learn with the same teacher every time, your progress is tracked carefully. I understand how you learn, what you struggle with, and how to encourage you.'
                    : 'لأنك تتعلم مع نفس المعلم في كل مرة، يتم تتبع تقدمك بدقة. المعلم يفهم طريقتك في التعلم، وما تواجهه من صعوبات، وكيف يشجعك.'}
                </p>
              </div>
              <div className="bg-surface-warm p-8 rounded-xl border border-border-subtle">
                <h3 className="font-editorial text-xl text-foreground mb-3">
                  {isEn ? 'Direct Relationship' : 'تواصل مباشر بدون وسطاء'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn 
                    ? 'You are not a ticket number. You message your teacher directly on WhatsApp when you have a question between lessons or need to adjust your schedule.'
                    : 'أنت لست مجرد رقم. يمكنك مراسلة معلمك مباشرة عبر واتساب عندما يكون لديك سؤال أو تحتاج لتعديل موعدك.'}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center pt-16">
            <h3 className="font-editorial text-2xl text-foreground mb-4">
              {isEn ? 'Ready to meet?' : 'مستعد للبدء؟'}
            </h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              {isEn 
                ? 'Book a free 30-minute trial to experience this teaching philosophy directly.'
                : 'احجز جلسة تجريبية مجانية لمدة ٣٠ دقيقة لتجربة هذه الفلسفة بشكل مباشر.'}
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
