/**
 * Runs after `vite build` and the SSR build of src/entry-prerender.tsx: writes two HTML files per
 * public page, English at the plain path (dist/about.html) and Arabic under /ar (dist/ar/about.html,
 * dist/ar.html for the homepage; owner 2026-10-28), each with its own lang/dir, title, description, self
 * canonical, hreflang alternates and social tags, the page itself rendered inside #root, and
 * dist/sitemap.xml listing both addresses with their alternates.
 * Vercel serves real files before the SPA rewrite, so visitors see content before the JavaScript
 * arrives (much faster first paint on phones) and crawlers get the full page without running JS.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { PUBLIC_PAGES, SITE_URL, pagePath, pageUrl } from '../src/data/seo';
import { BOOKABLE_SERVICES } from '../src/booking/mockData';
import { ARTICLES } from '../src/data/articles';
import { SUBJECT_PAGES, SUBJECT_PAGES_PATH } from '../src/data/subjectPages';

const dist = path.resolve('dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

// Account areas and unknown paths get the plain app shell (vercel.json rewrites to /spa.html):
// they must not flash the homepage's prerendered content, and are not for search engines.
fs.writeFileSync(
  path.join(dist, 'spa.html'),
  template.replace(/<meta name="robots" content="[^"]*" \/>/, () => '<meta name="robots" content="noindex, nofollow" />')
);

// Public pages inline the stylesheet: one less round trip before the first paint on phones.
const cssLink = template.match(/<link rel="stylesheet"[^>]*href="(\/assets\/[^"]+\.css)"[^>]*>/);
const inlineCss = cssLink ? fs.readFileSync(path.join(dist, cssLink[1]), 'utf8') : null;

type Lang = 'ar' | 'en';
const LANGS: Lang[] = ['en', 'ar'];

export function courseListJsonLd(lang: Lang = 'ar'): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Subjects at Watazawwado Academy',
    itemListElement: BOOKABLE_SERVICES.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Course',
        name: s.name,
        description: s.description,
        url: pageUrl('/learning', lang),
        inLanguage: ['en', 'ar'],
        provider: { '@id': `${SITE_URL}/#org` },
        // RULES.md §3: hourly "from" prices for standard lessons; the server sets the charged fee.
        offers: { '@type': 'Offer', category: 'Paid', price: s.hourlyRateUsd, priceCurrency: 'USD' },
        hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT1H' }
      }
    }))
  };
  // No raw "<" inside a script tag.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** NX-11: each article page describes itself as a BlogPosting by the academy, in that page's language. */
export function articleJsonLd(slug: string, lang: Lang): string | null {
  const a = ARTICLES.find((x) => x.slug === slug);
  if (!a) return null;
  const url = pageUrl(`/articles/${a.slug}`, lang);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: lang === 'en' ? a.titleEn : a.titleAr,
    description: lang === 'en' ? a.descEn : a.descAr,
    inLanguage: lang,
    datePublished: a.date,
    dateModified: a.date,
    url,
    mainEntityOfPage: url,
    image: `${SITE_URL}/og-image.jpg`,
    author: { '@id': `${SITE_URL}/#org` },
    publisher: { '@id': `${SITE_URL}/#org` }
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** Each subject landing page describes itself as a Course by the academy, with its "from" hourly price. */
export function subjectCourseJsonLd(slug: string, lang: Lang): string | null {
  const s = SUBJECT_PAGES.find((x) => x.slug === slug);
  if (!s) return null;
  const isEn = lang === 'en';
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: isEn ? s.h1En : s.h1Ar,
    description: isEn ? s.descEn : s.descAr,
    url: pageUrl(`${SUBJECT_PAGES_PATH}/${s.slug}`, lang),
    inLanguage: lang,
    provider: { '@type': 'EducationalOrganization', '@id': `${SITE_URL}/#org`, name: 'Watazawwado Academy', url: `${SITE_URL}/` },
    // RULES.md §3: "from" prices for standard lessons; the server sets the charged fee.
    offers: { '@type': 'Offer', category: 'Paid', price: s.rateUsd, priceCurrency: 'USD', url: pageUrl('/pricing', lang) },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'Online', courseWorkload: 'PT1H' }
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** hreflang alternates, the same on both language versions; x-default is the English (root) address. */
export function hreflangLinks(path: string): string {
  return (
    `<link rel="alternate" hreflang="ar" href="${pageUrl(path, 'ar')}" />` +
    `<link rel="alternate" hreflang="en" href="${pageUrl(path, 'en')}" />` +
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(path, 'en')}" />`
  );
}

function render(page: (typeof PUBLIC_PAGES)[number], lang: Lang, body: string | null): string {
  const url = pageUrl(page.path, lang);
  const isEn = lang === 'en';
  const title = isEn ? page.titleEn : page.titleAr;
  const desc = isEn ? page.descEn : page.descAr;
  let html = template;
  const swap = (re: RegExp, value: string) => {
    if (!re.test(html)) throw new Error(`prerender-seo: tag not found for ${page.path}: ${re}`);
    html = html.replace(re, () => value);
  };
  swap(/<html lang="[^"]*" dir="[^"]*"/, `<html lang="${lang}" dir="${isEn ? 'ltr' : 'rtl'}"`);
  swap(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`);
  swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(desc)}" />`);
  swap(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(title)}" />`);
  swap(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(desc)}" />`);
  swap(/<meta property="og:locale" content="[^"]*" \/>/, `<meta property="og:locale" content="${isEn ? 'en_US' : 'ar_AR'}" />`);
  swap(/<meta property="og:locale:alternate" content="[^"]*" \/>/, `<meta property="og:locale:alternate" content="${isEn ? 'ar_AR' : 'en_US'}" />`);
  swap(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />${hreflangLinks(page.path)}`);
  swap(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  // The real page rendered at build time; main.tsx hydrates it in the browser (data-prerendered marks it).
  // If rendering failed, a visually hidden summary keeps the page readable for crawlers.
  const summary =
    `<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"><h1>${esc(isEn ? page.h1En : page.titleAr)}</h1>` +
    `<p>${esc(desc)}</p><nav>` +
    PUBLIC_PAGES.map((p) => `<a href="${pagePath(p.path, lang)}">${esc(isEn ? p.h1En : p.titleAr)}</a>`).join(' · ') +
    `</nav></div>`;
  swap(/<div id="root"><\/div>/, body ? `<div id="root" data-prerendered>${body}</div>` : `<div id="root">${summary}</div>`);
  if (cssLink && inlineCss) html = html.replace(cssLink[0], () => `<style>${inlineCss}</style>`);
  // QA-05: the subjects page describes each bookable subject as a Course (same names and "from" prices as the site).
  if (page.path === '/learning') {
    html = html.replace('</head>', () => `<script type="application/ld+json">${courseListJsonLd(lang)}</script></head>`);
  }
  const articleLd = page.path.startsWith('/articles/') ? articleJsonLd(page.path.slice('/articles/'.length), lang) : null;
  if (articleLd) html = html.replace('</head>', () => `<script type="application/ld+json">${articleLd}</script></head>`);
  const courseLd = page.path.startsWith(`${SUBJECT_PAGES_PATH}/`) ? subjectCourseJsonLd(page.path.slice(SUBJECT_PAGES_PATH.length + 1), lang) : null;
  if (courseLd) html = html.replace('</head>', () => `<script type="application/ld+json">${courseLd}</script></head>`);
  // On wide screens the teacher photo is the largest element above the fold: fetch it first.
  // On phones it sits below the fold, so preloading it would only compete with the page itself.
  if (page.path === '/' || page.path === '/about') {
    html = html.replace('</title>', () => '</title><link rel="preload" as="image" href="/ustadh-mahmoud.jpg" fetchpriority="high" media="(min-width: 1024px)" /><link rel="preload" as="image" href="/ustadha-afnan.jpg" media="(min-width: 1024px)" />');
  }
  return html;
}

const ssrEntry = path.resolve('build/prerender/entry-prerender.js');
const renderer: { render: (url: string) => Promise<string> } | null = fs.existsSync(ssrEntry)
  ? await import(pathToFileURL(ssrEntry).href)
  : null;

let rendered = 0;
fs.mkdirSync(path.join(dist, 'ar'), { recursive: true });
for (const page of PUBLIC_PAGES) {
  for (const lang of LANGS) {
    const urlPath = pagePath(page.path, lang);
    // Vercel cleanUrls: /about -> about.html, /ar -> ar.html, /ar/about -> ar/about.html.
    const file = urlPath === '/' ? 'index.html' : `${urlPath.slice(1)}.html`;
    let body: string | null = null;
    try {
      body = renderer ? await renderer.render(urlPath) : null;
      if (body) rendered++;
    } catch (err) {
      console.warn(`prerender-seo: could not render ${urlPath}, using the summary`, err);
    }
    fs.mkdirSync(path.dirname(path.join(dist, file)), { recursive: true });
    fs.writeFileSync(path.join(dist, file), render(page, lang, body));
  }
}

const today = new Date().toISOString().slice(0, 10);
const alternates = (p: string) =>
  `<xhtml:link rel="alternate" hreflang="ar" href="${pageUrl(p, 'ar')}"/>` +
  `<xhtml:link rel="alternate" hreflang="en" href="${pageUrl(p, 'en')}"/>` +
  `<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(p, 'en')}"/>`;
const priority = (p: string) => (p === '/' ? '1.0' : ['/privacy', '/terms'].includes(p) ? '0.3' : '0.8');
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PUBLIC_PAGES.flatMap((p) => LANGS.map((lang) => `  <url><loc>${pageUrl(p.path, lang)}</loc>${alternates(p.path)}<lastmod>${today}</lastmod><priority>${priority(p.path)}</priority></url>`)).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);

// llms.txt (llmstxt.org): a plain summary and page list for AI assistants, built from the same page data.
const llmsLink = (p: (typeof PUBLIC_PAGES)[number]) => `- [${p.h1En}](${pageUrl(p.path, 'en')}): ${p.descEn}`;
const isSubject = (p: (typeof PUBLIC_PAGES)[number]) => p.path.startsWith(`${SUBJECT_PAGES_PATH}/`);
const isArticle = (p: (typeof PUBLIC_PAGES)[number]) => p.path.startsWith('/articles/');
const llms = `# Watazawwado Academy (أكاديمية وتزودوا)

> Watazawwado Academy (watazawwado.academy) is an online academy with male and female teachers giving live one-on-one lessons on Zoom to children (6 to 17, through a family account) and adults: Quran reading, Tajweed, Quran memorization and revision (Hifz), the Zad Path (our own curriculum of Islamic knowledge: Zad Essentials and Seerah), Fusha Arabic, Egyptian Arabic and English. It serves Muslim families worldwide, mostly in the West. Quran and Zad Path lessons are from $9 an hour; Arabic and English from $13 an hour; lessons are 30, 45 or 60 minutes and priced by length. The first lesson is a free 30-minute trial. The site is in English, with Arabic under /ar.

Not to be confused with other sites using a similar name: our only address is https://watazawwado.academy.

## Classes
${PUBLIC_PAGES.filter(isSubject).map(llmsLink).join('\n')}

## About the academy
${PUBLIC_PAGES.filter((p) => !isSubject(p) && !isArticle(p) && !['/privacy', '/terms'].includes(p.path)).map(llmsLink).join('\n')}

## Articles
${PUBLIC_PAGES.filter(isArticle).map(llmsLink).join('\n')}

## Optional
${PUBLIC_PAGES.filter((p) => ['/privacy', '/terms'].includes(p.path)).map(llmsLink).join('\n')}
`;
fs.writeFileSync(path.join(dist, 'llms.txt'), llms);
console.log(`prerender-seo: ${PUBLIC_PAGES.length} pages x ${LANGS.length} languages (${rendered} fully rendered) + sitemap.xml`);
