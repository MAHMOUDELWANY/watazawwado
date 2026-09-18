import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { Language } from '../types';
import { FAQS, ARABIC_TRANSLATIONS } from '../data/content';

interface FAQSectionProps {
  lang: Language;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ lang }) => {
  const isEn = lang === 'en';
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section
      id="faq"
      className="py-20 md:py-28 bg-background border-b border-border/80 transition-colors"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {isEn ? 'Practical Questions' : ARABIC_TRANSLATIONS.nav.faqs}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn ? 'Clear answers to common questions.' : 'إجابات واضحة لأهم التساؤلات الشائعة.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Everything you need to know about scheduling, the free trial, lesson lengths, and learning policies.'
              : 'كل ما تحتاج لمعرفته حول المواعيد، الجلسة التجريبية، ومدد الدروس وسياسة الحجز.'}
          </p>
        </motion.div>

        {/* Accordion List */}
        <div className="space-y-3.5">
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            const contentId = `faq-content-${index}`;
            const headerId = `faq-header-${index}`;

            return (
              <div
                key={index}
                className={`rounded-xl border transition-all overflow-hidden ${
                  isOpen
                    ? 'bg-surface border-primary/50 shadow-2xs'
                    : 'bg-surface border-border hover:border-primary/30'
                }`}
              >
                <button
                  id={headerId}
                  aria-controls={contentId}
                  onClick={() => toggle(index)}
                  className="w-full px-6 py-5 flex items-center justify-between text-start gap-4 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-base sm:text-lg font-medium text-foreground">
                    {faq.question}
                  </span>
                  <span
                    className={`p-1.5 rounded-lg shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 bg-primary/15 text-primary' : 'bg-surface-subtle text-muted-foreground'
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={contentId}
                      role="region"
                      aria-labelledby={headerId}
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
