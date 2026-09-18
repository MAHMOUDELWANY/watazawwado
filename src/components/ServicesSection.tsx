import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Sparkles, MessageSquare, Compass, Clock, Check, ChevronRight, Calendar } from 'lucide-react';
import { SERVICES_DATA, ARABIC_TRANSLATIONS } from '../data/content';
import { ServiceItem, Language } from '../types';

interface ServicesSectionProps {
  lang: Language;
  onSelectServiceForTrial: (serviceId: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ lang, onSelectServiceForTrial }) => {
  const isEn = lang === 'en';
  const [activePillarId, setActivePillarId] = useState<'quran' | 'islamic_studies' | 'arabic' | 'english'>('quran');
  const [selectedServiceDetail, setSelectedServiceDetail] = useState<ServiceItem | null>(SERVICES_DATA[0].services[0]);

  const activePillar = SERVICES_DATA.find((p) => p.id === activePillarId) || SERVICES_DATA[0];

  const pillarIcons = {
    quran: BookOpen,
    islamic_studies: Compass,
    arabic: Sparkles,
    english: MessageSquare
  };

  return (
    <section
      id="services"
      className="py-20 md:py-28 bg-background border-b border-border/80 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header with Refined Editorial Rhythm */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mb-12"
        >
          <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-3">
            {isEn ? 'Core Teaching Subjects' : ARABIC_TRANSLATIONS.services.sectionTag}
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl text-foreground tracking-tight mb-4">
            {isEn
              ? '13 Personalized subjects, arranged around your journey.'
              : ARABIC_TRANSLATIONS.services.title}
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            {isEn
              ? 'Every student comes with different foundations and schedules. Rather than rigid mass courses, each lesson is designed 1-on-1 to match your exact starting point.'
              : ARABIC_TRANSLATIONS.services.subtitle}
          </p>
        </motion.div>

        {/* Pillar Navigation Bar */}
        <div className="flex flex-wrap gap-2.5 pb-6 border-b border-border">
          {SERVICES_DATA.map((pillar) => {
            const Icon = pillarIcons[pillar.id];
            const isActive = activePillarId === pillar.id;

            return (
              <button
                key={pillar.id}
                onClick={() => {
                  setActivePillarId(pillar.id);
                  setSelectedServiceDetail(pillar.services[0]);
                }}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'bg-surface text-foreground/80 hover:bg-surface-subtle border border-border'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-foreground' : 'text-primary'}`} />
                <span>{isEn ? pillar.title : pillar.arabicTitle}</span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded-md ${
                    isActive ? 'bg-black/15 text-primary-foreground' : 'bg-surface-subtle text-muted-foreground'
                  }`}
                >
                  {pillar.services.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Asymmetrical Master-Detail Layout */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Services List in Current Pillar (5 cols on lg) */}
          <div className="lg:col-span-5 space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
              {isEn ? `${activePillar.title} Services` : activePillar.arabicTitle}
            </div>

            {activePillar.services.map((service) => {
              const isSelected = selectedServiceDetail?.id === service.id;

              return (
                <div
                  key={service.id}
                  onClick={() => setSelectedServiceDetail(service)}
                  className={`group p-4.5 rounded-xl border text-start transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-surface-subtle border-primary/70 shadow-xs'
                      : 'bg-surface border-border hover:border-primary/40 hover:bg-surface-subtle/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-serif text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {service.tagline}
                      </p>
                    </div>
                    <span
                      className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-surface-subtle text-muted-foreground group-hover:bg-primary/15 group-hover:text-primary'
                      }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5`} />
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {service.durations.join(' / ')} mins
                    </span>
                    <span>•</span>
                    <span>{service.recommendedFrequency}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Syllabus & Practical Information (7 cols on lg) */}
          <div className="lg:col-span-7">
            {selectedServiceDetail && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedServiceDetail.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="bg-surface border border-border rounded-2xl p-6 sm:p-8 shadow-xs"
                >
                  {/* Service Header */}
                  <div className="border-b border-border pb-6 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs uppercase tracking-widest text-primary font-semibold">
                        {activePillar.title}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs text-muted-foreground">
                        {isEn ? '1-on-1 Zoom Classroom' : 'جلسات فردية عبر زووم'}
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl sm:text-3xl text-foreground font-medium">
                      {selectedServiceDetail.name}
                    </h3>

                    <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                      {selectedServiceDetail.description}
                    </p>
                  </div>

                  {/* Who Is It For */}
                  <div className="mb-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-2">
                      {isEn ? 'Who this is designed for:' : ARABIC_TRANSLATIONS.services.whoLabel}
                    </h4>
                    <p className="text-sm text-muted-foreground bg-surface-subtle p-3.5 rounded-xl border border-border">
                      {selectedServiceDetail.whoIsItFor}
                    </p>
                  </div>

                  {/* What You Will Learn / Practical Outcomes */}
                  <div className="mb-8">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground mb-3">
                      {isEn ? 'What we focus on together:' : ARABIC_TRANSLATIONS.services.learnLabel}
                    </h4>
                    <div className="space-y-2">
                      {selectedServiceDetail.whatYouWillLearn.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2.5 text-sm text-foreground/90 p-1 rounded-lg"
                        >
                          <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Lesson Formats & Action */}
                  <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div>
                      <div className="text-xs text-muted-foreground">
                        {isEn ? 'Standard Lesson Lengths:' : ARABIC_TRANSLATIONS.services.durationsLabel}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {selectedServiceDetail.durations.map((d) => (
                          <span
                            key={d}
                            className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-subtle border border-border text-foreground shadow-2xs"
                          >
                            {d} mins
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => onSelectServiceForTrial(selectedServiceDetail.id)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground text-sm font-medium shadow-xs hover:shadow-md transition-all cursor-pointer group"
                    >
                      <Calendar className="w-4 h-4" />
                      <span>{isEn ? 'Try This in Free Trial' : ARABIC_TRANSLATIONS.services.tryInTrial}</span>
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>

        </div>

      </div>
    </section>
  );
};
