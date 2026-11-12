import React from 'react';

/**
 * "I accept the terms" as one tappable row (P4-015): the whole sentence ticks the box, and the terms open from a
 * separate link under it, so a tap on a phone never lands on the link by mistake.
 */
export function TermsConsent({ checked, onChange, isAr }: { checked: boolean; onChange: (v: boolean) => void; isAr: boolean }) {
  return (
    <div>
      <label className="flex items-start gap-3 min-h-11 py-1 text-sm text-foreground cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5 w-5 h-5 shrink-0 accent-[#087D91] cursor-pointer"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span>
          {isAr ? 'قرأت ووافقت على الشروط وسياسة الإلغاء والاسترداد.' : 'I have read and accept the terms and the cancellation & refund policy.'}
        </span>
      </label>
      <a
        href={isAr ? '/ar/terms' : '/terms'}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center min-h-11 ms-8 text-xs font-semibold text-primary underline underline-offset-4"
      >
        {isAr ? 'اقرأ الشروط' : 'Read the terms'}
      </a>
    </div>
  );
}
