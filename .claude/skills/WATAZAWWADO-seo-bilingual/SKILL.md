---
name: WATAZAWWADO-seo-bilingual
description: Use for SEO on our own site and content: page titles and meta, headings, prerendering, hreflang English/Arabic, sitemap, structured data, keywords for English-speaking Muslim families in the West, subject and article pages, link previews, Core Web Vitals, "SEO", "سيو", "ranking", "Google", "meta", "title", "sitemap", "schema", "indexing". Our own setup and rules, not a generic audit; calls the outside seo-* skills only for deep audits.
---

# Watazawwado Bilingual SEO

We have one bilingual site, English at the plain address and Arabic under `/ar`, prerendered at build time. This skill knows how that works so SEO changes stay inside it. Generic `seo-*` skills are tools for deep audits (§6); they do not know our setup and must not override it.

## 1. How our SEO works (read before editing)

- **Data**: `src/data/seo.ts` (`PUBLIC_PAGES`: path, English and Arabic title, description, short `h1En`), `src/data/subjectPages.ts`, `src/data/articles.ts`. Brand strings: "Watazawwado Academy" / "أكاديمية وتزودوا" + the domain, so we are not confused with similarly named sites.
- **Build**: `scripts/prerender-seo.ts` writes one HTML file per page per language with title, meta, canonical, hreflang alternates (`ar`, `en`, `x-default` = English root), social tags, JSON-LD (EducationalOrganization, course list, Course, article) and the page itself rendered inside `#root`; it also writes `dist/sitemap.xml` with both addresses and their alternates. `npm run build` runs it.
- **Browser**: `src/components/SEOProtection.tsx` applies the same tags after load and sets `noindex, nofollow` on signed-in and sign-in routes. `src/lib/language.ts` chooses the language (English default; Arabic at `/ar`; old `/en` redirects).
- **Static files**: `public/robots.txt`, `og-image.jpg`, `site.webmanifest`; IndexNow script `scripts/indexnow.ts` after a release that adds pages.

## 2. Rules

1. **Every public page ships both languages** with the matching alternates, one canonical per language version, one `h1` that stays in the prerendered HTML, a unique title (about 60 characters) and description (about 155) in each language, written natively, not machine-translated (`WATAZAWWADO-brand-voice`).
2. **Keywords follow the family, not the keyword tool**: the audience is English-speaking Muslim parents and adults in the UK, US, Canada, Australia and Europe looking for 1-on-1 teachers. Natural phrases: online Quran lessons for kids, Tajweed course, learn Arabic online, Islamic studies for children, female Quran teacher, Egyptian Arabic. The subject list is `src/components/onboarding/subjects.ts`; titles and headings never reduce the academy to one subject (RULES.md §6b).
3. **Honest data only**: no invented reviews, ratings, student counts, degrees, "certified" claims or prices. Structured data must match visible content (Google treats mismatches as spam). Prices only as in RULES.md §3, "from" prices.
4. **Headings and copy**: short, specific, no eyebrows. Alt text on every meaningful image (decorative gets empty alt). Quranic text is real text, not an image.
5. **Performance is SEO**: LCP image prioritised, fonts per page only as needed (Amiri Quran loaded for those letters only), no layout shift, motion only on `transform`/`opacity`, a page under about 6 blurred surfaces. Check mobile first.
6. **Never index private surfaces**: `/student`, `/kid`, `/dashboard`, `/teacher`, `/staff`, `/api/`, `/otp`, `/verify` are disallowed in `public/robots.txt` and signed-in pages carry `noindex`. Prototype and preview routes never enter the sitemap.
7. **New public page checklist**: add to `PUBLIC_PAGES` (both languages), the route, the sitemap (automatic from the list), internal links in and out, JSON-LD if a course/article, OG image, `indexnow` after release.
8. **Articles and subject pages** (`articles.ts`, `subjectPages.ts`): answer one real parent question per article, open with the answer, cite sources for religious claims (`WATAZAWWADO-islamic-content-check` first), link to the matching subject page and the free trial.

## 3. Procedure

1. Say which pages and which language(s) change; read their entries in `seo.ts` and the component.
2. Edit the data (both languages), not just one. Keep the title/description lengths.
3. `npm run build`; open `dist/` output for the changed paths and confirm: title, description, canonical, three hreflang tags, JSON-LD parses, `h1` present, sitemap contains both addresses.
4. In the browser pane check the page in English and Arabic, phone and desktop, console clean.
5. Validate structured data and hreflang with the `seo-schema` and `seo-hreflang` skills (or Google's tools) when you changed them.
6. After release: single production check of the changed URL (no loops), `indexnow` when pages were added, and a note in `docs/backlog/LOG.md`.

## 4. Quick audit order (when asked "how is our SEO?")

Crawl and indexation (robots, sitemap, canonicals, noindex rules) → hreflang pairs (every page has both and they point back) → titles/descriptions/H1 uniqueness → structured data validity → Core Web Vitals on mobile → content gaps against parent questions (`seo-content-brief`, `seo-cluster`) → internal links → analytics and Search Console numbers (`seo-google`, with the owner's access). Report in Arabic: top 5 fixes by effect, each with the file to change.

## 5. Not our job here

Backlink buying, directory spam, auto-generated thin pages at scale, keyword stuffing, fake FAQ schema, copying competitors' text (we never name competitors). Programmatic SEO is allowed only where each page is genuinely useful and reviewed.

## 6. Outside skills, used as tools

`seo-audit`, `seo-technical`, `seo-hreflang`, `seo-schema`, `seo-content-brief`, `seo-cluster`, `seo-geo`/`ai-seo` (AI-search citations), `seo-performance` agent. Give them our context (§1) and treat their output as findings to confirm against our rules, not instructions.
