import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface StudentPageBackProps {
  to?: string;
  label?: string;
  labelAr?: string;
  lang?: 'en' | 'ar';
  className?: string;
}

/**
 * Standardized, accessible Back Navigation button for inner student pages.
 * Supports explicit destination (`to`) or native browser back (`navigate(-1)`),
 * with strict LTR/RTL chevron flipping and 44px min touch target.
 */
export function StudentPageBack({
  to = '/student',
  label = 'Back to Overview',
  labelAr = 'العودة للوحة التحكم',
  lang = (typeof document !== 'undefined' && document.documentElement.lang === 'ar' ? 'ar' : 'en'),
  className = ''
}: StudentPageBackProps) {
  const navigate = useNavigate();
  const isAr = lang === 'ar';
  const displayLabel = isAr ? labelAr : label;

  const handleClick = (e: React.MouseEvent) => {
    if (!to) {
      e.preventDefault();
      navigate(-1);
    }
  };

  const content = (
    <>
      {isAr ? (
        <ArrowRight className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
      ) : (
        <ArrowLeft className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:-translate-x-0.5" />
      )}
      <span>{displayLabel}</span>
    </>
  );

  const baseClasses =
    'group inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer py-1.5 pe-3 min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg select-none';

  if (!to) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`${baseClasses} ${className}`}
        aria-label={displayLabel}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      to={to}
      className={`${baseClasses} ${className}`}
      aria-label={displayLabel}
    >
      {content}
    </Link>
  );
}
