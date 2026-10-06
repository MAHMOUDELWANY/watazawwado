import React, { useState, useEffect } from 'react';
import { Globe, Clock, Compass, Check } from 'lucide-react';
import { DateTime } from 'luxon';
import {
  SERVED_COUNTRIES,
  ServedCountry,
  findCountryByTimezone,
  getTimezoneDisplayLabel,
  ALL_TIMEZONES
} from '../../lib/countryTimezones';

export interface CountryTimezonePickerProps {
  country?: string | null;
  timezone: string;
  onCountryChange?: (countryCode: string) => void;
  onTimezoneChange: (timezone: string) => void;
  isAr?: boolean;
  className?: string;
  showTimePreview?: boolean;
}

export function CountryTimezonePicker({
  country: initialCountryCode,
  timezone,
  onCountryChange,
  onTimezoneChange,
  isAr = false,
  className = '',
  showTimePreview = true
}: CountryTimezonePickerProps) {
  // Determine initial selected country from code or timezone
  const [selectedCountry, setSelectedCountry] = useState<ServedCountry>(() => {
    if (initialCountryCode) {
      const match = SERVED_COUNTRIES.find((c) => c.code === initialCountryCode);
      if (match) return match;
    }
    return findCountryByTimezone(timezone);
  });

  // Track live clock preview in selected timezone
  const [currentTimePreview, setCurrentTimePreview] = useState<string>('');

  useEffect(() => {
    if (initialCountryCode) {
      const match = SERVED_COUNTRIES.find((c) => c.code === initialCountryCode);
      if (match && match.code !== selectedCountry.code) {
        setSelectedCountry(match);
      }
    }
  }, [initialCountryCode]);

  useEffect(() => {
    try {
      const dt = DateTime.now().setZone(timezone || 'UTC');
      if (dt.isValid) {
        setCurrentTimePreview(
          dt.setLocale(isAr ? 'ar' : 'en').toFormat('hh:mm:ss a (ZZZZ)')
        );
      }
    } catch {
      setCurrentTimePreview('');
    }
  }, [timezone, isAr]);

  const handleCountrySelect = (countryCode: string) => {
    const match = SERVED_COUNTRIES.find((c) => c.code === countryCode);
    if (!match) return;
    setSelectedCountry(match);
    onCountryChange?.(match.code);

    // If the currently selected timezone is not in the new country, pick the first timezone of that country
    const hasTz = match.timezones.some((t) => t.value === timezone);
    if (!hasTz && match.timezones.length > 0) {
      onTimezoneChange(match.timezones[0].value);
    }
  };

  const handleDetectDevice = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected && DateTime.now().setZone(detected).isValid) {
        onTimezoneChange(detected);
        const countryMatch = findCountryByTimezone(detected);
        setSelectedCountry(countryMatch);
        onCountryChange?.(countryMatch.code);
      }
    } catch {}
  };

  return (
    <div className={`space-y-3.5 ${className}`}>
      {/* 1. Country Selection */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-foreground mb-1.5">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-accent" />
            <span>{isAr ? 'الدولة / مكان الإقامة' : 'Country of Residence'}</span>
          </span>
        </label>
        <select
          value={selectedCountry.code}
          onChange={(e) => handleCountrySelect(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors cursor-pointer"
        >
          {SERVED_COUNTRIES.map((c) => (
            <option key={c.code} value={c.code} className="bg-surface text-foreground">
              {c.flag} {isAr ? c.nameAr : c.name}
            </option>
          ))}
        </select>
      </div>

      {/* 2. Timezone Selection for Chosen Country */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs sm:text-sm font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-accent" />
              <span>{isAr ? 'المنطقة الزمنية (التوقيت المحلي)' : 'Local Timezone'}</span>
            </span>
          </label>
          <button
            type="button"
            onClick={handleDetectDevice}
            className="text-xs text-primary hover:text-primary-hover transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
            title={isAr ? 'كشف توقيت جهازي تلقائياً' : 'Detect from my device'}
          >
            <Compass className="w-3 h-3" />
            <span>{isAr ? 'تحديد تلقائي من جهازي' : 'Auto-detect'}</span>
          </button>
        </div>

        <select
          value={timezone}
          onChange={(e) => onTimezoneChange(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border border-border glass-surface text-foreground text-sm focus:border-primary focus:ring-2 focus:ring-primary/40 outline-none transition-colors cursor-pointer"
        >
          {/* Options for selected country first */}
          <optgroup label={isAr ? `توقيتات ${selectedCountry.nameAr}` : `Timezones for ${selectedCountry.name}`}>
            {selectedCountry.timezones.map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-surface text-foreground">
                {isAr ? `${tz.labelAr} (${tz.offset})` : `${tz.label} (${tz.offset})`}
              </option>
            ))}
          </optgroup>

          {/* All other available world timezones */}
          <optgroup label={isAr ? 'جميع المناطق الزمنية الأخرى' : 'Other World Timezones'}>
            {ALL_TIMEZONES.filter((tz) => !selectedCountry.timezones.some((t) => t.value === tz.value)).map((tz) => (
              <option key={tz.value} value={tz.value} className="bg-surface text-foreground">
                {isAr ? `${tz.labelAr} (${tz.offset})` : `${tz.label} (${tz.offset})`}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 3. Live Clock Preview Banner */}
      {showTimePreview && currentTimePreview && (
        <div className="p-2.5 rounded-xl glass-surface border border-border/70 flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span>{isAr ? 'الوقت الحالي في منطقتك:' : 'Current time in this zone:'}</span>
          </span>
          <span className="font-mono font-medium text-foreground dir-ltr">
            {currentTimePreview}
          </span>
        </div>
      )}
    </div>
  );
}
