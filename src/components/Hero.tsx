import React, { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { Calendar, ArrowRight, Sparkles, GraduationCap, Languages, UserCheck, Clock } from 'lucide-react';
import { PortraitImage } from './PortraitImage';
import { Language } from '../types';
import { ARABIC_TRANSLATIONS } from '../data/content';

interface HeroProps {
  lang: Language;
  onOpenTrialModal: () => void;
}

export const Hero: React.FC<HeroProps> = ({ lang, onOpenTrialModal }) => {
  const isEn = lang === 'en';
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  const portraitY = useTransform(smoothProgress, [0, 1], [0, 30]);

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative overflow-hidden bg-background pt-24 pb-16 md:pt-32 md:pb-24 border-b border-border/60 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Description, Buttons, Genuine Proof Points (7 cols) */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1,
                  delayChildren: 0.05,
                },
              },
            }}
            className="lg:col-span-7 flex flex-col items-start text-start lg:pr-8 rtl:lg:pr-0 rtl:lg:pl-8"
          >
            {/* Editorial Eyebrow */}
            <motion.div
              variants={{
                hidden: { opacity: 0, x: isEn ? -12 : 12 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.4 } },
              }}
              className="inline-flex items-center gap-2.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <span>{isEn ? 'Direct 1-on-1 Mentorship' : ARABIC_TRANSLATIONS.hero.eyebrow}</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
              }}
              className="font-serif text-4xl sm:text-5xl lg:text-[3.35rem] leading-[1.16] tracking-tight text-foreground mb-6"
            >
              {isEn ? (
                <>
                  Personal{' '}
                  <span className="text-primary font-medium">Quran & Arabic</span>{' '}
                  with dedicated online guidance.
                </>
              ) : (
                <>
                  تعليم{' '}
                  <span className="text-primary font-medium">القرآن الكريم واللغة العربية</span>{' '}
                  بتوجيه فردي ورعاية مباشرة.
                </>
              )}
            </motion.h1>

            {/* Value Proposition Subtitle */}
            <motion.p
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
              }}
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8 font-normal"
            >
              {isEn ? (
                <>
                  Private one-on-one lessons for adults, youth, and Muslim families living in Canada, the US, the UK, and Australia. Grounded in Al-Azhar scholarship and taught with patient pacing in fluent C1 English.
                </>
              ) : (
                <>
                  دروس فردية مخصصة للكبار والناشئة والعائلات المسلمة في المهجر. بإشراف أزهري وبنهج يقوم على الصبر والتدرج، مع إتقان تام للغة الإنجليزية للتوضيح عند الحاجة.
                </>
              )}
            </motion.p>

            {/* Action Buttons: Primary + Guest Demo */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mb-10"
            >
              <button
                onClick={onOpenTrialModal}
                id="hero-get-started-btn"
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm sm:text-base shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <Calendar className="w-4 h-4" />
                <span>{isEn ? 'Book Free 30-Min Trial' : ARABIC_TRANSLATIONS.hero.ctaPrimary}</span>
                <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
              </button>

              <a
                href="/student/demo"
                id="hero-demo-btn"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-surface hover:bg-surface-subtle text-foreground border border-border font-medium text-sm sm:text-base shadow-2xs hover:shadow-xs transition-all"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>{isEn ? 'Explore as Guest' : 'استكشف كضيف'}</span>
              </a>

              <a
                href="#services"
                id="hero-learn-more-btn"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3.5 text-muted-foreground hover:text-foreground text-xs sm:text-sm font-medium transition-colors"
              >
                <span>{isEn ? 'View Teaching Areas' : 'استعراض المسارات'}</span>
                <span aria-hidden="true" className="rtl:rotate-180">↓</span>
              </a>
            </motion.div>

            {/* Authentic Credibility & Trust Markers */}
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
              }}
              className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full pt-4 border-t border-border/80"
            >
              <div className="flex items-start gap-2">
                <GraduationCap className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isEn ? 'Al-Azhar Degree' : 'خريج الأزهر'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isEn ? 'Classical grounding' : 'تأصيل شرعي ولغوي'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Languages className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isEn ? 'IELTS C1 Certified' : 'إتقان الإنجليزية C1'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isEn ? 'Fluent explanations' : 'تواصل سلس ومباشر'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <UserCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isEn ? 'Always 1-on-1' : 'تعليم فردي دائماً'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isEn ? 'No rotating tutors' : 'مع محمود مباشرة'}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-foreground">
                    {isEn ? 'Global Timezones' : 'توقيتات مرنة'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {isEn ? 'Canada, US, UK, AU' : 'كندا وأمريكا وبريطانيا'}
                  </div>
                </div>
              </div>
            </motion.div>

          </motion.div>

          {/* Right Column: Ustadh Mahmoud Portrait Frame (5 cols) */}
          <motion.div
            style={{ y: portraitY }}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col items-center justify-center relative z-20"
          >
            <PortraitImage priority={true} />
          </motion.div>

        </div>
      </div>
    </section>
  );
};
