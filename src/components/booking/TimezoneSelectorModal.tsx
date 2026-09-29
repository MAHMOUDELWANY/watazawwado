import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Search, Globe, Check } from 'lucide-react';
import { MAJOR_TIMEZONES } from '../../booking/mockData';
import { Language } from '../../booking/types';

interface TimezoneSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTimezone: string;
  onSelectTimezone: (tz: string) => void;
  lang: Language;
}

export const TimezoneSelectorModal: React.FC<TimezoneSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTimezone,
  onSelectTimezone,
  lang
}) => {
  const isEn = lang === 'en';
  const [search, setSearch] = useState('');

  const filtered = MAJOR_TIMEZONES.filter(
    (tz) =>
      tz.label.toLowerCase().includes(search.toLowerCase()) ||
      tz.city.toLowerCase().includes(search.toLowerCase()) ||
      tz.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-foreground/70 backdrop-blur-xs"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="w-full max-w-md bg-foreground glass-card rounded-3xl border border-secondary/60 shadow-2xl p-6 text-foreground max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-accent" />
                <h3 className="font-display text-lg font-medium">
                  {isEn ? 'Select Your Timezone' : 'اختر منطقتك الزمنية'}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded-full text-foreground/60 dark:text-border/60 hover:bg-surface-warm dark:hover:bg-surface-subtle cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-foreground/50 dark:text-border/50" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isEn ? 'Search city or timezone (e.g. Toronto, London)...' : 'ابحث عن مدينة أو منطقة زمنية...'}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 py-1">
              {filtered.map((tz) => {
                const isSelected = currentTimezone === tz.value;
                return (
                  <button
                    key={tz.value}
                    type="button"
                    onClick={() => {
                      onSelectTimezone(tz.value);
                      onClose();
                    }}
                    className={`w-full p-3 rounded-xl text-start transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-muted-foreground text-white'
                        : 'bg-white/80 dark:bg-background text-foreground dark:text-border hover:bg-surface-warm dark:hover:bg-surface-subtle'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-medium">{tz.label}</div>
                      <div className={`text-[11px] ${isSelected ? 'text-white/80' : 'text-foreground/60 dark:text-border/60'}`}>
                        {tz.city} • {tz.offset}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
