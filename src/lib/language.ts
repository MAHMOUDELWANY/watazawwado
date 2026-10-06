import { useState, useEffect } from 'react';
import { Language } from '../types';

export const LANGUAGE_STORAGE_KEY = 'watazawwado_lang';
export const LANG_CHANGE_EVENT = 'watazawwado_lang_change';

/**
 * Retrieves the current language preference.
 * Priority: localStorage -> document element -> default 'ar'
 */
export function getStoredLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        return saved;
      }
      // If not yet set, write default 'ar' to storage
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar');
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }
  }
  return 'ar'; // Strict default is Arabic
}

/**
 * Persists and applies the language preference across DOM and storage.
 */
export function setStoredLanguage(lang: Language): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Ignore storage errors
    }

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    window.dispatchEvent(new CustomEvent<Language>(LANG_CHANGE_EVENT, { detail: lang }));
  }
}

/**
 * React hook to access and toggle language with automatic DOM & storage synchronization.
 */
export function useAppLanguage() {
  const [lang, setLangState] = useState<Language>(getStoredLanguage);

  useEffect(() => {
    // Initial sync
    const current = getStoredLanguage();
    if (document.documentElement.lang !== current) {
      document.documentElement.lang = current;
      document.documentElement.dir = current === 'ar' ? 'rtl' : 'ltr';
    }

    const handleLangChange = (e: Event) => {
      const customEvent = e as CustomEvent<Language>;
      if (customEvent.detail && (customEvent.detail === 'ar' || customEvent.detail === 'en')) {
        setLangState(customEvent.detail);
      } else {
        setLangState(getStoredLanguage());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LANGUAGE_STORAGE_KEY && (e.newValue === 'ar' || e.newValue === 'en')) {
        setLangState(e.newValue);
        document.documentElement.lang = e.newValue;
        document.documentElement.dir = e.newValue === 'ar' ? 'rtl' : 'ltr';
      }
    };

    window.addEventListener(LANG_CHANGE_EVENT, handleLangChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener(LANG_CHANGE_EVENT, handleLangChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const setLanguage = (nextLang: Language) => {
    setLangState(nextLang);
    setStoredLanguage(nextLang);
  };

  const toggleLanguage = () => {
    const nextLang: Language = lang === 'ar' ? 'en' : 'ar';
    setLanguage(nextLang);
  };

  return {
    lang,
    isEn: lang === 'en',
    isAr: lang === 'ar',
    setLanguage,
    toggleLanguage
  };
}
