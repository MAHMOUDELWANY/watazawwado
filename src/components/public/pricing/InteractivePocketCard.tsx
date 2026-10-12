import React from 'react';
import { motion } from 'motion/react';
import { Check, Sparkles, Star, ArrowUpRight, Flame, CreditCard, CalendarCheck } from 'lucide-react';
import { Language } from '../../../types';

export interface PricingPlan {
  id: string;
  name: string;
  arabicName: string;
  subtitle: string;
  arabicSubtitle: string;
  lessonsCount: number;
  durationMin: number;
  price: number;
  perLessonPrice: number;
  badge?: string;
  arabicBadge?: string;
  isPopular?: boolean;
  psychologicalHook: string;
  arabicPsychologicalHook: string;
  unitComparison: string;
  arabicUnitComparison: string;
  savingBadge?: string;
  arabicSavingBadge?: string;
  features: string[];
  arabicFeatures: string[];
}

interface InteractivePocketCardProps {
  plan: PricingPlan;
  lang: Language;
  isExpanded?: boolean;
  onToggle?: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
  onInstantCheckout?: (plan: PricingPlan) => void;
}

export function InteractivePocketCard({
  plan,
  lang,
  onSelectPlan,
  onInstantCheckout
}: InteractivePocketCardProps) {
  const isEn = lang === 'en';
  const isAr = lang === 'ar';

  const features = isEn ? plan.features : plan.arabicFeatures;
  const badgeText = isEn ? plan.badge : (plan.arabicBadge || plan.badge);
  const hookText = isEn ? plan.psychologicalHook : plan.arabicPsychologicalHook;
  const unitText = isEn ? plan.unitComparison : plan.arabicUnitComparison;
  const savingText = isEn ? plan.savingBadge : plan.arabicSavingBadge;

  return (
    <motion.div
      data-pricing-plan-id={plan.id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`relative w-full max-w-sm mx-auto rounded-3xl transition-all duration-300 flex flex-col justify-between ${
        plan.isPopular
          ? 'glass-card border-2 border-primary/50 shadow-xl shadow-primary/5 ring-1 ring-primary/20'
          : 'glass-card border border-border/70 hover:border-border shadow-md'
      }`}
    >
      {/* 4-Color Gradient Top Edge Accent */}
      <div className={`h-1.5 w-full rounded-t-3xl ${
        plan.isPopular
          ? 'bg-[linear-gradient(135deg,#C51F24_0%,#8B4935_40%,#D8C6AE_75%,#087D91_100%)]'
          : 'bg-[linear-gradient(135deg,rgba(197,31,36,0.5)_0%,rgba(8,125,145,0.5)_100%)]'
      }`} />

      {/* Main Card Content */}
      <div className="p-6 sm:p-7 flex flex-col justify-between flex-1 space-y-6">
        <div className="space-y-4">
          {/* Header Badges */}
          <div className="flex items-center justify-between gap-2 min-h-[28px]">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              plan.isPopular
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-primary/10 text-primary border border-primary/20'
            }`}>
              {plan.isPopular ? <Flame className="w-3.5 h-3.5 fill-current" /> : <Sparkles className="w-3.5 h-3.5" />}
              <span>{badgeText || (isEn ? 'Monthly Package' : 'باقة دراسية')}</span>
            </span>

            {savingText && (
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 rounded-md">
                {savingText}
              </span>
            )}
          </div>

          {/* Title & Subtitle */}
          <div>
            <h3 className="font-editorial text-2xl font-bold text-foreground">
              {isEn ? plan.name : plan.arabicName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 leading-relaxed">
              {isEn ? plan.subtitle : plan.arabicSubtitle}
            </p>
          </div>

          {/* Crystal-Clear Pricing Box (Always Visible) */}
          <div className="p-4 rounded-2xl glass-surface border border-border/80 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                  {isEn ? 'Per-Lesson Rate' : 'سعر الحصة الواحدة'}
                </span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="font-editorial text-3xl font-extrabold text-foreground">
                    ${plan.perLessonPrice.toFixed(2)}
                  </span>
                  <span className="text-xs text-muted-foreground font-medium">
                    {isEn ? '/ 60 min' : '/ ٦٠ دقيقة'}
                  </span>
                </div>
              </div>

              <div className="text-end">
                <span className="text-[10px] text-muted-foreground block">
                  {isEn ? 'Monthly Total' : 'الإجمالي الشهري'}
                </span>
                <span className="font-editorial text-2xl font-bold text-primary block mt-0.5">
                  ${plan.price}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  {isEn ? `(${plan.lessonsCount} sessions)` : `(${plan.lessonsCount} حصص)`}
                </span>
              </div>
            </div>

            {/* Hook text */}
            <div className="pt-2 border-t border-border/50 text-[11px] text-primary font-medium flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span>{hookText}</span>
            </div>
          </div>

          {/* Features List */}
          <div className="space-y-2.5 pt-1">
            <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
              {isEn ? 'Included in this plan:' : 'مزايا الباقة المتضمنة:'}
            </span>
            {features.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-foreground/90 leading-relaxed">
                <span className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dual Actions: Trial Booking + Instant Automated Checkout */}
        <div className="space-y-2.5 pt-4 border-t border-border/60">
          {/* Primary CTA: Free Trial */}
          <button
            type="button"
            onClick={() => onSelectPlan(plan)}
            className={`w-full py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
              plan.isPopular
                ? 'btn-primary-material text-primary-foreground'
                : 'btn-primary-material text-primary-foreground opacity-95 hover:opacity-100'
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>{isEn ? 'Book Free Trial with this Plan' : 'احجز جلستك الأولى (مجانًا)'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-270" />
          </button>

          {/* Secondary CTA: Instant Checkout / Buy Package */}
          {onInstantCheckout && (
            <button
              type="button"
              onClick={() => onInstantCheckout(plan)}
              className="w-full py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-medium glass-surface hover:bg-surface-subtle text-foreground border border-border/80 hover:border-primary/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-primary" />
              <span>{isEn ? 'Instant Payment & Checkout' : 'الدفع الفوري وتأكيد الباقة'}</span>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
