import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';

export interface MobileTab {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Route to open; tabs without one are buttons (e.g. "More" opens the drawer). */
  to?: string;
  onClick?: () => void;
  active?: boolean;
  /** The academy's main action (Book): a gold ring even when not selected. */
  primary?: boolean;
  badge?: number | null;
  id?: string;
  tour?: string;
}

/** True when `path` is the current page or a parent of it (the root path matches only itself). */
export function isTabActive(path: string, pathname: string, root: string): boolean {
  const clean = pathname.replace(/\/+$/, '') || '/';
  return path === root ? clean === root : clean === path || clean.startsWith(`${path}/`);
}

const BAR = '#1F1A17';
// Liquid Glass (iPadOS 26 reference, docs/design/INSPIRATION.md): the pill lets the page show through, softly blurred.
const GLASS = 'rgba(31, 26, 23, 0.86)';

/**
 * Compact while the person reads down a page, full again as soon as they scroll up, reach the top, or the page is
 * short. Listens in the capture phase so it follows whichever element scrolls (the window in the portal, the main
 * pane in the dashboard).
 */
export function useCompactOnScroll(): boolean {
  const [compact, setCompact] = useState(false);
  const last = useRef(new WeakMap<object, number>());
  useEffect(() => {
    const onScroll = (e: Event) => {
      const el = e.target === document ? document.scrollingElement : (e.target as HTMLElement);
      if (!el || !(el as HTMLElement).scrollHeight) return;
      const top = (el as HTMLElement).scrollTop;
      const prev = last.current.get(el) ?? top;
      last.current.set(el, top);
      if (top < 80) return setCompact(false);
      if (top - prev > 6) setCompact(true);
      else if (prev - top > 6) setCompact(false);
    };
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => document.removeEventListener('scroll', onScroll, { capture: true } as any);
  }, []);
  return compact;
}

/**
 * Phone bottom tab bar (hidden from md up), after the owner's reference (2026-10-23): a dark floating pill; the selected
 * tab rises into a crimson circle that sits in a smooth bump of the bar, and both glide to the next tab on a spring.
 * Every tab keeps its label, so nothing is an unlabelled icon. Thumb zone: the bar sits at the bottom edge, 64px tall,
 * every target at least 48px wide.
 * Liquid Glass (owner, 2026-11-01): the pill is translucent with a blur, and while reading down a page it shrinks to its
 * icons (labels fade, the pill gets shorter); scrolling up, or a tap on the bar, brings it back.
 */
export function MobileTabBar({ tabs, label, hidden }: { tabs: MobileTab[]; label: string; hidden?: boolean; isAr?: boolean }) {
  const still = Boolean(useReducedMotion());
  const spring = still ? { duration: 0 } : { type: 'spring' as const, bounce: 0.25, duration: 0.5 };
  const scrolledCompact = useCompactOnScroll();
  const [held, setHeld] = useState(false);
  const compact = scrolledCompact && !held;
  // A tap on the shrunk bar opens it fully until the next scroll down.
  useEffect(() => { if (!scrolledCompact) setHeld(false); }, [scrolledCompact]);
  const ease = still ? { duration: 0 } : { type: 'spring' as const, bounce: 0.15, duration: 0.45 };

  return (
    <div
      className={`md:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md transition-[opacity,transform] duration-200 ${hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'}`}
    >
      <motion.nav
        aria-label={label}
        data-compact={compact ? 'true' : 'false'}
        onPointerDownCapture={() => { if (compact) setHeld(true); }}
        initial={false}
        animate={{ height: compact ? 54 : 68, marginInline: compact ? 28 : 0 }}
        transition={ease}
        className="relative rounded-[26px] shadow-[0_18px_40px_-16px_rgba(5,15,22,0.75)] backdrop-blur-xl backdrop-saturate-150"
        style={{ background: GLASS }}
      >
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-white/10" />
        <ul className="relative flex h-full items-stretch px-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const inner = (
              <>
                {tab.active && (
                  // The bump: a circle of the bar's own colour rising above it, with two soft shoulders, and the crimson
                  // disc inside. One layoutId, so it slides from tab to tab instead of blinking.
                  <motion.span layoutId="tab-bump" transition={spring} aria-hidden="true" className={`pointer-events-none absolute left-1/2 h-[64px] w-[64px] -translate-x-1/2 transition-[top,scale] duration-300 ${compact ? 'top-[-20px] scale-[0.84]' : 'top-[-22px]'}`}>
                    <span className="absolute inset-0 rounded-full" style={{ background: GLASS }} />
                    <span className="absolute top-[22px] -left-[14px] h-[14px] w-[14px]" style={{ background: `radial-gradient(circle at 0 0, transparent 13.5px, ${GLASS} 14px)` }} />
                    <span className="absolute top-[22px] -right-[14px] h-[14px] w-[14px]" style={{ background: `radial-gradient(circle at 100% 0, transparent 13.5px, ${GLASS} 14px)` }} />
                    <span className="absolute inset-[7px] rounded-full bg-crimson shadow-[0_8px_22px_-6px_rgba(197,31,36,0.9)]" />
                  </motion.span>
                )}
                <motion.span className="relative flex h-7 items-center justify-center" initial={false} animate={{ y: tab.active ? (compact ? -12 : -20) : 0 }} transition={spring}>
                  {!tab.active && tab.primary && <span aria-hidden="true" className="absolute h-9 w-9 rounded-full ring-2 ring-[#E5A93C]/80" />}
                  <Icon className={`h-[22px] w-[22px] ${tab.active ? 'text-white' : tab.primary ? 'text-[#F6D58E]' : 'text-white/60 group-hover:text-white'}`} strokeWidth={tab.active ? 2.4 : 2} />
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -end-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E5A93C] px-1 text-[10px] font-bold text-[#1E1410] ring-2 ring-[#1F1A17]">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  ) : null}
                </motion.span>
                <motion.span
                  initial={false}
                  animate={{ opacity: compact ? 0 : 1, height: compact ? 0 : 15, marginTop: compact ? 0 : 3 }}
                  transition={ease}
                  // No overflow clip: Arabic glyphs are taller than the 11px line and were cut in half.
                  className={`relative max-w-full whitespace-nowrap px-0.5 text-[12.5px] leading-[16px] ${tab.active ? 'font-bold text-white' : 'font-medium text-white/55'}`}
                >
                  {tab.label}
                </motion.span>
              </>
            );
            const cls = 'group relative flex h-full w-full min-w-[48px] flex-col items-center justify-center touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E5A93C]';
            return (
              <li key={tab.key} className="relative flex-1 min-w-0">
                {tab.to ? (
                  <Link to={tab.to} id={tab.id} data-tour={tab.tour} aria-current={tab.active ? 'page' : undefined} className={cls} onClick={tab.onClick}>
                    {inner}
                  </Link>
                ) : (
                  <button type="button" id={tab.id} data-tour={tab.tour} onClick={tab.onClick} className={`${cls} cursor-pointer`}>
                    {inner}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      </motion.nav>
    </div>
  );
}

/** Bottom padding that keeps page content clear of the bar (and its raised circle) on phones. */
export const MOBILE_TAB_BAR_PADDING = 'pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-8';
