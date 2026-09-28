import React, { useState, useRef, useEffect } from 'react';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTeacherAuth } from '../lib/auth';

export function AccountDropdown({ initials, isAr }: { initials: string; isAr?: boolean }) {
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
        className="flex items-center gap-2 p-1.5 pe-3 rounded-full bg-surface-subtle hover:bg-surface border border-border transition-colors cursor-pointer"
      >
        <div className="w-7 h-7 rounded-full bg-secondary/40 text-accent font-bold text-xs flex items-center justify-center">
          {initials}
        </div>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className={bsolute top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50 }>
          <div className="p-1">
            <Link to="/student/account" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-subtle rounded-lg transition-colors">
              <User className="w-4 h-4 text-muted-foreground" />
              <span>{isAr ? 'OU,O-O3OO"' : 'Profile'}</span>
            </Link>
            <Link to="/student/account/preferences" onClick={() => setIsOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-surface-subtle rounded-lg transition-colors">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <span>{isAr ? 'OU,OO_O_OO_OO' : 'Preferences'}</span>
            </Link>
            <div className="h-px bg-border my-1" />
            <button 
              onClick={() => { setIsOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>{isAr ? 'OO3OUSU, O_OO^O' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}