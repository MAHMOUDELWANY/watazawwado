import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTeacherAuth } from '../../lib/auth';

/** Avatar menu: the account page and sign out. `accountPath` is the role's own account page. */
export function AccountDropdown({ initials = 'S', isAr, accountPath }: { initials?: string; isAr?: boolean; accountPath: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { signOut } = useTeacherAuth();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isAr ? 'حسابي' : 'My account'}
        aria-expanded={isOpen}
        className="flex items-center gap-2 p-1.5 pe-3 rounded-full glass-surface glass-hover hover:bg-surface border-none transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-secondary/40 text-accent font-bold text-sm flex items-center justify-center">
          {initials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 w-48 glass-card border-none rounded-xl shadow-lg overflow-hidden z-50 end-0`}>
          <div className="p-1">
            <Link to={accountPath} onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-subtle rounded-lg transition-colors">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{isAr ? '\u0627\u0644\u0645\u0644\u0641 \u0627\u0644\u0634\u062E\u0635\u064A' : 'Profile'}</span>
            </Link>
            <div className="h-px bg-border my-1" />
            <button 
              onClick={() => { setIsOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAr ? '\u062A\u0633\u062C\u064A\u0644 \u0627\u0644\u062E\u0631\u0648\u062C' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
