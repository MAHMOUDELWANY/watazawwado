import React from 'react';
import { motion } from 'motion/react';
import { Check, ArrowRight, ArrowLeft, Target, Sparkles } from 'lucide-react';
import { BOOKING_SERVICES } from '../../booking/mockData';
import { Language } from '../../booking/types';

interface StepGoalSelectProps {
  serviceId: string;
  selectedGoal: string;
  customGoalText: string;
  onSelectGoal: (goal: string) => void;
  onChangeCustomGoal: (text: string) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export const StepGoalSelect: React.FC<StepGoalSelectProps> = ({
  serviceId,
  selectedGoal,
  customGoalText,
  onSelectGoal,
  onChangeCustomGoal,
  onNext,
  onBack,
  lang
}) => {
  const isEn = lang === 'en';
  const service = BOOKING_SERVICES.find((s) => s.id === serviceId) || BOOKING_SERVICES[0];

  const suggestedGoals = isEn ? service.suggestedGoals : service.arabicSuggestedGoals;

  const handleGoalChipClick = (goal: string) => {
    if (selectedGoal === goal) {
      onSelectGoal('');
    } else {
      onSelectGoal(goal);
    }
  };

  const hasGoal = selectedGoal.trim().length > 0 || customGoalText.trim().length > 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          <Target className="w-3.5 h-3.5" />
          <span>{isEn ? 'Tailored to Your Journey' : 'تخصيص مسارك التعليمي'}</span>
        </div>
        <p className="text-sm sm:text-base text-foreground/80 dark:text-muted-foreground leading-relaxed max-w-2xl">
          {isEn
            ? `What are you hoping to accomplish in ${service.name}? Selecting a suggested goal helps Mahmoud prepare relevant texts, verses, or diagnostic exercises for your first session.`
            : `ما الذي تأمل تحقيقه في ${service.arabicName}؟ تحديد هدفك يساعد محمود في تجهيز المواد والنصوص المناسبة لجلستك الأولى.`}
        </p>
      </div>

      {/* Suggested Goals Chips */}
      <div>
        <label className="block text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground/70 mb-2.5">
          {isEn ? 'Common Goals for this Subject (Click to Select)' : 'الأهداف الشائعة لهذه المادة (انقر للاختيار)'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {suggestedGoals.map((goal, index) => {
            const isSelected = selectedGoal === goal;
            return (
              <motion.button
                key={index}
                type="button"
                whileHover={{ scale: 1.015, y: -1 }}
                whileTap={{ scale: 0.985 }}
                onClick={() => handleGoalChipClick(goal)}
                className={`p-3.5 rounded-xl border text-start text-sm sm:text-sm transition-all cursor-pointer flex items-start gap-3 ${
                  isSelected
                    ? 'bg-foreground glass-surface border-primary ring-1 ring-primary font-medium text-foreground shadow-xs'
                    : 'glass-card border-border text-foreground/80 dark:text-muted-foreground hover:border-accent/50 hover:bg-foreground/40'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : 'border border-border'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                </div>
                <span>{goal}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Custom Goal / Personal Context Free-Text */}
      <div className="space-y-2 pt-2">
        <label className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-foreground/70 dark:text-muted-foreground/70">
          <Sparkles className="w-3.5 h-3.5 text-accent" />
          <span>
            {isEn
              ? 'Tell Mahmoud in Your Own Words (Optional)'
              : 'أخبر محمود بكلماتك عن وضعك الحالي أو أي تفاصيل خاصة (اختياري)'}
          </span>
        </label>
        <textarea
          rows={3}
          value={customGoalText}
          onChange={(e) => onChangeCustomGoal(e.target.value)}
          placeholder={
            isEn
              ? 'e.g. I can sound out letters slowly but I get stuck on Ghunnah rules, or my 7-year-old learns best through visual games...'
              : 'مثال: أقرأ الحروف ببطء وأرغب في ضبط أحكام الغنة، أو ابني ذو السبع سنوات يفضل التعلم بالألعاب التفاعلية...'
          }
          className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary placeholder:text-foreground/40 dark:placeholder:text-border/40 leading-relaxed shadow-2xs"
        />
        <p className="text-[11px] text-foreground/55 dark:text-muted-foreground/60">
          {isEn
            ? 'Feel free to share any past learning experience, challenges, or expectations.'
            : 'يمكنك مشاركة أي تجارب تعليمية سابقة أو تحديات تواجهها.'}
        </p>
      </div>

      {/* Controls */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground/80 dark:text-muted-foreground/80 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Subjects' : 'الرجوع للمواد'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!hasGoal}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-muted-foreground hover:bg-muted text-white text-sm font-medium shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <span>{isEn ? 'Next: Student Details' : 'التالي: بيانات الطالب'}</span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>
    </div>
  );
};
