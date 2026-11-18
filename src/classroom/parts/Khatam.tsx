import React from 'react';
import { cn } from '../../lib/utils';

/**
 * The khatam star in gold. In the room it means "waiting" or "connecting" (it breathes) and it seals the over screens
 * (it stays still). Reduced motion stops the breath through the shared .emblem-glow rule.
 */
export function Khatam({ size = 40, breathe = false, className }: { size?: number; breathe?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true" className={cn('shrink-0 overflow-visible', className)}>
      <g className={breathe ? 'emblem-glow' : undefined} fill="none" stroke="#F0B54A" strokeWidth="1.6" strokeLinejoin="round">
        <rect x="11" y="11" width="26" height="26" rx="1.5" />
        <rect x="11" y="11" width="26" height="26" rx="1.5" transform="rotate(45 24 24)" />
        <circle cx="24" cy="24" r="4.5" fill="rgba(246,213,142,0.35)" />
      </g>
    </svg>
  );
}
