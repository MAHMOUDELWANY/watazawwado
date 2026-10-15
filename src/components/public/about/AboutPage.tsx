import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, EditorialHeading, StudyLine, MarginNote, PortraitFrame, PublicButton, PageHero } from '../PublicDesignSystem';
import { WhatsAppIcon } from '../../ui/WhatsAppIcon';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

export function AboutPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-16">
      <PublicSection>
        <div className="max-w-4xl mx-auto space-y-12">

          <PageHero
            title={isEn ? <>A human connection <span className="text-ribbon">to learning.</span></> : <>علاقة إنسانية <span className="text-ribbon">مع التعلّم.</span></>}
            intro={isEn
              ? 'Watazawwado is not a marketplace or an agency. It is a small, personal teaching practice where every lesson is a direct relationship between a student and their teacher.'
              : 'وتزودوا مش منصة تجارية ولا وسيط. هي مساحة تعليمية صغيرة وشخصية، كل درس فيها علاقة مباشرة بين الطالب ومعلمه.'}
          />

          <div className="grid md:grid-cols-12 gap-12 items-center pt-12">
            <div className="md:col-span-5 relative">
              <div className="absolute -inset-4 bg-gradient-to-tr from-teal-500/20 via-primary/10 to-terracotta/20 rounded-3xl -z-10 blur-xl transform rotate-2" />
              <PortraitFrame src="/ustadh-mahmoud.jpg" alt="Ustadh Mahmoud" className="w-full max-w-sm mx-auto md:mx-0 shadow-xl" />
              <div className="absolute -bottom-6 -right-6 rtl:-right-auto rtl:-left-6 glass-card p-4 rounded-xl shadow-lg border border-teal-500/30 max-w-[220px] hidden sm:block">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>{isEn ? 'Balanced, moderate teaching' : 'علم وسطي معتدل'}</span>
                </div>
                <StudyLine variant="teal" className="my-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEn ? 'Classical education • IELTS C1 Certified instruction.' : 'تأصيل شرعي عريق • معتمد بشهادة IELTS C1.'}
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
                    ? "Teaching is a trust. I teach Islam the balanced, moderate way, far from any extremism, with an Azhari foundation in Aqeedah and following Ahl al-Sunnah wal-Jama'ah. My English (IELTS C1) helps me explain pronunciation and grammar clearly to students who grew up abroad."
                    : 'التعليم أمانة. بعلّم الدين بوسطية واعتدال وبعيد عن أي تطرف، بتأسيس أزهري في العقيدة وعلى منهج أهل السنة والجماعة. وإنجليزيتي (IELTS C1) بتساعدني أشرح النطق والقواعد بوضوح للطلاب اللي اتربوا برّه.'}
                </p>
              </div>
            </div>
          </div>

          {/* Ustadha Afnan: mirrored layout. Facts from the owner (2026-10-15): same subjects, wide teaching experience, C1 English. */}
          <div className="grid md:grid-cols-12 gap-12 items-center pt-12">
            <div className="md:col-span-5 md:order-2 relative">
              <div className="absolute -inset-4 bg-gradient-to-tl from-sand/25 via-primary/10 to-teal-500/20 rounded-3xl -z-10 blur-xl transform -rotate-2" />
              <PortraitFrame src="/ustadha-afnan.jpg" alt={isEn ? 'Ustadha Afnan' : 'الأستاذة أفنان'} className="w-full max-w-sm mx-auto md:mx-0 shadow-xl" />
              <div className="absolute -bottom-6 -left-6 rtl:-left-auto rtl:-right-6 glass-card p-4 rounded-xl shadow-lg border border-teal-500/30 max-w-[220px] hidden sm:block">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <span className="w-2 h-2 rounded-full bg-teal-500" />
                  <span>{isEn ? 'Experienced teacher' : 'خبرة كبيرة في التدريس'}</span>
                </div>
                <StudyLine variant="teal" className="my-2" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEn ? 'IELTS C1 English for clear explanations.' : 'إنجليزية بمستوى C1 لشرح واضح.'}
                </p>
              </div>
            </div>

            <div className="md:col-span-7 md:order-1 space-y-6">
              <EditorialHeading eyebrow={isEn ? 'Background' : 'خلفية المعلمة'} noAccent>
                {isEn ? 'Ustadha Afnan' : 'الأستاذة أفنان'}
              </EditorialHeading>

              <div className="prose prose-p:text-muted-foreground prose-p:leading-relaxed max-w-none">
                <p>
                  {isEn
                    ? 'Ustadha Afnan teaches the Quran, Tajweed, Arabic, Islamic Studies and English with Watazawwado, and brings wide experience in teaching. Her English (C1) helps her explain clearly to students who grew up abroad.'
                    : 'الأستاذة أفنان بتدرّس القرآن والتجويد والعربية والعلوم الشرعية والإنجليزية مع وتزودوا، وعندها خبرة كبيرة في التدريس. وإنجليزيتها (C1) بتساعدها تشرح بوضوح للطلاب اللي اتربوا برّه.'}
                </p>
                <p>
                  {isEn
                    ? 'She teaches in the same spirit as the whole academy: patient, encouraging lessons that start from where each student really is. Families who prefer a female teacher can choose her when they create their learning profile.'
                    : 'وبتدرّس بنفس روح الأكاديمية كلها: دروس صبورة ومشجّعة، بتبدأ من مستوى كل طالب الحقيقي. واللي بيفضّلوا معلمة يقدروا يختاروها وهم بيعملوا ملفهم التعليمي.'}
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
              {/* Card 1: Teal Accent */}
              <div className="glass-card p-8 rounded-2xl border border-teal-500/30 hover:border-teal-500/60 transition-all shadow-2xs hover:shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 text-teal-700 dark:text-teal-300 flex items-center justify-center font-bold text-sm mb-4 border border-teal-500/25">
                  01
                </div>
                <h3 className="font-editorial text-xl font-bold text-foreground mb-3">
                  {isEn ? 'Start from where you are' : 'نبدأ من مستواك الفعلي'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn
                    ? 'No student is behind. Whether you cannot read a single Arabic letter or have partial memorization that feels rusty, we begin without judgment and build a solid foundation.'
                    : 'لا يوجد طالب متأخر. سواء كنت لا تقرأ حرفاً واحداً، أو لديك حفظ قديم تحتاج لمراجعته، نبدأ معاً بدون أي أحكام لبناء أساس متين.'}
                </p>
              </div>

              {/* Card 2: Crimson Accent */}
              <div className="glass-card p-8 rounded-2xl border border-primary/30 hover:border-primary/60 transition-all shadow-2xs hover:shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-sm mb-4 border border-primary/25">
                  02
                </div>
                <h3 className="font-editorial text-xl font-bold text-foreground mb-3">
                  {isEn ? 'A safe space to make mistakes' : 'بيئة آمنة تخلو من الحرج'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn
                    ? 'Reciting the Quran or speaking a new language can provoke anxiety. Lessons are calm, encouraging, and patient. Every correction is delivered with kindness.'
                    : 'تعلم لغة جديدة أو تلاوة القرآن قد يسبب التوتر. لذلك نحرص على أن تكون الدروس هادئة ومشجعة، وكل تصحيح يتم بصبر ولطف.'}
                </p>
              </div>

              {/* Card 3: Terracotta Accent */}
              <div className="glass-card p-8 rounded-2xl border border-terracotta/30 hover:border-terracotta/60 transition-all shadow-2xs hover:shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-terracotta/10 text-accent flex items-center justify-center font-bold text-sm mb-4 border border-terracotta/25">
                  03
                </div>
                <h3 className="font-editorial text-xl font-bold text-foreground mb-3">
                  {isEn ? 'Continuity & Context' : 'الاستمرارية والفهم الشخصي'}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {isEn
                    ? 'Because you learn with the same teacher every time, your progress is tracked carefully. I understand how you learn, what you struggle with, and how to encourage you.'
                    : 'لأنك تتعلم مع نفس المعلم في كل مرة، يتم تتبع تقدمك بدقة. المعلم يفهم طريقتك في التعلم، وما تواجهه من صعوبات، وكيف يشجعك.'}
                </p>
              </div>

              {/* Card 4: Sand / Dual Gradient Accent */}
              <div className="glass-card p-8 rounded-2xl border border-sand/40 hover:border-teal-500/40 transition-all shadow-2xs hover:shadow-xs">
                <div className="w-8 h-8 rounded-lg bg-sand/15 text-sand-dark dark:text-sand flex items-center justify-center font-bold text-sm mb-4 border border-sand/30">
                  04
                </div>
                <h3 className="font-editorial text-xl font-bold text-foreground mb-3">
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
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <PublicButton size="lg" onClick={() => onOpenTrialModal()}>
                {isEn ? 'Book Free Trial' : 'احجز جلستك المجانية'}
              </PublicButton>

              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I would like to introduce myself and ask about starting lessons.' : 'السلام عليكم أستاذ محمود، أود التعرف أكثر على الدروس والبدء معك.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-solid py-3 px-6 rounded-xl text-sm font-bold shadow-xs hover:scale-105 transition-all"
              >
                <WhatsAppIcon className="w-4 h-4 shrink-0" />
                <span>{isEn ? 'Message Mahmoud directly' : 'تحدث مع محمود مباشرة'}</span>
              </a>
            </div>

            <div className="pt-6 flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
              <Link to="/how-it-works" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'See How We Work (4 Stages)' : 'كيف نعمل (رحلة وتجربة الطالب)'}
              </Link>
              <span>•</span>
              <Link to="/learning" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'Explore Curriculum' : 'المناهج والمسارات'}
              </Link>
              <span>•</span>
              <Link to="/pricing" className="hover:text-foreground font-semibold underline transition-colors">
                {isEn ? 'Transparent Pricing' : 'الأسعار والباقات'}
              </Link>
            </div>
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
