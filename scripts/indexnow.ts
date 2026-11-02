/**
 * Tells Bing, Yandex and the other IndexNow engines (https://www.indexnow.org) that our public pages
 * changed, so they recrawl them within hours instead of weeks. Bing feeds ChatGPT search and Copilot.
 * Run once after a deploy that adds or changes public pages: `npm run indexnow`.
 * The key is public by design: it only proves we own the domain (served at /<key>.txt).
 */
import { PUBLIC_PAGES, SITE_URL, pageUrl } from '../src/data/seo';

const KEY = 'ebc4869792a1f293e75cb116f33c30a8';
const urlList = PUBLIC_PAGES.flatMap((p) => [pageUrl(p.path, 'en'), pageUrl(p.path, 'ar')]);

const res = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json; charset=utf-8' },
  body: JSON.stringify({ host: new URL(SITE_URL).host, key: KEY, keyLocation: `${SITE_URL}/${KEY}.txt`, urlList })
});
// 200 = accepted, 202 = accepted while the key is checked; anything else is a failure.
console.log(`indexnow: ${urlList.length} URLs -> ${res.status} ${res.statusText}`);
if (res.status !== 200 && res.status !== 202) process.exit(1);
