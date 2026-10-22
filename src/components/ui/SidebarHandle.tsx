import { useState } from 'react';
import { ChevronLeft } from 'lucide-react';

/** Whether a desktop sidebar is shown, remembered per browser (owner, 2026-10-22: every dashboard's sidebar can be
 *  tucked away on an arrow handle so the page gets the room). Storage may be blocked; then it simply starts open. */
export function useSidebarOpen(key: string): [boolean, () => void] {
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(key) !== '0'; } catch { return true; }
  });
  const toggle = () => setOpen((o) => {
    try { localStorage.setItem(key, o ? '0' : '1'); } catch { /* private mode: not remembered */ }
    return !o;
  });
  return [open, toggle];
}

/** The arrow tab on the sidebar's edge: points back towards the start edge to hide it, away from it to show it.
 *  Position it with `className` (fixed, start-…, top-…); it is only shown from the breakpoint the caller adds. */
export function SidebarHandle({ open, onToggle, labelOpen, labelClosed, controls, className = '' }: {
  open: boolean; onToggle: () => void; labelOpen: string; labelClosed: string; controls: string; className?: string;
}) {
  const label = open ? labelOpen : labelClosed;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls={controls}
      aria-label={label}
      title={label}
      className={`z-40 h-16 w-6 items-center justify-center rounded-e-xl border border-s-0 border-border/60 bg-surface/90 text-muted-foreground shadow-md backdrop-blur-xl transition-[inset-inline-start,color,background-color] duration-300 ease-out hover:bg-[#F6D58E] hover:text-[#1E1410] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
    >
      <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${open ? 'rtl:rotate-180' : 'rotate-180 rtl:rotate-0'}`} aria-hidden="true" />
    </button>
  );
}
