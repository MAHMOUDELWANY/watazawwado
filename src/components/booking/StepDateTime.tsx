import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  Globe,
  Sun,
  Sunset,
  Moon,
  Check,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { bookingService } from '../../booking/bookingService';
import { DayAvailability, TimeSlot, Language, BookingMode, LessonDuration } from '../../booking/types';
import { TimezoneSelectorModal } from './TimezoneSelectorModal';
import { MAJOR_TIMEZONES } from '../../booking/mockData';
import { buildWhatsAppUrl } from '../../lib/whatsapp';

interface StepDateTimeProps {
  mode: BookingMode;
  duration?: LessonDuration;
  teacherId?: string;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  timezone: string;
  onSelectDate: (dateStr: string) => void;
  onSelectSlot: (slot: TimeSlot) => void;
  onSelectTimezone: (tz: string) => void;
  onNext: () => void;
  onBack: () => void;
  lang: Language;
}

export const StepDateTime: React.FC<StepDateTimeProps> = ({
  mode,
  duration,
  teacherId,
  selectedDate,
  selectedSlot,
  timezone,
  onSelectDate,
  onSelectSlot,
  onSelectTimezone,
  onNext,
  onBack,
  lang
}) => {
  const isEn = lang === 'en';

  const [days, setDays] = useState<DayAvailability[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeDateIndex, setActiveDateIndex] = useState<number>(0);
  const [tzModalOpen, setTzModalOpen] = useState<boolean>(false);

  // Load availability through the service boundary
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const effectiveDuration = duration || (mode === 'trial' ? 30 : 45);

    bookingService
      .getAvailability(timezone, effectiveDuration, teacherId)
      .then((data) => {
        if (!isMounted) return;
        setDays(data);
        setLoading(false);

        // If no date is currently selected, pick the first available day
        if (!selectedDate) {
          const firstAvail = data.find((d) => d.isAvailable && d.slots.length > 0);
          if (firstAvail) {
            onSelectDate(firstAvail.dateString);
            const defaultSlot = firstAvail.slots.find((s) => s.available);
            if (defaultSlot) onSelectSlot(defaultSlot);
          }
        } else {
          // If already selected, ensure active index matches
          const idx = data.findIndex((d) => d.dateString === selectedDate);
          if (idx !== -1) setActiveDateIndex(idx);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(isEn ? "I couldn't confirm the available times right now. Please try again in a moment." : "تعذر التأكد من الأوقات المتاحة حالياً. يرجى المحاولة بعد قليل.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [timezone, duration, teacherId, mode, isEn]);

  // Current selected day
  const currentDay = days.find((d) => d.dateString === selectedDate) || days[0];

  const handleDaySelect = (d: DayAvailability) => {
    onSelectDate(d.dateString);
    // If current selected slot is not valid for this day, choose first available slot
    const firstAvailSlot = d.slots.find((s) => s.available);
    if (firstAvailSlot) {
      onSelectSlot(firstAvailSlot);
    }
  };

  const handleNextDayWithAvailability = () => {
    const nextAvail = days.find((d, idx) => idx > activeDateIndex && d.isAvailable && d.slots.length > 0);
    if (nextAvail) {
      handleDaySelect(nextAvail);
    }
  };

  // Group slots by period
  const morningSlots = currentDay?.slots.filter((s) => s.period === 'morning') || [];
  const afternoonSlots = currentDay?.slots.filter((s) => s.period === 'afternoon') || [];
  const eveningSlots = currentDay?.slots.filter((s) => s.period === 'evening') || [];

  const matchedTz = MAJOR_TIMEZONES.find((t) => t.value === timezone);
  const timezoneReadable = matchedTz ? matchedTz.label : timezone;

  return (
    <div className="space-y-6">
      {/* Timezone Reassurance Banner with quick switcher */}
      <div className="p-3.5 rounded-2xl bg-surface border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-4 h-4 text-accent shrink-0" />
          <span className="text-foreground/70 dark:text-border/70">
            {isEn ? 'Times shown in your local time:' : 'المواعيد تظهر وفق توقيتك المحلي:'}
          </span>
          <span className="font-semibold text-muted-foreground">
            {timezoneReadable}
          </span>
        </div>

        <button
          type="button"
          onClick={() => setTzModalOpen(true)}
          className="text-xs text-primary hover:text-primary-hover font-medium underline cursor-pointer self-end sm:self-auto"
        >
          {isEn ? 'Change timezone' : 'تغيير المنطقة الزمنية'}
        </button>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3 text-foreground/60 dark:text-border/60">
          <RefreshCw className="w-6 h-6 animate-spin text-accent" />
          <span className="text-xs">
            {isEn ? 'Checking available teaching windows...' : 'جارٍ تحديث الأوقات المتاحة...'}
          </span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 text-xs text-red-800 dark:text-red-300 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setTzModalOpen(false)}
            className="underline ml-auto font-medium"
          >
            {isEn ? 'Retry' : 'إعادة المحاولة'}
          </button>
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          {/* Horizontal Date Picker Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-foreground/70 dark:text-border/70">
                {isEn ? '1. Select a Date (Upcoming 3 Weeks)' : '١. اختر التاريخ (الأسابيع الثلاثة القادمة)'}
              </label>
              <span className="text-[11px] text-foreground/55 dark:text-border/55">
                {isEn ? 'Swipe or click to view days' : 'انقر على اليوم لتصفح المواعيد'}
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {days.map((d) => {
                const isSelected = selectedDate === d.dateString;
                return (
                  <motion.button
                    key={d.dateString}
                    type="button"
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleDaySelect(d)}
                    className={`min-w-[76px] py-3 px-2 rounded-2xl border text-center transition-all cursor-pointer shrink-0 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'bg-muted-foreground text-white border-muted-foreground shadow-xs'
                        : d.isAvailable
                        ? 'bg-surface border-border text-foreground hover:border-accent/50'
                        : 'bg-black/5 dark:bg-white/5 border-transparent text-foreground/40 dark:text-border/40'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-semibold tracking-wider opacity-80">
                      {d.dayOfWeek}
                    </span>
                    <span className="text-base sm:text-lg font-display font-bold my-0.5">
                      {d.dayOfMonth}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {d.monthName}
                    </span>

                    {/* Dot indicator */}
                    <div className="mt-1">
                      {d.isAvailable ? (
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-primary' : 'bg-primary/70'
                          }`}
                        />
                      ) : (
                        <span className="text-[8px] opacity-50">•</span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Time Slots Area */}
          <div className="p-4 sm:p-5 rounded-2xl bg-surface-warm/50 dark:bg-surface border border-border">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-accent" />
                <span className="font-display text-sm font-medium text-foreground">
                  {currentDay?.dayOfWeek}, {currentDay?.monthName} {currentDay?.dayOfMonth}
                </span>
              </div>
              <span className="text-xs text-foreground/60 dark:text-border/60">
                {currentDay?.isAvailable
                  ? isEn
                    ? 'Available Starting Times'
                    : 'الأوقات المتاحة للبدء'
                  : isEn
                  ? 'No Open Slots'
                  : 'لا توجد مواعيد متاحة'}
              </span>
            </div>

            {/* EMPTY / NO AVAILABILITY STATE */}
            {!currentDay?.isAvailable ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="font-display text-base font-medium text-foreground">
                  {isEn ? 'No Slots Available on This Date' : 'لا توجد مواعيد متاحة في هذا اليوم'}
                </h4>
                <p className="text-xs text-foreground/70 dark:text-border/70 max-w-md mx-auto leading-relaxed">
                  {currentDay?.reasonUnavailable ||
                    (isEn
                      ? 'Mahmoud has scheduled prior teaching or revision on this date.'
                      : 'تم حجز كافة فترات هذا اليوم مسبقاً.')}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleNextDayWithAvailability}
                    className="px-4 py-2 rounded-xl bg-muted-foreground hover:bg-muted text-white text-xs font-medium cursor-pointer"
                  >
                    {isEn ? 'Jump to Next Available Day' : 'الانتقال لليوم التالي المتاح'}
                  </button>

                  <a
                    href={buildWhatsAppUrl('Assalamu Alaikum Ustadh Mahmoud, I would like to request a specific lesson time that is not open on the schedule.')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-background border border-border text-xs font-medium text-foreground dark:text-border hover:bg-surface-warm"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-accent" />
                    <span>{isEn ? 'Request Custom Time on WhatsApp' : 'طلب موعد خاص على واتساب'}</span>
                  </a>
                </div>
              </div>
            ) : (
              /* SLOTS GROUPED BY MORNING, AFTERNOON, EVENING */
              <div className="space-y-4">
                {/* Morning */}
                {morningSlots.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                      <span>{isEn ? 'Morning' : 'الفترة الصباحية'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {morningSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => onSelectSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-between ${
                              !slot.available
                                ? 'opacity-35 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent text-foreground/40'
                                : isSelected
                                ? 'bg-primary text-white border-primary font-medium shadow-xs'
                                : 'bg-background border-border text-foreground hover:border-primary'
                            }`}
                          >
                            <span className="text-xs">{slot.timeDisplay}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <span className="text-[10px] text-foreground/40 dark:text-border/40">
                                {slot.available ? (isEn ? 'Open' : 'متاح') : (isEn ? 'Booked' : 'محجوز')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Afternoon */}
                {afternoonSlots.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Sunset className="w-3.5 h-3.5 text-orange-400" />
                      <span>{isEn ? 'Afternoon' : 'فترة بعد الظهر'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {afternoonSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => onSelectSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-between ${
                              !slot.available
                                ? 'opacity-35 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent text-foreground/40'
                                : isSelected
                                ? 'bg-primary text-white border-primary font-medium shadow-xs'
                                : 'bg-background border-border text-foreground hover:border-primary'
                            }`}
                          >
                            <span className="text-xs">{slot.timeDisplay}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <span className="text-[10px] text-foreground/40 dark:text-border/40">
                                {slot.available ? (isEn ? 'Open' : 'متاح') : (isEn ? 'Booked' : 'محجوز')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Evening */}
                {eveningSlots.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mb-2">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{isEn ? 'Evening' : 'الفترة المسائية'}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {eveningSlots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => onSelectSlot(slot)}
                            className={`p-3 rounded-xl border text-center transition-all cursor-pointer flex items-center justify-between ${
                              !slot.available
                                ? 'opacity-35 cursor-not-allowed bg-black/5 dark:bg-white/5 border-transparent text-foreground/40'
                                : isSelected
                                ? 'bg-primary text-white border-primary font-medium shadow-xs'
                                : 'bg-background border-border text-foreground hover:border-primary'
                            }`}
                          >
                            <span className="text-xs">{slot.timeDisplay}</span>
                            {isSelected ? (
                              <Check className="w-3.5 h-3.5 text-white" />
                            ) : (
                              <span className="text-[10px] text-foreground/40 dark:text-border/40">
                                {slot.available ? (isEn ? 'Open' : 'متاح') : (isEn ? 'Booked' : 'محجوز')}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onBack}
          type="button"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-medium text-foreground/80 dark:text-border/80 hover:bg-surface-warm dark:hover:bg-surface-subtle transition-colors cursor-pointer"
        >
          <ArrowLeft className={`w-3.5 h-3.5 ${lang === 'ar' ? 'rotate-180' : ''}`} />
          <span>{isEn ? 'Back to Lesson Type' : 'الرجوع لنوع الدرس'}</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.03, y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={!selectedDate || !selectedSlot}
          className="inline-flex items-center gap-2 px-7 py-3 rounded-xl bg-muted-foreground hover:bg-muted text-white text-sm font-medium shadow-xs disabled:opacity-40 disabled:pointer-events-none transition-all cursor-pointer"
        >
          <span>{isEn ? 'Next: Review Booking' : 'التالي: مراجعة الحجز'}</span>
          <ArrowRight className={`w-4 h-4 ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </motion.button>
      </div>

      {/* Timezone Selector Modal */}
      <TimezoneSelectorModal
        isOpen={tzModalOpen}
        onClose={() => setTzModalOpen(false)}
        currentTimezone={timezone}
        onSelectTimezone={onSelectTimezone}
        lang={lang}
      />
    </div>
  );
};
