import React from 'react';
import { motion } from 'motion/react';
import { Award, BookOpen, GraduationCap, Globe, Check, Shield, Clock } from 'lucide-react';
import { Language } from '../types';
import { VERIFIED_PROOF_POINTS, ARABIC_TRANSLATIONS } from '../data/content';

interface AboutSectionProps {
  lang: Language;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <section
      id="about"
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
            {isEn ? 'About Ustadh Mahmoud' : ARABIC_TRANSLATIONS.about.sectionTag}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn ? 'A dedicated teacher, committed to human connection.' : ARABIC_TRANSLATIONS.about.title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Focused, thoughtful one-on-one lessons designed around your goals, your pace, and your family’s schedule.'
              : 'تعليم فردي مباشر ومخصص، مبني على التدرج، الصبر، والرعاية الصادقة.'}
          </p>
        </motion.div>

        {/* Narrative & Credentials Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Personal Narrative (7 cols on lg) */}
          <div className="lg:col-span-7 space-y-6 text-foreground/85 text-base leading-relaxed">
            <p>
              {isEn ? (
                <>
                  <strong className="text-foreground font-serif text-lg">Assalamu Alaikum.</strong> I am{' '}
                  <strong className="text-foreground">Mahmoud</strong>, an independent educator based in Cairo, Egypt. For the past three years, I have
                  worked directly with international Muslim learners, converts, and families living in Canada, the United
                  States, the UK, and Australia.
                </>
              ) : (
                ARABIC_TRANSLATIONS.about.storyP1
              )}
            </p>

            <p>
              {isEn ? (
                <>
                  My educational foundation at <strong className="text-foreground">Al-Azhar</strong> provided me with deep immersion in classical
                  Arabic grammar, Quranic recitation with Tajweed, and foundational Islamic sciences. At the same time,
                  earning my <strong className="text-foreground">IELTS C1 certification</strong> enabled me to bridge the linguistic gap—explaining
                  delicate nuances of Arabic phonetics and classical Fiqh in effortless, modern English.
                </>
              ) : (
                ARABIC_TRANSLATIONS.about.storyP2
              )}
            </p>

            <p>
              {isEn ? (
                <>
                  I choose to keep my practice <strong className="text-foreground">independent and personal</strong>. Working directly with me means you have
                  a consistent mentor who knows your voice, tracks your weekly struggles, and stays accessible when you have
                  questions.
                </>
              ) : (
                ARABIC_TRANSLATIONS.about.storyP3
              )}
            </p>

            {/* Clear Standards: What You Can Count On vs Teaching Commitments */}
            <div className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-6 rounded-xl bg-surface border border-border shadow-2xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-3">
                  <Check className="w-4 h-4 text-primary" />
                  <span>{isEn ? 'What You Can Count On' : ARABIC_TRANSLATIONS.about.whatIAm}</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Patient, judgment-free pace adapted to your level' : 'صبر كامل وتدرج يناسب قدرتك'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Direct WhatsApp contact between lessons' : 'تواصل مباشر عبر واتساب عند الحاجة'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Flexible rescheduling up to 3 hours prior' : 'مرونة في إعادة الجدولة حتى ٣ ساعات قبل الدرس'}</span>
                  </li>
                </ul>
              </div>

              <div className="p-6 rounded-xl bg-surface border border-border shadow-2xs">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wider mb-3">
                  <Shield className="w-4 h-4 text-primary" />
                  <span>{isEn ? 'My Teaching Commitments' : 'ثوابت التدريس المعتمدة'}</span>
                </div>
                <ul className="space-y-2.5 text-xs sm:text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Solid fundamentals before rushing into advanced rules' : 'ترسيخ الأساسيات أولاً قبل التعجل'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Personalized study materials tailored to each student' : 'مواد دراسية مخصصة تناسب كل طالب'}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{isEn ? 'Transparent, pay-as-you-learn flexibility with no lock-in' : 'مرونة تامة وبدون أي عقود ملزمة'}</span>
                  </li>
                </ul>
              </div>
            </div>

          </div>

          {/* Verified Proof Metrics Column (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-6 rounded-2xl bg-surface border border-border shadow-2xs">
              <h3 className="font-serif text-lg font-medium text-foreground mb-4 pb-3 border-b border-border">
                {isEn ? 'Verified Teaching Background' : 'المؤهلات والخبرات المعتمدة'}
              </h3>

              <div className="space-y-4">
                {VERIFIED_PROOF_POINTS.map((point, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-border/60 last:border-b-0 last:pb-0"
                  >
                    <div className="p-2 rounded-xl bg-surface-subtle text-primary shrink-0 border border-border/60">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-lg font-bold text-foreground">
                          {point.metric}
                        </span>
                        <span className="text-xs font-semibold text-primary">
                          {point.unit}
                        </span>
                        <span className="text-xs text-muted-foreground/50">•</span>
                        <span className="text-xs font-medium text-foreground/80">
                          {point.label}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {point.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Timezone Note */}
            <div className="p-4 rounded-xl bg-surface border border-border flex items-center gap-3 text-xs text-muted-foreground shadow-2xs">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <span>
                {isEn
                  ? 'Based in Egypt (EET) • Flexible lesson scheduling for North American, European & Australian timezones.'
                  : 'مقيم في مصر مع مواعيد مرنة تناسب فروق التوقيت في كندا، وأمريكا، وأوروبا، وأستراليا.'}
              </span>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
