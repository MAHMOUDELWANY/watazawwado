import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { BOOKABLE_SERVICES } from '../../booking/mockData';
import { serviceIdForInterest } from '../../booking/serviceInterest';
import { BookingFormData, Language, ProficiencyLevel } from '../../booking/types';

/**
 * Screen 1 for a signed-in student (owner, 2026-10-28): who is learning and what, taken from the profile.
 * Name, email, phone and age are never asked again here; they are changed on the account page. The subject
 * and level are prefilled for each learner and can be changed for this booking with one tap ("Change").
 */

const LEVELS: Array<{ key: ProficiencyLevel; en: string; ar: string }> = [
  { key: 'beginner', en: 'Beginner', ar: 'مبتدئ' },
  { key: 'elementary', en: 'Elementary', ar: 'أساسي' },
  { key: 'intermediate', en: 'Intermediate', ar: 'متوسط' },
  { key: 'advanced', en: 'Advanced', ar: 'متقدم' },
];

interface StepLearnerProps {
  formData: BookingFormData;
  update: (fields: Partial<BookingFormData>) => void;
  linkedChildren?: any[];
  /** The account may book for its children (family). */
  canBookForChild?: boolean;
  studentName?: string;
  lang: Language;
}

const chip = (active: boolean) =>
  `min-h-11 px-4 rounded-xl border text-sm font-semibold cursor-pointer focus-ring transition-colors ${
    active ? 'border-[#0A2E35] bg-[#0A2E35] text-white dark:border-teal dark:bg-teal/20 dark:text-foreground' : 'border-border bg-surface text-foreground hover:border-foreground/40'
  }`;

export const StepLearner: React.FC<StepLearnerProps> = ({ formData, update, linkedChildren = [], canBookForChild = false, studentName, lang }) => {
  const isAr = lang === 'ar';
  const [editing, setEditing] = useState(false);
  const isChild = formData.audience === 'child';
  const level = isChild ? formData.childLevel : formData.currentLevel;
  const service = BOOKABLE_SERVICES.find((s) => s.id === formData.serviceId) || BOOKABLE_SERVICES[0];
  const levelLabel = LEVELS.find((l) => l.key === level);
  const family = canBookForChild && linkedChildren.length > 0;
  const selfName = formData.studentName || studentName || (isAr ? 'أنا' : 'Me');

  const pickChild = (child: any) => update({
    audience: 'child',
    studentId: child.id,
    childName: child.name,
    childLevel: (child.current_level || child.currentLevel || 'beginner') as ProficiencyLevel,
    parentName: formData.parentName || formData.studentName || studentName || '',
    parentEmail: formData.parentEmail || formData.email || '',
    parentWhatsapp: formData.parentWhatsapp || formData.whatsapp || '',
    serviceId: serviceIdForInterest(child.learningInterest || child.learning_interest),
    goal: '',
  });
  const pickSelf = () => update({ audience: 'adult', studentId: undefined, goal: '' });

  return (
    <div className="space-y-5" data-testid="booking-learner-step">
      {family && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">{isAr ? 'الحصة لمين؟' : 'Who is this lesson for?'}</p>
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {linkedChildren.map((c: any) => {
              const active = isChild && formData.studentId === c.id;
              return (
                <button key={c.id} type="button" role="radio" aria-checked={active} onClick={() => pickChild(c)} className={chip(active)}>
                  {c.name}
                </button>
              );
            })}
            <button type="button" role="radio" aria-checked={!isChild} onClick={pickSelf} className={chip(!isChild)}>
              {selfName}
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">
              {isChild ? (isAr ? `${formData.childName} · من الملف` : `${formData.childName} · from the profile`) : (isAr ? 'من ملفك' : 'From your profile')}
            </p>
            <p className="font-display text-lg font-bold text-foreground mt-0.5">
              {isAr ? service.arabicName : service.name}
              {levelLabel && <span className="text-base font-semibold text-muted-foreground"> · {isAr ? levelLabel.ar : levelLabel.en}</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            aria-expanded={editing}
            className="shrink-0 min-h-11 px-3 text-sm font-semibold text-foreground underline underline-offset-4 cursor-pointer focus-ring rounded"
          >
            {editing ? (isAr ? 'تم' : 'Done') : (isAr ? 'غيّر' : 'Change')}
          </button>
        </div>

        {editing && (
          <div className="mt-4 pt-4 border-t border-border space-y-4">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{isAr ? 'المادة' : 'Subject'}</p>
              <div className="flex flex-wrap gap-2">
                {BOOKABLE_SERVICES.map((s) => (
                  <button key={s.id} type="button" aria-pressed={s.id === formData.serviceId} onClick={() => update({ serviceId: s.id, goal: '' })} className={chip(s.id === formData.serviceId)}>
                    {isAr ? s.arabicName : s.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">{isAr ? 'المستوى' : 'Level'}</p>
              <div className="flex flex-wrap gap-2">
                {LEVELS.map((l) => (
                  <button key={l.key} type="button" aria-pressed={l.key === level} onClick={() => update(isChild ? { childLevel: l.key } : { currentLevel: l.key })} className={chip(l.key === level)}>
                    {isAr ? l.ar : l.en}
                    {l.key === level && <Check className="inline w-4 h-4 ms-1.5 -mt-0.5" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr ? 'التغيير ده للحصة دي بس. ملفك بيفضل زي ما هو.' : 'This change is for this booking only; the profile stays as it is.'}
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isAr ? 'بيانات التواصل من حسابك. ' : 'Contact details come from your account. '}
        <Link to="/student/account" className="underline font-semibold text-foreground">{isAr ? 'تعديلها' : 'Edit them'}</Link>
      </p>
    </div>
  );
};
