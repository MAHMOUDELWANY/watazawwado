import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, Compass } from 'lucide-react';
import { BrandGlassCard } from './BrandGlassCard';
import { motion, AnimatePresence } from 'motion/react';

export interface OnboardingStep {
  targetId: string | string[]; // The DOM element ID or data-tour to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ReactNode;
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
}

interface TargetGeometry {
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export function OnboardingGuide({ steps, isOpen, onClose, isAr = false }: OnboardingGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetGeometry | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardHeight, setCardHeight] = useState(220);
  const rafIdRef = useRef<number | null>(null);

  // Reset step index to 0 whenever opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setTargetRect(null);
    }
    return () => {
      document.body.style.overflow = '';
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen]);

  // Measure card height when rendered
  useEffect(() => {
    if (cardRef.current) {
      const h = cardRef.current.offsetHeight;
      if (h > 60) setCardHeight(h);
    }
  }, [currentStepIndex, isOpen]);

  // Robust target element finder by data-tour, id, or css selector
  const findTargetElement = useCallback((): HTMLElement | null => {
    if (!isOpen || steps.length === 0) return null;
    const step = steps[currentStepIndex];
    if (!step) return null;

    const currentTargetId = step.targetId;
    const targetIds = Array.isArray(currentTargetId) ? currentTargetId : [currentTargetId];

    for (const id of targetIds) {
      if (!id) continue;
      // 1. Try data-tour attribute
      let el = document.querySelector(`[data-tour="${id}"]`) as HTMLElement | null;
      // 2. Try ID attribute
      if (!el) el = document.getElementById(id);
      // 3. Try CSS selector if starts with . or #
      if (!el && (id.startsWith('.') || id.startsWith('#'))) {
        try {
          el = document.querySelector(id) as HTMLElement | null;
        } catch {
          // ignore selector errors
        }
      }

      if (el) {
        const b = el.getBoundingClientRect();
        // Check if element has visible dimensions and is within layout
        if (b.width > 0 && b.height > 0) {
          return el;
        }
      }
    }
    return null;
  }, [isOpen, steps, currentStepIndex]);

  // Read coordinates with comfortable highlighting padding
  const calculateGeometry = (el: HTMLElement): TargetGeometry => {
    const rect = el.getBoundingClientRect();
    const pad = 8;
    return {
      x: Math.round(rect.left - pad),
      y: Math.round(rect.top - pad),
      left: Math.round(rect.left - pad),
      top: Math.round(rect.top - pad),
      width: Math.round(rect.width + pad * 2),
      height: Math.round(rect.height + pad * 2),
      right: Math.round(rect.right + pad),
      bottom: Math.round(rect.bottom + pad),
    };
  };

  // Tracking loop for smooth scroll & dynamic repositioning
  const updateTargetGeometry = useCallback(() => {
    const el = findTargetElement();
    if (el) {
      setTargetRect(calculateGeometry(el));
      return true;
    }
    return false;
  }, [findTargetElement]);

  useEffect(() => {
    if (!isOpen || steps.length === 0) return;

    let attempts = 0;
    const maxAttempts = 15; // Poll over ~300ms if target is animating or mounting

    const resolveTarget = () => {
      const found = updateTargetGeometry();
      if (!found && attempts < maxAttempts) {
        attempts++;
        rafIdRef.current = requestAnimationFrame(resolveTarget);
      } else if (found) {
        const el = findTargetElement();
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      }
    };

    resolveTarget();

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isOpen, currentStepIndex, steps, updateTargetGeometry, findTargetElement]);

  // Update on scroll & window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      updateTargetGeometry();
    };

    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate, { passive: true });
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
    };
  }, [isOpen, updateTargetGeometry]);

  // Keyboard navigation (Escape to close, Arrows to step)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        if (isAr) {
          if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1);
        } else {
          if (currentStepIndex < steps.length - 1) setCurrentStepIndex(p => p + 1);
        }
      } else if (e.key === 'ArrowLeft') {
        if (isAr) {
          if (currentStepIndex < steps.length - 1) setCurrentStepIndex(p => p + 1);
        } else {
          if (currentStepIndex > 0) setCurrentStepIndex(p => p - 1);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStepIndex, steps.length, isAr, onClose]);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex] || steps[0];
  const isLast = currentStepIndex === steps.length - 1;
  const isFirst = currentStepIndex === 0;

  const nextStep = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isLast) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const prevStep = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!isFirst) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  // Compute Popover Position & Arrow Placement
  const margin = 14;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 768;
  const cardWidth = Math.min(360, Math.max(300, viewportWidth - 32));

  let placement: 'top' | 'bottom' | 'center' = 'bottom';
  let popoverTop = (viewportHeight - cardHeight) / 2;
  let popoverLeft = (viewportWidth - cardWidth) / 2;
  let arrowLeft = cardWidth / 2;

  if (targetRect) {
    const spaceBelow = viewportHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    const preferredPosition = currentStep.position || 'bottom';

    if (preferredPosition === 'bottom') {
      if (spaceBelow < cardHeight + margin && spaceAbove > spaceBelow) {
        placement = 'top';
      } else {
        placement = 'bottom';
      }
    } else if (preferredPosition === 'top') {
      if (spaceAbove < cardHeight + margin && spaceBelow > spaceAbove) {
        placement = 'bottom';
      } else {
        placement = 'top';
      }
    } else {
      placement = spaceBelow >= cardHeight + margin ? 'bottom' : 'top';
    }

    if (placement === 'bottom') {
      popoverTop = Math.min(viewportHeight - cardHeight - margin, Math.max(margin, targetRect.bottom + margin));
    } else {
      popoverTop = Math.max(margin, targetRect.top - margin - cardHeight);
    }

    const targetCenterX = targetRect.left + targetRect.width / 2;
    popoverLeft = targetCenterX - cardWidth / 2;
    popoverLeft = Math.max(16, Math.min(viewportWidth - cardWidth - 16, popoverLeft));

    arrowLeft = targetCenterX - popoverLeft;
    arrowLeft = Math.max(24, Math.min(cardWidth - 24, arrowLeft));
  }

  // Smooth Spring Physics matching high-end interactive video
  const smoothSpring = {
    type: 'spring' as const,
    stiffness: 280,
    damping: 30,
    mass: 0.9,
  };

  const overlayContent = (
    <div
      className="fixed inset-0 z-[99998] select-none"
      dir={isAr ? 'rtl' : 'ltr'}
      onClick={() => onClose()}
    >
      {/* 1. SVG SPOTLIGHT MASK WITH HARDWARE-ACCELERATED SPRING MORPHING */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <mask id="onboarding-spotlight-mask">
            {/* White base = fully visible backdrop */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black animated rect = spotlight transparent cutout */}
            {targetRect && (
              <motion.rect
                key="spotlight-hole"
                initial={false}
                animate={{
                  x: targetRect.left,
                  y: targetRect.top,
                  width: targetRect.width,
                  height: targetRect.height,
                }}
                transition={smoothSpring}
                rx="14"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(10, 8, 7, 0.72)"
          mask="url(#onboarding-spotlight-mask)"
        />
      </svg>

      {/* 2. ANIMATED GLOWING TARGET FRAME (Smooth spring glide to target, matching video) */}
      {targetRect && (
        <motion.div
          key="target-highlight-ring"
          initial={false}
          animate={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
          transition={smoothSpring}
          className="fixed pointer-events-none z-[99999] rounded-2xl border-2 border-primary/95 shadow-[0_0_0_3px_rgba(197,31,36,0.3),0_0_28px_rgba(197,31,36,0.45)]"
        >
          {/* Subtle breathing aura */}
          <div className="absolute -inset-1 rounded-2xl border border-primary/40 animate-pulse pointer-events-none" />
        </motion.div>
      )}

      {/* 3. GLIDING POPOVER CARD WITH SPRING MOTION GRAPHICS */}
      <motion.div
        ref={cardRef}
        key="popover-floating-card"
        initial={false}
        animate={{
          top: popoverTop,
          left: popoverLeft,
          width: cardWidth,
        }}
        transition={smoothSpring}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside card
        className="fixed z-[100000] will-change-transform"
      >
        {/* Pointer Arrow Notch (Points directly at the active target, matching video) */}
        {targetRect && (
          <motion.div
            initial={false}
            animate={{
              left: arrowLeft,
            }}
            transition={smoothSpring}
            className="absolute w-3.5 h-3.5 bg-surface border-border pointer-events-none z-20"
            style={{
              transform: 'translateX(-50%) rotate(45deg)',
              ...(placement === 'bottom'
                ? { top: -7, borderTopWidth: 1, borderLeftWidth: 1 }
                : { bottom: -7, borderBottomWidth: 1, borderRightWidth: 1 }),
            }}
          />
        )}

        <BrandGlassCard
          intensity="high"
          interactive={false}
          className="shadow-2xl shadow-black/40 border border-border/90 rounded-2xl overflow-hidden bg-surface"
        >
          <div className="p-5 flex flex-col gap-3 relative">
            
            {/* Top Bar: Skip button & Close button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-surface-subtle"
              >
                {isAr ? 'تخطي الجولة' : 'Skip Tour'}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 -me-1 -mt-1 flex items-center justify-center rounded-full hover:bg-surface-subtle text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={isAr ? 'إغلاق' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Step Content: Smooth Morphing Animation (Fade + Slide) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, x: isAr ? 12 : -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isAr ? -12 : 12 }}
                transition={{ duration: 0.2, ease: [0.2, 0.8, 0.2, 1] }}
                className="space-y-2 min-h-[70px]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 shadow-xs">
                    {currentStep.icon || <Compass className="w-4 h-4 text-primary" />}
                  </div>
                  <h3 className="text-base font-bold text-foreground font-display tracking-tight">
                    {currentStep.title}
                  </h3>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed ps-10.5">
                  {currentStep.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Bottom Controls & Animated Progress Dots */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/70">
              {/* Progress Dots with Animated Active Pill */}
              <div
                className="flex items-center gap-1.5"
                aria-label={`Step ${currentStepIndex + 1} of ${steps.length}`}
              >
                {steps.map((_, idx) => (
                  <motion.span
                    key={idx}
                    animate={{
                      width: idx === currentStepIndex ? 20 : 6,
                      backgroundColor: idx === currentStepIndex ? 'var(--primary)' : 'rgba(150, 140, 130, 0.35)',
                    }}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    className="h-1.5 rounded-full"
                  />
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-lg cursor-pointer transition-colors"
                  >
                    {isAr ? 'السابق' : 'Back'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center gap-1 px-4 py-1.5 text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg cursor-pointer transition-all shadow-sm active:scale-95"
                >
                  <span>
                    {isLast
                      ? (isAr ? 'ابدأ الاستكشاف' : 'Get Started')
                      : (isAr ? 'التالي' : 'Next')}
                  </span>
                  {!isLast && (
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </div>
            </div>

          </div>
        </BrandGlassCard>
      </motion.div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
