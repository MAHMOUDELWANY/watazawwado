/**
 * Runs after `vite build`: writes one HTML file per public page (dist/about.html, dist/pricing.html,
 * ...) with that page's title, description, canonical URL and social tags, plus dist/sitemap.xml.
 * Vercel serves real files before the SPA rewrite, so crawlers and link previews get correct tags
 * without running JavaScript; the app itself loads exactly as before.
 */
import fs from 'fs';
import path from 'path';
import { PUBLIC_PAGES, SITE_URL } from '../src/data/seo';

const dist = path.resolve('dist');
const template = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function render(page: (typeof PUBLIC_PAGES)[number]): string {
  const url = `${SITE_URL}${page.path === '/' ? '/' : page.path}`;
  let html = template;
  const swap = (re: RegExp, value: string) => {
    if (!re.test(html)) throw new Error(`prerender-seo: tag not found for ${page.path}: ${re}`);
    html = html.replace(re, value);
  };
  swap(/<title>[^<]*<\/title>/, `<title>${esc(page.titleEn)}</title>`);
  swap(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(page.descEn)}" />`);
  swap(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${esc(page.titleEn)}" />`);
  swap(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${esc(page.descEn)}" />`);
  swap(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`);
  swap(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);
  // Readable summary inside #root for crawlers that do not run JavaScript (Bing ignores <noscript>).
  // createRoot().render replaces it once the app loads; visually hidden so it never flashes.
  swap(
    /<div id="root"><\/div>/,
    `<div id="root"><div style="position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0)"><h1>${esc(page.h1En)}</h1><p>${esc(page.descEn)}</p><p>${esc(page.descAr)}</p><nav>${PUBLIC_PAGES.map((p) => `<a href="${p.path}">${esc(p.h1En)}</a>`).join(' · ')}</nav></div></div>`
  );
  return html;
}

for (const page of PUBLIC_PAGES) {
  const file = page.path === '/' ? 'index.html' : `${page.path.slice(1)}.html`;
  fs.writeFileSync(path.join(dist, file), render(page));
}

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${PUBLIC_PAGES.map((p) => `  <url><loc>${SITE_URL}${p.path === '/' ? '/' : p.path}</loc><lastmod>${today}</lastmod><priority>${p.path === '/' ? '1.0' : ['/privacy', '/terms'].includes(p.path) ? '0.3' : '0.8'}</priority></url>`).join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(dist, 'sitemap.xml'), sitemap);
console.log(`prerender-seo: ${PUBLIC_PAGES.length} pages + sitemap.xml`);
