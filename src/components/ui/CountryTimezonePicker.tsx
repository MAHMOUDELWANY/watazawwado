import React, { useState, useEffect } from 'react';
import { Globe, Clock, ShieldCheck, Check } from 'lucide-react';
import { DateTime } from 'luxon';
import {
  SERVED_COUNTRIES,
  ServedCountry,
  findCountryByCode,
  findCountryByTimezone,
  getTimezoneDisplayLabel
} from '../../lib/countryTimezones';

export interface CountryTimezonePickerProps {
  country?: string | null;
  timezone: string;
  onCountryChange?: (countryCode: string) => void;
  onTimezoneChange: (timezone: string) => void;
  onDialCodeChange?: (dialCode: string) => void;
  isAr?: boolean;
  className?: string;
  showTimePreview?: boolean;
}

export function CountryTimezonePicker({
  country: initialCountryCode,
  timezone,
  onCountryChange,
  onTimezoneChange,
  onDialCodeChange,
  isAr = false,
  className = '',
  showTimePreview = true
}: CountryTimezonePickerProps) {
  // Determine selected country from code or timezone
  const [selectedCountry, setSelectedCountry] = useState<ServedCountry>(() => {
    if (initialCountryCode) {
      return findCountryByCode(initialCountryCode);
    }
    return findCountryByTimezone(timezone);
  });

  // Track live clock preview in selected timezone
  const [currentTimePreview, setCurrentTimePreview] = useState<string>('');

  useEffect(() => {
    if (initialCountryCode) {
      const match = findCountryByCode(initialCountryCode);
      if (match && match.code !== selectedCountry.code) {
        setSelectedCountry(match);
      }
    }
  }, [initialCountryCode]);

  useEffect(() => {
    try {
      const dt = DateTime.now().setZone(timezone || selectedCountry.primaryTimezone || 'UTC');
      if (dt.isValid) {
        setCurrentTimePreview(
          dt.setLocale(isAr ? 'ar' : 'en').toFormat('hh:mm:ss a (ZZZZ)')
        );
      }
    } catch {
      setCurrentTimePreview('');
    }
  }, [timezone, selectedCountry, isAr]);

  const handleCountrySelect = (countryCode: string) => {
    const match = findCountryByCode(countryCode);
    setSelectedCountry(match);
    onCountryChange?.(match.code);
    onDialCodeChange?.(match.dialCode);

    // Automatically set and lock timezone to the country's primary timezone
    const resolvedTz = match.primaryTimezone || (match.timezones[0]?.value) || 'UTC';
    onTimezoneChange(resolvedTz);
  };

  // Resolve current active timezone display label
  const activeTzLabel = getTimezoneDisplayLabel(timezone || selectedCountry.primaryTimezone, isAr);

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Country Selection */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'دولة الإقامة (يُحدد التوقيت وكود الهاتف تلقائياً)' : 'Country of Residence (Auto-sets timezone & phone code)'}</span>
          </span>
        </label>
        <select
          value={selectedCountry.code}
          onChange={(e) => handleCountrySelect(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 outline-none transition-colors cursor-pointer"
        >
          {SERVED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-surface text-foreground">
              {c.flag} {isAr ? c.nameAr : c.name} ({c.dialCode})
            </option>
          ))}
        </select>
      </div>

      {/* 2. Automated & Locked Timezone Indicator (User cannot change manually, changes via country) */}
      <div className="p-3.5 rounded-2xl glass-surface border border-border/80 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Clock className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>{isAr ? 'التوقيت المعتمد للدولة (تلقائي):' : 'Standard Country Timezone (Automated):'}</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-3 h-3" />
            <span>{isAr ? 'محدد تلقائياً' : 'Auto-detected'}</span>
          </span>
        </div>

        <div className="text-sm font-medium text-foreground">
          {activeTzLabel}
        </div>

        {/* Live Clock Preview */}
        {showTimePreview && currentTimePreview && (
          <div className="pt-1.5 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isAr ? 'الساعة الآن في هذه الدولة:' : 'Current local time:'}</span>
            </span>
            <span className="font-mono font-medium text-foreground dir-ltr">
              {currentTimePreview}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
