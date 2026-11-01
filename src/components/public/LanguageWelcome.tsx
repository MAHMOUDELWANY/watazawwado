import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { chooseLanguage, localizedPath, pathLanguage, stripLangPrefix } from '../../lib/language';
import type { Language } from '../../types';
import FocusTrap from '../FocusTrap';

/**
 * First visit, no language chosen yet ("language welcome" in docs/design/INSPIRATION.md, owner 2026-11-02): a calm
 * full-screen choice between English and العربية, the suggested one lit. The suggestion is the language of the page
 * the visitor landed on (/ar addresses), else the phone's language.
 *
 * Decided before the first paint in index.html (`html.lang-welcome`, `data-lang-suggest`), so the page never flashes
 * first. With the signature intro, the intro's curtain lifts onto this screen and the hero photos unveil only after
 * the choice. Esc takes the suggestion; the choice is saved like the header toggle (cookie, storage, account).
 */
const OPTIONS: Array<{ lang: Language; name: string; line: string; nameLang: string }> = [
  { lang: 'en', name: 'English', line: 'Continue in English', nameLang: 'en' },
  { lang: 'ar', name: 'العربية', line: 'كمّل بالعربي', nameLang: 'ar' },
];

export function LanguageWelcome() {
  const [open, setOpen] = useState(false);
  const [leaving, setLeaving] = useState<Language | null>(null);
  const [suggested, setSuggested] = useState<Language>('en');
  // Under the signature intro the screen waits, so its title rises once the curtain is gone.
  const [behindIntro, setBehindIntro] = useState(false);
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains('lang-welcome')) return;
    // A visitor already reading after a very slow start is not interrupted; they can use the header toggle.
    if (performance.now() > 4500) { root.classList.remove('lang-welcome'); return; }
    setSuggested(root.dataset.langSuggest === 'ar' ? 'ar' : 'en');
    root.classList.add('lw-open');
    setOpen(true);
    if (!root.classList.contains('sig-intro')) return;
    setBehindIntro(true);
    const watch = new MutationObserver(() => {
      if (root.classList.contains('sig-intro')) return;
      setBehindIntro(false);
      watch.disconnect();
    });
    watch.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => watch.disconnect();
  }, []);

  const choose = (lang: Language) => {
    if (leaving) return;
    chooseLanguage(lang);
    setLeaving(lang);
    if (pathLanguage(pathname) !== lang) navigate(localizedPath(stripLangPrefix(pathname), lang) + search + hash, { replace: true });
    const root = document.documentElement;
    window.setTimeout(() => {
      root.classList.remove('lang-welcome', 'lw-open');
      // The hero photos unveil now that the page is in front of the visitor (signature intro styles).
      root.classList.add('sig-revealing');
      window.setTimeout(() => root.classList.remove('sig-revealing'), 1700);
      setOpen(false);
    }, 520);
  };

  if (!open) return null;
  const order = suggested === 'ar' ? [OPTIONS[1], OPTIONS[0]] : OPTIONS;
  return (
    <div
      className={`lang-welcome-overlay ${behindIntro ? 'is-behind' : ''} ${leaving ? 'is-leaving' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="lang-welcome-title"
      data-testid="language-welcome"
      dir="ltr"
    >
      <FocusTrap isActive={!behindIntro} onEscape={() => choose(suggested)}>
      <div className="lw-inner">
        <h2 id="lang-welcome-title" className="lw-title">
          Choose your <em>language.</em>
          <span className="lw-title-ar" lang="ar" dir="rtl">اختار لغتك</span>
        </h2>
        <div className="lw-panel">
          {order.map((o, i) => {
            const isSuggested = o.lang === suggested;
            return (
              <button
                key={o.lang}
                type="button"
                lang={o.nameLang}
                dir={o.lang === 'ar' ? 'rtl' : 'ltr'}
                className={`lw-option ${isSuggested ? 'is-suggested' : ''} ${leaving === o.lang ? 'is-chosen' : ''}`}
                style={{ animationDelay: `${0.35 + i * 0.12}s` }}
                onClick={() => choose(o.lang)}
              >
                <span className="lw-name">{o.name}</span>
                <span className="lw-line">{o.line}</span>
                {isSuggested && <span className="lw-badge">{o.lang === 'ar' ? 'مقترح' : 'Suggested'}</span>}
              </button>
            );
          })}
        </div>
        <p className="lw-note">
          You can change it any time at the top.
          <span className="block mt-1" lang="ar" dir="rtl">وتقدر تغيّرها في أي وقت من فوق.</span>
        </p>
      </div>
      </FocusTrap>
    </div>
  );
}
