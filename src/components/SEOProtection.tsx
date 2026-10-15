import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { findPageSeo, SITE_URL } from '../data/seo';
import { useAppLanguage } from '../lib/language';

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

export default function SEOProtection() {
  const { pathname } = useLocation();
  const { isAr } = useAppLanguage();

  useEffect(() => {
    // /get-started shows the homepage: same page for search engines.
    const page = findPageSeo(pathname === '/get-started' ? '/' : pathname.replace(/\/+$/, '') || '/');
    if (!page) {
      setMeta('name', 'robots', 'noindex, nofollow');
      return;
    }
    const title = isAr ? page.titleAr : page.titleEn;
    const desc = isAr ? page.descAr : page.descEn;
    const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
    document.title = title;
    setMeta('name', 'robots', 'index, follow, max-image-preview:large');
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setCanonical(url);
  }, [pathname, isAr]);

  return null;
}
