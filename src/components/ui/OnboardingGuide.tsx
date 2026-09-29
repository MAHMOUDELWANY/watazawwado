import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight } from 'lucide-react';
import { BrandGlassCard } from './BrandGlassCard';

export interface OnboardingStep {
  targetId: string | string[]; // The DOM element ID to highlight
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingGuideProps {
  steps: OnboardingStep[];
  isOpen: boolean;
  onClose: () => void;
  isAr?: boolean;
}

export function OnboardingGuide({ steps, isOpen, onClose, isAr = false }: OnboardingGuideProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const updateTargetRect = useCallback(() => {
    if (!isOpen || steps.length === 0) return;
    const currentTargetId = steps[currentStepIndex].targetId;
    const targetIds = Array.isArray(currentTargetId) ? currentTargetId : [currentTargetId];
    
    // Find first visible target using data-tour attribute first, fallback to id
    const currentTarget = targetIds.reduce((found, id) => {
      if (found) return found;
      const el = (document.querySelector(`[data-tour="${id}"]`) || document.getElementById(id)) as HTMLElement;
      if (el && el.getBoundingClientRect().width > 0) return el;
      return null;
    }, null as HTMLElement | null);

    if (currentTarget) {
      setTargetRect(null); // Clear position to prevent jitter/glitch
      currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Delay measurement slightly to allow scroll/layout to settle
      setTimeout(() => {
        const rect = currentTarget.getBoundingClientRect();
        setTargetRect(new DOMRect(rect.x - 8, rect.y - 8, rect.width + 16, rect.height + 16));
      }, 400); // Wait for scroll animation to finish
    } else {
      setTargetRect(null);
    }
  }, [isOpen, steps, currentStepIndex]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, { passive: true });
    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect);
    };
  }, [updateTargetRect]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen || steps.length === 0) return null;

  const currentStep = steps[currentStepIndex];
  const isLast = currentStepIndex === steps.length - 1;
  const isFirst = currentStepIndex === 0;

  const nextStep = () => !isLast && setCurrentStepIndex(prev => prev + 1);
  const prevStep = () => !isFirst && setCurrentStepIndex(prev => prev - 1);

  // Calculate Popover Position
  let popoverStyle: React.CSSProperties = { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
  
  if (targetRect) {
    let position = currentStep.position || 'bottom';
    const margin = 16;
    const estPopoverWidth = 320;
    const estPopoverHeight = 220; // Estimated height for the card
    
    // Collision detection
    if (position === 'bottom' && targetRect.bottom + margin + estPopoverHeight > window.innerHeight) {
      position = 'top';
    }
    if (position === 'top' && targetRect.top - margin - estPopoverHeight < 0) {
      position = 'bottom';
    }
    // Simple edge clamping for horizontal
    let leftPos = targetRect.left + targetRect.width / 2;
    if (leftPos - estPopoverWidth / 2 < 16) {
      leftPos = 16 + estPopoverWidth / 2;
    } else if (leftPos + estPopoverWidth / 2 > window.innerWidth - 16) {
      leftPos = window.innerWidth - 16 - estPopoverWidth / 2;
    }

    if (position === 'bottom') {
      popoverStyle = { top: targetRect.bottom + margin, left: leftPos, transform: 'translateX(-50%)' };
    } else if (position === 'top') {
      popoverStyle = { top: targetRect.top - margin, left: leftPos, transform: 'translate(-50%, -100%)' };
    } else if (position === 'left') {
      popoverStyle = { top: targetRect.top + targetRect.height / 2, left: targetRect.left - margin, transform: 'translate(-100%, -50%)' };
    } else if (position === 'right') {
      popoverStyle = { top: targetRect.top + targetRect.height / 2, left: targetRect.right + margin, transform: 'translate(0, -50%)' };
    }
  }

  const overlayContent = (
    <div className="fixed inset-0 z-[9999] pointer-events-auto" dir={isAr ? 'rtl' : 'ltr'}>
      {/* SVG Overlay for spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            {targetRect && (
              <rect 
                x={targetRect.left} 
                y={targetRect.top} 
                width={targetRect.width} 
                height={targetRect.height} 
                rx="16" 
                fill="black" 
                className="transition-all duration-300 ease-out"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#spotlight-mask)" />
      </svg>

      {/* Guide Popover */}
      <div 
        className="absolute w-[320px] max-w-[90vw] transition-all duration-300 ease-out z-10"
        style={popoverStyle}
      >
        <BrandGlassCard intensity="high" interactive={false} className="shadow-2xl shadow-black/20">
          <div className="p-5 flex flex-col gap-3 relative">
            <button 
              onClick={onClose}
              className="absolute top-2 end-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full hover:bg-surface-subtle text-muted-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={isAr ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="pt-2">
              <h3 className="text-base font-bold text-foreground font-display mb-1.5">{currentStep.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{currentStep.description}</p>
            </div>
            
            {/* Progress & Controls */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex items-center gap-1.5">
                {steps.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`w-1.5 h-1.5 rounded-full transition-all ${idx === currentStepIndex ? 'bg-primary scale-125' : 'bg-border'}`} 
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <button onClick={prevStep} className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
                    {isAr ? 'السابق' : 'Back'}
                  </button>
                )}
                {isLast ? (
                  <button onClick={onClose} className="inline-flex items-center justify-center px-4 py-1.5 text-sm font-bold bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover cursor-pointer transition-colors shadow-sm">
                    {isAr ? 'إنهاء' : 'Finish'}
                  </button>
                ) : (
                  <button onClick={nextStep} className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-sm font-bold bg-foreground text-background rounded-lg hover:opacity-90 cursor-pointer transition-colors shadow-sm">
                    <span>{isAr ? 'التالي' : 'Next'}</span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isAr ? 'rotate-180' : ''}`} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </BrandGlassCard>
      </div>
    </div>
  );

  return createPortal(overlayContent, document.body);
}
