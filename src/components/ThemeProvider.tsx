import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { ThemeMode } from '../types';

interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Starts as the prerendered pages were built (light) so hydration matches; the saved or system theme is
  // applied before the first paint. The dark class itself is already set by the script in index.html.
  const [theme, setTheme] = useState<ThemeMode>('light');
  useLayoutEffect(() => {
    try {
      const saved = localStorage.getItem('mahmoud_theme');
      if (saved === 'light' || saved === 'dark') return setTheme(saved);
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
    } catch {
      // Ignore
    }
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // The installed app's title bar follows the chosen theme, not only the system one.
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
      m.setAttribute('content', theme === 'dark' ? '#110F0E' : '#FAF7F2');
    });
  }, [theme]);

  // Saved only when the visitor picks a theme, so the light first render never overwrites their choice.
  const chooseTheme = (next: ThemeMode) => {
    setTheme(next);
    try {
      localStorage.setItem('mahmoud_theme', next);
    } catch {
      // Ignore
    }
  };

  const toggleTheme = () => chooseTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme: chooseTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
