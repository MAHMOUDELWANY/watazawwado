import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, LayoutGrid } from 'lucide-react';

type Item = { name: string; path: string; icon: React.ComponentType<{ className?: string }>; badge?: number | null; tour: string };

/**
 * Desktop "More" (P4-020): the portal's other pages, each with its name, in one menu at the end of the top tabs, in
 * place of the unlabelled side rail. Closes on a choice, a click outside, Escape or a page change.
 */
export function DesktopMoreMenu({ items, isActive, isAr, ink }: { items: Item[]; isActive: (path: string) => boolean; isAr: boolean; ink: string }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const current = items.find((i) => isActive(i.path));

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        id="student-more-btn"
        data-tour="student-more-btn"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="student-more-menu"
        onClick={() => setOpen((v) => !v)}
        className={`relative flex items-center gap-2 px-3.5 lg:px-4 h-9 rounded-full text-sm font-semibold whitespace-nowrap cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${current ? `${ink} text-white` : 'text-muted-foreground hover:text-foreground'}`}
      >
        <LayoutGrid className="w-4 h-4" aria-hidden="true" />
        <span>{current ? current.name : (isAr ? 'المزيد' : 'More')}</span>
        {items.some((i) => i.badge) && <span className="w-2 h-2 rounded-full bg-[#E5A93C]" aria-hidden="true" />}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      {open && (
        <nav
          id="student-more-menu"
          aria-label={isAr ? 'صفحات أخرى' : 'More pages'}
          className="absolute end-0 top-[calc(100%+10px)] z-40 w-64 p-2 rounded-2xl bg-surface border border-border shadow-xl grid gap-1"
        >
          {items.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                data-tour={item.tour}
                aria-current={active ? 'page' : undefined}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 min-h-11 px-3 rounded-xl text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active ? `${ink} text-white` : 'text-foreground hover:bg-surface-subtle'}`}
              >
                <item.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="flex-1">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}
