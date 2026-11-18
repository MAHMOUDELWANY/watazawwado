import React from 'react';

/**
 * Section entrance: its `.rv` parts rise in one after another (CSS in src/index.css, "HOMEPAGE 2026-11-18").
 * The section is only marked `rv-ready` in the browser, after mount, so the prerendered HTML and a page whose script
 * fails show everything. Reduced motion never hides anything.
 */
export function useReveal<T extends HTMLElement>(threshold = 0.18) {
  const ref = React.useRef<T>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    // Already on screen at load (a reload halfway down): show it at once, no flash.
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { el.classList.add('rv-ready'); requestAnimationFrame(() => el.classList.add('is-in')); return; }
    el.classList.add('rv-ready');
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      el.classList.add('is-in');
      io.disconnect();
    }, { threshold, rootMargin: '0px 0px -8% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return ref;
}

/** Stagger index for a `.rv` part. */
export const rv = (i: number) => ({ className: 'rv', style: { '--i': i } as React.CSSProperties });
