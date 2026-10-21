import { useState, useEffect } from 'react';
import { Language } from '../types';
import { PUBLIC_PAGES } from '../data/seo';

export const LANGUAGE_STORAGE_KEY = 'watazawwado_lang';
export const LANG_CHANGE_EVENT = 'watazawwado_lang_change';
// Set only when the user picks a language themselves; emails follow that choice (RULES.md §6).
const LANG_CHOSEN_COOKIE = 'watazawwado_lang_chosen';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find(c => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=31536000; samesite=lax${location.protocol === 'https:' ? '; secure' : ''}`;
}

/**
 * Saves the user's explicit language choice on their account (any role), so emails
 * arrive in that language. If nobody is signed in yet, it is saved at the next sign-in.
 */
export async function syncChosenLanguage(): Promise<void> {
  const chosen = readCookie(LANG_CHOSEN_COOKIE);
  if (chosen !== 'ar' && chosen !== 'en') return;
  try {
    const { getFreshAccessToken } = await import('./auth');
    const token = await getFreshAccessToken();
    if (!token) return;
    await fetch('/api/me/language', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ language: chosen })
    });
  } catch {
    // Best effort: emails fall back to English.
  }
}

/**
 * English URLs (QA-05b): every public page also lives under /en (/en, /en/about, ...). Arabic keeps
 * the plain paths. Account areas (student, dashboard, staff, API) never get the prefix.
 */
export const EN_PREFIX = '/en';
const LOCALIZED_PATHS = new Set([...PUBLIC_PAGES.map((p) => p.path), '/get-started']);

export const isEnPath = (pathname: string) => pathname === EN_PREFIX || pathname.startsWith(EN_PREFIX + '/');

/** '/en/pricing' -> '/pricing', '/en' -> '/'; other paths unchanged. */
export function stripEnPrefix(pathname: string): string {
  if (!isEnPath(pathname)) return pathname;
  return pathname.slice(EN_PREFIX.length) || '/';
}

/** The URL of a public page in a language: localizedPath('/pricing', 'en') -> '/en/pricing'. Keeps ?query and #hash. */
export function localizedPath(to: string, lang: Language): string {
  const cut = to.search(/[?#]/);
  const pathname = cut === -1 ? to : to.slice(0, cut);
  const rest = cut === -1 ? '' : to.slice(cut);
  const base = stripEnPrefix(pathname);
  if (lang !== 'en' || !LOCALIZED_PATHS.has(base)) return base + rest;
  return (base === '/' ? EN_PREFIX : EN_PREFIX + base) + rest;
}

// The prerender build has no window: it renders /en pages in English through this.
let prerenderLanguage: Language = 'ar';
export function setPrerenderLanguage(lang: Language) {
  prerenderLanguage = lang;
}

/**
 * Retrieves the current language preference.
 * Priority: localStorage -> document element -> default 'ar'
 */
export function getStoredLanguage(): Language {
  if (typeof window !== 'undefined') {
    try {
      const cookie = readCookie(LANGUAGE_STORAGE_KEY);
      if (cookie === 'ar' || cookie === 'en') {
        return cookie;
      }
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'ar' || saved === 'en') {
        writeCookie(LANGUAGE_STORAGE_KEY, saved);
        return saved;
      }
      // If not yet set, write default 'ar' to storage
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'ar');
    } catch {
      // Ignore localStorage errors (e.g. private mode)
    }
    return 'ar'; // Strict default is Arabic
  }
  return prerenderLanguage;
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
    // A cookie keeps the choice across every part of the site (public, student, dashboard).
    writeCookie(LANGUAGE_STORAGE_KEY, lang);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    }

    window.dispatchEvent(new CustomEvent<Language>(LANG_CHANGE_EVENT, { detail: lang }));
  }
}

/** Saves a language the user picked (toggle or an /en address): storage, cookie, and their account. */
export function chooseLanguage(lang: Language): void {
  setStoredLanguage(lang);
  writeCookie(LANG_CHOSEN_COOKIE, lang);
  void syncChosenLanguage();
}

/** Opening an /en address picks English, the same way the toggle does, so the choice sticks. */
export function applyUrlLanguage(pathname: string): void {
  if (isEnPath(pathname) && getStoredLanguage() !== 'en') chooseLanguage('en');
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
    chooseLanguage(nextLang);
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

/**
 * Bilingual text helper for components: t('English', 'عربي') returns the current language's text.
 */
export function useT() {
  const language = useAppLanguage();
  const t = (en: string, ar: string) => (language.isAr ? ar : en);
  return { ...language, t };
}
