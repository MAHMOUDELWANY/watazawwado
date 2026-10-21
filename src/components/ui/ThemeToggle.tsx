import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

export function ThemeToggle({ className = '', compact = false }: { className?: string; compact?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return compact ? (
      <div className={`w-8 h-8 rounded-xl glass-surface border border-border/50 ${className}`} />
    ) : (
      <div className={`w-[60px] h-[32px] rounded-full glass-surface border border-border/50 shadow-sm ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  if (compact) {
    return (
      <button
        data-tour="theme-toggle-btn"
        type="button"
        role="switch"
        aria-checked={isDark}
        aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        onClick={toggleTheme}
        className={`
          relative inline-flex items-center justify-center
          w-11 h-11 rounded-xl
          bg-surface hover:bg-surface-subtle
          border border-border/80 text-foreground
          shadow-2xs active:scale-95
          transition-all duration-200 cursor-pointer
          focus:outline-none focus-visible:ring-2 focus-visible:ring-primary
          ${className}
        `}
      >
        {isDark ? (
          <Sun className="w-4 h-4 text-accent transition-colors" />
        ) : (
          <Moon className="w-4 h-4 text-foreground transition-colors" />
        )}
      </button>
    );
  }

  return (
    <button
      data-tour="theme-toggle-btn"
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-between
        w-[64px] h-[32px] p-[2px]
        rounded-full
        bg-black/5 dark:bg-white/10
        border border-black/5 dark:border-white/10
        shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        transition-colors duration-300 ease-in-out
        ${className}
      `}
    >
      {/* Sliding Thumb */}
      <span
        className={`
          absolute left-[2px] top-[2px]
          w-[26px] h-[26px]
          bg-white dark:bg-[#423E39]
          rounded-full shadow-[0_2px_4px_rgba(0,0,0,0.1),0_1px_1px_rgba(0,0,0,0.05)]
          border border-black/5 dark:border-white/5
          transform transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${isDark ? 'translate-x-[32px]' : 'translate-x-0'}
        `}
      />

      {/* Sun Icon (Light Mode Side) */}
      <span 
        className={`relative z-10 w-1/2 flex justify-center items-center transition-colors duration-300 ${isDark ? 'text-muted-foreground' : 'text-accent'}`}
        aria-hidden="true"
      >
        <Sun className="w-3.5 h-3.5" />
      </span>

      {/* Moon Icon (Dark Mode Side) */}
      <span 
        className={`relative z-10 w-1/2 flex justify-center items-center transition-colors duration-300 ${isDark ? 'text-interactive-foreground' : 'text-muted-foreground'}`}
        aria-hidden="true"
      >
        <Moon className="w-3.5 h-3.5" />
      </span>
    </button>
  );
}
