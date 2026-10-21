import React, { useState } from 'react';
import { activateOnKey } from '../../lib/a11y';
import { motion } from 'motion/react';
import { Check, BookOpen, Compass, Languages, GraduationCap, ArrowRight } from 'lucide-react';
import { BOOKABLE_SERVICES } from '../../booking/mockData';
import { Language, ServiceGroupKey } from '../../booking/types';

interface StepServiceSelectProps {
  /** Subject from onboarding: ask to confirm it before showing every subject. */
  suggestedServiceId?: string;
  suggestedLevel?: string;
  selectedServiceId: string;
  onSelectService: (serviceId: string) => void;
  onNext: () => void;
  lang: Language;
}

const LEVEL_LABELS: Record<string, { en: string; ar: string }> = {
  beginner: { en: 'Beginner', ar: 'مبتدئ' },
  elementary: { en: 'Elementary', ar: 'أساسي' },
  intermediate: { en: 'Intermediate', ar: 'متوسط' },
  advanced: { en: 'Advanced', ar: 'متقدم' }
};

export const StepServiceSelect: React.FC<StepServiceSelectProps> = ({
  suggestedServiceId,
  suggestedLevel,
  selectedServiceId,
  onSelectService,
  onNext,
  lang
}) => {
  const isEn = lang === 'en';
  const [activeTab, setActiveTab] = useState<ServiceGroupKey | 'all'>('all');
  const suggested = BOOKABLE_SERVICES.find((s) => s.id === suggestedServiceId);
  const [showAll, setShowAll] = useState(!suggested);

  if (suggested && !showAll) {
    const level = suggestedLevel ? LEVEL_LABELS[suggestedLevel] : undefined;
    return (
      <div className="space-y-5">
        <div className="p-5 sm:p-6 rounded-2xl glass-card border border-teal-500/40 bg-teal-500/5 space-y-2">
          <p className="text-sm text-muted-foreground">
            {isEn ? 'From your profile' : 'من بيانات حسابك'}
          </p>
          <h3 className="font-display text-xl font-bold text-foreground">
            {isEn ? suggested.name : suggested.arabicName}
            {level && <span className="text-base font-semibold text-teal-700 dark:text-teal-300"> · {isEn ? level.en : level.ar}</span>}
          </h3>
          <p className="text-sm text-foreground/80">
            {isEn ? 'Continue with this subject and level?' : 'نكمّل بنفس المادة والمستوى؟'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => {
              onSelectService(suggested.id);
              onNext();
            }}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl btn-primary-material text-white text-sm font-semibold shadow-md cursor-pointer"
          >
            <span>{isEn ? 'Yes, continue' : 'أيوه، كمّل'}</span>
            <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="flex-1 px-6 py-3 rounded-xl glass-card border border-border text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer"
          >
            {isEn ? 'Choose another subject or level' : 'اختار مادة أو مستوى تاني'}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEn ? 'You can change the level in the learner details step.' : 'تقدر تغيّر المستوى في خطوة بيانات الطالب.'}
        </p>
      </div>
    );
  }

  const groups: { key: ServiceGroupKey | 'all'; label: string; arabicLabel: string; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Disciplines', arabicLabel: 'جميع المواد', icon: <GraduationCap className="w-4 h-4" /> },
    { key: 'quran', label: 'Quran & Tajweed', arabicLabel: 'القرآن والتجويد', icon: <BookOpen className="w-4 h-4" /> },
    { key: 'islamic_studies', label: 'The Zad Path', arabicLabel: 'مسار الأثر', icon: <Compass className="w-4 h-4" /> },
    { key: 'arabic', label: 'Arabic Language', arabicLabel: 'اللغة العربية', icon: <Languages className="w-4 h-4" /> },
    { key: 'english', label: 'English', arabicLabel: 'اللغة الإنجليزية', icon: <GraduationCap className="w-4 h-4" /> }
  ];

  const filteredServices = activeTab === 'all'
    ? BOOKABLE_SERVICES
    : BOOKABLE_SERVICES.filter((s) => s.group === activeTab);

  const selectedService = BOOKABLE_SERVICES.find((s) => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm sm:text-base text-foreground/80 dark:text-accent/90 leading-relaxed max-w-2xl">
          {isEn
            ? 'Choose the primary subject you would like to work on with your teacher. In a 1-on-1 setting, every lesson is adapted directly to your current level, whether you are starting from the alphabet or seeking advanced mastery.'
            : 'اختر المادة الأساسية التي ترغب في تعلمها مع معلمك. في الدروس الفردية ١-على-١، تُصمم كل جلسة لتناسب مستواك وتطلعاتك الشخصية بدقة.'}
        </p>
      </div>

      {/* Group Navigation Filter */}
      <div className="flex flex-wrap gap-2 pb-1">
        {groups.map((grp) => {
          const isActive = activeTab === grp.key;
          return (
            <button
              key={grp.key}
              type="button"
              onClick={() => setActiveTab(grp.key)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-teal-700 dark:bg-teal-600 text-white shadow-xs'
                  : 'glass-card text-foreground/80 border border-border hover:bg-surface-warm dark:hover:bg-surface-subtle hover:border-teal-500/30'
              }`}
            >
              {grp.icon}
              <span>{isEn ? grp.label : grp.arabicLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pe-1.5 focus:outline-none">
        {filteredServices.map((service) => {
          const isSelected = selectedServiceId === service.id;
          return (
            <motion.div
              role="button"
              tabIndex={0}
              onKeyDown={activateOnKey}
              key={service.id}
              whileHover={{ scale: 1.015, y: -2 }}
              whileTap={{ scale: 0.985 }}
              onClick={() => onSelectService(service.id)}
              className={`group p-4 sm:p-5 rounded-2xl border text-start transition-all cursor-pointer relative flex flex-col justify-between ${
                isSelected
                  ? 'glass-card border-teal-500 ring-2 ring-teal-500/30 bg-teal-500/5 dark:bg-teal-950/20 shadow-sm'
                  : 'glass-card border-border/80 hover:border-teal-500/40 hover:bg-surface-subtle shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <h3 className="font-display text-base sm:text-lg font-bold text-foreground group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors leading-snug">
                    {isEn ? service.name : service.arabicName}
                  </h3>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                      isSelected
                        ? 'bg-teal-600 text-white'
                        : 'border border-border text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {isEn ? service.tagline : service.arabicTagline}
                </p>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  {isEn ? 'Available lengths:' : 'المدد المتاحة:'} 30, 45, 60m
                </span>
                <span className="font-semibold text-teal-700 dark:text-teal-300">
                  {isEn ? `Rate baseline: $${service.hourlyRateUsd}/hr` : `المعدل الأساسي: $${service.hourlyRateUsd}/ساعة`}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Confirmation Bar & Next Action */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-foreground/80 text-center sm:text-start">
          {selectedService ? (
            <span>
              {isEn ? 'Selected: ' : 'تم اختيار: '}
              <strong className="text-foreground font-bold text-teal-700 dark:text-teal-300">
                {isEn ? selectedService.name : selectedService.arabicName}
              </strong>
            </span>
          ) : (
            <span>{isEn ? 'Please choose a subject to proceed.' : 'يرجى اختيار المادة للمتابعة.'}</span>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!selectedServiceId}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl btn-primary-material text-white text-sm font-semibold shadow-md disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <span>{isEn ? 'Next: Define Your Goal' : 'التالي: حدد هدفك'}</span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
};
