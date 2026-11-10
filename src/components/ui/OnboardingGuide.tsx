import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ZadRig, type ZadPose } from '../zad/ZadRig';
import FocusTrap from '../FocusTrap';

export interface OnboardingStep {
  targetId: string | string[]; // data-tour / id to highlight; empty = a centred card
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  /** Zad presents every step; defaults: wave first, cheer last, point between. */
  pose?: ZadPose;
  /** Targets on a phone (under 768px) when they differ from the desktop ones; never falls back to another control. */
  phone?: string[];
  /** Phone only: the tour opens the "More" sheet for this step, so the user sees what it explains. */
  open?: 'more';
  /** The page this step explains; the tour goes there first (owner review 2026-11-10: read it and see it). */
  route?: string;
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
  /** Called when a step starts: the app opens menus or navigates as the step asks (route / open). */
  onStepChange?: (step: OnboardingStep, index: number) => void;
}

const isPhone = () => typeof window !== 'undefined' && window.innerWidth < 768;

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

export function OnboardingGuide({ steps, isOpen, onClose, isAr = false, onStepChange }: OnboardingGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetGeometry | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
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

  useEffect(() => {
    if (!isOpen) return;
    // After the "More" sheet's own focus move (50 ms), so Next keeps the focus.
    const id = window.setTimeout(() => nextRef.current?.focus({ preventScroll: true }), 120);
    return () => window.clearTimeout(id);
  }, [isOpen, currentStepIndex]);

  // The step drives the screen: open the sheet or the page it explains before pointing at it.
  useEffect(() => {
    if (isOpen && steps[currentStepIndex]) onStepChange?.(steps[currentStepIndex], currentStepIndex);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentStepIndex]);

  // Robust target element finder by data-tour, id, or css selector
  const findTargetElement = useCallback((): HTMLElement | null => {
    if (!isOpen || steps.length === 0) return null;
    const step = steps[currentStepIndex];
    if (!step) return null;

    const currentTargetId = isPhone() && step.phone ? step.phone : step.targetId;
    const targetIds = Array.isArray(currentTargetId) ? currentTargetId : [currentTargetId];

    for (const id of targetIds) {
      if (!id) continue;
      // 1. Try data-tour attribute (the visible one: some controls exist twice, for phone and desktop)
      const tagged = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`));
      let el = tagged.find((t) => t.getClientRects().length > 0) || tagged[0] || null;
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
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.opacity || '1') === 0) {
          continue;
        }
        const b = el.getBoundingClientRect();
        // Element must have visible dimensions and be within current viewport boundaries
        const isInViewport = (
          b.width > 0 &&
          b.height > 0 &&
          b.right > 20 &&
          b.left < window.innerWidth - 20 &&
          b.bottom > 20 &&
          b.top < window.innerHeight - 20
        );
        if (isInViewport) {
          return el;
        }
        // Present but scrolled away (e.g. low in the "More" sheet): bring it in; the next poll finds it.
        if (b.width > 0 && b.height > 0) el.scrollIntoView({ block: 'center', inline: 'nearest' });
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
    const maxAttempts = 90; // ~1.5 s: the page or sheet the step opened may still be loading

    const resolveTarget = () => {
      const found = updateTargetGeometry();
      if (!found && attempts < maxAttempts) {
        attempts++;
        rafIdRef.current = requestAnimationFrame(resolveTarget);
      } else if (!found) {
        setTargetRect(null); // hidden on this screen: a centred card, never the previous step's highlight
      } else {
        const el = findTargetElement();
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' }); // 'center' shifted the dashboard sideways
        }
      }
    };

    resolveTarget();
    // A sheet sliding in or a page settling moves the target: follow it for a moment.
    const follow = window.setInterval(updateTargetGeometry, 200);
    const stopFollow = window.setTimeout(() => window.clearInterval(follow), 1600);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      window.clearInterval(follow);
      window.clearTimeout(stopFollow);
    };
  }, [isOpen, currentStepIndex, steps, updateTargetGeometry, findTargetElement]);

  // Update on scroll & window resize
  useEffect(() => {
    if (!isOpen) return;

    const handleUpdate = () => {
      updateTargetGeometry();
    };

    window.addEventListener('resize', handleUpdate);
    // Capture: also scrolls inside the "More" sheet or a page panel, not only the window.
    window.addEventListener('scroll', handleUpdate, { passive: true, capture: true });
    return () => {
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate, { capture: true });
    };
  }, [isOpen, updateTargetGeometry]);

  // Keyboard navigation (Escape to close, Arrows to step)
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape is handled by FocusTrap.
      if (e.key === 'ArrowRight') {
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
  const pose: ZadPose = currentStep.pose || (isFirst ? 'wave' : isLast ? 'cheer' : 'point');

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

  // Phone: the card is a sheet across the screen, on the half away from the target, so it never hides it.
  const sheet = viewportWidth < 640;
  if (sheet) {
    const cardW = viewportWidth - 24;
    const targetLow = targetRect ? targetRect.top + targetRect.height / 2 > viewportHeight / 2 : false;
    placement = targetLow ? 'top' : 'bottom';
    popoverLeft = 12;
    popoverTop = !targetRect ? (viewportHeight - cardHeight) / 2 : targetLow ? 12 : viewportHeight - cardHeight - 12;
    arrowLeft = cardW / 2;
  } else if (targetRect) {
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
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-body"
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
          width: sheet ? viewportWidth - 24 : cardWidth,
        }}
        transition={smoothSpring}
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click when clicking inside card
        className="fixed z-[100000] will-change-transform"
      >
        {/* Pointer Arrow Notch (Points directly at the active target, matching video); none on the phone sheet */}
        {targetRect && !sheet && (
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

        <div
          className="shadow-2xl shadow-black/60 border-2 border-border/80 rounded-2xl overflow-hidden text-foreground relative z-30"
          style={{ backgroundColor: 'var(--surface)', opacity: 1 }}
        >
          <div className="p-5 flex flex-col gap-3 relative bg-surface">
            {/* Zad presents the step; the counter says how far along the tour is */}
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 w-16 h-16 grid place-items-center rounded-2xl bg-sand-light ring-1 ring-border/60 overflow-visible">
                {/* A new Zad per step, so each message gets its own reaction, not one looping pose. */}
                <ZadRig key={currentStepIndex} pose={pose} size={50} glow={false} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-primary">
                    {isAr ? `زاد · ${currentStepIndex + 1} من ${steps.length}` : `Zad · ${currentStepIndex + 1} of ${steps.length}`}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-8 h-8 -me-2 -mt-1.5 flex items-center justify-center rounded-full hover:bg-surface-subtle text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={isAr ? 'إغلاق الجولة' : 'Close the tour'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentStepIndex}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                    className="space-y-1.5 min-h-[64px]"
                  >
                    <h3 id="tour-step-title" className="text-base font-bold text-foreground font-display tracking-tight leading-snug">
                      {currentStep.title}
                    </h3>
                    <p id="tour-step-body" className="text-sm text-muted-foreground leading-relaxed">
                      {currentStep.description}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>

            {/* Bottom Controls & Animated Progress Dots */}
            <div className="flex items-center justify-between gap-2 mt-1 pt-3 border-t border-border/70">
              <div className="flex items-center gap-3 min-w-0">
              {!isLast && (
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-1.5 -ms-1.5 rounded-md hover:bg-surface-subtle"
                >
                  {isAr ? 'تخطي' : 'Skip'}
                </button>
              )}
              <div
                aria-hidden="true"
                className="flex items-center gap-1.5"
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
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="inline-flex items-center justify-center h-9 px-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-surface-subtle rounded-lg cursor-pointer transition-colors"
                  >
                    {isAr ? 'السابق' : 'Back'}
                  </button>
                )}

                <button
                  ref={nextRef}
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center justify-center gap-1 h-9 px-4 text-sm font-bold bg-primary text-primary-foreground hover:bg-primary-hover rounded-lg cursor-pointer transition-all shadow-sm active:scale-95"
                >
                  <span>
                    {isLast
                      ? (isAr ? 'يلا نبدأ' : "Let's start")
                      : (isAr ? 'التالي' : 'Next')}
                  </span>
                  {!isLast && (
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );

  return createPortal(<FocusTrap onEscape={onClose}>{overlayContent}</FocusTrap>, document.body);
}
