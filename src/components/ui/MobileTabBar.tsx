import React from 'react';
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

const BAR = '#101B22';

/**
 * Phone bottom tab bar (hidden from md up), after the owner's reference (2026-10-23): a dark floating pill; the selected
 * tab rises into a crimson circle that sits in a smooth bump of the bar, and both glide to the next tab on a spring.
 * Every tab keeps its label, so nothing is an unlabelled icon. Thumb zone: the bar sits at the bottom edge, 64px tall,
 * every target at least 48px wide.
 */
export function MobileTabBar({ tabs, label, hidden }: { tabs: MobileTab[]; label: string; hidden?: boolean; isAr?: boolean }) {
  const still = Boolean(useReducedMotion());
  const spring = still ? { duration: 0 } : { type: 'spring' as const, bounce: 0.25, duration: 0.5 };

  return (
    <div
      className={`md:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md transition-[opacity,transform] duration-200 ${hidden ? 'pointer-events-none translate-y-4 opacity-0' : 'opacity-100'}`}
    >
      <nav aria-label={label} className="relative h-[68px] rounded-[26px] shadow-[0_18px_40px_-16px_rgba(5,15,22,0.75)]" style={{ background: BAR }}>
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-[26px] ring-1 ring-white/10" />
        <ul className="relative flex h-full items-stretch px-2.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const inner = (
              <>
                {tab.active && (
                  // The bump: a circle of the bar's own colour rising above it, with two soft shoulders, and the crimson
                  // disc inside. One layoutId, so it slides from tab to tab instead of blinking.
                  <motion.span layoutId="tab-bump" transition={spring} aria-hidden="true" className="pointer-events-none absolute left-1/2 top-[-22px] h-[64px] w-[64px] -translate-x-1/2">
                    <span className="absolute inset-0 rounded-full" style={{ background: BAR }} />
                    <span className="absolute top-[22px] -left-[14px] h-[14px] w-[14px]" style={{ background: `radial-gradient(circle at 0 0, transparent 13.5px, ${BAR} 14px)` }} />
                    <span className="absolute top-[22px] -right-[14px] h-[14px] w-[14px]" style={{ background: `radial-gradient(circle at 100% 0, transparent 13.5px, ${BAR} 14px)` }} />
                    <span className="absolute inset-[7px] rounded-full bg-crimson shadow-[0_8px_22px_-6px_rgba(197,31,36,0.9)]" />
                  </motion.span>
                )}
                <motion.span className="relative flex h-7 items-center justify-center" initial={false} animate={{ y: tab.active ? -20 : 0 }} transition={spring}>
                  {!tab.active && tab.primary && <span aria-hidden="true" className="absolute h-9 w-9 rounded-full ring-2 ring-[#E5A93C]/80" />}
                  <Icon className={`h-[22px] w-[22px] ${tab.active ? 'text-white' : tab.primary ? 'text-[#F6D58E]' : 'text-white/60 group-hover:text-white'}`} strokeWidth={tab.active ? 2.4 : 2} />
                  {tab.badge ? (
                    <span className="absolute -top-1.5 -end-3 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E5A93C] px-1 text-[10px] font-bold text-[#1E1410] ring-2 ring-[#101B22]">
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  ) : null}
                </motion.span>
                <span className={`relative mt-1 max-w-full truncate px-0.5 text-[11px] leading-none ${tab.active ? 'font-bold text-white' : 'font-medium text-white/55'}`}>
                  {tab.label}
                </span>
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
      </nav>
    </div>
  );
}

/** Bottom padding that keeps page content clear of the bar (and its raised circle) on phones. */
export const MOBILE_TAB_BAR_PADDING = 'pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-8';
