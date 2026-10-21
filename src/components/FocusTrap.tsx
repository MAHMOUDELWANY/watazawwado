import React, { useEffect, useRef } from 'react';

const FOCUSABLE =
  'a[href], area[href], input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

// Open traps, innermost last: only the top one handles Tab and Escape (a modal opened inside a modal).
const stack: symbol[] = [];

/**
 * Keeps keyboard focus inside a dialog while it is open (QA-02): focus moves in on open, Tab and Shift+Tab wrap,
 * Escape calls onEscape, and focus returns to whatever opened the dialog when it closes.
 */
export default function FocusTrap({ children, isActive = true, onEscape }: { children: React.ReactNode; isActive?: boolean; onEscape?: () => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onEscapeRef = useRef(onEscape);
  onEscapeRef.current = onEscape;

  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;
    const id = Symbol('focus-trap');
    stack.push(id);
    const opener = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);

    const first = focusables()[0];
    if (first) first.focus();
    else {
      container.setAttribute('tabindex', '-1');
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id) return;
      if (e.key === 'Escape' && onEscapeRef.current) {
        e.stopPropagation();
        onEscapeRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) { e.preventDefault(); return; }
      const firstEl = items[0];
      const lastEl = items[items.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (!active || !container.contains(active)) {
        e.preventDefault();
        (e.shiftKey ? lastEl : firstEl).focus();
      } else if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      const at = stack.indexOf(id);
      if (at >= 0) stack.splice(at, 1);
      if (opener && document.contains(opener)) opener.focus();
    };
  }, [isActive]);

  return <div ref={containerRef} className="contents">{children}</div>;
}
