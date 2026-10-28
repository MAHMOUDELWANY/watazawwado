import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findPageSeo, pageUrl } from '../data/seo';
import { pathLanguage, stripLangPrefix, useAppLanguage } from '../lib/language';

/**
 * Per-page search tags. Public pages (home, about, how it works, subjects, pricing, FAQ, terms,
 * privacy) are indexable with their own title, description and canonical URL; account areas
 * (student, dashboard, staff, sign-in) are noindex. The same tags are also written into the
 * prerendered HTML at build time (scripts/prerender-seo.ts).
 */

function setMeta(attr: 'name' | 'property', key: string, value: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', value);
}

function setCanonical(href: string) {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.rel = 'canonical';
    document.head.appendChild(el);
  }
  el.href = href;
}

/** hreflang links (QA-05b): each public page names its Arabic and English address; x-default is Arabic. */
function setAlternates(path: string | null) {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove());
  if (!path) return;
  for (const [hreflang, href] of [['ar', pageUrl(path, 'ar')], ['en', pageUrl(path, 'en')], ['x-default', pageUrl(path, 'ar')]]) {
    const el = document.createElement('link');
    el.rel = 'alternate';
    el.hreflang = hreflang;
    el.href = href;
    document.head.appendChild(el);
  }
}

export default function SEOProtection() {
  const { pathname } = useLocation();
  const { isAr } = useAppLanguage();

  useEffect(() => {
    // /get-started shows the homepage: same page for search engines.
    const base = stripLangPrefix(pathname.replace(/\/+$/, '') || '/');
    const page = findPageSeo(base === '/get-started' ? '/' : base);
    if (!page) {
      setMeta('name', 'robots', 'noindex, nofollow');
      setAlternates(null);
      return;
    }
    const title = isAr ? page.titleAr : page.titleEn;
    const desc = isAr ? page.descAr : page.descEn;
    // Canonical is the address itself: /pricing stays /pricing even when shown in English.
    const url = pageUrl(page.path, pathLanguage(pathname));
    document.title = title;
    setMeta('name', 'robots', 'index, follow, max-image-preview:large');
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setCanonical(url);
    setAlternates(page.path);
  }, [pathname, isAr]);

  return null;
}
