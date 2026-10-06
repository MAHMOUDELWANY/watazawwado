import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, ChevronUp, Sparkles, Star, ArrowUpRight, Flame } from 'lucide-react';
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
  // Psychological pricing anchors
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
  isExpanded: boolean;
  onToggle: () => void;
  onSelectPlan: (plan: PricingPlan) => void;
}

export function InteractivePocketCard({
  plan,
  lang,
  isExpanded,
  onToggle,
  onSelectPlan
}: InteractivePocketCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const isEn = lang === 'en';
  
  // Either active via click/tap or hovered on desktop
  const active = isExpanded || isHovered;

  const features = isEn ? plan.features : plan.arabicFeatures;
  const badgeText = isEn ? plan.badge : (plan.arabicBadge || plan.badge);
  const hookText = isEn ? plan.psychologicalHook : plan.arabicPsychologicalHook;
  const unitText = isEn ? plan.unitComparison : plan.arabicUnitComparison;
  const savingText = isEn ? plan.savingBadge : plan.arabicSavingBadge;

  return (
    <div
      data-pricing-plan-id={plan.id}
      className="relative pt-[285px] pb-6 select-none group/pocket w-full max-w-[340px] mx-auto"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Outer Envelope Wrapper (Identical height for all cards) */}
      <div
        onClick={onToggle}
        className={`relative w-full h-[260px] rounded-3xl cursor-pointer transition-transform duration-300 ${
          active ? 'scale-[1.01]' : 'hover:scale-[1.005]'
        }`}
      >
        {/* ========================================================= */}
        {/* 1. SLIDING TICKET (EMERGES OUT WITH SPRING ANIMATION)     */}
        {/* Slides UP when active (tapped or hovered)                 */}
        {/* ========================================================= */}
        <motion.div
          animate={{
            // When closed: tucked 90px down inside front envelope flap
            // When active: smoothly slides -155px UP, revealing full pricing & perks
            y: active ? -155 : 90,
            scale: active ? 1 : 0.96,
            opacity: active ? 1 : 0,
            boxShadow: active
              ? '0 24px 38px -10px rgba(0, 0, 0, 0.28)'
              : '0 4px 10px -2px rgba(0, 0, 0, 0.05)'
          }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 24,
            mass: 0.75
          }}
          className={`absolute inset-x-2.5 bottom-3.5 h-[360px] rounded-2xl bg-surface border border-border p-5 z-10 flex flex-col justify-between transition-colors overflow-hidden ${
            plan.isPopular ? 'ring-2 ring-teal-600/40 shadow-xl' : 'shadow-md'
          }`}
        >
          {/* Top Heritage Accent Bar */}
          <div className="h-1.5 -mx-5 -mt-5 mb-2 bg-[linear-gradient(135deg,#C51F24_0%,#8B4935_45%,#D8C6AE_85%,#087D91_100%)]" />

          {/* Ticket Header & Psychological Anchors */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2 h-6">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                plan.isPopular 
                  ? 'bg-teal-600 text-white shadow-xs' 
                  : 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/20'
              }`}>
                {plan.isPopular ? <Flame className="w-3 h-3 fill-current" /> : <Sparkles className="w-3 h-3" />}
                <span>{badgeText || (isEn ? 'Private Package' : 'باقة دراسية خاصة')}</span>
              </span>

              {savingText ? (
                <span className="text-[11px] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {savingText}
                </span>
              ) : <span />}
            </div>

            {/* Plan Title */}
            <h4 className="font-editorial text-xl font-bold text-foreground leading-tight">
              {isEn ? plan.name : plan.arabicName}
            </h4>

            {/* Psychological Framing: Per-lesson price large, monthly total small */}
            <div className="mt-2.5 p-2.5 rounded-xl bg-surface-subtle border border-border/70">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    {isEn ? 'Per lesson rate' : 'تكلفة الحصة الواحدة'}
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="font-editorial text-2xl sm:text-3xl font-extrabold text-foreground">
                      ${plan.perLessonPrice}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {isEn ? '/ lesson' : '/ للحصة'}
                    </span>
                  </div>
                </div>

                <div className="text-end">
                  <span className="text-[10px] text-muted-foreground block">
                    {isEn ? 'Monthly Total' : 'الإجمالي الشهري'}
                  </span>
                  <span className="font-editorial text-xl font-bold text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    {isEn ? `(${plan.lessonsCount} lessons)` : `(${plan.lessonsCount} حصص)`}
                  </span>
                </div>
              </div>

              {/* Psychological micro-anchor */}
              <div className="mt-2 pt-1.5 border-t border-border/40 text-[10px] sm:text-[11px] text-teal-800 dark:text-teal-300 font-medium flex items-center gap-1">
                <Sparkles className="w-3 h-3 shrink-0" />
                <span>{unitText}</span>
              </div>
            </div>

            {/* 3 Clean Features */}
            <div className="space-y-1.5 pt-2.5 mt-2 border-t border-border/60">
              {features.slice(0, 3).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs leading-relaxed text-foreground/90">
                  <span className="p-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5">
                    <Check className="w-3 h-3" />
                  </span>
                  <span className="line-clamp-1">{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket Single CTA Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelectPlan(plan);
            }}
            className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-md ${
              plan.isPopular
                ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
                : 'bg-surface hover:bg-teal-600 hover:text-white text-foreground border border-border/90 hover:border-transparent'
            }`}
          >
            <span>{isEn ? 'Start Free Trial with this Plan' : 'ابدأ جلستك المجانية بهذه الباقة'}</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-270" />
          </button>
        </motion.div>

        {/* ========================================================= */}
        {/* 2. FRONT ENVELOPE / SLEEVE (UNIFORM IDENTICAL HEIGHT: 260px) */}
        {/* ========================================================= */}
        <div
          className={`relative z-20 w-full h-full rounded-3xl p-[2px] transition-all duration-300 ${
            plan.isPopular
              ? 'bg-[linear-gradient(135deg,#C51F24_0%,#8B4935_45%,#D8C6AE_85%,#087D91_100%)] shadow-lg shadow-teal-900/10 dark:shadow-teal-900/20'
              : 'bg-[linear-gradient(135deg,rgba(197,31,36,0.6)_0%,rgba(139,73,53,0.5)_45%,rgba(216,198,174,0.6)_85%,rgba(8,125,145,0.7)_100%)] hover:bg-[linear-gradient(135deg,#C51F24_0%,#8B4935_45%,#D8C6AE_85%,#087D91_100%)] shadow-sm'
          }`}
        >
          {/* Inner Clean Solid Surface (Covers inner ticket 100%) */}
          <div className="w-full h-full rounded-[inherit] bg-surface p-5 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Top Grip Tab on Envelope */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-3 bg-surface-subtle border-b border-x border-border/70 rounded-b-xl flex items-center justify-center">
              <span className="w-8 h-1 rounded-full bg-[linear-gradient(135deg,#C51F24_0%,#087D91_100%)] opacity-80" />
            </div>

            {/* Front Card Header & Hook */}
            <div className="pt-2 space-y-2">
              <div className="flex items-center justify-between h-6">
                <span className="text-xs font-mono font-bold text-muted-foreground px-2 py-0.5 rounded-md bg-surface-subtle border border-border/50">
                  {isEn ? `${plan.lessonsCount} Private Sessions` : `${plan.lessonsCount} حصص شهرية`}
                </span>

                <div className="flex items-center gap-1">
                  {savingText && !plan.isPopular && (
                    <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      {savingText}
                    </span>
                  )}
                  {plan.isPopular && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 dark:text-teal-200 bg-teal-500/15 border border-teal-500/30 px-2 py-0.5 rounded-full">
                      <Star className="w-3 h-3 fill-current text-teal-600 dark:text-teal-400" />
                      <span>{isEn ? 'Most Chosen' : 'الأكثر طلباً'}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title */}
              <h3 className="font-editorial text-xl font-bold text-foreground">
                {isEn ? plan.name : plan.arabicName}
              </h3>

              {/* Psychological Subtitle / Value Hook */}
              <p className="text-xs text-muted-foreground leading-relaxed h-8 line-clamp-2">
                {isEn ? plan.subtitle : plan.arabicSubtitle}
              </p>

              {/* Psychological outcome teaser */}
              <div className="text-[11px] text-teal-800 dark:text-teal-300 font-semibold pt-1 truncate">
                {hookText}
              </div>
            </div>

            {/* Bottom Pull Interactive Cue (NO NUMBERS VISIBLE OUTSIDE) */}
            <div className="pt-3 border-t border-border/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-foreground group-hover/pocket:text-teal-700 dark:group-hover/pocket:text-teal-300 transition-colors">
                <motion.div
                  animate={{ y: active ? [0, -4, 0] : [0, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                  className="text-teal-600 dark:text-teal-400"
                >
                  <ChevronUp className="w-4 h-4" />
                </motion.div>
                <span>
                  {active
                    ? (isEn ? 'Pricing revealed' : 'تم كشف تفاصيل السعر')
                    : (isEn ? 'Tap or hover to reveal price' : 'اسحب أو اضغط لكشف السعر')}
                </span>
              </div>

              <span className="text-[11px] text-muted-foreground font-medium">
                {isEn ? 'Full details' : 'كافة المزايا'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
