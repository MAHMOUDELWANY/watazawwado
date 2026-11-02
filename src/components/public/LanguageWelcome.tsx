import React, { useEffect, useLayoutEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chooseLanguage, localizedPath, pathLanguage, stripLangPrefix } from '../../lib/language';
import type { Language } from '../../types';
import FocusTrap from '../FocusTrap';
import { PublicButton } from './PublicDesignSystem';

/**
 * First visit, no language chosen yet ("language welcome", owner 2026-11-02): our paper, the khatam field, two cards.
 * Nothing is chosen for the visitor: the language of their device is marked "Suggested", the first tap selects a
 * card, and a second tap on it (or Continue) goes on. The choice is saved like the header toggle (cookie, storage,
 * account), so the screen never shows again and emails and notifications follow it.
 *
 * Decided before the first paint in index.html (`html.lang-welcome`, `data-lang-suggest` from the device language).
 * Under the signature intro it waits, so its title rises once the paper has opened onto it.
 */
const OPTIONS: Array<{ lang: Language; name: string; line: string; suggested: string; go: string }> = [
  { lang: 'en', name: 'English', line: 'الإنجليزية', suggested: "Suggested · your device's language", go: 'Continue in English' },
  { lang: 'ar', name: 'العربية', line: 'Arabic', suggested: 'مقترح · لغة جهازك', go: 'كمّل بالعربي' },
];

export function LanguageWelcome() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<Language | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [suggested, setSuggested] = useState<Language>('en');
  const [behindIntro, setBehindIntro] = useState(false);
  const [fromIntro, setFromIntro] = useState(false);
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('lang-welcome')) return;
    // A visitor already reading after a very slow start is not interrupted; they can use the header toggle.
    if (performance.now() > 4500) { root.classList.remove('lang-welcome'); return; }
    setSuggested(root.dataset.langSuggest === 'ar' ? 'ar' : 'en');
    setOpen(true);
    if (!root.classList.contains('sig-intro')) return;
    setBehindIntro(true);
    setFromIntro(true);
    const watch = new MutationObserver(() => {
      if (root.classList.contains('sig-intro')) return;
      setBehindIntro(false);
      watch.disconnect();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => watch.disconnect();
  }, []);

  // The cover gives way only once this screen is in the DOM.
  useLayoutEffect(() => {
    if (open) document.documentElement.classList.add('lw-open');
  }, [open]);

  const go = (lang: Language) => {
    if (leaving) return;
    chooseLanguage(lang);
    setLeaving(true);
    if (pathLanguage(pathname) !== lang) navigate(localizedPath(stripLangPrefix(pathname), lang) + search + hash, { replace: true });
    const root = document.documentElement;
    window.setTimeout(() => {
      root.classList.remove('lang-welcome', 'lw-open');
      // The hero photos unveil now that the page is in front of the visitor (signature intro styles).
      root.classList.add('sig-revealing');
      window.setTimeout(() => root.classList.remove('sig-revealing'), 1900);
      setOpen(false);
    }, 480);
  };

  // First tap selects; a second tap on the selected card goes on.
  const tap = (lang: Language) => (picked === lang ? go(lang) : setPicked(lang));

  if (!open) return null;
  const chosen = OPTIONS.find((o) => o.lang === picked);
  return (
    <div
      className={`lang-welcome-overlay khatam-field ${behindIntro ? 'is-behind' : ''} ${fromIntro ? 'from-intro' : ''} ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-welcome-title"
      data-testid="language-welcome"
      dir="ltr"
    >
      <FocusTrap isActive={!behindIntro}>
        <div className="lw-inner">
          <svg className="lw-mark" viewBox="0 0 40 40" aria-hidden="true">
            <g fill="var(--gold-soft)" stroke="var(--gold-deep)" strokeWidth="1">
              <rect x="10" y="10" width="20" height="20" rx="1.5" />
              <rect x="10" y="10" width="20" height="20" rx="1.5" transform="rotate(45 20 20)" />
            </g>
            <circle cx="20" cy="20" r="3.5" fill="var(--primary)" />
          </svg>
          <p className="lw-eyebrow">Welcome · <span lang="ar">أهلاً بيك</span></p>
          <h2 id="lang-welcome-title" className="lw-title">
            Choose your <em>language.</em>
            <span className="lw-title-ar" lang="ar" dir="rtl">اختار لغتك</span>
          </h2>
          <div className="lw-options" role="radiogroup" aria-labelledby="lang-welcome-title">
            {OPTIONS.map((o, i) => (
              <button
                key={o.lang}
                type="button"
                role="radio"
                aria-checked={picked === o.lang}
                lang={o.lang}
                dir={o.lang === 'ar' ? 'rtl' : 'ltr'}
                className="lw-option"
                style={{ animationDelay: `${0.25 + i * 0.1}s` }}
                onClick={() => tap(o.lang)}
              >
                <span className="lw-text">
                  <span className="lw-name">{o.name}</span>
                  <span className="lw-line" lang={o.lang === 'ar' ? 'en' : 'ar'}>{o.line}</span>
                  {o.lang === suggested && <span className="lw-badge">{o.suggested}</span>}
                </span>
                <span className="lw-radio" aria-hidden="true">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3.5 8.5l3 3 6-7" /></svg>
                </span>
              </button>
            ))}
          </div>
          <PublicButton
            variant="primary"
            size="lg"
            className="lw-continue"
            disabled={!chosen}
            lang={chosen?.lang}
            onClick={() => chosen && go(chosen.lang)}
          >
            {chosen ? chosen.go : <>Choose a language · <span lang="ar">اختار لغة</span></>}
          </PublicButton>
          <p className="lw-note">
            You can change it any time from the menu at the top.
            <span className="block mt-1" lang="ar" dir="rtl">وتقدر تغيّرها في أي وقت من القائمة اللي فوق.</span>
          </p>
        </div>
      </FocusTrap>
    </div>
  );
}
