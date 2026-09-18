import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ArrowRight } from 'lucide-react';
import { Language } from '../types';
import { HOW_IT_WORKS_STEPS, ARABIC_TRANSLATIONS } from '../data/content';

interface HowItWorksProps {
  lang: Language;
  onOpenTrialModal: () => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ lang, onOpenTrialModal }) => {
  const isEn = lang === 'en';

  return (
    <section
      id="how-it-works"
      className="py-20 md:py-28 bg-surface-subtle border-b border-border/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-16"
        >
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {isEn ? 'The Student Journey' : ARABIC_TRANSLATIONS.nav.howItWorks}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn
              ? 'From your first trial to confident, consistent learning.'
              : 'من جلستك الأولى إلى إتقان حقيقي ومستمر.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'A straightforward 4-step process designed to respect your time and remove all friction from starting.'
              : 'أربع خطوات واضحة وميسرة لبدء رحلتك التعليمية بدون أي تعقيد أو التزامات مسبقة.'}
          </p>
        </motion.div>

        {/* Timeline / Sequential Process Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {HOW_IT_WORKS_STEPS.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="relative p-6 sm:p-7 rounded-2xl bg-surface border border-border flex flex-col justify-between hover:border-primary/40 transition-all shadow-2xs hover:shadow-xs cursor-default"
            >
              <div>
                {/* Step Number */}
                <div className="flex items-center justify-between mb-5">
                  <span className="font-serif text-3xl font-light text-primary">
                    {step.step}
                  </span>
                  <span className="text-[11px] font-medium tracking-wider uppercase px-2.5 py-0.5 rounded-md bg-surface-subtle text-foreground/80 border border-border/70">
                    {step.highlight}
                  </span>
                </div>

                <h3 className="font-serif text-lg font-medium text-foreground mb-3 leading-snug">
                  {isEn ? step.title : step.arabicTitle}
                </h3>

                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-xs font-medium text-primary">
                <span>{isEn ? `Stage ${index + 1}` : `المرحلة ${index + 1}`}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Callout Banner */}
        <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-surface border border-border flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xs">
          <div>
            <h4 className="font-serif text-xl font-medium text-foreground">
              {isEn ? 'Ready to experience Mahmoud’s teaching style?' : 'هل ترغب في تجربة أسلوب الشرح والتدريس؟'}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isEn
                ? 'Your free trial is 30 minutes. No credit card, no pressure, zero obligation.'
                : 'جلستك التجريبية مدتها ٣٠ دقيقة مجانية تماماً وبدون أي بطاقة بنكية.'}
            </p>
          </div>

          <button
            onClick={onOpenTrialModal}
            className="shrink-0 inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-sm shadow-xs hover:shadow-md transition-all cursor-pointer group"
          >
            <Calendar className="w-4 h-4" />
            <span>{isEn ? 'Book Free Trial Now' : 'احجز جلستك الآن'}</span>
          </button>
        </div>

      </div>
    </section>
  );
};
