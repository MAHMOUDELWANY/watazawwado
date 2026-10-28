import React from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { BookingMode, Language } from '../../booking/types';

interface BookingHeaderProps {
  step: number;
  totalSteps: number;
  mode: BookingMode;
  lang: Language;
  onBack?: () => void;
  onClose?: () => void;
  serviceName?: string;
}

/**
 * Calm header (owner, 2026-10-28): back, the step and its title, four progress segments. No WhatsApp badge or
 * lesson-type pill (they crowded phones); a free trial still says so under the title.
 */
export const BookingHeader: React.FC<BookingHeaderProps> = ({ step, totalSteps, mode, lang, onBack, onClose }) => {
  const isEn = lang === 'en';
  // Four screens (owner D4, 2026-10-28): what, length & plan, time, review & pay.
  const stepTitles = isEn
    ? ['What you will learn', 'Length and plan', 'Pick a time', 'Review and pay']
    : ['هتتعلم إيه', 'المدة والخطة', 'اختار الميعاد', 'راجع وادفع'];

  return (
    <div className="pb-5 mb-5 sm:mb-7 border-b border-border/80">
      <div className="flex items-center justify-between gap-3 min-h-11">
        {step > 1 && onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 min-h-11 -ms-2 px-2 rounded-lg text-sm font-semibold text-foreground hover:bg-surface-subtle cursor-pointer focus-ring"
          >
            <ArrowLeft className={`w-4 h-4 ${isEn ? '' : 'rotate-180'}`} />
            <span>{isEn ? 'Back' : 'رجوع'}</span>
          </button>
        ) : (
          <span className="text-sm font-semibold text-muted-foreground">{isEn ? `Step ${step} of ${totalSteps}` : `الخطوة ${step} من ${totalSteps}`}</span>
        )}
        {step > 1 && onBack && (
          <span className="text-sm font-semibold text-muted-foreground">{isEn ? `Step ${step} of ${totalSteps}` : `الخطوة ${step} من ${totalSteps}`}</span>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-surface-subtle cursor-pointer focus-ring"
            aria-label={isEn ? 'Close' : 'إغلاق'}
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <h2 className="mt-2 font-display text-2xl sm:text-3xl font-medium text-foreground">{stepTitles[step - 1] || ''}</h2>
      {mode === 'trial' && (
        <p className="text-sm text-muted-foreground mt-1">{isEn ? 'Free 30-minute trial' : 'حصة تجريبية مجانية، 30 دقيقة'}</p>
      )}

      <div className="mt-4 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${totalSteps}, minmax(0, 1fr))` }} aria-hidden="true">
        {Array.from({ length: totalSteps }, (_, i) => (
          <span key={i} className={`h-1.5 rounded-full transition-colors duration-300 ${i < step ? 'bg-[#0A2E35] dark:bg-teal' : 'bg-border'}`} />
        ))}
      </div>
    </div>
  );
};
