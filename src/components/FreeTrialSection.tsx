import React from 'react';
import { motion } from 'motion/react';
import { Calendar, ShieldAlert, MessageCircle } from 'lucide-react';
import { Language } from '../types';
import { ARABIC_TRANSLATIONS } from '../data/content';
import { buildWhatsAppUrl } from '../lib/whatsapp';

interface FreeTrialSectionProps {
  lang: Language;
  onOpenTrialModal: () => void;
}

export const FreeTrialSection: React.FC<FreeTrialSectionProps> = ({ lang, onOpenTrialModal }) => {
  const isEn = lang === 'en';

  return (
    <section
      id="free-trial"
      className="py-20 md:py-28 bg-background border-b border-border/80 transition-colors"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="rounded-2xl bg-surface border border-border p-8 sm:p-12 md:p-14 shadow-xs relative overflow-hidden"
        >
          
          <div className="max-w-3xl">
            <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-4">
              {isEn ? 'No-Risk Introduction' : 'جلسة تعارف وتقييم مجانية'}
            </div>

            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground tracking-tight leading-tight mb-6">
              {isEn
                ? 'Experience your first 30-minute lesson free of charge.'
                : ARABIC_TRANSLATIONS.trial.title}
            </h2>

            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-8">
              {isEn
                ? 'Choosing a teacher for yourself or your child is a personal decision. This session gives you a real feel for my demeanor, patience, and explanation style before you commit to anything.'
                : ARABIC_TRANSLATIONS.trial.subtitle}
            </p>

            {/* Key Outcomes in the Trial */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              <div className="p-5 rounded-xl bg-surface-subtle border border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  1. Get to Know You
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEn
                    ? 'We discuss your background, previous learning, and specific goals.'
                    : 'نتعرف على أهدافك وما ترغب في تحقيقه بدقة.'}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface-subtle border border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  2. Level Assessment
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEn
                    ? 'Gentle diagnostic exercises to see where your strengths and gaps are.'
                    : 'تقييم مريح لمستواك الحالي بدون أي ضغط.'}
                </p>
              </div>

              <div className="p-5 rounded-xl bg-surface-subtle border border-border">
                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
                  3. Mini-Lesson & Plan
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isEn
                    ? 'A live sample lesson and a clear, recommended weekly study roadmap.'
                    : 'شرح عينة حية وتقديم خطة تعليمية مقترحة تناسبك.'}
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 mb-6">
              <button
                onClick={onOpenTrialModal}
                id="free-trial-main-cta"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-base shadow-xs hover:shadow-md transition-all cursor-pointer group"
              >
                <Calendar className="w-5 h-5" />
                <span>{isEn ? 'Book Free 30-Min Trial' : 'احجز جلستك المجانية الآن'}</span>
              </button>

              <a
                href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I have a question before booking a free trial.')}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-surface hover:bg-surface-subtle text-foreground border border-border text-sm font-medium transition-all shadow-2xs hover:shadow-xs group"
              >
                <MessageCircle className="w-4 h-4 text-primary" />
                <span>{isEn ? 'Message on WhatsApp First' : 'تحدث معي على واتساب أولاً'}</span>
              </a>
            </div>

            {/* Free Trial Repeat Policy note */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ShieldAlert className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>
                {isEn
                  ? 'Policy: One free trial per new student. Default duration is 30 minutes (up to 45 mins max). No credit card required.'
                  : ARABIC_TRANSLATIONS.trial.policy}
              </span>
            </div>

          </div>

        </motion.div>

      </div>
    </section>
  );
};
