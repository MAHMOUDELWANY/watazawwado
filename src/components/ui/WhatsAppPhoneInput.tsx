import React, { useState, useEffect } from 'react';
import { Phone, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  findCountryByCode,
  validatePhoneNumber,
  cleanPhoneDigits
} from '../../lib/countryTimezones';

export interface WhatsAppPhoneInputProps {
  countryCode: string; // ISO 2-letter country code (e.g. 'EG', 'SA', 'US', 'GB')
  value: string; // The phone number (can be local digits or full international string)
  onChange: (fullNumber: string, isValid: boolean) => void;
  label?: string;
  isAr?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
}

export function WhatsAppPhoneInput({
  countryCode,
  value,
  onChange,
  label,
  isAr = true,
  required = true,
  className = '',
  id = 'whatsapp-phone-input'
}: WhatsAppPhoneInputProps) {
  const country = findCountryByCode(countryCode);

  // Local state for the editable part (digits without the dial code)
  const [localDigits, setLocalDigits] = useState<string>(() => {
    return cleanPhoneDigits(value || '', countryCode);
  });

  // Sync when value or countryCode changes externally
  useEffect(() => {
    const cleaned = cleanPhoneDigits(value || '', countryCode);
    if (cleaned !== localDigits) {
      setLocalDigits(cleaned);
    }
  }, [value, countryCode]);

  // Validation evaluation
  const validation = validatePhoneNumber(localDigits, countryCode);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const cleaned = cleanPhoneDigits(raw, countryCode);
    setLocalDigits(cleaned);

    const val = validatePhoneNumber(cleaned, countryCode);
    onChange(val.fullNumber, val.isValid);
  };

  const defaultLabel = isAr
    ? 'رقم الهاتف (يُشترط توفر واتساب عليه للتواصل وتنسيق الحصص)'
    : 'Phone Number (Must have active WhatsApp for coordination)';

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label with WhatsApp indication */}
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="block text-xs sm:text-sm font-semibold text-foreground">
          <span className="flex items-center gap-1.5">
            <span className="text-emerald-500 font-bold">●</span>
            <span>{label || defaultLabel}</span>
            {required && <span className="text-destructive font-bold">*</span>}
          </span>
        </label>
        
        {localDigits && (
          <span className={`text-[11px] font-medium flex items-center gap-1 ${
            validation.isValid ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
          }`}>
            {validation.isValid ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isAr ? 'رقم معتمد' : 'Valid number'}</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{isAr ? 'غير مكتمل' : 'Incomplete'}</span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Input container with locked country dial code prefix */}
      <div className="relative flex items-center rounded-xl border border-border glass-surface focus-within:glass-card focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-500/20 transition-all overflow-hidden">
        {/* Country Flag & Dial Code Pill */}
        <div className="px-3.5 py-2.5 bg-surface-subtle/80 border-e border-border/80 flex items-center gap-1.5 shrink-0 select-none text-foreground font-mono font-semibold text-sm">
          <span>{country.flag}</span>
          <span className="dir-ltr">{country.dialCode}</span>
        </div>

        {/* Local Number Input */}
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          dir="ltr"
          value={localDigits}
          onChange={handleInputChange}
          placeholder={country.phonePlaceholder}
          required={required}
          className="w-full px-3.5 py-2.5 bg-transparent text-foreground text-sm font-mono placeholder:text-muted-foreground/60 outline-none"
        />

        {/* WhatsApp Icon Indicator */}
        <div className="pe-3.5 text-emerald-500 shrink-0 select-none">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.298.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.354.101.174.449.741.964 1.201.662.591 1.221.774 1.394.86.174.086.275.072.376-.043.101-.116.433-.506.549-.68.116-.173.231-.145.39-.086s1.011.477 1.184.564.289.13.332.203c.043.072.043.419-.101.824z" />
          </svg>
        </div>
      </div>

      {/* Helper text / guidance */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>
          {isAr
            ? `المطلوب: ${country.phoneHintAr}`
            : `Format: ${country.phoneHintEn}`}
        </span>
        {localDigits && (
          <span className="font-mono dir-ltr text-foreground/80 font-medium">
            {country.dialCode}{localDigits}
          </span>
        )}
      </div>
    </div>
  );
}
