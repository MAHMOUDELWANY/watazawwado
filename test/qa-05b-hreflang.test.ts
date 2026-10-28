import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { PUBLIC_PAGES, pagePath, pageUrl } from '../src/data/seo.js';

// Every public page has an English address (plain path, the default since 2026-10-28) and an Arabic one under /ar.
describe('QA-05b language URLs and hreflang', () => {
  const script = fs.readFileSync('scripts/prerender-seo.ts', 'utf8');
  const app = fs.readFileSync('src/App.tsx', 'utf8');

  it('the seo data has a title and description in both languages for every page', () => {
    for (const p of PUBLIC_PAGES) {
      for (const k of ['titleEn', 'titleAr', 'descEn', 'descAr'] as const) {
        assert.ok(p[k] && p[k].trim().length > 10, `${p.path} ${k}`);
      }
      assert.match(p.titleAr + p.descAr, /[؀-ۿ]/, `${p.path} Arabic text`);
    }
  });

  it('Arabic addresses live under /ar, English keeps the plain path', () => {
    assert.strictEqual(pagePath('/', 'ar'), '/ar');
    assert.strictEqual(pagePath('/pricing', 'ar'), '/ar/pricing');
    assert.strictEqual(pagePath('/pricing', 'en'), '/pricing');
    assert.strictEqual(pageUrl('/', 'en'), 'https://watazawwado.academy/');
  });

  it('old /en links redirect to the plain path', () => {
    assert.ok(app.includes('<Route path="/en/*" element={<OldEnglishAddress />} />'));
    assert.ok(app.includes('<Route path="/en" element={<Navigate to="/" replace />} />'));
  });

  it('the prerender script writes both versions with the three hreflang links and a self canonical', () => {
    assert.ok(script.includes("const LANGS: Lang[] = ['en', 'ar']"));
    for (const h of ['hreflang="ar"', 'hreflang="en"', 'hreflang="x-default"']) assert.ok(script.includes(h), h);
    assert.ok(script.includes('<link rel="canonical" href="${url}" />${hreflangLinks(page.path)}'));
    assert.ok(script.includes('const url = pageUrl(page.path, lang)'));
    assert.ok(script.includes('<html lang="${lang}" dir="${isEn ? \'ltr\' : \'rtl\'}"'));
    assert.ok(script.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'), 'sitemap alternates');
  });

  it('the router has an /ar route for every public page', () => {
    for (const p of PUBLIC_PAGES) assert.ok(app.includes(`<Route path="${pagePath(p.path, 'ar')}"`), pagePath(p.path, 'ar'));
  });

  it('built files carry the right language, canonical and alternates when a build is present', (t) => {
    if (!fs.existsSync('dist/ar/pricing.html')) return t.skip('no build');
    for (const p of PUBLIC_PAGES) {
      for (const lang of ['ar', 'en'] as const) {
        const urlPath = pagePath(p.path, lang);
        const file = urlPath === '/' ? 'dist/index.html' : `dist${urlPath}.html`;
        const html = fs.readFileSync(file, 'utf8');
        assert.ok(html.includes(`<html lang="${lang}" dir="${lang === 'en' ? 'ltr' : 'rtl'}"`), `${file} lang`);
        assert.ok(html.includes(`<link rel="canonical" href="${pageUrl(p.path, lang)}" />`), `${file} canonical`);
        assert.ok(html.includes(`<link rel="alternate" hreflang="ar" href="${pageUrl(p.path, 'ar')}" />`), `${file} ar`);
        assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="${pageUrl(p.path, 'en')}" />`), `${file} en`);
        assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="${pageUrl(p.path, 'en')}" />`), `${file} x-default`);
        const title = (lang === 'en' ? p.titleEn : p.titleAr).replace(/&/g, '&amp;');
        assert.ok(html.includes(`<title>${title}</title>`), `${file} title`);
      }
    }
    for (const f of ['dist/learning.html', 'dist/ar/learning.html']) {
      assert.ok(fs.readFileSync(f, 'utf8').includes('"@type":"ItemList"'), `${f} keeps the Course data`);
    }
    const sitemap = fs.readFileSync('dist/sitemap.xml', 'utf8');
    assert.strictEqual((sitemap.match(/<url>/g) || []).length, PUBLIC_PAGES.length * 2);
    assert.ok(sitemap.includes('<loc>https://watazawwado.academy/ar/pricing</loc>'));
  });
});
