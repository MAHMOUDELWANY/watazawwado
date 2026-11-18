import React from 'react';
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

/**
 * Premium surface kit for the homepage (soft-skill rules, our palette): the double bezel (a glass plate in a metal
 * tray), a pointer tilt for depth, the island trailing icon for buttons, a page-wide grain, and a foil sweep for the
 * ribbon words. Transform and opacity only; reduced motion turns every effect off.
 */

export const SPRING_EASE = [0.32, 0.72, 0, 1] as const;

/** Outer shell + inner core with concentric radii. `dark` for espresso bands. */
export function Bezel({ children, className = '', core = '', dark, radius = '2rem' }: { children: React.ReactNode; className?: string; core?: string; dark?: boolean; radius?: string }) {
  return (
    <div
      className={`p-1.5 ${dark ? 'bg-[#FAF7F2]/[0.04] ring-1 ring-[#F6D58E]/15' : 'bg-[#1C1411]/[0.035] ring-1 ring-[#1C1411]/[0.06] dark:bg-[#FAF7F2]/[0.04] dark:ring-[#FAF7F2]/10'} ${className}`}
      style={{ borderRadius: radius }}
    >
      <div
        className={`h-full ${dark ? 'bg-[#FAF7F2]/[0.05] shadow-[inset_0_1px_1px_rgba(246,213,142,0.18)]' : 'bg-card shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),0_30px_60px_-40px_rgba(28,20,17,0.45)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.06),0_30px_60px_-40px_rgba(0,0,0,0.8)]'} ${core}`}
        style={{ borderRadius: `calc(${radius} - 0.375rem)` }}
      >
        {children}
      </div>
    </div>
  );
}

/** Tilts its child a few degrees toward the pointer, with a soft spring back. Mouse only. */
export function Tilt({ children, className = '', max = 6 }: { children: React.ReactNode; className?: string; max?: number }) {
  const reduce = useReducedMotion();
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rx = useSpring(useTransform(py, [-0.5, 0.5], [max, -max]), { stiffness: 180, damping: 18 });
  const ry = useSpring(useTransform(px, [-0.5, 0.5], [-max, max]), { stiffness: 180, damping: 18 });
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set((e.clientX - r.left) / r.width - 0.5);
        py.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { px.set(0); py.set(0); }}
    >
      {children}
    </motion.div>
  );
}

/** The trailing arrow in its own circle, flush inside a pill button (button-in-button). */
export function IslandIcon({ isEn, tone = 'light' }: { isEn: boolean; tone?: 'light' | 'dark' }) {
  const Arrow = isEn ? ArrowRight : ArrowLeft;
  return (
    <span aria-hidden="true" className={`ms-2 -me-2 grid place-items-center w-8 h-8 rounded-full transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:scale-105 group-hover:-translate-y-px ${isEn ? 'group-hover:translate-x-1' : 'group-hover:-translate-x-1'} ${tone === 'light' ? 'bg-[#FAF7F2]/20' : 'bg-[#1C1411]/10'}`}>
      <Arrow className="w-4 h-4" strokeWidth={1.75} />
    </span>
  );
}

/** Page-wide paper grain: one fixed layer, never on scrolling content. */
export function PageGrain() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-[1] pointer-events-none opacity-[0.035] dark:opacity-[0.06] mix-blend-multiply dark:mix-blend-overlay"
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}
    />
  );
}

/** A soft eyebrow pill above big headings. */
export function Eyebrow({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[11px] font-bold tracking-[0.18em] ${dark ? 'bg-[#F6D58E]/10 text-[#F6D58E] ring-1 ring-[#F6D58E]/20' : 'bg-[#B4552F]/[0.07] text-[#B4552F] ring-1 ring-[#B4552F]/15 dark:bg-[#E5A93C]/10 dark:text-[#E5A93C] dark:ring-[#E5A93C]/20'}`}>
      {children}
    </span>
  );
}
