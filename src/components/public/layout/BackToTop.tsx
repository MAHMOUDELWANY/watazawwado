import React from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from 'motion/react';
import { ChevronUp } from 'lucide-react';

/**
 * Back to the top of the page: a deep teal medallion with a gold ring that fills as you scroll.
 * Sits in the bottom corner opposite the AI learning guide (start side, so it flips in Arabic).
 */
export function BackToTop({ isAr }: { isAr: boolean }) {
  const { scrollY, scrollYProgress } = useScroll();
  const [visible, setVisible] = React.useState(false);
  const reduce = useReducedMotion();
  useMotionValueEvent(scrollY, 'change', (y) => setVisible(y > 600));

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' })}
          aria-label={isAr ? 'الرجوع لأعلى الصفحة' : 'Back to the top'}
          title={isAr ? 'لأعلى الصفحة' : 'Back to the top'}
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="back-to-top group"
        >
          <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full -rotate-90" aria-hidden="true">
            <circle cx="28" cy="28" r="25.5" fill="none" stroke="rgba(229,169,60,0.28)" strokeWidth="2.5" />
            <motion.circle
              cx="28" cy="28" r="25.5" fill="none" stroke="#E5A93C" strokeWidth="2.5" strokeLinecap="round"
              style={{ pathLength: scrollYProgress }}
            />
          </svg>
          <ChevronUp className="relative w-6 h-6 text-[#F6D58E] transition-transform duration-200 group-hover:-translate-y-0.5" strokeWidth={2.4} aria-hidden="true" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
