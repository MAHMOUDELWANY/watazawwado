import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-[60px] h-[32px] rounded-full bg-surface-subtle border border-border/50 shadow-sm ${className}`} />
    );
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-between
        w-[64px] h-[32px] p-1
        rounded-full
        bg-surface-subtle dark:bg-surface-warm
        border border-border/50 dark:border-border/20
        shadow-inner focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background
        transition-colors duration-300 ease-in-out
        ${className}
      `}
    >
      {/* Sliding Thumb */}
      <span
        className={`
          absolute left-1 top-1
          w-[24px] h-[24px]
          bg-surface dark:bg-[#423E39]
          rounded-full shadow-sm
          border border-border/20
          transform transition-transform duration-300 cubic-bezier(0.2, 0.8, 0.2, 1)
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
