import React from 'react';
import { motion } from 'motion/react';
import { Quote, MapPin, Clock, BookOpen } from 'lucide-react';
import { Language } from '../types';
import { AUTHENTIC_TESTIMONIALS, ARABIC_TRANSLATIONS } from '../data/content';

interface TestimonialsSectionProps {
  lang: Language;
}

export const TestimonialsSection: React.FC<TestimonialsSectionProps> = ({ lang }) => {
  const isEn = lang === 'en';

  return (
    <section
      id="testimonials"
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
            {isEn ? 'Student & Parent Reflections' : ARABIC_TRANSLATIONS.nav.testimonials}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn ? 'Experiences from students across the globe.' : 'تجارب حقيقية لطلاب وأولياء أمور حول العالم.'}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Real feedback from international families and adult professionals who study 1-on-1 with Mahmoud.'
              : 'آراء وملاحظات من أسر ومهنيين يتعلمون مباشرة وبشكل فردي مع الأستاذ محمود.'}
          </p>
        </motion.div>

        {/* Editorial Testimonial Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {AUTHENTIC_TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.45, delay: index * 0.1 }}
              className="p-8 sm:p-10 rounded-2xl bg-surface border border-border flex flex-col justify-between shadow-2xs hover:shadow-xs transition-all cursor-default"
            >
              <div>
                <Quote className="w-8 h-8 text-primary/40 mb-4" />
                <p className="font-serif text-base sm:text-lg text-foreground leading-relaxed italic">
                  “{testimonial.quote}”
                </p>
              </div>

              <div className="mt-8 pt-5 border-t border-border">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-foreground">
                      {testimonial.author}
                    </h3>
                    <p className="text-xs text-primary font-medium">
                      {testimonial.role}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>{testimonial.location}</span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-primary" />
                    {testimonial.subject}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-primary" />
                    {testimonial.durationWithMahmoud}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};
