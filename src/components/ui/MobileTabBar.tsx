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
  /** The academy's main action (Book): crimson circle even when not selected. */
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

/**
 * Phone bottom tab bar (hidden from md up). The selected tab rises into a coloured circle and the
 * glass bar opens a smooth notch under it; both glide between tabs.
 */
export function MobileTabBar({ tabs, label, hidden, isAr }: { tabs: MobileTab[]; label: string; hidden?: boolean; isAr: boolean }) {
  const still = Boolean(useReducedMotion());
  const activeIndex = tabs.findIndex((t) => t.active);
  // Visual centre of the active tab; RTL lays the tabs out from the right.
  const centre = activeIndex < 0 ? 50 : ((activeIndex + 0.5) / tabs.length) * 100;
  const notchX = `${isAr ? 100 - centre : centre}%`;
  const spring = still ? { duration: 0 } : { type: 'spring' as const, stiffness: 420, damping: 34 };
  const notch = activeIndex < 0
    ? 'none'
    : 'radial-gradient(circle 34px at var(--notch-x) 0, transparent 32px, #000 33.5px)';

  return (
    <div
      className={`md:hidden fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 mx-auto max-w-md transition-opacity duration-200 ${hidden ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
    >
      <nav aria-label={label} className="relative h-16">
        {/* Glass bar with the notch cut out under the active tab */}
        {/* The mask would clip an outer shadow, so the shadow sits on its own layer. */}
        <span aria-hidden="true" className="absolute inset-0 rounded-[var(--r-4)] shadow-[var(--shadow-3)]" />
        <motion.div
          aria-hidden="true"
          className="tabbar-glass !mb-0 absolute inset-0"
          initial={false}
          animate={{ '--notch-x': notchX } as any}
          transition={spring}
          style={{ WebkitMaskImage: notch, maskImage: notch } as React.CSSProperties}
        />
        <ul className="relative flex h-full items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const bubbleColour = tab.primary ? 'bg-crimson text-white shadow-crimson/40' : 'bg-teal text-white shadow-teal/40';
            const inner = (
              <>
                <span className="relative flex h-11 w-11 items-center justify-center">
                  {tab.active && (
                    <motion.span
                      layoutId="mobile-tab-bubble"
                      transition={spring}
                      className={`absolute -top-6 h-12 w-12 rounded-full shadow-lg ${bubbleColour}`}
                    />
                  )}
                  {!tab.active && tab.primary && <span className="absolute h-10 w-10 rounded-full bg-crimson shadow-md shadow-crimson/30" />}
                  <motion.span
                    className={`relative ${tab.active || tab.primary ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`}
                    initial={false}
                    animate={{ y: tab.active ? -22 : 0 }}
                    transition={spring}
                  >
                    <Icon className="h-[22px] w-[22px]" strokeWidth={tab.active ? 2.4 : 2} />
                  </motion.span>
                  {tab.badge ? (
                    <span className={`absolute ${tab.active ? '-top-7' : 'top-0.5'} end-0 min-w-[18px] h-[18px] px-1 rounded-full bg-crimson text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-surface`}>
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  ) : null}
                </span>
                <span className={`-mt-1.5 text-[0.78rem] leading-none truncate max-w-full px-0.5 ${tab.active ? 'font-bold text-foreground' : 'font-medium text-muted-foreground'}`}>
                  {tab.label}
                </span>
              </>
            );
            const cls = 'group flex h-full w-full flex-col items-center justify-center min-h-[44px] touch-manipulation rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary';
            return (
              <li key={tab.key} className="flex-1 min-w-0">
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
