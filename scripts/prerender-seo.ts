/**
 * Runs after `vite build` and the SSR build of src/entry-prerender.tsx: writes one HTML file per
 * public page (dist/about.html, dist/pricing.html, ...) with that page's title, description,
 * canonical URL and social tags, the page itself rendered inside #root, and dist/sitemap.xml.
 * Vercel serves real files before the SPA rewrite, so visitors see content before the JavaScript
 * arrives (much faster first paint on phones) and crawlers get the full page without running JS.
 */
import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { PUBLIC_PAGES, SITE_URL } from '../src/data/seo';

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

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(page: (typeof PUBLIC_PAGES)[number], body: string | null): string {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  let html = template;
  const swap = (re: RegExp, value: string) => {
    if (!re.test(html)) throw new Error(`prerender-seo: tag not found for ${page.path}: ${re}`);
    html = html.replace(re, () => value);
  };
  swap(/<title>[^<]*<\/title>/, `<title>${esc(page.titleEn)}</title>`);
  swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.descEn)}" />`);
  swap(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(page.titleEn)}" />`);
  swap(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(page.descEn)}" />`);
  swap(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  swap(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  // The real page rendered at build time; main.tsx renders the same page over it in the browser.
  // If rendering failed, a visually hidden summary keeps the page readable for crawlers.
  const summary =
    `<div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"><h1>${esc(page.h1En)}</h1>` +
    `<p>${esc(page.descEn)}</p><p>${esc(page.descAr)}</p><nav>` +
    PUBLIC_PAGES.map((p) => `<a href="${p.path}">${esc(p.h1En)}</a>`).join(' · ') +
    `</nav></div>`;
  swap(/<div id="root"><\/div>/, `<div id="root">${body || summary}</div>`);
  if (cssLink && inlineCss) html = html.replace(cssLink[0], () => `<style>${inlineCss}</style>`);
  // On wide screens the teacher photo is the largest element above the fold: fetch it first.
  // On phones it sits below the fold, so preloading it would only compete with the page itself.
  if (page.path === '/' || page.path === '/about') {
    html = html.replace('</title>', () => '</title><link rel="preload" as="image" href="/ustadh-mahmoud.jpg" fetchpriority="high" media="(min-width: 1024px)" />');
  }
  return html;
}

const ssrEntry = path.resolve('build/prerender/entry-prerender.js');
const renderer: { render: (url: string) => Promise<string> } | null = fs.existsSync(ssrEntry)
  ? await import(pathToFileURL(ssrEntry).href)
  : null;

let rendered = 0;
for (const page of PUBLIC_PAGES) {
  const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
  let body: string | null = null;
  try {
    body = renderer ? await renderer.render(page.path) : null;
    if (body) rendered++;
  } catch (err) {
    console.warn(`prerender-seo: could not render ${page.path}, using the summary`, err);
  }
  fs.writeFileSync(path.join(dist, file), render(page, body));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PAGES.map((p) => `  <url><loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : ['/privacy', '/terms'].includes(p.path) ? '0.3' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender-seo: ${PUBLIC_PAGES.length} pages (${rendered} fully rendered) + sitemap.xml`);
