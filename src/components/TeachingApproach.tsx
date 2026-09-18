import React from 'react';
import { motion } from 'motion/react';
import { Language } from '../types';
import { TEACHING_PILLARS, ARABIC_TRANSLATIONS } from '../data/content';

interface TeachingApproachProps {
  lang: Language;
}

export const TeachingApproach: React.FC<TeachingApproachProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <section
      id="approach"
      className="py-20 md:py-28 bg-background border-b border-border/80 transition-colors"
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
            {isEn ? 'Teaching Philosophy' : 'منهجية التعليم'}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn
              ? 'Personalized teaching adapted to your level, pace, and life.'
              : 'تعليم شخصي يتكيف مع مستواك، سرعتك، وتفاصيل حياتك.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Effective learning does not come from memorizing rules in isolation. It comes from patient practice with a teacher who listens closely and corrects with kindness.'
              : 'التعلم الحقيقي لا يأتي من حفظ القواعد نظرياً، بل من الممارسة الصبورة مع معلم يستمع باهتمام ويصحح برفق.'}
          </p>
        </motion.div>

        {/* 4 Teaching Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {TEACHING_PILLARS.map((pillar, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="p-8 sm:p-10 rounded-2xl bg-surface border border-border hover:border-primary/40 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs"
            >
              <div>
                <div className="font-serif text-2xl font-light text-primary mb-3">
                  0{index + 1}
                </div>
                <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                  {isEn ? pillar.title : pillar.arabicTitle}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {pillar.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-border text-xs text-primary font-medium tracking-wider uppercase flex items-center justify-between">
                <span>{isEn ? `Foundational Pillar 0${index + 1}` : `الركن التعليمي ٠${index + 1}`}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
