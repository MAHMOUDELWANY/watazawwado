import React from 'react';
import { motion } from 'motion/react';
import { Headphones, HeartHandshake, Compass, ArrowRight } from 'lucide-react';
import { Language } from '../types';

interface MentorshipPillarsProps {
  lang: Language;
}

export const MentorshipPillars: React.FC<MentorshipPillarsProps> = ({ lang }) => {
  const isEn = lang === 'en';

  const pillars = [
    {
      icon: Headphones,
      title: isEn ? 'Attentive Listening' : 'استماع دقيق وتصحيح صبور',
      description: isEn
        ? 'In Quran recitation and Arabic phonetics, every subtle vowel and articulation point (Makhraj) matters. Mahmoud listens closely and corrects with calm kindness before errors set into muscle memory.'
        : 'في تلاوة القرآن ومخارج الحروف، كل تفصيلة صوتية لها أهميتها. يستمع الأستاذ محمود باهتمام ويصحح برفق وتؤدة قبل أن تستقر الأخطاء في لسان المتعلم.',
    },
    {
      icon: HeartHandshake,
      title: isEn ? 'Adapted to Your Actual Life' : 'وتيرة تناسب ظروفك الحقيقية',
      description: isEn
        ? 'No two learners share the same background. Whether you are an adult restarting after years, a child needing gentle encouragement, or an advanced student revising Hifz, your weekly pace is built for your schedule.'
        : 'لكل متعلم خلفيته وظروفه الخاصة. سواء كنت كبيراً تعود للتعلم بعد انقطاع، أو ناشئاً يحتاج للتشجيع، أو حافظاً يثبت محفوظه، تتكيف الخطة مع وقتك.',
    },
    {
      icon: Compass,
      title: isEn ? 'Linguistic & Cultural Bridge' : 'جسر لغوي وثقافي سلس',
      description: isEn
        ? 'Educated at Al-Azhar in Cairo and certified C1 in English, Mahmoud explains delicate Tajweed rules, Arabic grammar, and practical Fiqh in effortless, articulate English without any communication barrier.'
        : 'بتأصيل أزهري عميق في القاهرة وإتقان تام للإنجليزية (C1)، يشرح الأستاذ محمود أحكام التجويد ودقائق النحو والفقه بأسلوب ميسر يزيل أي عائق للتواصل.',
    },
  ];

  return (
    <section className="py-16 md:py-24 bg-surface-subtle border-b border-border/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12 md:mb-16">
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {isEn ? 'The 1-on-1 Difference' : 'فارق التعليم الفردي المباشر'}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn
              ? 'One dedicated teacher. Not an anonymous platform.'
              : 'معلم مكرس يعرف صوتك وهدفك. لست مجرد رقم في منصة.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Learning Quran, Arabic, or Islamic Studies requires trust, patience, and consistency. When you learn with Mahmoud, you have a direct relationship with a teacher who tracks your progress week after week.'
              : 'تعلم القرآن والعربية يتطلب الثقة والصبر والمتابعة المستمرة. التعلم المباشر مع الأستاذ محمود يمنحك علاقة واضحة مع معلم يتابع تطورك خطوة بخطوة.'}
          </p>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {pillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.45, delay: idx * 0.1 }}
                className="p-7 sm:p-8 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-2xs hover:shadow-xs hover:border-primary/40 transition-all"
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-6">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-xl font-medium text-foreground mb-3">
                    {pillar.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Subdued Banner Transition to Services */}
        <div className="mt-12 flex items-center justify-between flex-wrap gap-4 pt-8 border-t border-border/60">
          <p className="text-sm text-muted-foreground">
            {isEn
              ? 'Ready to see what you can learn? Explore the 13 structured offerings below.'
              : 'تعرف على الخدمات والبرامج الـ ١٣ المصممة لتناسب مختلف المستويات والأعمار.'}
          </p>
          <a
            href="#services"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <span>{isEn ? 'Explore All Subjects' : 'استعراض جميع البرامج'}</span>
            <ArrowRight className={`w-3.5 h-3.5 rtl:rotate-180`} />
          </a>
        </div>

      </div>
    </section>
  );
};
