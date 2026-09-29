import React from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MessageCircle, CheckCircle2, Clock, ShieldCheck, HeartHandshake, ArrowRight, ArrowLeft } from 'lucide-react';
import { PublicLayoutContextType } from '../layout/PublicLayout';
import { PublicSection, MarginNote, PublicButton, StudyLine } from '../PublicDesignSystem';
import { HOW_IT_WORKS_STEPS, TEACHING_PILLARS } from '../../../data/content';
import { buildWhatsAppUrl } from '../../../lib/whatsapp';

export function HowItWorksPage() {
  const { lang, onOpenTrialModal } = useOutletContext<PublicLayoutContextType>();
  const isEn = lang === 'en';

  const stageIcons = [
    <Calendar key="cal" className="w-5 h-5 text-primary" />,
    <CheckCircle2 key="check" className="w-5 h-5 text-teal-600 dark:text-teal-400" />,
    <Clock key="clock" className="w-5 h-5 text-accent" />,
    <HeartHandshake key="shake" className="w-5 h-5 text-teal-600 dark:text-teal-400" />
  ];

  return (
    <main id="main-content" className="pt-24 lg:pt-32 pb-20">
      <PublicSection>
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Header */}
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <MarginNote className="mx-auto">
              {isEn ? 'The Student Journey' : 'كيف نعمل • رحلة الطالب'}
            </MarginNote>
            <h1 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-foreground font-bold tracking-tight leading-tight">
              {isEn ? 'From your first trial to confident mastery.' : 'من جلستك الأولى إلى إتقان حقيقي ومستمر.'}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
              {isEn
                ? 'A transparent 4-stage process designed to respect your time, remove all friction from starting, and build a lasting foundation.'
                : 'أربع خطوات واضحة وميسرة لبدء رحلتك التعليمية بدون أي تعقيد أو التزامات مسبقة، تركز على الفهم والتأسيس الرصين.'}
            </p>
          </div>

          {/* 4 Sequential Stages Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 pt-6">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="glass-card p-6 sm:p-8 rounded-2xl border border-border/80 hover:border-teal-500/50 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs group"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-editorial text-3xl sm:text-4xl font-bold text-primary group-hover:scale-105 transition-transform">
                      {step.step}
                    </span>
                    <span className="text-xs font-semibold tracking-wider px-3 py-1 rounded-full bg-teal-500/10 text-teal-800 dark:text-teal-200 border border-teal-500/25">
                      {isEn ? step.highlight : (step.arabicHighlight || step.highlight)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-xl bg-surface-warm dark:bg-surface-subtle shrink-0">
                      {stageIcons[index] || <CheckCircle2 className="w-5 h-5 text-primary" />}
                    </div>
                    <h2 className="font-editorial text-xl sm:text-2xl font-bold text-foreground leading-snug">
                      {isEn ? step.title : step.arabicTitle}
                    </h2>
                  </div>

                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed pt-2">
                    {isEn ? step.description : (step.arabicDescription || step.description)}
                  </p>
                </div>

                <div className="mt-8 pt-4 border-t border-border flex items-center justify-between text-xs sm:text-sm font-semibold text-teal-700 dark:text-teal-300">
                  <span>{isEn ? `Stage ${index + 1} of 4` : `المرحلة ${index + 1} من ٤`}</span>
                  <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>

          <StudyLine className="my-12" />

          {/* Educational Pillars */}
          <div className="space-y-10">
            <div className="text-center max-w-2xl mx-auto space-y-4">
              <h2 className="font-editorial text-3xl sm:text-4xl text-foreground font-bold">
                {isEn ? 'Principles that guide every lesson' : 'مبادئ راسخة في كل درس'}
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                {isEn
                  ? 'We do not treat teaching as a mechanical transaction. Every session is grounded in pedagogical care and classical ethics.'
                  : 'التعليم ليس مجرد نقل للمعلومة، بل رعاية تربوية وأمانة علمية مبنية على الصبر والإتقان.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {TEACHING_PILLARS.map((pillar, idx) => (
                <div 
                  key={idx}
                  className="glass-card p-6 sm:p-7 rounded-2xl border border-border/80 hover:border-border transition-all"
                >
                  <div className="flex items-center gap-2 mb-3 text-xs font-bold text-primary uppercase tracking-wider">
                    <span>0{idx + 1}</span>
                    <span>•</span>
                    <span>{isEn ? 'Core Value' : 'قيمة جوهرية'}</span>
                  </div>
                  <h3 className="font-editorial text-xl font-bold text-foreground mb-2">
                    {isEn ? pillar.title : pillar.arabicTitle}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {isEn ? pillar.description : (pillar.arabicDescription || pillar.description)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Practical Policies & Reassurance Banner */}
          <div className="glass-card p-8 sm:p-10 rounded-2xl border border-teal-500/30 bg-teal-500/5 space-y-6">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-teal-600 dark:text-teal-400 shrink-0" />
              <h3 className="font-editorial text-2xl font-bold text-foreground">
                {isEn ? 'Policies Built on Fairness' : 'سياسات واضحة تضمن راحتك'}
              </h3>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 text-sm text-muted-foreground">
              <div className="space-y-1.5">
                <div className="font-bold text-foreground">
                  {isEn ? 'Free Trial with No Strings' : 'جلسة تجريبية مجانية تماماً'}
                </div>
                <p className="leading-relaxed">
                  {isEn ? '٣٠ minutes of actual interaction. No card required, no automatic billing.' : '٣٠ دقيقة لتحديد مستواك وخطة دراستك بدون أي بطاقة بنكية.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-foreground">
                  {isEn ? '3-Hour Reschedule Window' : 'إلغاء وتعديل حتى ٣ ساعات'}
                </div>
                <p className="leading-relaxed">
                  {isEn ? 'Self-service rescheduling available anytime up to 3 hours prior to session start.' : 'يمكنك تعديل موعدك ذاتياً بكل سهولة حتى ٣ ساعات قبل موعد الحصة.'}
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="font-bold text-foreground">
                  {isEn ? 'Direct WhatsApp Coordination' : 'تواصل مباشر عبر واتساب'}
                </div>
                <p className="leading-relaxed">
                  {isEn ? 'Reach Mahmoud directly for questions, feedback, or custom requests between classes.' : 'محادثة مباشرة مع المعلم لأي استفسارات أو متابعة مستمرة بين الدروس.'}
                </p>
              </div>
            </div>
          </div>

          {/* Call to action & WhatsApp buttons */}
          <div className="glass-card p-8 sm:p-12 rounded-2xl border border-border-subtle text-center space-y-6">
            <h2 className="font-editorial text-2xl sm:text-3xl text-foreground font-bold">
              {isEn ? 'Ready to begin with a free trial?' : 'هل أنت مستعد لبدء جلستك التجريبية المجانية؟'}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              {isEn
                ? 'Select a time that suits your timezone. Mahmoud will meet you on Zoom to discuss your goals and provide a gentle initial assessment.'
                : 'اختر الموعد الأنسب لجدولك اليومي. سيلتقي بك الأستاذ محمود عبر زووم لتحديد مستواك ووضع خطة دراسية تناسبك.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <PublicButton size="lg" onClick={() => onOpenTrialModal()}>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك المجانية الآن'}</span>
                </span>
              </PublicButton>

              <a
                href={buildWhatsAppUrl(isEn ? 'Assalamu Alaikum Ustadh Mahmoud, I read How It Works and would like to ask a question.' : 'السلام عليكم أستاذ محمود، اطلعت على صفحة كيف نعمل وأود الاستفسار عن الدروس.')}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-whatsapp-solid py-3 px-6 rounded-xl text-sm font-bold shadow-md hover:scale-105 transition-all"
              >
                <MessageCircle className="w-4 h-4 fill-current shrink-0" />
                <span>{isEn ? 'Ask on WhatsApp' : 'تواصل معنا على واتساب'}</span>
              </a>
            </div>

            <div className="pt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <Link to="/learning" className="hover:text-foreground underline transition-colors">
                {isEn ? 'Browse Study Tracks' : 'استكشف مسارات التعلم'}
              </Link>
              <span>•</span>
              <Link to="/pricing" className="hover:text-foreground underline transition-colors">
                {isEn ? 'View Pricing Packages' : 'شاهد باقات الأسعار'}
              </Link>
              <span>•</span>
              <Link to="/about" className="hover:text-foreground underline transition-colors">
                {isEn ? 'About Ustadh Mahmoud' : 'عن الأستاذ محمود'}
              </Link>
            </div>
          </div>

        </div>
      </PublicSection>
    </main>
  );
}
